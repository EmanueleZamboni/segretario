// node --test: il server HTTP (segreto nell'URL, pagina /stato con QR e CSP, link/unlink, MCP).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { Store } from '../src/store.js';
import { createServer } from '../src/tools.js';
import { startHttp } from '../src/http.js';

const TOKEN = 'test-token-0123456789abcdefghijklmnop';

class FakeWa extends EventEmitter {
  constructor() { super(); this.state = 'not_linked'; this.me = undefined; this.qr = undefined; this.links = 0; this.unlinks = 0; }
  get connected() { return this.state === 'open'; }
  isLinked() { return this.state === 'open'; }
  async link() { this.links++; this.state = 'qr'; this.qr = { data: '2@fakeQRpayload,abc,def', at: Date.now() }; }
  async unlink() { this.unlinks++; this.state = 'not_linked'; this.qr = undefined; this.me = undefined; }
}

const store = new Store(':memory:');
const wa = new FakeWa();
const server = await startHttp({
  makeServer: () => createServer({ store, wa, dataDir: '.' }), token: TOKEN, port: 0, host: '127.0.0.1',
  log: () => {}, wa, store, transcription: true,
});
const base = `http://127.0.0.1:${server.address().port}`;
after(() => server.close());

test('healthz is public, everything else needs the secret', async () => {
  assert.equal((await fetch(`${base}/healthz`)).status, 200);
  assert.equal((await fetch(`${base}/mcp/wrong-token-0123456789abcdefghij/stato`)).status, 401);
  assert.equal((await fetch(`${base}/mcp/stato`)).status, 401);
  assert.equal((await fetch(`${base}/altro`)).status, 404);
  assert.equal((await fetch(`${base}/mcp/${TOKEN}/other`)).status, 401);
});

test('/stato shows "Non collegato" with a Collega button, no external assets, strict CSP', async () => {
  const res = await fetch(`${base}/mcp/${TOKEN}/stato`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-security-policy'), "default-src 'none'; style-src 'unsafe-inline'; img-src data:");
  assert.match(res.headers.get('content-type'), /text\/html/);
  const html = await res.text();
  assert.match(html, /Non collegato/);
  assert.match(html, /action="link"/);
  assert.match(html, /Vocali in testo<\/span><span class="v">attiva/);
  assert.doesNotMatch(html, /<script/);
  assert.doesNotMatch(html, /(src|stylesheet[^>]*href)=["']https?:/); // link al hub ok, risorse esterne no
  assert.doesNotMatch(html, /http-equiv="refresh"/);
  assert.ok(!html.includes(TOKEN), 'the token is not written into the page');
});

test('POST link starts the QR flow; /stato then shows the QR as an inline PNG and auto-refreshes', async () => {
  const res = await fetch(`${base}/mcp/${TOKEN}/link`, { method: 'POST', redirect: 'manual' });
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), 'stato');
  assert.equal(wa.links, 1);
  const html = await (await fetch(`${base}/mcp/${TOKEN}/stato`)).text();
  assert.match(html, /In attesa della scansione/);
  assert.match(html, /<img class="qr" src="data:image\/png;base64,[A-Za-z0-9+/=]+"/);
  assert.match(html, /http-equiv="refresh" content="5"/);
  assert.match(html, /Nuovo QR/);
  assert.equal((await fetch(`${base}/mcp/${TOKEN}/link`)).status, 405);
});

test('when linked /stato shows the number and a Scollega button; POST unlink unlinks', async () => {
  wa.state = 'open';
  wa.me = { id: '393331234567@s.whatsapp.net', name: 'Ema <b>' };
  let html = await (await fetch(`${base}/mcp/${TOKEN}/stato`)).text();
  assert.match(html, /Collegato/);
  assert.match(html, /Ema &lt;b&gt; \+393331234567/);
  assert.match(html, /action="unlink"/);
  assert.doesNotMatch(html, /http-equiv="refresh"/);
  const res = await fetch(`${base}/mcp/${TOKEN}/unlink`, { method: 'POST', redirect: 'manual' });
  assert.equal(res.status, 303);
  assert.equal(wa.unlinks, 1);
  html = await (await fetch(`${base}/mcp/${TOKEN}/stato`)).text();
  assert.match(html, /Non collegato/);
});

test('MCP: initialize + tools/list over Streamable HTTP, token in the path or as Bearer', async () => {
  const rpc = (url, headers, body) => fetch(url, {
    method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...headers }, body: JSON.stringify(body),
  });
  const init = { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 't', version: '0' } } };
  let res = await rpc(`${base}/mcp/${TOKEN}`, {}, init);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).result.serverInfo.name, 'whatsapp');
  res = await rpc(`${base}/mcp`, { authorization: `Bearer ${TOKEN}` }, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  assert.equal(res.status, 200);
  const names = (await res.json()).result.tools.map(t => t.name).sort();
  assert.deepEqual(names, ['download_media', 'find_contact', 'list_chats', 'read_messages', 'search_messages', 'send_message', 'whatsapp_status']);
  assert.equal((await rpc(`${base}/mcp`, { authorization: 'Bearer nope' }, init)).status, 401);
  assert.equal((await fetch(`${base}/mcp/${TOKEN}`)).status, 405);
});
