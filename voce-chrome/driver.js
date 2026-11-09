/* La Voce sopra claude.ai: questo pezzo guida la chat vera del progetto Secretary.
   Niente API, niente chiavi: quello che Ema dice viene scritto nella casella della chat e inviato; la risposta
   si legge dalla pagina mentre arriva, si pulisce dai segni di tono e si manda alla Voce (voce_logica.js), che la
   legge ad alta voce e colora la scena. Il tasto "Chat normale" nasconde la Voce: sotto c'è la chat di sempre, con
   la stessa conversazione.

   Dipende da come è fatta la pagina di claude.ai (data-testid): se Anthropic la cambia, si aggiorna qui.
   Usato dall'estensione Chrome (content.js) e, domani, dall'app Android (stessa pagina, stesso script). */
(() => {
"use strict";
const SEL = {
  input: '[data-testid="chat-input"]',
  send: '[data-testid="chat-input-send"]',
  righe: '[data-is-streaming]',
  testo: '.standard-markdown',
};
const PREFISSO = "[voce] ";
const SEGNO = /\[([!?~+\-])\]/g;
const TONI = { "!": "forte", "?": "domanda", "~": "calmo", "+": "bene", "-": "male" };
const attesa = (ms) => new Promise((r) => setTimeout(r, ms));

// Dal testo con i segni di tono al pacchetto per la Voce (stessa logica di voce.py, in JS).
function segmenta(grezzo) {
  grezzo = (grezzo || "").trim();
  if (/^\[silenzio(?::\s*finch[eé]\s*chiamato)?\]\.?$/i.test(grezzo)) return { silenzio: /finch/i.test(grezzo) ? "finche_chiamato" : "turno" };
  const pezzi = []; let tono = "neutro", pos = 0, m;
  while ((m = SEGNO.exec(grezzo))) { pezzi.push([tono, grezzo.slice(pos, m.index)]); tono = TONI[m[1]]; pos = m.index + m[0].length; }
  pezzi.push([tono, grezzo.slice(pos)]);
  const segmenti = [];
  for (const [t0, blocco] of pezzi) {
    const frasi = blocco.match(/[^.!?…\n]+[.!?…]*\s*/g) || [];
    frasi.forEach((frase, n) => {
      if (!frase.trim()) return;
      const t = n ? "neutro" : t0;
      const pulita = []; const enfasi = []; let i = 0;
      for (const parte of frase.split(/(\*[^*\n]{1,80}\*)/)) {
        if (parte.length >= 3 && parte.startsWith("*") && parte.endsWith("*")) { const w = parte.slice(1, -1); enfasi.push([i, i + w.length]); pulita.push(w); i += w.length; }
        else { const q = parte.replace(/\*/g, ""); pulita.push(q); i += q.length; }
      }
      const tutto = pulita.join(""); const testo = tutto.trim(); const salto = tutto.length - tutto.trimStart().length;
      if (testo) segmenti.push({ testo, tono: t, enfasi: enfasi.map(([a, b]) => [a - salto, b - salto]).filter(([, b]) => b > 0) });
    });
  }
  return { testo: segmenti.map((x) => x.testo).join(" "), segmenti };
}

function righe() { return [...document.querySelectorAll(SEL.righe)]; }
function testoRiga(r) { const t = r.querySelector(SEL.testo); return (t ? t.innerText : "").trim(); }

async function scrivi(testo) {
  const box = document.querySelector(SEL.input);
  if (!box) throw new Error("Non trovo la casella della chat: apri una chat del progetto Secretary.");
  box.focus();
  document.execCommand("selectAll", false, null); document.execCommand("delete", false, null);
  if (!document.execCommand("insertText", false, testo)) {
    box.dispatchEvent(new InputEvent("beforeinput", { inputType: "insertText", data: testo, bubbles: true, cancelable: true }));
  }
  for (let i = 0; i < 40; i++) {
    const b = document.querySelector(SEL.send);
    if (b && !b.disabled) { b.click(); return; }
    await attesa(50);
  }
  throw new Error("Il tasto Invia non si è acceso.");
}

/* Manda la frase di Ema alla chat vera e aspetta la risposta intera. Ritorna {testo, segmenti} | {silenzio} | {errore}. */
async function parla(testo, storia, signal) {
  const prima = righe().length;
  try { await scrivi(PREFISSO + testo); } catch (err) { return { errore: err.message }; }
  const t0 = performance.now();
  let riga = null;
  // 1. aspetta la riga nuova di Claude (dopo quella di Ema)
  while (performance.now() - t0 < 30000) {
    if (signal && signal.aborted) return { errore: "annullato" };
    const rs = righe();
    if (rs.length >= prima + 2) { riga = rs[rs.length - 1]; break; }
    if (rs.length === prima + 1 && rs[rs.length - 1].getAttribute("data-is-streaming") === "true") { riga = rs[rs.length - 1]; break; }
    await attesa(120);
  }
  if (!riga) return { errore: "Claude non ha iniziato a rispondere." };
  // 2. aspetta che finisca di scrivere (e un attimo in più: l'ultimo pezzo arriva dopo il flag)
  let fermo = 0, ultimo = "";
  while (performance.now() - t0 < 240000) {
    if (signal && signal.aborted) return { errore: "annullato" };
    const streaming = riga.getAttribute("data-is-streaming") === "true";
    const t = testoRiga(riga);
    if (!streaming && t && t === ultimo) { fermo += 1; if (fermo >= 3) break; } else fermo = 0;
    ultimo = t;
    await attesa(150);
  }
  const grezzo = testoRiga(riga);
  if (!grezzo) return { errore: "Risposta vuota (forse solo uno strumento, senza testo)." };
  return segmenta(grezzo);
}

// Un pulsantino sempre presente sulla pagina per richiamare la Voce quando è nascosta.
function bottoneRichiamo() {
  if (document.getElementById("voce-richiamo")) return;
  const b = document.createElement("button");
  b.id = "voce-richiamo"; b.type = "button"; b.title = "Apri la Voce del Segretario"; b.textContent = "VOCE";
  b.addEventListener("click", () => { const r = document.getElementById("voce-root"); if (r) { if (r.hidden) window.Voce.mostra(); else window.Voce.nascondi(); } });
  document.body.appendChild(b);
}

function leggiPannelli(url) {
  return new Promise((ok) => {
    try {
      chrome.runtime.sendMessage({ tipo: "pannelli", url }, (r) => { if (chrome.runtime.lastError || !r || r.errore) ok(null); else ok(r.dati); });
    } catch (_) { ok(null); }
  });
}
window.VoceConfig = Object.assign({
  trasporto: parla, stt: "browser", lingua: navigator.language && navigator.language.startsWith("en") ? "en-GB" : "it-IT",
  pannelli: "https://hub.emazamboni.com/voce.json",
  leggiPannelli: (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) ? leggiPannelli : undefined,
}, window.VoceConfig || {});
window.VoceDriver = { parla, segmenta, scrivi, bottoneRichiamo };
})();
