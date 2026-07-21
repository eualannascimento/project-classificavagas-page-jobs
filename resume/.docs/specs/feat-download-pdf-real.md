# Download Direto de PDF (sem diálogo de impressão)

**Status:** Concluído
**Data:** 2026-07-18

## 1. Resumo e Objetivo

Hoje o botão "Baixar currículo em PDF" abre a caixa de diálogo de impressão do navegador e depende do usuário escolher manualmente "Salvar como PDF". Esta entrega troca esse fluxo por um download direto de um arquivo `.pdf` real, gerado no cliente via `jsPDF` vendorizado localmente, mantendo a fidelidade visual aos 20 modelos e o texto selecionável exigido pela checagem de ATS já existente na tela de revisão.

## 2. User Stories (Requisitos Funcionais)

- **US01:** Como candidato, quero clicar em "Baixar currículo em PDF" e receber diretamente o arquivo `CV_<NOME>_<CARGO>.pdf`, sem passar pela caixa de diálogo de impressão do navegador.
- **US02:** Como candidato, quero que o PDF baixado seja visualmente fiel ao modelo escolhido na prévia (cores, layout, fonte), para não haver surpresas ao abrir o arquivo.
- **US03:** Como candidato, quero que o texto do PDF gerado seja selecionável e copiável, para que plataformas de recrutamento (ATS) consigam ler o conteúdo corretamente.
- **US04:** Como candidato, quero um aviso claro caso a geração do PDF falhe (ex: dado inválido, erro de biblioteca), para saber que preciso tentar novamente.

## 3. Regras de Negócio e Casos de Falha (Edge Cases)

- **Regra 01 (Biblioteca vendorizada, sem CDN):** `jsPDF` (UMD) e as fontes `Barlow`/`Barlow Condensed` (TTF, convertidas para base64) ficam em `js/vendor/`, servidas via `'self'`. Nenhuma chamada de rede em tempo de execução: respeita a CSP atual (`script-src 'self'`) e elimina a fragilidade de CDN documentada em `.docs/specs/baseline-export-prompts.md` (seção 7).
- **Regra 02 (Cobertura por família de layout, não por modelo):** Os 20 modelos em `TEMPLATES` (`js/config.js`) se agrupam em 5 famílias estruturais: `centered`, `left`, `sidebar`, `banner`, `creative`. O gerador de PDF implementa um renderizador por família, parametrizado por `thumbAccent` e pelas seções ativas do currículo — não um desenho por modelo individual.
- **Regra 03 (Paginação):** Se o conteúdo ultrapassar uma página A4, o gerador adiciona páginas adicionais no jsPDF, evitando corte de texto no meio de uma linha ou de um item de lista.
- **Regra 04 (Nome do arquivo):** Mantém a convenção atual `CV_<NOME>_<CARGO>.pdf`, reaproveitando `cvFileBaseName()` de `js/screens/review.js`.
- **Regra 05 (Fallback de falha):** Se a geração lançar exceção (ex: estado inconsistente), a interface exibe um toast de erro e mantém o botão disponível para nova tentativa. Não há fallback para impressão do navegador nesta entrega (ver Fora de Escopo).
- **Regra 06 (QR Code do LinkedIn):** Fora de escopo nesta entrega (ver seção 6) — o PDF atual (via impressão) já não inclui QR Code; este comportamento não muda.

## 4. Estrutura de Dados e Componentes

- **Novos arquivos:**
  - `js/vendor/jspdf.umd.min.js`: build UMD do jsPDF, vendorizado.
  - `js/vendor/fonts-barlow.js`: fontes Barlow/Barlow Condensed (regular/600/700) em base64, registradas via `jsPDF.API.events` ou `addFileToVFS`/`addFont`.
  - `js/pdf-export.js`: módulo novo com os 5 renderizadores de família de layout e a função `generatePdf(state, sections, templateId, margin, density)` que retorna um `jsPDF` pronto para salvar.
