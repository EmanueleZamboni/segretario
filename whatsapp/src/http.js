// MCP su Streamable HTTP per claude.ai (web, desktop e telefono) come connettore custom,
// più le pagine per Ema. I connettori custom di claude.ai non mandano una chiave fissa, quindi
// il segreto viaggia nell'URL (dietro il Caddy di Postino, che toglie il prefisso /whatsapp):
//   POST /mcp/<MCP_TOKEN>            MCP (stateless: nessuna sessione, nessuno stream SSE)
//   GET  /mcp/<MCP_TOKEN>/stato      pagina di stato con il QR quando non è collegato
//   POST /mcp/<MCP_TOKEN>/link       avvia il collegamento (nuovo QR)
//   POST /mcp/<MCP_TOKEN>/unlink     scollega
//   GET  /healthz
// Anche "Authorization: Bearer <MCP_TOKEN>" su /mcp funziona (Claude Code, altri client).
// Né il token né il contenuto dei messaggi finiscono mai nei log.

import { createServer } from 'node:http';
import { timingSafeEqual, createHash } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CSP, statusPage } from './pages.js';

const MAX_BODY = 1024 * 1024;

const digest = s => createHash('sha256').update(s).digest();

/**
 * @param {object} opts
 * @param {() => import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} opts.makeServer
 * @param {string} opts.token
 * @param {number} opts.port
 * @param {string} opts.host
 * @param {(...a: any[]) => void} opts.log
 * @param {import('./whatsapp.js').WhatsApp | null} opts.wa
 * @param {import('./store.js').Store} opts.store
 * @param {boolean} opts.transcription   SEGRETARIO_URL impostato
 */
export function startHttp({ makeServer, token, port, host, log, wa, store, transcription }) {
  const expected = digest(token);

  /** Ritorna la pagina chiesta ('' = MCP, 'stato', 'link', 'unlink') se il segreto è giusto, altrimenti undefined. */
  const route = req => {
    const url = new URL(req.url, 'http://x');
    const m = url.pathname.match(/^\/mcp(?:\/([^/]+))?(?:\/(stato|link|unlink))?\/?$/);
    if (!m) return undefined;
    const fromHeader = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const given = m[1] ? decodeURIComponent(m[1]) : fromHeader;
    if (given === undefined || !timingSafeEqual(digest(given), expected)) return undefined;
    return m[2] || '';
  };

  const json = (res, status, body) => {
    res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(body));
  };
  const html = (res, status, body) => {
    res.writeHead(status, {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy': CSP,
      'cache-control': 'no-store',
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
    }).end(body);
  };
  const page = async (res, notice) => html(res, 200, await statusPage({ wa, store, transcription, notice }));

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      if (url.pathname === '/healthz') return void res.writeHead(200, { 'content-type': 'text/plain' }).end('ok');
      if (!url.pathname.startsWith('/mcp')) return void res.writeHead(404).end();
      const what = route(req);
      if (what === undefined) {
        await new Promise(r => setTimeout(r, 300)); // rallenta chi prova a indovinare
        return json(res, 401, { error: 'unauthorized' });
      }

      // ---- pagine per Ema ----
      if (what === 'stato') {
        if (req.method !== 'GET' && req.method !== 'HEAD') return void res.writeHead(405).end();
        return page(res);
      }
      if (what === 'link' || what === 'unlink') {
        if (req.method !== 'POST') return void res.writeHead(405, { allow: 'POST' }).end();
        if (!wa) return html(res, 409, await statusPage({ wa, store, transcription, notice: 'Un\'altra copia possiede la connessione.' }));
        try {
          if (what === 'link') {
            if (wa.state === 'open') return void res.writeHead(303, { location: 'stato' }).end();
            await wa.link();
            // Il QR arriva dopo qualche secondo: la pagina si aggiorna da sola.
          } else {
            await wa.unlink();
          }
        } catch (err) {
          log(`${what} failed:`, err.message);
          return page(res, `${what === 'link' ? 'Collegamento' : 'Scollegamento'} non riuscito: ${err.message}`);
        }
        return void res.writeHead(303, { location: 'stato' }).end();
      }

      // ---- MCP ----
      if (req.method !== 'POST') {
        // Server stateless: nessuno stream SSE autonomo e nessuna sessione da chiudere.
        return json(res, 405, { jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
      }
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > MAX_BODY) return json(res, 413, { error: 'request too large' });
        chunks.push(chunk);
      }
      let body;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        return json(res, 400, { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null });
      }
      const mcp = makeServer();
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      res.on('close', () => {
        transport.close();
        mcp.close();
      });
      await mcp.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (err) {
      log('request failed:', err.message);
      if (!res.headersSent) json(res, 500, { jsonrpc: '2.0', error: { code: -32603, message: 'Internal error' }, id: null });
    }
  });

  return new Promise(resolveListen => {
    server.listen(port, host, () => {
      log(`HTTP on http://${host}:${port}/mcp/<MCP_TOKEN> (pagina: /mcp/<MCP_TOKEN>/stato)`);
      resolveListen(server);
    });
  });
}
