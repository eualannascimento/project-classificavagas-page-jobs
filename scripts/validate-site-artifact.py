#!/usr/bin/env python3
"""Fail the build when the deploy artifact contains something that must not be public.

Deliberately written from the "what is unacceptable to publish" angle and NOT
by reusing prepare-deploy's own rules: a gate that shares the generator's logic
cannot catch the generator being wrong.
"""

from __future__ import annotations

import fnmatch
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "_site"

# Anything matching these is a finding, wherever it sits in the artifact.
FORBIDDEN_NAME_GLOBS = (
    "*.md",            # docs, specs, PRDs, diagnostics, agent instructions
    ".cursorrules",
    ".env*",
    "*.spec.js",
    "*.test.js",
    "*.py",
    "*.yml",
    "*.yaml",
    "*.toml",
    "*.lock",
    "server.log",
    "*.xlsx",
    "*.csv",
)

FORBIDDEN_DIR_NAMES = {
    ".git", ".github", ".docs", ".rules", ".prompts", ".agent", ".vscode",
    "_backup", "node_modules", "scripts", "tests", "test-results",
}

FORBIDDEN_DIR_GLOBS = ("issues-*",)

# Explicit exceptions, if any file above ever becomes legitimately public.
ALLOWED = set()


def find_violations() -> list[str]:
    violations: list[str] = []

    for path in SITE.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(SITE)
        if str(rel) in ALLOWED:
            continue

        for part in rel.parts[:-1]:
            if part in FORBIDDEN_DIR_NAMES:
                violations.append(f"{rel} (diretorio proibido: {part})")
                break
            if any(fnmatch.fnmatch(part, g) for g in FORBIDDEN_DIR_GLOBS):
                violations.append(f"{rel} (diretorio proibido: {part})")
                break
        else:
            for pattern in FORBIDDEN_NAME_GLOBS:
                if fnmatch.fnmatch(rel.name, pattern):
                    violations.append(f"{rel} (padrao proibido: {pattern})")
                    break

    return violations


def main() -> int:
    if not SITE.is_dir():
        print(f"ERROR: {SITE} nao existe. Rode scripts/prepare-deploy.py antes.", file=sys.stderr)
        return 1

    violations = find_violations()
    if violations:
        print("Arquivos de desenvolvimento no artefato de deploy:", file=sys.stderr)
        for item in sorted(violations):
            print(f"  - {item}", file=sys.stderr)
        print(f"\n{len(violations)} arquivo(s) nao podem ser publicados.", file=sys.stderr)
        return 1

    total = sum(1 for p in SITE.rglob("*") if p.is_file())
    print(f"OK: {total} arquivo(s) no artefato, nenhum arquivo de desenvolvimento")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
