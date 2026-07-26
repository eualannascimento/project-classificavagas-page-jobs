#!/usr/bin/env python3
"""Confere que todo icone referenciado tem simbolo na pagina que o usa.

Um `<use href="#i-x">` sem `<symbol id="i-x">` nao da erro em lugar nenhum: o
icone simplesmente nao aparece. Sem esta checagem, esquecer de rodar
`build-icons.py` depois de acrescentar um icone passaria no CI e chegaria em
producao como um espaco em branco.

Roda sem fontTools de proposito, para o CI nao precisar da dependencia binaria.

Uso: python3 scripts/validate-icons.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS_DIR = ROOT / "assets" / "js"
PAGINAS = ("index.html", "privacidade.html", "termos.html")

SIMBOLO = re.compile(r'<symbol id="i-([a-z0-9_]+)"')
SPAN_ANTIGO = re.compile(r'<span class="material-symbols-rounded')
FONTE_ANTIGA = re.compile(r"material-symbols-rounded\.woff2|fonts-icons\.css")


def carregar_varredura():
    """Reaproveita a varredura do gerador em vez de reescrever as expressoes.

    Aqui a duplicacao seria pior que o acoplamento: metade dos icones vem de
    nomes montados em tempo de execucao (`#i-${info.icon}`), e um segundo
    conjunto de expressoes so acertaria por coincidencia. Quem checa o resultado
    por outro caminho e o teste e2e, que percorre o DOM ja renderizado.

    `build-icons.py` so importa fontTools dentro de `main()`, entao importar o
    modulo aqui nao traz a dependencia.
    """
    import importlib.util

    caminho = ROOT / "scripts" / "build-icons.py"
    spec = importlib.util.spec_from_file_location("build_icons", caminho)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


def main() -> int:
    falhas: list[str] = []
    gerador = carregar_varredura()

    js_texto = "\n".join(
        arquivo.read_text(encoding="utf-8") for arquivo in sorted(JS_DIR.glob("*.js"))
    )
    esperado = {caminho.name: nomes for caminho, nomes in gerador.paginas().items()}

    for nome in PAGINAS:
        caminho = ROOT / nome
        if not caminho.is_file():
            falhas.append(f"{nome}: pagina ausente")
            continue
        texto = caminho.read_text(encoding="utf-8")

        simbolos = set(SIMBOLO.findall(texto))
        if not simbolos:
            falhas.append(f"{nome}: nenhum <symbol> embutido; rode scripts/build-icons.py")
            continue

        necessarios = esperado.get(nome, set())
        faltando = sorted(necessarios - simbolos)
        if faltando:
            falhas.append(
                f"{nome}: {len(faltando)} icone(s) sem <symbol>: {', '.join(faltando)}. "
                "Rode scripts/build-icons.py."
            )

        sobrando = sorted(simbolos - necessarios)
        if sobrando:
            falhas.append(
                f"{nome}: {len(sobrando)} simbolo(s) sem uso: {', '.join(sobrando)}. "
                "Rode scripts/build-icons.py."
            )

        if SPAN_ANTIGO.search(texto):
            falhas.append(f"{nome}: ainda usa <span> com a fonte de icones")

    # A fonte nao pode voltar a ser referenciada por CSS ou HTML publicado.
    for arquivo in [*(ROOT / nome for nome in PAGINAS), *(ROOT / "assets" / "css").glob("*.css")]:
        if arquivo.is_file() and FONTE_ANTIGA.search(arquivo.read_text(encoding="utf-8")):
            falhas.append(f"{arquivo.name}: volta a referenciar a fonte de icones")

    if SPAN_ANTIGO.search(js_texto):
        falhas.append("assets/js: ainda gera <span> com a fonte de icones")

    if falhas:
        print("ERROR: sprite de icones desatualizado", file=sys.stderr)
        for f in falhas:
            print(f"  - {f}", file=sys.stderr)
        return 1

    total = len(set(SIMBOLO.findall((ROOT / "index.html").read_text(encoding="utf-8"))))
    print(f"OK: {total} icone(s) com simbolo, nenhuma referencia orfa")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
