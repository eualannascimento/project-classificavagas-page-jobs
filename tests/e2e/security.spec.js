import { test, expect } from '@playwright/test';

const PAYLOADS = {
    img: '<img src=x onerror="window.__xss=1">',
    script: '"><script>window.__xss=1<\/script>',
    svg: '<svg onload="window.__xss=1">',
    js: 'javascript:window.__xss=1'
};

/**
 * O catalogo vem de 37 plataformas de ATS externas: um titulo de vaga e dado
 * de terceiro, nao conteudo confiavel.
 */
test('vaga com payload nao vira markup vivo', async ({ page }) => {
    let dialogAberto = false;
    page.on('dialog', async (d) => { dialogAberto = true; await d.dismiss(); });

    await page.route('**/assets/data/json/recent_jobs.json', async (route) => {
        const vaga = {
            title: PAYLOADS.img,
            company: PAYLOADS.script,
            location: PAYLOADS.svg,
            url: PAYLOADS.js,
            company_type: PAYLOADS.img,
            category: PAYLOADS.img,
            level: PAYLOADS.img,
            site_type: 'Teste',
            contract: 'REMOTO',
            published_date: '2026-07-01',
            inserted_date: '2026-07-01',
            removed_date: '',
            location_country: 'BRASIL',
            location_state: 'SP',
            location_city: PAYLOADS.img,
            location_scope: 'BRASIL',
            department: '',
            experience_level: null,
            'affirmative?': '02 - Não',
            'temporary?': '02 - Não',
            'remote?': '01 - Sim'
        };
        await route.fulfill({ contentType: 'application/json', body: JSON.stringify([vaga]) });
    });

    await page.goto('/#vagas');
    await expect(page.locator('#splash')).toBeHidden({ timeout: 90000 });
    await page.waitForTimeout(500);

    const resultado = await page.evaluate(() => ({
        flag: !!window.__xss,
        img: !!document.querySelector('#jobsGrid img[src="x"]'),
        svg: !!document.querySelector('#jobsGrid svg[onload]'),
        jsHref: [...document.querySelectorAll('#jobsGrid a[href]')]
            .filter((a) => a.getAttribute('href').trim().toLowerCase().startsWith('javascript:')).length
    }));

    expect(dialogAberto, 'nenhum dialogo pode abrir').toBe(false);
    expect(resultado.flag, 'nenhum script injetado pode executar').toBe(false);
    expect(resultado.img, 'a tag img do payload nao pode existir no DOM').toBe(false);
    expect(resultado.svg, 'a tag svg do payload nao pode existir no DOM').toBe(false);
    expect(resultado.jsHref, 'nenhum link javascript: pode sobreviver').toBe(0);
});

test('dados do curriculo com payload nao viram markup vivo', async ({ page }) => {
    let dialogAberto = false;
    page.on('dialog', async (d) => { dialogAberto = true; await d.dismiss(); });

    await page.goto('/resume/');
    await page.waitForFunction(() => typeof EuGeroStorage !== 'undefined');

    await page.evaluate((p) => {
        const character = EuGeroCharacters.CHARACTERS.find((c) => c.state);
        const state = JSON.parse(JSON.stringify(character.state));
        state.personal.fullName = p.img;
        state.personal.headline = p.script;
        state.personal.location = p.svg;
        state.personal.linkedinUrl = p.js;
        state.summary = p.img;
        if (state.experiences?.[0]) {
            state.experiences[0].title = p.img;
            state.experiences[0].company = p.script;
        }
        EuGeroStorage.save(state);
    }, PAYLOADS);

    await page.goto('/resume/#/review');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const resultado = await page.evaluate(() => ({
        flag: !!window.__xss,
        img: !!document.querySelector('img[src="x"]'),
        svg: !!document.querySelector('svg[onload]'),
        jsHref: [...document.querySelectorAll('a[href]')]
            .filter((a) => a.getAttribute('href').trim().toLowerCase().startsWith('javascript:')).length
    }));

    expect(dialogAberto).toBe(false);
    expect(resultado.flag).toBe(false);
    expect(resultado.img).toBe(false);
    expect(resultado.svg).toBe(false);
    expect(resultado.jsHref).toBe(0);
});
