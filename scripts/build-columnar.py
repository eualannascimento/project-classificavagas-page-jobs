#!/usr/bin/env python3
"""Gera o catálogo em formato colunar, que é o que o navegador baixa.

O catálogo passou de 121 mil para 204 mil vagas, e o `open_jobs.json` foi de
90 MB para 143 MB. Medido no build de 2026-08-25: o heap JavaScript chega a
347 MB num celular emulado, patamar em que o navegador começa a matar a aba.

Duas economias, nenhuma delas perde dado que o site use:

1. **Só os campos que o site lê.** Sete dos vinte e quatro nunca são lidos:
   `content_hash`, `published_date_source`, `contract_source`, `removed_date`,
   `department`, `site_type` e `experience_level`.

   `inserted_date` esteve nesta lista por engano e saiu do catálogo colunar.
   O site lê o campo em dez pontos: o filtro "Adicionadas hoje", o intervalo
   "Obtida no Classifica Vagas", a ordenação por data de agregação, o ponto de
   novidade no cartão e a linha de data da visão em lista. Sem o campo, os
   cinco recursos ficam mudos, e a lista imprime "Obtida no Classifica Vagas:
   Não obtida" nas 213 mil vagas. O `recent_jobs.json` das primeiras vagas
   carrega o campo, então o comportamento ainda regredia no meio da sessão,
   quando o catálogo completo substituía a carga rápida.

   Custo medido no catálogo de 2026-08-30: +66 KB no gzip (+0,8%).
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
    "published_date",
    "inserted_date",
)


# Um campo vira dicionário quando os valores distintos são menos que esta
# fração das linhas. Acima dela o índice custa mais do que o texto repetido.
LIMITE_DICIONARIO = 0.5


def _coluna(valores: list[str]) -> dict | list:
    """Dicionário mais índices, ou a coluna literal.

    Medido no catálogo de 2026-08-30, 211.209 vagas: quinze dos dezesseis
    campos entram no dicionário. `title` e `url` ficam literais, porque quase
    todo valor é único e o índice só acrescentaria bytes.
    """
    distintos = sorted(set(valores))
    if len(distintos) >= len(valores) * LIMITE_DICIONARIO:
        return valores
    posicao = {valor: indice for indice, valor in enumerate(distintos)}
    return {"dic": distintos, "idx": [posicao[valor] for valor in valores]}


def para_colunar(vagas: list[dict]) -> dict:
    """Valores agrupados por campo, e não por vaga.

    O formato anterior chamava-se colunar mas guardava uma lista por vaga, com
    os dezessete valores misturados. O gzip comprime melhor o que se parece e
    está perto: agrupar por campo tira 22% do arquivo publicado sem mudar um
    único dado. Ver .docs/specs/catalogo-agrupado-por-campo.md.
    """
    return {
        "campos": list(CAMPOS),
        "colunas": [
            _coluna([vaga.get(campo, "") for vaga in vagas])
            for campo in CAMPOS
        ],
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
