const CACHE_NAME = 'race-app-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './icon.png'
];

// インストール時にファイルをキャッシュ（保存）する
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// オフラインの時はキャッシュからファイルを返す
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});