(function () {
    'use strict';

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
