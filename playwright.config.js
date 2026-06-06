import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: 'tests/e2e',
    timeout: 120000,
    retries: 0,
    use: {
        baseURL: 'http://127.0.0.1:4173',
        headless: true
    },
    webServer: {
        command: 'python3 -m http.server 4173 --directory _site',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: false,
        timeout: 120000
    }
});
