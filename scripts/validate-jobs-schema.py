#!/usr/bin/env python3
"""Validate open_jobs.json records against critical job fields."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JOBS_PATH = ROOT / "assets/data/json/open_jobs.json"

URL_RE = re.compile(r"^https?://")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def validate_job(job: dict, index: int) -> list[str]:
    errors: list[str] = []

    if not isinstance(job, dict):
        return [f"job[{index}] is not an object"]

    url = job.get("url")
    if not isinstance(url, str) or not URL_RE.match(url.strip()):
        errors.append(f"job[{index}] has invalid or missing url")

    inserted = job.get("inserted_date")
    if not isinstance(inserted, str) or not DATE_RE.match(inserted):
        errors.append(f"job[{index}] inserted_date must be YYYY-MM-DD")

    return errors


def main() -> int:
    data = json.loads(JOBS_PATH.read_text(encoding="utf-8"))

    if not isinstance(data, list) or not data:
        print("ERROR: expected non-empty array", file=sys.stderr)
        return 1

    errors: list[str] = []
    for index, job in enumerate(data):
        errors.extend(validate_job(job, index))
        if len(errors) >= 20:
            break

    if errors:
        print("Schema validation failed:", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        print(f"  ({len(errors)} error(s) shown, stopping early at 20)", file=sys.stderr)
        return 1

    print(f"OK: {len(data)} jobs validated against schema")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
