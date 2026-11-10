/* La Voce sopra claude.ai: questo pezzo sa come è fatta la pagina di claude.ai e la guida.
   Niente API, niente chiavi: scrive nella casella della chat vera, legge la risposta mentre arriva, preme "Leggi ad
   alta voce" (la voce di Claude), accende e spegne la modalità vocale. La logica (voce_logica.js) non tocca mai la
   pagina: passa sempre da qui. Se claude.ai cambia, si aggiorna solo questo file.

   Com'è fatta la pagina (verificato il 10/11/2026):
   - ogni messaggio è un [role="article"] con aria-posinset (numero) e aria-setsize (totale). La lista è VIRTUALE:
     nella pagina ci sono solo gli ultimi ~20 messaggi, quindi non si contano mai le righe: si legge il totale;
   - i messaggi di Ema contengono [data-testid="user-message"], quelli di Claude un [data-is-streaming] con il
     testo dentro .standard-markdown;
   - la casella è [data-testid="chat-input"], il tasto [data-testid="chat-input-send"];
   - "Leggi ad alta voce" è [data-testid="action-bar-read-aloud"] sull'ultimo messaggio, data-state idle/playing/paused;
   - la modalità vocale non ha testid: si riconosce dai tasti ("Avvia la modalità vocale", "Disattiva microfono",
     "Interrompi") e dal segnaposto della casella ("In ascolto...", "Elaborazione..."). */
