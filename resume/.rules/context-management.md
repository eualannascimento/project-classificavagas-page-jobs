# Gestão da Janela de Contexto

A janela de contexto pode estourar no meio de qualquer fase (compactação de conversa, sessão nova, IDE reiniciada). Este protocolo garante que o fluxo continue de onde parou sem que o usuário perceba a troca. O princípio: **nenhuma informação necessária para continuar o trabalho pode existir apenas na conversa**. Tudo que importa vive em arquivos.

## 1. O diário de execução

Cada feature em andamento tem um diário em `.docs/journal/<slug-da-feature>.md`. Ele é a memória externa do fluxo e segue este formato fixo, sempre SOBRESCRITO (nunca acumule histórico; o diário é um snapshot, não um log):

```markdown
# Diário: <nome da feature>

- **Spec:** .docs/specs/<slug>.md
- **Fase:** <1 a 6>
- **Último passo concluído:** <frase objetiva>
- **Próxima ação:** <a primeira coisa a fazer ao retomar, específica e executável>
- **Arquivos tocados:** <lista de caminhos>
- **Comando de teste:** <comando exato usado para rodar a suíte>
- **Decisões desta execução:** <decisões tomadas em conversa que ainda não estão no spec>
- **Pendências/bloqueios:** <testes falhando, dúvidas abertas, nada se vazio>
```

Regra de ouro do conteúdo: escreva para um substituto que nunca viu a conversa. Se a "Próxima ação" não for executável por alguém sem contexto, ela está mal escrita. Mantenha o diário com menos de 40 linhas.

## 2. Quando gravar (checkpoints)

Atualize o diário nestes momentos, sem exceção:

- **C1:** ao concluir qualquer passo numerado de uma fase.
- **C2:** antes de iniciar operação longa (rodar suíte, varredura de codebase, refatoração multi-arquivo).
- **C3:** ao tomar qualquer decisão com o usuário que ainda não esteja no spec. Se a decisão for regra de negócio, atualize o SPEC imediatamente, não o diário; o diário não é fonte da verdade de requisitos.
- **C4:** em cada iteração do loop Red/Green da Fase 3 em que o conjunto de testes falhando mudou.
- **C5:** ao cruzar um gate de fase (atualize Fase, Último passo e Próxima ação juntos).

## 3. Recuperação silenciosa

Ao iniciar ou retomar trabalho em uma feature (inclusive após compactação de contexto), execute SEM perguntar nada ao usuário:

1. Leia o spec da feature e o diário correspondente.
2. Confira a realidade: `git status`, `git log --oneline -5` e, se houver dúvida, rode a suíte de testes. A realidade do repositório SEMPRE vence o diário; se divergirem, corrija o diário e siga a realidade.
3. Retome pela "Próxima ação" do diário.
4. Comunique em UMA linha ("Retomando <feature>, fase N: <próxima ação>") e continue. Proibido pedir ao usuário que re-explique o que já foi decidido ou reenviar informações que estão no spec e no diário.

Só pergunte algo ao usuário se spec + diário + repositório forem insuficientes para agir com segurança.

## 4. Economia de contexto durante as fases

Prevenir o estouro vale mais que se recuperar dele:

- **Leitura seletiva:** leia apenas os arquivos e trechos necessários para o passo atual. Nunca despeje o codebase inteiro na conversa.
- **Erros resumidos:** ao analisar falhas de teste, extraia apenas as linhas relevantes do stacktrace, não o log completo.
- **Sem releituras:** não releia arquivos que não mudaram desde a última leitura.
- **Saídas curtas:** siga a regra de economia de tokens do `global.md`; prefira diffs a arquivos inteiros.
- **Fases longas:** se uma fase tiver muitos itens (ex.: dezenas de testes na Fase 3, muitos domínios no /sdd-adopt), processe em lotes pequenos e faça checkpoint entre lotes.

## 5. Ciclo de vida do diário

- Criado na Fase 1 (ou na Etapa A do /sdd-adopt).
- A pasta `.docs/journal/` fica no `.gitignore`: o diário é estado transitório da execução, não documentação do projeto.
- Ao concluir a Fase 6 (spec `Concluído`), delete o diário da feature.
