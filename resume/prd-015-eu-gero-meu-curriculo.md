# PRD — Eu Gero Meu Currículo (Ideia 015)

**Status:** ready-for-agent  
**Data:** 2026-06-05  
**Origem:** Fusão das ideias 005 e 012, refinada via /grill-me

---

## Problem Statement

Profissionais em busca de emprego precisam criar currículos atualizados e perfis LinkedIn competitivos, mas as ferramentas disponíveis (Canva, Zety, LinkedIn próprio) são pagas, exigem cadastro, não orientam o preenchimento, e não entregam os textos prontos para colar no LinkedIn. O resultado é um currículo genérico e um perfil LinkedIn desatualizado — não por falta de competência, mas por falta de uma ferramenta gratuita, direta e orientada.

---

## Solution

Plataforma web estática, 100% gratuita, sem servidor e sem IA embutida, hospedada no GitHub Pages. O usuário preenche um wizard passo a passo com todos os campos do perfil LinkedIn, recebe orientações inline em cada campo, visualiza o currículo em tempo real e exporta em PDF, Word e TXT. Ao final, recebe um guia com os textos prontos para atualizar o LinkedIn campo a campo. A plataforma também oferece prompts prontos para copiar e colar em qualquer IA externa, permitindo que o usuário use ferramentas como ChatGPT ou Claude como apoio sem nenhuma integração de API.

---

## User Stories

1. Como candidato a emprego, quero preencher meu currículo em etapas organizadas, para não me sentir sobrecarregado com um formulário longo de uma vez só.
2. Como candidato, quero ver orientações de boas práticas em cada campo enquanto preencho, para saber exatamente o que escrever e como aumentar minhas chances.
3. Como candidato, quero visualizar o currículo sendo montado em tempo real enquanto preencho, para acompanhar o resultado antes de exportar.
4. Como candidato, quero escolher um template de currículo antes de começar, para já preencher visualizando o estilo final.
5. Como candidato, quero poder trocar o template a qualquer momento sem perder os dados preenchidos, para experimentar diferentes visuais sem retrabalho.
6. Como candidato, quero receber uma avaliação (Fraco / Bom / Ótimo) em tempo real por campo, para saber quais textos precisam de melhoria antes de exportar.
7. Como candidato, quero ver um resumo consolidado da minha pontuação geral antes de exportar, para ter uma visão clara da qualidade do currículo como um todo.
8. Como candidato, quero exportar meu currículo em PDF, para enviar a recrutadores no formato mais aceito.
9. Como candidato, quero que o PDF gerado inclua um QR Code apontando para o meu LinkedIn, para facilitar o acesso rápido ao meu perfil.
10. Como candidato, quero exportar em Word (.docx), para situações em que o recrutador precisa editar o arquivo.
11. Como candidato, quero exportar em TXT, para colar em sistemas ATS e formulários online de vagas.
12. Como candidato, quero exportar meus dados como JSON e reimportá-los depois, para continuar editando o currículo em sessões futuras sem precisar preencher tudo de novo.
13. Como candidato, quero preencher todos os campos que existem no LinkedIn (Resumo, Experiências, Formação, Habilidades, Idiomas, Certificados, Projetos, Voluntariado, Publicações, Prêmios, Organizações, Cursos), para poder usar a plataforma como fonte única de verdade do meu perfil profissional.
14. Como candidato, quero receber um guia passo a passo com os textos prontos para colar em cada campo do LinkedIn, para atualizar meu perfil sem precisar reescrever nada.
15. Como candidato, quero copiar um prompt geral para colar em uma IA externa (ChatGPT, Claude etc.) que já contém todas as instruções de preenchimento, para receber sugestões de texto para o currículo inteiro de uma vez.
16. Como candidato, quero copiar um prompt específico por seção do wizard, para pedir ajuda à IA somente no campo em que estou travado.
17. Como candidato, quero escolher se o prompt de IA incluirá ou não os dados que já preenchi (via checkbox), para controlar o que compartilho com ferramentas externas.
18. Como candidato, quero copiar um prompt de tradução para inglês, para gerar uma versão do currículo em inglês com apoio de IA externa sem custo adicional.
19. Como candidato, quero usar a plataforma sem criar conta, sem fornecer e-mail e sem pagar nada, para ter privacidade e zero atrito de entrada.
20. Como candidato, quero que a plataforma funcione completamente no navegador sem depender de servidor, para ter garantia de que meus dados nunca saem do meu dispositivo.

---

## Implementation Decisions

