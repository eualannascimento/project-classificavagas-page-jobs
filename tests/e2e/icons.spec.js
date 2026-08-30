import { test, expect } from '@playwright/test';

/**
 * Os icones deixaram de vir de uma fonte de 407 KB e passaram a vir de um
 * sprite <symbol> embutido no HTML. A troca tem um modo de falha silencioso:
 * um <use href="#i-x"> sem simbolo correspondente nao gera erro nenhum, o icone
 * so nao aparece.
 *
 * A varredura estatica de scripts/build-icons.py nao alcanca todo nome montado
 * em tempo de execucao (`#i-${info.icon}`). Este teste fecha a lacuna pelo outro
 * lado: percorre o DOM ja renderizado, depois de exercitar os tres modos de
 * visualizacao, e cobra que toda referencia resolva.
 */

async function abrirComVagas(page) {
    await page.goto('/');
    // A raiz abre no hub de produtos; a lista de vagas vem depois do clique.
    await page.getByRole('link', { name: /Ver vagas/i }).click();
    await expect(page.locator('#splash')).toBeHidden({ timeout: 90000 });
    await expect(page.locator('.job-card').first()).toBeVisible({ timeout: 30000 });
}

async function referenciasOrfas(page) {
    return page.evaluate(() => {
        const usos = [...document.querySelectorAll('use[href^="#i-"]')];
        const orfas = usos
            .map((u) => u.getAttribute('href'))
            .filter((href) => !document.getElementById(href.slice(1)));
        return [...new Set(orfas)];
    });
}

test('todo icone referenciado tem simbolo, nos tres modos de visualizacao', async ({ page }) => {
    await abrirComVagas(page);

    expect(await referenciasOrfas(page), 'modo inicial').toEqual([]);

    // O botao alterna entre cartoes, lista e compacto. Cada modo desenha um
    // conjunto diferente de icones, e o proprio botao troca de icone.
    for (const passo of [1, 2, 3]) {
        await page.locator('#viewToggle').click();
        await page.waitForTimeout(400);
        expect(await referenciasOrfas(page), `apos ${passo} troca(s) de modo`).toEqual([]);
    }
});

/**
 * O painel de filtros so existe no DOM depois de aberto, e cada secao desenha
 * o proprio icone. Enquanto este teste olhava apenas a lista, o icone da secao
 * "Obtida no Classifica Vagas" ficou ausente do sprite sem que nada falhasse:
 * a varredura estatica nao via o nome (vinha como argumento posicional) e o
 * teste de DOM nunca abria a gaveta onde ele aparece.
 */
test('todo icone do painel de filtros tem simbolo', async ({ page }) => {
    await abrirComVagas(page);

    await page.locator('#openFilters').click();
    await expect(page.locator('#filterSheet')).toBeVisible();
    // Cada cabecalho de secao traz um icone proprio; sem eles nao ha o que checar.
    await expect(page.locator('#filterSheetContent .filter-section-header').first()).toBeVisible();

    expect(await referenciasOrfas(page), 'painel de filtros aberto').toEqual([]);

    // As secoes recolhidas tambem desenham icone quando abertas.
    const cabecalhos = page.locator('#filterSheetContent .filter-section-header');
    const total = await cabecalhos.count();
    for (let i = 0; i < total; i += 1) {
        await cabecalhos.nth(i).click();
        await page.waitForTimeout(120);
    }

    expect(await referenciasOrfas(page), 'secoes de filtro expandidas').toEqual([]);
});

test('nenhum icone fica sem tamanho na tela', async ({ page }) => {
    await abrirComVagas(page);

    const semTamanho = await page.evaluate(() => {
        return [...document.querySelectorAll('svg.material-symbols-rounded')]
            .filter((svg) => {
                if (!svg.getClientRects().length) return false; // fora da tela, tudo bem
                const r = svg.getBoundingClientRect();
                return r.width === 0 || r.height === 0;
            })
            .map((svg) => svg.querySelector('use')?.getAttribute('href') || '(sem use)');
    });

    expect(semTamanho, 'icone visivel com largura ou altura zero').toEqual([]);
});

/**
 * Este teste existe por causa de um erro real: a fonte guarda o contorno com o
 * eixo Y para cima e o SVG desenha com o Y para baixo. Sem o `scale(1,-1)` o
 * desenho caia inteiro fora do viewBox, e todos os icones ficavam do tamanho
 * certo, no lugar certo, em branco. Os testes de referencia e de tamanho
 * passavam: nenhum deles olha o que foi pintado.
 *
 * A checagem rasteriza cada simbolo num canvas e conta pixels opacos.
 */
test('cada icone pinta pixels de verdade', async ({ page }) => {
    await abrirComVagas(page);

    const vazios = await page.evaluate(async () => {
        const LADO = 48;
        const vazios = [];
        for (const simbolo of document.querySelectorAll('symbol[id^="i-"]')) {
            const markup =
                `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}" ` +
                `viewBox="${simbolo.getAttribute('viewBox')}">${simbolo.innerHTML}</svg>`;
            const img = new Image();
            await new Promise((ok, erro) => {
                img.onload = ok;
                img.onerror = erro;
                img.src = 'data:image/svg+xml;base64,' + btoa(markup);
            });
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = LADO;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dados = ctx.getImageData(0, 0, LADO, LADO).data;
            let opacos = 0;
            for (let i = 3; i < dados.length; i += 4) {
                if (dados[i] > 16) opacos += 1;
            }
            // Um icone de 48x48 pinta centenas de pixels. Menos de 20 so
            // acontece quando o desenho nao entrou no viewBox.
            if (opacos < 20) vazios.push(`${simbolo.id} (${opacos}px)`);
        }
        return vazios;
    });

    expect(vazios, 'icone que nao pinta nada').toEqual([]);
});

test('a fonte de icones nao e mais baixada', async ({ page }) => {
    const pedidos = [];
    page.on('request', (req) => pedidos.push(req.url()));

    await abrirComVagas(page);

    const fonteDeIcones = pedidos.filter((url) => url.includes('material-symbols'));
    expect(fonteDeIcones, 'a fonte de 407 KB nao pode voltar ao carregamento').toEqual([]);

    // E o formato antigo nao pode reaparecer por um caminho novo.
    const spans = await page.locator('span.material-symbols-rounded').count();
    expect(spans, 'nenhum <span> de fonte de icone deve sobrar').toBe(0);
});
