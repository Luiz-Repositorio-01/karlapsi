/* service-worker.js — cache offline do app (precache + runtime).
 * Estratégia: precache dos arquivos do app (cache-first para estáticos);
 * network-first para navegação; CDNs em cache runtime (stale-while-revalidate). */
const VERSION = 'v1.6.1';
const APP_CACHE = 'editor-app-' + VERSION;
const RUNTIME_CACHE = 'editor-runtime-' + VERSION;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/reset.css',
  './css/variables.css',
  './css/layout.css',
  './css/toolbar.css',
  './css/pages.css',
  './css/tables.css',
  './css/images.css',
  './css/charts.css',
  './css/shapes.css',
  './css/dialogs.css',
  './css/editor.css',
  './css/responsive.css',
  './css/print.css',
  './js/utils.js',
  './js/document-model.js',
  './js/page-setup.js',
  './js/storage.js',
  './js/selection.js',
  './js/history.js',
  './js/editor-core.js',
  './js/formatting.js',
  './js/tables.js',
  './js/images.js',
  './js/charts.js',
  './js/shapes.js',
  './js/pagination.js',
  './js/docx-export.js',
  './js/insert.js',
  './js/find-replace.js',
  './js/keyboard-shortcuts.js',
  './js/autosave.js',
  './js/import.js',
  './js/print.js',
  './js/pdf-export.js',
  './js/ui.js',
  './js/templates.js',
  './js/app.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(APP_CACHE)
      .then((c) => c.addAll(PRECACHE).catch(() => { /* algum arquivo pode faltar em dev */ }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== APP_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Navegação: network-first com fallback ao cache (offline).
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match(request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Mesma origem (HTML/CSS/JS do app): NETWORK-FIRST.
  // Assim, atualizações publicadas aplicam imediatamente quando online;
  // o cache serve apenas como fallback offline. (Antes era cache-first, o que
  // fazia o navegador segurar versões antigas de app.js/css após atualizar.)
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(APP_CACHE).then((c) => c.put(request, copy));
        return res;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // CDNs (fontes, libs): stale-while-revalidate.
  e.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) => cache.match(request).then((cached) => {
      const network = fetch(request).then((res) => { cache.put(request, res.clone()); return res; }).catch(() => cached);
      return cached || network;
    }))
  );
});
