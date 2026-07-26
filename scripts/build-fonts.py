#!/usr/bin/env python3
"""Generate subsetted woff2 files for the Barlow families from the source TTFs.

The TTFs ship the full glyph set (~85 KB each) and are loaded on the very first
paint. Subsetting to the Latin ranges we actually render and converting to
woff2 cuts that by roughly 80% with no visible difference.

Requires: pip install fonttools brotli
Run from the repository root:  python3 scripts/build-fonts.py
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / "assets" / "fonts"

# Basic Latin + Latin-1 + Latin Extended-A/B + punctuation and the few symbols
# the interface uses. Comfortably covers pt-BR.
UNICODES = ",".join([
    "U+0000-00FF",
    "U+0100-024F",
    "U+0259",
    "U+1E00-1EFF",
    "U+2000-206F",
    "U+20AC",
    "U+2122",
    "U+2190-2193",
    "U+2212",
    "U+2215",
    "U+FEFF",
    "U+FFFD",
])

SOURCES = [
    "barlow-400.ttf",
    "barlow-500.ttf",
    "barlow-700.ttf",
    "barlow-condensed-400.ttf",
    "barlow-condensed-600.ttf",
]


def build() -> int:
    total_before = 0
    total_after = 0

    for name in SOURCES:
        source = FONT_DIR / name
        if not source.is_file():
            print(f"ERROR: fonte de origem ausente: {source}", file=sys.stderr)
            return 1

        target = source.with_suffix(".woff2")
        result = subprocess.run(
            [
                sys.executable, "-m", "fontTools.subset", str(source),
                f"--output-file={target}",
                "--flavor=woff2",
                f"--unicodes={UNICODES}",
                "--layout-features=kern,liga,clig,calt",
                "--desubroutinize",
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            print(f"ERROR ao processar {name}:\n{result.stderr}", file=sys.stderr)
            return 1

        before = source.stat().st_size
        after = target.stat().st_size
        total_before += before
        total_after += after
        print(f"  {name}: {before/1024:.0f} KB -> {target.name}: {after/1024:.0f} KB")

    saved = 100 * (1 - total_after / total_before)
    print(f"OK: {total_before/1024:.0f} KB -> {total_after/1024:.0f} KB ({saved:.0f}% menor)")
    return 0


if __name__ == "__main__":
    raise SystemExit(build())
