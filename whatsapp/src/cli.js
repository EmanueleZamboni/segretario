#!/usr/bin/env node
// WhatsApp del Segretario.
//
//   node src/cli.js serve --http [--port 8787] [--host 0.0.0.0]   MCP su HTTP + pagina /stato (il container fa questo)
//   node src/cli.js serve                                          MCP su stdio (Claude Desktop / Claude Code)
//   node src/cli.js login [--phone 393331234567]                   collega dal terminale (QR o codice), in alternativa alla pagina
//   node src/cli.js logout                                         scollega e cancella la sessione
//
// Senza sessione il server parte lo stesso e aspetta: il pulsante "Collega" della pagina
// /mcp/<MCP_TOKEN>/stato fa partire il QR. Un solo processo alla volta tiene la connessione
// (lock in data/); gli altri leggono solo i messaggi salvati.

import { readFileSync, unlinkSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Store } from './store.js';
import { WhatsApp } from './whatsapp.js';
import { createServer, makeSendLimiter } from './tools.js';
import { Transcriber } from './transcribe.js';
import { startHttp } from './http.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const log = (...a) => console.error('[whatsapp]', ...a);

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    phone: { type: 'string' },
    http: { type: 'boolean', default: false },
    port: { type: 'string', default: process.env.PORT || '8787' },
    host: { type: 'string', default: process.env.HOST || '127.0.0.1' },
    'data-dir': { type: 'string', default: process.env.WHATSAPP_DATA_DIR || join(ROOT, 'data') },
    help: { type: 'boolean', short: 'h' },
  },
});
const command = positionals[0] || 'serve';
const dataDir = resolve(opts['data-dir']);
const lockPath = join(dataDir, 'connector.lock');

if (opts.help || !['login', 'serve', 'logout'].includes(command)) {
  console.error(`Uso:
  node src/cli.js serve --http [--port 8787] [--host 0.0.0.0]   MCP su HTTP; serve MCP_TOKEN nell'ambiente
  node src/cli.js serve                                          MCP su stdio (Claude Desktop / Claude Code)
  node src/cli.js login [--phone 393331234567]                   collega dal terminale (QR, o codice con --phone)
  node src/cli.js logout                                         scollega e cancella la sessione

I dati (chiavi di sessione, messaggi, media) stanno in ${dataDir} (--data-dir o WHATSAPP_DATA_DIR).
SEGRETARIO_URL (es. http://segretario:8766/<segreto>) accende la trascrizione dei vocali.`);
  process.exit(opts.help ? 0 : 1);
}

/** Un processo alla volta tiene la connessione WhatsApp; gli altri leggono solo i messaggi salvati. */
async function acquireLock() {
  try {
    const pid = Number(await readFile(lockPath, 'utf8'));
    if (pid && pid !== process.pid) {
      try {
        process.kill(pid, 0);
        return false; // ancora in esecuzione
      } catch { /* lock vecchio */ }
    }
  } catch { /* nessun lock */ }
  await writeFile(lockPath, String(process.pid));
  const release = () => {
    try {
      if (readFileSync(lockPath, 'utf8') === String(process.pid)) unlinkSync(lockPath);
    } catch { /* ignora */ }
  };
  process.on('exit', release);
  return true;
}

