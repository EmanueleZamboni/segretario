// Vocali -> testo, tramite il Segretario.
// Quando arriva un vocale NUOVO (dal vivo, mai dalla storia) lo scarica e manda i byte a
// POST ${SEGRETARIO_URL}/trascrivi con Content-Type = mime dell'audio. Il Segretario risponde
// {"testo": "..."} (200) oppure {"errore": "..."} (400/503 quando non ha una chiave di trascrizione).
// Se va bene il messaggio diventa "[vocale] <testo>" (e la ricerca lo trova); se no resta "12s".
// Uno alla volta; nessun errore fa cadere il processo; il contenuto non finisce mai nei log.

import { TRANSCRIPT_PREFIX } from './util.js';

export const MAX_VOICE_SECONDS = 10 * 60;

export class Transcriber {
  /**
   * @param {object} opts
   * @param {string|undefined} opts.url       SEGRETARIO_URL (senza /trascrivi); vuoto = disattivato
   * @param {(raw: string) => Promise<Buffer>} opts.download  scarica il media di un messaggio salvato
   * @param {import('./store.js').Store} opts.store
   * @param {(...a: any[]) => void} [opts.log]
   * @param {typeof fetch} [opts.fetch]       iniettabile nei test
   * @param {number} [opts.maxSeconds]
   * @param {number} [opts.timeoutMs]
   */
  constructor({ url, download, store, log = () => {}, fetch = globalThis.fetch, maxSeconds = MAX_VOICE_SECONDS, timeoutMs = 120_000 }) {
    this.url = (url || '').trim().replace(/\/+$/, '');
    this.download = download;
    this.store = store;
    this.log = log;
    this.fetch = fetch;
    this.maxSeconds = maxSeconds;
    this.timeoutMs = timeoutMs;
    this.chain = Promise.resolve(); // la coda: un vocale alla volta
    this.stats = { done: 0, failed: 0, skipped: 0 };
  }

  get enabled() {
    return !!this.url;
  }

  /**
   * Da chiamare per ogni messaggio dal vivo (evento 'message' del client). Mette in coda i
   * vocali e ritorna subito; `handle(...)` è anche la promise del lavoro, utile nei test.
   */
  handle(record) {
    if (!this.enabled || !record || record.type !== 'voice' || !record.raw) return Promise.resolve(false);
    if (record.seconds && record.seconds > this.maxSeconds) {
      this.stats.skipped++;
      this.log(`vocale ${record.id} saltato: ${record.seconds}s > ${this.maxSeconds}s`);
      return Promise.resolve(false);
    }
    const job = this.chain.then(() => this.run(record));
    this.chain = job.catch(() => {});
    return job;
  }

  async run(record) {
    try {
      const buffer = await this.download(record.raw);
      const mime = (record.mime || 'audio/ogg').split(';')[0].trim();
      const res = await this.fetch(`${this.url}/trascrivi`, {
        method: 'POST',
        headers: { 'content-type': mime },
        body: buffer,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      let body = null;
      try { body = await res.json(); } catch { /* risposta non JSON: trattata sotto */ }
      if (!res.ok || typeof body?.testo !== 'string') {
        this.stats.failed++;
        this.log(`trascrizione ${record.id} fallita: HTTP ${res.status}${body?.errore ? ` (${body.errore})` : ''}`);
        return false;
      }
      const testo = body.testo.trim();
      if (!testo) {
        this.stats.failed++;
        this.log(`trascrizione ${record.id} vuota`);
        return false;
      }
      const ok = this.store.setTranscript(record.chat, record.id, `${TRANSCRIPT_PREFIX}${testo}`);
      if (ok) this.stats.done++;
      return ok;
    } catch (err) {
      this.stats.failed++;
      this.log(`trascrizione ${record.id} fallita: ${err.name === 'TimeoutError' ? 'timeout' : err.message}`);
      return false;
    }
  }
}