- **Stack:** HTML, CSS e JavaScript puro — sem frameworks, sem bundler, sem dependências de build. Arquivos servidos diretamente pelo GitHub Pages.
- **Bibliotecas via CDN:** jsPDF (geração de PDF), docx.js (geração de Word .docx), QRCode.js (geração do QR Code embutido no PDF).
- **Import de PDF do LinkedIn:** fora do MVP — ficará para v2 com PDF.js via CDN.
- **Wizard:** navegação linear por seções, com botões Anterior / Próximo. Cada seção é um bloco de campos com label, input/textarea e tooltip/dica de boas práticas inline.
- **Preview ao vivo:** div à direita da tela que replica o template selecionado e é atualizada via eventos de input, sem re-render completo.
- **Seleção de template:** tela de entrada (antes do wizard) com cards visuais dos templates disponíveis. Botão de troca de template sempre visível durante o preenchimento — troca apenas o CSS/layout do preview sem apagar dados.
- **MVP com 2 templates:** um clássico (monocromático, limpo) e um moderno (com barra lateral colorida).
- **Pontuação por campo:** lógica JS pura avaliando três critérios — (1) comprimento mínimo do texto, (2) presença de verbos de ação de uma lista predefinida em PT-BR, (3) se o campo obrigatório está preenchido. Retorna rótulo Fraco / Bom / Ótimo exibido abaixo do campo em tempo real.
- **Resumo de pontuação final:** tela de revisão antes do export exibe uma barra de progresso geral e lista os campos com nota Fraco para revisão.
- **Export JSON:** `JSON.stringify` do objeto de dados do formulário → download via Blob URL. Import: `<input type="file">` lê o JSON e popula os campos.
- **Guia LinkedIn:** tela final após revisão, organizada por campo do LinkedIn, com caixas de texto somente-leitura e botão "Copiar" individual por campo.
- **Prompts de IA:** dois modos — geral (monta um prompt com todos os campos e instruções) e por seção (prompt contextual para aquela etapa). Checkbox "Incluir meus dados no prompt" injeta os valores preenchidos no prompt gerado. Prompt de tradução é um preset separado.
- **QR Code no PDF:** gerado a partir da URL do LinkedIn informada pelo usuário no campo Dados Pessoais, inserido no rodapé do PDF via jsPDF.
- **Persistência de sessão:** `localStorage` salva o estado do formulário automaticamente a cada input, recuperando ao reabrir a página. Export/import JSON é o mecanismo de backup entre dispositivos.
- **Responsividade:** layout de duas colunas (wizard + preview) em desktop; preview colapsável em mobile.
- **Idioma da interface:** Português do Brasil. Tradução de conteúdo via prompt de IA externo — sem i18n nativo no MVP.

---

## Testing Decisions

- **O que testar:** comportamento externo e observável — pontuação correta por campo dado um input específico, geração de prompt com e sem dados, lógica de export JSON (serialização e desserialização), presença do QR Code no PDF gerado, troca de template sem perda de dados.
- **O que não testar:** detalhes de implementação como estrutura interna do DOM, nomes de variáveis JS ou ordem de execução de funções.
- **Módulos a testar:**
  - Função de pontuação por campo (critérios: tamanho, verbos de ação, obrigatoriedade)
  - Geração de prompts de IA (geral, por seção, com/sem dados injetados, tradução)
  - Serialização/desserialização do JSON de export/import
  - Lógica de troca de template (dados preservados após troca)
- **Forma de teste:** testes unitários com JavaScript puro (sem framework de teste no MVP — validações manuais via console ou scripts de smoke test em arquivo separado). Testes de integração visual feitos manualmente no browser.

---

## Out of Scope

- Import via PDF do LinkedIn (v2 — requer PDF.js)
- Templates adicionais além de 2 (roadmap pós-MVP)
- Suporte bilíngue nativo na interface (coberto por prompt de tradução via IA externa)
- Integração com API de qualquer IA (sem backend, sem chaves de API)
- Autenticação, contas de usuário ou armazenamento em nuvem
- Monetização (plataforma gratuita sem anúncios no MVP)
- Geração de carta de apresentação
- Exportação em ZIP com todos os formatos juntos
- Compatibilidade com sistemas ATS além do export TXT simples

---

## Further Notes

- O nome "Eu Gero Meu Currículo" é provisório. Candidatos mais curtos: **EuGero** ou **EuGero.cv**.
- A ideia central de IA como ferramenta externa (sem integração) é um diferencial de privacidade e custo zero — deve ser comunicado claramente na interface como feature, não como limitação.
- Os campos cobertos seguem o perfil público do LinkedIn em 2025: Dados Pessoais, Resumo/Sobre, Experiências, Formação, Habilidades, Idiomas, Certificados e Licenças, Projetos, Voluntariado, Publicações, Prêmios e Honrarias, Organizações, Cursos. Recomendações ficam fora (não são preenchidas pelo próprio usuário).
- Origem: fusão das ideias 005 (App de currículo com QR Code e importação) e 012 (Gerador de currículos online multi-formato), refinadas via `/grill-me` em 2026-06-05.
