(() => {
    'use strict';

    const isJobsRoute = () => {
        const params = new URLSearchParams(window.location.search);
        return window.location.hash === '#vagas' || params.has('q');
    };

    const applyRoute = () => {
        const route = isJobsRoute() ? 'vagas' : 'home';
        document.documentElement.dataset.route = route;

        if (document.body) {
            const isHome = route === 'home';
            document.body.classList.toggle('hub-active', isHome);
            document.getElementById('productHub')?.toggleAttribute('hidden', !isHome);
            document.getElementById('app')?.setAttribute('aria-hidden', String(isHome));
        }

        document.dispatchEvent(new CustomEvent('classificavagas:routechange', { detail: { route } }));
    };

    applyRoute();
    window.addEventListener('hashchange', applyRoute);
    document.addEventListener('DOMContentLoaded', applyRoute);
})();
