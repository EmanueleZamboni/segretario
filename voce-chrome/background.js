/* Il service worker dell'estensione: l'unico che può chiedere i pannelli a hub.emazamboni.com con i cookie
   (dal content script la richiesta è cross-site e il cookie del codice Telegram non parte). */
chrome.runtime.onMessage.addListener((msg, sender, rispondi) => {
  if (msg && msg.tipo === "ping") { controlla(); rispondi({ ok: true }); return false; }  // il content script ci sveglia: il service worker da solo si addormenta
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
