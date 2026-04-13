/**
 * Tests for waveform.js pure helpers.
 * Run with: node --test tests/waveform.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { generateWaveformData } from '../src/waveform.js';

// ─── generateWaveformData ─────────────────────────────────────────────────────

test('generateWaveformData returns Float32Array', () => {
  const input = new Float32Array(1000).fill(0.5);
  const result = generateWaveformData(input, 100);
  assert.ok(result instanceof Float32Array);
});

test('generateWaveformData returns correct sample count', () => {
  const input = new Float32Array(1000).fill(0.5);
  const result = generateWaveformData(input, 100);
  assert.equal(result.length, 100);
});

test('generateWaveformData with 50 samples', () => {
  const input = new Float32Array(500).fill(0.3);
  const result = generateWaveformData(input, 50);
  assert.equal(result.length, 50);
});

test('generateWaveformData with 1 sample', () => {
  const input = new Float32Array([0.8]);
  const result = generateWaveformData(input, 1);
  assert.equal(result.length, 1);
  assert.ok(Math.abs(result[0] - 0.8) < 0.0001);
});

test('generateWaveformData picks peak absolute value in block', () => {
  // 4 samples, want 2 output bars → blocks of 2
  const input = new Float32Array([0.1, 0.9, 0.3, 0.5]);
  const result = generateWaveformData(input, 2);
  assert.equal(result.length, 2);
  assert.ok(Math.abs(result[0] - 0.9) < 0.0001, 'first bar should be 0.9');
  assert.ok(Math.abs(result[1] - 0.5) < 0.0001, 'second bar should be 0.5');
});

test('generateWaveformData handles negative values (uses abs)', () => {
  const input = new Float32Array([-0.7, -0.2, 0.1, 0.4]);
  const result = generateWaveformData(input, 2);
  assert.ok(Math.abs(result[0] - 0.7) < 0.0001, 'abs(-0.7) = 0.7');
  assert.ok(Math.abs(result[1] - 0.4) < 0.0001, 'max abs is 0.4');
});

test('generateWaveformData with empty input returns zeros', () => {
  const result = generateWaveformData(new Float32Array(0), 10);
  assert.equal(result.length, 10);
  for (const v of result) assert.equal(v, 0);
});

test('generateWaveformData with null input returns zeros', () => {
  const result = generateWaveformData(null, 5);
  assert.equal(result.length, 5);
  for (const v of result) assert.equal(v, 0);
});

test('generateWaveformData with all zeros input returns zeros', () => {
  const input = new Float32Array(100).fill(0);
  const result = generateWaveformData(input, 20);
  for (const v of result) assert.equal(v, 0);
});

test('generateWaveformData with all-one input returns ones', () => {
  const input = new Float32Array(100).fill(1.0);
  const result = generateWaveformData(input, 10);
  for (const v of result) assert.ok(Math.abs(v - 1.0) < 0.0001);
});

test('generateWaveformData with 200 samples produces 200 bars', () => {
  const input = new Float32Array(2000).fill(0.5);
  const result = generateWaveformData(input, 200);
  assert.equal(result.length, 200);
});

test('generateWaveformData values are in [0, 1] range', () => {
  const input = Float32Array.from({ length: 500 }, (_, i) => Math.sin(i * 0.1));
  const result = generateWaveformData(input, 80);
  for (const v of result) {
    assert.ok(v >= 0, `value ${v} should be >= 0`);
    assert.ok(v <= 1, `value ${v} should be <= 1`);
  }
});

test('generateWaveformData: more target samples than input → still returns target count', () => {
  const input = new Float32Array([0.5, 0.3]);
  const result = generateWaveformData(input, 10);
  assert.equal(result.length, 10);
});

test('generateWaveformData works with a regular Array', () => {
  const input = [0.2, 0.8, 0.4, 0.6];
  const result = generateWaveformData(input, 2);
  assert.equal(result.length, 2);
  assert.ok(result instanceof Float32Array);
});
