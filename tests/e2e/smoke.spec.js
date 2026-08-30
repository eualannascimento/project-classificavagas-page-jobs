import { test, expect } from '@playwright/test';

test('product hub opens jobs and search filters results', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('#productHub')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sua carreira, sem complicação.' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.fonts.check('600 24px "Barlow Condensed"'))).toBeTruthy();

    await page.getByRole('link', { name: /Ver vagas/i }).click();
    await expect(page.locator('#splash')).toBeHidden({ timeout: 90000 });
    await expect(page.locator('.job-card').first()).toBeVisible({ timeout: 30000 });

    const initialCountText = await page.locator('#jobCount').textContent();
    expect(initialCountText || '').toMatch(/\d/);

    await page.locator('#searchInput').fill('engenheiro');
    await page.waitForTimeout(500);

    await expect(page.locator('#searchInput')).toHaveValue('engenheiro');

    const hasCards = await page.locator('.job-card').count();
    const emptyVisible = await page.locator('#emptyState:not(.hidden)').isVisible();
    expect(hasCards > 0 || emptyVisible).toBeTruthy();

    await page.locator('#brandLink').click();
    await expect(page.locator('#productHub')).toBeVisible();
});

test('product hub preserves the curriculum typography and mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.locator('#productHub')).toBeVisible();
    await expect(page.locator('.product-card')).toHaveCount(2);

    const layout = await page.evaluate(() => {
        const title = document.querySelector('#hubTitle');
        const titleStyle = window.getComputedStyle(title);
        const cards = Array.from(document.querySelectorAll('.product-card'));

        return {
            fontFamily: titleStyle.fontFamily,
            fontWeight: titleStyle.fontWeight,
            pageWidth: document.documentElement.clientWidth,
            contentWidth: document.documentElement.scrollWidth,
            cardWidths: cards.map((card) => Math.round(card.getBoundingClientRect().width))
        };
    });

    expect(layout.fontFamily).toContain('Barlow Condensed');
    expect(layout.fontWeight).toBe('600');
    expect(layout.contentWidth).toBe(layout.pageWidth);
    expect(layout.cardWidths).toHaveLength(2);
    expect(layout.cardWidths[0]).toBe(layout.cardWidths[1]);
});

test('legal links open and offer document switching', async ({ page }) => {
    await page.goto('/');

    const termsLink = page.locator('#productHub a[href="termos.html"]');
    expect(await termsLink.count()).toBe(1);
    await termsLink.click();

    await expect(page).toHaveURL(/termos\.html/);
    const termsSwitcher = page.locator('.legal-document-switcher');
    await expect(termsSwitcher.getByRole('link', { name: 'Termos', exact: true })).toBeVisible();
    await expect(termsSwitcher.getByRole('link', { name: 'Privacidade/LGPD', exact: true })).toBeVisible();

    await page.goto('/privacidade.html');
    const privacySwitcher = page.locator('.legal-document-switcher');
    await expect(privacySwitcher.getByRole('link', { name: 'Termos', exact: true })).toBeVisible();
    await expect(privacySwitcher.getByRole('link', { name: 'Privacidade/LGPD', exact: true })).toBeVisible();
});

test('vacancies header keeps two mobile rows and theme toggle works', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#vagas');
  await expect(page.locator('#splash')).toBeHidden();

  const headerLayout = await page.evaluate(() => {
        const mark = document.querySelector('.brand-mark').getBoundingClientRect();
        const meta = document.querySelector('.brand-meta').getBoundingClientRect();
        const count = document.querySelector('.brand-meta-count').getBoundingClientRect();
        const update = document.querySelector('.brand-meta-update').getBoundingClientRect();
        return { markBottom: mark.bottom, metaTop: meta.top, countTop: count.top, updateTop: update.top };
    });

    expect(headerLayout.metaTop).toBeGreaterThan(headerLayout.markBottom - 1);
    expect(Math.abs(headerLayout.countTop - headerLayout.updateTop)).toBeLessThan(3);

    const themeToggle = page.locator('#themeToggle');
    expect(await themeToggle.count()).toBe(1);
    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await themeToggle.click();
    const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(after).not.toBe(before);
});

