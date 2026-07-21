# Issue 04 — Sistema de pontuação por campo (Fraco / Bom / Ótimo)

**Tipo:** AFK  
**Status:** ready-for-agent

## Parent

PRD: `ideias-to-project/personal/prd-015-eu-gero-meu-curriculo.md`

## What to build

Implementar o sistema de pontuação que avalia cada campo do formulário em tempo real e exibe um rótulo qualitativo abaixo dele. Na tela de revisão final (última etapa antes do export), exibir um resumo consolidado da qualidade geral do currículo.

**Critérios de avaliação por campo:**
1. **Extensão mínima** — campo com menos caracteres que o mínimo esperado para aquele tipo recebe penalidade
2. **Presença de verbos de ação** — campos de descrição (experiências, resumo) com verbos como "implementei", "liderei", "desenvolvi", "gerenciei" pontuam melhor
3. **Completude** — campos obrigatórios vazios resultam em nota Fraco independente dos outros critérios

**Rótulos:** Fraco (vermelho) / Bom (amarelo) / Ótimo (verde)

**Tela de revisão final:** barra de progresso geral + lista dos campos com nota Fraco para o usuário revisar antes de exportar.

A lógica de pontuação deve estar em um módulo JS isolado e testável independentemente do DOM.

## Acceptance criteria

- [ ] Rótulo Fraco/Bom/Ótimo aparece abaixo de cada campo relevante e atualiza em tempo real
- [ ] Campo obrigatório vazio sempre resulta em Fraco
- [ ] Campo de descrição com verbo de ação e extensão adequada resulta em Ótimo
- [ ] Tela de revisão exibe barra de progresso geral e lista campos com nota Fraco
- [ ] Lógica de pontuação é uma função pura JS (sem dependência de DOM) facilmente testável

## Blocked by

- Issue 03 — Preview ao vivo com 2 templates trocáveis
