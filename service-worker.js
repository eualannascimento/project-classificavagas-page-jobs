const CACHE_VERSION = '4';
const CACHE_NAME = `classificavagas-v${CACHE_VERSION}`;
const PRECACHE = [
    './',
    './index.html',
    './privacidade.html',
    './termos.html',
    './manifest.json',
    './assets/css/styles.css',
    './assets/js/scripts.js',
    './assets/js/legal.js',
    './assets/js/jobs-worker.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE).catch(() => {}))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    if (url.pathname.endsWith('.json') || url.pathname.endsWith('.json.gz')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                try {
                    const network = await fetch(event.request);
                    if (network.ok) {
                        cache.put(event.request, network.clone());
                    }
                    return network;
                } catch (_) {
                    const cached = await cache.match(event.request);
                    if (cached) return cached;
                    throw _;
                }
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (response.ok && event.request.method === 'GET') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});
