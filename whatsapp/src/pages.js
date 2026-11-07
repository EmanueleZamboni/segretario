// La pagina /stato per Ema: stato del collegamento, numero, conteggi, trascrizione e, quando
// non è collegato, il QR da scansionare col telefono. Nessuna risorsa esterna, niente script:
// la CSP permette solo CSS inline e immagini data:.

import { toDataURL } from 'qrcode';
import { formatTime, phoneFromJid } from './util.js';

export const CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src data:";

const STATES = {
  open: ['Collegato', 'ok'],
  qr: ['In attesa della scansione', 'wait'],
  connecting: ['Connessione in corso', 'wait'],
  reconnecting: ['Riconnessione in corso', 'wait'],
  not_linked: ['Non collegato', 'off'],
  logged_out: ['Scollegato dal telefono', 'off'],
  replaced: ['Sessione presa da un\'altra copia', 'off'],
};

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * @param {object} ctx
 * @param {import('./whatsapp.js').WhatsApp | null} ctx.wa
 * @param {import('./store.js').Store} ctx.store
 * @param {boolean} ctx.transcription
 * @param {string} [ctx.notice]  una riga da mostrare in alto (dopo un'azione)
 */
export async function statusPage({ wa, store, transcription, notice }) {
  const state = wa ? wa.state : 'readonly';
  const [label, tone] = STATES[state] || ['Un\'altra copia possiede la connessione', 'off'];
  const me = wa?.me || JSON.parse(store.getMeta('me') || 'null');
  const counts = store.counts();
  const waiting = ['qr', 'connecting', 'reconnecting'].includes(state);
  const linked = state === 'open' || (wa?.isLinked?.() && ['reconnecting', 'connecting'].includes(state));

  let qrImg = '';
  if (state === 'qr' && wa?.qr?.data) {
    const png = await toDataURL(wa.qr.data, { errorCorrectionLevel: 'M', margin: 1, width: 300 });
    qrImg = `<img class="qr" src="${png}" width="300" height="300" alt="QR di collegamento WhatsApp">`;
  }

  const rows = [
    ['Stato', `<span class="dot ${tone}"></span>${esc(label)}`],
    ['Numero', me?.id ? esc(`${me.name ? `${me.name} ` : ''}${phoneFromJid(me.id) || me.id}`) : '<span class="muted">nessuno</span>'],
    ['Chat', esc(counts.chats)],
    ['Messaggi', `${esc(counts.messages)}${counts.newest ? ` <span class="muted">(ultimo ${esc(formatTime(counts.newest))})</span>` : ''}`],
    ['Vocali in testo', transcription ? 'attiva (tramite il Segretario)' : '<span class="muted">spenta (SEGRETARIO_URL non impostato)</span>'],
  ];
  if (wa?.lastError && state !== 'open') rows.push(['Ultimo errore', esc(wa.lastError)]);
  const diag = (wa?.logTail || []).slice(-25).map(l => {
    try { const j = JSON.parse(l); return `${j.time ? new Date(j.time).toISOString().slice(11, 19) : ''} ${j.msg || ''} ${j.err?.message || j.err || ''} ${j.code ?? ''} ${j.connection ?? ''}`.trim(); } catch { return l; }
  }).join('\n');

  let action = '';
  if (wa) {
    if (state === 'qr') {
      action = `<p>Sul telefono: <b>WhatsApp &rsaquo; Impostazioni &rsaquo; Dispositivi collegati &rsaquo; Collega un dispositivo</b>, poi inquadra il QR. Il codice si rinnova da solo.</p>${qrImg}`
        + '<form method="post" action="link"><button type="submit">Nuovo QR</button></form>'
        + '<form method="post" action="unlink"><button type="submit" class="secondary">Annulla</button></form>';
    } else if (state === 'connecting' || state === 'reconnecting') {
      action = '<p class="muted">Un momento, la pagina si aggiorna da sola.</p>';
    } else if (state === 'open') {
      action = '<form method="post" action="unlink"><button type="submit" class="danger">Scollega</button></form>'
        + '<p class="muted">Scollega toglie questo dispositivo dal telefono e cancella le chiavi. I messaggi salvati restano.</p>';
    } else {
      action = '<form method="post" action="link"><button type="submit">Collega</button></form>'
        + '<p class="muted">Premi Collega: compare un QR da inquadrare col telefono. Poi tieni WhatsApp aperto sul telefono qualche minuto mentre scarica la storia.</p>';
    }
  }

  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
${waiting ? '<meta http-equiv="refresh" content="5">' : ''}
<title>WhatsApp del Segretario</title>
<style>
  /* Stesso sistema di design del Segretario (pagine.py): superficie grigio caldo, inchiostro grafite, accento indaco. */
  :root{color-scheme:light dark;--bg:#ECEBE6;--surface:#F8F7F3;--surface-2:#FFFFFF;--edge:#CFCEC6;--line:#DDDCD5;--ink:#16161A;--muted:#6B6B72;--accent:#4B4EDB;--accent-ink:#FFFFFF;--ok:#2E9E5B;--warn:#D9822B;--bad:#D14343;--wa:#25D366}
  @media(prefers-color-scheme:dark){:root{--bg:#141416;--surface:#1E1E22;--surface-2:#26262B;--edge:#0C0C0E;--line:#2E2E34;--ink:#F1F0EC;--muted:#9A9AA2;--accent:#8D8FFF;--accent-ink:#101218}}
  *{box-sizing:border-box}
  body{margin:0;padding:0 16px 48px;font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:var(--bg)}
  main{max-width:720px;margin:0 auto}
  .top{display:flex;align-items:center;gap:12px;padding:14px 0 10px;position:sticky;top:0;background:var(--bg)}
  .brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink);font-weight:800}
  .brand .mark{width:30px;height:30px;border-radius:9px;background:var(--ink);color:var(--bg);display:grid;place-items:center;font-size:15px;font-weight:900}
  .nav{margin-left:auto;display:flex;gap:6px}
  .nav a{text-decoration:none;color:var(--muted);font-size:14px;font-weight:600;padding:7px 11px;border-radius:999px}
  .nav a[aria-current]{background:var(--ink);color:var(--bg)}
  h1{font-size:26px;line-height:1.15;letter-spacing:-.02em;font-weight:800;margin:0 0 4px}
  .sub{color:var(--muted);margin:0 0 12px}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:12px}
  .rows{display:flex;flex-direction:column}
  .row{display:flex;align-items:center;gap:12px;padding:11px 0;border-top:1px solid var(--line)}
  .row:first-child{border-top:0}
  .row .k{flex:none;width:38%;color:var(--muted);font-size:14px}
  .row .v{flex:1;min-width:0;overflow-wrap:anywhere}
  .muted{color:var(--muted)}
  .dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:8px;background:var(--muted);vertical-align:middle}
  .dot.ok{background:var(--ok);animation:breathe 2.4s ease-out infinite}
  .dot.wait{background:var(--warn)} .dot.off{background:var(--bad)}
  @keyframes breathe{0%{box-shadow:0 0 0 0 rgba(46,158,91,.45)}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}
  @media(prefers-reduced-motion:reduce){.dot.ok{animation:none}}
  .qr{display:block;margin:14px auto;border-radius:14px;background:#fff;padding:10px;box-shadow:0 3px 0 var(--edge)}
  form{display:inline-block;margin:6px 8px 0 0}
  button{font:inherit;font-weight:650;padding:11px 16px;border-radius:12px;border:1px solid var(--wa);background:var(--wa);color:#0b2e17;cursor:pointer;box-shadow:0 2px 0 #178f45}
  button:active{transform:translateY(2px);box-shadow:none}
  button.secondary{background:transparent;color:var(--ink);border-color:var(--line);box-shadow:0 2px 0 var(--edge)}
  button.danger{background:var(--bad);border-color:var(--bad);color:#fff;box-shadow:0 2px 0 #9b2b2b}
  .notice{padding:12px 14px;border-radius:10px;background:var(--surface);border:1px solid var(--accent);margin-bottom:12px;font-weight:600}
  p{margin:8px 0}
  pre{white-space:pre-wrap;word-break:break-word;font-size:12px;color:var(--muted);background:var(--surface-2);padding:10px;border-radius:10px}
  details.diag summary{cursor:pointer;color:var(--muted);font-size:14px}
</style>
</head>
<body>
<main>
<div class="top"><a class="brand" href="https://hub.emazamboni.com"><span class="mark">S</span>Segretario</a><nav class="nav"><a href="https://hub.emazamboni.com">Hub</a><a aria-current="page">WhatsApp</a></nav></div>
<h1>WhatsApp</h1>
<p class="sub">Il telefono collegato al Segretario, come WhatsApp Web.</p>
${notice ? `<div class="notice">${esc(notice)}</div>` : ''}
<div class="card"><div class="rows">
${rows.map(([k, v]) => `<div class="row"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('\n')}
</div></div>
<div class="card">${action || '<p class="muted">Questa copia è in sola lettura: un\'altra copia del connettore possiede la connessione.</p>'}</div>
<p class="muted">Pagina privata: l\'indirizzo contiene il segreto, non condividerlo.</p>
${diag ? `<details class="diag"><summary>Diagnostica (ultime righe del log)</summary><pre>${esc(diag)}</pre></details>` : ''}
</main>
</body>
</html>
`;
}
