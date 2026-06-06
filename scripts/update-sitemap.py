#!/usr/bin/env python3
"""Update sitemap.xml lastmod from catalog freshness."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JOBS_PATH = ROOT / "assets/data/json/open_jobs.json"
SITEMAP_PATH = ROOT / "sitemap.xml"


def latest_inserted_date(jobs: list[dict]) -> str:
    dates = [job.get("inserted_date", "") for job in jobs if job.get("inserted_date")]
    return max(dates) if dates else date.today().isoformat()


def main() -> None:
    jobs = json.loads(JOBS_PATH.read_text(encoding="utf-8"))
    lastmod = latest_inserted_date(jobs)

    content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://classificavagas.com/</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://classificavagas.com/termos.html</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://classificavagas.com/privacidade.html</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
"""
    SITEMAP_PATH.write_text(content, encoding="utf-8")
    print(f"OK: sitemap lastmod set to {lastmod}")


if __name__ == "__main__":
    main()
