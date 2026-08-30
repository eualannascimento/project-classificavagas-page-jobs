/**
 * View mode manager (cards / list / compact).
 * Factory receives app dependencies from scripts.js.
 */
(function () {
    'use strict';

    const VIEW_MODES = ['cards', 'list', 'compact'];
    const VIEW_MODE_ICONS = { cards: 'grid_view', list: 'view_list', compact: 'density_small' };
    const VIEW_MODE_LABELS = { cards: 'cartões', list: 'lista', compact: 'compacto' };
    // Rótulo curto, para caber na barra de chips do celular.
    const VIEW_MODE_CHIP = { cards: 'Cartões', list: 'Lista', compact: 'Compacto' };

    window.cvViewModeManager = {
        create(deps) {
            const { state, elements, cardRenderer } = deps;

            return {
                init() {
                    let saved = null;
                    try {
                        saved = localStorage.getItem('cv_view');
                    } catch (_) { /* ignore */ }

                    state.viewMode = saved && VIEW_MODES.includes(saved) ? saved : 'cards';
                    this.apply(state.viewMode, true);

                    if (elements.viewToggle) {
                        elements.viewToggle.addEventListener('click', () => this.toggle());
                    }
                },

                apply(mode, rerender = false) {
                    state.viewMode = mode;
                    try {
                        localStorage.setItem('cv_view', mode);
                    } catch (_) { /* ignore */ }

                    if (elements.jobsGrid) {
                        elements.jobsGrid.classList.remove('list-view', 'compact-view');
                        if (mode === 'list') {
                            elements.jobsGrid.classList.add('list-view');
                        } else if (mode === 'compact') {
                            elements.jobsGrid.classList.add('compact-view');
                        }
                    }

                    document.body.classList.remove('view-cards', 'view-list', 'view-compact');
                    document.body.classList.add(`view-${mode}`);
                    this.updateIcon();

                    if (rerender && state.allJobs.length > 0) {
                        elements.jobsGrid.innerHTML = '';
                        state.displayedCount = 0;
                        cardRenderer.render(true);
                    }
                },

                /**
                 * O botão mostra o modo **atual**, com ícone e nome, e diz no
                 * rótulo acessível para onde o toque leva.
                 *
                 * Antes ele desenhava o ícone do próximo modo, sem texto: no
                 * celular a barra ficava com três ícones anônimos em sequência
                 * (ordenar, visualização, visualizadas) e nada dizia em qual
                 * modo a lista estava. Os vizinhos dessa barra relatam estado
                 * ("Filtros" com contagem, "Publicadas", "Vistas" com
                 * contagem); este passa a relatar também.
                 */
                updateIcon() {
                    if (!elements.viewToggle) return;
                    const currentMode = state.viewMode;
                    const currentIdx = VIEW_MODES.indexOf(currentMode);
                    const nextMode = VIEW_MODES[(currentIdx + 1) % VIEW_MODES.length];
                    const icon = VIEW_MODE_ICONS[currentMode];
                    const nextLabel = VIEW_MODE_LABELS[nextMode];

                    elements.viewToggle.innerHTML =
                        `<svg class="material-symbols-rounded" aria-hidden="true" focusable="false"><use href="#i-${icon}"></use></svg>` +
                        `<span class="view-label">${VIEW_MODE_CHIP[currentMode]}</span>`;
                    elements.viewToggle.setAttribute('aria-label', `Visualização em ${VIEW_MODE_LABELS[currentMode]}. Alternar para ${nextLabel}`);
                    elements.viewToggle.setAttribute('title', `Alternar para visualização em ${nextLabel}`);
                },

                toggle() {
                    const currentIdx = VIEW_MODES.indexOf(state.viewMode);
                    const nextIdx = (currentIdx + 1) % VIEW_MODES.length;
                    this.apply(VIEW_MODES[nextIdx]);
                    cardRenderer.render(true);
                }
            };
        }
    };
}());
