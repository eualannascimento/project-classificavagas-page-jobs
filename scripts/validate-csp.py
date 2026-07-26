#!/usr/bin/env python3
"""Confere que nada volta a precisar de 'unsafe-inline' no style-src.

Com `style-src 'self'`, um unico `style="..."` que reapareca (no HTML ou dentro
de um template de string do JS) e silenciosamente ignorado pelo navegador: o
elemento aparece sem o estilo, sem erro visivel na pagina. O prejuizo e um
layout quebrado que ninguem associa a CSP.

Nao confundir com `elemento.style.x = y`, que a CSP nao bloqueia: o que ela
barra e o ATRIBUTO style, inclusive quando chega por innerHTML.

Uso: python3 scripts/validate-csp.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGINAS = ("index.html", "privacidade.html", "termos.html")
JS_DIR = ROOT / "assets" / "js"

ATRIBUTO_STYLE = re.compile(r'\sstyle="[^"]*"')
SET_ATTRIBUTE_STYLE = re.compile(r"""setAttribute\(\s*['"]style['"]""")
TAG_STYLE = re.compile(r"<style[\s>]")
DIRETIVA = re.compile(r"style-src([^;\"]*)")


def main() -> int:
    falhas: list[str] = []

    for nome in PAGINAS:
        caminho = ROOT / nome
        if not caminho.is_file():
            falhas.append(f"{nome}: pagina ausente")
            continue
        texto = caminho.read_text(encoding="utf-8")

        diretiva = DIRETIVA.search(texto)
        if not diretiva:
            falhas.append(f"{nome}: sem diretiva style-src na CSP")
        elif "unsafe-inline" in diretiva.group(1):
            falhas.append(f"{nome}: style-src voltou a aceitar 'unsafe-inline'")

        for achado in ATRIBUTO_STYLE.findall(texto):
            falhas.append(f"{nome}: atributo style inline ->{achado.strip()}")
        if TAG_STYLE.search(texto):
            falhas.append(f"{nome}: bloco <style> inline")

    for arquivo in sorted(JS_DIR.glob("*.js")):
        texto = arquivo.read_text(encoding="utf-8")
        for achado in ATRIBUTO_STYLE.findall(texto):
            falhas.append(f"assets/js/{arquivo.name}: gera atributo style ->{achado.strip()}")
        if SET_ATTRIBUTE_STYLE.search(texto):
            falhas.append(f"assets/js/{arquivo.name}: usa setAttribute('style')")

    if falhas:
        print("ERROR: estilo inline incompativel com style-src 'self'", file=sys.stderr)
        for f in falhas:
            print(f"  - {f}", file=sys.stderr)
        return 1

    print("OK: style-src 'self' sem estilo inline nas paginas e no JS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
