#!/usr/bin/env python3
"""Update sitemap.xml lastmod from catalog freshness.

Every published page must appear here. The generated list is checked against
the HTML actually present in the repository, so adding a page without adding a
sitemap entry fails the build instead of silently shipping an unlisted page.
"""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JOBS_PATH = ROOT / "assets/data/json/open_jobs.json"
SITEMAP_PATH = ROOT / "sitemap.xml"

BASE_URL = "https://classificavagas.com"

# (path relativo publicado, url no sitemap, changefreq, priority)
PAGES = [
    ("index.html", "/", "daily", "1.0"),
    ("resume/index.html", "/resume/", "monthly", "0.8"),
    ("termos.html", "/termos.html", "monthly", "0.5"),
    ("privacidade.html", "/privacidade.html", "monthly", "0.5"),
]


def latest_inserted_date(jobs: list[dict]) -> str:
    dates = [job.get("inserted_date", "") for job in jobs if job.get("inserted_date")]
    return max(dates) if dates else date.today().isoformat()


def find_unlisted_pages() -> list[str]:
    """HTML files in the repo that no sitemap entry covers."""
    listed = {path for path, _, _, _ in PAGES}
    skip_dirs = {"_backup", "_site", "node_modules", ".git"}
    unlisted = []

    for html in ROOT.rglob("*.html"):
        rel = html.relative_to(ROOT)
        if any(part in skip_dirs for part in rel.parts):
            continue
        if any(part.startswith(".") for part in rel.parts[:-1]):
            continue
        if str(rel) not in listed:
            unlisted.append(str(rel))

    return sorted(unlisted)


def main() -> int:
    unlisted = find_unlisted_pages()
    if unlisted:
        print("Paginas HTML sem entrada no sitemap:", file=sys.stderr)
        for page in unlisted:
            print(f"  - {page}", file=sys.stderr)
        print("Adicione a pagina em PAGES ou exclua-a do deploy.", file=sys.stderr)
        return 1

    jobs = json.loads(JOBS_PATH.read_text(encoding="utf-8"))
    lastmod = latest_inserted_date(jobs)

    entries = "\n".join(
        f"""  <url>
    <loc>{BASE_URL}{url}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>"""
        for _, url, changefreq, priority in PAGES
    )

    content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{entries}
</urlset>
"""
    SITEMAP_PATH.write_text(content, encoding="utf-8")
    print(f"OK: sitemap com {len(PAGES)} URLs, lastmod {lastmod}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
