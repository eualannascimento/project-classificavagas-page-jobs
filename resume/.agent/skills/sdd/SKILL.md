---
name: sdd
description: Orquestra o workflow completo de Spec-Driven Development deste repositório - Grilling (1), Spec (2), TDD (3), Review (4), Micro-commits (5) e Deploy/PR (6). Detecta automaticamente em que fase a feature está e retoma de onde parou. Use quando o usuário quiser iniciar uma nova funcionalidade, continuar uma feature em andamento, ou disser /sdd.
argument-hint: [descrição da ideia | continue | status]
---

# Skill /sdd - Orquestrador do Workflow SDD

Você é o orquestrador da máquina de estados descrita no `README.md`. Leia `.rules/global.md` AGORA e obedeça-o durante toda a execução.

## Invocação

- `/sdd <descrição da ideia>` → inicia uma nova feature na Fase 1.
- `/sdd continue` (ou sem argumentos) → detecta a fase atual e retoma.
- `/sdd status` → apenas reporta a fase atual de cada spec e para.
- `/sdd` acompanhado de um documento de grilling feito externamente (ex.: por voz, via `.prompts/1b-grilling-voz.md`) → trate o documento como a saída da Fase 1: valide se ele cobre regras de negócio, edge cases e escopo, resolva os pontos marcados como INCERTO com o usuário (uma pergunta por vez) e siga direto para a redação do Spec (Fase 2), com o gate normal de aprovação.

## Estado persistente

O estado do fluxo vive em DOIS arquivos, e é assim que ele sobrevive a trocas de sessão e estouros de janela de contexto:

1. O campo `**Status:**` do spec em `.docs/specs/` (estado grosso, muda a cada fase):
   `Rascunho → Aprovado → Em Desenvolvimento → Em Review → Pronto para Commit → Concluído`
2. O diário de execução em `.docs/journal/<slug>.md` (estado fino: último passo, próxima ação, decisões). Formato e checkpoints obrigatórios em `.rules/context-management.md`. Crie o diário na Fase 1 e atualize-o nos checkpoints C1 a C5; delete-o ao concluir a Fase 6.

Nada que seja necessário para retomar o trabalho pode existir apenas na conversa.

## Detecção de fase (execute na ordem)

1. Se o usuário passou uma ideia nova → **Fase 1**.
2. Senão, liste `.docs/specs/*.md` (ignorando `_TEMPLATE.md`). Se houver mais de um spec não-Concluído, pergunte em qual trabalhar.
3. Se existir diário em `.docs/journal/<slug>.md`, aplique a recuperação silenciosa de `.rules/context-management.md`: leia spec + diário, valide contra `git status`/`git log`, anuncie em 1 linha e retome pela "Próxima ação". Não pergunte nada que já esteja registrado.
4. Sem diário, mapeie o Status do spec escolhido para a fase:
   - `Rascunho` → aguardando aprovação (gate da Fase 2)
   - `Aprovado` → **Fase 3**
   - `Em Desenvolvimento` → **Fase 3** (retomar o loop TDD)
   - `Em Review` → **Fase 4**
   - `Pronto para Commit` → há mudanças pendentes no `git status`? **Fase 5**. Senão → **Fase 6**.
   - `Concluído` → nada a fazer; avise e sugira `/sdd <nova ideia>`.
5. Anuncie ao usuário a fase detectada em 1 linha antes de agir.

## Gates (regra inviolável)

Entre uma fase e a seguinte existe um gate: **pare, resuma o que foi produzido e aguarde aprovação explícita do usuário**. Nunca atravesse um gate sozinho. Dentro de uma fase (ex.: o loop da Fase 3), atue com autonomia total.

## Fases

### Fase 1 - Grilling
Siga o protocolo de `.prompts/1-grilling.md`: atue como Arquiteto/Engenheiro de Requisitos Sênior; UMA pergunta por vez; foque em edge cases, sad paths, limites técnicos, concorrência e permissões; se o usuário responder "não sei", ofereça 2-3 opções com trade-offs. Quando esgotar as dúvidas, resuma as decisões e peça autorização para redigir o Spec. **Gate → Fase 2.**

### Fase 2 - Spec
Redija o spec em `.docs/specs/<slug-da-feature>.md` usando `_TEMPLATE.md`, com `Status: Rascunho`. Todo requisito deve rastrear a uma resposta do Grilling - não invente regras. Apresente ao usuário. Quando ele aprovar, mude para `Status: Aprovado`. **Gate → Fase 3.**

### Fase 3 - TDD (loop autônomo)
Mude o Status para `Em Desenvolvimento` e siga `.prompts/3-loop-tdd.md`:
1. Releia o spec inteiro; se algo estiver ambíguo, PARE e pergunte.
2. Escreva SOMENTE os testes em `tests/` (User Stories + Critérios de Aceite + edge cases).
3. Rode a suíte e confirme que os novos testes FALHAM (Red). Teste novo que passa sem código de produção está errado - corrija o teste.
4. Escreva o código de produção mínimo. Rode. Se falhar, leia o erro, corrija, repita - autonomamente. Após 5 tentativas no MESMO teste, pare e explique o impasse.
5. Green? Rode a suíte COMPLETA contra regressões. Mude para `Status: Em Review`. **Gate → Fase 4.**

### Fase 4 - Review
No Claude Code, delegue a auditoria ao subagent `reviewer` (`.claude/agents/reviewer.md`), passando o caminho do spec e o intervalo do diff: ele roda em contexto limpo, sem o viés de quem escreveu o código, e devolve os achados com severidade e confiança. Com o relatório em mãos, faça a triagem, aplique as correções sem mudar comportamento e re-execute a suíte. Fora do Claude Code (ou se o subagent falhar), siga `.prompts/4-review.md` diretamente. Mude para `Status: Pronto para Commit`. **Gate → Fase 5.**

### Fase 5 - Micro-commits
Siga `.prompts/5-commits.md`: proponha a divisão em commits lógicos (spec → testes → implementação → refactor), com `git add` de caminhos explícitos (NUNCA `git add .`) e mensagens Conventional Commits. Após o usuário aprovar a divisão, execute os commits e mostre o `git log --oneline`. **Gate → Fase 6.**

### Fase 6 - Deploy / PR
Siga `.prompts/6-deploy.md`: checklist (suíte completa, linter, varredura de segredos no diff), atualize o spec para `Status: Concluído` e commite. Confirme estar em branch de feature (nunca `main`), push, abra PR draft com link para o spec. Checklist quebrado = não abre PR. Entregue o link do PR e um resumo de 3 linhas. **Fim do ciclo.**

## Regras transversais

- Obedeça `.rules/context-management.md` durante TODAS as fases: checkpoints no diário, leitura seletiva de arquivos, erros resumidos, lotes pequenos em fases longas.
- Se o repositório divergir do que o Status indica (ex.: `Aprovado` mas já existem testes da feature), reporte a inconsistência e pergunte antes de agir.
- Nunca pule fases, mesmo que o usuário peça "só faz logo": explique o motivo e ofereça encurtar o Grilling, não eliminá-lo.
- Uma feature por vez. Pedidos fora do escopo do spec atual → sugira `/sdd <nova ideia>`.
