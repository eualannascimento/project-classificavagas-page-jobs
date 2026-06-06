# Relatório de auditoria UX - classificavagas.com

Data: 2026-06-06  
Escopo: `index.html`, páginas legais, `styles.css`, `scripts.js` e módulos JS.  
Base: melhorias da PR #58 preservadas e evoluídas nesta branch.

## Mapa de componentes e fluxos

| Fluxo | Arquivos | Descrição |
|-------|----------|-----------|
| Bootstrap | `theme-init.js`, `scripts.js` init | Tema/densidade antes do paint; managers no DOMContentLoaded |
| Carga de dados | `data-loader.js`, `job-cache.js` | recent_jobs primeiro, catálogo completo em segundo plano, cache IndexedDB |
| Busca | `searchManager`, `searchHistoryManager` | Debounce 250ms, operadores `e`/`ou`, aspas, histórico local |
| Filtros | `filterManager`, `bottomSheet` | Sheet mobile, chips ativos, até 6 filtros salvos |
| Listagem | `cardRenderer`, `view-mode-manager.js` | Cards/lista/compacto, scroll infinito + botão carregar mais |
| Personalização | `appearance-manager.js` | Painel Aparência: tema + densidade |
| Legal | `legal-panel.js`, `termos.html`, `privacidade.html` | Painel in-app + páginas estáticas |
| Offline/PWA | `service-worker.js`, `offline-manager.js` | Cache shell; detecção `navigator.onLine` |

---

## Achados e recomendações

### C1 - Catálogo completo bloqueia segunda visita

| Campo | Detalhe |
|-------|---------|
| Problema | Toda visita re-baixa e re-parseia ~2 MB gzip mesmo sem mudança no servidor |
| Evidência | `scripts.js` `dataLoader._loadInternal` L1680-1773 (fluxo anterior) |
| Impacto | Segunda visita demora segundos em rede lenta; TTI alto |
| Severidade | **Crítico** |
| Recomendação | IndexedDB com versão (`last-modified`); hidratar instantaneamente; revalidar em background |
| Status | **Implementado** - `job-cache.js`, `data-loader.js` |

### C2 - Download completo sem aviso em dados móveis

| Campo | Detalhe |
|-------|---------|
| Problema | Catálogo completo inicia sem consentimento em conexões limitadas |
| Evidência | `dataLoader` inicia fetch de `open_jobs.json.gz` após recentes sem checagem |
| Impacto | Consumo de franquia; abandono em 3G |
| Severidade | **Crítico** |
| Recomendação | Network Information API + banner com adiar/baixar |
| Status | **Implementado** - `#dataUsageBanner`, `data-loader.js` |

### C3 - Títulos em CAIXA ALTA no DOM

| Campo | Detalhe |
|-------|---------|
| Problema | `formatJobTitle` usa `toLocaleUpperCase('pt-BR')` |
| Evidência | `scripts.js` L618-621, uso em `createCard` L3015 |
| Impacto | Leitores de tela soletram palavra a palavra em maiúsculas |
| Severidade | **Crítico** |
| Recomendação | Texto original no DOM; sem `text-transform` nos títulos |
| Status | **Implementado** - `formatJobTitle` retorna original |

### C4 - Rótulos de ícone incompletos

| Campo | Detalhe |
|-------|---------|
| Problema | Vários botões usam `title` ou rótulo genérico; tema não expõe estado |
| Evidência | `index.html` L103 `#themeToggle aria-label="Alternar tema"`; `themeManager` só `title` L843 |
| Impacto | Usuários de leitor de tela não sabem estado atual/próximo |
| Severidade | **Crítico** |
| Recomendação | `aria-label` dinâmico por estado em todos os icon-only |
| Status | **Implementado** - `aria-labels.js`, `appearance-manager.js` |

### C5 - Contagem de resultados não anunciada

| Campo | Detalhe |
|-------|---------|
| Problema | `#resultsCounter` é visual; sem região live dedicada |
| Evidência | `cardRenderer.render` L2971-2979 atualiza texto sem `aria-live` dedicado |
| Impacto | Usuários de SR não percebem mudança após filtrar |
| Severidade | **Crítico** |
| Recomendação | `#resultsAnnouncer` com `aria-live="polite"` |
| Status | **Implementado** - `index.html`, `cardRenderer` |

### C6 - Contraste e fonte padrão

| Campo | Detalhe |
|-------|---------|
| Problema | Serif editorial como padrão; `--ink-3` em tema black pode ficar abaixo de AA em chips |
| Evidência | `theme-init.js` L47 default `instrument`; `styles.css` L11 `--ink-3` |
| Impacto | Legibilidade reduzida na listagem |
| Severidade | **Crítico** |
| Recomendação | Inter/restraint como default; revisão `--ink-3` nos 3 temas |
| Status | **Implementado** - defaults `inter` + `restraint`; tokens ajustados |

### C7 - Reduced motion incompleto em sheets

| Campo | Detalhe |
|-------|---------|
| Problema | `@media (prefers-reduced-motion)` não cobre `.bottom-sheet` transform |
| Evidência | `styles.css` L3010-3016 global; sheets usam `transition` L~2100 |
| Impacto | Desconforto vestibular |
| Severidade | **Crítico** |
| Recomendação | Desativar transform/transition de sheets e splash |
| Status | **Implementado** - bloco expandido em `styles.css` |

### A1 - Busca booleana pouco descobrível

