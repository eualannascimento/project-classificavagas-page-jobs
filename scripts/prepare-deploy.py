#!/usr/bin/env python3
"""Prepare a clean deploy directory excluding dev artifacts."""

from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "_site"

EXCLUDE_DIRS = {
    ".git",
    ".github",
    "_backup",
    "_site",
    "node_modules",
    "tests",
    "scripts",
}

EXCLUDE_FILES = {
    "server.log",
    "package-lock.json",
}


def should_skip(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    parts = rel.parts
    if parts and parts[0] in EXCLUDE_DIRS:
        return True
    if path.name in EXCLUDE_FILES:
        return True
    if path.suffix in {".plan.md"}:
        return True
    return False


def copy_tree() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()

    for item in ROOT.rglob("*"):
        if item == OUT or OUT in item.parents:
            continue
        rel = item.relative_to(ROOT)
        if rel.parts and rel.parts[0] in EXCLUDE_DIRS:
            continue
        if item.name in EXCLUDE_FILES:
            continue
        if not item.is_file():
            continue
        dest = OUT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(item, dest)

    print(f"OK: deploy artifact prepared at {OUT}")


if __name__ == "__main__":
    copy_tree()
