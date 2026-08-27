# Task 1 — Baixar e validar snapshot

## Implementado

- `fetch-catalog.py` baixa somente `catalog_snapshot.tar.gz`, extrai em diretório temporário e aceita exatamente `open_jobs.json` e `catalog_manifest.json`.
- O manifesto valida JSON, schema, contagem e SHA-256 antes de qualquer substituição dos arquivos locais.
- O workflow executa a validação do manifesto antes das transformações do catálogo.

## Testes

- RED e GREEN: `python3 -m unittest tests/test_fetch_catalog.py -v`
- Suíte Python: `python3 -m unittest discover -s tests -p 'test_*.py' -v`
- Compilação: `PYTHONPYCACHEPREFIX=/private/tmp/classifica-vagas-site-pycache python3 -m py_compile scripts/fetch-catalog.py scripts/validate-catalog-manifest.py`

`npm`, `node` e `npx` não estão instalados neste ambiente; por isso, lint e Playwright E2E não puderam ser executados localmente.
