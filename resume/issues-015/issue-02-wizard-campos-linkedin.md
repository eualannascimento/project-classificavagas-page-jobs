# Issue 02 — Wizard completo com todos os campos LinkedIn + localStorage

**Tipo:** AFK  
**Status:** ready-for-agent

## Parent

PRD: `ideias-to-project/personal/prd-015-eu-gero-meu-curriculo.md`

## What to build

Implementar o wizard step-by-step cobrindo todas as seções do perfil LinkedIn. Cada seção é uma etapa do wizard com seus campos, labels e dicas de boas práticas inline (tooltip ou texto abaixo do campo).

Seções e campos a cobrir:
1. **Dados Pessoais** — nome completo, cargo desejado, e-mail, telefone, cidade/estado, URL do LinkedIn
2. **Resumo/Sobre** — texto livre (campo Sobre do LinkedIn)
3. **Experiências Profissionais** — lista dinâmica: empresa, cargo, período (início/fim), descrição de atividades
4. **Formação Acadêmica** — lista dinâmica: instituição, curso, período
5. **Habilidades** — lista de tags
6. **Idiomas** — lista: idioma + nível de proficiência
7. **Certificados e Licenças** — lista: nome, emissor, data, URL opcional
8. **Projetos** — lista: nome, descrição, URL opcional
9. **Voluntariado** — lista: organização, cargo, período, descrição
10. **Publicações** — lista: título, publicação, data, URL opcional
11. **Prêmios e Honrarias** — lista: título, emissor, data, descrição
12. **Organizações** — lista: nome, cargo, período
13. **Cursos** — lista: nome, instituição, data

Navegação com botões Anterior / Próximo. O estado completo do formulário é salvo no `localStorage` a cada evento de input, e recuperado automaticamente ao reabrir a página.

## Acceptance criteria

- [ ] Wizard navega linearmente entre as 13 seções com botões Anterior / Próximo
- [ ] Cada campo exibe uma dica de boas práticas inline (texto estático abaixo do campo ou tooltip)
- [ ] Seções com listas (Experiências, Formação etc.) permitem adicionar e remover itens dinamicamente
- [ ] Estado completo do formulário persiste no `localStorage` e é restaurado ao recarregar a página
- [ ] Todos os campos cobrem as seções do perfil LinkedIn conforme listado acima

## Blocked by

- Issue 01 — Estrutura base + tela de seleção de template
