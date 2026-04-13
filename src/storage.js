/**
 * IndexedDB storage for voice memos.
 *
 * The store is pluggable: by default it uses real IndexedDB,
 * but tests can inject an in-memory backend by calling `setBackend(backend)`.
 *
 * Memo structure:
 * {
 *   id: string,
 *   label: string,
 *   blob: Blob,
 *   mimeType: string,
 *   duration: number,
 *   transcription: string | null,
 *   tags: string[],
 *   createdAt: number,
 * }
 */

const DB_NAME = 'voice-memo-db';
const DB_VERSION = 1;
const STORE_NAME = 'memos';

// ─── Pluggable backend ────────────────────────────────────────────────────────

/** @type {StorageBackend | null} */
let _backend = null;

/**
 * Inject a custom backend (for testing).
 * Pass `null` to revert to IndexedDB.
 *
 * @param {StorageBackend | null} backend
 */
export function setBackend(backend) {
  _backend = backend;
}

// ─── IndexedDB backend ────────────────────────────────────────────────────────

/** @type {IDBDatabase | null} */
let _db = null;

/**
 * Open (or reuse) the IndexedDB connection.
 *
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function idbTx(db, mode) {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

function promisify(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Save a new memo. Returns the generated id.
 *
 * @param {Omit<Memo, 'id'>} memo
 * @returns {Promise<string>}
 */
export async function saveMemo(memo) {
  if (_backend) return _backend.saveMemo(memo);
  const db = await openDB();
  const id = `memo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record = { ...memo, id };
  await promisify(idbTx(db, 'readwrite').put(record));
  return id;
}

/**
 * Get a single memo by id.
 *
 * @param {string} id
 * @returns {Promise<Memo | undefined>}
 */
export async function getMemo(id) {
  if (_backend) return _backend.getMemo(id);
  const db = await openDB();
  return promisify(idbTx(db, 'readonly').get(id));
}

/**
 * Get all memos, sorted by createdAt descending (newest first).
 *
 * @returns {Promise<Memo[]>}
 */
export async function getAllMemos() {
  if (_backend) return _backend.getAllMemos();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = idbTx(db, 'readonly').getAll();
    req.onsuccess = () => {
      const memos = req.result;
      memos.sort((a, b) => b.createdAt - a.createdAt);
      resolve(memos);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a memo by id.
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteMemo(id) {
  if (_backend) return _backend.deleteMemo(id);
  const db = await openDB();
  await promisify(idbTx(db, 'readwrite').delete(id));
}

/**
 * Update specific fields of a memo.
 *
 * @param {string} id
 * @param {Partial<Memo>} updates
 * @returns {Promise<void>}
 */
export async function updateMemo(id, updates) {
  if (_backend) return _backend.updateMemo(id, updates);
  const db = await openDB();
  const existing = await promisify(idbTx(db, 'readonly').get(id));
  if (!existing) throw new Error(`Memo not found: ${id}`);
  const updated = { ...existing, ...updates, id };
  await promisify(idbTx(db, 'readwrite').put(updated));
}

/**
 * Get total storage used by all memo blobs in bytes.
 *
 * @returns {Promise<number>}
 */
export async function getTotalSize() {
  if (_backend) return _backend.getTotalSize();
  const memos = await getAllMemos();
  return memos.reduce((sum, m) => sum + (m.blob?.size ?? 0), 0);
}

// ─── In-memory backend (for tests) ───────────────────────────────────────────

/**
 * Create a simple in-memory storage backend.
 * Returns an object matching the StorageBackend interface.
 *
 * @returns {StorageBackend}
 */
export function createMemoryBackend() {
  /** @type {Map<string, Memo>} */
  const store = new Map();
  let counter = 0;

  return {
    saveMemo(memo) {
      const id = `mem-${++counter}`;
      store.set(id, { ...memo, id });
      return Promise.resolve(id);
    },
    getMemo(id) {
      return Promise.resolve(store.get(id));
    },
    getAllMemos() {
      const memos = [...store.values()].sort((a, b) => b.createdAt - a.createdAt);
      return Promise.resolve(memos);
    },
    deleteMemo(id) {
      store.delete(id);
      return Promise.resolve();
    },
    updateMemo(id, updates) {
      const existing = store.get(id);
      if (!existing) return Promise.reject(new Error(`Memo not found: ${id}`));
      store.set(id, { ...existing, ...updates, id });
      return Promise.resolve();
    },
    getTotalSize() {
      let total = 0;
      for (const m of store.values()) total += m.blob?.size ?? 0;
      return Promise.resolve(total);
    },
  };
}
