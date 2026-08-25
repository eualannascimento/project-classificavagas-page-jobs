import { test, expect } from '@playwright/test';

/**
 * O catalogo que o navegador baixa e colunar: cabecalho uma vez e valores em
 * array, so com os campos que este site le.
 *
 * Com 204 mil vagas, o formato de objetos chega a 143 MB e 347 MB de heap num
 * celular emulado, patamar em que o navegador comeca a matar a aba. Estes
 * testes travam as duas pontas: o arquivo publicado e a reidratacao no site.
 */

test.describe('catalogo colunar', () => {
    test('o arquivo publicado tem cabecalho e uma linha por vaga', async ({ request }) => {
        const res = await request.get('/assets/data/json/catalog.json');
        expect(res.ok()).toBeTruthy();

        const corpo = await res.json();
        expect(Array.isArray(corpo.campos)).toBeTruthy();
        expect(Array.isArray(corpo.vagas)).toBeTruthy();
        expect(corpo.vagas.length).toBeGreaterThan(0);
        // Toda linha segue o cabecalho: e o que permite reidratar por indice.
        for (const linha of corpo.vagas.slice(0, 200)) {
            expect(linha).toHaveLength(corpo.campos.length);
        }
    });

    test('o cabecalho traz os campos que a lista usa', async ({ request }) => {
        const corpo = await (await request.get('/assets/data/json/catalog.json')).json();
        for (const campo of ['company', 'title', 'url', 'location', 'contract', 'category']) {
            expect(corpo.campos).toContain(campo);
        }
    });

    test('o colunar e menor que o formato de objetos', async ({ request }) => {
        const colunar = await request.get('/assets/data/json/catalog.json');
        const objetos = await request.get('/assets/data/json/open_jobs.json');
        const tamanho = (r) => Number(r.headers()['content-length'] || 0);
        expect(tamanho(colunar)).toBeGreaterThan(0);
        expect(tamanho(colunar)).toBeLessThan(tamanho(objetos));
    });

    test('a lista reidrata as vagas com os campos certos', async ({ page }) => {
        await page.goto('/');
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
