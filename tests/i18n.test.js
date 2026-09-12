/**
 * Tests for i18n.js translations and helpers.
 * Run with: node --test tests/i18n.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { TRANSLATIONS, t, getSpeechLang } from '../src/i18n.js';

// ─── Key parity ───────────────────────────────────────────────────────────────

test('TRANSLATIONS: ja and en define the same keys', () => {
  const ja = Object.keys(TRANSLATIONS.ja).sort();
  const en = Object.keys(TRANSLATIONS.en).sort();
  assert.deepEqual(ja, en);
});

test('TRANSLATIONS: no empty strings in either language', () => {
  for (const lang of ['ja', 'en']) {
    for (const [key, value] of Object.entries(TRANSLATIONS[lang])) {
      assert.equal(typeof value, 'string', `${lang}.${key} is not a string`);
      assert.ok(value.trim().length > 0, `${lang}.${key} is empty`);
    }
  }
});

// ─── Transcription caveat ─────────────────────────────────────────────────────

test('transcribeNote: both languages warn about the speaker→mic loopback', () => {
  assert.match(TRANSLATIONS.en.transcribeNote, /speaker/i);
  assert.match(TRANSLATIONS.en.transcribeNote, /microphone/i);
  assert.match(TRANSLATIONS.ja.transcribeNote, /スピーカー/);
  assert.match(TRANSLATIONS.ja.transcribeNote, /マイク/);
});

test('transcribeNote: both languages mention headphones and echo cancellation', () => {
  assert.match(TRANSLATIONS.en.transcribeNote, /headphones/i);
  assert.match(TRANSLATIONS.en.transcribeNote, /echo cancellation/i);
  assert.match(TRANSLATIONS.ja.transcribeNote, /ヘッドホン/);
  assert.match(TRANSLATIONS.ja.transcribeNote, /エコーキャンセル/);
});

test('transcriptionEmpty: exists in both languages', () => {
  assert.ok(TRANSLATIONS.ja.transcriptionEmpty.length > 0);
  assert.ok(TRANSLATIONS.en.transcriptionEmpty.length > 0);
});

// ─── t() ──────────────────────────────────────────────────────────────────────

test('t: returns the translation for a known key', () => {
  assert.equal(t('transcribe', 'ja'), '文字起こし');
  assert.equal(t('transcribe', 'en'), 'Transcribe');
});

test('t: falls back to the key for an unknown key', () => {
  assert.equal(t('nopeNotAKey', 'ja'), 'nopeNotAKey');
});

test('t: falls back to the key for an unknown language', () => {
  assert.equal(t('transcribe', 'fr'), 'transcribe');
});

// ─── getSpeechLang ────────────────────────────────────────────────────────────

test('getSpeechLang: ja → ja-JP', () => {
  assert.equal(getSpeechLang('ja'), 'ja-JP');
});

test('getSpeechLang: en → en-US', () => {
  assert.equal(getSpeechLang('en'), 'en-US');
});
