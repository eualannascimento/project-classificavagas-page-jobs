#!/usr/bin/env python3
"""Build catalog artifacts: meta, recent slice, gzip payloads."""
from __future__ import annotations

import gzip
import hashlib
import json
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "assets" / "data" / "json"
SOURCE = DATA_DIR / "open_jobs.json"
META = DATA_DIR / "open_jobs.meta.json"
RECENT = DATA_DIR / "recent_jobs.json"
RECENT_MAX_AGE_DAYS = 14

FILTER_KEYS = [
    "company_type",
    "level",
    "category",
    "company",
    "location_scope",
    "location_country",
    "location_state",
    "location_city",
]


def catalog_version(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()[:16]


def build_filter_facets(jobs: list[dict]) -> tuple[dict, dict]:
    options: dict[str, list[str]] = {}
    counts: dict[str, dict[str, int]] = {}
    buckets: dict[str, dict[str, int]] = {key: defaultdict(int) for key in FILTER_KEYS}

    for job in jobs:
        for key in FILTER_KEYS:
            value = job.get(key)
            if value:
                buckets[key][value] += 1

    for key in FILTER_KEYS:
        values = sorted(buckets[key].keys(), key=lambda v: str(v).casefold())
        options[key] = values
        counts[key] = dict(buckets[key])

    return options, counts


def write_gzip(path: Path, payload: bytes) -> None:
    with gzip.open(path, "wb", compresslevel=6) as gz:
        gz.write(payload)


def main() -> None:
    raw = SOURCE.read_bytes()
    jobs = json.loads(raw.decode("utf-8"))
    if not isinstance(jobs, list) or not jobs:
        raise SystemExit("open_jobs.json must be a non-empty array")

    version = catalog_version(raw)
    filter_options, filter_counts = build_filter_facets(jobs)

    meta = {
        "version": version,
        "count": len(jobs),
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "filterOptions": filter_options,
        "filterCounts": filter_counts,
    }
    META.write_text(json.dumps(meta, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    cutoff = (datetime.now() - timedelta(days=RECENT_MAX_AGE_DAYS)).strftime("%Y-%m-%d")
    recent = [j for j in jobs if (j.get("inserted_date") or "") >= cutoff]
    recent_bytes = json.dumps(recent, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    RECENT.write_bytes(recent_bytes)

    write_gzip(DATA_DIR / "open_jobs.json.gz", raw)
    write_gzip(DATA_DIR / "recent_jobs.json.gz", recent_bytes)

    print(
        f"catalog: {len(jobs)} jobs, version={version}, "
        f"recent={len(recent)}, meta={META.stat().st_size} bytes"
    )


if __name__ == "__main__":
    main()
