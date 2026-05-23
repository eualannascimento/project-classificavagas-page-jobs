#!/usr/bin/env python3
"""Fail CI if HTML still references Google Fonts CDN."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FORBIDDEN = ('fonts.googleapis.com', 'fonts.gstatic.com')
HTML_FILES = list(ROOT.glob('*.html'))

errors = []
for path in HTML_FILES:
    text = path.read_text(encoding='utf-8')
    for token in FORBIDDEN:
        if token in text:
            errors.append(f'{path.name}: contains {token}')

if errors:
    print('Google Fonts must not be loaded from HTML (use self-hosted assets):')
    for err in errors:
        print(f'  - {err}')
    raise SystemExit(1)

print(f'OK: {len(HTML_FILES)} HTML file(s) without Google Fonts references')
