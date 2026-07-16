# Baseline Retroativa: Seleção de Personagens e Templates Novos

**Status:** Concluído (spec retroativa - documenta comportamento já entregue nos PRs #15 e #14)
**Data:** 2026-07-16

## 1. Resumo e Objetivo

Documenta duas entregas feitas sem spec prévia, para restaurar a conformidade SDD: a tela de seleção de personagens de exemplo (estilo "escolha seu personagem") exibida antes da configuração, e os três templates adicionais (Faixa Clara, Pilar e Serifado) que elevam o total de 6 para 9 modelos.

## 2. User Stories (Requisitos Funcionais)

* **US01:** Como candidato de primeira viagem, quero começar a partir de um currículo de exemplo completo (personagem), para entender o padrão de qualidade esperado antes de digitar meus dados.
* **US02:** Como candidato, quero escolher entre mais estilos visuais de currículo (Faixa Clara, Pilar, Serifado), para adequar o documento ao meu setor.

## 3. Regras de Negócio e Casos de Falha (Edge Cases)

* **Regra 01 (Dados fictícios seguros):** Todo personagem usa figuras de domínio público (Sherlock Holmes, Hua Mulan, Hércules, Chapeuzinho Vermelho) com contatos reservados: e-mail `@exemplo.com.br` e telefones de preenchimento `(11) 99999-000x`. Nenhum dado real pode entrar em `characters.js`.
* **Regra 02 (Estado válido):** Cada personagem preenchido é um estado completo do app: `template` deve existir em `TEMPLATE_IDS` e `enabledSections` deve conter apenas seções definidas em `SECTIONS`. Existe ainda a opção "Em branco" (`state: null`) para começar do zero.
* **Regra 03 (ATS):** Cada template novo declara `atsFriendly`; templates com layout de coluna/fundo exibem o aviso ATS existente. Faixa Clara, Pilar e Serifado são `atsFriendly: true`.
* **Falha 01:** Se o personagem escolhido tiver template inválido, `mergeWithDefaults` normaliza para `classic` (comportamento já coberto pelo storage).

## 4. Estrutura de Dados e Componentes

* **Modelos:** `js/characters.js` expõe `EuGeroCharacters.CHARACTERS` (array de estados) e `getById(id)`.
* **Templates:** `js/config.js` (`TEMPLATES`: `faixa`, `pilar`, `serifado`), renderização em `js/preview.js` e export correspondente em `js/export.js`.
* **UI:** grid de personagens em `js/app.js` (renderização escapada com `escapeHtml`).

## 5. Critérios de Aceite (verificáveis por teste)

* [x] CA01: Dado qualquer personagem, quando validado, então `template` pertence a `TEMPLATE_IDS` e `enabledSections` só contém ids válidos.
* [x] CA02: Dado qualquer personagem, quando validado, então e-mail termina em `@exemplo.com.br` e nome/headline não estão vazios.
* [x] CA03: Dado `TEMPLATES`, quando consultado, então existem 9 templates e todos possuem `id`, `name`, `description` e flag `atsFriendly` booleana.

## 6. Fora de Escopo

* Criação de novos personagens ou upload de foto.
* Templates com mais de uma página.
