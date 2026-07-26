#!/usr/bin/env bash
#
# Valida os tres repositorios do classificavagas, opcionalmente publica, e
# confere o resultado em producao pelo navegador.
#
# O ultimo passo e o que motivou este script: nesta sessao uma correcao ficou
# invisivel para quem ja tinha visitado o site, porque o service worker servia a
# versao antiga. curl dizia "corrigido", o CI estava verde, os testes passavam.
# Só abrir o site como visitante recorrente mostrava o problema.
#
# Uso:
#   ./deploy-check.sh              # so valida (nada e publicado)
#   ./deploy-check.sh --push       # valida, faz push e acompanha o deploy
#   ./deploy-check.sh --verify     # so confere producao
#
set -uo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIPELINE="$RAIZ/workflow-jobs"
SITE="$RAIZ/page-jobs"
GERADOR="$RAIZ/page-resume"
DOMINIO="https://classificavagas.com"

falhas=0
verde() { printf "  \033[32mok\033[0m   %s\n" "$1"; }
vermelho() { printf "  \033[31mFALHA\033[0m %s\n" "$1"; falhas=$((falhas + 1)); }
titulo() { printf "\n\033[1m%s\033[0m\n" "$1"; }

# Roda um comando dentro de um diretorio SEM subshell, para o contador de
# falhas sobreviver. Com "( cd x && checa ... )" o incremento fica no subshell
# e o resumo final mente.
checa_em() { # checa_em <dir> <rotulo> <comando...>
  local dir="$1"; local rotulo="$2"; shift 2
  local anterior="$PWD"
  cd "$dir" || { vermelho "$rotulo (diretorio ausente: $dir)"; return; }
  checa "$rotulo" "$@"
  cd "$anterior" || true
}

checa() { # checa <rotulo> <comando...>
  local rotulo="$1"; shift
  if "$@" >/tmp/dc-out 2>&1; then
    verde "$rotulo"
  else
    vermelho "$rotulo"
    sed 's/^/         /' /tmp/dc-out | tail -6
  fi
}

validar_pipeline() {
  titulo "Pipeline de dados (workflow-jobs)"
  [ -x "$PIPELINE/.venv/bin/python" ] || { vermelho "venv ausente: rode python3.11 -m venv .venv && .venv/bin/pip install -e '.[dev]'"; return; }
  checa_em "$PIPELINE" "testes" .venv/bin/python -m pytest -q
  checa_em "$PIPELINE" "ruff" .venv/bin/python -m ruff check src/classifica_vagas tests
  checa_em "$PIPELINE" "workflows validos" .venv/bin/python -c \
    "import yaml, pathlib; [yaml.safe_load(f.read_text()) for f in pathlib.Path('.github/workflows').glob('*.yml')]"
}

validar_gerador() {
  titulo "Gerador de curriculo (page-resume)"
  checa_em "$GERADOR" "smoke test" node tests/smoke-test.js
}

validar_site() {
  titulo "Site (page-jobs)"
  checa_em "$SITE" "sync do gerador" python3 scripts/sync-resume.py
  checa_em "$SITE" "schema do catalogo" python3 scripts/validate-jobs-schema.py
  checa_em "$SITE" "recent_jobs dentro do teto" python3 scripts/build-recent.py
  checa_em "$SITE" "sem Google Fonts" python3 scripts/check-no-google-fonts.py
  checa_em "$SITE" "sitemap completo" python3 scripts/update-sitemap.py
  checa_em "$SITE" "artefato de deploy" python3 scripts/prepare-deploy.py
  checa_em "$SITE" "sem arquivo de desenvolvimento" python3 scripts/validate-site-artifact.py
  checa_em "$SITE" "precache e CACHE_VERSION" python3 scripts/validate-sw-precache.py
  if [ -d "$SITE/node_modules" ]; then
    checa_em "$SITE" "eslint" npm run -s lint
    checa_em "$SITE" "testes e2e" npm run -s test:e2e
  else
    printf "  \033[33mpulado\033[0m eslint e e2e (rode npm ci em page-jobs)\n"
  fi
}