test('toast does not overlap the privacy notice on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // O aviso vive na tela de vagas, nao no hub.
    await page.getByRole('link', { name: /Ver vagas/i }).click();
    await expect(page.locator('#splash')).toBeHidden({ timeout: 90000 });

    const notice = page.locator('#privacyNotice');
    await expect(notice).toBeVisible();

    // Reproduz o toast real: mesma classe e mesmo ciclo de vida de utils.showToast.
    await page.evaluate(() => {
        const toast = document.createElement('div');
        toast.className = 'theme-toast';
        toast.textContent = 'Catálogo completo atualizado';
        document.body.appendChild(toast);
        toast.classList.add('visible');
    });

    const toast = page.locator('.theme-toast');
    await expect(toast).toBeVisible();

    const noticeBox = await notice.boundingBox();
    const toastBox = await toast.boundingBox();

    const overlaps = !(
        noticeBox.y + noticeBox.height <= toastBox.y
        || toastBox.y + toastBox.height <= noticeBox.y
        || noticeBox.x + noticeBox.width <= toastBox.x
        || toastBox.x + toastBox.width <= noticeBox.x
    );

    expect(overlaps, 'toast e aviso de privacidade nao podem se sobrepor').toBe(false);
});

/**
 * A home descrevia o servico sem dizer o tamanho dele, e o rodape colava nos
 * cartoes: numa janela de 1280x800 sobravam ~340px em branco embaixo. O
 * numero vem do manifesto do catalogo, 299 bytes, e nao dos 8 MB do catalogo.
 */
test('a home mostra a escala do catalogo e ocupa a altura da tela', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const escala = page.locator('#hubJobsScale');
    await expect(escala).toBeVisible();
    await expect(escala).toHaveText(/\d[\d.]* vagas abertas/);

    const medidas = await page.evaluate(() => {
        const rodape = document.querySelector('.hub-footer').getBoundingClientRect();
        return { rodapeBase: rodape.bottom, altura: window.innerHeight };
    });
    // O rodape ancora o fim da tela em vez de subir junto com os cartoes.
    expect(medidas.rodapeBase).toBeGreaterThan(medidas.altura * 0.8);
});

/**
 * Ordenacao, visualizacao e visualizadas ficavam so com o icone no celular:
 * tres simbolos anonimos em sequencia, sem dizer em que modo a lista estava.
 */
test('os chips da barra de filtros carregam rotulo visivel no celular', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('link', { name: /Ver vagas/i }).click();
    await expect(page.locator('#splash')).toBeHidden({ timeout: 90000 });
    await expect(page.locator('.job-card').first()).toBeVisible({ timeout: 30000 });

    await expect(page.locator('#openFilters')).toContainText(/Filtros/i);
    await expect(page.locator('#sortToggle .sort-label')).toBeVisible();
    await expect(page.locator('#viewToggle .view-label')).toBeVisible();
    await expect(page.locator('#visitedToggle .visited-label')).toBeVisible();

    // O botao relata o modo atual; o rotulo acessivel diz para onde o toque leva.
    await expect(page.locator('#viewToggle .view-label')).toHaveText('Cartões');
    await expect(page.locator('#viewToggle')).toHaveAttribute('aria-label', /Alternar para lista/);

    await page.locator('#viewToggle').click();
    await expect(page.locator('#viewToggle .view-label')).toHaveText('Lista');
});

/**
 * A tipografia de apoio (localizacao, datas, contador) estava entre 9,28px e
 * 10,56px. A data do cartao, a menor delas, e a que mais se le.
 */
test('nenhum texto de apoio do cartao fica abaixo de 11px', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Ver vagas/i }).click();
    await expect(page.locator('#splash')).toBeHidden({ timeout: 90000 });
    await expect(page.locator('.job-card').first()).toBeVisible({ timeout: 30000 });

    const menores = await page.evaluate(() => {
        const alvos = ['.job-date-line', '.job-date-line strong', '.job-location', '.results-counter'];
        return alvos
            .map((sel) => {
                const el = document.querySelector(sel);
                return el ? { sel, px: parseFloat(getComputedStyle(el).fontSize) } : null;
            })
            .filter((x) => x && x.px < 11);
    });

    expect(menores, 'texto de apoio abaixo do piso de 11px').toEqual([]);
});
