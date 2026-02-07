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
            { key: 'category', label: 'Categoria', icon: 'work' },
            { key: 'location', label: 'Localidade', icon: 'location_on' },
            { key: 'site_type', label: 'Plataforma', icon: 'language' }
        ],
        DATE_PERIODS: [
            { key: 'all', label: 'Todas as datas', days: null },
            { key: '24h', label: 'Últimas 24 horas', days: 1 },
            { key: '7d', label: 'Últimos 7 dias', days: 7 },
            { key: '30d', label: 'Últimos 30 dias', days: 30 },
            { key: '90d', label: 'Últimos 3 meses', days: 90 }
        ],
        SORT_OPTIONS: [
            { key: 'date_desc', label: 'Mais recentes', icon: 'schedule' },
            { key: 'date_asc', label: 'Mais antigas', icon: 'history' },
            { key: 'company_asc', label: 'Empresa A-Z', icon: 'sort_by_alpha' },
            { key: 'company_desc', label: 'Empresa Z-A', icon: 'sort_by_alpha' },
            { key: 'title_asc', label: 'Título A-Z', icon: 'sort_by_alpha' },
            { key: 'title_desc', label: 'Título Z-A', icon: 'sort_by_alpha' }
        ],
        MAX_SEARCH_HISTORY: 5,
        SKELETON_COUNT: 8
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
        filterCounts: {}, // counts per filter option
        visitedJobs: new Set(),
        datePeriod: 'all',
        sortBy: 'date_desc',
        viewMode: 'cards', // 'cards', 'list', or 'compact'
        searchHistory: [] // recent searches
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
        topAppBar: $('.top-app-bar'),
        viewToggle: $('#viewToggle'),
        shareButton: $('#shareButton'),
        sortToggle: $('#sortToggle'),
        sortDropdown: $('#sortDropdown'),
        sortLabel: $('.sort-label')
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

        formatRelativeDate(dateStr) {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            const now = new Date();
            const diffTime = now - date;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Hoje';
            if (diffDays === 1) return 'Ontem';
            if (diffDays < 7) return `${diffDays} dias`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem`;
            if (diffDays < 365) return `${Math.floor(diffDays / 30)} mês`;
            return `${Math.floor(diffDays / 365)} ano`;
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
        },

        isWithinDays(dateStr, days) {
            if (!dateStr || !days) return true;
            const date = new Date(dateStr);
            const now = new Date();
            const diffTime = now - date;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= days;
        }
    };

    // ============================================
    // THEME MANAGER
    // ============================================
    const THEMES = ['light', 'dark'];
    const THEME_LABELS = {
        'light': 'Light',
        'dark': 'Dark'
    };
    const THEME_META_COLORS = {
        'light': '#f9f9ff',
        'dark': '#000000'
    };

    const themeManager = {
        _initialized: false,

        init() {
            const saved = localStorage.getItem('cv_theme');
            // Default to light theme if no preference saved
            const theme = saved && THEMES.includes(saved) ? saved : 'light';
            this.apply(theme);
            this._initialized = true;

            elements.themeToggle.addEventListener('click', () => this.toggle());
        },

        apply(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('cv_theme', theme);

            const meta = document.querySelector('meta[name="theme-color"]');
            if (meta) {
                meta.content = THEME_META_COLORS[theme] || THEME_META_COLORS['light'];
            }

            if (this._initialized) {
                this.showThemeToast(theme);
            }
        },

        toggle() {
            const current = document.documentElement.getAttribute('data-theme');
            const idx = THEMES.indexOf(current);
            const next = THEMES[(idx + 1) % THEMES.length];
            this.apply(next);
        },

        showThemeToast(theme) {
            const existing = document.querySelector('.theme-toast');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.className = 'theme-toast';
            toast.textContent = THEME_LABELS[theme] || theme;
            document.body.appendChild(toast);

            requestAnimationFrame(() => toast.classList.add('visible'));
            setTimeout(() => {
                toast.classList.remove('visible');
                setTimeout(() => toast.remove(), 300);
            }, 1200);
        }
    };

    // ============================================
    // VIEW MODE MANAGER
    // ============================================
    const VIEW_MODES = ['cards', 'list', 'compact'];
    const VIEW_MODE_ICONS = {
        'cards': 'grid_view',
        'list': 'view_list',
        'compact': 'density_small'
    };

    const viewModeManager = {
        init() {
            const saved = localStorage.getItem('cv_view');
            state.viewMode = saved && VIEW_MODES.includes(saved) ? saved : 'cards';
            this.apply(state.viewMode);

            if (elements.viewToggle) {
                elements.viewToggle.addEventListener('click', () => this.toggle());
            }
        },

        apply(mode) {
            state.viewMode = mode;
            localStorage.setItem('cv_view', mode);

            if (elements.jobsGrid) {
                elements.jobsGrid.classList.remove('list-view', 'compact-view');
                if (mode === 'list') {
                    elements.jobsGrid.classList.add('list-view');
                } else if (mode === 'compact') {
                    elements.jobsGrid.classList.add('compact-view');
                }
            }

            // Update icon visibility
            document.body.classList.remove('view-cards', 'view-list', 'view-compact');
            document.body.classList.add(`view-${mode}`);

            // Update toggle button icon
            this.updateIcon();
        },

        updateIcon() {
            if (!elements.viewToggle) return;
            const currentIdx = VIEW_MODES.indexOf(state.viewMode);
            const nextIdx = (currentIdx + 1) % VIEW_MODES.length;
            const nextMode = VIEW_MODES[nextIdx];
            const nextIcon = VIEW_MODE_ICONS[nextMode];

            // Update all icons in the toggle button
            elements.viewToggle.innerHTML = `<span class="material-symbols-rounded">${nextIcon}</span>`;
            elements.viewToggle.setAttribute('aria-label', `Alternar para ${nextMode === 'cards' ? 'cards' : nextMode === 'list' ? 'lista' : 'compacto'}`);
        },

        toggle() {
            const currentIdx = VIEW_MODES.indexOf(state.viewMode);
            const nextIdx = (currentIdx + 1) % VIEW_MODES.length;
            const newMode = VIEW_MODES[nextIdx];
            this.apply(newMode);
            // Re-render cards for new view
            cardRenderer.render(true);
        }
    };

    // ============================================
    // SORT MANAGER
    // ============================================
    const SORT_LABELS = {
        'date_desc': 'Recentes',
        'date_asc': 'Antigas',
        'company_asc': 'Empresa A-Z',
        'company_desc': 'Empresa Z-A',
        'title_asc': 'Título A-Z',
        'title_desc': 'Título Z-A'
    };

    const sortManager = {
        init() {
            if (elements.sortToggle && elements.sortDropdown) {
                elements.sortToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleDropdown();
                });

                elements.sortDropdown.querySelectorAll('.sort-option').forEach(option => {
                    option.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const sortKey = option.dataset.sort;
                        this.setSort(sortKey);
                        this.closeDropdown();
                    });
                });

                // Close on outside click
                document.addEventListener('click', () => this.closeDropdown());

                // Update label on init
                this.updateLabel();
            }
        },

        toggleDropdown() {
            elements.sortDropdown.classList.toggle('hidden');
        },

        closeDropdown() {
            elements.sortDropdown.classList.add('hidden');
        },

        setSort(sortKey) {
            state.sortBy = sortKey;
            this.updateLabel();
            filterManager.apply();
        },

        updateLabel() {
            if (elements.sortLabel) {
                elements.sortLabel.textContent = SORT_LABELS[state.sortBy] || 'Ordenar';
            }
            // Update active state
            elements.sortDropdown.querySelectorAll('.sort-option').forEach(opt => {
                opt.classList.toggle('active', opt.dataset.sort === state.sortBy);
            });
        }
    };

    // ============================================
    // SHARE MANAGER
    // ============================================
    const shareManager = {
        init() {
            if (elements.shareButton) {
                elements.shareButton.addEventListener('click', () => this.share());
            }
            // Load filters from URL on init
            this.loadFromURL();
        },

        buildURL() {
            const url = new URL(window.location.href.split('?')[0]);

            if (state.searchQuery) {
                url.searchParams.set('q', state.searchQuery);
            }
            if (state.quickFilter !== 'all') {
                url.searchParams.set('qf', state.quickFilter);
            }
            if (state.datePeriod !== 'all') {
                url.searchParams.set('dp', state.datePeriod);
            }
            if (state.sortBy !== 'date_desc') {
                url.searchParams.set('sort', state.sortBy);
            }

            Object.entries(state.selectedFilters).forEach(([key, values]) => {
                if (values && values.length > 0) {
                    url.searchParams.set(`f_${key}`, values.join('|'));
                }
            });

            return url.toString();
        },

        loadFromURL() {
            const params = new URLSearchParams(window.location.search);

            if (params.has('q')) {
                state.searchQuery = params.get('q');
                if (elements.searchInput) {
                    elements.searchInput.value = state.searchQuery;
                    elements.searchClear.classList.toggle('hidden', !state.searchQuery);
                }
            }
            if (params.has('qf')) {
                state.quickFilter = params.get('qf');
            }
            if (params.has('dp')) {
                state.datePeriod = params.get('dp');
            }
            if (params.has('sort')) {
                state.sortBy = params.get('sort');
            }

            params.forEach((value, key) => {
                if (key.startsWith('f_')) {
                    const filterKey = key.replace('f_', '');
                    state.selectedFilters[filterKey] = value.split('|');
                }
            });
        },

        async share() {
            const url = this.buildURL();
            const shareData = {
                title: 'classificavagas.com',
                text: 'Confira essas vagas!',
                url: url
            };

            // Try Web Share API first
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                try {
                    await navigator.share(shareData);
                    this.showToast('Compartilhado!');
                    return;
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        // Fall through to clipboard
                    } else {
                        return;
                    }
                }
            }

            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(url);
                this.showToast('Link copiado!');
            } catch (err) {
                // Final fallback
                const textarea = document.createElement('textarea');
                textarea.value = url;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                this.showToast('Link copiado!');
            }
        },

        showToast(message) {
            const existing = document.querySelector('.share-toast');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.className = 'theme-toast share-toast';
            toast.textContent = message;
            document.body.appendChild(toast);

            requestAnimationFrame(() => toast.classList.add('visible'));
            setTimeout(() => {
                toast.classList.remove('visible');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }
    };

    // ============================================
    // SKELETON LOADER
    // ============================================
    const skeletonLoader = {
        show() {
            const grid = elements.jobsGrid;
            if (!grid) return;

            const count = CONFIG.SKELETON_COUNT;
            const mode = state.viewMode;

            grid.innerHTML = '';

            for (let i = 0; i < count; i++) {
                grid.appendChild(this.createSkeleton(mode, i));
            }
        },

        createSkeleton(mode, index) {
            const card = document.createElement('div');
            card.className = 'skeleton-card';
            card.style.animationDelay = `${index * 0.05}s`;

            if (mode === 'compact') {
                card.innerHTML = `
                    <div class="skeleton-compact-content">
                        <div class="skeleton-compact-main">
                            <div class="skeleton-compact-title"></div>
                            <div class="skeleton-compact-company"></div>
                        </div>
                    </div>
                `;
            } else if (mode === 'list') {
                card.innerHTML = `
                    <div class="skeleton-list-content">
                        <div class="skeleton-icon"></div>
                        <div class="skeleton-list-main">
                            <div class="skeleton-title"></div>
                            <div class="skeleton-subtitle"></div>
                        </div>
                        <div class="skeleton-list-meta">
                            <div class="skeleton-location"></div>
                            <div class="skeleton-date"></div>
                        </div>
                    </div>
                `;
            } else {
                card.innerHTML = `
                    <div class="skeleton-header">
                        <div class="skeleton-icon"></div>
                        <div class="skeleton-title-group">
                            <div class="skeleton-title"></div>
                            <div class="skeleton-subtitle"></div>
                        </div>
                    </div>
                    <div class="skeleton-body">
                        <div class="skeleton-tag"></div>
                        <div class="skeleton-tag"></div>
                        <div class="skeleton-tag"></div>
                    </div>
                    <div class="skeleton-footer">
                        <div class="skeleton-location"></div>
                        <div class="skeleton-date"></div>
                    </div>
                `;
            }

            return card;
        },

        hide() {
            const skeletons = elements.jobsGrid?.querySelectorAll('.skeleton-card');
            if (skeletons) {
                skeletons.forEach(s => s.remove());
            }
        }
    };

    // ============================================
    // DATA LOADER
    // ============================================
    const dataLoader = {
        async load() {
            // Show skeleton loading
            skeletonLoader.show();

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

                // Count jobs per filter option
                state.filterCounts[key] = {};
                values.forEach(value => {
                    state.filterCounts[key][value] = state.allJobs.filter(j => j[key] === value).length;
                });
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

            // Date period filter
            if (state.datePeriod !== 'all') {
                const period = CONFIG.DATE_PERIODS.find(p => p.key === state.datePeriod);
                if (period && period.days) {
                    jobs = jobs.filter(job => utils.isWithinDays(job.inserted_date, period.days));
                }
            }

            // Selected filters
            Object.entries(state.selectedFilters).forEach(([key, values]) => {
                if (values && values.length > 0) {
                    jobs = jobs.filter(job => values.includes(job[key]));
                }
            });

            // Sorting
            jobs = this.sortJobs(jobs);

            state.filteredJobs = jobs;
            state.displayedCount = 0;

            this.updateUI();
            cardRenderer.render(true);
        },

        sortJobs(jobs) {
            const [field, direction] = state.sortBy.split('_');
            const asc = direction === 'asc';

            return jobs.sort((a, b) => {
                let valA, valB;

                switch (field) {
                    case 'date':
                        valA = a.inserted_date || '0000-00-00';
                        valB = b.inserted_date || '0000-00-00';
                        break;
                    case 'company':
                        valA = (a.company || '').toLowerCase();
                        valB = (b.company || '').toLowerCase();
                        break;
                    case 'title':
                        valA = (a.title || '').toLowerCase();
                        valB = (b.title || '').toLowerCase();
                        break;
                    default:
                        return 0;
                }

                if (valA < valB) return asc ? -1 : 1;
                if (valA > valB) return asc ? 1 : -1;
                return 0;
            });
        },

        updateUI() {
            // Job count
            elements.jobCount.textContent = `${state.filteredJobs.length.toLocaleString('pt-BR')} vagas`;

            // Filter badge
            let count = Object.values(state.selectedFilters)
                .filter(arr => arr && arr.length > 0)
                .reduce((sum, arr) => sum + arr.length, 0);

            if (state.datePeriod !== 'all') count++;

            if (count > 0) {
                elements.filterBadge.textContent = count;
                elements.filterBadge.classList.remove('hidden');
            } else {
                elements.filterBadge.classList.add('hidden');
            }

            // Update quick filter chips
            elements.filterChips.forEach(chip => {
                chip.dataset.active = chip.dataset.filter === state.quickFilter ? 'true' : 'false';
            });

            // Active filters chips
            this.renderActiveFilters();
        },

        renderActiveFilters() {
            const groups = [];

            // Add date period chip if active
            if (state.datePeriod !== 'all') {
                const period = CONFIG.DATE_PERIODS.find(p => p.key === state.datePeriod);
                if (period) {
                    groups.push({ key: '_date', label: 'Data', values: [period.label], isDate: true });
                }
            }

            // Group filters by category
            Object.entries(state.selectedFilters).forEach(([key, values]) => {
                if (values && values.length > 0) {
                    const category = CONFIG.FILTER_CATEGORIES.find(c => c.key === key);
                    const label = category ? category.label : key;
                    groups.push({ key, label, values });
                }
            });

            if (groups.length === 0) {
                elements.activeFilters.classList.add('hidden');
                return;
            }

            elements.activeFilters.classList.remove('hidden');
            elements.activeFiltersList.innerHTML = groups.map(({ key, label, values, isDate }) => {
                const count = values.length;
                const displayText = count === 1 ? values[0] : `${label}: ${count}`;
                const tooltipItems = count > 1 ? values.map(v => utils.escapeHtml(v)).join(', ') : '';

                return `
                    <div class="active-filter-chip ${count > 1 ? 'grouped' : ''}"
                         data-key="${key}"
                         ${isDate ? 'data-date="true"' : ''}
                         ${count > 1 ? `data-tooltip="${tooltipItems}"` : `data-value="${utils.escapeHtml(values[0])}"`}>
                        <span class="chip-text">${count === 1 ? utils.truncate(displayText, 18) : displayText}</span>
                        ${count > 1 ? `
                            <div class="filter-dropdown">
                                ${values.map(v => `
                                    <div class="filter-dropdown-item" data-value="${utils.escapeHtml(v)}">
                                        <span>${utils.escapeHtml(v)}</span>
                                        <button aria-label="Remover ${utils.escapeHtml(v)}">
                                            <span class="material-symbols-rounded">close</span>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        <button class="chip-close" aria-label="Remover">
                            <span class="material-symbols-rounded">close</span>
                        </button>
                    </div>
                `;
            }).join('');

            // Add event handlers
            elements.activeFiltersList.querySelectorAll('.active-filter-chip').forEach(chip => {
                const key = chip.dataset.key;
                const isDate = chip.dataset.date === 'true';
                const isGrouped = chip.classList.contains('grouped');

                // Close button on chip removes all values for that category
                chip.querySelector('.chip-close').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (isDate) {
                        state.datePeriod = 'all';
                    } else {
                        delete state.selectedFilters[key];
                    }
                    this.apply();
                });

                // For grouped chips, toggle dropdown on click
                if (isGrouped) {
                    chip.addEventListener('click', (e) => {
                        if (e.target.closest('.filter-dropdown') || e.target.closest('.chip-close')) return;
                        chip.classList.toggle('expanded');
                    });

                    // Individual remove buttons in dropdown
                    chip.querySelectorAll('.filter-dropdown-item button').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const item = btn.closest('.filter-dropdown-item');
                            const value = item.dataset.value;
                            this.removeFilter(key, value);
                        });
                    });
                } else if (!isDate) {
                    // Single value chip - close removes that value
                    chip.querySelector('.chip-close').addEventListener('click', (e) => {
                        e.stopPropagation();
                        const value = chip.dataset.value;
                        this.removeFilter(key, value);
                    });
                }
            });

            // Close dropdowns when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.active-filter-chip')) {
                    elements.activeFiltersList.querySelectorAll('.active-filter-chip.expanded').forEach(c => {
                        c.classList.remove('expanded');
                    });
                }
            }, { once: true });
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
            state.datePeriod = 'all';
            state.sortBy = 'date_desc';
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

            elements.emptyState.classList.add('hidden');

            if (jobs.length === 0 && state.displayedCount === 0) {
                elements.emptyState.classList.remove('hidden');
                elements.loadingMore.classList.add('hidden');
                return;
            }

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
            const formattedDate = utils.formatDate(job.inserted_date);

            const card = document.createElement('a');
            card.href = job.url;
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
            card.className = `job-card${isVisited ? ' visited' : ''}`;
            card.dataset.id = job.id;

            const levelName = job.level ? job.level.split(' - ').slice(1).join(' - ') : '';
            const categoryName = job.category ? job.category.split(' - ').slice(1).join(' - ') : '';

            if (state.viewMode === 'compact') {
                card.innerHTML = `
                    <div class="job-compact-content">
                        <span class="job-compact-title">${utils.escapeHtml(utils.truncate(job.title, 45))}</span>
                        <span class="job-compact-separator">·</span>
                        <span class="job-compact-company">${utils.escapeHtml(utils.truncate(job.company, 25))}</span>
                    </div>
                `;
            } else if (state.viewMode === 'list') {
                card.innerHTML = `
                    <div class="job-list-content">
                        <div class="job-card-icon ${isRemote ? 'remote' : 'onsite'}">
                            <span class="material-symbols-rounded">${isRemote ? 'home_work' : 'apartment'}</span>
                        </div>
                        <div class="job-list-main">
                            <h3>${utils.escapeHtml(job.title)}</h3>
                            <span class="job-list-company">${utils.escapeHtml(job.company)}</span>
                        </div>
                        <div class="job-list-meta">
                            <span class="job-list-location">
                                <span class="material-symbols-rounded">location_on</span>
                                ${utils.escapeHtml(utils.truncate(job.location, 20) || 'Não informado')}
                            </span>
                            <span class="job-list-date">${formattedDate}</span>
                        </div>
                    </div>
                `;
            } else {
                card.innerHTML = `
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
                        <span class="job-date">${formattedDate}</span>
                    </div>
                `;
            }

            card.addEventListener('click', () => {
                if (!state.visitedJobs.has(job.id)) {
                    utils.markVisited(job.id);
                    card.classList.add('visited');
                }
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
            state.tempDatePeriod = state.datePeriod;
            state.tempSortBy = state.sortBy;

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
            // Date period section
            const datePeriodSection = `
                <div class="filter-section expanded" data-key="_date">
                    <div class="filter-section-header">
                        <div class="filter-section-header-left">
                            <span class="material-symbols-rounded">calendar_today</span>
                            <span class="filter-section-title">Data da vaga</span>
                            ${state.tempDatePeriod !== 'all' ? `<span class="filter-section-count">1</span>` : ''}
                        </div>
                        <span class="material-symbols-rounded filter-section-icon">expand_more</span>
                    </div>
                    <div class="filter-section-body">
                        <div class="filter-options-list date-options">
                            ${CONFIG.DATE_PERIODS.map(period => `
                                <button class="filter-option-chip ${state.tempDatePeriod === period.key ? 'selected' : ''}" data-period="${period.key}">
                                    <span class="material-symbols-rounded check-icon">check</span>
                                    <span>${period.label}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            // Sort section
            const sortSection = `
                <div class="filter-section" data-key="_sort">
                    <div class="filter-section-header">
                        <div class="filter-section-header-left">
                            <span class="material-symbols-rounded">sort</span>
                            <span class="filter-section-title">Ordenar por</span>
                        </div>
                        <span class="material-symbols-rounded filter-section-icon">expand_more</span>
                    </div>
                    <div class="filter-section-body">
                        <div class="filter-options-list sort-options">
                            ${CONFIG.SORT_OPTIONS.map(opt => `
                                <button class="filter-option-chip ${state.tempSortBy === opt.key ? 'selected' : ''}" data-sort="${opt.key}">
                                    <span class="material-symbols-rounded check-icon">check</span>
                                    <span>${opt.label}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            // Regular filter sections
            const filterSections = CONFIG.FILTER_CATEGORIES.map(({ key, label, icon }) => {
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
                                ${this.renderOptions(key, options)}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            elements.filterSheetContent.innerHTML = datePeriodSection + sortSection + filterSections;

            // Add event listeners
            this.addSectionListeners();
        },

        renderOptions(key, options) {
            const selected = state.tempFilters[key] || [];
            const counts = state.filterCounts[key] || {};

            return options.map(opt => {
                const count = counts[opt] || 0;
                const countStr = count.toLocaleString('pt-BR');
                return `
                    <button class="filter-option-chip ${selected.includes(opt) ? 'selected' : ''}" data-key="${key}" data-value="${utils.escapeHtml(opt)}">
                        <span class="material-symbols-rounded check-icon">check</span>
                        <span>${utils.escapeHtml(utils.truncate(opt, 18))}</span>
                        <span class="filter-option-count">(${countStr})</span>
                    </button>
                `;
            }).join('');
        },

        addSectionListeners() {
            // Accordion headers
            elements.filterSheetContent.querySelectorAll('.filter-section-header').forEach(header => {
                header.addEventListener('click', () => {
                    const section = header.closest('.filter-section');
                    section.classList.toggle('expanded');
                });
            });

            // Date period options
            elements.filterSheetContent.querySelectorAll('.date-options .filter-option-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    const period = chip.dataset.period;
                    state.tempDatePeriod = period;

                    // Update UI
                    elements.filterSheetContent.querySelectorAll('.date-options .filter-option-chip').forEach(c => {
                        c.classList.toggle('selected', c.dataset.period === period);
                    });

                    // Update badge
                    const section = chip.closest('.filter-section');
                    const badge = section.querySelector('.filter-section-count');
                    if (period !== 'all') {
                        if (badge) {
                            badge.textContent = '1';
                        } else {
                            const left = section.querySelector('.filter-section-header-left');
                            left.insertAdjacentHTML('beforeend', `<span class="filter-section-count">1</span>`);
                        }
                    } else if (badge) {
                        badge.remove();
                    }

                    this.updateCount();
                });
            });

            // Sort options
            elements.filterSheetContent.querySelectorAll('.sort-options .filter-option-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    const sort = chip.dataset.sort;
                    state.tempSortBy = sort;

                    // Update UI
                    elements.filterSheetContent.querySelectorAll('.sort-options .filter-option-chip').forEach(c => {
                        c.classList.toggle('selected', c.dataset.sort === sort);
                    });
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
                        : allOptions;

                    const list = elements.filterSheetContent.querySelector(`.filter-options-list[data-key="${key}"]`);
                    list.innerHTML = this.renderOptions(key, filtered);
                    this.addOptionListeners(list);
                }, 150));
            });

            // Option chips
            elements.filterSheetContent.querySelectorAll('.filter-options-list[data-key]').forEach(list => {
                if (!list.classList.contains('date-options') && !list.classList.contains('sort-options')) {
                    this.addOptionListeners(list);
                }
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
            let count = Object.values(state.tempFilters)
                .filter(arr => arr && arr.length > 0)
                .reduce((sum, arr) => sum + arr.length, 0);

            if (state.tempDatePeriod !== 'all') count++;

            elements.sheetFilterCount.textContent = count > 0
                ? `${count} selecionado${count > 1 ? 's' : ''}`
                : 'Nenhum selecionado';
        },

        updateSectionBadges() {
            CONFIG.FILTER_CATEGORIES.forEach(({ key }) => {
                const section = elements.filterSheetContent.querySelector(`.filter-section[data-key="${key}"]`);
                if (!section) return;

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
            state.tempDatePeriod = 'all';
            state.tempSortBy = 'date_desc';

            elements.filterSheetContent.querySelectorAll('.filter-option-chip.selected').forEach(chip => {
                chip.classList.remove('selected');
            });

            // Select default date and sort options
            elements.filterSheetContent.querySelector('.date-options .filter-option-chip[data-period="all"]')?.classList.add('selected');
            elements.filterSheetContent.querySelector('.sort-options .filter-option-chip[data-sort="date_desc"]')?.classList.add('selected');

            elements.filterSheetContent.querySelectorAll('.filter-section-count').forEach(badge => {
                badge.remove();
            });

            this.updateCount();
        },

        applyAndClose() {
            state.selectedFilters = state.tempFilters;
            state.datePeriod = state.tempDatePeriod;
            state.sortBy = state.tempSortBy;
            filterManager.apply();
            this.close();
        }
    };

    // ============================================
    // SEARCH HISTORY MANAGER
    // ============================================
    const searchHistoryManager = {
        storageKey: 'cv_search_history',

        init() {
            this.load();
            this.createDropdown();
        },

        load() {
            try {
                const saved = localStorage.getItem(this.storageKey);
                state.searchHistory = saved ? JSON.parse(saved) : [];
            } catch (e) {
                state.searchHistory = [];
            }
        },

        save() {
            localStorage.setItem(this.storageKey, JSON.stringify(state.searchHistory));
        },

        add(query) {
            if (!query || query.length < 2) return;

            // Remove duplicates
            state.searchHistory = state.searchHistory.filter(q => q.toLowerCase() !== query.toLowerCase());

            // Add to beginning
            state.searchHistory.unshift(query);

            // Limit size
            if (state.searchHistory.length > CONFIG.MAX_SEARCH_HISTORY) {
                state.searchHistory = state.searchHistory.slice(0, CONFIG.MAX_SEARCH_HISTORY);
            }

            this.save();
            this.updateDropdown();
        },

        remove(query) {
            state.searchHistory = state.searchHistory.filter(q => q !== query);
            this.save();
            this.updateDropdown();
        },

        clear() {
            state.searchHistory = [];
            this.save();
            this.updateDropdown();
        },

        createDropdown() {
            const searchBar = document.querySelector('.search-bar');
            if (!searchBar) return;

            const dropdown = document.createElement('div');
            dropdown.className = 'search-history-dropdown hidden';
            dropdown.id = 'searchHistoryDropdown';
            searchBar.parentElement.appendChild(dropdown);

            this.updateDropdown();
        },

        updateDropdown() {
            const dropdown = document.getElementById('searchHistoryDropdown');
            if (!dropdown) return;

            if (state.searchHistory.length === 0) {
                dropdown.innerHTML = '';
                return;
            }

            dropdown.innerHTML = `
                <div class="search-history-header">
                    <span>Buscas recentes</span>
                    <button class="search-history-clear" aria-label="Limpar histórico">
                        <span class="material-symbols-rounded">delete_sweep</span>
                    </button>
                </div>
                <div class="search-history-list">
                    ${state.searchHistory.map(query => `
                        <div class="search-history-item" data-query="${utils.escapeHtml(query)}">
                            <span class="material-symbols-rounded">history</span>
                            <span class="search-history-text">${utils.escapeHtml(query)}</span>
                            <button class="search-history-remove" aria-label="Remover">
                                <span class="material-symbols-rounded">close</span>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;

            // Add event listeners
            dropdown.querySelector('.search-history-clear')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clear();
                this.hide();
            });

            dropdown.querySelectorAll('.search-history-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.closest('.search-history-remove')) return;
                    const query = item.dataset.query;
                    elements.searchInput.value = query;
                    elements.searchClear.classList.remove('hidden');
                    state.searchQuery = query;
                    filterManager.apply();
                    this.hide();
                });
            });

            dropdown.querySelectorAll('.search-history-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const item = btn.closest('.search-history-item');
                    const query = item.dataset.query;
                    this.remove(query);
                });
            });
        },

        show() {
            if (state.searchHistory.length === 0) return;
            const dropdown = document.getElementById('searchHistoryDropdown');
            if (dropdown) dropdown.classList.remove('hidden');
        },

        hide() {
            const dropdown = document.getElementById('searchHistoryDropdown');
            if (dropdown) dropdown.classList.add('hidden');
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

                // Save to history when search is applied
                if (state.searchQuery.length >= 2) {
                    searchHistoryManager.add(state.searchQuery);
                }
            }, CONFIG.SEARCH_DEBOUNCE);

            elements.searchInput.addEventListener('input', () => {
                const hasValue = elements.searchInput.value.length > 0;
                elements.searchClear.classList.toggle('hidden', !hasValue);
                search();
            });

            elements.searchInput.addEventListener('focus', () => {
                if (!elements.searchInput.value) {
                    searchHistoryManager.show();
                }
            });

            elements.searchInput.addEventListener('blur', () => {
                // Delay to allow click on history items
                setTimeout(() => searchHistoryManager.hide(), 200);
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
            viewModeManager.init();
            sortManager.init();
            shareManager.init();
            searchHistoryManager.init();
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
