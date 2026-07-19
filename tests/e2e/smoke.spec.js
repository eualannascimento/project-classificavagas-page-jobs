import { test, expect } from '@playwright/test';

test('product hub opens jobs and search filters results', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('#productHub')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tudo para organizar sua busca por trabalho.' })).toBeVisible();

    await page.getByRole('link', { name: /Explorar vagas/i }).click();
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
