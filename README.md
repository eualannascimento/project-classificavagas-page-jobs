# classificavagas.com

Agregador estático de vagas de emprego no Brasil.

## Estrutura

- `index.html` — shell da aplicação
- `termos.html` / `privacidade.html` — termos de uso e política LGPD
- `assets/js/scripts.js` — lógica (filtros, busca, UI)
- `assets/js/jobs-worker.js` — parse do JSON em Web Worker
- `assets/data/json/open_jobs.json` — catálogo completo (formato fixo, atualizado externamente)
- `assets/data/json/open_jobs.json.gz` — mesma carga compactada para download
- `assets/data/json/open_jobs.meta.json` — versão do catálogo e facetas de filtro (gerado no build)
- `scripts/build-catalog.py` — gera `meta`, `recent_jobs.json` e arquivos `.gz`

## Deploy

O workflow em `.github/workflows/deploy.yml`:

1. Valida `open_jobs.json`
2. Gera `open_jobs.meta.json`, `recent_jobs.json` e payloads `.gz`
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

O catálogo completo tem dezenas de milhares de vagas (~37 MB JSON, ~2 MB gzip). O cliente carrega `open_jobs.meta.json` (~85 KB) para facetas de filtro, tenta cache local (IndexedDB) e depois `.json.gz` com parse em Web Worker.

**Performance (sem servidor):** na segunda visita, o catálogo costuma abrir a partir do IndexedDB (mesma versão do `meta.json`), evitando novo download de ~2 MB e novo `JSON.parse` de 70k+ objetos.