publicar() {
  titulo "Publicacao"
  for repo in "$PIPELINE" "$GERADOR" "$SITE"; do
    local nome; nome="$(basename "$repo")"
    local branch; branch="$(git -C "$repo" branch --show-current)"
    if [ "$branch" != "main" ]; then
      vermelho "$nome esta em '$branch', nao em main"
      continue
    fi
    local pendentes; pendentes="$(git -C "$repo" log --oneline origin/main..HEAD | wc -l | tr -d ' ')"
    if [ "$pendentes" = "0" ]; then
      verde "$nome sem commits pendentes"
    else
      if git -C "$repo" push -q origin main; then
        verde "$nome: $pendentes commit(s) publicado(s)"
      else
        vermelho "$nome: push falhou"
      fi
    fi
  done

  titulo "Deploy do site"
  local antes; antes="$(gh run list --repo eualannascimento/project-classificavagas-page-jobs \
    --workflow deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null)"
  printf "  aguardando o workflow (run anterior: %s)\n" "${antes:-nenhum}"
  local i=0
  while [ $i -lt 40 ]; do
    local estado
    estado="$(gh run list --repo eualannascimento/project-classificavagas-page-jobs \
      --workflow deploy.yml --limit 1 --json status,conclusion,databaseId \
      --jq '"\(.[0].databaseId) \(.[0].status) \(.[0].conclusion // "")"' 2>/dev/null)"
    local id; id="$(echo "$estado" | cut -d' ' -f1)"
    local st; st="$(echo "$estado" | cut -d' ' -f2)"
    local cc; cc="$(echo "$estado" | cut -d' ' -f3)"
    if [ "$id" != "$antes" ] && [ "$st" = "completed" ]; then
      [ "$cc" = "success" ] && verde "deploy $id concluido" || vermelho "deploy $id terminou como $cc"
      return
    fi
    sleep 20
    i=$((i + 1))
  done
  vermelho "deploy nao concluiu no tempo esperado"
}

verificar_producao() {
  titulo "Producao: arquivos que nao podem ser publicos"
  for u in /resume/CLAUDE.md /resume/.cursorrules /resume/prd-015-eu-gero-meu-curriculo.md \
           /resume/.docs/architecture.md /resume/tests/smoke-test.js /assets/data/xlsx/open_jobs.xlsx; do
    local http; http="$(curl -s -o /dev/null -w '%{http_code}' "$DOMINIO$u")"
    [ "$http" = "404" ] && verde "404 $u" || vermelho "$http $u (deveria ser 404)"
  done

  titulo "Producao: paginas e assets"
  for u in / /resume/ /termos.html /privacidade.html /sitemap.xml /.well-known/security.txt; do
    local http; http="$(curl -s -o /dev/null -w '%{http_code}' "$DOMINIO$u")"
    [ "$http" = "200" ] && verde "200 $u" || vermelho "$http $u (deveria ser 200)"
  done

  titulo "Producao: peso do recent_jobs"
  local bytes; bytes="$(curl -s -o /dev/null -w '%{size_download}' -H 'Accept-Encoding: gzip' \
    "$DOMINIO/assets/data/json/recent_jobs.json")"
  if [ "$bytes" -lt 524288 ]; then
    verde "recent_jobs comprimido: $((bytes / 1024)) KB"
  else
    vermelho "recent_jobs comprimido: $((bytes / 1024)) KB (teto de 512 KB)"
  fi

  titulo "Producao: cache do cliente"
  # O passo que faltava: o service worker pode servir a versao antiga mesmo com
  # o servidor ja atualizado. Compara o CACHE_VERSION publicado com o commit.
  local sw_versao; sw_versao="$(curl -s "$DOMINIO/service-worker.js" \
    | grep -oE "CACHE_VERSION = '[^']*'" | head -1 | cut -d"'" -f2)"
  # O id de build combina os dois repositorios: o site e o gerador, que vem de
  # outro repo no momento do build. Conferir so o SHA do site deixava passar um
  # gerador desatualizado em producao, que foi exatamente o que aconteceu.
  local sha; sha="$(git -C "$SITE" rev-parse --short HEAD)"
  local sha_ger; sha_ger="$(git -C "$GERADOR" rev-parse --short HEAD)"
  local esperado="$sha-$sha_ger"
  if [ "$sw_versao" = "$esperado" ]; then
    verde "CACHE_VERSION publicado ($sw_versao) confere com site e gerador"
  else
    vermelho "CACHE_VERSION publicado ($sw_versao) difere do esperado ($esperado): deploy nao propagou ou gerador desatualizado"
  fi

  # O CDN do GitHub Pages ignora query string na chave de cache, entao ?v= nao
  # fura o cache de borda: so o TTL de 600s resolve. Conferir a data real do
  # arquivo evita concluir que o deploy falhou quando ele so nao propagou ainda.
  local lm; lm="$(curl -sI "$DOMINIO/resume/css/print-preview.css" | grep -i '^last-modified:' | cut -d' ' -f2-)"
  printf "  \033[36minfo\033[0m last-modified do css do gerador: %s\n" "${lm:-desconhecido}"
  local versionado; versionado="$(curl -s "$DOMINIO/resume/" | grep -c "css?v=$sw_versao" || true)"
  [ "$versionado" -gt 0 ] && verde "assets do gerador versionados com ?v=$sw_versao" \
    || vermelho "assets do gerador sem ?v=$sw_versao: navegador pode usar css em cache"

  titulo "Producao: privacidade"
  local externas; externas="$(curl -s "$DOMINIO/resume/" | grep -cE "fonts\.googleapis|fonts\.gstatic|cdn\." || true)"
  [ "$externas" = "0" ] && verde "nenhuma referencia a terceiros no gerador" \
    || vermelho "$externas referencia(s) a terceiros no gerador"
}

case "${1:-}" in
  --push)   validar_pipeline; validar_gerador; validar_site
            [ "$falhas" -eq 0 ] || { printf "\n\033[31m%s falha(s): nada foi publicado\033[0m\n" "$falhas"; exit 1; }
            publicar; verificar_producao ;;
  --verify) verificar_producao ;;
  *)        validar_pipeline; validar_gerador; validar_site ;;
esac

printf "\n"
if [ "$falhas" -eq 0 ]; then
  printf "\033[32mTudo certo.\033[0m\n"
else
  printf "\033[31m%s falha(s).\033[0m\n" "$falhas"
fi
exit $([ "$falhas" -eq 0 ] && echo 0 || echo 1)
