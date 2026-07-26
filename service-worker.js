const CACHE_VERSION = '24';
const CACHE_NAME = `classificavagas-v${CACHE_VERSION}`;
const PRECACHE = [
    './',
    './index.html',
    './privacidade.html',
    './termos.html',
    './manifest.json',
    './robots.txt',
    './sitemap.xml',
    './.well-known/security.txt',
    './assets/css/fonts-text.css',
    './assets/fonts/barlow-400.woff2',
    './assets/fonts/barlow-500.woff2',
    './assets/fonts/barlow-700.woff2',
    './assets/fonts/barlow-condensed-400.woff2',
    './assets/fonts/barlow-condensed-600.woff2',
    './assets/css/fonts-icons.css',
    './assets/css/styles.css',
    './assets/css/curriculum-theme.css',
    './assets/js/theme-init.js',
    './assets/js/product-hub.js',
    './assets/js/link-prefetch.js',
    './assets/js/legal-chrome.js',
    './assets/js/legal.js',
    './assets/js/privacy-notice.js',
    './assets/js/focus-trap.js',
    './assets/js/view-mode-manager.js',
    './assets/js/scripts.js',
    './assets/js/jobs-worker.js'
];

self.addEventListener('install', (event) => {
    // cache.addAll() is atomic: a single 404 rejects the whole batch and, with
    // the error swallowed, the entire precache silently became a no-op. Cache
    // entries individually so one bad URL cannot take the others down, and log
    // whatever failed instead of hiding it.
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            const results = await Promise.allSettled(
                PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' })))
            );
            const failed = results
                .map((result, index) => (result.status === 'rejected' ? PRECACHE[index] : null))
                .filter(Boolean);
            if (failed.length) {
                console.error('[sw] precache falhou para:', failed);
            }
        })
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

    // HTML: network-first. The old cache-first rule also covered /resume/,
    // whose files are not in PRECACHE, so a visitor could stay pinned to an old
    // build until CACHE_VERSION was bumped by hand.
    const isHtml = event.request.mode === 'navigate'
        || event.request.destination === 'document'
        || url.pathname.endsWith('.html')
        || url.pathname.endsWith('/');

    if (isHtml) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(async () => {
                    const cached = await caches.match(event.request);
                    if (cached) return cached;
                    throw new Error('offline e sem copia em cache');
                })
        );
        return;
    }

    // Everything else: stale-while-revalidate, so a deploy is picked up on the
    // next navigation instead of never.
    event.respondWith(
        caches.match(event.request).then((cached) => {
            const network = fetch(event.request)
                .then((response) => {
                    if (response.ok && event.request.method === 'GET') {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch((err) => {
                    // Revalidation failing offline must not surface as an
                    // unhandled rejection when we already served from cache.
                    if (cached) return cached;
                    throw err;
                });
            return cached || network;
        })
    );
});
