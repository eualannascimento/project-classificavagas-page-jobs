/**
 * Dynamic accessible labels for icon-only controls (C4 - docs/ux-audit.md).
 */
(function () {
    'use strict';

    const THEME_LABELS = { light: 'claro', dark: 'escuro', black: 'preto' };
    const SORT_LABELS = {
        date_desc: 'Adicionadas: mais recentes',
        date_asc: 'Adicionadas: mais antigas',
        published_desc: 'Publicadas: mais recentes',
        published_asc: 'Publicadas: mais antigas',
        company_asc: 'Empresa A-Z',
        company_desc: 'Empresa Z-A',
        title_asc: 'Título A-Z',
        title_desc: 'Título Z-A'
    };

    window.cvAriaLabels = {
        updateThemeToggle(theme) {
            const btn = document.getElementById('themeToggle');
            if (!btn) return;
            const themes = window.cvThemeInit?.THEMES || ['light', 'dark', 'black'];
            const idx = themes.indexOf(theme);
            const next = themes[(idx + 1) % themes.length];
            const cur = THEME_LABELS[theme] || theme;
            const nxt = THEME_LABELS[next] || next;
            btn.setAttribute('aria-label', `Tema ${cur}. Alternar para tema ${nxt}`);
            btn.removeAttribute('title');
        },

        updateSortToggle(sortKey, expanded = false) {
            const btn = document.getElementById('sortToggle');
            if (!btn) return;
            const label = SORT_LABELS[sortKey] || 'Ordenar vagas';
            btn.setAttribute('aria-label', expanded ? `Ordenação: ${label}. Fechar menu` : `Ordenar vagas. Atual: ${label}`);
        },

        updateAppearanceButton() {
            const btn = document.getElementById('appearanceBtn');
            if (!btn) return;
            const theme = document.documentElement.getAttribute('data-theme') || 'light';
            const density = document.documentElement.getAttribute('data-density') || 'compact';
            const t = THEME_LABELS[theme] || theme;
            btn.setAttribute('aria-label', `Aparência. Tema ${t}, densidade ${density}`);
        },

        updateSearchHelp(expanded) {
            const btn = document.getElementById('searchHelpBtn');
            if (!btn) return;
            btn.setAttribute('aria-label', expanded ? 'Fechar ajuda de busca' : 'Ajuda de busca avançada');
            btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        },

        bindSearchHistoryRemove(query) {
            return `Remover busca "${query}" do histórico`;
        }
    };
}());
