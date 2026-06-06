(function () {
    'use strict';

    const THEMES = ['light', 'dark', 'black'];
    const THEME_META = {
        light: '#f9f9ff',
        dark: '#1a1a24',
        black: '#000000'
    };
    const STYLES = ['restraint', 'editorial'];
    const FONTS = ['instrument', 'newsreader', 'eb_garamond', 'dm_serif', 'bricolage', 'inter', 'mono'];
    const DENSITIES = ['compact', 'regular', 'comfy'];

    function readStorage(key) {
        try {
            return localStorage.getItem(key);
        } catch (_) {
            return null;
        }
    }

    function applyTheme(theme) {
        if (!THEMES.includes(theme)) theme = 'light';
        document.documentElement.setAttribute('data-theme', theme);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', THEME_META[theme] || THEME_META.light);
    }

    function applyStyle(style) {
        if (!STYLES.includes(style)) style = 'restraint';
        document.documentElement.setAttribute('data-style', style);
    }

    function applyFont(font) {
        if (!FONTS.includes(font)) font = 'inter';
        document.documentElement.setAttribute('data-font', font);
    }

    function applyDensity(density) {
        if (!DENSITIES.includes(density)) density = 'regular';
        document.documentElement.setAttribute('data-density', density);
    }

    const savedTheme = readStorage('cv_theme');
    applyTheme(savedTheme && THEMES.includes(savedTheme) ? savedTheme : 'light');
    applyStyle(readStorage('cv_style') || 'restraint');
    applyFont(readStorage('cv_font') || 'inter');
    applyDensity(readStorage('cv_density') || 'regular');

    window.cvThemeInit = {
        THEMES,
        THEME_META,
        applyTheme,
        applyStyle,
        applyFont,
        applyDensity,
        cycleTheme() {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const idx = THEMES.indexOf(current);
            const next = THEMES[(idx + 1) % THEMES.length];
            applyTheme(next);
            try {
                localStorage.setItem('cv_theme', next);
            } catch (_) { /* ignore */ }
            return next;
        }
    };
}());
