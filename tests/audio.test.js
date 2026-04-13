/**
 * Tests for audio.js pure helpers.
 * Run with: node --test tests/audio.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatDuration,
  formatFileSize,
  getMimeType,
} from '../src/audio.js';

// ─── formatDuration ───────────────────────────────────────────────────────────

test('formatDuration: 0 seconds → 00:00', () => {
  assert.equal(formatDuration(0), '00:00');
});

test('formatDuration: 30 seconds → 00:30', () => {
  assert.equal(formatDuration(30), '00:30');
});

test('formatDuration: 59 seconds → 00:59', () => {
  assert.equal(formatDuration(59), '00:59');
});

test('formatDuration: 60 seconds → 01:00', () => {
  assert.equal(formatDuration(60), '01:00');
});

test('formatDuration: 90 seconds → 01:30', () => {
  assert.equal(formatDuration(90), '01:30');
});

test('formatDuration: 3600 seconds → 1:00:00', () => {
  assert.equal(formatDuration(3600), '1:00:00');
});

test('formatDuration: 3690 seconds → 1:01:30', () => {
  assert.equal(formatDuration(3690), '1:01:30');
});

test('formatDuration: 7199 seconds → 1:59:59', () => {
  assert.equal(formatDuration(7199), '1:59:59');
});

test('formatDuration: negative value → 00:00', () => {
  assert.equal(formatDuration(-5), '00:00');
});

test('formatDuration: NaN → 00:00', () => {
  assert.equal(formatDuration(NaN), '00:00');
});

test('formatDuration: Infinity → 00:00', () => {
  assert.equal(formatDuration(Infinity), '00:00');
});

test('formatDuration: fractional seconds are floored', () => {
  assert.equal(formatDuration(90.9), '01:30');
});

// ─── formatFileSize ───────────────────────────────────────────────────────────

test('formatFileSize: 0 bytes', () => {
  assert.equal(formatFileSize(0), '0 B');
});

test('formatFileSize: 512 bytes', () => {
  assert.equal(formatFileSize(512), '512 B');
});

test('formatFileSize: 1023 bytes stays as B', () => {
  assert.equal(formatFileSize(1023), '1023 B');
});

test('formatFileSize: 1024 bytes → 1.0 KB', () => {
  assert.equal(formatFileSize(1024), '1.0 KB');
});

test('formatFileSize: 1536 bytes → 1.5 KB', () => {
  assert.equal(formatFileSize(1536), '1.5 KB');
});

test('formatFileSize: 1048576 bytes → 1.0 MB', () => {
  assert.equal(formatFileSize(1048576), '1.0 MB');
});

test('formatFileSize: 1572864 bytes → 1.5 MB', () => {
  assert.equal(formatFileSize(1572864), '1.5 MB');
});

test('formatFileSize: 1073741824 bytes → 1.0 GB', () => {
  assert.equal(formatFileSize(1073741824), '1.0 GB');
});

test('formatFileSize: negative value → 0 B', () => {
  assert.equal(formatFileSize(-100), '0 B');
});

// ─── getMimeType ──────────────────────────────────────────────────────────────

test('getMimeType: returns blob type when set', () => {
  // Simulate a minimal Blob-like object
  const blob = { type: 'audio/webm;codecs=opus' };
  assert.equal(getMimeType(blob), 'audio/webm;codecs=opus');
});

test('getMimeType: falls back to audio/webm when type is empty', () => {
  const blob = { type: '' };
  assert.equal(getMimeType(blob), 'audio/webm');
});

test('getMimeType: handles ogg type', () => {
  const blob = { type: 'audio/ogg' };
  assert.equal(getMimeType(blob), 'audio/ogg');
});
