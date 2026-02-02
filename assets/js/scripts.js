/**
 * Classifica Vagas - Modern Job Listing Application
 * Minimalista, Responsivo, UX Impecável
 */

(function () {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
        JOBS_PER_PAGE: 30,
        SEARCH_DEBOUNCE: 300,
        SCROLL_THRESHOLD: 200,
        INFINITE_SCROLL_THRESHOLD: 500,
        DATA_URL: 'assets/data/json/open_jobs.json'
    };

    // ============================================
    // STATE
    // ============================================
    const state = {
        allJobs: [],
        filteredJobs: [],
        displayedJobs: 0,
        isLoading: false,
        searchQuery: '',
        quickFilter: 'all',
        activeFilters: {},
        visitedJobs: new Set(),
        filterOptions: {}
    };

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const elements = {
        loadingScreen: document.getElementById('loading-screen'),
        app: document.getElementById('app'),
        jobStats: document.getElementById('jobStats'),
        searchInput: document.getElementById('searchInput'),
        searchClear: document.getElementById('searchClear'),
        activeFiltersContainer: document.getElementById('activeFilters'),
        activeFiltersList: document.getElementById('activeFiltersList'),
        clearAllFilters: document.getElementById('clearAllFilters'),
        quickFilters: document.querySelectorAll('.quick-filter-chip'),
        jobsContainer: document.getElementById('jobsContainer'),
        loadingMore: document.getElementById('loadingMore'),
        emptyState: document.getElementById('emptyState'),
        filterFab: document.getElementById('filterFab'),
        filterCount: document.getElementById('filterCount'),
        filterModal: document.getElementById('filterModal'),
        modalBackdrop: document.getElementById('modalBackdrop'),
        modalClose: document.getElementById('modalClose'),
        filterModalBody: document.getElementById('filterModalBody'),
        clearFiltersBtn: document.getElementById('clearFiltersBtn'),
        applyFiltersBtn: document.getElementById('applyFiltersBtn'),
        scrollTop: document.getElementById('scrollTop'),
        themeToggle: document.getElementById('themeToggle'),
        lastUpdate: document.getElementById('lastUpdate')
    };

    // ============================================
    // UTILITIES
    // ============================================
    const utils = {
        debounce(fn, delay) {
            let timeoutId;
            return function (...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => fn.apply(this, args), delay);
            };
        },

        formatDate(dateString) {
            if (!dateString) return '';
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        },

        truncateText(text, maxLength) {
            if (!text || text.length <= maxLength) return text;
            return text.slice(0, maxLength) + '...';
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        getStorageKey(jobId) {
            return `cv_visited_${jobId}`;
        },

        isJobVisited(jobId) {
            return localStorage.getItem(utils.getStorageKey(jobId)) === 'true';
        },

        markJobVisited(jobId) {
            localStorage.setItem(utils.getStorageKey(jobId), 'true');
            state.visitedJobs.add(jobId);
        },

        normalizeText(text) {
            if (!text) return '';
            return text.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
        }
    };

    // ============================================
    // THEME MANAGEMENT
    // ============================================
    const themeManager = {
        init() {
            const savedTheme = localStorage.getItem('cv_theme') || 'dark';
            this.setTheme(savedTheme);
            elements.themeToggle.addEventListener('click', () => this.toggle());
        },

        setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('cv_theme', theme);

            // Update meta theme-color for mobile browsers
            const metaTheme = document.querySelector('meta[name="theme-color"]');
            if (metaTheme) {
                metaTheme.content = theme === 'light' ? '#ffffff' : '#0a0a0a';
            }
        },

        toggle() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            this.setTheme(newTheme);
        }
    };

    // ============================================
    // DATA LOADING
    // ============================================
    const dataLoader = {
        async loadJobs() {
            try {
                const response = await fetch(CONFIG.DATA_URL);
                const data = await response.json();

                // Process jobs and add IDs
                state.allJobs = data.map((job, index) => ({
                    ...job,
                    id: index + 1
                }));

                // Load visited jobs from localStorage
                state.allJobs.forEach(job => {
                    if (utils.isJobVisited(job.id)) {
                        state.visitedJobs.add(job.id);
                    }
                });

                // Build filter options
                this.buildFilterOptions();

                // Initial filter
                filterManager.applyFilters();

                // Update last modified date
                this.updateLastModified(response);

                // Hide loading screen
                this.hideLoadingScreen();

            } catch (error) {
                console.error('Error loading jobs:', error);
                elements.loadingScreen.innerHTML = `
                    <div class="loading-content">
                        <div class="loading-logo">CV</div>
                        <p class="loading-text" style="color: var(--danger);">
                            Erro ao carregar vagas. Por favor, recarregue a página.
                        </p>
                    </div>
                `;
            }
        },

        buildFilterOptions() {
            const filterFields = {
                'company': 'Empresa',
                'company_type': 'Ramo',
                'level': 'Nível',
                'category': 'Categoria'
            };

            for (const [field, label] of Object.entries(filterFields)) {
                const values = [...new Set(state.allJobs.map(job => job[field]).filter(Boolean))];
                values.sort((a, b) => a.localeCompare(b, 'pt-BR'));
                state.filterOptions[field] = { label, values };
            }
        },

        updateLastModified(response) {
            const lastModified = response.headers.get('last-modified');
            if (lastModified) {
                const date = new Date(lastModified);
                const formatted = new Intl.DateTimeFormat('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(date);
                elements.lastUpdate.textContent = formatted;
            }
        },

        hideLoadingScreen() {
            elements.loadingScreen.classList.add('fade-out');
            elements.app.classList.remove('hidden');

            setTimeout(() => {
                elements.loadingScreen.style.display = 'none';
            }, 300);
        }
    };

    // ============================================
    // FILTER MANAGEMENT
    // ============================================
    const filterManager = {
        applyFilters() {
            let filtered = [...state.allJobs];

            // Apply search query
            if (state.searchQuery) {
                const query = utils.normalizeText(state.searchQuery);
                filtered = filtered.filter(job => {
                    const searchFields = [
                        job.title,
                        job.company,
                        job.company_type,
                        job.level,
                        job.category,
                        job.location
                    ].map(utils.normalizeText).join(' ');
                    return searchFields.includes(query);
                });
            }

            // Apply quick filter
            if (state.quickFilter !== 'all') {
                filtered = filtered.filter(job => {
                    switch (state.quickFilter) {
                        case 'remote':
                            return job['remote?'] === '01 - Sim';
                        case 'office':
                            return job['remote?'] === '02 - Não';
                        case 'affirmative':
                            return job['affirmative?'] === '01 - Sim';
                        default:
                            return true;
                    }
                });
            }

            // Apply advanced filters
            for (const [field, values] of Object.entries(state.activeFilters)) {
                if (values && values.length > 0) {
                    filtered = filtered.filter(job => values.includes(job[field]));
                }
            }

            state.filteredJobs = filtered;
            state.displayedJobs = 0;

            this.updateUI();
            jobRenderer.renderJobs(true);
        },

        updateUI() {
            // Update stats
            elements.jobStats.textContent = `${state.filteredJobs.length.toLocaleString('pt-BR')} vagas encontradas`;

            // Update filter count badge
            const filterCount = Object.values(state.activeFilters)
                .filter(arr => arr && arr.length > 0)
                .reduce((acc, arr) => acc + arr.length, 0);

            if (filterCount > 0) {
                elements.filterCount.textContent = filterCount;
                elements.filterCount.classList.remove('hidden');
            } else {
                elements.filterCount.classList.add('hidden');
            }

            // Update active filters display
            this.updateActiveFiltersDisplay();
        },

        updateActiveFiltersDisplay() {
            const activeFilters = [];

            for (const [field, values] of Object.entries(state.activeFilters)) {
                if (values && values.length > 0) {
                    values.forEach(value => {
                        activeFilters.push({ field, value });
                    });
                }
            }

            if (activeFilters.length === 0) {
                elements.activeFiltersContainer.classList.add('hidden');
                return;
            }

            elements.activeFiltersContainer.classList.remove('hidden');
            elements.activeFiltersList.innerHTML = activeFilters.map(({ field, value }) => `
                <div class="active-filter-tag" data-field="${field}" data-value="${utils.escapeHtml(value)}">
                    <span>${utils.truncateText(value, 20)}</span>
                    <button aria-label="Remover filtro">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            `).join('');

            // Add click handlers for removing individual filters
            elements.activeFiltersList.querySelectorAll('.active-filter-tag button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tag = e.target.closest('.active-filter-tag');
                    const field = tag.dataset.field;
                    const value = tag.dataset.value;
                    this.removeFilter(field, value);
                });
            });
        },

        removeFilter(field, value) {
            if (state.activeFilters[field]) {
                state.activeFilters[field] = state.activeFilters[field].filter(v => v !== value);
                if (state.activeFilters[field].length === 0) {
                    delete state.activeFilters[field];
                }
            }
            this.applyFilters();
            modalManager.updateModalSelection();
        },

        clearAllFilters() {
            state.activeFilters = {};
            state.searchQuery = '';
            state.quickFilter = 'all';
            elements.searchInput.value = '';
            elements.searchClear.classList.add('hidden');

            // Reset quick filters UI
            elements.quickFilters.forEach(chip => {
                chip.classList.toggle('active', chip.dataset.filter === 'all');
            });

            this.applyFilters();
            modalManager.updateModalSelection();
        },

        setQuickFilter(filter) {
            state.quickFilter = filter;
            elements.quickFilters.forEach(chip => {
                chip.classList.toggle('active', chip.dataset.filter === filter);
            });
            this.applyFilters();
        }
    };

    // ============================================
    // JOB RENDERER
    // ============================================
    const jobRenderer = {
        renderJobs(reset = false) {
            if (reset) {
                elements.jobsContainer.innerHTML = '';
                state.displayedJobs = 0;
            }

            const startIndex = state.displayedJobs;
            const endIndex = startIndex + CONFIG.JOBS_PER_PAGE;
            const jobsToRender = state.filteredJobs.slice(startIndex, endIndex);

            if (jobsToRender.length === 0 && state.displayedJobs === 0) {
                elements.emptyState.classList.remove('hidden');
                elements.loadingMore.classList.add('hidden');
                return;
            }

            elements.emptyState.classList.add('hidden');

            const fragment = document.createDocumentFragment();

            jobsToRender.forEach(job => {
                const card = this.createJobCard(job);
                fragment.appendChild(card);
            });

            elements.jobsContainer.appendChild(fragment);
            state.displayedJobs = endIndex;

            // Update loading more visibility
            if (state.displayedJobs >= state.filteredJobs.length) {
                elements.loadingMore.classList.add('hidden');
            }
        },

        createJobCard(job) {
            const isRemote = job['remote?'] === '01 - Sim';
            const isVisited = state.visitedJobs.has(job.id);

            const card = document.createElement('a');
            card.href = job.url;
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
            card.className = `job-card${isVisited ? ' visited' : ''}`;
            card.dataset.id = job.id;

            // Extract level name (after " - ")
            const levelName = job.level ? job.level.split(' - ').slice(1).join(' - ') : '';
            const categoryName = job.category ? job.category.split(' - ').slice(1).join(' - ') : '';

            card.innerHTML = `
                <div class="job-header">
                    <div class="job-badge ${isRemote ? 'remote' : 'office'}">
                        ${isRemote ? '🏠' : '🏢'}
                    </div>
                    <h3 class="job-title">${utils.escapeHtml(job.title)}</h3>
                </div>
                <p class="job-company">${utils.escapeHtml(job.company)}</p>
                <div class="job-tags">
                    ${job.company_type ? `<span class="job-tag">${utils.escapeHtml(utils.truncateText(job.company_type, 20))}</span>` : ''}
                    ${levelName ? `<span class="job-tag">${utils.escapeHtml(utils.truncateText(levelName, 18))}</span>` : ''}
                    ${categoryName ? `<span class="job-tag">${utils.escapeHtml(utils.truncateText(categoryName, 18))}</span>` : ''}
                </div>
                <div class="job-meta">
                    <div class="job-location">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>${utils.escapeHtml(job.location || 'Não informado')}</span>
                    </div>
                    <span class="job-date">${utils.formatDate(job.inserted_date)}</span>
                </div>
            `;

            // Mark as visited on click
            card.addEventListener('click', () => {
                if (!state.visitedJobs.has(job.id)) {
                    utils.markJobVisited(job.id);
                    card.classList.add('visited');
                }
            });

            return card;
        },

        loadMore() {
            if (state.isLoading || state.displayedJobs >= state.filteredJobs.length) {
                return;
            }

            state.isLoading = true;
            elements.loadingMore.classList.remove('hidden');

            // Simulate small delay for smoother UX
            setTimeout(() => {
                this.renderJobs(false);
                state.isLoading = false;
            }, 100);
        }
    };

    // ============================================
    // MODAL MANAGEMENT
    // ============================================
    const modalManager = {
        tempFilters: {},

        init() {
            elements.filterFab.addEventListener('click', () => this.open());
            elements.modalBackdrop.addEventListener('click', () => this.close());
            elements.modalClose.addEventListener('click', () => this.close());
            elements.clearFiltersBtn.addEventListener('click', () => this.clearTemp());
            elements.applyFiltersBtn.addEventListener('click', () => this.apply());

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !elements.filterModal.classList.contains('hidden')) {
                    this.close();
                }
            });
        },

        buildFilterModal() {
            const html = Object.entries(state.filterOptions).map(([field, { label, values }]) => `
                <div class="filter-group" data-field="${field}">
                    <div class="filter-group-header">
                        <span class="filter-group-title">${label}</span>
                        <span class="filter-group-count">${values.length} opções</span>
                    </div>
                    <input
                        type="text"
                        class="filter-search"
                        placeholder="Buscar ${label.toLowerCase()}..."
                        data-field="${field}"
                    >
                    <div class="filter-options-scroll">
                        <div class="filter-options" data-field="${field}">
                            ${values.slice(0, 50).map(value => `
                                <button
                                    class="filter-option"
                                    data-field="${field}"
                                    data-value="${utils.escapeHtml(value)}"
                                >
                                    ${utils.escapeHtml(utils.truncateText(value, 25))}
                                </button>
                            `).join('')}
                            ${values.length > 50 ? `
                                <button class="filter-option show-more" data-field="${field}">
                                    +${values.length - 50} mais...
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');

            elements.filterModalBody.innerHTML = html;

            // Add event listeners
            this.addModalEventListeners();
        },

        addModalEventListeners() {
            // Filter search inputs
            elements.filterModalBody.querySelectorAll('.filter-search').forEach(input => {
                input.addEventListener('input', (e) => {
                    const field = e.target.dataset.field;
                    const query = utils.normalizeText(e.target.value);
                    const optionsContainer = elements.filterModalBody.querySelector(`.filter-options[data-field="${field}"]`);
                    const { values } = state.filterOptions[field];

                    const filteredValues = query
                        ? values.filter(v => utils.normalizeText(v).includes(query))
                        : values.slice(0, 50);

                    optionsContainer.innerHTML = filteredValues.slice(0, 50).map(value => `
                        <button
                            class="filter-option ${this.isValueSelected(field, value) ? 'selected' : ''}"
                            data-field="${field}"
                            data-value="${utils.escapeHtml(value)}"
                        >
                            ${utils.escapeHtml(utils.truncateText(value, 25))}
                        </button>
                    `).join('');

                    this.addOptionClickListeners(optionsContainer);
                });
            });

            // Filter option clicks
            elements.filterModalBody.querySelectorAll('.filter-options').forEach(container => {
                this.addOptionClickListeners(container);
            });
        },

        addOptionClickListeners(container) {
            container.querySelectorAll('.filter-option:not(.show-more)').forEach(btn => {
                btn.addEventListener('click', () => {
                    const field = btn.dataset.field;
                    const value = btn.dataset.value;

                    if (!this.tempFilters[field]) {
                        this.tempFilters[field] = [];
                    }

                    const index = this.tempFilters[field].indexOf(value);
                    if (index > -1) {
                        this.tempFilters[field].splice(index, 1);
                        btn.classList.remove('selected');
                    } else {
                        this.tempFilters[field].push(value);
                        btn.classList.add('selected');
                    }
                });
            });
        },

        isValueSelected(field, value) {
            return this.tempFilters[field] && this.tempFilters[field].includes(value);
        },

        updateModalSelection() {
            elements.filterModalBody.querySelectorAll('.filter-option').forEach(btn => {
                const field = btn.dataset.field;
                const value = btn.dataset.value;
                const isSelected = state.activeFilters[field] && state.activeFilters[field].includes(value);
                btn.classList.toggle('selected', isSelected);
            });
        },

        open() {
            this.tempFilters = JSON.parse(JSON.stringify(state.activeFilters));
            this.buildFilterModal();
            this.updateModalSelection();

            elements.filterModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';

            // Trigger animation
            requestAnimationFrame(() => {
                elements.filterModal.classList.add('active');
            });
        },

        close() {
            elements.filterModal.classList.remove('active');

            setTimeout(() => {
                elements.filterModal.classList.add('hidden');
                document.body.style.overflow = '';
            }, 300);
        },

        clearTemp() {
            this.tempFilters = {};
            elements.filterModalBody.querySelectorAll('.filter-option.selected').forEach(btn => {
                btn.classList.remove('selected');
            });
        },

        apply() {
            state.activeFilters = this.tempFilters;
            filterManager.applyFilters();
            this.close();
        }
    };

    // ============================================
    // SEARCH MANAGEMENT
    // ============================================
    const searchManager = {
        init() {
            const debouncedSearch = utils.debounce(() => {
                state.searchQuery = elements.searchInput.value.trim();
                filterManager.applyFilters();
            }, CONFIG.SEARCH_DEBOUNCE);

            elements.searchInput.addEventListener('input', () => {
                const hasValue = elements.searchInput.value.length > 0;
                elements.searchClear.classList.toggle('hidden', !hasValue);
                debouncedSearch();
            });

            elements.searchClear.addEventListener('click', () => {
                elements.searchInput.value = '';
                elements.searchClear.classList.add('hidden');
                state.searchQuery = '';
                filterManager.applyFilters();
                elements.searchInput.focus();
            });
        }
    };

    // ============================================
    // SCROLL MANAGEMENT
    // ============================================
    const scrollManager = {
        init() {
            let ticking = false;

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        this.handleScroll();
                        ticking = false;
                    });
                    ticking = true;
                }
            });

            elements.scrollTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        },

        handleScroll() {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            // Show/hide scroll to top button
            if (scrollY > CONFIG.SCROLL_THRESHOLD) {
                elements.scrollTop.classList.add('visible');
            } else {
                elements.scrollTop.classList.remove('visible');
            }

            // Infinite scroll
            if (documentHeight - scrollY - windowHeight < CONFIG.INFINITE_SCROLL_THRESHOLD) {
                jobRenderer.loadMore();
            }
        }
    };

    // ============================================
    // QUICK FILTERS
    // ============================================
    const quickFiltersManager = {
        init() {
            elements.quickFilters.forEach(chip => {
                chip.addEventListener('click', () => {
                    filterManager.setQuickFilter(chip.dataset.filter);
                });
            });
        }
    };

    // ============================================
    // CLEAR ALL FILTERS
    // ============================================
    const clearFiltersManager = {
        init() {
            elements.clearAllFilters.addEventListener('click', () => {
                filterManager.clearAllFilters();
            });
        }
    };

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        themeManager.init();
        searchManager.init();
        scrollManager.init();
        quickFiltersManager.init();
        clearFiltersManager.init();
        modalManager.init();
        dataLoader.loadJobs();
    }

    // Start the application
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
