(function () {
    'use strict';

    const prefetched = new Set();

    function prefetchUrl(href) {
        if (!href || prefetched.has(href)) return;
        if (!/\.html(?:[#?]|$)/i.test(href)) return;
        try {
            const url = new URL(href, window.location.href);
            if (url.origin !== window.location.origin) return;
            prefetched.add(url.pathname);
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url.pathname + url.search;
            document.head.appendChild(link);
        } catch (_) { /* ignore */ }
    }

    function prefetchIdle(urls) {
        const run = () => urls.forEach(prefetchUrl);
        if ('requestIdleCallback' in window) {
            requestIdleCallback(run, { timeout: 2500 });
        } else {
            setTimeout(run, 1200);
        }
    }

    document.addEventListener('mouseover', (event) => {
        const anchor = event.target.closest('a[href]');
        if (anchor) prefetchUrl(anchor.getAttribute('href'));
    }, { passive: true });

    document.addEventListener('touchstart', (event) => {
        const anchor = event.target.closest('a[href]');
        if (anchor) prefetchUrl(anchor.getAttribute('href'));
    }, { passive: true });

    const isLegal = document.body.classList.contains('legal-page');
    prefetchIdle(isLegal ? ['index.html'] : ['termos.html', 'privacidade.html']);
}());
