const CACHE_NAME = 'mango-v2';
const DYNAMIC_CACHE = 'mango-dynamic-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './favicon.jpg',
    './physical-banner.png'
];

function cacheStaticAssets(cacheStorage) {
    return cacheStorage.open(CACHE_NAME)
        .then(function (cache) { return cache.addAll(STATIC_ASSETS); })
        .catch(function (err) {
            console.error('Не вдалося підготувати офлайн-кеш:', err);
            throw err;
        });
}

function clearOldCaches(cacheStorage) {
    return cacheStorage.keys().then(function (keys) {
        return Promise.all(
            keys.filter(function (key) { return key !== CACHE_NAME && key !== DYNAMIC_CACHE; })
                .map(function (key) { return cacheStorage.delete(key); })
        );
    }).catch(function (err) {
        console.error('Не вдалося оновити кеші service worker:', err);
        throw err;
    });
}

function isImageRequest(request) {
    return new URL(request.url).pathname.match(/\.(jpg|jpeg|png|webp|gif)$/);
}

function handleFetch(request, cacheStorage, fetchImpl) {
    if (isImageRequest(request)) {
        return cacheStorage.match(request).then(function (cached) {
            if (cached) return cached;
            return fetchImpl(request)
                .then(function (networkRes) {
                    return cacheStorage.open(DYNAMIC_CACHE).then(function (cache) {
                        return cache.put(request, networkRes.clone())
                            .catch(function (err) { console.warn('Не вдалося закешувати ресурс:', err); })
                            .then(function () { return networkRes; });
                    });
                })
                .catch(function (err) {
                    console.error('Не вдалося завантажити ресурс:', err);
                    throw err;
                });
        });
    }

    return fetchImpl(request).catch(function (err) {
        console.warn('Мережа недоступна, пробую кеш:', err);
        return cacheStorage.match(request).then(function (cached) {
            if (cached) return cached;
            throw err;
        });
    });
}

if (typeof self !== 'undefined' && self.addEventListener) {
    self.addEventListener('install', function (event) {
        event.waitUntil(cacheStaticAssets(caches));
    });

    self.addEventListener('activate', function (event) {
        event.waitUntil(clearOldCaches(caches));
    });

    self.addEventListener('fetch', function (event) {
        event.respondWith(handleFetch(event.request, caches, fetch));
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CACHE_NAME: CACHE_NAME,
        DYNAMIC_CACHE: DYNAMIC_CACHE,
        STATIC_ASSETS: STATIC_ASSETS,
        cacheStaticAssets: cacheStaticAssets,
        clearOldCaches: clearOldCaches,
        isImageRequest: isImageRequest,
        handleFetch: handleFetch,
    };
}
