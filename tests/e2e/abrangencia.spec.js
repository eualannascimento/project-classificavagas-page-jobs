import { test, expect } from '@playwright/test';

/**
 * Seletor de abrangencia.
 *
 * O catalogo virou 54% internacional e `location_scope` era um filtro entre
 * oito, escondido na mesma lista que Ramo, Nivel e Categoria. Agora ele e a
 * primeira decisao da pagina, acima da busca, com Brasil como padrao.
 *
 * `NAO IDENTIFICADO` sao 19% do catalogo e nao cabem nem em Brasil nem em
 * Mundo, por isso existe um terceiro modo em vez de escondê-las.
 */

async function abrirVagas(page) {
    await page.goto('/');
    await page.getByRole('link', { name: /Ver vagas/i }).click();
    await expect(page.locator('#splash')).toBeHidden({ timeout: 90000 });
    await expect(page.locator('.job-card').first()).toBeVisible({ timeout: 30000 });
    const aviso = page.locator('#privacyNoticeDismiss');
    if (await aviso.isVisible().catch(() => false)) {
        await aviso.click();
    }
}

const SELETOR = '#scopeSwitch';
const opcao = (page, escopo) => page.locator(`${SELETOR} .scope-option[data-scope="${escopo}"]`);

/**
 * A gaveta de filtros abre e fecha com transicao, e o scrim cobre a tela
 * enquanto ela anda. Clicar no proximo alvo sem esperar o fim deixava a secao
 * ja no DOM e ainda invisivel: foi assim que este arquivo falhou uma vez em
 * `main` (2026-08-30) e passou nas outras duas execucoes do mesmo codigo.
 *
 * Estas duas funcoes esperam o estado assentar antes de devolver o controle.
 */
async function abrirFiltros(page) {
    await page.locator('#openFilters').click();
    await expect(page.locator('#filterSheet')).toBeVisible();
    await expect(page.locator('#filterSheetContent')).not.toBeEmpty();
}

async function fecharFiltros(page) {
    await page.keyboard.press('Escape');
    await expect(page.locator('#filterSheet')).toBeHidden();
    await expect(page.locator('#scrim')).toBeHidden();
}

test.describe('seletor de abrangencia', () => {
    test('aparece acima da busca e comeca no Brasil', async ({ page }) => {
        await abrirVagas(page);
        await expect(page.locator(SELETOR)).toBeVisible();
        await expect(opcao(page, 'br')).toHaveAttribute('aria-pressed', 'true');
        await expect(opcao(page, 'world')).toHaveAttribute('aria-pressed', 'false');
    });

    test('trocar de modo muda o conjunto de vagas', async ({ page }) => {
        await abrirVagas(page);
        const contar = async () => {
            await expect.poll(async () => page.locator('.job-card').count()).toBeGreaterThan(0);
            return (await page.locator('#jobCount').textContent()) || '';
        };
        const brasil = await contar();
        await opcao(page, 'world').click();
        await expect(opcao(page, 'world')).toHaveAttribute('aria-pressed', 'true');
        await expect.poll(async () => (await page.locator('#jobCount').textContent()) || '')
            .not.toBe(brasil);
    });

    test('o modo escolhido entra na URL e volta ao ser aberta', async ({ page }) => {
        await abrirVagas(page);
        await opcao(page, 'all').click();
        await expect(opcao(page, 'all')).toHaveAttribute('aria-pressed', 'true');

        await page.goto('/?escopo=world#vagas');
        await expect(page.locator('#splash')).toBeHidden({ timeout: 90000 });
        await expect(opcao(page, 'world')).toHaveAttribute('aria-pressed', 'true');
    });

    test('estado e cidade so aparecem no modo Brasil', async ({ page }) => {
        await abrirVagas(page);
        await abrirFiltros(page);
        await expect(page.locator('.filter-section[data-key="location_state"]')).toBeVisible();
        await fecharFiltros(page);

        await opcao(page, 'world').click();
        await expect(opcao(page, 'world')).toHaveAttribute('aria-pressed', 'true');

        await abrirFiltros(page);
        await expect(page.locator('.filter-section[data-key="location_state"]')).toHaveCount(0);
        await expect(page.locator('.filter-section[data-key="location_city"]')).toHaveCount(0);
        // Categoria continua la: ela vale nos dois modos.
        await expect(page.locator('.filter-section[data-key="category"]')).toBeVisible();
    });

    test('abrangencia deixou de ser um filtro na folha de filtros', async ({ page }) => {
        await abrirVagas(page);
        await abrirFiltros(page);
        await expect(page.locator('.filter-section[data-key="location_scope"]')).toHaveCount(0);
    });
});
