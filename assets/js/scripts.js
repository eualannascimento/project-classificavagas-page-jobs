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
        RECENT_DATA_URL: 'assets/data/json/recent_jobs.json',
        RECENT_MAX_AGE_DAYS: 14,
        FILTER_CATEGORIES: [
            { key: 'company_type', label: 'Ramo', icon: 'category' },
            { key: 'level', label: 'Nível', icon: 'trending_up' },
            { key: 'category', label: 'Categoria', icon: 'work' },
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
            { key: 'date_desc', label: 'Obtidas: mais recentes', icon: 'schedule' },
            { key: 'date_asc', label: 'Obtidas: mais antigas', icon: 'history' },
            { key: 'published_desc', label: 'Publicadas: mais recentes', icon: 'event' },
            { key: 'published_asc', label: 'Publicadas: mais antigas', icon: 'event' },
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
        tempQuickFilter: 'all',
        selectedFilters: {},
        tempFilters: {},
        isPartialData: false,
        hideZeroFilterOptions: true,
        filterOptions: {},
        filterCounts: {}, // counts per filter option
        visitedJobs: new Set(),
        insertedDateRange: { from: '', to: '' },
        publishedDateRange: { from: '', to: '' },
        sortBy: 'published_desc',
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
        searchInput: $('#searchInput'),
        searchClear: $('#searchClear'),
        searchBar: $('#searchBar'),
        filterChips: $$('.filter-chip[data-filter]'),
        openFilters: $('#openFilters'),
        filterBadge: $('#filterBadge'),
        activeFilters: $('#activeFilters'),
        activeFiltersList: $('#activeFiltersList'),
        clearAllFilters: $('#clearAllFilters'),
        saveFilterBtn: $('#saveFilterBtn'),
        savedFilterCountBadge: $('#savedFilterCountBadge'),
        savedFiltersDropdown: $('#savedFiltersDropdown'),
        savedFiltersMenuSheet: $('#savedFiltersMenuSheet'),
        savedFiltersMenuSheetList: $('#savedFiltersMenuSheetList'),
        savedFiltersMenuSheetActions: $('#savedFiltersMenuSheetActions'),
        savedFiltersMenuSheetCount: $('#savedFiltersMenuSheetCount'),
        closeSavedFiltersMenuSheet: $('#closeSavedFiltersMenuSheet'),
        saveFilterSheet: $('#saveFilterSheet'),
        closeSaveFilterSheet: $('#closeSaveFilterSheet'),
        saveFilterSummary: $('#saveFilterSummary'),
        saveFilterName: $('#saveFilterName'),
        saveFilterLimit: $('#saveFilterLimit'),
        confirmSaveFilter: $('#confirmSaveFilter'),
        confirmSaveFilterLabel: $('#confirmSaveFilterLabel'),
        removeSavedFilter: $('#removeSavedFilter'),
        cancelSaveFilter: $('#cancelSaveFilter'),
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
        sheetApplyLabel: $('#sheetApplyLabel'),
        sortSheet: $('#sortSheet'),
        closeSortSheet: $('#closeSortSheet'),
        themeToggle: $('#themeToggle'),
        lastUpdate: $('#lastUpdate'),
        topAppBar: $('.top-app-bar'),
        viewToggle: $('#viewToggle'),
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

        DATE_MISSING_PUBLISHED_LINE: 'Data de publicação não foi obtida',
        DATE_MISSING_INSERTED: 'Não obtida',
        EMPTY_DATE_RANGE: Object.freeze({ from: '', to: '' }),

        hasDateValue(dateStr) {
            return Boolean(dateStr && String(dateStr).trim());
        },

        _datePartsFromDate(date) {
            if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return { iso: `${y}-${m}-${d}`, display: `${d}/${m}/${y}` };
        },

        _parsePostedRelative(str) {
            const s = String(str).toLowerCase();
            const daysMatch = s.match(/posted\s+(\d+)\+?\s*days?\s+ago/);
            if (daysMatch) {
                const date = new Date();
                date.setDate(date.getDate() - parseInt(daysMatch[1], 10));
                return this._datePartsFromDate(date);
            }
            const weeksMatch = s.match(/posted\s+(\d+)\s*weeks?\s+ago/);
            if (weeksMatch) {
                const date = new Date();
                date.setDate(date.getDate() - parseInt(weeksMatch[1], 10) * 7);
                return this._datePartsFromDate(date);
            }
            if (/posted\s+yesterday/.test(s)) {
                const date = new Date();
                date.setDate(date.getDate() - 1);
                return this._datePartsFromDate(date);
            }
            if (/posted\s+today/.test(s)) {
                return this._datePartsFromDate(new Date());
            }
            return null;
        },

        parseJobDate(input) {
            if (input === null || input === undefined) return null;

            if (typeof input === 'number' && Number.isFinite(input)) {
                const ms = input > 1e12 ? input : input * 1000;
                return this._datePartsFromDate(new Date(ms));
            }

            const str = String(input).trim();
            if (!str) return null;

            const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (isoMatch) {
                const [, y, m, d] = isoMatch;
                return { iso: `${y}-${m}-${d}`, display: `${d}/${m}/${y}` };
            }

            const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (brMatch) {
                const [, d, m, y] = brMatch;
                const dd = d.padStart(2, '0');
                const mm = m.padStart(2, '0');
                return { iso: `${y}-${mm}-${dd}`, display: `${dd}/${mm}/${y}` };
            }

            const posted = this._parsePostedRelative(str);
            if (posted) return posted;

            if (!/^posted\s/i.test(str)) {
                const parsed = new Date(str);
                if (!Number.isNaN(parsed.getTime())) {
                    return this._datePartsFromDate(parsed);
                }
            }

            return null;
        },

        getJobDateIso(dateStr) {
            return this.parseJobDate(dateStr)?.iso || '';
        },

        formatDate(dateStr) {
            return this.parseJobDate(dateStr)?.display || '';
        },

        formatJobDateDisplay(dateStr, kind = 'inserted') {
            const parsed = this.parseJobDate(dateStr);
            if (!parsed) {
                return kind === 'inserted' ? this.DATE_MISSING_INSERTED : '';
            }
            return parsed.display;
        },

        cloneDateRange(range) {
            return { from: range?.from || '', to: range?.to || '' };
        },

        hasDateRange(range) {
            return Boolean(range?.from || range?.to);
        },

        isDateInRange(dateStr, range) {
            if (!this.hasDateRange(range)) return true;
            const iso = this.getJobDateIso(dateStr);
            if (!iso) return false;
            if (range.from && iso < range.from) return false;
            if (range.to && iso > range.to) return false;
            return true;
        },

        formatDateRangeLabel(range) {
            if (!this.hasDateRange(range)) return '';
            const from = range.from ? this.formatDate(range.from) : '…';
            const to = range.to ? this.formatDate(range.to) : '…';
            return `${from} – ${to}`;
        },

        periodKeyToRange(periodKey) {
            const period = CONFIG.DATE_PERIODS.find(p => p.key === periodKey);
            if (!period || period.key === 'all' || !period.days) return this.cloneDateRange(this.EMPTY_DATE_RANGE);
            const to = new Date();
            const from = new Date();
            from.setDate(from.getDate() - period.days);
            const iso = (d) => d.toISOString().split('T')[0];
            return { from: iso(from), to: iso(to) };
        },

        rangeToPeriodKey(range) {
            if (!this.hasDateRange(range)) return null;
            const normalized = this.normalizeDateRange(range);
            const today = new Date().toISOString().split('T')[0];
            if (normalized.to !== today) return null;
            for (const period of CONFIG.DATE_PERIODS) {
                if (!period.days) continue;
                const expected = this.periodKeyToRange(period.key);
                if (expected.from === normalized.from && expected.to === normalized.to) {
                    return period.key;
                }
            }
            return null;
        },

        matchesQuickFilter(job, quickFilter) {
            if (!quickFilter || quickFilter === 'all') return true;
            const contractInfo = this.getContractInfo(job);
            const contractCls = contractInfo?.cls;
            const isRemoteFlag = job['remote?'] === '01 - Sim';
            const isOnsiteFlag = job['remote?'] === '02 - Não';

            switch (quickFilter) {
                case 'remote':
                    return contractCls === 'remote' || isRemoteFlag;
                case 'hybrid':
                    return contractCls === 'hybrid';
                case 'onsite':
                    return contractCls === 'onsite' || (isOnsiteFlag && contractCls !== 'hybrid');
                case 'affirmative':
                    return job['affirmative?'] === '01 - Sim';
                case 'today':
                    return this.isToday(job.inserted_date);
                default:
                    return true;
            }
        },

        normalizeDateRange(range) {
            const normalized = this.cloneDateRange(range);
            if (normalized.from && normalized.to && normalized.from > normalized.to) {
                return { from: normalized.to, to: normalized.from };
            }
            return normalized;
        },

        renderJobDatesHtml(job, variant = 'card') {
            const publishedParsed = this.parseJobDate(job.published_date);
            const hasPublished = Boolean(publishedParsed);
            const pub = hasPublished ? this.escapeHtml(publishedParsed.display) : '';
            const ins = this.escapeHtml(this.formatJobDateDisplay(job.inserted_date, 'inserted'));
            const isInsertedToday = this.isToday(job.inserted_date);
            const todayClass = isInsertedToday ? ' job-date-today' : '';
            const publishedLine = hasPublished
                ? `<span class="job-date-line">Publicada em: <strong>${pub}</strong></span>`
                : `<span class="job-date-line job-date-missing">${this.DATE_MISSING_PUBLISHED_LINE}</span>`;
            const publishedCompact = hasPublished ? `Pub.: ${pub}` : 'Pub.: não obtida';

            if (variant === 'compact') {
                return `<span class="job-dates job-dates-compact${todayClass}" title="${hasPublished ? `Publicada em: ${pub}` : this.DATE_MISSING_PUBLISHED_LINE} · Obtida no Classifica Vagas: ${ins}">
                    <span class="job-date-line">${publishedCompact}</span>
                    <span class="job-date-sep">·</span>
                    <span class="job-date-line">Obt.: ${ins}</span>
                </span>`;
            }

            const listClass = variant === 'list' ? ' job-dates-list' : '';
            return `<div class="job-dates${listClass}${todayClass}">
                ${publishedLine}
                <span class="job-date-line">Obtida no Classifica Vagas: <strong>${ins}</strong></span>
            </div>`;
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

        isMobile() {
            return window.matchMedia('(max-width: 720px)').matches;
        },

        showToast(message, className = 'theme-toast', duration = 2000) {
            const baseClass = className.split(' ')[0];
            const existing = document.querySelector(`.${baseClass}`);
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.className = className;
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            toast.textContent = message;
            document.body.appendChild(toast);

            requestAnimationFrame(() => toast.classList.add('visible'));
            setTimeout(() => {
                toast.classList.remove('visible');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        },

        escapeHtml(str) {
            if (!str) return '';
            const el = document.createElement('div');
            el.textContent = str;
            return el.innerHTML;
        },

        truncate(str, len) {
            if (!str || str.length <= len) return str || '';
            return str.slice(0, len) + '...';
        },

        normalize(str) {
            if (!str) return '';
            return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        },

        splitOutsideQuotes(str, operator) {
            const parts = [];
            let current = '';
            let inQuote = false;
            let i = 0;
            const opPattern = new RegExp(`^\\s+${operator}\\s+`, 'i');

            while (i < str.length) {
                const ch = str[i];
                if (ch === '"') {
                    inQuote = !inQuote;
                    current += ch;
                    i++;
                    continue;
                }
                if (!inQuote) {
                    const tail = str.slice(i);
                    const match = tail.match(opPattern);
                    if (match) {
                        parts.push(current);
                        current = '';
                        i += match[0].length;
                        continue;
                    }
                }
                current += ch;
                i++;
            }
            if (current.trim()) parts.push(current);
            return parts;
        },

        parseSearchTerm(part) {
            const trimmed = String(part || '').trim();
            if (!trimmed) return null;

            if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
                const phrase = this.normalize(trimmed.slice(1, -1)).trim().replace(/\s+/g, ' ');
                return phrase ? { type: 'phrase', value: phrase } : null;
            }

            const words = this.normalize(trimmed).split(/\s+/).filter(Boolean);
            if (!words.length) return null;
            if (words.length === 1) return { type: 'phrase', value: words[0] };
            return { type: 'words', values: words };
        },

        parseSearchQuery(query) {
            const raw = String(query || '').trim();
            if (!raw) return { type: 'empty' };

            const hasOu = /\s+ou\s+/i.test(raw);
            const hasE = /\s+e\s+/i.test(raw);

            if (!hasOu && !hasE) {
                const part = this.parseSearchTerm(raw);
                if (!part) return { type: 'empty' };
                if (part.type === 'words') {
                    return {
                        type: 'and',
                        terms: part.values.map(value => ({ type: 'phrase', value }))
                    };
                }
                return { type: 'and', terms: [part] };
            }

            const groups = this.splitOutsideQuotes(raw, 'ou')
                .map(segment => this.splitOutsideQuotes(segment, 'e')
                    .map(part => this.parseSearchTerm(part))
                    .filter(Boolean))
                .filter(group => group.length > 0);

            return groups.length ? { type: 'expr', groups } : { type: 'empty' };
        },

        getSearchOrSegments(query) {
            const raw = String(query || '').trim();
            if (!raw) return [];
            if (!/\s+ou\s+/i.test(raw)) return [raw];
            return this.splitOutsideQuotes(raw, 'ou').map(s => s.trim()).filter(Boolean);
        },

        formatSearchSegmentLabel(segment) {
            const parsed = this.parseSearchTerm(segment);
            if (!parsed) return String(segment || '').trim();
            if (parsed.type === 'phrase') return parsed.value;
            if (parsed.type === 'words') return parsed.values.join(' ');
            return String(segment || '').trim();
        },

        removeSearchOrSegment(query, index) {
            const segments = this.getSearchOrSegments(query);
            if (index < 0 || index >= segments.length) return String(query || '').trim();
            segments.splice(index, 1);
            return segments.length ? segments.join(' ou ') : '';
        },

        getSearchText(job) {
            return this.normalize([
                job.title, job.company, job.company_type,
                job.level, job.category, job.sub_category,
                job.location, job.location_city, job.location_state
            ].filter(Boolean).join(' '));
        },

        jobMatchesSearch(job, parsedQuery) {
            if (!parsedQuery || parsedQuery.type === 'empty') return true;
            const text = this.getSearchText(job);

            const matchTerm = (term) => {
                if (!term) return true;
                if (term.type === 'phrase') return text.includes(term.value);
                if (term.type === 'words') return term.values.every(value => text.includes(value));
                if (term.type === 'word') return text.includes(term.value);
                return true;
            };

            if (parsedQuery.type === 'and') {
                return parsedQuery.terms.every(matchTerm);
            }
            if (parsedQuery.type === 'expr') {
                return parsedQuery.groups.some(andGroup => andGroup.every(matchTerm));
            }
            return true;
        },

        formatJobTitle(str) {
            if (!str) return '';
            return String(str).toLocaleUpperCase('pt-BR');
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

        VISITED_INDEX_KEY: 'cv_visited_index',
        MAX_VISITED_KEYS: 400,

        markVisited(job) {
            const key = this.getJobKey(job);
            localStorage.setItem(key, '1');
            state.visitedJobs.add(key);

            let index = [];
            try {
                index = JSON.parse(localStorage.getItem(this.VISITED_INDEX_KEY) || '[]');
            } catch (err) {
                index = [];
            }
            index = index.filter(k => k !== key);
            index.push(key);
            if (index.length > this.MAX_VISITED_KEYS) {
                const removed = index.splice(0, index.length - this.MAX_VISITED_KEYS);
                removed.forEach(k => {
                    localStorage.removeItem(k);
                    state.visitedJobs.delete(k);
                });
            }
            localStorage.setItem(this.VISITED_INDEX_KEY, JSON.stringify(index));
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
        light: 'Claro',
        dark: 'Escuro',
        black: 'Preto'
    };
    const THEME_META_COLORS = {
        'light': '#f9f9ff',
        'dark': '#1b1d23',
        'black': '#000000'
    };

    const preferencesManager = {
        VISITED_KEY: 'cv_has_visited',
        SORT_KEY: 'cv_sort',
        DEFAULT_SORT: 'published_desc',

        hasVisitedBefore() {
            return localStorage.getItem(this.VISITED_KEY) === '1';
        },

        markVisited() {
            localStorage.setItem(this.VISITED_KEY, '1');
        },

        getDefaultSort() {
            return this.hasVisitedBefore()
                ? (localStorage.getItem(this.SORT_KEY) || this.DEFAULT_SORT)
                : this.DEFAULT_SORT;
        },

        saveSort(sortBy) {
            if (sortBy) localStorage.setItem(this.SORT_KEY, sortBy);
        },

        applyDefaults() {
            state.sortBy = this.getDefaultSort();
        }
    };

    const themeManager = {
        _initialized: false,

        init() {
            const saved = localStorage.getItem('cv_theme');
            let theme = 'light';
            if (preferencesManager.hasVisitedBefore() && saved && THEMES.includes(saved)) {
                theme = saved;
            }
            this.apply(theme, { silent: true, persist: false });
            this._initialized = true;

            elements.themeToggle.addEventListener('click', () => this.toggle());
        },

        apply(theme, { silent = false, persist = true } = {}) {
            document.documentElement.setAttribute('data-theme', theme);
            if (persist && preferencesManager.hasVisitedBefore()) {
                localStorage.setItem('cv_theme', theme);
            }

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

            if (this._initialized && !silent) {
                this.showThemeToast(theme);
            }
        },

        toggle() {
            const current = document.documentElement.getAttribute('data-theme');
            const idx = THEMES.indexOf(current);
            const next = THEMES[(idx + 1) % THEMES.length];
            preferencesManager.markVisited();
            this.apply(next, { persist: true });
            localStorage.setItem('cv_theme', next);
        },

        showThemeToast(theme) {
            utils.showToast(THEME_LABELS[theme] || theme, 'theme-toast', 1200);
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
            this.apply(state.viewMode, true);

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
    // SHEET SWIPE (mobile dismiss)
    // ============================================
    const sheetSwipe = {
        bind(sheetEl, onClose) {
            const header = sheetEl?.querySelector('.sheet-draggable');
            if (!header || header.dataset.swipeBound) return;
            header.dataset.swipeBound = '1';
            let startY = 0;
            let dragging = false;

            header.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
                dragging = true;
            }, { passive: true });

            header.addEventListener('touchmove', (e) => {
                if (!dragging) return;
                const dy = e.touches[0].clientY - startY;
                if (dy > 0) {
                    sheetEl.style.transition = 'none';
                    sheetEl.style.transform = `translateY(${Math.min(dy, 140)}px)`;
                }
            }, { passive: true });

            const end = (clientY) => {
                if (!dragging) return;
                dragging = false;
                const dy = clientY - startY;
                sheetEl.style.transition = '';
                sheetEl.style.transform = '';
                if (dy > 72) onClose();
            };

            header.addEventListener('touchend', (e) => {
                end(e.changedTouches[0].clientY);
            }, { passive: true });
        }
    };

    // ============================================
    // SORT MANAGER
    // ============================================
    const SORT_LABELS = {
        'date_desc': 'Obtidas ↓',
        'date_asc': 'Obtidas ↑',
        'published_desc': 'Publicadas ↓',
        'published_asc': 'Publicadas ↑',
        'company_asc': 'A→Z',
        'company_desc': 'Z→A',
        'title_asc': 'Título ↑',
        'title_desc': 'Título ↓'
    };

    const QUICK_FILTER_LABELS = {
        all: 'Todas',
        remote: 'Remoto',
        hybrid: 'Híbrido',
        onsite: 'Presencial',
        affirmative: 'Afirmativa',
        today: 'Adicionadas hoje'
    };

    const sortManager = {
        isOpen: false,
        sortSheetOpen: false,

        init() {
            this.initSortSheet();
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

        initSortSheet() {
            const sheet = elements.sortSheet;
            if (!sheet) return;

            elements.closeSortSheet?.addEventListener('click', () => this.closeSortSheet());

            sheet.querySelectorAll('.sort-sheet-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    this.setSort(opt.dataset.sort);
                    this.closeSortSheet();
                });
            });

            sheetSwipe.bind(sheet, () => this.closeSortSheet());

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.sortSheetOpen) this.closeSortSheet();
            });
        },

        toggleDropdown() {
            if (utils.isMobile()) {
                if (this.sortSheetOpen) this.closeSortSheet();
                else this.openSortSheet();
            } else if (this.isOpen) {
                this.closeDropdown();
            } else {
                this.openDropdown();
            }
        },

        openSortSheet() {
            if (typeof savedFiltersManager !== 'undefined' && savedFiltersManager.menuSheetOpen) {
                savedFiltersManager.closeMenuSheet();
            }
            if (this.isOpen) this.closeDropdown();
            this.updateLabel();
            elements.scrim.classList.remove('hidden');
            elements.sortSheet.classList.remove('hidden');
            elements.sortSheet.setAttribute('role', 'dialog');
            elements.sortSheet.setAttribute('aria-modal', 'true');
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(() => {
                elements.scrim.classList.add('visible');
                elements.sortSheet.classList.add('visible');
                elements.closeSortSheet?.focus();
            });
            this.sortSheetOpen = true;
            elements.sortToggle?.setAttribute('aria-expanded', 'true');
        },

        closeSortSheet() {
            elements.scrim.classList.remove('visible');
            elements.sortSheet.classList.remove('visible');
            setTimeout(() => {
                elements.sortSheet.classList.add('hidden');
                const filterOpen = elements.filterSheet && !elements.filterSheet.classList.contains('hidden');
                const savedMenuOpen = typeof savedFiltersManager !== 'undefined' && savedFiltersManager.menuSheetOpen;
                if (!filterOpen && !savedMenuOpen) {
                    elements.scrim.classList.add('hidden');
                    document.body.style.overflow = '';
                }
                elements.sortToggle?.focus();
            }, 400);
            this.sortSheetOpen = false;
            elements.sortToggle?.setAttribute('aria-expanded', 'false');
        },

        openDropdown() {
            const rect = elements.sortToggle.getBoundingClientRect();

            // Move to body to avoid occlusion/clipping
            document.body.appendChild(elements.sortDropdown);

            elements.sortToggle.setAttribute('aria-expanded', 'true');
            elements.sortToggle.setAttribute('aria-controls', 'sortDropdown');

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
            elements.sortToggle.setAttribute('aria-expanded', 'false');
            this.isOpen = false;
            // Optional: Move back to original place if needed, but keeping in body is fine for now
            // simpler to just leave it hidden in body
        },

        setSort(sortKey) {
            state.sortBy = sortKey;
            preferencesManager.saveSort(sortKey);
            preferencesManager.markVisited();
            this.updateLabel();
            filterManager.apply();
        },

        updateLabel() {
            if (elements.sortLabel) {
                elements.sortLabel.textContent = SORT_LABELS[state.sortBy] || 'Ordenar';
            }
            elements.sortDropdown?.querySelectorAll('.sort-option').forEach(opt => {
                opt.classList.toggle('active', opt.dataset.sort === state.sortBy);
            });
            elements.sortSheet?.querySelectorAll('.sort-sheet-option').forEach(opt => {
                const selected = opt.dataset.sort === state.sortBy;
                opt.classList.toggle('selected', selected);
                opt.setAttribute('aria-selected', selected ? 'true' : 'false');
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
            const copyBtn = document.getElementById('copySearchLink');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => this.copyLink());
            }
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
            const insertedPeriod = utils.rangeToPeriodKey(state.insertedDateRange);
            if (insertedPeriod) {
                url.searchParams.set('dp', insertedPeriod);
            } else if (utils.hasDateRange(state.insertedDateRange)) {
                if (state.insertedDateRange.from) url.searchParams.set('idf', state.insertedDateRange.from);
                if (state.insertedDateRange.to) url.searchParams.set('idt', state.insertedDateRange.to);
            }
            const publishedPeriod = utils.rangeToPeriodKey(state.publishedDateRange);
            if (publishedPeriod) {
                url.searchParams.set('pdp', publishedPeriod);
            } else if (utils.hasDateRange(state.publishedDateRange)) {
                if (state.publishedDateRange.from) url.searchParams.set('pdf', state.publishedDateRange.from);
                if (state.publishedDateRange.to) url.searchParams.set('pdt', state.publishedDateRange.to);
            }
            if (state.showOnlyVisited) {
                url.searchParams.set('v', '1');
            }
            if (state.sortBy !== preferencesManager.DEFAULT_SORT) {
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
            if (params.has('idf') || params.has('idt')) {
                state.insertedDateRange = {
                    from: params.get('idf') || '',
                    to: params.get('idt') || ''
                };
            } else if (params.has('dp')) {
                state.insertedDateRange = utils.periodKeyToRange(params.get('dp'));
            }
            if (params.has('pdf') || params.has('pdt')) {
                state.publishedDateRange = {
                    from: params.get('pdf') || '',
                    to: params.get('pdt') || ''
                };
            } else if (params.has('pdp')) {
                state.publishedDateRange = utils.periodKeyToRange(params.get('pdp'));
            }
            state.insertedDateRange = utils.normalizeDateRange(state.insertedDateRange);
            state.publishedDateRange = utils.normalizeDateRange(state.publishedDateRange);
            if (params.has('v') && params.get('v') === '1') {
                state.showOnlyVisited = true;
            }
            if (params.has('sort')) {
                state.sortBy = params.get('sort');
                preferencesManager.saveSort(state.sortBy);
            }

            params.forEach((value, key) => {
                if (key.startsWith('f_')) {
                    const filterKey = key.replace('f_', '');
                    state.selectedFilters[filterKey] = value.split('|');
                }
            });

            if (state.showOnlyVisited) {
                const visitedBtn = document.getElementById('visitedToggle');
                if (visitedBtn) visitedBtn.setAttribute('aria-pressed', 'true');
            }
        },

        async copyLink() {
            const url = this.buildURL();
            try {
                await navigator.clipboard.writeText(url);
                utils.showToast('Link copiado!', 'theme-toast share-toast');
            } catch (err) {
                const textarea = document.createElement('textarea');
                textarea.value = url;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                utils.showToast('Link copiado!', 'theme-toast share-toast');
            }
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
            utils.showToast(message, 'theme-toast share-toast');
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

    const jobsWorkerBridge = {
        _worker: null,
        _seq: 0,

        getWorker() {
            if (!this._worker && typeof Worker !== 'undefined') {
                try {
                    this._worker = new Worker('assets/js/jobs-worker.js');
                } catch (_) {
                    this._worker = null;
                }
            }
            return this._worker;
        },

        parseJsonText(text) {
            const worker = this.getWorker();
            if (!worker) {
                return Promise.resolve(JSON.parse(text));
            }
            const id = ++this._seq;
            return new Promise((resolve, reject) => {
                const onMessage = (e) => {
                    if (e.data?.id !== id) return;
                    worker.removeEventListener('message', onMessage);
                    if (e.data.type === 'parsed') resolve(e.data.data);
                    else reject(new Error(e.data.message || 'Parse failed'));
                };
                worker.addEventListener('message', onMessage);
                worker.postMessage({ id, type: 'parse', text });
            });
        }
    };

    const dataLoader = {
        _slowNetworkTimer: null,
        _loadPromise: null,

        setSplashMsg(msg) {
            const el = document.getElementById('splashMsg');
            if (el) el.textContent = msg;
        },

        async fetchJson(url, onProgress, { preferGzip = true } = {}) {
            if (preferGzip && typeof DecompressionStream !== 'undefined') {
                try {
                    return await this._fetchGzipJson(url + '.gz', onProgress);
                } catch (_) {
                    /* fallback to plain JSON */
                }
            }
            return this._fetchJsonXHR(url, onProgress);
        },

        _fetchGzipJson(url, onProgress) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                xhr.responseType = 'arraybuffer';
                xhr.onprogress = (e) => {
                    if (onProgress) onProgress(e);
                };
                xhr.onload = async () => {
                    if (xhr.status < 200 || xhr.status >= 300) {
                        reject(new Error(xhr.statusText || `HTTP ${xhr.status}`));
                        return;
                    }
                    try {
                        const stream = new Blob([xhr.response]).stream().pipeThrough(new DecompressionStream('gzip'));
                        const text = await new Response(stream).text();
                        const data = await jobsWorkerBridge.parseJsonText(text);
                        resolve({
                            data,
                            lastModified: xhr.getResponseHeader('last-modified')
                        });
                    } catch (err) {
                        reject(err);
                    }
                };
                xhr.onerror = () => reject(new Error('Network error'));
                xhr.send();
            });
        },

        _fetchJsonXHR(url, onProgress) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                xhr.responseType = 'text';
                xhr.onprogress = (e) => {
                    if (onProgress) onProgress(e);
                };
                xhr.onload = async () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const data = await jobsWorkerBridge.parseJsonText(xhr.responseText);
                            resolve({
                                data,
                                lastModified: xhr.getResponseHeader('last-modified')
                            });
                        } catch (err) {
                            reject(err);
                        }
                    } else {
                        reject(new Error(xhr.statusText || `HTTP ${xhr.status}`));
                    }
                };
                xhr.onerror = () => reject(new Error('Network error'));
                xhr.send();
            });
        },

        ingestJobs(data, lastModified) {
            if (!Array.isArray(data)) {
                throw new Error('Invalid jobs data');
            }
            state.allJobs = data.map((job, i) => ({ ...job, id: i + 1 }));
            state.allJobs.forEach(job => {
                const key = utils.getJobKey(job);
                if (utils.isVisited(key)) {
                    state.visitedJobs.add(key);
                }
            });
            this.buildFilterOptions();
            this.updateLastModifiedFromHeader(lastModified);
        },

        updatePartialBanner() {
            const banner = document.getElementById('partialDataBanner');
            if (!banner) return;
            if (state.isPartialData) {
                banner.classList.remove('hidden');
                banner.textContent = `Exibindo vagas recentes (${state.allJobs.length.toLocaleString('pt-BR')}). Catálogo completo carregando…`;
            } else {
                banner.classList.add('hidden');
            }
        },

        showLoadError(err) {
            console.error('Error loading jobs:', err);
            skeletonLoader.hide();
            this.showApp();
            if (elements.emptyState) {
                elements.jobsGrid.innerHTML = '';
                elements.emptyState.classList.remove('hidden');
                const h3 = elements.emptyState.querySelector('h3');
                const p = elements.emptyState.querySelector('p');
                const retryBtn = document.getElementById('emptyStateRetry');
                const clearBtn = document.getElementById('emptyStateClear');
                if (h3) h3.textContent = 'Erro ao carregar';
                if (p) p.textContent = 'Não foi possível carregar as vagas. Verifique sua conexão e tente novamente.';
                if (retryBtn) retryBtn.classList.remove('hidden');
                if (clearBtn) clearBtn.classList.add('hidden');
            }
        },

        load(options = {}) {
            if (this._loadPromise) return this._loadPromise;
            this._loadPromise = this._loadInternal(options).finally(() => {
                this._loadPromise = null;
            });
            return this._loadPromise;
        },

        async _loadInternal({ soft = false } = {}) {
            if (soft && state.allJobs.length > 0) {
                try {
                    const recentResult = await this.fetchJson(CONFIG.RECENT_DATA_URL, null, { preferGzip: false });
                    if (recentResult.data?.length) {
                        this.ingestJobs(recentResult.data, recentResult.lastModified);
                        state.isPartialData = true;
                        this.updatePartialBanner();
                        filterManager.apply();
                        if (typeof visitedFilter !== 'undefined') visitedFilter.updateCount();
                    }
                } catch (_) { /* optional */ }
                try {
                    const fullResult = await this.fetchJson(CONFIG.DATA_URL);
                    this.ingestJobs(fullResult.data, fullResult.lastModified);
                    state.isPartialData = false;
                    this.updatePartialBanner();
                    filterManager.apply();
                    if (typeof visitedFilter !== 'undefined') visitedFilter.updateCount();
                    utils.showToast('Vagas atualizadas', 'theme-toast', 2500);
                } catch (_) {
                    utils.showToast('Não foi possível atualizar o catálogo', 'theme-toast', 3000);
                }
                return;
            }

            skeletonLoader.show();
            let _lastSplashAt = Date.now();
            const _setProgress = (pct, msg) => {
                setSplashProgress(pct, msg);
                return new Promise(r => {
                    const minDelay = 250;
                    const elapsedSinceLast = Date.now() - _lastSplashAt;
                    const wait = Math.max(0, minDelay - elapsedSinceLast);
                    setTimeout(() => { _lastSplashAt = Date.now(); r(); }, wait);
                });
            };

            if (this._slowNetworkTimer) clearTimeout(this._slowNetworkTimer);
            this._slowNetworkTimer = setTimeout(() => {
                this.setSplashMsg('Em redes lentas, o download completo pode levar alguns minutos.');
            }, 8000);

            await _setProgress(5, 'Conectando...');

            let showedApp = false;

            try {
                try {
                    const recentResult = await this.fetchJson(CONFIG.RECENT_DATA_URL, null, { preferGzip: false });
                    if (recentResult.data?.length) {
                        this.ingestJobs(recentResult.data, recentResult.lastModified);
                        state.isPartialData = true;
                        await _setProgress(65, `Exibindo ${recentResult.data.length.toLocaleString('pt-BR')} vagas recentes...`);
                        filterManager.apply();
                        if (typeof visitedFilter !== 'undefined') visitedFilter.updateCount();
                        this.updatePartialBanner();
                        this.showApp();
                        showedApp = true;
                        skeletonLoader.hide();
                    }
                } catch (_) {
                    /* recent_jobs.json optional */
                }

                const fullResult = await this.fetchJson(CONFIG.DATA_URL, (e) => {
                    if (e.lengthComputable) {
                        const pct = showedApp ? 70 + (e.loaded / e.total) * 25 : 10 + (e.loaded / e.total) * 60;
                        setSplashProgress(pct, `Baixando catálogo... ${Math.round(e.loaded / 1024).toLocaleString('pt-BR')} KB`);
                    } else if (!showedApp) {
                        setSplashProgress(40, 'Baixando vagas...');
                    }
                });

                clearTimeout(this._slowNetworkTimer);
                this._slowNetworkTimer = null;

                const wasPartial = state.isPartialData;
                await _setProgress(showedApp ? 90 : 80, `Processando ${fullResult.data.length.toLocaleString('pt-BR')} vagas...`);

                this.ingestJobs(fullResult.data, fullResult.lastModified);
                state.isPartialData = false;
                this.updatePartialBanner();

                filterManager.apply();
                if (typeof visitedFilter !== 'undefined') visitedFilter.updateCount();

                if (wasPartial) {
                    utils.showToast('Catálogo completo atualizado', 'theme-toast', 2500);
                } else {
                    await _setProgress(95, 'Renderizando...');
                    setSplashProgress(100, 'Pronto!');
                    this.showApp();
                }

                skeletonLoader.hide();

            } catch (err) {
                clearTimeout(this._slowNetworkTimer);
                this._slowNetworkTimer = null;
                if (!showedApp) {
                    this.showLoadError(err);
                } else {
                    utils.showToast('Não foi possível atualizar o catálogo completo', 'theme-toast', 3000);
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
        _groupedDropdown: { chip: null, key: null },
        _groupedDropdownInit: false,

        initGroupedFilterDropdown() {
            if (this._groupedDropdownInit) return;
            this._groupedDropdownInit = true;

            document.addEventListener('click', (e) => {
                if (e.target.closest('.active-filter-chip.grouped') ||
                    e.target.closest('#activeFilterDropdownPortal')) {
                    return;
                }
                this.closeGroupedFilterDropdown();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.closeGroupedFilterDropdown();
            });

            window.addEventListener('scroll', () => this.closeGroupedFilterDropdown(), { passive: true });
            window.addEventListener('resize', () => this.closeGroupedFilterDropdown());
        },

        closeGroupedFilterDropdown() {
            if (this._groupedDropdown.chip) {
                this._groupedDropdown.chip.classList.remove('expanded');
                this._groupedDropdown.chip.setAttribute('aria-expanded', 'false');
            }
            const portal = document.getElementById('activeFilterDropdownPortal');
            if (portal) {
                portal.classList.add('hidden');
                portal.innerHTML = '';
                portal.removeAttribute('style');
            }
            this._groupedDropdown = { chip: null, key: null };
        },

        formatFilterOptionLabel(value) {
            if (!value) return '';
            const str = String(value);
            const match = str.match(/^\d+\s*-\s*(.+)$/);
            return match ? match[1].trim() : str;
        },

        openGroupedFilterDropdown(chip, key, values) {
            this.closeGroupedFilterDropdown();

            let portal = document.getElementById('activeFilterDropdownPortal');
            if (!portal) {
                portal = document.createElement('div');
                portal.id = 'activeFilterDropdownPortal';
                portal.className = 'filter-dropdown filter-dropdown-portal hidden';
                portal.setAttribute('role', 'listbox');
                document.body.appendChild(portal);
            }

            chip.classList.add('expanded');
            chip.setAttribute('aria-expanded', 'true');
            this._groupedDropdown = { chip, key };

            portal.innerHTML = values.map(v => `
                <div class="filter-dropdown-item" data-value="${utils.escapeHtml(v)}" role="option">
                    <span>${utils.escapeHtml(this.formatFilterOptionLabel(v))}</span>
                    <button type="button" aria-label="Remover ${utils.escapeHtml(this.formatFilterOptionLabel(v))}">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                </div>
            `).join('');

            portal.querySelectorAll('.filter-dropdown-item button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const item = btn.closest('.filter-dropdown-item');
                    this.removeFilter(key, item.dataset.value);
                    this.closeGroupedFilterDropdown();
                });
            });

            const rect = chip.getBoundingClientRect();
            const maxLeft = Math.max(8, Math.min(rect.left, window.innerWidth - 220));
            portal.style.cssText = `
                position: fixed;
                top: ${rect.bottom + 6}px;
                left: ${maxLeft}px;
                min-width: ${Math.max(rect.width, 220)}px;
                max-width: min(92vw, 320px);
                z-index: 600;
                display: flex;
            `;
            portal.classList.remove('hidden');
        },

        filterJobs(jobs, {
            searchQuery = state.searchQuery,
            showOnlyVisited = state.showOnlyVisited,
            quickFilter = state.quickFilter,
            insertedDateRange = state.insertedDateRange,
            publishedDateRange = state.publishedDateRange,
            selectedFilters = state.selectedFilters
        } = {}) {
            let result = jobs;

            if (searchQuery) {
                const parsedQuery = utils.parseSearchQuery(searchQuery);
                if (parsedQuery.type !== 'empty') {
                    result = result.filter(job => utils.jobMatchesSearch(job, parsedQuery));
                }
            }

            if (showOnlyVisited) {
                result = result.filter(j => utils.isVisited(j));
            }

            if (quickFilter !== 'all') {
                result = result.filter(job => utils.matchesQuickFilter(job, quickFilter));
            }

            if (utils.hasDateRange(insertedDateRange)) {
                const range = utils.normalizeDateRange(insertedDateRange);
                result = result.filter(job => utils.isDateInRange(job.inserted_date, range));
            }

            if (utils.hasDateRange(publishedDateRange)) {
                const range = utils.normalizeDateRange(publishedDateRange);
                result = result.filter(job => utils.isDateInRange(job.published_date, range));
            }

            Object.entries(selectedFilters).forEach(([key, values]) => {
                if (values && values.length > 0) {
                    result = result.filter(job => values.includes(job[key]));
                }
            });

            return result;
        },

        getFilteredCount(overrides = {}) {
            return this.filterJobs(state.allJobs, overrides).length;
        },

        apply() {
            let jobs = this.filterJobs([...state.allJobs]);
            jobs = this.sortJobs(jobs);

            state.filteredJobs = jobs;
            state.displayedCount = 0;

            this.updateUI();
            this.recalculateFilterCounts(jobs); // Calculate counts based on current filtered set
            cardRenderer.render(true);
        },

        // Calculate counts for other filters based on current selection
        recalculateFilterCounts(
            currentJobs,
            filters = state.selectedFilters,
            insertedDateRange = state.insertedDateRange,
            publishedDateRange = state.publishedDateRange,
            quickFilter = state.quickFilter,
            searchQuery = state.searchQuery
        ) {
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
                // Start with all jobs and apply all current filters except the category being counted.
                let baseJobs = this.filterJobs(state.allJobs, {
                    searchQuery,
                    showOnlyVisited: state.showOnlyVisited,
                    quickFilter,
                    insertedDateRange,
                    publishedDateRange,
                    selectedFilters: otherFilters
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
                        valA = utils.getJobDateIso(a.inserted_date) || '0000-00-00';
                        valB = utils.getJobDateIso(b.inserted_date) || '0000-00-00';
                        break;
                    case 'published':
                        valA = utils.getJobDateIso(a.published_date) || '0000-00-00';
                        valB = utils.getJobDateIso(b.published_date) || '0000-00-00';
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
                Object.values(state.selectedFilters).some(v => v && v.length > 0) ||
                utils.hasDateRange(state.insertedDateRange) || utils.hasDateRange(state.publishedDateRange);

            if (hasActiveFilters) {
                elements.jobCount.textContent = `${filtered.toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')} vagas`;
            } else {
                elements.jobCount.textContent = todayCount > 0
                    ? `${total.toLocaleString('pt-BR')} vagas · ${todayCount.toLocaleString('pt-BR')} novas hoje`
                    : `${total.toLocaleString('pt-BR')} vagas`;
            }
            // Filter badge (counts everything: categories, datePeriod, quickFilter, visited)
            let count = 0;
            Object.values(state.selectedFilters).forEach(arr => { if (arr) count += arr.length; });
            if (utils.hasDateRange(state.insertedDateRange)) count += 1;
            if (utils.hasDateRange(state.publishedDateRange)) count += 1;
            if (state.quickFilter && state.quickFilter !== 'all') count += 1;
            if (state.showOnlyVisited) count += 1;
            elements.filterBadge.textContent = count;
            elements.filterBadge.classList.toggle('hidden', count === 0);

            // Update quick filter chips (sheet)
            if (typeof quickFilters !== 'undefined') quickFilters.syncUI();

            this.updateSaveActionVisibility();

            // Active filters chips
            this.renderActiveFilters();
        },

        hasShareableState(filterState = state) {
            return Boolean(filterState.searchQuery ||
                filterState.quickFilter !== 'all' ||
                filterState.showOnlyVisited ||
                utils.hasDateRange(filterState.insertedDateRange) ||
                utils.hasDateRange(filterState.publishedDateRange) ||
                Object.values(filterState.selectedFilters || {}).some(v => v && v.length > 0));
        },

        updateSaveActionVisibility() {
            savedFiltersManager.updateButton();
            const hasShareableState = this.hasShareableState(state);
            const copyBtn = document.getElementById('copySearchLink');
            if (copyBtn) copyBtn.classList.toggle('hidden', !hasShareableState);
        },

        buildFilterSummaryItems(filterState = state, { includeSort = false } = {}) {
            const groups = [];

            if (filterState.searchQuery) {
                const segments = utils.getSearchOrSegments(filterState.searchQuery);
                if (segments.length > 1) {
                    segments.forEach((segment, index) => {
                        groups.push({
                            key: `_search_${index}`,
                            label: 'Busca',
                            values: [utils.formatSearchSegmentLabel(segment)],
                            chipType: 'search_or',
                            searchIndex: index
                        });
                    });
                } else {
                    groups.push({
                        key: '_search',
                        label: 'Busca',
                        values: [utils.formatSearchSegmentLabel(segments[0] || filterState.searchQuery)],
                        chipType: 'search'
                    });
                }
            }
            if (filterState.quickFilter !== 'all') {
                groups.push({
                    key: '_quick',
                    label: 'Tipo',
                    values: [QUICK_FILTER_LABELS[filterState.quickFilter] || filterState.quickFilter],
                    chipType: 'quick'
                });
            }
            if (filterState.showOnlyVisited) {
                groups.push({ key: '_visited', label: 'Visitadas', values: ['Só visualizadas'], chipType: 'visited' });
            }

            if (utils.hasDateRange(filterState.publishedDateRange)) {
                groups.push({
                    key: '_date_published',
                    label: 'Publicação',
                    values: [utils.formatDateRangeLabel(filterState.publishedDateRange)],
                    chipType: 'date_published'
                });
            }
            if (utils.hasDateRange(filterState.insertedDateRange)) {
                groups.push({
                    key: '_date_inserted',
                    label: 'Obtida',
                    values: [utils.formatDateRangeLabel(filterState.insertedDateRange)],
                    chipType: 'date_inserted'
                });
            }

            // Group filters by category
            Object.entries(filterState.selectedFilters || {}).forEach(([key, values]) => {
                if (values && values.length > 0) {
                    const category = CONFIG.FILTER_CATEGORIES.find(c => c.key === key);
                    const label = category ? category.label : key;
                    groups.push({ key, label, values, chipType: 'category' });
                }
            });

            if (includeSort && filterState.sortBy && filterState.sortBy !== preferencesManager.DEFAULT_SORT) {
                groups.push({
                    key: '_sort',
                    label: 'Ordenação',
                    values: [SORT_LABELS[filterState.sortBy] || filterState.sortBy],
                    chipType: 'sort'
                });
            }

            return groups;
        },

        renderActiveFilters() {
            this.closeGroupedFilterDropdown();
            const groups = this.buildFilterSummaryItems(state);
            this.updateSaveActionVisibility();

            if (groups.length === 0) {
                elements.activeFilters.classList.add('hidden');
                elements.activeFiltersList.innerHTML = '';
                return;
            }

            elements.activeFilters.classList.remove('hidden');
            elements.activeFiltersList.innerHTML = groups.map(({ key, label, values, chipType, searchIndex }) => {
                const count = values.length;
                const displayText = count === 1 ? values[0] : `${label}: ${count}`;
                const tooltipItems = count > 1 ? values.map(v => utils.escapeHtml(v)).join(', ') : '';
                const isGrouped = chipType === 'category' && count > 1;
                const isSearchChip = chipType === 'search' || chipType === 'search_or';
                const chipText = isSearchChip
                    ? utils.escapeHtml(displayText)
                    : (count === 1 ? utils.truncate(displayText, 18) : displayText);

                return `
                    <div class="active-filter-chip ${isGrouped ? 'grouped' : ''}${isSearchChip ? ' active-filter-chip-search' : ''}"
                         data-key="${key}"
                         data-chip-type="${chipType}"
                         ${chipType === 'search_or' ? `data-search-index="${searchIndex}"` : ''}
                         ${chipType === 'category' && count === 1 ? `data-value="${utils.escapeHtml(values[0])}"` : ''}
                         ${isGrouped ? `data-tooltip="${tooltipItems}"` : ''}>
                        <button type="button" class="chip-text${isGrouped ? ' chip-text-grouped' : ''}" ${isGrouped ? 'aria-expanded="false" aria-haspopup="listbox"' : ''}>${chipText}</button>
                        <button type="button" class="chip-close" aria-label="Remover filtro">
                            <span class="material-symbols-rounded">close</span>
                        </button>
                    </div>
                `;
            }).join('');

            elements.activeFiltersList.querySelectorAll('.active-filter-chip').forEach(chip => {
                const key = chip.dataset.key;
                const chipType = chip.dataset.chipType;
                const isGrouped = chip.classList.contains('grouped');

                chip.querySelector('.chip-close').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (chipType === 'search') {
                        state.searchQuery = '';
                        elements.searchInput.value = '';
                        elements.searchClear.classList.add('hidden');
                    } else if (chipType === 'search_or') {
                        const idx = Number.parseInt(chip.dataset.searchIndex, 10);
                        state.searchQuery = utils.removeSearchOrSegment(state.searchQuery, idx);
                        elements.searchInput.value = state.searchQuery;
                        elements.searchClear.classList.toggle('hidden', !state.searchQuery);
                    } else if (chipType === 'quick') {
                        state.quickFilter = 'all';
                        if (typeof quickFilters !== 'undefined') quickFilters.syncUI();
                    } else if (chipType === 'visited') {
                        state.showOnlyVisited = false;
                        const visitedBtn = document.getElementById('visitedToggle');
                        if (visitedBtn) visitedBtn.setAttribute('aria-pressed', 'false');
                    } else if (chipType === 'date_inserted') {
                        state.insertedDateRange = utils.cloneDateRange(utils.EMPTY_DATE_RANGE);
                    } else if (chipType === 'date_published') {
                        state.publishedDateRange = utils.cloneDateRange(utils.EMPTY_DATE_RANGE);
                    } else if (chipType === 'category') {
                        if (isGrouped) {
                            delete state.selectedFilters[key];
                        } else {
                            this.removeFilter(key, chip.dataset.value);
                            return;
                        }
                    }
                    this.apply();
                });

                if (isGrouped) {
                    const openChip = (e) => {
                        if (e.target.closest('.chip-close')) return;
                        e.preventDefault();
                        e.stopPropagation();
                        const values = state.selectedFilters[key] || [];
                        if (this._groupedDropdown.chip === chip) {
                            this.closeGroupedFilterDropdown();
                        } else {
                            this.openGroupedFilterDropdown(chip, key, values);
                        }
                    };
                    chip.querySelector('.chip-text-grouped')?.addEventListener('click', openChip);
                    chip.querySelector('.chip-text-grouped')?.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openChip(e);
                        }
                    });
                }
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
            state.insertedDateRange = utils.cloneDateRange(utils.EMPTY_DATE_RANGE);
            state.publishedDateRange = utils.cloneDateRange(utils.EMPTY_DATE_RANGE);
            state.sortBy = preferencesManager.getDefaultSort();
            state.showOnlyVisited = false;
            elements.searchInput.value = '';
            elements.searchClear.classList.add('hidden');

            // Reset quick filter UI
            if (typeof quickFilters !== 'undefined') quickFilters.syncUI();
            const visitedBtn = document.getElementById('visitedToggle');
            if (visitedBtn) visitedBtn.setAttribute('aria-pressed', 'false');
            sortManager.updateLabel();

            this.apply();
        },

        setQuickFilter(filter) {
            state.quickFilter = filter;
            if (typeof quickFilters !== 'undefined') quickFilters.syncUI();
            this.apply();
        },

        scrollToActiveFilters() {
            const target = elements.activeFilters && !elements.activeFilters.classList.contains('hidden')
                ? elements.activeFilters
                : document.querySelector('.filter-chips-container');
            target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };

    // ============================================
    // SAVED FILTERS
    // ============================================
    const savedFiltersManager = {
        storageKey: 'cv_saved_filters',
        maxItems: 6,
        items: [],
        mode: 'create',
        editingId: null,
        isOpen: false,
        menuOpen: false,
        menuSheetOpen: false,
        _trigger: null,

        init() {
            this.load();
            this.updateButton();

            elements.saveFilterBtn?.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleMenu();
            });

            elements.closeSavedFiltersMenuSheet?.addEventListener('click', () => this.closeMenuSheet());

            document.addEventListener('click', (e) => {
                if (!this.menuOpen) return;
                const inMenu = elements.saveFilterBtn?.contains(e.target) ||
                    elements.savedFiltersDropdown?.contains(e.target);
                if (!inMenu) this.closeMenuDropdown();
            });

            window.addEventListener('scroll', () => {
                if (this.menuOpen) this.closeMenuDropdown();
            }, { passive: true });

            if (elements.savedFiltersMenuSheet) {
                sheetSwipe.bind(elements.savedFiltersMenuSheet, () => this.closeMenuSheet());
            }
            elements.closeSaveFilterSheet?.addEventListener('click', () => this.close());
            elements.cancelSaveFilter?.addEventListener('click', () => this.close());
            elements.confirmSaveFilter?.addEventListener('click', () => this.saveFromSheet());
            elements.removeSavedFilter?.addEventListener('click', () => {
                if (this.editingId) this.remove(this.editingId, { closeSheet: true });
            });

            elements.saveFilterName?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveFromSheet();
                }
            });

            if (elements.saveFilterSheet) {
                sheetSwipe.bind(elements.saveFilterSheet, () => this.close());
            }

            document.addEventListener('keydown', (e) => {
                if (e.key !== 'Escape') return;
                if (this.isOpen) this.close();
                else if (this.menuSheetOpen) this.closeMenuSheet();
                else if (this.menuOpen) this.closeMenuDropdown();
            });
        },

        toggleMenu() {
            if (utils.isMobile()) {
                if (this.menuSheetOpen) this.closeMenuSheet();
                else this.openMenuSheet();
            } else if (this.menuOpen) {
                this.closeMenuDropdown();
            } else {
                this.openMenuDropdown();
            }
        },

        buildMenuParts() {
            const hasShareable = filterManager.hasShareableState(state);
            const canSave = hasShareable && this.items.length < this.maxItems;
            const countLabel = `${this.items.length}/${this.maxItems}`;

            const listHtml = this.items.length === 0
                ? '<p class="saved-filters-menu-empty">Nenhum filtro salvo ainda.</p>'
                : this.items.map(item => `
                    <div class="saved-filters-menu-item" role="menuitem">
                        <button type="button" class="saved-filters-menu-item-main" data-saved-filter-id="${utils.escapeHtml(item.id)}" title="Aplicar: ${utils.escapeHtml(item.label)}">
                            <span class="material-symbols-rounded" aria-hidden="true">favorite</span>
                            <span class="saved-filters-menu-item-label">${utils.escapeHtml(item.label)}</span>
                        </button>
                        <div class="saved-filters-menu-item-actions">
                            <button type="button" class="icon-btn" data-action="edit" data-saved-filter-id="${utils.escapeHtml(item.id)}" aria-label="Editar ${utils.escapeHtml(item.label)}" title="Editar">
                                <span class="material-symbols-rounded" aria-hidden="true">edit</span>
                            </button>
                            <button type="button" class="icon-btn" data-action="remove" data-saved-filter-id="${utils.escapeHtml(item.id)}" aria-label="Remover ${utils.escapeHtml(item.label)}" title="Remover">
                                <span class="material-symbols-rounded" aria-hidden="true">delete</span>
                            </button>
                        </div>
                    </div>
                `).join('');

            const footerHtml = `
                <button type="button" class="saved-filters-menu-action primary" data-action="save-current"${canSave ? '' : ' disabled'}>
                    <span class="material-symbols-rounded" aria-hidden="true">add</span>
                    Salvar filtro atual
                </button>
                ${this.items.length > 0 ? `
                <button type="button" class="saved-filters-menu-action danger" data-action="clear-all">
                    Limpar todos os salvos
                </button>` : ''}
            `;

            return { countLabel, listHtml, footerHtml };
        },

        bindMenuEvents(container) {
            container.querySelectorAll('[data-saved-filter-id].saved-filters-menu-item-main, [data-saved-filter-id][data-action="apply"]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const id = btn.dataset.savedFilterId;
                    this.closeMenu();
                    this.apply(id);
                });
            });

            container.querySelectorAll('[data-action="edit"]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeMenu();
                    this.openEdit(btn.dataset.savedFilterId);
                });
            });

            container.querySelectorAll('[data-action="remove"]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.remove(btn.dataset.savedFilterId);
                });
            });

            container.querySelector('[data-action="save-current"]')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMenu();
                this.openCreate();
            });

            container.querySelector('[data-action="clear-all"]')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearAllSaved();
            });
        },

        refreshMenuContent() {
            const { countLabel, listHtml, footerHtml } = this.buildMenuParts();
            if (elements.savedFiltersMenuSheetCount) {
                elements.savedFiltersMenuSheetCount.textContent = countLabel;
            }
            if (elements.savedFiltersMenuSheetList) {
                elements.savedFiltersMenuSheetList.innerHTML = listHtml;
            }
            if (elements.savedFiltersMenuSheetActions) {
                elements.savedFiltersMenuSheetActions.innerHTML = footerHtml;
            }
            if (this.menuSheetOpen && elements.savedFiltersMenuSheet) {
                this.bindMenuEvents(elements.savedFiltersMenuSheet);
            }
            if (this.menuOpen && elements.savedFiltersDropdown) {
                const listEl = elements.savedFiltersDropdown.querySelector('.saved-filters-menu-list');
                const footerEl = elements.savedFiltersDropdown.querySelector('.saved-filters-menu-footer');
                const countEl = elements.savedFiltersDropdown.querySelector('.saved-filters-menu-header strong');
                if (listEl) listEl.innerHTML = listHtml;
                if (footerEl) footerEl.innerHTML = footerHtml;
                if (countEl) countEl.textContent = countLabel;
                this.bindMenuEvents(elements.savedFiltersDropdown);
            }
        },

        openMenuDropdown() {
            if (!elements.savedFiltersDropdown || !elements.saveFilterBtn) return;
            if (sortManager.isOpen) sortManager.closeDropdown();

            const { countLabel, listHtml, footerHtml } = this.buildMenuParts();
            elements.savedFiltersDropdown.innerHTML = `
                <div class="saved-filters-menu-header">
                    <span>Filtros salvos</span>
                    <strong>${countLabel}</strong>
                </div>
                <div class="saved-filters-menu-list" role="none">${listHtml}</div>
                <div class="saved-filters-menu-footer">${footerHtml}</div>
            `;

            document.body.appendChild(elements.savedFiltersDropdown);
            const rect = elements.saveFilterBtn.getBoundingClientRect();
            elements.savedFiltersDropdown.style.position = 'fixed';
            elements.savedFiltersDropdown.style.top = `${rect.bottom + 8}px`;
            if (rect.left + 280 > window.innerWidth) {
                elements.savedFiltersDropdown.style.left = 'auto';
                elements.savedFiltersDropdown.style.right = '16px';
            } else {
                elements.savedFiltersDropdown.style.left = `${Math.max(8, rect.left)}px`;
                elements.savedFiltersDropdown.style.right = 'auto';
            }

            elements.savedFiltersDropdown.classList.remove('hidden');
            elements.saveFilterBtn.setAttribute('aria-expanded', 'true');
            this.bindMenuEvents(elements.savedFiltersDropdown);
            this.menuOpen = true;
        },

        closeMenuDropdown() {
            if (!elements.savedFiltersDropdown) return;
            elements.savedFiltersDropdown.classList.add('hidden');
            elements.saveFilterBtn?.setAttribute('aria-expanded', 'false');
            this.menuOpen = false;
        },

        openMenuSheet() {
            if (!elements.savedFiltersMenuSheet) return;
            if (sortManager.sortSheetOpen) sortManager.closeSortSheet();

            this.refreshMenuContent();
            elements.scrim?.classList.remove('hidden');
            elements.savedFiltersMenuSheet.classList.remove('hidden');
            elements.savedFiltersMenuSheet.setAttribute('role', 'dialog');
            elements.savedFiltersMenuSheet.setAttribute('aria-modal', 'true');
            document.body.style.overflow = 'hidden';

            requestAnimationFrame(() => {
                elements.scrim?.classList.add('visible');
                elements.savedFiltersMenuSheet.classList.add('visible');
                elements.closeSavedFiltersMenuSheet?.focus();
            });

            this.bindMenuEvents(elements.savedFiltersMenuSheet);
            elements.saveFilterBtn?.setAttribute('aria-expanded', 'true');
            this.menuSheetOpen = true;
        },

        closeMenuSheet() {
            if (!elements.savedFiltersMenuSheet) return;
            elements.scrim?.classList.remove('visible');
            elements.savedFiltersMenuSheet.classList.remove('visible');

            setTimeout(() => {
                elements.savedFiltersMenuSheet.classList.add('hidden');
                const filterOpen = elements.filterSheet && !elements.filterSheet.classList.contains('hidden');
                const sortOpen = sortManager.sortSheetOpen;
                const saveOpen = this.isOpen;
                if (!filterOpen && !sortOpen && !saveOpen) {
                    elements.scrim?.classList.add('hidden');
                    document.body.style.overflow = '';
                }
                elements.saveFilterBtn?.focus();
            }, 400);

            elements.saveFilterBtn?.setAttribute('aria-expanded', 'false');
            this.menuSheetOpen = false;
        },

        closeMenu() {
            this.closeMenuDropdown();
            this.closeMenuSheet();
        },

        updateButton() {
            this.load();
            const hasShareable = filterManager.hasShareableState(state);
            const show = hasShareable || this.items.length > 0;
            elements.saveFilterBtn?.classList.toggle('hidden', !show);
            if (elements.savedFilterCountBadge) {
                elements.savedFilterCountBadge.textContent = String(this.items.length);
                elements.savedFilterCountBadge.classList.toggle('hidden', this.items.length === 0);
            }
            if (this.menuOpen || this.menuSheetOpen) this.refreshMenuContent();
        },

        clearAllSaved() {
            if (this.items.length === 0) return;
            this.items = [];
            this.persist();
            this.updateButton();
            this.closeMenu();
            utils.showToast('Filtros salvos removidos', 'theme-toast');
        },

        load() {
            try {
                const parsed = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
                this.items = Array.isArray(parsed)
                    ? parsed.filter(item => item && item.id && item.label && item.state).slice(0, this.maxItems)
                    : [];
            } catch (err) {
                this.items = [];
            }
        },

        persist() {
            localStorage.setItem(this.storageKey, JSON.stringify(this.items.slice(0, this.maxItems)));
        },

        captureState() {
            return {
                searchQuery: state.searchQuery || '',
                quickFilter: state.quickFilter || 'all',
                insertedDateRange: utils.cloneDateRange(state.insertedDateRange),
                publishedDateRange: utils.cloneDateRange(state.publishedDateRange),
                selectedFilters: JSON.parse(JSON.stringify(state.selectedFilters || {})),
                showOnlyVisited: Boolean(state.showOnlyVisited),
                sortBy: state.sortBy || preferencesManager.DEFAULT_SORT
            };
        },

        sanitizeState(savedState = {}) {
            return {
                searchQuery: savedState.searchQuery || '',
                quickFilter: savedState.quickFilter || 'all',
                insertedDateRange: utils.normalizeDateRange(
                    savedState.insertedDateRange ||
                    (savedState.datePeriod && savedState.datePeriod !== 'all'
                        ? utils.periodKeyToRange(savedState.datePeriod)
                        : utils.EMPTY_DATE_RANGE)
                ),
                publishedDateRange: utils.normalizeDateRange(
                    savedState.publishedDateRange ||
                    (savedState.publishedDatePeriod && savedState.publishedDatePeriod !== 'all'
                        ? utils.periodKeyToRange(savedState.publishedDatePeriod)
                        : utils.EMPTY_DATE_RANGE)
                ),
                selectedFilters: JSON.parse(JSON.stringify(savedState.selectedFilters || {})),
                showOnlyVisited: Boolean(savedState.showOnlyVisited),
                sortBy: savedState.sortBy || preferencesManager.DEFAULT_SORT
            };
        },

        buildSummaryHtml(filterState) {
            const groups = filterManager.buildFilterSummaryItems(this.sanitizeState(filterState), { includeSort: true });
            if (groups.length === 0) {
                return '<p class="save-filter-empty">Nenhum filtro ativo.</p>';
            }

            return `
                <ul class="save-filter-summary-list">
                    ${groups.map(group => `
                        <li>
                            <span class="save-filter-summary-label">${utils.escapeHtml(group.label)}</span>
                            <span class="save-filter-summary-value">${utils.escapeHtml(group.values.join(', '))}</span>
                        </li>
                    `).join('')}
                </ul>
            `;
        },

        suggestLabel(filterState) {
            const groups = filterManager.buildFilterSummaryItems(this.sanitizeState(filterState));
            if (groups.length === 0) return 'Filtro personalizado';

            const parts = groups.slice(0, 3).map(group => {
                if (group.chipType === 'search') return `"${group.values[0]}"`;
                if (group.values.length === 1) return group.values[0];
                return `${group.label}: ${group.values.length}`;
            });

            const extra = groups.length > 3 ? ` +${groups.length - 3}` : '';
            return utils.truncate(`${parts.join(' · ')}${extra}`, 40);
        },

        openCreate() {
            if (!filterManager.hasShareableState(state)) {
                utils.showToast('Aplique um filtro para salvar', 'theme-toast');
                return;
            }

            this.closeMenu();
            if (sortManager.sortSheetOpen) sortManager.closeSortSheet();
            this.mode = 'create';
            this.editingId = null;
            this._trigger = document.activeElement;
            const snapshot = this.captureState();
            this.populateSheet({
                title: 'Salvar filtro',
                subtitle: 'Resumo do filtro atual',
                stateSnapshot: snapshot,
                label: this.suggestLabel(snapshot),
                submitLabel: 'Salvar',
                canSubmit: this.items.length < this.maxItems,
                showRemove: false
            });
            if (this.items.length >= this.maxItems) {
                utils.showToast('Máximo de 6 filtros salvos', 'theme-toast');
            }
            this.openSheet();
        },

        openEdit(id) {
            const item = this.items.find(saved => saved.id === id);
            if (!item) return;

            this.closeMenu();
            if (sortManager.sortSheetOpen) sortManager.closeSortSheet();
            this.mode = 'edit';
            this.editingId = id;
            this._trigger = document.activeElement;
            this.populateSheet({
                title: 'Editar filtro salvo',
                subtitle: 'Resumo do filtro salvo',
                stateSnapshot: item.state,
                label: item.label,
                submitLabel: 'Salvar alterações',
                canSubmit: true,
                showRemove: true
            });
            this.openSheet();
        },

        populateSheet({ title, subtitle, stateSnapshot, label, submitLabel, canSubmit, showRemove }) {
            const titleEl = document.getElementById('saveFilterSheetTitle');
            const subtitleEl = document.getElementById('saveFilterSheetSubtitle');
            if (titleEl) titleEl.textContent = title;
            if (subtitleEl) subtitleEl.textContent = subtitle;
            if (elements.saveFilterSummary) elements.saveFilterSummary.innerHTML = this.buildSummaryHtml(stateSnapshot);
            if (elements.saveFilterName) {
                elements.saveFilterName.value = label || '';
                elements.saveFilterName.disabled = !canSubmit && this.mode === 'create';
            }
            if (elements.confirmSaveFilter) elements.confirmSaveFilter.disabled = !canSubmit;
            if (elements.confirmSaveFilterLabel) elements.confirmSaveFilterLabel.textContent = submitLabel;
            elements.saveFilterLimit?.classList.toggle('hidden', canSubmit || this.mode !== 'create');
            elements.removeSavedFilter?.classList.toggle('hidden', !showRemove);
        },

        openSheet() {
            if (!elements.saveFilterSheet) return;
            elements.saveFilterSheet.setAttribute('role', 'dialog');
            elements.saveFilterSheet.setAttribute('aria-modal', 'true');
            elements.scrim.classList.remove('hidden');
            elements.saveFilterSheet.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            this.isOpen = true;

            requestAnimationFrame(() => {
                elements.scrim.classList.add('visible');
                elements.saveFilterSheet.classList.add('visible');
                elements.saveFilterName?.focus();
                elements.saveFilterName?.select();
            });
        },

        close() {
            if (!this.isOpen || !elements.saveFilterSheet) return;
            elements.scrim.classList.remove('visible');
            elements.saveFilterSheet.classList.remove('visible');
            this.isOpen = false;

            setTimeout(() => {
                elements.saveFilterSheet.classList.add('hidden');
                const filterOpen = elements.filterSheet && !elements.filterSheet.classList.contains('hidden');
                if (!sortManager.sortSheetOpen && !filterOpen && !this.menuSheetOpen) {
                    elements.scrim.classList.add('hidden');
                    document.body.style.overflow = '';
                }
                const trigger = this._trigger;
                this._trigger = null;
                if (trigger && typeof trigger.focus === 'function') trigger.focus();
            }, 400);
        },

        saveFromSheet() {
            const label = (elements.saveFilterName?.value || '').trim();
            if (!label) {
                utils.showToast('Informe um nome para salvar', 'theme-toast');
                elements.saveFilterName?.focus();
                return;
            }

            if (this.mode === 'edit') {
                const item = this.items.find(saved => saved.id === this.editingId);
                if (!item) return;
                item.label = utils.truncate(label, 40);
                this.persist();
                this.updateButton();
                this.close();
                utils.showToast('Filtro atualizado', 'theme-toast');
                return;
            }

            if (this.items.length >= this.maxItems) {
                utils.showToast('Máximo de 6 filtros salvos', 'theme-toast');
                return;
            }

            const item = {
                id: `sf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
                label: utils.truncate(label, 40),
                savedAt: new Date().toISOString().split('T')[0],
                state: this.captureState()
            };

            this.items.push(item);
            this.persist();
            this.updateButton();
            this.close();
            utils.showToast('Filtro salvo', 'theme-toast');
        },

        apply(id) {
            const item = this.items.find(saved => saved.id === id);
            if (!item) return;
            const savedState = this.sanitizeState(item.state);

            state.searchQuery = savedState.searchQuery;
            state.quickFilter = savedState.quickFilter;
            state.insertedDateRange = savedState.insertedDateRange;
            state.publishedDateRange = savedState.publishedDateRange;
            state.selectedFilters = savedState.selectedFilters;
            state.showOnlyVisited = savedState.showOnlyVisited;
            state.sortBy = savedState.sortBy;

            if (elements.searchInput) elements.searchInput.value = state.searchQuery;
            elements.searchClear?.classList.toggle('hidden', !state.searchQuery);
            document.getElementById('visitedToggle')?.setAttribute('aria-pressed', state.showOnlyVisited ? 'true' : 'false');
            if (typeof quickFilters !== 'undefined') quickFilters.syncUI();
            sortManager.updateLabel();
            filterManager.apply();
            utils.showToast(`Filtro aplicado: ${item.label}`, 'theme-toast');
            filterManager.scrollToActiveFilters();
        },

        remove(id, { closeSheet = false } = {}) {
            const item = this.items.find(saved => saved.id === id);
            this.items = this.items.filter(saved => saved.id !== id);
            this.persist();
            this.updateButton();
            if (this.menuOpen || this.menuSheetOpen) this.refreshMenuContent();
            if (closeSheet) this.close();
            if (item) utils.showToast('Filtro removido', 'theme-toast');
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

            let allLoaded = document.getElementById('allLoaded');
            if (!allLoaded && elements.jobsGrid?.parentNode) {
                allLoaded = document.createElement('p');
                allLoaded.id = 'allLoaded';
                allLoaded.className = 'all-loaded-msg hidden';
                allLoaded.setAttribute('aria-live', 'polite');
                const loadingMore = document.getElementById('loadingMore');
                if (loadingMore) {
                    loadingMore.parentNode.insertBefore(allLoaded, loadingMore);
                }
            }
            if (allLoaded) {
                const complete = state.displayedCount >= state.filteredJobs.length && state.filteredJobs.length > 0;
                allLoaded.classList.toggle('hidden', !complete);
                if (complete) {
                    allLoaded.textContent = `Todas as ${state.filteredJobs.length.toLocaleString('pt-BR')} vagas carregadas`;
                }
            }
        },

        createCard(job, index = 0) {
            const isRemote = job['remote?'] === '01 - Sim';
            const isAffirmative = job['affirmative?'] === '01 - Sim';
            const isNew = utils.isToday(job.inserted_date) || utils.isNewSinceLastVisit(job.inserted_date);
            const jobKey = utils.getJobKey(job);
            const isVisited = state.visitedJobs.has(jobKey);
            const fullInsertedDate = utils.formatDate(job.inserted_date);
            const jobDatesCard = utils.renderJobDatesHtml(job, 'card');
            const jobDatesList = utils.renderJobDatesHtml(job, 'list');
            const jobDatesCompact = utils.renderJobDatesHtml(job, 'compact');
            const smartLocation = utils.getSmartLocation(job);
            const contractInfo = utils.getContractInfo(job);
            const title = utils.formatJobTitle(job.title);

            const jobUrl = job.url || '#';
            const stretchLink = `<a href="${utils.escapeHtml(jobUrl)}" class="job-card-stretch-link" target="_blank" rel="noopener noreferrer" aria-label="Abrir vaga: ${utils.escapeHtml(title)}"></a>`;
            const newTitle = isNew
                ? ` title="Adicionada ao classificavagas${fullInsertedDate ? ' em ' + fullInsertedDate : ''}"`
                : '';

            const card = document.createElement('article');
            card.className = `job-card${isVisited ? ' visited' : ''}`;
            card.dataset.url = jobUrl;

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
                ? `<button type="button" class="job-tag job-tag-affirmative job-tag-clickable" data-quick-filter="affirmative"><span class="material-symbols-rounded" style="font-size:13px;line-height:1">diversity_3</span>Afirmativa</button>`
                : '';

            const contractQuick = contractInfo
                ? (contractInfo.cls === 'remote' ? 'remote' : contractInfo.cls === 'hybrid' ? 'hybrid' : contractInfo.cls === 'onsite' ? 'onsite' : null)
                : null;
            const contractTag = contractInfo
                ? (contractQuick
                    ? `<button type="button" class="job-tag job-tag-${contractInfo.cls} job-tag-clickable" data-quick-filter="${contractQuick}">${contractInfo.icon ? `<span class="material-symbols-rounded" style="font-size:12px;line-height:1;margin-right:3px">${contractInfo.icon}</span>` : ''}${utils.escapeHtml(contractInfo.label)}</button>`
                    : `<span class="job-tag job-tag-${contractInfo.cls}">${contractInfo.icon ? `<span class="material-symbols-rounded" style="font-size:12px;line-height:1;margin-right:3px">${contractInfo.icon}</span>` : ''}${utils.escapeHtml(contractInfo.label)}</span>`)
                : '';

            const newBadge = isNew
                ? `<span class="job-badge job-badge-new"${newTitle}>Novo</span>`
                : '';

            if (state.viewMode === 'compact') {
                card.innerHTML = `
                    ${stretchLink}
                    <div class="job-compact-content">
                        ${isNew ? '<span class="job-compact-dot"></span>' : ''}
                        <a class="job-compact-title job-card-title-link" href="${utils.escapeHtml(jobUrl)}" target="_blank" rel="noopener noreferrer">${utils.escapeHtml(utils.truncate(title, 45))}</a>
                        <span class="job-compact-separator">·</span>
                        <span class="job-compact-company">${utils.escapeHtml(utils.truncate(job.company, 20))}</span>
                        ${jobDatesCompact}
                    </div>
                `;
            } else if (state.viewMode === 'list') {
                card.innerHTML = `
                    ${stretchLink}
                    <div class="job-list-content">
                        <div class="job-list-index">
                            ${isNew ? '<span class="list-new-dot"></span>' : ''}
                        </div>
                        <div class="job-list-main">
                            <h3><a class="job-card-title-link" href="${utils.escapeHtml(jobUrl)}" target="_blank" rel="noopener noreferrer">${utils.escapeHtml(title)}</a></h3>
                            <div class="job-list-company-row">
                                <span class="job-list-company">${utils.escapeHtml(job.company)}</span>
                                ${isValidCompanyType ? `<span class="job-list-type">${utils.escapeHtml(job.company_type)}</span>` : ''}
                                ${contractInfo ? (contractQuick
                                    ? `<button type="button" class="job-tag job-tag-${contractInfo.cls} job-tag-compact job-tag-clickable" data-quick-filter="${contractQuick}">${contractInfo.icon ? `<span class="material-symbols-rounded" style="font-size:11px;line-height:1;margin-right:2px">${contractInfo.icon}</span>` : ''}${utils.escapeHtml(contractInfo.label)}</button>`
                                    : `<span class="job-tag job-tag-${contractInfo.cls} job-tag-compact">${contractInfo.icon ? `<span class="material-symbols-rounded" style="font-size:11px;line-height:1;margin-right:2px">${contractInfo.icon}</span>` : ''}${utils.escapeHtml(contractInfo.label)}</span>`) : ''}
                                ${isAffirmative ? `<button type="button" class="job-tag job-tag-affirmative job-tag-compact job-tag-clickable" data-quick-filter="affirmative"><span class="material-symbols-rounded" style="font-size:12px;line-height:1">diversity_3</span>Afirm.</button>` : ''}
                            </div>
                        </div>
                        <div class="job-list-meta">
                            ${smartLocation ? `<span class="job-list-location"><span class="material-symbols-rounded">location_on</span>${utils.escapeHtml(utils.truncate(smartLocation, 18))}</span>` : ''}
                            ${jobDatesList}
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
                    ${stretchLink}
                    <div class="job-card-header">
                        <div class="job-card-icon ${isRemote ? 'remote' : 'onsite'}">
                            <span class="material-symbols-rounded">${isRemote ? 'home_work' : 'apartment'}</span>
                        </div>
                        <div class="job-card-title">
                            <h3><a class="job-card-title-link" href="${utils.escapeHtml(jobUrl)}" target="_blank" rel="noopener noreferrer">${utils.escapeHtml(title)}</a></h3>
                            <p>${utils.escapeHtml(job.company)}</p>
                        </div>
                        ${newBadge}
                    </div>
                    <div class="job-card-body">
                        ${contractTag}
                        ${affirmativeTag}
                        ${isValidLevel ? `<button type="button" class="job-tag job-tag-clickable" data-filter-key="level" data-filter-value="${utils.escapeHtml(job.level)}">${utils.escapeHtml(utils.truncate(levelName, 16))}</button>` : ''}
                        ${isValidCategory ? `<button type="button" class="job-tag job-tag-clickable" data-filter-key="category" data-filter-value="${utils.escapeHtml(job.category)}">${utils.escapeHtml(utils.truncate(categoryName, 16))}</button>` : ''}
                        ${isValidCompanyType ? `<button type="button" class="job-tag job-tag-clickable" data-filter-key="company_type" data-filter-value="${utils.escapeHtml(job.company_type)}">${utils.escapeHtml(utils.truncate(job.company_type, 18))}</button>` : ''}
                    </div>
                    <div class="job-card-footer">
                        <div class="job-location">
                            <span class="material-symbols-rounded">location_on</span>
                            <span>${smartLocation ? utils.escapeHtml(smartLocation) : '<span class="job-location-empty">—</span>'}</span>
                        </div>
                        ${jobDatesCard}
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

            const markOpened = () => {
                if (!state.visitedJobs.has(jobKey)) {
                    utils.markVisited(job);
                    card.classList.add('visited');
                    if (typeof visitedFilter !== 'undefined') visitedFilter.updateCount();
                }
                localStorage.setItem('cv_last_clicked', jobKey);
                if (typeof fabMenuManager !== 'undefined') fabMenuManager.updateLastJobVisibility();
            };

            card.querySelectorAll('.job-card-stretch-link, .job-card-title-link').forEach((link) => {
                link.addEventListener('click', () => markOpened());
            });

            card.querySelectorAll('.job-tag-clickable').forEach((tag) => {
                tag.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    let feedback = 'Filtro aplicado';
                    if (tag.dataset.quickFilter) {
                        filterManager.setQuickFilter(tag.dataset.quickFilter);
                        feedback = `Filtro aplicado: ${QUICK_FILTER_LABELS[tag.dataset.quickFilter] || tag.dataset.quickFilter}`;
                    } else if (tag.dataset.filterKey && tag.dataset.filterValue) {
                        const k = tag.dataset.filterKey;
                        const v = tag.dataset.filterValue;
                        if (!state.selectedFilters[k]) state.selectedFilters[k] = [];
                        if (!state.selectedFilters[k].includes(v)) state.selectedFilters[k].push(v);
                        filterManager.apply();
                        const cat = CONFIG.FILTER_CATEGORIES.find(c => c.key === k);
                        feedback = `Filtro aplicado: ${cat ? cat.label : k}`;
                    }
                    utils.showToast(feedback, 'theme-toast filter-toast');
                    filterManager.scrollToActiveFilters();
                });
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
            elements.scrim.addEventListener('click', () => {
                if (typeof savedFiltersManager !== 'undefined') {
                    if (savedFiltersManager.menuSheetOpen) {
                        savedFiltersManager.closeMenuSheet();
                        return;
                    }
                    if (savedFiltersManager.isOpen) {
                        savedFiltersManager.close();
                        return;
                    }
                }
                if (sortManager.sortSheetOpen) {
                    sortManager.closeSortSheet();
                    return;
                }
                this.close();
            });
            if (utils.isMobile()) {
                sheetSwipe.bind(elements.filterSheet, () => this.close());
            }
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
            if (typeof savedFiltersManager !== 'undefined' && savedFiltersManager.menuSheetOpen) {
                savedFiltersManager.closeMenuSheet();
            }
            if (sortManager.sortSheetOpen) sortManager.closeSortSheet();

            // Clone current filters to temp
            state.tempFilters = JSON.parse(JSON.stringify(state.selectedFilters));
            state.tempInsertedDateRange = utils.cloneDateRange(state.insertedDateRange);
            state.tempPublishedDateRange = utils.cloneDateRange(state.publishedDateRange);
            state.tempQuickFilter = state.quickFilter;
            this._openFiltersTrigger = document.activeElement;

            // Build filter sections
            this.buildSections();
            this.updateCount();

            // Initial count calculation for the modal state
            filterManager.recalculateFilterCounts(
                state.allJobs,
                state.tempFilters,
                state.tempInsertedDateRange,
                state.tempPublishedDateRange,
                state.tempQuickFilter,
                state.searchQuery
            );
            this.updateOptionCounts();

            elements.filterSheet.setAttribute('role', 'dialog');
            elements.filterSheet.setAttribute('aria-modal', 'true');
            elements.filterSheet.setAttribute('aria-labelledby', 'filterSheetTitle');

            // Show
            elements.scrim.classList.remove('hidden');
            elements.filterSheet.classList.remove('hidden');
            document.body.style.overflow = 'hidden';

            requestAnimationFrame(() => {
                elements.scrim.classList.add('visible');
                elements.filterSheet.classList.add('visible');
                elements.closeSheet?.focus();
            });
        },

        close() {
            elements.scrim.classList.remove('visible');
            elements.filterSheet.classList.remove('visible');

            setTimeout(() => {
                elements.filterSheet.classList.add('hidden');
                const menuOpen = typeof savedFiltersManager !== 'undefined' && savedFiltersManager.menuSheetOpen;
                if (!sortManager.sortSheetOpen && !menuOpen) {
                    elements.scrim.classList.add('hidden');
                    document.body.style.overflow = '';
                }
                const trigger = this._openFiltersTrigger;
                if (trigger && typeof trigger.focus === 'function') trigger.focus();
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
                { key: 'today', label: 'Adicionadas hoje' }
            ];
            const quickSection = `
                <div class="filter-section" data-key="_quick">
                    <div class="filter-section-header">
                        <div class="filter-section-header-left">
                            <span class="material-symbols-rounded">tune</span>
                            <span class="filter-section-title">Tipo</span>
                            ${state.tempQuickFilter !== 'all' ? `<span class="filter-section-count">1</span>` : ''}
                        </div>
                        <span class="material-symbols-rounded filter-section-icon">expand_more</span>
                    </div>
                    <div class="filter-section-body">
                        <div class="filter-options-list" id="sheetQuickFilters">
                            ${quickOpts.map(o => `
                                <button class="filter-option-chip ${state.tempQuickFilter === o.key ? 'selected' : ''}" data-quick="${o.key}">
                                    <span class="material-symbols-rounded check-icon">check</span>
                                    <span>${o.label}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            const buildDateRangeSection = (key, title, icon, tempRange, rangeKind) => {
                const active = utils.hasDateRange(tempRange);
                return `
                <div class="filter-section" data-key="${key}">
                    <div class="filter-section-header">
                        <div class="filter-section-header-left">
                            <span class="material-symbols-rounded">${icon}</span>
                            <span class="filter-section-title">${title}</span>
                            ${active ? '<span class="filter-section-count">1</span>' : ''}
                        </div>
                        <span class="material-symbols-rounded filter-section-icon">expand_more</span>
                    </div>
                    <div class="filter-section-body">
                        <div class="date-range-filter" data-date-range="${rangeKind}">
                            <div class="date-range-row">
                                <label class="date-range-label">
                                    <span>De</span>
                                    <input type="date" class="date-range-input" data-range-part="from" value="${tempRange.from || ''}">
                                </label>
                                <label class="date-range-label">
                                    <span>Até</span>
                                    <input type="date" class="date-range-input" data-range-part="to" value="${tempRange.to || ''}">
                                </label>
                            </div>
                            <button type="button" class="date-range-clear-btn"${active ? '' : ' disabled'}>Limpar período</button>
                        </div>
                    </div>
                </div>
            `;
            };

            const publishedDateSection = buildDateRangeSection(
                '_date_published',
                'Data de publicação',
                'event',
                state.tempPublishedDateRange,
                'published'
            );
            const insertedDateSection = buildDateRangeSection(
                '_date_inserted',
                'Obtida no Classifica Vagas',
                'calendar_today',
                state.tempInsertedDateRange,
                'inserted'
            );

            // Order: Tipo | Ramo Nível Categoria | Data | Empresa Abrangência Plataforma Localização País Estado Cidade
            // FILTER_CATEGORIES is already ordered; split at index 3 (Empresa) to insert date section
            const cats = CONFIG.FILTER_CATEGORIES;
            const beforeDate = cats.slice(0, 3); // Ramo Nível Categoria
            const afterDate  = cats.slice(3);    // Empresa Abrangência Plataforma Localização País Estado Cidade

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
                            <input type="text" class="filter-search-input" placeholder="Filtrar ${label.toLowerCase()}…" data-key="${key}" aria-label="Filtrar opções de ${label}">
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
                publishedDateSection +
                insertedDateSection +
                buildCats(afterDate);

            // Add event listeners
            this.addSectionListeners();
            this.expandActiveSections();
        },

        expandActiveSections() {
            elements.filterSheetContent.querySelectorAll('.filter-section').forEach(section => {
                const key = section.dataset.key;
                let expand = false;
                if (key === '_quick' && state.tempQuickFilter !== 'all') expand = true;
                if (key === '_date_inserted' && utils.hasDateRange(state.tempInsertedDateRange)) expand = true;
                if (key === '_date_published' && utils.hasDateRange(state.tempPublishedDateRange)) expand = true;
                if (key && key !== '_quick' && key !== '_date_inserted' && key !== '_date_published' && (state.tempFilters[key] || []).length > 0) {
                    expand = true;
                }
                if (expand) section.classList.add('expanded');
            });
        },

        renderOptions(key, options) {
            const selected = state.tempFilters[key] || [];
            // Use dynamic counts if available, otherwise fall back to static
            const counts = (state.dynamicFilterCounts && state.dynamicFilterCounts[key]) || state.filterCounts[key] || {};

            return options.map(opt => {
                const count = counts[opt] || 0;
                if (state.hideZeroFilterOptions && count === 0 && !selected.includes(opt)) {
                    return '';
                }
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
                    state.tempQuickFilter = q;
                    elements.filterSheetContent.querySelectorAll('#sheetQuickFilters [data-quick]').forEach(c => {
                        c.classList.toggle('selected', c.dataset.quick === q);
                    });
                    const section = chip.closest('.filter-section');
                    const badge = section?.querySelector('.filter-section-count');
                    if (q !== 'all') {
                        if (badge) badge.textContent = '1';
                        else section?.querySelector('.filter-section-header-left')
                            ?.insertAdjacentHTML('beforeend', '<span class="filter-section-count">1</span>');
                    } else if (badge) {
                        badge.remove();
                    }
                    this.updateCount();
                    this.updateOptionCounts();
                });
            });

            const updateDateRangeBadge = (section, active) => {
                const badge = section?.querySelector('.filter-section-count');
                if (active) {
                    if (badge) badge.textContent = '1';
                    else section?.querySelector('.filter-section-header-left')
                        ?.insertAdjacentHTML('beforeend', '<span class="filter-section-count">1</span>');
                } else if (badge) {
                    badge.remove();
                }
            };

            elements.filterSheetContent.querySelectorAll('.date-range-filter').forEach(block => {
                const kind = block.dataset.dateRange;
                const stateKey = kind === 'inserted' ? 'tempInsertedDateRange' : 'tempPublishedDateRange';
                const clearBtn = block.querySelector('.date-range-clear-btn');

                const syncFromInputs = () => {
                    const from = block.querySelector('[data-range-part="from"]')?.value || '';
                    const to = block.querySelector('[data-range-part="to"]')?.value || '';
                    state[stateKey] = utils.normalizeDateRange({ from, to });
                    block.querySelector('[data-range-part="from"]').value = state[stateKey].from;
                    block.querySelector('[data-range-part="to"]').value = state[stateKey].to;
                    const active = utils.hasDateRange(state[stateKey]);
                    if (clearBtn) clearBtn.disabled = !active;
                    updateDateRangeBadge(block.closest('.filter-section'), active);
                    this.updateCount();
                    this.updateOptionCounts();
                };

                block.querySelectorAll('.date-range-input').forEach(input => {
                    input.addEventListener('change', syncFromInputs);
                });

                clearBtn?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    state[stateKey] = utils.cloneDateRange(utils.EMPTY_DATE_RANGE);
                    block.querySelectorAll('.date-range-input').forEach(i => { i.value = ''; });
                    if (clearBtn) clearBtn.disabled = true;
                    updateDateRangeBadge(block.closest('.filter-section'), false);
                    this.updateCount();
                    this.updateOptionCounts();
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
                if (!list.classList.contains('date-options-inserted') &&
                    !list.classList.contains('date-options-published')) {
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
            filterManager.recalculateFilterCounts(
                state.allJobs,
                state.tempFilters,
                state.tempInsertedDateRange,
                state.tempPublishedDateRange,
                state.tempQuickFilter,
                state.searchQuery
            );

            // Update all visible option counts
            elements.filterSheetContent.querySelectorAll('.filter-option-chip').forEach(chip => {
                const key = chip.dataset.key;
                const value = chip.dataset.value;

                // Skip date/sort options which don't have dynamic counts in the same way
                if (!key || key === '_date_inserted' || key === '_date_published' || key === '_sort') return;

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

            if (utils.hasDateRange(state.tempInsertedDateRange)) count++;
            if (utils.hasDateRange(state.tempPublishedDateRange)) count++;
            if (state.tempQuickFilter !== 'all') count++;

            elements.sheetFilterCount.textContent = count > 0
                ? `${count} filtro${count > 1 ? 's' : ''} ativo${count > 1 ? 's' : ''}`
                : 'Refine sua busca abaixo';

            this.updateApplyPreview();
        },

        updateApplyPreview() {
            const n = filterManager.getFilteredCount({
                selectedFilters: state.tempFilters,
                insertedDateRange: state.tempInsertedDateRange,
                publishedDateRange: state.tempPublishedDateRange,
                quickFilter: state.tempQuickFilter
            });
            const label = elements.sheetApplyLabel;
            if (!label) return;
            const formatted = n.toLocaleString('pt-BR');
            label.textContent = n === 1 ? 'Ver 1 vaga' : `Ver ${formatted} vagas`;
            elements.sheetApplyFilters?.setAttribute('aria-label', label.textContent);
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
            state.tempInsertedDateRange = utils.cloneDateRange(utils.EMPTY_DATE_RANGE);
            state.tempPublishedDateRange = utils.cloneDateRange(utils.EMPTY_DATE_RANGE);
            state.tempQuickFilter = 'all';

            elements.filterSheetContent.querySelectorAll('.filter-option-chip.selected').forEach(chip => {
                chip.classList.remove('selected');
            });

            elements.filterSheetContent.querySelectorAll('#sheetQuickFilters [data-quick]').forEach(c => {
                c.classList.toggle('selected', c.dataset.quick === 'all');
            });

            elements.filterSheetContent.querySelectorAll('.date-range-input').forEach(input => {
                input.value = '';
            });
            elements.filterSheetContent.querySelectorAll('.date-range-clear-btn').forEach(btn => {
                btn.disabled = true;
            });

            elements.filterSheetContent.querySelectorAll('.filter-section-count').forEach(badge => {
                badge.remove();
            });

            this.updateCount();
            this.updateOptionCounts();
        },

        applyAndClose() {
            state.selectedFilters = state.tempFilters;
            state.insertedDateRange = utils.normalizeDateRange(state.tempInsertedDateRange);
            state.publishedDateRange = utils.normalizeDateRange(state.tempPublishedDateRange);
            state.quickFilter = state.tempQuickFilter;
            preferencesManager.markVisited();
            if (typeof quickFilters !== 'undefined') quickFilters.syncUI();
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
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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
                document.getElementById('appChrome'),
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

            const setHeaderHeight = () => {
                const chrome = document.getElementById('appChrome');
                const h = chrome ? chrome.offsetHeight : (elements.topAppBar ? elements.topAppBar.offsetHeight : 60);
                document.documentElement.style.setProperty('--header-h', h + 'px');
            };
            setHeaderHeight();
            window.addEventListener('resize', setHeaderHeight, { passive: true });

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        this.onScroll();
                        setHeaderHeight();
                        ticking = false;
                    });
                    ticking = true;
                }
            }, { passive: true });
        },

        onScroll() {
            const scrollY = window.scrollY;
            const windowH = window.innerHeight;
            const docH = document.documentElement.scrollHeight;
            const isMobile = utils.isMobile();

            document.body.classList.toggle('chrome-scrolled', scrollY > 10);
            document.body.classList.toggle('chrome-compact', scrollY > 56);

            if (elements.topAppBar) {
                elements.topAppBar.classList.toggle('elevated', scrollY > 10);
            }

            const fabStack = document.getElementById('fabStack');
            if (fabStack) {
                fabStack.classList.toggle('visible', scrollY > CONFIG.SCROLL_THRESHOLD);
            } else if (elements.scrollTopFab) {
                elements.scrollTopFab.classList.toggle('visible', scrollY > CONFIG.SCROLL_THRESHOLD);
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
        syncUI() {
            document.querySelectorAll('.filter-chip-quick, #sheetQuickFilters [data-quick]').forEach(chip => {
                const q = chip.dataset.quick;
                if (!q) return;
                const selected = q === state.quickFilter;
                chip.classList.toggle('selected', selected);
                if (chip.hasAttribute('aria-pressed')) {
                    chip.setAttribute('aria-pressed', selected ? 'true' : 'false');
                }
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

            elements.emptyStateClear.addEventListener('click', () => {
                filterManager.clearAll();
            });

            document.getElementById('emptyStateRetry')?.addEventListener('click', () => {
                elements.emptyState?.classList.add('hidden');
                const retryBtn = document.getElementById('emptyStateRetry');
                const clearBtn = document.getElementById('emptyStateClear');
                retryBtn?.classList.add('hidden');
                clearBtn?.classList.remove('hidden');
                dataLoader.load();
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
        _trigger: null,

        init() {
            const overlay = document.getElementById('shortcutsOverlay');
            const closeBtn = document.getElementById('closeShortcuts');
            const app = document.getElementById('app');
            if (!overlay) return;

            const close = () => {
                overlay.classList.add('hidden');
                if (app) app.removeAttribute('aria-hidden');
                const trigger = this._trigger;
                this._trigger = null;
                if (trigger && typeof trigger.focus === 'function') trigger.focus();
            };

            const open = () => {
                this._trigger = document.activeElement;
                overlay.classList.remove('hidden');
                if (app) app.setAttribute('aria-hidden', 'true');
                closeBtn?.focus();
            };

            closeBtn?.addEventListener('click', close);
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) close();
            });

            document.addEventListener('keydown', (e) => {
                const tag = document.activeElement?.tagName;
                if (['INPUT', 'TEXTAREA'].includes(tag)) return;
                if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
                    e.preventDefault();
                    close();
                    return;
                }
                if (e.key === '?') {
                    if (overlay.classList.contains('hidden')) open();
                    else close();
                }
                if (e.key === 'f' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                    e.preventDefault();
                    bottomSheet.open();
                }
                if (e.key === 't' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                    themeManager.toggle();
                }
            });

            // g-g chord for top (g then g within 800ms)
            let gPressed = false;
            document.addEventListener('keydown', (e) => {
                const tag = document.activeElement?.tagName;
                if (['INPUT', 'TEXTAREA'].includes(tag)) return;
                if (e.key === 'g' && !gPressed) {
                    gPressed = true;
                    setTimeout(() => { gPressed = false; }, 800);
                    return;
                }
                if (e.key === 'g' && gPressed) {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    gPressed = false;
                }
            });
        }
    };

    // ============================================
    // MOBILE LAYOUT
    // ============================================
    const mobileLayout = {
        init() {
            const apply = () => {
                document.documentElement.setAttribute(
                    'data-mobile',
                    utils.isMobile() ? 'true' : 'false'
                );
            };
            apply();
            window.matchMedia('(max-width: 720px)').addEventListener('change', apply);
        }
    };

    // ============================================
    // FAB MENU
    // ============================================
    const fabMenuManager = {
        isOpen: false,

        init() {
            const stack = document.getElementById('fabStack');
            const fab = elements.scrollTopFab;
            const lastBtn = document.getElementById('fabLastJob');
            const topBtn = document.getElementById('fabScrollTop');
            if (!fab || !stack) return;

            this.updateLastJobVisibility();

            fab.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });

            lastBtn?.addEventListener('click', () => {
                this.close();
                lastJobNavigator.scrollToLast();
            });

            topBtn?.addEventListener('click', () => {
                this.close();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            document.addEventListener('click', (e) => {
                if (!this.isOpen) return;
                if (!stack.contains(e.target)) this.close();
            });
        },

        updateLastJobVisibility() {
            const lastBtn = document.getElementById('fabLastJob');
            if (!lastBtn) return;
            const has = !!localStorage.getItem('cv_last_clicked');
            lastBtn.classList.toggle('hidden', !has);
        },

        toggle() {
            if (this.isOpen) this.close();
            else this.open();
        },

        open() {
            const menu = document.getElementById('fabMenu');
            const fab = elements.scrollTopFab;
            const stack = document.getElementById('fabStack');
            if (!menu || !fab) return;
            this.updateLastJobVisibility();
            menu.classList.remove('hidden');
            stack?.classList.add('fab-open');
            fab.setAttribute('aria-expanded', 'true');
            document.body.classList.add('fab-menu-open');
            this.isOpen = true;
        },

        close() {
            const menu = document.getElementById('fabMenu');
            const fab = elements.scrollTopFab;
            const stack = document.getElementById('fabStack');
            if (menu) menu.classList.add('hidden');
            stack?.classList.remove('fab-open');
            fab?.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('fab-menu-open');
            this.isOpen = false;
        }
    };

    // ============================================
    // LAST JOB NAVIGATOR
    // ============================================
    const lastJobNavigator = {
        init() {},

        scrollToLast() {
            const lastKey = localStorage.getItem('cv_last_clicked');
            if (!lastKey) return;
            for (const c of document.querySelectorAll('.job-card')) {
                const cardUrl = c.dataset.url;
                const match = state.allJobs.find(j => utils.getJobKey(j) === lastKey);
                if (match && match.url === cardUrl) {
                    c.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    c.classList.add('flash-highlight');
                    setTimeout(() => c.classList.remove('flash-highlight'), 2200);
                    break;
                }
            }
        }
    };

    // ============================================
    // ONBOARDING
    // ============================================
    // ============================================
    // SERVICE WORKER
    // ============================================
    const swManager = {
        init() {
            if (!('serviceWorker' in navigator)) return;
            const swPath = new URL('service-worker.js', window.location.href).pathname;
            navigator.serviceWorker.register(swPath).catch(() => {});
        }
    };

    // ============================================
    // PULL TO REFRESH (mobile)
    // ============================================
    const ptr = {
        startY: 0,
        pulling: false,
        indicator: null,

        canPull() {
            if (window.scrollY > 0) return false;
            if (document.body.classList.contains('fab-menu-open')) return false;
            if (!elements.filterSheet.classList.contains('hidden')) return false;
            if (elements.sortSheet && !elements.sortSheet.classList.contains('hidden')) return false;
            if (elements.savedFiltersMenuSheet && !elements.savedFiltersMenuSheet.classList.contains('hidden')) return false;
            return true;
        },

        init() {
            if (!('ontouchstart' in window)) return;
            const ind = document.createElement('div');
            ind.className = 'ptr-indicator';
            ind.innerHTML = '<span class="material-symbols-rounded">refresh</span>';
            document.body.appendChild(ind);
            this.indicator = ind;

            document.addEventListener('touchstart', (e) => {
                if (this.canPull()) {
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
                    utils.showToast('Atualizando vagas…', 'filter-toast toast-mobile-top', 1800);
                    dataLoader.load({ soft: true });
                }
            }, { passive: true });
        }
    };

    const aboutInfoManager = {
        init() {
            const btn = document.getElementById('aboutInfoBtn');
            const popover = document.getElementById('infoPopover');
            if (!btn || !popover) return;

            const close = () => {
                popover.classList.add('hidden');
                btn.setAttribute('aria-expanded', 'false');
                btn.focus();
            };

            const open = () => {
                popover.classList.remove('hidden');
                btn.setAttribute('aria-expanded', 'true');
                popover.focus();
            };

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (popover.classList.contains('hidden')) open();
                else close();
            });

            popover.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    close();
                }
                if (e.key === 'Tab') {
                    e.preventDefault();
                }
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('#aboutInfoBtn') && !e.target.closest('#infoPopover')) close();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !popover.classList.contains('hidden')) close();
            });
        }
    };

    function init() {
        try {
            utils.markSessionStart();
            preferencesManager.applyDefaults();
            themeManager.init();
            // styleManager / fontManager — optional prefs via data-* on <html>
            densityManager.init();
            visitedFilter.init();
            viewModeManager.init();
            sortManager.init();
            shareManager.init();
            filterManager.initGroupedFilterDropdown();
            aboutInfoManager.init();
            searchHistoryManager.init();
            searchManager.init();
            animationManager.init();
            scrollManager.init();
            savedFiltersManager.init();
            bottomSheet.init();
            clearHandlers.init();
            shortcutsOverlay.init();
            mobileLayout.init();
            fabMenuManager.init();
            swManager.init();
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
                preferencesManager.markVisited();
                sortManager.updateLabel();
                fabMenuManager.updateLastJobVisibility();
            });

            // Fallback: avoid empty app if load is still in progress
            setTimeout(() => {
                const app = document.getElementById('app');
                const splash = document.getElementById('splash');
                const splashMsg = document.getElementById('splashMsg');
                if (state.allJobs.length > 0 && app && !app.classList.contains('visible')) {
                    dataLoader.showApp();
                    if (splash) splash.style.display = 'none';
                } else if (splashMsg && state.allJobs.length === 0) {
                    splashMsg.textContent = 'Ainda carregando o catálogo…';
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
