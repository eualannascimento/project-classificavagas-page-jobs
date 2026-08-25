#!/usr/bin/env python3
"""Gera o catálogo em formato colunar, que é o que o navegador baixa.

O catálogo passou de 121 mil para 204 mil vagas, e o `open_jobs.json` foi de
90 MB para 143 MB. Medido no build de 2026-08-25: o heap JavaScript chega a
347 MB num celular emulado, patamar em que o navegador começa a matar a aba.

Duas economias, nenhuma delas perde dado que o site use:

1. **Só os campos que o site lê.** Oito dos vinte e quatro nunca são lidos:
   `content_hash`, `published_date_source`, `contract_source`, `removed_date`,
   `department`, `site_type`, `experience_level` e `inserted_date`.
2. **Cabeçalho uma vez, valores em array.** Repetir o nome das chaves em cada
   uma das 204 mil vagas custa 36 MB sozinho.

O `open_jobs.json` completo continua sendo publicado no release e serve de
fonte para este build: aqui só nasce a versão que o navegador consome.
"""

from __future__ import annotations

import gzip
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "data" / "json" / "open_jobs.json"
TARGET = ROOT / "assets" / "data" / "json" / "catalog.json"
TARGET_GZ = ROOT / "assets" / "data" / "json" / "catalog.json.gz"

# A ordem é o contrato com o site: ele monta o objeto lendo `campos`, então
# acrescentar no fim é seguro e reordenar não é.
CAMPOS = (
    "company",
    "company_type",
    "title",
    "url",
    "location",
    "contract",
    "location_country",
    "location_state",
    "location_city",
    "location_scope",
    "category",
    "level",
    "affirmative?",
    "remote?",
    "temporary?",
    "published_date",
)


def para_colunar(vagas: list[dict]) -> dict:
    return {
        "campos": list(CAMPOS),
        "vagas": [[vaga.get(campo, "") for campo in CAMPOS] for vaga in vagas],
    }


def main() -> None:
    vagas = json.loads(SOURCE.read_text(encoding="utf-8"))
    if not isinstance(vagas, list) or not vagas:
        raise SystemExit("open_jobs.json vazio ou fora do formato esperado")

    bruto = json.dumps(
        para_colunar(vagas), ensure_ascii=False, separators=(",", ":"),
    ).encode("utf-8")
    TARGET.write_bytes(bruto)

    with gzip.open(TARGET_GZ, "wb", compresslevel=9) as gz:
        gz.write(bruto)

    origem = SOURCE.stat().st_size
    print(
        f"OK: {len(vagas):,} vagas | {origem:,} -> {len(bruto):,} bytes "
        f"({100 - len(bruto) * 100 // origem}% menor) | gz {TARGET_GZ.stat().st_size:,}",
    )


if __name__ == "__main__":
    main()
