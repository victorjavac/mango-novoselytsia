const CACHE_NAME = 'mango-v2';
const DYNAMIC_CACHE = 'mango-dynamic-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './favicon.jpg',
    './physical-banner.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
                .map(key => caches.delete(key))
        ))
    );
});

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // Стратегія Cache First для зображень (офлайн каталог)
    if (requestUrl.pathname.match(/\.(jpg|jpeg|png|webp|gif)$/)) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;
                return fetch(event.request).then((networkRes) => {
                    return caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(event.request, networkRes.clone());
                        return networkRes;
                    });
                });
            })
        );
    } else {
        // Network First для HTML
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
    }
});