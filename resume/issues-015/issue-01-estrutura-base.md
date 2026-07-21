# Issue 01 — Estrutura base + tela de seleção de template

**Tipo:** AFK  
**Status:** ready-for-agent

## Parent

PRD: `ideias-to-project/personal/prd-015-eu-gero-meu-curriculo.md`

## What to build

Criar o esqueleto completo da aplicação em HTML/CSS/JS puro, pronta para ser servida pelo GitHub Pages sem nenhum servidor ou build step.

A tela inicial deve apresentar ao usuário dois cards visuais representando os 2 templates disponíveis (Clássico e Moderno). O usuário clica em um card para selecioná-lo e avança para o wizard. Um botão de troca de template deve estar sempre visível durante todo o fluxo, permitindo alternar o template sem apagar dados.

O template selecionado é armazenado em memória (variável JS) e aplicado ao preview ao vivo nas etapas seguintes. Nesta issue, o preview pode ser um placeholder vazio — o conteúdo virá nas issues subsequentes.

## Acceptance criteria

- [ ] Arquivos `index.html`, `style.css` e `app.js` criados e funcionando localmente sem servidor
- [ ] Tela inicial exibe 2 cards de template com nome e prévia visual mínima (ex: thumbnail estática)
- [ ] Clicar em um card seleciona o template e avança para a tela do wizard (stub vazio aceitável)
- [ ] Botão de troca de template visível durante o wizard, funcional (troca o template selecionado sem recarregar a página)
- [ ] Nenhuma dependência de build, bundler ou framework — funciona abrindo o `index.html` diretamente no browser

## Blocked by

None — can start immediately.
