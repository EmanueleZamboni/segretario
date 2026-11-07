// Vocali -> testo, tramite il Segretario.
// Quando arriva un vocale NUOVO (dal vivo) lo scarica e manda i byte a
// (i vocali vecchi si trascrivono su richiesta con request(), tool transcribe_voice)
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

  /**
   * Trascrizione su richiesta di un vocale già salvato (anche vecchio). Stessa coda dei vocali nuovi.
   * Ritorna { ok, text } oppure { ok: false, error } con il motivo in parole.
   */
  request(record) {
    if (!this.enabled) return Promise.resolve({ ok: false, error: 'Vocali in testo spenti: manca la chiave nelle Impostazioni del Segretario (riga "Vocali in testo").' });
    if (!record || record.type !== 'voice') return Promise.resolve({ ok: false, error: 'Non è un vocale.' });
    if (!record.raw) return Promise.resolve({ ok: false, error: 'Di questo vocale non ho più l\'audio.' });
    if (typeof record.text === 'string' && record.text.startsWith(TRANSCRIPT_PREFIX)) {
      return Promise.resolve({ ok: true, text: record.text.slice(TRANSCRIPT_PREFIX.length), already: true });
    }
    const seconds = record.seconds || Number((/^(\d+)s$/.exec(record.text || '') || [])[1]) || 0;
    if (seconds > this.maxSeconds) {
      return Promise.resolve({ ok: false, error: `Vocale troppo lungo (${seconds}s, massimo ${this.maxSeconds}s).` });
    }
    const job = this.chain.then(async () => {
      this.lastError = '';
      const ok = await this.run(record);
      if (!ok) return { ok: false, error: this.lastError || 'Trascrizione fallita.' };
      const saved = this.store.message(record.chat, record.id);
      return { ok: true, text: (saved?.text || '').slice(TRANSCRIPT_PREFIX.length) };
    });
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
        this.lastError = `HTTP ${res.status}${body?.errore ? ` (${body.errore})` : ''}`;
        this.log(`trascrizione ${record.id} fallita: ${this.lastError}`);
        return false;
      }
      const testo = body.testo.trim();
      if (!testo) {
        this.stats.failed++;
        this.lastError = 'trascrizione vuota (silenzio?)';
        this.log(`trascrizione ${record.id} vuota`);
        return false;
      }
      const ok = this.store.setTranscript(record.chat, record.id, `${TRANSCRIPT_PREFIX}${testo}`);
      if (ok) this.stats.done++;
      return ok;
    } catch (err) {
      this.stats.failed++;
      this.lastError = err.name === 'TimeoutError' ? 'timeout' : err.message;
      this.log(`trascrizione ${record.id} fallita: ${this.lastError}`);
      return false;
    }
  }
}
