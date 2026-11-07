// Il lato WhatsApp: un dispositivo collegato (come WhatsApp Web) costruito su Baileys.
// Tiene aggiornato lo store, scarica i media per i tool e manda un testo solo quando
// send_message lo chiede (dopo l'OK di Ema).
//
// Stati (this.state): not_linked, qr (QR in attesa di scansione), connecting, open,
// reconnecting, logged_out (il telefono ha tolto il dispositivo), replaced (un'altra copia
// ha preso la sessione).

import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import makeWASocket, {
  Browsers, BufferJSON, DisconnectReason, downloadMediaMessage, fetchLatestBaileysVersion,
  isJidGroup, jidNormalizedUser, useMultiFileAuthState,
} from 'baileys';
import pino from 'pino';
import { describeMessage, toSeconds, voicePlaceholder } from './util.js';

const SKIP_CHATS = /@(broadcast|newsletter)$/;

export class WhatsApp extends EventEmitter {
  /**
   * @param {object} opts
   * @param {string} opts.dataDir      dove sta auth/
   * @param {import('./store.js').Store} opts.store
   * @param {string} [opts.pairingPhone]  collega con un codice di 8 caratteri invece del QR (cifre, con prefisso)
   */
  constructor({ dataDir, store, pairingPhone, logLevel = 'warn' }) {
    super();
    this.dataDir = dataDir;
    this.authDir = join(dataDir, 'auth');
    this.store = store;
    this.pairingPhone = pairingPhone?.replace(/\D/g, '');
    this.logger = pino({ level: logLevel }, pino.destination(2)); // stderr: stdout è dell'MCP (stdio)
    this.state = 'not_linked';
    this.lastError = undefined;
    this.me = undefined;
    this.qr = undefined; // { data, at } mentre si aspetta la scansione
    this.retries = 0;
    this.stopped = false;
    this.sock = undefined;
    this.creds = undefined;
  }

  get connected() {
    return this.state === 'open';
  }

  /** True quando un telefono ha accettato il collegamento (creds.json esiste anche prima). */
  isLinked() {
    try {
      return !!JSON.parse(readFileSync(join(this.authDir, 'creds.json'), 'utf8')).me;
    } catch {
      return false;
    }
  }

