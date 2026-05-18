#!/usr/bin/env python3
"""Build recent_jobs.json from open_jobs.json (last N days)."""
import json
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "data" / "json" / "open_jobs.json"
TARGET = ROOT / "assets" / "data" / "json" / "recent_jobs.json"
MAX_AGE_DAYS = 14


def main():
    cutoff = (datetime.now() - timedelta(days=MAX_AGE_DAYS)).strftime("%Y-%m-%d")
    with SOURCE.open(encoding="utf-8") as f:
        jobs = json.load(f)
    recent = [j for j in jobs if (j.get("inserted_date") or "") >= cutoff]
    with TARGET.open("w", encoding="utf-8") as f:
        json.dump(recent, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Wrote {len(recent)} jobs (of {len(jobs)}) to {TARGET}")


if __name__ == "__main__":
    main()
