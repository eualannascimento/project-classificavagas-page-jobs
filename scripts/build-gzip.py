#!/usr/bin/env python3
"""Build gzip artifact for open_jobs.json."""

from __future__ import annotations

import gzip
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets/data/json/open_jobs.json"
TARGET = ROOT / "assets/data/json/open_jobs.json.gz"


def main() -> None:
    raw = SOURCE.read_bytes()
    json.loads(raw.decode("utf-8"))

    with gzip.open(TARGET, "wb", compresslevel=9) as gz:
        gz.write(raw)

    print(f"OK: wrote {TARGET} ({TARGET.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
