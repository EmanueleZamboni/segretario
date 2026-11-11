// Piccoli aiuti condivisi da store, client WhatsApp e tool MCP.

import { getContentType, normalizeMessageContent } from 'baileys';

/** Minuscolo e senza accenti, così "perché" trova anche "perche". */
export function fold(text) {
  return (text || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function toSeconds(ts) {
  if (ts == null) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'object' && typeof ts.toNumber === 'function') return ts.toNumber();
  return Number(ts) || 0;
}

const TZ = process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;
const fmt = new Intl.DateTimeFormat('sv-SE', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
});

/** "2026-11-02 14:05" nel fuso configurato (TZ). */
export function formatTime(seconds) {
  return seconds ? fmt.format(new Date(seconds * 1000)) : '?';
}

/** Legge "2026-10-01" o "2026-10-01T14:00" (ora locale) in secondi unix. */
export function parseTime(value, name) {
  if (!value) return undefined;
  const ms = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00` : value);
  if (Number.isNaN(ms)) throw new Error(`${name}: can't read "${value}" as a date, use e.g. 2026-10-01 or 2026-10-01T14:00`);
  return Math.floor(ms / 1000);
}

export function phoneFromJid(jid) {
  const m = /^(\d+)(?::\d+)?@s\.whatsapp\.net$/.exec(jid || '');
  return m ? `+${m[1]}` : undefined;
}

/** Testo con cui si salva un vocale non ancora trascritto: la durata ("12s"). */
export function voicePlaceholder(seconds) {
  return seconds ? `${seconds}s` : '';
}

/** Il prefisso con cui si riconosce un vocale trascritto. */
export const TRANSCRIPT_PREFIX = '[vocale] ';

/**
 * Finestra scorrevole: al massimo `max` eventi ogni `windowMs`. Usata da send_message (5 al minuto).
 * `now` si inietta nei test.
 */
export class RateLimiter {
  constructor({ max, windowMs, now = () => Date.now() }) {
    this.max = max;
    this.windowMs = windowMs;
    this.now = now;
    this.hits = [];
  }

  /** Secondi da aspettare prima del prossimo evento (0 = si può procedere). */
  retryAfter() {
    const t = this.now();
    this.hits = this.hits.filter(h => t - h < this.windowMs);
    if (this.hits.length < this.max) return 0;
    return Math.max(1, Math.ceil((this.hits[0] + this.windowMs - t) / 1000));
  }

  /** Registra un evento; false (e non registra) se il limite è raggiunto. */
  take() {
    if (this.retryAfter() > 0) return false;
    this.hits.push(this.now());
    return true;
  }
}

const MEDIA_TYPES = {
  imageMessage: 'image',
  videoMessage: 'video',
  audioMessage: 'audio',
  documentMessage: 'document',
  stickerMessage: 'sticker',
  ptvMessage: 'video',
};

/**
 * Trasforma un messaggio WhatsApp nei campi che salviamo, o null per quello che non vale
 * la pena mostrare (reazioni, messaggi di protocollo, distribuzione chiavi, ...).
 * Modifiche e cancellazioni tornano come { edit } / { revoke } e lo store le applica.
 */
export function describeMessage(message) {
  let content = normalizeMessageContent(message);
  if (!content) return null;
  if (content.documentWithCaptionMessage) content = normalizeMessageContent(content.documentWithCaptionMessage.message);

  const protocol = content.protocolMessage;
  if (protocol) {
    // type 0 = REVOKE, 14 = MESSAGE_EDIT
    if (protocol.type === 0 && protocol.key?.id) return { revoke: protocol.key.id };
    if (protocol.type === 14 && protocol.key?.id && protocol.editedMessage) {
      const edited = describeMessage(protocol.editedMessage);
      return edited?.text != null ? { edit: protocol.key.id, text: edited.text } : null;
    }
    return null;
  }

  const type = getContentType(content);
  if (!type) return null;
  const inner = content[type];
  const quotedId = inner?.contextInfo?.stanzaId || undefined;

  if (type === 'conversation') return { type: 'text', text: content.conversation };
  if (type === 'extendedTextMessage') return { type: 'text', text: inner.text, quotedId };

  if (MEDIA_TYPES[type]) {
    let kind = MEDIA_TYPES[type];
    if (type === 'audioMessage' && inner.ptt) kind = 'voice';
    return {
      type: kind,
      text: inner.caption || '',
      mime: inner.mimetype || undefined,
      fileName: inner.fileName || undefined,
      seconds: inner.seconds || undefined,
      bytes: Number(inner.fileLength || 0) || undefined,
      quotedId,
      media: true,
    };
  }

  if (type === 'locationMessage' || type === 'liveLocationMessage') {
    const name = [inner.name, inner.address].filter(Boolean).join(', ');
    return { type: 'location', text: `${name ? `${name} ` : ''}(${inner.degreesLatitude}, ${inner.degreesLongitude})`, quotedId };
  }
  if (type === 'contactMessage') return { type: 'contact', text: inner.displayName || '', quotedId };
  if (type === 'contactsArrayMessage') {
    return { type: 'contact', text: (inner.contacts || []).map(c => c.displayName).join(', '), quotedId };
  }
  if (type.startsWith('pollCreationMessage')) {
    return { type: 'poll', text: `${inner.name} [${(inner.options || []).map(o => o.optionName).join(' / ')}]`, quotedId };
  }
  if (type === 'eventMessage') return { type: 'event', text: [inner.name, inner.description].filter(Boolean).join(': '), quotedId };
  if (type === 'buttonsResponseMessage') return { type: 'text', text: inner.selectedDisplayText || '', quotedId };
  if (type === 'listResponseMessage') return { type: 'text', text: inner.title || '', quotedId };
  if (type === 'templateMessage') {
    const t = inner.hydratedTemplate || inner.hydratedFourRowTemplate;
    return t?.hydratedContentText ? { type: 'text', text: t.hydratedContentText } : null;
  }
  // reactionMessage, senderKeyDistributionMessage, pollUpdateMessage, messageContextInfo, ...
  return null;
}
