/* La Voce del Segretario: logica (modi, microfono, trascrizione, risposta, parlato, silenzio).
   Questo file viene incollato dentro voce.html dal build (scripts/build_voce.py): la CSP permette solo script
   inline con nonce. La grafica è in Scena (voce_scena.js), che espone: stato(fase), livello(0..1), bocca(0..1),
   muto(bool). Qui niente grafica.

   Modi:   testo = parli, risponde scritto · voce = parli, risponde a voce · live = conversazione a mani libere.
   Silenzio garantito dal codice:
   - "stop", "basta", "zitto" da soli: la voce si interrompe e la frase NON va a Claude.
   - se Claude decide di tacere (tool silenzio), il server butta il testo e qui non arriva niente.
   - "finché non ti chiamo": quello che dici non lascia nemmeno il browser finché non dici "Segretario". */
(() => {
"use strict";
const ROOT = document.getElementById("voce-root") || document.body;
const $ = (s) => ROOT.querySelector(s);
const CFG = Object.assign({ trasporto: null, stt: "server", lingua: "it-IT" }, window.VoceConfig || {});
const WAKE = /\b(segretari[oa]|secretar(?:y|io|ia)|segretà)\b/i;
const STOP = /^\s*(stop|basta|zitto|zitta|silenzio|sh+|shut up|quiet|fermati|ok basta|basta così)[\s.!,]*$/i;
// Frasi che whisper inventa sul silenzio o sul rumore: non sono di Ema.
const FANTASMI = /^(\s*(sottotitoli.*|grazie (per la visione|a tutti|per l'ascolto)[.!]*|thank you( for watching)?[.!]*|thanks for watching[.!]*|you|grazie[.!]?|\.+|…|amara\.org.*|ciao[.!]?)\s*)$/i;

const S = {
  modo: "voce",            // testo | voce | live
  fase: "riposo",          // riposo | ascolto | trascrivo | penso | parlo
  muto: false,             // false | "finche_chiamato"
  storia: [],
  mic: null, actx: null, an: null, buf: null,
  rec: null, chunks: [], recStart: 0, recMode: "",
  livello: 0, fondo: 0.01,
  sopra: 0, sotto: 0,
  richiesta: null,
  voci: [],
};
const Scena = window.Scena || { stato() {}, livello() {}, bocca() {}, muto() {} };

try { S.storia = JSON.parse(sessionStorage.getItem("voce.storia") || "[]").slice(-30); } catch (_) { S.storia = []; }
try { const m = localStorage.getItem("voce.modo"); if (["testo", "voce", "live"].includes(m)) S.modo = m; } catch (_) {}

function salvaStoria() { try { sessionStorage.setItem("voce.storia", JSON.stringify(S.storia.slice(-30))); } catch (_) {} }
function fase(f) { S.fase = f; ROOT.dataset.fase = f; Scena.stato(S.muto ? "dorme" : f); aggiornaTasto(); }
function setMuto(m) { S.muto = m; ROOT.dataset.muto = m ? "1" : ""; Scena.muto(!!m); Scena.stato(m ? "dorme" : S.fase); aggiornaTasto(); }

// ------------------------------------------------------------------ sottotitoli e diario a video
const righe = [];
function riga(chi, testo, cls = "", segmenti = null) {
  const box = $("#righe"); if (!box) return;
  const el = document.createElement("p");
  el.className = `riga ${chi} ${cls}`;
  const tag = document.createElement("span"); tag.className = "chi";
  tag.textContent = chi === "ema" ? "TU" : chi === "seg" ? "SEGRETARIO" : "·";
  const t = document.createElement("span"); t.className = "t";
  el.append(tag, t); box.append(el); righe.push(el);
  const max = S.modo === "testo" ? 40 : 6;
  while (righe.length > max) righe.shift().remove();
  if (segmenti && segmenti.length) {
    // le frasi con il loro tono e le parole con enfasi, già a fuoco (in modo testo si legge, non si guarda scrivere)
    segmenti.forEach((sg, n) => {
      const span = document.createElement("span"); span.className = `fr ${sg.tono || "neutro"}`; span.dataset.i = n;
      let pos = 0;
      for (const [a, b] of sg.enfasi || []) {
        if (a > pos) span.append(sg.testo.slice(pos, a));
        const em = document.createElement("em"); em.textContent = sg.testo.slice(a, b); span.append(em); pos = b;
      }
      span.append(sg.testo.slice(pos) + " ");
      t.append(span);
    });
  } else if (S.modo === "testo") t.textContent = testo;
  else scrivi(t, testo);
  box.scrollTop = box.scrollHeight;
  return el;
}
// Macchina da scrivere a scatti (14 al secondo, come il volto).
function scrivi(el, testo) {
  let i = 0; const passo = Math.max(1, Math.ceil(testo.length / 60));
  const tic = () => { i = Math.min(testo.length, i + passo); el.textContent = testo.slice(0, i); if (i < testo.length) setTimeout(tic, 1000 / 14); };
  tic();
}

// ------------------------------------------------------------------ riconoscimento nel browser (Chrome): niente server
let rec2 = null, rec2Attivo = false, rec2Testo = "", rec2Timer = 0;
function sttBrowser() { return CFG.stt === "browser" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window); }
// Riconoscimento esterno (app Android): CFG.avviaAscolto(modo) e CFG.fermaAscolto() parlano con il telefono; il testo
// torna con window.Voce.testoRiconosciuto(testo). Stesso contratto di rec2Avvia/rec2Ferma.
function sttEsterno() { return CFG.stt === "esterno" && typeof CFG.avviaAscolto === "function"; }
let estAttivo = false;
function estAvvia(modo) { if (estAttivo) return; estAttivo = true; S.recMode = modo; S.recStart = performance.now(); fase("ascolto"); try { CFG.avviaAscolto(modo); } catch (_) { estAttivo = false; fase("riposo"); } }
function estFerma() { if (!estAttivo) return; try { CFG.fermaAscolto && CFG.fermaAscolto(); } catch (_) {} }
function testoRiconosciuto(t, parziale) {
  if (parziale) { const l = $(".cmd .l"); if (l && t) l.textContent = String(t).slice(-60).toUpperCase(); return; }
  estAttivo = false; t = String(t || "").trim();
  if (t) gestisci(t, true); else fase("riposo");
  if (S.modo === "live" && !S.muto && S.fase === "riposo") setTimeout(() => { if (S.modo === "live" && S.fase === "riposo") estAvvia("live"); }, 250);
}
function rec2Avvia(modo) {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (rec2Attivo) return;
  rec2 = new R(); rec2.lang = CFG.lingua; rec2.continuous = modo === "live"; rec2.interimResults = true; rec2.maxAlternatives = 1;
  rec2Testo = ""; rec2Attivo = true; S.recMode = modo; S.recStart = performance.now();
  rec2.onresult = (e) => {
    let fin = "", tmp = "";
    for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) fin += r[0].transcript + " "; else tmp += r[0].transcript; }
    if (fin) rec2Testo += fin;
    const anteprima = (rec2Testo + tmp).trim();
    if (anteprima) { const l = $(".cmd .l"); if (l) l.textContent = anteprima.slice(-60).toUpperCase(); }
    if (modo === "live" && fin) { clearTimeout(rec2Timer); rec2Timer = setTimeout(() => rec2Ferma(), 700); }
  };
  rec2.onerror = (e) => { if (e.error === "not-allowed") riga("sys", "Microfono negato: Chrome > icona a sinistra dell'indirizzo > Microfono > Consenti.", "err"); rec2Attivo = false; fase("riposo"); };
  rec2.onend = () => {
    const stava = rec2Attivo; rec2Attivo = false;
    const t = rec2Testo.trim(); rec2Testo = "";
    if (!stava) return;
    if (t) gestisci(t, true); else fase("riposo");
    if (S.modo === "live" && !S.muto && S.fase === "riposo") setTimeout(() => { if (S.modo === "live" && S.fase === "riposo") rec2Avvia("live"); }, 250);
  };
  try { rec2.start(); fase("ascolto"); } catch (_) { rec2Attivo = false; }
}
function rec2Ferma() { if (rec2 && rec2Attivo) { try { rec2.stop(); } catch (_) {} } }

// ------------------------------------------------------------------ microfono
async function apriMic() {
  if (S.mic) return true;
  try {
    S.mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  } catch (err) {
    riga("sys", "Microfono negato: Chrome > icona a sinistra dell'indirizzo > Microfono > Consenti.", "err");
    return false;
  }
  S.actx = new (window.AudioContext || window.webkitAudioContext)();
  const src = S.actx.createMediaStreamSource(S.mic);
  S.an = S.actx.createAnalyser(); S.an.fftSize = 1024; S.buf = new Float32Array(S.an.fftSize);
  src.connect(S.an); // solo analisi: niente esce dalle casse
  requestAnimationFrame(ascoltaLivello);
  return true;
}

let ultimoT = performance.now();
function ascoltaLivello(t) {
  const dt = Math.min(100, t - ultimoT); ultimoT = t;
  S.an.getFloatTimeDomainData(S.buf);
  let e = 0; for (let i = 0; i < S.buf.length; i++) e += S.buf[i] * S.buf[i];
  const rms = Math.sqrt(e / S.buf.length);
  S.livello = S.livello * 0.6 + rms * 0.4;
  if (S.fase === "riposo" && !S.rec) S.fondo = S.fondo * 0.995 + Math.min(rms, 0.05) * 0.005; // rumore di fondo
  Scena.livello(Math.min(1, S.livello * 9));
  vad(dt);
  requestAnimationFrame(ascoltaLivello);
}

// Soglie: parlare = 3x il fondo; interrompere mentre parla lui = 7x (la sua voce rientra nel microfono).
function vad(dt) {
  const soglia = Math.max(0.018, S.fondo * 3);
  const interrompi = Math.max(0.06, S.fondo * 7);
  if (S.modo === "live" && !S.rec) {
    const puo = S.fase === "riposo" || (S.fase === "parlo" && S.livello > interrompi);
    if (puo && S.livello > soglia) { S.sopra += dt; if (S.sopra > (S.fase === "parlo" ? 260 : 140)) { zittisci(); avviaRec("live"); } }
    else S.sopra = 0;
  }
  if (S.rec && (S.recMode === "live" || S.recMode === "tap")) {
    if (S.livello < soglia) { S.sotto += dt; if (S.sotto > (S.recMode === "live" ? 900 : 1400)) fermaRec(); }
    else S.sotto = 0;
  }
}

function avviaRec(modo) {
  if (S.rec) return;
  const tipo = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((x) => window.MediaRecorder && MediaRecorder.isTypeSupported(x)) || "";
  S.chunks = []; S.sotto = 0; S.sopra = 0; S.recMode = modo; S.recStart = performance.now();
  S.rec = new MediaRecorder(S.mic, tipo ? { mimeType: tipo } : undefined);
  S.rec.ondataavailable = (e) => { if (e.data.size) S.chunks.push(e.data); };
  S.rec.onstop = () => {
    const durata = performance.now() - S.recStart;
    const blob = new Blob(S.chunks, { type: S.rec.mimeType || "audio/webm" });
    S.rec = null;
    if (durata < 380) { fase("riposo"); return; }
    trascrivi(blob);
  };
  S.rec.start();
  fase("ascolto");
}
function fermaRec() { if (S.rec && S.rec.state !== "inactive") S.rec.stop(); }

async function trascrivi(blob) {
  fase("trascrivo");
  try {
    const r = await fetch("voce/ascolta", { method: "POST", body: blob, headers: { "Content-Type": blob.type }, credentials: "same-origin" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { riga("sys", j.errore || "Non ti ho sentito.", "err"); fase("riposo"); return; }
    gestisci((j.testo || "").trim(), true);
  } catch (_) { riga("sys", "Rete assente: non ti ho sentito.", "err"); fase("riposo"); }
}

// ------------------------------------------------------------------ cosa fare di una frase
function gestisci(testo, daVoce) {
  if (!testo || FANTASMI.test(testo)) { fase("riposo"); return; }
  if (STOP.test(testo)) { zittisci(); riga("ema", testo, "piano"); fase("riposo"); return; }
  if (S.muto) {
    if (!WAKE.test(testo)) { riga("ema", testo, "piano"); fase("riposo"); return; } // resta qui, non parte niente
    setMuto(false);
    const resto = testo.replace(WAKE, "").replace(/^[\s,.!?:;-]+/, "").trim();
    if (resto.split(/\s+/).length < 3) { riga("ema", testo); rispondi({ testo: "Sono qui." }, daVoce); return; }
  }
  riga("ema", testo);
  chiedi(testo, daVoce);
}

async function chiedi(testo, daVoce) {
  if (S.richiesta) S.richiesta.abort();
  const ctl = new AbortController(); S.richiesta = ctl;
  const storia = S.storia.slice(-16);
  S.storia.push({ ruolo: "ema", testo }); salvaStoria();
  fase("penso");
  try {
    let j;
    if (CFG.trasporto) {
      j = await CFG.trasporto(testo, storia, ctl.signal);
    } else {
      const r = await fetch("voce/parla", {
        method: "POST", signal: ctl.signal, credentials: "same-origin",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ testo, storia }),
      });
      j = await r.json().catch(() => ({ errore: "Risposta illeggibile." }));
    }
    if (S.richiesta !== ctl) return;
    S.richiesta = null;
    rispondi(j, daVoce);
  } catch (err) {
    if (err.name === "AbortError") return;
    S.richiesta = null; riga("sys", "Rete assente: riprova.", "err"); fase("riposo");
  }
}

function rispondi(j, daVoce) {
  if (j.silenzio) {
    if (j.silenzio === "finche_chiamato") setMuto("finche_chiamato");
    fase("riposo"); // niente testo, niente voce: davvero zitto
    if (S.modo === "live" && sttBrowser() && !S.muto) setTimeout(() => rec2Avvia("live"), 300);
    return;
  }
  if (j.errore) { riga("sys", j.errore, "err"); fase("riposo"); return; }
  const testo = (j.testo || "").trim();
  if (!testo) { fase("riposo"); return; }
  const segmenti = Array.isArray(j.segmenti) && j.segmenti.length ? j.segmenti : [{ testo, tono: "neutro", enfasi: [] }];
  S.storia.push({ ruolo: "segretario", testo }); salvaStoria();
  const el = riga("seg", testo, "", segmenti);
  if (S.modo === "testo") { fase("riposo"); if (S.modo === "live" && sttBrowser()) rec2Avvia("live"); return; }
  parla(segmenti, el);
}

// ------------------------------------------------------------------ parlato (sintesi del browser)
function caricaVoci() { S.voci = speechSynthesis.getVoices(); }
if ("speechSynthesis" in window) { caricaVoci(); speechSynthesis.onvoiceschanged = caricaVoci; }

function scegliVoce(lang) {
  const tutte = S.voci.filter((v) => v.lang && v.lang.toLowerCase().startsWith(lang));
  const voto = (v) => (/natural|online/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1);
  return tutte.sort((a, b) => voto(b) - voto(a))[0] || null;
}
function lingua(t) {
  const it = (t.match(/\b(il|lo|la|che|di|non|sono|per|una|hai|alle|oggi|domani|è)\b/gi) || []).length;
  const en = (t.match(/\b(the|you|is|are|have|to|and|of|today|tomorrow|your)\b/gi) || []).length;
  return en > it ? "en" : "it";
}

let bocca = 0, boccaT = 0, parlaToken = 0;
const NEURALE = { url: CFG.neurale || "http://127.0.0.1:8768", ok: null, controllato: 0, actx: null, an: null, buf: null, src: null };
async function neuraleDisponibile() {
  if (performance.now() - NEURALE.controllato < 20000 && NEURALE.ok !== null) return NEURALE.ok;
  NEURALE.controllato = performance.now();
  try { const r = await fetch(NEURALE.url + "/", { signal: AbortSignal.timeout(1200) }); const j = await r.json(); NEURALE.ok = !!j.ok; }
  catch (_) { NEURALE.ok = false; }
  return NEURALE.ok;
}
function neuraleAudio() {
  if (!NEURALE.actx) { NEURALE.actx = new (window.AudioContext || window.webkitAudioContext)(); NEURALE.an = NEURALE.actx.createAnalyser(); NEURALE.an.fftSize = 512; NEURALE.buf = new Float32Array(512); NEURALE.an.connect(NEURALE.actx.destination); }
  if (NEURALE.actx.state === "suspended") NEURALE.actx.resume();
  return NEURALE.actx;
}
async function neuraleSintetizza(testo, lang, signal) {
  const r = await fetch(NEURALE.url + "/parla", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify({ testo, lingua: lang }), signal });
  if (!r.ok) throw new Error("voce " + r.status);
  return neuraleAudio().decodeAudioData(await r.arrayBuffer());
}
// Parla con la voce neurale: una frase alla volta, la prossima si prepara mentre questa suona; la bocca segue l'audio vero.
async function parlaNeurale(segmenti, el, token) {
  const lang = lingua(segmenti.map((x) => x.testo).join(" "));
  const ctl = new AbortController(); NEURALE.ctl = ctl;
  let prossima = neuraleSintetizza(segmenti[0].testo, lang, ctl.signal);
  for (let i = 0; i < segmenti.length; i++) {
    if (token !== parlaToken) return;
    let audio;
    try { audio = await prossima; } catch (err) { if (token === parlaToken) throw err; return; }
    if (token !== parlaToken) return;
    if (i + 1 < segmenti.length) prossima = neuraleSintetizza(segmenti[i + 1].testo, lang, ctl.signal);
    const sg = segmenti[i];
    Scena.tono(sg.tono || "neutro");
    if (el) el.querySelectorAll(".fr").forEach((f) => f.classList.toggle("ora", f.dataset.i == i));
    const ctx = neuraleAudio(); const src = ctx.createBufferSource(); src.buffer = audio; src.connect(NEURALE.an); NEURALE.src = src;
    const durata = audio.duration * 1000;
    (sg.enfasi || []).forEach(([a]) => setTimeout(() => { if (token === parlaToken) Scena.colpo(sg.tono === "forte" ? 1.0 : 0.7); }, durata * (a / Math.max(1, sg.testo.length))));
    await new Promise((fine) => { src.onended = fine; src.start(); });
    NEURALE.src = null;
  }
}
let estFine = null;
function parlatoFinito() { const f = estFine; estFine = null; if (f) f(); }
async function parlaEsterno(segmenti, el, token) {
  const lang = lingua(segmenti.map((x) => x.testo).join(" "));
  for (let i = 0; i < segmenti.length; i++) {
    if (token !== parlaToken) return;
    const sg = segmenti[i];
    Scena.tono(sg.tono || "neutro");
    if (el) el.querySelectorAll(".fr").forEach((f) => f.classList.toggle("ora", f.dataset.i == i));
    const durata = 900 + sg.testo.length * 55;
    (sg.enfasi || []).forEach(([a]) => setTimeout(() => { if (token === parlaToken) Scena.colpo(sg.tono === "forte" ? 1.0 : 0.7); }, durata * (a / Math.max(1, sg.testo.length))));
    await new Promise((fine) => { estFine = fine; try { CFG.parlaEsterno(sg.testo, lang); } catch (_) { fine(); } });
  }
}
function parla(segmenti, el) {
  if (typeof segmenti === "string") segmenti = [{ testo: segmenti, tono: "neutro", enfasi: [] }];
  const token = ++parlaToken;
  fase("parlo");
  if (typeof CFG.parlaEsterno === "function") {
    parlaEsterno(segmenti, el, token).then(() => {
      if (token !== parlaToken) return;
      fase("riposo"); if (el) el.querySelectorAll(".fr.ora").forEach((f) => f.classList.remove("ora"));
      if (S.modo === "live" && sttEsterno() && !S.muto) setTimeout(() => { if (S.fase === "riposo") estAvvia("live"); }, 300);
    });
    return;
  }
  neuraleDisponibile().then((ok) => {
    if (token !== parlaToken) return;
    const sotto = $("#sotto"); if (sotto) sotto.textContent = (ok ? "voce neurale (PC)" : "voce di Chrome") + " · " + (window.VOCE_VERSIONE || "pagina");
    if (!ok) return parlaBrowser(segmenti, el, token);
    parlaNeurale(segmenti, el, token).then(() => {
      if (token !== parlaToken) return;
      fase("riposo"); if (el) el.querySelectorAll(".fr.ora").forEach((f) => f.classList.remove("ora"));
      if (S.modo === "live" && sttBrowser() && !S.muto) setTimeout(() => { if (S.fase === "riposo") rec2Avvia("live"); }, 300);
    }).catch((err) => { console.warn("voce neurale:", err.message); NEURALE.ok = false; if (token === parlaToken) parlaBrowser(segmenti, el, token); });
  });
}
function parlaBrowser(segmenti, el, token) {
  if (!("speechSynthesis" in window)) { fase("riposo"); return; }
  speechSynthesis.cancel();
  const tutto = segmenti.map((x) => x.testo).join(" ");
  const lang = lingua(tutto); const voce = scegliVoce(lang);
  fase("parlo");
  segmenti.forEach((sg, i) => {
    const u = new SpeechSynthesisUtterance(sg.testo);
    u.lang = lang === "en" ? "en-GB" : "it-IT"; if (voce) u.voice = voce;
    // il tono si sente anche nella voce, appena: più lenta e bassa se calma, un filo più alta se è una domanda
    u.rate = { forte: 0.98, calmo: 0.94, domanda: 1.02 }[sg.tono] || 1.0;
    u.pitch = { forte: 0.9, calmo: 0.86, domanda: 1.0, male: 0.84 }[sg.tono] || 0.92;
    const enf = sg.enfasi || [];
    let colpiti = new Set();
    u.onstart = () => { if (token !== parlaToken) return; Scena.tono(sg.tono || "neutro"); if (el) el.querySelectorAll(".fr").forEach((f) => f.classList.toggle("ora", f.dataset.i == i)); };
    u.onboundary = (e) => {
      if (token !== parlaToken) return; bocca = 1;
      const c = e.charIndex || 0;
      enf.forEach(([a, b], n) => { if (c >= a - 1 && c < b && !colpiti.has(n)) { colpiti.add(n); Scena.colpo(sg.tono === "forte" ? 1.0 : 0.7); } });
    };
    if (i === segmenti.length - 1) u.onend = () => { if (token === parlaToken) { fase("riposo"); if (el) el.querySelectorAll(".fr.ora").forEach((f) => f.classList.remove("ora")); if (S.modo === "live" && sttBrowser() && !S.muto) setTimeout(() => { if (S.fase === "riposo") rec2Avvia("live"); }, 300); } };
    u.onerror = () => { if (token === parlaToken && i === segmenti.length - 1) fase("riposo"); };
    speechSynthesis.speak(u);
  });
}
function zittisci() {
  parlaToken++;
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  if (NEURALE.ctl) { try { NEURALE.ctl.abort(); } catch (_) {} NEURALE.ctl = null; }
  if (NEURALE.src) { try { NEURALE.src.onended = null; NEURALE.src.stop(); } catch (_) {} NEURALE.src = null; }
  if (typeof CFG.zittisciEsterno === "function") { try { CFG.zittisciEsterno(); } catch (_) {} }
  estFine = null;
  if (S.fase === "parlo") fase("riposo");
}

// La bocca: impulsi dalle parole più un'oscillazione da sillabe, letta dalla Scena.
(function boccaLoop(t) {
  if (S.fase === "parlo" && NEURALE.src && NEURALE.an) {
    NEURALE.an.getFloatTimeDomainData(NEURALE.buf);
    let e = 0; for (let i = 0; i < NEURALE.buf.length; i++) e += NEURALE.buf[i] * NEURALE.buf[i];
    const rms = Math.sqrt(e / NEURALE.buf.length);
    bocca = Math.min(1, Math.max(bocca * 0.7, rms * 9));
  } else if (S.fase === "parlo") {
    boccaT += 1;
    const sill = 0.35 + 0.35 * Math.abs(Math.sin(t / 95)) * (0.6 + 0.4 * Math.sin(t / 37));
    bocca = Math.max(bocca * 0.86, sill);
  } else bocca *= 0.8;
  Scena.bocca(Math.min(1, bocca));
  requestAnimationFrame(boccaLoop);
})(0);

// ------------------------------------------------------------------ comandi: tasto, spazio, testo, modi
const tasto = () => $("#parla");
function aggiornaTasto() {
  const b = tasto(); if (!b) return;
  const l = document.querySelector(".cmd .l");
  const testi = {
    riposo: S.modo === "live" ? (S.mic ? "TI ASCOLTO" : "ATTIVA LIVE") : "TIENI PREMUTO E PARLA",
    ascolto: S.modo === "live" ? "TI SENTO…" : "RILASCIA PER MANDARE",
    trascrivo: "TRASCRIVO…", penso: "PENSO…", parlo: "TOCCA PER INTERROMPERE",
  };
  l.textContent = S.muto ? "IN SILENZIO · CHIAMAMI PER NOME" : (testi[S.fase] || "");
  b.setAttribute("aria-pressed", S.rec ? "true" : "false");
}

let premuto = 0;
async function giu(e) {
  if (e) e.preventDefault();
  if (S.fase === "parlo") { zittisci(); if (S.modo === "live" && sttBrowser()) setTimeout(() => rec2Avvia("live"), 200); return; }
  if (sttEsterno()) {
    if (S.modo === "live") { if (!estAttivo) estAvvia("live"); return; }
    if (estAttivo) { estFerma(); return; }
    premuto = performance.now(); estAvvia("hold"); return;
  }
  if (sttBrowser()) {
    if (S.modo === "live") { if (!rec2Attivo) rec2Avvia("live"); return; }
    if (rec2Attivo) { rec2Ferma(); return; }
    premuto = performance.now(); rec2Avvia("hold"); return;
  }
  if (!(await apriMic())) return;
  if (S.actx.state === "suspended") S.actx.resume();
  if (S.modo === "live") { fase("riposo"); return; } // live: basta aprire il microfono
  if (S.rec) { fermaRec(); return; }               // secondo tocco: manda
  premuto = performance.now();
  avviaRec("hold");
}
function su() {
  if (sttEsterno()) { if (estAttivo && S.recMode === "hold" && performance.now() - premuto >= 350) estFerma(); return; }
  if (sttBrowser()) { if (rec2Attivo && S.recMode === "hold" && performance.now() - premuto >= 350) rec2Ferma(); return; }
  if (!S.rec || S.recMode !== "hold") return;
  if (performance.now() - premuto < 350) { S.recMode = "tap"; return; } // tocco breve: resta aperto, si ferma da solo sul silenzio
  fermaRec();
}

function setModo(m) {
  S.modo = m; try { localStorage.setItem("voce.modo", m); } catch (_) {}
  ROOT.dataset.modo = m;
  document.querySelectorAll("[data-m]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.m === m ? "true" : "false"));
  if (m === "testo") zittisci();
  // la storia a video segue il modo: lunga e leggibile in testo, due righe in voce
  const box = $("#righe");
  if (box) { box.textContent = ""; righe.length = 0; S.storia.slice(m === "testo" ? -20 : -2).forEach((x) => riga(x.ruolo === "ema" ? "ema" : "seg", x.testo, "vecchia")); }
  if (m === "live") { if (sttBrowser()) { if (!rec2Attivo && !S.muto) rec2Avvia("live"); } else apriMic().then((ok) => { if (ok && S.actx.state === "suspended") S.actx.resume(); fase(S.fase); }); }
  else if (sttBrowser() && rec2Attivo && S.recMode === "live") { rec2Attivo = false; try { rec2.stop(); } catch (_) {} }
  aggiornaTasto();
}

const avvia = () => {
  const b = tasto();
  b.addEventListener("pointerdown", giu);
  window.addEventListener("pointerup", su);
  window.addEventListener("pointercancel", su);
  document.querySelectorAll("[data-m]").forEach((x) => x.addEventListener("click", () => setModo(x.dataset.m)));
  const cn = $("#chatnorm"); if (cn) cn.addEventListener("click", () => window.Voce.nascondi());
  $("#zitto").addEventListener("click", () => { if (S.muto) { setMuto(false); } else { zittisci(); setMuto("finche_chiamato"); } });
  const campo = $("#scrivi");
  campo.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && campo.value.trim()) { const t = campo.value.trim(); campo.value = ""; if (S.muto) setMuto(false); gestisci(t, false); }
  });
  let spazio = false;
  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space" || e.target === campo || spazio || e.repeat) return;
    spazio = true; e.preventDefault(); giu(null);
  });
  window.addEventListener("keyup", (e) => {
    if (e.code !== "Space" || e.target === campo) return;
    spazio = false; e.preventDefault(); if (S.rec && S.recMode === "hold" && performance.now() - premuto >= 350) fermaRec(); else su();
  });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") { zittisci(); if (S.rec) { S.chunks = []; S.recStart = performance.now(); fermaRec(); } } });
  setModo(S.modo);
  fase("riposo");
};
// nella pagina del Segretario la pagina sta ancora caricando; nell'estensione è già pronta
if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", avvia); else avvia();

