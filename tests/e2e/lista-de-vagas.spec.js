import { test, expect } from '@playwright/test';

/**
 * Cobertura da lista de vagas: ordenacao, modos de visualizacao, filtros,
 * rolagem infinita e marcacao de visitadas.
 *
 * Estes caminhos concentram a maior parte das 4.543 linhas de
 * `assets/js/scripts.js` e nao tinham nenhum teste. Sem eles, dividir o arquivo
 * seria uma reescrita as cegas: qualquer regressao so apareceria em producao,
 * porque o unico teste que passava por aqui conferia busca e contagem.
 *
 * Os testes descrevem comportamento observavel, nao estrutura interna, de
 * proposito: eles precisam continuar valendo depois que o arquivo for dividido.
 */

async function abrirVagas(page) {
    await page.goto('/');
    await page.getByRole('link', { name: /Ver vagas/i }).click();
    await expect(page.locator('#splash')).toBeHidden({ timeout: 90000 });
    await expect(page.locator('.job-card').first()).toBeVisible({ timeout: 30000 });
    // O aviso de privacidade cobre a barra inferior e atrapalha cliques.
    const aviso = page.locator('#privacyNoticeDismiss');
    if (await aviso.isVisible().catch(() => false)) {
        await aviso.click();
    }
    // A pagina mostra primeiro as vagas recentes (2.000) e so depois o catalogo
    // inteiro. Sem esperar a troca, a contagem lida e a do lote parcial e o
    // teste compara numeros de momentos diferentes.
    await expect
        .poll(async () => contagem(await page.locator('#jobCount').textContent()), { timeout: 60000 })
        .toBeGreaterThan(50000);
}

// A empresa nao tem classe propria: e o <p> dentro de .job-card-title.
const EMPRESA = '.job-card .job-card-title p';

// #jobCount mostra dois numeros quando ha filtro ("4.509 de 76.199"), entao
// juntar todos os digitos daria 450976199. O que vale e o primeiro.
function contagem(texto) {
    const primeiro = ((texto || '').match(/[\d.]+/) || [''])[0].replace(/\D/g, '');
    return primeiro ? Number(primeiro) : 0;
}

test('a ordenacao muda a primeira vaga da lista e sobrevive ao recarregar', async ({ page }) => {
    await abrirVagas(page);

    const primeiraAntes = await page.locator('.job-card').first().textContent();

    await page.locator('#sortToggle').click();
    // No desktop quem abre e o #sortDropdown; o #sortSheet e o equivalente de
    // celular e fica escondido. Sem escopo, o primeiro casamento cai no
    // escondido e o teste espera para sempre.
    const opcoes = page.locator('#sortDropdown [data-sort]');
    await expect(opcoes.first()).toBeVisible({ timeout: 10000 });

    // "Empresa A-Z" e deterministico: da para conferir o resultado, e nao so
    // que alguma coisa mudou.
    // Pelo valor do data-sort, e nao pelo texto: o rotulo e conteudo de
    // interface e pode mudar sem que o comportamento mude.
    await page.locator('#sortDropdown [data-sort="company_asc"]').click({ force: true });
    await page.waitForTimeout(1200);

    const empresas = await page.locator(EMPRESA).allTextContents();
    expect(empresas.length, 'sem empresas nao da para conferir ordem').toBeGreaterThan(5);
    const ordenadas = [...empresas].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    expect(empresas.slice(0, 10), 'as primeiras vagas devem vir em ordem alfabetica')
        .toEqual(ordenadas.slice(0, 10));

    const primeiraDepois = await page.locator('.job-card').first().textContent();
    expect(primeiraDepois).not.toBe(primeiraAntes);

    // A escolha fica guardada: recarregar nao pode voltar para o padrao. A
    // comparacao e pela empresa, nao pelo texto inteiro do card: o card mostra
    // data relativa, que muda sozinha.
    const empresaDepois = empresas[0];
    await page.reload();
    await expect(page.locator('.job-card').first()).toBeVisible({ timeout: 30000 });
    const empresaRecarregada = await page.locator(EMPRESA).first().textContent();
    expect(empresaRecarregada, 'a ordenacao escolhida tem que sobreviver ao recarregar')
        .toBe(empresaDepois);
});

test('os tres modos de visualizacao trocam o layout e voltam ao inicio', async ({ page }) => {
    await abrirVagas(page);

    const classesPorModo = [];
    for (let i = 0; i < 4; i += 1) {
        classesPorModo.push(await page.locator('#jobsGrid').getAttribute('class'));
        await page.locator('#viewToggle').click();
        await page.waitForTimeout(500);
    }

    const distintos = new Set(classesPorModo.slice(0, 3));
    expect(distintos.size, 'cada modo precisa de um layout proprio').toBe(3);
    expect(classesPorModo[3], 'o quarto clique volta ao primeiro modo').toBe(classesPorModo[0]);

    // Em todos os modos tem que haver vaga na tela: ja aconteceu de um modo
    // renderizar vazio sem nenhum erro.
    for (let i = 0; i < 3; i += 1) {
        await page.locator('#viewToggle').click();
        await page.waitForTimeout(500);
        const visiveis = await page.locator('#jobsGrid > *').count();
        expect(visiveis, 'nenhum modo pode ficar sem vagas').toBeGreaterThan(0);
    }
});

