#!/usr/bin/env python3
"""Build recent_jobs.json: the small slice shown while the full catalog loads.

It used to filter by `inserted_date >= today - 14d`. The pipeline stamps that
field with the run date, so every job matched and the "recent" file ended up
the same size as the full catalog: visitors downloaded ~6.4 MB to see the same
data twice. Now it ranks by publication date and is capped, so the first paint
stays cheap no matter what the upstream data looks like.
"""

from __future__ import annotations

import gzip
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "data" / "json" / "open_jobs.json"
TARGET = ROOT / "assets" / "data" / "json" / "recent_jobs.json"

MAX_JOBS = 2000
MAX_GZIP_BYTES = 512 * 1024

ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}")
BR_DATE = re.compile(r"(\d{2})/(\d{2})/(\d{4})")


def as_iso_date(value: object) -> str:
    """Normalizes a published_date into 'YYYY-MM-DD', or '' when unusable.

    The catalog mixes five shapes: ISO date, ISO datetime, epoch numbers,
    dd/mm/yyyy and empty. Comparing them raw sorts wrong (and raises TypeError
    between int and str), so everything is flattened to ISO here.
    """
    if isinstance(value, (int, float)) and not isinstance(value, bool) and value > 0:
        seconds = value / 1000 if value > 10_000_000_000 else value
        try:
            return datetime.fromtimestamp(seconds, tz=timezone.utc).strftime("%Y-%m-%d")
        except (OverflowError, OSError, ValueError):
            return ""

    if not isinstance(value, str) or not value:
        return ""

    if ISO_DATE.match(value):
        return value[:10]

    match = BR_DATE.fullmatch(value)
    if match:
        day, month, year = match.groups()
        return f"{year}-{month}-{day}"

    return ""


def sort_key(job: dict) -> tuple[str, str]:
    """Most recently published first; inserted_date breaks ties."""
    return (as_iso_date(job.get("published_date")), str(job.get("inserted_date") or ""))


def main() -> int:
    with SOURCE.open(encoding="utf-8") as fh:
        jobs = json.load(fh)

    recent = sorted(jobs, key=sort_key, reverse=True)[:MAX_JOBS]

    payload = json.dumps(recent, ensure_ascii=False, separators=(",", ":"))
    TARGET.write_text(payload, encoding="utf-8")

    compressed = len(gzip.compress(payload.encode("utf-8")))
    print(
        f"Wrote {len(recent)} jobs (of {len(jobs)}) to {TARGET.name} "
        f"[{compressed/1024:.0f} KB comprimido]"
    )

    if compressed > MAX_GZIP_BYTES:
        print(
            f"ERROR: recent_jobs comprimido tem {compressed/1024:.0f} KB, "
            f"acima do teto de {MAX_GZIP_BYTES/1024:.0f} KB. "
            "Reduza MAX_JOBS: esse arquivo bloqueia a primeira renderizacao.",
            file=sys.stderr,
        )
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
