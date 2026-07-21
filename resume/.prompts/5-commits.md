# FASE 5: Prompt para Micro-commits (Estratégia de Versionamento)

**Como usar:** Envie este prompt após aprovar o código e o review da Fase 4.

---
**Copiar a partir daqui:**

Nosso desenvolvimento desta tarefa está pronto para versionamento.
Examine todas as mudanças pendentes rodando `git status` e `git diff` e lendo o que geramos.

**SUA REGRA PRINCIPAL AQUI É:** É expressamente proibido sugerir um commit monstruoso (`git commit -am "feature pronta"`).

Você deve ser inteligente e separar o que foi feito em etapas lógicas e independentes, onde cada commit deixa o repositório em estado funcional.
Sugira-me blocos de comandos em bash prontos para rodar separadamente, usando `git add` com caminhos explícitos (nunca `git add .`).
Use o padrão *Conventional Commits* para as mensagens, com corpo curto explicando o "porquê" quando não for óbvio.

**Formato exigido como resposta (exemplo adaptado à tarefa atual):**

```bash
# Commit 1: Especificação da funcionalidade
git add .docs/specs/nome-da-feature.md
git commit -m "docs(specs): add spec for [feature]"

# Commit 2: Testes (TDD - Red)
git add tests/test_nome_da_feature.py
git commit -m "test(feature): add tests for [feature] user stories and edge cases"

# Commit 3: Implementação (Green)
git add src/services/feature_service.py src/api/routes.py
git commit -m "feat(feature): implement [feature] per approved spec"

# Commit 4: Refatorações do review
git add src/services/feature_service.py
git commit -m "refactor(feature): extract validation and fix N+1 query"
```

Após eu aprovar a divisão, execute os commits na ordem e me mostre o `git log --oneline` resultante.
