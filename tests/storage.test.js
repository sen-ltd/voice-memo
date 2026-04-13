/**
 * Tests for storage.js using the in-memory backend.
 * Run with: node --test tests/storage.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  setBackend,
  createMemoryBackend,
  saveMemo,
  getMemo,
  getAllMemos,
  deleteMemo,
  updateMemo,
  getTotalSize,
} from '../src/storage.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMemo(overrides = {}) {
  return {
    label: 'Test memo',
    blob: { size: 1024, type: 'audio/webm' },
    mimeType: 'audio/webm',
    duration: 30,
    transcription: null,
    tags: [],
    createdAt: Date.now(),
    ...overrides,
  };
}

// Fresh in-memory backend for each test group via beforeEach pattern.
// Since node:test doesn't have beforeEach, we just create one per test.

// ─── saveMemo + getMemo ───────────────────────────────────────────────────────

test('saveMemo returns a string id', async () => {
  setBackend(createMemoryBackend());
  const id = await saveMemo(makeMemo());
  assert.equal(typeof id, 'string');
  assert.ok(id.length > 0);
});

test('getMemo returns the saved memo by id', async () => {
  setBackend(createMemoryBackend());
  const memo = makeMemo({ label: 'My recording' });
  const id = await saveMemo(memo);
  const retrieved = await getMemo(id);
  assert.equal(retrieved.id, id);
  assert.equal(retrieved.label, 'My recording');
});

test('getMemo returns undefined for unknown id', async () => {
  setBackend(createMemoryBackend());
  const result = await getMemo('nonexistent-id');
  assert.equal(result, undefined);
});

// ─── getAllMemos ──────────────────────────────────────────────────────────────

test('getAllMemos returns empty array when no memos', async () => {
  setBackend(createMemoryBackend());
  const memos = await getAllMemos();
  assert.deepEqual(memos, []);
});

test('getAllMemos returns all saved memos', async () => {
  setBackend(createMemoryBackend());
  await saveMemo(makeMemo({ label: 'A', createdAt: 1000 }));
  await saveMemo(makeMemo({ label: 'B', createdAt: 2000 }));
  await saveMemo(makeMemo({ label: 'C', createdAt: 3000 }));
  const memos = await getAllMemos();
  assert.equal(memos.length, 3);
});

test('getAllMemos returns memos sorted by createdAt descending', async () => {
  setBackend(createMemoryBackend());
  await saveMemo(makeMemo({ label: 'Oldest', createdAt: 1000 }));
  await saveMemo(makeMemo({ label: 'Newest', createdAt: 3000 }));
  await saveMemo(makeMemo({ label: 'Middle', createdAt: 2000 }));
  const memos = await getAllMemos();
  assert.equal(memos[0].label, 'Newest');
  assert.equal(memos[1].label, 'Middle');
  assert.equal(memos[2].label, 'Oldest');
});

// ─── deleteMemo ──────────────────────────────────────────────────────────────

test('deleteMemo removes memo from store', async () => {
  setBackend(createMemoryBackend());
  const id = await saveMemo(makeMemo());
  await deleteMemo(id);
  const result = await getMemo(id);
  assert.equal(result, undefined);
});

test('deleteMemo on missing id resolves without error', async () => {
  setBackend(createMemoryBackend());
  await assert.doesNotReject(() => deleteMemo('no-such-id'));
});

test('deleteMemo reduces total count', async () => {
  setBackend(createMemoryBackend());
  const id1 = await saveMemo(makeMemo({ label: 'A' }));
  await saveMemo(makeMemo({ label: 'B' }));
  await deleteMemo(id1);
  const memos = await getAllMemos();
  assert.equal(memos.length, 1);
  assert.equal(memos[0].label, 'B');
});

// ─── updateMemo ──────────────────────────────────────────────────────────────

test('updateMemo updates specified fields', async () => {
  setBackend(createMemoryBackend());
  const id = await saveMemo(makeMemo({ label: 'Original' }));
  await updateMemo(id, { label: 'Updated' });
  const memo = await getMemo(id);
  assert.equal(memo.label, 'Updated');
});

test('updateMemo preserves other fields', async () => {
  setBackend(createMemoryBackend());
  const id = await saveMemo(makeMemo({ label: 'Keep', duration: 42 }));
  await updateMemo(id, { transcription: 'hello world' });
  const memo = await getMemo(id);
  assert.equal(memo.label, 'Keep');
  assert.equal(memo.duration, 42);
  assert.equal(memo.transcription, 'hello world');
});

test('updateMemo preserves id', async () => {
  setBackend(createMemoryBackend());
  const id = await saveMemo(makeMemo());
  await updateMemo(id, { label: 'Changed' });
  const memo = await getMemo(id);
  assert.equal(memo.id, id);
});

test('updateMemo rejects when id not found', async () => {
  setBackend(createMemoryBackend());
  await assert.rejects(
    () => updateMemo('bad-id', { label: 'x' }),
    /not found/i
  );
});

test('updateMemo can update tags array', async () => {
  setBackend(createMemoryBackend());
  const id = await saveMemo(makeMemo({ tags: [] }));
  await updateMemo(id, { tags: ['work', 'meeting'] });
  const memo = await getMemo(id);
  assert.deepEqual(memo.tags, ['work', 'meeting']);
});

// ─── getTotalSize ─────────────────────────────────────────────────────────────

test('getTotalSize returns 0 when no memos', async () => {
  setBackend(createMemoryBackend());
  const size = await getTotalSize();
  assert.equal(size, 0);
});

test('getTotalSize sums blob sizes', async () => {
  setBackend(createMemoryBackend());
  await saveMemo(makeMemo({ blob: { size: 500, type: 'audio/webm' } }));
  await saveMemo(makeMemo({ blob: { size: 1500, type: 'audio/webm' } }));
  const size = await getTotalSize();
  assert.equal(size, 2000);
});

test('getTotalSize handles missing blob gracefully', async () => {
  setBackend(createMemoryBackend());
  await saveMemo(makeMemo({ blob: null }));
  const size = await getTotalSize();
  assert.equal(size, 0);
});
