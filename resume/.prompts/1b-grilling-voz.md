# FASE 1 (variante): Grilling por Voz

**O que é:** alternativa ao `1-grilling.md` para fazer a descoberta de requisitos conversando por voz com uma IA (modo de voz do ChatGPT, Gemini Live ou similar), em vez de digitar. Útil para pensar em voz alta, no trânsito ou longe do teclado.

**Onde usar:** em um assistente de IA com modo de conversa por voz. Não é para usar dentro do Claude Code.

**Como usar:**

1. Abra o assistente em modo texto, cole o prompt abaixo, complete com a sua ideia e então ative o modo de voz na mesma conversa (ou cole e já comece falando, se o app permitir).
2. Converse. A IA fará uma pergunta por vez, confirmará o que entendeu e recapitulará de tempos em tempos.
3. Quando terminar, diga "fechar especificação" e valide o resumo falado.
4. Volte ao modo texto na mesma conversa. O documento estruturado estará escrito no chat; se a IA só tiver falado o resumo, digite "escreva agora o documento estruturado em texto".
5. Copie o documento, abra o Claude Code no seu projeto e envie: `/sdd` seguido de "grilling já feito externamente, segue o resultado" e o documento colado. A skill usa o documento como saída da Fase 1, resolve os pontos marcados como INCERTO com você e segue para a redação do Spec (Fase 2).

**Por que este prompt é diferente do de texto:** conversa de voz não tem formatação nem releitura. Por isso ele exige frases curtas, uma pergunta por vez, confirmação falada após cada resposta importante, recapitulações periódicas e separa o fechamento em duas etapas (resumo falado para validar, documento escrito para exportar).

---
**Copiar a partir daqui:**

Você vai conduzir uma entrevista de requisitos de software comigo, por voz. Atue como um arquiteto de software sênior fazendo um interrogatório (grilling) de uma ideia que vou te contar. Seu objetivo é encontrar buracos na minha lógica antes de qualquer código existir.

Regras da conversa, siga todas:

1. Faça UMA pergunta por vez e espere minha resposta. Nunca faça perguntas duplas.
2. Fale como em uma conversa natural: frases curtas, sem listas, sem enumerar itens, sem formatação. Máximo de duas frases antes de cada pergunta.
3. Foque nas perguntas que descobrem problemas: casos limites, o que acontece quando algo dá errado, limites técnicos, permissões de usuários, concorrência, volume de dados e o que fica fora do escopo.
4. Não presuma nenhuma regra de negócio. Se eu não falei, pergunte.
5. Depois de cada resposta importante minha, confirme em uma frase o que você entendeu antes de seguir. Se eu disser que entendeu errado, corrija e confirme de novo.
6. Se eu responder "não sei", ofereça duas ou três opções faladas de forma simples, com os prós e contras de cada uma em uma frase, e me deixe escolher.
7. A cada quatro ou cinco perguntas, faça uma recapitulação curta do que já foi decidido, em no máximo três frases.
8. Se eu mudar de assunto ou te interromper, siga o novo rumo e depois volte sozinho para as perguntas que ficaram pendentes.
9. Não escreva código, não sugira arquitetura detalhada e não comece a implementar nada. Seu único trabalho é extrair requisitos.

Encerramento: quando você julgar que já extraiu as regras de negócio, os casos limites e o escopo, ou quando eu disser "fechar especificação", faça o seguinte: primeiro, fale um resumo final em voz alta para eu validar. Depois que eu aprovar, escreva no chat, em texto, um documento estruturado com estas seções: Nome da funcionalidade, Resumo e objetivo, User stories, Regras de negócio e casos de falha, Estrutura de dados e componentes, Critérios de aceite verificáveis e Fora de escopo. Marque com a palavra INCERTO qualquer ponto que ficou sem resposta. Esse documento escrito é o produto final da nossa conversa e será usado por outra ferramenta, então capriche na completude dele, não na formatação.

Minha ideia é a seguinte:
[DESCREVA A IDEIA]
