/**
 * Classifica Vagas - Material Design 3
 * Modern Job Listing Application
 */

(function () {
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
            { key: 'company_type', label: 'Ramo', icon: 'category' },
            { key: 'level', label: 'Nível', icon: 'trending_up' },
            { key: 'category', label: 'Categoria', icon: 'work' },
            { key: 'sub_category', label: 'Especialidade', icon: 'star' },
            { key: 'company', label: 'Empresa', icon: 'business' },
            { key: 'location_scope', label: 'Abrangência', icon: 'public' },
            { key: 'site_type', label: 'Plataforma', icon: 'language' },
            { key: 'location', label: 'Localização', icon: 'location_on' },
            { key: 'location_country', label: 'País', icon: 'flag' },
            { key: 'location_state', label: 'Estado', icon: 'map' },
            { key: 'location_city', label: 'Cidade', icon: 'location_city' }
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
        searchHistory: [], // recent searches
        showOnlyVisited: false
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
        jobCountMobile: $('#jobCountMobile'),
        searchInput: $('#searchInput'),
        searchClear: $('#searchClear'),
        searchBar: $('#searchBar'),
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
        sortToggle: $('#sortToggle'),
        sortDropdown: $('#sortDropdown'),
        sortLabel: $('.sort-label'),
        quickClearFilters: $('#quickClearFilters')
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
            const date = new Date(dateStr + 'T00:00:00');
            const now = new Date();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Hoje';
            if (diffDays === 1) return 'Ontem';
            if (diffDays < 7) return `${diffDays}d atrás`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem`;
            if (diffDays < 365) return `${Math.floor(diffDays / 30)}m atrás`;
            return `${Math.floor(diffDays / 365)}a atrás`;
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

        toTitleCase(str) {
            if (!str) return '';
            const skipWords = new Set(['de', 'da', 'do', 'das', 'dos', 'em', 'com', 'para', 'por', 'que', 'e', 'a', 'o', 'as', 'os', 'um', 'uma', 'no', 'na', 'nos', 'nas', 'ao', 'aos', '\u00e0', '\u00e0s', 'se', '\u00e9']);
            return str.toLowerCase().split(/\s+/).map((word, i) => {
                if (!word) return word;
                if (i === 0 || !skipWords.has(word)) {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                }
                return word;
            }).join(' ');
        },

        getSmartLocation(job) {
            const isValid = (s) => s && s !== 'N\u00c3O INFORMADO' && s !== 'N\u00e3o informado' && s !== 'NAO INFORMADO';
            const scope = job.location_scope;
            const city = job.location_city;
            const state = job.location_state;
            const country = job.location_country;

            if (scope === 'INTERNACIONAL') {
                return isValid(country) ? country : 'Internacional';
            }
            if (scope === 'NACIONAL') return 'Brasil';
            if (isValid(city) && isValid(state)) return `${city}, ${state}`;
            if (isValid(city)) return city;
            if (isValid(state)) return state;
            return '';
        },

        getContractInfo(job) {
            const contract = job.contract;
            if (!contract || contract === 'N\u00c3O INFORMADO' || contract === 'NAO INFORMADO') return null;
            const map = {
                'H\u00cdBRIDO': { label: 'H\u00edbrido', cls: 'hybrid', icon: 'sync_alt' },
                'HIBRIDO': { label: 'H\u00edbrido', cls: 'hybrid', icon: 'sync_alt' },
                'REMOTO': { label: 'Remoto', cls: 'remote', icon: 'home_work' },
                'HOME OFFICE': { label: 'Home Office', cls: 'remote', icon: 'home_work' },
                'PRESENCIAL': { label: 'Presencial', cls: 'onsite', icon: 'apartment' },
                'EFETIVO': { label: 'Efetivo', cls: 'contract', icon: 'work' },
                'CLT': { label: 'CLT', cls: 'contract', icon: 'work' },
                'PJ': { label: 'PJ', cls: 'contract', icon: 'work' },
            };
            const up = contract.toUpperCase().trim();
            return map[up] || { label: contract, cls: 'contract' };
        },

        isToday(dateStr) {
            if (!dateStr) return false;
            const today = new Date().toISOString().split('T')[0];
            return dateStr === today;
        },

        // Use URL hash for stable job identification (survives JSON reordering)
        hashCode(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash).toString(36);
        },

        getJobKey(job) {
            // Use URL as unique identifier (most stable)
            return `cv_v_${this.hashCode(job.url || job.title + job.company)}`;
        },

        isVisited(job) {
            const key = typeof job === 'string' ? job : this.getJobKey(job);
            return localStorage.getItem(key) === '1';
        },

        markVisited(job) {
            const key = this.getJobKey(job);
            localStorage.setItem(key, '1');
            state.visitedJobs.add(key);
        },

        markSessionStart() {
            const last = localStorage.getItem('cv_last_visit');
            if (last) localStorage.setItem('cv_prev_visit', last);
            localStorage.setItem('cv_last_visit', new Date().toISOString().split('T')[0]);
        },

        isNewSinceLastVisit(dateStr) {
            if (!dateStr) return false;
            const prev = localStorage.getItem('cv_prev_visit');
            if (!prev) return false;
            return dateStr > prev;
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
    const THEMES = ['light', 'dark', 'black'];
    const THEME_LABELS = {
        'light': 'Light',
        'dark': 'Dark',
        'black': 'Black'
    };
    const THEME_META_COLORS = {
        'light': '#f9f9ff',
        'dark': '#1b1d23',
        'black': '#000000'
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

            // Sync tweaks panel buttons
            const themeGroup = document.querySelector('#tweaksTheme');
            if (themeGroup) themeGroup.querySelectorAll('[data-value]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === theme);
            });

            // Tooltip: indicate current + next on cycle
            const btn = document.getElementById('themeToggle');
            if (btn) {
                const idx = THEMES.indexOf(theme);
                const next = THEMES[(idx + 1) % THEMES.length];
                const map = { 'light': 'Claro', 'dark': 'Escuro', 'black': 'Preto' };
                btn.title = `Tema: ${map[theme]} — clique para ${map[next]}`;
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
    const VIEW_MODE_ICONS = { 'cards': 'grid_view', 'list': 'view_list', 'compact': 'density_small' };

    const viewModeManager = {
        init() {
            const saved = localStorage.getItem('cv_view');
            state.viewMode = saved && VIEW_MODES.includes(saved) ? saved : 'cards';
            this.apply(state.viewMode);

            if (elements.viewToggle) {
                elements.viewToggle.addEventListener('click', () => this.toggle());
            }
        },

        apply(mode, rerender = false) {
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

            // Re-render if requested (e.g. from tweaks panel)
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
    // STYLE MANAGER (editorial / restraint)
    // ============================================
    const styleManager = {
        apply(style) {
            document.documentElement.setAttribute('data-style', style);
            localStorage.setItem('cv_style', style);
            const btn = document.getElementById('styleToggle');
            if (btn) btn.textContent = style === 'editorial' ? 'Aa' : 'aa';
            const group = document.querySelector('#tweaksStyle');
            if (group) group.querySelectorAll('[data-value]').forEach(b => {
                b.classList.toggle('active', b.dataset.value === style);
            });
        },
        toggle() {
            const cur = document.documentElement.getAttribute('data-style') || 'editorial';
            this.apply(cur === 'editorial' ? 'restraint' : 'editorial');
        },
        init() {
            const saved = localStorage.getItem('cv_style') || 'restraint';
            this.apply(saved);
            const btn = document.getElementById('styleToggle');
            if (btn) btn.addEventListener('click', () => this.toggle());
        }
    };

    // ============================================
    // FONT MANAGER
    // ============================================
    const FONTS = ['instrument', 'newsreader', 'eb_garamond', 'dm_serif', 'bricolage', 'inter', 'mono'];
    const FONT_LABELS = {
        instrument: 'Instrument', newsreader: 'Newsreader', eb_garamond: 'EB Garamond',
        dm_serif: 'DM Serif', bricolage: 'Bricolage', inter: 'Inter', mono: 'Mono'
    };

    const fontManager = {
        apply(font) {
            document.documentElement.setAttribute('data-font', font);
            localStorage.setItem('cv_font', font);
            const group = document.querySelector('#tweaksFont');
            if (group) group.querySelectorAll('[data-font]').forEach(b => {
                b.classList.toggle('active', b.dataset.font === font);
            });
        },
        init() {
            const saved = localStorage.getItem('cv_font') || 'instrument';
            this.apply(saved);
        }
    };

    // ============================================
    // DENSITY MANAGER
    // ============================================
    const DENSITIES = ['compact', 'regular', 'comfy'];

    const densityManager = {
        apply(density) {
            document.documentElement.setAttribute('data-density', density);
            localStorage.setItem('cv_density', density);
            const group = document.querySelector('#tweaksDensity');
            if (group) group.querySelectorAll('[data-value]').forEach(b => {
                b.classList.toggle('active', b.dataset.value === density);
            });
        },
        toggle() {
            const cur = document.documentElement.getAttribute('data-density') || 'compact';
            const next = DENSITIES[(DENSITIES.indexOf(cur) + 1) % DENSITIES.length];
            this.apply(next);
        },
        init() {
            const saved = localStorage.getItem('cv_density') || 'compact';
            this.apply(saved);
            const btn = document.getElementById('densityToggle');
            if (btn) btn.addEventListener('click', () => this.toggle());
        }
    };

    // ============================================
    // TWEAKS PANEL
    // ============================================
    const tweaksPanel = {
        isOpen: false,

        init() {
            const toggleBtn = document.getElementById('tweaksToggle');
            const panel = document.getElementById('tweaksPanel');
            const closeBtn = document.getElementById('closeTweaks');
            if (!toggleBtn || !panel) return;

            // Remove 'hidden' class so the panel is controlled by 'open' class
            panel.classList.remove('hidden');

            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });

            if (closeBtn) closeBtn.addEventListener('click', () => this.close());

            document.addEventListener('click', (e) => {
                if (this.isOpen && !panel.contains(e.target) && e.target !== toggleBtn) {
                    this.close();
                }
            });

            // Style buttons (#tweaksStyle [data-value])
            const styleGroup = panel.querySelector('#tweaksStyle');
            if (styleGroup) {
                styleGroup.querySelectorAll('[data-value]').forEach(btn => {
                    btn.addEventListener('click', () => styleManager.apply(btn.dataset.value));
                });
            }

            // Font buttons (#tweaksFont [data-font])
            const fontGroup = panel.querySelector('#tweaksFont');
            if (fontGroup) {
                fontGroup.querySelectorAll('[data-font]').forEach(btn => {
                    btn.addEventListener('click', () => fontManager.apply(btn.dataset.font));
                });
            }

            // View mode buttons (#tweaksView [data-value])
            const viewGroup = panel.querySelector('#tweaksView');
            if (viewGroup) {
                viewGroup.querySelectorAll('[data-value]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const mode = btn.dataset.value;
                        if (VIEW_MODES.includes(mode)) {
                            viewModeManager.apply(mode, true);
                            this.syncGroup(viewGroup, mode);
                        }
                    });
                });
            }

            // Density buttons (#tweaksDensity [data-value])
            const densityGroup = panel.querySelector('#tweaksDensity');
            if (densityGroup) {
                densityGroup.querySelectorAll('[data-value]').forEach(btn => {
                    btn.addEventListener('click', () => densityManager.apply(btn.dataset.value));
                });
            }

            // Theme buttons (#tweaksTheme [data-value])
            const themeGroup = panel.querySelector('#tweaksTheme');
            if (themeGroup) {
                themeGroup.querySelectorAll('[data-value]').forEach(btn => {
                    btn.addEventListener('click', () => themeManager.apply(btn.dataset.value));
                });
            }

            // Sync all groups to initial state
            this.syncAll();
        },

        syncGroup(group, activeValue) {
            if (!group) return;
            group.querySelectorAll('[data-value],[data-font]').forEach(btn => {
                const val = btn.dataset.value || btn.dataset.font;
                btn.classList.toggle('active', val === activeValue);
            });
        },

        syncAll() {
            const panel = document.getElementById('tweaksPanel');
            if (!panel) return;
            const theme = document.documentElement.getAttribute('data-theme') || 'light';
            const style = document.documentElement.getAttribute('data-style') || 'editorial';
            const font  = document.documentElement.getAttribute('data-font')  || 'instrument';
            const density = document.documentElement.getAttribute('data-density') || 'compact';

            this.syncGroup(panel.querySelector('#tweaksTheme'), theme);
            this.syncGroup(panel.querySelector('#tweaksStyle'), style);
            this.syncGroup(panel.querySelector('#tweaksFont'), font);
            this.syncGroup(panel.querySelector('#tweaksDensity'), density);
            this.syncGroup(panel.querySelector('#tweaksView'), state.viewMode);
        },

        toggle() {
            this.isOpen ? this.close() : this.open();
        },

        open() {
            this.isOpen = true;
            this.syncAll();
            document.getElementById('tweaksPanel')?.classList.add('open');
        },

        close() {
            this.isOpen = false;
            document.getElementById('tweaksPanel')?.classList.remove('open');
        }
    };

    // ============================================
    // SCROLL PROGRESS
    // ============================================
    const scrollProgress = {
        init() {
            const bar = document.getElementById('scrollProgress');
            if (!bar) return;
            window.addEventListener('scroll', () => {
                const scrollY = window.scrollY;
                const docH = document.documentElement.scrollHeight - window.innerHeight;
                const pct = docH > 0 ? scrollY / docH : 0;
                bar.style.transform = `scaleX(${pct})`;
            }, { passive: true });
        }
    };

    // ============================================
    // SORT MANAGER
    // ============================================
    const SORT_LABELS = {
        'date_desc': 'Recentes',
        'date_asc': 'Antigas',
        'company_asc': 'A→Z',
        'company_desc': 'Z→A',
        'title_asc': 'Título ↑',
        'title_desc': 'Título ↓'
    };

    const sortManager = {
        isOpen: false,

        init() {
            if (elements.sortToggle && elements.sortDropdown) {
                // Simplified event listener - Click handles both mouse and touch correctly
                elements.sortToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleDropdown();
                });

                elements.sortDropdown.querySelectorAll('.sort-option').forEach(option => {
                    option.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const sortKey = option.dataset.sort;
                        this.setSort(sortKey);
                        this.closeDropdown();
                    });
                });

                // Close on outside click/touch
                document.addEventListener('click', (e) => {
                    if (this.isOpen && !elements.sortToggle.contains(e.target) && !elements.sortDropdown.contains(e.target)) {
                        this.closeDropdown();
                    }
                });

                // Close on scroll
                window.addEventListener('scroll', () => {
                    if (this.isOpen) this.closeDropdown();
                }, { passive: true });

                // Update label on init
                this.updateLabel();
            }
        },

        toggleDropdown() {
            if (this.isOpen) {
                this.closeDropdown();
            } else {
                this.openDropdown();
            }
        },

        openDropdown() {
            const rect = elements.sortToggle.getBoundingClientRect();

            // Move to body to avoid occlusion/clipping
            document.body.appendChild(elements.sortDropdown);

            elements.sortDropdown.style.position = 'fixed';
            elements.sortDropdown.style.top = `${rect.bottom + 8}px`;
            // Align right edge if it goes off screen, else align left
            if (rect.left + 200 > window.innerWidth) {
                elements.sortDropdown.style.left = 'auto';
                elements.sortDropdown.style.right = '16px';
            } else {
                elements.sortDropdown.style.left = `${rect.left}px`;
                elements.sortDropdown.style.right = 'auto';
            }

            elements.sortDropdown.classList.remove('hidden');
            this.isOpen = true;
        },

        closeDropdown() {
            elements.sortDropdown.classList.add('hidden');
            this.isOpen = false;
            // Optional: Move back to original place if needed, but keeping in body is fine for now
            // simpler to just leave it hidden in body
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
                        <div class="skeleton-date" style="width:28px;height:12px;margin-right:4px;"></div>
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
    function setSplashProgress(pct, msg) {
        const bar = document.getElementById('splashProgress');
        const pctEl = document.getElementById('splashPct');
        const msgEl = document.getElementById('splashMsg');
        if (bar) bar.style.width = pct + '%';
        if (pctEl) pctEl.textContent = Math.round(pct) + '%';
        if (msg && msgEl) msgEl.textContent = msg;
    }

    const dataLoader = {
        setSplashMsg(msg) {
            const el = document.getElementById('splashMsg');
            if (el) el.textContent = msg;
        },

        async load() {
            // Show skeleton loading
            skeletonLoader.show();
            const _splashStart = Date.now();
            let _lastSplashAt = _splashStart;
            const _setProgress = (pct, msg) => {
                setSplashProgress(pct, msg);
                return new Promise(r => {
                    const minDelay = 250;
                    const elapsedSinceLast = Date.now() - _lastSplashAt;
                    const wait = Math.max(0, minDelay - elapsedSinceLast);
                    setTimeout(() => { _lastSplashAt = Date.now(); r(); }, wait);
                });
            };
            await _setProgress(5, 'Conectando...');

            try {
                const xhrResult = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', CONFIG.DATA_URL);
                    xhr.responseType = 'json';
                    xhr.onprogress = (e) => {
                        if (e.lengthComputable) {
                            const pct = 10 + (e.loaded / e.total) * 60; // 10-70%
                            setSplashProgress(pct, `Baixando vagas... ${Math.round(e.loaded / 1024).toLocaleString('pt-BR')}KB`);
                        } else {
                            setSplashProgress(40, 'Baixando vagas...');
                        }
                    };
                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve({ data: xhr.response, lastModified: xhr.getResponseHeader('last-modified') });
                        } else {
                            reject(new Error(xhr.statusText || `HTTP ${xhr.status}`));
                        }
                    };
                    xhr.onerror = () => reject(new Error('Network error'));
                    xhr.send();
                });

                const data = xhrResult.data;
                await _setProgress(80, `Processando ${data.length.toLocaleString('pt-BR')} vagas...`);

                state.allJobs = data.map((job, i) => ({ ...job, id: i + 1 }));

                // Load visited (using URL-based keys for stability)
                state.allJobs.forEach(job => {
                    const key = utils.getJobKey(job);
                    if (utils.isVisited(key)) {
                        state.visitedJobs.add(key);
                    }
                });

                // Build filter options
                this.buildFilterOptions();

                // Update last modified
                this.updateLastModifiedFromHeader(xhrResult.lastModified);

                await _setProgress(95, 'Renderizando...');
                // Apply initial filters
                filterManager.apply();
                if (typeof visitedFilter !== 'undefined') visitedFilter.updateCount();
                setSplashProgress(100, 'Pronto!');

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

        updateLastModifiedFromHeader(lastMod) {
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

            // Search query (multi-term AND)
            if (state.searchQuery) {
                const terms = utils.normalize(state.searchQuery).split(/\s+/).filter(Boolean);
                if (terms.length) {
                    jobs = jobs.filter(job => {
                        const text = utils.normalize([
                            job.title, job.company, job.company_type,
                            job.level, job.category, job.sub_category,
                            job.location, job.location_city, job.location_state
                        ].filter(Boolean).join(' '));
                        return terms.every(t => text.includes(t));
                    });
                }
            }

            // Visited-only filter
            if (state.showOnlyVisited) {
                jobs = jobs.filter(j => utils.isVisited(j));
            }

            // Quick filter
            if (state.quickFilter !== 'all') {
                jobs = jobs.filter(job => {
                    switch (state.quickFilter) {
                        case 'remote': return job['remote?'] === '01 - Sim';
                        case 'hybrid': return job.contract === 'HIBRIDO' || job.contract === 'HÍBRIDO';
                        case 'onsite': return job['remote?'] === '02 - Não';
                        case 'affirmative': return job['affirmative?'] === '01 - Sim';
                        case 'today': return utils.isToday(job.inserted_date);
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
            this.recalculateFilterCounts(jobs); // Calculate counts based on current filtered set
            cardRenderer.render(true);
        },

        // Calculate counts for other filters based on current selection
        recalculateFilterCounts(currentJobs, filters = state.selectedFilters, datePeriod = state.datePeriod, quickFilter = state.quickFilter, searchQuery = state.searchQuery) {
            // Reset counts
            state.dynamicFilterCounts = {};

            // We need to calculate what the counts WOULD be if we applied
            // all CURRENT filters EXCEPT the category we are counting.
            // This is computationally expensive, so we optimize by only doing it for
            // categories that are NOT currently completely filtered out.

            CONFIG.FILTER_CATEGORIES.forEach(({ key }) => {
                // Get all filters EXCEPT the current category
                const otherFilters = { ...filters };
                delete otherFilters[key];

                // Base set of jobs to count from:
                // Start with all jobs
                let baseJobs = state.allJobs;

                // Apply search query (multi-term AND)
                if (searchQuery) {
                    const terms = utils.normalize(searchQuery).split(/\s+/).filter(Boolean);
                    if (terms.length) {
                        baseJobs = baseJobs.filter(job => {
                            const text = utils.normalize([
                                job.title, job.company, job.company_type,
                                job.level, job.category, job.sub_category,
                                job.location, job.location_city, job.location_state
                            ].filter(Boolean).join(' '));
                            return terms.every(t => text.includes(t));
                        });
                    }
                }

                // Apply visited-only
                if (state.showOnlyVisited) {
                    baseJobs = baseJobs.filter(j => utils.isVisited(j));
                }

                // Apply quick filter
                if (quickFilter !== 'all') {
                    baseJobs = baseJobs.filter(job => {
                        switch (quickFilter) {
                            case 'remote': return job['remote?'] === '01 - Sim';
                            case 'hybrid': return job.contract === 'HIBRIDO' || job.contract === 'HÍBRIDO';
                            case 'onsite': return job['remote?'] === '02 - Não';
                            case 'affirmative': return job['affirmative?'] === '01 - Sim';
                            case 'today': return utils.isToday(job.inserted_date);
                            default: return true;
                        }
                    });
                }

                // Apply date period
                if (datePeriod !== 'all') {
                    const period = CONFIG.DATE_PERIODS.find(p => p.key === datePeriod);
                    if (period && period.days) {
                        baseJobs = baseJobs.filter(job => utils.isWithinDays(job.inserted_date, period.days));
                    }
                }

                // Apply other active filters
                Object.entries(otherFilters).forEach(([otherKey, values]) => {
                    if (values && values.length > 0) {
                        baseJobs = baseJobs.filter(job => values.includes(job[otherKey]));
                    }
                });

                // Now count the occurrences of each value in this category
                state.dynamicFilterCounts[key] = {};
                baseJobs.forEach(job => {
                    const value = job[key];
                    if (value) {
                        state.dynamicFilterCounts[key][value] = (state.dynamicFilterCounts[key][value] || 0) + 1;
                    }
                });
            });
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
            const total = state.allJobs.length;
            const filtered = state.filteredJobs.length;
            const todayCount = state.allJobs.filter(j => utils.isToday(j.inserted_date)).length;
            const hasActiveFilters = state.searchQuery || state.quickFilter !== 'all' ||
                Object.values(state.selectedFilters).some(v => v && v.length > 0) || state.datePeriod !== 'all';

            if (hasActiveFilters) {
                elements.jobCount.textContent = `${filtered.toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')} vagas`;
            } else {
                elements.jobCount.textContent = todayCount > 0
                    ? `${total.toLocaleString('pt-BR')} vagas · ${todayCount.toLocaleString('pt-BR')} novas hoje`
                    : `${total.toLocaleString('pt-BR')} vagas`;
            }
            if (elements.jobCountMobile) {
                elements.jobCountMobile.textContent = elements.jobCount.textContent;
            }

            // Filter badge (counts everything: categories, datePeriod, quickFilter, visited)
            let count = 0;
            Object.values(state.selectedFilters).forEach(arr => { if (arr) count += arr.length; });
            if (state.datePeriod && state.datePeriod !== 'all') count += 1;
            if (state.quickFilter && state.quickFilter !== 'all') count += 1;
            if (state.showOnlyVisited) count += 1;
            elements.filterBadge.textContent = count;
            elements.filterBadge.classList.toggle('hidden', count === 0);
            if (elements.quickClearFilters) elements.quickClearFilters.classList.toggle('hidden', count === 0);

            // Update quick filter chips (sheet)
            if (typeof quickFilters !== 'undefined') quickFilters.syncUI();

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
            state.showOnlyVisited = false;
            elements.searchInput.value = '';
            elements.searchClear.classList.add('hidden');

            // Reset quick filter UI
            if (typeof quickFilters !== 'undefined') quickFilters.syncUI();
            const visitedBtn = document.getElementById('visitedToggle');
            if (visitedBtn) visitedBtn.setAttribute('aria-pressed', 'false');

            this.apply();
        },

        setQuickFilter(filter) {
            state.quickFilter = filter;
            if (typeof quickFilters !== 'undefined') quickFilters.syncUI();
            this.apply();
        }
    };

    // ============================================
    // CARD RENDERER
    // ============================================
    const cardRenderer = {
        _index: 0,

        render(reset = false) {
            if (reset) {
                elements.jobsGrid.innerHTML = '';
                state.displayedCount = 0;
                this._index = 0;
            }

            const start = state.displayedCount;
            const end = start + CONFIG.JOBS_PER_PAGE;
            const jobs = state.filteredJobs.slice(start, end);

            elements.emptyState.classList.add('hidden');

            if (jobs.length === 0 && state.displayedCount === 0) {
                elements.emptyState.classList.remove('hidden');
                elements.loadingMore.classList.add('hidden');
                const h3 = elements.emptyState.querySelector('h3');
                const p = elements.emptyState.querySelector('p');
                const btn = document.getElementById('emptyStateClear');
                if (state.showOnlyVisited && state.allJobs.filter(j => utils.isVisited(j)).length === 0) {
                    if (h3) h3.textContent = 'Nenhuma vaga visitada ainda';
                    if (p) p.textContent = 'Clique em qualquer vaga para abri-la — ela aparecerá aqui.';
                    if (btn) btn.textContent = 'Mostrar todas';
                } else {
                    if (h3) h3.textContent = 'Nenhuma vaga encontrada';
                    if (p) p.textContent = 'Tente ajustar seus filtros ou termos de busca';
                    if (btn) btn.textContent = 'Limpar filtros';
                }
                const counter = document.getElementById('resultsCounter');
                if (counter) counter.classList.add('hidden');
                return;
            }

            const fragment = document.createDocumentFragment();
            jobs.forEach(job => {
                this._index++;
                fragment.appendChild(this.createCard(job, this._index));
            });
            elements.jobsGrid.appendChild(fragment);

            state.displayedCount = end;

            // Always hide spinner after rendering a batch; it'll reappear on next scroll trigger
            elements.loadingMore.classList.add('hidden');

            // Update results counter
            const counter = document.getElementById('resultsCounter');
            if (counter) {
                if (state.filteredJobs.length === 0) {
                    counter.classList.add('hidden');
                } else {
                    counter.classList.remove('hidden');
                    const shown = Math.min(state.displayedCount, state.filteredJobs.length);
                    counter.textContent = `${shown.toLocaleString('pt-BR')} de ${state.filteredJobs.length.toLocaleString('pt-BR')}`;
                }
            }
        },

        createCard(job, index = 0) {
            const isRemote = job['remote?'] === '01 - Sim';
            const isAffirmative = job['affirmative?'] === '01 - Sim';
            const isNew = utils.isToday(job.inserted_date) || utils.isNewSinceLastVisit(job.inserted_date);
            const jobKey = utils.getJobKey(job);
            const isVisited = state.visitedJobs.has(jobKey);
            const relativeDate = utils.formatRelativeDate(job.inserted_date);
            const fullDate = utils.formatDate(job.inserted_date);
            const smartLocation = utils.getSmartLocation(job);
            const contractInfo = utils.getContractInfo(job);
            const title = (job.title || '').toUpperCase();

            const card = document.createElement('a');
            card.href = job.url;
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
            card.className = `job-card${isVisited ? ' visited' : ''}`;

            if (typeof animationManager !== 'undefined') {
                animationManager.observe(card);
            }
            card.dataset.id = job.id;

            const levelName = job.level ? job.level.split(' - ').slice(1).join(' - ') : '';
            const categoryName = job.category ? job.category.split(' - ').slice(1).join(' - ') : '';
            const isValidLevel = levelName && levelName !== 'Não definido' && levelName !== 'Nao definido';
            const isValidCategory = categoryName && categoryName !== 'Não definido' && categoryName !== 'Nao definido';
            const isValidCompanyType = job.company_type && job.company_type !== 'A Classificar' && job.company_type !== 'Não definido';

            const affirmativeTag = isAffirmative
                ? `<span class="job-tag job-tag-affirmative"><span class="material-symbols-rounded" style="font-size:13px;line-height:1">diversity_3</span>Afirmativa</span>`
                : '';

            const contractQuick = contractInfo
                ? (contractInfo.cls === 'remote' ? 'remote' : contractInfo.cls === 'hybrid' ? 'hybrid' : contractInfo.cls === 'onsite' ? 'onsite' : null)
                : null;
            const contractTag = contractInfo
                ? `<span class="job-tag job-tag-${contractInfo.cls}${contractQuick ? ' job-tag-clickable' : ''}"${contractQuick ? ` data-quick-filter="${contractQuick}"` : ''}>${contractInfo.icon ? `<span class="material-symbols-rounded" style="font-size:12px;line-height:1;margin-right:3px">${contractInfo.icon}</span>` : ''}${utils.escapeHtml(contractInfo.label)}</span>`
                : '';

            const newBadge = isNew
                ? `<span class="job-badge job-badge-new">Novo</span>`
                : '';

            const dateClass = isNew ? ' job-date-today' : '';

            if (state.viewMode === 'compact') {
                card.innerHTML = `
                    <div class="job-compact-content">
                        ${isNew ? '<span class="job-compact-dot"></span>' : ''}
                        <span class="job-compact-title">${utils.escapeHtml(utils.truncate(title, 45))}</span>
                        <span class="job-compact-separator">·</span>
                        <span class="job-compact-company">${utils.escapeHtml(utils.truncate(job.company, 20))}</span>
                        <span class="job-compact-date${dateClass}" title="${fullDate}">${relativeDate}</span>
                    </div>
                `;
            } else if (state.viewMode === 'list') {
                card.innerHTML = `
                    <div class="job-list-content">
                        <div class="job-list-index">
                            ${isNew ? '<span class="list-new-dot"></span>' : ''}
                        </div>
                        <div class="job-list-main">
                            <h3>${utils.escapeHtml(title)}</h3>
                            <div class="job-list-company-row">
                                <span class="job-list-company">${utils.escapeHtml(job.company)}</span>
                                ${isValidCompanyType ? `<span class="job-list-type">${utils.escapeHtml(job.company_type)}</span>` : ''}
                                ${contractInfo ? `<span class="job-tag job-tag-${contractInfo.cls} job-tag-compact${contractQuick ? ' job-tag-clickable' : ''}"${contractQuick ? ` data-quick-filter="${contractQuick}"` : ''}>${contractInfo.icon ? `<span class="material-symbols-rounded" style="font-size:11px;line-height:1;margin-right:2px">${contractInfo.icon}</span>` : ''}${utils.escapeHtml(contractInfo.label)}</span>` : ''}
                                ${isAffirmative ? `<span class="job-tag job-tag-affirmative job-tag-compact"><span class="material-symbols-rounded" style="font-size:12px;line-height:1">diversity_3</span>Afirm.</span>` : ''}
                            </div>
                        </div>
                        <div class="job-list-meta">
                            ${smartLocation ? `<span class="job-list-location"><span class="material-symbols-rounded">location_on</span>${utils.escapeHtml(utils.truncate(smartLocation, 18))}</span>` : ''}
                            <span class="job-list-date${dateClass}" title="${fullDate}">${relativeDate}</span>
                        </div>
                        <span class="job-list-arrow">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </span>
                    </div>
                `;
            } else {
                card.innerHTML = `
                    <div class="job-card-header">
                        <div class="job-card-icon ${isRemote ? 'remote' : 'onsite'}">
                            <span class="material-symbols-rounded">${isRemote ? 'home_work' : 'apartment'}</span>
                        </div>
                        <div class="job-card-title">
                            <h3>${utils.escapeHtml(title)}</h3>
                            <p>${utils.escapeHtml(job.company)}</p>
                        </div>
                        ${newBadge}
                    </div>
                    <div class="job-card-body">
                        ${contractTag}
                        ${affirmativeTag}
                        ${isValidLevel ? `<span class="job-tag job-tag-clickable" data-filter-key="level" data-filter-value="${utils.escapeHtml(job.level)}">${utils.escapeHtml(utils.truncate(levelName, 16))}</span>` : ''}
                        ${isValidCategory ? `<span class="job-tag job-tag-clickable" data-filter-key="category" data-filter-value="${utils.escapeHtml(job.category)}">${utils.escapeHtml(utils.truncate(categoryName, 16))}</span>` : ''}
                        ${isValidCompanyType ? `<span class="job-tag job-tag-clickable" data-filter-key="company_type" data-filter-value="${utils.escapeHtml(job.company_type)}">${utils.escapeHtml(utils.truncate(job.company_type, 18))}</span>` : ''}
                    </div>
                    <div class="job-card-footer">
                        <div class="job-location">
                            <span class="material-symbols-rounded">location_on</span>
                            <span>${smartLocation ? utils.escapeHtml(smartLocation) : '<span class="job-location-empty">—</span>'}</span>
                        </div>
                        <span class="job-date${dateClass}" title="${fullDate}">${relativeDate}</span>
                    </div>
                `;
            }

            // Long-press on dated elements shows full date on touch devices
            card.querySelectorAll('[title]').forEach(el => {
                let pressTimer;
                el.addEventListener('touchstart', () => {
                    pressTimer = setTimeout(() => {
                        const titleText = el.getAttribute('title');
                        if (titleText) {
                            const popup = document.createElement('div');
                            popup.className = 'date-popup';
                            popup.textContent = titleText;
                            document.body.appendChild(popup);
                            const rect = el.getBoundingClientRect();
                            popup.style.left = `${rect.left}px`;
                            popup.style.top = `${rect.bottom + 6}px`;
                            setTimeout(() => popup.remove(), 1800);
                        }
                    }, 500);
                }, { passive: true });
                el.addEventListener('touchend', () => clearTimeout(pressTimer), { passive: true });
                el.addEventListener('touchmove', () => clearTimeout(pressTimer), { passive: true });
            });

            card.addEventListener('click', (e) => {
                const tag = e.target.closest('.job-tag-clickable');
                if (tag) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (tag.dataset.quickFilter) {
                        filterManager.setQuickFilter(tag.dataset.quickFilter);
                    } else if (tag.dataset.filterKey && tag.dataset.filterValue) {
                        const k = tag.dataset.filterKey;
                        const v = tag.dataset.filterValue;
                        if (!state.selectedFilters[k]) state.selectedFilters[k] = [];
                        if (!state.selectedFilters[k].includes(v)) state.selectedFilters[k].push(v);
                        filterManager.apply();
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
                if (!state.visitedJobs.has(jobKey)) {
                    utils.markVisited(job);
                    card.classList.add('visited');
                    if (typeof visitedFilter !== 'undefined') visitedFilter.updateCount();
                }
                localStorage.setItem('cv_last_clicked', jobKey);
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

            // Initial count calculation for the modal state
            filterManager.recalculateFilterCounts(state.allJobs, state.tempFilters, state.tempDatePeriod, state.quickFilter, state.searchQuery);
            this.updateOptionCounts();

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
            // Tipo (quick filter) section
            const quickOpts = [
                { key: 'all', label: 'Todas' },
                { key: 'remote', label: 'Remoto' },
                { key: 'hybrid', label: 'Híbrido' },
                { key: 'onsite', label: 'Presencial' },
                { key: 'affirmative', label: 'Afirmativa' },
                { key: 'today', label: 'Hoje' }
            ];
            const quickSection = `
                <div class="filter-section" data-key="_quick">
                    <div class="filter-section-header">
                        <div class="filter-section-header-left">
                            <span class="material-symbols-rounded">tune</span>
                            <span class="filter-section-title">Tipo</span>
                            ${state.quickFilter !== 'all' ? `<span class="filter-section-count">1</span>` : ''}
                        </div>
                        <span class="material-symbols-rounded filter-section-icon">expand_more</span>
                    </div>
                    <div class="filter-section-body">
                        <div class="filter-options-list" id="sheetQuickFilters">
                            ${quickOpts.map(o => `
                                <button class="filter-option-chip ${state.quickFilter === o.key ? 'selected' : ''}" data-quick="${o.key}">
                                    <span class="material-symbols-rounded check-icon">check</span>
                                    <span>${o.label}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            // Data da vaga section (position: after Especialidade, before Empresa)
            const datePeriodSection = `
                <div class="filter-section" data-key="_date">
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

            // Order: Tipo | Ramo Nível Categoria Especialidade | Data | Empresa Abrangência Plataforma Localização País Estado Cidade
            // FILTER_CATEGORIES is already ordered; split at index 4 (Empresa) to insert date section
            const cats = CONFIG.FILTER_CATEGORIES;
            const beforeDate = cats.slice(0, 4); // Ramo Nível Categoria Especialidade
            const afterDate  = cats.slice(4);    // Empresa Abrangência Plataforma Localização País Estado Cidade

            const buildCats = (list) => list.map(({ key, label, icon }) => {
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

            elements.filterSheetContent.innerHTML =
                quickSection +
                buildCats(beforeDate) +
                datePeriodSection +
                buildCats(afterDate);

            // Add event listeners
            this.addSectionListeners();
        },

        renderOptions(key, options) {
            const selected = state.tempFilters[key] || [];
            // Use dynamic counts if available, otherwise fall back to static
            const counts = (state.dynamicFilterCounts && state.dynamicFilterCounts[key]) || state.filterCounts[key] || {};

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

            // Quick filter options (Tipo)
            elements.filterSheetContent.querySelectorAll('#sheetQuickFilters [data-quick]').forEach(chip => {
                chip.addEventListener('click', () => {
                    const q = chip.dataset.quick;
                    filterManager.setQuickFilter(q);
                    elements.filterSheetContent.querySelectorAll('#sheetQuickFilters [data-quick]').forEach(c => {
                        c.classList.toggle('selected', c.dataset.quick === q);
                    });
                    this.updateOptionCounts();
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
                    this.updateOptionCounts();
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
                    this.updateOptionCounts();
                });
            });
        },

        updateOptionCounts() {
            // Recalculate counts based on current TEMP state
            filterManager.recalculateFilterCounts(state.allJobs, state.tempFilters, state.tempDatePeriod, state.quickFilter, state.searchQuery);

            // Update all visible option counts
            elements.filterSheetContent.querySelectorAll('.filter-option-chip').forEach(chip => {
                const key = chip.dataset.key;
                const value = chip.dataset.value;

                // Skip date/sort options which don't have dynamic counts in the same way
                if (!key || key === '_date' || key === '_sort') return;

                const counts = state.dynamicFilterCounts[key] || {};
                const count = counts[value] || 0;

                const countEl = chip.querySelector('.filter-option-count');
                if (countEl) {
                    countEl.textContent = `(${count.toLocaleString('pt-BR')})`;
                }
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
            this.updateOptionCounts();
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

                elements.searchBar?.classList.remove('searching');
            }, CONFIG.SEARCH_DEBOUNCE);

            elements.searchInput.addEventListener('input', () => {
                const hasValue = elements.searchInput.value.length > 0;
                elements.searchClear.classList.toggle('hidden', !hasValue);
                if (hasValue) elements.searchBar?.classList.add('searching');
                else elements.searchBar?.classList.remove('searching');
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

            // Keyboard shortcut: press / to focus search
            document.addEventListener('keydown', (e) => {
                if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                    e.preventDefault();
                    elements.searchInput.focus();
                    elements.searchInput.select();
                }
                // Escape clears search if active
                if (e.key === 'Escape' && document.activeElement === elements.searchInput && state.searchQuery) {
                    elements.searchInput.value = '';
                    elements.searchClear.classList.add('hidden');
                    state.searchQuery = '';
                    filterManager.apply();
                }
            });
        }
    };

    // ============================================
    // ANIMATION MANAGER (SectionWrapper)
    // ============================================
    const animationManager = {
        observer: null,

        init() {
            // Options for intersection observer
            const options = {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            };

            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        this.observer.unobserve(entry.target); // Only animate once
                    }
                });
            }, options);

            // Animate main sections
            this.animateSections();
        },

        animateSections() {
            const sections = [
                elements.topAppBar,
                elements.searchBar?.parentElement,
                document.querySelector('.filter-chips-container'),
                elements.jobsGrid
            ];

            sections.forEach((section, index) => {
                if (section) {
                    section.classList.add('section-animate');
                    // Add staggered delays
                    if (index > 0) {
                        section.classList.add(`delay-${Math.min(index * 100, 400)}`);
                    }
                    this.observer.observe(section);
                }
            });
        },

        observe(element) {
            if (this.observer && element) {
                element.classList.add('section-animate');
                this.observer.observe(element);
            }
        }
    };

    // ============================================
    // SCROLL MANAGER
    // ============================================
    const scrollManager = {
        init() {
            let ticking = false;

            // Set CSS var for mobile sticky bar positioning
            const setHeaderHeight = () => {
                const h = elements.topAppBar ? elements.topAppBar.offsetHeight : 60;
                document.documentElement.style.setProperty('--header-h', h + 'px');
            };
            setHeaderHeight();
            window.addEventListener('resize', setHeaderHeight, { passive: true });

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

            // FAB ring progress
            const ring = document.getElementById('fabRingProgress');
            if (ring) {
                const maxScroll = docH - windowH;
                const pct = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;
                const circumference = 100.5;
                ring.style.strokeDashoffset = String(circumference * (1 - pct));
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
            document.querySelectorAll('[data-quick]').forEach(chip => {
                chip.addEventListener('click', () => {
                    filterManager.setQuickFilter(chip.dataset.quick);
                    this.syncUI();
                });
            });
            this.syncUI();
        },
        syncUI() {
            document.querySelectorAll('[data-quick]').forEach(chip => {
                chip.classList.toggle('selected', chip.dataset.quick === state.quickFilter);
            });
        }
    };

    // ============================================
    // VISITED FILTER
    // ============================================
    const visitedFilter = {
        init() {
            const btn = document.getElementById('visitedToggle');
            if (!btn) return;
            btn.addEventListener('click', () => this.toggle());
            this.updateCount();
        },
        toggle() {
            state.showOnlyVisited = !state.showOnlyVisited;
            const btn = document.getElementById('visitedToggle');
            if (btn) btn.setAttribute('aria-pressed', state.showOnlyVisited ? 'true' : 'false');
            filterManager.apply();
        },
        updateCount() {
            const el = document.getElementById('visitedCount');
            if (!el) return;
            const count = state.allJobs.filter(j => utils.isVisited(j)).length;
            el.textContent = count > 0 ? count.toLocaleString('pt-BR') : '';
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

            if (elements.quickClearFilters) {
                elements.quickClearFilters.addEventListener('click', () => {
                    filterManager.clearAll();
                });
            }

            elements.emptyStateClear.addEventListener('click', () => {
                filterManager.clearAll();
            });
        }
    };

    // ============================================
    // EVENT LISTENERS
    // ============================================
    // ============================================
    // SHORTCUTS OVERLAY
    // ============================================
    const shortcutsOverlay = {
        init() {
            const overlay = document.getElementById('shortcutsOverlay');
            const closeBtn = document.getElementById('closeShortcuts');
            if (!overlay) return;

            closeBtn?.addEventListener('click', () => overlay.classList.add('hidden'));
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.classList.add('hidden');
            });

            document.addEventListener('keydown', (e) => {
                const tag = document.activeElement?.tagName;
                if (['INPUT', 'TEXTAREA'].includes(tag)) return;
                if (e.key === '?') {
                    overlay.classList.toggle('hidden');
                }
                if (e.key === 't' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                    themeManager.toggle();
                }
            });

            // g-t chord for top
            let gPressed = false;
            document.addEventListener('keydown', (e) => {
                const tag = document.activeElement?.tagName;
                if (['INPUT', 'TEXTAREA'].includes(tag)) return;
                if (e.key === 'g') {
                    gPressed = true;
                    setTimeout(() => { gPressed = false; }, 800);
                    return;
                }
                if (e.key === 't' && gPressed) {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    gPressed = false;
                }
            });
        }
    };

    // ============================================
    // PULL TO REFRESH (mobile)
    // ============================================
    const ptr = {
        startY: 0,
        pulling: false,
        indicator: null,
        init() {
            if (!('ontouchstart' in window)) return;
            const ind = document.createElement('div');
            ind.className = 'ptr-indicator';
            ind.innerHTML = '<span class="material-symbols-rounded">refresh</span>';
            document.body.appendChild(ind);
            this.indicator = ind;

            document.addEventListener('touchstart', (e) => {
                if (window.scrollY === 0) {
                    this.startY = e.touches[0].clientY;
                    this.pulling = true;
                }
            }, { passive: true });

            document.addEventListener('touchmove', (e) => {
                if (!this.pulling) return;
                const dy = e.touches[0].clientY - this.startY;
                if (dy > 0 && dy < 120) {
                    this.indicator.style.transform = `translateX(-50%) translateY(${Math.min(dy - 30, 50)}px) rotate(${dy * 3}deg)`;
                    this.indicator.style.opacity = String(Math.min(dy / 80, 1));
                }
            }, { passive: true });

            document.addEventListener('touchend', (e) => {
                if (!this.pulling) return;
                const dy = (e.changedTouches[0].clientY - this.startY);
                this.pulling = false;
                this.indicator.style.transform = '';
                this.indicator.style.opacity = '';
                if (dy > 80) {
                    location.reload();
                }
            }, { passive: true });
        }
    };

    function init() {
        try {
            utils.markSessionStart();
            themeManager.init();
            // styleManager.init() / fontManager.init() — not called; defaults applied via HTML attrs
            densityManager.init();
            visitedFilter.init();
            viewModeManager.init();
            scrollProgress.init();
            // tweaksPanel removed — density toggle moved to header button
            sortManager.init();
            // shareManager.init() — share button removed from UI; URL loading still works via shareManager.loadFromURL()
            shareManager.loadFromURL();
            searchHistoryManager.init();
            searchManager.init();
            animationManager.init();
            scrollManager.init();
            quickFilters.init();
            bottomSheet.init();
            clearHandlers.init();
            shortcutsOverlay.init();
            ptr.init();

            // Brand logo click → reset to initial state
            const brandLink = document.getElementById('brandLink');
            if (brandLink) {
                brandLink.addEventListener('click', () => {
                    filterManager.clearAll();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                brandLink.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        filterManager.clearAll();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });
            }

            dataLoader.load().then(() => {
                const lastKey = localStorage.getItem('cv_last_clicked');
                if (!lastKey) return;
                setTimeout(() => {
                    const allCards = document.querySelectorAll('.job-card');
                    for (const c of allCards) {
                        const href = c.getAttribute('href');
                        const match = state.allJobs.find(j => utils.getJobKey(j) === lastKey);
                        if (match && match.url === href) {
                            c.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            c.classList.add('flash-highlight');
                            setTimeout(() => c.classList.remove('flash-highlight'), 2200);
                            break;
                        }
                    }
                }, 300);
            });

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