  /** Apre (o riapre) il socket. Senza sessione salvata parte il QR. */
  async start() {
    if (this.sock && ['qr', 'connecting', 'open'].includes(this.state)) return; // già in corso
    this.stopped = false;
    await mkdir(this.authDir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
    this.creds = state.creds;
    let version;
    try {
      ({ version } = await fetchLatestBaileysVersion());
    } catch { /* si usa la versione inclusa in Baileys */ }

    const sock = makeWASocket({
      version,
      auth: state,
      logger: this.logger,
      browser: Browsers.macOS('Desktop'), // un dispositivo "desktop" riceve tutta la storia al primo collegamento
      syncFullHistory: true,
      markOnlineOnConnect: false, // restiamo "offline" così il telefono continua a ricevere le notifiche
      getMessage: async key => {
        const raw = this.store.rawMessage(key.id);
        return raw ? JSON.parse(raw, BufferJSON.reviver).message : undefined;
      },
    });
    this.sock = sock;
    this.state = 'connecting';
    this.qr = undefined;

    if (this.pairingPhone && !state.creds.registered) {
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(this.pairingPhone);
          this.emit('pairing-code', code.match(/.{1,4}/g).join('-'));
        } catch (err) {
          this.logger.error({ err }, 'pairing code request failed');
        }
      }, 3000);
    }

    sock.ev.process(async events => {
      if (sock !== this.sock) return; // socket vecchio, chiuso da unlink/stop
      try {
        await this.handle(events, saveCreds, sock);
      } catch (err) {
        this.logger.error({ err }, 'event handling failed');
      }
    });
  }

  async handle(events, saveCreds, sock) {
    if (events['creds.update']) await saveCreds();

    const conn = events['connection.update'];
    if (conn) {
      if (conn.qr && !this.pairingPhone) {
        this.state = 'qr';
        this.qr = { data: conn.qr, at: Date.now() };
        this.emit('qr', conn.qr);
      }
      if (conn.connection === 'open') {
        this.state = 'open';
        this.qr = undefined;
        this.retries = 0;
        this.lastError = undefined;
        this.me = { id: jidNormalizedUser(this.sock.user?.id), name: this.sock.user?.name };
        this.store.setMeta('me', JSON.stringify(this.me));
        this.emit('open', this.me);
        this.refreshGroups();
      }
      if (conn.connection === 'close') await this.onClose(conn.lastDisconnect?.error, sock);
    }

    if (events['lid-mapping.update']) {
      const { lid, pn } = events['lid-mapping.update'];
      this.store.addLidMapping(lid, pn);
    }

    const history = events['messaging-history.set'];
    if (history) {
      this.store.tx(() => {
        for (const m of history.lidPnMappings || []) this.store.addLidMapping(m.lid, m.pn);
        for (const c of history.contacts || []) this.saveContact(c);
        for (const c of history.chats || []) {
          if (SKIP_CHATS.test(c.id)) continue;
          this.store.upsertChat({
            jid: c.id, name: c.name || undefined, isGroup: isJidGroup(c.id),
            lastTs: toSeconds(c.conversationTimestamp), unread: c.unreadCount ?? undefined, archived: c.archived ?? undefined,
          });
        }
        for (const msg of history.messages || []) this.saveMessage(msg);
      });
      this.store.setMeta('last_history_sync', Date.now());
      this.emit('history', { messages: history.messages?.length || 0, progress: history.progress, isLatest: history.isLatest });
    }
    if (events['messaging-history.status']?.status === 'complete') this.emit('history-complete');

    for (const c of [...(events['contacts.upsert'] || []), ...(events['contacts.update'] || [])]) this.saveContact(c);

    for (const c of [...(events['chats.upsert'] || []), ...(events['chats.update'] || [])]) {
      if (!c.id || SKIP_CHATS.test(c.id)) continue;
      if (c.name || c.conversationTimestamp || c.archived != null) {
        this.store.upsertChat({
          jid: c.id, name: c.name || undefined, isGroup: isJidGroup(c.id),
          lastTs: toSeconds(c.conversationTimestamp), archived: c.archived ?? undefined,
        });
      }
      if (typeof c.unreadCount === 'number') this.store.applyUnread(c.id, c.unreadCount);
    }

    for (const g of [...(events['groups.upsert'] || []), ...(events['groups.update'] || [])]) {
      if (g.id && g.subject) this.store.upsertChat({ jid: g.id, name: g.subject, isGroup: true });
    }

    const upsert = events['messages.upsert'];
    if (upsert) {
      for (const msg of upsert.messages) {
        const saved = this.saveMessage(msg);
        // 'notify' = messaggio nuovo dal vivo; 'append' = storia o riconsegna, non si trascrive
        if (saved && upsert.type === 'notify') this.emit('message', saved);
      }
    }
  }

  async onClose(error, sock) {
    if (sock && sock !== this.sock) return; // chiuso da noi (unlink/stop): nessuna riconnessione
    const code = error?.output?.statusCode;
    this.lastError = error?.message;
    this.qr = undefined;
    if (this.stopped) return;
    if (code === DisconnectReason.loggedOut) {
      this.state = 'logged_out';
      this.sock = undefined;
      await rm(this.authDir, { recursive: true, force: true });
      this.emit('logged-out');
      return;
    }
    if (code === DisconnectReason.connectionReplaced) {
      // Un'altra copia del connettore usa la stessa sessione.
      this.state = 'replaced';
      this.sock = undefined;
      this.emit('replaced');
      return;
    }
    if (!this.creds?.registered) {
      // Nessuno ha scansionato il QR in tempo: si torna in attesa, il pulsante "Collega" lo rifà.
      this.state = 'not_linked';
      this.sock = undefined;
      this.lastError = 'QR scaduto, nessuna scansione';
      this.emit('qr-expired');
      return;
    }
    this.state = 'reconnecting';
    const delay = code === DisconnectReason.restartRequired ? 0 : Math.min(60_000, 2000 * 2 ** this.retries++);
    setTimeout(() => {
      this.sock = undefined;
      this.start().catch(err => this.onClose(err));
    }, delay);
  }

  /**
   * Dal pulsante "Collega" della pagina /stato: apre il socket e fa partire il QR.
   * Se è già collegato non fa niente.
   */
  async link() {
    if (['qr', 'connecting', 'open', 'reconnecting'].includes(this.state) && this.sock) return;
    await this.start();
  }

  /**
   * Dal pulsante "Scollega" o dal comando logout: chiude la sessione sul telefono (se connesso),
   * chiude il socket e cancella le chiavi. I messaggi salvati restano nello store.
   */
  async unlink() {
    const sock = this.sock;
    this.sock = undefined; // gli eventi del vecchio socket vengono ignorati da qui in poi
    this.qr = undefined;
    if (sock && this.state === 'open') {
      try { await sock.logout(); } catch { /* il telefono lo toglierà dai dispositivi collegati */ }
    } else {
      try { sock?.end(undefined); } catch { /* già chiuso */ }
    }
    await rm(this.authDir, { recursive: true, force: true });
    this.state = 'not_linked';
    this.me = undefined;
    this.creds = undefined;
    this.lastError = undefined;
    this.emit('unlinked');
  }

  async refreshGroups() {
    try {
      const groups = await this.sock.groupFetchAllParticipating();
      this.store.tx(() => {
        for (const g of Object.values(groups)) this.store.upsertChat({ jid: g.id, name: g.subject, isGroup: true });
      });
    } catch (err) {
      this.logger.warn({ err }, 'could not fetch groups');
    }
  }

  saveContact(c) {
    if (!c?.id) return;
    if (c.lid && c.phoneNumber) this.store.addLidMapping(c.lid, c.phoneNumber);
    else if (c.id.endsWith('@lid') && c.phoneNumber) this.store.addLidMapping(c.id, c.phoneNumber);
    else if (c.lid && c.id.endsWith('@s.whatsapp.net')) this.store.addLidMapping(c.lid, c.id);
    if (isJidGroup(c.id)) {
      if (c.name || c.subject) this.store.upsertChat({ jid: c.id, name: c.name || c.subject, isGroup: true });
      return;
    }
    this.store.upsertContact({ jid: c.id, name: c.name || undefined, notify: c.notify || c.verifiedName || undefined });
  }

  /** Salva un WAMessage; ritorna i campi salvati (più `seconds` per i vocali), o undefined se saltato. */
  saveMessage(msg) {
    const key = msg?.key;
    const chat = key?.remoteJid;
    if (!chat || !key.id || SKIP_CHATS.test(chat)) return undefined;
    if (key.remoteJidAlt) this.store.addLidMapping(chat, key.remoteJidAlt);
    if (key.participant && key.participantAlt) this.store.addLidMapping(key.participant, key.participantAlt);

    const desc = describeMessage(msg.message);
    if (!desc) return undefined;
    if (desc.revoke) return void this.store.deleteMessage(chat, desc.revoke);
    if (desc.edit) return void this.store.editMessage(chat, desc.edit, desc.text);

    const fromMe = !!key.fromMe;
    const record = {
      chat,
      id: key.id,
      fromMe,
      sender: fromMe ? this.me?.id : (key.participant || chat),
      senderName: fromMe ? undefined : msg.pushName || undefined,
      ts: toSeconds(msg.messageTimestamp) || Math.floor(Date.now() / 1000),
      type: desc.type,
      text: desc.type === 'voice' ? voicePlaceholder(desc.seconds) : desc.text,
      mime: desc.mime,
      fileName: desc.fileName,
      quotedId: desc.quotedId,
      seconds: desc.seconds,
      raw: desc.media
        ? JSON.stringify({ key, message: msg.message, messageTimestamp: msg.messageTimestamp }, BufferJSON.replacer)
        : undefined,
    };
    this.store.upsertMessage(record);
    return record;
  }

  requireConnection() {
    if (this.connected) return;
    const why = {
      qr: 'WhatsApp non è ancora collegato: apri la pagina /stato e scansiona il QR dal telefono.',
      not_linked: 'WhatsApp non è collegato: apri la pagina /stato, premi "Collega" e scansiona il QR dal telefono.',
      logged_out: 'Il telefono ha scollegato questo dispositivo: apri la pagina /stato e collega di nuovo.',
      replaced: 'Un\'altra copia del connettore ha preso questa sessione WhatsApp: chiudila e riavvia questa.',
    }[this.state] || `WhatsApp non è connesso in questo momento (${this.state}${this.lastError ? `: ${this.lastError}` : ''}). Riprova tra un minuto.`;
    throw new Error(why);
  }

  async download(raw) {
    this.requireConnection();
    const msg = JSON.parse(raw, BufferJSON.reviver);
    return downloadMediaMessage(msg, 'buffer', {}, { logger: this.logger, reuploadRequest: this.sock.updateMediaMessage });
  }

  /** Manda un testo a una chat (jid). Il messaggio inviato viene salvato nello store come gli altri. */
  async sendText(jid, text) {
    this.requireConnection();
    const sent = await this.sock.sendMessage(jid, { text });
    if (sent) this.saveMessage(sent);
    return sent?.key?.id;
  }

  async stop() {
    this.stopped = true;
    const sock = this.sock;
    this.sock = undefined;
    try { sock?.end(undefined); } catch { /* già chiuso */ }
  }
}
