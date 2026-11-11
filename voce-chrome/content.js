/* Generato da voce-chrome/build.py: non modificare a mano. Fonte: voce.html, voce_scena.js, voce_logica.js, driver.js */
window.VOCE_VERSIONE = "v1.0.12";
(() => {
  if (document.getElementById("voce-root")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = "<div id=\"voce-root\" data-fase=\"riposo\" data-modo=\"voce\" data-look=\"verde\" data-host=\"claude\">\n<canvas id=\"scena\" aria-hidden=\"true\"></canvas>\n<i class=\"ang a\"></i><i class=\"ang b\"></i><i class=\"ang c\"></i><i class=\"ang d\"></i>\n<div class=\"hud\">\n  <header class=\"top\">\n    <div class=\"brand\"><b>SEGRETARI<i>O</i></b><span class=\"cap\" id=\"sotto\">voce \u00b7 canale privato</span></div>\n    <div class=\"clock\"><b id=\"ora\">--:--</b><span class=\"cap\" id=\"data\"></span></div>\n  </header>\n  <section class=\"mid\">\n    <div class=\"pan l\">\n      <div class=\"blk\" id=\"b-cal\"><h3>Calendario</h3><ul><li class=\"nl\">\u2026</li></ul></div>\n      <div class=\"blk\" id=\"b-oggi\"><h3>Oggi</h3><ul><li class=\"nl\">\u2026</li></ul></div>\n      <div class=\"blk\" id=\"b-tempo\"><h3>Se hai tempo</h3><ul></ul></div>\n    </div>\n    <div class=\"centro\"><div id=\"righe\" aria-live=\"polite\"></div></div>\n    <div class=\"pan r\">\n      <div class=\"blk\" id=\"b-att\"><h3>Claude aspetta te</h3><ul><li class=\"nl\">\u2026</li></ul></div>\n      <div class=\"blk\" id=\"b-lav\"><h3>Al lavoro</h3><ul></ul></div>\n      <div class=\"blk\" id=\"b-mail\"><h3>Email da leggere</h3><ul></ul></div>\n    </div>\n  </section>\n  <footer class=\"bot\">\n    <div class=\"modi\" role=\"group\" aria-label=\"Modo\">\n      <button type=\"button\" data-m=\"testo\" aria-pressed=\"false\">Voce \u2192 testo</button>\n      <button type=\"button\" data-m=\"voce\" aria-pressed=\"true\">Voce \u2192 voce</button>\n      <button type=\"button\" data-m=\"live\" aria-pressed=\"false\" title=\"Conversazione con la voce di Claude\">Live</button>\n      <button type=\"button\" class=\"chatnorm\" id=\"chatnorm\" title=\"Nascondi la Voce e usa la chat normale\">Chat normale</button>\n      <button type=\"button\" id=\"lingua\" title=\"Lingua in cui parli al microfono\">MIC IT</button>\n      <button type=\"button\" id=\"hal\" title=\"Voce HAL (sul PC): accesa usa la scheda video, spenta parla la voce di Claude\" aria-pressed=\"false\">HAL</button>\n    </div>\n    <div class=\"cmd\">\n      <div class=\"tasto\">\n        <div class=\"barre sx\" aria-hidden=\"true\"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>\n        <button id=\"parla\" type=\"button\" aria-label=\"Parla\" aria-pressed=\"false\">\n          <svg class=\"i-mic\" viewBox=\"0 0 24 24\"><path d=\"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z\"/><path d=\"M19 10v2a7 7 0 0 1-14 0v-2\"/><line x1=\"12\" x2=\"12\" y1=\"19\" y2=\"22\"/></svg>\n          <svg class=\"i-stop\" viewBox=\"0 0 24 24\"><rect x=\"6.5\" y=\"6.5\" width=\"11\" height=\"11\" rx=\"1.5\"/></svg>\n          <svg class=\"i-off\" viewBox=\"0 0 24 24\"><line x1=\"3\" x2=\"21\" y1=\"3\" y2=\"21\"/><path d=\"M9 9v3a3 3 0 0 0 5.1 2.1M15 9.3V5a3 3 0 0 0-5.7-1.3\"/><path d=\"M19 10v2a7 7 0 0 1-.6 2.8M5 10v2a7 7 0 0 0 11 5.7\"/><line x1=\"12\" x2=\"12\" y1=\"19\" y2=\"22\"/></svg>\n        </button>\n        <div class=\"barre dd\" aria-hidden=\"true\"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>\n      </div>\n      <div class=\"l\" aria-live=\"polite\"><div class=\"nastro\"><span data-k=\"riposo\"></span><span data-k=\"ascolto\" class=\"rec\"></span><span data-k=\"penso\"></span><span data-k=\"parlo\"></span><span data-k=\"spento\"></span></div></div>\n    </div>\n    <div class=\"dx\">\n      <input id=\"scrivi\" type=\"text\" placeholder=\"oppure scrivi e premi Invio\" autocomplete=\"off\" spellcheck=\"false\">\n      <div class=\"gpu\" id=\"gpu\" hidden title=\"Quanto \u00e8 occupata la scheda video del PC: se \u00e8 rossa, un altro programma la sta usando e HAL va a rilento\"><span>GPU</span><b id=\"gpu-n\">--%</b><i class=\"gb\"><u></u></i><span id=\"gpu-m\"></span></div>\n      <div class=\"sys\" id=\"sys\"></div>\n      <button id=\"zitto\" type=\"button\" title=\"Zitto finch\u00e9 non ti chiamo per nome\">Silenzio</button>\n    </div>\n  </footer>\n</div>\n</div>";
  const root = wrap.firstElementChild;
  root.hidden = true;  // parte nascosta: la chat è quella di sempre finché Ema non preme VOCE
  document.body.appendChild(root);
})();
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

function halComando(cmd) {
  return new Promise((ok) => {
    try { chrome.runtime.sendMessage({ tipo: "hal", cmd }, (r) => { if (chrome.runtime.lastError) ok({ ok: false, errore: chrome.runtime.lastError.message }); else ok(r || { ok: false, errore: "nessuna risposta" }); }); }
    catch (err) { ok({ ok: false, errore: String(err && err.message || err) }); }
  });
}
const conEstensione = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage;
window.VoceConfig = Object.assign({
  halAvvia: conEstensione ? () => halComando("avvia") : undefined,     // HAL ON: avvia il programma della voce sul PC
  halFerma: conEstensione ? () => halComando("ferma") : undefined,     // HAL OFF: lo spegne del tutto
  pannelli: "https://hub.emazamboni.com/voce.json",
  leggiPannelli: (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) ? leggiPannelli : undefined,
}, window.VoceConfig || {});
window.VoceDriver = {
  totale, ultimoAssistente, ultimoUtente, testoDi, scrive, occupata, fermaRisposta,
  invia, attendiRisposta, leggi, leggiStato, leggiFerma, vocale, bottoneRichiamo,
};
})();

/* La testa del Segretario: scansione di un volto reale, "Lee Perry-Smith" di Infinite Realities (ir-ltd.net), licenza CC BY 3.0,
   presa dagli esempi di three.js e ridotta a posizioni a 16 bit + triangoli. Generato da voce-pc/testa/esporta.py. */
window.VoceMesh = {"q": 20000.0, "n": 9279, "t": 17684, "naso": [-0.0221, 0.2763, 0.6521], "mento": [0.4216, -0.9135, 0.2248], "cima": [-0.0168, 1.0, -0.0225], "fonte": "Lee Perry-Smith head scan, Infinite Realities (ir-ltd.net), CC BY 3.0, via three.js examples"};
window.VoceMesh.pos = "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8uxfIaQcCe0mIvcbJ+0VIcsbXO0aIKkbJu1mIJIcBu3DIFIdT+3iJSEede2lJW4dKu7cJokeTu61JsMdqe1sJZwchO6BJt0c2/WJJJQatvY/I18ahfYTJZkbf/eUI2YbIffSIT0a9vfuIUQb6vfWI6YcZ/gMIo0c3fZ8Jc8cLvNNIyoZW/RyIgoZ1vTyI8YZmPXeIpQZsvSMIfAY+/WwIXQZAfddIC0azvV2IGIZfPSWINwYUPVPH2UZgPOEH8AYfvYFHzYa3vdIIDUbTvfEHj0bWfhLIIIcxvezHoscxvXpHVcaX/aDHVob1vQYHXcaJvWWHHMbvfZeHagcWvVkHL4c/fOgHgsZ7fRfHosZ//MfHkEZZ/SzHbIZNPI6Hv4YnPLwHSEZ3vLGHscYPvNsHu8Y8PKxHU4Zd/PwHTkZmfNNHb8ZvfIkHboZrfOaHIEahPJvHHEaw/PUG7kcufMLHHQbVfLhG1obNvKwG5UckPGSHEoaLfENHCgbz/DqHBgaQ/BzHO8a6PDmG1Yc4O9YHBAcDPJEHZsZe/GRHXIZyvGGHuUY+PD0HU0ZdPHfHtEYhPBqHjIZLvBfHeoZpe/uHcsZi+/5HL0a9e6cHZsaF+/qHNMbfe6YHacbWvNQJhUbt/SaJdkacfMJJw8cHfVHJtkbTPXLJgMdb/OZJywdc/BKJjIb2vGLJjQbGvDqJhkcs/E+JyUcifHCJzId1u9bJxUdou61JOEaXO+aJRIbCe4ZJb0b2+4eJvIbhO6BJt0cGO4mH58a0e0BILsa2e5NH8oZo+4VIOEZnu3wIOQadu7vIAYa5e+NHykZ1O9AIDUZDPG7H8UYJPFSIMgYxO8MIVQZufE8IcoYH/K7H58YDPIpIKAYvfJtIKIYMO+UHsEZIfDxHicZJ/FCH8cYee5YHpMa9PFlH6QYVfIvH6kYb/NoIbcYh/PIIKwYlfI+ItUYdPMLIs0YdPDAIkAZz/AUIg4Zp/HrIgkZv/FsIuoYeu/kIYcZOO+5IrwZQu7cIToaIu7TInQaeO31IRgbbu0DI1EbPO7HI60aNO+JI/AZWfBhI2sZfu9TJCQakPAAJJkZlu0PJIgb6PClJM8ZCfATJVUaPfEiJQUa3PCiJXcawPG/I0sZTvFRIy4ZCfIXJesZ+vHMJXQa0vIKJecZIPOSJVQaHfNuJJoZ/fFoJI4ZDvTpJBEaafLhHroY/u4TIAQkDO82IOIjNe7uH3sjQu4YIGQjC+8yIKQjQO4hIDYjx+0dIPQixe0xINEiue3wHwYjKPS+IGckJfTUIJckSvUiIQokSPUpITkkE/SrIMskOPUBIXAkPfZhIeQjLPY9ISEkPvZnIbcjS/fUIWUjQ/fWIWUj//afIWIjFPemIWMjP/fQIWQjKveqIVIj0vZ+ISgj/PaTISEjWPZSIUojUPf4IYcjZPfsIW0jXvffIZwjdffXIYkjVPfEIXwjh/e8IbkjaPesIZsjd/e6IcYj3fMaIBgl+vNvIPskmvLWHywlsvIoIBkly/JiIPAkUvEHIPAkavFBINIkPPG2H/sk8vRvIOMkGvXDILIkzvW5IJwkBvYEIWUkHPELH8AkcvIuHwAlKfFlH+EkgvKFHx8lqvNvHwolvfPGHx0lrfTHH/Akx/QYIPwkifU1ILoknPVwIL4kSvaSIIQkJ/akII0k5vbhIFgkdfbfIG4kyvO/HsMkr/MYH+MkivJtHqEkdfLPHs8kIPGjHo0kMvE2HlckMu0gIO8hG+3tH/4hP+0cICgiK+3kHzAiAu3SHwQiEO29HyYiO+3ZH28iI+2nH18iVO0OIGYiCu2IHzwi8uyrHwci6+zLH+chyeyjH8shuOzQH6ch6exyHwAide0BILAiou23HwsjXu3JH7QiRu2UH6UijO2AH/0i3e6UH/kj7O7bHw8kDu52H2wjIe61H4AjG/AzIHokCPD+H4ok9++3H38k4+9mH2ckyO5FH9kj0O8IH0kks+7yHrAj7O3yHhsj++00H0sjfe1JH9kibO0WH6YiG+1CH0oiMu1oH4EiYexAHzohtexfH6shDeyaH/EgfeyfH3IhWuzZH0khx+v6H8QgNO2dHh4iVe3iHmcix+zvHp0h9+weH/8hue44Hj4jsO6ZHngj1u1eHqgi4e2vHuMi4u8tHtkj0e+dHhMk2vJkIIwk3/J8IL4ke/FDIGskf/FXIKEkKvA9IBIkLvBQIEQkHO+GH7wi/u7lH1UjQPBQHycjFvDRH8ojZfG7Hy0km/EsH5QjJfRaICgk0PLrH0kkTfQHILwjBvN4H8cjPfZaIZAjSPXsINUjXPW6IIEj/vH5HqwiWvNDHwEjifTUHxwjmPMUHz8is/SuH2oiSfK6Htkhy+8AH+kge+9IH8wh8vC+HlkhqPANHzYi5u5tH5UkQfBgHzglpu7ZH/kk/e/VH6clLfKIH5cl4/ECIAom3O/UIAgmwvEFIXEmje7BIDYlD+1fII4jPe3sH3ojme2aIHIkx+3tHzAkge23H00jCO6TH+0j6u1UIKMile12IDoi5+2FIRsih+1xIcMhYO2lINohXe1aIVwhZO25IikhRO1TIsQgyO0XI4EhOu0CInMgJu1WIyogHu3GIuEfN+3GIVMgHu1WIrofBu1fI08fDe3KIh8fDe0MJJQfH+1SIhAfLe3tIb0fQO13IWAgO+14Id4fQu0aIY8gQO3ZIR4fae1PIU8fXO3/ICIgTe3AIOAgg+2AIHsgau1uIEYhoO25IJUfZ+03IE4iiu0qIJ4ihO1BIHgiZ+1WIB8iTO1TIMghW+1HIAciX+15IMshWe2eIIch2O3VHw0ivO0LIJMiVO6oH2AiNe7uH+8i6e0rIO0fvu0VIN8gje0VIK8hG+7AHzMhV+63Hz4g8e5ZH5Agqe6IH3ohXe1iIM4hee0xIDUiS+3cICEhSu2kIHAhTe1DIdcgTu0cIfEgQu3RIEAhTu3EIFghSO3HIIAhSu1NIQEh9uzzH9QhFe0gIMUhuOz5H50h4OwjIKchTOwPIDohXuwuIGghg+tfIL4gheu7IBQhO+1pIKMhI+1uIJwhP+w9ILohlOwYIM8h5ewhIOchv+z7H0wi/uwAIEkieuweIEYiu+wuIN0i8+zuH9kiL+3aH8MiIu1dINEhPO0zICYibu3/H48iw+3MHwMje+4+IA8jUO6rH4gjYO8/IHojNO+iHw8k2fBXIAAklvCrH6Akx/J8IGUkf/LRHwElzvYuIlwjG/cKInwjyPbeIYYjJPfcIZYjK/e1Ib8jzvaXIcUjR/fsIW4jS/f0IWkjQPcBInwjP/cMInIjFvcQIkIjG/fsIUUjOPcSIl4jPvfrIVwjGffVIUwjNvfQIVMj6vaoIj4jGfdAInEj2/Z2IkEjFPcrInMjBvd2IkQjJPdCIlcj/PZkIj8jCvc8Ij4jGffBIT8j//bUIUEj7/a1ISUj1fbPITUjyfaKId0ivPaoIQIjoPbIIR0jofa7Icsik/bYIfUizPaLIXAivPb1ITsj7fbtIUMj4vYVIkMjtPYmIjkj3vZFIjoj5PZzIi4juvZbIi8jxfaMIhkjVvMIIxAj2PTnIkMjCvOYIcYjsvSqId4j3PWnIkIjvfW1IaEjhfTBIGIkmPUxIRwk3+8OI1Min/EMI74iku9pIeoiMfF6IWUjkO6AIX0imO4uI90hxO2HJMkgT+39I30gOO3LJOgftu1vJTggNPCSJJkhw+6yJCUhuu7EJaUgL/DUJSUhd/OMJeQhffNkJGEi2vHEJZQh4fGBJAkiMvYfJFgi+fWPI9si8fT/JBYi9PQRJLEipfZCI98ihfbzIgUjavZiIj0jVfbNIX4jTvZsIdUj5fZyIRIkS/eNIf8jkPeWIQQkdfeKITwkuPeUITkkDfdrIVEkWfY1IUIkdPYgIY0kf/X7IKMkj/W6IAElVfREIPEkMvQRIHQlnPX8IFElE/R4IN8llPWqIXgl/vNeIRwm9vZbIf4jxvYhITokT/cnISokkvdkIQYkefeRIdMjA/eAIcEj+/aXIZYjyPeKISUknveZIfAjq+xhJLge2uxZJCUfqOyNI3Ue0+yWI98eDe0MJJQfBu1fI08f5ez2IqseDe3KIh8fv+zfIksegu25IHkenu3UIOoe2u0WIMUe9+02IDYfoO25IJUf6e0rIO0fbe6oH4kfV+63Hz4gTe57Hx8f6O7xHocfB+8sH+gf8e5ZH5Ag4O/DHlAgy+8AH+kgwu96HvUf7fAmHmwgBvF5Hskg8vC+HlkhYfJ0HkQhSfK6HtkhVvIYHtkgmPMUHz8itvPWHp0hs/SuH2oi1vR0H8khw/NtHhwh/vQGHzMh2exeIjYeAu13IpIeH+1SIhAfKO39IZMeQO3ZIR4fBe3lITIeOe1XIUgeWu1wIbEeae1PIU8fzPaLIXAi2vbdIVIiGvdbIcQhJfe9IcYh2PYzIkYiIfcpIskhf/eNISchfPcYIjMhcvcRISUhMvYfJFgi8fT/JBYi//XtJLgh3PTSJbMhd/OMJeQhSPN5Jpsh3fRtJk4hHPMzJ0EhIvZPJTEh2vHEJZQhjvHIJlMhL/DUJSUh3e/DJuAgP/GEJ/UgjO9YJ3QgMe7dJugfcu56JlUguu7EJaUgfe3xJdcftu1vJTggS+0kJmcf1uxIJQkfA+0xJXkfOO3LJOgfpOzTI5UdfuwpJEMeouzMImwdhuw8Iwweq+yAIvYdwezGIWsdUe34H2cdWO1qIBAeru0+H5sdsu3AH1MeKe4dH6geJ+6QHuIdy+7wHTYey+6IHgofqu8FHnIfq+9jHZIe0vD5HPQe1/ClHeEfRvKEHUMgPfLKHE0fzfO/HX4gMvVPHocg0/PwHIwfY/V1HZwfq+yAIvYd4uwVIgIe2+y4IegdwezGIWsdBu3DIFIdDe0UIesdvveQII0g3vc6IXog3vcCIpggMvjYIH8fIvhnIsoft/eYH7Mfc/aOJXEgA/XXJo4gH/O4J5IgMfUNJ3MfP/PuJ3ofvfaxJVwfIvH8J00gZu+kJ9cfOvEZKEwffO+lJ/YeKu7cJokeD+77JlMfKu0eJtoeT+3iJSEe1+zcJNIdsewlJYce1fZ8Ij4iGPeAIsoh1va0IjUiFPe+Isghb/d8Ij4have3IkAh3vcCIpggt/deIsggyveVIrQgIvhnIsof6fbdIvwi7vaZIiAjx/b5Isoi1PazIvIirvZrI5cixPY3I84iwPYrI0kiufYTI5QilPa9IzIipfZmI2wiQPdrIzkhX/f2IkQh7/ZnI8YhDPf8Isgh0/bmIjQiwPYrI0ki5PY/JC0ho/YXJL0hlPa9IzIirPcvI5cgoPfHIssgUPc5JHEgtfcZJGMfIvhnIsofh/YKIugijvYCIiIjhvZAIhwjgvZIItwimPZ0IgYjp/akIuoijfZ+IswioPaoIrMitvbNIsIisPbUIo4i2PYzIkYinPZAIpsi1fZ8Ij4ip/Z+IpIirvasIoAi1va0IjUi2vbdIVIin/b6Iasi0/bmIjQit/bMInIi9faZIXgjMfYYIeAic/WRIAEjRPbcIGEil/VXIG8io/ZeIdEirfY1IVwizfZJIC4hePagIMghPve5ICsh6PYEIcIhRPbcIGEirfY1IVwiBfauHzUhxfUWINMhl/VXIG8iffdcILYgOvfWH5cgOvfWH5cgYPYMH4cgt/eYH7MfufZRHpMf7felIVYkpvevIWUkLfjIIU4k7vf/IWQkOPeeIZMkLfdeIqQkl/ZeIdwkkPbnIf0k3/djISUk+vePIUAkEvhmIS0kNvieIUAktPR5H9Yk1fQvH7gklvX+H6oku/XCH5gkbfZ2IHoklvZNIHIkJffZIFMkUvfBIFckm/cmITIkyPcbITAkU/HNHR4ksfIYHl0kfvFkHfYj4fKtHUUk9fNtHokkLvQMHmwk8+o6ICQgWuudH10gHuo2IH8fmOpxH80f3+sRH7ggQOvEHkMgdOylHjchCuw5HuIgH+1SHsAh5OzUHYQh4O0OHloi2O2SHSoi1e7hHfsi8u5mHcwi/e/CHaYjLfBSHW4jP+qeIUkgi+rjICMgT+kUIpkfrekOIW4fi/j2IS8kQPhgIiokEvkuIg4kwPjUIiAkwvceI4AkO/i6I5okX/hZISskkfiqITQk0vg4IS4kDPmsISokCfXhHoskS/WIHmsk9fV+H38kRfYpH1gk1PYUIHAkLvfDH1EkjfeTIFgk7fdNIEwkCPj7ICskc/jFIDokSvH4JXwm2/ANJ0UnVe/eJUQmkO4MJxMnxPCaKHUoAe7oKDknwuzBJh4m9Ot6KBEmv+10Ja4lfOzYJKEkZOsfJtQkY+qfJ6gkh+pDJXwjdemkJiAjsusJJH8jVutYIuAhRupaI3UhMuuYITohIOp5IrMg0+iNJN8g8uhHIxcge+syI6kiZepbJGci9+ieJeIhmfXaJLglu/WHJfYlovOgJUYmffOKJr0mDfYWJmomw/MIJ7knqvbQIw0lD/dWJCcldvfhJG0lk/V0In0l9fOBIjcmiPVSI5Al7/OeI0Ymz/FhIq4m2PGsI68mdfblIhAlYvZaIh0l2+8sIlMm5++EI1omd+7uIWIlbe4lI24leO2TIX4kY+2jInIk1+weIZ0jtewLIokjguyrINsiR+xjIdoiQ+xuIEIiCOzmIEEi3+u0ILMhIOxnINAhg/UgJJYlXvaVIy4lrvHTJHgm0POiJDEmPO5IJIElxu+wJCgmbOwCI4AjG+21I4EkCOxHIsAi0OuPISIinusfIbchdvlt/GsRtvkQ++0WEfxM/GoRGPwf+/cWXfqU+mocavzB+mYcvv4++xAXuf4A+2Uc8P5G/IQRrPW5/HkRFvZE+7AWYvep/HYRyfct+9oW+PbA+iocn/id+lkcePIw/EQRovIu+xoWDPR4/GgRWvQx+28Wb/M8+3wbNPXp+uEbwO8R/boQwO+0/FgV/vA//AsRDPGP+74VmvA+/ZUa2vHn+wsb5u7j/lEQ8O7S/uQUau6eAdcPhu7QAYIUxu94/ysaS+93AuwZz+29CFwPJe4KCaIUFu4VBWkPSe5pBV4UMe81CSoaI+/nBeoZY/Aj/kANpu+P/+IMVPEr/1cLaPFdAJoKMO/lAWgMlPFqAhQKc/FuBaAJ0O4OBeYL9PDNCGEJb+6ECJ8Ld/ByA1ke1vC8AJcey/FsBDohCfJFAmchmvGf/vYepPJ9ALUhzfI5/WsfuPM6/xwiW/Rh/OMfMPVo/pMiyvIs/+YKlPGj/WcNCPOV/YYNl/QJ/8oK3/Xl/a4NdfTA/aINX/aL/psLwPXO/gcLl/QJ/8oKwPXO/gcL3vd1ACIJZfii/4sJX/aL/psL8fe0/uUKtvsdAAkJSfqz/nsKev9ZAlsIlPFqAhQKaPFdAJoKrPblAsUIp/SsAHsJVPEr/1cLyvIs/+YKIPbh+1Ag5/bq/REj4veb+6Ego/im/XwjM/YCARMksPe1AJYkLfdKAzMlYfgyA7MlPPmTABElqfk7AzQmC/R8Ak8j8fSUAaUjYvUgBG8kJPaSA8UkOfqH/b4jrPqCAGsl7fpLA5omCvx1AKMlLfxMA94muPt//dsjc/07AwUnav1nAMElx/4wAwkn1v5jAL4lQP2J/eIj3P6b/dojHvt++9sg4/yn+9Ug0v7a+8gggfl7+8wgSfqz/nsK8fe0/uUKofmY/TYNhPfS/XUNVf/c/kAKvvyw/ksKJ/9//RcNRPx5/RENvvyw/ksKZv3i/wsJVf/c/kAKb/9bANwIf/r3EZgTyPrvEZkOsPwREqoT6fwTEqEOm/s0EU4LYv1hEVELWP8lErQOff9sEVkLLf8XEsMTm/s0EU4LDf3xD38JYv1hEVELA/5hELgJk//LDZYIl/8bEIEJff9sEVkLoP7zC5MllP7qCrAmBP3wC48lL/3qCqwmiP4BCoInSv0HCoEn3PvhCpgmG/wKCm8nh/vlC3QluP5nDboj0PxrDbMjIftoDYYjqfyIDx8gv/qED/Yf3P56DzEgBf8tETcaoPw2ER4aiPorEQIaRfXWCK4k6PRPCHAkIPSrCcgjtfP/CG0jt/SZB0IkdfP9ByYjOPIoCsUh7/GyCFshsfIJC1QigvZuCWEl0PUyCf8kkfVOCpckwfQSCiwkbfNyC+kiafSbC3gjZvZMCn0Ii/+FB04IOPd2BnQI9PDNCGEJc/FuBaAJ2fjpEF4L2/q6D5UJI/oiEV4LivstEMwJcvfKEYYTyfesEZsO0/jfEZATJ/nUEZ4O2fjpEF4LI/oiEV4LOvl2D8of6PgZEeoZ7vduD5YfkPcOEdAZuflnDUQjNvrbC0YlevhqDfUiBfnUCwElqPrOCnMmA/v/CUonjvm3CjcmAvrrCRMn4PfNC6gkhPihCt8lE/nMCcAmgfeKCnUlMfisCVcmufbCC0gkjfWzC+cjgvZyCgYlUvePCdol8fVqDWcilPR0DQIiQPN7DU8h3POZD2EebPJ8D5cdSfWED/Yeo/ZyD1cfPPdpDbMi3PQPEWEZYfMDEfUY1PG4EFUYNfN0EQwTmfEMEacSsfSdEUcTPvYNEaYZGPa1EW4T/POxD/cKMfVmEF8LJfKdEAoOqvMSEVcOq/XLEBMM/vRIEYgOYfZ2EY4OJPfAEIALJPfAEIALAfjbD/gJq/XLEBMMMfVmEF8LpPeVDlkJ/POxD/cK6u8qEP4RX/CyD38NgO6MDg0R5O4hDsEMy/GeDpIK/u+UDZIKTfC6C68JT+6vC/ALz+0DDAEQy/GeDpIKBPTnDBMJ/u+UDZIKTfC6C68JF/HyDpwcSvDzD3cXDfDJDZ0bA+93DnIWHPJBDXQgRfGNDJ4fw/AyC+oeffAfCXEedO/fC8MaXfMtBfkijfO5AxUjwPTQBSAk9PTnBDgkrPS9BiYkWPOrBv4iyPGuBjEhX/BmBkceTe4hDGkVu9yEG6b9jNz0Gdf91Nw9Gxb+m9yzGTP+ktxMGEr+m9wMGJj+rtx+GZf+p9zcF/X+6NwFG5b+S9yRIGr+EdzKH8T9XdzmIBf+J9wQIHb91dvQHkH98NsTH/n8QdwzIGT9A9w3H+38lNz6IAj+wNzrHmP9StwkHxL9ddysHQD9ENz5HcH85NseHqb859vVHJH8z9tBHXr8QtxDHOL8GN2iHsX9z9xVHVf9k9zYGz79/twCHcT9Pd1KHjr+5NzaID3+ktwiIJb9Dd3uH/39RN2fIJ3+5NvZHIr809vuHbb8u9ujHfP82ttiHMj8UNsBHF79rtsaHEH9SdtbHWD9k9tvHUn9stuSHov9XNt7Hp7919uBHET7PNtlHIn75NtiHmf7N9s7HqH749pJHPz73NoEHgr8RNu2H+r749pgH1H8BdzkH8D7w9oOH7P8/Np3IMr84doTICf9zNrEHg/98dq9H4j9G9vzIMz9M9uIIDT+K9trIXT94tvaGBb+jtt9GqT9l9vIGOj9P9twGnP9/Nr+Gy39EdtuGin9y9oVHMz8ZNu9GJ79XNuxGDn9CNtyGrv8xdowHGP8Jtt5Gkj8dtuoGNH8s9qcHdD87tptHS/9ANuPHm/9utrPHWr8K9wmIVL8XdveIHT8idvtISL9a9xAIhn9xdwiIxb+2tvdIgP+attSIjv+P9yXIyD/ztsKI0D/H93RIzT/a9vFIYf+gdtFIer+wNtpInb/3tvRIb7/m917Ie3/093KIaQAa93SIbv/uN0cIooAAN72ITQB/t1HIksBlt18Io4AA96UInYBQN0zIo7/7Ny/IfX/6twWIrr/Y90vIgQBat1TIswA+92MIsgBF957IkkCv90rIikCQ93bIRYBcN0TIiYCAt23IQ0B1NxkIRsAmtxCIRYAONy/IF//ddziIFT/5NsgIL3+MdxBIKz+i9w8IRr/OdxiIfr/XNxKItoAstzjIfkAJ91ZIh0C29zEIhMCg9s8II/+29vlIDr/NNt7H+v9l9tjHx3+89uDHwz+jdybIcn+69yYIb/+LN1nIfD+cN0jITv/vN0PIQkAld3mIHf/h91lIBr/yN1DIOb/Zd2mH3T+jN1OH/j+a93wHcX+Gt23HEn+Od1wHOb+dN2lHXf/pt3fHoL/pt2FHiEA192IH1oA090LH6IAXN1ZHEj8qNx+HJb7c90KHor8xNxIHs/7+dy8Hz78xt1kHxH9Ut4WHH/9Md6GGlT9tt04HA/9o92NGgL9+N3tGHT9lt3dGDz9T92SGlf8Wd3JGLP86901F7T9st0OF5f9D95vFVD+591BFVf+bt3kFkb9wd36FA3+p92vEn8Bsd0EE2QBBt3kE2IAL90QFG0Ar91VEzwBWN0iFIUA19x+FXP/At10FYP/ndxsFWf/ht+rI1ACQN9vIz0B195IJPkBc94TJL4AAd8CIzYAHd6eI5j/hd1UJHUA/92XJNABut6BIh0Ddt6pIqYCZd6JIjsCDt9oIh4DuN5sIsECet9SIsUDL98MIvgDpN5TIk4DXN85Iv4D/d5qImkDot4kEWkDTd7FEXoCUd5sEIcDF94+EZACh91WEn8B2N2/EIkCZd34EWABEd64D3sD0d5fFKMDe971E2QDed8nFEAEId+nEwsEVN6PEwMD794tE6wDZ99bE8UEQt++EkAEz9/2EwAFCuABI7kCyd+fItEBcOBwIgoDKODyIUkCiN8oIuUAzN9hIYkBReAWEykGGeCKE7QFEeA3EhYGnd/XEnsFct/6EdYE0N+yEIcFtd8ZIrMFN+AfIT8G899xIsIFeeCHIVgGk+DrH6IG5+BqIOcGsODaIVYGPOC2IsUF6t/PIegDWeCrIVoEa+BZIVYEHOAwIfgDjeDqIGEExeCzIJYExuCXIJYEw+DSILQEMOEGIO4EIuEVILcE/+AyIJsEbOF2H9QESOG2H6oEhOEhHyIF4uEQHm4Fp+F2HnwFuOF2HmAFkeGsHmUFS+ENH4MFZ+E0H1cF6eH2HYEFvOE3HoMF4OHeHYwFnuFPHpYFVuCZFPYC1uCEFLcDp+C0FLECDOFjFIUDWOGUFGoEiOFTFEIEhuGaFIAD8uEtFDwEBeFTFaICBOGPIt4F5uAqIioG0+D8IoQFh+DmIrMFH+JfFIsFO+IqFFcFwOGRFAgF7+FOFNwEVOL8EzEFL+IWFNcEfOPNGHAGDePeGGEGiuMWGVMGLOMdGVMG1eIHGVwGFuM6GVAGheNKGTQGYeLcG8UEWOJeG0oEQOJ5G70EMOL5GkIEPuIIG/EDJOKwGt8D7eGaGj0E9eE9GsID7OEZG6YEPeJrHVoFO+J+HU4FYuIeHRQFTOI7HRYFHOKcHUoFKeJXHRoFSOIWHZ0EG+IxHaIEZuLoHK4ECOLeHWMFFeKyHWwFGeKqHWQFC+K5HXsFIOKlHXMFceJtHL4EaOLLHBgFbuKuHLMEauL3HBQFT+IRHUsFUuI4HVMFMOJGHXEFNuJzHW8FGeJyHXkFDuKbHYkFPuJNHCgFbuIsHMIEW+KXHB8FDuKqHGgFOeLjHFsFseFGHZwF++FiHZQF3+H6HIsFHOIkHYAFIOHbHdoGvODOHVsGMuEGHb0G3eAlHT0GqODdHfUF2+BWHdYFBuGRHA4GD+HgHLUFPuFHHHMGU+CHH00G6ODMHtYGleCZHmgGPeBDH/4FduCDHgYGut+DIxgFLuCQIxkFm+BaIxQFwN8LJDUESeCuI0cEKd8lJDoEE9/fIgYFWN9CIxQFrd7sIzsEYd6EIzgEjt6DJBkDSd9IJCID39/DI1gDg93NIkQDy9xRI/YBd91cIzkDPd5yIjIEOt4AIzkEk93lIy0D3dzhI+EBTtyII4cAR9zdIq0AstweJGsAPt1gJNMB791UJCED6d5mIvkE597rIeIEiN+qIZYFf98vIWgFn+EAHqQF0eGpHZ8Fc+GfHaYFJeEtHrEFKuGlHqEFeOFLHpgF+N9MIBEFROB8H3gFl9+wIDEF+9/NH4YFX+AMH5wFROAdH7oF5d8vIL0FteCjH24Fu+AfH5IFp+C5HqgF8d7PIeoDWt4WIiEDst7HIfYDEN4XIicDxd1aIjkDZd76IR4EoeDcIOEEG+CwIX4EZODIIPQEzd+BIYIEJeCbIPEEn+ANIEIF5uACIEUFGuEDICUFid9HIX0EU988IY0ED998IbEE+9+iIAMGheCJHsQF0uD8Hb0FFuGCHagFU+EeHZYFQeF3HIYFK+EPHMMFeeEQHEoFUuGeG2oFUOGjGxIGdOEfG7YFv+GgGwIFfeExGxAFl+GsGroEj+GbGl4FmuEMGukEieHDHH8FxeFhHF8FDeL3GyEFreEpGkgEuuHBGb0Dn+GVGU4EnOFjGc0DCeDlF7AAAuCjFgQBuuDTFxMBjeCHFm8BIeD1FWIBe+CjFcgBFeGUFkYCV+EPGDACPeAmFf4B1t/MFXQB39/9FEcCad+5FbQB8d2oFPICpN1HFIoCGt01FQMCE90DFVsBo90KFAMCIt31FNEAad7TEn4CBt4QE7UBv97mEQ8DS95XEjYCTN46E6sCqN3oE5cBKd0GFWkAqt3pE0EBIN0hFQsAyd7rEkwDA998EoYDHd+wEfQD+t7JEFUEit0JFNgAGt1UFcD/KdzwGAf+79ubGof9W9w8GbD9INz5Ggz9PtzSGhX9E9zNG6r8a9xDGn/9g9ygGP79LdwfF5v+bNwoF5/+lNwZF4v+w9yjFvr+ttzhFrL+y9xsFlD/0txIFrz/v9w7FkkAr9xPFv0ApNzHF33/hNzhFz4Aut/DFIUD/t4aFfICR9+mFKoDdt76FBMDRt7DFXMCmN2JFXECCd2dFq4Bt93ZFvgBqtwlGBcBad1FGHoBFuC9FEIDe98NFaEC4t7EFRwCcN7eFrcB+t7BFjABKt48GEIBt94jGMkANuJCHCgDVeKmHAwE8eHrHMgCPeIWHcgD9eFCHcIDbOH+HAMDNeB5GdEAZt8FGJQAid+oGbUAmuDrGmABzt9JG1gB4t7SGdUAX99IG5QBSuJvG6QDZuL6GzkEQ+LCG3UDWuJKHC8ES+IuG9EDaOKxG0QE/eELGjgDI+KrGoIDI+LYGigD4eERGp4Cc+FaGu8BDOItG8UCu+HCG0IC+eBcHO4BduBGHE8CteGCHikF3eEmHlEFw+EVHiIF7+HPHT8Ft+GrHQ4F8uF4HRoFjOE+HdsE1+ErHcMEgeE6H7EEneHlHvEEmeG3HrsEpuFkHvkEW+EvHzgEXOHBHjMEguH+HncEdeGOHnoEJuF1HioEOeE4HnYEfuFFHsMEReHpHbEE3eBDHhIE6OAEHk0EpeAmHuoDkeD1HfYD8uCtHXMEe+CgHQAEkOH2He8EXOGLHdME+eCkHH4DkOEBHR4ELeHyHGsEiOC2HNoD8d5NG74BAuAYHK8Cm98/HO4Ca96HG8wBAOFGHYAEZuAxHf0DbN71HiQCDN4EH1UBLd47HtIBxd1VHvcATN2DHVwAsN1wHVUB2NzwGkr/DN1cHMH/qtwNGzgADt1kHNIAhtyBGfX/Ot03Gz8Bsty4GfUAmN3OGVMBudxpGST/xd6BHGYC2N14HK4BY9+lHewCad54HR8Cnt9HHgQD3t45HnsCy9/VHigDHN/iHr8CVeBIHpEDfuA4HrYDguBxHpQDuuBmHtUD/+CaHugDtuC+HqQDJuFKH/QDKuHrHvQD7uBPH9oD5OAQH7gDVODNHmUD/t9mH0kDheA3H4IDuuCNH6gDPODfH34D0eAWICYEE+HtH3MEbuCVIA4ExuBnIGgEJuGiHzIEVuF6H3YEieAYIM0D7uCqH+UDMd60IaYB991XIeAAC96kICsBtN73IHwCyd4NIrUCUN45IgMCj99CIXkDV98CIl8DCN7DH1sBgt62H0kCid8/IDUD/d+VIKYDRN+PH+4CE+AaHl4DLOBhHlQD79+bHXsDQOD8HZwDmt/sHD4DVt7RGSMBfd+vFukAeuEzGR8C8OBCGT8Bl+HvGD4DtuFsGQkDJeJ7GdkE3OH0GAgE3uEqGJsDi+LaGOwENONQGTEGouM8GdgFTONYGQgGCeNkGTEGGONnGRcGP+NEGdgFIeNfGf8FiePhGIgF+eJYGUwG7uJyGS8G6OJrGUcG0uJcGVQG0OKLGTcGEeNTGUMGCuNxGfEF9OJ8GRQG4uKNGQkG8eJ1GeoF/OK5GEkFC+M+Ga4F3uJcGZ8FO+K4D2kIbuJrD5EIVeIYEGwIpOK5D7YImuInD6gI1+IzD8sI1eIjENYIKeNwD+kIheLMEG8IgOF6D7cH8uGlDyQIfuEXEHEH8+EuEP8HIOLSEM4HqOHQECgHH+JgDj8Ib+LMDoQIv+HgDgAII+IpD1UIa+GcDZoHt+HvDeYH6eAEDlIHTeGDDqIHAOE4DzgHhODFDsoGPOCKD0QG6ODrD9AG3uDOEIwGrOHHEQwH2uDzEZgGsuHqEt4G4+ABE3IGQ+KZEZUHiuKhESwIPuJrEoIHcuJNEhYI/+IIEgsJ8eJrEtQI0OJXEcsIxuLpEZQI4+KqEqoIuOJuEnIIb+PWDwsJB+OsEAoJqeOHEDgJLeN4ET4JKObIF8gEwuWnF64EM+YfF4wE0OX9FmIEOeWCF7sETOXWFoIE4OVdFicEYeU6FlkEQOZ+FlMElub3Fc8EquYZFi8Fm+ZYFuUEtOaBFj0Fk+ZAFncFl+aQFrIFqOb5FnMFgeYFF+wFlObTFhoFFOZTGPsEteU/GO0E++WZGDoFquW0GB8FKeUuGPkEHeWzGDgFdeRgF8oEZeQgGBAFWOS+GF4FmeMNGCEFqeM4F+8EUeQbGZ8FFeX/GHkFTeQzGfMFE+UfGb8FqOX1GGEFD+bKGFMFqOULGaIFF+bgGJIFdeYDGG4FX+aEGH4FWOblFyMFQ+ZoGD4FOuYKGBwGFeZ0GBMGeeYRGMYFVOaEGM0F7OWxGPIFDObSGNwFX+aGFxUGkOaFF6gFhuZrF00FdOamFroEaOZFF/AEmuVzFYkE7+RdFQoFw+VaFdIEFOU+FUAFY+QhFaAFkeQPFc8FKeVMFXwFq+QyFdwF1uVzFRwF0OWiFWcFHuVrFcoFleQhFTwG9OSwFQwGROQ4FZYGtuXvFbcFGOSqFH0GT+TfFD4GFuTPFP0F4+NxFCsGyePhFNIG3ONeFKgGxeMDFEEGn+MPFMIGruOcE18GeuOVFOUGdOJqFIYEk+LwE/kEleK9E1sFCePuE1EFAOOJE5QFBePNFBwFpeHdFYQDEeIPFfgDp+KeFZEEWuJ0Fk0EluH/FnIDVeKHF2UEBOPtFs8E+OLdF+gEkOSwFrEEyeOBFvgEquQcFq8E9OPmFSAFeON6FUYFL+MnFvgEeuNrE+cFfePrE8YFkeOAFLgFzuMGFasFK+RoFVgFd+XEFVsEyeSnFdIEUuYEFkIE9eXfFS0EGOaKFVEEUua+FVAEheYpFpQEeebIFY4EO+aCFZoEVuaiFecEVObZFToFSeYhFpEFDObxFiMGL+Z/FuMFkOVUFgMGYOXIFkYGOOVNF3UG5uVyF0YGFOXdF3gGwuX1F0YGHeMqFFIJHeP6EjgJLOM0FJ4JO+OtEnkJcuNQEr0JO+NPFAAK5OE+F/kHj+HcF8YHouH0FqsHX+GpF4AHg+FEGLUHX+FKGHkHRuGWFzkHSOFSGC0HiuHVFnIH9+E3GB0IteE5GOQH+eHoGPoHsuGRGNEHJuJjG0wHEuIzGmMHNuIjG/sHJuIHGtMH3+F4GVEH5+FOGaoHOuJuGTIIaeJnGo4I8eJ1GeoF4uKNGQkG3uJcGZ8F0uKaGeQFs+KpGT4GueLCGaMFe+IIGnIGAeKrGgkGNOIkGn8FouHwG9UGveE0G24GR+K1Gs0Gm+JYGWIGdeLTGE8GUOJQGW0GIeKyGE8GyuGMGGYGAeIrGYEGeuFtGJcGveEJGasGG+KnGbYG6OFkGcsG4OF3GQQHlOH7GOkGS+FfGN0GjuHsGDYHFeIFGgYHmuHQGIwHi+HGFj4HSeGTF/UGa+GfF7MGneHGFgUHRONHE+YGROOlExcHdONsE6IGbuPRE+YGF+MjFBwHQuNSFPoGj+JAGFQG5eJTGGoGa+NaGJMG2+KWF6QGauO3F7gGeeJkF5cGNOMxFdIGgeN/FdUG2uLdFbEGKOMjFtEGAuTOFawGseNmFrgGhOScFoEGv+QeFkkGN+TPF6sGhOMFF8sGVuQqF6YG/OS7GCgGmeW5GBQGAOVaGFUGp+VmGDIGnuXsGOYFBOX4GPgFQeQLGTAGL+TCGFAGKuRZGH0GmuKTFscG9eLPFtQGPOITGFIGK+IuF5gG7eHiF2IG8eH/FqwGw+HXFtUGpOG4F34GAuJAFRkHxOEAFhAHPeJHFdYG8OENFtcGK+ItFrcGd+JrFasGW+JbFrgGp+KdFaMGy+K8FPQG/eLvFN0G3uJ8E/sFg+LXE7UFcOL3E/kFuOKDE08GPuNBE0EG++I0E5UGAOJ0FMQFVeIBFDAG3uFtFPoFHuL/E1IGleJ7E4oGbuJnE64GqOI0E68HouILEyIHe+LXEuoHaeLeEloHJ+JGE8sG7uCbFDUFg+F/FLsFI+G/FLIEl+GwFEsFVuBkFCYFteDjE+4FS+H5EysG6d+AFFEEWuCrFDgEouCuFPoDwuH+E1AGC+MtEzoH1OIcE9wGvOI5FJwI3uI2E6oI/+I4FAIJBuMvE/UIheKHEzIImeIBE1kIFeIaFg4IXOIhF10IdOLpFVsIE+IYFRkIXeLAFFcIuuKkFbEIp+IFF7UI4uFdFcoHWOJzFMcHH+LiFJgHyeGUFYsH4+FjFV0HU+KjFFYHn+IgFIIHdeL7E/4HvOKkE6YH3eIJFEkHC+OPE1kHk+KeFB8HteESFk8HseEmFoIHweEmFr8HfuKAGLQIROJbGFwIg+JMGhcJquJLGBgJ0+LRFgwJ0OKLF2sJ0uKTFk8JnOKlGbYJAeOAFVUJ6+J4FQkJ8OKvFgQKAuPyFZoJOuNnFJUKnOPxESAK/+MFEFYJqeNZEbsKJ+QBD5kJJeNtFHwLyObgGnIdf+aSHJYc++XjFx0ciuUJGigbZOb1HvobaeXuHIMa2uT7Ft8YhuRrGj0YZeU2FBYasu+z+0IhWfAN/ZwjRe17/3shgO6hAN8j9vCT/kIlf++/AXglQe3wBHMkfu5gBeklvetpBDsilvKsBnoofPJWCMUoq/F0Bh0omPGHCGoozfIWChIp/fGnCq0oovC2CNonA/ExCzEotPAoBpYnt+wz+pcN3+u+/FAP6+rc/DYLK+qy/wMNvOqc/nYR5ejLAVUPd+ioAiwLNefjBJEN/ujd/4UIde7B+UUb8u6g+mgeQuuD/UcaA+x3/jEe4unDA9UeJOiJA9IZJuWZC1QU5OXUB7IQJObMB5oWVOdBBKASK+lnALAUcOdVEAoeNebtEeEbWOeQCpEc7+XRDLYZHOXxD30XP+jOGOsfXOenGZUeweccFTEfsuY+FoMdBuvDD+gi0OrRFMUiBOmeD1cgJ+mRFPggDutOGJ0ifOlZGFAh7OrGCZgiFunXCcwftOwm+9UTtutn/I4WHO/b90IWk+7t+HcYovEY9PwSAfB09pIUwu5V9ycQrO2D+ekR8fGIDWco1fLIDNkoifP4C1UpAfTODtgo4/QODngpKPOcD30oxvbiB2Unz/bTB1onmfbSB7QmqvaiB6Um9/bAB2AnzfZpB7AmXvZUB+Ulevb0BuslVfavB/YlpPafBgkm/PY3B9QmOPe1B3knSfcTBxcnk/e0B7Mn5/ZUBkgmD/YaEBIpNPWPEKcoJPd6EfcoVvYCEoMoYvRcEVwohfXTEjQo3vecEwwtk/eOFIgsYffREx8sU/eQFNcrk/clFTMsfvdbFaIrHfeBFDsrV/eEFdIqKvfrE5UrL/i+EuMsgvckEyUsKveLE4IrpveXEvwrPvcTE3oryvgiEqEsWPpbEjIsxvkuEl0sUvoYEgAspfneER8ssPjGESAskvmrEc0rkvihEaorW/reEcIr0vngEp4s/fk0E10sifnqEhstxPlBE9QsH/qDEx4sz/mlE4QsuvlOE18tyPm5EwgtYfkLE6Qtl/rmEjUsMfriEkUscvqgEkcs/PmPEmcse/l+Esws+/isEjwtsvgWE6kt+PpWE9grjvpkE+crx/ohEwosYPokExQstPq9H8gnsPryHtwoIPu0IGUoIPvUH6Apn/r4HcMpGvvBHp4qp/ulIHYqsPt7H3srhvvtISEpNPymDj0tQPxSDy4tbvupDhgthftcDwEtW/zwDxwtsPv+D/EszvpID6YsD/vyD4gsp/qIDskshvwJE0AvavwCE5kvbPxwE1MvMPxVE60vWfz4EuAvE/whEwkw3PumE7Yvlft1E0wwV/zsE1svuvuQE2IsivtGE5ss7fvJE9QsyftjEwstaPvyEsQswfv1EistDfxoE3gtFPz0EpAtHfziE1EtA/vqEmUsKvsyE0AsXftsEwssYflEEy0u0flgE+gt8PnIE48tAPp5E20uM/rYEw0uhvl+E7MuvPiBEy0u+vjdE7suKPgVFMgtg/iBFG8uAvnjFDEvYfkmFFsv1PmyEz8v+PlIFAMwU/rKE8Avu/kwFTMwTfqUE+4uj/r0E4Yuv/rAE1YvCfsXFPEuFv3SDxMtBP0uDw8t/fyBDhwtuPx6EVwtXv1fEXottfy7EXstZP2REaMtbf28EdctpvwPEqgtm/38EV0ugv3fERYuD/1BEmIu7vwuEgsuNfzFCBUrafuxCM4qNvy2CC8qWvuyCPQpsPqXCIAqmfqnCLApTvvYCBUpffrTCNYoOPzSCEkpIv3DCEcrMv2/CFoqP/3JCGwpCP2hCeQs/fwPCScsOfy0Cb4sMvwdCfIrc/uhCXssbfsPCaYruvpzCRosvfrxCD4rKfUGC1AqBvb0C54q9fRSDPcpCvZLDUYq+Pa7DAArJPf6Da8qYPa3DuEpkvcyD1wqOvhAECoqIPcTEJAprvgwEWgq7fc+EaUp9vdgDXYrQPh/DiYr6/jqDfYrMfnjDrYrqfiLD/Iqk/nED4kr/Pl+EHorLfltENsqRfoUEYMrefkhEQ0rXvqJEZwrhPl9EXEri/iJESkrnfzlEC4t//v1EPQsgPx6EBst3PuHEPMsc/v8EH8sSfuFEIUsr/w2EUItFvxNEfIsEvyXEQktgvteEYAsgvuwEYosZ/tEEr4s4vpXEl4sdvv5EaIs6voREjQs9vrKEREsXvuXEs4s6PqgEnUsOvyIEp4tzvuQEjYt9fsxEistCvzdERwt+fpzEQIs5/oGEfwrW/rgDxAsr/qBEAEs1PlKDmUsDfogDzIs/PwXDV0t/vzRDTItNfzuDVQtN/w2DYAtYvsuDWgtZfvuDT8tlvrBDfIslPr4DBUt8PxQCxku9fxGDNstKfxlDM4tI/xyC9ktVvttC5ktV/thDJktivopDEItmvo1CzstuvmNDMEsu/m3C+Is1/j0C1Es5/gXC2Ys0fnLCtEsD/k5CkAsvflqDZUs0fjpDC0sM/ePCjcr9vdBC80r/PaQCz0r3/dGDLkri/X7CWkqN/bMCsEqBfYxCVcqifbcCbUqL/QIB+Qo9vQ3Bx4pBvTrB0kp0fTKB20pq/VuBzEpmfW7B5Ep2vRzCLoplfUuCMQpKvTkCJopb/PbBrUoSPMeCBIpgfN5CWkpDfTvCrsphfTzCf4pGPUuCQ0qt/WlCAIqivaQB/EofPazBxQpLfaPBxMpKPa8B2kpj/bUB1UpJ/b+B6opQfZFCOIprfb/B5kpg/aoCCYq5vZACOEpUffhB/UoDvfOB64oRffxB3Qo/fboBywo5PbJB4Yo2vbgBwEo3PbvB5AnI/cACNgn2vbAB3Eo5PbTB/An8/bFB3Eo+PbUB/cn0PaTB8AotPafB8co0PazB+Eo9vbVBxkpMvf8B2wptvcaCeQq//eZCHMqVvigCZsrlfgMCRQrMfhACPApvPiGCIoqQfl6CcErY/neCB0rBvqBCCYq6PmYCF4pYPlpCL4pPfmLCPsovvnJCIcoBvm6CCEob/l6CG0qC/oxCaQrGPrFCNoqo/eDCB0nTvifCKMn7vdVCP0nk/hyCIIowPhOCEApIvgwCLwo7vYbCB8nq/b5B9wmZvb9BxompfY6CFEmEfdlCKgmXvc4CIEnlPcVCD4oOvghCGApzfhZCOkps/cACN0ouPcFCGIpQ/eiCEwqkfc5CN8p5vYnCY0qcPe+CScrH/hkCsor+PnfCV8sqfo7CtQsK/yHCmstYvt3Cikt/fxlCqotpPEWAFcmafDDApImQvJvASEnSfGsA1Enqe/MBeAm7/KhArMnJ/J1BMgnsfOsAxYoGfMeBQkoWvpD+Ioqffrg9p8o7fwk+Fgr8fyN9kApsvr69UsmAP239b8mEvsR9D4i9vzn87Ii2voy9Rwk/fzv9Ikk+PbK+FcoHvdi95wmg/h/+HUpqvgb968nfveE9nck+fg59oIluPd09I0gYvk49H8hsPel9WAiMflo9V8j2fO49QQeDvTL9iogUPE496Acv/E4+CofSfTg92giNvJC+bchH/Tw+JQkZPKC+vMjIfR2+jkmlvIf/JIl5fXZ9GIfAPYE9kYh9vUC92Ajo/X194Alf/Vh+TsnR/Qy/G4nAfPe/aMmsPT+/RkodvOB/2UnJPWn/30o8/P/APInifUvAdoofPRYAl8oUfdC/AUquff7/S0q9PXr/AYpZ/aj/kgpLvib/xsqz/ZAAHQp5fZvByApsfZ3B/kojvYfByYpVfZUBwop3fUVBwkpJfa6BhMpcvSdBGEo5vOxBVIoDvV1BZkok/Q8BpcopPUtBt8oQ/W5BuIoP/bpA3UpjfWvBPUo5vWaAi4pCfWSA8IoAfcRBscpgPZiBlAplvYYBaspCfamBTUpsfdCB6spNPdhB1wpYvfFBsYp3Pb1Bl0pHfpkCHopQPk0CPgo7vmeCC0qGPlTCKMpjvj4B4Ioa/guCCUp6/gXCOwpRvgACHUpwfleCHoqI/fSB4soAPeYB9EoOveoB/8oZffkB8QoMvfaBxQoh/foB04owffwBxQpife3Bz4pBPizB4spBfjLBxEo7vcBCK4oePn/B6IqnfjGBwsqV/g4B0EqQ/lUBwIrAPlWBl4rFviWBoYqxvenBYsqzfg1BWQrsvjwAxIrgPd5BF4qUvcuAxEqsPicAoQqhPgpAS4qIPfHAbIpSvsk/2Mrl/uaAPEqoPk+/7cq/PnKAIgqsPv9AR4rG/o1Au0q5/qi/eUrK/ml/QEryvjw+wIrkvrt+xAsBPd4+n4pnPUc+2UoZfoT+qMriPgp+pcqEP05/MMs9/ww+ogsJv1dEigvu/0tEh8vIf10EpUvuv1LEpAvqP1oEg0wDf2PEggwsP0VErcuIf1PEsEutvyaEmIuifyOEv4tkfz1EmguW/zvEvktUfxbE/EtlfxOE3MuafzQE90tuvywE3ouzPy8EwgvnvxiE/YunvwCE9wuu/yrEjAvw/ylEsoumPzJEvUvrvyyEpMv8Pq0ExUwVfvWE5svp/swFEovl/odFIUwNvvrE9Ywg/qqFNowAvtTFBQxXvtiFGgxw/vFEy8xGPxIE8UwX/ycE4kxrvwZEwYx+/teFOYxY/z3Elkw6PzFEoMwZf3gEjQxj/2NEpgw8fxSFGMyMf1uE9sxNft0Fp8xivtZFfIxkvzdFlAys/yLFZsyWvroFfIw1voTFVYxaPlQFokvH/rnFlUwFvuDFxAxKvrTF58vGftvGHAwhvk3F7supvy3G+oupPwFG3IvkftTGyoudPugGr8um/xmGvkvSvv6GVcvgvz0GBQxjvy3GX8wKPs/GeEvhfwAGLUxFfo8BgIoM/pgB8IoM/tuBlQoQvuTBxApKvuXCNwpV/zBB0MpQPynCDEqVPyTBoYoWf2rCGcqQv3DCFQrHvzQCCErMf2bCNkr/vuhCJkrH/0YCFYs0/slCA4sF/0+B9wstvtDB4Ms1fqRCBIrlPoqCFore/pVB9Mr//rGCLoqdf2kBpwob/3gB1opYvcdBqAmv/f/BnonZfgCB+snFvgEBg0nA/kQBo0nN/klB2EoXf1C//orMv3o/YEsgv2KAFYrhP3nARgrCvqEA5srovtKA8UrAvroBCwsivu4BHksfvscBuosJPowBkwsSP2WBE0sG/37BR8tZ/01A5QrRf3WECgtLv1iEBYtVv0lEVItjecHOMIaWOeYOrwXhOUfNfwXJOU/OOQUTecfPdIUJuU/O+oRk+i7+pz3qelW+3H1dOjg9uv3aun997z1gOp++9zzd+or+Z3zIuk09Or1Jeqi9XvzTui88kf49us/RvgME+r+RAYMH+wSRa0QIur8QykPr+gBREULOuj4QgUN6OmFQucRvedbQWAPD+yOQ8gTN/CeStoDR/COSlb+qO0TSUYDx+0JSWD9c/AUSnv6zO7lSEL4EOsiR1X8+OtIRp70NetQR8YCweYXQ3sDzefAQ0QI6ehHRcYCkulmRfoHmusAR1QIG+WIQCn3tuUeQpr9E+hZQ6r1R+i/RH/80+2FSPUIC+6DR/YNQ/DhSaoJV/C2SOgOBPPnSzYE/vIUS1UKAfPQSawPM/YcTPMKO/bMSjwQR/byTIwEHvrGTfkE/vnGTGELDvp7S5oQM/4YTXkLWP4VTkMFH/buQjEf3/lvQ/EfMvYnRRkc7fm6ReUc+vnpR3YZQPY7R60YRvYpSbkUC/rZSVEVO+W8DAwHheWXDFEF1OWYCgoHQOY0CtkE8+RFDRgDB+YvCj4C7+YZB9QEpubpBv8Bn+a0B04H4eQMC/gKceRYDR8K4uXqCDwJM+WEC7IIueSKDWoIwOUdCCMM/ObfBQoKledqBMIHl+bfAEL82OYV/U/8m+ZPABL/4+ZX/P/+Iefq+Gf8I+fs9/b+Z+es+8MBv+fs9o0BG+fp/+wB5OjkAab2uehk/iL3Sed3AWn5cOfT/af5nufg+e75Meh4CKj1uehBBSf2nuYCCOP4BOfLBCL5W+ZFBCn8EOaRBxT8J+YdBxn/ZebLAxL/5uaKA/gByufE//8EUugT+6QEqejn9TQE5ek++l0HGOrE9KoGW+e2A/QEZ+UMCzX8g+WOCmb/YOQJDlwAIORoDwf97uaLDrP0keeNCzX1aeWrDnP4F+ZLC7X4wuD2EvT/P+B+E0b/8eDNE0T/buB8FLn+v9/jE+r+z9+8FGP+kOD5FS3+yt8mFuP9QeFAFUT+DOL1EMIArOGcECsBOeHoEVIAHeFuEewAeuFqEIMBDOHkEG8BlOAwEnwAceCCERkBJ98jE3D/it+IEwn/wt84ElwA/t/OEsb/Id8ZFtb9RN+iFFr+vN5gFJv+kt7qFfn9ON6xFTD+dN4ZFO7+/t7CEuv/X97KExv/+N5WEjkAqd+oEfAAaeDTELABmt8QEV0BiuAQEGICCuN2Dy8EF+MmD84EyuKZD9YDt+IuD44EIuPEDkwFzOK1DkgFPeI5DxgET+KeDvkEL+K/Dx0D1+GjDoEEs+FTD60DiuHFDhkEMuFRD20DYuHXD8cCbePbDxwD9OJBEIoCHuPaEIEBy+LcEIsBtuJaEE0CmeKkEKABauJzEYIAu+LYEUgA9uM3D/8CvOMwEDoBReNzEYf/NeOXD94D8uLpD0YDnOISEKwCy+NgDvQFZOOWDo0Fn+PsDp0EV+MQD80EheIBDnQFBuNDDrUFSOPyDTsGtOKUDe0FW+G3DYIEauFJDk8ECOJ5DVQF6uHzDfgETt53Ex//6d7iEU8AK94cE/L+ud5sETgAVt8PEHkBY94PES0AC9+7D4cBEOAJD3oCz9+WDooCpt6QD6cBbt9aDqgC6d3hEEUAOOCTD3oCfd+EEHsBRd22FMf9sd27EtD+LN2XEuT+s9yeFNT90dyyGFX879y5FvL8VtysFvv8MNylGEP8q9yWGtH7/NuMGqL7vdugGHf8d9uAGtz7KNzIFG7+xNvDFov9UtymFBj++tuyFjb9KN4VD00Dwt1KEGkCUd2ZESkB593jDysCUt06EeAAht6cDgwDLtwiFR//tdvzFjr+FtzyFM3+qNvaFuv9YNxJFUv/5NsKF3f+09ypE0wAoNxkExoAgNwUE8j/jdzMEmz/ht31EIoAydygEh7//d5gDtcCPN6fD+MBEeB6DVcGwOALDYkGIeANDpIG0OBiDf8G0uHnDO0GnuE0DV4HLeHtDOMEUuFCDbsECeLLDO0FH+IaDbUF7+JKDXUG2uL9DM0GIuQyD2QIy+PsDqwIT+O2DrIIxeMpDjQIJuMHDkgILeSZDsEHmeIXDk8IL+KSDdkHqOJuDbsH1uKmDqEIn97gD2gEc979DlMEJd9qD0AF7t5cDjEFh9/SDe4Fq9/GDv8FL+APDfgEZ9+ADRQFUt+rDQEEut4tDiwEDOG8DO4FLuAZDeEFyeDfDPMEreGmDAIGceLbDPAGSeB2DcUD3N9wDeEDuuBRDooDkODFDacD5+DuDnYDH+FREAICweEFEBgCR+JAEOUBhOFjEqL/C+IVExr/rOJ2E2f+B+KoFW39c+OqErP72eJ0Fer6/OO+FMj2xeTBEaj3aeWBFBnzR+Z7Ef7zlum7E8zrO+c6FIHvrej2FqXqNuanF4vuZ+TuF03yCeXXG5rtLuMAHMXxoucYG0np5uDXGgj+eOBEHKP+8OCYHR/+zOC5HRf/P+AWHfT+juAEHp7/BOENH/r/1eDjHmoAEuHnH03/JuH+Fxj+cODoF+P9tN/TF7f9V+DQGRz+yt9rGer9MuI+GDz6neEoGPX8QOHvGnn8kOFYG6X5FuP1Fxr2LuKkG8b1+uEVIbPxm+HZH+n1POGdHnr52OAqJG33weDjIcv6BuHuJ5/yA+HnHU389eCsIFL98985HJP+EeCVHR3/ut+2HJX+w9+eG1f+jd/AGzX+aN8GHXb+Qd/iGwL+x9/wHRL/G9+LGsn91976G8z9sN6FGpP9xd4aGcP9XN4CGZn9mt6RF7j9Nt5lF7/9Hd+0F6n9RN84Gdf9ct+WGgb+zd/DGi/+KOBKG2b+i+BgIAYC4OAQIPcBXeDeH14Bq+CVH2AB5+AEIKkB+eCOHykBg+AEH6IANuBQH54Aq96QHpP+Xt58Hez9O977Huj92t3FHVT9U986Hub++d4/HT7+jt/RIL4AUd+WIQoAV98qIP//EN/XIEb/v95sIkT/cN6LIXP+1t38Ior+gN0YIp/9Ht6EILn9Mt39IN38Et9kH0f/tN7yH5L+M+DRIOIB+N9GICsBzt+qH2sAEOCtHtT/pd//HqP/WeBcHtH/IeHcH/YAJOFlIMgBKOGPINEAQeE2IeoBFuHxIqsBFeHRISgAN+HoIaoBHeFZIe0And8dLyH92t9tNCH80N8pLAX4HuC2MUH29OBgOeH6QOHeNqL0i+EDL3jwkuJZNL/uOuJiHXAJLeLhHOcIIOKgHHsIBOKlHAwI5eHFHJcHfeH2HU8HnOHqHDMHOOEmHzcHPOFYIaACSOH6IYwCReH2IQYDBOGLIRIDO+EWIn0DR+GCIlUDP+GDIuYDLuFgItcCweD3ISkDfeBnIYwCyuD6IJMCG+GnIE0Cr+A0I3UEXOA8I5UDEOHSIqkEvuC/IsMDKuGbIkwE/OBaIrwDPeGfIpMCTeH5InwDVeHhIlYESeG7I3oDX+N7O9gLL+XGPecOZudqPwMShOXnP/YLFOM7PVgHFOBAMUECcuCsNr4BX+E/OL0GpuF5O+kAueSzQP4EcOMxP0n/r+JcPRH5YOb8QawJLuL7OAkKkOLSJGUPW+I2Ir8MX+IDICsLgOKoHYwNhuIJHLELseKYH74Qi+LEGpYK2+JcF7sK0eIVGMsLTOJmHiwKfORoE98V9eN0FwIVS+RyD2cSduPgE2sQFuSADj0NwuRpC/IOHeNTFBENxuNWELoLR+TYHsEXeeNuHM8UTeQHJAoXcOPmIRUU6uI3GgARyOL4GJ8NVeOKJ8QSc+SQKTgWtORcMs3p0OMxLQrrL+cDMX/lrublKyjmZeMuJy7skuYkJhrnVuofMBHiGurSKhfipe2aLzvf0O3wKfPeGuryJMri7e3UI2vfpvHxItHcePFLKW3cD/FTL+HcVfXYKFba3fQ1L9rak/VNIgLbEP8lRBjkePmuQ4/kBv9DR13ogvnxRqnoJPTIQpLlKPQSRrzprPlmSULtjPSHSGruAf+sSQLtS/VkSifz+/lLSyTy8/XjSzT4OvrBTJ/3Av+bS/Px7f4gTZr3QPbjTA7+RPrSTQf+r/4gTj7+lfLXSk359fLMS1f+FPCGR4rwc/FuSQX1jO2VNF7gw/DMNFPeN+3qOC/id/CmOYvghfQhNW7caPRrOvjeSvTkPhDiFfDQPXnjmOy3POXkru+FQQ/n7esWQJ3oCegJNWzln+qQNLHiq+iXN5/lgeozOP/jy+gkPjnqhutFQ5/tQejkQF3vLuauO7XrT+UxPu3w7OL5OsHyHeR7OC/tiudUOePn5uVmNtXovelJO3rmkO/WRIfrz/41OwbdVfkTO6DdAP8QQGHgc/m5P/ngqf7yLirZjvkXL5DZqP5mNXDaTflrNebaff7bIZHZMf4CHODa4vnyIfHZsPn+G17bAf5+FwTdyvl8F4fdjvVAHGfc3PWnF3/etv5WKOrY5fmHKDnZuvHiHAneHvISGPzfE+7xHZDgdu7cGDviU+ooH+Pj9uoAGnXl0+ZNIA3ozeMWIcrsGu8tFRPkx+sXFhXnxe9wErblkOwIE3Xo/qwwxkXtbKw1xUjySaz/xy3wGKz1xp7yR6yBxRz356ujxwr19KujyMbyz75w1R/5ub6G1ob3wrz302X6hrtA1b33Gb/r1l/1I73g1sT0o7dI0xT4u7lF1f7xLLm10CH9qMRj0cb+iMXs01X8D7/20ET+cMC706b7fcb/1RH6zsG+1YL5BdDt0RIBGs9vz6oDiNWq0doCUtSDz6IFe84nzOAFQNNazPQHgNlzz88HLNhPzEcK09qF0e8Et8Q5yogDqcloy10EWMQazjgBxMnxziwCWcrM0bP/b7RiueD5CbEivMn5PLSCuL/uqrCDu5Pvoq54v1j5WK4lv4jwsbHzu3HlwK/av7vnkbRpuJvjUbXOuYPbFLOAvcndVbGfwdDgbLW/v6/YPbQ6xBDcPLY6vGvXI65gw2bqkq9lxbDkFa5vyDDpv7JayOTgQrGJy5nmK628wnb4G62OwoTxbLLlwlMD17Rxv2oFWLZOxXMEhLigweYGjrdpvM0G4rpjvuQIrLxSw6wG2b7PvxgJz7pTxyUEutTowxUOjNDlxH8L1tHxv30Ptc3hwX0M6s3mxYMJKst2xHcJ4sliv5UMXMe4wlgJEs4Au4gOHMMowSkJWMWtveML+8BxvA4Lksd+uesL4MK8uCQKIcHYxEMGscVTxjIGqr/iyI8DUbreuWYHKL08uxMKh7xDuPEGFL9NuJUIh7xDuPEGUbreuWYHPLzytsAC1bh9uFkCjrdpvM0Gj7WxuuEBF7ggt+D587tztQn6bLLlwlMDCrCrwI7/17Rxv2oFf7JuvQkBT68YysX8vKxDx6z6gLCbxoUAF64YxHr9T68YysX8gLCbxoUAcLN3zYP9pbR0yXcBiLnTy1QB3r4pzQsBCcqzx6wGIc6SyNUHPNJ+yMgJydYhyCcMNeB0wwISEtppw2sQat63vtsTsdf1vgsSDNbSuU4Qa92WudERK+NJzBUNhd06zCMM2+ElyIUPCdz9x0QOMuQ6z1AK1d5Jz30J2eT10SII8t+i0dcGhuZ63Z7/I+e34cD+UeSb3S/9zOWQ4lv8suc/5if+EOeU5937iuQy5JT5ueZP6Uj5zuAn3sn5H+0s1PQHS+nQ0tQI5+3S0WQKV+kP0MQK7OizzCUNRu9Vzq0M1eceHRgeied8HmsdxeipHnseaejTHw4eU+duIA8dD+hqIQIepOjyId8epOdeI2weO+h0I18fHegrJRQgmuegJfkedOmsH/AeDemwILoeCvlTH/UkJ/iyHrMkQfnWHtElX/gqHm4lEPcYHo4kVfeCHR8le/iIHT0mg/ffHNUlVfk4HrgmXPlsHZAnE/rzHj8nF/olHiwoWPl9HFYoDPo0Hf8oQ/l9Gwwp9vkvHLUpLPmAGq0p3fkzG1cqjvrpHH8qdPrnGyMrUvoDG78ruPlWGu8qHvmcGTgqo/mMGXQrHPnJGLIqKfo6GlEsIPc0Ew4r+vb/E/Mq+faZFFwqBPdmE2cqo/dPEpUrmvcrEh0rZveLEr4pxvflEZIqTfc5E9Yo9fZOFIwpfvYOFD8oGvccFa8oI/dRFcwplPdSFiQqXvcmFjQp6fcZF6IpTfZKFwEoLvcyGEUo/vV8GIcn+PZRGb0n5fcGGaUozvcSGg8o0vZpGgknvvcdG1snuvWgGdImtPYkFi0oZ/cfF6ko//cGGCIpH/iPFi8r/PcSFtkr4veOFYUssPirFlosbfgMFhQt3PhTF7sr+vieFtct1PjMFaAuSvhRFdUt4vfaFCstAvqDGdksjvnPGPMrCvkBGC4rcPkVGHos3fnOGGUtx/rPGj0tofoXGsstd/phGVwuSPqlGPguuvkJGAMuMfliFx8tYfgrF5kqkPj2FxQqkvjXGJ4phfjJGR8pivjLGoEoifjTG9AnoPcZHKImi/jAHAgn6PWAHXckNfbcHOoksvQCHWgk/fRLHLokb/Y3HIwlP/WKG1IlfPWuGhAmqPZpG0gmu/TeEyQozvUUFQooQPVJFuwnBPQdFfsnY/N7FoQny/SRF4AnZ/TNGMwm6PLZF78mJvKeEDYogvNpEjsom/KwE/0nBfHeEdQnJe4gCR0mg+/lCBcn4e/MC3oncO6UDIsmnOx5Caskx+ysDRwl1vBpDuonfu+ED0EnJO4BES8m+e9rExcnIO0mEwMlOO9CFSwmyPEoFXQnMfG4FpcmnfIcGdYl3/BJGKslZfJJGg8ltvC2GdUk6O5JF0Ml0u4xGXYkz+wBFk4k4OyoGLMj1e68Gr8jHO2fGv4i4e7rGzwjYe38G3kii+uuGg8iEOwxHJkhL/JOG3ckjvD4Gj4k7vEuHCokafD3G9QjI/TqGfIl5vPoGjQlpvPKG6AkYPOTHFgkbPSaHVMkHfMzHTAksvHeHP4jLer5GhYh6+qUHL0gLelvG/cf/ukeHeUfSenLHR4fYOgjHPUenuotHgIg9OncHmAfhuwrHXshhOuXHbYgR/C7HJUj6O7FHPUip+3pHDoipvawHkkklfUWHlYkhvjYH2YksPdGH04kV90u4tTjf+JU4bLezNgY2ojb0N7Y2vbZNuX63wHcteMJ247YENyq0jbUzuER053TuNXT0erUVPF294znavL28sHkfO6g8Wznz+/b7vTj7/JI8NfiYfF87OPgK+w76u/hcu6T5D/cy+r17DbmIuqZ7vrp8uw/84zqgelH72HtnOuC87btfO43+Nzqo+zr9/3t+ucy7s/4huj27zn2W+mY8YTz6uZo63D2o+dn7Xvzjta830Lvntxc4szw+tiD4WLqrd625MrsdOF35U3yw+Kk5/PuyeEF57vp3ePb6Ivsz66xzBH44bJD0Fb4YLN00UryG6/YzZfyG6/YzZfyZKzHyrvyz66xzBH4PKyjyQb3Aa1Pyv7tALBpzarsALBpzarsZLTy0MHrPrqH1PjqpbUKzw7lTruJ0ivkQrGJy5nmGs9H0IDVNdGo1xrco8g7zg/Wicm41FzcZNKt3BTjtckM2Q3jO72RybXXULj8xjDZabzSzobdELecy63ePbQ6xBDcv7JayOTgPr03vIPSCrnau6HUe709w3zTErmfwWbVPLY6vGvXbLW/v6/YdMafvezPosHhvB/Rf8dExkPRQ8LOxDzSp8L9y7zWk8LR0czcBMLP1XjjxsB92F7vKcHN1+vp58cI22zu5cjm2jvp+9Of2q/2CNMe2ID5ltpw25/3aNkD2HD6DNLj1Qf89teX1W/9/t6l2FT8Xt2c1U//DtyC0y8CuNZ60xwACdHb03n+NcsF1Dr9E8wQ1un6VMJR2HP1Y8JN14n3GsfD19z3Ycc02WX1hsGu2ADzgcdV2mLya83v2dz1x8wH2JD4as9l3WfuMc7V25DyAtVZ3V3zNNEk3kLpk+Bt4tn1W9tH3430QeTQ5nT27ORd6TTzmejT7oHwYurg8rLwP+v19tzwfeaL6+bs6+UY6w7wvuVw6BrlDuZ36lDp8ug54lLcZ+cC5rHgueZU00HTLOjJ2/TX2+ut20zXouo20+XS+PW8tVMC//XAtEPxdvrUtcEBGPrKtO7wLPYNtVbg0fkLtVrgLf7FtLrwhv3+tFPg4P7RtXkBb+CbyePOxeXBycvOD+q1ycjOB+UTwBfNpukYwFvNZd/lvw/N2O/s2+/W0+162eTVDPAU06LShO290pTS2fJU06TSRvB+yefOH/NzyfPO+/VW033SLvZgyfHOYvPOv4POb/a6v6nOdPDlvzzODucPtKrb3+j0t8jR7epptMHduewJuNzSpukYwFvNXe0CwM/NB/AauM/TdPDlvzzOze63tEvfiPLvtBXgLvMpuGPUYvPOv4POaPYsuK3Ub/a6v6nOae2NydDOXe0CwM/N5uKws/bZJuTStwfRp918sxDbet5/tzHRB+UTwBfNZd/lvw/Na92WudERDNbSuU4QmN0lthEKFNYVtkMJEs4Au4gO9M4ptm8Igtbusw/9d8/Zs3r9694FtGH6/usgteMBTOv3to0NBuautG//veR9tvkLTuuAusYTmeThuSgTCNLyvujN4stSvtzOidOOyLLPP82Ox2XQ1th+v1XN3dcUt97ROtdGs47cF9G4ts7ScNASs6jdCNLyvujN1th+v1XNJto6yS/PLcUMsxvfxMVNtvLUZ8r6snHeCct4ttjTdMafvezP4stSvtzO4MK8uCQKFL9NuJUIAcTxtR4F4L8strwDBsB1tJP6dMT+s4T7ksd+uesL7sgHttQGgMnXs7f8Pbw8tNTgzbyNtpLXh8Bms93fGMFEtibWPr03vIPSosHhvB/RM7jUtRLiwbiAt2LZCrnau6HU6bcBtvzt7LtBtHTtKcA9sz3tvsTDslTt5M+0snbt5MmispPtwdbfsmHsSt36smbpNOJZs4LkEORos/3pdejksyruS+1JtHTwy/GUtE3xPvF9taECG/2Nv8jOr/mev77O6PwoyevOePk/yfHOWPk502nSzvwo01fSxvwS3YTWafkf3Y7WEvYj3b3WhfnD5aTaVvaq5fLasfzI5XnazPLw3AzXBvNm5XXb4fP/62HfsvQA8TXis/ZF7LbeIPeM8YXhWPz/2xELkfzI13wJkvlI3MMKrflm2MkJiPx6098IZ/l/1G8JH/ea3IkKOvfj2NEJ+fT53CIKNPV02XIJyfY31VcJmfQl1rsI0PdLzS8NpvjX0OIK2fO/zVUNdvWW0eIKyPKF0gAK0/Ih2CUIu/M22g8J7vIl3YMJ2PBM3PoHn+9s1+cGFPGE1DIIGuj48YEBBum08OoDpegI7ZgBtemv67UDVupk7zAGAutE6sAFj+fH7w39wOc/8an64+f46pn9yeeD7Eb7seey9Tj6Red39KP8aOc38xn/2+dh7mT/R+ib6cn/Zugo5TkAF+lJ6M4BVOn04xYCOuri5rMDiOp74sgDtOtY5X0FIey84E4F1+575zwJu+zR6JkHxO8+4rMIj+2u4y8HJe6z3rUGFuiZ3XIBOugd4b0ACunb3YYCQ+lE4FwCMOYG1oUCTeaN2dYAJ+KZ1RIBROMd2a3+8+po2a4EIOlH18UDP+y11ugFXem01AgGbuXb05MF7uCx0zsEwun124IDa+he2n8Cbuq43tAD7+uf3BYFyO0u2hUGFPKI4fcJaPQJ4eEKQvFn5pgK0POA5a0L6PdH71UUT/jr7+sV3vQS8ZITyvVI8a0V9vgq8AoX2PfI8FgX6fPP8gAWy/aK8QIYe/qH8EYZ7fop8HAYSPu474MXQ/sT72EWI/sh7jAVWPau5IAMb/Mp6oAM9fXR6LwN7fjZ428Ni/hw5yIPqPW47DoPWfjq6q0QLPOY7rgND+wG7ioIPO6y7M8J8+tj86sIHu7j8XAKsuud+LYJqO2V9tELzvBw6zELo/BV8CEM4O9X9PwNZfLz8fcPHPWj71kRBPiy7Y4SW/tp6RoSOPtI7JoT1/sq42MOhftE5nQQxvaQ4HILSfka4AoMHPzA37EM8ftizDYMPvy7zzIKg/sJxTIRtfv8yLIOR/eWyRwQ3fYkxVcS7PHWxJoSpvKYyX0Qqu0ryRMQkOxWxI4Sjubgw5gSvOuBv3kUV+UNv68UmeThuSgTTuuAusYT4eeUyO0PTvZ1u7gSGvbNt00NBvuFuy0Swfrot70MNP/ct48MVP9+uxASDPF0t84NL/Enu3AThPY4wHsTZfHiv/ETL/Enu3ATTvZ1u7gSRvtZwNYSBvuFuy0Sn/yRHa4tnvyQHFYuu/siHe0spvslHI8tEvuNHAUs9fqaG6MsuPtLHkgsI/ugHV8rh/z6Hy8sk/zCHv4sg/wnIUQrefxXImoqpfprJnkpGPt9Jf8oKfx/JggqWPyLJcIpYPt+JLwocfyNJKcpf/x4I9ApivtfI8so6PgyJCIlIPhKJfklyPl3JC4mD/l/Jd4m0vZoJhYn9vdwJvUnkPpmIq0lhPp3IZIlFvtIIlMn9votIfgmNfqqIGslkfpHIJcmtfn6Hzcl+vmIHzgmivn5IIUkH/lqIIEkw/lYIowkyfmaIYIkbvkzI6wkSPpsI9Allvp8JIEn7/prI18nC/qDJfcnRPlyJrooePZeJyYpJ/hhJ68p9/mBJwoqEPceKUkqH/kOKcAqD/UeKcIpmvdzLsEqaPpTLp0qCfeJMYQpFPqHMWQpyvmpNQ4pZ/ZlNfcoWPsTKfYqP/hrK0grzfpjK1grzPKALqMpEfV9LmAqFvKJMY8oYPSNMUQph/MxNYMoHvEMNacnw/OMKxEqGvMIKRwpuvGcKyMpz/CBLpMoqu+fK/wn5O5oLkEn6/RDJ5Yo/ewLLsslku12K54mPusxLSAkuuvFKholf+lHMrYgj+qlL7kiUuuqM8kiUey3MIYkKe5BMSYmLu1tNLIkI+ciLf4cFOgPMJ0erOWXLsoZsOZ9Ml0bWOhQNcsdqOj9KewgIelGKCAixOnLK2oiMuqiKZMj+efqJ8EfcujPJvEgN+VTJZAZguUFKmsZKubfJbcbk+aoKRAcQuYpIqcbCuf7IigdCefrJX8dTeXOIOcZa+fqKCYeEeiiK0UfJenpLdogFPZyPdwkMfbAOTwnx/ncPXMlzPklOpUnY/CDPM0iovAWOZMlA/P1PO8jK/NjOZMmD/ZrQCMizvneQNUiQ/CVQdkcTPA0P80f9PJJQiAe7fLaPxkhhemRPlkXlOlGPD0av+ngOUEdtuuIPXQc4+saO3cfrevDP4cZoOm1QJkUzuvNQa4WfPA6RwkTHvM1SPITgfCERZUWI/NiRq8XZfClQ9AZEPNuRAsbOe4rRvARMe6XRFAVBe7JQmQY7e2zQE0b8O11PkceCu7zO1UhUuoTNzEgW+wfOFciYe6+OC0kEO/TNFQmD/B4MYIn7/V9K8Uq2PuSJ2Yq6fvU8rUg/Pn88ugfEfhT8wkfpvoN8nkes/iW8h0eK/0J828hD/ZE8gsZJfre8DUaIPo18XUbr/UG89gauvIm9AgX+fFE9Y0YHvSf9DQccvFW9lsaqfeh8vMcR/bG88wdivqG8fEcSPfDCsTlW/dfCPLlaPRdChLnd/SdByLnYvcSBcflgPT3A/bmrfHcBhbpu/HtAg/povHtCe7ocPBZEATnVO2YEJHpAfFvDvbnB+5vDm3qfOoNEc/sZeulDrXtO+hiEXDwHOm3Dj7xKuweDGnu5On3C+jxs+w1CfnukurxCIbyYvFZDInolu4pDA3r5+55CXvr3ewFATHwYOuQ/ZXy8+rvAdTzSuqE/rj0nOvB+lzxHO1m/KHuuPHy/ZvoF+9O/WnrK+8RAvjr/uy+BZjvCeuRBS3zEO8oBtzrGPY+FEzgdvKIFNLhY/bBEejh9/ICEojjrPbpD1jjhPMlEP/k6vZNDnrk+PNwDhDmzv0sFAHf5PkwFHTfnf2SEXjg9/mkEfvgWv1cDknjSv1HDZ/kF/pMDqTjMfr7DLnkMf3gC5XlQPpZC1vlH/epDEjld/21D+zhBvrED17iNvSKDKjmWvc09lPj2vQ79SHklvTm+XjlX/cy+4PkyPyXBvvlf/y9AZjlJvr/BZHlA/pSATHlSPwX/H7k4Pne+z/kZvd2AGblkfQx/4Pmi/mD7DnesvnO8RThc/yb7OfdVPzW8fDgQ/y/9gjj0Pmi9vviAv3PCRPmO/oxCazlGfzXFj4rA/xtFiwrTfziFj0rT/xsFkIr2fu1FTkrQPy4FVUrm/xyFmYrn/zGFYUrjfzqFlUrjPx7Fn4t8vuYFlYtgPwHF9IsE/weF8wsZvumFgQtqvsnF6MsD/xzF14sz/tiF2IsWPxjF0sscPtjFwYsG/sYFyEsgftfF94rCfsDF+Arp/qTFlEshfpwFv4rGPvoFqErlfpAFrYrmftYF7Er+PqhFqgsVvslF2QsnvtyFzMsGfvlFUsrdPvFFTQrgfugFkcrvvuAFi0rB/zzFjArCvwnF14rxvtAF4QrRfvEFmwryvoQFnQryfznFoMr3Px3Fpwr6PzWFccrCP1/FtorHP3jFRcs4/zWFr4r6vwCF88rFv2XFh0sOP34FXksBv26FmYsNv0bFugsyfwoF/srBP1LFlAt1/zjFqosmPxIFycs1PuLFw4sCvyBF+krPvxsF8UrdvxWF6EraPwfF14rqvwxF4srQvwWFzkrgfpNFKgr5/ofFHorwPoFFWkrKfvfFFErWfsJFG4rnfvNFEorSvrZE+Qrt/qrE60rJvuUE50r3vsVFJArHPzZFGwrUfxMFOYrjPz9FK8rm/ujE8crAPzcEyEsmPyHFEws3/wcFQMswfyrFMUsE/0uFWksOfwhFJAsXPxKFBQt7vy1FFctOv1AFeYsK/2mFAYuSv1cFXktofw/FK0t/PwSFGIuKv2zFKcuGf2KFQEutvzyFOIukvzGFTouDv0cFPsupPxgFDEv3Ps6FZguzfv6FQEuDPtLFQ4uGfsIFoUt3/ueFAMvH/ufFJEudfo9FYYtmfr6FQgtEPojFRMtNvrkFZ8sjPqJFBUuH/pzFJ4t5Pn1FKgsDPq1FTws9Pm9FEUsI/p4Fecr3PlZFCgt0/kzFKosI/qEFOgrZ/o6FZ8r6fkKFDcsouOnDXAHmePNDfsGKORuDhYHNONvDaoHaeS/DlgIsuQhDmAHtuQCDloGZOQnDhoF7uOnDjsE+N9aKk7+ZOAFLIwCjeDWJqL/yODvJ+gC1uCFJM4AHuFdJUUD7uD2Itz+leDOJAf9KeC6J376K+E2Ij4Cr/mev77Ov/kfuM3UG/2Nv8jOOv0RuNjULfxMA94mRfw3BbYnc/07AwUndv02BdMn6/kABSEnF/slBX0n7fpLA5omqfk7AzQmx/fdBCAmyvjeBKEmYfgyA7MlLfdKAzMlYvUgBG8kXPZhBWolJPaSA8Uk9PYHBbklwPTQBSAk1PVqBhol9PTnBDgkBfbcBTMlt/SZB0IktPWRBzAlrPS9BiYkt/UBBxwlRfXWCK4kHPZrCIMl6PRPCHAk1PUMCFElgvZuCWElLvfaCDsm0PUyCf8kkfatCNElrfgTCTsn4/f3CLsmUvePCdolMfisCVcmAvrrCRMnUfpACfEnE/nMCcAmevksCaMnG/wKCm8nOfxDCVIoA/v/CUonOvtICSwoT/04CWcoSv0HCoEn8+D4IkMFJuGxIpUFU+HbIjUFV+GlIrkFROHjIq0E";
window.VoceMesh.idx = "AAABAAIAAQADAAIAAQAEAAMABAAFAAMAAwAFAAYABQAHAAYAAgADAAgAAwAGAAgACAAJAAIACQAKAAIACQALAAoACwAMAAoACgAMAA0ADAAOAA0AAgAKAAAACgANAAAACwAPAAwADwAQAAwADwARABAAEQASABAAEAASABMAEgAUABMADAAQAA4AEAATAA4AFQAWABcAFgAYABcAFgAZABgAGQAaABgAGAAaABsAGgAcABsAFwAYAB0AGAAbAB0AHQAbAB4AGwAfAB4AGwAcAB8AHAAgAB8AHwAgABIAIAAUABIAHgAfABEAHwASABEAIQAiACMAIgAkACMAIgAlACQAJQAmACQAJAAmACcAJgAoACcAIwAkACkAJAAnACkAKAAqACcAKgArACcAKgAsACsALAAtACsAKwAtAC4ALQAvAC4AJwArACkAKwAuACkALAAwAC0AMAAxAC0AMAAyADEAMgAzADEAMQAzADQAMwA1ADQALQAxAC8AMQA0AC8AMgA2ADMANgA3ADMANgA4ADcAOAA5ADcANwA5ADoAOQA7ADoAMwA3ADUANwA6ADUAOwA5ADwAOQA9ADwAOQA4AD0AOAA+AD0APQA+AD8APgBAAD8APAA9AEEAPQA/AEEAQQA/AEIAPwBDAEIAPwBAAEMAQABEAEMAQwBEAEUARABGAEUAQgBDAEcAQwBFAEcASABJAEoASQBLAEoASQBMAEsATABNAEsASwBNAEUATQBHAEUASgBLAEYASwBFAEYATgBPAFAATwBRAFAATwBSAFEAUgBTAFEAUQBTAEkAUwBMAEkAUABRAEgAUQBJAEgATgBUAE8AVABVAE8AVABWAFUAVwBYAFkAVQBaAFsAWABcAF0ATwBVAFIAVQBbAFIAXgBfAGAAXwBhAGAAXwBiAGEAYgBjAGEAYQBjAGQAYwBlAGQAYABhAGYAYQBkAGYAZwBoAGkAaABqAGkAaABrAGoAawBsAGoAagBsAF8AbABiAF8AaQBqAF4AagBfAF4AVwBtAFgAbQBuAFgAbQBrAG4AawBoAG4AbgBoAG8AaABnAG8AWABuAFwAbgBvAFwAIQBwACIAcABxACIAcAByAHEAcgBzAHEAcQBzAHQAcwB1AHQAIgBxACUAcQB0ACUAdgB3AHgAdwB5AHgAdwB6AHkAegB7AHkAeQB7AHwAewB9AHwAeAB5AH4AeQB8AH4AegB/AHsAfwCAAHsAfwCBAIAAgQCCAIAAgACCAIMAggCEAIMAewCAAH0AgACDAH0AhQCGAIcAhgCIAIcAhgCBAIgAgQB/AIgAiAB/AIkAfwB6AIkAhwCIAIoAiACJAIoAiwCMAI0AjACOAI0AjACKAI4AigCJAI4AjgCJAHcAiQB6AHcAjQCOAHYAjgB3AHYAjwCQAJEAkACSAJEAkACTAJIAkwCUAJIAkgCUAIwAlACKAIwAkQCSAIsAkgCMAIsAkwCVAJQAlQCWAJQAlQCXAJYAlwCYAJYAlgCYAIcAmACFAIcAlACWAIoAlgCHAIoAlwCZAJgAmQCaAJgAmQCbAJoAmwCcAJoAmgCcAJ0AnACeAJ0AmACaAIUAmgCdAIUAnwCgAKEAoACiAKEAoACbAKIAmwCZAKIAogCZAJUAmQCXAJUAoQCiAJMAogCVAJMAnwChAKMAoQCkAKMAoQCTAKQAkwCQAKQApACQAKUAkACPAKUAowCkAKYApAClAKYApwCoAKkAqACqAKkAqACrAKoAqwCsAKoAqgCsAKMArACfAKMAqQCqAKYAqgCjAKYAngCcAK0AnACuAK0AnACbAK4AmwCgAK4ArgCgAKwAoACfAKwArQCuAKsArgCsAKsArwCwALEAsACyALEAsACzALIAswC0ALIAsgC0AK0AtACeAK0AsQCyAKsAsgCtAKsAtQC2ALcAtgC4ALcAtgCvALgArwCxALgAuACxAKgAsQCrAKgAtwC4AKcAuACoAKcAfgB8ALkAfAC6ALkAfAB9ALoAfQC7ALoAugC7ALwAuwC9ALwAuQC6AL4AugC8AL4AvgC8AL8AvADAAL8AvAC9AMAAvQDBAMAAwADBAMIAwQDDAMIAvwDAAMQAwADCAMQAxADCAMUAwgDGAMUAwgDDAMYAwwDHAMYAxgDHAMgAxwDJAMgAxQDGAGYAxgDIAGYAygDLAMwAywDNAMwAywDOAM0AzgDPAM0AzQDPAG8AzwBcAG8AzADNAGcAzQBvAGcA0ADRANIA0QDTANIA0QDUANMA1ADVANMA0wDVAMsA1QDOAMsA0gDTAMoA0wDLAMoAhQDWANcA1gDYANcA1gDUANgA1ADRANgA1wDYANAA2ADRANAA1ADZANUA2QDaANUA2QCzANoAswCwANoA2gCwANsAsACvANsA1QDaAM4A2gDbAM4AzgDbAM8A2wDcAM8A2wCvANwArwC2ANwA3AC2AF0AtgC1AF0AzwDcAFwA3ABdAFwAswDZAN0A2QDeAN0A2QDUAN4A1ADWAN4A3QDeAIUA3gDWAIUAhQDXAIYA1wDfAIYA1wDQAN8A0ADgAN8AhgDfAIEA3wDgAIEA0ADhAOAA4QDiAOAA4QCEAOIAhACCAOIA4ADiAIEA4gCCAIEA0ADjAOEA4wDkAOEA4wDlAOQA5QDmAOQA4QDkAIQA5ADmAIQA5wDoAOkA6ADqAOkA6ADlAOoA5QDjAOoA6gDjANIA4wDQANIA6QDqAMoA6gDSAMoA5wDpAOsA6QDsAOsA6QDKAOwAygDMAOwA7ADMAGkAzABnAGkA6wDsAF4A7ABpAF4A7QDuAO8A7gDwAO8A7gDlAPAA5QDoAPAA8ADoAPEA6ADnAPEA7wDwAMkA8ADxAMkAyQDxAMgA8QDyAMgA8QDnAPIA5wDrAPIA8gDrAGAA6wBeAGAAyADyAGYA8gBgAGYAwwDzAMcA8wD0AMcA8wD1APQA9QD2APQA9AD2AO8A9gDtAO8AxwD0AMkA9ADvAMkA5QDuAOYA7gD3AOYA7gDtAPcA7QD4APcA5gD3AIQA9wD4AIQAvQD5AMEA+QD6AMEA+QD7APoA+wD8APoA+gD8APMA/AD1APMAwQD6AMMA+gDzAMMA7QD2APgA9gD9APgA9gD1AP0A9QD8AP0A/QD8AP4A/AD7AP4A+AD9AIQA/QD+AIQAhAD+AIMA/gD/AIMA/gD7AP8A+wD5AP8A/wD5ALsA+QC9ALsAgwD/AH0A/wC7AH0AngC0AJ0AtAAAAZ0AtACzAAABswDdAAABnQAAAYUAAAHdAIUAAQECAQMBAgEEAQMBAgEFAQQBBQEGAQQBBAEGAQcBBgEIAQcBAwEEAQkBBAEHAQkBCgELAQwBCwENAQwBCwEOAQ0BDgEPAQ0BDQEPARABDwERARABDAENARIBDQEQARIBEwEUARUBFAEWARUBFAEXARYBFwEYARYBFgEYARkBGAEaARkBFQEWARsBFgEZARsBHAEdAR4BHQEfAR4BHQEaAR8BGgEgAR8BHwEgASEBIAEiASEBHgEfASMBHwEhASMBJAElASYBJQEnASYBJQEOAScBDgEoAScBJwEoASkBKAEqASkBJgEnASsBJwEpASsBCgEsAQsBLAEtAQsBLAEuAS0BLgEvAS0BLQEvASgBLwEqASgBCwEtAQ4BLQEoAQ4BKgEwASkBMAExASkBMAEyATEBMgEzATEBMQEzATQBMwE1ATQBKQExASsBMQE0ASsBLgE2AS8BNgE3AS8BNgE4ATcBOAE5ATcBNwE5ATABOQEyATABLwE3ASoBNwEwASoBOgE7ATwBOwE9ATwBOwE4AT0BOAE2AT0BPAE9AS4BPQE2AS4BNQEzAT4BMwE/AT4BMwEyAT8BMgFAAT8BPwFAAUEBQAFCAUEBPgE/AUMBPwFBAUMBRAFFAUYBRQFHAUYBRQFIAUcBSAFJAUcBRwFJAUoBSQFLAUoBRgFHAUwBRwFKAUwBTQFOAU8BTgFQAU8BTgFIAVABSAFFAVABUAFFAVEBRQFEAVEBTwFQAVIBUAFRAVIBRAFGAVMBRgFUAVMBRgFMAVQBTAFVAVQBVAFVAVYBVQEJAVYBUwFUAVcBVAFWAVcBCQEHAVYBBwFYAVYBBwEIAVgBCAFZAVgBWAFZAVoBWQFbAVoBVgFYAVcBWAFaAVcBWwFZAVwBWQFdAVwBWQEIAV0BCAFeAV0BXQFeASYBXgEkASYBXAFdASsBXQEmASsBXwFgAWEBYAFiAWEBYAFbAWIBWwFcAWIBYgFcATQBXAErATQBYQFiATUBYgE0ATUBVwFaAWMBWgFkAWMBWgFbAWQBWwFgAWQBZAFgAWUBYAFfAWUBYwFkAWYBZAFlAWYBRAFTAVEBUwFnAVEBUwFXAWcBVwFjAWcBZwFjAWgBYwFmAWgBUQFnAVIBZwFoAVIBTQFPAWkBTwFqAWkBTwFSAWoBUgFrAWoBagFrAWwBawFtAWwBaQFqAW4BagFsAW4BUgFoAWsBaAFvAWsBaAFmAW8BZgFwAW8BbwFwAXEBcAFyAXEBawFvAW0BbwFxAW0BZgFlAXABZQFzAXABZQFfAXMBXwF0AXMBcwF0AXUBdAF2AXUBcAFzAXIBcwF1AXIBXwFhAXQBYQF3AXQBYQE1AXcBNQE+AXcBdwE+AXgBPgFDAXgBdAF3AXYBdwF4AXYBJAF5ASUBeQF6ASUBeQF7AXoBewF8AXoBegF8AQ8BfAERAQ8BJQF6AQ4BegEPAQ4BCAEGAV4BBgF9AV4BBgEFAX0BBQF+AX0BfQF+AXkBfgF7AXkBXgF9ASQBfQF5ASQBewF+AX8BfgGAAX8BfgEFAYABBQGBAYABgAGBAYIBgQGDAYIBfwGAAYQBgAGCAYQBhAGFAX8BhQGGAX8BhQGHAYYBhwGIAYYBhgGIAXwBiAERAXwBfwGGAXsBhgF8AXsBhwGJAYgBiQGKAYgBiQEbAYoBGwGLAYoBigGLARABiwESARABiAGKAREBigEQAREBjAGNAY4BjQGPAY4BjQGHAY8BhwGFAY8BjwGFAZABhQGEAZABjgGPAZEBjwGQAZEBhAGCAZABggGSAZABggGDAZIBgwGTAZIBkgGTAZQBkwGVAZQBkAGSAZEBkgGUAZEBlgGXAZgBlwGZAZgBlwGaAZkBmgGbAZkBmQGbAZwBmwGdAZwBmAGZAZ4BmQGcAZ4BnQGfAZwBnwGgAZwBnwGhAaABoQGiAaABoAGiAaMBogGkAaMBnAGgAZ4BoAGjAZ4BpQGmAacBpgGoAacBpgGpAagBqQGqAagBqAGqAasBqgGsAasBpwGoAa0BqAGrAa0BrgGvAbABrwGxAbABrwGyAbEBsgGzAbEBsQGzAbQBswGlAbQBsAGxAbUBsQG0AbUBtgG3AbgBtwG5AbgBtwGyAbkBsgGvAbkBuQGvAboBrwGuAboBuAG5AbsBuQG6AbsBvAG9Ab4BvQG/Ab4BvQG2Ab8BtgG4Ab8BvwG4AcABuAG7AcABvgG/AcEBvwHAAcEBAQEDAcIBAwHDAcIBAwEJAcMBCQFVAcMBwwFVAcQBVQFMAcQBwgHDAcUBwwHEAcUBxQHEAcYBxAHHAcYBxAFMAccBTAFKAccBxwFKAcgBSgFLAcgBxgHHAckBxwHIAckBBQECAYEBAgHKAYEBAgEBAcoBAQHLAcoBygHLAcwBywHNAcwBgQHKAYMBygHMAYMBzQHOAc8BzgHQAc8BzgG8AdABvAG+AdAB0AG+AdEBvgHBAdEBzwHQAdIB0AHRAdIBgwHMAZMBzAHTAZMBzAHNAdMBzQHPAdMB0wHPAdQBzwHSAdQBkwHTAZUB0wHUAZUBAQHCAcsBwgHVAcsBwgHFAdUBxQHWAdUB1QHWAc4B1gG8Ac4BywHVAc0B1QHOAc0BxQHGAdYBxgHXAdYBxgHJAdcByQHYAdcB1wHYAb0B2AG2Ab0B1gHXAbwB1wG9AbwByQHZAdgB2QHaAdgB2QHbAdoB2wHcAdoB2gHcAbcB3AGyAbcB2AHaAbYB2gG3AbYBsgHcAbMB3AHdAbMB3AHbAd0B2wHeAd0B3QHeAaYB3gGpAaYBswHdAaUB3QGmAaUB3wHgAeEB4AHiAeEB4AFLAeIBSwFJAeIB4gFJAU4BSQFIAU4B4QHiAU0B4gFOAU0B4wHkAeUB5AHmAeUB5AHfAeYB3wHhAeYB5gHhAWkB4QFNAWkB5QHmAW4B5gFpAW4B2wHZAecB2QHoAecB2QHJAegByQHIAegB6AHIAeAByAFLAeAB5wHoAd8B6AHgAd8B6QHqAesB6gHsAesB6gHfAewB3wHkAewB7AHkAe0B5AHjAe0B6wHsAe4B7AHtAe4BoQHvAaIB7wHwAaIB7wHpAfAB6QHrAfAB8AHrAfEB6wHuAfEBogHwAaQB8AHxAaQB6QHyAeoB8gHzAeoB8gGpAfMBqQHeAfMB8wHeAecB3gHbAecB6gHzAd8B8wHnAd8BoQH0Ae8B9AH1Ae8B9AGsAfUBrAGqAfUB9QGqAfIBqgGpAfIB7wH1AekB9QHyAekBnQH2AZ8B9gH3AZ8B9gH4AfcB+AH5AfcB9wH5AfQB+QGsAfQBnwH3AaEB9wH0AaEBmgH6AZsB+gH7AZsB+gH8AfsB/AH9AfsB+wH9AfYB/QH4AfYBmwH7AZ0B+wH2AZ0BIwEhAf4BIQH/Af4BIQEiAf8BIgEAAv8B/wEAAgECAAICAgEC/gH/AQMC/wEBAgMCIgEgAQQCIAEFAgQCIAEaAQUCGgEYAQUCBQIYAQYCGAEXAQYCBAIFAgcCBQIGAgcCFwEIAgYCCAIJAgYCCAIKAgkCCgILAgkCCQILAgwCCwINAgwCBgIJAgcCCQIMAgcCIgEEAgACBAIOAgACBAIHAg4CBwIPAg4CDgIPAhACDwIRAhACAAIOAgICDgIQAgICDQISAgwCEgITAgwCEgIUAhMCFAIVAhMCEwIVAg8CFQIRAg8CDAITAgcCEwIPAgcCFgIXAhgCFwIZAhgCFwIKAhkCCgIIAhkCGQIIAhQBCAIXARQBGAIZAhMBGQIUARMBGgIbAhwCGwIdAhwCGwIWAh0CFgIYAh0CHQIYAh4CGAITAR4CHAIdAh8CHQIeAh8CDQILAiACCwIhAiACCwIKAiECCgIXAiECIQIXAiICFwIWAiICIAIhAiMCIQIiAiMCJAIlAiYCJQInAiYCJQIUAicCFAISAicCJwISAiACEgINAiACJgInAiMCJwIgAiMCKAIpAioCKQIrAioCKQIsAisCLAItAisCKwItAi4CLQIvAi4CKgIrAvwBKwIuAvwB/AEuAv0BLgIwAv0BLgIvAjACLwIxAjACMAIxAjICMQIzAjIC/QEwAvgBMAIyAvgBrQGrATQCqwE1AjQCqwGsATUCrAH5ATUCNQL5ATIC+QH4ATICNAI1AjMCNQIyAjMCtQG0ATYCtAE3AjYCtAGlATcCpQGnATcCNwKnATgCpwGtATgCNgI3AjkCNwI4AjkCOQI4AjoCOAI7AjoCOAKtATsCrQE0AjsCOwI0AjwCNAIzAjwCOgI7Aj0COwI8Aj0CMwIxAjwCMQI+AjwCMQIvAj4CLwI/Aj4CPgI/AkACPwJBAkACPAI+Aj0CPgJAAj0CLwItAj8CLQJCAj8CLQIsAkICLAJDAkICQgJDAkQCQwJFAkQCPwJCAkECQgJEAkECAgIQAkYCEAJHAkYCEAIRAkcCEQJIAkcCRwJIAkMCSAJFAkMCRgJHAiwCRwJDAiwCKAJJAikCSQJKAikCSQIDAkoCAwIBAkoCSgIBAkYCAQICAkYCKQJKAiwCSgJGAiwCSwJMAk0CTAJOAk0CTAIjAU4CIwH+AU4CTgL+AU8C/gEDAk8CTQJOAlACTgJPAlACUQJSAlMCUgJUAlMCUgJQAlQCUAJPAlQCVAJPAkkCTwIDAkkCUwJUAigCVAJJAigCUQJTAlUCUwJWAlUCUwIoAlYCKAIqAlYCVgIqAvoBKgL8AfoBVQJWApoBVgL6AZoBlgFXApcBVwJYApcBVwJZAlgCWQJaAlgCWAJaAlUCWgJRAlUClwFYApoBWAJVApoBOgE8AVsCPAFcAlsCPAEuAVwCLgEsAVwCXAIsAV0CLAEKAV0CWwJcAl4CXAJdAl4CEgFfAgwBXwJgAgwBXwIcAWACHAFhAmACYAJhAl0CYQJeAl0CDAFgAgoBYAJdAgoBHAEeAWECHgFiAmECHgEjAWICIwFMAmICYgJMAmMCTAJLAmMCYQJiAl4CYgJjAl4CZAJlAmYCZQJnAmYCZQJoAmcCaAJpAmcCZwJpAmoCaQJrAmoCZgJnAmwCZwJqAmwCbQJuAm8CbgJwAm8CbgJxAnACcQJyAnACcAJyAnMCcgJ0AnMCbwJwAnUCcAJzAnUCdgJ3AngCdwJ5AngCdwJtAnkCbQJvAnkCeQJvAnoCbwJ1AnoCeAJ5AnsCeQJ6AnsCfAJ9An4CfQJ/An4CfQJ2An8CdgJ4An8CfwJ4AoACeAJ7AoACfgJ/AoECfwKAAoECggKDAoQCgwKFAoQCgwKGAoUChgKHAoUChQKHAn4ChwJ8An4ChAKFAoEChQJ+AoECiAKJAooCiQKLAooCiQJkAosCZAJmAosCiwJmAowCZgJsAowCigKLAo0CiwKMAo0CcQKOAnICjgKPAnICjgKIAo8CiAKKAo8CjwKKApACigKNApACcgKPAnQCjwKQAnQCkQKSApMCkgKUApMCkgKVApQClQKWApQClAKWApcClgKYApcCkwKUApkClAKXApkCmgKbApwCmwKdApwCmwKeAp0CngKfAp0CnQKfAqACnwKhAqACnAKdAqICnQKgAqICowKkAqUCpAKmAqUCpAKnAqYCpwKoAqYCpgKoApsCqAKeApsCpQKmApoCpgKbApoCqQKqAqsCqgKsAqsCqgKnAqwCpwKkAqwCrAKkAq0CpAKjAq0CqwKsAq4CrAKtAq4CaAKvAmkCrwKwAmkCrwKpArACqQKrArACsAKrArECqwKuArECaQKwAmsCsAKxAmsCbAJqArICagKzArICagJrArMCawK0ArMCswK0ArUCtAK2ArUCsgKzArcCswK1ArcCdQJzArgCcwK5ArgCcwJ0ArkCdAK6ArkCuQK6ArsCugK8ArsCuAK5Ar0CuQK7Ar0CewJ6Ar4CegK/Ar4CegJ1Ar8CdQK4Ar8CvwK4AsACuAK9AsACvgK/AsECvwLAAsECgQKAAsICgALDAsICgAJ7AsMCewK+AsMCwwK+AsQCvgLBAsQCwgLDAsUCwwLEAsUCxgLHAsgCxwLJAsgCxwKCAskCggKEAskCyQKEAsIChAKBAsICyALJAsUCyQLCAsUCjQKMAsoCjALLAsoCjAJsAssCbALMAssCygLLAs0CywLMAs0CdAKQAroCkALOAroCkAKNAs4CjQLKAs4CzgLKAs8CygLNAs8CugLOArwCzgLPArwC0ALRAtIC0QLTAtIC0QKRAtMCkQKTAtMC0wKTAtQCkwKZAtQC0gLTAtUC0wLUAtUC1gLXAtgC1wLZAtgC1wKaAtkCmgKcAtkC2QKcAtoCnAKiAtoC2ALZAtsC2QLaAtsC3ALdAt4C3QLfAt4C3QKjAt8CowKlAt8C3wKlAtcCpQKaAtcC3gLfAtYC3wLXAtYCrgKtAuACrQLhAuACrQKjAuECowLdAuEC4QLdAuIC3QLcAuIC4ALhAuMC4QLiAuMCawKxArQCsQLkArQCsQKuAuQCrgLgAuQC5ALgAuUC4ALjAuUCtALkArYC5ALlArYC5gLnAugC5wLpAugC5wLqAukC6gLrAukC6QLrApIC6wKVApIC6ALpApEC6QKSApEC5gLoAuwC6ALtAuwC6AKRAu0CkQLuAu0C7ALtAu8C7QLuAu8CJALwAiUC8ALxAiUC8ALyAvEC8gLzAvEC8QLzAhUC8wIRAhUCJQLxAhQC8QIVAhQCEQLzAkgC8wL0AkgC8wLyAvQC8gL1AvQCSAL0AkUC9AL1AkUC8gL2AvUC9gL3AvUC9gL4AvcC+AL5AvcC9QL3AkUC9wL5AkUC6gLnAvoC5wL7AvoC5wLmAvsC5gL8AvsC+wL8Av0C/AL+Av0C+gL7Av8C+wL9Av8C/wL9AgAD/QIBAwAD/QL+AgED/gICAwEDAQMCA6ACAgOiAqACAAMBA6ECAQOgAqEC7wIDA+wCAwMEA+wCAwP+AgQD/gL8AgQD7AIEA+YCBAP8AuYC2wLaAgUD2gIGAwUD2gKiAgYDogICAwYDBgMCAwMDAgP+AgMDBQMGAwcDBgMDAwcDIwIiAggDIgIJAwgDIgIWAgkDFgIbAgkDCQMbAgoDGwIaAgoDCAMJAwsDCQMKAwsDDAMNAw4DDQMPAw4DDQMkAg8DJAImAg8DDwMmAggDJgIjAggDDgMPAwsDDwMIAwsD+AL2AhAD9gIRAxAD9gLyAhED8gLwAhEDEQPwAg0D8AIkAg0DEAMRAwwDEQMNAwwDDAMOAxIDDgMTAxIDDgMLAxMDCwMUAxMDEwMUAxUDFAMWAxUDEgMTAxcDEwMVAxcDCwMKAxQDCgMYAxQDCgMaAhgDGgIcAhgDGAMcAhkDHAIfAhkDFAMYAxYDGAMZAxYDDAMSAxADEgMaAxADEgMXAxoDFwMbAxoDEAMaA/gCGgMbA/gCGwEZAYsBGQEcA4sBGQEaARwDGgEdARwDHAMdAV8CHQEcAV8CiwEcAxIBHANfAhIBjAEdA40BHQMeA40BHQMfAx4DHwMgAx4DHgMgA4kBIAMbAYkBjQEeA4cBHgOJAYcBHwMhAyADIQMiAyADIQMfAiIDHwIeAiIDIgMeAhUBHgITARUBIAMiAxsBIgMVARsBmAIjA5cCIwMkA5cCIwMlAyQDJQMmAyQDJAMmAycDJgMoAycDlwIkA5kCJAMnA5kCJQMpAyYDKQMqAyYDKQOGAioDhgKDAioDKgODAisDgwKCAisDJgMqAygDKgMrAygD1QLUAiwD1AItAywD1AKZAi0DmQInAy0DLAMtAygDLQMnAygDxgIuA8cCLgMvA8cCLgMwAy8DMAMsAy8DLwMsAysDLAMoAysDxwIvA4ICLwMrA4ICMQMyAzMDMgM0AzMDMgM1AzQDNQM2AzQDNAM2A00CNgNLAk0CMwM0A1ACNANNAlACWQI3A1oCNwM4A1oCNwMxAzgDMQMzAzgDOAMzA1ICMwNQAlICWgI4A1ECOANSAlECNQM5AzYDOQM6AzYDOQM7AzoDOwM8AzoDOgM8A2MCPANeAmMCNgM6A0sCOgNjAksCPQM+Az8DPgNAAz8DPgNCAUADQgFAAUADQANAATkBQAEyATkBPwNAAzgBQAM5ATgBQQNCA0MDQgNEA0MDQgM9A0QDPQM/A0QDRAM/AzsBPwM4ATsBQwNEAzoBRAM7AToBOwNFAzwDRQNGAzwDRQNBA0YDQQNDA0YDRgNDA1sCQwM6AVsCPANGA14CRgNbAl4CRwNIA0kDSANKA0kDSANLA0oDSwNMA0oDSgNMA0EBTANDAUEBSQNKA0IBSgNBAUIBTQNOA08DTgNQA08DTgNRA1ADUQNSA1ADUANSA2wBUgNuAWwBTwNQA20BUANsAW0BUwNUA1UDVANWA1UDVANNA1YDTQNPA1YDVgNPA3EBTwNtAXEBVQNWA3IBVgNxAXIBVwNYA1kDWANaA1kDWANTA1oDUwNVA1oDWgNVA3UBVQNyAXUBWQNaA3YBWgN1AXYBSwNbA0wDWwNcA0wDWwNXA1wDVwNZA1wDXANZA3gBWQN2AXgBTANcA0MBXAN4AUMBUQNdA1IDXQNeA1IDXQNfA14DXwNgA14DXgNgA+UBYAPjAeUBUgNeA24BXgPlAW4BYQNiA2MDYgNkA2MDYgNlA2QDZQNmA2QDZANmAzIDZgM1AzIDYwNkAzEDZAMyAzEDZQNnA2YDZwNoA2YDZwNpA2gDaQNqA2gDaANqAzkDagM7AzkDZgNoAzUDaAM5AzUDawNsA20DbANuA20DbANHA24DRwNJA24DbgNJAz4DSQNCAT4DbQNuAz0DbgM+Az0DbwNwA3EDcANyA3EDcANrA3IDawNtA3IDcgNtA0IDbQM9A0IDcQNyA0EDcgNCA0EDaQNzA2oDcwN0A2oDcwNvA3QDbwNxA3QDdANxA0UDcQNBA0UDagN0AzsDdANFAzsDdQN2A3cDdgN4A3cDdgN5A3gDeQN6A3gDeAN6A3sDegN8A3sDdwN4A30DeAN7A30DfgN/A4ADfwOBA4ADfwN1A4EDdQN3A4EDgQN3A4IDdwN9A4IDgAOBA4MDgQOCA4MDXwOEA2ADhAOFA2ADhAOGA4UDhgOHA4UDhQOHA4gDhwOJA4gDYAOFA+MBhQOIA+MBhgOKA4cDigOLA4cDigN+A4sDfgOAA4sDiwOAA4wDgAODA4wDhwOLA4kDiwOMA4kDeQONA3oDjQOOA3oDjQOPA44DjwOQA44DjgOQA5EDkAOSA5EDegOOA3wDjgORA3wDjwOTA5ADkwOUA5ADkwNhA5QDYQNjA5QDlANjA5UDYwMxA5UDkAOUA5IDlAOVA5IDlgOXA5gDlwOZA5gDlwOaA5kDmgObA5kDmQObA1cCmwNZAlcCmAOZA5YBmQNXApYBmgOcA5sDnAOdA5sDnAMxA50DMQM3A50DmwOdA1kCnQM3A1kCngOfA6ADnwOhA6ADnwOWA6EDlgOYA6EDoQOYA5gBmAOWAZgBoAOhA54BoQOYAZ4BogOjA6QDowOlA6QDowOeA6UDngOgA6UDpQOgA6MBoAOeAaMBpAOlA6QBpQOjAaQBpgOnA6gDpwOpA6gDpwOiA6kDogOkA6kDqQOkA/EBpAOkAfEBqAOpA+4BqQPxAe4B4wGqA+0BqgOrA+0BqgOmA6sDpgOoA6sD7QGrA+4BqwOoA+4BmgOsA5wDrAOtA5wDrAOSA60DkgOVA60DnAOtAzEDrQOVAzEDmgOXA6wDlwOuA6wDlwOWA64DlgOvA64DrgOvA5EDrwN8A5EDrAOuA5IDrgORA5IDlgOfA68DnwOwA68DnwOeA7ADngOxA7ADsAOxA3sDsQN9A3sDrwOwA3wDsAN7A3wDngOjA7EDowOyA7EDowOiA7IDogOzA7IDsgOzA4IDswODA4IDsQOyA30DsgOCA30DpgO0A6cDtAO1A6cDtAOJA7UDiQOMA7UDtQOMA7MDjAODA7MDpwO1A6IDtQOzA6IDpgOqA7QDqgO2A7QDqgPjAbYD4wGIA7YDtAO2A4kDtgOIA4kDtwO4A7kDuAO6A7kDuAO7A7oDuwO8A7oDugO8A70DvAO+A70DuQO6A78DugO9A78DuwPAA7wDwAPBA7wDwAPCA8EDwgPDA8EDwQPDA8QDwwPFA8QDvAPBA74DwQPEA74DwgPGA8MDxgPHA8MDxgPIA8cDyAPJA8cDxwPJA8oDyQPLA8oDwwPHA8UDxwPKA8UDyAPMA8kDzAPNA8kDzAPOA80DzgPPA80DzQPPA9ADzwPRA9ADyQPNA8sDzQPQA8sD0gPTA9QD0wPVA9QD0wPWA9UD1gPXA9UD1QPXA88D1wPRA88D1APVA84D1QPPA84D0gPYA9MD2APZA9MD2APaA9kD2gPbA9kD2QPbA9wD2wPdA9wD0wPZA9YD2QPcA9YD3gPfA+AD3wPhA+AD3wPiA+ED4gPjA+ED4QPjA9cD4wPRA9cD4APhA9YD4QPXA9YD3QPkA9wD5APlA9wD5APmA+UD5gPnA+UD5QPnA+AD5wPeA+AD3APlA9YD5QPgA9YD6APpA+oD6QPrA+oD6QPsA+sD7APtA+sD6wPtA9QD7QPSA9QD6gPrA84D6wPUA84D7gPvA/AD7wPxA/AD7wPoA/ED6APqA/ED8QPqA8wD6gPOA8wD8APxA8gD8QPMA8gDywPQA/ID0APzA/ID0APRA/MD0QPjA/MD8wPjA/QD4wPiA/QD8gPzA/UD8wP0A/UD9QP2A/ID9gP3A/ID9gP4A/cD+AP5A/cD9wP5A8oD+QPFA8oD8gP3A8sD9wPKA8sD+gP7A/wD+wP9A/wD+wP+A/0D/gP/A/0D/QP/AwAE/wMBBAAE/AP9AwIE/QMABAIEAQQDBAAEAwQEBAAEAwQFBAQEBQQGBAQEBAQGBAcEBgQIBAcEAAQEBAIEBAQHBAIECQQKBAsECgQMBAsECgTuAwwE7gPwAwwEDATwA8YD8APIA8YDCwQMBMIDDATGA8IDDQQOBA8EDgQQBA8EDgQRBBAEEQQSBBAEEAQSBAoEEgTuAwoEDwQQBAkEEAQKBAkEEQQTBBIEEwQUBBIEEwQVBBQEFQQWBBQEFAQWBO8DFgToA+8DEgQUBO4DFATvA+4DFwQYBBkEGAQaBBkEGAQNBBoEDQQPBBoEGgQPBBsEDwQJBBsEGQQaBBwEGgQbBBwEHQQeBB8EHgQgBB8EHgQhBCAEIQQiBCAEIAQiBBkEIgQXBBkEHwQgBBwEIAQZBBwEHQQfBCMEHwQkBCMEHwQcBCQEHAQlBCQEJAQlBLgDJQS7A7gDIwQkBLcDJAS4A7cDHAQbBCUEGwQmBCUEGwQJBCYECQQLBCYEJgQLBMADCwTCA8ADJQQmBLsDJgTAA7sDxQP5A8QD+QMnBMQD+QP4AycE+AMoBCcEJwQoBCkEKAQqBCkExAMnBL4DJwQpBL4DvgMpBL0DKQQrBL0DKQQqBCsEKgQsBCsEKwQsBC0ELAQuBC0EvQMrBL8DKwQtBL8DLwQwBDEEMAQyBDEEMAT6AzIE+gP8AzIEMQQyBAIEMgT8AwIEMwQ0BDUENAQ2BDUENAQ3BDYENwQ4BDYENgQ4BDkEOAQ6BDkENQQ2BDsENgQ5BDsEPAQ9BD4EPQQ/BD4EPQRABD8EQARBBD8EPgQ/BEIEPwRBBEIEQwREBEUERARGBEUERARHBEYERwRIBEYERgRIBEkESARKBEkERQRGBEsERgRJBEsETARNBE4ETQRPBE4ETQRLBE8ESwRJBE8ETwRJBFAESQRKBFAETgRPBFEETwRQBFEEOgRSBDkEUgRTBDkEUgRMBFMETAROBFMEUwROBFQETgRRBFQEOQRTBDsEUwRUBDsEVQRWBFcEVgRYBFcEVgRZBFgEWQRaBFgEWARaBFsEWgRcBFsEVwRYBF0EWARbBF0EXQRbBF4EWwRfBF4EWwRcBF8EXARgBF8EXwRgBGEEYARiBGEEXgRfBGMEXwRhBGMECARkBAcEZARlBAcEZARmBGUEZgRnBGUEZQRnBGgEZwQ8BGgEBwRlBAIEZQRoBAIEPARpBD0EaQRqBD0EaQRrBGoEawRsBGoEPQRqBEAEagRsBEAENwRtBDgEbQRuBDgEbQRvBG4EbwRwBG4EbgRwBHEEcARyBHEEOARuBDoEbgRxBDoEcgRzBHEEcwR0BHEEcwR1BHQEdQR2BHQEdAR2BFIEdgRMBFIEcQR0BDoEdARSBDoEdwR4BHkEeAR6BHkEeARLBHoESwRNBHoEegRNBHYETQRMBHYEeQR6BHUEegR2BHUEewR8BH0EfAR+BH0EfARDBH4EQwRFBH4EfgRFBHgERQRLBHgEfQR+BHcEfgR4BHcEfwSABIEEgASCBIEEgAR7BIIEewR9BIIEggR9BIMEfQR3BIMEgQSCBIQEggSDBIQEfwSBBIUEgQSGBIUEgQSEBIYEhASHBIYEhgSHBGEEhwRjBGEEhQSGBGIEhgRhBGIEiASJBIoEiQSLBIoEiQRjBIsEYwSHBIsEiwSHBIwEhwSEBIwEigSLBI0EiwSMBI0EhASDBIwEgwSOBIwEgwR3BI4EdwR5BI4EjgR5BI8EeQR1BI8EjASOBI0EjgSPBI0EkASRBJIEkQSTBJIEkQSIBJMEiASKBJMEkwSKBJQEigSNBJQEkgSTBJUEkwSUBJUElQSUBJYElASXBJYElASNBJcEjQSPBJcElwSPBHMEjwR1BHMElgSXBHIElwRzBHIElQSYBJIEmASZBJIEmASaBJkEmgSbBJkEmQSbBJwEmwSdBJwEkgSZBJAEmQScBJAEmgSYBJ4EmASfBJ4EmASVBJ8ElQSWBJ8EnwSWBHAElgRyBHAEngSfBG8EnwRwBG8EoAShBKIEoQSjBKIEoQSkBKMEpASlBKMEowSlBGkEpQRrBGkEogSjBDwEowRpBDwEpgSnBKgEpwSpBKgEpwSqBKkEqgSrBKkEqQSrBJwEqwSQBJwEqASpBJ0EqQScBJ0EqgSnBKwEpwStBKwEpwSmBK0EpgSuBK0ErQSuBOQDrgTmA+QDrAStBN0DrQTkA90DZgSvBGcErwSwBGcErwSxBLAEsQSyBLAEsASyBKIEsgSgBKIEZwSwBDwEsASiBDwEqgSzBKsEswS0BKsEswS1BLQEtQS2BLQEtAS2BJEEtgSIBJEEqwS0BJAEtASRBJAEtQS3BLYEtwS4BLYEtwRdBLgEXQReBLgEuAReBIkEXgRjBIkEtgS4BIgEuASJBIgE2gO5BLoEuQS7BLoEuQRVBLsEVQRXBLsEuwRXBLcEVwRdBLcEugS7BLUEuwS3BLUEFQS8BBYEvAS9BBYEvAS+BL0EvgS/BL0EvQS/BOkDvwTsA+kDFgS9BOgDvQTpA+gD7AO/BMAEvwTBBMAEvwS+BMEEvgTCBMEEwQTCBFYEwgRZBFYEwATBBFUEwQRWBFUE7APABO0DwATDBO0DwARVBMMEVQS5BMMEwwS5BNgDuQTaA9gD7QPDBNIDwwTYA9ID3QPbA6wE2wPEBKwE2wPaA8QE2gO6BMQExAS6BLMEugS1BLMErATEBKoExASzBKoExQTGBMcExgTIBMcExgTJBMgEyQTKBMgEyATKBMsEygTMBMsExwTIBM0EyATLBM0EzgTPBNAEzwTRBNAEzwTSBNEE0gTTBNEE0QTTBNQE0wTVBNQE0ATRBNYE0QTUBNYE1wTYBNkE2ATaBNkE2ATOBNoEzgTbBNoE2gTbBNwE2wTdBNwE2QTaBN4E2gTcBN4EzATfBOAE3wThBOAE3wTeBOEE3gTcBOEE4QTcBOIE3ATdBOIE4AThBOME4QTiBOME3QTbBOQE2wTlBOQE2wTOBOUEzgTQBOUE5QTQBOYE0ATWBOYE5ATlBOcE5QTmBOcE0gTPBOgEzwTpBOgEzwTOBOkEzgTYBOkE6QTYBOoE2ATXBOoE6ATpBOsE6QTqBOsE0gToBOwE6ATtBOwE6ATrBO0E6wTuBO0E7QTuBO8E7gTwBO8E7ATtBPEE7QTvBPEE8gTzBPQE8wT1BPQE8wT2BPUE9gT3BPUE9QT3BPgE9wT5BPgE9AT1BPoE9QT4BPoE+wT8BP0E/AT+BP0E/AT/BP4E/wQABf4E/gQABQEFAAXyBAEF/QT+BAIF/gQBBQIFAwUEBQUFBAUGBQUFBAXwBAYF8AQHBQYFBgUHBQgFBwUJBQgFBQUGBQoFBgUIBQoF9gQLBQwFCwUNBQwFCwUDBQ0FAwUFBQ0FDQUFBQ4FBQUKBQ4FDAUNBQ8FDQUOBQ8F8QTvBBAF7wQRBRAF7wTwBBEF8AQEBREFEQUEBRIFBAUDBRIFEAURBf8EEQUSBf8E/wQSBQAFEgUTBQAFEgUDBRMFAwULBRMFEwULBfMECwX2BPMEAAUTBfIEEwXzBPIEAgUBBRQFAQUVBRQFAQXyBBUF8gT0BBUFFQX0BBYF9AT6BBYFFAUVBRcFFQUWBRcFGAUZBRoFGQUbBRoFGQUCBRsFAgUUBRsFGwUUBRwFFAUXBRwFGgUbBR0FGwUcBR0FHgUfBSAFHwUhBSAFHwX7BCEF+wT9BCEFIQX9BBkF/QQCBRkFIAUhBRgFIQUZBRgFIgUjBSQFIwUlBSQFIwUmBSUFJgUnBSUFJQUnBSgFJwUpBSgFJAUlBSoFJQUoBSoFIgUkBSsFJAUsBSsFJAUqBSwFKgUtBSwFLAUtBS4FLQUvBS4FKwUsBTAFLAUuBTAFMQUyBTMFMgU0BTMFMgU1BTQFNQU2BTQFNAU2BS4FNgUwBS4FMwU0BS8FNAUuBS8F1QQ3BTgFNwU5BTgFNwU6BTkFOgU7BTkFOQU7BTMFOwUxBTMFOAU5BS8FOQUzBS8FNQUyBTwFMgU9BTwFMgUxBT0FMQU+BT0FPQU+BT8FPgUeBT8FPAU9BUAFPQU/BUAFMQU7BT4FOwVBBT4FOwU6BUEFOgVCBUEFQQVCBR8FQgX7BB8FPgVBBR4FQQUfBR4F8QQQBUMFEAVEBUMFEAX/BEQF/wT8BEQFRAX8BEIF/AT7BEIFQwVEBToFRAVCBToF1QTTBDcF0wRFBTcF0wTSBEUF0gTsBEUFRQXsBEMF7ATxBEMFNwVFBToFRQVDBToFKgVGBS0FRgVHBS0FRgXWBEcF1gTUBEcFRwXUBDgF1ATVBDgFLQVHBS8FRwU4BS8FKQVIBSgFSAVJBSgFSAXnBEkF5wTmBEkFSQXmBEYF5gTWBEYFKAVJBSoFSQVGBSoF5wRIBUoFSAVLBUoFSAUpBUsFKQVMBUsFSgVLBU0FSwVMBU0F4wTiBE4F4gRPBU4F4gTdBE8F3QTkBE8FTwXkBEoF5ATnBEoFTgVPBU0FTwVKBU0FzQTLBFAFywRRBVAFywTMBFEFzATgBFEFUQXgBFIF4ATjBFIFUAVRBVMFUQVSBVMFVAVVBVYFVQVXBVYFVQVTBVcFUwVSBVcFVwVSBU4FUgXjBE4FVgVXBU0FVwVOBU0F+gT4BFgF+ARZBVgF+AT5BFkF+QRaBVkFWQVaBVsFWgVcBVsFWAVZBV0FWQVbBV0FXgVfBWAFXwVhBWAFXwViBWEFYgVjBWEFYQVjBWQFYwVlBWQFYAVhBVwFYQVkBVwFZgVnBWgFZwVpBWgFZwVqBWkFagVrBWkFaQVrBV8FawViBV8FaAVpBV4FaQVfBV4FbAVtBW4FbQVvBW4FbQVwBW8FcAVxBW8FbwVxBXIFcQVzBXIFbgVvBXQFbwVyBXQFHQV1BXYFdQV3BXYFdQV4BXcFeAV5BXcFdwV5BXoFeQV7BXoFdgV3BXwFdwV6BXwFfQV+BX8FfgWABX8FfgUiBYAFIgUrBYAFgAUrBYEFKwUwBYEFfwWABYIFgAWBBYIFMAWDBYEFgwWEBYEFgwWFBYQFhQWGBYQFgQWEBYIFhAWGBYIFhwWIBYkFiAWKBYkFiAVzBYoFcwWLBYoFigWLBYwFiwWNBYwFiQWKBY4FigWMBY4FjwWQBZEFkAWSBZEFkAWTBZIFkwWUBZIFkgWUBZUFlAWWBZUFkQWSBZcFkgWVBZcFmAWZBZoFmQWbBZoFmQWcBZsFnAWdBZsFmwWdBXkFnQV7BXkFmgWbBXgFmwV5BXgFjwWRBZ4FkQWfBZ4FkQWXBZ8FlwWgBZ8FnwWgBaEFoAWiBaEFngWfBaMFnwWhBaMFGQCkBaUFpAWmBaUFpAWnBaYFpwWoBaYFpgWoBakFqAWqBakFpQWmBasFpgWpBasFrAWtBa4FrQWvBa4FrQWwBa8FsAWxBa8FrwWxBbIFsQWCBbIFrgWvBbMFrwWyBbMFtAW1BbYFtQW3BbYFtQWsBbcFrAWuBbcFtwWuBbgFrgWzBbgFtgW3BbkFtwW4BbkFugW7BbwFuwW9BbwFuwW+Bb0FvgW/Bb0FvAW9BbkFvQW/BbkFwAXBBcIFwQXDBcIFwQW+BcMFvgW7BcMFwgXDBboFwwW7BboFxAXFBcYFxQXHBcYFxQXIBccFyAXJBccFxwXJBcoFyQXLBcoFxgXHBcwFxwXKBcwFqwXNBaUFzQXOBaUFzQXPBc4FzwXQBc4FzgXQBRoA0AUcABoApQXOBRkAzgUaABkAxAXRBcUF0QXSBcUF0QXTBdIF0wXUBdIF0gXUBdUF1AXWBdUFxQXSBcgF0gXVBcgF1wXYBdkF2AXaBdkF2AXbBdoF2wXcBdoF2QXaBd0F2gXcBd0F3gXfBeAF3wXhBeAF3wXiBeEF4gXjBeEF4QXjBeQF4wXlBeQF4AXhBeYF4QXkBeYF5wXoBekF6AXqBekF6AXrBeoF6wXsBeoF6gXsBe0F7AXuBe0F6QXqBe8F6gXtBe8F6wXwBewF8AXxBewF8AW+BfEFvgXyBfEF7AXxBe4F8QXyBe4F7gXyBfMF8gX0BfMF8gW+BfQFvgXBBfQF8wX0BcAF9AXBBcAF7gX1Be0F9QX2Be0F9QX3BfYF9wX4BfYF9gX4BfkF+AX6BfkF7QX2Be8F9gX5Be8FwAX7BfMF+wX8BfMF+wX9BfwF/QX+BfwF/AX+BfUF/gX3BfUF8wX8Be4F/AX1Be4F9wX/BfgF/wUABvgF/wUBBgAGAQYCBgAGAAYCBgMGAgblBQMG+AUABvoFAAYDBvoF9wX+Bf8F/gUEBv8F/gX9BQQG/QUFBgQGBAYFBgYGBQYHBgYG/wUEBgEGBAYGBgEGCAYJBgoGCQYLBgoGCQYMBgsGDAYNBgsGCwYNBg4GDQYPBg4GCgYLBhAGCwYOBhAGDAYRBg0GEQYSBg0GEQYTBhIGEwYUBhIGEgYUBhUGFAanBRUGDQYSBg8GEgYVBg8GFgYXBhgGFwYZBhgGFwbPBRkGzwXNBRkGGQbNBRoGzQWrBRoGGAYZBhsGGQYaBhsGGwYaBhwGGgYdBhwGGgarBR0GqwWpBR0GHQapBR4GqQWqBR4GHAYdBh8GHQYeBh8GewUgBnoFIAYhBnoFIAYWBiEGFgYYBiEGIQYYBiIGGAYbBiIGegUhBnwFIQYiBnwFHwYjBiQGIwYlBiQGIwYmBiUGJgYnBiUGJQYnBigGJwZABSgGJAYlBikGJQYoBikGQAU/BSgGPwUqBigGPwUeBSoGHgUgBSoGKgYgBSsGIAUYBSsGKAYqBikGKgYrBikGfAUsBnYFLAYtBnYFLAYpBi0GKQYrBi0GLQYrBhoFKwYYBRoFdgUtBh0FLQYaBR0FfAUiBiwGIgYuBiwGIgYbBi4GGwYcBi4GLgYcBiQGHAYfBiQGLAYuBikGLgYkBikGLwYwBjEGMAYyBjEGMAYmBjIGJgYjBjIGMgYjBh4GIwYfBh4GMQYyBqoFMgYeBqoFBwYFBjMGBQY0BjMGBQb9BTQG/QX7BTQGNAb7BTUG+wXABTUGMwY0BjYGNAY1BjYGwAXCBTUGwgU3BjUGwgW6BTcGugU4BjcGNQY3BjYGNwY4BjYGEwY5BjoGOQY7BjoGOQY8BjsGPAY9BjsGOwY9Bj4GPQY/Bj4GOgY7Bi8GOwY+Bi8GPAZABj0GQAZBBj0GQAY2BkEGNgY4BkEGQQY4BkIGOAa6BUIGPQZBBj8GQQZCBj8GNQVDBjYFQwZEBjYFQwZFBkQGRQZGBkQGRAZGBoMFRgaFBYMFNgVEBjAFRAaDBTAFRQZDBkcGQwZIBkcGQwY1BUgGNQU8BUgGSAY8BScGPAVABScGRwZIBiYGSAYnBiYGhQVJBoYFSQZKBoYFSQZLBkoGSwZMBkoGSgZMBrIFTAazBbIFhgVKBoIFSgayBYIFSwZNBk4GTQZPBk4GTQY/Bk8GPwZCBk8GTgZPBroFTwZCBroFuQW4BbwFuAVQBrwFuAWzBVAGswVMBlAGUAZMBk4GTAZLBk4GvAVQBroFUAZOBroFPwZNBlEGTQZSBlEGTQZLBlIGSwZJBlIGUgZJBkYGSQaFBUYGUQZSBkUGUgZGBkUGPwZRBj4GUQZTBj4GUQZFBlMGRQZHBlMGUwZHBjAGRwYmBjAGPgZTBi8GUwYwBi8GEwY6BhQGOgZUBhQGOgYvBlQGLwYxBlQGVAYxBqgFMQaqBagFFAZUBqcFVAaoBacFNgZABlUGQAZWBlUGQAY8BlYGPAY5BlYGVgY5BhEGOQYTBhEGVQZWBgwGVgYRBgwGBwYzBlcGMwZYBlcGMwY2BlgGNgZVBlgGWAZVBgkGVQYMBgkGVwZYBggGWAYJBggGWQZaBlsGWgZcBlsGWgZdBlwGXQZeBlwGXAZeBgoGXgYIBgoGWwZcBhAGXAYKBhAGXwZgBmEGYAZiBmEGYAbmBWIG5gVjBmIGYgZjBloGYwZdBloGYQZiBlkGYgZaBlkGAQYGBmQGBgZlBmQGBgYHBmUGBwZXBmUGZQZXBl4GVwYIBl4GZAZlBl0GZQZeBl0G5gXkBWMG5AVmBmMG5AXlBWYG5QUCBmYGZgYCBmQGAgYBBmQGYwZmBl0GZgZkBl0GZwZoBmkGaAZqBmkGaAbeBWoG3gXgBWoGagbgBWAG4AXmBWAGaQZqBl8GagZgBl8GzAVrBmwGawZtBmwGawZuBm0GbgZvBm0GbQZvBnAGbwZxBnAGbAZtBnIGbQZwBnIGcwZ0BnUGdAZ2BnUGdAZuBnYGbgZrBnYGdgZrBsoFawbMBcoFdQZ2BssFdgbKBcsFdwZ4BnkGeAZ6BnkGeAZ7BnoGewZ8BnoGegZ8BpQFfAaWBZQFeQZ6BpMFegaUBZMFcwVxBYsFcQV9BosFcQVwBX0GcAV+Bn0GfQZ+Bn8GfgaABn8GiwV9Bo0FfQZ/Bo0FgQaCBoMGggaEBoMGggZ3BoQGdwZ5BoQGhAZ5BoUGeQaTBYUGgwaEBoAGhAaFBoAGgAaFBoYGhQaHBoYGhQaTBYcGkwWQBYcGhgaHBo8FhwaQBY8FowWIBp4FiAaJBp4FiAaNBYkGjQV/BokGiQZ/BoYGfwaABoYGngWJBo8FiQaGBo8FbAWKBm0FigaLBm0FigaBBosGgQaDBosGiwaDBn4GgwaABn4GbQWLBnAFiwZ+BnAF6wSMBu4EjAaNBu4EjAaOBo0GjgaPBo0GjQaPBgcFjwYJBQcF7gSNBvAEjQYHBfAE6wTqBIwG6gSQBowG6gTXBJAG1wTZBJAGkAbZBJEG2QTeBJEGjAaQBo4GkAaRBo4GyQSSBsoEkgaTBsoEkgaOBpMGjgaRBpMGkwaRBt8EkQbeBN8EygSTBswEkwbfBMwEbAVuBZQGbgWVBpQGbgV0BZUGdAWWBpUGlQaWBo8GlgYJBY8GlAaVBo4GlQaPBo4GjgaSBpQGkgaXBpQGkgbJBJcGyQSYBpcGlwaYBooGmAaBBooGlAaXBmwFlwaKBmwFxQSZBsYEmQaaBsYEmQZ3BpoGdwaCBpoGmgaCBpgGggaBBpgGxgSaBskEmgaYBskEmwacBp0GnAaeBp0GnAZ7Bp4GewZ4Bp4GngZ4BpkGeAZ3BpkGnQaeBsUEngaZBsUEewafBnwGnwagBnwGnwahBqAGoQaiBqAGoAaiBqMGogakBqMGfAagBpYFoAajBpYFpQamBqcGpgaoBqcGpgahBqgGoQafBqgGqAafBpwGnwZ7BpwGpwaoBpsGqAacBpsGcwZ1BqkGdQaqBqkGdQbLBaoGywWrBqoGqgarBqIGqwakBqIGqQaqBqEGqgaiBqEGrAatBq4GrQavBq4GrQZzBq8GcwapBq8GrwapBqYGqQahBqYGrgavBqUGrwamBqUG5wXpBbAG6QWxBrAG6QXvBbEG7wWyBrEGsQayBrMGsga0BrMGsAaxBrUGsQazBrUGtga3BrgGtwa5BrgGtwa6BrkGuga7BrkGuQa7BrwGuwZxBrwGuAa5BqwGuQa8BqwG7wX5BbIG+QW9BrIG+QX6Bb0G+gW+Br0GvQa+Br8GvgbABr8Gsga9BrQGvQa/BrQG+gUDBr4GAwbBBr4GAwblBcEG5QXjBcEGwQbjBcIG4wXiBcIGvgbBBsAGwQbCBsAGwAbCBsMGwgbEBsMGwgbiBcQG4gXfBcQGxAbfBcUG3wXeBcUGwwbEBsYGxAbFBsYGtAa/BscGvwbIBscGvwbABsgGwAbDBsgGyAbDBskGwwbGBskGxwbIBroGyAbJBroGtQazBsoGswbLBsoGswa0BssGtAbHBssGywbHBrcGxwa6BrcGygbLBrYGywa3BrYG6wXMBvAFzAbNBvAFzAbOBs0GzgbPBs0GzQbPBr8Fzwa5Bb8F8AXNBr4FzQa/Bb4F5wXQBugF0AbRBugF0AbSBtEG0gbTBtEG0QbTBswG0wbOBswG6AXRBusF0QbMBusFzgbUBs8G1AbVBs8G1AbWBtUG1gbXBtUG1QbXBrYF1wa0BbYFzwbVBrkF1Qa2BbkF2AbZBtoG2QbbBtoG2QbcBtsG3AbdBtsG2wbdBt4G3QbfBt4G2gbbBtYG2wbeBtYG4AbhBuIG4QbjBuIG4QbkBuMG5AblBuMG4wblBtkG5QbcBtkG4gbjBtgG4wbZBtgG0gbmBtMG5gbnBtMG5gbYBucG2AbaBucG5wbaBtQG2gbWBtQG0wbnBs4G5wbUBs4G0gbQBugG0AbpBugG0AbnBekG5wWwBukG6QawBuoGsAa1BuoG6AbpBusG6QbqBusG6wbqBuwG6gbtBuwG6ga1Bu0GtQbKBu0G7QbKBu4Gyga2Bu4G7AbtBu8G7QbuBu8G4AbiBvAG4gbxBvAG4gbYBvEG2AbmBvEG8QbmBugG5gbSBugG8AbxBusG8QboBusGUwVVBfIGVQXzBvIGVQVUBfMGVAX0BvMG8wb0BvUG9Ab2BvUG8gbzBvcG8wb1BvcG9wb4BvIG+Ab5BvIG+Ab6BvkG+gb7BvkG+Qb7BlAF+wbNBFAF8gb5BlMF+QZQBVMFpQanBvwGpwb9BvwGpwabBv0Gmwb+Bv0G/Qb+Bv8G/gb6Bv8G/Ab9Bu8G/Qb/Bu8G+gb+BvsG/gYAB/sG/gabBgAHmwadBgAHAAedBscEnQbFBMcE+wYAB80EAAfHBM0E9wYBB/gGAQcCB/gGAQcDBwIHAwcEBwIHAgcEB/8GBAfvBv8G+AYCB/oGAgf/BvoG9gYFB/UGBQcGB/UGBQcHBwYHBwcIBwYHBgcIBwEHCAcDBwEH9QYGB/cGBgcBB/cG3AblBgkH5QYKBwkH5QbkBgoH5AYLBwoHCgcLBwwHCwcNBwwHCQcKBw4HCgcMBw4HDgcPBwkHDwcQBwkHDwcRBxAHEQcSBxAHEAcSB90GEgffBt0GCQcQB9wGEAfdBtwGEQcPBxMHDwcUBxMHDwcOBxQHDgcVBxQHFAcVBxYHFQcHBxYHEwcUBxcHFAcWBxcHrAW1Ba0FtQUYB60FtQW0BRgHtAUZBxgHGAcZBxoHGQcbBxoHrQUYB7AFGAcaB7AFtAXXBhkH1wYcBxkH1wbWBhwH1gbeBhwHHAfeBh0H3gbfBh0HGQccBxsHHAcdBxsH3wYSBx0HEgceBx0HEgcRBx4HEQcTBx4HHgcTBx8HEwcXBx8HHQceBxsHHgcfBxsHTQVMBSAHTAUhByAHTAUpBSEHKQUnBSEHIQcnBSIHJwUmBSIHIAchByMHIQciByMHJgUjBSIHIwUkByIHIwUiBSQHIgV+BSQHJAd+BSUHfgV9BSUHIgckByMHJAclByMHfQV/BSUHfwUmByUHfwWCBSYHggWxBSYHJgexBScHsQWwBScHJQcmByMHJgcnByMH9gb0BigH9AYpBygH9AZUBSkHVAVWBSkHKQdWBSAHVgVNBSAHKAcpByMHKQcgByMHsAUaBycHGgcqBycHGgcbByoHGwcfByoHKgcfBysHHwcXBysHJwcqByMHKgcrByMHFwcWBysHFgcsBysHFgcHBywHBwcFBywHLAcFBygHBQf2BigHKwcsByMHLAcoByMHDgcMBxUHDActBxUHDAcNBy0HDQcuBy0HLQcuBwgHLgcDBwgHFQctBwcHLQcIBwcHDQcLBy4HCwcvBy4HCwfkBi8H5AbhBi8HLwfhBjAH4QbgBjAHLgcvBwMHLwcwBwMHAwcwBwQHMAcxBwQHMAfgBjEH4AbwBjEHMQfwBuwG8AbrBuwGBAcxB+8GMQfsBu8Gtga4Bu4GuAYyB+4GuAasBjIHrAauBjIHMgeuBvwGrgalBvwG7gYyB+8GMgf8Bu8GcQZvBrwGbwYzB7wGbwZuBjMHbgZ0BjMHMwd0Bq0GdAZzBq0GvAYzB6wGMwetBqwGugbJBrsGyQY0B7sGyQbGBjQHxgY1BzQHNAc1B3AGNQdyBnAGuwY0B3EGNAdwBnEG3gVoBsUGaAY2B8UGaAZnBjYHZwY3BzYHNgc3BzUHNwdyBjUHxQY2B8YGNgc1B8YGcgY3BzgHNwc5BzgHNwdnBjkHZwZpBjkHOQdpBjoHaQZfBjoHOAc5BzsHOQc6BzsHPAc9Bz4HPQc/Bz4HPQdABz8HQAdBBz8HPwdBB0IHQQfdBUIHPgc/B0MHPwdCB0MH1wVEB0UHRAdGB0UHRAdAB0YHQAdHB0YHRQdGB0gHRgdHB0gH1wXZBUQH2QVJB0QH2QXdBUkH3QVBB0kHRAdJB0AHSQdBB0AHSAdHB0oHRwdLB0oHRwdAB0sHQAc9B0sHSwc9B0wHPQc8B0wHSgdLB00HSwdMB00HTQdMB04HTAdPB04HTAc8B08HPAc+B08HTwc+B1AHPgdDB1AHTgdPBzsHTwdQBzsHUQdSB1MHUgdUB1MHUgdVB1QHVQdWB1QHVAdWB1cHVgdYB1cHUwdUB1kHVAdXB1kHWQdXB1oHVwdbB1oHVwdYB1sHWAdcB1sHWwdcB10HXAdeB10HWgdbB18HWwddB18HWAdWB1wHVgdgB1wHVgdVB2AHVQdhB2AHYAdhB2IHYQdjB2IHXAdgB14HYAdiB14HXgdiB2QHYgdlB2QHYgdjB2UHYwdmB2UHZQdmB2cHZgdoB2cHZAdlB2kHZQdnB2kHXwddB2oHXQdrB2oHXQdeB2sHXgdkB2sHawdkB2wHZAdpB2wHagdrB6MFawdsB6MFogVtB6EFbQduB6EFbQdvB24HbwdwB24HbgdwB2oHcAdfB2oHoQVuB6MFbgdqB6MFcQdyB3MHcgd0B3MHcgdZB3QHWQdaB3QHdAdaB3AHWgdfB3AHcwd0B28HdAdwB28HcQd1B3IHdQd2B3IHdQd3B3YHdwd4B3YHdgd4B3kHeAd6B3kHcgd2B1kHdgd5B1kHegd7B3kHewd8B3kHewd9B3wHfQd+B3wHfAd+B1MHfgdRB1MHeQd8B1kHfAdTB1kHfweAB4EHgAeCB4EHgAeDB4IHgweEB4IHggeEB4UHhAeGB4UHgQeCB4cHggeFB4cHiAeJB4oHiQeLB4oHiQeMB4sHjAeNB4sHiweNB44HjQePB44HigeLB5AHiweOB5AHkQeSB5MHkgeUB5MHkgeVB5QHlQeWB5QHlAeWB4QHlgeGB4QHkweUB4MHlAeEB4MHQweXB5gHlweZB5gHlweRB5kHkQeTB5kHmQeTB5oHkweDB5oHmAeZB5sHmQeaB5sHnAedB54HnQefB54HnQeRB58HkQeXB58HnweXB0IHlwdDB0IHngefB90FnwdCB90FoAehB6IHoQejB6IHoQeVB6MHlQeSB6MHoweSB50HkgeRB50HogejB5wHowedB5wHlQehB5YHoQekB5YHoQegB6QHoAelB6QHpAelB6YHpQenB6YHlgekB4YHpAemB4YHoAeoB6UHqAepB6UHqAeqB6kHqgerB6kHqQerB6wHqwetB6wHpQepB6cHqQesB6cHpwesB64HrAevB64HrAetB68HrQewB68HrwewB4oHsAeIB4oHrgevB5AHrweKB5AHhgemB4UHpgexB4UHpgenB7EHpweuB7EHsQeuB7IHrgeQB7IHhQexB4cHsQeyB4cHswe0B7UHtAe2B7UHtAe3B7YHtwe4B7YHtge4B7kHuAe6B7kHtQe2B7sHtge5B7sHvAe9B74HvQe/B74HvQezB78Hswe1B78Hvwe1B8AHtQe7B8AHvge/B8EHvwfAB8EHtwe0B8IHtAfDB8IHtAezB8MHswe9B8MHwwe9B8QHvQe8B8QHwgfDB8UHwwfEB8UHxgfHB8gHxwfJB8gHxwfFB8kHxQfEB8kHyQfEB8oHxAe8B8oHyAfJB8sHyQfKB8sHzAfNB84HzQfPB84HzQfTBc8H0wXRBc8HzwfRBdAH0QXEBdAHzgfPB9EHzwfQB9EH0QfQB9IH0AfTB9IH0AfEBdMHxAXGBdMH0wfGBdQHxgXMBdQH0gfTB9UH0wfUB9UH1QfUB9YH1AfXB9YH1AfMBdcHzAVsBtcH1wdsBjgHbAZyBjgH1gfXBzsH1wc4BzsHOwdQB9YHUAfYB9YHUAdDB9gHQweYB9gH2AeYB9kHmAebB9kH1gfYB9UH2AfZB9UH2gfbB9wH2wfdB9wH2webB90HmweaB90H3QeaB4AHmgeDB4AH3AfdB38H3QeAB38HmwfbB9kH2wfeB9kH2wfaB94H2gffB94H3gffB9IH3wfRB9IH2QfeB9UH3gfSB9UHxQfHB+AHxwfhB+AHxwfGB+EHxgfiB+EH4QfiB84H4gfMB84H4AfhB9EH4QfOB9EH2gfjB98H4wfkB98H4we3B+QHtwfCB+QH5AfCB+AHwgfFB+AH3wfkB9EH5AfgB9EHtwfjB7gH4wflB7gH4wfaB+UH2gfcB+UH5QfcB+YH3Ad/B+YHuAflB7oH5QfmB7oHugfmB+cH5gfoB+cH5gd/B+gHfweBB+gH6AeBB+kHgQeHB+kH5wfoB+oH6AfpB+oHjwfrB44H6wfsB44H6wfqB+wH6gfpB+wH7AfpB7IH6QeHB7IHjgfsB5AH7AeyB5AHuwe5B+0HuQfuB+0HuQe6B+4HugfnB+4H7gfnB+sH5wfqB+sH7QfuB48H7gfrB48HjAfvB40H7wfwB40H7wfBB/AHwQfAB/AH8AfAB+0HwAe7B+0HjQfwB48H8AftB48HwQfvB/EH7wfyB/EH7weMB/IHjAeJB/IH8geJB/MHiQeIB/MH8QfyB/QH8gfzB/QHrQf1B7AH9Qf2B7AH9Qf3B/YH9wf4B/YH9gf4B/MH+Af0B/MHsAf2B4gH9gfzB4gHfQd7B/kHewf6B/kHewd6B/oHegf7B/oH+gf7B/wH+wf9B/wH+Qf6B/4H+gf8B/4H/wcACAEIAAgCCAEIAAgDCAIIAwgECAIIAggECAUIBAgGCAUIAQgCCAcIAggFCAcICAgJCAoICQgLCAoICQgGCAsIBggECAsICggLCAMICwgECAMICAgMCA0IDAgOCA0IDAgPCA4IDwgQCA4IDggQCBEIEAgSCBEIDQgOCBMIDggRCBMIFAgVCBYIFQgXCBYIFQhIBxcISAdKBxcIFwhKB04HGAgZCBoIFggXCDsHFwhOBzsHOwc6BxYIOgcbCBYIOgdfBhsIXwZhBhsIGwhhBhwIYQZZBhwIFggbCBQIGwgcCBQIFAgcCB0IHAgeCB0IHAhZBh4IWQZbBh4IHghbBh8IWwYQBh8IHQgeCBIIHggfCBIIIAghCCIIIQgjCCIIIQjXBSMI1wVFByMIIwhFBxUIRQdIBxUIIggjCBQIIwgVCBQIJAglCCYIJQgnCCYIJQgoCCcIKAgpCCcIJwgpCCIIKQggCCIIJggnCBQIJwgiCBQI/wcqCCsIKggsCCsIKggoCCwIKAglCCwILAglCC0IJQgkCC0IKwgsCA8ILAgtCA8IDwgtCBAILQguCBAILQgkCC4IJAgmCC4ILggmCB0IJggUCB0IEAguCBIILggdCBIICAgKCAwICggvCAwICggDCC8IAwgACC8ILwgACCsIAAj/BysIDAgvCA8ILwgrCA8IKAgqCDAIKggxCDAIKgj/BzEI/wcBCDEIMQgBCDIIAQgHCDIIMAgxCDMIMQgyCDMIywc0CMgHNAg1CMgHNAg2CDUINgg3CDUINQg3CDgINwg5CDgIyAc1CMYHNQg4CMYHOgg7CDwIOwg9CDwIOwjbBT0I2wXYBT0IPQjYBT4I2AXXBT4IPAg9CD8IPQg+CD8IQAhBCEIIQQhDCEIIQQhECEMIRAhFCEMIQwhFCMoHRQjLB8oHQghDCLwHQwjKB7wHvAe+B0IIvgdGCEIIvgfBB0YIwQfxB0YIRgjxB0cI8Qf0B0cIQghGCEAIRghHCEAI9Af4B0cI+AdICEcI+Af3B0gI9wdJCEgISAhJCEoISQg6CEoIRwhICEAISAhKCEAIrQerB/UHqwdLCPUHqweqB0sIqgdMCEsISwhMCE0ITAhOCE0I9QdLCPcHSwhNCPcHTghMCE8ITAhQCE8ITAiqB1AIqgeoB1AIUAioB6IHqAegB6IHTwhQCJwHUAiiB5wH2wVRCNwFUQhSCNwFUQhOCFIITghPCFIIUghPCJ4HTwicB54H3AVSCN0FUgieB90F9wdNCEkITQhTCEkITQhOCFMITghRCFMIUwhRCDsIUQjbBTsISQhTCDoIUwg7CDoIQAhKCEEISghUCEEISgg6CFQIOgg8CFQIVAg8CFUIPAg/CFUIQQhUCEQIVAhVCEQIVghXCFgIVwhZCFgIVwg/CFkIPwg+CFkIWQg+CCEIPgjXBSEIWAhZCCAIWQghCCAIKAgwCCkIMAhaCCkIMAgzCFoIMwhbCFoIWghbCFgIWwhWCFgIKQhaCCAIWghYCCAIVghbCFwIWwhdCFwIWwgzCF0IMwheCF0IXQheCF8IXghgCF8IXAhdCGEIXQhfCGEIYQhiCFwIYghjCFwIYghECGMIRAhVCGMIYwhVCFcIVQg/CFcIXAhjCFYIYwhXCFYIRAhiCEUIYghkCEUIYghhCGQIYQhlCGQIZAhlCDQIZQg2CDQIRQhkCMsHZAg0CMsH1gXUBWYI1AVnCGYI1AXTBWcI0wXNB2cIZwjNB2gIzQfMB2gIZghnCGkIZwhoCGkIOQhqCDgIaghrCDgIaghpCGsIaQhoCGsIawhoCOIHaAjMB+IHOAhrCMYHawjiB8YHbAhtCG4IbQhvCG4IbQhwCG8IcAhxCG8IbwhxCGYIcQjWBWYIbghvCGkIbwhmCGkIbwdyCHMHcghzCHMHcghsCHMIbAh0CHMIcwh0CHUIdAh2CHUIcwdzCHEHcwh1CHEH1gVxCNUFcQh3CNUFcQhwCHcIcAh4CHcIdwh4CHkIeAh6CHkI1QV3CMgFdwh5CMgFbwdtB3sIbQd8CHsIbQeiBXwIogWgBXwIfAigBX0IoAWXBX0Iewh8CHoIfAh9CHoIegh9CH4IfQh/CH4IfQiXBX8IlwWVBX8IfwiVBaMGlQWWBaMGfgh/CKQGfwijBqQGywXJBasGyQWACKsGyQXIBYAIyAV5CIAIgAh5CH4IeQh6CH4IqwaACKQGgAh+CKQGegh4CHsIeAiBCHsIeAhwCIEIcAhtCIEIgQhtCHIIbQhsCHIIewiBCG8HgQhyCG8HbAhuCHQIbgiCCHQIbghpCIIIaQhqCIIIgghqCIMIagg5CIMIdAiCCHYIggiDCHYIegd4B/sHeAeECPsHeAd3B4QIdweFCIQIhAiFCIYIhQiHCIYI+weECP0HhAiGCP0Hdwd1B4UIdQeICIUIdQdxB4gIcQd1CIgIiAh1CIkIdQh2CIkIhQiICIcIiAiJCIcIhwiKCIsIigiMCIsIigiNCIwIjQiOCIwIjAiOCI8IjggGCI8IiwiMCJAIjAiPCJAIYAiRCJIIkQiTCJIIkQiUCJMIlAiVCJMIkwiVCJYIlQiNCJYIkgiTCJcIkwiWCJcIdgiYCIkImAiZCIkImAiXCJkIlwiWCJkImQiWCIoIlgiNCIoIiQiZCIcImQiKCIcIOQg3CIMINwiaCIMINwg2CJoINgibCJoImgibCJgImwiXCJgIgwiaCHYImgiYCHYIYQhfCGUIXwicCGUIXwhgCJwIYAiSCJwInAiSCJsIkgiXCJsIZQicCDYInAibCDYIBwidCDIInQieCDIInQiUCJ4IlAiRCJ4IngiRCF4IkQhgCF4IMgieCDMIngheCDMIjQiVCI4IlQifCI4IlQiUCJ8IlAidCJ8InwidCAUInQgHCAUIjgifCAYInwgFCAYIBggJCI8ICQigCI8ICQgICKAICAgNCKAIoAgNCKEIDQgTCKEIjwigCJAIoAihCJAIogijCKQIowilCKQIowiQCKUIkAihCKUIpQihCKYIoQgTCKYIpAilCKcIpQimCKcIkAijCIsIowioCIsIowiiCKgIogipCKgIqAipCIYIqQj9B4YIiwioCIcIqAiGCIcI/QepCPwHqQiqCPwHqQiiCKoIogikCKoIqgikCKsIpAinCKsI/AeqCP4HqgirCP4HrAitCK4IrQivCK4IrQh9B68IfQf5B68Irwj5B7AI+Qf+B7AIrgivCLEIrwiwCLEIsgizCLQIswi1CLQIswi2CLUItgi3CLUItQi3CLgItwi5CLgItAi1CLoItQi4CLoIuwi8CL0IvAi+CL0IvAi/CL4IvwjACL4IvgjACMEIwAjCCMEIvQi+CMMIvgjBCMMIxAjFCMYIxQjHCMYIxQjICMcIyAjJCMcIxwjJCMoIyQjLCMoIxgjHCMwIxwjKCMwIzQjOCM8IzgjQCM8IzgjRCNAI0QjSCNAI0AjSCNMI0gjUCNMIzwjQCNUI0AjTCNUIwwjBCNYIwQjXCNYIwQjCCNcIwgjYCNcI1wjYCNkI2AjaCNkI1gjXCNsI1wjZCNsI0QjOCNwIzgjdCNwIzgjNCN0IzQjeCN0I3QjeCN8I3gjgCN8I3AjdCNsI3QjfCNsI4AjhCN8I4QjiCN8I4Qi6COIIugjjCOII4gjjCOQI4wjlCOQI3wjiCNsI4gjkCNsIugi4COMIuAjmCOMIuAi5COYIuQjnCOYI5gjnCOgI5wjpCOgI4wjmCOUI5gjoCOUI6QjqCOgI6gjrCOgI6gjsCOsI7AjtCOsI6wjtCO4I7QjvCO4I6AjrCOUI6wjuCOUI5QjuCOQI7gjwCOQI7gjvCPAI7wjxCPAI8AjxCNYI8QjDCNYI5AjwCNsI8AjWCNsI2gjyCNkI8gjzCNkI8gj0CPMI9Aj1CPMI8wj1CNwI9QjRCNwI2QjzCNsI8wjcCNsI0Qj1CNII9Qj2CNII9Qj0CPYI9Aj3CPYI9gj3CPgI9wj5CPgI0gj2CNQI9gj4CNQI+gj7CPwI+wj9CPwI+wjICP0IyAjFCP0I/QjFCP4IxQjECP4I/Aj9CP8I/Qj+CP8IAAkBCQIJAQkDCQIJAQkECQMJBAkFCQMJAwkFCQYJBQkHCQYJAgkDCQgJAwkGCQgJCQkKCQsJCgkMCQsJCgkECQwJBAkBCQwJDAkBCQ0JAQkACQ0JCwkMCQ4JDAkNCQ4JDwkQCREJEAkSCREJEAkTCRIJEwkUCRIJEgkUCfwIFAn6CPwIEQkSCf8IEgn8CP8IFQkWCRcJFgkYCRcJFgkZCRgJGQkaCRgJGAkaCRsJGgkcCRsJFwkYCR0JGAkbCR0JHgkfCSAJHwkhCSAJHwkdCSEJHQkbCSEJIQkbCSIJGwkcCSIJIAkhCSMJIQkiCSMJJAklCSYJJQknCSYJJQkjCScJIwkoCScJJwkoCSkJKAkqCSkJJgknCSsJJwkpCSsJLAktCS4JLQkvCS4JLQkwCS8JMAkxCS8JLwkxCTIJMQkzCTIJLgkvCTQJLwkyCTQJIwk1CSgJNQk2CSgJNQkzCTYJMwk3CTYJNgk3CTgJNwk5CTgJKAk2CSoJNgk4CSoJNAkyCToJMgk7CToJMgkzCTsJMwk1CTsJOwk1CSIJNQkjCSIJOgk7CRwJOwkiCRwJMwkxCTcJMQk8CTcJMQkwCTwJMAk9CTwJPAk9CT4JPQk/CT4JNwk8CTkJPAk+CTkJQAlBCUIJQQlDCUIJQQlECUMJRAlFCUMJQwlFCUYJRQlHCUYJQglDCUgJQwlGCUgJSQlKCUsJSglMCUsJSglNCUwJTQlOCUwJTAlOCU8JTglQCU8JSwlMCVEJTAlPCVEJUglTCVQJUwlVCVQJUwlWCVUJVglXCVUJVQlXCVgJVwlZCVgJVAlVCVoJVQlYCVoJWwlcCV0JXAleCV0JXAlfCV4JXwlgCV4JXglgCWEJYAliCWEJXQleCWMJXglhCWMJYglgCWQJYAllCWQJYAlfCWUJXwlmCWUJZQlmCT4JZgk5CT4JZAllCT8JZQk+CT8JZwloCWkJaAlqCWkJaAksCWoJLAkuCWoJagkuCWsJLgk0CWsJaQlqCWwJaglrCWwJbQluCW8JbglwCW8JbglsCXAJbAlrCXAJcAlrCToJawk0CToJbwlwCRwJcAk6CRwJcQlyCXMJcgl0CXMJcglsCXQJbAluCXQJdAluCXUJbgltCXUJcwl0CXYJdAl1CXYJdwl4CXkJeAl6CXkJeAlnCXoJZwlpCXoJeglpCXIJaQlsCXIJeQl6CXEJeglyCXEJUAlOCXsJTgl8CXsJTglNCXwJTQl9CXwJfAl9CX4JfQl/CX4Jewl8CYAJfAl+CYAJgQmCCYMJggmECYMJggmFCYQJhQmGCYQJhAmGCYcJhgmICYcJgwmECYkJhAmHCYkJiQmKCYMJigmLCYMJigmMCYsJjAmNCYsJiwmNCY4JjQmPCY4JgwmLCYEJiwmOCYEJkAmRCZIJkQmTCZIJkQmUCZMJlAmVCZMJkwmVCZYJlQmXCZYJkgmTCZgJkwmWCZgJmAmWCZkJlgmaCZkJlgmXCZoJlwmbCZoJmgmbCZwJmwmdCZwJmQmaCZ4JmgmcCZ4JlwmfCZsJnwmgCZsJnwmhCaAJoQmiCaAJoAmiCaMJogmkCaMJmwmgCZ0JoAmjCZ0JlAmlCZUJpQmmCZUJpQmnCaYJpwmoCaYJpgmoCZ8JqAmhCZ8JlQmmCZcJpgmfCZcJqQmqCasJqgmsCasJqgmtCawJrQmuCawJrAmuCa8JrgmwCa8JqwmsCfoIrAmvCfoIEwmxCRQJsQmyCRQJsQmzCbIJswm0CbIJsgm0CasJtAmpCasJFAmyCfoIsgmrCfoItQm2CbcJtgm4CbcJtgm5CbgJuQm6CbgJuAm6CaoJugmtCaoJtwm4CakJuAmqCakJswm7CbQJuwm8CbQJuwm9CbwJvQm+CbwJvAm+CbcJvgm1CbcJtAm8CakJvAm3CakJJAkmCb8JJgnACb8JJgkrCcAJKwnBCcAJwAnBCbsJwQm9CbsJvwnACbMJwAm7CbMJSQnCCUoJwgnDCUoJwgnECcMJxAnFCcMJwwnFCcYJxQnHCcYJSgnDCU0JwwnGCU0JyAnJCcoJyQnLCcoJyQmICcsJiAnMCcsJywnMCcUJzAnHCcUJygnLCcQJywnFCcQJKwkpCc0JKQnOCc0JKQkqCc4JKgnPCc4JzgnPCdAJzwnRCdAJzQnOCcgJzgnQCcgJKgk4Cc8JOAnSCc8JOAk5CdIJOQlmCdIJ0glmCdMJZglfCdMJzwnSCdEJ0gnTCdEJ0QnTCdQJ0wnVCdQJ0wlfCdUJXwlcCdUJ1QlcCdYJXAlbCdYJ1AnVCYkJ1QnWCYkJ0QnUCdAJ1AnXCdAJ1AmJCdcJiQmHCdcJ1wmHCckJhwmICckJ0AnXCcgJ1wnJCcgJvQnBCdgJwQnZCdgJwQkrCdkJKwnNCdkJ2QnNCcoJzQnICcoJ2AnZCcQJ2QnKCcQJvQnYCb4J2AnaCb4J2AnECdoJxAnCCdoJ2gnCCdsJwglJCdsJvgnaCbUJ2gnbCbUJtQnbCbYJ2wncCbYJ2wlJCdwJSQlLCdwJ3AlLCd0JSwlRCd0JtgncCbkJ3AndCbkJUAl7Cd4JewnfCd4JewmACd8JgAngCd8J3wngCeEJ4AniCeEJ3gnfCeMJ3wnhCeMJUQlPCeQJTwnlCeQJTwlQCeUJUAneCeUJ5QneCeYJ3gnjCeYJ5AnlCecJ5QnmCecJ4wnhCegJ4QnpCegJ4QniCekJ4gnqCekJ6QnqCesJ6gnsCesJ6AnpCe0J6QnrCe0J5wnmCe4J5gnvCe4J5gnjCe8J4wnoCe8J7wnoCfAJ6AntCfAJ7gnvCfEJ7wnwCfEJ8gnzCfQJ8wn1CfQJ8wn2CfUJ9gn3CfUJ9Qn3Ce4J9wnnCe4J9An1CfEJ9QnuCfEJuQndCfgJ3Qn5CfgJ3QlRCfkJUQnkCfkJ+QnkCfcJ5AnnCfcJ+An5CfYJ+Qn3CfYJuQn4CboJ+An6CboJ+An2CfoJ9gn7CfoJ+gn7CfwJ+wn9CfwJugn6Ca0J+gn8Ca0J/Qn+CfwJ/gn/CfwJ/gkACv8JAAoBCv8J/wkBCq4JAQqwCa4J/An/Ca0J/wmuCa0JAgoDCgQKAwoFCgQKAwoGCgUKBgoHCgUKBQoHCggKBwoJCggKBAoFCgoKBQoICgoKCgoICgsKCAoMCgsKCAoJCgwKCQoNCgwKDAoNCskIDQrLCMkICwoMCsgIDArJCMgIsAkOCq8JDgoPCq8JDgoKCg8KCgoLCg8KDwoLCvsICwrICPsIrwkPCvoIDwr7CPoIAAoQCgEKEAoRCgEKEAoCChEKAgoEChEKEQoECg4KBAoKCg4KAQoRCrAJEQoOCrAJAgoSCgMKEgoTCgMKEgoUChMKFAoVChMKEwoVChYKFQoXChYKAwoTCgYKEwoWCgYKGAoZChoKGQobChoKGQoUChsKFAoSChsKGwoSChAKEgoCChAKGgobCgAKGwoQCgAKBwkcCh0KHAoeCh0KHAofCh4KHwogCh4KHgogCiEKIAoiCiEKHQoeCiMKHgohCiMKBAkkCgUJJAolCgUJJAomCiUKJgonCiUKJQonChwKJwofChwKBQklCgcJJQocCgcJFAooChUKKAopChUKKAofCikKHwonCikKKQonCioKJwomCioKFQopChcKKQoqChcKGAorChkKKwosChkKKwoiCiwKIgogCiwKLAogCigKIAofCigKGQosChQKLAooChQKLQouCi8KLgowCi8KLgoxCjAKMQoyCjAKMAoyCjMKMgo0CjMKLwowCvIJMAozCvIJNQo2CjcKNgo4CjcKNgo5CjgKOQo6CjgKOAo6CpEJOgqUCZEJNwo4CpAJOAqRCZAJlAk6CqUJOgo7CqUJOgo5CjsKOQo8CjsKOwo8Cj0KPAotCj0KpQk7CqcJOwo9CqcJOQo2Cj4KNgo/Cj4KNgo1Cj8KNQpACj8KPwpACkEKQApCCkEKPgo/CkMKPwpBCkMKCAkGCUQKBglFCkQKBgkHCUUKBwkdCkUKRQodCkYKHQojCkYKRApFCkcKRQpGCkcKIwpICkYKSApJCkYKSApDCkkKQwpBCkkKSQpBCkoKQQpCCkoKRgpJCkcKSQpKCkcKOQo+CjwKPgpLCjwKPgpDCksKQwpMCksKSwpMCi4KTAoxCi4KPApLCi0KSwouCi0KIgpNCiEKTQpOCiEKTQoxCk4KMQpMCk4KTgpMCkgKTApDCkgKIQpOCiMKTgpICiMKMQpNCjIKTQpPCjIKTQoiCk8KIgorCk8KTworClAKKwoYClAKMgpPCjQKTwpQCjQKNApQClEKUApSClEKUAoYClIKGAoaClIKUgoaCv4JGgoACv4JUQpSCv0JUgr+Cf0J8gkzCvMJMwpTCvMJMwo0ClMKNApRClMKUwpRCvsJUQr9CfsJ8wlTCvYJUwr7CfYJpwk9ClQKPQpVClQKPQotClUKLQovClUKVQovCvQJLwryCfQJVApVCvEJVQr0CfEJ8QnwCVQK8AlWClQK8AntCVYK7QlXClYKVgpXCqgJVwqhCagJVApWCqcJVgqoCacJ7QnrCVcK6wlYClcK6wnsCVgK7AlZClgKWApZCqIJWQqkCaIJVwpYCqEJWAqiCaEJzAhaClsKWgpcClsKWgpdClwKXQpeClwKXApeCrwIXgq/CLwIWwpcCrsIXAq8CLsIywhfCsoIXwpgCsoIXwphCmAKYQpiCmAKYApiCloKYgpdCloKyghgCswIYApaCswIYwpkCmUKZApmCmUKZApnCmYKZwpoCmYKZgpoCmkKaApqCmkKZQpmCmsKZgppCmsKYwpsCmQKbAptCmQKbApuCm0KbgpvCm0KbQpvCnAKbwpxCnAKZAptCmcKbQpwCmcKZwpyCmgKcgpzCmgKcgp0CnMKdAp1CnMKcwp1CnYKdQp3CnYKaApzCmoKcwp2CmoKZwpwCnIKcAp4CnIKcApxCngKcQp5CngKeAp5CnoKeQp7CnoKcgp4CnQKeAp6CnQKwgh8CtgIfAp9CtgIfAp+Cn0Kfgp/Cn0KfQp/CoAKfwqBCoAK2Ah9CtoIfQqACtoIvwiCCsAIggqDCsAIggqECoMKhAqFCoMKgwqFCnwKhQp+CnwKwAiDCsIIgwp8CsIIdAp6CoYKegqHCoYKegp7CocKewqICocKhwqICn8KiAqBCn8KhgqHCn4Khwp/Cn4KhAqJCoUKiQqKCoUKiQp3CooKdwp1CooKigp1CoYKdQp0CoYKhQqKCn4KigqGCn4KXQqLCl4KiwqMCl4KiwqNCowKjQqOCowKjAqOCoIKjgqECoIKXgqMCr8IjAqCCr8IYQqPCmIKjwqQCmIKjwqRCpAKkQqSCpAKkAqSCosKkgqNCosKYgqQCl0KkAqLCl0KkQqTCpIKkwqUCpIKkwqVCpQKlQqWCpQKlAqWCpcKlgqYCpcKkgqUCo0KlAqXCo0KBgoWCpkKFgqaCpkKFgoXCpoKFwqbCpoKmgqbCpwKmwqdCpwKmQqaCp4KmgqcCp4KCQqfCg0KnwqgCg0KnwqhCqAKoQqiCqAKoAqiCl8KogphCl8KDQqgCssIoApfCssICQoHCp8KBwqjCp8KBwoGCqMKBgqZCqMKowqZCqQKmQqeCqQKnwqjCqEKowqkCqEKYQqiCo8KogqlCo8KogqhCqUKoQqmCqUKpQqmCqcKpgqoCqcKjwqlCpEKpQqnCpEKoQqkCqYKpAqpCqYKpAqeCqkKngqqCqkKqQqqCqsKqgqsCqsKpgqpCqgKqQqrCqgKngqcCqoKnAqtCqoKnAqdCq0KnQquCq0KrQquCq8KrgqwCq8KqgqtCqwKrQqvCqwKsQqyCrMKsgq0CrMKsgq1CrQKtQq2CrQKtAq2CrcKtgq4CrcKswq0CrkKtAq3CrkKnQqbCroKmwq7CroKmwoXCrsKFwoqCrsKuwoqCrwKKgomCrwKugq7Cr0Kuwq8Cr0KvQq8Cr4KvAq/Cr4KvAomCr8KJgokCr8KvwokCgoJJAoECQoJvgq/CgkJvwoKCQkJsAquCsAKrgrBCsAKrgqdCsEKnQq6CsEKwQq6CsIKugq9CsIKwArBCrEKwQrCCrEKsQrCCrIKwgrDCrIKwgq9CsMKvQq+CsMKwwq+CsQKvgoJCcQKsgrDCrUKwwrECrUKsArACsUKwArGCsUKwAqxCsYKsQqzCsYKxgqzCscKswq5CscKxQrGCsgKxgrHCsgKrAqvCskKrwrKCskKrwqwCsoKsArFCsoKygrFCssKxQrICssKyQrKCswKygrLCswKqAqrCs0KqwrOCs0KqwqsCs4KrArJCs4KzgrJCs8KyQrMCs8KzQrOCtAKzgrPCtAKkQqnCpMKpwrRCpMKpwqoCtEKqArNCtEK0QrNCtIKzQrQCtIKkwrRCpUK0QrSCpUK0ArTCtIK0wrUCtIK0wrVCtQK1QrWCtQK1ArWCtcK1grYCtcK0grUCpUK1ArXCpUKmAqWCtkKlgraCtkKlgqVCtoKlQrXCtoK2grXCtsK1wrYCtsK2QraCtwK2grbCtwKjQqXCo4KlwrdCo4KlwqYCt0KmAreCt0K3QreCokK3gp3CokKjgrdCoQK3QqJCoQKdwreCnYK3grfCnYK3gqYCt8KmArZCt8K3wrZCuAK2QrcCuAKdgrfCmoK3wrgCmoKagrgCmkK4ArhCmkK4ArcCuEK3AriCuEK4QriCuMK4grkCuMKaQrhCmsK4QrjCmsK5QrmCucK5groCucK5grpCugK6QrqCugK6ArqCusK6grsCusK5wroCu0K6ArrCu0KjAnuCo0J7grvCo0J7grsCu8K7ArqCu8K7wrqCvAK6grpCvAKjQnvCo8J7wrwCo8JWwnxCtYJ8QryCtYJ8QrzCvIK8wr0CvIK8gr0CooJ9AqMCYoJ1gnyCokJ8gqKCYkJ9Qr2CvcK9gr4CvcK9grzCvgK8wrxCvgK+ArxCl0J8QpbCV0J9wr4CmMJ+ApdCWMJWQn5ClgJ+Qr6ClgJ+QrzCvoK8wr2CvoK+gr2CvsK9gr1CvsKWAn6CloJ+gr7CloJ8wr5CvQK+Qr8CvQK+QpZCfwKWQn9CvwK/Ar9Cu4K/QrsCu4K9Ar8CowJ/AruCowJWQlXCf0KVwn+Cv0KVwlWCf4KVgn/Cv4K/gr/CusK/wrtCusK/Qr+CuwK/grrCuwKWgkAC1QJAAsBC1QJAAt3CQELdwl5CQELAQt5CQILeQlxCQILVAkBC1IJAQsCC1IJAwsECwULBAsGCwULBAtSCQYLUgkCCwYLBgsCC3MJAgtxCXMJBQsGC3YJBgtzCXYJBwsICwkLCAsKCwkLCAtSCQoLUgkECwoLCgsECwsLBAsDCwsLCQsKCwwLCgsLCwwL7Qr/Cg0L/woOCw0L/wpWCQ4LVglTCQ4LDgtTCQgLUwlSCQgLDQsOCwcLDgsICwcL5QrnCg8L5woQCw8L5wrtChAL7QoNCxALEAsNCxELDQsHCxELDwsQCxILEAsRCxILEgsRCxMLEQsUCxMLEQsHCxQLBwsJCxQLFAsJCxULCQsMCxULEwsUCxYLFAsVCxYLFgsVCxcLFQsYCxcLFQsMCxgLDAsZCxgLGAsZCxoLGQsbCxoLFwsYCxwLGAsaCxwLDAsLCxkLCwsdCxkLCwsDCx0LAwsFCx0LHQsFCx4LBQt2CR4LGQsdCxsLHQseCxsLHwsgCyELIAsiCyELIAsbCyILGwseCyILIgseCyMLHgt2CSMLIQsiCyQLIgsjCyQLJQsmCycLJgsoCycLJgspCygLKQsqCygLKAsqCysLKgssCysLJwsoCy0LKAsrCy0LJQsnCy4LJwsvCy4LJwstCy8LLQswCy8LLwswCzELMAsyCzELLgsvCx8LLwsxCx8LHwsxCyALMQszCyALMQsyCzMLMgs0CzMLMws0CxoLNAscCxoLIAszCxsLMwsaCxsLNQs2CzcLNgs4CzcLNgu4CjgLuAo5CzgLOAs5CzoLOQs7CzoLNws4CzwLOAs6CzwLPQs+Cz8LPgtACz8LPgs1C0ALNQtBC0ALQAtBC0ILQQtDC0ILPwtAC0QLQAtCC0QLRQtGC0cLRgtIC0cLRgs9C0gLPQs/C0gLSAs/C0kLPwtEC0kLRwtIC0oLSAtJC0oLyArHCksLxwpMC0sLxwq5CkwLuQpNC0wLTAtNC0YLTQs9C0YLSwtMC0ULTAtGC0ULuQq3Ck0LtwpOC00Ltwq4Ck4LuAo2C04LTgs2Cz4LNgs1Cz4LTQtOCz0LTgs+Cz0LQwtBC08LQQtQC08LQQs1C1ALNQs3C1ALUAs3C1ELNws8C1ELTwtQC1ILUAtRC1ILtQrEClMLxApUC1MLxAoJCVQLCQkLCVQLVAsLCVULCwkOCVULUwtUC1YLVAtVC1YLuAq2CjkLtgpXCzkLtgq1ClcLtQpTC1cLVwtTC1gLUwtWC1gLOQtXCzsLVwtYCzsL3ArbCuIK2wpZC+IK2wrYClkL2ApaC1kLWQtaC1sLWgtcC1sL4gpZC+QKWQtbC+QK1QpdC9YKXQteC9YKXQtfC14LXwtgC14LXgtgC1oLYAtcC1oL1gpeC9gKXgtaC9gKYQtiC2MLYgtkC2MLYgvVCmQL1QrTCmQLZAvTCs8K0wrQCs8KYwtkC8wKZAvPCswKzArLCmMLywplC2MLywrICmULyApLC2ULZQtLC2YLSwtFC2YLYwtlC2ELZQtmC2ELRQtHC2YLRwtnC2YLRwtKC2cLSgtoC2cLZwtoC2kLaAtqC2kLZgtnC2ELZwtpC2ELYQtpC2ILaQtrC2ILaQtqC2sLagtsC2sLawtsC10LbAtfC10LYgtrC9UKawtdC9UKTQnGCX0JxgltC30JxgnHCW0LxwluC20LbQtuC28LbgtwC28LfQltC38JbQtvC38JiAmGCcwJhglxC8wJhgmFCXELhQlyC3ELcQtyC24LcgtwC24LzAlxC8cJcQtuC8cJBABzCwUAcwt0CwUAcwt1C3QLdQt2C3QLdAt2C3cLdgt4C3cLBQB0CwcAdAt3CwcAeQt6C3sLegt8C3sLegt9C3wLfQt+C3wLfAt+C38LfguAC38Lewt8C4ELfAt/C4ELgguDC4QLgwuFC4QLgwuGC4ULhguHC4ULhQuHC4gLhwuJC4gLhAuFC4oLhQuIC4oLiwuMC40LjAuOC40LjAuPC44LjwuQC44LjguQC5ELkAuSC5ELjQuOC5MLjguRC5MLiQuHC5QLhwuVC5QLhwuGC5ULhguWC5ULlQuWC5cLlguYC5cLlAuVC5MLlQuXC5MLkwuXC40LlwuZC40LlwuYC5kLmAuaC5kLmQuaC5sLmgucC5sLjQuZC4sLmQubC4sLnQueC58LngugC58LnguJC6ALiQuUC6ALoAuUC5ELlAuTC5ELnwugC5ILoAuRC5ILoQuiC6MLogukC6MLogudC6QLnQufC6QLpAufC6ULnwuSC6ULowukC6YLpAulC6YLpwuoC6kLqAuqC6kLqAuhC6oLoQujC6oLqgujC6sLowumC6sLqQuqC6wLqgurC6wLrQuuC68LrguwC68LrguxC7ALsQuyC7ALsAuyC7MLsgu0C7MLrwuwC7ULsAuzC7ULrQuvC7YLrwu3C7YLrwu1C7cLtQu4C7cLtwu4C6gLuAuhC6gLtgu3C6cLtwuoC6cLuQu6C7sLugu8C7sLugu9C7wLvQu+C7wLvAu+C78LvgvAC78Luwu8C8ELvAu/C8ELwAvCC78LwgvDC78LwgusCMMLrAjEC8MLwwvEC8ULxAvGC8ULvwvDC8ELwwvFC8ELwQvFC8cLxQvIC8cLxQvGC8gLxgvJC8gLyAvJC88IyQvNCM8IxwvIC9UIyAvPCNUIygvLC8wLywvNC8wLywvOC80LzgvPC80LzQvPC9ALzwvRC9ALzAvNC9ILzQvQC9ILzgvTC88L0wvUC88L0wuAC9QLgAvVC9QL1AvVC9YL1QvXC9YLzwvUC9EL1AvWC9EL0QvWC9gL1gvZC9gL1gvXC9kL1wvaC9kL2QvaC9sL2gvcC9sL2AvZC90L2QvbC90L0gvQC94L0AvfC94L0AvRC98L0QvYC98L3wvYC+AL2AvdC+AL3gvfC7kL3wvgC7kL4QviC+ML4gvkC+ML4gvKC+QLygvMC+QL5AvMC+ULzAvSC+UL4wvkC9UI5AvlC9UI0gveC+UL3gvmC+UL3gu5C+YLuQu7C+YL5gu7C8cLuwvBC8cL5QvmC9UI5gvHC9UIvQu6C+cLugvoC+cLugu5C+gLuQvgC+gL6AvgC+kL4AvdC+kL5wvoC+oL6AvpC+oL3QvbC+kL2wvrC+kL2wvcC+sL3AvsC+sL6wvsC+0L7AvuC+0L6QvrC+oL6wvtC+oL7wvwC/EL8AvyC/EL8AvzC/IL8wv0C/IL8gv0C/UL9Av2C/UL8QvyC/cL8gv1C/cL+Av5C/oL+Qv7C/oL+Qv8C/sL/Av9C/sL+wv9C/4L/Qv/C/4L+gv7C/YL+wv+C/YL9gv0C/oL9AsADPoL9AvzCwAM8wsBDAAMAAwBDAIMAQwDDAIM+gsADPgLAAwCDPgLAwwBDAQMAQwFDAQMAQzzCwUM8wvwCwUMBQzwCwYM8AvvCwYMBAwFDAcMBQwGDAcMCAwJDAoMCQwLDAoMCQwDDAsMAwwEDAsMCwwEDAwMBAwHDAwMCgwLDGoFCwwMDGoFDQwODA8MDgwQDA8MDgz4CxAM+AsCDBAMEAwCDAkMAgwDDAkMDwwQDAgMEAwJDAgMEQwSDBMMEgwUDBMMEgwVDBQMFQwWDBQMFAwWDBcMFgwYDBcMEwwUDBkMFAwXDBkMDQwaDBsMGgwcDBsMGgwdDBwMHQweDBwMHAweDBMMHgwRDBMMGwwcDBkMHAwTDBkM/wsfDCAMHwwhDCAMHwwiDCEMIgwjDCEMIQwjDCQMIwwlDCQMIAwhDCYMIQwkDCYMJgwkDCcMJAwoDCcMJAwlDCgMJQwpDCgMKAwpDOcLKQy9C+cLJwwoDOoLKAznC+oLIgwqDCMMKgwrDCMMKgwZDCsMGQwXDCsMKwwXDCwMFwwYDCwMIwwrDCUMKwwsDCUMGAwWDCwMFgwtDCwMFgwVDC0MFQwuDC0MLQwuDC8MLgwwDC8MLAwtDCUMLQwvDCUMMAwuDDEMLgwyDDEMLgwVDDIMFQwSDDIMMgwSDDMMEgwRDDMMMQwyDDQMMgwzDDQMEQweDDMMHgw1DDMMHgwdDDUMHQw2DDUMNQw2DDcMNgw4DDcMMww1DDQMNQw3DDQMOQw6DDsMOgw8DDsMOgwIDDwMCAwKDDwMPAwKDGcFCgxqBWcFOww8DGYFPAxnBWYFPQw+DD8MPgxADD8MPgxBDEAMQQxCDEAMQAxCDEMMQgw5DEMMPwxADEQMQAxDDEQMCAw6DA8MOgxFDA8MOgw5DEUMOQxCDEUMRQxCDEYMQgxBDEYMDwxFDA0MRQxGDA0MRAxDDEcMQwxIDEcMQww5DEgMOQw7DEgMSAw7DEkMOwxmBUkMRwxIDEoMSAxJDEoMSgxJDEsMSQxMDEsMSQxmBUwMZgVoBUwMTAxoBU0MaAVeBU0MSwxMDE4MTAxNDE4MTgxNDE8MTQxQDE8MTQxeBVAMXgVgBVAMUAxgBVoFYAVcBVoFTwxQDPkEUAxaBfkE9gQMBfcEDAVRDPcEDAUPBVEMDwVSDFEMUQxSDE8MUgxODE8M9wRRDPkEUQxPDPkETgxSDEsMUgxTDEsMUgwPBVMMDwVUDFMMUwxUDFUMVAxWDFUMSwxTDEoMUwxVDEoMVwxYDFkMWAxaDFkMWAyHBVoMhwWJBVoMWgyJBVsMiQWOBVsMWQxaDFwMWgxbDFwMDwUOBVQMDgVdDFQMDgUKBV0MCgVeDF0MXQxeDF8MXgxgDF8MVAxdDFYMXQxfDFYMCgUIBV4MCAVhDF4MCAUJBWEMCQWWBmEMYQyWBmIMlgZ0BWIMXgxhDGAMYQxiDGAMYAxiDGMMYgxkDGMMYgx0BWQMdAVyBWQMZAxyBYgFcgVzBYgFYwxkDIcFZAyIBYcFVgxfDGUMXwxmDGUMXwxgDGYMYAxjDGYMZgxjDFgMYwyHBVgMZQxmDFcMZgxYDFcMSgxVDEcMVQxnDEcMVQxWDGcMVgxlDGcMZwxlDGgMZQxXDGgMRwxnDEQMZwxoDEQMVwxZDGgMWQxpDGgMWQxcDGkMXAxqDGkMaQxqDD8Magw9DD8MaAxpDEQMaQw/DEQMaAdrDGcHawxsDGcHawxtDGwMbQxuDGwMbAxuDG8MbgxwDG8MZwdsDGkHbAxvDGkHNAw3DHEMNwxyDHEMNww4DHIMOAxzDHIMcgxzDHQMcwx1DHQMcQxyDHYMcgx0DHYMdwx4DHkMeAx6DHkMeAxRB3oMUQd+B3oMegx+B3sMfgd9B3sMeQx6DHwMegx7DHwMbQxrDH0Mawx+DH0MawxoB34MaAdmB34MfgxmB38MZgdjB38MfQx+DHcMfgx/DHcMYwdhB38MYQeADH8MYQdVB4AMVQdSB4AMgAxSB3gMUgdRB3gMfwyADHcMgAx4DHcMgQyCDIMMggyEDIMMggyOBYQMjgWMBYQMhAyMBYgGjAWNBYgGgwyEDKMFhAyIBqMFaQdvDGwHbwyFDGwHbwxwDIUMcAyGDIUMhQyGDIMMhgyBDIMMbAeFDKMFhQyDDKMFjgWCDFsMggyHDFsMggyBDIcMgQyIDIcMhwyIDIkMiAyKDIkMWwyHDFwMhwyJDFwMgQyGDIgMhgyLDIgMhgxwDIsMcAxuDIsMiwxuDIwMbgxtDIwMiAyLDIoMiwyMDIoMdgx0DI0MdAyODI0MdAx1DI4MdQyPDI4MjgyPDIwMjwyKDIwMjQyODG0MjgyMDG0MXAyJDGoMiQyQDGoMiQyKDJAMigyPDJAMkAyPDJEMjwx1DJEMagyQDD0MkAyRDD0MdQxzDJEMcwySDJEMcww4DJIMOAyTDJIMkgyTDD4MkwxBDD4MkQySDD0Mkgw+DD0MOAw2DJMMNgyUDJMMNgwdDJQMHQwaDJQMlAwaDEYMGgwNDEYMkwyUDEEMlAxGDEEMGQyVDBsMlQyWDBsMlQz8C5YM/Av5C5YMlgz5Cw4M+Qv4Cw4MGwyWDA0MlgwODA0MGQwqDJUMKgyXDJUMKgwiDJcMIgwfDJcMlwwfDP0LHwz/C/0LlQyXDPwLlwz9C/wL9wv1C5gM9QuZDJgM9Qv2C5kM9gv+C5kMmQz+CyAM/gv/CyAMmAyZDCYMmQwgDCYMmgybDJwMmwydDJwMmwz3C50M9wuYDJ0MnQyYDCcMmAwmDCcMnAydDOoLnQwnDOoL7gueDO0LngyfDO0LngygDJ8MoAyhDJ8MnwyhDJwMoQyaDJwM7QufDOoLnwycDOoLogyjDKQMowylDKQMowygDKUMoAymDKUMpQymDKcMpgyoDKcMpAylDKkMpQynDKkMqgyrDKwMqwytDKwMqwyuDK0MrgyvDK0MrQyvDLAMrwyxDLAMrAytDLIMrQywDLIMswy0DLUMtAy2DLUMtAzvC7YM7wvxC7YMtgzxC7cM8Qv3C7cMtQy2DLEMtgy3DLEMsQy3DLgMtwy5DLgMtwz3C7kM9wubDLkMuQybDLoMmwyaDLoMuAy5DLsMuQy6DLsMuwy6DLwMugy9DLwMugyaDL0MmgyhDL0MvQyhDKMMoQygDKMMvAy9DKIMvQyjDKIMvgy/DMAMvwzBDMAMvwy7DMEMuwy8DMEMwQy8DMIMvAyiDMIMwAzBDMMMwQzCDMMMsgywDMQMsAzFDMQMsAyxDMUMsQy4DMUMxQy4DL8MuAy7DL8MxAzFDL4MxQy/DL4MxgzHDMgMxwzJDMgMxwzKDMkMygzLDMkMyQzLDMwMywyuDMwMyAzJDM0MyQzMDM0MYgXODGMFzgzPDGMFzgzQDM8M0AzRDM8MzwzRDNIM0QzGDNIMYwXPDGUFzwzSDGUFagUMDGsFDAzTDGsFDAwHDNMMBwzUDNMM0wzUDM4M1AzQDM4MawXTDGIF0wzODGIFswzVDLQM1QzWDLQM1QzQDNYM0AzUDNYM1gzUDAYM1AwHDAYMtAzWDO8L1gwGDO8LswzXDNUM1wzYDNUM1wzKDNgMygzHDNgM2AzHDNEMxwzGDNEM1QzYDNAM2AzRDNAMrgzLDK8MywzZDK8MywzKDNkMygzXDNkM2QzXDLUM1wyzDLUMrwzZDLEM2Qy1DLEMqgzaDNsM2gzcDNsM2gzdDNwM3QzeDNwM3AzeDN8M3gzgDN8M2wzcDOEM3AzfDOEMXAVkBVsFZAXiDFsFZAVlBeIMZQXjDOIM4gzjDOQM4wzlDOQMWwXiDF0F4gzkDF0FZQXSDOMM0gzmDOMM0gzGDOYMxgzIDOYM5gzIDOcMyAzNDOcM4wzmDOUM5gznDOUM6AzpDOoM6QzrDOoM6QzsDOsM7AztDOsM6wztDJoF7QyYBZoF6gzrDHgF6wyaBXgFFwXuDBwF7gzvDBwF7gzoDO8M6AzqDO8M7wzqDHUF6gx4BXUFHAXvDB0F7wx1BR0FFwUWBe4MFgXwDO4MFgX6BPAM+gRYBfAM8AxYBfEMWAVdBfEM7gzwDOgM8AzxDOgMXQXkDPEM5AzyDPEM5AzlDPIM5QzzDPIM8gzzDOkM8wzsDOkM8QzyDOgM8gzpDOgM7Az0DO0M9Az1DO0M9AzhDPUM4QzfDPUM9QzfDPYM3wzgDPYM7Qz1DJgF9Qz2DJgF5QznDPMM5wz3DPMM5wzNDPcMzQz4DPcM9wz4DPQM+AzhDPQM8wz3DOwM9wz0DOwMqgzbDKsM2wz5DKsM2wzhDPkM4Qz4DPkM+Qz4DMwM+AzNDMwMqwz5DK4M+QzMDK4M+gz7DPwM+wz9DPwM+wzdDP0M3QzaDP0M/QzaDKwM2gyqDKwM/Az9DLIM/QysDLIMsgz+DPwM/gz/DPwM/gwADf8MAA0BDf8M/Az/DPoM/wwBDfoMAg0DDQQNAw0FDQQNAw0GDQUNBg0HDQUNBQ0HDQgNBw0JDQgNBA0FDcMMBQ0IDcMMEwgKDaYICg0LDaYICg0dAAsNHQAeAAsNCw0eAAwNHgARAAwNpggLDacICw0MDacIEggNDREIDQ0ODREIDQ0VAA4NFQAXAA4NDg0XAAoNFwAdAAoNEQgODRMIDg0KDRMIEAYOBh8IDgYPDR8IDgYPBg8NDwYQDQ8NDw0QDQ0NEA0VAA0NHwgPDRIIDw0NDRIIDwYVBhANFQYRDRANFQanBRENpwWkBRENEQ2kBRYApAUZABYAEA0RDRUAEQ0WABUAEg0TDRQNEw0VDRQNEw0WDRUNFg0XDRUNFQ0XDRgNFw36DBgNFA0VDRkNFQ0YDRkN4AwaDfYMGg0bDfYMGg0WDRsNFg0cDRsNGw0cDZkFHA2cBZkF9gwbDZgFGw2ZBZgFFg0aDRcNGg0dDRcNGg3gDB0N4AzeDB0NHQ3eDPsM3gzdDPsMFw0dDfoMHQ37DPoMnAUeDZ0FHg0fDZ0FHg0gDR8NIA0hDR8NHw0hDSAGIQ0WBiAGnQUfDXsFHw0gBnsFFg0TDRwNEw0iDRwNEw0SDSINEg0jDSINIg0jDR4NIw0gDR4NHA0iDZwFIg0eDZwFFAAkDSUNJA0mDSUNJA0SDSYNEg0UDSYNJg0UDScNFA0ZDScNJQ0mDQANJg0nDQANggsoDSkNKA0qDSkNKA11CyoNdQtzCyoNKg1zCysNcwsEACsNKQ0qDSwNKg0rDSwNLA0tDS4NLQ0vDS4NLQ0AAC8NAAAwDS8NLw0wDQcNMA0JDQcNLg0vDQYNLw0HDQYNnAuaCzENmgsyDTENmguYCzINmAszDTINMg0zDS4NMw0sDS4NMQ0yDQYNMg0uDQYNmAuWCzMNlgs0DTMNlguGCzQNhguDCzQNNA2DCykNgwuCCykNMw00DSwNNA0pDSwNAAAtDQEALQ01DQEALQ0sDTUNLA0rDTUNAQA1DQQANQ0rDQQANg03DTgNNw05DTgNNw0LADkNCwAJADkNOQ0JADoNCQAIADoNOA05DTsNOQ06DTsNsQiwCDwNsAg9DTwNsAj+Bz0N/gerCD0NPQ2rCD4NqwinCD4NPA09DTYNPQ0+DTYNpwgMDT4NDA0/DT4NDA0RAD8NEQAPAD8NPw0PADcNDwALADcNPg0/DTYNPw03DTYNQA1BDUINQQ1DDUINQQ2yCEMNsgi0CEMNQw20COEItAi6COEIQg1DDeAIQw3hCOAIzQjJC94IyQtEDd4IyQvGC0QNxgtFDUQNRA1FDUINRQ1ADUIN3ghEDeAIRA1CDeAIxgvEC0UNxAtGDUUNxAusCEYNrAiuCEYNRg2uCEcNrgixCEcNRQ1GDUANRg1HDUANOw1IDUkNSA1KDUkNSA1LDUoNSw1MDUoNSg1MDUENTA2yCEENSQ1KDUANSg1BDUANsQg8DUcNPA1NDUcNPA02DU0NNg04DU0NTQ04DUkNOA07DUkNRw1NDUANTQ1JDUANBwBODQYATg1PDQYATg1LDU8NSw1IDU8NTw1IDToNSA07DToNBgBPDQgATw06DQgAUA1RDVINUQ1TDVINUQ1UDVMNVA1VDVMNUw1VDQQNVQ0CDQQNUg1TDcMMUw0EDcMMVg1XDVgNVw1ZDVgNVw1aDVkNWg1bDVkNWQ1bDVENWw1UDVENWA1ZDVANWQ1RDVANXA1dDV4NXQ1fDV4NXQ1aDV8NWg1XDV8NXw1XDWANVw1WDWANXg1fDWENXw1gDWENYg1jDWQNYw1lDWQNYw1mDWUNZg1nDWUNZQ1nDWgNZw1pDWgNZA1lDWoNZQ1oDWoNaw1sDW0NbA1uDW0NbA1vDW4Nbw1wDW4Nbg1wDWQNcA1iDWQNbQ1uDWoNbg1kDWoNrAurC3ENqwtyDXENqwumC3INpgtzDXINcg1zDWwNcw1vDWwNcQ1yDWsNcg1sDWsNkguQC6ULkAt0DaULkAuPC3QNjwt1DXQNdA11DXMNdQ1vDXMNpQt0DaYLdA1zDaYLbw11DXANdQ12DXANdQ2PC3YNjwuMC3YNdg2MC3cNjAuLC3cNcA12DWINdg13DWINeA15DXoNeQ17DXoNeQ18DXsNfA19DXsNew19DV0NfQ1aDV0NXQ1cDXsNXA16DXsNfg1/DYANfw2BDYANfw18DYENfA15DYENgQ15DYINeQ14DYINgA2BDWYNgQ2CDWYNfA2DDX0Ngw2EDX0Ngw2FDYQNhQ2GDYQNhA2GDVsNhg1UDVsNfQ2EDVoNhA1bDVoNnAuHDZsLhw2IDZsLhw2JDYgNiQ2KDYgNiA2KDYsNig1+DYsNmwuIDYsLiA2LDYsLAg2MDQMNjA2NDQMNjA2JDY0NiQ2HDY0NjQ2HDTENhw2cCzENAw2NDQYNjQ0xDQYNVA2GDVUNhg2ODVUNhg2FDY4NhQ2PDY4Njg2PDYwNjw2JDYwNVQ2ODQINjg2MDQINiQ2PDYoNjw2QDYoNjw2FDZANhQ2DDZANkA2DDX8Ngw18DX8Nig2QDX4NkA1/DX4Nfg2ADYsNgA2RDYsNgA1mDZENZg1jDZENkQ1jDXcNYw1iDXcNiw2RDYsLkQ13DYsLZg2CDWcNgg2SDWcNgg14DZINeA2TDZINkg2TDZQNkw2VDZQNZw2SDWkNkg2UDWkNeA16DZMNeg2WDZMNeg1cDZYNXA2XDZYNlg2XDZgNlw2ZDZgNkw2WDZUNlg2YDZUNmg2bDZwNmw2dDZwNmw2eDZ0Nng2fDZ0NnQ2fDaANnw2hDaANnA2dDWENnQ2gDWENYQ2gDV4NoA2iDV4NoA2hDaINoQ2jDaINog2jDZcNow2ZDZcNlw1cDaINXA1eDaINpA2lDaYNpQ2nDaYNpQ2aDacNmg2cDacNpw2cDWANnA1hDWANpg2nDVYNpw1gDVYNqQyoDakNqA2qDakNqA2kDaoNpA2mDaoNqg2mDVgNpg1WDVgNqQ2qDVANqg1YDVANogykDMIMpAyrDcIMpAypDKsNqQypDasNqw2pDVINqQ1QDVINwgyrDcMMqw1SDcMMqAysDacMrA2tDacMrA2uDa0Nrg2vDa0NrQ2vDagNrw2kDagNpwytDakMrQ2oDakMsA2xDbINsQ2zDbINsQ20DbMNtA21DbMNsg2zDbYNsw21DbYNtw24DbkNuA26DbkNuA27DboNuw28DboNug28Db0NvA2+Db0NuQ26Db8Nug29Db8Nvg3ADb0NwA3BDb0NwA3CDcENwg3DDcENwQ3DDcQNww3FDcQNvQ3BDb8NwQ3EDb8Nxg3HDcgNxw3JDcgNxw3KDckNyg3LDckNyQ3LDcwNyw3NDcwNyA3JDc4NyQ3MDc4NzQ3LDc8Nyw3QDc8Nyw3KDdANyg3RDdAN0A3RDdIN0Q3TDdINzw3QDcUN0A3SDcUN1A3VDdYN1Q3XDdYN1Q3YDdcN2A3ZDdcN1w3ZDdoN2Q3bDdoN1g3XDdwN1w3aDdwN3Q3eDd8N3g3gDd8N3g3UDeAN1A3WDeAN4A3WDeEN1g3cDeEN3w3gDeIN4A3hDeIN4w3kDeUN5A3mDeUN5A20DeYNtA3nDeYN5g3nDd4N5w3UDd4N5Q3mDd0N5g3eDd0NtA2xDecNsQ3oDecNsQ2wDegNsA3pDegN6A3pDdUN6Q3YDdUN5w3oDdQN6A3VDdQN6g3rDewN6w3tDewN6w3uDe0N7g3vDe0N7Q3vDfAN7w3xDfAN7A3tDfIN7Q3wDfIN8w30DfUN9A32DfUN9A33DfYN9w34DfYN9g34DfkN+A36DfkN9Q32DfsN9g35DfsN/A39Df4N/Q3/Df4N/Q3qDf8N6g0ADv8N/w0ADvUNAA7zDfUN/g3/DfsN/w31DfsN0w0BDgIOAQ4DDgIOAQ7zDQMO8w0ADgMOAw4ADuwNAA7qDewNAg4DDvINAw7sDfIN/A0EDv0NBA4FDv0NBA4GDgUOBg4HDgUOBQ4HDusNBw7uDesN/Q0FDuoNBQ7rDeoN2w0IDgkOCA4KDgkOCA4LDgoOCw4MDgoOCg4MDg0ODA4ODg0OCQ4KDg8OCg4NDg8O2w3ZDQgO2Q0QDggO2Q3YDRAO2A0RDhAOEA4RDhIOEQ4TDhIOCA4QDgsOEA4SDgsO2A3pDREO6Q0UDhEO6Q2wDRQOsA0VDhQOFA4VDhYOFQ4XDhYOEQ4UDhMOFA4WDhMO8g3wDRgO8A0ZDhgO8A3xDRkO8Q0aDhkOGQ4aDhsOGg4cDhsOGA4ZDr8NGQ4bDr8NxQ3SDcQN0g0dDsQN0g3TDR0O0w0CDh0OHQ4CDhgOAg7yDRgOxA0dDr8NHQ4YDr8Nyg0eDtENHg4fDtENHg73DR8O9w30DR8OHw70DQEO9A3zDQEO0Q0fDtMNHw4BDtMN+g34DSAO+A0hDiAO+A33DSEO9w0eDiEOIQ4eDscNHg7KDccNIA4hDsYNIQ7HDcYN+w35DSIO+Q0jDiIO+Q36DSMO+g0kDiMOIw4kDiUOJA4mDiUOIg4jDicOIw4lDicO+g0gDiQOIA4oDiQOIA7GDSgOxg0pDigOKA4pDioOKQ4rDioOJA4oDiYOKA4qDiYOzg0sDsgNLA4tDsgNLA4uDi0OLg4vDi0OLQ4vDikOLw4rDikOyA0tDsYNLQ4pDsYNMA4xDjIOMQ4zDjIOMQ40DjMONA41DjMOMw41DjYONQ43DjYOMg4zDjgOMw42DjgOKw4vDjkOLw46DjkOLw4uDjoOLg47DjoOOg47DjwOOw49DjwOOQ46Dj4OOg48Dj4OPw5ADkEOQA5CDkEOQA5DDkIOQw5EDkIOQg5EDrcIRA65CLcIQQ5CDrYIQg63CLYIhgOEA0UOhANGDkUOhANfA0YOXwNHDkYORg5HDkgORw4/DkgORQ5GDkkORg5IDkkOPw5HDkAORw5KDkAORw5fA0oOXwNdA0oOSg5dA0sOXQNRA0sOQA5KDkMOSg5LDkMOTA5NDk4OTQ5PDk4OTQ5QDk8OUA5RDk8OTw5RDlIOUQ5TDlIOTg5PDlQOTw5SDlQORAlVDkUJVQ5WDkUJVQ5XDlYOVw5YDlYOVg5YDlkOWA5UDlkORQlWDkcJVg5ZDkcJWg5bDlwOWw5dDlwOWw5eDl0OXg5fDl0OXQ5fDlUOXw5XDlUOXA5dDkQJXQ5VDkQJYA5hDmIOYQ5jDmIOYQ5eDmMOXg5bDmMOYw5bDmQOWw5aDmQOYg5jDmUOYw5kDmUOFQkXCWYOFwlnDmYOFwkdCWcOHQkfCWcOZw4fCWgOHwkeCWgOZg5nDmkOZw5oDmkOaQ5oDmoOaA5rDmoOaA4eCWsOHgkgCWsOaw4gCSUJIAkjCSUJag5rDiQJaw4lCSQJJAm/CWoOvwlsDmoOvwmzCWwOswmxCWwObA6xCW0OsQkTCW0Oag5sDmkObA5tDmkObg5vDnAObw5xDnAObw5pDnEOaQ5tDnEOcQ5tDhAJbQ4TCRAJcA5xDg8JcQ4QCQ8Jcg5zDnQOcw51DnQOcw4VCXUOFQlmDnUOdQ5mDm8OZg5pDm8OdA51Dm4OdQ5vDm4Odg53DngOdw55DngOdw56DnkOeg57DnkOeQ57DnwOew59DnwOeA55Dn4OeQ58Dn4Oeg5/DnsOfw6ADnsOfw5yDoAOcg50DoAOgA50DoEOdA5uDoEOew6ADn0OgA6BDn0Ogg6DDoQOgw6FDoQOgw4ZCYUOGQkWCYUOhQ4WCYYOFgkVCYYOhA6FDocOhQ6GDocObQmIDnUJiA6JDnUJiA6CDokOgg6KDokOiQ6KDiMLig4kCyMLdQmJDnYJiQ4jC3YJHAkaCW8JGgmLDm8JGgkZCYsOGQmDDosOiw6DDogOgw6CDogObwmLDm0Jiw6IDm0Jhw6MDo0OjA6ODo0OjA5gDo4OYA5iDo4Ojg5iDo8OYg5lDo8OjQ6ODpAOjg6PDpAOkA6PDpEOjw6SDpEOjw5lDpIOZQ6TDpIOkg6TDiYLkw4pCyYLkQ6SDiULkg4mCyULJAuUDiELlA6VDiELlA6QDpUOkA6RDpUOlQ6RDi4LkQ4lCy4LIQuVDh8LlQ4uCx8LJAuKDpQOig6WDpQOig6CDpYOgg6EDpYOlg6EDo0OhA6HDo0OlA6WDpAOlg6NDpAOcg6XDnMOlw6YDnMOlw5gDpgOYA6MDpgOmA6MDoYOjA6HDoYOcw6YDhUJmA6GDhUJXg5hDpkOYQ6aDpkOYQ5gDpoOYA6XDpoOmg6XDn8Olw5yDn8OmQ6aDnoOmg5/DnoOVw5fDpsOXw6cDpsOXw5eDpwOXg6ZDpwOnA6ZDncOmQ56DncOmw6cDnYOnA53DnYOVw6bDlgOmw6dDlgOmw52Dp0Odg6eDp0OnQ6eDk4Ong5MDk4OWA6dDlQOnQ5ODlQOnw6gDqEOoA6iDqEOoA6jDqIOow6kDqIOog6kDk0OpA5QDk0OoQ6iDkwOog5NDkwOTA6eDqEOng6lDqEOng52DqUOdg54DqUOpQ54DqYOeA5+DqYOoQ6lDp8OpQ6mDp8OfQ6BDqcOgQ6oDqcOgQ5uDqgObg5wDqgOqA5wDqkOcA4PCakOpw6oDqoOqA6pDqoOfg58DqsOfA6sDqsOfA59DqwOfQ6nDqwOrA6nDq0Opw6qDq0Oqw6sDq4OrA6tDq4Oqg6pDq8OqQ6wDq8OqQ4PCbAODwkRCbAOsA4RCbEOEQn/CLEOrw6wDrIOsA6xDrIOxAjGCLMOxgi0DrMOxgjMCLQOzAhbCrQOtA5bCrUOWwq7CLUOsw60DrYOtA61DrYOtg61DrcOtQ64DrcOtQ67CLgOuwi9CLgOuA69CPEIvQjDCPEItw64Du8IuA7xCO8Isg6xDrkOsQ66DrkOsQ7/CLoO/wj+CLoOug7+CLMO/gjECLMOuQ66DrYOug6zDrYOuw68Dr0OvA6+Dr0OvA6yDr4Osg65Dr4Ovg65DrcOuQ62DrcOvQ6+Du8Ivg63Du8Iuw6/DrwOvw7ADrwOvw6uDsAOrg6tDsAOwA6tDq8OrQ6qDq8OvA7ADrIOwA6vDrIOwQ7CDsMOwg7EDsMOwg7FDsQOxQ7GDsQOxA7GDr8Oxg6uDr8Oww7EDrsOxA6/DrsO7AjHDu0Ixw7IDu0Ixw7BDsgOwQ7DDsgOyA7DDr0Oww67Dr0O7QjIDu8IyA69Du8IyQ7KDssOyg7MDssOyg7NDswOzQ7ODswOzA7ODscOzg7BDscOyw7MDuwIzA7HDuwIzQ7PDs4Ozw7QDs4Ozw7RDtAO0Q7SDtAO0A7SDsIO0g7FDsIOzg7QDsEO0A7CDsEOxQ7TDsYO0w7UDsYO0w6fDtQOnw6mDtQO1A6mDqsOpg5+DqsOxg7UDq4O1A6rDq4O0Q7VDtIO1Q7WDtIO1Q6jDtYOow6gDtYO1g6gDtMOoA6fDtMO0g7WDsUO1g7TDsUOSwNIA9cOSAPYDtcOSANHA9gORwPZDtgO2A7ZDtUO2Q6jDtUO1w7YDtEO2A7VDtEO2g7bDtwO2w7dDtwO2w7JDt0OyQ7LDt0O3Q7LDuoIyw7sCOoI3A7dDukI3Q7qCOkIuQhEDucIRA7eDucIRA5DDt4OQw7fDt4O3g7fDtwO3w7aDtwO5wjeDukI3g7cDukIQw5LDt8OSw7gDt8OSw5RA+AOUQNOA+AO4A5OA+EOTgNNA+EO3w7gDtoO4A7hDtoOTQNUA+EOVAPiDuEOVANTA+IOUwPjDuIO4g7jDtsO4w7JDtsO4Q7iDtoO4g7bDtoOVwNbA+QOWwPlDuQOWwNLA+UOSwPXDuUO5Q7XDs8O1w7RDs8O5A7lDs0O5Q7PDs0OUwNYA+MOWAPmDuMOWANXA+YOVwPkDuYO5g7kDsoO5A7NDsoO4w7mDskO5g7KDskOow7ZDqQO2Q7nDqQO2Q5HA+cORwNsA+cO5w5sA+gObANrA+gOpA7nDlAO5w7oDlAOUA7oDlEO6A7pDlEO6A5rA+kOawNwA+kO6Q5wA+oOcANvA+oOUQ7pDlMO6Q7qDlMO6w7sDu0O7A7uDu0O7A7vDu4O7w7wDu4O7g7wDvEO8A7yDvEO7Q7uDvMO7g7xDvMO9A71DvYO9Q73DvYO9Q74DvcO+A75DvcO9w75DvoO+Q77DvoO9g73DvwO9w76DvwO/Q7+Dv8O/g4AD/8O/g4BDwAPAQ8CDwAPAA8CD/oOAg/8DvoO/w4AD/sOAA/6DvsOAw8EDwUPBA8GDwUPBA95CwYPeQt7CwYPBg97CwcPewuBCwcPBQ8GDzAOBg8HDzAOCA8JDwoPCQ8LDwoPCQ8MDwsPDA8NDwsPCw8NDw4PDQ8PDw4PCg8LD/IOCw8OD/IOtw25DRAPuQ0RDxAPuQ2/DREPvw0bDhEPEQ8bDhIPGw4cDhIPEA8RDxMPEQ8SDxMPsA2yDRUOsg0UDxUOsg22DRQPtg0VDxQPFA8VDxYPFQ8XDxYPFQ4UDxcOFA8WDxcOFw8VDxgPFQ8ZDxgPFQ+2DRkPtg21DRkPGQ+1DeQNtQ20DeQNGA8ZD+MNGQ/kDeMNGg8bDxwPGw8dDxwPGw+3DR0Ptw0QDx0PHQ8QDx4PEA8TDx4PHA8dDx8PHQ8eDx8PIA8hDyIPIQ8jDyIPIQ8kDyMPJA8lDyMPIw8lD/EOJQ/zDvEOIg8jD/IOIw/xDvIOHw8mDxwPJg8nDxwPJg8oDycPKA8pDycPJw8pDyoPKQ8rDyoPHA8nDxoPJw8qDxoPKA8sDykPLA8tDykPLA8uDy0PLg8vDy0PLQ8vDzAPLw8xDzAPKQ8tDysPLQ8wDysPKw8wDzIPMA8zDzIPMA8xDzMPMQ80DzMPMw80DzUPNA82DzUPMg8zDyQPMw81DyQPGg8qDzcPKg84DzcPKg8rDzgPKw8yDzgPOA8yDyEPMg8kDyEPNw84DyAPOA8hDyAPIA85DzcPOQ86DzcPOQ87DzoPOw88DzoPOg88DxsPPA+3DRsPNw86DxoPOg8bDxoPPQ8+Dz8PPg9ADz8PPg9BD0APQQ9CD0APQA9CD0MPQg9ED0MPPw9ADzgOQA9DDzgOzQ1FD8wNRQ9GD8wNRQ9BD0YPQQ8+D0YPRg8+D0cPPg89D0cPzA1GD84NRg9HD84Nwg1ID8MNSA9JD8MNSA9BD0kPQQ9FD0kPSQ9FD88NRQ/NDc8Nww1JD8UNSQ/PDcUNwg3ADUoPwA1LD0oPwA2+DUsPvg28DUsPSw+8DUwPvA27DUwPSg9LD00PSw9MD00PTQ9MD04PTA9PD04PTA+7DU8Puw24DU8PTw+4DTwPuA23DTwPTg9PDzsPTw88DzsPQQ9ID0IPSA9QD0IPSA/CDVAPwg1KD1APUA9KD1EPSg9ND1EPQg9QD0QPUA9RD0QPRA9RD1IPUQ9TD1IPUQ9ND1MPTQ9OD1MPUw9OD1QPTg87D1QPUg9TDw8PUw9UDw8PDw9UDw4PVA9VDw4PVA87D1UPOw85D1UPVQ85DyIPOQ8gDyIPDg9VD/IOVQ8iD/IORA9SD0MPUg9WD0MPUg8PD1YPDw8ND1YPVg8ND1cPDQ8MD1cPQw9WDzgOVg9XDzgODA9YD1cPWA9ZD1cPWA8DD1kPAw8FD1kPWQ8FDzIOBQ8wDjIOVw9ZDzgOWQ8yDjgO/Q5aD/4OWg9bD/4OWg95C1sPeQsED1sPWw8ED1wPBA8DD1wP/g5bDwEPWw9cDwEPDA8JD1gPCQ9dD1gPCQ8ID10PCA9eD10PXQ9eD1wPXg8BD1wPWA9dDwMPXQ9cDwMPAQ9eDwIPXg9fDwIPXg8ID18PCA8KD18PXw8KD2APCg/yDmAPAg9fD/wOXw9gD/wO8g7wDmAP8A5hD2AP8A7vDmEP7w5iD2EPYQ9iD/YOYg/0DvYOYA9hD/wOYQ/2DvwO9A5iD2MPYg9kD2MPYg/vDmQP7w7sDmQPZA/sDmUP7A7rDmUPYw9kD2YPZA9lD2YPZw9oD2kPaA9qD2kPaA9rD2oPaw9sD2oPag9sD20PbA9uD20PaQ9qD28Pag9tD28PcA9xD3IPcQ9zD3IPcQ9mD3MPZg9lD3MPcw9lD3QPZQ/rDnQPcg9zD3UPcw90D3UPdg93D3gPdw95D3gPdw/0DnkP9A5jD3kPeA95D2YPeQ9jD2YPeg97D3wPew99D3wPew9+D30Pfg9/D30PfQ9/D4APfw92D4APfA99D4EPfQ+AD4EPgg+DD4QPgw+FD4QPgw+GD4UPhg+HD4UPhQ+HD4gPhw+JD4gPhA+FD4oPhQ+ID4oPiw+MD40PjA+OD40PjA+CD44Pgg+ED44Pjg+ED48PhA+KD48PjQ+OD2sPjg+PD2sPgQ+AD5APgA+RD5APgA92D5EPdg94D5EPkQ94D3EPeA9mD3EPkA+RD3APkQ9xD3APkg+TD5QPkw+VD5QPkw+WD5UPlg+XD5UPlQ+XD4cPlw+JD4cPlA+VD4YPlQ+HD4YPmA+ZD5oPmQ+bD5oPmQ+cD5sPnA+dD5sPmw+dD54PnQ+fD54Pmg+bD6APmw+eD6APnw+hD54PoQ+iD54PoQ+jD6IPow+kD6IPog+kD6UPpA+mD6UPng+iD6APog+lD6APJA81DyUPNQ+nDyUPNQ82D6cPNg+oD6cPpw+oD6kPqA+qD6kPJQ+nD/MOpw+pD/MOqw+sD60PrA+uD60PrA+WD64Plg+TD64Prg+TD68Pkw+SD68PrQ+uD7APrg+vD7AP6w7tDnQP7Q6xD3QP7Q7zDrEP8w6pD7EPsQ+pD7IPqQ+qD7IPdA+xD3UPsQ+yD3UPsA+zD60Psw+0D60Psw+1D7QPtQ+2D7QPtA+2D7cPtg+4D7cPrQ+0D6sPtA+3D6sPDw4NDrkPDQ66D7kPDQ4ODroPDg67D7oPug+7D7wPuw+9D7wPuQ+6D74Pug+8D74PmA+/D5kPvw/AD5kPvw++D8APvg+8D8APwA+8D8EPvA+9D8EPmQ/AD5wPwA/BD5wPtQ/CD7YPwg/DD7YPwg/ED8MPxA/FD8MPww/FD8YPxQ/HD8YPtg/DD7gPww/GD7gPxA/ID8UPyA/JD8UPyA/iDckP4g3hDckPyQ/hDcoP4Q3cDcoPxQ/JD8cPyQ/KD8cPxw/KD8sPyg/MD8sPyg/cDcwP3A3aDcwPzA/aDQkO2g3bDQkOyw/MDw8OzA8JDg8OuA/GD80Pxg/OD80Pxg/HD84Pxw/LD84Pzg/LD7kPyw8PDrkPzQ/OD74Pzg+5D74PuA/ND7cPzQ/PD7cPzQ++D88Pvg+/D88Pzw+/D9APvw+YD9APtw/PD6sPzw/QD6sPoA/RD5oP0Q/SD5oP0Q+WD9IPlg+sD9IP0g+sD9APrA+rD9APmg/SD5gP0g/QD5gPiQ+XD9MPlw/UD9MPlw+WD9QPlg/RD9QP0w/UD6AP1A/RD6APig+ID9UPiA/WD9UPiA+JD9YPiQ/TD9YP1g/TD6UP0w+gD6UP1Q/WD6YP1g+lD6YPbg9sD9cPbA/YD9cPbA9rD9gPaw+PD9gP2A+PD9UPjw+KD9UP1w/YD6YP2A/VD6YPfg97D9kPew/aD9kPew96D9oPeg/bD9oP2g/bD9wP2w/dD9wP2Q/aD94P2g/cD94P3w/gD+EP4A/iD+EP4A9+D+IPfg/ZD+IP4g/ZD+MP2Q/eD+MP4Q/iD+QP4g/jD+QP9A53D+UPdw/mD+UPdw92D+YPdg9/D+YP5g9/D+APfw9+D+AP5Q/mD98P5g/gD98P5w/oD+kP6A/qD+kP6A/4DuoP+A71DuoP6g/1DuUP9Q70DuUP6Q/qD98P6g/lD98P6w/sD+0P7A/uD+0P7A/vD+4P7w/wD+4P7g/wD/EP8A/yD/EP7Q/uD/MP7g/xD/MP9A/1D/YP9Q/3D/YP9Q/4D/cP+A/5D/cP9w/5D+wP+Q/vD+wP9g/3D+sP9w/sD+sP9A/2D/oP9g/7D/oP9g/rD/sP6w/8D/sP+w/8D/0P/A/+D/0P+g/7Dz4O+w/9Dz4O+A/1D/8P9Q8AEP8P9Q/0DwAQ9A8BEAAQ/w8AEAIQABABEAIQPg48DvoPPA4DEPoPPA49DgMQPQ4EEAMQAxAEEAEQBBACEAEQ+g8DEPQPAxABEPQPBRAGEAcQBhAIEAcQBhAJEAgQCRAKEAgQCBAKEOILChDKC+IL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7AtZEe4LWRFWEe4LWhFcEVsRXBFdEVsRXBFPEV0RTxFeEV0RXRFeEVERXhFUEVERWxFdEVARXRFREVARgAt+C9ULfgtfEdULfgt9C18RfQtgEV8RXxFgEWERYBFiEWER1QtfEdcLXxFhEdcLYhFgEWMRYBFkEWMRYBF9C2QRfQt6C2QRZBF6C1oPegt5C1oPYxFkEf0OZBFaD/0OYhFjEWURYxFmEWURYxH9DmYR/Q7/DmYRZhH/DmcR/w77DmcRZRFmEUcRZhFnEUcR3AvaC1gR2gtoEVgR2gvXC2gR1wthEWgRaBFhEWkRYRFiEWkRWBFoEVoRaBFpEVoRRxFJEWURSRFqEWURSRFPEWoRTxFcEWoRahFcEWkRXBFaEWkRZRFqEWIRahFpEWIRrg1rEa8NaxFsEa8NaxFtEWwRbRFuEWwRbBFuEaUNbhGaDaUNrw1sEaQNbBGlDaQNVBFvEVURbxFwEVURbxFxEXARcRFyEXARcBFyEWsRchFtEWsRVRFwEa4NcBFrEa4NbRFzEW4RcxF0EW4RcxF1EXQRdRF2EXQRdBF2EZsNdhGeDZsNbhF0EZoNdBGbDZoNThF3EXgRdxF5EXgRdxF6EXkRehF7EXkReRF7EXwRexF9EXwReBF5EXEReRF8EXERcRF8EXIRfBF+EXIRfBF9EX4RfRF/EX4RfhF/EXMRfxF1EXMRchF+EW0RfhFzEW0RTxFNEV4RTRGAEV4RTRFOEYARThF4EYARgBF4EW8ReBFxEW8RXhGAEVQRgBFvEVQR+w75DoER+Q6CEYER+Q74DoIR+A7oD4IRghHoD4MR6A/nD4MRgRGCEYQRghGDEYQRhBGFEYYRhRGHEYYRhRGIEYcRiBGJEYcRhxGJEYoRiRGLEYoRhhGHEUsRhxGKEUsRhBGGEYERhhGMEYERhhFLEYwRSxFIEYwRjBFIEWcRSBFHEWcRgRGMEfsOjBFnEfsOjRGOEY8RjhGQEY8RjhHnD5AR5w/pD5ARkBHpD+EP6Q/fD+EPjxGQEeQPkBHhD+QPhBGDEYURgxGREYURgxHnD5ER5w+OEZERkRGOEZIRjhGNEZIRhRGREYgRkRGSEYgRSxGKEUwRihGTEUwRihGLEZMRixGUEZMRkxGUEXcRlBF6EXcRTBGTEU4RkxF3EU4RlRGWEZcRlhGYEZcRlhGZEZgRmRGaEZgRmBGaEZsRmhGcEZsRlxGYEZ0RmBGbEZ0RnhGfEaARnxGhEaARnxGiEaERohGjEaERoRGjEaQRoxGlEaQRoBGhEaYRoRGkEaYRpxGoEakRqBGqEakRqBGrEaoRqxGsEaoRqhGsEa0RrBGuEa0RqRGqEa8RqhGtEa8RrhGsEbARrBGxEbARrBGrEbERqxGyEbERsRGyEZ8RshGiEZ8RsBGxEZ4RsRGfEZ4RnBGaEbMRmhG0EbMRmhGZEbQRmRG1EbQRtBG1EbYRtRG3EbYRsxG0EbgRtBG2EbgRtxG5EbYRuRG6EbYRuRGnEboRpxGpEboRuhGpEbsRqRGvEbsRthG6EbgRuhG7EbgRvBG9Eb4RvRG/Eb4RvRGVEb8RlRGXEb8RvxGXEcARlxGdEcARvhG/EcERvxHAEcERwhHDEcQRwxHFEcQRwxG8EcURvBG+EcURxRG+EcYRvhHBEcYRxBHFEccRxRHGEccRphGkEcgRpBHJEcgRpBGlEckRpRHKEckRyRHKEcQRyhHCEcQRyBHJEccRyRHEEccRrxGtEcsRrRHMEcsRrRGuEcwRrhGwEcwRzBGwEaARsBGeEaARyxHMEaYRzBGgEaYRxxHNEcgRzRHOEcgRzRG4Ec4RuBG7Ec4RzhG7EcsRuxGvEcsRyBHOEaYRzhHLEaYRwRHAEcYRwBHPEcYRwBGdEc8RnRHQEc8RzxHQEc0R0BG4Ec0RxhHPEccRzxHNEccRnRGbEdARmxHREdARmxGcEdERnBGzEdER0BHREbgR0RGzEbgRmRHSEbUR0hHTEbUR0hHUEdMR1BHVEdMR0xHVEdYR1RHXEdYRtRHTEbcR0xHWEbcR1BHYEdUR2BHZEdUR2BE/CdkRPwk9CdkR2RE9CdoRPQkwCdoR1RHZEdcR2RHaEdcRlRHbEZYR2xHcEZYR2xHdEdwR3RHeEdwR3BHeEdIR3hHUEdIRlhHcEZkR3BHSEZkR3RHfEd4R3xHgEd4R3xFiCeARYglkCeAR4BFkCdgRZAk/CdgR3hHgEdQR4BHYEdQRvBHhEb0R4RHiEb0R4RHjEeIR4xHkEeIR4hHkEdsR5BHdEdsRvRHiEZUR4hHbEZUR4xHlEeQR5RHmEeQR5RFjCeYRYwlhCeYR5hFhCd8RYQliCd8R5BHmEd0R5hHfEd0RwhHnEcMR5xHoEcMR5xHpEegR6RHqEegR6BHqEeER6hHjEeERwxHoEbwR6BHhEbwR6RHrEeoR6xHsEeoR6xH1CuwR9Qr3CuwR7BH3CuUR9wpjCeUR6hHsEeMR7BHlEeMRpRHtEcoR7RHuEcoR7RHvEe4R7xHwEe4R7hHwEecR8BHpEecRyhHuEcIR7hHnEcIR7xHxEfAR8RHyEfAR8RFaCfIRWgn7CvIR8hH7CusR+wr1CusR8BHyEekR8hHrEekRohHzEaMR8xH0EaMR8xH1EfQR9RH2EfQR9BH2Ee0R9hHvEe0RoxH0EaUR9BHtEaUR9RH3EfYR9xH4EfYR9xF3CfgRdwkAC/gR+BEAC/ERAAtaCfER9hH4Ee8R+BHxEe8RqxH5EbIR+RH6EbIR+RH7EfoR+xH8EfoR+hH8EfMR/BH1EfMRshH6EaIR+hHzEaIR+xH9EfwR/RH+EfwR/RFnCf4RZwl4Cf4R/hF4CfcReAl3CfcR/BH+EfUR/hH3EfURpxH/EagR/xEAEqgR/xEBEgASARICEgASABICEvkRAhL7EfkRqBEAEqsRABL5EasRARIDEgISAxIEEgISAxIsCQQSLAloCQQSBBJoCf0RaAlnCf0RAhIEEvsRBBL9EfsRtxHWEbkR1hEFErkR1hHXEQUS1xEGEgUSBRIGEv8RBhIBEv8RuREFEqcRBRL/EacR1xHaEQYS2hEHEgYS2hEwCQcSMAktCQcSBxItCQMSLQksCQMSBhIHEgESBxIDEgESMAwxDAgSMQwJEggSMQw0DAkSNAxxDAkSCRJxDAoScQx2DAoSCBIJEnwMCRIKEnwMbQx9DI0MfQwLEo0MfQx3DAsSdwx5DAsSCxJ5DAoSeQx8DAoSjQwLEnYMCxIKEnYMwAsMEsILDBINEsILDBJ8DA0SfAx7DA0SDRJ7DK0Iewx9B60IwgsNEqwIDRKtCKwIMAwIEg4SCBIPEg4SCBJ8DA8SfAwMEg8SDxIMEr4LDBLAC74LDhIPEr0LDxK+C70LJQwvDCkMLwwQEikMLwwwDBASMAwOEhASKQwQEr0LEBIOEr0LDgAREg0AERISEg0AERITEhISExIUEhISEhIUEjANFBIJDTANDQASEgAAEhIwDQAAFAAlDRMAJQ0VEhMAJQ0ADRUSAA0WEhUSFRIWEhESFhITEhESEwAVEg4AFRIREg4AExIWEhcSFhIYEhcSFhIADRgSAA3+DBgSGBL+DMQM/gyyDMQMFxIYEr4MGBLEDL4MCQ0UEggNFBIZEggNFBITEhkSExIXEhkSGRIXEsAMFxK+DMAMCA0ZEsMMGRLADMMM+gwBDRgNAQ0aEhgNAQ0ADRoSAA0nDRoSGA0aEhkNGhInDRkNZw8bEmgPGxIcEmgPGxIdEhwSHRIeEhwSHBIeEo0PHhKLD40PaA8cEmsPHBKND2sPUgtRCx8SUQsgEh8SUQs8CyASPAshEiASIBIhEiISIRIjEiISHxIgEiQSIBIiEiQSIxIhEiUSIRImEiUSIRI8CyYSPAs6CyYSJhI6CycSOgs7CycSJRImEigSJhInEigSKBInEikSJxIqEikSJxI7CyoSOwtYCyoSKhJYCysSWAtWCysSKRIqEiwSKhIrEiwSVgtVCysSVQstEisSVQsOCS0SDgkuEi0SLRIuEi8SLhIwEi8SKxItEiwSLRIvEiwSDgkNCS4SDQkxEi4SDQkACTESAAkyEjESMRIyEjMSMhI0EjMSLhIxEjASMRIzEjASAAkCCTISAgk1EjISAgkICTUSCAk2EjUSNRI2EjcSNhI4EjcSMhI1EjQSNRI3EjQSCAlECjYSRAo5EjYSRApHCjkSRwo6EjkSORI6EjsSOhI8EjsSNhI5EjgSORI7EjgSRwpKCjoSSgo9EjoSSgpCCj0SQgo+Ej0SPRI+Ej8SPhJAEj8SOhI9EjwSPRI/EjwSQBI+EkESPhJCEkESPhJCCkISQgpACkISQhJACkMSQAo1CkMSQRJCEkQSQhJDEkQSNQo3CkMSNwpFEkMSNwqQCUUSkAlGEkUSRRJGEkcSRhJIEkcSQxJFEkQSRRJHEkQSkAmSCUYSkglJEkYSkgmYCUkSmAlKEkkSSRJKEksSShJMEksSRhJJEkgSSRJLEkgSTBJKEk0SShJOEk0SShKYCU4SmAmZCU4SThKZCU8SmQmeCU8STRJOElASThJPElASHADQBVES0AVSElES0AXPBVISzwUXBlISUhIXBiENFwYWBiENURJSEiANUhIhDSANIA1TElESUxJUElESUxIUAFQSFAAgAFQSURJUEhwAVBIgABwAFABTEiQNUxJVEiQNUxIgDVUSIA0jDVUSJA1VEhINVRIjDRINVhJXElgSVxJZElgSVxJaElkSWhJbElkSWRJbElwSWxJdElwSWBJZEl4SWRJcEl4SXxJgEmESYBJiEmESYBJjEmISYxJkEmISYhJkElwSZBJeElwSYRJiEl0SYhJcEl0SZRJmEmcSZhJoEmcSZhJpEmgSaRJqEmgSaBJqEmASahJjEmASZxJoEl8SaBJgEl8SaxJsEm0SbBJuEm0SbBJvEm4SbxJwEm4SbhJwEnEScBJyEnESbRJuEnMSbhJxEnMSZRJ0EmYSdBJ1EmYSdBJrEnUSaxJtEnUSdRJtEnYSbRJzEnYSZhJ1EmkSdRJ2EmkSdxJ4EnkSeBJ6EnkSeBJ7EnoSexJ8EnoSehJ8En0SfBJ+En0SeRJ6En8SehJ9En8SgBKBEoISgRKDEoISgRKEEoMShBKFEoMSgxKFEnkShRJ3EnkSghKDEn8SgxJ5En8ShhKHEogShxKJEogShxKKEokSihKLEokSiRKLEoESixKEEoESiBKJEoASiRKBEoASjBKNEo4SjRKPEo4SjRKQEo8SkBKREo8SjxKREocSkRKKEocSjhKPEoYSjxKHEoYSkhKTEpQSkxKVEpQSkxKQEpUSkBKNEpUSlRKNEpYSjRKMEpYSlBKVEpcSlRKWEpcSmBKZEpoSmRKbEpoSmRKSEpsSkhKUEpsSmxKUEpwSlBKXEpwSmhKbEp0SmxKcEp0SnRKeEpoSnhKfEpoSnhKgEp8SoBKhEp8SnxKhEqISoRKjEqISmhKfEpgSnxKiEpgSoBKkEqESpBKlEqESpBKmEqUSphKnEqUSpRKnEqgSpxKpEqgSoRKlEqMSpRKoEqMSqhKrEqwSrRKuEq8SqxKwErESshKzEq4SrhKzEqcSsxKpEqcSrxKuEqYSrhKnEqYStBK1ErYStRK3ErYStRK4ErcSuBK5ErcStxK5EroSuRK7EroSthK3ErwStxK6ErwSuBK9ErkSvRK+ErkSvRK/Er4SvxLAEr4SvhLAEsESwBLCEsESuRK+ErsSvhLBErsSwhLAEsMSwBLEEsMSwBK/EsQSvxLFEsQSxBLFEqsSxRKwEqsSwxLEEqoSxBKrEqoSxhLHEsgSxxLJEsgSxxLKEskSyhLLEskSyRLLEnwSyxJ+EnwSyBLJEnsSyRJ8EnsSzBLNEs4SzRLPEs4SzRLQEs8S0BLREs8SzxLREtIS0RLTEtISzhLPEtQSzxLSEtQS1RLWEtcS1hLYEtcS1hLZEtgS2RLaEtgS2BLaEs0S2hLQEs0S1xLYEswS2BLNEswS0BLaEtsS2hLcEtsS2hLZEtwS2RLdEtwS3BLdEt4S3RLfEt4S2xLcEuAS3BLeEuAS0BLbEtES2xLhEtES2xLgEuES4BLiEuES4RLiEuMS4hLkEuMS0RLhEtMS4RLjEtMS4BLlEuIS5RLmEuIS5RLnEuYS5xLoEuYS5hLoEukS6BLqEukS4hLmEuQS5hLpEuQS3xLrEt4S6xLsEt4S6xLtEuwS7RLuEuwS7BLuEuUS7hLnEuUS3hLsEuAS7BLlEuAS7xLwEvES8BLyEvES8BLzEvIS8xL0EvIS8hL0EusS9BLtEusS8RLyEt8S8hLrEt8S7RL0Eu4S9BL1Eu4S9BLzEvUS8xL2EvUS9RL2EvcS9hL4EvcS7hL1EucS9RL3EucS6hLoEvkS6BL6EvkS6BLnEvoS5xL3EvoS+hL3EvsS9xL4EvsS+RL6EvwS+hL7EvwS+BL9EvsS/RL+EvsS/RL/Ev4S/xIAE/4S/hIAEwETABMCEwET+xL+EvwS/hIBE/wS+BL2Ev0S9hIDE/0S9hLzEgMT8xLwEgMTAxPwEgQT8BLvEgQT/RIDE/8SAxMEE/8S7xIFEwQTBRMGEwQTBRMHEwYTBxMIEwYTBhMIEwkTCBMKEwkTBBMGE/8SBhMJE/8S/xIJEwATCRMLEwATCRMKEwsTChMMEwsTCxMMEw0TDBMOEw0TABMLEwITCxMNEwITDxMQExETEBMSExETEBPMEhITzBLOEhITEhPOEhMTzhLUEhMTERMSExQTEhMTExQTFRMWExcTFhMYExcTFhMPExgTDxMRExgTGBMRExkTERMUExkTFxMYExoTGBMZExoTGxMcEx0THBMeEx0THBMVEx4TFRMXEx4THhMXEx8TFxMaEx8THRMeE7wSHhMfE7wSqhIgE8MSIBMhE8MSIBMiEyETIhMjEyETIRMjEyQTIxMlEyQTwxIhE8ISIRMkE8ISIhMmEyMTJhMnEyMTJhMoEycTKBMpEycTJxMpEyoTKRMrEyoTIxMnEyUTJxMqEyUTKBMsEykTLBMtEykTLBPfEi0T3xIuEy0TKRMtEysTLRMuEysTChMIEy8TCBMwEy8TCBMHEzATBxMxEzATMBMxEyYTMRMoEyYTLxMwEyITMBMmEyITDhMME6wSDBMyE6wSDBMKEzITChMvEzITMhMvEyATLxMiEyATrBIyE6oSMhMgE6oSKBMxEywTMRMzEywTMRMHEzMTBxM0EzMTLBMzE98SMxM0E98SKxMuEzUTLhM2EzUTLhPfEjYT3xLdEjYTNRM2E9kSNhPdEtkS1RI3E9YSNxM4E9YSNxMrEzgTKxM1EzgT1hI4E9kSOBM1E9kSORM6EzsTOhM8EzsTOhMrEzwTKxM3EzwTOxM8E9USPBM3E9USKxM6EyoTOhM9EyoTOhM5Ez0TORM+Ez0TPRM+Ez8TPhNAEz8TKhM9EyUTPRM/EyUTwhIkE8ESJBNBE8ESJBMlE0ETJRM/E0ETQRM/E0ITPxNAE0ITwRJBE7sSQRNCE7sSQBM+E0MTPhNEE0MTPhM5E0QTORNFE0QTRBNFE0YTRRNHE0YTQxNEExsTRBNGExsTuxJCE7oSQhNIE7oSQhNAE0gTQBNDE0gTSBNDEx0TQxMbEx0TuhJIE7wSSBMdE7wSRxNJE0YTSRNKE0YTSRNLE0oTSxNME0oTShNMExwTTBMVExwTRhNKExsTShMcExsTRxNFE00TRRNOE00TRRM5E04TORM7E04TTRNOE9USThM7E9USSxNPE0wTTxNQE0wTTxNRE1ATURNSE1ATUBNSExYTUhMPExYTTBNQExUTUBMWExUTURNPE1MTTxNUE1MTTxNLE1QTSxNJE1QTVBNJE00TSRNHE00TUxNUE9USVBNNE9USDxNSExATUhNVExATUhNRE1UTURNTE1UTVRNTE9cSUxPVEtcSEBNVE8wSVRPXEswSBxMFEzQTBRNWEzQTBRPvElYT7xLxElYTNBNWE98SVhPxEt8SVxNYE1kTWBNaE1kTWBNbE1oTWxNcE1oTWhNcE10TXBNeE10TWRNaE18TWhNdE18TYBNhE2ITYRNjE2ITYRNkE2MTZBNlE2MTYxNlE2YTZRNnE2YTYhNjE2gTYxNmE2gTaRNqE2sTahNsE2sTahNtE2wTbRNuE2wTbBNuE28TbhNwE28TaxNsE3ETbBNvE3ETchNzE3QTcxN1E3QTcxNpE3UTaRN2E3UTdRN2E3cTdhN4E3cTdBN1E3kTdRN3E3kTehN7E3wTexN9E3wTexNkE30TZBN+E30TfRN+E38TfhOAE38TfBN9E4ETfRN/E4ETehOCE3sTghODE3sTghOEE4MThBOFE4MTgxOFE2UThRNnE2UTexODE2QTgxNlE2QThhOHE4gThxOJE4gThxOKE4kTihOLE4kTiROLE3wTixN6E3wTiBOJE4ETiRN8E4ETihOME4sTjBONE4sTjBOOE40TjhOPE40TjROPE4ITjxOEE4ITixONE3oTjROCE3oTjhOQE48TkBORE48TkBOSE5ETkhOTE5ETjxORE4QTkROTE4QTlBOVE5YTlROXE5YTlROKE5cTihOHE5cTlxOHE5gThxOGE5gTlhOXE5kTlxOYE5kTmhObE5wTmxOdE5wTmxOeE50TnhOfE50TnROfE6ATnxOhE6ATnBOdE6ITnROgE6IToROfE6MTnxOkE6MTnxOeE6QTnhOlE6QTpBOlE6YTpROnE6YToxOkE6gTpBOmE6gTXxOpE6oTqROrE6oTqROiE6sTohOgE6sTqxOgE6wToBOhE6wTqhOrE60TqxOsE60TrhOvE7ATrxOxE7ATrxNXE7ETVxNZE7ETsRNZE6oTWRNfE6oTsBOxE60TsROqE60TgBOyE38TshOzE38TshNXE7MTVxOvE7MTsxOvE7QTrxOuE7QTfxOzE4ETsxO0E4ETgRO0E4gTtBO1E4gTtBOuE7UTrhO2E7UTtRO2E7cTthO4E7cTiBO1E4YTtRO3E4YTuBO2E7kTthO6E7kTthOuE7oTrhOwE7oTuhOwE7sTsBOtE7sTuRO6E7wTuhO7E7wTvBO7E70TuxO+E70TuxOtE74TrROsE74TvhOsE6MTrBOhE6MTvRO+E6gTvhOjE6gTvxPAE8ETwBPCE8ETwBOoE8ITqBOmE8ITwhOmE8MTphOnE8MTwRPCE8QTwhPDE8QTxRPGE8cTxhPIE8cTxhO8E8gTvBO9E8gTyBO9E8ATvROoE8ATxxPIE78TyBPAE78TyRPKE8sTyhPME8sTyhO4E8wTuBO5E8wTzBO5E8YTuRO8E8YTyxPME8UTzBPGE8UTmROYE80TmBPOE80TmBOGE84ThhO3E84TzhO3E8oTtxO4E8oTzRPOE8kTzhPKE8kTYBPPE2ETzxPQE2ETzxPRE9AT0RPSE9AT0BPSE34T0hOAE34TYRPQE2QT0BN+E2QT0RPTE9IT0xPUE9IT0xNbE9QTWxNYE9QT1BNYE7ITWBNXE7IT0hPUE4AT1BOyE4AT1RPWE9cT1hPYE9cT1hNbE9gTWxPTE9gT2BPTE9kT0xPRE9kT1xPYE9oT2BPZE9oTYBPbE88T2xPcE88T2xPdE9wT3RPeE9wT3BPeE9kT3hPaE9kTzxPcE9ET3BPZE9ETaBPfE2IT3xPgE2IT3xNxE+ATcRPhE+AT4BPhE9sT4RPdE9sTYhPgE2AT4BPbE2AT2hPeE+IT3hPjE+IT3hPdE+MT3RPkE+MT4xPkE+UT5BPmE+UT4hPjE+cT4xPlE+cT6BPpE+oT6RPrE+oT6RPVE+sT1RPXE+sT6xPXE+IT1xPaE+IT6hPrE+cT6xPiE+cT7BPtE+4T7RPvE+4T7RPwE+8T8BPxE+8T7xPxE/IT8RPzE/IT7hPvE/QT7xPyE/QT9RP2E/cT9hP4E/cT9hP5E/gT+RP6E/gT+BP6E+4T+hPsE+4T9xP4E/QT+BPuE/QT+xP8E/0T/BP+E/0T/BP/E/4T/xMAFP4T/hMAFAEUABQCFAEU/RP+EwMU/hMBFAMUAhQEFAUUBBQGFAUUBBQHFAYUBxQIFAYUBhQIFAkUCBQKFAkUBRQGFAsUBhQJFAsUChQIFAwUCBQNFAwUCBQHFA0UBxQOFA0UDRQOFA8UDhQQFA8UDBQNFBEUDRQPFBEUERQPFBIUDxQTFBIUDxQQFBMUEBQUFBMUExQUFBUUFBQWFBUUEhQTFBcUExQVFBcUohOpExgUqRMZFBgUqRNfExkUXxNdExkUGRRdExoUXRNeExoUGBQZFBsUGRQaFBsUmhOcExwUnBMdFBwUnBOiEx0UohMYFB0UHRQYFB4UGBQbFB4UHBQdFB8UHRQeFB8UIBQhFCIUIRQjFCIUIRReEyMUXhNcEyMUIxRcE9YTXBNbE9YTIhQjFNUTIxTWE9UTFxQVFCQUFRQlFCQUFRQWFCUUFhQmFCUUJRQmFCcUJhQgFCcUJBQlFCgUJRQnFCgUKBQnFCkUJxQqFCkUJxQgFCoUIBQiFCoUKhQiFOkTIhTVE+kTKRQqFOgTKhTpE+gTFhQrFCYUKxQsFCYUKxQbFCwUGxQaFCwULBQaFCEUGhReEyEUJhQsFCAULBQhFCAUEBQtFBQULRQuFBQULRQfFC4UHxQeFC4ULhQeFCsUHhQbFCsUFBQuFBYULhQrFBYUBxQvFA4ULxQwFA4ULxQxFDAUMRQyFDAUMBQyFC0UMhQfFC0UDhQwFBAUMBQtFBAU/xMzFAAUMxQ0FAAUMxQxFDQUMRQvFDQUNBQvFAQULxQHFAQUABQ0FAIUNBQEFAIUnhObE6UTmxM1FKUTmxOaEzUUmhM2FDUUNRQ2FDcUNhQ4FDcUpRM1FKcTNRQ3FKcTpxM3FMMTNxQ5FMMTNxQ4FDkUOBQ6FDkUORQ6FDsUOhQ8FDsUwxM5FMQTORQ7FMQTmhMcFDYUHBQ9FDYUHBQfFD0UHxQyFD0UPRQyFD4UMhQxFD4UNhQ9FDgUPRQ+FDgUPBQ6FD8UOhRAFD8UOhQ4FEAUOBRBFEAUQBRBFEIUQRRDFEIUPxRAFEQUQBRCFEQURBRCFEUUQhRGFEUUQhRDFEYUQxRHFEYURhRHFPYTRxT5E/YTRRRGFPUTRhT2E/UTMRQzFD4UMxRIFD4UMxT/E0gU/xNJFEgUSBRJFEEUSRRDFEEUPhRIFDgUSBRBFDgU/xP8E0kU/BNKFEkU/BP7E0oU+xNLFEoUShRLFEcUSxT5E0cUSRRKFEMUShRHFEMU+xNMFEsUTBRNFEsUTBROFE0UThRPFE0UTRRPFPoTTxTsE/oTSxRNFPkTTRT6E/kTThRQFE8UUBRRFE8UUBRSFFEUUhRTFFEUURRTFO0TUxTwE+0TTxRRFOwTURTtE+wTVBRVFFYUVRRXFFYUVRRyE1cUchN0E1cUVxR0E1gUdBN5E1gUVhRXFFkUVxRYFFkUbRNqE1oUahNbFFoUahNpE1sUaRNzE1sUWxRzE1wUcxNyE1wUWhRbFF0UWxRcFF0UXhRfFGAUXxRhFGAUXxRiFGEUYhRjFGEUYRRjFFoUYxRtE1oUYBRhFF0UYRRaFF0UZBRlFGYUZRRnFGYUZRRdFGcUXRRcFGcUZxRcFFUUXBRyE1UUZhRnFFQUZxRVFFQUZBRoFGUUaBRpFGUUaBRqFGkUahRrFGkUaRRrFGAUaxReFGAUZRRpFF0UaRRgFF0UbRNjFG4TYxRsFG4TYxRiFGwUYhRtFGwUbBRtFG4UbRRvFG4UbhNsFHATbBRuFHATcBNuFHAUbhRxFHAUbhRvFHEUbxRyFHEUcRRyFHMUchR0FHMUcBRxFHUUcRRzFHUUbxRtFHYUbRR3FHYUbRRiFHcUYhRfFHcUdxRfFHgUXxReFHgUdhR3FHkUdxR4FHkUXhRrFHgUaxR6FHgUaxRqFHoUahR7FHoUehR7FHwUexR9FHwUeBR6FHkUehR8FHkUfhR/FIAUfxSBFIAUfxSCFIEUghSDFIEUgRSDFIQUgxSFFIQUgBSBFFIUgRSEFFIUhhSHFIgUhxSJFIgUhxR+FIkUfhSAFIkUiRSAFFAUgBRSFFAUiBSJFE4UiRRQFE4UThRMFIgUTBSKFIgUTBT7E4oU+xP9E4oUihT9E4sU/RMDFIsUiBSKFIYUihSLFIYUAxQBFIwUARSNFIwUARQCFI0UAhQFFI0UjRQFFI4UBRQLFI4UjBSNFI8UjRSOFI8UhhSLFJAUixSRFJAUixQDFJEUAxSMFJEUkRSMFJIUjBSPFJIUkBSRFJMUkRSSFJMUlBSVFJYUlRSXFJYUlRR+FJcUfhSHFJcUlxSHFJAUhxSGFJAUlhSXFJMUlxSQFJMUmBSZFJoUmRSbFJoUmRSCFJsUghR/FJsUmxR/FJUUfxR+FJUUmhSbFJQUmxSVFJQUmBScFJkUnBSdFJkUnBRkFJ0UZBRmFJ0UnRRmFJ4UZhRUFJ4UmRSdFIIUnRSeFIIUVBRWFJ4UVhSfFJ4UVhRZFJ8UWRSgFJ8UnxSgFIMUoBSFFIMUnhSfFIIUnxSDFIIUWRRYFKEUWBSiFKEUWBR5E6IUeROjFKIUohSjFKQUoxSlFKQUoRSiFKYUohSkFKYUWRShFKAUoRSnFKAUoRSmFKcUphSoFKcUpxSoFKkUqBSqFKkUoBSnFIUUpxSpFIUUUhSEFFMUhBSrFFMUhBSFFKsUhRSpFKsUqxSpFKwUqRSqFKwUUxSrFPATqxSsFPATqhStFKwUrRSuFKwUrRSvFK4UrxSwFK4UrhSwFPETsBTzE/ETrBSuFPATrhTxE/ATZxOFE7EUhROyFLEUhROEE7IUhBOTE7IUshSTE7MUkxOSE7MUsRSyFLQUshSzFLQUtBS1FLEUtRS2FLEUtRR4E7YUeBO3FLYUthS3FGYTtxRoE2YTsRS2FGcTthRmE2cTpRSjFLgUoxS5FLgUoxR5E7kUeRN3E7kUuRR3E7UUdxN4E7UUuBS5FLQUuRS1FLQUuhS7FLwUuxS9FLwUuxS+FL0UvhS/FL0UvRS/FMAUvxTBFMAUvBS9FMIUvRTAFMIUwxTEFMUUxBTGFMUUxBTHFMYUxxTIFMYUxhTIFMkUyBTKFMkUxRTGFMsUxhTJFMsUyxTJFMwUyRTNFMwUyRTKFM0UyhTOFM0UzRTOFM8UzhTQFM8UzBTNFNEUzRTPFNEU0RTPFNIUzxTTFNIUzxTQFNMU0BTUFNMU0xTUFNUU1BTWFNUU0hTTFNcU0xTVFNcU1hTYFNUU2BTZFNUU2BTaFNkU2hTbFNkU2RTbFNwU2xTdFNwU1RTZFNcU2RTcFNcUwhTAFN4UwBTfFN4UwBTBFN8UwRTgFN8U3xTgFOEU4BTiFOEU3hTfFOMU3xThFOMU4xThFOQU4RTlFOQU4RTiFOUU4hTmFOUU5RTmFMQU5hTHFMQU5BTlFMMU5RTEFMMU5xToFOkU6BTqFOkU6BTrFOoU6xTsFOoU6hTsFO0U7BTuFO0U6RTqFO8U6hTtFO8U8BTxFPIU8RTzFPIU8RT0FPMU9BT1FPMU8xT1FPYU9RT3FPYU8hTzFPgU8xT2FPgU9BT5FPUU+RT6FPUU+RT7FPoU+xT8FPoU+hT8FP0U/BT+FP0U9RT6FPcU+hT9FPcU/hT8FP8U/BQAFf8U/BT7FAAV+xQBFQAVABUBFQIVARUDFQIV/xQAFQQVABUCFQQVBBUCFQUVAhUGFQUVAhUDFQYVAxUHFQYVBhUHFbsUBxW+FLsUBRUGFboUBhW7FLoUCBUJFQoVCRULFQoVCRW6FAsVuhS8FAsVCxW8FAwVvBTCFAwVChULFQ0VCxUMFQ0VDhUPFRAVDxURFRAVDxXDFBEVwxTFFBEVERXFFBIVxRTLFBIVEBURFRMVERUSFRMVExUSFRQVEhUVFRQVEhXLFBUVyxTMFBUVFRXMFBYVzBTRFBYVFBUVFRcVFRUWFRcVFxUWFRgVFhUZFRgVFhXRFBkV0RTSFBkVGRXSFBoV0hTXFBoVGBUZFRsVGRUaFRsV1xTcFBoV3BQcFRoV3BTdFBwV3RQdFRwVHBUdFR4VHRUfFR4VGhUcFRsVHBUeFRsVwhTeFCAV3hQhFSAV3hTjFCEV4xQiFSEVIBUhFSMVIRUiFSMVIxUiFSQVIhUlFSQVIhXjFCUV4xTkFCUVJRXkFA8V5BTDFA8VJBUlFQ4VJRUPFQ4V7xTtFCYV7RQnFSYV7RTuFCcV7hQoFScVJxUoFSkVKBUqFSkVJhUnFSsVJxUpFSsV+BT2FCwV9hQtFSwV9hT3FC0V9xQuFS0VLRUuFS8VLhUwFS8VLBUtFTEVLRUvFTEV9xT9FC4V/RQyFS4V/RT+FDIV/hQzFTIVMhUzFTQVMxU1FTQVLhUyFTAVMhU0FTAVNRUzFTYVMxU3FTYVMxX+FDcV/hT/FDcVNxX/FDgV/xQEFTgVNhU3FTkVNxU4FTkVORU4FToVOBU7FToVOBUEFTsVBBUFFTsVOxUFFQkVBRW6FAkVOhU7FQgVOxUJFQgV6xQ8FewUPBU9FewUPBU+FT0VPhU/FT0VPRU/FUAVPxVBFUAV7BQ9Fe4UPRVAFe4U7hRAFUIVQBVDFUIVQBVBFUMVQRVEFUMVQhVDFUUVQxVEFUUVZBRGFWgURhVHFWgURhVIFUcVSBVJFUcVRxVJFXsUSRV9FHsUaBRHFWoURxV7FGoUSBVGFUoVRhVLFUoVRhVkFEsVZBScFEsVShVLFZgUSxWcFJgUTBVNFU4VTRVPFU4VTRVIFU8VSBVKFU8VThVPFZgUTxVKFZgUUBVRFVIVURVTFVIVURVBFVMVQRU/FVMVUxU/FVQVPxU+FVQVUhVTFVUVUxVUFVUV+BRWFfIUVhVXFfIUVhVQFVcVUBVSFVcVVxVSFVgVUhVVFVgV8hRXFfAUVxVYFfAUUBVZFVEVWRVaFVEVWRVFFVoVRRVEFVoVURVaFUEVWhVEFUEVUBVWFVkVVhVbFVkVVhX4FFsV+BQsFVsVWxUsFVwVLBUxFVwVWRVbFV0VWxVcFV0VdBRyFF4VchRfFV4VchRvFF8VbxR2FF8VXxV2FGAVdhR5FGAVXhVfFWEVXxVgFWEVeRR8FGAVfBRiFWAVfBR9FGIVfRRjFWIVYhVjFWQVYxVlFWQVYBViFWEVYhVkFWEVfRRJFWMVSRVmFWMVSRVIFWYVSBVNFWYVZhVNFWcVTRVMFWcVYxVmFWUVZhVnFWUVaBVpFWoVaRVrFWoVaRVhFWsVYRVkFWsVaxVkFWwVZBVlFWwVahVrFW0VaxVsFW0VdRRzFG4VcxRvFW4VcxR0FG8VdBReFW8VbxVeFWkVXhVhFWkVbhVvFWgVbxVpFWgVbRVsFXAVbBVxFXAVbBVlFXEVZRVnFXEVcBVxFUwVcRVnFUwVeBN2E7cUdhNyFbcUdhNpE3IVaRNrE3IVchVrE98TaxNxE98TtxRyFWgTchXfE2gTcRNzFeETcxV0FeETcxV1FXQVdRV2FXQVdBV2FeQTdhXmE+QT4RN0Fd0TdBXkE90TcBNwFG8TcBR3FW8TcBR1FHcVdRR4FXcVdxV4FXMVeBV1FXMVbxN3FXETdxVzFXETeRV6FXsVehV8FXsVehV9FXwVfRV+FXwVfBV+FekUfhXnFOkUexV8Fe8UfBXpFO8U3RTbFH8V2xSAFX8V2xTaFIAV2hSBFYAVgBWBFXoVgRV9FXoVfxWAFXkVgBV6FXkV7xQmFXsVJhWCFXsVJhUrFYIVKxWDFYIVexWCFXkVghWDFXkVeRWEFX8VhBWFFX8VhBWGFYUVhhWHFYUVhRWHFR0VhxUfFR0VfxWFFd0UhRUdFd0UpRSIFaQUiBWJFaQUiBWKFYkVihWLFYkViRWLFYwVixWNFYwVpBSJFaYUiRWMFaYUphSMFagUjBWOFagUjBWNFY4VjRWPFY4VjhWPFa0UjxWvFK0UqBSOFaoUjhWtFKoUtBSQFbgUkBWRFbgUkBWSFZEVkhWTFZEVkRWTFYgVkxWKFYgVuBSRFaUUkRWIFaUUihOVE4wTlROUFYwTlROUE5QVlBOVFZQVlBWVFZYVlRWXFZYVjBOUFY4TlBWWFY4TjhOWFZATlhWYFZATlhWXFZgVlxWZFZgVmBWZFZoVmRWbFZoVkBOYFZITmBWaFZITkhOaFbMUmhWcFbMUmhWbFZwVmxWdFZwVnBWdFZAVnRWSFZAVsxScFbQUnBWQFbQUmROeFZYTnhWfFZYTnhWgFZ8VoBWhFZ8VnxWhFaIVoRWjFaIVlhOfFZQTnxWiFZQTxBOkFcETpBWlFcETpBWmFaUVphWnFaUVpRWnFagVpxWpFagVwROlFb8TpRWoFb8TvxOoFccTqBWqFccTqBWpFaoVqRWrFaoVqhWrFawVqxWtFawVxxOqFcUTqhWsFcUTxROsFcsTrBWuFcsTrBWtFa4VrRWvFa4VrhWvFbAVrxWxFbAVyxOuFckTrhWwFckTyROwFc0TsBWyFc0TsBWxFbIVsRWzFbIVshWzFZ4VsxWgFZ4VzROyFZkTshWeFZkTPBS0FTsUtBW1FTsUtBW2FbUVthW3FbUVtRW3FaQVtxWmFaQVOxS1FcQTtRWkFcQTihW4FYsVuBW5FYsVuBW6FbkVuhW7FbkVuRW7FbwVuxW9FbwVixW5FY0VuRW8FY0VkhW+FZMVvhW/FZMVvhXAFb8VwBXBFb8VvxXBFbgVwRW6FbgVkxW/FYoVvxW4FYoVlBOiFZUVohXCFZUVohWjFcIVoxXDFcIVwhXDFcQVwxXFFcQVlRXCFZcVwhXEFZcVlxXEFZkVxBXGFZkVxBXFFcYVxRXHFcYVxhXHFcgVxxXJFcgVmRXGFZsVxhXIFZsVmxXIFZ0VyBXKFZ0VyBXJFcoVyRXLFcoVyhXLFb4VyxXAFb4VnRXKFZIVyhW+FZIVzBXNFc4VzRXPFc4VzRXQFc8V0BXRFc8VzxXRFdIV0RXTFdIVzhXPFdQVzxXSFdQV1BXSFdUV0hXWFdUV0hXTFdYV0xXXFdYV1hXXFdgV1xXZFdgV1RXWFdoV1hXYFdoV2xXcFd0V3BXeFd0V3BXfFd4V3xXgFd4V3hXgFbQV4BW2FbQV3RXeFTwU3hW0FTwU2hXYFeEV2BXiFeEV2BXZFeIV2RXjFeIV4hXjFdwV4xXfFdwV4RXiFdsV4hXcFdsV5BXlFeYV5RXnFeYV5RXoFecV6BXpFecV5xXpFc0V6RXQFc0V5hXnFcwV5xXNFcwVjRW8FeoVvBXrFeoVvBW9FesVvRXsFesV6xXsFeUV7BXoFeUV6hXrFeQV6xXlFeQVrxTtFbAU7RXuFbAU7RXvFe4V7xXwFe4V7hXwFfEV8BXyFfEVsBTuFfMT7hXxFfMTjRXzFY8V8xX0FY8V8xXvFfQV7xXtFfQVjxX0Fa8U9BXtFa8U8xPxFfIT8RX1FfIT8RXyFfUV8hX2FfUV9RX2FfcV9hX4FfcV8hP1FfQT9RX3FfQT9BP3FfcT9xX5FfcT9xX4FfkV+BX6FfkV+RX6FfsV+hX8FfsV9xP5FfUT+RX7FfUT9RP7FUUU+xX9FUUU+xX8Ff0V/BX+Ff0V/RX+Ff8V/hUAFv8VRRT9FUQU/RX/FUQUABYBFv8VARYCFv8VARY8FAIWPBQ/FAIW/xUCFkQUAhY/FEQU5BUDFuoVAxYEFuoVAxbvFQQW7xXzFQQW6hUEFo0VBBbzFY0VzBUFFuYVBRYGFuYVBRbyFQYW8hXwFQYWBhbwFQMW8BXvFQMW5hUGFuQVBhYDFuQV1BUHFs4VBxYIFs4VBxb4FQgW+BX2FQgWCBb2FQUW9hXyFQUWzhUIFswVCBYFFswV2hUJFtUVCRYKFtUVCRb8FQoW/BX6FQoWChb6FQcW+hX4FQcW1RUKFtQVChYHFtQV2hXhFQkW4RULFgkW4RXbFQsW2xUMFgsWCxYMFv4VDBYAFv4VCRYLFvwVCxb+FfwVPBQBFt0VARYNFt0VARYAFg0WABYMFg0W3RUNFtsVDRYMFtsVDhYPFhAWDxYRFhAWDxYSFhEWEhYTFhEWERYTFhQWExYVFhQWEBYRFhYWERYUFhYWFxYYFhkWGBYaFhkWGBYbFhoWGxYcFhoWGhYcFg8WHBYSFg8WGRYaFg4WGhYPFg4WHRYeFh8WHhYgFh8WHhYhFiAWIRYiFiAWIBYiFhgWIhYbFhgWHxYgFhcWIBYYFhcWIxYkFiUWJBYmFiUWJBYnFiYWJxYoFiYWJhYoFh4WKBYhFh4WJRYmFh0WJhYeFh0WIxYpFiQWKRYqFiQWKRYrFioWKxYsFioWKhYsFi0WLBYuFi0WJBYqFicWKhYtFicWLxYwFjEWMBYyFjEWMBYzFjIWMxY0FjIWMhY0FiwWNBYuFiwWMRYyFisWMhYsFisWIxY1FikWNRY2FikWNRY3FjYWNxY4FjYWNhY4FjkWOBY6FjkWKRY2FisWNhY5FisWOhY7FjkWOxY8FjkWOxY9FjwWPRY+FjwWPBY+FjEWPhYvFjEWORY8FisWPBYxFisWLhY/Fi0WPxZAFi0WPxZBFkAWQRZCFkAWQBZCFkMWQhZEFkMWLRZAFicWQBZDFicWJxZDFigWQxZFFigWQxZEFkUWRBZGFkUWRRZGFkcWRhZIFkcWKBZFFiEWRRZHFiEWNxY1FkkWNRZKFkkWNRYjFkoWIxYlFkoWShYlFksWJRYdFksWSRZKFkwWShZLFkwWFxZNFh8WTRZOFh8WTRZPFk4WTxZQFk4WThZQFksWUBZMFksWHxZOFh0WThZLFh0WURZSFlMWUhZUFlMWUhZVFlQWVRZWFlQWVBZWFlcWVhZYFlcWUxZUFlkWVBZXFlkWWhZbFlwWWxZdFlwWWxZeFl0WXhZfFl0WXRZfFlMWXxZRFlMWXBZdFlkWXRZTFlkWIRZHFiIWRxZgFiIWRxZIFmAWSBZhFmAWYBZhFmIWYRZjFmIWIhZgFhsWYBZiFhsWSBZkFmEWZBZlFmEWZBZmFmUWZhZnFmUWZRZnFmgWZxZpFmgWYRZlFmMWZRZoFmMWRBZqFkYWahZrFkYWahZsFmsWbBZtFmsWaxZtFmQWbRZmFmQWRhZrFkgWaxZkFkgWYxZoFm4WaBZvFm4WaBZpFm8WaRZwFm8WbxZwFnEWcBZyFnEWbhZvFnMWbxZxFnMWchZ0FnEWdBZ1FnEWdBZ2FnUWdhZ3FnUWdRZ3FngWdxZ5FngWcRZ1FnMWdRZ4FnMWEhZ6FhMWehZ7FhMWehZzFnsWcxZ4FnsWexZ4FnwWeBZ5FnwWExZ7FhUWexZ8FhUWGxZiFhwWYhZ9FhwWYhZjFn0WYxZuFn0WfRZuFnoWbhZzFnoWHBZ9FhIWfRZ6FhIWfhZ/FoAWfxaBFoAWfxZPFoEWTxZNFoEWgRZNFhkWTRYXFhkWgBaBFg4WgRYZFg4WghaDFoQWgxaFFoQWgxZ+FoUWfhaAFoUWhRaAFhAWgBYOFhAWhBaFFhYWhRYQFhYWWBaGFlcWhhaHFlcWhhaIFocWiBaJFocWVxaHFlkWhxaJFlkWihaLFowWixaNFowWixaOFo0WjhaPFo0WjRaPFpAWjxaRFpAWjBaNFpIWjRaQFpIWkxaUFpUWlBaWFpUWlBaXFpYWlxaYFpYWlRaWFpkWlhaYFpkWmhabFpwWmxadFpwWmxaeFp0WnhafFp0WnRafFqAWnxahFqAWnBadFqIWnRagFqIWmhacFqMWnBakFqMWnBaiFqQWohalFqQWpBalFqYWpRanFqYWoxakFqgWpBamFqgWqBamFqkWphaqFqkWphanFqoWpxarFqoWqharFowWqxaKFowWqRaqFpIWqhaMFpIWrBatFq4WrRavFq4WrRawFq8WsBaxFq8WrxaxFrIWsRazFrIWrhavFrQWrxayFrQWtRa2FrcWtha4FrcWthasFrgWrBauFrgWuBauFrkWrha0FrkWtxa4FroWuBa5FroWlxa7FrwWuxa9FrwWuxa+Fr0Wvha/Fr0WvRa/FlwWvxZaFlwWvBa9FlkWvRZcFlkWwBbBFsIWwRbDFsIWwRaXFsMWlxaUFsMWwhbDFpMWwxaUFpMWxBbFFsYWxRbHFsYWxRbIFscWyBbJFscWxxbJFosWyRaOFosWxhbHFooWxxaLFooWpxbKFqsWyhbLFqsWyhbMFssWzBbNFssWyxbNFsYWzRbEFsYWqxbLFooWyxbGFooWpxalFsoWpRbOFsoWpRaiFs4WohbPFs4WzhbPFtAWzxbRFtAWyhbOFswWzhbQFswWohagFs8WoBbSFs8WoBahFtIWoRbTFtIW0hbTFtQW0xbVFtQWzxbSFtEW0hbUFtEW0RbUFtYW1BbXFtYW1BbVFtcW1RbYFtcW1xbYFtkW2BbaFtkW1hbXFtsW1xbZFtsWuhbcFrcW3BbdFrcW3BbbFt0W2xbZFt0W3RbZFt4W2RbaFt4WtxbdFrUW3RbeFrUW2xbcFt8W3BbgFt8W3Ba6FuAWuhbhFuAW4BbhFuIW4RbjFuIW3xbgFuQW4BbiFuQWzBbQFuUW0BbmFuUW0BbRFuYW0RbWFuYW5hbWFt8W1hbbFt8W5RbmFuQW5hbfFuQW5BbiFucW4hboFucW4hbjFugW4xbpFugW6BbpFuoW6RbrFuoW5xboFuwW6BbqFuwWzBblFs0W5RbtFs0W5RbkFu0W5BbnFu0W7RbnFu4W5xbsFu4WzRbtFsQW7RbuFsQW7xbwFvEW8BbyFvEW8BbzFvIW8xb0FvIW8hb0FuoW9BbsFuoW8RbyFusW8hbqFusWxBbuFsUW7hb1FsUW7hbsFvUW7Bb0FvUW9Rb0FvYW9BbzFvYWxRb1FsgW9Rb2FsgWwBb3FsEW9xb4FsEW9xb5FvgW+Rb6FvgW+Bb6FvsW+hb8FvsWwRb4FpcW+Bb7FpcW6xb9FvEW/Rb+FvEW/Rb/Fv4W/xYAF/4W/hYAFwEXABcCFwEX8Rb+Fu8W/hYBF+8WPRYDFz4WAxcEFz4WAxcCFwQXAhcAFwQXBBcAFwUXABf/FgUXPhYEFy8WBBcFFy8W/BYGF/sWBhcHF/sWBhcIFwcXCBcJFwcXBxcJF7sWCRe+FrsW+xYHF5cWBxe7FpcW4xYKF+kWChcLF+kWChcMFwsXDBcNFwsXCxcNF/0WDRf/Fv0W6RYLF+sWCxf9FusWuha5FuEWuRYOF+EWuRa0Fg4XtBYPFw4XDhcPFwoXDxcMFwoX4RYOF+MWDhcKF+MWtBayFg8XshYQFw8XshazFhAXsxYRFxAXEBcRFxIXERczFhIXDxcQFwwXEBcSFwwXQRYTF0IWExcUF0IWExcVFxQXFRcWFxQXFBcWF2oWFhdsFmoWQhYUF0QWFBdqFkQWsBYXF7EWFxcYF7EWFxcVFxgXFRcTFxgXGBcTFxkXExdBFhkXsRYYF7MWGBcZF7MWMxYRFzQWERcaFzQWERezFhoXsxYZFxoXGhcZFz8WGRdBFj8WNBYaFy4WGhc/Fi4WDBcSFw0XEhcbFw0XEhczFhsXMxYwFhsXGxcwFgUXMBYvFgUXDRcbF/8WGxcFF/8WHBcdFx4XHRcfFx4XHRcgFx8XIBchFx8XHxchFyIXIRcjFyIXHhcfFyQXHxciFyQXJRcmFycXJhcoFycXJhcpFygXKRcqFygXKBcqFysXKhcsFysXJxcoFy0XKBcrFy0XLhcvFzAXLxcxFzAXLxcsFzEXLBcyFzEXMRcyFzMXMhc0FzMXMBcxFzUXMRczFzUXLhcwFzYXMBc3FzYXMBc1FzcXNRc4FzcXNxc4FzkXOBccFzkXNhc3FzoXNxc5FzoXLRcrFzsXKxc8FzsXKxcsFzwXLBcvFzwXPBcvFz0XLxcuFz0XOxc8Fz4XPBc9Fz4XNBcyFz8XMhdAFz8XMhcsF0AXLBcqF0AXQBcqF0EXKhcpF0EXPxdAF0IXQBdBF0IXQxdEF0UXRBdGF0UXRBdCF0YXQhdBF0YXRhdBF0cXQRcpF0cXRRdGF0gXRhdHF0gXSRdKF0sXShdMF0sXShdNF0wXTRdOF0wXTBdOF08XThdQF08XSxdMF1EXTBdPF1EXUBdSF1MXUhdUF1MXUhdVF1QXVRdWF1QXVBdWF1cXVhdYF1cXUxdUF1kXVBdXF1kXWhdbF1wXWxddF1wXWxdDF10XQxdeF10XXRdeF18XXhdgF18XXBddF2EXXRdfF2EXYRdfF2IXXxdjF2IXXxdgF2MXYBdkF2MXYxdkF2UXZBdNF2UXYhdjF2YXYxdlF2YXYBdeF2cXXhdoF2cXXhdDF2gXQxdFF2gXaBdFF2kXRRdIF2kXZxdoF1UXaBdpF1UXTRdkF04XZBdqF04XZBdgF2oXYBdnF2oXahdnF1IXZxdVF1IXThdqF1AXahdSF1AXURdPF2sXTxdsF2sXTxdQF2wXUBdTF2wXbBdTF20XUxdZF20XaxdsF24XbBdtF24XbhdtF28XbRdwF28XbRdZF3AXWRdxF3AXcBdxF3IXcRdzF3IXbxdwF3QXcBdyF3QXWRdXF3EXVxd1F3EXVxdYF3UXWBd2F3UXdRd2F3cXdhd4F3cXcRd1F3MXdRd3F3MXeRd6F3sXehd8F3sXehd9F3wXfRd+F3wXfBd+F38XfheAF38Xexd8F4EXfBd/F4EXgheDF4QXgxeFF4QXgxeBF4UXgRd/F4UXhRd/F4YXfxeAF4YXhBeFF4cXhReGF4cXhxeIF4QXiBeJF4QXiBeKF4kXiheLF4kXiReLF4wXixeNF4wXhBeJF4IXiReMF4IXjReOF4wXjhePF4wXjheQF48XkBeRF48XjxeRF5IXkRclF5IXjBePF4IXjxeSF4IXeBeTF5QXkxeVF5QXkxeNF5UXjReLF5UXlReLF5YXixeKF5YXlBeVF5cXlReWF5cXWBeYF3YXmBeZF3YXmBeQF5kXkBeOF5kXmReOF5MXjheNF5MXdheZF3gXmReTF3gXWBdWF5gXVheaF5gXVhdVF5oXVRdpF5oXmhdpF5sXaRdIF5sXmBeaF5AXmhebF5AXSBdHF5sXRxecF5sXRxcpF5wXKRcmF5wXnBcmF5EXJhclF5EXmxecF5AXnBeRF5AXJRcnF5IXJxedF5IXJxctF50XLReeF50XnReeF4MXnheBF4MXkhedF4IXnReDF4IXLRc7F54XOxefF54XOxc+F58XPhegF58XnxegF3sXoBd5F3sXnhefF4EXnxd7F4EXeRegF6EXoBeiF6EXoBc+F6IXPhejF6IXoReiF6QXohejF6QXPhc9F6MXPRelF6MXPRcuF6UXLhc2F6UXpRc2F6YXNhc6F6YXoxelF6QXpRemF6QXOhc5F6cXOReoF6cXORccF6gXHBceF6gXqBceF6kXHhckF6kXpxeoF6oXqBepF6oXOhenF6YXpxerF6YXpxeqF6sXqhesF6sXqxesF60XrBeuF60XpherF6QXqxetF6QXrxewF7EXsBeyF7EXsBdJF7IXSRdLF7IXshdLF7MXSxdRF7MXsReyF7QXshezF7QXtRe2F7cXthe4F7cXthe5F7gXuRe6F7gXuBe6F7sXuhe8F7sXtxe4F68XuBe7F68XuRe9F7oXvRe+F7oXvRe/F74XvxfAF74XvhfAF8EXwBfCF8EXuhe+F7wXvhfBF7wXwxfEF8UXxBfGF8UXxBfHF8YXxxfIF8YXxhfIF8kXyBfKF8kXxRfGF8sXxhfJF8sXzBfNF84XzRfPF84XzRfQF88X0BfRF88XzxfRF9IX0Rd0F9IXzhfPF9MXzxfSF9MXhxeGF9QXhhfVF9QXhheAF9UXgBfWF9UX1RfWF9cX1hfYF9cX1BfVF9kX1RfXF9kX2hfbF9wX2xfdF9wX2xeHF90XhxfUF90X3BfdF9kX3RfUF9kX3hffF+AX3xfhF+AX3xfDF+EXwxfiF+EX4RfiF+MX4hfkF+MX4BfhF+UX4RfjF+UX5hfnF+gX5xfpF+gX5xfqF+kX6hfrF+kX6RfrF+wX6xftF+wX6BfpF+4X6RfsF+4XzBfvF80X7xfwF80X7xfxF/AX8RfyF/AX8BfyF/MX8hf0F/MXzRfwF9AX8BfzF9AX9Rf2F/cX9hf4F/cX9hfuF/gX7hfsF/gX+BfsF/kX7BftF/kX9xf4F/oX+Bf5F/oX+xf8F/0X/Bf+F/0X/Bf/F/4X/xcAGP4X/hcAGAEYABhvEgEY/Rf+FwIY/hcBGAIY2RcDGAQYAxgFGAQYAxgGGAUYBhgHGAUYBRgHGAgYBxgJGAgYBBgFGAoYBRgIGAoYChgIGAsYCBgMGAsYCBgJGAwYCRgNGAwYDBgNGA4YDRgPGA4YCxgMGBAYDBgOGBAYERgSGBMYEhgUGBMYEhgVGBQYFRgWGBQYExgUGBAYFBgWGBAYERgXGBIYFxgYGBIYFxgZGBgYGRgaGBgYEhgYGBUYGBgaGBUYGxgcGB0YHBgeGB0YHBgfGB4YHxggGB4YHhggGCEYIBgiGCEYHRgeGCMYHhghGCMYaxIkGGwSJBglGGwSJBgmGCUYJhgnGCUYJRgnGAEYJxgCGAEYbBIlGG8SJRgBGG8SKBgpGCoYKRgrGCoYKRgsGCsYLBgtGCsYKxgtGCAYLRgiGCAYKhgrGB8YKxggGB8YLhgvGDAYLxgxGDAYLxgyGDEYMhgzGDEYMBgxGDQYMRgzGDQYNRg2GDcYNhg4GDcYNhg5GDgYORg6GDgYOBg6GDsYOhg8GDsYNxg4GD0YOBg7GD0YPhg/GEAYPxhBGEAYPxhCGEEYQhhDGEEYQRhDGEQYQxhFGEQYQBhBGEYYQRhEGEYYERhHGEgYRxhJGEgYRxhCGEkYQhg/GEkYSBhJGD4YSRg/GD4YERhIGBcYSBhKGBcYSBg+GEoYPhhLGEoYFxhKGBkYShhLGBkYTBhNGE4YTRhPGE4YTRhQGE8YUBhRGE8YTxhRGEAYURg+GEAYThhPGEYYTxhAGEYYUBhSGFEYUhhTGFEYUhhUGFMYVBhVGFMYUxhVGEsYVRgZGEsYURhTGD4YUxhLGD4YNRhWGFcYVhhYGFcYVhhZGFgYWRhaGFgYWBhaGE0YWhhQGE0YVxhYGEwYWBhNGEwYWxhcGF0YXBheGF0YXBhUGF4YVBhSGF4YXhhSGFoYUhhQGFoYXRheGFkYXhhaGFkYXxhgGGEYYBhiGGEYYBhjGGIYYxhkGGIYYhhkGGUYZBhmGGUYYRhiGGcYYhhlGGcY/xdoGGkYaBhqGGkYaBhrGGoYaxhsGGoYahhsGGAYbBhjGGAYaRhqGF8YahhgGF8YAhgnGG0YJxhuGG0YJxgmGG4YJhhvGG4YbhhvGHAYbxhxGHAYbRhuGHIYbhhwGHIY+xf9F3MY/Rd0GHMY/RcCGHQYAhhtGHQYdBhtGHUYbRhyGHUYcxh0GHYYdBh1GHYYchhwGHcYcBh4GHcYcBhxGHgYcRh5GHgYeBh5GM4XeRjMF84Xdxh4GNMXeBjOF9MXlxd6GHsYehh8GHsYehh9GHwYfRh+GHwYfBh+GH8Yfhh2GH8Yexh8GIAYfBh/GIAYcxd3F4EYdxeCGIEYdxd4F4IYeBeUF4IYghiUF3sYlBeXF3sYgRiCGIAYghh7GIAYcxeBGHIXgRiDGHIXgRiAGIMYgBiEGIMYgxiEGNIXhBjTF9IXcheDGHQXgxjSF3QXdhh1GH8YdRiFGH8YdRhyGIUYchh3GIUYhRh3GIQYdxjTF4QYfxiFGIAYhRiEGIAYdhh+GHMYfhiGGHMYfhh9GIYYfRiHGIYYhhiHGIgYhxiJGIgYcxiGGPsXhhiIGPsXGRhVGIoYVRiLGIoYVRhUGIsYVBhcGIsYixhcGIwYXBhbGIwYihiLGI0YixiMGI0YFRgaGI4YGhiPGI4YGhgZGI8YGRiKGI8YjhiPGI0YjxiKGI0YkBiRGJIYkRiTGJIYkRiUGJMYlBiVGJMYkxiVGJYYlRhrGJYYkhiTGIkYkxiWGIkYFRiOGJcYjhiYGJcYjhiNGJgYjRiZGJgYmBiZGJEYmRiUGJEYlxiYGJAYmBiRGJAY2heaGNsXmhibGNsXmhicGJsYnBidGJsYmxidGIgXnRiKF4gX2xebGIcXmxiIF4cXlxeWF3oYlheeGHoYlheKF54YihedGJ4YnhidGJ8YnRicGJ8YehieGH0YnhifGH0YChigGAQYoBihGAQYoBiiGKEYohijGKEYoRijGNwXoxjaF9wXBBihGNkXoRjcF9kXkBikGJcYpBilGJcYpBiiGKUYohimGKUYlxilGBUYpRimGBUYohigGKYYoBinGKYYoBgKGKcYChgLGKcYpxgLGBYYCxgQGBYYphinGBUYpxgWGBUY2hejGJoYoxioGJoYoxiiGKgYohikGKgYqBikGKkYpBiQGKkYmhioGJwYqBipGJwYfRifGIcYnxiqGIcYnxicGKoYnBipGKoYqhipGJIYqRiQGJIYhxiqGIkYqhiSGIkY+xeIGPwXiBirGPwXiBiJGKsYiRiWGKsYqxiWGGgYlhhrGGgY/BerGP8XqxhoGP8XaxiVGGwYlRisGGwYlRiUGKwYlBiZGKwYrBiZGK0YmRiNGK0YbBisGGMYrBitGGMYYxitGGQYrRiuGGQYrRiNGK4YjRiMGK4YrhiMGK8YjBhbGK8YZBiuGGYYrhivGGYYZhiwGGUYsBixGGUYsBiyGLEYshizGLEYsRizGLQYsxi1GLQYZRixGGcYsRi0GGcYshi2GLMYthi3GLMYthg9GLcYPRi4GLcYtxi4GLkYuBi6GLkYsxi3GLUYtxi5GLUYZhivGLAYrxi7GLAYrxhbGLsYWxhdGLsYuxhdGLwYXRhZGLwYsBi7GLIYuxi8GLIYWRhWGLwYVhi9GLwYVhg1GL0YNRg3GL0YvRg3GLYYNxg9GLYYvBi9GLIYvRi2GLIYPRg7GLgYOxi+GLgYOxg8GL4YPBi/GL4Yvhi/GMAYvxjBGMAYuBi+GLoYvhjAGLoYwhjDGMQYwxjFGMQYwxjGGMUYxhjHGMUYxRjHGMgYxxgjGMgYxBjFGMkYxRjIGMkYIxjHGB0YxxjKGB0YxxjGGMoYxhjLGMoYyhjLGMwYyxjNGMwYHRjKGBsYyhjMGBsY5hfOGOcXzhjPGOcXzhjQGM8Y0BjRGM8YzxjRGNIY0RjTGNIY5xfPGOoXzxjSGOoX1BjVGNYY1RjXGNYY1RjHF9cYxxfEF9cY1xjEF98XxBfDF98X1hjXGN4X1xjfF94X6hfSGNgY0hjZGNgY0hjTGNkY0xjaGNkY2RjaGNsY2hjcGNsY2BjZGNQY2RjbGNQY6hfYGOsX2BjdGOsX2BjUGN0Y1BjeGN0Y6xfdGO0X3RjeGO0X1BjWGN4Y1hjfGN4Y1hjeF98Y3hfgGN8Y3xjgGPkX4Bj6F/kX3hjfGO0X3xj5F+0X1BjbGNUY2xjhGNUY2xjcGOEY3BjiGOEY4RjiGMgX4hjKF8gX1RjhGMcX4RjIF8cXWhfjGFsX4xjkGFsX4xjlGOQY5RjmGOQY5BjmGEQX5hhCF0QXWxfkGEMX5BhEF0MXNRczF+cYMxfoGOcYMxc0F+gYNBc/F+gY6Bg/F+YYPxdCF+YY5xjoGOUY6BjmGOUYNRfnGDgX5xjpGDgX5xjlGOkY5RjqGOkY6RjqGB0X6hggFx0XOBfpGBwX6RgdFxwXWhfrGOMY6xjsGOMY6xjLF+wYyxfJF+wY7BjJF+0YyRfKF+0Y4xjsGOUY7BjtGOUY3BjuGOIY7hjvGOIY7hggF+8YIBfqGO8Y7xjqGO0Y6hjlGO0Y4hjvGMoX7xjtGMoX3BjaGO4Y2hjwGO4Y2hjTGPAY0xjxGPAY8BjxGCEX8RgjFyEX7hjwGCAX8BghFyAX0xjRGPEY0RjyGPEY0RjQGPIY0BjzGPIY8hjzGPQY8xj1GPQY8RjyGCMX8hj0GCMX9hj3GPgY9xj5GPgY9xj6GPkY+hj7GPkY+Rj7GM4Y+xjQGM4Y+Bj5GOYX+RjOGOYX0Bj7GPMY+xj8GPMY+xj6GPwY+hj9GPwY/Bj9GP4Y/Rj/GP4Y8xj8GPUY/Bj+GPUY9hgAGfcYABkBGfcYABkbGAEZGxjMGAEZARnMGAIZzBjNGAIZ9xgBGfoYARkCGfoY+hgCGf0YAhkDGf0YAhnNGAMZzRgEGQMZAxkEGQUZBBkGGQUZ/RgDGf8YAxkFGf8YBxkIGQkZCBkKGQkZCBlGGAoZRhhEGAoZChlEGAsZRBhFGAsZCRkKGQwZChkLGQwZwhgNGQ4ZDRkPGQ4ZDRkQGQ8ZEBkRGQ8ZDxkRGRIZERkTGRIZDhkPGQYZDxkSGQYZFBkVGRYZFRkXGRYZFRlMGBcZTBhOGBcZFxlOGAgZThhGGAgZFhkXGQcZFxkIGQcZORg2GBgZNhgZGRgZNhg1GBkZNRhXGBkZGRlXGBUZVxhMGBUZGBkZGRQZGRkVGRQZPBg6GBoZOhgbGRoZOhg5GBsZORgYGRsZGxkYGRwZGBkUGRwZGhkbGR0ZGxkcGR0ZHRkcGR4ZHBkfGR4ZHBkUGR8ZFBkWGR8ZHxkWGSAZFhkHGSAZHhkfGRAZHxkgGRAZEBkgGREZIBkhGREZIBkHGSEZBxkJGSEZIRkJGSIZCRkMGSIZERkhGRMZIRkiGRMZEBgjGRMYIxkkGRMYIxklGSQZJRkmGSQZJBkmGUcYJhlCGEcYExgkGREYJBlHGBEYJRknGSYZJxkoGSYZJxkpGSgZKRkqGSgZKBkqGUMYKhlFGEMYJhkoGUIYKBlDGEIYDxgrGQ4YKxksGQ4YKxktGSwZLRkuGSwZLBkuGSMZLhklGSMZDhgsGRAYLBkjGRAYLxkwGTEZMBkyGTEZMBkzGTIZMxk0GTIZMhk0GTUZNBk2GTUZMRkyGS0ZMhk1GS0ZMxk3GTQZNxk4GTQZNxk5GTgZORk6GTgZOBk6GTsZOhk8GTsZNBk4GTYZOBk7GTYZLRk1GS4ZNRk9GS4ZNRk2GT0ZNhk+GT0ZPRk+GScZPhkpGScZLhk9GSUZPRknGSUZDBkLGT8ZCxlAGT8ZCxlFGEAZRRgqGUAZQBkqGUEZKhkpGUEZPxlAGUIZQBlBGUIZExkiGUMZIhlEGUMZIhkMGUQZDBk/GUQZRBk/GUUZPxlCGUUZQxlEGUYZRBlFGUYZKRk+GUEZPhlHGUEZPhk2GUcZNhk7GUcZRxk7GUgZOxk8GUgZQRlHGUIZRxlIGUIZSRlKGUsZShlMGUsZShmuF0wZrhesF0wZTBmsF00ZrBeqF00ZSxlMGU4ZTBlNGU4ZJBdPGakXTxlQGakXTxlRGVAZURlSGVAZUBlSGU0ZUhlOGU0ZqRdQGaoXUBlNGaoXURlTGVQZUxlVGVQZUxn1GFUZ9Rj+GFUZVRn+GFYZ/hj/GFYZVBlVGUYZVRlWGUYZIxf0GCIX9BhXGSIX9Bj1GFcZ9RhTGVcZVxlTGU8ZUxlRGU8ZIhdXGSQXVxlPGSQXRhlYGVQZWBlZGVQZWBlaGVkZWhlbGVkZWRlbGVIZWxlOGVIZVBlZGVEZWRlSGVEZWhlcGVsZXBldGVsZXBleGV0ZXhlfGV0ZXRlfGUsZXxlJGUsZWxldGU4ZXRlLGU4ZYBlhGWIZYRljGWIZYRk5GWMZORk3GWMZYxk3GWQZNxkzGWQZYhljGWUZYxlkGWUZLxlmGTAZZhlnGTAZZhloGWcZaBlpGWcZZxlpGWQZaRllGWQZMBlnGTMZZxlkGTMZXhlqGWsZahlsGWsZahllGWwZZRlpGWwZbBlpGW0ZaRloGW0ZaxlsGW4ZbBltGW4ZbxlwGXEZcBlyGXEZcBkPGHIZDxgNGHIZchkNGAcYDRgJGAcYcRlyGQYYchkHGAYYLxkxGXMZMRl0GXMZMRktGXQZLRkrGXQZdBkrGXAZKxkPGHAZcxl0GW8ZdBlwGW8ZbhltGXUZbRl2GXUZbRloGXYZaBlmGXYZdhlmGXMZZhkvGXMZdRl2GW8ZdhlzGW8ZfRd6F3cZehd4GXcZehd5F3gZeRehF3gZeBmhF3kZoRekF3kZdxl4GXoZeBl5GXoZ2BfWF3sZ1hd8GXsZ1heAF3wZgBd+F3wZfBl+F3cZfhd9F3cZexl8GXoZfBl3GXoZBhgDGH0ZAxh+GX0ZAxjZF34Z2RfXF34ZfhnXF3sZ1xfYF3sZfRl+GXoZfhl7GXoZpBetF3kZrRd/GXkZrReuF38ZrhdKGX8ZfxlKGYAZShlJGYAZeRl/GXoZfxmAGXoZbhl1GYEZdRmCGYEZdRlvGYIZbxlxGYIZghlxGX0ZcRkGGH0ZgRmCGXoZghl9GXoZSRlfGYAZXxmDGYAZXxleGYMZXhlrGYMZgxlrGYEZaxluGYEZgBmDGXoZgxmBGXoZWhmEGVwZhBmFGVwZhBlgGYUZYBliGYUZhRliGWoZYhllGWoZXBmFGV4ZhRlqGV4ZPBk6GYYZOhmHGYYZOhk5GYcZORlhGYcZhxlhGYQZYRlgGYQZhhmHGVoZhxmEGVoZQhlIGUUZSBmIGUUZSBk8GYgZPBmGGYgZiBmGGVgZhhlaGVgZRRmIGUYZiBlYGUYZ/xgFGVYZBRmJGVYZBRkGGYkZBhkSGYkZiRkSGUMZEhkTGUMZVhmJGUYZiRlDGUYZzRjLGAQZyxiKGQQZyxjGGIoZxhjDGIoZihnDGA4ZwxjCGA4ZBBmKGQYZihkOGQYZyRiLGcQYixmMGcQYixkdGYwZHRkeGYwZjBkeGQ0ZHhkQGQ0ZxBiMGcIYjBkNGcIYyRiNGYsZjRmOGYsZjRnBGI4ZwRi/GI4Zjhm/GBoZvxg8GBoZixmOGR0ZjhkaGR0ZuhjAGI8ZwBiQGY8ZwBjBGJAZwRiNGZAZkBmNGZEZjRnJGJEZjxmQGZIZkBmRGZIZNBiTGZQZkxmVGZQZkxmWGZUZlhmXGZUZlRmXGZgZlxmZGZgZlBmVGZoZlRmYGZoZlhmbGZwZmxmdGZwZmxkyGJ0ZMhieGZ0ZnBmdGZ8ZnRmeGZ8ZNBgzGJMZMxigGZMZMxgyGKAZMhibGaAZkxmgGZYZoBmbGZYZmRmXGaEZlxmiGaEZlxmWGaIZlhmcGaIZohmcGaMZnBmfGaMZoRmiGaQZohmjGaQZmhmYGaUZmBmmGaUZmBmZGaYZmRmhGaYZphmhGacZoRmkGacZpRmmGZIZphmnGZIZqBmpGaoZqRmrGaoZqRmsGasZrBmtGasZqxmtGa4ZrRmvGa4ZqhmrGbAZqxmuGbAZsRmyGbMZshm0GbMZshmoGbQZqBmqGbQZtBmqGbUZqhmwGbUZsxm0GbYZtBm1GbYZtxm4GbkZuBm6GbkZuBmsGboZrBmpGboZuhmpGbIZqRmoGbIZuRm6GbEZuhmyGbEZuxm8Gb0ZvBm+Gb0ZvBm3Gb4Ztxm5Gb4Zvhm5Gb8ZuRmxGb8ZvRm+GcAZvhm/GcAZwBm/GcEZvxnCGcEZvxmxGcIZsRmzGcIZwhmzGcMZsxm2GcMZwRnCGfoXwhnDGfoXthnEGcMZxBnFGcMZxBnGGcUZxhnHGcUZxRnHGfcXxxn1F/cXwxnFGfoXxRn3F/oXthm1GcQZtRnIGcQZtRmwGcgZsBnJGcgZyBnJGcoZyRnLGcoZxBnIGcYZyBnKGcYZzBnNGc4ZzRnPGc4ZzRnQGc8Z0BnRGc8ZzxnRGckZ0RnLGckZzhnPGbAZzxnJGbAZrxnSGa4Z0hnTGa4Z0hnUGdMZ1BnVGdMZ0xnVGc4Z1RnMGc4ZrhnTGbAZ0xnOGbAZ1hnXGdgZ1xnZGdgZ1xnaGdkZ2hnbGdkZ2RnbGdwZ2xndGdwZ2BnZGd4Z2RncGd4Z3xngGeEZ4BniGeEZ4BnjGeIZ4xnkGeIZ4hnkGeUZ5BnmGeUZ4RniGecZ4hnlGecZ1hnoGdcZ6BnpGdcZ6BnqGekZ6hnrGekZ6RnrGewZ6xntGewZ1xnpGdoZ6RnsGdoZ2hnsGe4Z7BnvGe4Z7BntGe8Z7RnwGe8Z7xnwGfEZ8BmaGfEZ7hnvGfIZ7xnxGfIZmhnwGZQZ8BnzGZQZ8BntGfMZ7Rn0GfMZ8xn0GfUZ9Bn2GfUZlBnzGTQY8xn1GTQY7RnrGfQZ6xn3GfQZ6xnqGfcZ6hn4GfcZ9xn4GfkZ+Bn6GfkZ9Bn3GfYZ9xn5GfYZ+xn8Gf0Z/Bn+Gf0Z/Bn6Gf4Z+hn4Gf4Z/hn4GegZ+BnqGegZ/Rn+GdYZ/hnoGdYZ/xkAGgEaABoCGgEaABoDGgIaAxoEGgIaAhoEGvwZBBr6GfwZARoCGvsZAhr8GfsZ5hkFGuUZBRoGGuUZBRr/GQYa/xkBGgYaBhoBGgcaARr7GQca5RkGGucZBhoHGucZ5xkHGggaBxoJGggaBxr7GQka+xn9GQkaCRr9GdgZ/RnWGdgZCBoJGt4ZCRrYGd4ZChoLGgwaCxoNGgwaCxoOGg0aDhoPGg0aDRoPGhAaDxoRGhAaDBoNGhIaDRoQGhIaEhoQGhMaEBoUGhMaEBoRGhQaERoVGhQaFBoVGhYaFRoXGhYaExoUGhgaFBoWGhgaFxoVGhkaFRoaGhkaFRoRGhoaERoPGhoaGhoPGhsaDxoOGhsaGRoaGhwaGhobGhwaFxoZGh0aGRoeGh0aGRocGh4aHBofGh4aHhofGiAaHxohGiAaHRoeGiIaHhogGiIaIhgtGCMaLRgkGiMaLRgsGCQaLBglGiQaJBolGiYaJRonGiYaIxokGigaJBomGigaIxghGCkaIRgqGikaIRgiGCoaIhgjGioaKhojGisaIxooGisaKRoqGiwaKhorGiwayRjIGJEZyBgtGpEZyBgjGC0aIxgpGi0aLRopGi4aKRosGi4akRktGpIZLRouGpIZ8hnxGS8a8RkwGi8a8RmaGTAamhmlGTAaMBqlGS4apRmSGS4aLxowGiwaMBouGiwa2hnuGdsZ7hkxGtsZ7hnyGTEa8hkyGjEaMRoyGjMaMho0GjMa2xkxGt0ZMRozGt0ZKBo1GisaNRo2GisaNRo0GjYaNBoyGjYaNhoyGi8aMhryGS8aKxo2GiwaNhovGiwaJxo3GiYaNxo4GiYaNxohGjgaIRofGjgaOBofGjkaHxocGjkaJho4GigaOBo5GigaHBobGjkaGxo6GjkaGxoOGjoaDho7GjoaOho7GjUaOxo0GjUaORo6GigaOho1Giga3RkzGjwaMxo9GjwaMxo0Gj0aNBo7Gj0aPRo7GgsaOxoOGgsaPBo9GgoaPRoLGgoa3hncGT4a3Bk/Gj4a3BndGT8a3Rk8Gj8aPxo8GkAaPBoKGkAaPho/GkEaPxpAGkEa3hk+GggaPhpCGggaPhpBGkIaQRpDGkIaQhpDGuEZQxrfGeEZCBpCGucZQhrhGecZQRpAGkMaQBpEGkMaQBoKGkQaChoMGkQaRBoMGkUaDBoSGkUaQxpEGt8ZRBpFGt8ZEhoTGkUaExpGGkUaExoYGkYaGBpHGkYaRhpHGuAZRxrjGeAZRRpGGt8ZRhrgGd8Z5hnkGUga5BlJGkga5BnjGUka4xlHGkkaSRpHGkoaRxoYGkoaSBpJGksaSRpKGksaSxpMGkgaTBpNGkgaTBpOGk0aThpPGk0aTRpPGgUaTxr/GQUaSBpNGuYZTRoFGuYZUBpRGlIaURpTGlIaURrMGVMazBnVGVMaUxrVGVQa1RnUGVQaUhpTGlUaUxpUGlUaVhpXGlgaVxpZGlgaVxpaGlkaWhpbGlkaWRpbGlwaWxpdGlwaWBpZGl4aWRpcGl4aVhpfGlcaXxpgGlcaXxphGmAaYRpiGmAaVxpgGloaYBpiGloaYxpkGmUaZBpmGmUaZBpnGmYaZxpoGmYaZhpoGmkaaBphGmkaZRpmGmoaZhppGmoaaxpsGm0aoxluGqcZoxmfGW4anxlvGm4abhpvGnAabxpxGnAapxluGpIZbhpwGpIZtRi5GHIauRhzGnIauRi6GHMauhiPGXMacxqPGXAajxmSGXAachpzGnEacxpwGnEaZxi0GHQatBh1GnQatBi1GHUatRhyGnUadRpyGnYachpxGnYadBp1GmMadRp2GmManxmeGW8anhl3Gm8anhkyGHcaMhh4Gncadxp4GnkaeBp6Gnkabxp3GnEadxp5GnEaehp7Gnkaexp8Gnkaexp9GnwafRp+GnwafBp+Gn8afhqAGn8aeRp8GnEafBp/GnEagBp+GoEafhqCGoEafhp9GoIafRqDGoIaghqDGoQagxpdGoQagRqCGmcaghqEGmcacRp/GnYafxqFGnYafxqAGoUagBqBGoUahRqBGmQagRpnGmQadhqFGmMahRpkGmMaXRpbGoQaWxqGGoQaWxpaGoYaWhpiGoYahhpiGmgaYhphGmgahBqGGmcahhpoGmcaXhpcGocaXBqIGocaXBpdGogaXRqDGogaiBqDGokagxp9GokahxqIGooaiBqJGooaixqMGo0ajBqOGo0ajBqPGo4ajxqQGo4ajhqQGiAakBoiGiAajRqOGiEajhogGiEaMhgvGJEaLxiSGpEaLxguGJIaLhiTGpIakhqTGpQakxqVGpQakRqSGpYakhqUGpYaIhqXGh0alxqYGh0alxqZGpgamRqaGpgamBqaGpsamhqcGpsaHRqYGhcamBqbGhcaSxpKGp0aShqeGp0aShoYGp4aGBoWGp4anhoWGpsaFhoXGpsanRqeGpwanhqbGpwalRqfGqAanxqhGqAanxpOGqEaThpMGqEaoRpMGp0aTBpLGp0aoBqhGpwaoRqdGpwaohqjGqQaoxqlGqQaoxoDGqUaAxoAGqUapRoAGk8aABr/GU8apBqlGk4apRpPGk4a+hkEGvkZBBqmGvkZBBoDGqYaAxqjGqYaphqjGqcaoxqiGqca+RmmGvYZphqnGvYZ9hmnGvUZpxqoGvUZpxqiGqgaohqpGqgaqBqpGjAYqRouGDAY9RmoGjQYqBowGDQYLhipGpMaqRqqGpMaqRqiGqoaohqkGqoaqhqkGp8apBpOGp8akxqqGpUaqhqfGpUalhqUGqsalBqsGqsalBqVGqwalRqgGqwarBqgGpoaoBqcGpoaqxqsGpkarBqaGpkaMhiRGngakRqtGngakRqWGq0alhquGq0arRquGq8arhqwGq8aeBqtGnoarRqvGnoasBqxGq8asRqyGq8asRqKGrIaihqJGrIashqJGnsaiRp9GnsarxqyGnoashp7Gnoasxq0GrUatBq2GrUatBqKGrYaihqxGrYathqxGrcasRqwGrcatRq2Grgathq3GrgalhqrGq4aqxq5Gq4aqxqZGrkamRq6GrkauRq6Grcauhq4Grcarhq5GrAauRq3GrAajxq7GpAauxq8GpAauxq4GrwauBq6GrwavBq6GpcauhqZGpcakBq8GiIavBqXGiIaJxolGr0aJRq+Gr0aJRosGL4aLBgpGL4avhopGL8aKRgoGL8avRq+GsAavhq/GsAaJxq9GjcavRrBGjcavRrAGsEawBrCGsEawRrCGo0awhqLGo0aNxrBGiEawRqNGiEaKBjDGr8awxrEGr8awxrFGsQaxRrGGsQaxBrGGscaxhrIGscavxrEGsAaxBrHGsAayRrKGssayhrMGssayhrIGswayBrNGswazBrNGsoZzRrGGcoZyxrMGssZzBrKGcsZzhrPGtAazxrRGtAazxrFGtEaxRrDGtEa0RrDGioYwxooGCoY0BrRGh8Y0RoqGB8Y7hf2F9Ia9hfTGtIa9hf1F9Ma9RfHGdMa0xrHGdQaxxnGGdQa0hrTGs4a0xrUGs4a5hfoF/gY6BfVGvgY6BfuF9Ua7hfSGtUa1RrSGtYa0hrOGtYa+BjVGvYY1RrWGvYYzhrQGtYa0BrXGtYa0BofGNcaHxgcGNca1xocGAAZHBgbGAAZ1hrXGvYY1xoAGfYYyBrGGs0axhrYGs0axhrFGtgaxRrPGtga2BrPGtQazxrOGtQazRrYGsYZ2BrUGsYZixrCGtkawhraGtkawhrAGtoawBrHGtoa2hrHGsoaxxrIGsoa2RraGska2hrKGska2xrcGt0a3BreGt0a3BrQGd4a0BnNGd4a3hrNGVEazRnMGVEa3RreGlAa3hpRGlAayRrLGt8ayxrgGt8ayxrLGeAayxnRGeAa4BrRGdwa0RnQGdwa3xrgGtsa4BrcGtsaVhrhGuIa4RrjGuIa4RrkGuMa5BrlGuMa4xrlGuYa5RrbGuYa4hrjGuca4xrmGuca5BroGuka6BrqGuka6BrrGuoa6xrsGuoa6hrsGu0a7BqzGu0a6RrqGu4a6hrtGu4a5BrpGuUa6RrvGuUa6RruGu8a7hrwGu8a7xrwGt8a8BrJGt8a5RrvGtsa7xrfGtsa7hrxGvAa8RryGvAa8RqPGvIajxqMGvIa8hqMGtkajBqLGtka8BryGska8hrZGska7hrtGvEa7RrzGvEa7RqzGvMasxq1GvMa8xq1GrsatRq4Grsa8RrzGo8a8xq7Go8asxrsGrQa7Br0GrQa7BrrGvQa6xr1GvQa9Br1Goca9RpeGocatBr0Gooa9BqHGooaXhr1Glga9Rr2Glga9RrrGvYa6xroGvYa9hroGuEa6BrkGuEaWBr2GlYa9hrhGlYaahppGvcaaRr4GvcaaRphGvgaYRpfGvga+BpfGuIaXxpWGuIa9xr4Guca+BriGucaahr3Gvka9xr6Gvka9xrnGvoa5xr7Gvoa+hr7Gvwa+xr9Gvwa+Rr6Gv4a+hr8Gv4aUBr/Gt0a/xoAG90a/xr9GgAb/Rr7GgAbABv7GuYa+xrnGuYa3RoAG9saABvmGtsa/hr8GgEb/BoCGwEb/Br9GgIb/Rr/GgIbAhv/GlIa/xpQGlIaARsCG1UaAhtSGlUaVRpUGgMbVBoEGwMbVBrUGQQb1BkFGwQbBBsFGwYbBRsHGwYbAxsEGwgbBBsGGwgbCRsKGwsbChsMGwsbChsNGwwbDRsOGwwbDBsOGw8bDhsQGw8bCxsMGxEbDBsPGxEbEhsTGxQbExsVGxQbExsWGxUbFhsXGxUbFRsXGxgbFxsZGxgbFBsVGxobFRsYGxobGxscGx0bHBseGx0bHBsfGx4bHxsgGx4bHhsgGyEbIBsiGyEbHRseGyMbHhshGyMbJBslGyYbJRsnGyYbJRsoGycbKBspGycbJxspGyobKRsrGyobJhsnGywbJxsqGywbLRsuGy8bLhswGy8bLhsSGzAbEhsUGzAbMBsUGzEbFBsaGzEbLxswGzIbMBsxGzIbMxs0GzUbNBs2GzUbNBsrGzYbKxspGzYbNhspGzcbKRsoGzcbNRs2GzIbNhs3GzIbOBs5GzobORs7GzobORsRGzsbERs8GzsbOxs8GzUbPBszGzUbOhs7GzIbOxs1GzIbPRs+Gz8bPhtAGz8bPhsJG0AbCRsLG0AbQBsLGzkbCxsRGzkbPxtAGzgbQBs5GzgbQRtCG0MbQhtEG0MbQhtFG0QbRRtGG0QbRBtGGz8bRhs9Gz8bQxtEGzgbRBs/GzgbGhtHGzEbRxtIGzEbRxtBG0gbQRtDG0gbSBtDGzobQxs4GzobMRtIGzIbSBs6GzIbKBtJGzcbSRtKGzcbSRtLG0obSxtMG0obShtMGy8bTBstGy8bNxtKGzIbShsvGzIbTRtOG08bThtQG08bThtLG1AbSxtJG1AbUBtJGyUbSRsoGyUbTxtQGyQbUBslGyQbIhsgG1EbIBtSG1EbIBsfG1IbHxtTG1IbUhtTG1QbUxtVG1QbURtSG1YbUhtUG1YbVxtYG1kbWBtaG1kbWBtbG1obWxtcG1obWhtcG10bXBteG10bWRtaG18bWhtdG18bXhtcG2AbXBthG2AbXBtbG2EbWxtiG2EbYRtiG2MbYhtkG2MbYBthG2UbYRtjG2UbVRtmG1QbZhtnG1QbZhtoG2cbaBtpG2cbZxtpG2obaRtrG2obVBtnG1YbZxtqG1YbbBttG24bbRtvG24bbRtwG28bcBtxG28bbxtxG3IbcRtzG3IbbhtvG3QbbxtyG3QbbBtuG3Ubbht2G3Ubbht0G3YbdBt3G3Ybdht3G3gbdxt5G3gbdRt2G3obdht4G3obext8G30bfBt+G30bfBt6G34beht/G34bfht/G4AbfxuBG4AbfRt+G4IbfhuAG4IbgxuEG4UbhBuGG4UbhBuHG4YbhxuIG4YbhhuIG4kbiBuKG4kbhRuGG4sbhhuJG4sbjBuNG44bjRuPG44bjRuDG48bgxuQG48bjxuQG3wbkBt6G3wbjhuPG3sbjxt8G3sbehuQG3UbkBuRG3UbkBuDG5EbgxuFG5EbkRuFG5IbhRuLG5IbdRuRG2wbkRuSG2wbkxuUG5UblBuWG5UblBuHG5YbhxuEG5YblhuEG40bhBuDG40blRuWG4wblhuNG4wblxuYG5kbmBuaG5kbmBubG5obmxucG5obmhucG50bnBueG50bmRuaG58bmhudG58boBuhG6IboRujG6IboRukG6MbpBulG6MboxulG6YbpRunG6YbohujG6gboxumG6gbqRuqG6sbqhusG6sbqhutG6wbrRuuG6wbrBuuG68brhuwG68bqxusG7EbrBuvG7EbshuzG7Qbsxu1G7Qbsxu2G7Ubthu3G7UbtRu3G7gbtxu5G7gbtBu1G7obtRu4G7objBu7G5Ubuxu8G5Ubuxu2G7wbthuzG7wbvBuzG70bsxuyG70blRu8G5MbvBu9G5MbixuJG74biRu/G74biRuKG78bihvAG78bvxvAG8EbwBvCG8Ebvhu/G8MbvxvBG8Mbixu+G5IbvhvEG5IbvhvDG8QbwxvFG8QbxBvFG8YbxRvHG8YbkhvEG2wbxBvGG2wbxxvFG8gbxRvJG8gbxRvDG8kbwxvKG8kbyRvKG8sbyhvMG8sbyBvJG80byRvLG80bwxvBG8obwRvOG8obwRvCG84bwhvPG84bzhvPG9AbzxvRG9AbyhvOG8wbzhvQG8wbfwnSG34J0hvTG34J0hukG9MbpBuhG9Mb0xuhG9QboRugG9QbfgnTG4AJ0xvUG4AJ1RvWG9cb1hvYG9cb1huFCdgbhQmCCdgb2BuCCdkbggmBCdkb1xvYG9ob2BvZG9objwnbG44J2xvcG44J2xvdG9wb3RveG9wb3BveG9kb3hvaG9kbjgncG4EJ3BvZG4EJ3xvgG+Eb4BviG+Eb4BvjG+Ib4xvkG+Ib4hvkG+Ub5BvmG+Ub4RviG+cb4hvlG+cbnQnoG5wJ6BvpG5wJ6BvfG+kb3xvhG+kb6RvhG+ob4RvnG+obnAnpG54J6RvqG54JpAnrG6MJ6xvsG6MJ6xvtG+wb7RvuG+wb7BvuG+gb7hvfG+gbownsG50J7BvoG50J7RvvG+4b7xvwG+4b7xvxG/Ab8RvyG/Ab8BvyG+Ab8hvjG+Ab7hvwG98b8BvgG98b8xv0G/Ub9Bv2G/Ub9Bv3G/Yb9xv4G/Yb9hv4G/kb+Bv6G/kb9Rv2G1Ub9hv5G1Ub+hv7G/kb+xv8G/kb+xv9G/wb/Rv+G/wb/Bv+G2Yb/htoG2Yb+Rv8G1Ub/BtmG1Ub9xv/G/gb/xsAHPgb/xsBHAAcARwCHAAcABwCHAMcAhwEHAMc+BsAHPobABwDHPobBBwFHAMcBRwGHAMcBRwHHAYcBxwIHAYcBhwIHPsbCBz9G/sbAxwGHPobBhz7G/obBxwJHAgcCRwKHAgcCRyCGwocghuAGwocChyAGwscgBuBGwscCBwKHP0bChwLHP0bDBwNHA4cDRwPHA4cDRwQHA8cEBwRHA8cDxwRHKUbERynG6UbDhwPHKQbDxylG6QbDBwSHA0cEhwTHA0cEhzVGxMc1RsUHBMcExwUHBUcFBwWHBUcDRwTHBAcExwVHBAcFxwYHBkcGBwaHBkcGBx7Gxocext9GxocGhx9GxscfRuCGxscGRwaHBYcGhwbHBYcthu7GxwcuxsdHBwcuxuMGx0cjBuOGx0cHRyOGxgcjht7GxgcHBwdHBccHRwYHBccuRu3Gx4ctxsfHB4ctxu2Gx8cthscHB8cHxwcHCAcHBwXHCAcHhwfHNobHxwgHNob1RvXGxQc1xshHBQc1xvaGyEc2hsgHCEcIRwgHBkcIBwXHBkcFBwhHBYcIRwZHBYcFhwbHBUcGxwiHBUcGxyCGyIcghsJHCIcIhwJHCMcCRwHHCMcFRwiHBAcIhwjHBAcpxsRHCQcERwlHCQcERwQHCUcEBwjHCUcJRwjHAUcIxwHHAUcJBwlHAQcJRwFHAQcqBumGyYcphsnHCYcphunGyccpxskHCccJxwkHAIcJBwEHAIcJhwnHAEcJxwCHAEc4gngCSgc4AkpHCgc4AmACSkcgAnUGykcKRzUGyoc1BugGyocKBwpHCscKRwqHCscKxwqHCwcKhwtHCwcKhygGy0coBuiGy0cLRyiGy4cohuoGy4cLBwtHC8cLRwuHC8c7AnqCTAc6gkxHDAc6gniCTEc4gkoHDEcMRwoHDIcKBwrHDIcMBwxHDMcMRwyHDMcMxwyHDQcMhw1HDQcMhwrHDUcKxwsHDUcNRwsHDYcLBwvHDYcNBw1HDccNRw2HDccLxw4HDYcOBw5HDYcOBw6HDkcOhw7HDkcORw7HDwcOxw9HDwcNhw5HDccORw8HDccLxwuHDgcLhw+HDgcLhyoGz4cqBsmHD4cPhwmHD8cJhwBHD8cOBw+HDocPhw/HDocQBxBHEIcQRxDHEIcQRw6HEMcOhw/HEMcQxw/HP8bPxwBHP8bQhxDHPcbQxz/G/cb8xtEHPQbRBxFHPQbRBxGHEUcRhxHHEUcRRxHHEIcRxxAHEIc9BtFHPcbRRxCHPcbSBxJHEocSRxLHEocSRxMHEscTBxNHEscSxxNHE4cTRxPHE4cShxLHFAcSxxOHFAcGxtRHBwbURxSHBwbURxIHFIcSBxKHFIcUhxKHFMcShxQHFMcHBtSHB8bUhxTHB8bHxtTHFMbUxxUHFMbUxxQHFQcUBxVHFQcVBxVHPUbVRzzG/UbUxtUHFUbVBz1G1UbUBxOHFUcThxWHFUcThxPHFYcTxxXHFYcVhxXHEQcVxxGHEQcVRxWHPMbVhxEHPMbWBxZHFocWRxbHFocWRxcHFscXBxdHFscWxxdHE0cXRxPHE0cWhxbHEwcWxxNHEwcTxxdHFccXRxeHFccXRxcHF4cXBxfHF4cXhxfHGAcXxxhHGAcVxxeHEYcXhxgHEYcYhxjHGQcYxxlHGQcYxxmHGUcZhxnHGUcZRxnHGgcZxxXG2gcZBxlHGkcZRxoHGkcZhxqHGccahxrHGccahxsHGscbBxtHGscaxxtHFgbbRxbG1gbZxxrHFcbaxxYG1cbbBxqHG4cahxvHG4cahxmHG8cZhxwHG8cbxxwHFkccBxcHFkcbhxvHFgcbxxZHFgcZhxjHHAcYxxxHHAcYxxiHHEcYhxyHHEccRxyHF8cchxhHF8ccBxxHFwccRxfHFwccxx0HHUcdBx2HHUcdBx3HHYcdxx4HHYcdhx4HHkceBx6HHkcdRx2HD0cdhx5HD0c4xt7HOQbexx8HOQbexx9HHwcfRx+HHwcfBx+HH8cfhyAHH8c5Bt8HOYbfBx/HOYbehyBHIIcgRyDHIIcgRx9HIMcfRx7HIMcgxx7HPIbexzjG/IbghyDHPEbgxzyG/EbhByFHIYchRyHHIYchRyAHIccgBx+HIcchxx+HIgcfhx9HIgchhyHHIkchxyIHIkcaRxoHIocaByLHIocaBxXG4scVxtZG4scixxZG4wcWRtfG4wcihyLHI0cixyMHI0chByGHI4chhyPHI4chhyJHI8ciRyQHI8cjxyQHIockBxpHIocjhyPHI0cjxyKHI0cdxyRHHgckRySHHgckRyJHJIciRyIHJIckhyIHIEciBx9HIEceBySHHockhyBHHociRyRHJAckRyTHJAckRx3HJMcdxyUHJMckxyUHGQclBxiHGQckByTHGkckxxkHGkcYRxyHJUcchyWHJUcchxiHJYcYhyUHJYclhyUHHQclBx3HHQclRyWHHMclhx0HHMcRhxgHEccYByXHEccYBxhHJccYRyVHJcclxyVHJgclRxzHJgcRxyXHEAclxyYHEAcQByYHEEcmByZHEEcmBxzHJkccxx1HJkcmRx1HDscdRw9HDscQRyZHDocmRw7HDocPRx5HDwceRyaHDwceRx6HJocehyCHJocmhyCHJscghzxG5scPByaHDccmhybHDcc7RucHO8bnBydHO8bnBwzHJ0cMxw0HJ0cnRw0HJscNBw3HJsc7xudHPEbnRybHPEbpAlZCusbWQqeHOsbWQrsCZ4c7AkwHJ4cnhwwHJwcMBwzHJwc6xueHO0bnhycHO0bFhufHBcbnxygHBcbnxyhHKAcoRyiHKAcoByiHKMcohwjG6McFxugHBkboByjHBkboRykHKIcpBylHKIcpBymHKUcphynHKUcpRynHB0bpxwbGx0bohylHCMbpRwdGyMbqBypHKocqRyrHKocqRysHKscrBytHKscqxytHGUKrRxjCmUKqhyrHGsKqxxlCmsKrhyvHLAcrxyxHLAcrxxuCrEcbgpsCrEcsRxsCq0cbApjCq0csByxHKwcsRytHKwcshyzHLQcsxy1HLQcsxy2HLUcthy3HLUctRy3HKkctxysHKkctBy1HKgctRypHKgcuBy5HLocuRy7HLocuRyuHLscrhywHLscuxywHLccsBysHLccuhy7HLYcuxy3HLYcvBy9HL4cvRy/HL4cvRzAHL8cwBzBHL8cvxzBHC4bwRwSGy4bvhy/HC0bvxwuGy0bwBzCHMEcwhzDHMEcwhzEHMMcxBzFHMMcwxzFHBMbxRwWGxMbwRzDHBIbwxwTGxIbvBzGHL0cxhzHHL0cxhy4HMccuBy6HMccxxy6HMgcuhy2HMgcvRzHHMAcxxzIHMActhyzHMgcsxzJHMgcsxyyHMkcshzKHMkcyRzKHMIcyhzEHMIcyBzJHMAcyRzCHMAcxBzLHMUcyxzMHMUcyxzNHMwczRzOHMwczBzOHJ8czhyhHJ8cxRzMHBYbzByfHBYbzRzPHM4czxzQHM4czxzRHNAc0RzSHNAc0BzSHKQc0hymHKQczhzQHKEc0BykHKEc0xzUHNUc1BzWHNUc1BzXHNYc1xzYHNYc1hzYHM8c2BzRHM8c1RzWHM0c1hzPHM0c2RzaHNsc2hzcHNsc2hxYHNwcWBxaHNwc3BxaHN0cWhxMHN0c2xzcHN4c3BzdHN4cphzfHKcc3xzgHKcc3xzhHOAc4RziHOAc4BziHFEc4hxIHFEcpxzgHBsb4BxRHBsb3hzdHOMc3RzkHOMc3RxMHOQcTBxJHOQc5BxJHOIcSRxIHOIc4xzkHOEc5BziHOEc5RzmHOcc5hzoHOcc5hzhHOgc4RzfHOgc6BzfHNIc3xymHNIc5xzoHNEc6BzSHNEc6RzqHOsc6hzsHOsc6hzeHOwc3hzjHOwc7BzjHOYc4xzhHOYc6xzsHOUc7BzmHOUc7RzuHO8c7hzwHO8c7hzZHPAc2RzbHPAc8BzbHOoc2xzeHOoc7xzwHOkc8BzqHOkc8RzyHPMc8hz0HPMc8hz1HPQc9Rz2HPQc9Bz2HPcc9hz4HPcc8xz0HPkc9Bz3HPkcbBxuHPocbhz7HPocbhxYHPscWBzaHPsc+xzaHPwc2hzZHPwc+hz7HP0c+xz8HP0cWxttHGIbbRz+HGIbbRxsHP4cbBz6HP4c/hz6HP8c+hz9HP8cYhv+HGQb/hz/HGQb/Rz8HAAd/BwBHQAd/BzZHAEd2RzuHAEdAR3uHAId7hztHAIdAB0BHfgcAR0CHfgcZBv/HAMd/xwEHQMd/xz9HAQd/RwAHQQdBB0AHfYcAB34HPYcAx0EHfUcBB32HPUc+Rz3HAUd9xwGHQUd9xz4HAYd+BwCHQYdBh0CHQcdAh3tHAcdBR0GHQgdBh0HHQgdCB0HHQkdBx0KHQkdBx3tHAod7RzvHAodCh3vHAsd7xzpHAsdCR0KHQwdCh0LHQwdDB0LHQ0dCx0OHQ0dCx3pHA4d6RzrHA4dDh3rHA8d6xzlHA8dDR0OHRAdDh0PHRAdEB0PHREdDx0SHREdDx3lHBId5RznHBIdEh3nHNgc5xzRHNgcER0SHdccEh3YHNccEx0UHRUdFB0WHRUdFB0XHRYdFx0YHRYdFh0YHREdGB0QHREdFR0WHdccFh0RHdccEx0VHRkdFR0aHRkdFR3XHBod1xzUHBodGh3UHBsd1BzTHBsdGR0aHRwdGh0bHRwdshwdHcocHR0eHcocHR3THB4d0xzVHB4dHh3VHMsc1RzNHMscyhweHcQcHh3LHMQcHB0bHR8dGx0gHR8dGx3THCAd0xwdHSAdIB0dHbQcHR2yHLQcHx0gHagcIB20HKgc5AohHeMKIR0iHeMKIR0cHSIdHB0fHSIdIh0fHaocHx2oHKoc4woiHWsKIh2qHGsKIx0kHSUdJB0mHSUdJB3pCiYd6QrmCiYdJh3mCicd5grlCicdJR0mHSgdJh0nHSgd6QokHfAKJB0pHfAKJB0jHSkdIx0qHSkdKR0qHdsbKh3dG9sb8AopHY8JKR3bG48J3RsrHd4bKx0sHd4bKx0tHSwdLR0uHSwdLB0uHR4cLh25Gx4c3hssHdobLB0eHNobuRsuHbgbLh0vHbgbLh0tHS8dLR0wHS8dLx0wHTEdMB0yHTEduBsvHbobLx0xHbobMh0wHTMdMB00HTMdMB0tHTQdLR01HTQdNB01HasbNR2pG6sbMx00HbEbNB2rG7EbIx02HSodNh03HSodNh2pGzcdqRs1HTcdNx01HSsdNR0tHSsdKh03Hd0bNx0rHd0bKB04HSUdOB05HSUdOB2tGzkdrRuqGzkdOR2qGzYdqhupGzYdJR05HSMdOR02HSMdzBvQGzod0Bs7HTod0BvRGzsd0Rs8HTsdOx08Ha8bPB2xG68bOh07HbAbOx2vG7AbzBs6HcsbOh09HcsbOh2wGz0dsBs+HT0dPR0+HT8dPh1AHT8dyxs9Hc0bPR0/Hc0bQB0+HUEdPh1CHUEdPh2wG0IdsBtDHUIdQh1DHUQdQx1FHUQdQR1CHUYdQh1EHUYdsBuuG0MdrhtHHUMdrhutG0cdrRs4HUcdRx04HUgdOB0oHUgdQx1HHUUdRx1IHUUdRR1IHUkdSB1KHUkdSB0oHUodKB0nHUodSh0nHQ8LJx3lCg8LSR1KHRILSh0PCxILRh1EHUsdRB1MHUsdRB1FHUwdRR1JHUwdTB1JHRMLSR0SCxMLSx1MHRYLTB0TCxYLTR1OHU8dTh1QHU8dTh1GHVAdRh1LHVAdUB1LHRcLSx0WCxcLTx1QHRwLUB0XCxwLzRs/HVEdPx1SHVEdPx1AHVIdQB1BHVIdUh1BHU4dQR1GHU4dUR1SHU0dUh1OHU0dzRtRHVMdUR1UHVMdUR1NHVQdTR1VHVQdVB1VHVYdVR1XHVYdUx1UHVgdVB1WHVgdLAtZHSsLWR1aHSsLWR1bHVodWx1cHVodWh1cHV0dXB1eHV0dKwtaHS0LWh1dHS0LMgswC18dMAtgHV8dMAstC2AdLQtdHWAdYB1dHWEdXR1eHWEdXx1gHVcdYB1hHVcdHAs0C08dNAtiHU8dNAsyC2IdMgtfHWIdYh1fHVUdXx1XHVUdTx1iHU0dYh1VHU0dYx1kHWUdZB1mHWUdZB3xHGYd8RxnHWYdZh1nHWgdZx1pHWgdZR1mHWodZh1oHWodQwtrHUILax1sHUILax1pHWwdaR1tHWwdbB1tHW4dbR1vHW4dQgtsHUQLbB1uHUQLRAtuHUkLbh1wHUkLbh1vHXAdbx1xHXAdcB1xHXIdcR1zHXIdSQtwHUoLcB1yHUoLbx10HXEddB11HXEddB35HHUd+RwFHXUddR0FHXYdBR0IHXYdcR11HXMddR12HXMdaR1nHW0dZx13HW0dZx3xHHcd8RzzHHcddx3zHHQd8xz5HHQdbR13HW8ddx10HW8dah1oHXgdaB15HXgdaB1pHXkdaR1rHXkdeR1rHU8Lax1DC08LeB15HVILeR1PC1ILZRtjG3odYxt7HXodYxtkG3sdZBsDHXsdex0DHXwdAx31HHwdeh17HX0dex18HX0dfR18HX4dfB1/HX4dfB31HH8d9RzyHH8dfx3yHGQd8hzxHGQdfh1/HWMdfx1kHWMdXAuAHVsLgB2BHVsLgB0THYEdEx0ZHYEdgR0ZHSEdGR0cHSEdWwuBHeQKgR0hHeQKXAtgC4AdYAuCHYAdYAtfC4IdXwuDHYIdgh2DHRQdgx0XHRQdgB2CHRMdgh0UHRMdEB0YHQ0dGB2EHQ0dGB0XHYQdFx2FHYQdhB2FHYYdhR2HHYYdDR2EHQwdhB2GHQwdcx12HYgddh2JHYgddh0IHYkdCB0JHYkdiR0JHYYdCR0MHYYdiB2JHYcdiR2GHYcdagtoC4odaAuLHYodaAtKC4sdSgtyHYsdix1yHYgdch1zHYgdih2LHYcdix2IHYcdXwtsC4MdbAuMHYMdbAtqC4wdaguKHYwdjB2KHYUdih2HHYUdgx2MHRcdjB2FHRcdcAuNHW8LjR2OHW8LjR0MHI4dDBwOHI4djh0OHNIbDhykG9IbbwuOHX8Jjh3SG38JcAtyC40dcguPHY0dcguFCY8dhQnWG48djx3WGxIc1hvVGxIcjR2PHQwcjx0SHAwckB2RHZIdkR2THZIdkR2UHZMdlB2VHZMdkx2VHVcSlR1aElcSkh2THVYSkx1XElYSlh2XHZgdlx2ZHZgdlx2aHZkdmh2bHZkdmR2bHZwdmx2dHZwdmB2ZHZ4dmR2cHZ4dnx2gHaEdoB2iHaEdoB2jHaIdox2kHaIdoh2kHaUdpB2mHaUdoR2iHacdoh2lHacdqB2pHaodqR2rHaodqR2sHasdrB2tHasdqx2tHa4drR2vHa4dqh2rHbAdqx2uHbAdsR2yHbMdsh20HbMdsh2jHbQdox2gHbQdtB2gHbUdoB2fHbUdsx20HbAdtB21HbAdth23Hbgdtx25Hbgdtx2xHbkdsR2zHbkduR2zHa4dsx2wHa4duB25Ha8duR2uHa8dsB21HaodtR26HaodtR2fHbodnx27Hboduh27Hbwdux29Hbwdqh26Hagduh28HagdqB28Hb4dvB2/Hb4dvB29Hb8dvR3AHb8dvx3AHcEdwB3CHcEdvh2/HcMdvx3BHcMdwx3BHcQdwR3FHcQdwR3CHcUdwh3GHcUdxR3GHccdxh2nC8cdxB3FHcgdxR3HHcgdyR3KHcsdyh3MHcsdyh2xC8wdsQuuC8wdzB2uC80drgutC80dyx3MHc4dzB3NHc4dwh3PHcYdzx3QHcYdzx3OHdAdzh3NHdAd0B3NHbYLzR2tC7YLxh3QHacL0B22C6cL0R3SHdMd0h3UHdMd0h3VHdQd1R3WHdQd1B3WHdcd1h3YHdcd0x3UHdkd1B3XHdkd2h3bHdwd2x3dHdwd2x0HG90dBxveHd0d3R3eHdMd3h3RHdMd3B3dHdkd3R3THdkdKxvfHSob3x3gHSob3x3aHeAd2h3cHeAd4B3cHeEd3B3ZHeEdKhvgHSwb4B3hHSwb4h3jHeQd4x3lHeQd4x3mHeUd5h3nHeUd5R3nHegd5x3pHegd5B3lHeod5R3oHeod6x3sHe0d7B3uHe0d7B2WHe4dlh3vHe4d7h3vHeMd7x3mHeMd7R3uHeId7h3jHeId8B3xHfId8R3zHfId8R3rHfMd6x3tHfMd8x3tHfQd7R3iHfQd8h3zHfUd8x30HfUd9R30HfYd9B33HfYd9B3iHfcd4h3kHfcd9x3kHfgd5B3qHfgd9h33Hdgd9x34Hdgd6h3oHfkd6B36Hfkd6B3pHfod6R37Hfod+h37Hfwd+x39Hfwd+R36HSwb+h38HSwb2R3XHeEd1x3+HeEd1x3YHf4d2B34Hf4d/h34Hfkd+B3qHfkd4R3+HSwb/h35HSwb9R32Hf8d9h0AHv8d9h3YHQAe2B3WHQAeAB7WHQEe1h3VHQEe/x0AHgIeAB4BHgIeAx4EHgUeBB4GHgUeBB7wHQYe8B3yHQYeBh7yHf8d8h31Hf8dBR4GHgIeBh7/HQIeBx4IHgkeCB4KHgkeCB4LHgoeCx4MHgoeCh4MHg0eDB4OHg0eCR4KHg8eCh4NHg8eEB4RHhIeER4THhIeER4UHhMeFB4VHhMeEx4VHhYeFR4XHhYeEh4THgceEx4WHgceGB4ZHhoeGR4bHhoeGR4LHhseCx4IHhseGx4IHhYeCB4HHhYeGh4bHhceGx4WHhceDh4MHhweDB4dHhweDB4LHh0eCx4ZHh0eHR4ZHh4eGR4YHh4eHB4dHh8eHR4eHh8eHx4eHiAeHh4hHiAeHh4YHiEeGB4iHiEeIR4iHiMeIh4kHiMeIB4hHr8XIR4jHr8XGB4aHiIeGh4lHiIeGh4XHiUeFx4mHiUeJR4mHiceJh4oHiceIh4lHiQeJR4nHiQeKR4qHiseKh4sHiseKh4tHiweLR4uHiweLB4uHi8eLh4wHi8eKx4sHjEeLB4vHjEeMB4yHi8eMh4zHi8eMh40HjMeNB41HjMeMx41HjYeNR4oHjYeLx4zHjEeMx42HjEeNx44HjkeOB46HjkeOB47HjoeOx48HjoeOh48Hj0ePB4QHj0eOR46Hj4eOh49Hj4e1R0/HgEePx5AHgEePx43HkAeNx45HkAeQB45HkEeOR4+HkEeAR5AHgIeQB5BHgIeKR4rHkIeKx5DHkIeKx4xHkMeMR5EHkMeQx5EHjgeRB47HjgeQh5DHjceQx44HjceRR5GHkceRh5IHkceRh4tHkgeLR4qHkgeSB4qHkIeKh4pHkIeRx5IHjceSB5CHjceMB4uHkkeLh5KHkkeLh4tHkoeLR5GHkoeSh5GHkseRh5FHkseSR5KHkweSh5LHkweTR5OHk8eTh5QHk8eTh40HlAeNB4yHlAeUB4yHkkeMh4wHkkeTx5QHkweUB5JHkwevxcjHsAXIx5RHsAXIx4kHlEeJB5SHlEeUR5SHlMeUh5UHlMewBdRHsIXUR5THsIXVB5VHlYeVR5XHlYeVR5YHlceWB5ZHlceVx5ZHloeWR5bHloeVh5XHlweVx5aHlweWB5VHl0eVR5eHl0eVR5UHl4eVB5SHl4eXh5SHiceUh4kHiceXR5eHigeXh4nHigewhdTHl8eUx5gHl8eUx5UHmAeVB5WHmAeYB5WHmEeVh5cHmEeXx5gHmIeYB5hHmIevBfBF2MewRdkHmMewRfCF2QewhdfHmQeZB5fHmUeXx5iHmUeYx5kHmYeZB5lHmYerxe7F7AXuxdnHrAXuxe8F2cevBdjHmceZx5jHmgeYx5mHmgesBdnHkkXZx5oHkkXZh5pHmgeaR5qHmgeaR5mF2oeZhdlF2oeah5lF0oXZRdNF0oXaB5qHkkXah5KF0kXax5sHm0ebB5uHm0ebB5mF24eZhdpHm4ebh5pHmUeaR5mHmUebR5uHmIebh5lHmIe5RfjF28e4xdwHm8e4xfkF3Ae5BdxHnAecB5xHnIecR5zHnIebx5wHnQecB5yHnQedR52Hncedh54Hncedh5hF3geYRdiF3geeB5iF2weYhdmF2wedx54HmseeB5sHmseyxfrGHke6xh6Hnke6xhaF3oeWhdcF3oeeh5cF3YeXBdhF3YeeR56HnUeeh52HnUewxfFF+IXxRd7HuIXxRfLF3seyxd5Hnseex55HnweeR51Hnwe4hd7HuQXex58HuQX5Bd8HnEefB59HnEefB51Hn0edR53Hn0efR53Hn4edx5rHn4ecR59HnMefR5+HnMecx5+Hn8efh6AHn8efh5rHoAeax5tHoAegB5tHmEebR5iHmEefx6AHlwegB5hHlweWx6BHloegR6CHloegR50HoIedB5yHoIegh5yHn8ech5zHn8eWh6CHlwegh5/Hlwegx6EHoUehB6GHoUehB6HHoYehx6IHoYehh6IHr0ZiB67Gb0ZhR6GHsAZhh69GcAZiR6KHoseih6MHoseih5NHoweTR5PHowejB5PHo0eTx5MHo0eix6MHo4ejB6NHo4e1BnSGY8e0hmQHo8e0hmvGZAerxmRHpAekB6RHpIekR6THpIejx6QHpQekB6SHpQetxm8GZUevBmWHpUevBm7GZYeuxmIHpYelh6IHpceiB6HHpcelR6WHpMelh6XHpMerxmtGZEerRmYHpEerRmsGZgerBm4GZgemB64GZUeuBm3GZUekR6YHpMemB6VHpMe3hfgF+AY4BeZHuAY4BflF5ke5ReaHpkemR6aHpsemh6cHpse4BiZHvoXmR6bHvoXnB6dHpsenR6eHpsenR6DHp4egx6FHp4enh6FHsEZhR7AGcEZmx6eHvoXnh7BGfoXnx6gHqEeoB6iHqEeoB6cHqIenB6aHqIeoh6aHm8emh7lF28eoR6iHnQeoh5vHnQehx6EHqMehB6kHqMehB6DHqQegx6dHqQepB6dHqAenR6cHqAeox6kHp8epB6gHp8enx6lHqMepR6mHqMepR6JHqYeiR6LHqYeph6LHqceix6OHqceox6mHoceph6nHoceiR6lHqgepR6pHqgepR6fHqkenx6hHqkeqR6hHoEeoR50HoEeqB6pHlseqR6BHlseWB6qHlkeqh6rHlkeqh5NHqseTR6KHqseqx6KHqgeih6JHqgeWR6rHlseqx6oHlseKB41Hl0eNR6sHl0eNR40HqweNB5OHqwerB5OHqoeTh5NHqoeXR6sHlgerB6qHlgeFx4VHiYeFR6tHiYeFR4UHq0eFB6uHq0erR6uHjYerh4xHjYeJh6tHigerR42HigeEB48HhEePB6vHhEePB47Hq8eOx5EHq8erx5EHq4eRB4xHq4eER6vHhQerx6uHhQeEB4SHj0eEh6wHj0eEh4HHrAeBx4JHrAesB4JHrEeCR4PHrEePR6wHj4esB6xHj4ePh6xHkEesR6yHkEesR4PHrIeDx6zHrIesh6zHrQesx61HrQeQR6yHgIesh60HgIetR62HrQeth63HrQeth64HrceuB65Hrcetx65HgUeuR4DHgUetB63HgIetx4FHgIeuh67Hrweux69Hrweux64Hr0euB6+Hr0evR6+Hr8evh7AHr8evB69HsEevR6/HsEewh7DHsQewx7FHsQewx7GHsUexh7HHsUexR7HHsgexx7JHsgexB7FHsoexR7IHsoeDx4NHsseDR7MHsseDR4OHsweDh7NHswezB7NHs4ezR7PHs4eyx7MHsIezB7OHsIetR6zHtAesx7RHtAesx4PHtEeDx7LHtEe0R7LHtIeyx7CHtIe0B7RHtMe0R7SHtMeuB62Hr4eth7UHr4eth61HtQetR7QHtQe1B7QHtUe0B7THtUevh7UHsAe1B7VHsAewB7VHtYe1R7XHtYe1R7THtce0x7YHtce1x7YHtke2B7aHtke1h7XHtse1x7ZHtse0x7SHtge0h7cHtge0h7CHtwewh7EHtwe3B7EHt0exB7KHt0e2B7cHtoe3B7dHtoexh7eHt8e3h7gHt8e3h7hHuAe4R7iHuAe4B7iHuMe4h7kHuMe3x7gHuUe4B7jHuUe5B7mHuce5h7oHuce5h7pHuge6R7qHuge6B7qHrYX6h65F7YX5x7oHrUX6B62F7UX6R7rHuoe6x7sHuoe6x4fHuweHx4gHuwe7B4gHr0XIB6/F70X6h7sHrkX7B69F7kXHx7rHhwe6x7tHhwe6x7pHu0e6R7uHu0e7R7uHs0e7h7PHs0eHB7tHg4e7R7NHg4e5B7iHuYe4h7vHuYe4h7hHu8e4R7wHu8e7x7wHu4e8B7PHu4e5h7vHuke7x7uHukezx7wHs4e8B7xHs4e8B7hHvEe4R7eHvEe8R7eHsMe3h7GHsMezh7xHsIe8R7DHsIe8h7zHvQe8x71HvQe8x72HvUe9h73HvUe9R73Hvge9x7JHvge9B71Hvke9R74Hvke+h77Hvwe+x79Hvwe+x61F/0etRe3F/0e/R63F7EXtxevF7EX/B79HrQX/R6xF7QX5R7jHv4e4x7/Hv4e4x7kHv8e5B7nHv8e/x7nHvse5x61F/se/h7/Hvoe/x77Hvoe9BcAH/MXAB8BH/MXAB8CHwEfAh8DHwEfAR8DHwQfAx8FHwQf8xcBH9AXAR8EH9AX0BcEH9EXBB8GH9EXBB8FHwYfBR8HHwYfBh8HH28XBx9uF28X0RcGH3QXBh9vF3QXtBezFwgfsxcJHwgfsxdRFwkfURdrFwkfCR9rFwcfaxduFwcfCB8JHwUfCR8HHwUfAh8KHwMfCh8LHwMfCh/6Hgsf+h78HgsfCx/8Hggf/B60FwgfAx8LHwUfCx8IHwUf8h70Hgwf9B4NHwwf9B75Hg0f+R4OHw0fDR8OHwAfDh8CHwAfDB8NH/QXDR8AH/QX+R4PHw4fDx8QHw4fDx/lHhAf5R7+HhAfEB/+Hgof/h76HgofDh8QHwIfEB8KHwIf5R4PH98eDx8RH98eDx/5HhEf+R74HhEfER/4Hsce+B7JHsce3x4RH8YeER/HHsYeyR73Hsge9x4SH8ge9x72HhIf9h4THxIfEh8THxQfEx8VHxQfyB4SH8oeEh8UH8oeFh8XHxgfFx8ZHxgfFx/KHhkfyh4UHxkfGB8ZHxUfGR8UHxUfGh8bHxwfGx8dHxwfGx8eHx0fHh8fHx0fHR8fHyAfHx8hHyAfHB8dH9seHR8gH9seaRJ2EiIfdhIjHyIfdhJzEiMfcxIkHyMfIx8kH/kaJB9qGvkaIh8jH/4aIx/5Gv4acxJxEiQfcRIlHyQfcRJyEiUfchImHyUfJR8mH2UaJh9jGmUaJB8lH2oaJR9lGmoachInHyYfJx8oHyYfJx9fGCgfXxhhGCgfKB9hGHQaYRhnGHQaJh8oH2MaKB90GmMabxIAGHASABgpH3ASABj/Fykf/xdpGCkfKR9pGCcfaRhfGCcfcBIpH3ISKR8nH3ISFR8qHysfKh8sHysfKh8tHywfLR8uHywfLB8uHy8fLh8wHy8fKx8sHzEfLB8vHzEf8RcyH/IXMh8zH/IXMh8tHzMfLR80HzMfMx80HwwfNB/yHgwf8hczH/QXMx8MH/QX9h7zHhMf8x41HxMf8x7yHjUf8h40HzUfNR80HyofNB8tHyofEx81HxUfNR8qHxUfcRg2H3kYNh83H3kYNh84HzcfOB85HzcfNx85H+8XOR/xF+8XeRg3H8wXNx/vF8wXOB86HzkfOh87HzkfOh8wHzsfMB8uHzsfOx8uHzIfLh8tHzIfOR87H/EXOx8yH/EXMR8vHzwfLx89HzwfLx8wHz0fMB8+Hz0fPR8+Hz8fPh9lEj8fPB89HxYfPR8/HxYfWhKVHUAflR1BH0AflR2UHUEflB1CH0EfQR9CH0MfQh+mHUMfQB9BH0QfQR9DH0QfGh9FHxsfRR9GHxsfRR9dEkYfXRJHH0YfRh9HH0gfRx9EH0gfGx9GHx4fRh9IHx4fRB9JH0gfSR9KH0gfSR+xHUofsR23HUofSh+3HUsftx22HUsfSB9KHx4fSh9LHx4fph2kHUMfpB1MH0MfpB2jHUwfox2yHUwfTB+yHUkfsh2xHUkfQx9MH0QfTB9JH0QfRB9HH0AfRx9NH0AfRx9dEk0fXRJbEk0fQB9NH1oSTR9bEloSXhJkEk4fZBJPH04fZBJjEk8fYxJQH08fTx9QH1EfUB9SH1EfTh9PH1MfTx9RH1Mf/hoBG1QfARtVH1QfARtVGlUfVRoDG1UfVR8DG1YfAxsIG1YfVB9VH1IfVR9WH1IfYxJqElAfahJXH1AfahJpElcfaRIiH1cfVx8iH1QfIh/+GlQfUB9XH1IfVx9UH1IfERsPGzwbDxtYHzwbDxsQG1gfEBtZH1gfWB9ZH1ofWR9bH1ofPBtYHzMbWB9aHzMbWx9cH1ofXB9dH1ofXB/aHV0f2h3fHV0fXR/fHTQb3x0rGzQbWh9dHzMbXR80GzMbCBsGG14fBhtfH14fBhsHG18fBxvbHV8fXx/bHVwf2x3aHVwfXh9fH1sfXx9cH1sfEBtgH1kfYB9hH1kfYB9iH2EfYh9jH2EfYR9jH2QfYx9TH2QfWR9hH1sfYR9kH1sfUx9RH2QfUR9lH2QfUR9SH2UfUh9WH2UfZR9WH14fVh8IG14fZB9lH1sfZR9eH1sfUx9jH04fYx9mH04fYx9iH2YfYh9nH2YfZh9nH1gSZx9WElgSTh9mH14SZh9YEl4SIR9oHyAfaB9pHyAfaB9qH2kfah9rH2kfaR9rH2wfax9tH2wfIB9pH9seaR9sH9seah9uH2sfbh9vH2sfbh9wH28fcB9xH28fbx9xH3IfcR9zH3Ifax9vH20fbx9yH20fcx9xH3QfcR91H3QfcR9wH3UfcB92H3UfdR92H3cfdh94H3cfdB91H3kfdR93H3kfeh97H3wfex99H3wfex9+H30ffh9/H30ffR9/H4Affx+BH4AffB99H4IffR+AH4IfgR+DH4Afgx+EH4Afgx+FH4QfhR+GH4QfhB+GH4cfhh+IH4cfgB+EH4IfhB+HH4IfhR+JH4YfiR+KH4YfiR/DHYofwx3EHYofih/EHYsfxB3IHYsfhh+KH4gfih+LH4gfhR+MH4kfjB+NH4kfjB+sHY0frB2pHY0fjR+pHb4dqR2oHb4diR+NH8MdjR++HcMdrx2tHY4frR2PH44frR2sHY8frB2MH48fjx+MH4MfjB+FH4Mfjh+PH4Efjx+DH4EfcB+QH3YfkB+RH3YfkB+SH5Efkh+TH5EfkR+TH5Qfkx+VH5Qfdh+RH3gfkR+UH3gflR+TH5Yfkx+XH5Yfkx+SH5cfkh+YH5cflx+YH5kfmB+aH5kflh+XH34flx+ZH34fah+bH24fmx+cH24fmx+dH5wfnR+eH5wfnB+eH5Afnh+SH5Afbh+cH3AfnB+QH3Afmh+fH6Afnx+hH6Afnx+iH6Efoh+jH6EfoR+jH7gdox+2HbgdoB+hH68doR+4Ha8dth2jH0sfox+kH0sfox+iH6Qfoh+lH6QfpB+lHx8fpR8hHx8fSx+kHx4fpB8fHx4foh+mH6Ufph+nH6Ufph+dH6cfnR+bH6cfpx+bH2gfmx9qH2gfpR+nHyEfpx9oHyEfkh+eH5gfnh+oH5gfnh+dH6gfnR+mH6gfqB+mH58fph+iH58fmB+oH5ofqB+fH5ofgR9/H44ffx+pH44ffx9+H6kffh+ZH6kfqR+ZH6AfmR+aH6Afjh+pH68dqR+gH68dqh+rH6wfqx+tH6wfqx+VH60flR+WH60frR+WH3sflh9+H3sfrB+tH3ofrR97H3ofrh+vH7Afrx+xH7Afrx94H7EfeB+UH7EfsR+UH6sflB+VH6sfsB+xH6ofsR+rH6ofsh+zH7Qfsx+1H7Qfsx+2H7Ufth+3H7UftR+3H7gftx+5H7gftB+1H3kftR+4H3kfrh+6H68fuh+7H68fuh+yH7sfsh+0H7sfux+0H3cftB95H3cfrx+7H3gfux93H3gfeR+4H3QfuB+8H3QfuB+5H7wfuR+9H7wfvB+9H74fvR+/H74fdB+8H3MfvB++H3Mfcx++H3Ifvh/AH3Ifvh+/H8Afvx/BH8AfwB/BH8IfwR/BHsIfch/AH20fwB/CH20fbR/CH2wfwh/DH2wfwh/BHsMfwR6/HsMfwx+/HtYevx7AHtYebB/DH9sewx/WHtsevx/EH8EfxB/FH8EfxB/GH8Ufxh/HH8UfxR/HH7wexx+6HrwewR/FH8EexR+8HsEeyB/JH8ofyR/LH8ofyR/MH8sfzB/NH8sfyh/LH84fyx/NH84fzx/QH9Ef0B/SH9Ef0B/TH9If0x/UH9If0h/UH9Uf1B/WH9Uf0R/SH9cf0h/VH9cf2B/ZH9of2R/bH9of2R/cH9sf3B/dH9sf2x/dH9Ef3R/PH9Ef2h/bH9cf2x/RH9cf3h/fH+Af3x/hH+Af3x/iH+Ef4h/jH+Ef4R/jH+Qf4x/lH+Qf4B/hH+Yf4R/kH+Yf5x/oH+kf6B/qH+kf6B/iH+of4h/fH+of6h/fH+sf3x/eH+sf6R/qH9gf6h/rH9gf7B/tH+4f7R/vH+4f7R/wH+8f8B/xH+8f7x/xH/If8R/zH/If7h/vH/Qf7x/yH/Qf9B/yH/Uf8h/2H/Uf8h/zH/Yf8x/3H/Yf9h/3H/gf9x/5H/gf9R/2H/of9h/4H/of8x/7H/cf+x/8H/cf+x/IH/wfyB/9H/wf/B/9H/4f/R//H/4f9x/8H/kf/B/+H/kf8B8AIPEfACABIPEfACDMHwEgzB/JHwEgASDJH/sfyR/IH/sf8R8BIPMfASD7H/MfAiADIAQgAyAFIAQgAyAGIAUgBiAHIAUgBSAHIAggByAJIAggBCAFIAogBSAIIAogCyAMIA0gDCAOIA0gDCAPIA4gDyAQIA4gDiAQIBEgECASIBEgDSAOIBMgDiARIBMgEiAUIBEgFCAVIBEgFCAJIBUgCSAWIBUgFSAWIBcgFiAYIBcgESAVIBMgFSAXIBMgCSAUIAggFCAZIAggFCASIBkgEiAaIBkgGSAaIBsgGiDnHxsgCCAZIAogGSAbIAogBiAcIAcgHCAdIAcgHCAeIB0gHiAfIB0gHSAfIBYgHyAYIBYgByAdIAkgHSAWIAkgICAhICIgISAjICIgISAkICMgJCAlICMgIyAlICYgJSDsHyYgIiAjICcgIyAmICcgKCApICogKSArICogKSDwHysg8B/tHysgKyDtHyUg7R/sHyUgKiArICQgKyAlICQgLCAtIC4gLSAvIC4gLSDMHy8gzB8AIC8gLyAAICkgACDwHykgLiAvICggLyApICggMCAxIDIgMSAzIDIgMSACIDMgAiAEIDMgMyAEIDQgBCAKIDQgMiAzINcfMyA0INcfCiAbIDQgGyA1IDQgGyDnHzUg5x/pHzUgNSDpH9of6R/YH9ofNCA1INcfNSDaH9cfEiAQIBogECA2IBogECAPIDYgDyA3IDYgNiA3IOgfNyDiH+gfGiA2IOcfNiDoH+cf4h83IOMfNyA4IOMfNyAPIDggDyAMIDggOCAMIDkgDCALIDkg4x84IOUfOCA5IOUfOiA7IDwgOyA9IDwgOyALID0gCyANID0gPSANID4gDSATID4gPCA9ID8gPSA+ID8gQCBBIEIgQSBDIEIgQSDlH0Mg5R85IEMgQyA5IDsgOSALIDsgQiBDIDogQyA7IDogQCBEIEEgRCBFIEEgRCBGIEUgRiBHIEUgRSBHIOQfRyDmH+QfQSBFIOUfRSDkH+UfSCBJIEogSSBLIEogSSBMIEsgTCBNIEsgSyBNIE4gTSBPIE4gSiBLIFAgSyBOIFAgUSBSIFMgUiBUIFMgUiBGIFQgRiBEIFQgVCBEIFUgRCBAIFUgUyBUIFYgVCBVIFYgCRtXIAobVyBYIAobVyBZIFggWSBaIFggWCBaIFsgWiBcIFsgChtYIA0bWCBbIA0bXCBdIF4gXSBfIF4gXSC2FV8gthXgFV8gXyDgFWAg4BXfFWAgXiBfIGEgXyBgIGEgphW3FWIgtxVjIGIgtxW2FWMgthVdIGMgYyBdIFogXSBcIFogYiBjIFkgYyBaIFkgZCBlIGYgZSBnIGYgZSBoIGcgaCBpIGcgZyBpIGogaSBrIGogZiBnIGwgZyBqIGwgbCBtIG4gbSBvIG4gbSBwIG8gcCBxIG8gbyBxIJgbcSCbG5gbbiBvIJcbbyCYG5cbcCByIHEgciBzIHEgciB0IHMgdCB1IHMgcyB1IHYgdSB3IHYgcSBzIJsbcyB2IJsbdyB1IHggdSB5IHggdSB0IHkgdCB6IHkgeSB6IHsgeiB8IHsgeCB5IH0geSB7IH0geRt3G34gdxt/IH4gdxt0G38gdBtyG38gfyByG4AgchtzG4AgfiB/IIEgfyCAIIEgeht4G38beBuCIH8beBt5G4IgeRt+IIIggiB+IIMgfiCBIIMgfxuCIIEbgiCDIIEbaBv+G4Qg/huFIIQg/hv9G4Ug/RsLHIUghSALHIMgCxyBG4MghCCFIIEghSCDIIEgaBuEIGkbhCCGIGkbhCCBIIYggSCHIIYghiCHIIgghyCJIIggaRuGIGsbhiCIIGsbgSCAIIcggCCKIIcggCBzG4ogcxuLIIogiiCLIIwgiyCNIIwghyCKIIkgiiCMIIkgjiCPIJAgjyCRIJAgjyCSIJEgkiCTIJEgkSCTIJQgkyCVIJQgkCCRIJYgkSCUIJYgiSCMIJcgjCCYIJcgjCCNIJggjSCZIJggmCCZII8gmSCSII8glyCYII4gmCCPII4gcxtxG5ogcRubIJogcRtwG5sgcBucIJsgmyCcIJ0gnCCeIJ0gmiCbIJ8gmyCdIJ8gWB2gIFMdoCChIFMdoCCeIKEgniCiIKEgoSCiIMgboiDHG8gbUx2hIM0boSDIG80bniCcIKIgnCCjIKIgnCBwG6MgcBttG6MgoyBtG8YbbRtsG8YboiCjIMcboyDGG8cbfSB7IKQgeyClIKQgeyB8IKUgfCCmIKUgpSCmIKcgpiCfIKcgpCClIKggpSCnIKggWx2pIFwdqSCqIFwdqSB9IKogfSCkIKogqiCkIKsgpCCoIKsgXB2qIF4dqiCrIF4dXh2rIGEdqyCsIGEdqyCoIKwgqCCtIKwgrCCtIFYdrSBYHVYdYR2sIFcdrCBWHVcdnyCdIKcgnSCuIKcgnSCeIK4gniCgIK4griCgIK0goCBYHa0gpyCuIKggriCtIKggnyCmIJogpiCvIJogpiB8IK8gfCCwIK8gryCwIIsgsCCNIIsgmiCvIHMbryCLIHMbjSCwIJkgsCCxIJkgsCB8ILEgfCB6ILEgsSB6ILIgeiB0ILIgmSCxIJIgsSCyIJIgkiCyIJMgsiCzIJMgsiB0ILMgdCByILMgsyByILQgciBwILQgkyCzIJUgsyC0IJUgayC1IGogtSC2IGogtSCVILYglSC0ILYgtiC0IG0gtCBwIG0gaiC2IGwgtiBtIGwgaCC3IGkgtyC4IGkgtyC5ILgguSC6ILgguCC6ILsguiC8ILsgaSC4IGsguCC7IGsgliCUIL0glCC+IL0glCCVIL4glSC1IL4gviC1ILsgtSBrILsgvSC+ILwgviC7ILwgaxuIIL8giCDAIL8giCCJIMAgiSCXIMAgwCCXIMEglyCOIMEgvyDAIMIgwCDBIMIgwiDBIMMgwSDEIMMgwSCOIMQgjiCQIMQgxCCQIMUgkCCWIMUgwyDEIMYgxCDFIMYgVhtqG8cgahvIIMcgahtrG8ggaxu/IMggyCC/IMkgvyDCIMkgxyDIIMogyCDJIMogGRujHMsgoxzMIMsgoxwjG8wgIxshG8wgzCAhG80gIRsiG80gyyDMIM4gzCDNIM4gGhsYG0cbGBvPIEcbGBsZG88gGRvLIM8gzyDLINAgyyDOINAgRxvPIEEbzyDQIEEbIhtRG80gURvRIM0gURtWG9EgVhvHINEg0SDHINIgxyDKINIgzSDRIM4g0SDSIM4gziDSINAg0iDTINAg0iDKINMgyiDUINMg0yDUINUg1CDWINUg0CDTIEEb0yDVIEEbwiDDIMkgwyDXIMkgwyDGINcgxiDYINcg1yDYINQg2CDWINQgySDXIMog1yDUIMogxiDZINgg2SDaINgg2SDbINog2yDcINog2iDcIN0g3CDeIN0g2CDaINYg2iDdINYg1iDdINUg3SDfINUg3SDeIN8g3iDgIN8g3yDgIEIb4CBFG0Ib1SDfIEEb3yBCG0Eb3iDhIOAg4SDiIOAg4SDjIOIg4yDkIOIg4iDkIOUg5CDmIOUg4CDiIEUb4iDlIEUb2yDnINwg5yDoINwg5yDpIOgg6SDqIOgg6CDqIOEg6iDjIOEg3CDoIN4g6CDhIN4gliC9IMUgvSDrIMUgvSC8IOsgvCDsIOsg6yDsINkg7CDbINkgxSDrIMYg6yDZIMYgvCC6IOwguiDtIOwguiC5IO0guSDuIO0g7SDuIOcg7iDpIOcg7CDtINsg7SDnINsguSDvIO4g7yDwIO4g7yCjFfAgoxWhFfAg8CChFfEgoRWgFfEg7iDwIOkg8CDxIOkgRRvlIEYb5SDyIEYb5SDmIPIg5iDzIPIg8iDzIPQg8yD1IPQgRhvyID0b8iD0ID0b9SD2IPQg9iD3IPQg9iBZIPcgWSBXIPcg9yBXID4bVyAJGz4b9CD3ID0b9yA+Gz0bqRWnFfggpxX5IPggpxWmFfkgphViIPkg+SBiIPYgYiBZIPYg+CD5IPUg+SD2IPUg5iD6IPMg+iD7IPMg+iCtFfsgrRWrFfsg+yCrFfggqxWpFfgg8yD7IPUg+yD4IPUg6SDxIOog8SD8IOog8SCgFfwgoBWzFfwg/CCzFf0gsxWxFf0g6iD8IOMg/CD9IOMg4yD9IOQg/SD+IOQg/SCxFf4gsRWvFf4g/iCvFfogrxWtFfog5CD+IOYg/iD6IOYgxRXDFf8gwxUAIf8gwxWjFQAhoxXvIAAhACHvILcg7yC5ILcg/yAAIWggACG3IGggyRXHFQEhxxUCIQEhxxXFFQIhxRX/IAIhAiH/IGUg/yBoIGUgASECIWQgAiFlIGQgAyEEIQUhBCEGIQUhBCEHIQYhByEIIQYhBiEIIQkhCCEKIQkhBSEGIQshBiEJIQshDCENIQ4hDSEPIQ4hDSEQIQ8hECERIQ8hDyERIRIhESETIRIhDiEPIRQhDyESIRQhFCEVIQ4hFSEWIQ4hFSEXIRYhFyEYIRYhFiEYIRkhGCEaIRkhDiEWIQwhFiEZIQwhnh2cHRshnB0cIRshnB2dHRwhnR0dIRwhHCEdIR4hHSEfIR4hGyEcIU8gHCEeIU8gICEhISIhISEjISIhISEkISMhJCElISMhIyElISYhJSEnISYhIiEjIQMhIyEmIQMhMCAyICghMiApISghMiDXHykh1x/VHykhKSHVHyoh1R/WHyohKCEpISshKSEqISshLCEtIS4hLSEvIS4hLSHOHy8hzh/NHy8hLyHNHy0gzR/MHy0gLiEvISwgLyEtICwgyB/KH/0fyh8wIf0fyh/OHzAhzh8tITAhMCEtITEhLSEsITEh/R8wIf8fMCExIf8fKyEqITIhKiEzITIhKiHWHzMh1h80ITMhMyE0ITUhNCE2ITUhMiEzITchMyE1ITchCyE4IQUhOCE5IQUhOCE6ITkhOiE7ITkhOSE7ITwhOyE9ITwhBSE5IQMhOSE8IQMhPiE/IUAhPyFBIUAhPyFCIUEhQiFDIUEhQSFDITUhQyE3ITUhQCFBITYhQSE1ITYhRCFFIUYhRSFHIUYhRSFIIUchSCFJIUchRyFJIT8hSSFCIT8hRiFHIT4hRyE/IT4hSiFLIUwhSyFNIUwhSyFEIU0hRCFGIU0hTSFGIU4hRiE+IU4hTCFNITohTSFOITohOiFOITshTiFPITshTiE+IU8hPiFAIU8hTyFAIVAhQCE2IVAhOyFPIT0hTyFQIT0h1h9RITQhUSFSITQhUSFTIVIhUyFUIVIhUiFUIVAhVCE9IVAhNCFSITYhUiFQITYhVSFWIVchViFYIVchViFZIVghWSFaIVghWCFaIVshWiFcIVshVyFYIVAgWCFbIVAgXCFaIV0hWiFeIV0hWiFZIV4hWSFfIV4hXiFfIeAfXyHeH+AfXSFeIeYfXiHgH+Yf3h9fIesfXyFgIesfXyFZIWAhWSFhIWAhYCFhIdkfYSHcH9kf6x9gIdgfYCHZH9gf0x/QH2Ih0B9jIWIh0B/PH2Mhzx/dH2MhYyHdH2Qh3R/cH2QhYiFjIWUhYyFkIWUh1h/UH1Eh1B9mIVEh1B/TH2Yh0x9iIWYhZiFiIWchYiFlIWchUSFmIVMhZiFnIVMhZSFkIWghZCFpIWghZCHcH2kh3B9hIWkhaSFhIVYhYSFZIVYhaCFpIVUhaSFWIVUhUyFnIWohZyFrIWohZyFlIWshZSFoIWshayFoIWwhaCFVIWwhaiFrISAhayFsISAhPSFUITwhVCFtITwhVCFTIW0hUyFqIW0hbSFqISIhaiEgISIhPCFtIQMhbSEiIQMhJCEhIW4hISFvIW4hISEgIW8hICFsIW8hbyFsIVchbCFVIVchbiFvIVAgbyFXIVAgTyAeIU4gHiFwIU4gHiEfIXAhHyFxIXAhcCFxIW4hcSEkIW4hTiBwIVAgcCFuIVAgHyEdIXIhHSFzIXIhHSGdHXMhnR10IXMhcyF0IRghdCEaIRghciFzIRchcyEYIRchFyF1IXIhdSF2IXIhdSEnIXYhJyElIXYhdiElIXEhJSEkIXEhciF2IR8hdiFxIR8hAyEmIXchJiF4IXchJiEnIXghJyF1IXgheCF1IRUhdSEXIRUhdyF4IRQheCEVIRQhEyF5IRIheSF6IRIheSEHIXohByEEIXoheiEEIXchBCEDIXchEiF6IRQheiF3IRQhCiEIIXshCCF8IXshCCEHIXwhByF5IXwhfCF5IX0heSETIX0heyF8IX4hfCF9IX4hfyGAIYEhgCGCIYEhgCGDIYIhgyGEIYIhgiGEIYUhhCGGIYUhgSGCIYchgiGFIYchCiF7IYgheyGJIYgheyF+IYkhfiGKIYkhiSGKIYshiiGMIYshiCGJIY0hiSGLIY0hEyGOIX0hjiGPIX0hjiGQIY8hkCGRIY8hfSGPIX4hjyGRIX4hkCGSIZMhkiGUIZMhkiGVIZQhlSGWIZQhlCGWIZchliGYIZchkyGUIZkhlCGXIZkhmiGbIZwhmyGdIZwhmyGeIZ0hniGfIZ0hnSGfIaAhnyGhIaAhnCGdIaIhnSGgIaIhoiGgIaMhoCGkIaMhoCGhIaQhoSGlIaQhpCGlIaYhpSGnIaYhoyGkIYMhpCGmIYMhfiGRIYohkSGoIYohkSGQIaghkCGTIaghqCGTIakhkyGZIakhiiGoIYwhqCGpIYwhmiGqIZshqiGrIZshqiGsIashrCGtIashqyGtIa4hrSGvIa4hmyGrIZ4hqyGuIZ4hsCGxIbIhsSGzIbIhsSG0IbMhtCG1IbMhsyG1IbYhtSG3IbYhsiGzIbghsyG2IbghuSG6IbshuiG8IbshuiG9IbwhvSG+IbwhvCG+IbIhviGwIbIhuyG8IbghvCGyIbghvyHAIcEhwCHCIcEhwCFKIcIhSiFMIcIhwiFMITghTCE6ITghwSHCIQshwiE4IQshryGtIcMhrSHEIcMhrSGsIcQhrCHFIcQhxCHFIcYhxSHHIcYhwyHEIcghxCHGIcghvyHBIckhwSHKIckhwSELIcohCyEJIcohyiEJIYghCSEKIYghySHKIY0hyiGIIY0hyyHMIc0hzCHOIc0hzCHPIc4hzyHQIc4hziHQIcYh0CHIIcYhzSHOIcchziHGIcch0SHSIdMh0iHUIdMh0iEgINQhICAiINQh1CEiINUhIiAnINUh0yHUIdYh1CHVIdYh0SHTIdch0yHYIdch0yHWIdgh1iHZIdgh2CHZIbUh2SG3IbUh1yHYIbQh2CG1IbQh2iHbIdwh2yHdIdwh2yHeId0h3iHfId0h3SHfIcwh3yHPIcwh3CHdIcsh3SHMIcsh9B/1H+Ah9R/hIeAh9R/6H+Eh+h/iIeEh4SHiIdsh4iHeIdsh4CHhIdoh4SHbIdoh7B/uHyYg7h/jISYg7h/0H+Mh9B/gIeMh4yHgIeQh4CHaIeQhJiDjIScg4yHkIScgJyDkIdUh5CHlIdUh5CHaIeUh2iHcIeUh5SHcIeYh3CHLIeYh1SHlIdYh5SHmIdYhtyHZIech2SHoIech2SHWIegh1iHmIegh6CHmIc0h5iHLIc0h5yHoIcch6CHNIcchxyHFIechxSHpIechxSGsIekhrCHqIekh6SHqIbYh6iG4IbYh5yHpIbch6SG2IbchrCGqIeohqiHrIeohqiGaIeshmiHsIesh6iHrIbgh6yHsIbghuCHsIbsh7CHtIbsh7CGaIe0hmiGcIe0h7SGcIe4hnCGiIe4huyHtIbkh7SHuIbkhoiGjIe4hoyHvIe4hoyGDIe8hgyGAIe8h7yGAIfAhgCF/IfAh7iHvIbkh7yHwIbkh8SHyIfMh8iH0IfMh8iGYIfQhmCGWIfQh9CGWIfUhliGVIfUh8yH0IfYh9CH1IfYh9iH1Ifch9SH4Ifch9SGVIfghlSH5Ifgh+CH5Ifoh+SH7Ifoh9yH4Ifwh+CH6IfwhlSGSIfkhkiH9IfkhkiGQIf0hkCGOIf0h/SGOIf4hjiETIf4h+SH9Ifsh/SH+IfshEyERIf4hESH/If4hESEQIf8hECEAIv8h/yEAIgEiACICIgEi/iH/Ifsh/yEBIvsh8g8DIvEPAyIEIvEPAyIFIgQiBSIGIgQiBCIGIgciBiIIIgci8Q8EIvMPBCIHIvMPBSIJIgYiCSIKIgYiCSILIgoiCyIMIgoiCiIMIg0iDCIOIg0iBiIKIggiCiINIggiDyIQIhEiECISIhEiECIIIhIiCCINIhIiEiINIhMiDSIOIhMiESISIlYgEiITIlYgDiIMIhQiDCIVIhQiDCILIhUiCyIWIhUiFCIVIhciFSIWIhciFyIYIhQiGCIZIhQiGCJRIBkiUSBTIBkiGSJTIBMiUyBWIBMiFCIZIg4iGSITIg4i6R0aIvsdGiIbIvsdGiIcIhsiHCIdIhsiGyIdIh4iHSIfIh4i+x0bIv0dGyIeIv0dICIhIiIiISIjIiIiISKeHSMinh0bISMiIyIbIU0gGyFPIE0gIiIjIkwgIyJNIEwglh2YHe8dmB0kIu8dmB2eHSQinh0hIiQiJCIhIiUiISIgIiUi7x0kIuYdJCIlIuYd5h0lIucdJSImIucdJSIgIiYiICInIiYiJiInIhoiJyIcIhoi5x0mIukdJiIaIukdICIiIiciIiIoIiciIiJMICgiTCApIigiKCIpIioiKSIrIioiJyIoIhwiKCIqIhwiHCIqIh0iKiIsIh0iKiIrIiwiKyItIiwiLCItIi4iLSIvIi4iHSIsIh8iLCIuIh8iMCIxIjIiMSIzIjIiMSIfIjMiHyIuIjMiMyIuIjQiLiIvIjQiMiIzIhciMyI0IhciSCA1IkkgNSI2IkkgNSI3IjYiNyI4IjYiNiI4IikiOCIrIikiSSA2IkwgNiIpIkwgOSI6IjsiOiI8IjsiOiJIIDwiSCBKIDwiPCJKIFshSiBQIFshOyI8IlwhPCJbIVwhPSI+Ij8iPiJAIj8iPiI5IkAiOSJBIkAiQCJBIlIgQSJGIFIgPyJAIlEgQCJSIFEgRiBBIkcgQSJCIkcgQSI5IkIiOSI7IkIiQiI7Il0hOyJcIV0hRyBCIuYfQiJdIeYfPSJDIj4iQyJEIj4iQyI3IkQiNyI1IkQiRCI1IjoiNSJIIDoiPiJEIjkiRCI6IjkiKyI4Ii0iOCJFIi0iOCI3IkUiNyJDIkUiRSJDIkYiQyI9IkYiLSJFIi8iRSJGIi8iLyJGIjQiRiJHIjQiRiI9IkciPSI/IkciRyI/IhgiPyJRIBgiNCJHIhciRyIYIhciFyIWIjIiFiJIIjIiFiILIkgiCyJJIkgiSCJJIkoiSSJLIkoiMiJIIjAiSCJKIjAiTCJNIk4iTSJPIk4iTSJQIk8iUCJRIk8iTyJRIlIiUSJTIlIiTiJPIk0bTyJSIk0bUyJRIlQiUSJVIlQiUSJQIlUiUCJWIlUiVSJWIkEQViI/EEEQVCJVIkQQVSJBEEQQPxBWIkcQViJXIkcQViJQIlciUCJNIlciVyJNIlgiTSJMIlgiRxBXIkgQVyJYIkgQSyJZIloiWSJbIloiWSJcIlsiXCJdIlsiWyJdIl4iXSJfIl4iWiJbImAiWyJeImAiHyIxIh4iMSJhIh4iMSIwImEiMCJiImEiYSJiImMiYiJkImMiHiJhIv0dYSJjIv0d/R1jIvwdYyJlIvwdYyJkImUiZCJmImUiZSJmIiYbZiIkGyYb/B1lIiwbZSImGywbMCJKImIiSiJnImIiSiJLImciSyJaImciZyJaImgiWiJgImgiYiJnImQiZyJoImQiZCJoImYiaCJpImYiaCJgImkiYCJqImkiaSJqIk8baiJNG08bZiJpIiQbaSJPGyQbYCJeImoiXiJrImoiXiJfImsiXyJsImsiayJsIk4ibCJMIk4iaiJrIk0bayJOIk0bYBBeEG0iXhBuIm0iXhBIEG4iSBBYIm4ibiJYImwiWCJMImwibSJuIl8ibiJsIl8iXCJvIl0ibyJwIl0ibyJjEHAiYxBhEHAicCJhEG0iYRBgEG0iXSJwIl8icCJtIl8iSyJJIlkiSSJxIlkiSSILInEiCyIJInEicSIJInIiCSIFInIiWSJxIlwicSJyIlwiBSIDInIiAyJzInIiAyLyD3Mi8g9nEHMicyJnEG8iZxBjEG8iciJzIlwicyJvIlwibBBqEHQiahB1InQiahDzD3Ui8w8HInUidSIHIhAiByIIIhAidCJ1Ig8idSIQIg8icRBvEHYibxB3InYibxBsEHcibBB0IncidyJ0IngidCIPIngidiJ3InkidyJ4InkieSJ4InoieCJ7InoieCIPInsiDyIRInsieyIRInwiESJWIHwieiJ7In0ieyJ8In0ifSJ+In8ifiKAIn8ifiI6IIAiOiA8IIAigCI8IIEiPCA/IIEifyKAIoIigCKBIoIiViBVIHwiVSCDInwiVSBAIIMiQCBCIIMigyJCIH4iQiA6IH4ifCKDIn0igyJ+In0ihCKFIoYihSKHIoYihSJ/IYcifyGBIYcihyKBIYgigSGHIYgihiKHIokihyKIIokiuSHwIboh8CGKIroh8CF/IYoifyGFIooiiiKFIosihSKEIosiuiGKIr0hiiKLIr0heSJ6IowieiKNIowieiJ9Io0ifSJ/Io0ijSJ/Io4ifyKCIo4ijCKNIo8ijSKOIo8icRB2IosQdiKQIosQdiJ5IpAieSKMIpAikCKMIpEijCKPIpEiixCQIowQkCKRIowQkhCSIpEQkiKTIpEQkiKUIpMilCKVIpMikyKVIlkdlSJbHVkdkRCTIiwLkyJZHSwLlCKWIpUiliKXIpUiliJ3IJcidyB4IJcilyJ4IKkgeCB9IKkglSKXIlsdlyKpIFsdnhucG5ginBuZIpginBubG5kimxt2IJkimSJ2IJYidiB3IJYimCKZIpQimSKWIpQimhCaIpkQmiKbIpkQmiKeG5sinhuYIpsimyKYIpIimCKUIpIimRCbIpIQmyKSIpIQnhuaIp0bmiKcIp0bmiKaEJwimhCcEJwinCKcEJ0inBCbEJ0inRucIp8bnCKdIp8bniKfIqAinyKhIqAinyKiIqEioiKjIqEioSKjIqEQoyKfEKEQoCKhIqcQoSKhEKcQmxCqEJ0iqhCkIp0iqhCfEKQinxCjIqQipCKjIqUioyKiIqUinSKkIp8bpCKlIp8bvRWmIuwVpiKnIuwVpiKoIqciqCKpIqcipyKpIqoiqSKrIqoi7BWnIugVpyKqIugVrCKtIq4irSKvIq4irSKwIq8isCKxIq8iryKxIpkbsSKXG5kbriKvIp8bryKZG58bsCKyIrEisiKzIrEisiJkILMiZCBmILMisyJmIG4gZiBsIG4gsSKzIpcbsyJuIJcbwBXLFbQiyxW1IrQiyxXJFbUiyRUBIbUitSIBIbIiASFkILIitCK1IrAitSKyIrAiuhXBFbYiwRW3IrYiwRXAFbciwBW0IrcityK0Iq0itCKwIq0itiK3IqwityKtIqwivRW7FaYiuxW4IqYiuxW6FbgiuhW2IrgiuCK2IrkitiKsIrkipiK4IqgiuCK5IqgioiK6IqUiuiK7IqUiuiKoIrsiqCK5IrsiuyK5Iq4iuSKsIq4ipSK7Ip8buyKuIp8bqCK6IqkiuiK8IqkiuiKiIrwioiKfIrwivCKfIr0inyKeIr0iqSK8IqsivCK9IqsiqyK9Ir4ivSK/Ir4ivSKeIr8iniLAIr8ivyLAIsEiwCLCIsEiviK/IsMivyLBIsMixCLFIsYixSLHIsYixSLNEMcizRDKEMcixyLKEMgiyhDJEMgixiLHIskixyLIIskiwiLKIssiyiLMIssiyiLUEMwi1BDSEMwizCLSEMUi0hDNEMUiyyLMIsQizCLFIsQizSLOIs8iziLQIs8iziLEItAixCLGItAi0CLGItEixiLJItEizyLQItIi0CLRItIiwyLTItQi0yLVItQi0yLNItUizSLWItUi1SLWItci1iLYItci1CLVItAV1SLXItAV6BWqIukVqiLZIukVqiKrItkiqyK+Itki2SK+ItQiviLDItQi6RXZItAV2SLUItAV2CLaItci2iLbItci2iLcItsi3CLdItsi2yLdItEV3SLTFdEV1yLbItAV2yLRFdAV3iLfIuAi3yLhIuAi3yLcIuEi3CLaIuEi4SLaIuIi2iLYIuIi4CLhIuMi4SLiIuMi5CLlIuYi5SLnIuYi5SLeIuci3iLoIuci5yLoIpId6CKQHZId5iLnIlYS5yKSHVYS6SLqIusi6iLsIusi6iLZFewi2RXXFewi7CLXFd0i1xXTFd0i6yLsItwi7CLdItwiYSBgIO0iYCDuIu0iYCDfFe4i3xXjFe4i7iLjFeoi4xXZFeoi7SLuIuki7iLqIukiYh/vImcf7yLwImcf7yLxIvAi8SLyIvAi8CLyIuYi8iLkIuYiZx/wIlYS8CLmIlYSDRtbIPMiWyD0IvMiWyBcIPQiXCBeIPQi9CJeIPUiXiBhIPUi8yL0IvEi9CL1IvEiEBsOG2AfDhv2ImAfDhsNG/YiDRvzIvYi9iLzIu8i8yLxIu8iYB/2ImIf9iLvImIf8SL1IvIi9SL3IvIi9SJhIPciYSDtIvci9yLtIvgi7SLpIvgi8iL3IuQi9yL4IuQi5CL4IuUi+CL5IuUi+CLpIvki6SLrIvki+SLrIt8i6yLcIt8i5SL5It4i+SLfIt4i+iL7Ivwi+yL9Ivwi+yLJIv0iySLIIv0i/SLIIgQRyCLJEAQR/CL9IgkR/SIEEQkR/iL/IgAj/yIBIwAj/yLSIgEj0iLRIgEjASPRIvsi0SLJIvsiACMBI/oiASP7Ivoi+iL8IgIj/CIDIwIj/CIJEQMjCREOEQMjAyMOEcodDhGxC8odAiMDI8kdAyPKHckdBCMFIwYjBSMHIwYjBSP+Igcj/iIAIwcjByMAIwIjACP6IgIjBiMHI8kdByMCI8kdlB2RHQgjkR0JIwgjkR2QHQkjkB0KIwkjCSMKIwsjCiMMIwsjCCMJIw0jCSMLIw0jph1CH6UdQh8OI6UdQh+UHQ4jlB0IIw4jDiMIIw8jCCMNIw8jpR0OI6cdDiMPI6cdvR0QI8AdECMRI8AdECMSIxEjEiMTIxEjESMTI88dEyPOHc8dwB0RI8IdESPPHcIdEiMUIxMjFCMVIxMjFCMEIxUjBCMGIxUjFSMGI8sdBiPJHcsdEyMVI84dFSPLHc4dnx2hHbsdoR0WI7sdoR2nHRYjpx0XIxYjFiMXIxAjFyMSIxAjux0WI70dFiMQI70dpx0PIxcjDyMYIxcjDyMNIxgjDSMZIxgjGCMZIxQjGSMEIxQjFyMYIxIjGCMUIxIjDSMLIxkjCyMaIxkjCyMMIxojDCMbIxojGiMbIwUjGyP+IgUjGSMaIwQjGiMFIwQjkB3oIgoj6CIcIwoj6CLeIhwj3iLgIhwjHCPgIh0j4CLjIh0jCiMcIwwjHCMdIwwjDCMdIxsjHSMeIxsjHSPjIh4j4yIfIx4jHiMfI/8iHyPSIv8iGyMeI/4iHiP/Iv4i4yLiIh8j4iIgIx8j4iLYIiAj2CLWIiAjICPWIs8i1iLNIs8iHyMgI9IiICPPItIiwyLBItMiwSIhI9MiwSLCIiEjwiLLIiEjISPLIs4iyyLEIs4i0yIhI80iISPOIs0iniKgIsAioCIiI8AioCKnECIjpxAvESIjIiMvEcoiLxHUEMoiwCIiI8IiIiPKIsIirhy5HCMjuRwkIyMjuRy4HCQjuBwlIyQjJCMlIyYjJSMnIyYjIyMkIzYRJCMmIzYRbgqvHDgRrxwoIzgRrxyuHCgjrhwjIygjOBEoIzYRKCMjIzYRUyJUIikjVCIqIykjVCJEECojRBA6ESojKiM6ESsjOhE5ESsjKSMqIywjKiMrIywjTRtSIk4bUiItI04bUiJTIi0jUyIpIy0jLSMpIy4jKSMsIy4jThstI0sbLSMuI0sbLCMvIy4jLyMwIy4jLyO8HDAjvBy+HDAjMCO+HEwbvhwtG0wbLiMwI0sbMCNMG0sbLCMxIy8jMSMyIy8jMSMnIzIjJyMlIzIjMiMlI8YcJSO4HMYcLyMyI7wcMiPGHLwcNhEmI0YRJiMzI0YRJiMnIzMjJyMxIzMjMyMxIysjMSMsIysjRhEzIzkRMyMrIzkRNCM1IzYjNSM3IzYjNSM4IzcjOCM5IzcjNyM5IzojOSM7IzojNiM3IzwjNyM6Izwjxh89I8cfPSM+I8cfPSM/Iz4jPyNAIz4jPiNAI0EjQCNCI0Ejxx8+I7oePiNBI7oeuh5BI7seQSNDI7seQSNCI0MjQiNEI0MjQyNEI7keRCMDHrkeux5DI7geQyO5HrgeQiNFI0QjRSNGI0QjRSNHI0YjRyNII0YjRiNIIwQeSCPwHQQeRCNGIwMeRiMEHgMePyNJI0AjSSNKI0AjSSM8I0ojPCNLI0ojSiNLI0UjSyNHI0UjQCNKI0IjSiNFI0IjTCNNI04jTSNPI04jTSOaHU8jmh2XHU8jTyOXHewdlx2WHewdTiNPI+sdTyPsHesdnR2bHXQhmx1QI3Qhmx2aHVAjmh1NI1AjUCNNI1EjTSNMI1EjdCFQIxohUCNRIxohDCEZIVIjGSFTI1IjGSEaIVMjGiFRI1MjUyNRI1QjUSNMI1QjUiNTIzsjUyNUIzsjTCNOI1UjTiNWI1UjTiPrHVYj6x3xHVYjViPxHUgj8R3wHUgjVSNWI0cjViNII0cjRyNLI1UjSyNXI1UjSyM8I1cjPCM6I1cjVyM6I1QjOiM7I1QjVSNXI0wjVyNUI0wjuR9YI70fWCNZI70fWCNaI1kjWiNbI1kjWSNbI8QfWyPGH8QfvR9ZI78fWSPEH78fWiNcI1sjXCNdI1sjXCNeI10jXiNfI10jXSNfIz0jXyM/Iz0jWyNdI8YfXSM9I8Yfth9gI7cfYCNhI7cfYCNiI2EjYiNjI2EjYSNjI1gjYyNaI1gjtx9hI7kfYSNYI7kfZCNlI2YjZSNnI2YjZSNoI2cjaCNpI2cjZyNpI2ojaSM0I2ojZiNnI14jZyNqI14jYiNrI2MjayNsI2MjayNkI2wjZCNmI2wjbCNmI1wjZiNeI1wjYyNsI1ojbCNcI1ojXiNqI18jaiNtI18jaiM0I20jNCM2I20jbSM2I0kjNiM8I0kjXyNtIz8jbSNJIz8jAiIAIm4jACJvI24jACIQIW8jECENIW8jbyMNIXAjDSEMIXAjbiNvI3EjbyNwI3EjciNzI3QjcyN1I3QjcyN2I3UjdiN3I3UjdSN3I3gjdyNxI3gjdCN1IzgjdSN4IzgjOyM5I1IjOSN5I1IjOSM4I3kjOCN4I3kjeSN4I3AjeCNxI3AjUiN5IwwheSNwIwwh+yEBIvohASJ6I/ohASICInojAiJ7I3ojeiN7I3wjeyN9I3wj+iF6I/wheiN8I/whfSN7I34jeyN/I34jeyMCIn8jAiJuI38jfyNuI3cjbiNxI3cjfiN/I3YjfyN3I3YjaCOAI2kjgCOBI2kjgCNyI4EjciN0I4EjgSN0IzUjdCM4IzUjaSOBIzQjgSM1IzQjgiODI4QjgyOFI4QjgyOGI4UjhiOHI4UjhSOHI4gjhyOJI4gjhCOFI4ojhSOII4ojiyOMI40jjCOOI40jjCOPI44jjyOQI44jjiOQI5EjkCOSI5EjjSOOI5MjjiORI5MjlCOVI5YjlSOXI5YjlSOYI5cjmCOZI5cjlyOZI5ojmSObI5ojliOXI5wjlyOaI5wjjyOdI5AjnSOeI5AjnSOYI54jmCOVI54jniOVI58jlSOUI58jkCOeI5IjniOfI5IjoCOhI6IjoSOjI6IjoSOGI6MjhiODI6MjoyODI6QjgyOCI6QjoiOjI6UjoyOkI6UjnCOaI6YjmiOnI6YjmiObI6cjmyOoI6cjpyOoI6IjqCOgI6IjpiOnI6UjpyOiI6UjiiOII6kjiCOqI6kjiCOJI6ojiSOrI6ojqiOrI6wjqyOtI6wjqSOqI64jqiOsI64jriOsI68jrCOwI68jrCOtI7AjrSOxI7AjsCOxI7IjsSOzI7IjryOwI7QjsCOyI7QjsyO1I7IjtSO2I7IjtSOLI7YjiyONI7YjtiONI7cjjSOTI7cjsiO2I7QjtiO3I7QjkiOfI5EjnyO4I5EjnyOUI7gjlCOWI7gjuCOWI7kjliOcI7kjkSO4I5MjuCO5I5MjnCOmI7kjpiO6I7kjpiOlI7ojpSO7I7ojuiO7I7cjuyO0I7cjuSO6I5MjuiO3I5MjpSO8I7sjvCO9I7sjvCOKI70jiiOpI70jvSOpI68jqSOuI68juyO9I7QjvSOvI7QjgiOEI6QjhCO+I6QjhCOKI74jiiO8I74jpCO+I6UjviO8I6UjvyPAI8EjwCPCI8EjwCPDI8IjwyPEI8IjwiPEI6EjxCOGI6EjwSPCI6AjwiOhI6AjhxuUG8UjlBvGI8UjlBuTG8YjkxvHI8YjxiPHI8AjxyPDI8AjxSPGI78jxiPAI78jwyPII8QjyCPJI8QjyCPKI8kjyiPLI8kjySPLI4cjyyOJI4cjxCPJI4YjySOHI4Yjkxu9G8cjvRvMI8cjvRuyG8wjshvNI8wjzCPNI8gjzSPKI8gjxyPMI8MjzCPII8MjyiPOI8sjziPPI8sjziPQI88j0CPRI88jzyPRI6sj0SOtI6sjyyPPI4kjzyOrI4kjshu0G80jtBvSI80jtBu6G9IjuhvTI9Ij0iPTI84j0yPQI84jzSPSI8oj0iPOI8oj0CPUI9Ej1CPVI9Ej1CPWI9Uj1iPXI9Uj1SPXI7Ej1yOzI7Ej0SPVI60j1SOxI60juhsxHdMjMR3YI9MjMR0yHdgjMh3ZI9gj2CPZI9Qj2SPWI9Qj0yPYI9Aj2CPUI9Aj1iPaI9cj2iPbI9cj2iPcI9sj3CPdI9sj2yPdI7Uj3SOLI7Uj1yPbI7Mj2yO1I7MjMh0zHdkjMx3eI9kjMx2xG94jsRvfI94j3iPfI9oj3yPcI9oj2SPeI9Yj3iPaI9Yj3CPgI90j4CPhI90j4CPiI+Ej4iPjI+Ej4SPjI4wj4yOPI4wj3SPhI4sj4SOMI4sjsRs8Hd8jPB3kI98jPB3RG+Qj0RvlI+Qj5CPlI+Aj5SPiI+Aj3yPkI9wj5CPgI9wj4iPmI+Mj5iPnI+Mj5iPoI+cj6CPpI+cj5yPpI50j6SOYI50j4yPnI48j5yOdI48j0RvPG+UjzxvqI+UjzxvCG+ojwhvrI+oj6iPrI+Yj6yPoI+Yj5SPqI+Ij6iPmI+Ij6CPsI+kj7CPtI+kj7CPuI+0j7iPvI+0j7SPvI5kj7yObI5kj6SPtI5gj7SOZI5gjwhvAG+sjwBvwI+sjwBuKG/AjihvxI/Aj8CPxI+wj8SPuI+wj6yPwI+gj8CPsI+gj7iPyI+8j8iPzI+8j8iO/I/MjvyPBI/Mj8yPBI6gjwSOgI6gj7yPzI5sj8yOoI5sjihuIG/EjiBv0I/EjiBuHG/QjhxvFI/Qj9CPFI/IjxSO/I/Ij8SP0I+4j9CPyI+4jjh6NHvUjjR72I/UjjR5MHvYjTB5LHvYj9iNLHvcjSx5FHvcj9SP2I5Qe9iP3I5QelB6SHvUjkh74I/Ujkh6THvgjkx6XHvgj+COXHqcelx6HHqce9SP4I44e+COnHo4e1BmPHgUbjx75IwUbjx6UHvkjlB76I/kj+SP6I94d+iPRHd4dBRv5Iwcb+SPeHQcb0R36I9Id+iP7I9Id+iOUHvsjlB73I/sj+yP3I/wj9yNFHvwj0h37I9Ud+yP8I9UdRR5HHvwjRx79I/wjRx43Hv0jNx4/Hv0j/CP9I9Ud/SM/HtUdGh/+I0Uf/iP/I0Uf/iMAJP8jACQBJP8j/yMBJGESASRfEmESRR//I10S/yNhEl0SACQCJAEkAiQDJAEkAiQWHwMkFh8/HwMkAyQ/H2cSPx9lEmcSASQDJF8SAyRnEl8Syh4XH90eFx8EJN0eFx8WHwQkFh8CJAQkBCQCJAUkAiQAJAUk3R4EJNoeBCQFJNoe2h4FJNkeBSQGJNkeBSQAJAYkACT+IwYkBiT+Ixwf/iMaHxwf2R4GJNseBiQcH9seFh8YHzwfGB8HJDwfGB8VHwckFR8rHwckPB8HJDEfByQrHzEfpyEIJKYhCCQJJKYhCCQKJAkkCiQLJAkkCSQLJIQhCySGIYQhpiEJJIMhCSSEIYMhDCQNJA4kDSQPJA4kDSRqHQ8kah14HQ8kDyR4HR8SeB1SCx8SDiQPJCQSDyQfEiQSYx1lHRAkZR0RJBAkZR1qHREkah0NJBEkESQNJBIkDSQMJBIkECQRJBMkESQSJBMkfR1+HRQkfh0VJBQkfh1jHRUkYx0QJBUkFSQQJBYkECQTJBYkFCQVJBckFSQWJBckGCQZJBokGSQbJBokGSRlGxskZRt6HRskGyR6HRQkeh19HRQkGiQbJBckGyQUJBckHCQdJB4kHSQfJB4kHSReGx8kXhtgGx8kHyRgGxkkYBtlGxkkHiQfJBgkHyQZJBgkICQhJCIkISQjJCIkISRfGyMkXxtdGyMkIyRdGx0kXRteGx0kIiQjJBwkIyQdJBwkJCQlJCYkJSQnJCYkJSSNHCckjRyMHCckJySMHCEkjBxfGyEkJiQnJCAkJyQhJCAkKCQpJCokKSQrJCokKSSEHCskhByOHCskKySOHCUkjhyNHCUkKiQrJCQkKyQlJCQkgByFHCwkhRwtJCwkhRyEHC0khBwpJC0kLSQpJC4kKSQoJC4kLCQtJC8kLSQuJC8kMCQxJDIkMSQzJDIkMSTmGzMk5ht/HDMkMyR/HCwkfxyAHCwkMiQzJC8kMyQsJC8kNCQ1JDYkNSQ3JDYkNSTnGzck5xvlGzckNyTlGzEk5RvmGzEkNiQ3JDAkNyQxJDAkngnqG08S6hs4JE8S6hvnGzgk5xs1JDgkOCQ1JDkkNSQ0JDkkTxI4JFASOCQ5JFAScRhvGDYfbxg6JDYfbxgmGDokJhgkGDokOiQkGDskJBhrEjskNh86JDgfOiQ7JDgfZRI8JHQSPCQ9JHQSPCQ4Hz0kOB87JD0kdBI9JGsSPSQ7JGsSOB88JDofPCQ+JDofPCRlEj4kZRI+Hz4kOh8+JDAfPiQ+HzAf";

/* La Testa 3D del Segretario: una testa low-poly (stile PS2) costruita per via parametrica, senza modelli esterni
   e senza librerie, disegnata con un piccolo renderer WebGL tutto nostro.

   Esce su un canvas trasparente nei "canali" che la scena già usa: rosso = linee del wireframe (solo quelle a vista,
   le nascoste le toglie il depth test), verde = luce sulla pelle (flat shading, a facce), blu = silhouette (copre
   griglia e cielo). La scena lo incolla sopra il pavimento e lo colora secondo il tono.

   Muove tutto: gira la testa, annuisce, inclina, respira, sbatte le palpebre, apre la mascella e le labbra sulle
   sillabe, si sporge quando ascolta, guarda in alto quando pensa, abbassa la testa quando dorme.

   API: Testa.dimensiona(W, H, F, CX, CY, CAM) · Testa.render(t, P) con P = {ascolto, penso, parlo, dorme, lev, bocca,
   occhi, colpo, lift} · Testa.canvas */
(() => {
"use strict";
const SEG_A = 44, SEG_V = 32;                 // segmenti attorno e dall'alto in basso: la densità della maglia
const RX = 0.78, RY = 0.94, RZ = 0.92;         // il cranio: largo, alto, profondo (unità: testa)
const COLLO = { r0: 0.40, r1: 0.50, y0: -0.74, y1: -1.75, seg: 10 };
const canvas = document.createElement("canvas");
const gl = canvas.getContext("webgl", { alpha: true, antialias: true, depth: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
let W = 0, H = 0, F = 1, CX = 0, CY = 0, CAM = { y: -3.2, z: 1.45, pitch: 0.22 };
const POS = window.VoceMesh ? { x: 0, y: 1.25, z: 1.42, scala: 1.6 } : { x: 0, y: 1.25, z: 1.72, scala: 1.28 };
const VESTE = false;  // niente colletto: la testa fluttua da sola, tagliata al collo   // dove sta la testa nel mondo della scena (x, profondità, altezza) e quanto è grande

// ------------------------------------------------------------------ la forma
const G = (u, v, cu, cv, su, sv, a) => { const x = (u - cu) / su, y = (v - cv) / sv; return a * Math.exp(-x * x - y * y); };
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* Il rilievo del viso in coordinate (u largo, v alto), da aggiungere lungo la normale del cranio. */
function viso(u, v, A) {
  const j = A.bocca, o = A.occhi, bl = A.blink;
  let h = 0;
  h += G(u, v, 0, 0.62, 0.55, 0.35, 0.05);                         // fronte
  for (const s of [-1, 1]) {
    h += G(u, v, s * 0.36, 0.30, 0.24, 0.06, 0.09);                // arcata
    h += G(u, v, s * 0.36, 0.12, 0.17, 0.10, -0.15);               // orbita
    h += G(u, v, s * 0.36, 0.11, 0.14, 0.08, (0.12 + 0.03 * o) * (1 - 0.6 * bl)); // globo oculare (si appiattisce al battito)
    h += G(u, v, s * 0.36, 0.15, 0.12, 0.02, -0.05 * o * (1 - bl)); // la fessura
    h += G(u, v, s * 0.14, -0.33, 0.08, 0.07, 0.11);               // ali del naso
    h += G(u, v, s * 0.52, -0.12, 0.22, 0.2, 0.08);                // zigomi
    h += G(u, v, s * 0.72, 0.28, 0.14, 0.26, -0.06);               // tempie
    h += G(u, v, s * 0.26, -0.58 - 0.04 * j, 0.07, 0.05, -0.03);   // angoli della bocca
  }
  h += G(u, v, 0, 0.0, 0.075, 0.32, 0.26);                         // dorso del naso
  h += G(u, v, 0, -0.30, 0.13, 0.11, 0.38);                        // punta
  h += G(u, v, 0, -0.44, 0.05, 0.05, -0.04);                       // filtro
  h += G(u, v, 0, -0.50, 0.21, 0.05, 0.09);                        // labbro sopra
  h += G(u, v, 0, -0.575 - 0.05 * j, 0.20, 0.02 + 0.07 * j, -0.07 - 0.22 * j); // la bocca che si apre
  h += G(u, v, 0, -0.66 - 0.10 * j, 0.18, 0.06, 0.09);             // labbro sotto
  h += G(u, v, 0, -0.95 - 0.10 * j, 0.24, 0.14, 0.12);             // mento
  return h;
}

/* Un punto del cranio per (s attorno, t dall'alto) con il viso applicato. Coordinate locali: x destra, y su, z verso la camera. */
function punto(s, t, A, out) {
  const th = s * Math.PI * 2, ph = t * Math.PI;
  const sx = Math.sin(ph) * Math.sin(th), sy = Math.cos(ph), sz = Math.sin(ph) * Math.cos(th);
  // cranio: ellissoide; la mandibola si stringe verso il mento, la nuca è un po' piatta
  const v0 = sy;
  const stretta = (1 - 0.30 * sm(-0.2, -1.0, v0)) * (1 - 0.06 * sm(0.55, 1.0, v0));
  let x = RX * sx * stretta, y = RY * sy, z = RZ * sz * (sz < 0 ? 0.92 : 1);
  // il viso: solo davanti, sfuma ai lati
  const front = sm(-0.1, 0.55, sz);
  const u = x / 0.74, vv = (y - 0.02) / 0.95;
  const h = front * viso(u, vv, A) * 0.72;
  // normale approssimata dell'ellissoide
  let nx = sx / RX, ny = sy / RY, nz = sz / RZ; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
  x += nx * h; y += ny * h; z += nz * h;
  // la mascella scende quando parla
  y -= A.bocca * 0.11 * sm(-0.45, -0.95, vv) * (0.4 + 0.6 * front);
  out[0] = x; out[1] = y; out[2] = z;
}

// Vertici del reticolo (cranio + collo), ricostruiti a ogni fotogramma della testa (14 al secondo: è poco lavoro).
const NV = (SEG_A + 1) * (SEG_V + 1);
const grid = new Float32Array(NV * 3);
const NC = (SEG_A + 1) * (COLLO.seg + 1);
const collo = new Float32Array(NC * 3);
function costruisci(A) {
  const p = [0, 0, 0];
  for (let j = 0; j <= SEG_V; j++) for (let i = 0; i <= SEG_A; i++) {
    punto(i / SEG_A, j / SEG_V, A, p);
    const k = (j * (SEG_A + 1) + i) * 3; grid[k] = p[0]; grid[k + 1] = p[1]; grid[k + 2] = p[2];
  }
  for (let j = 0; j <= COLLO.seg; j++) {
    const t = j / COLLO.seg, y = COLLO.y0 + (COLLO.y1 - COLLO.y0) * t, r = COLLO.r0 + (COLLO.r1 - COLLO.r0) * t * t;
    for (let i = 0; i <= SEG_A; i++) {
      const th = (i / SEG_A) * Math.PI * 2, k = (j * (SEG_A + 1) + i) * 3;
      collo[k] = Math.sin(th) * r * (1 + 0.08 * Math.cos(th)); collo[k + 1] = y; collo[k + 2] = Math.cos(th) * r * 0.9 - 0.1;
    }
  }
}

// ------------------------------------------------------------------ la testa scansionata (voce_mesh.js), se c'è
// Un volto vero: posizioni a 16 bit + triangoli. Niente rig: bocca, mascella e palpebre si muovono spostando i
// vertici vicini ai punti di riferimento (naso, bocca, occhi) con pesi morbidi, ricalcolati a ogni fotogramma.
const MESH = (() => {
  const m = window.VoceMesh; if (!m) return null;
  const b64 = (str) => { const bin = atob(str); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out.buffer; };
  const q = new Int16Array(b64(m.pos)), idx = new Uint16Array(b64(m.idx));
  const base = new Float32Array(q.length); for (let i = 0; i < q.length; i++) base[i] = q[i] / m.q;
  const n = base.length / 3;
  // spigoli del reticolo. La scansione è a triangoli: per leggerla come una maglia a quadrilateri (Kraftwerk) saltiamo
  // la diagonale, cioè lo spigolo più lungo di ogni triangolo, ma solo se è il più lungo per TUTTI i triangoli che lo usano
  const QUAD_WIRE = true;
  const lung2 = (a, b) => { const p = a * 3, r = b * 3; return (base[p] - base[r]) ** 2 + (base[p + 1] - base[r + 1]) ** 2 + (base[p + 2] - base[r + 2]) ** 2; };
  const tieni = new Map();  // chiave spigolo -> true se almeno un triangolo lo vuole come lato
  for (let t = 0; t < idx.length; t += 3) {
    let lmax = -1, emax = 0;
    for (let e = 0; e < 3; e++) { const l = lung2(idx[t + e], idx[t + (e + 1) % 3]); if (l > lmax) { lmax = l; emax = e; } }
    for (let e = 0; e < 3; e++) { const a = idx[t + e], b = idx[t + (e + 1) % 3]; const k = a < b ? a * 65536 + b : b * 65536 + a; const lato = !QUAD_WIRE || e !== emax; tieni.set(k, (tieni.get(k) || false) || lato); }
  }
  const edges = []; for (const [k, ok] of tieni) if (ok) edges.push(Math.floor(k / 65536), k % 65536);
  // normali per vertice (fisse, dalla posa base: servono solo a sfumare le linee di taglio, le deformazioni sono piccole)
  const vn = new Float32Array(n * 3);
  for (let t = 0; t < idx.length; t += 3) {
    const p = idx[t] * 3, q2 = idx[t + 1] * 3, r = idx[t + 2] * 3;
    const ux = base[q2] - base[p], uy = base[q2 + 1] - base[p + 1], uz = base[q2 + 2] - base[p + 2], vx = base[r] - base[p], vy = base[r + 1] - base[p + 1], vz = base[r + 2] - base[p + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;  // pesata per l'area
    for (const k of [p, q2, r]) { vn[k] += nx; vn[k + 1] += ny; vn[k + 2] += nz; }
  }
  for (let i = 0; i < n; i++) { const k = i * 3, l = Math.hypot(vn[k], vn[k + 1], vn[k + 2]) || 1; vn[k] /= l; vn[k + 1] /= l; vn[k + 2] /= l; }
  // dove la scansione è fitta (bulbi, narici, labbra) le linee si ammassano e brillano: le smorziamo in proporzione alla
  // maglia locale. Il fattore viaggia nella lunghezza della normale (lo shader la legge con length())
  const somma = new Float32Array(n), conta = new Uint16Array(n);
  for (let e = 0; e < edges.length; e += 2) { const a = edges[e], b = edges[e + 1], l = Math.sqrt(lung2(a, b)); somma[a] += l; conta[a]++; somma[b] += l; conta[b]++; }
  const media = new Float32Array(n); for (let i = 0; i < n; i++) media[i] = conta[i] ? somma[i] / conta[i] : 0;
  const ord = Array.from(media).filter((v) => v > 0).sort((a, b) => a - b), mediana = ord[ord.length >> 1] || 1;
  for (let i = 0; i < n; i++) { const d = Math.min(1, Math.max(0.3, Math.pow(media[i] / mediana, 0.8))); const k = i * 3; vn[k] *= d; vn[k + 1] *= d; vn[k + 2] *= d; }
  // i bulbi oculari sono pezzi a sé (cornea, sclera, iride): li troviamo per connessione, vicino a dove ci aspettiamo gli occhi
  const naso = m.naso, bocca = [naso[0], naso[1] - 0.205, naso[2] - 0.12];  // linea delle labbra misurata sul profilo mediano
  const par = new Int32Array(n); for (let i = 0; i < n; i++) par[i] = i;
  const trova = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
  for (let t = 0; t < idx.length; t += 3) { const a = trova(idx[t]); par[trova(idx[t + 1])] = a; par[trova(idx[t + 2])] = a; }
  const comp = new Map(); for (let i = 0; i < n; i++) { const r = trova(i); if (!comp.has(r)) comp.set(r, []); comp.get(r).push(i); }
  const occhi = [];     // per lato: { c: centro del bulbo, lid: centro dell'apertura delle palpebre, v: vertici del bulbo }
  for (const s of [-1, 1]) {
    const ax = naso[0] + s * 0.165, ay = naso[1] + 0.15, v = [];
    for (const vs of comp.values()) {
      if (vs.length < 40 || vs.length > 260) continue;
      let cx = 0, cy = 0, cz = 0; for (const i of vs) { cx += base[i * 3]; cy += base[i * 3 + 1]; cz += base[i * 3 + 2]; } cx /= vs.length; cy /= vs.length; cz /= vs.length;
      if (Math.hypot(cx - ax, cy - ay) < 0.10 && cz > 0.2) v.push(...vs);
    }
    let cx = 0, cy = 0, cz = 0; for (const i of v) { cx += base[i * 3]; cy += base[i * 3 + 1]; cz += base[i * 3 + 2]; }
    if (v.length) { cx /= v.length; cy /= v.length; cz /= v.length; } else { cx = ax; cy = ay; cz = naso[2] - 0.27; }
    occhi.push({ c: [cx, cy, cz], lid: [cx, cy + 0.015, cz], v: Int32Array.from(v) });
  }
  const bulbo = new Uint8Array(n); for (const o of occhi) for (const i of o.v) bulbo[i] = 1;
  // pesi per vertice (una volta sola)
  const wJaw = new Float32Array(n), wLipU = new Float32Array(n), wLipD = new Float32Array(n), wLid = new Float32Array(n), lidY = new Float32Array(n), lidUp = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
    const front = sm(-0.35, 0.25, z);
    // mandibola: dal labbro inferiore al mento (y da +0.02 a -0.21), davanti, sfuma verso le orecchie e verso la gola
    const my = bocca[1];
    wJaw[i] = sm(my - 0.01, my - 0.09, y) * sm(my - 0.33, my - 0.24, y) * (0.2 + 0.8 * front) * sm(0.62, 0.28, Math.abs(x));
    // labbra: due fasce strette intorno alla linea della bocca, larghe quanto la bocca
    const dx = x - bocca[0], dyU = y - bocca[1];
    const larg = Math.exp(-((dx / 0.20) ** 2)) * front;
    wLipU[i] = larg * Math.exp(-(((dyU - 0.032) / 0.028) ** 2));
    wLipD[i] = larg * Math.exp(-(((dyU + 0.032) / 0.032) ** 2));
    // palpebre: la pelle attorno all'apertura dell'occhio (non il bulbo). Peso pieno sul bordo, sfuma verso sopracciglio e zigomo
    if (!bulbo[i] && z > 0.15) for (const o of occhi) {
      const [ex, ey] = o.lid, de = Math.hypot(x - ex, (y - ey) * 0.85);
      const w = 1 - sm(0.075, 0.15, de);
      if (w > wLid[i]) { wLid[i] = w; lidY[i] = ey - 0.02; lidUp[i] = y > ey - 0.012 ? 1 : 0; }   // le palpebre si incontrano poco sotto il centro
    }
  }
  return { base, idx, edges: new Uint16Array(edges), vn, n, tris: idx.length / 3, wJaw, wLipU, wLipD, wLid, lidY, lidUp, occhi, cur: new Float32Array(base.length), bocca, naso };
})();

// Triangoli (non indicizzati, con normale di faccia: lo shading piatto da PS2) e segmenti di linea (le maglie del reticolo).
const NT = MESH ? MESH.tris : (SEG_A * SEG_V + SEG_A * COLLO.seg) * 2;
const tri = new Float32Array(NT * 9), nrm = new Float32Array(NT * 9);
// Con la scansione le linee sono indicizzate (spigoli fissi sui vertici correnti): niente da ricostruire a ogni fotogramma
const NL = MESH ? MESH.edges.length / 2 : (SEG_A * (SEG_V + 1) + (SEG_A + 1) * SEG_V) + (SEG_A * (COLLO.seg + 1) + (SEG_A + 1) * COLLO.seg);
const lin = MESH ? null : new Float32Array(NL * 6);

function costruisciMesh(A) {
  const { base, cur, n, wJaw, wLipU, wLipD, wLid, lidY, lidUp, occhi } = MESH;
  const j = A.bocca, bl = A.blink;
  for (let i = 0; i < n; i++) {
    const k = i * 3; let x = base[k], y = base[k + 1], z = base[k + 2];
    y -= wJaw[i] * j * 0.11; z -= wJaw[i] * j * 0.03;              // la mascella scende e rientra un filo
    y += wLipU[i] * j * 0.022; y -= wLipD[i] * j * 0.06;            // le labbra si separano
    if (wLid[i] > 0) {                                               // il battito: la palpebra di sopra scende a coprire l'occhio, quella di sotto sale un po'
      const w = wLid[i] * bl * (lidUp[i] ? 1 : 0.3);
      y += (lidY[i] - y) * w; z += 0.02 * w;                         // e si porta davanti al bulbo
    }
    cur[k] = x; cur[k + 1] = y; cur[k + 2] = z;
  }
  // gli occhi guardano: i bulbi ruotano attorno al proprio centro (prima della testa, che li segue con inerzia)
  const ey = A.occhioYaw || 0, ep = A.occhioPitch || 0;
  if (ey || ep) {
    const cy = Math.cos(ey), sy = Math.sin(ey), cp = Math.cos(ep), sp = Math.sin(ep);
    for (const o of occhi) {
      const [ox, oy, oz] = o.c;
      for (let q = 0; q < o.v.length; q++) {
        const k = o.v[q] * 3; const x = cur[k] - ox, y = cur[k + 1] - oy, z = cur[k + 2] - oz;
        const y1 = y * cp + z * sp, z1 = -y * sp + z * cp;           // su e giù
        cur[k] = ox + x * cy + z1 * sy; cur[k + 1] = oy + y1; cur[k + 2] = oz - x * sy + z1 * cy;  // destra e sinistra
      }
    }
  }
}
function tessellaMesh() {
  const { cur, idx } = MESH;
  let t = 0;
  for (let i = 0; i < idx.length; i += 3) {
    const p = idx[i] * 3, q = idx[i + 1] * 3, r = idx[i + 2] * 3;
    const ax = cur[p], ay = cur[p + 1], az = cur[p + 2], bx = cur[q], by = cur[q + 1], bz = cur[q + 2], cx = cur[r], cy = cur[r + 1], cz = cur[r + 2];
    const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nn = Math.hypot(nx, ny, nz) || 1; nx /= nn; ny /= nn; nz /= nn;
    tri[t] = ax; tri[t + 1] = ay; tri[t + 2] = az; tri[t + 3] = bx; tri[t + 4] = by; tri[t + 5] = bz; tri[t + 6] = cx; tri[t + 7] = cy; tri[t + 8] = cz;
    for (let m = 0; m < 9; m += 3) { nrm[t + m] = nx; nrm[t + m + 1] = ny; nrm[t + m + 2] = nz; }
    t += 9;
  }
}
function tessella() {
  let t = 0, l = 0;
  const faccia = (src, cols, rows, i, j) => {
    const a = (j * (cols + 1) + i) * 3, b = a + 3, c = ((j + 1) * (cols + 1) + i) * 3, d = c + 3;
    for (const [p, q, r] of [[a, c, b], [b, c, d]]) {
      const ax = src[p], ay = src[p + 1], az = src[p + 2], bx = src[q], by = src[q + 1], bz = src[q + 2], cx = src[r], cy = src[r + 1], cz = src[r + 2];
      const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const n = Math.hypot(nx, ny, nz) || 1; nx /= n; ny /= n; nz /= n;
      tri.set([ax, ay, az, bx, by, bz, cx, cy, cz], t); nrm.set([nx, ny, nz, nx, ny, nz, nx, ny, nz], t); t += 9;
    }
  };
  const linee = (src, cols, rows) => {
    for (let j = 0; j <= rows; j++) for (let i = 0; i < cols; i++) { const a = (j * (cols + 1) + i) * 3; lin.set([src[a], src[a + 1], src[a + 2], src[a + 3], src[a + 4], src[a + 5]], l); l += 6; }
    for (let j = 0; j < rows; j++) for (let i = 0; i <= cols; i++) { const a = (j * (cols + 1) + i) * 3, b = ((j + 1) * (cols + 1) + i) * 3; lin.set([src[a], src[a + 1], src[a + 2], src[b], src[b + 1], src[b + 2]], l); l += 6; }
  };
  for (let j = 0; j < SEG_V; j++) for (let i = 0; i < SEG_A; i++) faccia(grid, SEG_A, SEG_V, i, j);
  for (let j = 0; j < COLLO.seg; j++) for (let i = 0; i < SEG_A; i++) faccia(collo, SEG_A, COLLO.seg, i, j);
  linee(grid, SEG_A, SEG_V); linee(collo, SEG_A, COLLO.seg);
}

// ------------------------------------------------------------------ WebGL
const VS = `
attribute vec3 aPos; attribute vec3 aNrm;
uniform mat3 uR; uniform vec3 uT; uniform float uScala;
uniform vec4 uCam;   // camY, camZ, cos(pitch), sin(pitch)
uniform vec4 uScreen; // W, H, CX, CY
uniform float uF;
varying vec3 vN; varying float vD; varying float vY;
void main(){
  vY = aPos.y;
  vec3 p = uR * (aPos * uScala);
  // locale (x destra, y su, z verso camera) -> mondo della scena (x, profondità, altezza)
  vec3 w = vec3(p.x + uT.x, uT.y - p.z, uT.z + p.y);
  float dy = w.y - uCam.x, dz = w.z - uCam.y;
  float d = dy * uCam.z - dz * uCam.w;
  float up = dy * uCam.w + dz * uCam.z;
  vec2 px = vec2(uScreen.z + w.x / d * uF, uScreen.w - up / d * uF);
  vec2 ndc = vec2((px.x - uScreen.x * .5) / (uScreen.x * .5), -(px.y - uScreen.y * .5) / (uScreen.y * .5));
  float n = 0.3, f = 30.0;
  gl_Position = vec4(ndc * d, (d * (f + n) - 2.0 * f * n) / (f - n), d);
  vN = uR * aNrm; vD = d;
}`;
const FS_FILL = `
precision mediump float;
varying vec3 vN; varying float vD; varying float vY;
uniform vec3 uLuce; uniform float uPelle; uniform float uRim; uniform vec2 uFade;
void main(){
  float fade = smoothstep(uFade.x, uFade.y, vY);  // il collo svanisce verso il basso
  if (fade < 0.02) discard;
  vec3 N = normalize(vN);
  float lam = max(0.0, dot(N, normalize(uLuce)));
  float pelle = floor(pow(lam, 1.4) * uPelle * 10.0) / 10.0;  // a gradini: 10 livelli, come una texture a 8 bit
  float rim = pow(1.0 - abs(N.z), 4.0) * uRim;                // luce di taglio sulla silhouette: stacca la testa dal cielo
  gl_FragColor = vec4(0.0, (pelle + rim) * fade, fade, fade);  // premoltiplicato
}`;
const FS_LINE = `
precision mediump float;
varying vec3 vN; varying float vD; varying float vY;
uniform float uAlfa; uniform vec2 uFade;
void main(){
  float fade = smoothstep(uFade.x, uFade.y, vY); if (fade < 0.02) discard;
  // le maglie viste di taglio si affollano: le sfumiamo con l'angolo verso la camera, così il reticolo resta fine ovunque
  float dens = length(vN);                         // < 1 dove la maglia è fitta (vedi MESH)
  float nz = clamp(vN.z / max(dens, 1e-4), 0.0, 1.0);
  float a = uAlfa * fade * mix(0.08, 1.0, pow(nz, 1.3)) * dens;
  gl_FragColor = vec4(a, 0.0, 0.0, a);
}`;

function sh(tipo, src) { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
function prog(fs) {
  const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {}; for (const n of ["uR", "uT", "uScala", "uCam", "uScreen", "uF", "uLuce", "uPelle", "uRim", "uAlfa", "uFade"]) u[n] = gl.getUniformLocation(p, n);
  return { p, u, aPos: gl.getAttribLocation(p, "aPos"), aNrm: gl.getAttribLocation(p, "aNrm") };
}
let P_FILL, P_LINE, bPos, bNrm, bLin, bCur, bVN, bEdge, pronto = false;
try {
  if (!gl) throw new Error("niente WebGL");
  P_FILL = prog(FS_FILL); P_LINE = prog(FS_LINE);
  bPos = gl.createBuffer(); bNrm = gl.createBuffer(); bLin = gl.createBuffer();
  if (MESH) {  // le linee della scansione: vertici correnti (cambiano) + normali e spigoli (fissi, caricati una volta)
    bCur = gl.createBuffer(); bVN = gl.createBuffer(); bEdge = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bVN); gl.bufferData(gl.ARRAY_BUFFER, MESH.vn, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bEdge); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, MESH.edges, gl.STATIC_DRAW);
  }
  pronto = true;
} catch (err) { console.warn("Testa 3D non disponibile:", err.message); }

function dimensiona(w, h, f, cx, cy, cam) {
  W = w; H = h; F = f; CX = cx; CY = cy; CAM = cam;
  canvas.width = W; canvas.height = H;
  if (gl) gl.viewport(0, 0, W, H);
}

// ------------------------------------------------------------------ il movimento
const M = { yaw: 0, pitch: 0, roll: 0, blink: 0, blinkT: -1, doppio: false, prossimoBlink: 2500, nod: 0, sguardoYaw: 0, sguardoPitch: 0, prossimoSguardo: 1500, latoPensiero: 1, pensava: false };
const BLINK_CHIUDE = 80, BLINK_APRE = 140;   // ms: si chiude in fretta, si riapre con più calma
function rot(yaw, pitch, roll) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), spp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
  // R = Ry(yaw) * Rx(pitch) * Rz(roll), column-major per WebGL
  const r00 = cy * cr + sy * spp * sr, r01 = -cy * sr + sy * spp * cr, r02 = sy * cp;
  const r10 = cp * sr, r11 = cp * cr, r12 = -spp;
  const r20 = -sy * cr + cy * spp * sr, r21 = sy * sr + cy * spp * cr, r22 = cy * cp;
  return new Float32Array([r00, r10, r20, r01, r11, r21, r02, r12, r22]);
}
function n1(t, k) { return Math.sin(t * k) * 0.6 + Math.sin(t * k * 2.3 + 1.7) * 0.3 + Math.sin(t * k * 0.37 + 0.4) * 0.4; }

let ultimoT = 0;
function render(t, Pz) {
  if (!pronto) return canvas;
  const dt = Math.min(80, t - ultimoT || 16); ultimoT = t;
  const s = t / 1000;
  const a = Pz.ascolto, p = Pz.penso, pa = Pz.parlo, d = Pz.dorme, neutro = Math.max(0, 1 - a - p - pa - d);
  // sguardi: ogni pochi secondi la testa si gira un po' da una parte o dall'altra, e poi torna
  M.prossimoSguardo -= dt;
  if (M.prossimoSguardo <= 0) {
    const verso = Math.random() < 0.5 ? -1 : 1;
    M.sguardoYaw = verso * (0.12 + Math.random() * 0.26); M.sguardoPitch = (Math.random() - 0.5) * 0.16;
    if (Math.random() < 0.3) M.sguardoYaw *= 0.3;  // ogni tanto torna quasi dritto
    M.prossimoSguardo = 2500 + Math.random() * 5000;
  }
  // quando comincia a pensare sceglie da che parte guardare in alto
  if (p > 0.5 && !M.pensava) { M.latoPensiero = Math.random() < 0.5 ? -1 : 1; M.pensava = true; } else if (p < 0.2) M.pensava = false;
  // bersagli per stato
  let yaw = M.sguardoYaw * (1 - a * 0.6) + 0.06 * n1(s, 0.21), pitch = M.sguardoPitch + 0.03 * n1(s, 0.17) + 0.02, roll = 0.04 * n1(s, 0.13) + 0.1 * M.sguardoYaw;
  yaw += a * (0.03 * n1(s, 0.9)) + p * (M.latoPensiero * 0.38 + 0.06 * n1(s, 0.3)) + pa * (0.10 * n1(s, 0.55)) + d * (0.05 * n1(s, 0.05));
  pitch += a * (0.09 + 0.03 * Pz.lev) + p * (-0.22 + 0.04 * n1(s, 0.4)) + pa * (0.05 * Pz.bocca + 0.05 * n1(s, 0.8)) + d * 0.38;
  roll += a * (0.10 + 0.02 * n1(s, 0.5)) + p * 0.08 * M.latoPensiero + pa * (0.06 * n1(s, 0.45)) + d * 0.06;
  // un colpo (parola con enfasi) = un cenno secco del capo
  M.nod = Math.max(M.nod * Math.exp(-dt / 260), Pz.colpo || 0);
  pitch += M.nod * 0.16; yaw += M.nod * 0.03;
  // inseguimento morbido: la testa ha inerzia
  const k = 1 - Math.exp(-dt / 360);
  M.yaw += (yaw - M.yaw) * k; M.pitch += (pitch - M.pitch) * k; M.roll += (roll - M.roll) * k;
  // palpebre: un battito è una curva nel tempo (chiude in 80 ms, riapre in 140), ogni tanto doppio
  if (M.blinkT >= 0) {
    M.blinkT += dt;
    if (M.blinkT < BLINK_CHIUDE) M.blink = M.blinkT / BLINK_CHIUDE;
    else if (M.blinkT < BLINK_CHIUDE + BLINK_APRE) M.blink = 1 - (M.blinkT - BLINK_CHIUDE) / BLINK_APRE;
    else { M.blink = 0; M.blinkT = -1; if (M.doppio) { M.doppio = false; M.prossimoBlink = 110; } }
  } else {
    M.prossimoBlink -= dt;
    if (M.prossimoBlink <= 0) { M.blinkT = 0; M.blink = 0; M.doppio = Math.random() < 0.22; M.prossimoBlink = 2200 + Math.random() * 3800 + 1200 * p; }
  }
  const blink = d > 0.5 ? 1 : Math.min(1, M.blink * 1.15);
  // gli occhi anticipano lo sguardo: scattano verso dove la testa sta per girarsi, e in alto quando pensa
  const occhioYaw = Math.max(-0.35, Math.min(0.35, (yaw - M.yaw) * 1.6 + p * M.latoPensiero * 0.12));
  const occhioPitch = Math.max(-0.3, Math.min(0.3, -(pitch - M.pitch) * 1.2 + p * 0.22 - a * 0.05));

  const A = { bocca: Pz.bocca * pa, occhi: Pz.occhi, blink, occhioYaw, occhioPitch };
  if (MESH) { costruisciMesh(A); tessellaMesh(); } else { costruisci(A); tessella(); }

  const respiro = 1 + 0.012 * Math.sin(s * 1.9);
  const R = rot(M.yaw, M.pitch - 0.012 * Math.sin(s * 1.9), M.roll);  // il respiro solleva anche un filo il mento
  const T = [POS.x, POS.y, POS.z * (0.9 + 0.1 * (Pz.lift || 1)) + 0.02 * Math.sin(s * 1.9)];

  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.BLEND);
  const comuni = (pr) => {
    gl.useProgram(pr.p);
    gl.uniformMatrix3fv(pr.u.uR, false, R); gl.uniform3f(pr.u.uT, T[0], T[1], T[2]); gl.uniform1f(pr.u.uScala, POS.scala * respiro);
    gl.uniform4f(pr.u.uCam, CAM.y, CAM.z, Math.cos(CAM.pitch), Math.sin(CAM.pitch)); gl.uniform4f(pr.u.uScreen, W, H, CX, CY); gl.uniform1f(pr.u.uF, F);
    if (MESH) gl.uniform2f(pr.u.uFade, -0.46, -0.30); else gl.uniform2f(pr.u.uFade, -1.75, -0.85);
  };
  // 1. le facce: pelle (verde) e silhouette (blu), spinte un filo indietro così le linee davanti vincono
  comuni(P_FILL);
  gl.uniform3f(P_FILL.u.uLuce, -0.55, 0.5, 0.75);
  gl.uniform1f(P_FILL.u.uPelle, MESH ? 0.22 + 0.26 * pa + 0.08 * a : 0.55 + 0.45 * pa + 0.15 * a);  // la pelle resta scura: comandano le linee
  gl.uniform1f(P_FILL.u.uRim, MESH ? 0.40 + 0.10 * pa : 0.0);
  gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.0, 2.0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bPos); gl.bufferData(gl.ARRAY_BUFFER, tri, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(P_FILL.aPos); gl.vertexAttribPointer(P_FILL.aPos, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bNrm); gl.bufferData(gl.ARRAY_BUFFER, nrm, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(P_FILL.aNrm); gl.vertexAttribPointer(P_FILL.aNrm, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, NT * 3);
  gl.disable(gl.POLYGON_OFFSET_FILL);
  // 2. il reticolo: solo le linee a vista, sfumate dove la maglia è di taglio
  comuni(P_LINE);
  gl.uniform1f(P_LINE.u.uAlfa, MESH ? 0.62 : 1.0);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  if (MESH) {
    gl.bindBuffer(gl.ARRAY_BUFFER, bCur); gl.bufferData(gl.ARRAY_BUFFER, MESH.cur, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(P_LINE.aPos); gl.vertexAttribPointer(P_LINE.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bVN); gl.enableVertexAttribArray(P_LINE.aNrm); gl.vertexAttribPointer(P_LINE.aNrm, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bEdge);
    gl.drawElements(gl.LINES, NL * 2, gl.UNSIGNED_SHORT, 0);
  } else {
    gl.bindBuffer(gl.ARRAY_BUFFER, bLin); gl.bufferData(gl.ARRAY_BUFFER, lin, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(P_LINE.aPos); gl.vertexAttribPointer(P_LINE.aPos, 3, gl.FLOAT, false, 0, 0);
    if (P_LINE.aNrm >= 0) { gl.disableVertexAttribArray(P_LINE.aNrm); gl.vertexAttrib3f(P_LINE.aNrm, 0, 0, 1); }  // senza normali: linee piene
    gl.drawArrays(gl.LINES, 0, NL * 2);
  }
  gl.disable(gl.BLEND);
  if (!VESTE) return canvas;
  // il vestito: segue solo il respiro e un'ombra del movimento (le spalle non girano con il collo)
  const Rv = rot(M.yaw * 0.15, M.pitch * 0.1, M.roll * 0.3);
  const vest = (pr) => {
    gl.useProgram(pr.p);
    gl.uniformMatrix3fv(pr.u.uR, false, Rv); gl.uniform3f(pr.u.uT, T[0], T[1], T[2]); gl.uniform1f(pr.u.uScala, POS.scala * respiro);
    gl.uniform4f(pr.u.uCam, CAM.y, CAM.z, Math.cos(CAM.pitch), Math.sin(CAM.pitch)); gl.uniform4f(pr.u.uScreen, W, H, CX, CY); gl.uniform1f(pr.u.uF, F);
    gl.uniform2f(pr.u.uFade, -1.08, -0.78);
  };
  vest(P_FILL);
  gl.uniform3f(P_FILL.u.uLuce, -0.55, 0.5, 0.75); gl.uniform1f(P_FILL.u.uPelle, 0.18);
  gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.0, 2.0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bVPos); gl.bufferData(gl.ARRAY_BUFFER, VESTITO.tri, gl.STATIC_DRAW); gl.enableVertexAttribArray(P_FILL.aPos); gl.vertexAttribPointer(P_FILL.aPos, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bVNrm); gl.bufferData(gl.ARRAY_BUFFER, VESTITO.nrm, gl.STATIC_DRAW); gl.enableVertexAttribArray(P_FILL.aNrm); gl.vertexAttribPointer(P_FILL.aNrm, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, VESTITO.nt * 3);
  gl.disable(gl.POLYGON_OFFSET_FILL);
  vest(P_LINE);
  gl.uniform1f(P_LINE.u.uAlfa, 0.9);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.bindBuffer(gl.ARRAY_BUFFER, bVLin); gl.bufferData(gl.ARRAY_BUFFER, VESTITO.lin, gl.STATIC_DRAW); gl.enableVertexAttribArray(P_LINE.aPos); gl.vertexAttribPointer(P_LINE.aPos, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.LINES, 0, VESTITO.nl * 2);
  gl.disable(gl.BLEND);
  return canvas;
}

// ------------------------------------------------------------------ il colletto e la cravatta (stanno sul busto: non girano con la testa)
const VESTITO = (() => {
  const T = [], L = [];
  const tri3 = (a, b, c) => T.push(...a, ...b, ...c);
  const seg = (a, b) => L.push(...a, ...b);
  const quad = (a, b, c, d) => { tri3(a, b, c); tri3(a, c, d); seg(a, b); seg(b, c); seg(c, d); seg(d, a); };
  // il collo della scansione è largo 0.36 fra il mento (-0.21) e -0.40: lì si taglia e lì si appoggia il colletto
  const N = 40, y0 = -0.385, y1 = -0.50, r0 = 0.40, r1 = 0.49;
  const p = (a, r, y) => [Math.sin(a) * r, y, Math.cos(a) * r * 0.92 - 0.04];
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
    const front = Math.cos((a0 + a1) / 2) > 0.80;  // davanti il colletto è aperto: ci sono le punte
    if (!front) quad(p(a0, r0, y0), p(a1, r0, y0), p(a1, r1, y1), p(a0, r1, y1));
  }
  for (const sgn of [-1, 1]) {
    // la punta del colletto: un triangolo stretto che scende verso lo sterno
    const A = [sgn * 0.24, y0, 0.34], B = [sgn * 0.44, y1 - 0.03, 0.30], C = [sgn * 0.06, y1 - 0.22, 0.42];
    tri3(A, B, C); seg(A, B); seg(B, C); seg(C, A);
    // la camicia: una spalla morbida che svanisce (due quadrilateri)
    const D = [sgn * 0.78, -0.70, 0.12], E = [sgn * 0.40, -0.88, 0.30], F2 = [sgn * 0.98, -0.98, -0.05];
    quad(B, D, E, C); quad(D, F2, [sgn * 0.62, -1.05, 0.22], E);
  }
  // la cravatta: nodo stretto, lama che scende e svanisce
  quad([-0.05, y0 - 0.01, 0.44], [0.05, y0 - 0.01, 0.44], [0.045, y1 - 0.06, 0.46], [-0.045, y1 - 0.06, 0.46]);
  quad([-0.04, y1 - 0.06, 0.46], [0.04, y1 - 0.06, 0.46], [0.075, -1.08, 0.40], [-0.075, -1.08, 0.40]);
  const tri = new Float32Array(T), lin = new Float32Array(L), nrm = new Float32Array(T.length);
  for (let i = 0; i < T.length; i += 9) {
    const ux = T[i + 3] - T[i], uy = T[i + 4] - T[i + 1], uz = T[i + 5] - T[i + 2], vx = T[i + 6] - T[i], vy = T[i + 7] - T[i + 1], vz = T[i + 8] - T[i + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const n = Math.hypot(nx, ny, nz) || 1;
    if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
    for (let m = 0; m < 9; m += 3) { nrm[i + m] = nx / n; nrm[i + m + 1] = ny / n; nrm[i + m + 2] = nz / n; }
  }
  return { tri, nrm, lin, nt: T.length / 9, nl: L.length / 6 };
})();
const bVPos = gl && gl.createBuffer(), bVNrm = gl && gl.createBuffer(), bVLin = gl && gl.createBuffer();
const IDENT = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);

window.Testa = { canvas, dimensiona, render, pronto: () => pronto, POS, M };
})();

/* La Scena della Voce: il volto del Segretario che sale da una griglia, sotto un cielo da film anni 80.

   Due orologi, come ha chiesto Ema:
   - il VOLTO (griglia + volto, disegnati in 2D) cambia a 14 fotogrammi al secondo, a scatti, come un'animazione
     a passo uno;
   - tutto il resto (cielo, nebulosa, stelle, iperspazio, onde che corrono sulle linee, grana, sfarfallio) va a
     60 al secondo, in uno shader WebGL.

   La griglia è disegnata in un canvas 2D a canali: rosso = linee, verde = pelle (luce sul volto), blu = superficie
   (nasconde il cielo dietro la testa). Lo shader colora i canali secondo lo stato: verde a riposo, magenta quando
   parla, ambra quando pensa, cremisi quando è in silenzio. Così il colore cambia a 60 fps anche se il volto va a 14.

   API (usata da voce_logica.js): Scena.stato(fase), Scena.livello(0..1), Scena.bocca(0..1), Scena.muto(bool). */
(() => {
"use strict";
const RIDOTTO = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Tre tavolozze: verde (Tron, la griglia classica), rosso (Blood Machines), tramonto (l'eclissi sull'orizzonte caldo).
const LOOKS = {
  verde:    { lin: [0.30, 1.0, 0.36], parla: [1.0, 0.16, 0.56], pensa: [1.0, 0.70, 0.24], neb1: [0.42, 0.12, 1.0], neb2: [1.0, 0.16, 0.56], hz: [1.0, 0.30, 0.20], cor: [0.25, 0.85, 0.80], pelle: [1.0, 0.48, 0.28], cielo: [0.02, 0.0, 0.04] },
  rosso:    { lin: [1.0, 0.14, 0.50], parla: [1.0, 0.85, 0.95], pensa: [1.0, 0.65, 0.20], neb1: [0.55, 0.05, 0.75], neb2: [1.0, 0.10, 0.30], hz: [1.0, 0.05, 0.12], cor: [1.0, 0.30, 0.60], pelle: [1.0, 0.35, 0.55], cielo: [0.05, 0.0, 0.05] },
  tramonto: { lin: [1.0, 0.62, 0.18], parla: [1.0, 0.92, 0.75], pensa: [0.30, 0.90, 0.85], neb1: [0.05, 0.30, 0.40], neb2: [1.0, 0.40, 0.10], hz: [1.0, 0.35, 0.05], cor: [1.0, 0.95, 0.85], pelle: [1.0, 0.55, 0.25], cielo: [0.01, 0.03, 0.06] },
};
// Tavolozze di TONO: la scena parte dal look scelto e, mentre il Segretario parla, scivola verso queste.
LOOKS.domanda = { lin: [0.30, 0.92, 0.95], parla: [0.75, 0.98, 1.0], pensa: [1.0, 0.70, 0.24], neb1: [0.10, 0.35, 0.80], neb2: [0.25, 0.80, 0.95], hz: [0.20, 0.70, 0.90], cor: [0.80, 0.98, 1.0], pelle: [0.70, 0.75, 1.0], cielo: [0.0, 0.02, 0.06] };
LOOKS.male = { lin: [0.85, 0.10, 0.14], parla: [1.0, 0.45, 0.40], pensa: [1.0, 0.55, 0.20], neb1: [0.30, 0.02, 0.08], neb2: [0.80, 0.05, 0.10], hz: [0.75, 0.05, 0.05], cor: [1.0, 0.25, 0.20], pelle: [0.90, 0.25, 0.25], cielo: [0.03, 0.0, 0.0] };
const TONI = { neutro: null, forte: "rosso", domanda: "domanda", calmo: "tramonto", bene: "verde", male: "male" };
const LOOK = (() => { const q = new URLSearchParams(location.search).get("look"); let l = q; try { if (!l) l = localStorage.getItem("voce.look"); if (q) localStorage.setItem("voce.look", q); } catch (_) {} return LOOKS[l] ? l : "verde"; })();
const PAL = LOOKS[LOOK];
function POSA_INIT() { const q = new URLSearchParams(location.search).get("posa"); return ["sdraiato", "in_piedi"].includes(q) ? q : "3d"; }
const POSA = POSA_INIT();
const CHIAVI = ["lin", "parla", "pensa", "neb1", "neb2", "hz", "cor", "pelle", "cielo"];
// La tavolozza corrente (quella che lo shader vede) insegue il bersaglio a 60 fps.
const palCur = {}, palTgt = {};
for (const k of CHIAVI) { palCur[k] = PAL[k].slice(); palTgt[k] = PAL[k].slice(); }
let tonoAttuale = "neutro", colpo = 0, intensita = 0, intTgt = 0;
function setTono(t) {
  tonoAttuale = TONI[t] !== undefined ? t : "neutro";
  const look = TONI[tonoAttuale] ? LOOKS[TONI[tonoAttuale]] : PAL;
  for (const k of CHIAVI) palTgt[k] = look[k];
  intTgt = { forte: 0.32, male: 0.15, domanda: 0.08, bene: 0.12, calmo: -0.3, neutro: 0 }[tonoAttuale] || 0;
}
function seguiPalette(dt) {
  const k = 1 - Math.exp(-dt / 520);
  for (const c of CHIAVI) for (let i = 0; i < 3; i++) palCur[c][i] += (palTgt[c][i] - palCur[c][i]) * k;
  colpo *= Math.exp(-dt / 320);
  intensita += (intTgt - intensita) * (1 - Math.exp(-dt / 400));
}
const FPS_VOLTO = 14;
const ext = { fase: "riposo", livello: 0, bocca: 0, muto: false };
window.Scena = {
  look: LOOK,
  tono(t) { setTono(t); },                 // forte | domanda | calmo | bene | male | neutro
  colpo(x) { colpo = Math.min(0.6, colpo + (x == null ? 0.4 : x) * 0.45); }, // una parola con enfasi: un lampo che si spegne da solo
  stato(f) { ext.fase = f; }, livello(x) { ext.livello = x; }, bocca(x) { ext.bocca = x; }, muto(m) { ext.muto = m; },
};

// Valori morbidi (60 fps): ogni stato entra e esce con calma.
const E = { ascolto: 0, penso: 0, parlo: 0, dorme: 0, lev: 0, bocca: 0, occhi: 0, lift: 1 };
function segui(dt) {
  const f = ext.muto ? "dorme" : ext.fase;
  const k = 1 - Math.exp(-dt / 280);
  E.ascolto += ((f === "ascolto" || f === "trascrivo" ? 1 : 0) - E.ascolto) * k;
  E.penso += ((f === "penso" || f === "trascrivo" ? 1 : 0) - E.penso) * k;
  E.parlo += ((f === "parlo" ? 1 : 0) - E.parlo) * k;
  E.dorme += ((f === "dorme" ? 1 : 0) - E.dorme) * (1 - Math.exp(-dt / 700));
  E.lev += (ext.livello - E.lev) * (1 - Math.exp(-dt / 60));
  E.bocca += (ext.bocca - E.bocca) * (1 - Math.exp(-dt / 50));
  E.occhi += ((f === "ascolto" || f === "parlo" || f === "penso" ? 1 : 0) - E.occhi) * (1 - Math.exp(-dt / 500));
  E.lift += ((f === "dorme" ? 0.32 : f === "ascolto" ? 1.06 : 1) - E.lift) * (1 - Math.exp(-dt / 900));
  if (f !== "parlo" && tonoAttuale !== "neutro") setTono("neutro");
  seguiPalette(dt);
}

// ------------------------------------------------------------------ geometria
const ROOT = document.getElementById("voce-root") || document.body;
const cv = ROOT.querySelector("#scena");
ROOT.dataset.look = LOOK;
const gc = document.createElement("canvas"), g = gc.getContext("2d");
const ba = document.createElement("canvas"), bax = ba.getContext("2d");
const bb = document.createElement("canvas"), bbx = bb.getContext("2d");
let W = 0, H = 0, F = 0, CX = 0, CY = 0, Q = 1, ORIZ = 0;
const CAM = POSA_INIT() === "sdraiato" ? { y: -3.4, z: 1.9, pitch: 0.36 } : { y: -3.2, z: 1.45, pitch: 0.22 };
const FACCIA = { x: 0.2, y: 1.55, su: 0.9, sv: 1.45, hs: 1.0, yaw: -0.38 };
const PASSO = 0.034, MAGGIORE = 6, FINE = 2;   // campionamento; una linea ogni 6 campioni sul pavimento (~0.20), ogni 2 sul volto
const X0 = -4.2, X1 = 4.2, Y0 = -1.0, Y1 = 8.5;
const NX = Math.round((X1 - X0) / PASSO) + 1, NY = Math.round((Y1 - Y0) / PASSO) + 1;
const SX = new Float32Array(NX * NY), SY = new Float32Array(NX * NY), HZ = new Float32Array(NX * NY);
// La parete del volto (posa in piedi): un piano verticale a profondità WY, il rilievo sporge verso la camera.
const WY = 3.3, WX0 = -1.75, WX1 = 1.75, WZ0 = 0.0, WZ1 = 2.7;
const NWX = Math.round((WX1 - WX0) / PASSO) + 1, NWZ = Math.round((WZ1 - WZ0) / PASSO) + 1;
const WSX = new Float32Array(NWX * NWZ), WSY = new Float32Array(NWX * NWZ), WH = new Float32Array(NWX * NWZ);
const TESTA = { zc: 1.5, su: 0.74, sv: 0.74, hs: 1.25 };

function dimensiona() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  Q = ((ROOT.clientWidth || innerWidth) * dpr > 2200 ? 2200 / (ROOT.clientWidth || innerWidth) : dpr) * (typeof QSCALA === "number" ? QSCALA : 1);
  const rw = ROOT.clientWidth || innerWidth || 1280, rh = ROOT.clientHeight || innerHeight || 720;
  W = Math.max(64, Math.round(rw * Q)); H = Math.max(64, Math.round(rh * Q));
  cv.width = W; cv.height = H; gc.width = W; gc.height = H;
  ba.width = Math.max(2, W >> 2); ba.height = Math.max(2, H >> 2);
  bb.width = Math.max(2, W >> 3); bb.height = Math.max(2, H >> 3);
  const ritratto = H > W;
  F = (ritratto ? W * 1.15 : Math.min(H * 0.98, W * 0.62));
  CX = W / 2; CY = H * (ritratto ? 0.52 : (POSA === "in_piedi" ? 0.50 : 0.58));
  ORIZ = CY - F * Math.tan(CAM.pitch);
  if (gl) gl.viewport(0, 0, W, H);
  if (POSA === "3d" && window.Testa) window.Testa.dimensiona(W, H, F, CX, CY, CAM);
  volto(performance.now(), true);
}

const cp = () => Math.cos(CAM.pitch), sp = () => Math.sin(CAM.pitch);
function proj(x, y, z, out, i) {
  const dy = y - CAM.y, dz = z - CAM.z, c = cp(), s = sp();
  const d = Math.max(0.05, dy * c - dz * s);
  out[0][i] = CX + (x / d) * F;
  out[1][i] = CY - ((dy * s + dz * c) / d) * F;
  return d;
}

// Il volto come rilievo: un ellissoide più una ventina di gaussiane (fronte, arcate, occhi, naso, labbra,
// mento, collo). Coordinate locali u (largo) v (dal mento, -, alla nuca, +). Stirato in profondità (sv > su)
// perché la camera lo guarda di sbieco: così da qui si legge come un volto vero.
const G = (u, v, cu, cv_, su, sv, a) => { const x = (u - cu) / su, y = (v - cv_) / sv; return a * Math.exp(-x * x - y * y); };
function hash(a, b) { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); }
function rumore(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function rilievo(u, v, P) {
  const q = (u / 0.78) ** 2 + ((v - 0.05) / 1.15) ** 2;
  let h = q < 1 ? 0.52 * Math.pow(1 - q, 0.42) : 0;
  // collo: un rilievo basso che scende verso chi guarda e rientra nel pavimento
  const collo = v < -0.55 ? 0.28 * Math.exp(-((u / 0.42) ** 2)) * Math.exp(-(((v + 0.55) / 1.0) ** 2)) : 0;
  h = Math.max(h, collo);
  if (h <= 0.001) return 0;
  const j = P.bocca, o = P.occhi;
  h += G(u, v, 0, 0.55, 0.5, 0.4, 0.10);                          // fronte
  for (const s of [-1, 1]) {
    h += G(u, v, s * 0.30, 0.27, 0.24, 0.06, 0.12);               // arcata sopracciliare
    h += G(u, v, s * 0.30, 0.12, 0.19, 0.11, -0.22);              // orbita
    h += G(u, v, s * 0.30, 0.10, 0.13, 0.07, 0.12 + 0.03 * o);    // il globo dell'occhio sotto la palpebra
    h += G(u, v, s * 0.30, 0.13, 0.11, 0.018, -0.06 * o);         // la fessura: si apre quando ascolta o parla
    h += G(u, v, s * 0.12, -0.34, 0.07, 0.06, 0.10);              // ali del naso
    h += G(u, v, s * 0.45, -0.15, 0.2, 0.18, 0.10);               // zigomi
    h += G(u, v, s * 0.64, 0.30, 0.13, 0.22, -0.07);              // tempie
    h += G(u, v, s * 0.23, -0.58 - 0.05 * j, 0.06, 0.05, -0.03);  // angoli della bocca
  }
  h += G(u, v, 0, 0.0, 0.07, 0.30, 0.26);                         // dorso del naso
  h += G(u, v, 0, -0.30, 0.12, 0.10, 0.28);                       // punta
  h += G(u, v, 0, -0.43, 0.05, 0.05, -0.04);                      // filtro
  h += G(u, v, 0, -0.50, 0.20, 0.05, 0.10);                       // labbro sopra
  h += G(u, v, 0, -0.57 - 0.04 * j, 0.19, 0.02 + 0.06 * j, -0.08 - 0.22 * j); // la bocca che si apre
  h += G(u, v, 0, -0.64 - 0.09 * j, 0.17, 0.055, 0.10);           // labbro sotto
  h += G(u, v, 0, -0.90 - 0.10 * j, 0.22, 0.14, 0.14);            // mento
  // capelli: una frangia di segnale lungo il bordo alto, crepita a ogni scatto
  const bordo = Math.exp(-(((q - 0.92) / 0.10) ** 2)) * (v > 0.2 ? 1 : 0);
  if (bordo > 0.01) h += bordo * (rumore(u * 22 + P.tick * 0.7, v * 9) - 0.35) * 0.22;
  return Math.max(0, h);
}

// ------------------------------------------------------------------ il volto, a 14 fps
let ultimoVolto = -1e9, tick = 0, gridNuova = true;
function volto(t, forza) {
  if (!forza && t - ultimoVolto < 1000 / FPS_VOLTO) return;
  ultimoVolto = t; tick++;
  const P = {
    bocca: E.bocca * E.parlo, occhi: E.occhi, tick,
    respiro: 1 + 0.018 * Math.sin(t / 1100) + 0.01 * Math.sin(t / 430) * E.ascolto,
    yaw: FACCIA.yaw + 0.05 * Math.sin(t / 3300) + 0.03 * Math.sin(t / 1700) * E.parlo + (E.parlo ? (hash(tick, 3) - 0.5) * 0.012 * E.parlo : 0),
  };
  const cy = Math.cos(P.yaw), sy = Math.sin(P.yaw), alt = FACCIA.hs * E.lift * P.respiro;
  const out = [SX, SY];
  let fx0 = NX, fx1 = 0, fy0 = NY, fy1 = 0;
  const inPiedi = POSA === "in_piedi";
  if (POSA === "3d" && window.Testa && window.Testa.pronto()) {
    window.Testa.render(t, { ascolto: E.ascolto, penso: E.penso, parlo: E.parlo, dorme: E.dorme, lev: E.lev, bocca: E.bocca, occhi: E.occhi, colpo, lift: E.lift });
  }
  if (inPiedi) {
    // la testa: rilievo frontale su un piano verticale; lo yaw diventa uno scorrimento laterale e un'ombra di prospettiva
    const altw = TESTA.hs * (0.25 + 0.75 * E.lift) * P.respiro;
    const sh = Math.sin(P.yaw) * 0.6;
    const wout = [WSX, WSY];
    for (let iz = 0; iz < NWZ; iz++) {
      const z = WZ0 + iz * PASSO, v = (z - TESTA.zc) / TESTA.sv;
      for (let ix = 0; ix < NWX; ix++) {
        const x = WX0 + ix * PASSO, k = iz * NWX + ix;
        const u = (x - sh * (z - TESTA.zc) * 0.4) / TESTA.su;
        let h = (Math.abs(u) < 1.6 && v > -2.6 && v < 1.5) ? rilievo(u, v, P) * altw : 0;
        if (z < 0.25) h *= z / 0.25;  // alla base si fonde nel pavimento
        WH[k] = h;
        proj(x, WY - h * (1 + 0.25 * Math.max(0, u * sh)), z, wout, k);
      }
    }
  }
  for (let jy = 0; jy < NY; jy++) {
    const y = Y0 + jy * PASSO;
    for (let ix = 0; ix < NX; ix++) {
      const x = X0 + ix * PASSO, k = jy * NX + ix;
      const dx = x - FACCIA.x, dy = y - FACCIA.y;
      let h = 0;
      if (POSA === "sdraiato" && Math.abs(dx) < 1.3 && dy > -2.9 && dy < 2.2) {
        const u = (dx * cy + dy * sy) / FACCIA.su, v = (-dx * sy + dy * cy) / FACCIA.sv;
        h = rilievo(u, v, P) * alt;
        if (h > 0.002) { if (ix < fx0) fx0 = ix; if (ix > fx1) fx1 = ix; if (jy < fy0) fy0 = jy; if (jy > fy1) fy1 = jy; }
      }
      HZ[k] = h;
      proj(x, y, h, out, k);
    }
  }
  disegna(fx0 - 2, fx1 + 2, fy0 - 2, fy1 + 2, P);
  gridNuova = true;
}

function disegna(fx0, fx1, fy0, fy1, P) {
  g.globalCompositeOperation = "source-over";
  g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  // il pavimento nasconde il cielo (canale blu)
  g.fillStyle = "rgb(0,0,255)";
  g.beginPath();
  g.moveTo(SX[0], SY[0]); g.lineTo(SX[NX - 1], SY[NX - 1]);
  g.lineTo(SX[(NY - 1) * NX + NX - 1], SY[(NY - 1) * NX + NX - 1]); g.lineTo(SX[(NY - 1) * NX], SY[(NY - 1) * NX]);
  g.closePath(); g.fill();
  const luce = [0.62, -0.25, 0.74];
  const rivela = 0.62 + 0.38 * E.parlo + 0.1 * E.ascolto; // la pelle "airbrush": sempre visibile, piena quando parla
  const lw = Math.max(1, 1.15 * Q);
  // dal fondo verso chi guarda: ogni striscia copre quello che sta dietro (algoritmo del pittore)
  let pareteFatta = POSA !== "in_piedi";
  for (let j = NY - 2; j >= 0; j--) {
    const y = Y0 + j * PASSO;
    if (!pareteFatta && y < WY) { disegnaParete(lw, luce, rivela); pareteFatta = true; }
    const inVolto = j >= fy0 && j <= fy1;
    if (inVolto) {
      const a = Math.max(0, fx0), b = Math.min(NX - 1, fx1);
      g.globalCompositeOperation = "source-over";
      g.fillStyle = "rgb(0,0,255)";
      g.beginPath();
      for (let i = a; i <= b; i++) { const k = (j + 1) * NX + i; i === a ? g.moveTo(SX[k], SY[k]) : g.lineTo(SX[k], SY[k]); }
      for (let i = b; i >= a; i--) { const k = j * NX + i; g.lineTo(SX[k], SY[k]); }
      g.closePath(); g.fill();
      // pelle: luce lambertiana, 12 livelli per non cambiare colore a ogni quadratino
      const livelli = Array.from({ length: 12 }, () => new Path2D());
      let usati = false;
      for (let i = a; i < b; i++) {
        const k = j * NX + i;
        const h = (HZ[k] + HZ[k + 1] + HZ[k + NX] + HZ[k + NX + 1]) / 4;
        if (h < 0.01) continue;
        const gx = (HZ[k + 1] - HZ[k]) / PASSO, gy = (HZ[k + NX] - HZ[k]) / PASSO;
        const n = 1 / Math.hypot(gx, gy, 1);
        const lam = Math.max(0, (-gx * luce[0] - gy * luce[1] + luce[2]) * n);
        const x = X0 + i * PASSO - FACCIA.x;
        const lato = (0.45 + 0.55 * Math.min(1, Math.max(0, x / FACCIA.su * 0.9 + 0.6))) * rivela;
        const v = Math.min(1, Math.pow(lam, 1.6) * lato * Math.min(1, h / (0.07 * FACCIA.hs)));
        const L = Math.min(11, Math.round(v * 11));
        if (L < 1) continue;
        const p = livelli[L];
        p.moveTo(SX[k], SY[k]); p.lineTo(SX[k + 1], SY[k + 1]); p.lineTo(SX[k + NX + 1], SY[k + NX + 1]); p.lineTo(SX[k + NX], SY[k + NX]); p.closePath();
        usati = true;
      }
      if (usati) for (let L = 1; L < 12; L++) { g.fillStyle = `rgb(0,${Math.round((L / 11) * 255)},255)`; g.fill(livelli[L]); }
    }
    // linee (canale rosso), più deboli in lontananza
    const lontano = Math.min(1, Math.max(0, (y - 2.5) / 6));
    const vicino = Math.min(1, Math.max(0, (y + 1.0) / 0.8));
    const alfa = (1 - lontano * 0.9) * vicino;
    if (alfa < 0.02) continue;
    g.globalCompositeOperation = "lighter";
    const pav = POSA === "3d" ? 0.62 : 1;
    g.strokeStyle = `rgba(255,0,0,${(alfa * pav).toFixed(3)})`;
    g.lineWidth = lw * (POSA === "3d" ? 0.85 : 1.35 - lontano * 0.6);
    g.beginPath();
    for (let i = 0; i < NX; i += MAGGIORE) { const k = j * NX + i; g.moveTo(SX[k], SY[k]); g.lineTo(SX[k + NX], SY[k + NX]); }
    if ((j + 1) % MAGGIORE === 0) {
      const r = (j + 1) * NX; g.moveTo(SX[r], SY[r]);
      for (let i = 1; i < NX; i++) g.lineTo(SX[r + i], SY[r + i]);
    }
    g.stroke();
    // il volto ha una maglia più fitta (come nel riferimento): linee ogni 2 campioni, solo dove c'è rilievo
    if (inVolto) {
      g.strokeStyle = `rgba(255,0,0,${(alfa * 0.8).toFixed(3)})`; g.lineWidth = lw * 0.9;
      g.beginPath();
      const a = Math.max(0, fx0), b = Math.min(NX - 2, fx1);
      for (let i = a; i <= b; i += FINE) { if (i % MAGGIORE === 0) continue; const k = j * NX + i; if (HZ[k] > 0.006 || HZ[k + NX] > 0.006) { g.moveTo(SX[k], SY[k]); g.lineTo(SX[k + NX], SY[k + NX]); } }
      if ((j + 1) % FINE === 0 && (j + 1) % MAGGIORE !== 0) {
        const r = (j + 1) * NX; let aperto = false;
        for (let i = a; i <= b; i++) { const k = r + i; if (HZ[k] > 0.006) { aperto ? g.lineTo(SX[k], SY[k]) : g.moveTo(SX[k], SY[k]); aperto = true; } else aperto = false; }
      }
      g.stroke();
    }
  }
  if (!pareteFatta) disegnaParete(lw, luce, rivela);
  g.globalCompositeOperation = "source-over";
  if (POSA === "3d" && window.Testa && window.Testa.pronto()) g.drawImage(window.Testa.canvas, 0, 0, W, H);
  // bagliore: due copie sfocate, piccole (economiche)
  bax.filter = "blur(2px)"; bax.clearRect(0, 0, ba.width, ba.height); bax.drawImage(gc, 0, 0, ba.width, ba.height);
  bbx.filter = "blur(5px)"; bbx.clearRect(0, 0, bb.width, bb.height); bbx.drawImage(ba, 0, 0, bb.width, bb.height);
}

// La testa in piedi: silhouette (canale blu, nasconde il cielo), pelle (canale verde), maglia (canale rosso).
function disegnaParete(lw, luce, rivela) {
  const SOGLIA = 0.006;
  g.globalCompositeOperation = "source-over";
  // silhouette: una striscia per riga, dove c'è rilievo
  g.fillStyle = "rgb(0,0,255)";
  for (let iz = 0; iz < NWZ - 1; iz++) {
    let a = -1;
    for (let ix = 0; ix <= NWX - 1; ix++) {
      const k = iz * NWX + ix, dentro = ix < NWX - 1 && (WH[k] > SOGLIA || WH[k + NWX] > SOGLIA);
      if (dentro && a < 0) a = ix;
      if ((!dentro || ix === NWX - 1) && a >= 0) {
        const b = ix;
        g.beginPath();
        for (let i = a; i <= b; i++) { const q = (iz + 1) * NWX + i; i === a ? g.moveTo(WSX[q], WSY[q]) : g.lineTo(WSX[q], WSY[q]); }
        for (let i = b; i >= a; i--) { const q = iz * NWX + i; g.lineTo(WSX[q], WSY[q]); }
        g.closePath(); g.fill();
        a = -1;
      }
    }
  }
  // pelle: luce da sinistra in alto, verso la camera
  const livelli = Array.from({ length: 12 }, () => new Path2D());
  let usati = false;
  const L3 = [0.55, 0.45, 0.70];
  for (let iz = 0; iz < NWZ - 1; iz++) {
    for (let ix = 0; ix < NWX - 1; ix++) {
      const k = iz * NWX + ix;
      const h = (WH[k] + WH[k + 1] + WH[k + NWX] + WH[k + NWX + 1]) / 4;
      if (h < 0.012) continue;
      const gx = (WH[k + 1] - WH[k]) / PASSO, gz = (WH[k + NWX] - WH[k]) / PASSO;
      const n = 1 / Math.hypot(gx, gz, 1);
      const lam = Math.max(0, (-gx * L3[0] + gz * L3[1] + L3[2]) * n);
      const v = Math.min(1, Math.pow(lam, 1.8) * rivela * Math.min(1, h / (0.08 * TESTA.hs)));
      const L = Math.min(11, Math.round(v * 11));
      if (L < 1) continue;
      const p = livelli[L];
      p.moveTo(WSX[k], WSY[k]); p.lineTo(WSX[k + 1], WSY[k + 1]); p.lineTo(WSX[k + NWX + 1], WSY[k + NWX + 1]); p.lineTo(WSX[k + NWX], WSY[k + NWX]); p.closePath();
      usati = true;
    }
  }
  if (usati) for (let L = 1; L < 12; L++) { g.fillStyle = `rgb(0,${Math.round((L / 11) * 255)},255)`; g.fill(livelli[L]); }
  // maglia: fitta sul volto, come il riferimento
  g.globalCompositeOperation = "lighter";
  g.strokeStyle = "rgba(255,0,0,0.95)"; g.lineWidth = lw * 0.95;
  g.beginPath();
  for (let iz = 0; iz < NWZ - 1; iz++) {
    for (let ix = 0; ix < NWX; ix += FINE) {
      const k = iz * NWX + ix;
      if (WH[k] > SOGLIA || WH[k + NWX] > SOGLIA) { g.moveTo(WSX[k], WSY[k]); g.lineTo(WSX[k + NWX], WSY[k + NWX]); }
    }
    if (iz % FINE === 0) {
      let aperto = false;
      for (let ix = 0; ix < NWX; ix++) { const k = iz * NWX + ix; if (WH[k] > SOGLIA) { aperto ? g.lineTo(WSX[k], WSY[k]) : g.moveTo(WSX[k], WSY[k]); aperto = true; } else aperto = false; }
    }
  }
  g.stroke();
  // il bordo: una linea più forte sul profilo, come una cresta di luce
  g.strokeStyle = "rgba(255,0,0,0.6)"; g.lineWidth = lw * 1.6;
  g.beginPath();
  for (let iz = 0; iz < NWZ; iz++) {
    let primo = -1, ultimo = -1;
    for (let ix = 0; ix < NWX; ix++) { if (WH[iz * NWX + ix] > SOGLIA) { if (primo < 0) primo = ix; ultimo = ix; } }
    if (primo >= 0) { const k1 = iz * NWX + primo, k2 = iz * NWX + ultimo; g.moveTo(WSX[k1], WSY[k1]); g.lineTo(WSX[k1] + 0.01, WSY[k1]); g.moveTo(WSX[k2], WSY[k2]); g.lineTo(WSX[k2] + 0.01, WSY[k2]); }
  }
  g.stroke();
  g.globalCompositeOperation = "source-over";
}

// ------------------------------------------------------------------ WebGL: cielo, colore, pellicola (60 fps)
const gl = cv.getContext("webgl", { alpha: false, antialias: false, depth: false, powerPreference: "high-performance" });
const VS = "attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
const FS = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes; uniform float uT;
uniform sampler2D uGrid, uBA, uBB;
uniform vec4 uCam;   // camY, camZ, pitch, F
uniform vec3 uC;     // cx, cy, orizzonte (px dall'alto)
uniform vec4 uS;     // ascolto, penso, parlo, dorme
uniform vec3 uL;     // livello, bocca, ridotto
uniform vec2 uFace;
uniform vec3 pLin, pParla, pPensa, pNeb1, pNeb2, pHz, pCor, pPelle, pCielo;
uniform float uInt;  // intensità del momento: tono + colpo sulle parole (può essere negativa: più calmo)
float h1(float n){return fract(sin(n)*43758.5453);}
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*n2(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
vec3 hsv(float h){return clamp(abs(mod(h*6.+vec3(0,4,2),6.)-3.)-1.,0.,1.);}
void main(){
  float t=uT;
  float fr=floor(t*24.);                       // la pellicola scatta a 24
  vec2 weave=(vec2(h1(fr),h1(fr+7.))-.5)*1.2*(1.-uL.z);
  vec2 px=vec2(vUv.x*uRes.x, (1.-vUv.y)*uRes.y)+weave;   // pixel, origine in alto
  vec2 uv=vec2(px.x/uRes.x, 1.-px.y/uRes.y);
  float asc=uS.x, pen=uS.y, par=uS.z, dor=uS.w;
  vec3 VERDE=pLin, MAG=pParla, CRIM=vec3(1.,.10,.16), VIO=pNeb1, AMB=pPensa, TEAL=pCor, NEB2=pNeb2, HZC=pHz;

  // ---- cielo
  float hz=uC.z;
  float sopra=clamp((hz-px.y)/uRes.y,0.,1.);
  vec2 sp=vec2((px.x-uC.x)/uRes.y, (hz-px.y)/uRes.y);
  vec2 w=vec2(fbm(sp*2.2+vec2(t*.012,0.)), fbm(sp*2.2+vec2(3.1,t*.01)));
  float neb=fbm(sp*1.6+w*1.4+vec2(t*.008,-t*.004));
  float neb2=fbm(sp*3.1-w*.9+vec2(-t*.01,t*.006));
  vec3 cielo=mix(pCielo, VIO*.55, smoothstep(.30,.85,neb));
  cielo+=NEB2*.55*pow(smoothstep(.42,.95,neb),2.)*(1.-.5*dor);
  cielo+=VERDE*.18*pow(smoothstep(.55,.95,neb2),3.)*(1.+asc);
  cielo+=VIO*.12*fbm(sp*0.7+vec2(t*.004,0.));
  cielo*=smoothstep(.0,.08,sopra)*.85+.15;
  // stelle
  vec2 sg=floor(px/2.5); float st=h2(sg);
  cielo+=vec3(.9,.85,1.)*step(.9965,st)*(.5+.5*sin(t*2.+st*90.))*sopra;
  // eclissi dietro la testa
  vec2 ec=vec2(uC.x, hz-uRes.y*.125); float rr=uRes.y*.062;
  float de=length(px-ec);
  float corona=exp(-max(de-rr,0.)/(uRes.y*(.018+.02*par+.03*uL.y*par)))*(1.-step(de,rr));
  cielo=mix(cielo, vec3(0.), step(de,rr)*.96);
  cielo+=mix(TEAL, MAG, par)*corona*(.9+.6*par)*(1.-.7*dor);
  // bagliore dell'orizzonte
  float bh=exp(-abs(px.y-hz)/(uRes.y*.035));
  cielo+=mix(HZC,MAG,par)*bh*(.6+.25*max(uInt,0.))*(1.-.5*dor);
  cielo+=HZC*exp(-abs(px.y-hz)/(uRes.y*.16))*.22*(1.-step(hz,px.y))*(1.-.5*dor);
  // iperspazio mentre pensa (le scie colorate del film)
  if(pen>.01){
    vec2 d=px-ec; float a=atan(d.y,d.x); float r=length(d)/uRes.y;
    float id=floor(a*90./6.2832*2.); float hh=h1(id);
    float scia=fract(hh*7.+log(r+.05)*1.6-t*(1.3+hh*1.6));
    float raggio=smoothstep(.0,.25,scia)*smoothstep(1.,.55,scia)*step(.55,hh);
    float sottile=1.-smoothstep(.0,.35,abs(fract(a*90./6.2832*2.)-.5)*2.);
    cielo+=hsv(hh*3.+t*.05)*raggio*sottile*pen*smoothstep(.02,.2,r)*1.4;
  }

  // ---- griglia (a 14 fps) con aberrazione cromatica
  vec2 ca=(uv-.5)*.0035;
  vec4 G0=texture2D(uGrid,uv);
  float lin=texture2D(uGrid,uv+ca).r*.55+G0.r*.45; float linB=texture2D(uGrid,uv-ca).r*.55+G0.r*.45;
  float pelle=G0.g, sup=G0.b;
  vec4 A=texture2D(uBA,uv), B=texture2D(uBB,uv);

  // ---- il pavimento: dove sono le linee nel mondo (per le onde e la scansione, a 60 fps)
  float onda=0., scan=0., nebbia=0.;
  if(px.y>hz+1.){
    float c=cos(uCam.z), s=sin(uCam.z);
    float xc=(px.x-uC.x)/uCam.w, yc=-(px.y-uC.y)/uCam.w;
    vec3 d=vec3(xc, s*yc+c, c*yc-s);
    if(d.z<0.){
      float k=-uCam.y/d.z; vec2 fl=vec2(k*d.x, uCam.x+k*d.y);
      float dd=length((fl-uFace)*vec2(1.,.75));
      onda=pow(.5+.5*sin(dd*8.-t*6.5),12.)*exp(-dd*.33)*(.35+uL.x*3.)*asc;
      onda+=pow(.5+.5*sin(dd*5.-t*3.),16.)*exp(-dd*.5)*.35*par*(.4+uL.y);
      scan=exp(-pow((fl.y-(mod(t*2.6,10.)-1.5))*2.2,2.))*pen;
      nebbia=exp(-(px.y-hz)/(uRes.y*.10));
      nebbia*=.55+.45*fbm(fl*.5+vec2(t*.05,0.));
    }
  }
  vec3 colLin=mix(VERDE, MAG, par);
  colLin=mix(colLin, AMB, pen*.55);
  colLin=mix(colLin, CRIM*.55, dor);
  vec3 colPelle=mix(pPelle, MAG*.9+vec3(.1,.0,.1), .25+.45*par);
  colPelle=mix(colPelle, CRIM*.4, dor);
  float spinta=(1.+onda*4.+scan*3.)*(1.+max(uInt,0.)*.45)*(1.+min(uInt,0.)*.35);
  vec3 col=cielo*(1.-sup);
  col+=mix(VERDE*.10, MAG*.12, par)*nebbia*(1.-.6*dor);         // fumo sul pavimento
  col+=colPelle*pelle*(.85+.3*par*uL.y);
  col+=vec3(colLin.r*lin, colLin.g*mix(lin,linB,.5), colLin.b*linB)*spinta*1.05;
  col+=vec3(1.,1.,.85)*pow(G0.r,3.)*.35*spinta;                   // il nucleo caldo delle linee
  col+=colLin*A.r*(.9+.5*max(uInt,0.))*spinta + colLin*B.r*(.75+.7*max(uInt,0.))*(1.+onda*2.);  // bagliore: cresce con l'intensità
  col+=vec3(1.)*A.r*max(uInt-.5,0.)*.8;                              // solo i picchi sbiancano il nucleo delle linee
  col+=colPelle*(A.g*.25+B.g*.35);
  col+=vec3(1.,.25,.1)*B.r*.18;                                   // alone rosso (alonatura della pellicola)
  col+=colLin*onda*.06*(1.-sup*.5);

  // ---- pellicola
  col=1.-exp(-col*1.25);                                          // tono morbido, neri schiacciati
  col=pow(col,vec3(1.06,1.,.96));
  float lum=dot(col,vec3(.3,.59,.11));
  float g1=h2(px*.73+vec2(fr*13.1,fr*7.7))-.5, g2=h2(floor(px/2.)+fr*3.3)-.5;
  col+=(g1*.16+g2*.10)*(.5+lum*.9)*(1.+.5*max(uInt,0.));          // grana fine e grana grossa, da pellicola spinta
  float fl_=1.+(h1(fr*1.37)-.5)*(.06+.10*max(uInt,0.))*(1.-uL.z);  // sfarfallio, più nervoso quando l'intensità sale
  col*=fl_;
  vec2 q=uv-.5; col*=1.-dot(q,q)*1.15;                            // vignetta
  float polvere=step(.99985,h2(floor(px/3.)+fr))*.6;              // granelli di polvere
  col+=polvere*(1.-uL.z);
  gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`;

let prog, loc = {}, tex = [];
function compila() {
  if (!gl) return false;
  const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; } return s; };
  const v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS);
  if (!v || !f) return false;
  prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const ap = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  for (const n of ["uRes", "uT", "uGrid", "uBA", "uBB", "uCam", "uC", "uS", "uL", "uFace", "uInt", "pLin", "pParla", "pPensa", "pNeb1", "pNeb2", "pHz", "pCor", "pPelle", "pCielo"]) loc[n] = gl.getUniformLocation(prog, n);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  for (let i = 0; i < 3; i++) {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    tex.push(t);
  }
  gl.uniform1i(loc.uGrid, 0); gl.uniform1i(loc.uBA, 1); gl.uniform1i(loc.uBB, 2);
  return true;
}

const pronto = compila();
const fallback = !pronto ? cv.getContext("2d") : null; // senza WebGL: solo la griglia, verde
let t0 = performance.now(), prima = t0;
let lento = 0, QSCALA = 0.75, ultimoCambioQ = 0;
function frame(t) {
  if (ROOT.hidden) { prima = t; requestAnimationFrame(frame); return; }  // la Voce è chiusa: niente lavoro (ogni scheda di claude.ai ha la sua copia)
  if (t - prima < 31) { requestAnimationFrame(frame); return; }  // tetto: 30 fotogrammi al secondo bastano per cielo e grana
  const dt = Math.min(100, t - prima); prima = t;
  // se la macchina arranca (oltre 28 ms a fotogramma per un secondo), la scena si disegna più piccola e viene ingrandita
  lento = lento * 0.9 + dt * 0.1;
  if (t - ultimoCambioQ > 1500) {
    if (lento > 28 && QSCALA > 0.5) { QSCALA = Math.max(0.5, QSCALA * 0.75); ultimoCambioQ = t; dimensiona(); }
    else if (lento < 20 && QSCALA < 0.75) { QSCALA = Math.min(0.75, QSCALA * 1.25); ultimoCambioQ = t; dimensiona(); }
  }
  segui(dt);
  volto(t, false);
  const secondi = (t - t0) / 1000 * (RIDOTTO ? 0.25 : 1);
  if (pronto) {
    if (gridNuova) {
      const src = [gc, ba, bb];
      for (let i = 0; i < 3; i++) { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex[i]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src[i]); }
      gridNuova = false;
    }
    gl.uniform2f(loc.uRes, W, H); gl.uniform1f(loc.uT, secondi);
    gl.uniform4f(loc.uCam, CAM.y, CAM.z, CAM.pitch, F); gl.uniform3f(loc.uC, CX, CY, ORIZ);
    gl.uniform4f(loc.uS, E.ascolto, E.penso, E.parlo, E.dorme);
    gl.uniform3f(loc.uL, E.lev, E.bocca, RIDOTTO ? 1 : 0);
    if (POSA === "3d") gl.uniform2f(loc.uFace, window.Testa ? window.Testa.POS.x : 0, window.Testa ? window.Testa.POS.y : 1.2);
    else if (POSA === "in_piedi") gl.uniform2f(loc.uFace, 0, WY); else gl.uniform2f(loc.uFace, FACCIA.x, FACCIA.y);
    gl.uniform1f(loc.uInt, Math.max(-0.4, Math.min(0.8, intensita + colpo)));
    const pm = { pLin: "lin", pParla: "parla", pPensa: "pensa", pNeb1: "neb1", pNeb2: "neb2", pHz: "hz", pCor: "cor", pPelle: "pelle", pCielo: "cielo" };
    for (const k in pm) gl.uniform3fv(loc[k], palCur[pm[k]]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  } else if (fallback && gridNuova) {
    fallback.fillStyle = "#000"; fallback.fillRect(0, 0, W, H);
    fallback.globalCompositeOperation = "lighter"; fallback.filter = "hue-rotate(120deg)";
    fallback.drawImage(gc, 0, 0); fallback.filter = "none"; fallback.globalCompositeOperation = "source-over";
    gridNuova = false;
  }
  if ((tick & 3) === 0 || colpo > 0.05) {
    const c = palCur.lin, m = Math.max(c[0], c[1], c[2], 0.001);
    ROOT.style.setProperty("--acc", `rgb(${Math.round(c[0] / m * 255)},${Math.round(c[1] / m * 255)},${Math.round(c[2] / m * 255)})`);
  }
  requestAnimationFrame(frame);
}
addEventListener("resize", dimensiona);
dimensiona();
requestAnimationFrame(frame);
window.Scena._debug = { CAM, FACCIA, E, ridisegna: () => volto(performance.now(), true) };
})();

/* La Voce del Segretario: la logica (riscritta il 10/11/2026, una macchina a stati sola).

   MODI
   - testo: parli (o scrivi), la risposta compare scritta mentre Claude la scrive. Nessuna voce.
   - voce:  come sopra, e la risposta viene anche detta.
   - live:  conversazione continua, a mani libere.
   VOCI
   - HAL spento (di norma): parla CLAUDE. In "voce" con il suo "Leggi ad alta voce", in "live" con la sua modalità
     vocale (la più veloce: microfono e voce sono suoi, noi leggiamo la pagina e muoviamo il volto).
   - HAL acceso: parla la voce HAL del PC (voce-pc), frase per frase mentre Claude scrive.
   IL TASTO GRANDE
   - testo / voce: un tocco e parli; smetti di parlare e parte da solo (0,9 s di silenzio), oppure tocca di nuovo per
     mandare subito; tenendo premuto parte al rilascio. Mentre pensa o parla: un tocco lo ferma.
   - live: un tocco avvia la conversazione, un tocco la chiude.
   SILENZIO garantito dal codice: "stop", "basta", "zitto" fermano tutto e non arrivano a Claude; se Claude risponde
   "[silenzio]" non esce niente; in "finché non ti chiamo" si riparte solo dicendo "Segretario".

   La pagina di claude.ai la tocca solo il driver (window.VoceDriver). La grafica è la Scena (window.Scena). */
(() => {
"use strict";
const ROOT = document.getElementById("voce-root") || document.body;
const $ = (s) => ROOT.querySelector(s);
const CFG = window.VoceConfig || {};
const D = window.VoceDriver || null;                       // la pagina di claude.ai (assente sulla pagina del Segretario)
const Scena = window.Scena || { stato() {}, livello() {}, bocca() {}, muto() {}, tono() {}, colpo() {} };
const attesa = (ms) => new Promise((r) => setTimeout(r, ms));
const ora = () => performance.now();
const WAKE = /\b(segretari[oa]|secretar(?:y|io|ia))\b/i;
const STOP = /^\s*(stop|basta|zitto|zitta|silenzio|sh+|shut up|quiet|fermati|ok basta|basta così)[\s.!,]*$/i;
const SUFFISSO = " (rispondi subito e in breve; strumenti solo se indispensabili)";
const SENZA_SEGNI = " (rispondi subito e in breve; strumenti solo se indispensabili; niente segni di tono tra parentesi quadre: ti legge la voce di Claude)";

const S = { modo: "voce", fase: "riposo", muto: false, hal: false, lingua: "it-IT", turno: 0, richiesta: null, liveOn: false, voce: "", storia: [], avviato: false };
try { const m = localStorage.getItem("voce.modo"); if (["testo", "voce", "live"].includes(m)) S.modo = m; } catch (_) {}
try { S.lingua = localStorage.getItem("voce.lingua") || CFG.lingua || "it-IT"; } catch (_) {}
try { S.hal = localStorage.getItem("voce.hal") === "1"; } catch (_) {}
try { S.storia = JSON.parse(sessionStorage.getItem("voce.storia") || "[]").slice(-30); } catch (_) { S.storia = []; }
const salva = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
function ricorda(chi, testo) { S.storia.push({ chi, testo }); S.storia = S.storia.slice(-30); try { sessionStorage.setItem("voce.storia", JSON.stringify(S.storia)); } catch (_) {} }

// ------------------------------------------------------------------ diario tecnico (lo legge chi fa i test)
const diario = [];
function log(s) { diario.push(Math.round(ora()) + " " + s); if (diario.length > 60) diario.shift(); ROOT.dataset.log = diario.join("\n"); }

// ------------------------------------------------------------------ stato a video
function fase(f) {
  if (S.fase !== f) log("fase " + f);
  S.fase = f; ROOT.dataset.fase = f;
  Scena.stato(S.muto ? "dorme" : f);
  if (f !== "parlo") { S.voce = ""; Scena.tono("neutro"); }
  etichetta();
}
function setMuto(m) { S.muto = !!m; ROOT.dataset.muto = m ? "1" : ""; Scena.muto(!!m); Scena.stato(m ? "dorme" : S.fase); etichetta(); }
let premuto = 0;                                              // quando Ema ha messo il dito sul tasto (0 = non lo sta premendo)
/* Lo stato a colpo d'occhio: il colore e l'icona del tasto, e la striscia sotto che scorre sulla scritta giusta.
   data-st: riposo (grigio, microfono sbarrato) | ascolto (rosso, registra) | penso (ambra) | parlo (chiaro) | spento. */
function etichetta() {
  const b = $("#parla"), l = $(".cmd .l"); if (!b || !l) return;
  const live = S.modo === "live", on = Nativo.attivo || S.liveOn;
  const spento = S.muto || (Nativo.attivo && Nativo.micSpento);
  const st = spento ? "spento" : (live && !on) ? "riposo" : S.fase === "ascolto" || S.fase === "penso" || S.fase === "parlo" ? S.fase : "riposo";
  const tenuto = !live && Mic.attivo && Mic.modo === "tap" && premuto && ora() - premuto > 450;
  const T = live ? {
    riposo: "LIVE SPENTO · TOCCA PER INIZIARE", ascolto: "TI ASCOLTO · TOCCA PER CHIUDERE", penso: "PENSA · TOCCA PER CHIUDERE", parlo: "PARLA · TOCCA PER CHIUDERE",
    spento: S.muto ? "IN SILENZIO · DI' «SEGRETARIO»" : "MICROFONO SPENTO · TOCCA PER CHIUDERE",
  } : {
    riposo: "MICROFONO SPENTO · TOCCA E PARLA", ascolto: tenuto ? "REGISTRO · RILASCIA PER INVIARE" : "REGISTRO · TOCCA PER INVIARE",
    penso: "PENSA · TOCCA PER FERMARE", parlo: "PARLA · TOCCA PER FERMARE", spento: "IN SILENZIO · DI' «SEGRETARIO»",
  };
  let n = l.querySelector(".nastro");
  if (!n) { l.textContent = ""; n = document.createElement("div"); n.className = "nastro"; ["riposo", "ascolto", "penso", "parlo", "spento"].forEach((k) => { const sp = document.createElement("span"); sp.dataset.k = k; if (k === "ascolto") sp.className = "rec"; n.append(sp); }); l.append(n); }
  n.querySelectorAll("span").forEach((sp) => { const t = T[sp.dataset.k] || ""; if (sp.textContent !== t) sp.textContent = t; });
  ROOT.dataset.st = st;
  ROOT.dataset.ic = st === "riposo" || st === "spento" ? "off" : (!live && (st === "penso" || st === "parlo")) ? "stop" : "mic";
  b.setAttribute("aria-pressed", (live ? on : S.fase === "ascolto") ? "true" : "false");
  b.setAttribute("aria-label", T[st]);
}

// ------------------------------------------------------------------ le righe (sottotitoli / colonna di lettura)
const righe = [];
function riga(chi, testo, cls) {
  const box = $("#righe"); if (!box) return null;
  const el = document.createElement("p"); el.className = `riga ${chi} ${cls || ""}`;
  const tag = document.createElement("span"); tag.className = "chi"; tag.textContent = chi === "ema" ? "TU" : chi === "seg" ? "SEGRETARIO" : "·";
  const t = document.createElement("span"); t.className = "t"; t.textContent = testo || "";
  el.append(tag, t); box.append(el); righe.push(el);
  const max = S.modo === "testo" ? 40 : 5;
  while (righe.length > max) righe.shift().remove();
  box.scrollTop = box.scrollHeight;
  return el;
}
function togli(el) { if (!el) return; const i = righe.indexOf(el); if (i >= 0) righe.splice(i, 1); el.remove(); }
function avviso(testo) { log("avviso: " + testo); riga("sys", testo, "err"); }
/* La riga di una risposta: si ridisegna a ogni pezzo di testo che arriva; ricorda la frase evidenziata. */
function nuovaRisposta() {
  let el = null, corrente = -1;
  return {
    mostra(segmenti) {
      if (!segmenti || !segmenti.length) return;
      if (!el) el = riga("seg", "");
      if (!el) return;
      const t = el.querySelector(".t"); t.textContent = "";
      segmenti.forEach((sg, n) => {
        const sp = document.createElement("span"); sp.className = `fr ${sg.tono}` + (n === corrente ? " ora" : ""); sp.dataset.i = n;
        let pos = 0;
        for (const [a, b] of sg.enfasi || []) { if (a > pos) sp.append(sg.testo.slice(pos, a)); const em = document.createElement("em"); em.textContent = sg.testo.slice(a, b); sp.append(em); pos = b; }
        sp.append(sg.testo.slice(pos) + " "); t.append(sp);
      });
      const box = $("#righe"); if (box) box.scrollTop = box.scrollHeight;
    },
    evidenzia(i) {
      corrente = i; if (!el) return;
      let viva = null; el.querySelectorAll(".fr").forEach((f) => { const on = +f.dataset.i === i; f.classList.toggle("ora", on); if (on) viva = f; });
      const box = $("#righe");                               // risposta lunga: scorre da sola sulla frase che sta dicendo
      if (viva && box && box.scrollHeight > box.clientHeight + 4) { const r = viva.getBoundingClientRect(), q = box.getBoundingClientRect(); box.scrollTo({ top: box.scrollTop + (r.top - q.top) - (box.clientHeight - r.height) / 2, behavior: "smooth" }); }
    },
    rimuovi() { togli(el); el = null; },
  };
}
function ridisegnaStoria() {
  const box = $("#righe"); if (!box) return;
  box.textContent = ""; righe.length = 0;
  S.storia.slice(S.modo === "testo" ? -20 : -2).forEach((x) => riga(x.chi, x.testo, "vecchia"));
}

// ------------------------------------------------------------------ dal testo di Claude alle frasi con il loro tono
const TONI = { "!": "forte", "?": "domanda", "~": "calmo", "+": "bene", "-": "male" };
function frasi(t) {
  const out = []; let a = 0;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === "\n") { out.push(t.slice(a, i)); a = i + 1; }
    else if (".!?…".includes(c)) {
      let j = i; while (j + 1 < t.length && ".!?…".includes(t[j + 1])) j++;
      const dopo = t[j + 1];
      if (dopo === undefined || /\s/.test(dopo)) { out.push(t.slice(a, j + 1)); a = j + 1; }
      i = j;
    }
  }
  if (a < t.length) out.push(t.slice(a));
  return out.filter((x) => x.trim());
}
function segmenta(grezzo, parole) {
  let s = String(grezzo || "").replace(/ /g, " ").trim();
  if (/^\[\s*silenzio[^\]]*\]\.?$/i.test(s)) return { silenzio: /finch/i.test(s) ? "finche_chiamato" : "turno", segmenti: [], testo: "" };
  s = s.replace(/\[[^\]]{0,24}$/, "");                     // un segno ancora aperto in coda (testo che sta arrivando)
  const pezzi = []; let tono = "neutro", pos = 0, m; const re = /\[([!?~+\-])\]/g;
  while ((m = re.exec(s))) { pezzi.push([tono, s.slice(pos, m.index)]); tono = TONI[m[1]]; pos = re.lastIndex; }
  pezzi.push([tono, s.slice(pos)]);
  const segmenti = [];
  for (const [t0, blocco] of pezzi) {
    frasi(blocco).forEach((f, n) => {
      const testo = f.replace(/\*/g, "").replace(/\s+/g, " ").trim(); if (!testo) return;
      let t = n ? "neutro" : t0;
      if (t === "neutro") t = /\?["»”)]*$/.test(testo) ? "domanda" : /!["»”)]*$/.test(testo) ? "forte" : "neutro";
      let enf = [];
      (parole || []).forEach((w) => { const i = testo.indexOf(w); if (i >= 0) enf.push([i, i + w.length]); });
      enf.sort((x, y) => x[0] - y[0]); enf = enf.filter((x, i) => i === 0 || x[0] >= enf[i - 1][1]);
      segmenti.push({ testo, tono: t, enfasi: enf });
    });
  }
  return { segmenti, testo: segmenti.map((x) => x.testo).join(" ") };
}
function linguaDi(t) {
  const it = (t.match(/\b(il|lo|la|che|di|non|sono|per|una|hai|alle|oggi|domani|è|e|ti|mi)\b/gi) || []).length;
  const en = (t.match(/\b(the|you|is|are|have|to|and|of|today|tomorrow|your|it|this)\b/gi) || []).length;
  return en > it ? "en" : "it";
}

// ------------------------------------------------------------------ quanto forte parlano (misurato dal tap sulla pagina)
const html = document.documentElement;
const audioClaude = () => parseFloat(html.getAttribute("data-voce-out") || "0") || 0;
const audioMic = () => parseFloat(html.getAttribute("data-voce-mic") || "0") || 0;

// ------------------------------------------------------------------ HAL: la voce del PC (voce-pc, porta 8768)
const Hal = {
  url: CFG.neurale || "http://127.0.0.1:8768", pronto: false, giro: 0, actx: null, an: null, buf: null, src: null, ctl: null,
  async get(via, ms) { const r = await fetch(this.url + via, { signal: AbortSignal.timeout(ms || 2000) }); return r.json(); },
  disegna(stato, p) {
    const b = $("#hal"); if (!b) return;
    b.setAttribute("aria-pressed", S.hal ? "true" : "false");
    b.classList.toggle("carica", stato === "carica");
    b.style.setProperty("--p", stato === "carica" ? String(Math.max(0.04, p || 0)) : "0");
    b.textContent = stato === "carica" ? "HAL " + Math.round(Math.max(0.04, p || 0) * 100) + "%" : S.hal && this.pronto ? "HAL ON" : "HAL OFF";
    ROOT.dataset.hal = !S.hal ? "spento" : stato === "carica" ? "carica" : this.pronto ? "pronto" : "spento";
  },
  /* A che punto è il caricamento (0..1): il programma della voce dice in che fase è e da quanti secondi. */
  progresso(p) {
    const d = +p.da_s || 0;
    return p.carico === "modello" ? Math.min(0.6, d / 14 * 0.6) : p.carico === "riscaldamento" ? 0.6 + Math.min(0.2, d / 6 * 0.2) : p.carico === "prova" ? 0.8 + Math.min(0.19, d / 5 * 0.19) : 0.04;
  },
  /* HAL ON: avvia il programma della voce (attraverso l'estensione), aspetta che risponda, carica il modello. */
  async accendi() {
    const io = ++this.giro; this.pronto = false; this.disegna("carica", 0.02); log("hal accendi");
    const rinuncia = (msg) => { if (io !== this.giro) return; S.hal = false; salva("voce.hal", "0"); this.spegni(); avviso(msg); };
    let avvio = null;
    if (typeof CFG.halAvvia === "function") {
      avvio = await CFG.halAvvia(); log("hal programma: " + JSON.stringify(avvio));
      if (io !== this.giro || !S.hal) return;
    }
    // il programma impiega 2-5 s a rispondere dopo l'avvio
    const t0 = ora(); let su = false;
    while (ora() - t0 < (avvio && avvio.ok ? 30000 : 2500)) {
      try { await this.get("/pronto", 1500); su = true; break; } catch (_) {}
      if (io !== this.giro || !S.hal) return;
      this.disegna("carica", 0.02 + Math.min(0.03, (ora() - t0) / 30000 * 0.03));
      await attesa(400);
    }
    if (!su) {
      const nonInstallato = avvio && !avvio.ok && /not found|non trovat|forbidden|not allowed|native messaging/i.test(avvio.errore || "");
      rinuncia(nonInstallato
        ? "HAL non riesce ad avviarsi: il collegamento tra Chrome e il programma della voce non è installato. Intanto parla Claude."
        : "HAL non riesce ad avviarsi" + (avvio && avvio.errore ? " (" + avvio.errore + ")" : "") + ". Intanto parla Claude.");
      return;
    }
    try {
      const p = await this.get("/pronto"); if (p.pronto) { if (io === this.giro) { this.pronto = true; this.disegna(); log("hal già pronto"); } return; }
      const a = await this.get("/accendi", 6000);
      if (a && a.acceso === false) {
        log("hal rifiutato: " + a.motivo);
        rinuncia("HAL non può partire adesso: la scheda video è quasi piena (di solito è Resolve aperto). Parla Claude. Riprova quando chiudi Resolve.");
        return;
      }
    } catch (_) { rinuncia("Il programma della voce HAL si è fermato. Intanto parla Claude."); return; }
    for (let i = 0; i < 200; i++) {
      if (io !== this.giro || !S.hal) return;
      try {
        const p = await this.get("/pronto", 1500);
        if (p.pronto) { this.pronto = true; this.disegna(); log("hal pronto"); riga("sys", "HAL è pronto.", "piano"); return; }
        this.disegna("carica", this.progresso(p));
        if (p.motivo === "lento") {
          log("hal rifiutato: lento " + p.tempo_s + " s per " + p.voce_s + " s di voce");
          rinuncia("HAL è troppo lento adesso: la scheda video è occupata (di solito è Resolve aperto). Parla Claude. Riprova quando chiudi Resolve.");
          return;
        }
      } catch (_) {}
      await attesa(700);
    }
    rinuncia("HAL non si è caricato. Intanto parla Claude.");
  },
  /* HAL OFF: il programma della voce si chiude del tutto (non resta niente in memoria né sulla scheda video). */
  spegni() {
    this.giro++; this.pronto = false; this.ferma(); this.disegna(); log("hal spegni");
    if (typeof CFG.halFerma === "function") CFG.halFerma().then((r) => { log("hal fermato: " + JSON.stringify(r)); if (!r || !r.ok) fetch(this.url + "/esci").catch(() => {}); });
    else fetch(this.url + "/esci").catch(() => {});
  },
  audio() {
    if (!this.actx) {
      this.actx = new (window.AudioContext || window.webkitAudioContext)(); this.an = this.actx.createAnalyser(); this.an.fftSize = 512; this.buf = new Float32Array(512);
      let muto = false; try { muto = sessionStorage.getItem("voce.test.muto") === "1"; } catch (_) {}   // solo per le prove: HAL misurato ma non udibile
      if (muto) { const z = this.actx.createGain(); z.gain.value = 0; this.an.connect(z); z.connect(this.actx.destination); } else this.an.connect(this.actx.destination);
    }
    if (this.actx.state === "suspended") this.actx.resume().catch(() => {});
    return this.actx;
  },
  async sintetizza(testo, signal) {
    const r = await fetch(this.url + "/parla", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify({ testo, lingua: linguaDi(testo) }), signal });
    if (!r.ok) throw new Error("HAL " + r.status);
    return this.audio().decodeAudioData(await r.arrayBuffer());
  },
  suona(buffer) {
    return new Promise((fine) => {
      const ctx = this.audio(); const src = ctx.createBufferSource(); src.buffer = buffer; src.connect(this.an); this.src = src;
      src.onended = () => { if (this.src === src) this.src = null; fine(); };
      src.start();
    });
  },
  livello() { if (!this.src || !this.an) return 0; this.an.getFloatTimeDomainData(this.buf); let e = 0; for (let i = 0; i < this.buf.length; i += 2) e += this.buf[i] * this.buf[i]; return Math.sqrt(e / (this.buf.length / 2)); },
  ferma() { if (this.ctl) { try { this.ctl.abort(); } catch (_) {} this.ctl = null; } if (this.src) { try { this.src.stop(); } catch (_) {} } },
  /* Una risposta detta da HAL: le frasi entrano man mano (alimenta), escono in ordine; la prossima si prepara mentre
     questa suona. `finito` si chiude con {parlato, errore}. */
  sessione(mio, R) {
    const coda = [], pronte = new Map(); let presi = 0, fine = false, n = 0, chiudi; const self = this;
    const finito = new Promise((r) => (chiudi = r));
    const ctl = new AbortController(); this.ctl = ctl;
    const prepara = (k) => { if (k < coda.length && !pronte.has(k)) { const p = self.sintetizza(coda[k].testo, ctl.signal); p.catch(() => {}); pronte.set(k, p); } };
    function spezza(sg, idx) {
      // le frasi lunghe si dicono a pezzi, alle virgole: la voce parte prima e non lascia vuoti lunghi tra un pezzo e l'altro
      const pezzi = []; let resto = sg.testo, primo = idx === 0;
      while (resto.length > (primo ? 70 : 100)) {
        const m = primo ? resto.match(/^(.{20,70}?[,;:])\s+(\S.{11,})$/s) : resto.match(/^(.{30,100}[,;:])\s+(\S.{11,})$/s);
        if (!m) break;
        pezzi.push(m[1]); resto = m[2]; primo = false;
      }
      pezzi.push(resto);
      return pezzi.map((testo, k) => ({ testo, tono: sg.tono, idx, enfasi: k === 0 ? (sg.enfasi || []).length : 0 }));
    }
    (async () => {
      let parlato = false;
      try {
        while (true) {
          if (mio !== S.turno) break;
          if (n >= coda.length) { if (fine) break; await attesa(40); continue; }
          prepara(n); prepara(n + 1);
          const audio = await Promise.race([pronte.get(n), attesa(parlato ? 20000 : 9000).then(() => { throw new Error("lento"); })]);
          if (mio !== S.turno) break;
          prepara(n + 1);
          const c = coda[n];
          parlato = true; S.voce = "hal"; if (S.fase !== "parlo") fase("parlo"); S.voce = "hal";
          Scena.tono(c.tono); R.evidenzia(c.idx); if (c.enfasi || c.tono === "forte") Scena.colpo(c.tono === "forte" ? 1 : 0.7);
          await self.suona(audio);
          n++;
        }
        chiudi({ parlato });
      } catch (err) { log("hal errore " + (err && err.message)); try { ctl.abort(); } catch (_) {} chiudi({ parlato, errore: true, lento: !!(err && err.message === "lento") }); }
    })();
    return {
      alimenta(segmenti, ultimo) {
        const fin = ultimo ? segmenti.length : segmenti.length - 1;
        for (let i = presi; i < fin; i++) spezza(segmenti[i], i).forEach((c) => coda.push(c));
        if (fin > presi) presi = fin;
        if (ultimo) fine = true;
        prepara(n); prepara(n + 1);
      },
      finito,
    };
  },
};

// ------------------------------------------------------------------ la voce di Claude: "Leggi ad alta voce" sull'ultima risposta
async function voceClaude(mio, R, segmenti) {
  if (!D) return;
  if (!(await D.leggi())) { log("leggi: tasto assente"); return; }
  if (mio !== S.turno) { D.leggiFerma(); return; }
  log("leggi: avviato");
  const lettere = segmenti.reduce((s, x) => s + x.testo.length, 0) || 1;
  const stima = lettere * 62;                                // ms: la voce di Claude legge ~16 caratteri al secondo
  const t0 = ora(); let partito = 0, zitto = 0;
  while (mio === S.turno) {
    const st = D.leggiStato(), liv = audioClaude();
    if (!partito && (liv > 0.01 || (st === "playing" && ora() - t0 > 1500))) { partito = ora(); S.voce = "claude"; fase("parlo"); S.voce = "claude"; }
    if (partito) {
      // la frase evidenziata e il colore seguono il tempo trascorso
      const frazione = Math.min(0.999, (ora() - partito) / stima); let somma = 0, i = 0;
      for (; i < segmenti.length - 1; i++) { somma += segmenti[i].testo.length; if (somma / lettere > frazione) break; }
      R.evidenzia(i); Scena.tono(segmenti[i].tono);
      if (liv < 0.008) zitto += 80; else zitto = 0;
      if (st !== "playing" && zitto > 500) break;            // ha finito
      if (ora() - partito > stima * 2 + 8000) break;
    } else if (ora() - t0 > 8000) { log("leggi: nessun audio"); break; }
    await attesa(80);
  }
}

// ------------------------------------------------------------------ il microfono (riconoscimento vocale di Chrome)
/* L'orecchio: misura il volume VERO del microfono mentre Chrome trascrive. Serve alle onde attorno al tasto e,
   soprattutto, a capire quando Ema ha davvero finito di parlare: le parole di Chrome arrivano a scatti, e fidarsi
   solo di quelle tagliava le frasi a metà. */
const Orecchio = {
  stream: null, ctx: null, src: null, an: null, buf: null, timer: 0, giro: 0, liv: 0, fondo: 0.004, ultimoSuono: 0, ok: false, finto: 0, t0: 0, picco: 0, sentito: false,
  async apri() {
    this.chiudi(); const io = this.giro; this.t0 = this.ultimoSuono = ora(); this.sentito = false;
    if (this.finto) { this.ok = true; this.timer = setInterval(() => this.misura(), 50); return; }   // solo nelle prove
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (io !== this.giro) { st.getTracks().forEach((t) => t.stop()); return; }
      const c = this.ctx && this.ctx.state !== "closed" ? this.ctx : (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
      if (c.state === "suspended") c.resume().catch(() => {});
      this.stream = st; this.src = c.createMediaStreamSource(st); this.an = c.createAnalyser(); this.an.fftSize = 1024; this.buf = new Float32Array(1024);
      this.src.connect(this.an); this.ok = true; this.ultimoSuono = ora(); this.picco = 0;
      log("orecchio: aperto");
      this.timer = setInterval(() => this.misura(), 50);
    } catch (err) { this.ok = false; log("orecchio: non disponibile (" + (err && err.name) + ")"); }
  },
  misura() {
    let v = 0;
    if (this.finto) v = ora() - this.t0 < this.finto ? 0.08 : 0.001;
    else if (this.an) { this.an.getFloatTimeDomainData(this.buf); let e = 0; for (let i = 0; i < this.buf.length; i += 2) e += this.buf[i] * this.buf[i]; v = Math.sqrt(e / (this.buf.length / 2)); }
    this.liv = v; if (v > this.picco) this.picco = v;
    // il rumore di fondo della stanza: scende subito, sale piano e solo con suoni deboli (la voce non lo sposta)
    if (v < this.fondo) this.fondo = this.fondo * 0.8 + v * 0.2; else if (v < this.fondo * 2.5) this.fondo = this.fondo * 0.99 + v * 0.01;
    if (v > Math.max(0.006, this.fondo * 4)) { this.ultimoSuono = ora(); this.sentito = true; }
  },
  chiudi() {
    if (this.ok && !this.finto) log("orecchio: chiuso, picco " + this.picco.toFixed(3) + " fondo " + this.fondo.toFixed(4));
    this.giro++; clearInterval(this.timer); this.timer = 0; this.ok = false; this.liv = 0;
    if (this.src) { try { this.src.disconnect(); } catch (_) {} this.src = null; }
    if (this.stream) { try { this.stream.getTracks().forEach((t) => t.stop()); } catch (_) {} this.stream = null; }
    this.an = null;
  },
};
const Mic = {
  Classe: window.SpeechRecognition || window.webkitSpeechRecognition || null,
  rec: null, attivo: false, modo: "", finale: "", parziale: "", guardia: 0, el: null, giro: 0, impulso: 0, corti: 0, t0: 0, ultimoRis: 0, rilasciato: 0, riavvii: 0,
  avvia(modo) {
    if (this.attivo) return;
    if (CFG.stt === "esterno" && typeof CFG.avviaAscolto === "function") { this.attivo = true; this.modo = modo; this.esterno = true; this.finale = ""; this.parziale = ""; this.el = null; fase("ascolto"); try { CFG.avviaAscolto(modo, S.lingua); } catch (_) { this.attivo = false; fase("riposo"); } return; }
    if (!this.Classe) { avviso("Questo browser non ha il riconoscimento vocale: usa Chrome, oppure scrivi nel campo in basso."); return; }
    this.attivo = true; this.esterno = false; this.modo = modo; this.finale = ""; this.parziale = ""; this.el = null; this.t0 = this.ultimoRis = ora(); this.riavvii = 0;
    if (!this.apriRec()) return;
    Orecchio.apri();
    clearInterval(this.guardia); this.guardia = setInterval(() => this.controlla(), 100);
    log("mic avvia " + modo + " " + S.lingua);
    fase("ascolto");
  },
  apriRec() {
    const io = ++this.giro; const rec = new this.Classe();
    rec.lang = S.lingua; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    this.rec = rec;
    rec.onresult = (e) => {
      if (io !== this.giro) return;
      let fin = "", tmp = "";
      for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) fin += r[0].transcript + " "; else tmp += r[0].transcript; }
      if (fin) this.finale += fin;
      this.parziale = tmp; this.impulso = 1; this.ultimoRis = ora();
      this.aggiorna();
    };
    rec.onerror = (e) => {
      if (io !== this.giro) return;
      log("mic errore " + e.error);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") { S.liveOn = false; avviso("Microfono negato: in Chrome clicca l'icona a sinistra dell'indirizzo, poi Microfono, poi Consenti."); }
      else if (e.error === "audio-capture") { S.liveOn = false; avviso("Non trovo nessun microfono collegato."); }
      else if (e.error === "network") avviso("Il riconoscimento vocale di Chrome non risponde (rete).");
    };
    rec.onend = () => {
      if (io !== this.giro) return;                          // chiuso da noi: già gestito
      const t = this.testo(); const durata = ora() - this.t0;
      // Chrome a volte chiude il riconoscimento da solo: se Ema sta ancora parlando si riapre e la frase continua
      const parlava = Orecchio.ok && Orecchio.sentito && !Orecchio.finto && ora() - Orecchio.ultimoSuono < 1200;
      if (parlava && this.riavvii < 4 && this.modo !== "rilascio") {
        this.riavvii++; this.finale = t ? t + " " : ""; this.parziale = ""; log("mic: Chrome ha chiuso mentre parlavi, riapro");
        if (this.apriRec()) return;
      }
      this.chiudi(false);
      log("mic fine da solo, testo=" + (t ? "sì" : "no"));
      if (t) { this.corti = 0; ricevuto(t, true); return; }
      this.corti = durata < 1500 ? this.corti + 1 : 0;        // se muore subito più volte di fila, non insistere
      if (this.corti >= 4) { this.corti = 0; S.liveOn = false; avviso("Il microfono si chiude da solo: riprova tra un momento."); }
      fase("riposo"); riprendi();
    };
    try { rec.start(); return true; } catch (err) { this.chiudi(true); avviso("Non riesco ad aprire il microfono: " + err.message); return false; }
  },
  testo() { return (this.finale + " " + this.parziale).replace(/\s+/g, " ").trim(); },
  aggiorna() {
    const t = this.testo(); if (!t) return;
    if (!this.el) this.el = riga("ema", "", "prov");
    if (this.el) { this.el.querySelector(".t").textContent = t; const box = $("#righe"); if (box) box.scrollTop = box.scrollHeight; }
  },
  /* Ogni 0,1 s: è ora di inviare? Sì quando c'è del testo e Ema tace DAVVERO da 1,7 s (lo dice il volume del microfono,
     non le parole di Chrome). Senza misura del volume: 2 s dall'ultima parola. Tenuto premuto: decide il rilascio. */
  controlla() {
    if (!this.attivo || this.esterno) return;
    const adesso = ora();
    if (this.modo === "rilascio") { if (adesso - this.rilasciato > 350 && (adesso - this.ultimoRis > 300 || adesso - this.rilasciato > 1500)) this.consegna(); return; }
    if (!this.testo()) return;
    if (this.modo === "tap" && premuto && adesso - premuto > 450) return;
    const daRis = adesso - this.ultimoRis;
    // la misura del volume vale solo se ha sentito davvero la voce (microfono molto basso = non fidarsi)
    if (Orecchio.ok && Orecchio.sentito) { if ((adesso - Orecchio.ultimoSuono > 1700 && daRis > 700) || daRis > 4500) this.consegna(); }
    else if (daRis > 2000) this.consegna();
  },
  rilascio() { if (!this.attivo) return; this.modo = "rilascio"; this.rilasciato = ora(); },
  consegna() {
    if (!this.attivo) return;
    const t = this.testo(); this.chiudi(true);
    log("mic consegna: " + t.length + " caratteri");
    if (t) { this.corti = 0; ricevuto(t, true); } else { fase("riposo"); riprendi(); }
  },
  annulla() { if (!this.attivo) return; this.chiudi(true); if (S.fase === "ascolto") fase("riposo"); },
  chiudi(abort) {
    clearInterval(this.guardia); this.guardia = 0; this.giro++; this.attivo = false;
    togli(this.el); this.el = null;
    if (this.esterno) { try { if (CFG.fermaAscolto) CFG.fermaAscolto(); } catch (_) {} return; }
    Orecchio.chiudi();
    const r = this.rec; this.rec = null;
    if (r && abort) { try { r.abort(); } catch (_) {} }
  },
};
/* Il riconoscimento esterno (app Android) consegna qui. */
function testoRiconosciuto(t, parziale) {
  if (!Mic.attivo || !Mic.esterno) return;
  if (parziale) { Mic.finale = ""; Mic.parziale = String(t || ""); Mic.impulso = 1; if (!Mic.el && Mic.parziale) Mic.el = riga("ema", "", "prov"); if (Mic.el) Mic.el.querySelector(".t").textContent = Mic.parziale; return; }
  Mic.attivo = false; togli(Mic.el); Mic.el = null;
  t = String(t || "").trim(); if (t) ricevuto(t, true); else { fase("riposo"); riprendi(); }
}
/* In live con HAL il microfono riparte da solo dopo ogni scambio. */
function riprendi() {
  if (!(S.modo === "live" && S.liveOn && !Nativo.attivo)) return;
  setTimeout(() => { if (S.modo === "live" && S.liveOn && !Nativo.attivo && !ROOT.hidden && S.fase === "riposo" && !Mic.attivo) Mic.avvia("live"); }, 300);
}

// ------------------------------------------------------------------ live con la modalità vocale di claude.ai
const Nativo = {
  attivo: false, timer: 0, base: 0, posUt: 0, elUt: null, testoUt: "", posAss: 0, R: null, testo: "", chiuso: true, t0: 0, parlaFino: 0, micSpento: false,
  avvia() {
    if (this.attivo || !D) return;
    interrompi(); Mic.annulla();
    if (!D.vocale.avvia()) { avviso("Non trovo il tasto della modalità vocale di claude.ai: apri una chat e riprova."); return; }
    this.attivo = true; this.base = D.totale(); this.posUt = 0; this.elUt = null; this.posAss = 0; this.R = null; this.testo = ""; this.chiuso = true; this.t0 = ora(); this.micSpento = false;
    log("nativo avvia, base=" + this.base);
    fase("ascolto");
    this.timer = setInterval(() => this.tick(), 150);
  },
  ferma() {
    if (!this.attivo) return;
    this.attivo = false; clearInterval(this.timer); log("nativo ferma");
    try { D.vocale.ferma(); } catch (_) {}
    fase("riposo");
  },
  mic() { if (!this.attivo) return; this.micSpento = !this.micSpento; D.vocale.microfono(!this.micSpento); etichetta(); },
  tick() {
    if (!this.attivo) return;
    if (!D.vocale.attivo()) {
      if (ora() - this.t0 > 2500) { this.attivo = false; clearInterval(this.timer); log("nativo: chiuso da claude.ai"); fase("riposo"); }
      return;
    }
    // cosa ha detto Ema (la trascrizione compare come messaggio)
    const uu = D.ultimoUtente();
    if (uu && uu.pos > this.base) {
      const t = D.testoDi(uu).testo;
      if (uu.pos !== this.posUt) { this.posUt = uu.pos; this.testoUt = t; this.elUt = riga("ema", t); if (t) ricorda("ema", t); }
      else if (t !== this.testoUt && this.elUt) { this.testoUt = t; this.elUt.querySelector(".t").textContent = t; }
    }
    // cosa risponde Claude
    const ua = D.ultimoAssistente(); const scrive = D.scrive(ua);
    if (ua && ua.pos > this.base) {
      if (ua.pos !== this.posAss) { this.posAss = ua.pos; this.R = nuovaRisposta(); this.testo = ""; this.chiuso = false; }
      if (!this.chiuso) {
        const d = D.testoDi(ua);
        if (d.testo && d.testo !== this.testo) { this.testo = d.testo; const s = segmenta(d.testo, d.enfasi); this.R.mostra(s.segmenti); const u = s.segmenti[s.segmenti.length - 1]; if (u) this.tono = u.tono; }
        else if (!scrive && this.testo) { this.chiuso = true; ricorda("seg", segmenta(this.testo).testo); }
      }
    }
    // chi parla: si sente dall'audio vero di Claude
    const liv = audioClaude();
    if (liv > 0.012) this.parlaFino = ora() + 1200;   // le pause tra una frase e l'altra non sono "pensare"
    if (ora() < this.parlaFino) { if (S.fase !== "parlo") fase("parlo"); S.voce = "claude"; Scena.tono(this.tono || "neutro"); }
    else if (scrive || D.vocale.elabora()) { if (S.fase !== "penso") fase("penso"); }
    else if (S.fase !== "ascolto") fase("ascolto");
  },
};

// ------------------------------------------------------------------ una frase di Ema (dal microfono o dalla tastiera)
function ricevuto(testo, daVoce) {
  testo = String(testo || "").trim();
  if (!testo) { fase("riposo"); riprendi(); return; }
  log("ricevuto (" + (daVoce ? "voce" : "tastiera") + "): " + testo.slice(0, 60));
  if (STOP.test(testo)) { interrompi(); riga("ema", testo, "piano"); fase("riposo"); riprendi(); return; }
  if (S.muto) {
    if (!WAKE.test(testo)) { riga("ema", testo, "piano"); fase("riposo"); riprendi(); return; }   // resta qui: non parte niente
    setMuto(false);
    const resto = testo.replace(WAKE, "").replace(/^[\s,.!?:;-]+/, "").trim();
    if (resto.split(/\s+/).filter(Boolean).length < 3) { riga("ema", testo); locale("Sono qui."); return; }
  }
  domanda(testo);
}
/* Una risposta che non passa da Claude ("Sono qui."). */
async function locale(testo) {
  interrompi(); const mio = S.turno; const R = nuovaRisposta(); const seg = segmenta(testo).segmenti; R.mostra(seg);
  if (S.modo !== "testo" && S.hal && Hal.pronto) { const s = Hal.sessione(mio, R); s.alimenta(seg, true); await s.finito; }
  else Scena.colpo(0.8);
  if (mio === S.turno) fineTurno();
}
async function domanda(testo) {
  if (Nativo.attivo) Nativo.ferma();
  interrompi(); Mic.annulla();
  const mio = S.turno; const ctl = new AbortController(); S.richiesta = ctl;
  riga("ema", testo); ricorda("ema", testo);
  fase("penso");
  const R = nuovaRisposta();
  const parla = S.modo !== "testo";
  const conHal = parla && S.hal && Hal.pronto;
  const hal = conHal ? Hal.sessione(mio, R) : null;
  let esito;
  try {
    if (D) {
      const prima = D.totale();
      await D.invia("[voce] " + testo + (parla && !conHal ? SENZA_SEGNI : SUFFISSO), ctl.signal);
      log("inviato, prima=" + prima);
      esito = await D.attendiRisposta(prima, (d) => {
        if (mio !== S.turno) return;
        const s = segmenta(d.testo, d.enfasi); if (s.silenzio || !s.segmenti.length) return;
        R.mostra(s.segmenti); if (hal) hal.alimenta(s.segmenti, false);
      }, ctl.signal);
    } else {
      const r = await fetch("voce/parla", { method: "POST", signal: ctl.signal, credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ testo, storia: [] }) });
      const j = await r.json().catch(() => ({ errore: "Risposta illeggibile." }));
      esito = j.silenzio ? { testo: "[silenzio" + (j.silenzio === "finche_chiamato" ? ": finché chiamato" : "") + "]" } : j;
    }
  } catch (err) { esito = { errore: err && err.name === "AbortError" ? "annullato" : (err && err.message) || "Errore." }; }
  if (mio !== S.turno) return;
  S.richiesta = null;
  if (esito.errore) { if (esito.errore !== "annullato") avviso(esito.errore); Hal.ferma(); fineTurno(); return; }
  const s = segmenta(esito.testo, esito.enfasi);
  log("risposta: " + s.testo.length + " caratteri" + (s.silenzio ? " (silenzio)" : ""));
  if (s.silenzio) { R.rimuovi(); Hal.ferma(); if (s.silenzio === "finche_chiamato") setMuto(true); fineTurno(); return; }   // davvero zitto
  if (!s.segmenti.length) { fineTurno(); return; }
  R.mostra(s.segmenti); ricorda("seg", s.testo);
  if (!parla) { fineTurno(); return; }
  let detto = false;
  if (hal) {
    hal.alimenta(s.segmenti, true); const f = await hal.finito; detto = f.parlato; if (mio !== S.turno) return;
    if (f.errore && !f.parlato) {
      // HAL non ce la fa (scheda video occupata o programma fermo): si spegne da solo e parla Claude, subito
      S.hal = false; salva("voce.hal", "0"); Hal.spegni();
      avviso(f.lento ? "HAL è troppo lento adesso: la scheda video è occupata (di solito è Resolve). L'ho spento, parla Claude." : "HAL non risponde: l'ho spento, parla Claude.");
    }
  }
  if (!detto) {
    if (typeof CFG.parlaEsterno === "function") await voceEsterna(mio, R, s.segmenti);
    else await voceClaude(mio, R, s.segmenti);
    if (mio !== S.turno) return;
  }
  R.evidenzia(-1);
  fineTurno();
}
function fineTurno() { fase("riposo"); riprendi(); }
/* La voce di un'app che ospita la Voce (Android): una frase alla volta, l'app chiama Voce.parlatoFinito(). */
let esternoFine = null;
function parlatoFinito() { const f = esternoFine; esternoFine = null; if (f) f(); }
async function voceEsterna(mio, R, segmenti) {
  S.voce = "esterna"; fase("parlo"); S.voce = "esterna";
  for (let i = 0; i < segmenti.length && mio === S.turno; i++) {
    R.evidenzia(i); Scena.tono(segmenti[i].tono);
    await new Promise((fine) => { esternoFine = fine; try { CFG.parlaEsterno(segmenti[i].testo, linguaDi(segmenti[i].testo)); } catch (_) { fine(); } });
  }
}
/* Ferma tutto quello che è in corso: richiesta, generazione, voce. Non tocca il microfono né la modalità vocale. */
function interrompi() {
  S.turno++;
  if (S.richiesta) { try { S.richiesta.abort(); } catch (_) {} S.richiesta = null; }
  Hal.ferma();
  if (D) { try { D.leggiFerma(); D.fermaRisposta(); } catch (_) {} }
  if (typeof CFG.zittisciEsterno === "function") { try { CFG.zittisciEsterno(); } catch (_) {} }
  if (esternoFine) parlatoFinito();
}

// ------------------------------------------------------------------ bocca e onde, a ogni fotogramma
let bocca = 0, onda = 0;
const Onde = { sx: [...ROOT.querySelectorAll(".barre.sx i")], dx: [...ROOT.querySelectorAll(".barre.dd i")], b: $("#parla"), h: new Array(9).fill(0), t: 0, liv: 0, acceso: false };
(function ciclo(t) {
  if (!ROOT.hidden) {
    let b = 0;
    if (S.fase === "parlo") b = S.voce === "hal" ? Hal.livello() * 8 : S.voce === "claude" ? audioClaude() * 9 : 0.3 + 0.4 * Math.abs(Math.sin(t / 95));
    bocca = b > bocca ? b : bocca * 0.7 + b * 0.3;
    Scena.bocca(Math.min(1, bocca));
    let m = 0;
    if (S.fase === "ascolto") { m = Nativo.attivo ? audioMic() * 9 : Orecchio.ok ? Math.min(1, Orecchio.liv * 9) : Mic.impulso; }
    Mic.impulso *= 0.9;
    onda = m > onda ? m : onda * 0.85 + m * 0.15;
    Scena.livello(Math.min(1, onda));
    // le onde attorno al tasto: quando registra entrano (da fuori verso il tasto), quando parla escono
    const st = ROOT.dataset.st, vivo = st === "ascolto" || st === "parlo";
    if ((vivo || Onde.acceso) && Onde.sx.length === 9 && Onde.dx.length === 9) {
      const v = st === "ascolto" ? Math.max(0.07 + 0.04 * Math.sin(t / 260), Math.min(1, onda)) : st === "parlo" ? Math.min(1, bocca) : 0;
      if (Math.abs(v - Onde.liv) > 0.02) { Onde.liv = v; Onde.b.style.setProperty("--liv", v.toFixed(2)); }
      if (t - Onde.t > 55) {
        Onde.t = t; Onde.h.unshift(v); Onde.h.pop();
        const dentro = st !== "parlo"; let somma = 0;
        for (let k = 0; k < 9; k++) {
          const mossa = 0.72 + 0.28 * Math.sin(k * 1.9 + t / 80);
          Onde.sx[k].style.transform = "scaleY(" + Math.max(0.05, Math.pow(Onde.h[dentro ? k : 8 - k], 0.7) * mossa).toFixed(3) + ")";
          Onde.dx[k].style.transform = "scaleY(" + Math.max(0.05, Math.pow(Onde.h[dentro ? 8 - k : k], 0.7) * mossa).toFixed(3) + ")";
          somma += Onde.h[k];
        }
        Onde.acceso = vivo || somma > 0.01;
      }
    }
  }
  requestAnimationFrame(ciclo);
})(0);

// ------------------------------------------------------------------ i comandi
function giu(e) {
  if (e) e.preventDefault();
  if (ROOT.hidden) return;
  if (S.modo === "live") {
    if (Nativo.attivo) { Nativo.ferma(); etichetta(); return; }
    if (S.liveOn) { S.liveOn = false; interrompi(); Mic.annulla(); fase("riposo"); return; }
    if (D && !(S.hal && Hal.pronto)) { Nativo.avvia(); etichetta(); return; }       // voce di Claude: la sua modalità vocale
    S.liveOn = true; Mic.avvia("live"); etichetta(); return;                        // HAL: il nostro giro
  }
  if (S.fase === "penso" || S.fase === "parlo") { interrompi(); fase("riposo"); return; }
  if (Mic.attivo) { Mic.consegna(); return; }                                       // secondo tocco: manda subito
  premuto = ora(); Mic.avvia("tap");
  setTimeout(etichetta, 480);                                                       // se lo tiene premuto la scritta diventa "rilascia per inviare"
}
function su() {
  if (S.modo === "live" || !Mic.attivo || Mic.modo !== "tap" || !premuto) return;
  if (ora() - premuto > 450) Mic.rilascio();                                        // tenuto premuto: parte al rilascio
  premuto = 0; etichetta();
}
function setModo(m) {
  interrompi(); Mic.annulla(); if (Nativo.attivo) Nativo.ferma(); S.liveOn = false;
  S.modo = m; salva("voce.modo", m); ROOT.dataset.modo = m;
  ROOT.querySelectorAll("[data-m]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.m === m ? "true" : "false"));
  ridisegnaStoria(); fase("riposo");
}
/* Quanto è occupata la scheda video: lo dice il programma della voce sul PC. Rossa = un altro programma la sta usando. */
const Gpu = {
  timer: 0, fallite: 0, salta: 0,
  async giro() {
    const el = $("#gpu"); if (!el || ROOT.hidden) return;
    if (this.salta > 0) { this.salta--; return; }
    try {
      const g = await Hal.get("/gpu", 1500); if (!g || !(g.uso >= 0) || !g.totale_mb) throw new Error("niente");
      this.fallite = 0;
      const caldo = g.uso >= 85 || g.totale_mb - g.usata_mb < 700;
      el.hidden = false; el.classList.toggle("caldo", caldo);
      $("#gpu-n").textContent = g.uso + "%"; el.querySelector("u").style.setProperty("--g", (g.uso / 100).toFixed(2));
      $("#gpu-m").textContent = (g.usata_mb / 1024).toFixed(1) + "/" + Math.round(g.totale_mb / 1024) + " GB" + (caldo ? " · occupata" : "");
    } catch (_) { if (++this.fallite >= 2) { el.hidden = true; this.salta = 4; } }   // programma della voce spento: riprova ogni 15 s
  },
  avvia() { if (this.timer) return; this.giro(); this.timer = setInterval(() => this.giro(), 3000); },
};
function nascondi() { interrompi(); Mic.annulla(); if (Nativo.attivo) Nativo.ferma(); S.liveOn = false; fase("riposo"); ROOT.hidden = true; }
function mostra() {
  ROOT.hidden = false; etichetta(); Gpu.salta = 0; Gpu.giro();
  if (S.hal) Hal.accendi(); else Hal.disegna();
}

function avvia() {
  const b = $("#parla"); if (!b) return;
  b.addEventListener("pointerdown", giu);
  window.addEventListener("pointerup", su); window.addEventListener("pointercancel", su);
  ROOT.querySelectorAll("[data-m]").forEach((x) => x.addEventListener("click", () => setModo(x.dataset.m)));
  const cn = $("#chatnorm"); if (cn) cn.addEventListener("click", nascondi);
  const lb = $("#lingua");
  const mostraLingua = () => { if (lb) { lb.textContent = S.lingua.startsWith("en") ? "MIC EN" : "MIC IT"; lb.title = "Lingua in cui parli al microfono: ora " + (S.lingua.startsWith("en") ? "inglese" : "italiano") + ". Clic per cambiare."; } };
  if (lb) lb.addEventListener("click", () => { S.lingua = S.lingua.startsWith("en") ? "it-IT" : "en-GB"; salva("voce.lingua", S.lingua); mostraLingua(); const era = Mic.attivo ? Mic.modo : ""; Mic.annulla(); if (era === "live") riprendi(); riga("sys", S.lingua.startsWith("en") ? "Ora ti ascolto in inglese." : "Ora ti ascolto in italiano.", "piano"); });
  mostraLingua();
  const hb = $("#hal");
  if (hb) hb.addEventListener("click", () => {
    interrompi(); Mic.annulla(); if (Nativo.attivo) Nativo.ferma(); S.liveOn = false; fase("riposo");
    S.hal = !S.hal; salva("voce.hal", S.hal ? "1" : "0");
    if (S.hal) { riga("sys", "Accendo la voce HAL: la barra sul tasto mostra a che punto è (circa mezzo minuto). Intanto parla Claude.", "piano"); Hal.accendi(); }
    else { Hal.spegni(); riga("sys", "HAL spento del tutto. Parla Claude.", "piano"); }
  });
  $("#zitto").addEventListener("click", () => {
    if (Nativo.attivo) { Nativo.mic(); return; }
    if (S.muto) { setMuto(false); return; }
    interrompi(); fase("riposo"); setMuto(true); riprendi();
  });
  const campo = $("#scrivi");
  campo.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter" && campo.value.trim()) { const t = campo.value.trim(); campo.value = ""; if (S.muto) setMuto(false); Mic.annulla(); ricevuto(t, false); }
  });
  let spazio = false;
  const libero = (e) => !ROOT.hidden && e.target !== campo && !(e.target && e.target.isContentEditable) && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || "");
  window.addEventListener("keydown", (e) => {
    if (!libero(e)) return;
    if (e.code === "Space" && !e.repeat && !spazio) { spazio = true; e.preventDefault(); giu(null); }
    else if (e.key === "Escape") { interrompi(); Mic.annulla(); fase("riposo"); }
  }, true);
  window.addEventListener("keyup", (e) => { if (e.code === "Space" && spazio) { spazio = false; if (libero(e)) { e.preventDefault(); su(); } } }, true);
  ROOT.dataset.modo = S.modo;
  ROOT.querySelectorAll("[data-m]").forEach((x) => x.setAttribute("aria-pressed", x.dataset.m === S.modo ? "true" : "false"));
  ridisegnaStoria(); Hal.disegna(); fase("riposo");
  Gpu.avvia();
  S.avviato = true; log("avviato " + (window.VOCE_VERSIONE || "pagina") + " modo=" + S.modo + " hal=" + S.hal);
  if (!ROOT.hidden && S.hal) Hal.accendi();
}

// ------------------------------------------------------------------ prove (le usa chi sviluppa: un microfono finto con un copione)
ROOT.addEventListener("voce-test", () => {
  let c; try { c = JSON.parse(ROOT.dataset.test || "{}"); } catch (_) { return; }
  if (c.mic) {
    // copione: [{t: ms dall'avvio, testo, finale}] ; il riconoscitore finto li emette come farebbe Chrome
    Mic.Classe = function () {
      const self = this; let timers = [], finali = [];
      this.start = () => { c.mic.forEach((p) => timers.push(setTimeout(() => {
        const results = finali.map((f) => Object.assign([{ transcript: f }], { isFinal: true }));
        results.push(Object.assign([{ transcript: p.testo }], { isFinal: !!p.finale }));
        if (self.onresult) self.onresult({ resultIndex: finali.length, results });
        if (p.finale) finali.push(p.testo);
      }, p.t))); };
      this.abort = () => { timers.forEach(clearTimeout); timers = []; setTimeout(() => self.onend && self.onend(), 0); };
      this.stop = this.abort;
    };
    Orecchio.finto = c.voceFino || 1;                         // volume finto: "parla" fino a voceFino ms, poi silenzio
    log("test: microfono finto");
  }
  if (c.audio) {
    // una frase detta da HAL, consegnata alla pagina come dati: serve a simulare la voce di Ema nella modalità vocale
    fetch(Hal.url + "/parla", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify({ testo: c.audio, lingua: c.lingua || "en" }) })
      .then((r) => r.blob()).then((bl) => new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(bl); }))
      .then((u) => { ROOT.dataset.testAudio = u; log("test: audio pronto " + u.length); }).catch((e) => log("test: audio errore " + e.message));
  }
  if (c.micVero) { Orecchio.finto = 0; Mic.Classe = window.SpeechRecognition || window.webkitSpeechRecognition || null; log("test: microfono vero"); }
  if (c.provaMic) {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition; if (!R) { log("provaMic: assente"); return; }
    const r = new R(); r.lang = S.lingua; r.onstart = () => log("provaMic: onstart"); r.onaudiostart = () => log("provaMic: audio"); r.onerror = (e) => log("provaMic: errore " + e.error); r.onend = () => log("provaMic: fine");
    try { r.start(); setTimeout(() => { try { r.abort(); } catch (_) {} }, 1500); } catch (err) { log("provaMic: eccezione " + err.message); }
  }
});

if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", avvia); else avvia();
window.Voce = { S, mostra, nascondi, setModo, ricevuto, interrompi, testoRiconosciuto, parlatoFinito, segmenta };

// ------------------------------------------------------------------ dimostrazione muta sulla pagina del Segretario (?demo=1)
if (!D && new URLSearchParams(location.search).get("demo")) {
  const BATTUTE = [
    ["Cosa ho oggi?", "Alle dieci e mezza hai la call con Stostudio. Alle tre il ritiro della camcorder in via Zamboni. [!] Fra venti minuti parte la prima: ti conviene prepararti."],
    ["Chi mi aspetta?", "Una sola sessione Claude aspetta te: EASY RAVE. Chiede se va bene il footer con i link alle guide. [?] Vuoi che ti legga anche le email?"],
    ["Sì, vai.", "[+] Anna Rossi manda un preventivo per il lancio di primavera. [-] Netflix chiede di rivedere un addendum entro venerdì. [~] Niente di urgente per stasera: puoi staccare."],
  ];
  let i = 0;
  const giro = async () => {
    const [d, r] = BATTUTE[i++ % BATTUTE.length];
    fase("ascolto"); const t0 = ora(); while (ora() - t0 < 1800) { Mic.impulso = 0.4 + 0.5 * Math.random(); await attesa(120); }
    riga("ema", d); fase("penso"); await attesa(2200);
    const seg = segmenta(r).segmenti; const R = nuovaRisposta(); R.mostra(seg);
    S.voce = "esterna"; fase("parlo"); S.voce = "esterna";
    for (let n = 0; n < seg.length; n++) { R.evidenzia(n); Scena.tono(seg[n].tono); if (seg[n].tono === "forte") Scena.colpo(1); await attesa(900 + seg[n].testo.length * 55); }
    R.evidenzia(-1); fase("riposo"); await attesa(2500); giro();
  };
  setTimeout(() => { setModo("voce"); giro(); }, 1500);
}
})();

/* I pannelli: la giornata di Ema da voce.json, ogni minuto. Orologio ogni secondo. */
(() => {
"use strict";
const ROOT = document.getElementById("voce-root");
const $ = (s) => ROOT.querySelector(s);
const G = ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"], M = ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];
function orologio(){ const d=new Date(); $("#ora").textContent=`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  $("#data").textContent=`${G[d.getDay()]} ${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`; }
orologio(); setInterval(orologio, 1000);
if (window.VOCE_VERSIONE) $("#sotto").textContent = "voce · " + window.VOCE_VERSIONE;
function lista(id, voci, vuoto, f){
  const ul=$(id+" ul"); ul.textContent="";
  if(voci===null||voci===undefined){ const li=document.createElement("li"); li.className="nl"; li.textContent="non letto"; ul.append(li); return; }
  if(!voci.length){ const li=document.createElement("li"); li.className="vuoto"; li.textContent=vuoto; ul.append(li); return; }
  voci.forEach((v)=>{ const li=document.createElement("li"); const r=f(v); if(r.k){const k=document.createElement("span");k.className="k";k.textContent=r.k;li.append(k);} li.append(r.t); if(r.cls) li.className=r.cls; li.title=r.t; ul.append(li); });
}
async function pannelli(){
  try{
    const url = (window.VoceConfig && window.VoceConfig.pannelli) || "voce.json";
    let d;
    if (window.VoceConfig && typeof window.VoceConfig.leggiPannelli === "function") { d = await window.VoceConfig.leggiPannelli(url); if (!d) return; }
    else { const r=await fetch(url,{credentials:"include"}); if(!r.ok) return; d=await r.json(); }
    lista("#b-cal", d.eventi, "niente in programma", (e)=>({k:e.ora?(e.ora+(e.fine?"–"+e.fine:"")):"tutto il giorno", t:e.titolo+(e.luogo?" · "+e.luogo:"")}));
    lista("#b-oggi", d.oggi, "niente di fissato", (t)=>({t}));
    lista("#b-tempo", d.se_hai_tempo||[], "", (t)=>({t}));
    $("#b-tempo").style.display = (d.se_hai_tempo||[]).length ? "" : "none";
    lista("#b-att", d.aspettano, "nessuno", (s)=>({k:s.nome, t:s.domanda, cls:"att"}));
    lista("#b-lav", d.lavorano||[], "", (s)=>({k:s.da, t:s.nome}));
    $("#b-lav").style.display = (d.lavorano||[]).length ? "" : "none";
    lista("#b-mail", d.email, "nessuna", (m)=>({k:m.da.split(/[<@]/)[0].trim().slice(0,18), t:m.oggetto}));
    $("#b-mail").style.display = d.email===null ? "none" : "";
    const s=d.sistemi||{}; const nomi={memoria:"memoria",telegram:"telegram",keep:"keep",calendario:"calendario",whatsapp:"whatsapp",orecchie:"orecchie",voce:"voce"};
    const box=$("#sys"); box.textContent="";
    Object.keys(nomi).forEach((k)=>{ const sp=document.createElement("span"); sp.className=s[k]?"on":"off"; sp.textContent=nomi[k]; box.append(sp); });
    $("#sotto").textContent = (d.proposte_in_attesa ? `${d.proposte_in_attesa} regole da approvare` : "canale privato") + " · " + (window.VOCE_VERSIONE || "pagina");
  }catch(_){}
}
pannelli(); setInterval(pannelli, 60000);
document.addEventListener("visibilitychange", ()=>{ if(!document.hidden) pannelli(); });
})();

(() => { window.VoceDriver.bottoneRichiamo(); })();
