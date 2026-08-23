/* Service worker Guess The Song.
   Strategi: network-first dengan cadangan cache.
   Sengaja BUKAN cache-first -- kalau cache didahulukan, setiap kali kamu
   memperbarui game-nya pemain akan tetap melihat versi lama sampai cache
   kedaluwarsa. Dengan network-first, versi terbaru selalu menang, dan cache
   hanya dipakai saat jaringan mati. */

const CACHE = 'gts-v1';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './songs.js',
  './app.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((k) => Promise.all(k.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Hanya tangani berkas game itu sendiri. Permintaan ke iTunes dan CDN audio
  // dibiarkan lewat apa adanya -- tidak boleh di-cache dan tidak boleh diganggu.
  if (url.origin !== self.location.origin) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const salinan = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, salinan)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html')))
  );
});
