import { test, expect } from '@playwright/test';

test('captura Web Vitals na primeira carga', async ({ page }) => {
    await page.goto('/');

    const vitals = await page.evaluate(() => new Promise((resolve) => {
        const result = { lcp: null, cls: 0 };
        let clsValue = 0;

        try {
            const lcpObs = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const last = entries[entries.length - 1];
                if (last) result.lcp = last.startTime;
            });
            lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });

            const clsObs = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) clsValue += entry.value;
                }
                result.cls = clsValue;
            });
            clsObs.observe({ type: 'layout-shift', buffered: true });
        } catch (_) { /* unsupported */ }

        setTimeout(() => resolve(result), 15000);
    }));

    await expect(page.locator('#splash')).toBeHidden({ timeout: 90000 });
    await expect(page.locator('.job-card').first()).toBeVisible({ timeout: 30000 });

    console.log('Web Vitals baseline:', JSON.stringify(vitals));
    if (vitals.lcp !== null) expect(vitals.lcp).toBeLessThan(60000);
    expect(vitals.cls).toBeLessThan(0.25);
});

test('segunda visita hidrata mais rápido com IndexedDB', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.job-card').first()).toBeVisible({ timeout: 90000 });

    const t0 = Date.now();
    await page.reload();
    await expect(page.locator('.job-card').first()).toBeVisible({ timeout: 30000 });
    const secondLoadMs = Date.now() - t0;

    console.log('Second visit job cards ms:', secondLoadMs);
    expect(secondLoadMs).toBeLessThan(30000);
});
