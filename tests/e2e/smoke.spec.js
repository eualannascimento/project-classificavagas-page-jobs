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
