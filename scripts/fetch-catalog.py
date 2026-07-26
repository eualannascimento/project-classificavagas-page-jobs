#!/usr/bin/env python3
"""Baixa o catalogo de vagas do release `catalog` deste repositorio.

O arquivo tem 47 MB e era commitado todo dia util pelo pipeline. Em poucos meses
o repositorio chegou a 673 MB, e cada clone, inclusive o do CI, passou a pagar
por isso. Release asset nao entra no historico do git, entao o repositorio para
de crescer sem que o dado deixe de estar versionado por data de publicacao.

Se o download falhar, o build inteiro falha: e melhor manter no ar a versao
publicada anteriormente do que publicar um site sem catalogo, com a tela de
vagas quebrada para todo visitante.

Uso: python3 scripts/fetch-catalog.py
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DESTINO = ROOT / "assets" / "data" / "json" / "open_jobs.json"
TAG = "catalog"
ASSET = "open_jobs.json"
REPO = "eualannascimento/project-classificavagas-page-jobs"

# Abaixo disso o arquivo certamente nao e o catalogo real (hoje ~47 MB).
MIN_BYTES = 5 * 1024 * 1024


def main() -> int:
    DESTINO.parent.mkdir(parents=True, exist_ok=True)

    resultado = subprocess.run(
        [
            "gh", "release", "download", TAG,
            "--repo", REPO,
            "--pattern", ASSET,
            "--output", str(DESTINO),
            "--clobber",
        ],
        capture_output=True,
        text=True,
    )
    if resultado.returncode != 0:
        print(
            f"ERROR: nao foi possivel baixar o catalogo do release '{TAG}'.\n"
            f"{resultado.stderr.strip()}\n"
            "O build para aqui de proposito: publicar o site sem catalogo "
            "quebraria a tela de vagas para todo visitante.",
            file=sys.stderr,
        )
        return 1

    tamanho = DESTINO.stat().st_size
    if tamanho < MIN_BYTES:
        print(
            f"ERROR: catalogo baixado tem {tamanho/1024/1024:.1f} MB, "
            f"abaixo do minimo de {MIN_BYTES/1024/1024:.0f} MB. "
            "Download truncado ou asset errado.",
            file=sys.stderr,
        )
        return 1

    try:
        with DESTINO.open(encoding="utf-8") as fh:
            dados = json.load(fh)
    except (json.JSONDecodeError, UnicodeDecodeError) as erro:
        print(f"ERROR: catalogo baixado nao e JSON valido: {erro}", file=sys.stderr)
        return 1

    if not isinstance(dados, list) or not dados:
        print("ERROR: catalogo baixado nao e uma lista de vagas nao vazia", file=sys.stderr)
        return 1

    print(f"OK: catalogo baixado do release '{TAG}': {len(dados):,} vagas, "
          f"{tamanho/1024/1024:.1f} MB".replace(",", "."))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
