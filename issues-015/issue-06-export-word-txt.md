# Issue 06 — Export Word (.docx) e TXT

**Tipo:** AFK  
**Status:** ready-for-agent

## Parent

PRD: `ideias-to-project/personal/prd-015-eu-gero-meu-curriculo.md`

## What to build

Adicionar dois formatos de exportação na tela de revisão final: Word (.docx) via docx.js (CDN) e TXT via Blob URL.

**Word (.docx):** estrutura o currículo com cabeçalhos, parágrafos e listas usando a API do docx.js. Não precisa replicar o template visual — apenas estrutura e hierarquia de conteúdo clara.

**TXT:** texto plano estruturado em seções separadas por linhas divisórias. Otimizado para colar em formulários ATS e sistemas de candidatura online.

Ambos os downloads são disparados diretamente no browser sem envio para servidor.

## Acceptance criteria

- [ ] Botão "Exportar Word" disponível na tela de revisão final, gera arquivo `.docx` para download
- [ ] Word contém todas as seções e dados preenchidos com hierarquia clara (títulos de seção, listas)
- [ ] Botão "Exportar TXT" disponível na tela de revisão final, gera arquivo `.txt` para download
- [ ] TXT contém todas as seções separadas por marcadores visuais (ex: `---`) legíveis em qualquer editor
- [ ] Nenhum dos dois formatos depende de servidor ou upload externo

## Blocked by

- Issue 05 — Export PDF com QR Code
