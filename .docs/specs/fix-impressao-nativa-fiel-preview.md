# Impressão nativa fiel à prévia

**Status:** Concluído  
**Data:** 2026-07-19

## Objetivo

Restaurar a impressão nativa como exportação principal para usar o mesmo HTML e CSS da prévia. Corrigir a largura e a altura impressas para que um currículo de uma página na prévia não seja dividido em duas páginas ao salvar em PDF.

## Requisitos

- O botão de exportação abre a impressão nativa do navegador.
- A impressão usa `#print-cv`, alimentado pelo mesmo renderizador da prévia em modo de exportação.
- A página A4 inclui padding dentro de seus 210mm por meio de `box-sizing: border-box`.
- O texto permanece selecionável no PDF salvo pelo navegador.

## Critérios de aceite

- Não há geração via jsPDF no clique de exportação.
- `#print-cv` tem largura e altura A4 com `box-sizing: border-box` na impressão.
- A suíte cobre o fluxo de impressão nativa e a regra de caixa A4.
