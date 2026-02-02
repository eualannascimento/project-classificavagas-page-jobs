/**
 * Classifica Vagas - Premium Design System (v2)
 * Layout: Sidebar (Desktop) / Bottom Nav (Mobile)
 */

(function () {
    'use strict';

    // ============================================
    // STATE & CONFIG
    // ============================================
    const CONFIG = {
        DATA_URL: 'assets/data/json/open_jobs.json',
        JOBS_PER_PAGE: 50
    };

    const state = {
        allJobs: [],
        filteredJobs: [],
        displayedCount: 0,
        activeFilters: {},
        searchQuery: '',
        visitedJobs: new Set(),
        isSidebarOpen: false
    };

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const elements = {
        app: document.getElementById('app'),
        jobsContainer: document.getElementById('jobsContainer'),
        sidebar: document.getElementById('sidebar'),
        searchInput: document.getElementById('searchInput'),
        filterList: document.getElementById('filterList'),
        jobStats: document.getElementById('jobStats'),
        bottomNav: document.getElementById('bottomNav'),
        themeToggle: document.getElementById('themeToggle'),
        btnOpenFilters: document.getElementById('btnOpenFilters'),
        btnCloseSidebar: document.getElementById('btnCloseSidebar'),
        loadingScreen: document.getElementById('loadingScreen')
    };

    // ============================================
    // UTILS
    // ============================================
    const utils = {
        formatDate(dateStr) {
            if (!dateStr) return '';
            const [y, m, d] = dateStr.split('-');
            return `${d}/${m}/${y}`;
        },
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        },
        normalize(text) {
            return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        },
        getInitials(name) {
            return (name || 'CV').substring(0, 2).toUpperCase();
        }
    };

    // ============================================
    // RENDERERS
    // ============================================
    const render = {
        jobs(append = false) {
            if (!append) {
                elements.jobsContainer.innerHTML = '';
                state.displayedCount = 0;
            }

            // Remove existing sentinel if any
            const existingSentinel = document.getElementById('infinite-scroll-sentinel');
            if (existingSentinel) existingSentinel.remove();

            if (state.filteredJobs.length === 0) {
                elements.jobsContainer.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-tertiary);">
                        <p>Nenhuma vaga encontrada para os filtros selecionados.</p>
                    </div>
                `;
                return;
            }

            const start = state.displayedCount;
            const end = Math.min(start + CONFIG.JOBS_PER_PAGE, state.filteredJobs.length);
            const fragment = document.createDocumentFragment();

            state.filteredJobs.slice(start, end).forEach(job => {
                fragment.appendChild(this.createCard(job));
            });
            elements.jobsContainer.appendChild(fragment);

            state.displayedCount = end;
            this.updateStats();

            // Setup Infinite Scroll if more jobs exist
            if (state.displayedCount < state.filteredJobs.length) {
                const sentinel = document.createElement('div');
                sentinel.id = 'infinite-scroll-sentinel';
                sentinel.style.height = '20px';
                sentinel.style.width = '100%';
                sentinel.style.gridColumn = '1 / -1';
                elements.jobsContainer.appendChild(sentinel);
                logic.setupObserver(sentinel);
            }
        },

        createCard(job) {
            const isRemote = job['remote?'] === '01 - Sim';
            const isAffirmative = job['affirmative?'] === '01 - Sim';
            const companyInitials = utils.getInitials(job.company);

            const card = document.createElement('div');
            card.className = 'job-card';
            if (state.visitedJobs.has(job.id)) card.classList.add('visited');

            // Icons
            const icons = {
                chevron: `<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
                location: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
                date: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
                external: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`
            };

            card.innerHTML = `
                <div class="card-header">
                    <div class="company-logo-placeholder">${companyInitials}</div>
                    <div class="card-badges">
                        ${isRemote ? '<span class="badge remote">Remoto</span>' : ''}
                        ${isAffirmative ? '<span class="badge">Afirmativa</span>' : ''}
                    </div>
                </div>

                <h3 class="card-title">${utils.escapeHtml(job.title)}</h3>
                <p class="card-company">${utils.escapeHtml(job.company)}</p>

                <div class="card-details">
                    <div class="meta-row">
                        <div class="meta-item">${icons.location} <span>${utils.escapeHtml(job.location)}</span></div>
                    </div>
                     <div class="meta-row">
                        <div class="meta-item">${icons.date} <span>${utils.formatDate(job.inserted_date)}</span></div>
                    </div>

                    <div class="card-actions">
                        <a href="${job.url}" target="_blank" class="btn-apply">
                            Aplicar Agora ${icons.external}
                        </a>
                    </div>
                </div>
                ${icons.chevron}
            `;

            // Interaction
            card.addEventListener('click', (e) => {
                if(e.target.closest('.btn-apply')) {
                    // Mark visited logic
                    if(!state.visitedJobs.has(job.id)) {
                        state.visitedJobs.add(job.id);
                        localStorage.setItem('cv_visited', JSON.stringify([...state.visitedJobs]));
                        card.classList.add('visited');
                    }
                    return;
                }

                // Toggle Expand
                card.classList.toggle('expanded');
            });

            return card;
        },

        filters() {
            // Build Sidebar Filters
            // 1. Fixed "Type" Group (Remote, Hybrid, etc) - Integrated into main flow
            const specialFilters = [
                { id: 'remote', label: 'Apenas Remoto', check: (j) => j['remote?'] === '01 - Sim' },
                { id: 'presencial', label: 'Apenas Presencial', check: (j) => j['remote?'] === '02 - Não' },
                { id: 'affirmative', label: 'Vagas Afirmativas', check: (j) => j['affirmative?'] === '01 - Sim' }
            ];

            let html = `<div class="filter-section">
                <div class="filter-title">Preferências</div>
                <div class="filter-list">`;

            specialFilters.forEach(f => {
                const isActive = state.activeFilters[f.id];
                html += `
                    <div class="filter-item ${isActive ? 'active' : ''}" data-special="${f.id}">
                        <div class="checkbox"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                        <span>${f.label}</span>
                    </div>`;
            });
            html += `</div></div>`;

            // 2. Dynamic Groups (Level, Category)
            const groups = {
                'level': 'Nível',
                'category': 'Área'
            };

            for(const [key, label] of Object.entries(groups)) {
                // Extract unique values
                const values = [...new Set(state.allJobs.map(j => j[key]).filter(Boolean))].sort();

                html += `<div class="filter-section">
                    <div class="filter-title">${label}</div>
                    <div class="filter-list">`;

                values.slice(0, 8).forEach(val => { // Limit to 8 to save space
                    const isActive = state.activeFilters[key] && state.activeFilters[key].includes(val);
                    html += `
                        <div class="filter-item ${isActive ? 'active' : ''}" data-group="${key}" data-val="${utils.escapeHtml(val)}">
                            <div class="checkbox"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                            <span>${utils.escapeHtml(val.replace(/^\d+ - /, ''))}</span>
                        </div>`;
                });

                html += `</div></div>`;
            }

            elements.filterList.innerHTML = html;

            // Attach Events
            elements.filterList.querySelectorAll('.filter-item').forEach(el => {
                el.addEventListener('click', () => {
                    if(el.dataset.special) {
                        // Toggle special filter
                        const id = el.dataset.special;
                        state.activeFilters[id] = !state.activeFilters[id];
                    } else {
                        // Toggle group filter
                        const group = el.dataset.group;
                        const val = el.dataset.val;
                        if(!state.activeFilters[group]) state.activeFilters[group] = [];

                        const idx = state.activeFilters[group].indexOf(val);
                        if(idx > -1) state.activeFilters[group].splice(idx, 1);
                        else state.activeFilters[group].push(val);
                    }

                    this.filters(); // Re-render filters to show active state
                    logic.applyFilters();
                });
            });
        },

        updateStats() {
            elements.jobStats.textContent = `${state.filteredJobs.length} vagas`;
        }
    };

    // ============================================
    // BUSINESS LOGIC
    // ============================================
    const logic = {
        async init() {
            // Load Data
            try {
                const res = await fetch(CONFIG.DATA_URL);
                const data = await res.json();
                state.allJobs = data.map((j, i) => ({...j, id: i}));
                state.filteredJobs = state.allJobs;

                // Load Visited
                const storedVisited = localStorage.getItem('cv_visited');
                if(storedVisited) state.visitedJobs = new Set(JSON.parse(storedVisited));

                // Initial Render
                render.filters();
                render.jobs();

                // Remove Loading
                document.getElementById('loading-screen').classList.add('hidden');
                document.getElementById('app').classList.remove('hidden');

            } catch(e) {
                console.error(e);
            }

            // Theme Init
            const savedTheme = localStorage.getItem('theme') || 'dark';
            document.documentElement.setAttribute('data-theme', savedTheme);
        },

        applyFilters() {
            let res = state.allJobs;

            // 1. Text Search
            if(state.searchQuery) {
                const q = utils.normalize(state.searchQuery);
                res = res.filter(j =>
                    utils.normalize(j.title).includes(q) ||
                    utils.normalize(j.company).includes(q)
                );
            }

            // 2. Special Filters
            if(state.activeFilters['remote']) {
                res = res.filter(j => j['remote?'] === '01 - Sim');
            }
            if(state.activeFilters['presencial']) {
                res = res.filter(j => j['remote?'] === '02 - Não');
            }
            if(state.activeFilters['affirmative']) {
                res = res.filter(j => j['affirmative?'] === '01 - Sim');
            }

            // 3. Group Filters
            ['level', 'category'].forEach(group => {
                const active = state.activeFilters[group];
                if(active && active.length > 0) {
                    res = res.filter(j => active.includes(j[group]));
                }
            });

            state.filteredJobs = res;
            render.jobs();

            // Scroll to top
            window.scrollTo(0, 0);
        },

        toggleSidebar() {
            state.isSidebarOpen = !state.isSidebarOpen;
            elements.sidebar.classList.toggle('active', state.isSidebarOpen);
        },

        setupObserver(sentinel) {
            if (this.observer) this.observer.disconnect();

            this.observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    render.jobs(true); // Append mode
                }
            }, { rootMargin: '200px' });

            this.observer.observe(sentinel);
        }
    };

    // ============================================
    // EVENT LISTENERS
    // ============================================
    // Search
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        logic.applyFilters();
    });

    // Theme Toggle
    elements.themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });

    // Mobile Sidebar Controls
    if(elements.btnOpenFilters) {
        elements.btnOpenFilters.addEventListener('click', logic.toggleSidebar);
    }
    if(elements.btnCloseSidebar) {
        elements.btnCloseSidebar.addEventListener('click', logic.toggleSidebar);
    }

    // Init
    logic.init();

})();
