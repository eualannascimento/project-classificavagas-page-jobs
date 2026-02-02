/**
 * Classifica Vagas - Premium Core (v2)
 * Architecture: State-Driven UI with Modular Logic
 */

(function() {
    'use strict';

    // ============================================
    // 1. CONFIG & STATE
    // ============================================
    const CONSTANTS = {
        DATA_URL: 'assets/data/json/open_jobs.json',
        PAGE_SIZE: 40,
        ANIMATION_DURATION: 300
    };

    const state = {
        allJobs: [],
        filteredJobs: [],
        visibleCount: 0,
        filters: {
            query: '',
            remote: false,
            presencial: false,
            affirmative: false,
            level: new Set(),
            category: new Set(),
            contract: new Set(),
            site_type: new Set()
        },
        metadata: {
            levels: {},
            categories: {},
            contracts: {},
            sites: {}
        }
    };

    // ============================================
    // 2. UI CONTROLLER
    // ============================================
    const UI = {
        el: {
            app: document.getElementById('app'),
            skeleton: document.getElementById('skeleton-screen'),
            jobsFeed: document.getElementById('jobs-feed'),
            sentinel: document.getElementById('infinite-sentinel'),
            filterDrawer: document.getElementById('filter-drawer'),
            desktopFilters: document.getElementById('desktop-filters'),
            mobileFiltersContent: document.getElementById('mobile-filters-content'),
            searchInput: document.getElementById('global-search'),
            clearSearchBtn: document.getElementById('clear-search'),
            filterBadge: document.getElementById('filter-count-badge'),
            activeFiltersBar: document.getElementById('active-filters-bar'),
            navHome: document.getElementById('nav-home'),
            navFilters: document.getElementById('nav-filters')
        },

        showApp() {
            // Fade out skeleton, fade in app
            this.el.skeleton.style.opacity = '0';
            setTimeout(() => {
                this.el.skeleton.classList.add('hidden');
                this.el.app.classList.remove('hidden');
                // Trigger reflow for animation if needed
            }, 300);
        },

        renderJobs(jobs, append = false) {
            if (!append) {
                this.el.jobsFeed.innerHTML = '';
            }

            if (jobs.length === 0) {
                this.el.jobsFeed.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px; color: var(--color-text-tertiary);">
                        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" style="margin-bottom:16px; opacity:0.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <p>Nenhuma vaga encontrada.</p>
                        <button onclick="window.resetFilters()" style="margin-top:16px; color:var(--color-text-primary); text-decoration:underline;">Limpar filtros</button>
                    </div>
                `;
                return;
            }

            const fragment = document.createDocumentFragment();
            jobs.forEach(job => fragment.appendChild(this.createJobCard(job)));
            this.el.jobsFeed.appendChild(fragment);
        },

        createJobCard(job) {
            const el = document.createElement('div');
            el.className = 'job-card';

            // Logic for badges
            const isRemote = job['remote?'] === '01 - Sim';
            const initials = (job.company || 'CV').substring(0,2).toUpperCase();

            el.innerHTML = `
                <div class="card-top">
                    <div class="company-avatar">${initials}</div>
                    <div class="badges">
                        ${isRemote ? '<span class="badge remote">Remoto</span>' : ''}
                        <span class="badge">${job.site_type || 'Gupy'}</span>
                    </div>
                </div>
                <h3 class="job-title">${this.escape(job.title)}</h3>
                <p class="company-name">${this.escape(job.company)}</p>

                <div class="card-meta">
                    <div class="meta-row">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        <span>${this.escape(job.location)}</span>
                    </div>
                    <div class="meta-row">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span>${this.formatDate(job.inserted_date)}</span>
                    </div>
                </div>

                <div class="card-actions">
                    <a href="${job.url}" target="_blank" class="btn-apply">
                        Aplicar Agora
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                </div>

                <svg class="chevron-indicator" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            `;

            // Expand Interaction
            el.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-apply')) {
                    el.classList.toggle('expanded');
                }
            });

            return el;
        },

        renderFilters() {
            // We render the same structure to both Desktop Sidebar and Mobile Drawer
            const html = this.buildFilterHTML();
            this.el.desktopFilters.innerHTML = html;
            this.el.mobileFiltersContent.innerHTML = html;

            this.bindFilterEvents(this.el.desktopFilters);
            this.bindFilterEvents(this.el.mobileFiltersContent);
        },

        buildFilterHTML() {
            // Helper to build sections
            const buildSection = (title, items, type) => {
                if (!items || items.length === 0) return '';
                // Sort items
                const sorted = items.sort();
                let html = `<div class="filter-group"><div class="filter-header">${title}</div><div class="filter-list">`;
                sorted.forEach(val => {
                    const isActive = state.filters[type].has(val);
                    // Clean label
                    const label = val.replace(/^\d+ - /, '');
                    html += `
                        <div class="filter-row ${isActive ? 'active' : ''}" data-type="${type}" data-val="${val}">
                            <div class="checkbox-custom"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                            <span>${label}</span>
                        </div>
                    `;
                });
                html += `</div></div>`;
                return html;
            };

            // 1. Toggles (Manual)
            let html = `<div class="filter-group"><div class="filter-header">Preferências</div><div class="filter-list">
                <div class="filter-row ${state.filters.remote ? 'active' : ''}" data-type="remote" data-val="true">
                    <div class="checkbox-custom"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                    <span>Remoto</span>
                </div>
                <div class="filter-row ${state.filters.presencial ? 'active' : ''}" data-type="presencial" data-val="true">
                    <div class="checkbox-custom"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                    <span>Presencial</span>
                </div>
                <div class="filter-row ${state.filters.affirmative ? 'active' : ''}" data-type="affirmative" data-val="true">
                    <div class="checkbox-custom"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                    <span>Vagas Afirmativas</span>
                </div>
            </div></div>`;

            // 2. Dynamic Sections
            // Helper to get keys sorted by count (descending)
            const getSortedKeys = (obj) => Object.entries(obj).sort((a,b) => b[1] - a[1]).map(x => x[0]);

            html += buildSection('Nível', getSortedKeys(state.metadata.levels), 'level');
            html += buildSection('Área', getSortedKeys(state.metadata.categories), 'category');
            html += buildSection('Contrato', getSortedKeys(state.metadata.contracts).slice(0, 8), 'contract');
            html += buildSection('Plataforma', getSortedKeys(state.metadata.sites), 'site_type');

            return html;
        },

        bindFilterEvents(container) {
            container.querySelectorAll('.filter-row').forEach(row => {
                row.addEventListener('click', () => {
                    const type = row.dataset.type;
                    const val = row.dataset.val;

                    // Update State
                    if (type === 'remote' || type === 'affirmative' || type === 'presencial') {
                        state.filters[type] = !state.filters[type];
                    } else {
                        if (state.filters[type].has(val)) {
                            state.filters[type].delete(val);
                        } else {
                            state.filters[type].add(val);
                        }
                    }

                    // Re-render ALL filter UIs (to sync desktop/mobile)
                    this.renderFilters();

                    // On desktop, apply immediately. On mobile, wait for "Apply".
                    if (window.innerWidth >= 768) {
                        Logic.applyFilters();
                    } else {
                        // Update badge count preview
                        const previewCount = Logic.getFilteredCount();
                        this.el.filterBadge.textContent = previewCount;
                    }
                });
            });
        },

        toggleDrawer(open) {
            if (open) {
                this.el.filterDrawer.classList.remove('hidden'); // Ensure display block first
                // Small delay to allow transition
                requestAnimationFrame(() => this.el.filterDrawer.classList.add('open'));
                this.el.filterBadge.textContent = state.filteredJobs.length;
            } else {
                this.el.filterDrawer.classList.remove('open');
                setTimeout(() => this.el.filterDrawer.classList.add('hidden'), 300);
            }
        },

        escape(str) {
            return (str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
        },

        formatDate(str) {
            if(!str) return '';
            const [y,m,d] = str.split('-');
            return `${d}/${m}/${y}`;
        }
    };

    // ============================================
    // 3. LOGIC CONTROLLER
    // ============================================
    const Logic = {
        async init() {
            try {
                const res = await fetch(CONSTANTS.DATA_URL);
                const data = await res.json();

                state.allJobs = data;

                // Extract Metadata for Filters (with counts)
                const count = (obj, key) => { if(key) obj[key] = (obj[key] || 0) + 1; };

                data.forEach(job => {
                    count(state.metadata.levels, job.level);
                    count(state.metadata.categories, job.category);
                    count(state.metadata.contracts, job.contract);
                    count(state.metadata.sites, job.site_type);
                });

                // Initial Filter Apply (Reset)
                this.applyFilters();

                // Build UI
                UI.renderFilters();
                UI.showApp();

            } catch (err) {
                console.error('Failed to load jobs', err);
            }
        },

        applyFilters() {
            let res = state.allJobs;

            // Text Search
            if (state.filters.query) {
                const q = state.filters.query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                res = res.filter(j =>
                    (j.title && j.title.toLowerCase().normalize("NFD").includes(q)) ||
                    (j.company && j.company.toLowerCase().normalize("NFD").includes(q))
                );
            }

            // Boolean Toggles
            const wantsRemote = state.filters.remote;
            const wantsPresencial = state.filters.presencial;

            if (wantsRemote && !wantsPresencial) {
                res = res.filter(j => j['remote?'] === '01 - Sim');
            } else if (wantsPresencial && !wantsRemote) {
                res = res.filter(j => j['remote?'] !== '01 - Sim');
            }

            if (state.filters.affirmative) res = res.filter(j => j['affirmative?'] === '01 - Sim');

            // Set Filters
            ['level', 'category', 'contract', 'site_type'].forEach(key => {
                if (state.filters[key].size > 0) {
                    res = res.filter(j => state.filters[key].has(j[key]));
                }
            });

            state.filteredJobs = res;
            state.visibleCount = 0;

            // Scroll to top
            if(UI.el.jobsFeed) UI.el.jobsFeed.scrollTop = 0;

            this.loadMore();
        },

        loadMore() {
            const start = state.visibleCount;
            const end = Math.min(start + CONSTANTS.PAGE_SIZE, state.filteredJobs.length);

            if (start >= end) return;

            const slice = state.filteredJobs.slice(start, end);
            UI.renderJobs(slice, start > 0);
            state.visibleCount = end;

            // Manage Sentinel
            if (state.visibleCount >= state.filteredJobs.length) {
                UI.el.sentinel.style.display = 'none';
            } else {
                UI.el.sentinel.style.display = 'block';
            }
        },

        getFilteredCount() {
            // Duplicate logic just for badge preview - optimization: create a pure function for filter predicate
            // For now, let's just use the current logic (simple enough)
            return state.filteredJobs.length; // Approximate (reactive in real frameworks)
        }
    };

    // ============================================
    // 4. EVENT LISTENERS
    // ============================================

    // Search
    UI.el.searchInput.addEventListener('input', (e) => {
        state.filters.query = e.target.value;
        UI.el.clearSearchBtn.classList.toggle('hidden', !state.filters.query);
        Logic.applyFilters();
    });

    UI.el.clearSearchBtn.addEventListener('click', () => {
        state.filters.query = '';
        UI.el.searchInput.value = '';
        UI.el.clearSearchBtn.classList.add('hidden');
        Logic.applyFilters();
    });

    // Mobile Drawer Logic
    UI.el.navFilters.addEventListener('click', () => UI.toggleDrawer(true));
    document.getElementById('btn-close-filters').addEventListener('click', () => UI.toggleDrawer(false));

    document.getElementById('btn-apply-filters').addEventListener('click', () => {
        Logic.applyFilters();
        UI.toggleDrawer(false);
    });

    document.getElementById('btn-clear-filters').addEventListener('click', () => {
        state.filters.remote = false;
        state.filters.presencial = false;
        state.filters.affirmative = false;
        state.filters.level.clear();
        state.filters.category.clear();
        state.filters.contract.clear();
        UI.renderFilters();
        // Update badge
        UI.el.filterBadge.textContent = state.allJobs.length;
    });

    // Global Reset
    window.resetFilters = () => {
        state.filters.query = '';
        UI.el.searchInput.value = '';
        document.getElementById('btn-clear-filters').click(); // Reuse logic
        Logic.applyFilters();
    };

    // Infinite Scroll
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            Logic.loadMore();
        }
    }, { rootMargin: '400px' });

    observer.observe(UI.el.sentinel);

    // Init
    Logic.init();

})();
