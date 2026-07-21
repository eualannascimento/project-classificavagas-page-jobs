# Regras Globais do Projeto (Fase 0 - System Instructions)

ESTE ARQUIVO É SEU CONTEXTO MESTRE. VOCÊ DEVE SEGUIR ESTAS REGRAS EM QUALQUER INTERAÇÃO NESTE REPOSITÓRIO:

## 1. Comportamento e Comunicação
- **Idioma:** Responda, documente e explique em Português do Brasil (PT-BR). Código, nomes de variáveis, métodos e banco de dados DEVEM ser em Inglês.
- **Economia de Tokens e Respostas:** Seja ultra-conciso. Sem introduções amigáveis ("Claro, posso ajudar!"). Retorne apenas o que foi pedido. Foque em fornecer Diffs de código em vez de reescrever arquivos imensos inteiros.
- **Tolerância Zero a Alucinação:** Nunca adivinhe ou assuma uma regra de negócio que não esteja claramente documentada na pasta `.docs/specs/`. Se algo faltar, PARE e pergunte ao usuário.
- **Pontuação - travessão proibido:** NUNCA use o travessão (em dash, U+2014) nem a meia-risca (en dash, U+2013), em hipótese nenhuma: nem em textos, nem em documentação, nem em mensagens de commit, nem em código. Use sempre o hífen "-" no lugar.
- **Estilo anti-IA:** todo conteúdo gerado (código, docs, commits, textos) deve passar pelos critérios de exclusão E01-E25 de `.rules/anti-ai-style.md` antes de ser entregue.
- **Resiliência de contexto:** siga o protocolo de `.rules/context-management.md` (diário de execução, checkpoints, recuperação silenciosa). Nada necessário para retomar o trabalho pode existir apenas na conversa.

## 2. Princípios de Engenharia de Software
- **Spec-Driven Development (SDD):** Você é proibido de escrever código de produção sem antes ler ou exigir um arquivo Markdown `.md` de especificação aprovado em `.docs/specs/`.
- **TDD (Test-Driven Development):** Testes primeiro. Sempre. O ciclo é Red → Green → Refactor.
- **Segurança Default:** Valide e sanitize TODOS os inputs (assuma que o usuário é malicioso), use consultas parametrizadas, nunca logue dados sensíveis, senhas ou tokens em texto puro, e nunca versione segredos (use variáveis de ambiente).
- **Simplicidade:** Escreva o código mínimo necessário para o teste passar. Não antecipe funcionalidades fora do Spec (YAGNI).

## 3. Versionamento (A Regra de Ouro do Git)
- É PROIBIDO agrupar dezenas de alterações em um único commit.
- Você deve dividir alterações arquiteturais e de código em entregas lógicas (Micro-commits).
- Use o padrão *Conventional Commits* (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- Nunca faça push direto para `main`. Todo trabalho entra via Pull Request.

## 4. Manutenção do Template
- **Reavalie o scaffolding a cada geração de modelo:** quando uma nova família de modelos de IA for adotada, teste remover instruções prescritivas (passos enumerados, avisos repetidos) dos prompts e skills deste template e compare os resultados. Modelos mais capazes rendem mais com objetivo e restrições claras do que com passo a passo detalhado; scaffolding escrito para um modelo antigo pode degradar um modelo novo.
- **Prefira gate verificável a instrução:** sempre que uma regra puder ser checada por código (hook em `.claude/hooks/`, workflow em `.github/workflows/`), implemente a checagem e reduza a regra em prosa a uma linha.

## 5. Máquina de Estados do Workflow
Você só pode avançar de fase com autorização explícita do usuário:
`Grilling (1) → Spec (2) → TDD (3) → Review (4) → Commits (5) → Deploy (6)`

## 6. Stack e Comandos do Projeto
- **Stack:** HTML5, CSS3, JavaScript Vanilla puro (ES6+). Sem frameworks, bundlers ou compilação.
- **Testes:** Executar com `node tests/smoke-test.js`. Toda nova lógica pura deve ser coberta por este arquivo de teste.
- **Convenções:** Nomes de arquivos, funções e variáveis em inglês. Comentários, documentação e interface com usuário em português do Brasil (PT-BR).

