/* Il service worker dell'estensione: l'unico che può chiedere i pannelli a hub.emazamboni.com con i cookie
   (dal content script la richiesta è cross-site e il cookie del codice Telegram non parte). */
/* HAL: il programma della voce sul PC si accende e si spegne da qui, attraverso il "ponte" it.segretario.hal
   (voce-pc/hal_host.py, registrato in Chrome). Finché il collegamento è aperto il programma vive; a HAL OFF il
   collegamento si chiude e il ponte spegne il programma del tutto. Se Chrome si chiude, si spegne anche lui. */
let halPorta = null, halId = 0;
const halAttese = new Map();
function halCollega() {
  if (halPorta) return halPorta;
  const p = chrome.runtime.connectNative("it.segretario.hal");
  halPorta = p;
  p.onMessage.addListener((m) => { const f = halAttese.get(m && m.id); if (f) { halAttese.delete(m.id); f(m); } });
  p.onDisconnect.addListener(() => {
    const e = (chrome.runtime.lastError && chrome.runtime.lastError.message) || "collegamento chiuso";
    if (halPorta === p) halPorta = null;
    for (const [id, f] of halAttese) { halAttese.delete(id); f({ ok: false, errore: e }); }
  });
  return p;
}
function halChiedi(cmd, ms) {
  return new Promise((ok) => {
    let p;
    try { p = halCollega(); } catch (err) { ok({ ok: false, errore: String(err && err.message || err) }); return; }
    const id = ++halId;
    const t = setTimeout(() => { if (halAttese.delete(id)) ok({ ok: false, errore: "nessuna risposta dal ponte" }); }, ms || 8000);
    halAttese.set(id, (m) => { clearTimeout(t); ok(m); });
    try { p.postMessage({ id, cmd }); } catch (err) { halAttese.delete(id); clearTimeout(t); ok({ ok: false, errore: String(err && err.message || err) }); }
  });
}
async function halFerma() {
  if (!halPorta) return { ok: true, gia: true };
  const r = await halChiedi("ferma", 8000);
  const p = halPorta; halPorta = null;
  try { if (p) p.disconnect(); } catch (_) {}
  return r;
}

chrome.runtime.onMessage.addListener((msg, sender, rispondi) => {
  if (msg && msg.tipo === "ping") { controlla(); rispondi({ ok: true }); return false; }  // il content script ci sveglia: il service worker da solo si addormenta
  if (msg && msg.tipo === "hal") {
    (msg.cmd === "ferma" ? halFerma() : halChiedi(msg.cmd === "stato" ? "stato" : "avvia")).then(rispondi);
    return true;
  }
  if (!msg || msg.tipo !== "pannelli") return false;
  const url = String(msg.url || "");
  if (!url.startsWith("https://hub.emazamboni.com/")) { rispondi({ errore: "indirizzo non permesso" }); return false; }
  fetch(url, { credentials: "include", cache: "no-store" })
    .then(async (r) => rispondi(r.ok ? { dati: await r.json() } : { errore: "http " + r.status }))
    .catch((err) => rispondi({ errore: String(err && err.message || err) }));
  return true;  // risposta asincrona
});

/* Ricarica da solo: confronta la versione CARICATA (in memoria) con quella del manifest.json sul disco.
   Il vecchio confronto partiva dal primo controllo del service worker: se il worker si era addormentato e risvegliato
   dopo una build, prendeva la nuova come riferimento e non ricaricava mai. */
async function controlla() {
  try {
    const r = await fetch(chrome.runtime.getURL("manifest.json") + "?t=" + Date.now(), { cache: "no-store" });
    const disco = (await r.json()).version;
    if (disco && disco !== chrome.runtime.getManifest().version) chrome.runtime.reload();
  } catch (_) {}
}
setInterval(controlla, 4000); controlla();

/* Dopo un aggiornamento dell'estensione le schede di claude.ai già aperte terrebbero la Voce vecchia: le ricarico. */
chrome.runtime.onInstalled.addListener(() => {
  try { chrome.tabs.query({ url: "https://claude.ai/*" }, (tabs) => { for (const t of tabs || []) { try { chrome.tabs.reload(t.id); } catch (_) {} } }); } catch (_) {}
});
