#!/usr/bin/env python3
"""Fail CI if any published file still references the Google Fonts CDN.

Scans recursively and covers CSS and JS, not just the HTML files sitting at the
repository root: the previous glob('*.html') never looked inside resume/, which
is exactly where a Google Fonts link survived and leaked every visitor's IP.
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FORBIDDEN = ('fonts.googleapis.com', 'fonts.gstatic.com')
SCAN_SUFFIXES = ('.html', '.css', '.js')
SKIP_DIRS = {'_backup', 'node_modules', '_site', '.git', 'vendor'}


def files_to_scan():
    for path in ROOT.rglob('*'):
        if path.suffix.lower() not in SCAN_SUFFIXES:
            continue
        parts = path.relative_to(ROOT).parts
        if any(part in SKIP_DIRS for part in parts):
            continue
        # Diretorios ocultos (.docs, .rules, ...) nunca chegam ao site.
        if any(part.startswith('.') for part in parts[:-1]):
            continue
        yield path


errors = []
scanned = 0
for path in files_to_scan():
    scanned += 1
    text = path.read_text(encoding='utf-8', errors='ignore')
    for token in FORBIDDEN:
        if token in text:
            errors.append(f'{path.relative_to(ROOT)}: contains {token}')

if errors:
    print('Google Fonts nao pode ser carregado do CDN (use as fontes self-hosted):')
    for err in errors:
        print(f'  - {err}')
    raise SystemExit(1)

print(f'OK: {scanned} arquivo(s) sem referencia ao Google Fonts')
