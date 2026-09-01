// storage.js — camada de persistência em IndexedDB (documentos) + LocalStorage (preferências).
const DB_NAME = 'editor-pdf-html';
const DB_VERSION = 1;
const STORE_DOCS = 'documentos';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_DOCS)) {
        const store = db.createObjectStore(STORE_DOCS, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(mode) {
  return openDB().then((db) => db.transaction(STORE_DOCS, mode).objectStore(STORE_DOCS));
}

export async function saveDoc(doc) {
  doc.updatedAt = new Date().toISOString();
  const store = await tx('readwrite');
  return new Promise((resolve, reject) => {
    // Clona para desanexar de referências vivas do DOM.
    const req = store.put(JSON.parse(JSON.stringify(doc)));
    req.onsuccess = () => resolve(doc);
    req.onerror = () => reject(req.error);
  });
}

export async function getDoc(id) {
  const store = await tx('readonly');
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function listDocs() {
  const store = await tx('readonly');
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => {
      const docs = (req.result || []).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      resolve(docs);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteDoc(id) {
  const store = await tx('readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

// ---- Preferências (LocalStorage, conforme a regra do projeto) ----
const PREF_KEY = 'editor_prefs';
export function getPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch { return {}; }
}
export function setPref(key, value) {
  const p = getPrefs();
  p[key] = value;
  try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch { /* cota cheia — ignora */ }
}

// Guarda o último documento aberto para recuperação.
export function setLastDocId(id) { setPref('lastDocId', id); }
export function getLastDocId() { return getPrefs().lastDocId || null; }
