// node --test: il limite di invio (5 al minuto) e il tool send_message.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { RateLimiter } from '../src/util.js';
import { Store } from '../src/store.js';
import { createServer, makeSendLimiter, SEND_LIMIT } from '../src/tools.js';

test('RateLimiter: 5 in a minute, then wait, then the window slides', () => {
  let now = 1_000_000;
  const rl = new RateLimiter({ max: 5, windowMs: 60_000, now: () => now });
  for (let i = 0; i < 5; i++) {
    assert.equal(rl.take(), true, `take ${i}`);
    now += 1000; // un messaggio al secondo
  }
  // now = t0 + 5 s: il primo invio esce dalla finestra a t0 + 60 s
  assert.equal(rl.take(), false);
  assert.equal(rl.retryAfter(), 55);
  now += 30_000;
  assert.equal(rl.take(), false);
  assert.equal(rl.retryAfter(), 25);
  now += 25_000;
  assert.equal(rl.retryAfter(), 0);
  assert.equal(rl.take(), true); // il primo è uscito dalla finestra
  assert.equal(rl.take(), false); // gli altri quattro ci sono ancora
  assert.equal(rl.retryAfter(), 1);
});

test('makeSendLimiter uses the 5/minute default', () => {
  assert.deepEqual(SEND_LIMIT, { max: 5, windowMs: 60_000 });
  const rl = makeSendLimiter();
  assert.equal(rl.max, 5);
  assert.equal(rl.windowMs, 60_000);
});

/** Un client MCP in memoria collegato a createServer con un finto WhatsApp. */
async function connect(ctx) {
  const server = createServer(ctx);
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  const client = new Client({ name: 'test', version: '0' });
  await client.connect(b);
  return { client, server };
}

const CHAT = '393331234567@s.whatsapp.net';

function fakeWa() {
  return {
    state: 'open', connected: true, me: { id: '390000000000@s.whatsapp.net', name: 'Ema' },
    sent: [],
    requireConnection() { if (!this.connected) throw new Error('WhatsApp non è connesso'); },
    async sendText(jid, text) { this.sent.push({ jid, text }); return `ID${this.sent.length}`; },
  };
}

test('send_message is declared destructive and stops at the 6th message in a minute', async () => {
  let now = 5_000_000;
  const wa = fakeWa();
  const store = new Store(':memory:');
  store.upsertContact({ jid: CHAT, name: 'Mario' });
  const { client } = await connect({ store, wa, dataDir: '.', sendLimiter: new RateLimiter({ ...SEND_LIMIT, now: () => now }) });

  const { tools } = await client.listTools();
  const send = tools.find(t => t.name === 'send_message');
  assert.ok(send, 'send_message is registered');
  assert.equal(send.annotations.destructiveHint, true);
  assert.equal(send.annotations.readOnlyHint, false);
  assert.match(send.description, /explicit OK/);
  assert.match(send.description, /5 messages per minute/i);
  for (const name of ['list_chats', 'read_messages', 'search_messages', 'find_contact', 'download_media', 'whatsapp_status']) {
    assert.ok(tools.find(t => t.name === name), `${name} is registered`);
  }

  for (let i = 1; i <= 5; i++) {
    const r = await client.callTool({ name: 'send_message', arguments: { chat: 'Mario', text: `msg ${i}` } });
    assert.notEqual(r.isError, true, r.content?.[0]?.text);
    assert.match(r.content[0].text, /Sent to Mario/);
  }
  assert.equal(wa.sent.length, 5);
  assert.equal(wa.sent[0].jid, CHAT);
  assert.equal(wa.sent[0].text, 'msg 1');

  const sixth = await client.callTool({ name: 'send_message', arguments: { chat: 'Mario', text: 'msg 6' } });
  assert.equal(sixth.isError, true);
  assert.match(sixth.content[0].text, /Send limit reached/);
  assert.equal(wa.sent.length, 5);

  now += 61_000;
  const later = await client.callTool({ name: 'send_message', arguments: { chat: '+39 333 1234567', text: 'msg 7' } });
  assert.notEqual(later.isError, true);
  assert.equal(wa.sent.length, 6);
});

test('send_message refuses when not connected, when the limit is shared across MCP sessions, and with empty text', async () => {
  const store = new Store(':memory:');
  const wa = fakeWa();
  const sendLimiter = makeSendLimiter();
  const ctx = { store, wa, dataDir: '.', sendLimiter };
  const a = await connect(ctx);
  const b = await connect(ctx); // ogni richiesta HTTP crea un server MCP nuovo: il limite è nel contesto
  for (let i = 0; i < 5; i++) assert.notEqual((await a.client.callTool({ name: 'send_message', arguments: { chat: CHAT, text: 'x' } })).isError, true);
  const r = await b.client.callTool({ name: 'send_message', arguments: { chat: CHAT, text: 'x' } });
  assert.equal(r.isError, true);
  assert.match(r.content[0].text, /Send limit reached/);

  const empty = await a.client.callTool({ name: 'send_message', arguments: { chat: CHAT, text: '   ' } });
  assert.equal(empty.isError, true);

  wa.connected = false;
  wa.state = 'not_linked';
  const off = await connect({ store, wa, dataDir: '.', sendLimiter: makeSendLimiter() });
  const r2 = await off.client.callTool({ name: 'send_message', arguments: { chat: CHAT, text: 'x' } });
  assert.equal(r2.isError, true);
  assert.match(r2.content[0].text, /non è connesso/);
  assert.equal(wa.sent.length, 5);

  const ro = await connect({ store, wa: null, dataDir: '.' });
  const r3 = await ro.client.callTool({ name: 'send_message', arguments: { chat: CHAT, text: 'x' } });
  assert.equal(r3.isError, true);
  assert.match(r3.content[0].text, /Another copy/);
});
