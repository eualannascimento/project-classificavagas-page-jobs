import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage sem violações críticas de acessibilidade', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#splash')).toBeHidden({ timeout: 90000 });
    await expect(page.locator('.job-card').first()).toBeVisible({ timeout: 30000 });

    const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    console.log('Axe violations:', results.violations.length, 'critical/serious:', critical.length);
    if (critical.length) {
        console.log(JSON.stringify(critical.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), null, 2));
    }
    expect(critical).toEqual([]);
});
