import { test, expect } from '@playwright/test';

/**
 * A pagina A4 tem 297mm, mas 297mm a 96dpi da 1122,52px: o navegador arredonda
 * para 1123px, ou seja 297,13mm, e esse excesso de 0,13mm gera uma segunda
 * pagina em branco no Safari e no Firefox. A caixa de impressao precisa ficar
 * abaixo de 297mm com folga.
 */
test('a area de impressao do curriculo cabe em uma pagina A4', async ({ page }) => {
    await page.goto('/resume/');
    await page.waitForFunction(() => typeof EuGeroStorage !== 'undefined');

    await page.evaluate(() => {
        const character = EuGeroCharacters.CHARACTERS.find((c) => c.state);
        const state = JSON.parse(JSON.stringify(character.state));
        state.template = 'classic';
        EuGeroStorage.save(state);
    });

    await page.goto('/resume/#/review');
    await page.reload({ waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });

    const heightMm = await page.evaluate(() => {
        const el = document.getElementById('print-cv');
        const rect = el.getBoundingClientRect();
        return (Math.max(el.scrollHeight, rect.height) * 25.4) / 96;
    });

    expect(heightMm, 'a caixa de impressao nao pode alcancar 297mm').toBeLessThan(297);
});

test('conteudo que nao cabe continua inteiro em vez de ser cortado', async ({ page }) => {
    await page.goto('/resume/');
    await page.waitForFunction(() => typeof EuGeroStorage !== 'undefined');

    await page.evaluate(() => {
        const character = EuGeroCharacters.CHARACTERS.find((c) => c.state);
        const state = JSON.parse(JSON.stringify(character.state));
        state.template = 'classic';
        const base = state.experiences[0];
        state.experiences = Array.from({ length: 12 }, (_, i) => ({
            ...base,
            title: `CargoTeste${i + 1}`,
            description: 'Descricao longa repetida para forcar overflow. '.repeat(12)
        }));
        EuGeroStorage.save(state);
    });

    await page.goto('/resume/#/review');
    await page.reload({ waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });

    // Cortar o excedente esconderia experiencia do candidato sem ele perceber.
    const cargos = await page.evaluate(() => {
        const text = document.getElementById('print-cv').textContent || '';
        return new Set(text.match(/CargoTeste\d+/g) || []).size;
    });

    expect(cargos, 'nenhuma experiencia pode sumir da area de impressao').toBe(12);
});
