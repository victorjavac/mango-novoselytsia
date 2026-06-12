const CACHE_NAME = 'mango-v1';
const FILES_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './logo.png',
    './launchericon-192x192.png',
    './launchericon-512x512.png'
];

// Встановлення воркера та збереження файлів у кеш
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Кеш відкрито');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

// Перехоплення запитів (Стратегія: Мережа перш за все, потім Кеш)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});