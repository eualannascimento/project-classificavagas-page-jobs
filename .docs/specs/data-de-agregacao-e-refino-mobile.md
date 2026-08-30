# A data de agregação volta ao catálogo, e a lista cabe no celular

## O que estava errado

`scripts/build-columnar.py` monta o `catalog.json`, que é o único arquivo que o
navegador baixa. O cabeçalho do script listava `inserted_date` entre os campos
"que o site nunca lê" e o deixava de fora.

O site lê o campo em dez pontos. Sem ele, cinco recursos ficam mudos:

1. O filtro **"Adicionadas hoje"** nunca casa com nada. No catálogo de
   2026-08-30 havia 95.833 vagas agregadas naquele dia.
2. O intervalo **"Obtida no Classifica Vagas"**, no painel de filtros, sempre
   devolve zero.
3. A ordenação por data de agregação compara tudo contra o mesmo vazio.
4. O ponto verde de novidade no cartão nunca acende, e "novo desde a última
   visita" nunca dispara.
5. A visão em lista imprime `Obtida no Classifica Vagas: Não obtida` nas
   213.077 vagas.

O `recent_jobs.json`, que atende os primeiros segundos, **carrega** o campo.
Então o comportamento regredia no meio da sessão: os recursos funcionavam até o
catálogo completo substituir a carga rápida.

Nenhum teste falhava, porque nenhum teste pedia o campo.

## O que se ganha e o que se paga

Medido no catálogo de 2026-08-30, 213.077 vagas:

| | antes | depois |
| --- | --- | --- |
| `catalog.json.gz` | 8.032.751 bytes | 8.098.645 bytes |

**+66 KB no gzip, +0,8%.** As datas são poucas e repetidas, então o gzip
absorve quase tudo.

## O efeito na visão em lista, no celular

A linha `Obtida no Classifica Vagas: Não obtida` ocupava 153px de uma fileira
de 358px, mais que o título e a empresa somados, para não dizer nada. Ela
empurrava a coluna de metadados sobre a coluna do meio, e ali `job-list-company`
encolhe enquanto `job-list-type` não: a empresa era a primeira a ceder.

Medido em 390px de largura, fileira de 358px:

| | antes | depois |
| --- | --- | --- |
| "Lojas Colombo" | 11px, invisível | 73px, legível |
| coluna de metadados | 153px | 117px |
| linha de data | `Obtida no Classifica Vagas: Não obtida` | `Agregada em: 23/08/2026` |
| ramo | `VAREJO E CO`, cortado no meio | oculto abaixo de 600px |

Abaixo de 600px o ramo sai da fileira: ele já aparece no cartão e no painel de
filtros, e o empregador é o dado que decide se a vaga interessa. Empresa e
modalidade passam a dividir o que sobra, em vez de a empresa sumir.

## O ícone que nunca existiu

A seção "Obtida no Classifica Vagas" abria sem ícone. `#i-calendar_today` era
referenciado e não tinha `<symbol>` no sprite.

Duas guardas deixaram passar, cada uma por um motivo:

1. `scripts/build-icons.py` reconhece nome de ícone em `href="#i-..."`, em
   `icon: '...'` e em mapa cujo nome contenha "icon". O nome vinha como
   **terceiro argumento posicional** de `buildDateRangeSection`, invisível para
   as três expressões. `validate-icons.py` deriva a lista esperada da mesma
   varredura, então também não via.
2. `tests/e2e/icons.spec.js` percorre o DOM renderizado nos três modos de
   visualização, mas **nunca abria o painel de filtros**, que é o único lugar
   onde esse `<use>` existe.

O nome passa a vir de um mapa (`DATE_SECTION_ICONS`), que a varredura enxerga, e
o teste passa a abrir a gaveta e expandir cada seção.

## Piso de altura do cartão

`.job-card` tinha `min-height: 188px` para que uma linha da grade não ficasse
irregular quando um cartão fosse mais curto que os vizinhos. Abaixo de 600px a
grade tem **uma coluna**: não há vizinho, e o piso vira espaço morto.

Medido em 360px: conteúdo de 138px dentro de 188px, 27% da altura em branco, em
cada cartão da rolagem. Com o piso limitado a `min-width: 600px`, o cartão passa
a 140px no celular e continua em 188px a partir de duas colunas.

## Duas pílulas numa interface quadrada

`curriculum-theme.css` zera o raio de borda de toda a interface. Dois controles
não estavam na lista e continuavam arredondados: o seletor **Brasil / Mundo /
Todas**, que é o primeiro elemento da tela de vagas, e o índice "Nesta página"
dos documentos legais. Ambos entram na regra.

## Alvo de toque do seletor de abrangência

`.scope-option` ficava em 32px de altura em telas de toque. O bloco
`@media (hover: none) and (pointer: coarse)` já eleva chips e botões de ícone a
44px; o seletor não estava lá. Entra.

## O que não muda

Ordem dos campos do colunar: `inserted_date` entra **no fim**, que é o que o
próprio arquivo documenta como seguro. Nenhum índice existente se desloca.
