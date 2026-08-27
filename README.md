# classificavagas.com

Agregador estático de vagas de emprego no Brasil.

## Estrutura

- `index.html`: shell da aplicação
- `termos.html` / `privacidade.html`: termos de uso e política LGPD
- `assets/js/scripts.js`: lógica (filtros, busca, UI)
- `assets/js/jobs-worker.js`: parse do JSON em Web Worker
- `assets/data/json/open_jobs.json`: catálogo completo (formato fixo, atualizado externamente)
- `assets/data/json/open_jobs.json.gz`: mesma carga compactada para download
- `scripts/build-recent.py`: gera `recent_jobs.json` (últimos 14 dias)

## Deploy

O workflow em `.github/workflows/deploy.yml`:

1. Valida `open_jobs.json` e campos críticos de cada vaga
2. Gera `recent_jobs.json` (últimos 14 dias) e `open_jobs.json.gz`
3. Atualiza `lastmod` no `sitemap.xml`
4. Verifica ausência de Google Fonts nos HTML
5. Executa ESLint e smoke test Playwright
6. Publica artefato limpo (`_site/`, sem `_backup/` nem `server.log`) no **GitHub Pages**

O deploy busca exclusivamente o snapshot atômico `catalog_snapshot.tar.gz` no
release `catalog`. Se o asset estiver ausente ou falhar em qualquer validação,
o build para sem substituir o catálogo publicado anteriormente.

Para testar localmente antes do push:

```bash
python3 scripts/build-recent.py
python3 scripts/validate-jobs-schema.py
python3 scripts/build-gzip.py
python3 scripts/check-no-google-fonts.py
python3 scripts/prepare-deploy.py
npm ci && npm run lint && npm run test:e2e
```

## Privacidade e operação

- Fontes self-hosted em `assets/fonts/` (sem CDN externo na navegação)
- Canal único público: `contato@classificavagas.com`
- Recomendado: repositório privado ou organização sem expor dados pessoais do operador; privacidade WHOIS no domínio

## Payload

O catálogo completo tem dezenas de milhares de vagas (~37 MB JSON, ~2 MB gzip). O cliente tenta `.json.gz` primeiro e faz fallback para `.json`.

## Licença

MIT. Ver [LICENSE](./LICENSE).

## Limitações de segurança conhecidas (GitHub Pages)

O GitHub Pages não permite definir cabeçalhos HTTP. O site compensa com
`<meta http-equiv>`, o que cobre parte do caminho:

| Proteção | Situação |
|---|---|
| CSP | aplicada por `<meta http-equiv>`, funciona |
| `Referrer-Policy` | aplicada por `<meta name="referrer">`, funciona |
| `X-Content-Type-Options` | **ignorada** por `<meta>`: só vale como cabeçalho |
| `frame-ancestors` da CSP | **ignorada** por `<meta>`: clickjacking não está coberto |
| `Strict-Transport-Security` | não aplicável por `<meta>`; o Pages já força HTTPS |

Aceito como risco em 2026-07-26. A mitigação disponível seria colocar um
proxy ou CDN com cabeçalhos na frente do domínio, o que adiciona um
intermediário e um custo operacional que hoje não se justificam para um site
estático sem login nem dados no servidor.
