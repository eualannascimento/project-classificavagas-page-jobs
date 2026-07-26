#!/usr/bin/env python3
"""Traz o gerador de curriculo do repositorio de origem para `resume/`.

Antes, `resume/` era uma copia manual versionada aqui. As duas copias
divergiram nos dois sentidos: a tela inicial existia so na origem, e o card
"Continuar de onde parei" e o grid responsivo existiam so aqui. Corrigir um bug
exigia lembrar de editar os dois lugares, e mais de uma vez nao lembramos.

Agora existe uma fonte unica: project-classificavagas-page-resume. Este script
substitui `resume/` pelo conteudo daquele repositorio e imprime o commit usado,
para o deploy ficar rastreavel.

Uso:
    python3 scripts/sync-resume.py            # sincroniza com o main da origem
    python3 scripts/sync-resume.py <commit>   # fixa um commit especifico
"""

from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "resume"
ORIGIN = "https://github.com/eualannascimento/project-classificavagas-page-resume.git"


def run(args: list[str], cwd: Path | None = None) -> str:
    result = subprocess.run(args, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ERROR: {' '.join(args)}\n{result.stderr}", file=sys.stderr)
        raise SystemExit(1)
    return result.stdout.strip()


def main() -> int:
    ref = sys.argv[1] if len(sys.argv) > 1 else "main"

    with tempfile.TemporaryDirectory() as tmp:
        clone = Path(tmp) / "resume"
        run(["git", "clone", "--quiet", "--depth", "1", "--branch", ref, ORIGIN, str(clone)])
        sha = run(["git", "rev-parse", "--short", "HEAD"], cwd=clone)

        # index.html e obrigatorio: sem ele o clone veio errado e e melhor
        # falhar aqui do que publicar o site sem o gerador.
        if not (clone / "index.html").is_file():
            print("ERROR: clone da origem nao contem index.html", file=sys.stderr)
            return 1

        shutil.rmtree(clone / ".git", ignore_errors=True)
        if TARGET.exists():
            shutil.rmtree(TARGET)
        shutil.copytree(clone, TARGET)

    total = sum(1 for p in TARGET.rglob("*") if p.is_file())
    # O identificador de build precisa incluir este commit: sem isso, uma
    # mudanca so no gerador nao alterava as URLs com ?v= e o navegador seguia
    # usando o css antigo que ja tinha em cache.
    (ROOT / ".resume-sha").write_text(sha + "\n", encoding="utf-8")
    print(f"OK: resume/ sincronizado de {ref} ({sha}), {total} arquivo(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