test('filtro reduz o total, aparece como chip e some ao limpar', async ({ page }) => {
    await abrirVagas(page);

    const totalInicial = contagem(await page.locator('#jobCount').textContent());
    expect(totalInicial).toBeGreaterThan(1000);

    await page.locator('#openFilters').click();
    await expect(page.locator('#filterSheet')).toBeVisible({ timeout: 10000 });

    // As secoes chegam fechadas, e a primeira e a de filtros rapidos, que tem
    // comportamento proprio. A escolhida aqui e uma faceta de verdade.
    const secao = page.locator('#filterSheetContent .filter-section:not([data-key="_quick"])').first();
    await secao.locator('.filter-section-header').click();
    await page.waitForTimeout(500);
    const opcao = secao.locator('.filter-option-chip, [data-filter-value], input[type="checkbox"]').first();
    await expect(opcao).toBeVisible({ timeout: 10000 });
    await opcao.click({ force: true });

    const aplicar = page.locator('#sheetApplyFilters');
    if (await aplicar.isVisible().catch(() => false)) {
        await aplicar.click();
    }
    await page.waitForTimeout(1200);

    const totalFiltrado = contagem(await page.locator('#jobCount').textContent());
    expect(totalFiltrado, 'o filtro precisa reduzir o total').toBeLessThan(totalInicial);
    expect(totalFiltrado, 'e nao pode zerar a lista').toBeGreaterThan(0);

    await expect(page.locator('#activeFiltersList > *').first()).toBeVisible();

    await page.locator('#clearAllFilters').click();
    await page.waitForTimeout(900);
    expect(contagem(await page.locator('#jobCount').textContent()),
        'limpar tem que devolver o total original').toBe(totalInicial);
});

test('a rolagem carrega mais vagas sem duplicar as que ja estavam na tela', async ({ page }) => {
    await abrirVagas(page);

    const chaves = (nos) => nos.map((n) => n.dataset.url || n.dataset.id || '');
    const idsIniciais = await page.locator('.job-card').evaluateAll(chaves);
    expect(idsIniciais.length).toBeGreaterThan(0);

    for (let i = 0; i < 3; i += 1) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1200);
    }

    const idsDepois = await page.locator('.job-card').evaluateAll(chaves);

    expect(idsDepois.length, 'rolar ate o fim precisa trazer mais vagas')
        .toBeGreaterThan(idsIniciais.length);
    expect(new Set(idsDepois).size, 'nenhuma vaga pode aparecer duas vezes')
        .toBe(idsDepois.length);
});

test('abrir uma vaga marca como visitada e o contador sobrevive ao recarregar', async ({ page }) => {
    await abrirVagas(page);

    const antes = contagem(await page.locator('#visitedCount').textContent());

    // O card e um <article> com um link esticado por cima, que abre a fonte
    // oficial em outra aba. Clicar no article nao dispara nada: quem marca a
    // vaga como visitada e o link.
    //
    // A navegacao e barrada antes do clique para o teste nao virar uma corrida
    // com a aba nova. O clique continua sendo um clique de verdade, disparado
    // pelo navegador: o que muda e so o destino.
    await page.evaluate(() => {
        document.querySelectorAll('.job-card a').forEach((a) => {
            a.addEventListener('click', (evento) => evento.preventDefault());
        });
    });
    // Pelo link do titulo, e nao pelo esticado: o esticado cobre o card inteiro
    // por baixo do conteudo e o Playwright nao o considera clicavel.
    await page.locator('.job-card .job-card-title-link').first().click();
    await page.waitForTimeout(1000);

    const depois = contagem(await page.locator('#visitedCount').textContent());
    expect(depois, 'abrir uma vaga precisa contar como visitada').toBe(antes + 1);

    await page.reload();
    await expect(page.locator('.job-card').first()).toBeVisible({ timeout: 30000 });
    expect(contagem(await page.locator('#visitedCount').textContent()),
        'a marcacao fica no aparelho e sobrevive ao recarregar').toBe(depois);

    // E o filtro de visitadas precisa mostrar exatamente o que foi aberto.
    await page.locator('#visitedToggle').click();
    await page.waitForTimeout(1200);
    expect(await page.locator('.job-card').count(),
        'o filtro de visitadas mostra so as vagas abertas').toBe(depois);
});
