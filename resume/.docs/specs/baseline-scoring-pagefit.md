# Avaliação de Qualidade & Page Fit (Scoring)

**Status:** Concluído  
**Data:** 2026-07-13

## 1. Resumo e Objetivo

Este domínio avalia a qualidade do conteúdo digitado no currículo em tempo real (notas Fraco/Bom/Ótimo por campo) com base em boas práticas e mensura o volume físico para garantir que todo o conteúdo caiba perfeitamente em 1 página A4 física, aplicando penalidades ao score em caso de excessos (overflow).

## 2. User Stories (Requisitos Funcionais)

- **US01:** Como candidato, quero receber uma avaliação (Fraco / Bom / Ótimo) em tempo real por campo, para saber se meus textos são objetivos e possuem verbos de impacto.
- **US02:** Como candidato, quero ver um resumo consolidado da minha pontuação geral na revisão, para ter certeza da qualidade antes de exportar.
- **US03:** Como candidato, quero ver um alerta visual claro de overflow caso o tamanho das minhas descrições exceda o espaço físico de uma folha A4.

## 3. Regras de Negócio e Casos de Falha (Edge Cases)

- **Regra 01 (Verbos de Ação):** Textos de descrições e resumos profissionais devem conter pelo menos um verbo de ação cadastrado na base configurável (ex: *implementei, gerenciei, criei, liderei, automatizei*) ([js/scoring.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/scoring.js#L30-L34) e [js/config.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/config.js#L5-L13)).
- **Regra 02 (Resultados Mensuráveis):** Textos descritivos que contêm dígitos numéricos indicando resultados mensuráveis (ex: `%`, `R$`, `quantidade`) são pontuados de forma mais positiva ([js/scoring.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/scoring.js#L36-L39)).
- **Regra 03 (Escalonamento por Tamanho de Campo):** A avaliação do comprimento segue perfis específicos ([js/scoring.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/scoring.js#L16-L21)):
  - **Resumo profissional:** Ideal entre 80 e 550 caracteres. Limite rígido (hardMax) de 750 caracteres.
  - **Descrição de experiências/projetos:** Ideal entre 40 e 260 caracteres. Limite rígido de 380 caracteres.
  - **Habilidades (skillsText):** Ideal entre 2 e 180 caracteres. Limite rígido de 260 caracteres.
  - **Campos padrões:** Ideal entre 3 e 120 caracteres. Limite rígido de 200 caracteres.
- **Regra 04 (Resultado de Qualidade por Campo):**
  - **Fraco:** Campo obrigatório vazio, abaixo do tamanho mínimo, ou ultrapassando o limite rígido (hardMax).
  - **Bom:** Preenchido dentro de faixas normais, mas sem verbos/métricas exigidos.
  - **Ótimo:** Preenchido dentro da faixa ideal de tamanho, contendo verbos de ação e/ou dados numéricos aplicáveis ([js/scoring.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/scoring.js#L58-L87)).
- **Regra 05 (Lógica de Page Fit A4):** O sistema calcula os limites físicos ([js/scoring.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/scoring.js#L145-L218)):
  - **Caracteres Totais:** Soft limit = 3200 caracteres (retorna aviso `warning`); Hard limit = 4200 caracteres (retorna estado `overflow`).
  - **Experiências Profissionais:** Máximo recomendado = 4 (acima disso retorna `overflow`).
  - **Soma de Itens em Listas:** Máximo recomendado = 12 (acima disso retorna `overflow`).
- **Regra 06 (Penalização no Score Geral):** Se o Page Fit indicar `overflow`, a pontuação geral do currículo é severamente limitada ao menor valor entre a pontuação de qualidade calculada, o fitScore deduzido, e o teto máximo de **45%** de pontuação geral ([js/scoring.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/scoring.js#L230-L233)).

## 4. Estrutura de Dados e Componentes

### Componentes / Scripts:
- **[scoring.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/scoring.js):** Contém toda a lógica pura para pontuação e dimensionamento de páginas.

### Formato de Retorno do Page Fit:
```javascript
{
  level: 'ok' | 'warning' | 'overflow',
  fitScore: 85, // Escala de 0 a 100
  issues: [
    'Conteudo denso (3500 caracteres) - pode nao caber em 1 pagina'
  ],
  metrics: {
    totalChars: 3500,
    listItems: 6,
    experienceCount: 3,
    sectionCount: 5
  }
}
```

## 5. Critérios de Aceite (verificáveis por teste)

- **[ ] CA01:** Dado uma descrição de experiência sem verbos de ação, quando pontuada, então não deve ser considerada "Ótima".
- **[ ] CA02:** Dado um currículo com volume de texto acima de 4200 caracteres, quando calculado o encaixe de página, então o status de encaixe deve ser `overflow` com as devidas mensagens de alerta.
- **[ ] CA03:** Dado um currículo com pontuação perfeita de texto de 100%, quando a quantidade de itens causar `overflow`, então a pontuação final agregada não deve ultrapassar 45%.

## 6. Fora de Escopo

- Redimensionamento automático ou encolhimento de fontes via código (CSS/JS) para fazer caber no A4.
- Edição automatizada do conteúdo pelo sistema usando IA nativa para reduzir caracteres.

## 7. Dívidas e riscos observados

- **Uso de RegExp simplificado para resultados mensuráveis:** A verificação de dados quantificáveis busca apenas a presença de qualquer caractere numérico (`/\d/`), o que significa que o ano "2020" em "Trabalhei em 2020" é erroneamente classificado como um resultado mensurável e com evidência de impacto.
- **Limites de A4 baseados puramente em heurísticas de caracteres:** A estimativa de quebra de página não calcula alturas reais em pixels dos elementos renderizados, gerando falso-positivos ou falso-negativos dependendo do template (por exemplo, templates de barra lateral utilizam o espaço vertical de forma diferente de layouts de coluna única).
