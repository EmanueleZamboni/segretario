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
