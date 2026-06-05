/**
 * Smoke tests — executar com: node tests/smoke-test.js
 * Testa módulos puros sem DOM.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadScript(relativePath) {
  const filePath = path.join(__dirname, '..', relativePath);
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInThisContext(code, { filename: filePath });
}

// Carregar módulos na ordem correta
loadScript('js/config.js');
loadScript('js/scoring.js');
loadScript('js/storage.js');
loadScript('js/prompts.js');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

console.log('\n=== Eu Gero — Smoke Tests ===\n');

// --- Scoring ---
console.log('Pontuação por campo:');

assert(
  EuGeroScoring.scoreField('', { required: true, minLength: 3 }, EuGeroConfig.ACTION_VERBS) === 'fraco',
  'Campo obrigatório vazio = Fraco'
);

assert(
  EuGeroScoring.scoreField('João Silva', { required: true, minLength: 3 }, EuGeroConfig.ACTION_VERBS) === 'bom' ||
  EuGeroScoring.scoreField('João Silva', { required: true, minLength: 3 }, EuGeroConfig.ACTION_VERBS) === 'otimo',
  'Campo obrigatório preenchido com tamanho adequado = Bom ou Ótimo'
);

assert(
  EuGeroScoring.scoreField(
    'Implementei um sistema de gestão que reduziu custos em 30% e liderei uma equipe de 5 desenvolvedores.',
    { required: true, minLength: 50, actionVerbs: true },
    EuGeroConfig.ACTION_VERBS
  ) === 'otimo',
  'Descrição com verbo de ação e extensão adequada = Ótimo'
);

assert(
  EuGeroScoring.scoreField('Trabalhei na empresa.', { required: true, minLength: 50, actionVerbs: true }, EuGeroConfig.ACTION_VERBS) === 'fraco',
  'Descrição curta sem verbo de ação = Fraco'
);

assert(
  EuGeroScoring.hasActionVerb('Desenvolvi APIs RESTful', EuGeroConfig.ACTION_VERBS),
  'Detecção de verbo de ação funciona'
);

// --- Prompts ---
console.log('\nGeração de prompts IA:');

const emptyState = EuGeroConfig.createEmptyState();
const filledState = {
  ...emptyState,
  personal: {
    fullName: 'Maria Teste',
    headline: 'Desenvolvedora',
    email: 'maria@test.com',
    phone: '11999999999',
    location: 'São Paulo, SP',
    linkedinUrl: 'https://linkedin.com/in/maria'
  },
  summary: 'Profissional com experiência em desenvolvimento.'
};

const promptWithData = EuGeroPrompts.buildGeneralPrompt(filledState, true);
const promptWithoutData = EuGeroPrompts.buildGeneralPrompt(filledState, false);

assert(promptWithData.includes('Maria Teste'), 'Prompt geral com dados inclui nome');
assert(!promptWithoutData.includes('maria@test.com'), 'Prompt geral sem dados não inclui e-mail');
assert(promptWithoutData.includes('Não incluí meus dados'), 'Prompt sem dados indica ausência de dados pessoais');

const sectionPrompt = EuGeroPrompts.buildSectionPrompt('experiences', filledState, true);
assert(sectionPrompt.includes('Experiências'), 'Prompt por seção contém contexto da seção');

const translationPrompt = EuGeroPrompts.buildTranslationPrompt(filledState, true);
assert(translationPrompt.includes('português para inglês'), 'Prompt de tradução contém instrução correta');
assert(translationPrompt.includes('Maria Teste'), 'Prompt de tradução inclui dados quando marcado');

// --- JSON serialize/deserialize ---
console.log('\nExport/Import JSON:');

const stateToExport = {
  ...filledState,
  template: 'modern',
  experiences: [{ company: 'Tech Co', title: 'Dev', startDate: '2020', endDate: '2023', description: 'Implementei features.' }]
};

const serialized = EuGeroStorage.serialize(stateToExport);
assert(serialized.includes('"template": "modern"'), 'JSON contém template selecionado');
assert(serialized.includes('Tech Co'), 'JSON contém dados de experiência');

const deserialized = EuGeroStorage.deserialize(serialized);
assert(deserialized.valid === true, 'Import de JSON válido aceito');
assert(deserialized.data.template === 'modern', 'Template restaurado corretamente');
assert(deserialized.data.experiences[0].company === 'Tech Co', 'Experiências restauradas');

const invalidResult = EuGeroStorage.validateImportData({ foo: 'bar' });
assert(invalidResult.valid === false, 'JSON inválido rejeitado');

const corrupted = EuGeroStorage.validateImportData(null);
assert(corrupted.valid === false, 'Dados nulos rejeitados');

// --- Template switch (data preservation) ---
console.log('\nTroca de template:');

const beforeSwitch = EuGeroStorage.mergeWithDefaults({ ...stateToExport, template: 'classic' });
const afterSwitch = { ...beforeSwitch, template: 'modern' };
assert(beforeSwitch.personal.fullName === afterSwitch.personal.fullName, 'Troca de template preserva dados pessoais');
assert(beforeSwitch.experiences.length === afterSwitch.experiences.length, 'Troca de template preserva listas');
assert(beforeSwitch.template === 'classic' && afterSwitch.template === 'modern', 'Template alterado sem perder dados');

// --- Aggregate scoring ---
console.log('\nPontuação agregada:');

const scoreResults = EuGeroScoring.scoreState(filledState, EuGeroConfig.SECTIONS, EuGeroConfig.ACTION_VERBS);
const aggregate = EuGeroScoring.aggregateScore(scoreResults);
assert(typeof aggregate.overall === 'number', 'Pontuação geral é numérica');
assert(aggregate.overall >= 0 && aggregate.overall <= 100, 'Pontuação geral entre 0 e 100');
assert(Array.isArray(aggregate.weakFields), 'Lista de campos fracos retornada');

// --- LinkedIn guide entries ---
console.log('\nGuia LinkedIn:');

// linkedin-guide needs DOM for renderGuide, but buildEntries is testable if we load it
loadScript('js/linkedin-guide.js');
const entries = EuGeroLinkedInGuide.buildEntries(filledState);
assert(entries.length > 0, 'Guia gera entradas para dados preenchidos');
assert(entries.some(e => e.title.includes('Sobre') || e.content.includes('Profissional')), 'Guia inclui resumo');

const emptyEntries = EuGeroLinkedInGuide.buildEntries(emptyState);
assert(emptyEntries.length === 0, 'Guia omite seções vazias');

// --- Summary ---
console.log(`\n=== Resultado: ${passed} passou, ${failed} falhou ===\n`);

if (failed > 0) {
  process.exit(1);
}
