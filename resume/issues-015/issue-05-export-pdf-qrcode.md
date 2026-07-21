# Issue 05 — Export PDF com QR Code (jsPDF + QRCode.js)

**Tipo:** AFK  
**Status:** ready-for-agent

## Parent

PRD: `ideias-to-project/personal/prd-015-eu-gero-meu-curriculo.md`

## What to build

Implementar a exportação do currículo em PDF usando jsPDF (via CDN). O PDF gerado deve reproduzir o template atualmente selecionado pelo usuário (Clássico ou Moderno) e incluir um QR Code no rodapé apontando para a URL do LinkedIn informada nos Dados Pessoais.

O QR Code é gerado client-side com QRCode.js (via CDN) e embutido no PDF como imagem antes do download.

O botão de export PDF deve estar disponível na tela de revisão final.

## Acceptance criteria

- [ ] Botão "Exportar PDF" disponível na tela de revisão final
- [ ] PDF gerado reproduz visualmente o template selecionado (Clássico ou Moderno)
- [ ] PDF contém todos os dados preenchidos no formulário
- [ ] Rodapé do PDF exibe QR Code apontando para a URL do LinkedIn do usuário
- [ ] Se o campo LinkedIn estiver vazio, o QR Code é omitido sem erro
- [ ] Download do arquivo `.pdf` disparado diretamente no browser, sem upload para servidor

## Blocked by

- Issue 04 — Sistema de pontuação por campo
