# Issue 10 — Responsividade mobile (preview colapsável)

**Tipo:** AFK  
**Status:** ready-for-agent

## Parent

PRD: `ideias-to-project/personal/prd-015-eu-gero-meu-curriculo.md`

## What to build

Garantir que toda a aplicação seja utilizável em telas mobile. O layout de duas colunas (wizard + preview) não cabe em telas pequenas — em mobile, o preview deve ser ocultado por padrão e acessível via botão "Ver prévia".

Ajustes de responsividade em todas as telas: seleção de template, wizard, revisão, guia LinkedIn e modais de prompt.

## Acceptance criteria

- [ ] Em telas com largura abaixo de 768px, o layout passa para coluna única (wizard ocupa tela toda)
- [ ] Botão "Ver prévia" visível em mobile abre o preview como overlay ou painel colapsável
- [ ] Tela de seleção de template exibe os cards em coluna única em mobile
- [ ] Todos os campos do wizard são preenchíveis sem zoom forçado em iOS/Android
- [ ] Modais de prompt de IA são legíveis e o botão "Copiar" acessível em telas pequenas
- [ ] Tela de guia LinkedIn rolável e usável em mobile sem quebra de layout

## Blocked by

- Issue 09 — Prompts de IA externos
