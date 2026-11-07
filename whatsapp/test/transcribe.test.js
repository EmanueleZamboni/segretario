// node --test: il gancio vocali -> testo con un fetch finto (successo, 503 senza chiave, errore di rete).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../src/store.js';
import { Transcriber } from '../src/transcribe.js';

const CHAT = '393331234567@s.whatsapp.net';
const AUDIO = Buffer.from('OggS-finto');

function setup({ fetch, url = 'http://segretario:8766/segreto', seconds = 12, type = 'voice', download } = {}) {
  const store = new Store(':memory:');
  const record = { chat: CHAT, id: 'V1', fromMe: false, sender: CHAT, ts: 1_700_000_000, type, text: `${seconds}s`,
    mime: 'audio/ogg; codecs=opus', seconds, raw: '{"key":{"id":"V1"}}' };
  store.upsertMessage(record);
  const logs = [];
  const t = new Transcriber({
    url, store, fetch, log: (...a) => logs.push(a.join(' ')),
    download: download || (async raw => { assert.equal(raw, record.raw); return AUDIO; }),
  });
  return { store, record, t, logs };
}

const reply = (status, body) => async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

test('success: posts the bytes with the audio mime and stores "[vocale] <testo>"', async () => {
  const calls = [];
  const fetch = async (url, init) => { calls.push({ url, init }); return reply(200, { testo: ' Ci vediamo alle otto ' })(); };
  const { store, record, t } = setup({ fetch });
  assert.equal(t.enabled, true);
  assert.equal(await t.handle(record), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://segretario:8766/segreto/trascrivi');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['content-type'], 'audio/ogg');
  assert.ok(Buffer.isBuffer(calls[0].init.body) && calls[0].init.body.equals(AUDIO));
  assert.equal(store.message(CHAT, 'V1').text, '[vocale] Ci vediamo alle otto');
  assert.equal(store.search({ words: ['otto'], limit: 5 }).length, 1);
  assert.equal(t.stats.done, 1);
});

test('503 without a transcription key: keeps "12s", logs the error without the audio', async () => {
  const { store, record, t, logs } = setup({ fetch: reply(503, { errore: 'nessuna chiave di trascrizione' }) });
  assert.equal(await t.handle(record), false);
  assert.equal(store.message(CHAT, 'V1').text, '12s');
  assert.equal(t.stats.failed, 1);
  assert.match(logs.join('\n'), /HTTP 503/);
  assert.match(logs.join('\n'), /nessuna chiave/);
});

test('network error: keeps "12s" and does not throw', async () => {
  const { store, record, t, logs } = setup({ fetch: async () => { throw new TypeError('fetch failed'); } });
  assert.equal(await t.handle(record), false);
  assert.equal(store.message(CHAT, 'V1').text, '12s');
  assert.match(logs.join('\n'), /fetch failed/);
});

test('download error and non-JSON reply are handled the same way', async () => {
  const a = setup({ fetch: reply(200, { testo: 'x' }), download: async () => { throw new Error('not connected'); } });
  assert.equal(await a.t.handle(a.record), false);
  assert.equal(a.store.message(CHAT, 'V1').text, '12s');
  const b = setup({ fetch: async () => new Response('<html>', { status: 200 }) });
  assert.equal(await b.t.handle(b.record), false);
  assert.equal(b.store.message(CHAT, 'V1').text, '12s');
});

test('disabled without SEGRETARIO_URL; non-voice and long notes are skipped without fetching', async () => {
  let fetched = 0;
  const fetch = async () => { fetched++; return reply(200, { testo: 'x' })(); };
  const off = setup({ fetch, url: '' });
  assert.equal(off.t.enabled, false);
  assert.equal(await off.t.handle(off.record), false);
  const txt = setup({ fetch, type: 'text' });
  assert.equal(await txt.t.handle(txt.record), false);
  const long = setup({ fetch, seconds: 11 * 60 });
  assert.equal(await long.t.handle(long.record), false);
  assert.equal(long.t.stats.skipped, 1);
  assert.equal(fetched, 0);
});

test('voice notes are transcribed one at a time, in order', async () => {
  let running = 0, maxRunning = 0;
  const order = [];
  const fetch = async (url, init) => {
    running++; maxRunning = Math.max(maxRunning, running);
    await new Promise(r => setTimeout(r, 10));
    running--;
    order.push(init.body.toString());
    return reply(200, { testo: init.body.toString() })();
  };
  const { store, t } = setup({ fetch, download: async raw => Buffer.from(JSON.parse(raw).key.id) });
  const recs = ['A', 'B', 'C'].map(id => ({ chat: CHAT, id, fromMe: false, sender: CHAT, ts: 1, type: 'voice', text: '3s',
    mime: 'audio/ogg', seconds: 3, raw: JSON.stringify({ key: { id } }) }));
  for (const r of recs) store.upsertMessage(r);
  const results = await Promise.all(recs.map(r => t.handle(r)));
  assert.deepEqual(results, [true, true, true]);
  assert.equal(maxRunning, 1);
  assert.deepEqual(order, ['A', 'B', 'C']);
  assert.equal(store.message(CHAT, 'B').text, '[vocale] B');
});
