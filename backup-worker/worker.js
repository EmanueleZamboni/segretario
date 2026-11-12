/* Copia fuori dal server del backup cifrato del Segretario (dal 12/11/2026).
 *
 * Il server (VM Oracle) manda ogni notte il file segretario-AAAA-MM-GG.tar.gz.age con PUT /<nome>.
 * Si accetta SOLO dall'indirizzo della VM (CF-Connecting-IP lo mette Cloudflare, non si può falsificare su TCP):
 * nessun segreto da custodire. Il file è cifrato con la chiave pubblica di Ema: qui è illeggibile.
 * Si tengono gli ultimi 30. Da qui non si scarica niente: per riavere un backup si entra nell'account Cloudflare
 * (Storage & Databases > KV > segretario-backup) o con `wrangler kv key get`.
 */
const VM = ["129.152.9.173"];
const NOME_OK = /^segretario-\d{4}-\d{2}-\d{2}\.tar\.gz\.age$/;
const TENERE = 30;
const MAX = 24 * 1024 * 1024; // KV: un valore al massimo 25 MiB

export default {
  async fetch(request, env) {
    const ip = request.headers.get("cf-connecting-ip") || "";
    const nome = decodeURIComponent(new URL(request.url).pathname.slice(1));
    if (request.method !== "PUT") return new Response("not found", { status: 404 });
    if (!VM.includes(ip)) return Response.json({ ok: false, errore: `indirizzo non ammesso: ${ip}` }, { status: 403 });
    if (!NOME_OK.test(nome)) return Response.json({ ok: false, errore: "nome non valido" }, { status: 400 });
    const dim = Number(request.headers.get("content-length") || 0);
    if (!(dim > 0) || dim > MAX) return Response.json({ ok: false, errore: `dimensione non ammessa: ${dim}` }, { status: 413 });
    const dati = await request.arrayBuffer();
    if (dati.byteLength !== dim) return Response.json({ ok: false, errore: "file incompleto" }, { status: 400 });
    await env.BACKUP.put(nome, dati, { metadata: { byte: dim, quando: new Date().toISOString() } });
    // tiene solo i più recenti (i nomi hanno la data, quindi l'ordine alfabetico è quello del tempo)
    const elenco = (await env.BACKUP.list({ prefix: "segretario-" })).keys.map((k) => k.name).filter((n) => NOME_OK.test(n)).sort();
    for (const vecchio of elenco.slice(0, Math.max(0, elenco.length - TENERE))) await env.BACKUP.delete(vecchio);
    return Response.json({ ok: true, nome, byte: dim, tenuti: Math.min(elenco.length, TENERE) });
  },
};
