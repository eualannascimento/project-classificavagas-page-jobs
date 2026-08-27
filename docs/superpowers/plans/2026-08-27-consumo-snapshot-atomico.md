# Consumo do Snapshot Atomico Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o site consumir somente o snapshot atomico validado do catalogo.

**Architecture:** `fetch-catalog.py` baixa um tar.gz, valida membros e manifesto, e escreve os dois arquivos locais apenas depois da validacao.

**Tech Stack:** Python 3.12, pytest e GitHub Actions.

**Spec:** `.docs/specs/consumo-do-snapshot-atomico.md`

## Task 1. Baixar e validar snapshot

* Modify: `scripts/fetch-catalog.py`, `.github/workflows/deploy.yml`
* Create: `scripts/validate-catalog-manifest.py`, `tests/test_fetch_catalog.py`

- [ ] Escrever RED para tar invalido, membros extras/faltantes, hash divergente e snapshot valido.
- [ ] Baixar somente `catalog_snapshot.tar.gz`, extrair em temporario, validar e mover atomically.
- [ ] Validar manifesto no workflow antes das transformacoes do site.
- [ ] Rodar testes Python, lint e E2E relevante.
