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
  const naso = m.naso, bocca = [naso[0], naso[1] - 0.26, naso[2] - 0.15];
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
    wJaw[i] = sm(my + 0.01, my - 0.10, y) * sm(my - 0.36, my - 0.22, y) * (0.25 + 0.75 * front) * sm(0.70, 0.30, Math.abs(x));
    // labbra: due fasce strette intorno alla linea della bocca, larghe quanto la bocca
    const dx = x - bocca[0], dyU = y - bocca[1];
    const larg = Math.exp(-((dx / 0.20) ** 2)) * front;
    wLipU[i] = larg * Math.exp(-(((dyU - 0.045) / 0.035) ** 2));
    wLipD[i] = larg * Math.exp(-(((dyU + 0.045) / 0.04) ** 2));
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
    y -= wJaw[i] * j * 0.09; z -= wJaw[i] * j * 0.025;             // la mascella scende e rientra un filo
    y += wLipU[i] * j * 0.018; y -= wLipD[i] * j * 0.045;           // le labbra si separano
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
