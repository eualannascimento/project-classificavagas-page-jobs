#!/usr/bin/env python3
"""Baixa e publica o snapshot atômico do catálogo de vagas.

O fallback legado é opt-in e transitório: deve ser removido após a primeira
publicação do pipeline que incluir ``catalog_snapshot.tar.gz`` na release.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DESTINO = ROOT / 'assets' / 'data' / 'json' / 'open_jobs.json'
MANIFEST_DESTINO = DESTINO.with_name('catalog_manifest.json')
VALIDATOR = ROOT / 'scripts' / 'validate-catalog-manifest.py'
TAG = 'catalog'
ASSET = 'catalog_snapshot.tar.gz'
LEGACY_ASSET = 'open_jobs.json'
REPO = 'eualannascimento/project-classificavagas-page-jobs'
MEMBROS_ESPERADOS = {'open_jobs.json', 'catalog_manifest.json'}


def replace_file(source: Path, destination: Path) -> None:
    """Substitui um arquivo por outro usando a primitiva atômica do sistema."""
    os.replace(source, destination)


def extract_snapshot(snapshot_path: Path, directory: Path) -> tuple[Path, Path]:
    """Extrai somente os dois membros permitidos para um diretório temporário."""
    try:
        with tarfile.open(snapshot_path, 'r:gz') as archive:
            members = archive.getmembers()
            names = [member.name for member in members]
            if len(members) != len(MEMBROS_ESPERADOS) or set(names) != MEMBROS_ESPERADOS:
                raise ValueError('snapshot com membros inválidos')
            if not all(member.isfile() for member in members):
                raise ValueError('snapshot contém membro que não é arquivo regular')

            payloads = {}
            for member in members:
                source = archive.extractfile(member)
                if source is None:
                    raise ValueError(f'snapshot com membro ilegível: {member.name}')
                payloads[member.name] = source.read()
    except (OSError, tarfile.TarError) as error:
        raise ValueError(f'snapshot tar.gz inválido: {error}') from error

    jobs_path = directory / 'open_jobs.json'
    manifest_path = directory / 'catalog_manifest.json'
    jobs_path.write_bytes(payloads['open_jobs.json'])
    manifest_path.write_bytes(payloads['catalog_manifest.json'])
    return jobs_path, manifest_path


def validate_staged_catalog(jobs_path: Path, manifest_path: Path) -> None:
    """Executa a mesma validação que o workflow usa antes de publicar arquivos."""
    result = subprocess.run(
        [
            sys.executable,
            str(VALIDATOR),
            '--open-jobs', str(jobs_path),
            '--manifest', str(manifest_path),
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip()
        raise ValueError(detail or 'manifesto do catálogo inválido')


def snapshot_asset_exists() -> bool:
    """Verifica se a release possui o asset do snapshot."""
    result = subprocess.run(
        [
            'gh', 'release', 'view', TAG,
            '--repo', REPO,
            '--json', 'assets',
            '--jq', '.assets[].name',
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip()
        raise ValueError(
            f"não foi possível verificar os assets do release '{TAG}': {detail}",
        )
    return ASSET in result.stdout.splitlines()


def create_legacy_manifest(jobs_path: Path, manifest_path: Path) -> None:
    """Cria o manifesto transitório para o asset legado já publicado."""
    jobs_bytes = jobs_path.read_bytes()
    try:
        jobs = json.loads(jobs_bytes)
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        raise ValueError(f'catálogo legado contém JSON inválido: {error}') from error
    if not isinstance(jobs, list):
        raise ValueError('catálogo legado deve ser uma lista de vagas')

    companies = {
        job['company']
        for job in jobs
        if isinstance(job, dict) and isinstance(job.get('company'), str) and job['company']
    }
    manifest = {
        'schema_version': 1,
        'generated_at': datetime.now().astimezone().isoformat(),
        'jobs_count': len(jobs),
        # O asset legado não contém métricas de coleta; estes são os únicos
        # números observáveis localmente e devem desaparecer com o snapshot.
        'eligible_companies_count': len(companies),
        'published_companies_count': len(companies),
        'blocked_companies_count': 0,
        'open_jobs_sha256': hashlib.sha256(jobs_bytes).hexdigest(),
    }
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + '\n',
        encoding='utf-8',
    )


def download_asset(asset: str, destination: Path) -> subprocess.CompletedProcess[str]:
    """Baixa um asset sem expor arquivos incompletos no diretório publicado."""
    return subprocess.run(
        [
            'gh', 'release', 'download', TAG,
            '--repo', REPO,
            '--pattern', asset,
            '--output', str(destination),
            '--clobber',
        ],
        capture_output=True,
        text=True,
    )


def parse_args(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--allow-legacy-fallback',
        action='store_true',
        help='permite migrar temporariamente do asset legado open_jobs.json',
    )
    return parser.parse_args(argv)


def create_backup(source: Path, backup: Path) -> None:
    """Preserva o arquivo atual antes de promover o novo par validado."""
    try:
        os.link(source, backup)
    except OSError:
        shutil.copy2(source, backup)


def publish_catalog_pair(jobs_path: Path, manifest_path: Path, directory: Path) -> None:
    """Promove o par e restaura ambos os arquivos se uma troca falhar."""
    publications = ((jobs_path, DESTINO), (manifest_path, MANIFEST_DESTINO))
    backups: dict[Path, Path] = {}
    for _, destination in publications:
        if destination.exists():
            backup = directory / f'.previous-{destination.name}'
            create_backup(destination, backup)
            backups[destination] = backup

    try:
        for source, destination in publications:
            replace_file(source, destination)
    except OSError as publication_error:
        try:
            for _, destination in publications:
                backup = backups.get(destination)
                if backup is not None:
                    replace_file(backup, destination)
                else:
                    destination.unlink(missing_ok=True)
        except OSError as rollback_error:
            raise OSError(
                'falha ao publicar o par e ao restaurar a versão anterior',
            ) from rollback_error
        raise publication_error


def main(argv=None) -> int:
    args = parse_args(argv)
    DESTINO.parent.mkdir(parents=True, exist_ok=True)
    catalog_source = 'snapshot'

    try:
        with tempfile.TemporaryDirectory(dir=DESTINO.parent, prefix='.catalog-') as temporary:
            temporary_directory = Path(temporary)
            snapshot_path = temporary_directory / ASSET
            download = download_asset(ASSET, snapshot_path)
            if download.returncode != 0:
                detail = download.stderr.strip()
                if not args.allow_legacy_fallback or snapshot_asset_exists():
                    raise ValueError(
                        f"não foi possível baixar o snapshot do release '{TAG}': {detail}",
                    )
                jobs_path = temporary_directory / LEGACY_ASSET
                legacy_download = download_asset(LEGACY_ASSET, jobs_path)
                if legacy_download.returncode != 0:
                    legacy_detail = legacy_download.stderr.strip()
                    raise ValueError(
                        f"não foi possível baixar o catálogo legado do release '{TAG}': "
                        f'{legacy_detail}',
                    )
                manifest_path = temporary_directory / 'catalog_manifest.json'
                create_legacy_manifest(jobs_path, manifest_path)
                catalog_source = 'catálogo legado migrado'
            else:
                jobs_path, manifest_path = extract_snapshot(snapshot_path, temporary_directory)
            validate_staged_catalog(jobs_path, manifest_path)

            publish_catalog_pair(jobs_path, manifest_path, temporary_directory)
    except (OSError, ValueError) as error:
        print(
            f'ERROR: {error}\n'
            'O build para aqui de propósito: publicar o site sem um catálogo '
            'validado quebraria a tela de vagas para todo visitante.',
            file=sys.stderr,
        )
        return 1

    print(f"OK: {catalog_source} do release '{TAG}' validado e publicado localmente")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
