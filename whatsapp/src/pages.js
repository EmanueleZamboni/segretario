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
  :root { color-scheme: light dark; --fg: #1a1a1a; --bg: #f6f6f4; --card: #fff; --muted: #6b6b6b; --line: #e3e3df; --accent: #1f7a4d; }
  @media (prefers-color-scheme: dark) { :root { --fg: #ececec; --bg: #161616; --card: #202020; --muted: #9a9a9a; --line: #333; --accent: #3ccf7a; } }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px 16px; font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--fg); background: var(--bg); }
  main { max-width: 480px; margin: 0 auto; }
  h1 { font-size: 20px; margin: 0 0 16px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 6px 0; vertical-align: top; border-bottom: 1px solid var(--line); }
  tr:last-child th, tr:last-child td { border-bottom: 0; }
  th { font-weight: 500; color: var(--muted); width: 38%; }
  .muted { color: var(--muted); }
  .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; background: var(--muted); }
  .dot.ok { background: var(--accent); } .dot.wait { background: #e0a800; } .dot.off { background: #c0392b; }
  .qr { display: block; margin: 12px auto; border-radius: 8px; background: #fff; padding: 8px; }
  form { display: inline-block; margin: 8px 8px 0 0; }
  button { font: inherit; padding: 10px 18px; border-radius: 8px; border: 1px solid var(--accent); background: var(--accent); color: #fff; cursor: pointer; }
  button.secondary { background: transparent; color: var(--fg); border-color: var(--line); }
  button.danger { background: #c0392b; border-color: #c0392b; }
  .notice { padding: 10px 12px; border-radius: 8px; background: var(--card); border: 1px solid var(--accent); margin-bottom: 16px; }
  p { margin: 8px 0; }
</style>
</head>
<body>
<main>
<h1>WhatsApp del Segretario</h1>
${notice ? `<div class="notice">${esc(notice)}</div>` : ''}
<div class="card"><table>
${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('\n')}
</table></div>
<div class="card">${action || '<p class="muted">Questa copia è in sola lettura: un\'altra copia del connettore possiede la connessione.</p>'}</div>
<p class="muted">Questa pagina è privata: l\'indirizzo contiene il segreto, non condividerlo.</p>
</main>
</body>
</html>
`;
}
