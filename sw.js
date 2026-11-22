const CACHE_NAME = 'adviento-v36';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/main.js',
  './js/diasData.js',
  './js/storage.js',
  './js/calendar.js',
  './js/engine.js',
  './js/ui.js',
  './js/audio.js',
  './js/avatars.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './public/avatars/yo1.png',
  './public/avatars/yo2.png',
  './public/avatars/yo3.png',
  './public/avatars/pareja.png',
  './public/bg-village.svg',
  './games/day01.js',
  './games/day02.js',
  './games/day03.js',
  './games/day04.js',
  './games/day05.js',
  './games/day06.js',
  './games/day07.js',
  './games/day08.js',
  './games/day09.js',
  './games/day10.js',
  './games/day11.js',
  './games/day12.js',
  './games/day13.js',
  './games/day14.js',
  './games/day15.js',
  './games/day16.js',
  './games/day17.js',
  './games/day18.js',
  './games/day19.js',
  './games/day20.js',
  './games/day21.js',
  './games/day22.js',
  './games/day23.js',
  './games/day24.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(ASSETS.map((asset) => cache.add(asset)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((networkRes) => {
        const copy = networkRes.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return networkRes;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
