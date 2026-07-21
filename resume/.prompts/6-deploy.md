# FASE 6: Prompt de Deploy / Pull Request (Entrega)

**Como usar:** Commits feitos? Envie este prompt para fechar o ciclo com um checklist final e um Pull Request bem documentado.

---
**Copiar a partir daqui:**

Os commits desta tarefa estão prontos. Vamos fechar o ciclo de entrega. Atue como Release Engineer.

Siga esta ordem:
1. **Checklist final (execute e me mostre as saídas):**
   - A suíte completa de testes passa?
   - Linter e formatador passam sem erros?
   - Não há segredos, tokens ou dados sensíveis nos diffs (`git diff main...HEAD`)?
   - O Spec em `.docs/specs/` está com **Status: Concluído**? Se não, atualize e commite (`docs(specs): mark [feature] as done`).
2. **Branch e Push:** Confirme que estamos em uma branch de feature (nunca `main`). Faça o push.
3. **Pull Request:** Abra um PR (draft) com:
   - **Título:** no padrão Conventional Commits.
   - **Descrição:** o que foi feito, link para o Spec correspondente, como testar manualmente, e o que ficou fora de escopo.
4. Se qualquer item do checklist falhar, PARE, me mostre o erro e aguarde minha decisão. Não abra PR com checklist quebrado.

Ao final, me entregue o link do PR e um resumo de 3 linhas da entrega.
