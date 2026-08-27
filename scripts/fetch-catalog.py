#!/usr/bin/env python3
"""Baixa e publica o snapshot atômico do catálogo de vagas."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DESTINO = ROOT / 'assets' / 'data' / 'json' / 'open_jobs.json'
MANIFEST_DESTINO = DESTINO.with_name('catalog_manifest.json')
VALIDATOR = ROOT / 'scripts' / 'validate-catalog-manifest.py'
TAG = 'catalog'
ASSET = 'catalog_snapshot.tar.gz'
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


def main() -> int:
    DESTINO.parent.mkdir(parents=True, exist_ok=True)

    try:
        with tempfile.TemporaryDirectory(dir=DESTINO.parent, prefix='.catalog-') as temporary:
            temporary_directory = Path(temporary)
            snapshot_path = temporary_directory / ASSET
            download = subprocess.run(
                [
                    'gh', 'release', 'download', TAG,
                    '--repo', REPO,
                    '--pattern', ASSET,
                    '--output', str(snapshot_path),
                    '--clobber',
                ],
                capture_output=True,
                text=True,
            )
            if download.returncode != 0:
                detail = download.stderr.strip()
                raise ValueError(
                    f"não foi possível baixar o snapshot do release '{TAG}': {detail}",
                )

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

    print(f"OK: snapshot do release '{TAG}' validado e publicado localmente")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
