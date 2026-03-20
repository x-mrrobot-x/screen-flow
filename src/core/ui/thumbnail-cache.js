const DB_NAME = "screenflow-thumbs";
const DB_VERSION = 1;
const STORE = "thumbnails";
const TTL = 7 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 300;

let db = null;
let entryCount = -1;

function openDb() {
  if (db) return Promise.resolve(db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE)) {
        const store = database.createObjectStore(STORE, { keyPath: "key" });
        store.createIndex("cachedAt", "cachedAt", { unique: false });
      }
    };
    req.onsuccess = e => {
      db = e.target.result;
      loadCount(db).catch(() => {});
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
}

function loadCount(database) {
  return new Promise(resolve => {
    const tx = database.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => {
      entryCount = req.result;
      resolve();
    };
    req.onerror = () => resolve();
  });
}

function buildKey(filePath, mtime) {
  return `${filePath}|${mtime || 0}`;
}

function extractPathFromKey(key) {
  return key.split("|")[0];
}

function isExpired(entry) {
  return Date.now() - entry.cachedAt > TTL;
}

function decrementCount() {
  entryCount = Math.max(0, entryCount - 1);
}

async function get(filePath, mtime) {
  try {
    const database = await openDb();
    const key = buildKey(filePath, mtime);
    return new Promise(resolve => {
      const tx = database.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => {
        const entry = req.result;
        if (!entry || isExpired(entry)) return resolve(null);
        resolve(entry.dataUrl);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

function writeEntry(database, key, dataUrl) {
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ key, dataUrl, cachedAt: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function maybeTrim(database) {
  entryCount = Math.max(0, entryCount) + 1;
  if (entryCount > MAX_ENTRIES) {
    trimOldest(database, entryCount - MAX_ENTRIES).catch(() => {});
  }
}

async function set(filePath, mtime, dataUrl) {
  try {
    const database = await openDb();
    const key = buildKey(filePath, mtime);
    await writeEntry(database, key, dataUrl);
    maybeTrim(database);
  } catch {}
}

async function trimOldest(database, excess) {
  return new Promise(resolve => {
    const tx = database.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const index = store.index("cachedAt");
    const req = index.openCursor(null, "next");
    let removed = 0;
    req.onsuccess = e => {
      const cursor = e.target.result;
      if (!cursor || removed >= excess) return resolve();
      cursor.delete();
      removed++;
      decrementCount();
      cursor.continue();
    };
    req.onerror = () => resolve();
  });
}

function shouldEvict(key, folderPath, existingSet) {
  const entryPath = extractPathFromKey(key);
  return entryPath.startsWith(folderPath) && !existingSet.has(entryPath);
}

async function evictFolder(folderPath, existingPaths) {
  try {
    const database = await openDb();
    const existingSet = new Set(existingPaths);
    await new Promise(resolve => {
      const tx = database.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const req = store.openCursor();
      req.onsuccess = e => {
        const cursor = e.target.result;
        if (!cursor) return resolve();
        if (shouldEvict(cursor.value.key, folderPath, existingSet)) {
          cursor.delete();
          decrementCount();
        }
        cursor.continue();
      };
      req.onerror = () => resolve();
    });
  } catch {}
}

async function evictExpired() {
  try {
    const database = await openDb();
    const cutoff = Date.now() - TTL;
    await new Promise(resolve => {
      const tx = database.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const index = store.index("cachedAt");
      const range = IDBKeyRange.upperBound(cutoff);
      const req = index.openCursor(range);
      req.onsuccess = e => {
        const cursor = e.target.result;
        if (!cursor) return resolve();
        cursor.delete();
        decrementCount();
        cursor.continue();
      };
      req.onerror = () => resolve();
    });
  } catch {}
}

async function clearAll() {
  try {
    const database = await openDb();
    await new Promise((resolve, reject) => {
      const tx = database.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    entryCount = 0;
  } catch {}
}

export default {
  get,
  set,
  evictFolder,
  evictExpired,
  clearAll
};
