// Copia del backup del Segretario su Google Drive (cartella "Backup Segretario", ultimi 30).
// Va in un progetto Apps Script nell'account di Ema (script.google.com), pubblicato come
// Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone.
// L'indirizzo dell'app web si incolla nelle Impostazioni del Segretario > Backup.
// Il server manda solo nome e dimensione; lo script risponde con un indirizzo di caricamento di Google valido per
// quel file solo. Nessuna chiave di Google lascia questo account. I file sono cifrati: senza la chiave di Ema sono rumore.

const CARTELLA = 'Backup Segretario';
const TENERE = 30;
const NOME_OK = /^segretario-\d{4}-\d{2}-\d{2}\.tar\.gz\.age$/;

function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const nome = String(req.nome || '');
    const dim = Number(req.dimensione || 0);
    if (!NOME_OK.test(nome) || !(dim > 0 && dim < 2e9)) return risposta({ ok: false, errore: 'richiesta non valida' });
    const cartella = trovaCartella();
    pota(cartella, nome);
    const r = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id', {
      method: 'post',
      contentType: 'application/json; charset=UTF-8',
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
        'X-Upload-Content-Type': 'application/octet-stream',
        'X-Upload-Content-Length': String(dim),
      },
      payload: JSON.stringify({ name: nome, parents: [cartella.getId()] }),
      muteHttpExceptions: true,
    });
    if (r.getResponseCode() !== 200) return risposta({ ok: false, errore: 'Drive ha risposto ' + r.getResponseCode() });
    const h = r.getHeaders();
    return risposta({ ok: true, sessione: h.Location || h.location || '' });
  } catch (err) {
    return risposta({ ok: false, errore: String(err).slice(0, 200) });
  }
}

function doGet() {
  return risposta({ ok: true, servizio: 'backup del Segretario' });
}

function trovaCartella() {
  const it = DriveApp.getFoldersByName(CARTELLA);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CARTELLA);
}

// Un file con lo stesso nome (nuovo tentativo) va nel cestino; restano i più recenti (nel cestino, non cancellati).
function pota(cartella, nome) {
  const files = [];
  const it = cartella.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    if (f.getName() === nome) { f.setTrashed(true); continue; }
    if (NOME_OK.test(f.getName())) files.push(f);
  }
  files.sort(function (a, b) { return b.getName().localeCompare(a.getName()); });
  files.slice(TENERE - 1).forEach(function (f) { f.setTrashed(true); });
}

function risposta(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Da eseguire una volta dall'editor (Run): fa comparire la richiesta di permessi e crea la cartella.
function autorizza() {
  trovaCartella();
  UrlFetchApp.fetch('https://www.googleapis.com/discovery/v1/apis?name=drive', { muteHttpExceptions: true });
}
