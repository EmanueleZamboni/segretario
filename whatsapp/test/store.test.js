// node --test: lo store SQLite (upsert, trascrizione che resiste alla riconsegna, ricerca).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../src/store.js';
import { TRANSCRIPT_PREFIX } from '../src/util.js';

const CHAT = '393331234567@s.whatsapp.net';
const voice = (over = {}) => ({
  chat: CHAT, id: 'MSG1', fromMe: false, sender: CHAT, senderName: 'Mario', ts: 1_700_000_000,
  type: 'voice', text: '12s', mime: 'audio/ogg; codecs=opus', raw: '{"key":{}}', ...over,
});

test('upsertMessage inserts the message, the chat and the contact', () => {
  const s = new Store(':memory:');
  s.upsertMessage(voice());
  const m = s.message(CHAT, 'MSG1');
  assert.equal(m.text, '12s');
  assert.equal(m.type, 'voice');
  assert.equal(m.from_me, 0);
  assert.equal(s.counts().chats, 1);
  assert.equal(s.counts().messages, 1);
  assert.equal(s.displayName(CHAT), 'Mario');
  assert.equal(s.allChats()[0].last_ts, 1_700_000_000);
});

test('redelivering the same message does not duplicate it or change the text', () => {
  const s = new Store(':memory:');
  s.upsertMessage(voice());
  s.upsertMessage(voice({ senderName: 'Mario Rossi' }));
  assert.equal(s.counts().messages, 1);
  const m = s.message(CHAT, 'MSG1');
  assert.equal(m.text, '12s');
  assert.equal(m.sender_name, 'Mario Rossi');
});

test('setTranscript replaces the placeholder and survives a redelivery', () => {
  const s = new Store(':memory:');
  s.upsertMessage(voice());
  assert.equal(s.setTranscript(CHAT, 'MSG1', `${TRANSCRIPT_PREFIX}Ci vediamo alle otto`), true);
  assert.equal(s.message(CHAT, 'MSG1').text, '[vocale] Ci vediamo alle otto');
  assert.equal(s.message(CHAT, 'MSG1').edited, 0);

  // WhatsApp consegna di nuovo lo stesso vocale (p.es. dopo una riconnessione): "12s" non deve tornare
  s.upsertMessage(voice());
  assert.equal(s.message(CHAT, 'MSG1').text, '[vocale] Ci vediamo alle otto');
  assert.equal(s.counts().messages, 1);
});

test('setTranscript returns false for an unknown or deleted message', () => {
  const s = new Store(':memory:');
  assert.equal(s.setTranscript(CHAT, 'NOPE', '[vocale] x'), false);
  s.upsertMessage(voice());
  s.deleteMessage(CHAT, 'MSG1');
  assert.equal(s.setTranscript(CHAT, 'MSG1', '[vocale] x'), false);
  assert.equal(s.message(CHAT, 'MSG1').text, '');
});

test('search finds the transcript (case and accent insensitive), not the old placeholder', () => {
  const s = new Store(':memory:');
  s.upsertMessage(voice());
  s.upsertMessage(voice({ id: 'MSG2', type: 'text', text: 'messaggio normale', raw: undefined, ts: 1_700_000_001 }));
  assert.equal(s.search({ words: ['perche'], limit: 10 }).length, 0);
  s.setTranscript(CHAT, 'MSG1', `${TRANSCRIPT_PREFIX}Perché non vieni domani?`);
  const hits = s.search({ words: ['perche', 'domani'], limit: 10 });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].id, 'MSG1');
  assert.equal(s.search({ words: ['vocale'], limit: 10 }).length, 1);
  assert.equal(s.search({ words: ['12s'], limit: 10 }).length, 0);
});

test('editMessage marks the message edited; the lid mapping moves messages to the phone jid', () => {
  const s = new Store(':memory:');
  s.upsertMessage(voice({ chat: '12345@lid', sender: '12345@lid', id: 'E1', type: 'text', text: 'ciao', raw: undefined }));
  s.editMessage('12345@lid', 'E1', 'ciao a tutti');
  s.addLidMapping('12345@lid', CHAT);
  const m = s.message(CHAT, 'E1');
  assert.equal(m.text, 'ciao a tutti');
  assert.equal(m.edited, 1);
  assert.equal(s.canonical('12345@lid'), CHAT);
});
