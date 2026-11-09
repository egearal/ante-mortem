// ANTE MORTEM service worker — the House keeps a copy of itself in your pocket.
// Network-first for everything same-origin (so a new night always arrives when
// online), falling back to the cached copy offline. Works for both hosted
// layouts: the repo root (index.html + styles.css + src/*.js) and dist/
// (ante-mortem.html). Missing files are skipped, never fatal.
'use strict';
const CACHE = 'ante-mortem-v5-j';
const SRC = ['core', 'sfx', 'fx', 'weapons', 'passives', 'tarot', 'wheel', 'ascent', 'slot', 'marker', 'ranks', 'vault', 'ui', 'daily'];
const PRECACHE = ['./', './index.html', './styles.css', './ante-mortem.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/icon-180.png', './icons/icon.svg']
  .concat(SRC.map(s => './src/' + s + '.js'));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(PRECACHE.map(u =>
    fetch(u, { cache: 'reload' }).then(r => { if (r.ok) return c.put(u, r); }).catch(() => {})
  ))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ante-mortem-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(res => {
    if (res && res.ok && res.type === 'basic') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)).catch(() => {}); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit ||
    (req.mode === 'navigate' ? caches.match('./index.html').then(h => h || caches.match('./ante-mortem.html')) : undefined)
  ).then(r => r || new Response('', { status: 504, statusText: 'offline' }))));
});
