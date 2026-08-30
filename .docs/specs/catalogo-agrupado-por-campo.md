# O catálogo passa a ser agrupado por campo

**Status:** Aprovado
**Data:** 2026-08-30

## O problema

O arquivo que o navegador baixa chamava-se colunar, mas guardava **uma lista
por vaga**:

```json
{"campos": ["company","title","url", ...],
 "vagas": [["ADP","ANALISTA","https://...", ...], ["ADP","GERENTE","https://...", ...]]}
```

O cabeçalho aparece uma vez só, o que já era ganho sobre repetir as chaves em
213 mil objetos. Mas os valores de campos diferentes ficam intercalados, e o
gzip comprime melhor o que se parece **e está perto**.

## O que custa o quê

Medido no catálogo publicado em 2026-08-30, 211.209 vagas, 8.039.994 bytes no
gzip:

| campo | distintos | gz | % do total |
| --- | --- | --- | --- |
| url | 211.209 | 2.576.365 | 32,0% |
| title | 155.968 | 1.880.861 | 23,4% |
| location | 25.838 | 676.529 | 8,4% |
| location_city | 6.378 | 366.400 | 4,6% |
| level | 23 | 154.034 | 1,9% |
| location_country | 181 | 148.572 | 1,8% |
| category | 18 | 131.353 | 1,6% |
| published_date | 1.460 | 116.660 | 1,5% |
| os outros oito | — | 169.585 | 2,1% |

`url` e `title` sozinhos são 55%. O restante são campos de baixa cardinalidade
repetidos 211 mil vezes.

## As duas mudanças

### Agrupar por campo

```json
{"campos": [...], "colunas": [[todas as empresas], [todos os títulos], ...]}
```

Só reordenar o mesmo dado: **-22,5%**.

### Dicionário onde compensa

Campo com poucos valores distintos vira `{"dic": [...], "idx": [...]}`. O
limite é 50% de valores distintos sobre linhas; acima disso o índice custa mais
que o texto repetido.

Quatorze dos dezesseis campos entram. `title` e `url` ficam literais, porque
quase todo valor é único.

Mais **-6%**.

### `temporary?` sai

Nenhuma linha do site lê esse campo. Sai do cabeçalho.

## Resultado

Medido sobre as mesmas 213.077 vagas:

| | antes | depois |
| --- | --- | --- |
| `catalog.json` | 73,2 MB | **36,6 MB** |
| `catalog.json.gz` | 8,10 MB | **5,78 MB** |

**-28,6% no que trafega e -50% no que o navegador precisa manter em memória
durante o parse**, sem perder um único dado.

## Compatibilidade

O leitor aceita **três** formatos, e isso não é excesso de zelo:

1. `{campos, colunas}` — o de hoje.
2. `{campos, vagas}` — o anterior. O service worker serve o catálogo por
   *stale-while-revalidate*, então na primeira navegação depois de um deploy o
   JS novo encontra a cópia antiga em cache. Sem esse caminho, a visita seguinte
   a cada publicação ficaria sem catálogo.
3. Array de objetos — `recent_jobs.json`, que segue como está por ser pequeno,
   e o `open_jobs.json` do fallback.

## O que não foi feito

**URL por prefixo comum.** URLs da mesma empresa compartilham prefixos longos.
Medido: mais 227 KB (2,8%). Ficou fora porque exige reconstruir 211 mil URLs no
cliente por um ganho pequeno perto do risco.

**Remover `location`.** Renderia mais 528 KB (6,6%) e o campo não aparece em
nenhum cartão. Mas ele **é** lido: entra no texto de busca em `getSearchText`,
ao lado de `location_city` e `location_state`. Como `location_country` não está
lá, remover `location` deixaria de casar busca por nome de país. É decisão de
produto, não de formato, e fica registrada aqui para quando for tomada.

## Verificação

* Equivalência campo a campo entre o colunar e `open_jobs.json` nas 5.000
  primeiras vagas, todos os 16 campos.
* Carga real no navegador: 213.077 vagas, cartões com título, empresa,
  localização e data corretos.
* O passo de verificação do deploy passa a expandir os dicionários antes de
  comparar contagem e tamanho das colunas.