- **Arquivos alterados:**
  - `js/screens/review.js`: `printCv()` é substituída (ou uma nova função `downloadPdf()` chamada pelo botão) para chamar `EuGeroPdfExport.generatePdf(...)` e `doc.save(cvFileBaseName() + '.pdf')`, no lugar de `window.print()`.
  - `index.html`: inclui `<script src="js/vendor/jspdf.umd.min.js">` e `js/pdf-export.js` antes de `app.js`. Content-Security-Policy não muda (scripts continuam `'self'`).
  - `css/print-preview.css` / `#print-cv`: o elemento oculto de impressão deixa de ser necessário para o PDF (pode ser removido ou mantido apenas se algo mais depender dele — checar antes de remover).
- **Sem alterações:** `js/config.js` (TEMPLATES), `js/scoring.js`, `js/preview.js` (a prévia em tela continua renderizada em HTML/CSS, inalterada).

## 5. Critérios de Aceite (verificáveis por teste)

- [ ] CA01: Dado um estado preenchido com um modelo de cada família de layout (`centered`, `left`, `sidebar`, `banner`, `creative`), quando `generatePdf` for chamado, então deve retornar um objeto jsPDF sem lançar exceção.
- [ ] CA02: Dado um estado com nome "João Silva" e cargo "Analista de Dados", quando o PDF for gerado e baixado, então o nome do arquivo deve ser `CV_Joao-Silva_Analista-de-Dados.pdf` (reaproveitando `cvFileBaseName`).
- [ ] CA03: Dado um estado com conteúdo suficiente para ultrapassar uma página A4, quando `generatePdf` for chamado, então o documento resultante deve ter mais de 1 página (`doc.internal.getNumberOfPages() > 1`).
- [ ] CA04: Dado um estado vazio ou com seções sem conteúdo, quando `generatePdf` for chamado, então não deve lançar exceção (nenhuma seção vazia quebra o layout).
- [ ] CA05: Dado um clique no botão "Baixar currículo em PDF", quando a geração for concluída com sucesso, então não deve ser aberta a caixa de diálogo de impressão do navegador (`window.print` não é chamado).
- [ ] CA06: Dado um erro forçado na geração (ex: mock de `generatePdf` lançando exceção), quando o botão for clicado, então um toast de erro deve ser exibido e nenhum arquivo deve ser baixado.

## 6. Fora de Escopo

- QR Code do LinkedIn no PDF (não existe hoje via impressão; não será reintroduzido nesta entrega).
- Exportação em Word (`.docx`) — removida deliberadamente em `ea96b24` e fora do escopo aqui.
- Redesenho pixel-perfect individual dos 20 modelos — a fidelidade é por família de layout (Regra 02), com pequenas diferenças de acabamento entre modelos da mesma família sendo aceitáveis.
- Suporte a impressão física continuar funcionando via `Ctrl+P` do navegador (não é um requisito desta entrega, mas nada nesta entrega deve quebrá-lo caso o usuário use o atalho nativo do navegador).

## 7. Dívidas e riscos observados

- **Duplicação de lógica de layout:** a lógica de posicionamento (margens, densidade, quebras de seção) hoje vive apenas em CSS (`css/templates.css`, `css/print-preview.css`). Com esta entrega, essa lógica passa a existir também em `js/pdf-export.js` (coordenadas jsPDF). As duas implementações podem divergir ao longo do tempo se um dos dois lados for alterado sem o outro — reintroduz o risco já registrado em `.docs/specs/baseline-export-prompts.md` (seção 7), mitigado pela Regra 02 (5 famílias em vez de 20 desenhos).
- **Tamanho do bundle:** jsPDF (~150-300KB minificado) + fontes Barlow embutidas (~200-400KB) aumentam o peso total carregado pela aplicação, que hoje não tem nenhuma dependência de terceiros. Ambos os arquivos podem ser carregados sob demanda (import dinâmico do script, como o `docx.js` fazia antes) apenas no primeiro clique em "Baixar PDF", em vez de no carregamento inicial da página, para não penalizar o wizard.
