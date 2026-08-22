import { test, expect } from '@playwright/test';

/**
 * Abre a revisao pelo caminho que o app oferece hoje.
 *
 * `page.goto('/resume/#/review')` deixou de funcionar: a revisao passou a ser
 * acessivel apenas por `goToReview()`, que valida os campos obrigatorios antes
 * de abrir e devolve ao wizard quando falta algo. Entrar pela URL cai em
 * `#/wizard/personal` com a area de impressao vazia, e foi isso que estes
 * testes passaram a medir depois da mudanca, e nao o comportamento que eles
 * descrevem.
 */
async function abrirRevisao(page, montarEstado) {
    await page.goto('/resume/');
    await page.waitForFunction(() => typeof EuGeroStorage !== 'undefined');
    await page.evaluate(montarEstado);
    await page.reload();
    await page.waitForFunction(() => typeof EuGeroApp !== 'undefined');

    const abriu = await page.evaluate(() => EuGeroApp.goToReview());
    expect(abriu, 'o estado de teste tem que passar na validacao da revisao').toBe(true);
    await expect(page.locator('#screen-review')).toBeVisible();
}


/**
 * A pagina A4 tem 297mm, mas 297mm a 96dpi da 1122,52px: o navegador arredonda
 * para 1123px, ou seja 297,13mm, e esse excesso de 0,13mm gera uma segunda
 * pagina em branco no Safari e no Firefox. A caixa de impressao precisa ficar
 * abaixo de 297mm com folga.
 */
test('a area de impressao do curriculo cabe em uma pagina A4', async ({ page }) => {
    await abrirRevisao(page, () => {
        const character = EuGeroCharacters.CHARACTERS.find((c) => c.state);
        const state = JSON.parse(JSON.stringify(character.state));
        state.template = 'classic';
        EuGeroStorage.save(state);
    });
    await page.emulateMedia({ media: 'print' });

    const heightMm = await page.evaluate(() => {
        const el = document.getElementById('print-cv');
        const rect = el.getBoundingClientRect();
        return (Math.max(el.scrollHeight, rect.height) * 25.4) / 96;
    });

    expect(heightMm, 'a caixa de impressao nao pode alcancar 297mm').toBeLessThan(297);
});

test('conteudo que nao cabe continua inteiro em vez de ser cortado', async ({ page }) => {
    await abrirRevisao(page, () => {
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
    await page.emulateMedia({ media: 'print' });

    // Cortar o excedente esconderia experiencia do candidato sem ele perceber.
    const cargos = await page.evaluate(() => {
        const text = document.getElementById('print-cv').textContent || '';
        return new Set(text.match(/CargoTeste\d+/g) || []).size;
    });

    expect(cargos, 'nenhuma experiencia pode sumir da area de impressao').toBe(12);
});

/**
 * A altura da folha impressa e a altura do DOCUMENTO, nao a da caixa do
 * curriculo. `base.css` define `body { min-height: 100vh }` para a tela, e na
 * impressao o Chrome resolve vh pela altura da folha enquanto o Safari resolve
 * pela altura da janela. Numa janela alta o body sozinho passava de uma folha e
 * saia uma segunda pagina em branco, com o curriculo inteiro cabendo na
 * primeira. Cinco rodadas de correcao mexeram no #print-cv sem tocar na causa.
 *
 * A janela alta e obrigatoria no teste: com a janela padrao de 720px o defeito
 * nao aparece, porque 720px cabem numa folha.
 */
test('a folha impressa nao herda a altura da janela', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1600 });
    await page.goto('/resume/');
    await page.waitForFunction(() => typeof EuGeroStorage !== 'undefined');

    await page.evaluate(() => {
        const character = EuGeroCharacters.CHARACTERS.find((c) => c.state);
        EuGeroStorage.save(JSON.parse(JSON.stringify(character.state)));
    });

    await page.goto('/resume/#/review');
    await page.reload({ waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });

    const alturaBodyMm = await page.evaluate(() => {
        const r = document.body.getBoundingClientRect();
        return (Math.max(document.body.scrollHeight, r.height) * 25.4) / 96;
    });

    // 271,6mm e a area util de um A4 com a margem de 12,7mm que o Safari aplica
    // por padrao. Abaixo disso o documento cabe em uma folha em qualquer motor.
    expect(alturaBodyMm, 'o body nao pode ser mais alto que a area util do A4').toBeLessThan(271.6);
});

/**
 * A exportacao deixou de passar pelo dialogo de impressao do navegador.
 *
 * Ate 2026-07-30 o botao chamava `window.print()`, e este teste conferia isso.
 * Em 31/07 a origem trocou para geracao direta de PDF com jsPDF
 * (`fbe2feef`, "caminho unico de exportacao"), e `window.print` nao existe mais
 * em lugar nenhum do gerador. O teste antigo media um comportamento que foi
 * removido de proposito, entao ele passa a cobrar o comportamento atual: o
 * clique entrega um arquivo PDF.
 */
test('o botao de exportar entrega o PDF do curriculo', async ({ page }) => {
    await abrirRevisao(page, () => {
        const character = EuGeroCharacters.CHARACTERS.find((c) => c.state);
        const state = JSON.parse(JSON.stringify(character.state));
        state.template = 'classic';
        EuGeroStorage.save(state);
    });

    // A area impressa precisa estar montada antes do clique: e dela que o PDF
    // e gerado.
    const conteudo = await page.evaluate(
        () => document.getElementById('print-cv').textContent.trim().length
    );
    expect(conteudo, 'a area do curriculo nao pode estar vazia na exportacao').toBeGreaterThan(100);

    const download = await Promise.race([
        page.waitForEvent('download', { timeout: 60000 }),
        page.click('#btn-export-pdf').then(() => page.waitForEvent('download', { timeout: 60000 }))
    ]);

    expect(download.suggestedFilename(), 'o arquivo entregue tem que ser um PDF').toMatch(/\.pdf$/);
});
