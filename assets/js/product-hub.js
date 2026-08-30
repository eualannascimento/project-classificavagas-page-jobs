(() => {
    'use strict';

    const isJobsRoute = () => {
        const params = new URLSearchParams(window.location.search);
        return window.location.hash === '#vagas' || params.has('q');
    };

    const applyRoute = () => {
        const route = isJobsRoute() ? 'vagas' : 'home';
        document.documentElement.dataset.route = route;

        if (document.body) {
            const isHome = route === 'home';
            document.body.classList.toggle('hub-active', isHome);
            document.getElementById('productHub')?.toggleAttribute('hidden', !isHome);
            document.getElementById('app')?.setAttribute('aria-hidden', String(isHome));
        }

        document.dispatchEvent(new CustomEvent('classificavagas:routechange', { detail: { route } }));
    };

    /**
     * O cartao de vagas descrevia o servico sem dizer o tamanho dele, e a home
     * so ocupava a metade de cima da tela. O manifesto do catalogo tem 299
     * bytes e ja e publicado ao lado do catalogo: da para responder "tem vaga
     * aqui?" antes do primeiro clique, sem tocar nos 8 MB do catalogo.
     *
     * Falha em silencio de proposito: o paragrafo nasce `hidden` e so aparece
     * quando ha numero para mostrar.
     */
    const MANIFEST_URL = 'assets/data/json/catalog_manifest.json';

    const mostrarEscala = async () => {
        const alvo = document.getElementById('hubJobsScale');
        if (!alvo || alvo.dataset.preenchido === 'true') return;

        try {
            const resposta = await fetch(MANIFEST_URL, { cache: 'no-cache' });
            if (!resposta.ok) return;

            const manifesto = await resposta.json();
            const vagas = Number(manifesto.jobs_count);
            const empresas = Number(manifesto.published_companies_count);
            if (!Number.isFinite(vagas) || vagas <= 0) return;

            const numero = (n) => n.toLocaleString('pt-BR');
            alvo.textContent = Number.isFinite(empresas) && empresas > 0
                ? `${numero(vagas)} vagas abertas de ${numero(empresas)} empresas`
                : `${numero(vagas)} vagas abertas`;
            alvo.dataset.preenchido = 'true';
            alvo.hidden = false;
        } catch (_) {
            /* sem numero, o cartao segue como estava */
        }
    };

    applyRoute();
    window.addEventListener('hashchange', applyRoute);
    document.addEventListener('DOMContentLoaded', () => {
        applyRoute();
        mostrarEscala();
    });
})();
