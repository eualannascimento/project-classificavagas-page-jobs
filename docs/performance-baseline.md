# Performance baseline - classificavagas.com

Medições via Playwright (`tests/e2e/web-vitals.spec.js`) em ambiente CI/local com `http.server` e catálogo completo.

## Métricas alvo

| Métrica | 1a visita (rede rápida) | 2a visita (cache IndexedDB) |
|---------|--------------------------|-----------------------------|
| LCP | Documentar no CI | < 1000 ms (meta) |
| CLS | < 0.1 | < 0.1 |
| INP | Documentar no CI | Documentar no CI |

## Estratégias implementadas (C1/C2)

1. **IndexedDB** - catálogo parseado persistido com versão `last-modified`
2. **recent_jobs.json** - interação imediata antes do catálogo completo
3. **Revalidação** - HEAD request; download completo só se versão mudou
4. **Aviso de dados móveis** - `saveData` ou `effectiveType` 2g/3g

## Como reproduzir

```bash
python3 scripts/prepare-deploy.py
npm run test:e2e
```

O teste `web-vitals.spec.js` registra LCP/CLS na 1a carga. Para 2a visita com cache, recarregue a página no mesmo contexto do Playwright após a 1a carga completa.
