#!/usr/bin/env python3
"""Embute nas paginas o sprite SVG dos icones, extraido da propria fonte.

A fonte Material Symbols pesa 407 KB e carrega 3.993 glifos para os 39 que a
pagina usa. Era o maior arquivo do primeiro acesso. Reduzir por subset nao
funcionou (a fonte nao instancia bem), entao os contornos usados sao extraidos e
viram um sprite `<symbol>` embutido no HTML: sem requisicao extra, sem espera e
sem icone aparecendo depois do texto.

Os contornos saem do proprio `.woff2` que esta em producao, entao o desenho e
identico ao que o visitante ve hoje. A fonte fica no repositorio como origem do
desenho, mas sai do deploy.

O resultado e commitado. Este script so precisa rodar quando a lista de icones
muda; o CI valida com `scripts/validate-icons.py`, que nao depende de fontTools.

Uso:
    python3 -m venv .venv-fonts && .venv-fonts/bin/pip install fonttools brotli
    .venv-fonts/bin/python scripts/build-icons.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTE = ROOT / "assets" / "fonts" / "material-symbols-rounded.woff2"
JS_DIR = ROOT / "assets" / "js"

INICIO = "<!-- ICONES: gerado por scripts/build-icons.py. Nao editar a mao. -->"
FIM = "<!-- FIM ICONES -->"

# O viewBox do Material Symbols vai de 0 a -960 no eixo Y, com a linha de base
# em y=0. A fonte guarda o contorno com o Y para CIMA e o SVG desenha com o Y
# para BAIXO, entao o caminho precisa ser espelhado: sem o scale(1,-1) o desenho
# cai inteiro fora do viewBox e o icone aparece do tamanho certo, em branco.
VIEWBOX = "0 -960 960 960"
ESPELHO = "scale(1,-1)"

DIRETOS = [
    # <svg class="material-symbols-rounded"><use href="#i-search"></use></svg>
    re.compile(r'href="#i-([a-z0-9_]+)"'),
    # <span class="material-symbols-rounded">search</span> (formato antigo)
    re.compile(r'class="material-symbols-rounded[^"]*"[^>]*>\s*([a-z0-9_]+)\s*<'),
    # { key: 'level', label: 'Nivel', icon: 'trending_up' }
    re.compile(r"\bicon:\s*'([a-z0-9_]+)'"),
]

# Mapas cujo nome contem "icon": { remote: 'home_work', hybrid: 'sync_alt' }.
# O nome do icone nao aparece ao lado de nenhuma palavra-chave nesses casos, so
# o nome da variavel denuncia. A varredura estatica nao alcanca todo caso
# possivel: quem fecha a lacuna e o teste e2e, que percorre o DOM renderizado e
# falha se algum <use> apontar para um simbolo inexistente.
MAPAS = re.compile(r"[A-Za-z_]*[Ii][Cc][Oo][Nn][A-Za-z_]*\s*[:=]\s*\{([^}]*)\}")


def nomes_do_texto(texto: str) -> set[str]:
    nomes: set[str] = set()
    for padrao in DIRETOS:
        nomes.update(padrao.findall(texto))
    for bloco in MAPAS.findall(texto):
        nomes.update(re.findall(r"'([a-z0-9_]{2,})'", bloco))
    return nomes


def paginas() -> dict[Path, set[str]]:
    """Cada pagina recebe so os icones que ela usa.

    `index.html` recebe tambem os que o JS desenha em tempo de
    execucao, porque e nela que os cartoes de vaga sao montados.
    """
    js: set[str] = set()
    for arquivo in sorted(JS_DIR.glob("*.js")):
        js |= nomes_do_texto(arquivo.read_text(encoding="utf-8"))
    resultado: dict[Path, set[str]] = {}
    for nome in ("index.html", "privacidade.html", "termos.html"):
        caminho = ROOT / nome
        if not caminho.is_file():
            continue
        proprios = nomes_do_texto(caminho.read_text(encoding="utf-8"))
        resultado[caminho] = proprios | js if nome == "index.html" else proprios
    return resultado


def sprite(nomes: list[str], glifos, ligaduras: dict[str, str], desenhar) -> str:
    linhas = [
        INICIO,
        '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">',
    ]
    for nome in nomes:
        linhas.append(
            f'<symbol id="i-{nome}" viewBox="{VIEWBOX}">'
            f'<path transform="{ESPELHO}" d="{desenhar(glifos, ligaduras[nome])}"/></symbol>'
        )
    linhas.append("</svg>")
    linhas.append(FIM)
    return "\n".join(linhas)


def mapa_de_ligaduras(fonte) -> dict[str, str]:
    """Mapeia o nome do icone para o glifo que a fonte desenha.

    A fonte funciona por ligadura: o texto "search" dentro do elemento vira um
    glifo so. O nome do icone nem sempre e o nome do glifo ("business" desenha o
    glifo "domain"), entao ler o nome do glifo direto erra. E as ligaduras sao
    guardadas por NOME DE GLIFO, nao por caractere: o "_" se chama "underscore",
    entao todo icone com underscore precisa da traducao pelo cmap.
    """
    para_char: dict[str, str] = {}
    for codigo, nome_glifo in fonte.getBestCmap().items():
        para_char.setdefault(nome_glifo, chr(codigo))

    ligaduras: dict[str, str] = {}

    def coletar(subtabela) -> None:
        if subtabela.__class__.__name__ == "LigatureSubst":
            for primeiro, lista in subtabela.ligatures.items():
                for ligadura in lista:
                    partes = [primeiro, *ligadura.Component]
                    if all(p in para_char for p in partes):
                        # .lower() de proposito: o cmap aponta o glifo "a" tanto
                        # de 'A' quanto de 'a' (a fonte aceita o nome do icone em
                        # qualquer caixa), e sem isso a chave sai em maiuscula.
                        nome = "".join(para_char[p] for p in partes).lower()
                        ligaduras[nome] = ligadura.LigGlyph
        elif hasattr(subtabela, "ExtSubTable"):
            coletar(subtabela.ExtSubTable)

    for lookup in fonte["GSUB"].table.LookupList.Lookup:
        for subtabela in lookup.SubTable:
            coletar(subtabela)
    return ligaduras


def main() -> int:
    try:
        from fontTools.pens.svgPathPen import SVGPathPen
        from fontTools.ttLib import TTFont
    except ImportError:
        print(
            "ERROR: este script precisa de fontTools e brotli.\n"
            "  python3 -m venv .venv-fonts && .venv-fonts/bin/pip install fonttools brotli",
            file=sys.stderr,
        )
        return 1

    if not FONTE.is_file():
        print(f"ERROR: fonte de origem ausente: {FONTE}", file=sys.stderr)
        return 1

    fonte = TTFont(FONTE)
    glifos = fonte.getGlyphSet()
    ligaduras = mapa_de_ligaduras(fonte)

    def desenhar(conjunto, glifo: str) -> str:
        caneta = SVGPathPen(conjunto)
        conjunto[glifo].draw(caneta)
        return caneta.getCommands()

    mapa = paginas()
    if not mapa:
        print("ERROR: nenhuma pagina encontrada", file=sys.stderr)
        return 1

    todos = sorted(set().union(*mapa.values()))
    ausentes = [n for n in todos if n not in ligaduras]
    if ausentes:
        print(
            f"ERROR: {len(ausentes)} icone(s) sem glifo na fonte: {', '.join(ausentes)}",
            file=sys.stderr,
        )
        return 1

    for caminho, nomes in sorted(mapa.items()):
        texto = caminho.read_text(encoding="utf-8")
        bloco = sprite(sorted(nomes), glifos, ligaduras, desenhar)

        if INICIO in texto and FIM in texto:
            inicio = texto.index(INICIO)
            fim = texto.index(FIM) + len(FIM)
            novo = texto[:inicio] + bloco + texto[fim:]
        else:
            marcador = re.search(r"<body[^>]*>", texto)
            if not marcador:
                print(f"ERROR: {caminho.name} nao tem <body>", file=sys.stderr)
                return 1
            corte = marcador.end()
            novo = texto[:corte] + "\n" + bloco + texto[corte:]

        caminho.write_text(novo, encoding="utf-8")
        print(f"OK: {caminho.name}: {len(nomes)} icone(s), {len(bloco) / 1024:.1f} KB")

    print(
        f"OK: {len(todos)} icone(s) no total. "
        f"A fonte de origem tem {FONTE.stat().st_size / 1024:.0f} KB e sai do deploy."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
