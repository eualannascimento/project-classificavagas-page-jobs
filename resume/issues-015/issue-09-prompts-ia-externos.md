# Issue 09 — Prompts de IA externos (geral, por seção, checkbox, tradução)

**Tipo:** AFK  
**Status:** ready-for-agent

## Parent

PRD: `ideias-to-project/personal/prd-015-eu-gero-meu-curriculo.md`

## What to build

Implementar o sistema de prompts prontos para IA externa. O usuário copia o prompt gerado, cola em qualquer IA (ChatGPT, Claude etc.), recebe sugestões e cola o resultado de volta nos campos — sem nenhuma integração de API.

**Três tipos de prompt:**

1. **Prompt geral:** cobre todas as seções do formulário de uma vez. Contém instruções completas de preenchimento de currículo + (opcional) os dados já preenchidos pelo usuário. Disponível em um botão fixo durante o wizard e na tela de revisão.

2. **Prompt por seção:** cada etapa do wizard tem um botão "Pedir ajuda à IA" que gera um prompt específico para aquela seção (ex: prompt para "escrever descrições de experiências com verbos de ação"). Inclui (opcional) os dados já preenchidos na seção.

3. **Prompt de tradução:** preset que instrui a IA a traduzir o currículo completo para inglês. Inclui os dados preenchidos (necessário para traduzir). Disponível na tela de revisão e no guia LinkedIn.

**Checkbox "Incluir meus dados no prompt":** presente nos prompts geral e por seção. Quando marcado, os valores já preenchidos são injetados no prompt. Quando desmarcado, o prompt contém apenas as instruções (sem dados pessoais).

Todos os prompts são gerados dinamicamente em JS e apresentados em um modal com área de texto somente-leitura e botão "Copiar prompt".

## Acceptance criteria

- [ ] Botão de prompt geral visível durante o wizard e na tela de revisão
- [ ] Cada etapa do wizard exibe botão "Pedir ajuda à IA" com prompt específico da seção
- [ ] Prompt de tradução disponível na tela de revisão e no guia LinkedIn
- [ ] Checkbox "Incluir meus dados no prompt" funciona corretamente nos três tipos
- [ ] Modal exibe o prompt gerado em textarea somente-leitura com botão "Copiar"
- [ ] Quando checkbox desmarcado, nenhum dado pessoal aparece no prompt gerado

## Blocked by

- Issue 08 — Guia LinkedIn
