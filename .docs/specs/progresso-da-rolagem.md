# O progresso da rolagem fica legível

**Status:** Aprovado
**Data:** 2026-08-30

## O problema

Durante a rolagem, o único indicador de progresso era o anel de 2px em volta
do botão de subir. Ele media **pixels**:

```js
const pct = scrollY / (docH - windowH);
```

Com rolagem infinita, `docH` cresce a cada lote de 24 vagas. O anel andava
para trás: subia a 90%, entravam mais 24 vagas, e ele voltava para 70%. Não
era só sutil, era enganoso.

O contador que já existia (`#resultsCounter`, "24 de 54.654") ficava **abaixo
da grade**: só aparecia ao chegar no fim da lista.

## A decisão

Duas escolhas de produto, ambas do dono do projeto:

1. **Forma:** um número ao lado do botão de subir, sem faixa nova na tela.
2. **Contagem:** quantas vagas **já entraram na página**, do total do resultado
   filtrado.

A alternativa oferecida para a contagem era a posição no resultado ("a vaga no
topo da tela é a 148ª"). A escolhida salta de 24 em 24 e fica parada enquanto
se rola dentro do que já foi carregado; responde "quanto já foi baixado?" em
vez de "quanto já vi?".

## A implementação

`updateProgress` passa a ser a fonte única. O contador embaixo da grade, a
pílula ao lado do botão e o anel leem o mesmo par `carregadas / total` e mudam
juntos. Antes eram dois números para a mesma pergunta, e só um deles aparecia
durante a rolagem.

O anel deixa de medir pixels e passa a acompanhar a mesma fração. Em resultado
grande ele é um fio (24 de 54.654 é 0,04%), mas cresce de forma honesta e
nunca recua; em resultado filtrado pequeno ele volta a ser informativo.

A pílula:

* fica dentro do `.fab-stack`, então aparece e some junto com o botão, depois
  de 300px de rolagem;
* é `aria-hidden`, porque `#resultsCounter` já anuncia a mesma contagem por
  `aria-live` e repetir seria ruído no leitor de tela;
* é `pointer-events: none`, porque é rótulo e não controle: sem isso roubaria
  o toque destinado ao botão ao lado.

## Verificação

Medido no artefato real, viewport de 390px:

* pílula e contador com o mesmo texto, `24 de 1.750`;
* pílula 100x28, à esquerda do botão, centrada na mesma linha, dentro da tela,
  sem overflow horizontal;
* anel em `99.1217`, exatamente `100,5 × (1 − 24/1750)`.

**O que não foi verificado localmente:** o avanço do número durante a rolagem
real. A janela do navegador desta máquina fica em 0x0, então não há evento de
scroll nem `requestAnimationFrame`, e o scroll infinito nunca dispara. Quatro
testes e2e cobrem isso no CI, incluindo um que falha se o número recuar — que
era exatamente o defeito do anel.
