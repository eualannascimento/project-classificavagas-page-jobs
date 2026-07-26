#!/usr/bin/env python3
"""Prepare a clean deploy directory excluding dev artifacts.

Exclusions are matched at ANY depth, not just at the repository root. The
previous version only checked the first path segment, so everything under
`resume/` (its docs, specs, issues, tests and agent instructions) was being
published to the live site.
"""

from __future__ import annotations

import fnmatch
import hashlib
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "_site"

# js/vendor/ NAO entra aqui: o jsPDF e as fontes sao carregados sob demanda
# pelo botao de exportar PDF e precisam estar publicados.
# Directory names blocked wherever they appear in the tree.
EXCLUDE_DIR_NAMES = {
    "_backup",
    "_site",
    "node_modules",
    "scripts",
    "tests",
    "test-results",
    "playwright-report",
    "blob-report",
}

# Directory name patterns blocked wherever they appear.
EXCLUDE_DIR_GLOBS = ("issues-*",)

# Hidden directories are blocked by default; these are part of the site.
ALLOWED_HIDDEN_DIRS = {".well-known"}

# Hidden files are blocked by default so a stray .env or .cursorrules can
# never be published; only these are part of the site.
ALLOWED_HIDDEN_FILES = {".nojekyll"}

EXCLUDE_FILE_NAMES = {
    "server.log",
    "package-lock.json",
    "package.json",
    "playwright.config.js",
    "eslint.config.js",
    "CLAUDE.md",
    "AGENTS.md",
    ".cursorrules",
    "README.md",
    "CONTRIBUTING.md",
    "CHANGELOG.md",
    "SECURITY.md",
}

EXCLUDE_FILE_GLOBS = ("prd-*.md", "*.spec.js", "*.plan.md")

# Files that carry no extension but belong to the published site.
ALLOWED_EXTENSIONLESS = {"CNAME", "LICENSE"}

# Only these extensions may reach the published artifact.
ALLOWED_SUFFIXES = {
    ".html", ".css", ".js", ".json", ".gz", ".map", ".webmanifest",
    ".woff2", ".woff", ".ttf",
    ".svg", ".png", ".jpg", ".jpeg", ".webp", ".ico", ".avif",
    ".txt", ".xml",
}


def should_skip(rel: Path) -> bool:
    """True when `rel` (relative to ROOT) must not be published."""
    parts = rel.parts

    for part in parts[:-1]:
        if part in EXCLUDE_DIR_NAMES:
            return True
        if part.startswith(".") and part not in ALLOWED_HIDDEN_DIRS:
            return True
        if any(fnmatch.fnmatch(part, pattern) for pattern in EXCLUDE_DIR_GLOBS):
            return True

    name = rel.name
    if name.startswith("."):
        return name not in ALLOWED_HIDDEN_FILES
    if name in EXCLUDE_FILE_NAMES:
        return True
    if any(fnmatch.fnmatch(name, pattern) for pattern in EXCLUDE_FILE_GLOBS):
        return True

    suffix = rel.suffix.lower()
    if not suffix:
        return name not in ALLOWED_EXTENSIONLESS
    if suffix not in ALLOWED_SUFFIXES:
        return True

    return False


def stamp_cache_version() -> str:
    """Grava um CACHE_VERSION unico por build no service worker do artefato.

    O nome do cache deriva desse valor, e o handler de activate so apaga caches
    com nome diferente do atual. Com a versao fixa no codigo, um deploy novo
    reaproveitava o cache antigo e quem ja tinha visitado o site continuava
    recebendo os arquivos velhos ate alguem lembrar de subir o numero na mao.
    """
    try:
        build_id = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=ROOT, capture_output=True, text=True, check=True,
        ).stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        # Fora de um clone git, o conteudo publicado define a identidade.
        digest = hashlib.sha256()
        for path in sorted(OUT.rglob("*")):
            if path.is_file() and path.suffix in {".html", ".css", ".js"}:
                digest.update(path.read_bytes())
        build_id = digest.hexdigest()[:12]

    sw = OUT / "service-worker.js"
    if not sw.is_file():
        raise SystemExit("ERROR: service-worker.js ausente do artefato")

    text = sw.read_text(encoding="utf-8")
    new_text, count = re.subn(
        r"const CACHE_VERSION = '[^']*';",
        f"const CACHE_VERSION = '{build_id}';",
        text,
        count=1,
    )
    if count != 1:
        raise SystemExit("ERROR: nao foi possivel definir CACHE_VERSION no service worker")

    sw.write_text(new_text, encoding="utf-8")
    return build_id


ASSET_REF_RE = re.compile(r'(src|href)="([^"#?:]+\.(?:css|js))"')


def version_asset_refs(build_id: str) -> int:
    """Anexa ?v=<build_id> as referencias locais de css e js nos HTML do artefato.

    O GitHub Pages serve os assets com max-age=600 e os arquivos nao tem hash no
    nome, entao por ate dez minutos depois de um deploy o navegador continua
    usando o css e o js antigos que ja tem em cache. Com a query, cada deploy
    gera uma URL nova e a correcao chega na primeira visita.

    Os nomes dos arquivos nao mudam, entao o PRECACHE do service worker (que
    lista caminhos sem query) continua valido.
    """
    total = 0
    for html in OUT.rglob("*.html"):
        text = html.read_text(encoding="utf-8")
        new_text, count = ASSET_REF_RE.subn(
            lambda m: f'{m.group(1)}="{m.group(2)}?v={build_id}"', text
        )
        if count:
            html.write_text(new_text, encoding="utf-8")
            total += count
    return total


def copy_tree() -> int:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()

    copied = 0
    skipped = 0
    for item in ROOT.rglob("*"):
        if item == OUT or OUT in item.parents:
            continue
        if not item.is_file():
            continue

        rel = item.relative_to(ROOT)
        if should_skip(rel):
            skipped += 1
            continue

        dest = OUT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(item, dest)
        copied += 1

    build_id = stamp_cache_version()
    stamped = version_asset_refs(build_id)
    print(f"OK: deploy artifact prepared at {OUT} ({copied} files, {skipped} skipped)")
    print(f"OK: service worker CACHE_VERSION = {build_id}")
    print(f"OK: {stamped} referencia(s) de css/js versionada(s) com ?v={build_id}")
    return copied


if __name__ == "__main__":
    if copy_tree() == 0:
        print("ERROR: nothing was copied", file=sys.stderr)
        raise SystemExit(1)
