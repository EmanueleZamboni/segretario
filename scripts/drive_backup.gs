// Copia del backup del Segretario su Google Drive (cartella "Backup Segretario", ultimi 30).
// Permesso minimo: solo i file creati da questo script (drive.file). Lo script non vede nient'altro del tuo Drive.
// Pubblicato come Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone.
// Il server manda solo nome e dimensione; lo script risponde con un indirizzo di caricamento di Google valido per
// quel file solo. I file sono cifrati: senza la chiave di Ema sono rumore.
//
// appsscript.json del progetto (Project Settings > Show "appsscript.json" manifest file in editor):
//   { "timeZone": "Europe/Rome", "dependencies": {}, "exceptionLogging": "STACKDRIVER", "runtimeVersion": "V8",
//     "oauthScopes": ["https://www.googleapis.com/auth/drive.file",
//                     "https://www.googleapis.com/auth/script.external_request"] }
// 12/11/2026: con DriveApp (permesso su TUTTO il Drive) Google bloccava l'app ("This app is blocked"): per questo si
// usa l'API di Drive con il solo drive.file e la cartella si ricorda per id (PropertiesService).

const NOME_CARTELLA = 'Backup Segretario';
const TENERE = 30;
const NOME_OK = /^segretario-\d{4}-\d{2}-\d{2}\.tar\.gz\.age$/;
const API = 'https://www.googleapis.com/drive/v3/files';

function api(url, opt) {
  opt = opt || {};
  opt.headers = Object.assign({ Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, opt.headers || {});
  opt.muteHttpExceptions = true;
  const r = UrlFetchApp.fetch(url, opt);
  if (r.getResponseCode() >= 300) throw new Error('Drive ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 150));
  return r;
}

function cartellaId() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty('cartella');
  if (id) {
    try {
      const j = JSON.parse(api(API + '/' + id + '?fields=id,trashed').getContentText());
      if (!j.trashed) return id;
    } catch (e) { /* cartella sparita: se ne crea un'altra */ }
  }
  const nuova = JSON.parse(api(API + '?fields=id', {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ name: NOME_CARTELLA, mimeType: 'application/vnd.google-apps.folder' }),
  }).getContentText());
  p.setProperty('cartella', nuova.id);
  return nuova.id;
}

// Un file con lo stesso nome (nuovo tentativo) va nel cestino; restano i 30 più recenti (gli altri nel cestino).
function pota(cid, nome) {
  const q = encodeURIComponent("'" + cid + "' in parents and trashed = false");
  const j = JSON.parse(api(API + '?q=' + q + '&fields=files(id,name)&pageSize=200').getContentText());
  const files = (j.files || []).filter(function (f) { return NOME_OK.test(f.name); });
  const stesso = files.filter(function (f) { return f.name === nome; });
  const vecchi = files.filter(function (f) { return f.name !== nome; })
    .sort(function (a, b) { return b.name.localeCompare(a.name); }).slice(TENERE - 1);
  stesso.concat(vecchi).forEach(function (f) {
    api(API + '/' + f.id, { method: 'patch', contentType: 'application/json', payload: JSON.stringify({ trashed: true }) });
  });
}

function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const nome = String(req.nome || '');
    const dim = Number(req.dimensione || 0);
    if (!NOME_OK.test(nome) || !(dim > 0 && dim < 2e9)) return risposta({ ok: false, errore: 'richiesta non valida' });
    const cid = cartellaId();
    pota(cid, nome);
    const r = api('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id', {
      method: 'post',
      contentType: 'application/json; charset=UTF-8',
      headers: { 'X-Upload-Content-Type': 'application/octet-stream', 'X-Upload-Content-Length': String(dim) },
      payload: JSON.stringify({ name: nome, parents: [cid] }),
    });
    const h = r.getHeaders();
    return risposta({ ok: true, sessione: h.Location || h.location || '' });
  } catch (err) {
    return risposta({ ok: false, errore: String(err).slice(0, 200) });
  }
}

function doGet() {
  return risposta({ ok: true, servizio: 'backup del Segretario' });
}

function risposta(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Da eseguire una volta dall'editor (Run): fa comparire la richiesta di permessi e crea la cartella.
function autorizza() {
  Logger.log('cartella: ' + cartellaId());
}
