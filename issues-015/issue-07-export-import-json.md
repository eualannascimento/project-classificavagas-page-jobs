# Issue 07 — Export / Import JSON (persistência entre sessões)

**Tipo:** AFK  
**Status:** ready-for-agent

## Parent

PRD: `ideias-to-project/personal/prd-015-eu-gero-meu-curriculo.md`

## What to build

Implementar o mecanismo de backup e restauração de dados via arquivo JSON, permitindo que o usuário salve seu progresso e retome em outro dispositivo ou navegador.

**Export:** botão "Salvar rascunho (.json)" serializa o objeto de estado completo do formulário (todos os campos + template selecionado) e dispara o download via Blob URL.

**Import:** botão "Carregar rascunho" abre um `<input type="file">` que aceita `.json`, lê o arquivo, valida a estrutura mínima esperada e popula todos os campos do formulário. O `localStorage` é atualizado em seguida.

Disponível tanto na tela de revisão final quanto em um menu/botão acessível durante o wizard.

## Acceptance criteria

- [ ] Botão de export JSON disponível durante o wizard e na tela de revisão
- [ ] JSON exportado contém todos os dados do formulário e o template selecionado
- [ ] Botão de import aceita apenas arquivos `.json`
- [ ] Após import, todos os campos do wizard são preenchidos com os dados do arquivo
- [ ] Import com arquivo inválido ou corrompido exibe mensagem de erro amigável sem quebrar o estado atual
- [ ] `localStorage` é sincronizado após um import bem-sucedido

## Blocked by

- Issue 06 — Export Word (.docx) e TXT
