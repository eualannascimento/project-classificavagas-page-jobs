/**
 * Classifica Vagas - Material Design 3
 * Modern Job Listing Application
 */

(function() {
    'use strict';

    // ============================================
    // STATE & CONFIG
    // ============================================
    const CONFIG = {
        JOBS_PER_PAGE: 24,
        SEARCH_DEBOUNCE: 250,
        SCROLL_THRESHOLD: 300,
        INFINITE_SCROLL_THRESHOLD: 600,
        DATA_URL: 'assets/data/json/open_jobs.json',
        FILTER_CATEGORIES: [
            { key: 'company', label: 'Empresa', icon: 'business' },
            { key: 'company_type', label: 'Ramo', icon: 'category' },
            { key: 'level', label: 'Nível', icon: 'trending_up' },
            { key: 'category', label: 'Categoria', icon: 'work' }
        ]
    };

    const state = {
        allJobs: [],
        filteredJobs: [],
        displayedCount: 0,
        isLoading: false,
        searchQuery: '',
        quickFilter: 'all',
        selectedFilters: {},
        tempFilters: {},
        filterOptions: {},
        visitedJobs: new Set()
    };

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    const elements = {
        splash: $('#splash'),
        app: $('#app'),
        jobCount: $('#jobCount'),
        searchInput: $('#searchInput'),
        searchClear: $('#searchClear'),
        filterChips: $$('.filter-chip[data-filter]'),
        openFilters: $('#openFilters'),
        filterBadge: $('#filterBadge'),
        activeFilters: $('#activeFilters'),
        activeFiltersList: $('#activeFiltersList'),
        clearAllFilters: $('#clearAllFilters'),
        jobsGrid: $('#jobsGrid'),
        loadingMore: $('#loadingMore'),
        emptyState: $('#emptyState'),
        emptyStateClear: $('#emptyStateClear'),
        scrollTopFab: $('#scrollTopFab'),
        scrim: $('#scrim'),
        filterSheet: $('#filterSheet'),
        filterSheetContent: $('#filterSheetContent'),
        sheetFilterCount: $('#sheetFilterCount'),
        closeSheet: $('#closeSheet'),
        sheetClearFilters: $('#sheetClearFilters'),
        sheetApplyFilters: $('#sheetApplyFilters'),
        themeToggle: $('#themeToggle'),
        lastUpdate: $('#lastUpdate'),
        topAppBar: $('.top-app-bar')
    };

    // ============================================
    // UTILS
    // ============================================
    const utils = {
        debounce(fn, delay) {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn(...args), delay);
            };
        },

        formatDate(dateStr) {
            if (!dateStr) return '';
            const [y, m, d] = dateStr.split('-');
            return `${d}/${m}/${y}`;
        },

        escapeHtml(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        truncate(str, len) {
            if (!str || str.length <= len) return str || '';
            return str.slice(0, len) + '...';
        },

        normalize(str) {
            if (!str) return '';
            return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        },

        storageKey: (id) => `cv_v_${id}`,

        isVisited: (id) => localStorage.getItem(utils.storageKey(id)) === '1',

        markVisited(id) {
            localStorage.setItem(utils.storageKey(id), '1');
            state.visitedJobs.add(id);
        }
    };

    // ============================================
    // THEME MANAGER
    // ============================================
    const themeManager = {
        init() {
            const saved = localStorage.getItem('cv_theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = saved || (prefersDark ? 'dark' : 'light');
            this.apply(theme);

            elements.themeToggle.addEventListener('click', () => this.toggle());
        },

        apply(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('cv_theme', theme);

            const meta = document.querySelector('meta[name="theme-color"]');
            if (meta) {
                meta.content = theme === 'light' ? '#f9f9ff' : '#111318';
            }

        toggle() {
            const current = document.documentElement.getAttribute('data-theme');
            this.apply(current === 'light' ? 'dark' : 'light');
        }
    };

    // ============================================
    // DATA LOADER
    // ============================================
    const dataLoader = {
        async load() {
            try {
                const response = await fetch(CONFIG.DATA_URL);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                state.allJobs = data.map((job, i) => ({ ...job, id: i + 1 }));

                // Load visited
                state.allJobs.forEach(job => {
                    if (utils.isVisited(job.id)) {
                        state.visitedJobs.add(job.id);
                    }
                });

                // Build filter options
                this.buildFilterOptions();

                // Update last modified
                this.updateLastModified(response);

                // Apply initial filters
                filterManager.apply();

                // Show app
                this.showApp();

            } catch (err) {
                console.error('Error loading jobs:', err);
                // Show error but still show app
                this.showApp();
                if (elements.emptyState) {
                    elements.jobsGrid.innerHTML = '';
                    elements.emptyState.classList.remove('hidden');
                    elements.emptyState.querySelector('h3').textContent = 'Erro ao carregar';
                    elements.emptyState.querySelector('p').textContent = 'Não foi possível carregar as vagas. Recarregue a página.';
                }
            }
        },

        buildFilterOptions() {
            CONFIG.FILTER_CATEGORIES.forEach(({ key }) => {
                const values = [...new Set(state.allJobs.map(j => j[key]).filter(Boolean))];
                values.sort((a, b) => a.localeCompare(b, 'pt-BR'));
                state.filterOptions[key] = values;
            });
        },

        updateLastModified(response) {
            const lastMod = response.headers.get('last-modified');
            if (lastMod) {
                const date = new Date(lastMod);
                elements.lastUpdate.textContent = new Intl.DateTimeFormat('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(date);
            }
        },

        showApp() {
            // Ensure splash and app elements exist
            const splash = elements.splash || document.getElementById('splash');
            const app = elements.app || document.getElementById('app');

            if (splash) {
                splash.classList.add('fade-out');
            }

            if (app) {
                app.classList.add('visible');
            }

            setTimeout(() => {
                if (splash) {
                    splash.style.display = 'none';
                }
            }, 400);
        }
    };

    // ============================================
    // FILTER MANAGER
    // ============================================
    const filterManager = {
        apply() {
            let jobs = [...state.allJobs];

            // Search query
            if (state.searchQuery) {
                const q = utils.normalize(state.searchQuery);
                jobs = jobs.filter(job => {
                    const text = utils.normalize([
                        job.title, job.company, job.company_type,
                        job.level, job.category, job.location
                    ].join(' '));
                    return text.includes(q);
                });
            }

            // Quick filter
            if (state.quickFilter !== 'all') {
                jobs = jobs.filter(job => {
                    switch (state.quickFilter) {
                        case 'remote': return job['remote?'] === '01 - Sim';
                        case 'hybrid': return job.contract === 'HIBRIDO';
                        case 'onsite': return job['remote?'] === '02 - Não';
                        case 'affirmative': return job['affirmative?'] === '01 - Sim';
                        default: return true;
                    }
                });
            }

            // Selected filters
            Object.entries(state.selectedFilters).forEach(([key, values]) => {
                if (values && values.length > 0) {
                    jobs = jobs.filter(job => values.includes(job[key]));
                }
            });

            state.filteredJobs = jobs;
            state.displayedCount = 0;

            this.updateUI();
            cardRenderer.render(true);
        },

        updateUI() {
            // Job count
            elements.jobCount.textContent = `${state.filteredJobs.length.toLocaleString('pt-BR')} vagas`;

            // Filter badge
            const count = Object.values(state.selectedFilters)
                .filter(arr => arr && arr.length > 0)
                .reduce((sum, arr) => sum + arr.length, 0);

            if (count > 0) {
                elements.filterBadge.textContent = count;
                elements.filterBadge.classList.remove('hidden');
            } else {
                elements.filterBadge.classList.add('hidden');
            }

            // Active filters chips
            this.renderActiveFilters();
        },

        renderActiveFilters() {
            const chips = [];

            Object.entries(state.selectedFilters).forEach(([key, values]) => {
                if (values && values.length > 0) {
                    values.forEach(value => {
                        chips.push({ key, value });
                    });
                }
            });

            if (chips.length === 0) {
                elements.activeFilters.classList.add('hidden');
                return;
            }

            elements.activeFilters.classList.remove('hidden');
            elements.activeFiltersList.innerHTML = chips.map(({ key, value }) => `
                <div class="active-filter-chip" data-key="${key}" data-value="${utils.escapeHtml(value)}">
                    <span>${utils.truncate(value, 18)}</span>
                    <button aria-label="Remover">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                </div>
            `).join('');

            // Add remove handlers
            elements.activeFiltersList.querySelectorAll('.active-filter-chip button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const chip = e.target.closest('.active-filter-chip');
                    const key = chip.dataset.key;
                    const value = chip.dataset.value;
                    this.removeFilter(key, value);
                });
            });
        },

        removeFilter(key, value) {
            if (state.selectedFilters[key]) {
                state.selectedFilters[key] = state.selectedFilters[key].filter(v => v !== value);
                if (state.selectedFilters[key].length === 0) {
                    delete state.selectedFilters[key];
                }
            }
            this.apply();
        },

        clearAll() {
            state.selectedFilters = {};
            state.searchQuery = '';
            state.quickFilter = 'all';
            elements.searchInput.value = '';
            elements.searchClear.classList.add('hidden');

            // Reset quick filter UI
            elements.filterChips.forEach(chip => {
                chip.dataset.active = chip.dataset.filter === 'all' ? 'true' : 'false';
            });

            this.apply();
        },

        setQuickFilter(filter) {
            state.quickFilter = filter;
            elements.filterChips.forEach(chip => {
                chip.dataset.active = chip.dataset.filter === filter ? 'true' : 'false';
            });
            this.apply();
        }
    };

    // ============================================
    // CARD RENDERER
    // ============================================
    const cardRenderer = {
        render(reset = false) {
            if (reset) {
                elements.jobsGrid.innerHTML = '';
                state.displayedCount = 0;
            }

            const start = state.displayedCount;
            const end = start + CONFIG.JOBS_PER_PAGE;
            const jobs = state.filteredJobs.slice(start, end);

            if (jobs.length === 0 && state.displayedCount === 0) {
                elements.emptyState.classList.remove('hidden');
                elements.loadingMore.classList.add('hidden');
                return;
            }

            const start = state.displayedCount;
            const end = Math.min(start + CONFIG.JOBS_PER_PAGE, state.filteredJobs.length);
            const fragment = document.createDocumentFragment();
            jobs.forEach(job => fragment.appendChild(this.createCard(job)));
            elements.jobsGrid.appendChild(fragment);

            state.displayedCount = end;

            if (state.displayedCount >= state.filteredJobs.length) {
                elements.loadingMore.classList.add('hidden');
            }
        },

        createCard(job) {
            const isRemote = job['remote?'] === '01 - Sim';
            const isVisited = state.visitedJobs.has(job.id);

            const card = document.createElement('a');
            card.href = job.url;
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
            card.className = `job-card${isVisited ? ' visited' : ''}`;
            card.dataset.id = job.id;

            const levelName = job.level ? job.level.split(' - ').slice(1).join(' - ') : '';
            const categoryName = job.category ? job.category.split(' - ').slice(1).join(' - ') : '';

            card.innerHTML = `
                <div class="job-card-badge">
                    <span class="material-symbols-rounded">check_circle</span>
                    Visitado
                </div>
                <div class="job-card-header">
                    <div class="job-card-icon ${isRemote ? 'remote' : 'onsite'}">
                        <span class="material-symbols-rounded">${isRemote ? 'home_work' : 'apartment'}</span>
                    </div>
                    <div class="job-card-title">
                        <h3>${utils.escapeHtml(job.title)}</h3>
                        <p>${utils.escapeHtml(job.company)}</p>
                    </div>
                </div>
                <div class="job-card-body">
                    ${job.company_type ? `<span class="job-tag">${utils.escapeHtml(utils.truncate(job.company_type, 18))}</span>` : ''}
                    ${levelName ? `<span class="job-tag">${utils.escapeHtml(utils.truncate(levelName, 16))}</span>` : ''}
                    ${categoryName ? `<span class="job-tag">${utils.escapeHtml(utils.truncate(categoryName, 16))}</span>` : ''}
                </div>
                <div class="job-card-footer">
                    <div class="job-location">
                        <span class="material-symbols-rounded">location_on</span>
                        <span>${utils.escapeHtml(job.location || 'Não informado')}</span>
                    </div>
                </div>
                ${icons.chevron}
            `;

            card.addEventListener('click', () => {
                if (!state.visitedJobs.has(job.id)) {
                    utils.markVisited(job.id);
                    card.classList.add('visited');
                }

                // Toggle Expand
                card.classList.toggle('expanded');
            });

            return card;
        },

        loadMore() {
            if (state.isLoading || state.displayedCount >= state.filteredJobs.length) return;

            state.isLoading = true;
            elements.loadingMore.classList.remove('hidden');

            requestAnimationFrame(() => {
                this.render(false);
                state.isLoading = false;
            });
        }
    };

    // ============================================
    // BOTTOM SHEET (Filter Modal)
    // ============================================
    const bottomSheet = {
        init() {
            elements.openFilters.addEventListener('click', () => this.open());
            elements.closeSheet.addEventListener('click', () => this.close());
            elements.scrim.addEventListener('click', () => this.close());
            elements.sheetClearFilters.addEventListener('click', () => this.clearTemp());
            elements.sheetApplyFilters.addEventListener('click', () => this.applyAndClose());

            // ESC key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !elements.filterSheet.classList.contains('hidden')) {
                    this.close();
                }
            });
        },

        open() {
            // Clone current filters to temp
            state.tempFilters = JSON.parse(JSON.stringify(state.selectedFilters));

            // Build filter sections
            this.buildSections();
            this.updateCount();

            // Show
            elements.scrim.classList.remove('hidden');
            elements.filterSheet.classList.remove('hidden');
            document.body.style.overflow = 'hidden';

            requestAnimationFrame(() => {
                elements.scrim.classList.add('visible');
                elements.filterSheet.classList.add('visible');
            });
        },

        close() {
            elements.scrim.classList.remove('visible');
            elements.filterSheet.classList.remove('visible');

            setTimeout(() => {
                elements.scrim.classList.add('hidden');
                elements.filterSheet.classList.add('hidden');
                document.body.style.overflow = '';
            }, 400);
        },

        buildSections() {
            elements.filterSheetContent.innerHTML = CONFIG.FILTER_CATEGORIES.map(({ key, label, icon }) => {
                const options = state.filterOptions[key] || [];
                const selectedCount = (state.tempFilters[key] || []).length;

                return `
                    <div class="filter-section" data-key="${key}">
                        <div class="filter-section-header">
                            <div class="filter-section-header-left">
                                <span class="material-symbols-rounded">${icon}</span>
                                <span class="filter-section-title">${label}</span>
                                ${selectedCount > 0 ? `<span class="filter-section-count">${selectedCount}</span>` : ''}
                            </div>
                            <span class="material-symbols-rounded filter-section-icon">expand_more</span>
                        </div>
                        <div class="filter-section-body">
                            <input type="text" class="filter-search-input" placeholder="Buscar ${label.toLowerCase()}..." data-key="${key}">
                            <div class="filter-options-list" data-key="${key}">
                                ${this.renderOptions(key, options.slice(0, 30))}
                            </div>
                            ${options.length > 30 ? `<p style="font-size:12px;color:var(--md-sys-color-outline);margin-top:8px;">Use a busca para encontrar mais opções</p>` : ''}
                        </div>
                    </div>
                `;
            }).join('');

            // Add event listeners
            this.addSectionListeners();
        },

        renderOptions(key, options) {
            const selected = state.tempFilters[key] || [];

            return options.map(opt => `
                <button class="filter-option-chip ${selected.includes(opt) ? 'selected' : ''}" data-key="${key}" data-value="${utils.escapeHtml(opt)}">
                    <span class="material-symbols-rounded check-icon">check</span>
                    <span>${utils.escapeHtml(utils.truncate(opt, 22))}</span>
                </button>
            `).join('');
        },

        addSectionListeners() {
            // Accordion headers
            elements.filterSheetContent.querySelectorAll('.filter-section-header').forEach(header => {
                header.addEventListener('click', () => {
                    const section = header.closest('.filter-section');
                    section.classList.toggle('expanded');
                });
            });

            // Search inputs
            elements.filterSheetContent.querySelectorAll('.filter-search-input').forEach(input => {
                input.addEventListener('input', utils.debounce((e) => {
                    const key = e.target.dataset.key;
                    const query = utils.normalize(e.target.value);
                    const allOptions = state.filterOptions[key] || [];

                    const filtered = query
                        ? allOptions.filter(opt => utils.normalize(opt).includes(query))
                        : allOptions.slice(0, 30);

                    const list = elements.filterSheetContent.querySelector(`.filter-options-list[data-key="${key}"]`);
                    list.innerHTML = this.renderOptions(key, filtered.slice(0, 50));
                    this.addOptionListeners(list);
                }, 150));
            });

            // Option chips
            elements.filterSheetContent.querySelectorAll('.filter-options-list').forEach(list => {
                this.addOptionListeners(list);
            });
        },

        addOptionListeners(container) {
            container.querySelectorAll('.filter-option-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    const key = chip.dataset.key;
                    const value = chip.dataset.value;

                    if (!state.tempFilters[key]) {
                        state.tempFilters[key] = [];
                    }

                    const idx = state.tempFilters[key].indexOf(value);
                    if (idx > -1) {
                        state.tempFilters[key].splice(idx, 1);
                        chip.classList.remove('selected');
                    } else {
                        state.tempFilters[key].push(value);
                        chip.classList.add('selected');
                    }

                    this.updateCount();
                    this.updateSectionBadges();
                });
            });
        },

        updateCount() {
            const count = Object.values(state.tempFilters)
                .filter(arr => arr && arr.length > 0)
                .reduce((sum, arr) => sum + arr.length, 0);

            elements.sheetFilterCount.textContent = count > 0
                ? `${count} selecionado${count > 1 ? 's' : ''}`
                : 'Nenhum selecionado';
        },

        updateSectionBadges() {
            CONFIG.FILTER_CATEGORIES.forEach(({ key }) => {
                const section = elements.filterSheetContent.querySelector(`.filter-section[data-key="${key}"]`);
                const count = (state.tempFilters[key] || []).length;
                const badge = section.querySelector('.filter-section-count');

                if (count > 0) {
                    if (badge) {
                        badge.textContent = count;
                    } else {
                        const left = section.querySelector('.filter-section-header-left');
                        left.insertAdjacentHTML('beforeend', `<span class="filter-section-count">${count}</span>`);
                    }
                } else if (badge) {
                    badge.remove();
                }
            });
        },

        clearTemp() {
            state.tempFilters = {};

            elements.filterSheetContent.querySelectorAll('.filter-option-chip.selected').forEach(chip => {
                chip.classList.remove('selected');
            });

            elements.filterSheetContent.querySelectorAll('.filter-section-count').forEach(badge => {
                badge.remove();
            });

            this.updateCount();
        },

        applyAndClose() {
            state.selectedFilters = state.tempFilters;
            filterManager.apply();
            this.close();
        }
    };

    // ============================================
    // SEARCH MANAGER
    // ============================================
    const searchManager = {
        init() {
            const search = utils.debounce(() => {
                state.searchQuery = elements.searchInput.value.trim();
                filterManager.apply();
            }, CONFIG.SEARCH_DEBOUNCE);

            elements.searchInput.addEventListener('input', () => {
                const hasValue = elements.searchInput.value.length > 0;
                elements.searchClear.classList.toggle('hidden', !hasValue);
                search();
            });

            elements.searchClear.addEventListener('click', () => {
                elements.searchInput.value = '';
                elements.searchClear.classList.add('hidden');
                state.searchQuery = '';
                filterManager.apply();
                elements.searchInput.focus();
            });
        }
    };

    // ============================================
    // SCROLL MANAGER
    // ============================================
    const scrollManager = {
        init() {
            let ticking = false;

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        this.onScroll();
                        ticking = false;
                    });
                    ticking = true;
                }
            });

            elements.scrollTopFab.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        },

        onScroll() {
            const scrollY = window.scrollY;
            const windowH = window.innerHeight;
            const docH = document.documentElement.scrollHeight;

            // Top app bar elevation
            if (scrollY > 10) {
                elements.topAppBar.classList.add('elevated');
            } else {
                elements.topAppBar.classList.remove('elevated');
            }

            // FAB visibility
            if (scrollY > CONFIG.SCROLL_THRESHOLD) {
                elements.scrollTopFab.classList.add('visible');
            } else {
                elements.scrollTopFab.classList.remove('visible');
            }

            // Infinite scroll
            if (docH - scrollY - windowH < CONFIG.INFINITE_SCROLL_THRESHOLD) {
                cardRenderer.loadMore();
            }
        }
    };

    // ============================================
    // QUICK FILTERS
    // ============================================
    const quickFilters = {
        init() {
            elements.filterChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    filterManager.setQuickFilter(chip.dataset.filter);
                });
            });
        }
    };

    // ============================================
    // CLEAR ALL HANDLERS
    // ============================================
    const clearHandlers = {
        init() {
            elements.clearAllFilters.addEventListener('click', () => {
                filterManager.clearAll();
            });

            elements.emptyStateClear.addEventListener('click', () => {
                filterManager.clearAll();
            });
        }
    };

    // ============================================
    // EVENT LISTENERS
    // ============================================
    function init() {
        try {
            themeManager.init();
            searchManager.init();
            scrollManager.init();
            quickFilters.init();
            bottomSheet.init();
            clearHandlers.init();
            dataLoader.load();

            // Fallback: ensure app shows after 5 seconds no matter what
            setTimeout(() => {
                const app = document.getElementById('app');
                const splash = document.getElementById('splash');
                if (app && !app.classList.contains('visible')) {
                    app.classList.add('visible');
                    if (splash) {
                        splash.style.display = 'none';
                    }
                }
            }, 5000);

        } catch (err) {
            console.error('Initialization error:', err);
            // Force show app on error
            const app = document.getElementById('app');
            const splash = document.getElementById('splash');
            if (app) app.classList.add('visible');
            if (splash) splash.style.display = 'none';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