async function main() {
  await mkdir(dataDir, { recursive: true, mode: 0o700 });

  if (command === 'logout') {
    if (!(await acquireLock())) throw new Error('Il connettore è in esecuzione: fermalo prima.');
    const store = new Store(join(dataDir, 'store.db'));
    const wa = new WhatsApp({ dataDir, store });
    if (wa.isLinked()) {
      await wa.start();
      await new Promise(r => wa.once('open', r));
    }
    await wa.unlink();
    log('Scollegato. I messaggi salvati sono ancora in', join(dataDir, 'store.db'), '- cancella la cartella data per toglierli.');
    process.exit(0);
  }

  const owner = await acquireLock();

  if (command === 'login') {
    if (!owner) throw new Error('Il connettore è già in esecuzione: usa la pagina /stato, oppure fermalo e rilancia login.');
    await login();
    return;
  }

  // serve
  const store = new Store(join(dataDir, 'store.db'));
  const segretarioUrl = process.env.SEGRETARIO_URL || '';
  let wa = null;
  let transcriber = null;
  if (owner) {
    wa = new WhatsApp({ dataDir, store });
    wa.on('qr', () => log('QR pronto: apri la pagina /stato e inquadralo col telefono.'));
    wa.on('qr-expired', () => log('QR scaduto senza scansione: premi di nuovo Collega quando sei pronto.'));
    wa.on('open', me => log(`Collegato come ${me.name || me.id}`));
    wa.on('logged-out', () => log('Il telefono ha scollegato questo dispositivo: collega di nuovo dalla pagina /stato.'));
    wa.on('replaced', () => log('Un\'altra copia del connettore ha preso la sessione.'));
    wa.on('unlinked', () => log('Scollegato.'));

    transcriber = new Transcriber({ url: segretarioUrl, store, download: raw => wa.download(raw), log });
    if (transcriber.enabled) wa.on('message', m => { transcriber.handle(m); });
    log(`Vocali in testo: ${transcriber.enabled ? 'attiva (Segretario)' : 'spenta (SEGRETARIO_URL non impostato)'}`);

    if (wa.isLinked()) await wa.start();
    else log('Non ancora collegato: apri la pagina /stato e premi Collega.');
  } else {
    log('Un\'altra copia del connettore è in esecuzione: questa è in sola lettura.');
  }

  const ctx = { store, wa, dataDir, sendLimiter: makeSendLimiter(), transcriber };
  const shutdown = async () => {
    await wa?.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  if (opts.http) {
    const token = process.env.MCP_TOKEN;
    if (!token || token.length < 24) {
      throw new Error('Imposta MCP_TOKEN a un segreto lungo e casuale (24+ caratteri), es. `openssl rand -hex 24`.');
    }
    await startHttp({
      makeServer: () => createServer(ctx), token, port: Number(opts.port), host: opts.host, log,
      wa, store, transcription: !!segretarioUrl,
    });
  } else {
    const server = createServer(ctx);
    await server.connect(new StdioServerTransport());
    process.stdin.on('close', shutdown);
  }
}

async function login() {
  const store = new Store(join(dataDir, 'store.db'));
  const wa = new WhatsApp({ dataDir, store, pairingPhone: opts.phone });
  const already = wa.isLinked();
  const out = (...a) => console.log(...a);

  wa.on('qr', async qr => {
    const { default: qrcode } = await import('qrcode-terminal');
    out('\nSul telefono: WhatsApp > Impostazioni > Dispositivi collegati > Collega un dispositivo, poi inquadra:\n');
    qrcode.generate(qr, { small: true }, code => out(code));
  });
  wa.on('pairing-code', code => {
    out('\nSul telefono: WhatsApp > Impostazioni > Dispositivi collegati > Collega un dispositivo >');
    out('"Collega con il numero di telefono", e inserisci questo codice:\n');
    out(`    ${code}\n`);
  });
  wa.on('qr-expired', () => {
    out('QR scaduto senza scansione. Rilancia login.');
    process.exit(1);
  });

  let lastActivity = Date.now();
  let total = 0;
  wa.on('history', h => {
    lastActivity = Date.now();
    total += h.messages;
    out(`Scarico la storia... ${total} messaggi${h.progress != null ? ` (${h.progress}%)` : ''}`);
  });
  const done = new Promise((resolveDone, rejectDone) => {
    wa.on('history-complete', () => resolveDone('complete'));
    wa.on('logged-out', () => rejectDone(new Error('Il telefono ha rifiutato o tolto il collegamento. Rilancia login.')));
    wa.on('replaced', () => rejectDone(new Error('Un\'altra copia del connettore usa questa sessione.')));
  });

  await wa.start();
  await new Promise(r => wa.once('open', r));
  out(`\nCollegato come ${wa.me.name || ''} ${wa.me.id}.`);
  if (already) {
    out('Era già collegato; non c\'è altro da fare.');
    await wa.stop();
    process.exit(0);
  }
  out('Scarico la storia delle chat dal telefono (tieni WhatsApp aperto). Può volerci qualche minuto.');

  // Finisce quando WhatsApp dice che la sincronizzazione è completa, o dopo 90 s senza novità.
  const idle = new Promise(r => {
    const t = setInterval(() => {
      if (Date.now() - lastActivity > 90_000) {
        clearInterval(t);
        r('idle');
      }
    }, 5000);
  });
  await Promise.race([done, idle]);
  await new Promise(r => setTimeout(r, 3000)); // lascia atterrare gli ultimi pezzi
  const c = store.counts();
  out(`\nFatto: ${c.chats} chat e ${c.messages} messaggi salvati in ${join(dataDir, 'store.db')}.`);
  out('Ora avvia il server (o riavvia il container).');
  await wa.stop();
  process.exit(0);
}

main().catch(err => {
  log(err.message);
  process.exit(1);
});
