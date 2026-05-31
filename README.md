# classificavagas.com

Agregador estático de vagas de emprego no Brasil.

## Estrutura

- `index.html` — shell da aplicação
- `termos.html` / `privacidade.html` — termos de uso e política LGPD
- `assets/js/scripts.js` — lógica (filtros, busca, UI)
- `assets/js/jobs-worker.js` — parse do JSON em Web Worker
- `assets/data/json/open_jobs.json` — catálogo completo (formato fixo, atualizado externamente)
- `assets/data/json/open_jobs.json.gz` — mesma carga compactada para download
- `scripts/build-recent.py` — gera `recent_jobs.json` (últimos 14 dias)

## Deploy

O workflow em `.github/workflows/deploy.yml`:

1. Valida `open_jobs.json`
2. Gera `recent_jobs.json` (últimos 14 dias)
3. Verifica ausência de Google Fonts nos HTML
4. Publica no **GitHub Pages** (branch `main`), incluindo `recent_jobs.json` no artefato publicado

Para testar localmente antes do push:

```bash
python3 scripts/build-catalog.py
python3 scripts/check-no-google-fonts.py
```

## Privacidade e operação

- Fontes self-hosted em `assets/fonts/` (sem CDN externo na navegação)
- Canal único público: `contato@classificavagas.com`
- Recomendado: repositório privado ou organização sem expor dados pessoais do operador; privacidade WHOIS no domínio

## Payload

O catálogo completo tem dezenas de milhares de vagas (~37 MB JSON, ~2 MB gzip). O cliente tenta `.json.gz` primeiro e faz fallback para `.json`.
