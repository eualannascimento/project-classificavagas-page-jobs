const CACHE_VERSION = '16';
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
    './assets/css/fonts-icons.css',
    './assets/css/styles.css',
    './assets/js/theme-init.js',
    './assets/js/product-hub.js',
    './assets/js/link-prefetch.js',
    './assets/js/legal-chrome.js',
    './assets/js/legal.js',
    './assets/js/privacy-notice.js',
    './assets/js/focus-trap.js',
    './assets/js/view-mode-manager.js',
    './assets/js/onboarding-manager.js',
    './assets/js/legal-panel.js',
    './assets/js/scripts.js',
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
