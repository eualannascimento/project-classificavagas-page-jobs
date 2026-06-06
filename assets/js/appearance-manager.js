/**
 * Unified appearance panel - theme + density (A4 - docs/ux-audit.md).
 */
(function () {
    'use strict';

    const DENSITIES = [
        { key: 'compact', label: 'Compacta' },
        { key: 'regular', label: 'Regular' },
        { key: 'comfy', label: 'Confortável' }
    ];

    window.cvAppearanceManager = {
        create(deps) {
            const { themeManager, densityManager } = deps;

            return {
                init() {
                    const btn = document.getElementById('appearanceBtn');
                    const sheet = document.getElementById('appearanceSheet');
                    const scrim = document.getElementById('scrim');
                    const closeBtn = document.getElementById('closeAppearanceSheet');
                    if (!btn || !sheet) return;

                    const close = () => {
                        if (window.cvFocusTrap?.isActive(sheet)) window.cvFocusTrap.deactivate();
                        sheet.classList.remove('visible');
                        scrim?.classList.remove('visible');
                        setTimeout(() => {
                            sheet.classList.add('hidden');
                            scrim?.classList.add('hidden');
                            document.body.style.overflow = '';
                        }, 400);
                        btn.focus();
                    };

                    const open = () => {
                        this.renderOptions();
                        scrim?.classList.remove('hidden');
                        sheet.classList.remove('hidden');
                        sheet.setAttribute('role', 'dialog');
                        sheet.setAttribute('aria-modal', 'true');
                        document.body.style.overflow = 'hidden';
                        requestAnimationFrame(() => {
                            scrim?.classList.add('visible');
                            sheet.classList.add('visible');
                            closeBtn?.focus();
                            window.cvFocusTrap?.activate(sheet);
                        });
                    };

                    btn.addEventListener('click', open);
                    closeBtn?.addEventListener('click', close);
                    scrim?.addEventListener('click', (e) => {
                        if (e.target === scrim && sheet.classList.contains('visible')) close();
                    });

                    document.addEventListener('keydown', (e) => {
                        if (e.key === 'Escape' && !sheet.classList.contains('hidden')) close();
                    });
                },

                renderOptions() {
                    const themeList = document.getElementById('appearanceThemeList');
                    const densityList = document.getElementById('appearanceDensityList');
                    const themes = window.cvThemeInit?.THEMES || ['light', 'dark', 'black'];
                    const labels = { light: 'Claro', dark: 'Escuro', black: 'Preto' };
                    const curTheme = document.documentElement.getAttribute('data-theme') || 'light';
                    const curDensity = document.documentElement.getAttribute('data-density') || 'compact';

                    if (themeList) {
                        themeList.innerHTML = themes.map((t) => `
                            <button type="button" class="appearance-option ${t === curTheme ? 'selected' : ''}" data-theme="${t}" aria-pressed="${t === curTheme}">
                                ${labels[t] || t}
                            </button>`).join('');
                        themeList.querySelectorAll('[data-theme]').forEach((el) => {
                            el.addEventListener('click', () => {
                                themeManager.apply(el.dataset.theme, { persist: true });
                                window.cvAriaLabels?.updateAppearanceButton();
                                window.cvAriaLabels?.updateThemeToggle(el.dataset.theme);
                                this.renderOptions();
                            });
                        });
                    }

                    if (densityList) {
                        densityList.innerHTML = DENSITIES.map((d) => `
                            <button type="button" class="appearance-option ${d.key === curDensity ? 'selected' : ''}" data-density="${d.key}" aria-pressed="${d.key === curDensity}">
                                ${d.label}
                            </button>`).join('');
                        densityList.querySelectorAll('[data-density]').forEach((el) => {
                            el.addEventListener('click', () => {
                                densityManager.apply(el.dataset.density);
                                window.cvAriaLabels?.updateAppearanceButton();
                                this.renderOptions();
                            });
                        });
                    }
                }
            };
        }
    };
}());
