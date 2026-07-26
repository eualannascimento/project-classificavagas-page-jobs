import { test, expect } from '@playwright/test';

/**
 * `style-src 'self'` (sem 'unsafe-inline') tem um modo de falha silencioso na
 * pagina: o navegador descarta o estilo, o elemento aparece sem ele e nada
 * quebra de forma obvia. A denuncia so aparece no console.
 *
 * Estes testes cobram o console limpo com a pagina em uso, o que o gate
 * estatico nao consegue: ele le o codigo, nao o que foi executado.
 */

async function abrirComVagas(page) {
    await page.goto('/');
    await page.getByRole('link', { name: /Ver vagas/i }).click();
    await expect(page.locator('#splash')).toBeHidden({ timeout: 90000 });
    await expect(page.locator('.job-card').first()).toBeVisible({ timeout: 30000 });
}

function coletarViolacoes(page) {
    const violacoes = [];
    page.on('console', (msg) => {
        const texto = msg.text();
        // O aviso de frame-ancestors via <meta> e esperado e nao e violacao:
        // a diretiva so vale por cabecalho HTTP, e o GitHub Pages nao permite
        // cabecalhos proprios.
        if (/Content Security Policy/i.test(texto) && !/frame-ancestors/.test(texto)) {
            violacoes.push(texto);
        }
    });
    return violacoes;
}

test('nenhuma violacao de CSP com a lista de vagas em uso', async ({ page }) => {
    const violacoes = coletarViolacoes(page);

    await abrirComVagas(page);
    await page.locator('#searchInput').fill('analista');
    await page.waitForTimeout(600);
    await page.locator('#viewToggle').click();
    await page.waitForTimeout(400);
    await page.locator('#viewToggle').click();
    await page.waitForTimeout(400);

    expect(violacoes, 'a CSP nao pode bloquear nada do proprio site').toEqual([]);
});

test('os estilos que estavam inline continuam aplicados', async ({ page }) => {
    await abrirComVagas(page);

    // Estes tres vinham de style= no HTML e no JS. Se a migracao para CSS
    // tivesse errado o seletor, o valor cairia para o padrao herdado.
    const medidas = await page.evaluate(() => {
        const visitado = document.querySelector('#visitedToggle .material-symbols-rounded');
        const etiqueta = document.querySelector('.job-tag .material-symbols-rounded');
        const sprite = document.querySelector('.icon-sprite');
        return {
            visitado: visitado ? getComputedStyle(visitado).fontSize : null,
            etiqueta: etiqueta ? getComputedStyle(etiqueta).fontSize : null,
            spriteDisplay: sprite ? getComputedStyle(sprite).display : null,
            spriteAltura: sprite ? sprite.getBoundingClientRect().height : null
        };
    });

    expect(medidas.visitado, 'icone do filtro de visitadas').toBe('18px');
    expect(medidas.etiqueta, 'icone dentro da etiqueta de vaga').toBe('12px');
    expect(medidas.spriteDisplay, 'o deposito de simbolos nao pode ocupar espaco').toBe('none');
    expect(medidas.spriteAltura, 'o deposito de simbolos nao pode ter altura').toBe(0);
});
