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
function etichetta(testo) {
  const b = $("#parla"), l = $(".cmd .l"); if (!b || !l) return;
  let t = testo;
  if (!t) {
    if (S.modo === "live") {
      const on = Nativo.attivo || S.liveOn;
      t = !on ? "TOCCA PER INIZIARE" : Nativo.micSpento ? "MICROFONO SPENTO · TOCCA PER CHIUDERE" : S.fase === "parlo" ? "PARLA · TOCCA PER CHIUDERE" : S.fase === "penso" ? "PENSA · TOCCA PER CHIUDERE" : "TI ASCOLTO · TOCCA PER CHIUDERE";
      b.setAttribute("aria-pressed", on ? "true" : "false");
    } else {
      t = S.fase === "ascolto" ? "TI ASCOLTO · TOCCA PER INVIARE" : S.fase === "penso" ? "PENSA · TOCCA PER FERMARE" : S.fase === "parlo" ? "PARLA · TOCCA PER FERMARE" : "TOCCA E PARLA";
      b.setAttribute("aria-pressed", S.fase === "ascolto" ? "true" : "false");
    }
    if (S.muto) t = "IN SILENZIO · DI' «SEGRETARIO»";
  }
  l.textContent = t;
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
    evidenzia(i) { corrente = i; if (el) el.querySelectorAll(".fr").forEach((f) => f.classList.toggle("ora", +f.dataset.i === i)); },
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
  disegna(stato) {
    const b = $("#hal"); if (!b) return;
    b.setAttribute("aria-pressed", S.hal ? "true" : "false");
    b.classList.toggle("carica", stato === "carica");
    b.textContent = stato === "carica" ? "HAL…" : "HAL";
    ROOT.dataset.hal = !S.hal ? "spento" : stato === "carica" ? "carica" : this.pronto ? "pronto" : "spento";
  },
  async accendi() {
    const io = ++this.giro; this.pronto = false; this.disegna("carica"); log("hal accendi");
    try {
      const p = await this.get("/pronto"); if (p.pronto) { if (io === this.giro) { this.pronto = true; this.disegna(); log("hal già pronto"); } return; }
      const a = await this.get("/accendi", 6000);
      if (a && a.acceso === false) {
        if (io !== this.giro) return;
        S.hal = false; salva("voce.hal", "0"); this.disegna(); log("hal rifiutato: " + a.motivo);
        avviso("HAL non può partire adesso: la scheda video è quasi piena (di solito è Resolve aperto). Parla Claude. Riprova quando chiudi Resolve.");
        return;
      }
    }
    catch (_) {
      if (io !== this.giro) return;
      S.hal = false; salva("voce.hal", "0"); this.disegna();
      avviso("La voce HAL sul PC è spenta: doppio clic su avvia_voce.cmd nella cartella voce-pc, poi premi di nuovo HAL. Intanto parla Claude.");
      return;
    }
    for (let i = 0; i < 150; i++) {
      if (io !== this.giro || !S.hal) return;
      try {
        const p = await this.get("/pronto", 1500);
        if (p.pronto) { this.pronto = true; this.disegna(); log("hal pronto"); riga("sys", "HAL è pronto.", "piano"); return; }
        if (p.motivo === "lento") {
          S.hal = false; salva("voce.hal", "0"); this.disegna(); log("hal rifiutato: lento " + p.tempo_s + " s per " + p.voce_s + " s di voce");
          avviso("HAL è troppo lento adesso: la scheda video è occupata (di solito è Resolve aperto). Parla Claude. Riprova quando chiudi Resolve.");
          return;
        }
      } catch (_) {}
      await attesa(1000);
    }
    if (io === this.giro) { S.hal = false; salva("voce.hal", "0"); this.disegna(); avviso("HAL non si è caricato. Intanto parla Claude."); }
  },
  spegni() { this.giro++; this.pronto = false; this.disegna(); fetch(this.url + "/spegni").catch(() => {}); log("hal spegni"); },
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
      // la prima frase, se lunga, si spezza alla prima virgola: la voce parte prima
      if (idx === 0 && sg.testo.length > 70) { const m = sg.testo.match(/^(.{20,70}?[,;:])\s+(.{12,})$/); if (m) return [{ testo: m[1], tono: sg.tono, idx }, { testo: m[2], tono: sg.tono, idx }]; }
      return [{ testo: sg.testo, tono: sg.tono, idx, enfasi: (sg.enfasi || []).length }];
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
const Mic = {
  Classe: window.SpeechRecognition || window.webkitSpeechRecognition || null,
  rec: null, attivo: false, modo: "", finale: "", parziale: "", timer: 0, el: null, giro: 0, impulso: 0, corti: 0, t0: 0,
  avvia(modo) {
    if (this.attivo) return;
    if (CFG.stt === "esterno" && typeof CFG.avviaAscolto === "function") { this.attivo = true; this.modo = modo; this.esterno = true; this.finale = ""; this.parziale = ""; this.el = null; fase("ascolto"); try { CFG.avviaAscolto(modo, S.lingua); } catch (_) { this.attivo = false; fase("riposo"); } return; }
    if (!this.Classe) { avviso("Questo browser non ha il riconoscimento vocale: usa Chrome, oppure scrivi nel campo in basso."); return; }
    const io = ++this.giro; const rec = new this.Classe();
    rec.lang = S.lingua; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    this.rec = rec; this.attivo = true; this.esterno = false; this.modo = modo; this.finale = ""; this.parziale = ""; this.el = null; this.t0 = ora();
    rec.onresult = (e) => {
      if (io !== this.giro) return;
      let fin = "", tmp = "";
      for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) fin += r[0].transcript + " "; else tmp += r[0].transcript; }
      if (fin) this.finale += fin;
      this.parziale = tmp; this.impulso = 1;
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
      const t = this.testo(); const durata = ora() - this.t0; this.chiudi(false);
      log("mic fine da solo, testo=" + (t ? "sì" : "no"));
      if (t) { this.corti = 0; ricevuto(t, true); return; }
      this.corti = durata < 1500 ? this.corti + 1 : 0;        // se muore subito più volte di fila, non insistere
      if (this.corti >= 4) { this.corti = 0; S.liveOn = false; avviso("Il microfono si chiude da solo: riprova tra un momento."); }
      fase("riposo"); riprendi();
    };
    try { rec.start(); } catch (err) { this.chiudi(true); avviso("Non riesco ad aprire il microfono: " + err.message); return; }
    log("mic avvia " + modo + " " + S.lingua);
    fase("ascolto");
  },
  testo() { return (this.finale + " " + this.parziale).replace(/\s+/g, " ").trim(); },
  aggiorna() {
    const t = this.testo(); if (!t) return;
    if (!this.el) this.el = riga("ema", "", "prov");
    if (this.el) { this.el.querySelector(".t").textContent = t; const box = $("#righe"); if (box) box.scrollTop = box.scrollHeight; }
    const tenuto = this.modo === "tap" && premuto && ora() - premuto > 450;   // sta tenendo premuto: decide il rilascio
    if (!tenuto) this.silenzio(this.modo === "rilascio" ? 350 : 900);
  },
  silenzio(ms) { clearTimeout(this.timer); const io = this.giro; this.timer = setTimeout(() => { if (io === this.giro && this.attivo) this.consegna(); }, ms); },
  rilascio() { if (!this.attivo) return; this.modo = "rilascio"; this.silenzio(350); },
  consegna() {
    if (!this.attivo) return;
    const t = this.testo(); this.chiudi(true);
    log("mic consegna: " + t.length + " caratteri");
    if (t) { this.corti = 0; ricevuto(t, true); } else { fase("riposo"); riprendi(); }
  },
  annulla() { if (!this.attivo) return; this.chiudi(true); if (S.fase === "ascolto") fase("riposo"); },
  chiudi(abort) {
    clearTimeout(this.timer); this.giro++; this.attivo = false;
    togli(this.el); this.el = null;
    if (this.esterno) { try { if (CFG.fermaAscolto) CFG.fermaAscolto(); } catch (_) {} return; }
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
(function ciclo(t) {
  if (!ROOT.hidden) {
    let b = 0;
    if (S.fase === "parlo") b = S.voce === "hal" ? Hal.livello() * 8 : S.voce === "claude" ? audioClaude() * 9 : 0.3 + 0.4 * Math.abs(Math.sin(t / 95));
    bocca = b > bocca ? b : bocca * 0.7 + b * 0.3;
    Scena.bocca(Math.min(1, bocca));
    let m = 0;
    if (S.fase === "ascolto") { m = Nativo.attivo ? audioMic() * 9 : Mic.impulso; }
    Mic.impulso *= 0.9;
    onda = m > onda ? m : onda * 0.85 + m * 0.15;
    Scena.livello(Math.min(1, onda));
  }
  requestAnimationFrame(ciclo);
})(0);

// ------------------------------------------------------------------ i comandi
let premuto = 0;
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
}
function su() {
  if (S.modo === "live" || !Mic.attivo || Mic.modo !== "tap" || !premuto) return;
  if (ora() - premuto > 450) Mic.rilascio();                                        // tenuto premuto: parte al rilascio
  premuto = 0;
}
function setModo(m) {
  interrompi(); Mic.annulla(); if (Nativo.attivo) Nativo.ferma(); S.liveOn = false;
  S.modo = m; salva("voce.modo", m); ROOT.dataset.modo = m;
  ROOT.querySelectorAll("[data-m]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.m === m ? "true" : "false"));
  ridisegnaStoria(); fase("riposo");
}
function nascondi() { interrompi(); Mic.annulla(); if (Nativo.attivo) Nativo.ferma(); S.liveOn = false; fase("riposo"); ROOT.hidden = true; }
function mostra() {
  ROOT.hidden = false; etichetta();
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
    if (S.hal) { riga("sys", "Voce HAL: la carico, ci vuole circa mezzo minuto. Intanto parla Claude.", "piano"); Hal.accendi(); }
    else { Hal.spegni(); riga("sys", "Voce di Claude.", "piano"); }
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
    log("test: microfono finto");
  }
  if (c.audio) {
    // una frase detta da HAL, consegnata alla pagina come dati: serve a simulare la voce di Ema nella modalità vocale
    fetch(Hal.url + "/parla", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify({ testo: c.audio, lingua: c.lingua || "en" }) })
      .then((r) => r.blob()).then((bl) => new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(bl); }))
      .then((u) => { ROOT.dataset.testAudio = u; log("test: audio pronto " + u.length); }).catch((e) => log("test: audio errore " + e.message));
  }
  if (c.micVero) { Mic.Classe = window.SpeechRecognition || window.webkitSpeechRecognition || null; log("test: microfono vero"); }
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
