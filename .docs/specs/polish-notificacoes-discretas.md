# Notificações discretas

**Status:** Concluído  
**Data:** 2026-07-19

## Objetivo

Evitar que mensagens temporárias cubram controles do currículo.

## Requisitos

- Ações com resultado já visível na tela não abrem toast: escolher ponto de partida e trocar modelo.
- O indicador de rascunho salvo no cabeçalho continua sendo usado para salvamento automático.
- Toasts de erro e ações reversíveis, como desfazer exclusão, permanecem disponíveis.
- No celular, o toast fica acima da barra fixa do wizard.

## Critérios de aceite

- Escolher um ponto de partida e trocar modelo não chama `showToast`.
- O CSS mobile reserva espaço para a barra inferior antes do toast.
