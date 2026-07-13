# Melhorias de UX: Wizard Navigation & Mobile Bottom Sheet

**Status:** Concluído  
**Data:** 2026-07-13

## 1. Resumo e Objetivo

Este spec descreve a implementação de melhorias de usabilidade no fluxo do Wizard e na visualização de prévia em dispositivos móveis. A navegação do Wizard será otimizada com um rodapé fixo contendo botões de navegação rápida e uma barra de progresso percentual. Em telas menores, a experiência de prévia será reestruturada como um painel inferior deslizante (Bottom Sheet) para evitar quebras de contexto durante o preenchimento.

---

## 2. User Stories (Requisitos Funcionais)

- **US01:** Como candidato, quero que os botões de navegação ("Voltar" e "Avançar") estejam sempre visíveis no rodapé da página ao rolar telas longas do Wizard, para transitar rapidamente entre as seções.
- **US02:** Como candidato, quero acompanhar o percentual de preenchimento dos campos obrigatórios em tempo real, para ter certeza de que não esqueci nenhum detalhe essencial.
- **US03:** Como candidato acessando por celular, quero poder visualizar a prévia do meu currículo puxando uma aba na parte inferior da tela (Bottom Sheet), sem perder o foco do campo de texto que estou editando.

---

## 3. Regras de Negócio e Casos de Falha (Edge Cases)

- **Regra 01 (Cálculo do Progresso):** O progresso é baseado no percentual de campos obrigatórios preenchidos dentre as seções atualmente ativas (`state.enabledSections`). 
  - Fórmula: `Math.round((camposObrigatoriosPreenchidos / totalCamposObrigatoriosAtivos) * 100)`.
  - Se `totalCamposObrigatoriosAtivos` for 0, o progresso deve ser considerado `100%`.
- **Regra 02 (Comportamento do Sticky Footer):** 
  - O rodapé de navegação deve ficar fixado no final da tela (`position: fixed` ou `position: sticky` no mobile/desktop) apenas na tela do Wizard (`#screen-wizard`).
  - No último passo do Wizard, o botão "Avançar" deve mudar de texto/ação para "Revisar" (redirecionando para a tela de revisão `#/review`). No primeiro passo, o botão "Voltar" deve apontar para a tela inicial de configuração (`#/start`).
- **Regra 03 (Bottom Sheet no Mobile):**
  - O painel Bottom Sheet é visível apenas em resoluções menores ou iguais a `768px`.
  - Estados do Bottom Sheet:
    - **Minimizado (Peeking):** Exibe uma aba flutuante discreta na base da tela escrita "Ver Prévia" juntamente com a bolinha indicadora de Page Fit (cor verde/amarelo/vermelho).
    - **Expandido (Full/Half):** O painel desliza de baixo para cima cobrindo `85vh` da tela, exibindo o preview A4 completo e interativo. Adiciona um botão visível de fechar/minimizar "✕" e suporte a fechar com a tecla `Esc`.
  - Ao arrastar a alça do painel ou clicar na barra de cabeçalho do peeking, o estado deve alternar para expandido.
- **Regra 04 (Preservação de Foco):** A abertura e fechamento do Bottom Sheet não deve remover o foco do input ativo no Wizard, permitindo digitação direta.

---

## 4. Estrutura de Dados e Componentes

### Arquivos Modificados:
- **[index.html](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/index.html):** Inclusão da estrutura HTML do Sticky Footer no Wizard e reestruturação do `#preview-overlay` para atuar como Bottom Sheet.
- **[css/style.css](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/css/style.css):** Regras CSS de transição, posicionamento `fixed` do Bottom Sheet e estilos do Sticky Footer/Barra de progresso.
- **[js/app.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/app.js):** Lógica de cálculo de progresso de preenchimento, controle de estado do Bottom Sheet (minimizado/expandido) e vinculação de eventos nos novos botões.

---

## 5. Critérios de Aceite (verificáveis por teste)

- **[ ] CA01:** Dado um currículo com 5 campos obrigatórios ativos, quando o usuário preenche 3 deles, o progresso exibido no Sticky Footer deve ser exatamente `60%`.
- **[ ] CA02:** Dado que o usuário está no primeiro passo do Wizard, quando ele clica em "Voltar", então ele deve ser direcionado para a tela de configuração (`#/start`).
- **[ ] CA03:** Dado que o usuário está acessando em um celular, quando ele clica na aba "Ver Prévia", o Bottom Sheet deve subir e aplicar a classe de visualização sem recarregar ou travar a rolagem da página inferior.

---

## 6. Fora de Escopo

- Swipe gestures complexos de física/aceleração nativa do touch no Bottom Sheet (será implementado via cliques/transição CSS padrão).
- Injeção de IA para autocompletar campos automáticos no progresso.