| Campo | Detalhe |
|-------|---------|
| Problema | Operadores só no `title` do input |
| Evidência | `index.html` L131 `title="Atalho: /..."` |
| Impacto | Usuários não descobrem `e`, `ou`, aspas |
| Severidade | **Alto** |
| Recomendação | Placeholder com exemplos + popover de ajuda |
| Status | **Implementado** - `#searchHelpBtn`, dica inline |

### A2 - Terminologia de datas inconsistente

| Campo | Detalhe |
|-------|---------|
| Problema | Obtida/Agregada/Atualizada/Publicação misturados |
| Evidência | `renderJobDatesHtml` L355-360; sort L38-39; filter L3394 |
| Impacto | Confusão sobre qual data significa o quê |
| Severidade | **Alto** |
| Recomendação | **Publicada em** + **Adicionada em** em todo o app |
| Status | **Implementado** |

### A3 - Empty state genérico

| Campo | Detalhe |
|-------|---------|
| Problema | Só "Limpar filtros"; não sugere remover último filtro |
| Evidência | `cardRenderer.render` L2948-2951 |
| Impacto | Mais cliques para recuperar resultados |
| Severidade | **Alto** |
| Recomendação | Botão "Remover último filtro (N vagas)" + limpar busca separado |
| Status | **Implementado** - `empty-state-manager.js` |

### A4 - Personalização fragmentada

| Campo | Detalhe |
|-------|---------|
| Problema | 4 prefs (tema/estilo/fonte/densidade) sem UI unificada |
| Evidência | `styleManager`/`fontManager` sem init; só `#themeToggle` |
| Impacto | Opções ocultas ou redundantes |
| Severidade | **Alto** |
| Recomendação | Painel Aparência com tema + densidade; defaults sensatos |
| Status | **Implementado** - `appearance-manager.js` |

### M1 - Scroll não restaurado

| Campo | Detalhe |
|-------|---------|
| Problema | Voltar do site da vaga perde posição |
| Evidência | Ausência de `sessionStorage` scroll em `scrollManager` |
| Impacto | Retrabalho ao revisitar lista |
| Severidade | **Médio** |
| Recomendação | Persistir scroll + restaurar após render |
| Status | **Implementado** - `scroll-restore.js` |

### M2 - Vaga específica não linkável

| Campo | Detalhe |
|-------|---------|
| Problema | `getJobKey` existe mas URL não expõe âncora |
| Evidência | `utils.getJobKey` L703-706 sem sync com URL |
| Impacto | Não compartilha vaga individual |
| Severidade | **Médio** |
| Recomendação | Hash `#v-{key}` + scroll ao card; JSON-LD JobPosting |
| Status | **Implementado** - `job-deep-link.js` |

### M3 - Só scroll infinito

| Campo | Detalhe |
|-------|---------|
| Problema | Sem controle explícito para carregar mais |
| Evidência | `scrollManager` L4055 infinite scroll apenas |
| Impacto | Dificulta teclado e usuários que preferem botão |
| Severidade | **Médio** |
| Recomendação | `#loadMoreBtn` visível como fallback |
| Status | **Implementado** |

### M4 - Offline genérico

| Campo | Detalhe |
|-------|---------|
| Problema | Erro de carga não distingue offline |
| Evidência | `showLoadError` L1666 mensagem genérica |
| Impacto | Usuário não sabe se é rede ou servidor |
| Severidade | **Médio** |
| Recomendação | `navigator.onLine` + mensagem específica |
| Status | **Implementado** - `offline-manager.js` |

### B1 - Pasta `_backup/` versionada

| Campo | Detalhe |
|-------|---------|
| Problema | Protótipos legados no repositório |
| Evidência | `_backup/` com 20+ arquivos |
| Impacto | Ruído no clone e risco de confusão |
| Severidade | **Baixo** |
| Recomendação | Remover do versionamento |
| Status | **Implementado** |

### B2 - Monólito `scripts.js`

| Campo | Detalhe |
|-------|---------|
| Problema | ~4500 linhas em um arquivo |
| Evidência | `assets/js/scripts.js` |
| Impacto | Manutenção e parse JS mais lentos |
| Severidade | **Baixo** |
| Recomendação | Extrair managers independentes |
| Status | **Parcial** - `data-loader.js`, `job-cache.js`, `appearance-manager.js`, `empty-state-manager.js`, `scroll-restore.js`, `job-deep-link.js`, `offline-manager.js`, `aria-labels.js` |

### B3 - Web Vitals sem baseline

| Campo | Detalhe |
|-------|---------|
| Problema | Smoke test não mede LCP/CLS/INP |
| Evidência | `tests/e2e/smoke.spec.js` |
| Impacto | Regressões de performance passam despercebidas |
| Severidade | **Baixo** |
| Recomendação | Medir no Playwright e documentar |
| Status | **Implementado** - `tests/e2e/web-vitals.spec.js`, `docs/performance-baseline.md` |

---

## Pendências conscientes

| Item | Motivo |
|------|--------|
| Páginas estáticas por categoria (SEO) | Fora do escopo; exigiria SSG no CI |
| UI completa para 7 fontes | Reduzido a default Inter; fontes extras removidas da UI |
| JobPosting para catálogo inteiro | Implementado só para vagas visíveis (lote atual) |
| Quebra total de `scripts.js` | Extração parcial; `filterManager`/`cardRenderer` ainda acoplados |

---

## Referência de commits

Cada commit referencia este documento pela seção (ex.: `C1`, `A2`).
