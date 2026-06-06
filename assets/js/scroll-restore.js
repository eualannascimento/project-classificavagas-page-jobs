/**
 * Scroll position persistence (M1 - docs/ux-audit.md).
 */
(function () {
    'use strict';

    const KEY = 'cv_scroll_y';
    let saveTimer = null;

    window.cvScrollRestore = {
        save(y) {
            try {
                sessionStorage.setItem(KEY, String(Math.round(y)));
            } catch (_) { /* ignore */ }
        },

        read() {
            try {
                const v = sessionStorage.getItem(KEY);
                return v ? parseInt(v, 10) : 0;
            } catch (_) {
                return 0;
            }
        },

        init() {
            window.addEventListener('scroll', () => {
                if (saveTimer) clearTimeout(saveTimer);
                saveTimer = setTimeout(() => this.save(window.scrollY), 200);
            }, { passive: true });

            window.addEventListener('pagehide', () => this.save(window.scrollY));
        },

        restoreAfterRender() {
            const y = this.read();
            if (y > 0) {
                requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'auto' }));
            }
        }
    };
}());
