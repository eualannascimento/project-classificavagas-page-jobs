(function () {
    'use strict';

    if ('serviceWorker' in navigator) {
        const register = () => {
            const swPath = new URL('service-worker.js', window.location.href).pathname;
            navigator.serviceWorker.register(swPath).catch(() => {});
        };
        if ('requestIdleCallback' in window) {
            requestIdleCallback(register, { timeout: 4000 });
        } else {
            window.addEventListener('load', register, { once: true });
        }
    }

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle && window.cvThemeInit) {
        const map = { light: 'Claro', dark: 'Escuro', black: 'Preto' };
        const syncTitle = () => {
            const theme = document.documentElement.getAttribute('data-theme') || 'light';
            const idx = window.cvThemeInit.THEMES.indexOf(theme);
            const next = window.cvThemeInit.THEMES[(idx + 1) % window.cvThemeInit.THEMES.length];
            themeToggle.title = `Tema: ${map[theme]} — clique para ${map[next]}`;
        };
        syncTitle();
        themeToggle.addEventListener('click', () => {
            window.cvThemeInit.cycleTheme();
            syncTitle();
        });
    }
}());
