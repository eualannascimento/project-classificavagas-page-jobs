/**
 * View mode manager (cards / list / compact).
 * Factory receives app dependencies from scripts.js.
 */
(function () {
    'use strict';

    const VIEW_MODES = ['cards', 'list', 'compact'];
    const VIEW_MODE_ICONS = { cards: 'grid_view', list: 'view_list', compact: 'density_small' };
    const VIEW_MODE_LABELS = { cards: 'cartões', list: 'lista', compact: 'compacto' };

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

                updateIcon() {
                    if (!elements.viewToggle) return;
                    const currentIdx = VIEW_MODES.indexOf(state.viewMode);
                    const nextIdx = (currentIdx + 1) % VIEW_MODES.length;
                    const nextMode = VIEW_MODES[nextIdx];
                    const nextIcon = VIEW_MODE_ICONS[nextMode];
                    const nextLabel = VIEW_MODE_LABELS[nextMode];

                    elements.viewToggle.innerHTML =
                        `<span class="material-symbols-rounded" aria-hidden="true">${nextIcon}</span>`;
                    elements.viewToggle.setAttribute('aria-label', `Alternar para visualização em ${nextLabel}`);
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