(() => {
"use strict";
const SEL = {
  input: '[data-testid="chat-input"]', send: '[data-testid="chat-input-send"]', art: '[role="article"]',
  riga: "[data-is-streaming]", testo: ".standard-markdown", utente: '[data-testid="user-message"]',
  leggi: '[data-testid="action-bar-read-aloud"]', annuncio: '[data-testid="response-status-announcer"]',
};
const RE = {
  avvia: /avvia la modalità vocale|start voice mode|use voice mode/i,
  micOn: /^attiva microfono|^unmute/i, micOff: /^disattiva microfono|^mute/i,
  stop: /^(interrompi|stop|termina|end)/i, risposta: /risposta|response/i,
  stopRisposta: /interrompi la risposta|stop response/i,
};
const attesa = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s, r) => (r || document).querySelector(s);
const qa = (s, r) => [...(r || document).querySelectorAll(s)];
function bottone(re, no) {
  return qa("button").find((b) => { const t = ((b.getAttribute("aria-label") || "") + " " + b.textContent).trim(); return re.test(t) && !(no && no.test(t)); }) || null;
}

// ------------------------------------------------------------------ i messaggi
function info(a, i) {
  if (!a) return null;
  const pos = parseInt(a.getAttribute("aria-posinset") || "0", 10) || (i + 1);
  const tot = parseInt(a.getAttribute("aria-setsize") || "0", 10) || 0;
  return { el: a, pos, tot, utente: !!q(SEL.utente, a), riga: q(SEL.riga, a) };
}
function tutti() { return qa(SEL.art).map(info); }
function totale() { const t = tutti(); const u = t[t.length - 1]; return u ? Math.max(u.tot, u.pos) : 0; }
function ultimoDi(utente) { const t = tutti(); for (let i = t.length - 1; i >= 0; i--) { if (utente ? t[i].utente : (t[i].riga && !t[i].utente)) return t[i]; } return null; }
const ultimoAssistente = () => ultimoDi(false);
const ultimoUtente = () => ultimoDi(true);
function scrive(x) { return !!(x && x.riga && x.riga.getAttribute("data-is-streaming") === "true"); }
function testoDi(x) {
  if (!x) return { testo: "", enfasi: [] };
  if (x.utente) { const u = q(SEL.utente, x.el); return { testo: (u ? u.innerText : "").trim(), enfasi: [] }; }
  const md = qa(SEL.testo, x.el);
  const enfasi = [];
  md.forEach((m) => qa("em,strong", m).forEach((e) => { const s = e.textContent.trim(); if (s && s.length < 80) enfasi.push(s); }));
  return { testo: md.map((m) => m.innerText).join("\n").trim(), enfasi };
}
function occupata() { return !!q('[data-is-streaming="true"]') || !!bottone(RE.stopRisposta); }
function fermaRisposta() { const b = bottone(RE.stopRisposta); if (b) b.click(); }

// ------------------------------------------------------------------ scrivere e inviare
async function invia(testo, signal) {
  const t0 = performance.now();
  while (occupata()) {
    if (signal && signal.aborted) throw new Error("annullato");
    if (performance.now() - t0 > 60000) throw new Error("La chat è ancora occupata con la risposta di prima.");
    await attesa(120);
  }
  const box = q(SEL.input);
  if (!box) throw new Error("Qui non c'è la casella dei messaggi: apri una chat di claude.ai.");
  box.focus();
  if (!(document.activeElement === box || box.contains(document.activeElement))) throw new Error("Non riesco a scrivere nella casella della chat.");
  document.execCommand("selectAll", false, null); document.execCommand("delete", false, null);
  document.execCommand("insertText", false, testo);
  for (let i = 0; ; i++) {
    const b = q(SEL.send);
    if (b && !b.disabled) { b.click(); break; }
    if (i >= 60) throw new Error("Il tasto Invia di claude.ai non si è acceso.");
    await attesa(50);
  }
  try { box.blur(); } catch (_) {}
}

/* Aspetta la risposta al messaggio appena inviato. `prima` = totale dei messaggi PRIMA dell'invio.
   onParziale({testo, enfasi}) viene chiamato ogni volta che il testo cresce. Ritorna {testo, enfasi} oppure {errore}. */
async function attendiRisposta(prima, onParziale, signal) {
  const t0 = performance.now();
  let x = null;
  while (!x) {
    if (signal && signal.aborted) return { errore: "annullato" };
    const u = ultimoAssistente();
    if (u && u.pos > prima) { x = u; break; }
    if (performance.now() - t0 > 90000) return { errore: "Claude non ha iniziato a rispondere." };
    await attesa(80);
  }
  let ultimo = "", enfasi = [], fermo = 0, vuoto = 0;
  while (performance.now() - t0 < 300000) {
    if (signal && signal.aborted) return { errore: "annullato" };
    const u = ultimoAssistente() || x;
    const st = scrive(u);
    const d = testoDi(u);
    if (d.testo && d.testo !== ultimo) { ultimo = d.testo; enfasi = d.enfasi; fermo = 0; if (onParziale) { try { onParziale(d); } catch (_) {} } }
    else if (!st && d.testo) fermo++;
    if (!st && d.testo && fermo >= 2) return { testo: ultimo, enfasi };
    if (!st && !d.testo) { if (++vuoto > 60) return { errore: "Claude ha risposto senza testo." }; } else vuoto = 0;
    await attesa(90);
  }
  return ultimo ? { testo: ultimo, enfasi } : { errore: "Tempo scaduto." };
}

// ------------------------------------------------------------------ "Leggi ad alta voce" (la voce di Claude)
function bottoneLeggi() { const u = ultimoAssistente(); return (u && q(SEL.leggi, u.el)) || qa(SEL.leggi).pop() || null; }
async function leggi() {
  for (let i = 0; i < 40; i++) {
    const b = bottoneLeggi();
    if (b) { if (b.getAttribute("data-state") !== "playing") b.click(); return true; }
    await attesa(80);
  }
  return false;
}
function leggiStato() { const b = bottoneLeggi(); return b ? (b.getAttribute("data-state") || "idle") : "assente"; }
function leggiFerma() { const b = bottoneLeggi(); if (b && b.getAttribute("data-state") === "playing") b.click(); }

// ------------------------------------------------------------------ la modalità vocale di claude.ai
function segnaposto() { const box = q(SEL.input); if (!box) return ""; const p = box.getAttribute("data-placeholder") || (q("[data-placeholder]", box) || { getAttribute: () => "" }).getAttribute("data-placeholder"); return p || ""; }
const vocale = {
  attivo() { return !!(bottone(RE.micOn) || bottone(RE.micOff)); },
  disponibile() { return !!bottone(RE.avvia) || this.attivo(); },
  giro: 0,
  avvia() { this.giro++; if (this.attivo()) return true; const b = bottone(RE.avvia); if (!b) return false; b.click(); return true; },
  /* Chiude la modalità vocale e INSISTE finché è chiusa davvero: nel primo secondo dopo l'avvio claude.ai non ha
     ancora il tasto "Interrompi" (o non lo ascolta), e un clic solo lascerebbe il microfono di Claude acceso. */
  ferma() {
    const io = ++this.giro, t0 = performance.now(); let visto = false;
    const giro = () => {
      if (io !== this.giro) return;                       // nel frattempo è stata riavviata: non toccarla
      const dt = performance.now() - t0;
      if (this.attivo()) { visto = true; const b = bottone(RE.stop, RE.risposta); if (b) b.click(); }
      else if (visto || dt > 3000) return;                // chiusa (o mai partita)
      if (dt < 12000) setTimeout(giro, 300);
    };
    giro();
  },
  microfono(on) { const b = bottone(on ? RE.micOn : RE.micOff); if (b) b.click(); },
  micAcceso() { return !!bottone(RE.micOff); },
  ascolta() { return /in ascolto|listening/i.test(segnaposto()); },
  elabora() { return /elaborazione|processing|thinking/i.test(segnaposto()); },
};

// ------------------------------------------------------------------ pannelli (dati dell'hub, via service worker)
function leggiPannelli(url) {
  return new Promise((ok) => {
    try { chrome.runtime.sendMessage({ tipo: "pannelli", url }, (r) => { if (chrome.runtime.lastError || !r || r.errore) ok(null); else ok(r.dati); }); }
    catch (_) { ok(null); }
  });
}

// ------------------------------------------------------------------ il tasto VOCE sulla pagina
function bottoneRichiamo() {
  if (document.getElementById("voce-richiamo")) return;
  const b = document.createElement("button");
  b.id = "voce-richiamo"; b.type = "button"; b.title = "Apri la Voce del Segretario"; b.textContent = "VOCE";
  b.addEventListener("click", () => {
    if (b.dataset.vecchia) { location.reload(); return; }
    const r = document.getElementById("voce-root"); if (!r || !window.Voce) return;
    if (r.hidden) window.Voce.mostra(); else window.Voce.nascondi();
  });
  document.body.appendChild(b);
}
// Ogni 5 s un colpetto al service worker: lo tiene sveglio per accorgersi di una versione nuova. Se l'estensione è
// stata ricaricata, questa pagina ha ancora la versione vecchia: il tasto lo dice e un clic ricarica la pagina.
function vecchia() { const b = document.getElementById("voce-richiamo"); if (b && !b.dataset.vecchia) { b.dataset.vecchia = "1"; b.textContent = "↻ AGGIORNA"; b.title = "C'è una versione nuova della Voce: clic per ricaricare la pagina"; } }
try {
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
    setInterval(() => {
      try { if (!chrome.runtime.id) { vecchia(); return; } chrome.runtime.sendMessage({ tipo: "ping" }, () => void chrome.runtime.lastError); }
      catch (_) { vecchia(); }
    }, 5000);
  }
} catch (_) {}

window.VoceConfig = Object.assign({
  pannelli: "https://hub.emazamboni.com/voce.json",
  leggiPannelli: (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) ? leggiPannelli : undefined,
}, window.VoceConfig || {});
window.VoceDriver = {
  totale, ultimoAssistente, ultimoUtente, testoDi, scrive, occupata, fermaRisposta,
  invia, attendiRisposta, leggi, leggiStato, leggiFerma, vocale, bottoneRichiamo,
};
})();
