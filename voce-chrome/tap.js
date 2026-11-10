/* La Voce, orecchio sulla pagina (gira nel mondo della pagina di claude.ai, prima di tutto il resto).

   Serve a una cosa sola: sapere, numero per numero, quanto forte sta parlando Claude e quanto forte sta parlando Ema,
   per muovere la bocca del volto e le onde sul pavimento. Non cambia niente dell'audio di claude.ai: aggiunge solo
   un "misuratore" in parallelo.

   Come suona claude.ai (verificato il 10/11/2026):
   - "Leggi ad alta voce": pezzetti di 0,1 s in WebAudio (AudioBufferSourceNode -> GainNode -> destinazione);
   - modalità vocale: WebRTC, la voce arriva come MediaStream dentro un elemento <audio> (srcObject);
   - il microfono: navigator.mediaDevices.getUserMedia.
   Il risultato esce su due attributi di <html>, letti dalla Voce: data-voce-out (Claude) e data-voce-mic (Ema), 0..1. */
(() => {
  "use strict";
  if (window.__voceTap) return;
  window.__voceTap = 1;
  const html = document.documentElement;
  const out = [], mic = [];              // misuratori sull'uscita (Claude) e sul microfono (Ema)
  const perCtx = new WeakMap(), visti = new WeakSet();
  let nostro = null, timer = 0, ultimoO = "", ultimoM = "";
  const connect = AudioNode.prototype.connect;
  // Solo per le prove di chi sviluppa: con sessionStorage "voce.test.muto" = "1" (vale per UNA scheda) l'audio di
  // claude.ai viene misurato ma non esce dalle casse. Senza quella chiave questo codice non cambia niente.
  let MUTO = false; try { MUTO = sessionStorage.getItem("voce.test.muto") === "1"; } catch (_) {}
  const zitti = new WeakMap();

  function misuratore(ctx, lista) {
    const a = ctx.createAnalyser(); a.fftSize = 512;
    lista.push({ a, ctx, buf: new Float32Array(512) });
    if (!timer) timer = setInterval(giro, 50);
    return a;
  }
  function ctxNostro() {
    if (!nostro || nostro.state === "closed") nostro = new (window.AudioContext || window.webkitAudioContext)();
    if (nostro.state === "suspended") nostro.resume().catch(() => {});
    return nostro;
  }
  function ascoltaStream(s, lista) {
    if (!s || visti.has(s) || typeof s.getAudioTracks !== "function" || !s.getAudioTracks().length) return;
    visti.add(s);
    const c = ctxNostro();
    connect.call(c.createMediaStreamSource(s), misuratore(c, lista));
  }

  // 1. tutto ciò che va alle casse via WebAudio
  AudioNode.prototype.connect = function (dest) {
    if (MUTO && dest instanceof AudioDestinationNode) {
      let a = perCtx.get(dest.context);
      if (!a) { a = misuratore(dest.context, out); perCtx.set(dest.context, a); }
      connect.call(this, a);
      let z = zitti.get(dest.context);
      if (!z) { z = dest.context.createGain(); z.gain.value = 0; connect.call(z, dest); zitti.set(dest.context, z); }
      connect.call(this, z);
      return dest;
    }
    const r = connect.apply(this, arguments);
    try {
      if (dest instanceof AudioDestinationNode) {
        let a = perCtx.get(dest.context);
        if (!a) { a = misuratore(dest.context, out); perCtx.set(dest.context, a); }
        connect.call(this, a);
      }
    } catch (_) {}
    return r;
  };

  // 2. la voce della modalità vocale: uno stream dentro un elemento audio
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    try { ascoltaStream(this.srcObject, out); if (MUTO) this.muted = true; } catch (_) {}
    return play.apply(this, arguments);
  };
  try {
    const d = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "srcObject");
    if (d && d.set && d.get) {
      Object.defineProperty(HTMLMediaElement.prototype, "srcObject", {
        configurable: true, enumerable: d.enumerable, get: d.get,
        set(v) { d.set.call(this, v); try { ascoltaStream(v, out); } catch (_) {} },
      });
    }
  } catch (_) {}

  // 3. il microfono di Ema (solo misura)
  try {
    const md = navigator.mediaDevices;
    if (md && md.getUserMedia) {
      const gum = md.getUserMedia.bind(md);
      md.getUserMedia = function (c) {
        const p = gum(c);
        try { p.then((s) => { try { if (c && c.audio) ascoltaStream(s, mic); } catch (_) {} }, () => {}); } catch (_) {}
        return p;
      };
    }
  } catch (_) {}

  function rms(o) {
    try {
      if (o.ctx.state === "closed") return -1;
      o.a.getFloatTimeDomainData(o.buf);
      let e = 0; for (let i = 0; i < o.buf.length; i += 2) e += o.buf[i] * o.buf[i];
      return Math.sqrt(e / (o.buf.length / 2));
    } catch (_) { return -1; }
  }
  function livello(lista) {
    let m = 0;
    for (let i = lista.length - 1; i >= 0; i--) { const v = rms(lista[i]); if (v < 0) lista.splice(i, 1); else if (v > m) m = v; }
    return m;
  }
  function giro() {
    const o = livello(out), m = livello(mic);
    const so = o > 0.003 ? o.toFixed(3) : "0", sm = m > 0.003 ? m.toFixed(3) : "0";
    if (so !== ultimoO) { ultimoO = so; html.setAttribute("data-voce-out", so); }
    if (sm !== ultimoM) { ultimoM = sm; html.setAttribute("data-voce-mic", sm); }
    if (!out.length && !mic.length) { clearInterval(timer); timer = 0; }
  }
})();
