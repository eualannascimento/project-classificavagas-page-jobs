# Eu Gero Meu Currículo

Plataforma web estática, 100% gratuita e sem servidor, para criar currículos e guias LinkedIn. Todos os dados ficam no seu navegador — nada é enviado para servidores externos.

## Funcionalidades

- **Wizard passo a passo** com todos os campos do perfil LinkedIn (13 seções)
- **Dicas inline** de boas práticas em cada campo
- **Preview ao vivo** com 2 templates (Clássico e Moderno), trocáveis a qualquer momento
- **Pontuação em tempo real** (Fraco / Bom / Ótimo) por campo
- **Revisão final** com barra de progresso e lista de campos a melhorar
- **Exportação** em PDF (com QR Code do LinkedIn), Word (.docx) e TXT
- **Backup JSON** — exportar e importar rascunhos entre sessões/dispositivos
- **Guia LinkedIn** — textos prontos para colar campo a campo
- **Prompts de IA externa** — geral, por seção e tradução para inglês (sem integração de API)
- **Persistência automática** via `localStorage`

## Como usar

Abra o arquivo `index.html` diretamente no navegador — não é necessário servidor nem build:

```bash
# Opcional: servir localmente
python3 -m http.server 8080
# Acesse http://localhost:8080
```

## Estrutura do projeto

```
index.html          # Página principal
css/style.css       # Estilos (inclui templates e responsividade)
js/
  config.js         # Seções, campos, dicas, verbos de ação
  scoring.js        # Pontuação por campo (módulo puro)
  storage.js        # localStorage + JSON import/export
  prompts.js        # Geração de prompts IA (módulo puro)
  preview.js        # Preview ao vivo dos templates
  export.js         # PDF, Word, TXT
  linkedin-guide.js # Guia LinkedIn
  app.js            # Orquestração da aplicação
tests/
  smoke-test.js     # Testes unitários (Node.js)
```

## Testes

```bash
node tests/smoke-test.js
```

## Deploy (GitHub Pages)

1. Faça push do repositório para o GitHub
2. Em Settings → Pages, selecione a branch `main` e pasta `/ (root)`
3. A aplicação estará disponível em `https://<usuario>.github.io/<repo>/`

## Privacidade

- Sem cadastro, sem e-mail, sem pagamento
- Dados salvos apenas no `localStorage` do navegador
- Prompts de IA são copiados manualmente — nenhuma API externa é chamada automaticamente
- Use o checkbox "Incluir meus dados no prompt" para controlar o que compartilha com IAs externas

## Stack

- HTML, CSS e JavaScript puro (sem frameworks, sem bundler)
- [jsPDF](https://github.com/parallax/jsPDF) — PDF
- [docx.js](https://docx.js.org/) — Word
- [qrcode](https://www.npmjs.com/package/qrcode) — QR Code no PDF

## Licença

Projeto open source — use livremente.
