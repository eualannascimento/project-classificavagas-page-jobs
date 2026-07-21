# Preview Dinâmico & Templates

**Status:** Concluído  
**Data:** 2026-07-13

## 1. Resumo e Objetivo

Este domínio renderiza a visualização do currículo em tempo real estruturado em templates de layout específicos. Garante que a troca de template ocorra de forma instantânea sem perder os dados já preenchidos pelo candidato.

## 2. User Stories (Requisitos Funcionais)

- **US01:** Como candidato, quero escolher um template de currículo antes de começar, para já preencher visualizando o estilo final.
- **US02:** Como candidato, quero visualizar o currículo sendo montado em tempo real enquanto preencho, para acompanhar a aparência visual e quebras de linha antes de exportar.
- **US03:** Como candidato, quero poder trocar o template a qualquer momento sem perder os dados preenchidos, para experimentar diferentes visuais sem retrabalho.

## 3. Regras de Negócio e Casos de Falha (Edge Cases)

- **Regra 01 (Categorias de Layouts):** A aplicação suporta 4 formatos de layout estrutural ([js/config.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/config.js#L191-L224)):
  - `centered`: Layout centralizado clássico (usado pelos templates **Clássico** e **Elegante**).
  - `sidebar`: Layout de duas colunas com barra lateral colorida (usado pelos templates **Moderno** e **Criativo**).
  - `banner`: Faixa superior escura (usado pelo template **Executivo**).
  - `left`: Alinhado inteiramente à esquerda, ultra limpo (usado pelo template **Minimalista**).
- **Regra 02 (Segmentação por Layout Sidebar):** Quando o template ativo possuir layout do tipo `sidebar`, as seções `skills` e `languages` são movidas inteiramente para a barra lateral (`aside.cv-sidebar`) e omitidas da coluna principal do corpo (`main.cv-main`) ([js/preview.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/preview.js#L175-L214) e [js/cv-data.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/cv-data.js#L197-L202)).
- **Regra 03 (Preservação de Dados ao Alternar):** O modelo `CvData` lê o estado centralizado e normaliza os dados independentemente do template selecionado. A alternância de template altera apenas o parâmetro de renderização visual e a classe CSS do container, assegurando perda zero de dados ([js/cv-data.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/cv-data.js#L28-L51)).
- **Regra 04 (Visualização de Skeletons):** Caso uma seção esteja ativada na configuração do currículo mas não possua nenhum caractere preenchido pelo usuário, ela exibe caixas cinzas simulando textos ("skeletons") no painel de preview para guiar visualmente o candidato ([js/preview.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/preview.js#L32-L34)).

## 4. Estrutura de Dados e Componentes

### Componentes / Scripts:
- **[preview.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/preview.js):** Gerencia a manipulação de DOM para atualizar dinamicamente a estrutura HTML dentro do container `#preview-paper-wrap`.
- **[cv-data.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/cv-data.js):** Consolida e modela o estado em formato uniforme independente do estilo escolhido.

---

## 5. Critérios de Aceite (verificáveis por teste)

- **[ ] CA01:** Dado um currículo com dados de habilidades preenchidos, quando renderizado no template Moderno, as habilidades devem aparecer localizadas no `aside.cv-sidebar`.
- **[ ] CA02:** Dado que o usuário preencheu dados pessoais e experiências, quando ele trocar o template de Clássico para Moderno e depois de volta para Clássico, os dados pessoais e experiências inseridos devem permanecer idênticos.
- **[ ] CA03:** Dado uma seção opcional vazia no formulário, quando a mesma for ativada pelo checklist, então o preview deve exibir o componente de skeleton correspondente.

## 6. Fora de Escopo

- Customização arbitrária de fontes e tamanhos pelo usuário na interface.
- Edição de conteúdo clicando diretamente no painel de preview (a edição é feita exclusivamente nos inputs do formulário).

## 7. Dívidas e riscos observados

- **Código HTML de renderização duplicado:** As funções de geração de HTML do preview em [preview.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/preview.js) e de formatação no gerador de exportação PDF/Word em [export.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/export.js) não compartilham renderizadores, levando a duplicidades de lógica visual e risco de divergências visuais (o preview mostrar uma coisa e o PDF/Word exportado conter outra).
- **Manipulação de DOM sem higienização estrita:** O preview injeta HTML de descrições diretamente em strings concatenadas com inputs (apesar da presença de `escapeHtml`), mas quebras de linha (`\n` por `<br>`) e outros parses precisam ser mantidos estritamente limpos de scripts.
