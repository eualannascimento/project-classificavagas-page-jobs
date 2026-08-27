import hashlib
import importlib.util
import io
import json
import os
import tarfile
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest import mock


ROOT = Path(__file__).resolve().parent.parent
FETCH_SCRIPT = ROOT / 'scripts' / 'fetch-catalog.py'


def load_fetch_catalog():
    spec = importlib.util.spec_from_file_location('fetch_catalog_under_test', FETCH_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def build_snapshot(jobs_bytes, manifest, members=None):
    payloads = members or {
        'open_jobs.json': jobs_bytes,
        'catalog_manifest.json': json.dumps(manifest).encode('utf-8'),
    }
    snapshot = io.BytesIO()
    with tarfile.open(fileobj=snapshot, mode='w:gz') as archive:
        for name, content in payloads.items():
            member = tarfile.TarInfo(name)
            member.size = len(content)
            archive.addfile(member, io.BytesIO(content))
    return snapshot.getvalue()


def manifest_for(jobs_bytes, *, jobs_count=1, digest=None):
    return {
        'schema_version': 1,
        'generated_at': '2026-08-26T09:00:00-03:00',
        'jobs_count': jobs_count,
        'eligible_companies_count': 1,
        'published_companies_count': 1,
        'blocked_companies_count': 0,
        'open_jobs_sha256': digest or hashlib.sha256(jobs_bytes).hexdigest(),
    }


class FetchCatalogTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.workspace = Path(self.temporary_directory.name)
        self.fetch_catalog = load_fetch_catalog()
        self.jobs_destination = self.workspace / 'assets' / 'data' / 'json' / 'open_jobs.json'
        self.manifest_destination = self.jobs_destination.with_name('catalog_manifest.json')
        self.fetch_catalog.DESTINO = self.jobs_destination
        self.fetch_catalog.MANIFEST_DESTINO = self.manifest_destination

    def run_fetch(
        self,
        snapshot_bytes=None,
        *,
        legacy_bytes=None,
        snapshot_asset_exists=True,
        snapshot_download_fails=False,
        legacy_fallback=False,
        snapshot_error='snapshot download failed',
    ):
        snapshot_source = self.workspace / 'downloaded-snapshot.tar.gz'
        if snapshot_bytes is not None:
            snapshot_source.write_bytes(snapshot_bytes)
        legacy_source = self.workspace / 'downloaded-legacy.json'
        if legacy_bytes is not None:
            legacy_source.write_bytes(legacy_bytes)
        fake_bin = self.workspace / 'bin'
        fake_bin.mkdir()
        fake_gh = fake_bin / 'gh'
        fake_gh.write_text(
            '#!/bin/sh\n'
            'if [ "$1" = "release" ] && [ "$2" = "view" ]; then\n'
            '  if [ "$SNAPSHOT_ASSET_EXISTS" = "1" ]; then\n'
            '    printf "%s\\n" "catalog_snapshot.tar.gz"\n'
            '  else\n'
            '    printf "%s\\n" "open_jobs.json"\n'
            '  fi\n'
            '  exit 0\n'
            'fi\n'
            'while [ "$#" -gt 0 ]; do\n'
            '  if [ "$1" = "--output" ]; then\n'
            '    case "$2" in\n'
            '      *catalog_snapshot.tar.gz)\n'
            '        if [ "$SNAPSHOT_ASSET_EXISTS" = "1" ]; then\n'
            '          if [ "$SNAPSHOT_DOWNLOAD_FAILS" = "1" ]; then\n'
            '            echo "$SNAPSHOT_ERROR" >&2\n'
            '            exit 1\n'
            '          fi\n'
            '          cp "$SNAPSHOT_SOURCE" "$2"\n'
            '          exit 0\n'
            '        fi\n'
            '        echo "$SNAPSHOT_ERROR" >&2\n'
            '        exit 1\n'
            '        ;;\n'
            '      *open_jobs.json)\n'
            '        cp "$LEGACY_SOURCE" "$2"\n'
            '        exit 0\n'
            '        ;;\n'
            '    esac\n'
            '  fi\n'
            '  shift\n'
            'done\n'
            'exit 1\n',
            encoding='utf-8',
        )
        fake_gh.chmod(0o755)
        environment = {
            'PATH': f'{fake_bin}{os.pathsep}{os.environ["PATH"]}',
            'SNAPSHOT_SOURCE': str(snapshot_source),
            'LEGACY_SOURCE': str(legacy_source),
            'SNAPSHOT_ASSET_EXISTS': '1' if snapshot_asset_exists else '0',
            'SNAPSHOT_DOWNLOAD_FAILS': '1' if snapshot_download_fails else '0',
            'SNAPSHOT_ERROR': snapshot_error,
        }
        with mock.patch.dict(os.environ, environment, clear=False):
            arguments = ['--allow-legacy-fallback'] if legacy_fallback else []
            return self.fetch_catalog.main(arguments)

    def assert_rejected_without_replacing_catalog(self, snapshot_bytes):
        self.jobs_destination.parent.mkdir(parents=True)
        self.jobs_destination.write_text('["catalogo anterior"]', encoding='utf-8')
        self.manifest_destination.write_text('{"anterior": true}', encoding='utf-8')

        self.assertEqual(self.run_fetch(snapshot_bytes), 1)

        self.assertEqual(self.jobs_destination.read_bytes(), b'["catalogo anterior"]')
        self.assertEqual(self.manifest_destination.read_bytes(), b'{"anterior": true}')

    def test_rejects_an_invalid_tar_without_replacing_the_catalog(self):
        self.assert_rejected_without_replacing_catalog(b'not a tar file')

    def test_rejects_a_snapshot_with_an_extra_member(self):
        jobs_bytes = b'[{"company":"Acme"}]'
        snapshot = build_snapshot(
            jobs_bytes,
            manifest_for(jobs_bytes),
            members={
                'open_jobs.json': jobs_bytes,
                'catalog_manifest.json': json.dumps(manifest_for(jobs_bytes)).encode('utf-8'),
                'unexpected.txt': b'unexpected',
            },
        )

        self.assert_rejected_without_replacing_catalog(snapshot)

    def test_rejects_a_snapshot_with_a_missing_member(self):
        jobs_bytes = b'[{"company":"Acme"}]'
        snapshot = build_snapshot(
            jobs_bytes,
            manifest_for(jobs_bytes),
            members={'open_jobs.json': jobs_bytes},
        )

        self.assert_rejected_without_replacing_catalog(snapshot)

    def test_rejects_a_snapshot_with_a_divergent_catalog_hash(self):
        jobs_bytes = b'[{"company":"Acme"}]'
        snapshot = build_snapshot(jobs_bytes, manifest_for(jobs_bytes, digest='0' * 64))

        self.assert_rejected_without_replacing_catalog(snapshot)

    def test_rejects_a_snapshot_with_an_incorrect_jobs_count(self):
        jobs_bytes = b'[{"company":"Acme"}]'
        snapshot = build_snapshot(jobs_bytes, manifest_for(jobs_bytes, jobs_count=2))

        self.assert_rejected_without_replacing_catalog(snapshot)

    def test_rejects_a_snapshot_with_invalid_json(self):
        jobs_bytes = b'{"not":"a list"}'
        snapshot = build_snapshot(jobs_bytes, manifest_for(jobs_bytes))

        self.assert_rejected_without_replacing_catalog(snapshot)

    def test_publishes_both_validated_snapshot_members_together(self):
        jobs_bytes = b'[{"company":"Acme"}]'
        manifest = manifest_for(jobs_bytes)
        snapshot = build_snapshot(jobs_bytes, manifest)

        self.assertEqual(self.run_fetch(snapshot), 0)

        self.assertEqual(self.jobs_destination.read_bytes(), jobs_bytes)
        self.assertEqual(
            json.loads(self.manifest_destination.read_text(encoding='utf-8')),
            manifest,
        )

    def test_restores_the_previous_pair_when_manifest_promotion_fails(self):
        previous_jobs = b'[{"company":"Previous"}]'
        previous_manifest = b'{"version":"previous"}'
        self.jobs_destination.parent.mkdir(parents=True)
        self.jobs_destination.write_bytes(previous_jobs)
        self.manifest_destination.write_bytes(previous_manifest)
        jobs_bytes = b'[{"company":"Acme"}]'
        snapshot = build_snapshot(jobs_bytes, manifest_for(jobs_bytes))
        original_replace = os.replace

        def fail_manifest_promotion(source, target):
            if Path(source).name == 'catalog_manifest.json' and Path(target) == self.manifest_destination:
                raise OSError('simulated manifest promotion failure')
            return original_replace(source, target)

        self.fetch_catalog.replace_file = fail_manifest_promotion

        self.assertEqual(self.run_fetch(snapshot), 1)

        self.assertEqual(self.jobs_destination.read_bytes(), previous_jobs)
        self.assertEqual(self.manifest_destination.read_bytes(), previous_manifest)

    def test_uses_legacy_catalog_only_when_snapshot_asset_is_absent_and_flag_is_set(self):
        legacy_jobs = b'[{"company":"Acme"},{"company":"Globex"}]'

        self.assertEqual(
            self.run_fetch(
                legacy_bytes=legacy_jobs,
                snapshot_asset_exists=False,
                legacy_fallback=True,
            ),
            0,
        )

        manifest = json.loads(self.manifest_destination.read_text(encoding='utf-8'))
        self.assertEqual(self.jobs_destination.read_bytes(), legacy_jobs)
        self.assertEqual(manifest['jobs_count'], 2)
        self.assertEqual(manifest['eligible_companies_count'], 2)
        self.assertEqual(manifest['published_companies_count'], 2)
        self.assertEqual(manifest['blocked_companies_count'], 0)
        self.assertEqual(
            manifest['open_jobs_sha256'],
            hashlib.sha256(legacy_jobs).hexdigest(),
        )
        datetime.fromisoformat(manifest['generated_at'])

    def test_does_not_use_legacy_catalog_when_the_snapshot_asset_exists_but_download_fails(self):
        self.jobs_destination.parent.mkdir(parents=True)
        self.jobs_destination.write_text('["catalogo anterior"]', encoding='utf-8')
        self.manifest_destination.write_text('{"anterior": true}', encoding='utf-8')

        self.assertEqual(
            self.run_fetch(
                legacy_bytes=b'[{"company":"Acme"}]',
                snapshot_asset_exists=True,
                snapshot_download_fails=True,
                legacy_fallback=True,
            ),
            1,
        )

        self.assertEqual(self.jobs_destination.read_bytes(), b'["catalogo anterior"]')
        self.assertEqual(self.manifest_destination.read_bytes(), b'{"anterior": true}')

    def test_requires_an_explicit_flag_before_using_the_legacy_catalog(self):
        self.assertEqual(
            self.run_fetch(
                legacy_bytes=b'[{"company":"Acme"}]',
                snapshot_asset_exists=False,
            ),
            1,
        )
        self.assertFalse(self.jobs_destination.exists())
        self.assertFalse(self.manifest_destination.exists())


if __name__ == '__main__':
    unittest.main()
