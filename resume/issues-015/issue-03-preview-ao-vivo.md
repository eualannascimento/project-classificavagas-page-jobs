# Issue 03 — Preview ao vivo com 2 templates trocáveis

**Tipo:** AFK  
**Status:** ready-for-agent

## Parent

PRD: `ideias-to-project/personal/prd-015-eu-gero-meu-curriculo.md`

## What to build

Adicionar o painel de preview ao vivo à direita do wizard. O preview reflete em tempo real os dados digitados no formulário, renderizando-os no template selecionado.

Dois templates visuais completos devem ser implementados:
- **Clássico:** layout monocromático, limpo, tipografia sem serifa, sem elementos decorativos
- **Moderno:** barra lateral colorida com nome e contatos, conteúdo principal à direita

A troca de template (via botão sempre visível) altera apenas o CSS/layout do preview — os dados permanecem intactos. Em mobile, o preview é colapsável (oculto por padrão, acessível via botão "Ver prévia").

## Acceptance criteria

- [ ] Painel de preview visível à direita do wizard em telas largas (desktop)
- [ ] Preview atualiza em tempo real a cada input do usuário, sem reload
- [ ] Template Clássico renderizado corretamente com todos os campos do formulário
- [ ] Template Moderno renderizado corretamente com barra lateral colorida
- [ ] Trocar o template via botão altera o visual do preview sem apagar nenhum dado
- [ ] Em mobile, o preview é colapsável e oculto por padrão

## Blocked by

- Issue 02 — Wizard completo com todos os campos LinkedIn + localStorage
