// node --test: la lettura dei messaggi WhatsApp (describeMessage) e gli aiuti.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeMessage, fold, parseTime, phoneFromJid, voicePlaceholder } from '../src/util.js';

test('plain and extended text', () => {
  assert.deepEqual(describeMessage({ conversation: 'ciao' }), { type: 'text', text: 'ciao' });
  const ext = describeMessage({ extendedTextMessage: { text: 'rispondo', contextInfo: { stanzaId: 'Q1' } } });
  assert.deepEqual(ext, { type: 'text', text: 'rispondo', quotedId: 'Q1' });
});

test('a ptt audio is a voice note with its seconds and mime; plain audio stays audio', () => {
  const v = describeMessage({ audioMessage: { ptt: true, seconds: 12, mimetype: 'audio/ogg; codecs=opus' } });
  assert.equal(v.type, 'voice');
  assert.equal(v.seconds, 12);
  assert.equal(v.mime, 'audio/ogg; codecs=opus');
  assert.equal(v.media, true);
  const a = describeMessage({ audioMessage: { ptt: false, seconds: 200, mimetype: 'audio/mpeg' } });
  assert.equal(a.type, 'audio');
});

test('image with caption, document with file name, ephemeral wrapper', () => {
  const img = describeMessage({ imageMessage: { caption: 'guarda', mimetype: 'image/jpeg' } });
  assert.equal(img.type, 'image');
  assert.equal(img.text, 'guarda');
  const doc = describeMessage({ documentMessage: { fileName: 'fattura.pdf', mimetype: 'application/pdf' } });
  assert.equal(doc.type, 'document');
  assert.equal(doc.fileName, 'fattura.pdf');
  const eph = describeMessage({ ephemeralMessage: { message: { conversation: 'sparisce' } } });
  assert.equal(eph.text, 'sparisce');
});

test('revoke and edit protocol messages; reactions are skipped', () => {
  assert.deepEqual(describeMessage({ protocolMessage: { type: 0, key: { id: 'X1' } } }), { revoke: 'X1' });
  const edit = describeMessage({ protocolMessage: { type: 14, key: { id: 'X2' }, editedMessage: { conversation: 'corretto' } } });
  assert.deepEqual(edit, { edit: 'X2', text: 'corretto' });
  assert.equal(describeMessage({ reactionMessage: { text: '👍', key: { id: 'X3' } } }), null);
  assert.equal(describeMessage(undefined), null);
  assert.equal(describeMessage({}), null);
});

test('location, contact and poll', () => {
  const loc = describeMessage({ locationMessage: { degreesLatitude: 45.4, degreesLongitude: 9.2, name: 'Duomo' } });
  assert.equal(loc.type, 'location');
  assert.equal(loc.text, 'Duomo (45.4, 9.2)');
  assert.equal(describeMessage({ contactMessage: { displayName: 'Anna' } }).text, 'Anna');
  const poll = describeMessage({ pollCreationMessageV3: { name: 'Pizza?', options: [{ optionName: 'sì' }, { optionName: 'no' }] } });
  assert.equal(poll.type, 'poll');
  assert.equal(poll.text, 'Pizza? [sì / no]');
});

test('helpers: fold, phoneFromJid, parseTime, voicePlaceholder', () => {
  assert.equal(fold('Perché È così'), 'perche e cosi');
  assert.equal(phoneFromJid('393331234567:12@s.whatsapp.net'), '+393331234567');
  assert.equal(phoneFromJid('123@g.us'), undefined);
  assert.equal(parseTime('2026-10-01', 'after'), Math.floor(Date.parse('2026-10-01T00:00') / 1000));
  assert.throws(() => parseTime('ieri', 'after'), /after/);
  assert.equal(voicePlaceholder(12), '12s');
  assert.equal(voicePlaceholder(undefined), '');
});
