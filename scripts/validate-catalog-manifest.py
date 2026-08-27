#!/usr/bin/env python3
"""Valida o catálogo e seu manifesto de integridade."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_JOBS = ROOT / 'assets' / 'data' / 'json' / 'open_jobs.json'
DEFAULT_MANIFEST = DEFAULT_JOBS.with_name('catalog_manifest.json')
REQUIRED_KEYS = {
    'schema_version',
    'generated_at',
    'jobs_count',
    'eligible_companies_count',
    'published_companies_count',
    'blocked_companies_count',
    'open_jobs_sha256',
}
SHA256_PATTERN = re.compile(r'[0-9a-f]{64}\Z')


def load_and_validate(open_jobs_path: Path, manifest_path: Path) -> dict:
    """Retorna o manifesto quando ele corresponde aos bytes do catálogo."""
    open_jobs_bytes = open_jobs_path.read_bytes()
    manifest_bytes = manifest_path.read_bytes()
    try:
        open_jobs = json.loads(open_jobs_bytes)
        manifest = json.loads(manifest_bytes)
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        raise ValueError(f'JSON inválido: {error}') from error

    if not isinstance(open_jobs, list) or not isinstance(manifest, dict):
        raise ValueError('catálogo deve ser uma lista e manifesto deve ser um objeto')
    if set(manifest) != REQUIRED_KEYS or manifest['schema_version'] != 1:
        raise ValueError('manifesto inválido')
    if not isinstance(manifest['generated_at'], str) or not manifest['generated_at']:
        raise ValueError('generated_at inválido no manifesto')

    for key in (
        'jobs_count',
        'eligible_companies_count',
        'published_companies_count',
        'blocked_companies_count',
    ):
        if isinstance(manifest[key], bool) or not isinstance(manifest[key], int) or manifest[key] < 0:
            raise ValueError(f'{key} inválido no manifesto')

    expected_hash = manifest['open_jobs_sha256']
    if not isinstance(expected_hash, str) or not SHA256_PATTERN.fullmatch(expected_hash):
        raise ValueError('hash inválido no manifesto')
    if expected_hash != hashlib.sha256(open_jobs_bytes).hexdigest():
        raise ValueError('hash do catálogo diverge do manifesto')
    if manifest['jobs_count'] != len(open_jobs):
        raise ValueError('quantidade de vagas diverge do manifesto')
    return manifest


def parse_args(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument('--open-jobs', type=Path, default=DEFAULT_JOBS)
    parser.add_argument('--manifest', type=Path, default=DEFAULT_MANIFEST)
    return parser.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)
    try:
        manifest = load_and_validate(args.open_jobs, args.manifest)
    except (OSError, ValueError) as error:
        print(f'ERROR: {error}', file=sys.stderr)
        return 1

    print(f"OK: {manifest['jobs_count']:,} vagas com manifesto válido")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
