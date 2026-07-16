# Baseline Retroativa: Word .doc Fiel, Guia LinkedIn em 9 Passos e Mobile Compacto

**Status:** Concluído (spec retroativa - documenta comportamento já entregue nos PRs #14, #16 e #17)
**Data:** 2026-07-16

## 1. Resumo e Objetivo

Documenta três entregas feitas sem spec prévia, para restaurar a conformidade SDD: a exportação Word `.doc` fiel à prévia (mesmo HTML/CSS), a reescrita do Guia LinkedIn em 9 passos curtos com o caminho exato dentro do app do LinkedIn, e o pacote de responsividade mobile (wizard compacto, tabs como fichas numeradas, botão Concluir verde).

## 2. User Stories (Requisitos Funcionais)

* **US01:** Como candidato, quero exportar um Word editável idêntico à prévia que estou vendo, para ajustar detalhes finais sem perder o layout.
* **US02:** Como candidato, quero um guia LinkedIn em passos curtos com o caminho exato de cada tela ("Onde"), para atualizar meu perfil sem procurar menus.
* **US03:** Como candidato no celular, quero preencher o wizard com o mínimo de rolagem e navegar por fichas numeradas, para concluir o currículo em uma sessão curta.

## 3. Regras de Negócio e Casos de Falha (Edge Cases)

* **Regra 01 (Fidelidade):** O `.doc` é gerado com o mesmo markup da prévia (`EuGeroCvData` + render do template) embrulhado como `application/msword` com BOM UTF-8; não há segunda fonte de verdade de layout.
* **Regra 02 (Fallback docx):** A exportação `.docx` via biblioteca `docx` (CDN, import dinâmico) continua disponível; se o CDN falhar, retorna erro amigável e TXT/PDF permanecem funcionais.
* **Regra 03 (Guia):** Todo passo do guia tem `title`, `path` ("Onde" no app do LinkedIn) e `tip`; passos condicionais (Sobre, Experiência, Competências, Idiomas, Formação) só aparecem quando o estado tem conteúdo correspondente.
* **Regra 04 (Mobile):** Em telas estreitas, as tabs do wizard viram fichas numeradas roláveis e a navegação principal permanece visível; o botão da última etapa vira "Concluir" em verde.
* **Falha 01:** Sem internet na primeira exportação `.docx`, exibir toast explicativo (mensagem de `EuGeroLibs.missingMessages`).

## 4. Estrutura de Dados e Componentes

* **Export:** `js/export.js` (caminho `.doc` HTML e caminhos `.docx` por família de template: classic/sidebar/banner).
* **Guia:** `js/linkedin-guide.js` (`buildEntries(state)` puro + `renderGuide` com DOM).
* **Mobile:** `css/style.css` (media queries) e `js/app.js` (timeline/fichas do wizard).

## 5. Critérios de Aceite (verificáveis por teste)

* [x] CA01: Dado um estado preenchido, quando `buildEntries` roda, então todo passo tem `path` e `tip` (coberto no smoke-test).
* [x] CA02: Dado um estado vazio, quando `buildEntries` roda, então seções condicionais são omitidas (coberto no smoke-test).
* [x] CA03: A URL do CDN da biblioteca `docx` usada na checagem (`libs.js`) e no export (`export.js`) deve ser a mesma.

## 6. Fora de Escopo

* Exportação `.odt` ou Google Docs.
* Publicação automática no LinkedIn (o guia é copiar/colar manual).
