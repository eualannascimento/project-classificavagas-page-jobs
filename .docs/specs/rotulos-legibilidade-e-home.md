# Rótulos visíveis, piso de legibilidade e uma home que ocupa a tela

Quatro pendências que a auditoria de design levantou e deixou em aberto.

## 1. A home só usava a metade de cima

`.product-hub` reserva `100dvh` e empilhava tudo no topo. Numa janela de
1280x800 sobravam ~340px em branco embaixo dos cartões, com o rodapé colado
neles: a página parecia interrompida.

Duas mudanças:

* A home vira coluna flexível. As margens `auto` na chamada e nos cartões
  dividem a sobra em cima e embaixo, o miolo fica centrado na altura e o
  rodapé ancora o fim da tela. Quando o conteúdo passa da tela, as margens
  viram zero e nada disso atua.
* O cartão "Vagas" passa a dizer o tamanho do serviço:
  **213.077 vagas abertas de 893 empresas**.

O número vem de `catalog_manifest.json`, que tem **299 bytes** e já é
publicado ao lado do catálogo. Não encosta nos 8 MB do catálogo, que só
carregam na rota de vagas. Se a leitura falhar, o parágrafo continua `hidden`
e o cartão fica como estava.

`.hub-button` passa a `margin-top: auto`: só o cartão de vagas ganhou a linha
nova, e com margem fixa os dois botões deixariam de alinhar entre si.

## 2. Três chips anônimos na barra do celular

Ordenação, visualização e visualizadas apareciam só com o ícone. Em sequência,
eram três símbolos sem texto, e nada dizia por que a lista estava naquela
ordem nem em que modo ela estava. A barra rola na horizontal, então o rótulo
cabe.

| chip | antes | depois |
| --- | --- | --- |
| ordenar | ícone (44px) | `⇅ PUBLICADAS ↓` (134px) |
| visualização | ícone (40px) | `▤ CARTÕES` (97px) |
| visualizadas | ícone (44px) | `👁 VISTAS` (90px) |

O botão de visualização passa a mostrar o **modo atual**, com ícone e nome.
Antes ele desenhava o ícone do próximo modo, sem texto. Os vizinhos dessa
barra relatam estado ("Filtros" com contagem, "Publicadas", "Vistas" com
contagem); este passa a relatar também, e o rótulo acessível diz para onde o
toque leva: `Visualização em cartões. Alternar para lista`.

## 3. Piso de 11px para a tipografia de apoio

Medido no cartão: a data ficava em **9,28px**, o menor texto da interface e um
dos mais lidos. Localização em 10,56px, contador de resultados em 10,4px,
botão do aviso de privacidade em 10,56px, e no celular `brand-by` em 9px.

Entra `--fs-meta: 0.6875rem` (11px) no mesmo `:root` das outras escalas, e as
declarações passam a apontar para ela.

### O que isso custou, e como foi pago

Texto maior ocupa mais largura. Na fileira da visão em lista a coluna de datas
foi de 117px para 139px, comendo 22px do título.

A primeira coluna dessa fileira (`.job-list-index`) existe só para hospedar o
ponto de novidade, que tem 5px e é posicionado por absoluto. Ela reservava
32px, mais 10px de espaçamento. Reduzida a 12px com espaçamento de 8px,
devolve 22px.

Fileira de 358px, num viewport de 390px:

| | antes desta mudança | depois |
| --- | --- | --- |
| coluna do título | 157px | 161px |
| empresa | 73px | 75px |
| data do cartão | 9,28px | 11px |

O piso se paga: título e empresa terminam mais largos do que estavam, com a
data legível.

## 4. "Documentos legais" parecia uma terceira aba

Nas páginas legais o `<span>` que nomeia a linha vinha em 12px sans e
`--ink-2`, o mesmo peso dos dois links ao lado. Vira sobrescrito: caixa alta,
`--fs-meta`, `--ink-3` e entrelinha aberta, a mesma linguagem do
`.product-kicker` da home. Ele nomeia a linha; os dois links é que são
escolhas.

## Verificação

Sem overflow horizontal em 320, 360, 390, 480, 599, 768, 1024 e 1440px, com o
catálogo de 213.077 vagas carregado.
