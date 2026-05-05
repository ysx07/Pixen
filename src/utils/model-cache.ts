/**
 * IndexedDB-backed cache for ONNX model weights.
 *
 * Used by the AI worker for RMBG-1.4 and the upscale model. The default
 * background-removal path (@imgly/background-removal) maintains its own cache
 * and does not go through this module.
 *
 * Stores raw ArrayBuffers keyed by model id. Persists across reloads so the
 * ~45MB / ~5MB downloads happen exactly once per user.
 */

const DB_NAME = 'pixen-models';
const DB_VERSION = 1;
const STORE = 'weights';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
  return dbPromise;
}

export async function readCachedModel(id: string): Promise<ArrayBuffer | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as ArrayBuffer | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function writeCachedModel(id: string, buffer: ArrayBuffer): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(buffer, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listCachedModels(): Promise<string[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAllKeys();
    req.onsuccess = () => resolve(req.result.map(String));
    req.onerror = () => reject(req.error);
  });
}

export async function clearModelCache(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export interface FetchProgress {
  loaded: number;
  total: number;
}

/**
 * Fetch a model from the network with progress reporting, then store in IDB.
 * Subsequent calls hit the cache.
 */
export async function fetchAndCacheModel(
  id: string,
  url: string,
  onProgress?: (p: FetchProgress) => void,
): Promise<ArrayBuffer> {
  const cached = await readCachedModel(id);
  if (cached) return cached;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch model ${id}: ${res.status} ${res.statusText}`);
  const total = Number(res.headers.get('content-length') ?? 0);

  if (!res.body || !onProgress) {
    const buf = await res.arrayBuffer();
    await writeCachedModel(id, buf);
    return buf;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onProgress({ loaded, total });
  }
  const merged = new Uint8Array(loaded);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  const buf = merged.buffer;
  await writeCachedModel(id, buf);
  return buf;
}
