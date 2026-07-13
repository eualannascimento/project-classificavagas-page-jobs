# FASE 4: Prompt de Auditoria e Refatoração

**Como usar:** Os testes passaram, mas o código gerado pode estar ruim, repetitivo ou inseguro. Acione a IA com isso antes de commitar.

---
**Copiar a partir daqui:**

Os testes passaram e a lógica base está concluída. Agora, atue como um Staff Security & Performance Engineer e faça um Code Review agressivo das modificações que acabamos de gerar (apenas do diff desta tarefa, não do repositório inteiro).

Analise as seguintes verticais:
1. **Segurança Exaustiva:** Há brechas do OWASP Top 10? Há validação adequada em todos os fluxos de entrada? Algum log ou cache gravando dados PII (dados pessoais identificáveis), senhas ou tokens? Algum segredo hardcoded?
2. **Performance e Complexidade:** Identifique loops aninhados desnecessários, N+1 queries em bancos de dados, gargalos de memória e complexidade ciclomática muito alta.
3. **Padrões SOLID e Clean Code:** Identifique funções infladas, duplicação e acoplamentos indevidos.
4. **Qualidade dos Testes:** Há assertivas fracas, testes que passam por acidente ou edge cases do Spec sem cobertura?

Para cada falha encontrada: classifique a severidade (Crítica / Alta / Média / Baixa), aponte o arquivo e a linha, e gere o snippet (diff) de refatoração resolvendo o problema SEM alterar o comportamento funcional (para que nossos testes não quebrem). Aplique as correções, re-execute a suíte de testes e me apresente o resumo.
