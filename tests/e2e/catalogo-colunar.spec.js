import { test, expect } from '@playwright/test';

/**
 * O catalogo que o navegador baixa e agrupado **por campo**: o cabecalho uma
 * vez e, para cada campo, ou a lista de valores ou `{dic, idx}` com os valores
 * distintos e um indice por vaga.
 *
 * Com 204 mil vagas, o formato de objetos chega a 143 MB e 347 MB de heap num
 * celular emulado, patamar em que o navegador comeca a matar a aba. Agrupar
 * por campo em vez de por vaga tirou outros 28% do arquivo publicado, medidos
 * em 2026-08-30: 8,10 MB -> 5,78 MB no gzip, sem mudar um unico dado.
 *
 * Estes testes travam as duas pontas: o arquivo publicado e a reidratacao no
 * site. Ver .docs/specs/catalogo-agrupado-por-campo.md.
 */

/** Uma coluna e literal ou `{dic, idx}`. */
function expandir(coluna) {
    return Array.isArray(coluna) ? coluna : coluna.idx.map((i) => coluna.dic[i]);
}

test.describe('catalogo agrupado por campo', () => {
    test('o arquivo publicado tem uma coluna por campo, todas do mesmo tamanho', async ({ request }) => {
        const res = await request.get('/assets/data/json/catalog.json');
        expect(res.ok()).toBeTruthy();

        const corpo = await res.json();
        expect(Array.isArray(corpo.campos)).toBeTruthy();
        expect(Array.isArray(corpo.colunas)).toBeTruthy();
        expect(corpo.colunas).toHaveLength(corpo.campos.length);

        const tamanhos = new Set(corpo.colunas.map((c) => expandir(c).length));
        expect(tamanhos.size, 'colunas de tamanhos diferentes').toBe(1);
        expect([...tamanhos][0]).toBeGreaterThan(0);
    });

    test('todo indice de dicionario aponta para um valor existente', async ({ request }) => {
        const corpo = await (await request.get('/assets/data/json/catalog.json')).json();
        const comDicionario = corpo.colunas.filter((c) => !Array.isArray(c));
        expect(comDicionario.length, 'nenhuma coluna usou dicionario').toBeGreaterThan(0);

        for (const coluna of comDicionario) {
            const fora = coluna.idx.filter((i) => !Number.isInteger(i) || i < 0 || i >= coluna.dic.length);
            expect(fora, 'indice fora do dicionario').toEqual([]);
        }
    });

    test('o cabecalho traz os campos que a lista usa', async ({ request }) => {
        const corpo = await (await request.get('/assets/data/json/catalog.json')).json();
        // `inserted_date` esta aqui porque ja saiu do colunar uma vez, como
        // campo "que o site nao le". O site le: filtro "Adicionadas hoje",
        // intervalo "Obtida no Classifica Vagas", ordenacao por agregacao,
        // ponto de novidade e a linha de data da visao em lista. Sem ele os
        // cinco ficam mudos, e nenhum teste falhava.
        for (const campo of ['company', 'title', 'url', 'location', 'contract', 'category', 'inserted_date']) {
            expect(corpo.campos).toContain(campo);
        }
    });

    test('a data de agregacao chega preenchida', async ({ request }) => {
        const corpo = await (await request.get('/assets/data/json/catalog.json')).json();
        const coluna = expandir(corpo.colunas[corpo.campos.indexOf('inserted_date')]);
        expect(coluna.slice(0, 500).filter((v) => !v), 'vaga sem data de agregacao').toEqual([]);
    });

    test('o colunar e menor que o formato de objetos', async ({ request }) => {
        const colunar = await request.get('/assets/data/json/catalog.json');
        const objetos = await request.get('/assets/data/json/open_jobs.json');
        const tamanho = (r) => Number(r.headers()['content-length'] || 0);
        expect(tamanho(colunar)).toBeGreaterThan(0);
        expect(tamanho(colunar)).toBeLessThan(tamanho(objetos));
    });

    test('o colunar carrega sem cair no formato antigo', async ({ page }) => {
        // O worker que faz o parse validava `Array.isArray` e rejeitava o
        // colunar antes da reidratacao: o site baixava o novo, falhava, e
        // caia no antigo. Eram 27 MB em vez de 7,4, e nenhum teste pegou
        // porque o servidor local nao serve `.gz` e o caminho do worker nao
        // era exercitado.
        const baixados = [];
        page.on('response', (r) => {
            const nome = r.url().split('/').pop();
            if (/^(catalog|open_jobs|recent_jobs)\.json/.test(nome)) baixados.push(nome);
        });

        // `escopo=all`: o seletor abre no Brasil e aqui o alvo e o catalogo inteiro.
        await page.goto('/?escopo=all');
        await page.getByRole('link', { name: /Ver vagas/i }).click();
        await expect(page.locator('#splash')).toBeHidden({ timeout: 90000 });
        await expect(page.locator('.job-card').first()).toBeVisible({ timeout: 30000 });
        await page.waitForTimeout(2000);

        expect(baixados.some(n => n.startsWith('catalog.json'))).toBeTruthy();
        expect(baixados.filter(n => n.startsWith('open_jobs.json'))).toHaveLength(0);

        // Baixar o arquivo certo nao basta: a primeira versao deste teste
        // parava aqui e passou verde enquanto o catalogo completo nunca
        // entrava, porque o erro acontecia depois do download. O que prova a
        // carga e a lista deixar de mostrar so as 2.000 recentes.
        await expect
            .poll(async () => {
                const texto = await page.locator('#jobCount').textContent();
                return Number((texto || '').replace(/\D/g, '')) || 0;
            }, { timeout: 90000 })
            .toBeGreaterThan(50000);
    });

    test('a lista reidrata as vagas com os campos certos', async ({ page }) => {
        // `escopo=all`: o seletor abre no Brasil e aqui o alvo e o catalogo inteiro.
        await page.goto('/?escopo=all');
        await page.getByRole('link', { name: /Ver vagas/i }).click();
        await expect(page.locator('#splash')).toBeHidden({ timeout: 90000 });
        await expect(page.locator('.job-card').first()).toBeVisible({ timeout: 30000 });

        // Titulo e empresa saem de campos distintos do cabecalho: se a
        // reidratacao trocasse a ordem, o cartao mostraria o valor errado.
        const cartao = page.locator('.job-card').first();
        await expect(cartao).toContainText(/\S/);
        const link = cartao.locator('a[href^="http"]').first();
        await expect(link).toHaveAttribute('href', /^https?:\/\//);
    });
});
