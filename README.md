# classificavagas.com

Agregador estático de vagas de emprego no Brasil.

## Estrutura

- `index.html` — shell da aplicação
- `assets/js/scripts.js` — lógica (filtros, busca, UI)
- `assets/js/jobs-worker.js` — parse do JSON em Web Worker
- `assets/data/json/open_jobs.json` — catálogo completo (formato fixo, atualizado externamente)
- `assets/data/json/open_jobs.json.gz` — mesma carga compactada para download
- `scripts/build-recent.py` — gera `recent_jobs.json` (últimos 14 dias)

## Deploy

Antes de publicar o site, gere o subset recente:

```bash
python3 scripts/build-recent.py
```

O arquivo `assets/data/json/recent_jobs.json` não é versionado no git (ver `.gitignore`), mas **deve** existir no servidor junto com `open_jobs.json` para carga progressiva.

O workflow em `.github/workflows/deploy.yml` valida o JSON e produz `recent_jobs.json` como artefato de CI.

## Payload

O catálogo completo tem dezenas de milhares de vagas (~37 MB JSON, ~2 MB gzip). O cliente tenta `.json.gz` primeiro e faz fallback para `.json`.
