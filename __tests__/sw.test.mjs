import { createRequire } from 'module';
const require = createRequire(import.meta.url);

function createCacheStub(entries = {}) {
    const store = { ...entries };
    return {
        addAll: vi.fn().mockResolvedValue(undefined),
        match: vi.fn((req) => {
            const key = typeof req === 'string' ? req : req.url;
            return Promise.resolve(store[key] || undefined);
        }),
        put: vi.fn((req, res) => {
            const key = typeof req === 'string' ? req : req.url;
            store[key] = res;
            return Promise.resolve();
        }),
    };
}

function buildCachesStub(cacheMap) {
    return {
        open: vi.fn((name) => {
            if (!cacheMap[name]) cacheMap[name] = createCacheStub();
            return Promise.resolve(cacheMap[name]);
        }),
        keys: vi.fn(() => Promise.resolve(Object.keys(cacheMap))),
        delete: vi.fn((name) => { delete cacheMap[name]; return Promise.resolve(true); }),
        match: vi.fn((req) => {
            const lookups = Object.values(cacheMap).map(cache => cache.match(req));
            return Promise.all(lookups).then(results => results.find(Boolean));
        }),
    };
}

function loadFreshSw({ withServiceWorkerScope } = {}) {
    delete require.cache[require.resolve('../sw.js')];
    delete globalThis.self;
    delete globalThis.caches;
    delete globalThis.fetch;
    if (withServiceWorkerScope) {
        globalThis.__listeners = {};
        globalThis.self = {
            addEventListener: vi.fn((event, handler) => {
                globalThis.__listeners[event] = handler;
            }),
        };
        globalThis.caches = buildCachesStub({});
        globalThis.fetch = vi.fn();
    }
    return require('../sw.js');
}

describe('sw.js – Service Worker', () => {
    it('exports cache constants and static assets', () => {
        const sw = loadFreshSw();
        expect(sw.CACHE_NAME).toBe('mango-v2');
        expect(sw.DYNAMIC_CACHE).toBe('mango-dynamic-v1');
        expect(sw.STATIC_ASSETS).toContain('./index.html');
    });

    it('registers install, activate, and fetch listeners in ServiceWorker scope', () => {
        loadFreshSw({ withServiceWorkerScope: true });
        expect(globalThis.__listeners).toHaveProperty('install');
        expect(globalThis.__listeners).toHaveProperty('activate');
        expect(globalThis.__listeners).toHaveProperty('fetch');
    });

    it('install listener caches static assets', async () => {
        loadFreshSw({ withServiceWorkerScope: true });
        let waitUntilPromise;
        const event = { waitUntil: vi.fn((p) => { waitUntilPromise = p; }) };
        globalThis.__listeners.install(event);
        await waitUntilPromise;
        expect(globalThis.caches.open).toHaveBeenCalledWith('mango-v2');
    });

    it('activate listener clears old caches', async () => {
        const cacheMap = {
            'old-cache-v1': createCacheStub(),
            'mango-v2': createCacheStub(),
            'mango-dynamic-v1': createCacheStub(),
        };
        loadFreshSw({ withServiceWorkerScope: true });
        globalThis.caches = buildCachesStub(cacheMap);
        let waitUntilPromise;
        const event = { waitUntil: vi.fn((p) => { waitUntilPromise = p; }) };
        globalThis.__listeners.activate(event);
        await waitUntilPromise;
        expect(globalThis.caches.delete).toHaveBeenCalledWith('old-cache-v1');
        expect(cacheMap).not.toHaveProperty('old-cache-v1');
    });

    it('detects image requests', () => {
        const sw = loadFreshSw();
        expect(sw.isImageRequest({ url: 'https://example.com/a.jpg' })).toBeTruthy();
        expect(sw.isImageRequest({ url: 'https://example.com/a.webp' })).toBeTruthy();
        expect(sw.isImageRequest({ url: 'https://example.com/index.html' })).toBeFalsy();
    });

    it('cacheStaticAssets opens static cache and adds assets', async () => {
        const sw = loadFreshSw();
        const cacheMap = {};
        const cacheStorage = buildCachesStub(cacheMap);
        await sw.cacheStaticAssets(cacheStorage);
        expect(cacheStorage.open).toHaveBeenCalledWith('mango-v2');
        expect(cacheMap['mango-v2'].addAll).toHaveBeenCalledWith(sw.STATIC_ASSETS);
    });

    it('clearOldCaches deletes only stale cache names', async () => {
        const sw = loadFreshSw();
        const cacheMap = {
            'old-cache-v1': createCacheStub(),
            [sw.CACHE_NAME]: createCacheStub(),
            [sw.DYNAMIC_CACHE]: createCacheStub(),
        };
        const cacheStorage = buildCachesStub(cacheMap);
        await sw.clearOldCaches(cacheStorage);
        expect(cacheStorage.delete).toHaveBeenCalledWith('old-cache-v1');
        expect(cacheStorage.delete).not.toHaveBeenCalledWith(sw.CACHE_NAME);
        expect(cacheStorage.delete).not.toHaveBeenCalledWith(sw.DYNAMIC_CACHE);
    });

    it('handleFetch: images use cache-first strategy', async () => {
        const sw = loadFreshSw();
        const cachedResponse = { clone: () => cachedResponse };
        const cacheStorage = buildCachesStub({
            [sw.CACHE_NAME]: createCacheStub({ 'https://example.com/img.jpg': cachedResponse }),
        });
        const fetchImpl = vi.fn();
        const result = await sw.handleFetch({ url: 'https://example.com/img.jpg' }, cacheStorage, fetchImpl);
        expect(result).toBe(cachedResponse);
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it('handleFetch: images fall back to network and update dynamic cache', async () => {
        const sw = loadFreshSw();
        const cacheMap = { [sw.DYNAMIC_CACHE]: createCacheStub() };
        const cacheStorage = buildCachesStub(cacheMap);
        const networkRes = { clone: () => ({ cloned: true }) };
        const fetchImpl = vi.fn().mockResolvedValue(networkRes);
        const request = { url: 'https://example.com/photo.webp' };
        const result = await sw.handleFetch(request, cacheStorage, fetchImpl);
        expect(result).toBe(networkRes);
        expect(cacheStorage.open).toHaveBeenCalledWith(sw.DYNAMIC_CACHE);
        expect(cacheMap[sw.DYNAMIC_CACHE].put).toHaveBeenCalled();
    });

    it('handleFetch: non-image requests use network-first strategy', async () => {
        const sw = loadFreshSw();
        const networkRes = { clone: () => networkRes };
        const fetchImpl = vi.fn().mockResolvedValue(networkRes);
        const result = await sw.handleFetch({ url: 'https://example.com/index.html' }, buildCachesStub({}), fetchImpl);
        expect(result).toBe(networkRes);
    });

    it('handleFetch: non-image falls back to cache when network fails', async () => {
        const sw = loadFreshSw();
        const cachedPage = { clone: () => cachedPage };
        const cacheStorage = buildCachesStub({ [sw.CACHE_NAME]: createCacheStub({ 'https://example.com/page.html': cachedPage }) });
        const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'));
        const result = await sw.handleFetch({ url: 'https://example.com/page.html' }, cacheStorage, fetchImpl);
        expect(result).toBe(cachedPage);
    });
});
