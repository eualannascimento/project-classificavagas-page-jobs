(function () {
    'use strict';

    const PAGES = {
        termos: { url: 'termos.html', title: 'Termos de Uso' },
        privacidade: { url: 'privacidade.html', title: 'Privacidade e LGPD' }
    };

    const panel = document.getElementById('legalPanel');
    if (!panel) return;

    const scrim = document.getElementById('legalScrim');
    const body = document.getElementById('legalPanelBody');
    const titleEl = document.getElementById('legalPanelTitle');
    const closeBtn = document.getElementById('closeLegalPanel');
    const tabTermos = document.getElementById('legalTabTermos');
    const tabPriv = document.getElementById('legalTabPrivacidade');

    const cache = Object.create(null);
    let currentPage = null;
    let lastFocus = null;
    let historyPushed = false;

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
            const resolved = resolveLegalPage(anchor.getAttribute('href'));
            if (!resolved) return;
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                open(resolved.page, resolved.hash, { push: true });
            });
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

    async function open(page, hash, { push = true } = {}) {
        if (!PAGES[page]) return;
        lastFocus = document.activeElement;
        currentPage = page;
        setTabsActive(page);

        panel.classList.remove('hidden');
        if (scrim) scrim.classList.remove('hidden');
        document.body.classList.add('legal-panel-open');
        panel.setAttribute('aria-hidden', 'false');
        if (closeBtn) closeBtn.focus();

        body.innerHTML = '<p class="legal-panel-loading">Carregando…</p>';
        if (titleEl) titleEl.textContent = PAGES[page].title;

        try {
            const content = await fetchPage(page);
            if (titleEl) titleEl.textContent = content.title;
            body.innerHTML = content.html;
            wirePanelLinks(body);
            scrollToHash(hash);
        } catch (_) {
            body.innerHTML = '<p class="legal-panel-error">Não foi possível carregar esta página. <a href="' + PAGES[page].url + '">Abrir em página completa</a>.</p>';
        }

        const newHash = hash || (page === 'termos' ? '#termos' : '#privacidade');
        if (push && window.location.hash !== newHash) {
            history.pushState({ cvLegalPanel: page }, '', newHash);
            historyPushed = true;
        }
    }

    function close({ fromHistory = false } = {}) {
        panel.classList.add('hidden');
        if (scrim) scrim.classList.add('hidden');
        document.body.classList.remove('legal-panel-open');
        panel.setAttribute('aria-hidden', 'true');
        currentPage = null;

        if (!fromHistory && historyPushed && window.location.hash) {
            history.back();
        } else if (!fromHistory && window.location.hash.match(/^#(termos|privacidade|remocao)$/)) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        historyPushed = false;

        if (lastFocus && typeof lastFocus.focus === 'function') {
            lastFocus.focus();
        }
    }

    function onDocumentClick(e) {
        const anchor = e.target.closest('a[href]');
        if (!anchor) return;
        const resolved = resolveLegalPage(anchor.getAttribute('href'));
        if (!resolved) return;
        e.preventDefault();
        open(resolved.page, resolved.hash, { push: true });
    }

    function onPopState() {
        const fromHash = hashToPage(window.location.hash);
        if (fromHash) {
            open(fromHash.page, fromHash.hash, { push: false });
            return;
        }
        if (!panel.classList.contains('hidden')) {
            close({ fromHistory: true });
        }
    }

    document.addEventListener('click', onDocumentClick);
    window.addEventListener('popstate', onPopState);

    if (closeBtn) closeBtn.addEventListener('click', () => close());
    if (scrim) scrim.addEventListener('click', () => close());
    if (tabTermos) tabTermos.addEventListener('click', () => open('termos', '', { push: true }));
    if (tabPriv) tabPriv.addEventListener('click', () => open('privacidade', '', { push: true }));

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || panel.classList.contains('hidden')) return;
        e.preventDefault();
        close();
    });

    const initial = hashToPage(window.location.hash);
    if (initial) {
        open(initial.page, initial.hash, { push: false });
    }
}());
