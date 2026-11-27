/* Service worker TuneUp — 100% Online-Only (tanpa cache offline).
   Semua cache lama dihapus saat aktivasi dan setiap request selalu divalidasi
   ke server (no-cache / ETag) agar update langsung masuk dan file besar seperti
   songs.js tetap hemat kuota via 304 Not Modified saat belum berubah. */

const CACHE = 'gts-v176-wave129-lyric-timestamps-audio-sync';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './layout.css',
  './site-guide.css',
  './site-guide.js',
  './fonts/GeneralSans-Variable.woff2',
  './fonts/CabinetGrotesk-Variable.woff2',
  './fonts/Unbounded-Bold.woff2',
  './app.js',
  './recordings.js',
  './feedback.js',
  './analytics.js',
  './challenge.js',
  './daily.js',
  './daily-pool-v1.js',
  './presets.js',
  './duel-streams-v1.js',
  './duel.js',
  './artist-game.js',
  './daily-hub-data.js',
  './daily-hub.js',
  './mini-games.js',
  './backup.js',
  './badges.js',
  './i18n.js',
  './songs.js',
  './app.webmanifest',
  './og-image.png',
  './favicon.ico',
  './icon-32.png',
  './icon-96.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.cache === 'only-if-cached' && e.request.mode !== 'same-origin') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (e.request.method !== 'GET') return;
  if (url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/mv-frames/') ||
      url.pathname.startsWith('/icon-') || url.pathname === '/og-image.png' || url.pathname === '/favicon.ico' ||
      url.pathname.endsWith('.css') || (url.pathname.endsWith('.js') && url.pathname !== '/sw.js')) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }));
});
