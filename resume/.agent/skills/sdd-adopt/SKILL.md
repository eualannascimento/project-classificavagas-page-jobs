---
name: sdd-adopt
description: Adota o workflow SDD em um projeto que já existe e está rodando. Faz engenharia reversa do código (stack, arquitetura, regras de negócio), gera a documentação baseline em .docs/specs/ e as regras do projeto, e então libera o fluxo normal do /sdd. Use quando o usuário quiser aplicar o template a um codebase existente, documentar um sistema legado ou disser /sdd-adopt.
argument-hint: [caminho do projeto (padrão: diretório atual)]
---

# Skill /sdd-adopt - Engenharia reversa e adoção do workflow SDD

Você vai transformar um projeto existente em um projeto governado pelo workflow SDD. O produto desta skill é a documentação baseline que o `/sdd` exige para funcionar: sem ela, nenhuma feature nova pode entrar no fluxo. Leia `.rules/global.md` e `.rules/anti-ai-style.md` (se existirem no projeto alvo ou neste template) antes de escrever qualquer texto.

## Invocação

- `/sdd-adopt` -> adota o projeto do diretório atual.
- `/sdd-adopt <caminho>` -> adota o projeto no caminho indicado.

Se o projeto já tiver `.docs/specs/` com specs baseline, avise que a adoção já ocorreu e sugira `/sdd continue` ou `/sdd <ideia>`.

## Resiliência de contexto

Adoções varrem muito código e são o cenário mais propenso a estourar a janela de contexto. Siga `.rules/context-management.md` do início ao fim: crie o diário `.docs/journal/adocao.md` na Etapa A, faça checkpoint ao concluir cada domínio da Etapa B (um domínio por vez, nunca todos de uma varredura só) e, ao retomar uma adoção interrompida, aplique a recuperação silenciosa: leia o diário, pule os domínios já documentados e continue do próximo, sem refazer o inventário nem perguntar o que já foi respondido.

## Etapa A - Inventário (autônoma, somente leitura)

Varra o projeto e levante, sem modificar nada:

1. **Stack:** linguagens, frameworks, gerenciador de pacotes, versão de runtime, banco de dados, filas, serviços externos (leia manifests: package.json, pyproject.toml, go.mod, Gemfile, docker-compose, etc.).
2. **Arquitetura:** estrutura de pastas, camadas, pontos de entrada (main, rotas, handlers, jobs, CLIs), fluxo de dados entre módulos.
3. **Domínios:** identifique os 3 a 8 domínios funcionais principais (ex.: autenticação, pagamentos, catálogo). Eles definirão os specs baseline.
4. **Qualidade atual:** existe suíte de testes? Roda? Qual a cobertura aparente? Existe CI, linter, formatador?
5. **Convenções:** padrão de nomes, estilo de commit no histórico, idioma dos comentários.

Apresente o inventário ao usuário em um resumo curto e pergunte se os domínios identificados fazem sentido. **Gate: aguarde confirmação.**

## Etapa B - Engenharia reversa (autônoma)

Para cada domínio confirmado, leia o código a fundo e produza um spec baseline em `.docs/specs/baseline-<dominio>.md`, usando `_TEMPLATE.md` com duas adaptações:

- `Status: Concluído` (descreve o que JÁ existe, não trabalho futuro).
- Seção extra ao final: `## 7. Dívidas e riscos observados` com o que você encontrou de frágil (sem corrigir nada agora).

**Fan-out em codebases grandes:** se o inventário indicar projeto grande (mais de 4 domínios, ou dezenas de milhares de linhas), não processe os domínios em série na sessão principal. No Claude Code, dispare um subagent de exploração POR DOMÍNIO, em paralelo, cada um instruído a ler os pontos de entrada daquele domínio e devolver as regras de negócio encontradas (com arquivo e função de origem) e as incertezas. Consolide os retornos nos specs baseline na sessão principal, um domínio por vez, com checkpoint no diário entre cada consolidação. Isso protege a janela de contexto (o código lido fica no contexto dos subagents, não no seu) e acelera a varredura. Em projetos pequenos, ou fora do Claude Code, siga em série normalmente.

Regras da engenharia reversa:

1. Extraia as regras de negócio DO CÓDIGO (validações, condicionais, limites, permissões, tratamento de erro), não da sua imaginação. Cada regra documentada deve apontar o arquivo e função de origem.
2. O que o código não responder, marque como `[INCERTO: pergunta]` no spec em vez de presumir.
3. Crie também `.docs/architecture.md`: visão geral do sistema, diagrama em texto dos módulos, stack e decisões aparentes.

## Etapa C - Instalação do template

1. Crie as pastas e arquivos do template que faltarem: `.rules/`, `.prompts/`, `.docs/specs/_TEMPLATE.md`, `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, skill `/sdd`. Copie deste template; não reinvente.
2. Ajuste `.rules/global.md` com as convenções REAIS detectadas na Etapa A (linguagem, framework, comando de teste, estilo de commit). O template deve se adaptar ao projeto, não o contrário.
3. Não altere nenhum código de produção nesta skill. Adoção é documentação e configuração, nunca refatoração.

## Etapa D - Validação e handoff

1. Apresente ao usuário: lista de specs baseline gerados, itens `[INCERTO]` que precisam de resposta e as dívidas encontradas.
2. Percorra os itens `[INCERTO]` um por vez, no estilo Grilling: uma pergunta, uma resposta, atualiza o spec.
3. **Gate: usuário aprova a baseline.** Depois, proponha os micro-commits da adoção (docs e config apenas) seguindo `.prompts/5-commits.md`.
4. Encerre indicando o próximo passo: `/sdd <ideia>` para a primeira feature nova, agora com a baseline como fonte da verdade. Se o inventário mostrou ausência de testes, recomende que a primeira feature seja criar a fundação de testes dos fluxos críticos.

## Regras transversais

- Projeto grande demais para ler tudo? Priorize pontos de entrada e os domínios confirmados; declare no architecture.md o que ficou fora da varredura.
- Nunca execute comandos destrutivos ou de escrita no banco/serviços do projeto durante o inventário.
- Uma adoção por projeto. Rodar de novo deve atualizar a baseline existente, não duplicá-la.
