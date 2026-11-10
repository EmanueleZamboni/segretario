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
