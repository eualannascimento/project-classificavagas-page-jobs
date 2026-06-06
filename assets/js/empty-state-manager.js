/**
 * Smart empty state suggestions (A3 - docs/ux-audit.md).
 */
(function () {
    'use strict';

    window.cvEmptyStateManager = {
        create(deps) {
            const { state, utils, filterManager } = deps;

            const overridesWithoutLast = (last) => {
                const o = {
                    searchQuery: state.searchQuery,
                    quickTipo: state.quickTipo,
                    selectedFilters: JSON.parse(JSON.stringify(state.selectedFilters)),
                    insertedDateRange: utils.cloneDateRange(state.insertedDateRange),
                    publishedDateRange: utils.cloneDateRange(state.publishedDateRange),
                    showOnlyVisited: state.showOnlyVisited
                };

                if (last.chipType === 'search') o.searchQuery = '';
                else if (last.chipType === 'search_or') {
                    const idx = last.searchIndex ?? 0;
                    o.searchQuery = utils.removeSearchOrSegment(o.searchQuery, idx);
                } else if (last.chipType === 'visited') o.showOnlyVisited = false;
                else if (last.chipType === 'date_published') o.publishedDateRange = utils.cloneDateRange(utils.EMPTY_DATE_RANGE);
                else if (last.chipType === 'date_inserted') o.insertedDateRange = utils.cloneDateRange(utils.EMPTY_DATE_RANGE);
                else if (last.chipType === 'category' && o.selectedFilters[last.key]?.length) {
                    o.selectedFilters[last.key] = o.selectedFilters[last.key].slice(0, -1);
                }
                return o;
            };

            const applyRemoveLast = (last) => {
                if (last.chipType === 'search') {
                    state.searchQuery = '';
                    deps.elements.searchInput.value = '';
                    deps.elements.searchClear?.classList.add('hidden');
                } else if (last.chipType === 'search_or') {
                    const idx = last.searchIndex ?? 0;
                    state.searchQuery = utils.removeSearchOrSegment(state.searchQuery, idx);
                    deps.elements.searchInput.value = state.searchQuery;
                    deps.elements.searchClear?.classList.toggle('hidden', !state.searchQuery);
                } else if (last.chipType === 'visited') {
                    state.showOnlyVisited = false;
                    document.getElementById('visitedToggle')?.setAttribute('aria-pressed', 'false');
                } else if (last.chipType === 'date_published') {
                    state.publishedDateRange = utils.cloneDateRange(utils.EMPTY_DATE_RANGE);
                } else if (last.chipType === 'date_inserted') {
                    state.insertedDateRange = utils.cloneDateRange(utils.EMPTY_DATE_RANGE);
                } else if (last.chipType === 'category' && state.selectedFilters[last.key]?.length) {
                    state.selectedFilters[last.key].pop();
                }
                filterManager.apply();
            };

            return {
                render() {
                    const groups = filterManager.buildFilterSummaryItems(state);
                    const removeLastBtn = document.getElementById('emptyStateRemoveLast');
                    const clearSearchBtn = document.getElementById('emptyStateClearSearch');

                    if (state.searchQuery && clearSearchBtn) {
                        clearSearchBtn.classList.remove('hidden');
                        clearSearchBtn.onclick = () => {
                            state.searchQuery = '';
                            deps.elements.searchInput.value = '';
                            deps.elements.searchClear?.classList.add('hidden');
                            filterManager.apply();
                        };
                    } else if (clearSearchBtn) {
                        clearSearchBtn.classList.add('hidden');
                    }

                    if (groups.length && removeLastBtn) {
                        const last = groups[groups.length - 1];
                        const count = filterManager.getFilteredCount(overridesWithoutLast(last));
                        if (count > 0) {
                            removeLastBtn.classList.remove('hidden');
                            removeLastBtn.textContent = `Remover "${last.label}" (${count.toLocaleString('pt-BR')} vagas)`;
                            removeLastBtn.onclick = () => applyRemoveLast(last);
                            return;
                        }
                    }
                    if (removeLastBtn) removeLastBtn.classList.add('hidden');
                }
            };
        }
    };
}());
