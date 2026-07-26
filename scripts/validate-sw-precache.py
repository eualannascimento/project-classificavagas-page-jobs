#!/usr/bin/env python3
"""Fail the build when the service worker precaches a file that does not exist.

cache.addAll() is atomic, so a single missing URL disables the whole precache.
That happened silently for two removed scripts, and nothing in CI noticed.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SW = ROOT / "service-worker.js"
SITE = ROOT / "_site"

PRECACHE_BLOCK = re.compile(r"const\s+PRECACHE\s*=\s*\[(.*?)\]", re.DOTALL)
ENTRY = re.compile(r"['\"]([^'\"]+)['\"]")


def version_of(path: Path) -> str | None:
    match = re.search(r"const CACHE_VERSION = '([^']*)'", path.read_text(encoding="utf-8"))
    return match.group(1) if match else None


def parse_precache() -> list[str]:
    match = PRECACHE_BLOCK.search(SW.read_text(encoding="utf-8"))
    if not match:
        print("ERROR: array PRECACHE nao encontrado em service-worker.js", file=sys.stderr)
        raise SystemExit(1)
    return ENTRY.findall(match.group(1))


def main() -> int:
    if not SITE.is_dir():
        print(f"ERROR: {SITE} nao existe. Rode scripts/prepare-deploy.py antes.", file=sys.stderr)
        return 1

    entries = parse_precache()
    missing = []

    for entry in entries:
        # Not lstrip("./"): that strips a character SET, so "./.well-known/x"
        # would lose the leading dot of ".well-known" too.
        relative = entry[2:] if entry.startswith("./") else entry.lstrip("/")
        # './' means the site root, served by index.html
        target = SITE / "index.html" if relative in ("", "/") else SITE / relative
        if not target.exists():
            missing.append(entry)

    if missing:
        print("Entradas do PRECACHE sem arquivo correspondente em _site/:", file=sys.stderr)
        for entry in missing:
            print(f"  - {entry}", file=sys.stderr)
        print(
            "\ncache.addAll() e atomico: qualquer entrada ausente desativa o precache inteiro.",
            file=sys.stderr,
        )
        return 1

    # O nome do cache deriva do CACHE_VERSION e o activate so limpa caches com
    # nome diferente: se o valor publicado for igual ao do repositorio, o deploy
    # nao invalida nada e quem ja visitou o site fica na versao antiga.
    repo_version = version_of(SW)
    site_version = version_of(SITE / "service-worker.js")
    if repo_version == site_version:
        print(
            f"ERROR: CACHE_VERSION publicado ({site_version}) e igual ao do repositorio. "
            "prepare-deploy.py deve gravar um identificador por build.",
            file=sys.stderr,
        )
        return 1

    print(f"OK: {len(entries)} entradas do PRECACHE existem em _site/")
    print(f"OK: CACHE_VERSION do artefato = {site_version} (repo: {repo_version})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
