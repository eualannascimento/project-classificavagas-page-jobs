# Issue 08 — Guia LinkedIn (textos prontos por campo)

**Tipo:** AFK  
**Status:** ready-for-agent

## Parent

PRD: `ideias-to-project/personal/prd-015-eu-gero-meu-curriculo.md`

## What to build

Adicionar uma tela de "Guia LinkedIn" acessível após a revisão final. A tela apresenta, campo a campo, os textos prontos para o usuário colar diretamente no perfil LinkedIn.

Cada entrada do guia mostra:
- Nome do campo do LinkedIn (ex: "Título profissional", "Sobre", "Cargo em [empresa]")
- Instrução curta de onde encontrar esse campo no LinkedIn
- Caixa de texto somente-leitura com o conteúdo gerado a partir do formulário
- Botão "Copiar" individual que copia o texto para a área de transferência

A tela cobre todos os campos editáveis do LinkedIn preenchidos no wizard.

## Acceptance criteria

- [ ] Tela de Guia LinkedIn acessível após a tela de revisão final
- [ ] Cada seção preenchida no wizard gera uma entrada correspondente no guia
- [ ] Seções não preenchidas são omitidas do guia (sem entradas vazias)
- [ ] Botão "Copiar" em cada entrada copia o texto para o clipboard e exibe confirmação visual (ex: "Copiado!")
- [ ] Instrução de localização do campo no LinkedIn exibida abaixo do título de cada entrada

## Blocked by

- Issue 07 — Export / Import JSON
