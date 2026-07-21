# Critérios de Exclusão: Sinais de Conteúdo Gerado por IA

Esta é uma lista de padrões que humanos reconhecem como "cara de IA". Ao gerar QUALQUER conteúdo neste repositório (código, comentários, documentação, commits, textos de produto, e-mails, UI), verifique cada critério abaixo, um por vez, e ELIMINE o padrão antes de entregar. Trate como um linter de estilo: qualquer ocorrência é falha.

## 1. Pontuação e tipografia

- **E01 - Travessão e meia-risca:** proibidos (em dash U+2014 e en dash U+2013). Use hífen, vírgula ou dois-pontos. Ver regra em `global.md`.
- **E02 - Aspas e apóstrofos curvos:** proibidas as aspas tipográficas curvas. Use aspas retas (" e ').
- **E03 - Reticências dramáticas:** não encerre frases com "..." para criar suspense.

## 2. Vocabulário marcado

- **E04 - Palavras-gatilho em PT-BR:** evite "crucial", "robusto", "abrangente", "mergulhar (em)", "desvendar", "impulsionar", "alavancar", "panorama", "vibrante", "multifacetado", "meticuloso", "primordial", "vale ressaltar", "é importante notar/destacar", "nesse sentido", "no cenário atual", "de forma geral". Prefira palavras concretas e diretas.
- **E05 - Palavras-gatilho em EN (código, docs, commits):** evite "delve", "leverage", "harness", "showcase", "underscore", "pivotal", "robust", "seamless", "comprehensive", "crucial", "landscape", "tapestry", "testament", "foster", "bolster", "intricate", "vibrant", "meticulous", "furthermore", "moreover", "additionally".
- **E06 - Sinônimos forçados:** não troque uma palavra por sinônimos a cada repetição só para variar. Repetir o termo certo é melhor que alternar "usuário/utilizador/cliente" no mesmo texto.

## 3. Estrutura de frase

- **E07 - Regra dos três:** não feche ideias com trincas de adjetivos, substantivos ou frases ("rápido, seguro e escalável"). Use a quantidade que o conteúdo realmente pede.
- **E08 - Paralelismo negativo:** proibido o molde "não é apenas X, é Y" / "not just X, but Y" / "mais do que X, trata-se de Y".
- **E09 - Cópulas infladas:** não substitua "é/tem" por "atua como", "se destaca como", "representa", "serve como", "marca um momento".
- **E10 - Gerúndios de falsa análise:** não encerre frases com orações em gerúndio que fingem conclusão ("...garantindo escalabilidade", "...refletindo o compromisso com qualidade").
- **E11 - Hedging excessivo:** corte "geralmente", "normalmente", "em muitos casos", "pode-se dizer que" quando a afirmação pode ser direta.

## 4. Estrutura de texto e formatação

- **E12 - Lista com cabeçalho em negrito:** evite o formato "- **Título:** descrição" em textos corridos e conteúdo final (em arquivos de regras e specs técnicas, como este, o formato é permitido por ser convenção do template).
- **E13 - Negrito decorativo:** não espalhe negrito em palavras-chave aleatórias para simular ênfase.
- **E14 - Emoji em títulos e bullets:** proibido em código, commits, docs técnicas e conteúdo profissional, salvo pedido explícito.
- **E15 - Estrutura formulaica:** não use o esqueleto introdução + 3 seções simétricas + conclusão para tudo. A estrutura deve nascer do conteúdo.
- **E16 - Title Case em títulos PT-BR:** capitalize apenas a primeira palavra e nomes próprios ("Guia de instalação", não "Guia De Instalação").

## 5. Tom e conteúdo

- **E17 - Introduções e fechos vazios:** proibido abrir com "No mundo atual...", "No cenário de X..." e fechar com "Em resumo...", "Em suma...", "O futuro é promissor", "Desafios e próximos passos".
- **E18 - Tom promocional:** não descreva nada neutro como "inovador", "revolucionário", "de ponta", "referência no mercado" sem fato que sustente.
- **E19 - Atribuição vazia:** proibido "especialistas apontam", "estudos mostram", "é amplamente reconhecido" sem citar a fonte específica.
- **E20 - Significância inflada:** não conecte um detalhe trivial a "tendências mais amplas" nem declare que algo "desempenha papel fundamental" sem necessidade.
- **E21 - Metadiscurso de assistente:** proibido "Vale a pena mencionar", "Espero que ajude", "Please note", "It's important to note", avisos de data de corte de conhecimento e qualquer frase que soe como chatbot falando com usuário.
- **E22 - Perfeição estéril:** prefira frases de tamanhos variados e escolhas de palavra específicas do domínio; texto uniforme, polido e sem opinião é o maior sinal agregado de IA.

## 6. Específicos de código

- **E23 - Comentários narradores:** proibido comentário que traduz a linha seguinte ("// incrementa o contador"). Comente apenas restrições e porquês não óbvios.
- **E24 - Docstrings infladas:** sem docstring boilerplate de 10 linhas em função trivial. Documente o contrato, não o óbvio.
- **E25 - Nomes genéricos pomposos:** evite "Manager", "Handler", "Helper", "Utils" como sufixo padrão quando existe nome de domínio melhor.

## Como aplicar

1. Gere o conteúdo normalmente.
2. Antes de entregar, percorra E01 a E25 como checklist, um critério por vez.
3. Reescreva cada ocorrência encontrada. Não anuncie a checagem; apenas entregue o texto limpo.
