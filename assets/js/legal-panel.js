(function () {
    'use strict';

    const PAGES = {
        termos: { url: 'termos.html', title: 'Termos de Uso', panelHash: '#termos' },
        privacidade: { url: 'privacidade.html', title: 'Privacidade e LGPD', panelHash: '#privacidade' }
    };

    const panel = document.getElementById('legalPanel');
    if (!panel) return;

    const scrim = document.getElementById('legalScrim');
    const body = document.getElementById('legalPanelBody');
    const closeBtn = document.getElementById('closeLegalPanel');
    const tabTermos = document.getElementById('legalTabTermos');
    const tabPriv = document.getElementById('legalTabPrivacidade');

    const cache = Object.create(null);
    let currentPage = null;
    let lastFocus = null;
    /** Uma entrada pushState ao abrir o painel; abas/seções usam replaceState. */
    let historyEntryActive = false;

    function resolveLegalPage(href) {
        if (!href) return null;
        try {
            const u = new URL(href, window.location.href);
            if (u.origin !== window.location.origin) return null;
            const path = u.pathname.split('/').pop() || '';
            if (path === 'termos.html' || path === 'termos') return { page: 'termos', hash: u.hash };
            if (path === 'privacidade.html' || path === 'privacidade') return { page: 'privacidade', hash: u.hash };
            return null;
        } catch (_) {
            return null;
        }
    }

    function hashToPage(hash) {
        if (!hash || hash === '#') return null;
        const id = hash.replace(/^#/, '').toLowerCase();
        if (id === 'termos' || id === 'privacidade') return { page: id, hash: '' };
        if (id === 'remocao') return { page: 'termos', hash: '#remocao' };
        return null;
    }

    function panelUrlHash(page, sectionHash) {
        if (sectionHash && sectionHash !== '#') return sectionHash;
        return PAGES[page]?.panelHash || '#';
    }

    function syncHistory(page, sectionHash, { push = false } = {}) {
        const urlHash = panelUrlHash(page, sectionHash);
        const state = { cvLegalPanel: page };
        const url = window.location.pathname + window.location.search + urlHash;

        if (!historyEntryActive && push) {
            history.pushState(state, '', url);
            historyEntryActive = true;
            return;
        }
        if (historyEntryActive || window.location.hash) {
            history.replaceState(state, '', url);
            historyEntryActive = true;
        }
    }

    function clearHistoryEntry() {
        if (!window.location.hash) {
            historyEntryActive = false;
            return;
        }
        history.replaceState(null, '', window.location.pathname + window.location.search);
        historyEntryActive = false;
    }

    function setTabsActive(page) {
        if (tabTermos) {
            const on = page === 'termos';
            tabTermos.classList.toggle('active', on);
            tabTermos.setAttribute('aria-selected', on ? 'true' : 'false');
        }
        if (tabPriv) {
            const on = page === 'privacidade';
            tabPriv.classList.toggle('active', on);
            tabPriv.setAttribute('aria-selected', on ? 'true' : 'false');
        }
    }

    function wirePanelLinks(root) {
        root.querySelectorAll('a[href]').forEach((anchor) => {
            const href = anchor.getAttribute('href');
            const resolved = resolveLegalPage(href);
            if (resolved) {
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    open(resolved.page, resolved.hash, { updateHistory: true });
                });
                return;
            }
            if (href && href.startsWith('#') && href.length > 1) {
                anchor.addEventListener('click', (e) => {
                    const target = body.querySelector(href);
                    if (!target) return;
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    if (currentPage) {
                        syncHistory(currentPage, href, { push: false });
                    }
                });
            }
        });

        const clearBtn = root.querySelector('#clearLocalData');
        const status = root.querySelector('#clearLocalDataStatus');
        if (clearBtn && typeof window.cvClearLocalData === 'function') {
            clearBtn.addEventListener('click', () => window.cvClearLocalData(status));
        }
    }

    async function fetchPage(page) {
        if (cache[page]) return cache[page];
        const meta = PAGES[page];
        const res = await fetch(meta.url, { credentials: 'same-origin' });
        if (!res.ok) throw new Error('fetch failed');
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const article = doc.querySelector('#legalContent');
        const footer = doc.querySelector('.legal-footer');
        const content = {
            title: doc.querySelector('h1')?.textContent?.trim() || meta.title,
            html: (article ? article.outerHTML : '') + (footer ? footer.outerHTML : '')
        };
        cache[page] = content;
        return content;
    }

    function scrollToHash(hash) {
        if (!hash || hash === '#') return;
        const id = hash.replace(/^#/, '');
        const target = body.querySelector(`#${CSS.escape(id)}`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderContent(content) {
        body.innerHTML = content.html;
        wirePanelLinks(body);
        body.scrollTop = 0;
    }

    async function open(page, hash, { updateHistory = true, focusClose = false } = {}) {
        if (!PAGES[page]) return;

        const wasOpen = !panel.classList.contains('hidden');
        const samePage = currentPage === page;
        const sectionOnly = samePage && wasOpen && hash;

        if (!wasOpen) {
            lastFocus = document.activeElement;
        }

        currentPage = page;
        setTabsActive(page);

        panel.classList.remove('hidden');
        if (scrim) scrim.classList.remove('hidden');
        document.body.classList.add('legal-panel-open');
        panel.setAttribute('aria-hidden', 'false');

        if (sectionOnly && cache[page]) {
            scrollToHash(hash);
            if (updateHistory) syncHistory(page, hash, { push: !historyEntryActive });
            return;
        }

        if (samePage && cache[page] && wasOpen && !hash) {
            body.scrollTop = 0;
            if (updateHistory) syncHistory(page, '', { push: !historyEntryActive });
            return;
        }

        const needsFetch = !cache[page];
        if (needsFetch) {
            body.innerHTML = '<p class="legal-panel-loading">Carregando…</p>';
        }

        if (focusClose && closeBtn) {
            closeBtn.focus();
        }
        window.cvFocusTrap?.activate(panel);

        try {
            const content = await fetchPage(page);
            if (!samePage || needsFetch || body.querySelector('.legal-panel-loading')) {
                renderContent(content);
            }
            scrollToHash(hash);
        } catch (_) {
            body.innerHTML =
                '<p class="legal-panel-error">Não foi possível carregar esta página. ' +
                '<a href="' + PAGES[page].url + '">Abrir em página completa</a>.</p>';
        }

        if (updateHistory) {
            syncHistory(page, hash, { push: !historyEntryActive && !wasOpen });
        }
    }

    function close({ fromHistory = false } = {}) {
        const wasOpen = !panel.classList.contains('hidden');
        if (window.cvFocusTrap?.isActive(panel)) {
            window.cvFocusTrap.deactivate();
        }
        panel.classList.add('hidden');
        if (scrim) scrim.classList.add('hidden');
        document.body.classList.remove('legal-panel-open');
        panel.setAttribute('aria-hidden', 'true');
        currentPage = null;

        if (!fromHistory) {
            if (historyEntryActive) {
                historyEntryActive = false;
                history.back();
            } else if (window.location.hash.match(/^#(termos|privacidade|remocao)$/)) {
                clearHistoryEntry();
            }
        } else {
            historyEntryActive = false;
        }

        if (wasOpen && lastFocus && typeof lastFocus.focus === 'function') {
            lastFocus.focus();
        }
    }

    function onDocumentClick(e) {
        const anchor = e.target.closest('a[href]');
        if (!anchor) return;
        const resolved = resolveLegalPage(anchor.getAttribute('href'));
        if (!resolved) return;

        // Na home, o app de vagas fica oculto. Deixe os links legais
        // seguirem para as páginas completas em vez de abrir um painel invisível.
        if (document.body.classList.contains('hub-active')) return;

        e.preventDefault();
        const inPanel = !!anchor.closest('#legalPanel');
        open(resolved.page, resolved.hash, {
            updateHistory: true,
            focusClose: !inPanel && panel.classList.contains('hidden')
        });
    }

    function onPopState() {
        const fromHash = hashToPage(window.location.hash);
        if (fromHash) {
            open(fromHash.page, fromHash.hash, { updateHistory: false, focusClose: false });
            return;
        }
        if (!panel.classList.contains('hidden')) {
            close({ fromHistory: true });
        } else {
            historyEntryActive = false;
        }
    }

    document.addEventListener('click', onDocumentClick);
    window.addEventListener('popstate', onPopState);

    if (closeBtn) closeBtn.addEventListener('click', () => close());
    if (scrim) scrim.addEventListener('click', () => close());
    if (tabTermos) {
        tabTermos.addEventListener('click', () => {
            if (currentPage === 'termos' && !panel.classList.contains('hidden')) {
                body.scrollTop = 0;
                syncHistory('termos', '', { push: false });
                return;
            }
            open('termos', '', { updateHistory: true, focusClose: false });
        });
    }
    if (tabPriv) {
        tabPriv.addEventListener('click', () => {
            if (currentPage === 'privacidade' && !panel.classList.contains('hidden')) {
                body.scrollTop = 0;
                syncHistory('privacidade', '', { push: false });
                return;
            }
            open('privacidade', '', { updateHistory: true, focusClose: false });
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || panel.classList.contains('hidden')) return;
        e.preventDefault();
        close();
    });

    const initial = hashToPage(window.location.hash);
    if (initial) {
        open(initial.page, initial.hash, { updateHistory: false, focusClose: false });
    }
}());