function nascondi() { zittisci(); if (rec2Attivo) { rec2Attivo = false; try { rec2.stop(); } catch (_) {} } if (S.rec) fermaRec(); ROOT.hidden = true; }
function mostra() { ROOT.hidden = false; if (S.modo === "live" && sttBrowser() && !S.muto) rec2Avvia("live"); }
window.Voce = { S, gestisci, setModo, parla, zittisci, setMuto, nascondi, mostra, riga, testoRiconosciuto, parlatoFinito };

// ------------------------------------------------------------------ demo silenziosa (?demo=1): si vede come parla, senza audio
if (new URLSearchParams(location.search).get("demo")) {
  const BATTUTE = [
    { ema: "Cosa ho oggi?", seg: [{ testo: "Alle dieci e mezza hai la call con Stostudio.", tono: "neutro", enfasi: [[5, 17]] }, { testo: "Alle tre il ritiro della camcorder in via Zamboni.", tono: "neutro", enfasi: [[5, 8]] }, { testo: "Fra venti minuti parte la prima: ti conviene prepararti.", tono: "forte", enfasi: [[4, 16]] }] },
    { ema: "Chi mi aspetta?", seg: [{ testo: "Una sola sessione Claude aspetta te: EASY RAVE SEO.", tono: "neutro", enfasi: [[37, 50]] }, { testo: "Chiede se va bene il footer con i link alle guide.", tono: "neutro", enfasi: [] }, { testo: "Vuoi che ti legga anche le email?", tono: "domanda", enfasi: [[22, 27]] }] },
    { ema: "Sì, vai.", seg: [{ testo: "Anna Rossi manda un preventivo video per il lancio di primavera.", tono: "bene", enfasi: [[0, 10]] }, { testo: "Netflix chiede di rivedere un addendum al contratto entro venerdì.", tono: "male", enfasi: [[52, 65]] }, { testo: "Niente di urgente per stasera: puoi staccare.", tono: "calmo", enfasi: [] }] },
  ];
  let i = 0;
  const parlaSilenzioso = (segmenti, el) => new Promise((fine) => {
    fase("parlo"); let n = 0;
    const prossima = () => {
      if (n >= segmenti.length) { fase("riposo"); if (el) el.querySelectorAll(".fr.ora").forEach((f) => f.classList.remove("ora")); fine(); return; }
      const sg = segmenti[n]; Scena.tono(sg.tono);
      if (el) el.querySelectorAll(".fr").forEach((f) => f.classList.toggle("ora", f.dataset.i == n));
      const durata = 900 + sg.testo.length * 55;
      (sg.enfasi || []).forEach(([a]) => setTimeout(() => Scena.colpo(sg.tono === "forte" ? 1.0 : 0.7), durata * (a / Math.max(1, sg.testo.length))));
      n++; setTimeout(prossima, durata + 350);
    };
    prossima();
  });
  const giro = async () => {
    const b = BATTUTE[i++ % BATTUTE.length];
    fase("ascolto"); const t0 = performance.now();
    await new Promise((r) => { const tic = () => { Scena.livello(0.3 + 0.5 * Math.abs(Math.sin(performance.now() / 90)) * Math.random()); if (performance.now() - t0 < 1800) requestAnimationFrame(tic); else { Scena.livello(0); r(); } }; tic(); });
    riga("ema", b.ema); fase("penso"); await new Promise((r) => setTimeout(r, 2200));
    const el = riga("seg", b.seg.map((x) => x.testo).join(" "), "", b.seg);
    await parlaSilenzioso(b.seg, el);
    await new Promise((r) => setTimeout(r, 2500));
    giro();
  };
  const viaDemo = () => { setModo("voce"); setTimeout(giro, 1500); };
  if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", viaDemo); else viaDemo();
}
})();
