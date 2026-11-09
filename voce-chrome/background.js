/* Il service worker dell'estensione: l'unico che può chiedere i pannelli a hub.emazamboni.com con i cookie
   (dal content script la richiesta è cross-site e il cookie del codice Telegram non parte). */
chrome.runtime.onMessage.addListener((msg, sender, rispondi) => {
  if (!msg || msg.tipo !== "pannelli") return false;
  const url = String(msg.url || "");
  if (!url.startsWith("https://hub.emazamboni.com/")) { rispondi({ errore: "indirizzo non permesso" }); return false; }
  fetch(url, { credentials: "include", cache: "no-store" })
    .then(async (r) => rispondi(r.ok ? { dati: await r.json() } : { errore: "http " + r.status }))
    .catch((err) => rispondi({ errore: String(err && err.message || err) }));
  return true;  // risposta asincrona
});
