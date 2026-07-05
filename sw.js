const STATIC_CACHE_NAME = 'mango-static-v4';
const DYNAMIC_CACHE_NAME = 'mango-dynamic-v4';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './favicon.jpg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .catch((err) => {
                console.error('Не вдалося підготувати статичний кеш:', err);
                throw err;
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
                .map(key => caches.delete(key))
        )).catch((err) => {
            console.error('Не вдалося оновити кеші service worker:', err);
            throw err;
        })
    );
});

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // Стратегія: Cache First для зображень
    if (requestUrl.pathname.match(/\.(jpg|jpeg|png|webp|gif|svg)$/)) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;
                return fetch(event.request)
                    .then((networkRes) => {
                        return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                            return cache.put(event.request, networkRes.clone())
                                .catch((err) => console.warn('Не вдалося закешувати ресурс:', err))
                                .then(() => networkRes);
                        });
                    })
                    .catch(() => caches.match('./favicon.jpg')); // Фоллбек на іконку
            })
        );
    // Стратегія: Stale-While-Revalidate для CSS, JS та шрифтів
    } else if (requestUrl.pathname.match(/\.(css|js)$/) || requestUrl.hostname.includes('fonts.gstatic.com')) {
        event.respondWith(
            caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                return cache.match(event.request).then(cachedResponse => {
                    const fetchPromise = fetch(event.request).then(networkResponse => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                    return cachedResponse || fetchPromise;
                });
            })
        );
    } else {
        // Стратегія: Network First для HTML та інших запитів
        event.respondWith(
            fetch(event.request).catch((err) => {
                console.warn('Мережа недоступна, пробую кеш:', err);
                return caches.match(event.request).then((cached) => {
                    // Якщо запит є навігаційним і кешу немає, повертаємо головну сторінку
                    if (cached) {
                        return cached;
                    } else if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
        );
    }
});