# FASE 3: Prompt de TDD e Loop Engineering

**Como usar:** O Spec está aprovado? Jogue este prompt para a IA (Claude Code, Cursor Composer ou Windsurf) e deixe ela codar autonomamente as regras baseadas no teste.

---
**Copiar a partir daqui:**

Vamos implementar o Spec que está em: `.docs/specs/[COLOQUE_NOME_DO_ARQUIVO].md`.

Siga estritamente esta ordem e atue de forma autônoma:
1. Leia o Spec integralmente para garantir todo o contexto na memória. Se algo estiver ambíguo, PARE e pergunte antes de escrever qualquer código.
2. Crie **exclusivamente os testes automatizados** em `tests/` para as User Stories, Critérios de Aceite e Edge Cases (casos de falha). NENHUM código de produção ainda.
3. Execute a suíte de testes. Você deve ver os novos testes falharem (Red). Se algum passar sem código de produção, o teste está errado - corrija-o.
4. Escreva o código de produção mínimo possível e estritamente necessário para o teste passar. Nada além do Spec.
5. Se falhar, leia a saída de erro do terminal, compreenda onde está quebrando, corrija e re-execute. Fique neste *loop* de forma autônoma. Se após 5 tentativas o mesmo teste continuar falhando, pare e me explique o impasse em vez de insistir.
6. Ao final, rode a suíte COMPLETA (não só os testes novos) para garantir que nada regrediu.
7. Pare assim que tudo passar (Green) e me avise no chat aguardando aprovação para a Fase 4.
