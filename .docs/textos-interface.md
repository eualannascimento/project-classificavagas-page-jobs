# Textos da interface — Eu Gero Meu Currículo

Todos os textos fixos da interface, sem incluir o conteúdo dos modelos de currículo
nem os dados de exemplo dos personagens. Organizados por tela e na ordem em que
aparecem no site.

> O arquivo de origem aparece entre parênteses para facilitar a aplicação no código.

---

## 1. Barra de navegação — `index.html`

- Logo: **Currículo**
- Subtítulo do logo: **por ClassificaVagas**
- Indicador de salvamento automático: **Rascunho salvo**
- Texto do indicador durante o salvamento: **Salvo** (`app.js`)

---

## 2. Home (`/`) — `index.html`

### Introdução
- Selo: **Gratuito · Sem cadastro · Feito no seu navegador**
- Título: **Seu currículo pronto, sem complicação.**
- Subtítulo: **Preencha um campo de cada vez, com orientações simples. Experiências formais, informais, voluntárias ou de primeiro emprego também contam.**

### Cartão 1 — Criar do zero
- Selo: **Começar do zero**
- Título: **Criar meu currículo**
- Descrição: **Siga um passo a passo simples, com orientações claras em cada etapa.**
- Botão: **Começar agora**

### Cartão 2 — Continuar rascunho
- Selo: **Já tenho um rascunho**
- Título: **Continuar de onde parei**
- Descrição: **Carregue um rascunho salvo e continue a edição. Seus dados permanecem no seu dispositivo.**
- Botão: **Carregar rascunho (.json)**

### Rodapé — “Como funciona?”
- Gatilho: **Como funciona?**
- Passo 1: **01 · Preencha com orientações.** Cada campo oferece uma dica e ajuda você a melhorar o texto.
- Passo 2: **02 · Acompanhe em tempo real.** O currículo é atualizado ao lado enquanto você preenche.
- Passo 3: **03 · Escolha o visual.** Compare os modelos, ajuste margens e espaçamento e exporte o currículo.
- Privacidade: **Privacidade** — Seus dados não são enviados a servidores.

### Link de acessibilidade
- **Pular para o conteúdo**

---

## 3. Seleção de personagem (`/characters`) — `index.html` + `characters.js`

- Eyebrow: **Antes de começar**
- Título: **Escolha um ponto de partida**
- Subtítulo: **Use um exemplo pronto para entender a estrutura ou comece com uma página em branco. Você poderá editar tudo depois.**

### Cartões de personagem

Cada cartão mostra: iniciais, selo (`tagline`), nome (`name`), papel (`role`) e botão **Escolher →**.

| id | iniciais | selo (tagline) | nome | papel (role) |
|---|---|---|---|---|
| blank | + | Página em branco | Em branco | Crie seu currículo do zero |
| sherlock | SH | Exemplo pronto | Sherlock Holmes | Investigação e análise de dados |
| mulan | HM | Exemplo pronto | Hua Mulan | Liderança e operações de equipe |
| hercules | HC | Exemplo pronto | Hércules | Projetos críticos sob pressão |
| chapeuzinho | CV | Exemplo pronto | Chapeuzinho Vermelho | Logística e atendimento ao cliente |

### Toasts ao escolher (`app.js`)
- Com exemplo: **Exemplo de {nome do personagem} carregado. Agora, personalize com suas informações.**
- Em branco: **Página em branco pronta. Comece a montar seu currículo.**

---

## 4. Configuração inicial (`/start`) — `index.html`

### Coluna esquerda
- Eyebrow: **Antes de começar**
- Título: **Prepare seu currículo do seu jeito**
- Subtítulo: **Escolha um modelo e selecione as seções que deseja incluir. Você poderá alterar tudo depois sem perder seus dados.**
- Rótulo da checklist: **Seções do currículo**
- Nota de rodapé: **Ainda não tem experiência formal? Sem problema. Desmarque Experiência ou Formação e adicione essas seções quando quiser.**
- Botão: **Começar a preencher**
- Botão: **← Voltar**

### Checklist de seções (`app.js`)
- Seção sempre incluída: **Sempre incluída**
- Seção opcional: **Opcional**

### Coluna direita — Prévia
- Rótulo: **Prévia**
- Nome do modelo atual: **{nome do modelo}**
- Contador: **{n} de {total}**
- Seta anterior — `aria-label`: **Modelo anterior**
- Próxima seta — `aria-label`: **Próximo modelo**

---

## 5. Formulário passo a passo (`/wizard`) — `index.html` + `app.js`

### Cabeçalho
- Botão: **← Voltar à configuração**
- Título da etapa: **{nome curto da seção}**
- Contador: **Etapa {n} de {total}**
- Descrição da etapa: texto definido na configuração da seção

### Coluna direita — Prévia ao vivo
- Rótulo: **Prévia ao vivo**
- Seta anterior — `aria-label`: **Modelo anterior**
- Próxima seta — `aria-label`: **Próximo modelo**
- Botão mobile: **Ampliar prévia**

### Ações por etapa
- Botão: **Precisa de ideias? Peça ajuda a uma IA →**
- Botão: **Limpar esta seção**
- Botão para seções opcionais: **Remover esta seção**

### Barra inferior fixa
- Botão: **Anterior**
- Na primeira etapa: **Configuração**
- Botão: **Próximo**
- Na última etapa: **Revisar →**
- Botão: **Concluir ✓**
- Título auxiliar: **Ir direto para a revisão**
- Progresso: **{n}% preenchido**

### Dicas de qualidade nos campos de texto (`app.js` — `textQuality`)
- Vazio: **Dica: comece com um verbo de ação, como “Vendi”, “Organizei” ou “Atendi”.**
- Curto: **Continue: explique o que você fez e qual foi o resultado.**
- Sem verbo nem número: **Comece a frase com um verbo de ação.**
- Somente com número: **Bom começo. Inclua um verbo de ação para destacar sua participação.**
- Somente com verbo: **Bom começo. Inclua um número ou resultado concreto, se possível.**
- Verbo + número: **Ótimo! O texto apresenta uma ação e um resultado concreto.**
- E-mail com formato estranho: **Este e-mail parece incompleto. Confira o “@” e o domínio.**

### Campo de habilidades (`app.js`)
- Placeholder: **Ex.: Atendimento ao cliente…**
- Rótulo: **Sugestões: clique para adicionar**
- Sugestões fixas: **Trabalho em equipe · Comunicação · Atendimento ao cliente · Organização · Pacote Office · Proatividade · Resolução de problemas · Liderança · Pontualidade · Vendas**

### Data — mês e ano (`app.js`)
- Opção vazia do mês: **Mês**
- Opção vazia do ano: **Ano**
- Checkbox: **Até hoje**
- Meses abreviados: **Jan, Fev, Mar, Abr, Mai, Jun, Jul, Ago, Set, Out, Nov, Dez**

### Listas de itens (`app.js`)
- Botão genérico: **+ Adicionar {tipo}**
- Tipos: **Experiência, Formação, Idioma, Certificação, Projeto**
- Numeração do cartão: **{Tipo} 01**, **{Tipo} 02**...
- Botão: **Remover**
- Botão compacto de idiomas: **×**
- Título e `aria-label`: **Remover idioma**
- Aba de item — `aria-label`: **{Tipo} {n}**
- Botão de nova aba — `title`: **Adicionar {tipo}**

### Toasts do formulário
- Ao limpar uma seção: **Seção “{nome curto}” limpa.**
- Ao remover uma seção: **Seção “{nome curto}” removida do currículo.**
- Ao remover um item: **Item removido.**
- Ação do toast: **Desfazer**
- Ao desfazer: **Item restaurado.**
- Erro de validação: **Revise os campos destacados antes de continuar.**
- Ao trocar de modelo: **Modelo alterado para {nome do modelo}.**

### Menu mobile (`index.html`)
- Título: **Opções**
- Botão: **Trocar modelo**
- Botão: **Salvar rascunho**
- Botão: **Carregar rascunho**
- Botão: **Pedir ajuda à IA**

---

## 6. Revisão (`/review`) — `index.html` + `app.js`

- Eyebrow: **Revisão**
- Título: **Quase pronto: revise e escolha o visual**

### Painel de qualidade geral (`app.js` — `renderReview`)
- Rótulo do selo: **Qualidade geral**
- Abaixo de 55%: **Em progresso** — *Alguns ajustes podem deixar seu currículo mais completo.*
- De 55% a 79%: **Bom** — *Seu currículo está bem estruturado. Pequenos ajustes podem fortalecê-lo.*
- A partir de 80%: **Ótimo** — *Seu currículo está claro e bem estruturado. Pronto para enviar.*
- Rótulo da lista: **Seção por seção**
- Selos por seção: **Ótimo** / **Bom** / **Revisar** / **Vazio**

### Galeria de modelos
- Instrução: **Escolha um modelo. Use as setas para ver as opções.**
- Seta anterior — `aria-label`: **Modelo anterior**
- Próxima seta — `aria-label`: **Próximo modelo**
- Nome e contador: **{nome do modelo} · {n} de {total}**
- Selo compatível: **ATS**
- Selo de atenção: **Atenção ao ATS**

### Ações finais
- Botão: **Voltar a editar**
- Botão: **Salvar rascunho (.json)**
- Botão: **Ver guia do LinkedIn**
- Botão: **Baixar currículo em PDF**

### Ao exportar PDF (`app.js` — `printCv`)
- Toast: **Na janela de impressão, selecione “Salvar como PDF”.**

### Ao salvar rascunho
- Toast: **Rascunho salvo em arquivo.**

### Ao importar rascunho
- Erro de extensão: **Selecione um arquivo .json válido.**
- Sucesso: **Rascunho carregado com sucesso.**
- Arquivo corrompido: **O arquivo está corrompido ou é inválido. Tente outro arquivo.**
- Formato não reconhecido: **Arquivo inválido: formato não reconhecido.**
- Dados pessoais ausentes: **Arquivo inválido: dados pessoais ausentes.**
- Versão incorreta: **Arquivo inválido: versão incompatível.**

---

## 7. Seções do currículo — `config.js`

### 7.1 Dados pessoais
- Descrição: **Comece pelas informações que os recrutadores usarão para entrar em contato.**
- **Nome completo** — placeholder: *Ex.: Cida Boaventura* — dica: *Informe seu nome completo como deseja que ele apareça no currículo.*
- **Cargo ou área desejada** — placeholder: *Ex.: Auxiliar administrativo* — dica: *Informe o cargo ou a área em que deseja trabalhar.*
- **E-mail** — placeholder: *voce@email.com* — dica: *Use um endereço de e-mail que você acessa com frequência.*
- **Telefone** — placeholder: *(11) 90000-0000* — dica: *Inclua o DDD e, de preferência, um número com WhatsApp.*
- **Cidade** — placeholder: *Cidade, UF* — dica: *Informe a cidade e o estado onde você mora. Ex.: Guarulhos, SP.*
- **LinkedIn (opcional)** — placeholder: *linkedin.com/in/voce* — dica: *Informe o endereço do seu perfil, caso tenha um.*

### 7.2 Resumo
- Descrição: **Apresente, em duas ou três frases, seu perfil e seus principais pontos fortes. Experiências do dia a dia também contam.**
- **Um parágrafo curto sobre você** — placeholder: *Ex.: Pessoa comunicativa e organizada, com experiência em vendas e atendimento ao público. Busco minha primeira oportunidade com carteira assinada.* — dica: *Escreva de duas a três frases sobre seu perfil, suas habilidades e o que você busca.*

### 7.3 Experiência
- Descrição: **Descreva suas principais atividades e resultados. Trabalhos informais, autônomos e voluntários também contam.**
- **Cargo ou função** — placeholder: *Ex.: Vendedora autônoma* — dica: *Informe o nome da função exercida. Trabalhos informais ou autônomos também podem ser incluídos.*
- **Onde** — placeholder: *Ex.: Doces da Cida* — dica: *Informe o local, a empresa, o projeto ou escreva “Autônomo”.*
- **Período** — placeholder: *Ex.: 2019 – atual* — dica: *Informe o início e o fim da atividade. Ex.: 2019 – atual.*
- **O que você fez e conquistou** — placeholder: *Ex.: Vendi doces caseiros e atendi mais de 200 clientes recorrentes.* — dica: *Comece com um verbo de ação e inclua números ou resultados, quando possível.*

### 7.4 Formação
- Descrição: **Inclua ensino médio, cursos técnicos, graduações, cursos livres ou oficinas, começando pelo mais recente.**
- **Curso ou formação** — placeholder: *Ex.: Ensino médio completo* — dica: *Inclua sua formação escolar, técnica, acadêmica ou cursos relevantes.*
- **Instituição** — placeholder: *Ex.: EE Prof. João Ramos* — dica: *Informe a escola, faculdade, plataforma ou instituição responsável.*
- **Período** — placeholder: *Ex.: 2018* — dica: *Informe o ano de conclusão ou o período cursado.*

### 7.5 Habilidades
- Descrição: **Liste habilidades técnicas e comportamentais relevantes para o trabalho que você busca.**
- **Digite uma habilidade e pressione Enter** — placeholder: *Ex.: Atendimento ao cliente…* — dica: *Combine conhecimentos técnicos, como Excel, com habilidades comportamentais, como trabalho em equipe.*

### 7.6 Idiomas
- Descrição: **Informe os idiomas que você conhece e o nível de domínio de cada um.**
- **Idioma** — placeholder: *Ex.: Inglês* — dica: *Inclua os idiomas que você conhece, mesmo em nível básico.*
- **Nível** — opções: **Básico, Intermediário, Avançado, Fluente, Nativo**

### 7.7 Certificações
- Descrição: **Inclua cursos livres, certificações e treinamentos concluídos. Cursos online ou oferecidos por instituições públicas também contam.**
- **Nome do curso ou certificação** — placeholder: *Ex.: Informática básica* — dica: *Informe o nome do curso, treinamento ou certificação concluída.*
- **Instituição** — placeholder: *Ex.: Fundação Bradesco* — dica: *Informe a instituição ou plataforma responsável pela emissão.*
- **Ano** — placeholder: *Ex.: 2023* — dica: *Informe o ano de conclusão.*

### 7.8 Projetos
- Descrição: **Inclua projetos da escola, da comunidade, do trabalho ou desenvolvidos por iniciativa própria.**
- **Nome do projeto** — placeholder: *Ex.: Feira de empreendedorismo* — dica: *Informe o nome de um trabalho, projeto ou iniciativa relevante.*
- **O que você fez** — placeholder: *Ex.: Organizei a barraca de doces com dois colegas e cuidei do caixa, gerando R$ 300 de lucro.* — dica: *Explique sua participação e o resultado. Comece com um verbo de ação e inclua números, quando possível.*
- **Link (opcional)** — placeholder: *Ex.: instagram.com/seuprojeto* — dica: *Adicione um link para o projeto, caso ele esteja disponível online.*

### 7.9 Nota abaixo da checklist
- **Ainda não tem experiência formal? Sem problema. Desmarque Experiência ou Formação e adicione essas seções quando quiser.**

---

## 8. Controles de página — `app.js`

- Rótulo: **Margens**
- Opções: **Estreitas, Padrão, Confortáveis**
- Rótulo: **Espaçamento**
- Opções: **Normal, Condensado**

---

## 9. Catálogo de modelos — `config.js`

| Modelo | Descrição |
|---|---|
| Clássico | Visual monocromático, limpo e profissional |
| Minimalista | Alinhamento à esquerda e visual essencial |
| Serifado | Tipografia serifada de estilo tradicional |
| Elegante | Conteúdo centralizado, com tipografia leve e espaçada |
| Linha | Títulos destacados por linhas finas e visual minimalista |
| Pilar | Títulos com barra lateral de destaque |
| Grafite | Alinhamento à esquerda, tons de grafite e títulos marcantes |
| Esmeralda | Conteúdo centralizado com detalhes em verde-esmeralda |
| Petróleo | Barra lateral em azul-petróleo |
| Marinho | Faixa superior em azul-marinho |
| Bordô | Conteúdo centralizado, com tom bordô e tipografia serifada |
| Âmbar | Alinhamento à esquerda e detalhes em âmbar |
| Oliva | Barra lateral em verde-oliva |
| Moderno | Barra lateral clara com detalhes em azul |
| Executivo | Faixa superior escura e visual formal |
| Carvão | Faixa superior em preto-carvão |
| Faixa Clara | Faixa superior suave em azul-claro |
| Violeta | Conteúdo centralizado com detalhes em violeta |
| Criativo | Coluna única com selo de iniciais |
| Rosado | Selo de iniciais em tom rosé, indicado para portfólios |

### Selos e avisos de ATS
- Compatível: **Compatível com ATS**
- Não ideal: **Atenção ao ATS**
- Modelos com barra lateral: **Alguns sistemas ATS interpretam melhor currículos em coluna única.**
- Modelos com selo: **Para sistemas ATS mais rigorosos, prefira um modelo sem elementos gráficos no topo.**
- Nota no modal para modelos amigáveis: **Compatível com ATS**

> Recomenda-se revisar a configuração do modelo **Marinho**. Se ele utiliza apenas uma faixa superior e mantém o conteúdo em coluna única, pode continuar marcado como compatível com ATS.

### Modal de troca de modelo
- Título: **Trocar modelo**

---

## 10. Guia do LinkedIn (`/guide`) — `index.html` + `linkedin-guide.js`

- Eyebrow: **Depois do currículo**
- Título: **Leve o mesmo cuidado ao LinkedIn**
- Subtítulo: **Muitos recrutadores consultam o LinkedIn durante o processo seletivo. Use estas sugestões para manter seu perfil alinhado ao currículo.**
- Botão: **← Voltar à revisão**
- Botão: **Traduzir para o inglês com IA**

### Cartões do guia

Cada cartão tem número, título, botão **Copiar**, rótulo **Onde** e rótulo **Dica**.

1. **Foto e capa**
   - Onde: *Seu perfil → toque na foto → Adicionar foto*
   - Dica: *Use uma foto de rosto, com fundo neutro e boa iluminação. Na capa, escolha uma imagem simples relacionada à sua área.*
2. **Título do perfil**
   - Onde: *Seu perfil → lápis (✎) no topo → campo “Título”*
   - Dica: *Além do cargo, informe sua área de atuação ou o tipo de oportunidade que busca.*
3. **Sobre**
   - Onde: *Seu perfil → seção “Sobre” → lápis (✎)*
   - Dica: *Escreva em primeira pessoa e explique brevemente sua experiência, seus pontos fortes e o que busca.*
4. **Experiência**
   - Onde: *Seu perfil → seção “Experiência” → botão + → Adicionar cargo*
   - Dica: *Aproveite o espaço para detalhar atividades, resultados e aprendizados relevantes.*
5. **Formação**
   - Onde: *Seu perfil → seção “Formação acadêmica” → botão +*
   - Dica: *Inclua também cursos técnicos e outras formações relevantes.*
6. **Competências**
   - Onde: *Seu perfil → seção “Competências” → botão +*
   - Dica: *Destaque as três competências mais importantes e solicite validações a pessoas que conhecem seu trabalho.*
7. **Idiomas**
   - Onde: *Seu perfil → “Adicionar seção do perfil” → Idiomas*
   - Dica: *Informe seu nível com precisão, pois ele poderá ser avaliado durante o processo seletivo.*
8. **URL personalizada**
   - Onde: *Seu perfil → “Editar perfil público e URL”*
   - Dica: *Uma URL curta e personalizada facilita a leitura e fica melhor no currículo.*
9. **Recomendações**
   - Onde: *Perfil de um contato → botão “Mais” → Solicitar recomendação*
   - Dica: *Peça uma recomendação a professores, colegas, clientes ou antigos gestores que conheçam seu trabalho.*

### Feedback de cópia
- **Copiado.**

---

## 11. Modal: ajuda de uma IA — `index.html` + `prompts.js`

- Título: **Peça ajuda a uma IA**
- Aviso: **Esta ferramenta não possui IA integrada e não envia seus dados. Copie o texto abaixo e cole na ferramenta de IA que preferir, como ChatGPT, Claude, Gemini ou Copilot.**
- Checkbox: **Incluir meus dados no prompt**
- Aviso de privacidade: **Atenção: o prompt incluirá dados pessoais, como e-mail e telefone. Use apenas ferramentas de IA em que você confia.**
- Botão: **Copiar prompt**

### Toasts
- Sucesso: **Prompt copiado.**
- Falha: **Não foi possível copiar. Selecione o texto e copie manualmente.**

### Textos-base dos prompts (`prompts.js`)

#### Introdução geral

> Atue como especialista em recrutamento e otimização de currículos para o mercado brasileiro.
>
> Ajude a revisar e melhorar meu currículo e meu perfil no LinkedIn.
>
> Siga estas orientações:
> - use verbos de ação em português;
> - inclua resultados mensuráveis sempre que houver informações suficientes;
> - escreva de forma clara, concisa e profissional;
> - adapte o conteúdo ao cargo desejado;
> - organize a resposta pelas seções do currículo;
> - não invente experiências, resultados ou qualificações.

#### Introdução de tradução

> Traduza meu currículo do português para um inglês profissional e natural.
>
> Mantenha a organização por seções, adapte corretamente os termos técnicos e preserve os nomes de empresas e instituições.
>
> Use verbos de ação adequados ao contexto e não acrescente informações que não estejam no texto original.
>
> Apresente a tradução seção por seção.

#### Instruções por seção

- Dados pessoais: *Revise meus dados pessoais para o currículo e o LinkedIn. Sugira um título profissional claro, uma apresentação adequada dos contatos e melhorias para a URL do LinkedIn.*
- Resumo: *Ajude a escrever um resumo profissional curto, com duas ou três frases, destacando experiência, habilidades, objetivo e proposta de valor. Não invente informações.*
- Experiência: *Ajude a melhorar as descrições das minhas experiências. Use verbos de ação, destaque responsabilidades e inclua resultados mensuráveis apenas quando houver dados suficientes.*
- Formação: *Ajude a organizar minha formação acadêmica, incluindo curso, instituição, período e informações relevantes já fornecidas.*
- Habilidades: *Sugira habilidades técnicas e comportamentais coerentes com meu perfil e com o cargo desejado. Separe sugestões confirmadas das que precisam ser validadas por mim.*
- Idiomas: *Ajude a apresentar meus idiomas e níveis de proficiência de forma clara e adequada ao currículo e ao LinkedIn.*
- Certificações: *Ajude a organizar minhas certificações e cursos, com nome, instituição e ano de conclusão.*
- Projetos: *Ajude a descrever meus projetos, destacando objetivo, participação, tecnologias e resultados já informados.*

#### Frase-guia para prompts de seção

> Estou preenchendo a seção “{nome da seção}” do meu currículo.
>
> {instrução da seção}
>
> Revise o conteúdo para deixá-lo claro, curto e profissional. Use verbos de ação e destaque resultados quando houver dados suficientes. Não invente informações. Caso falte algo importante, faça perguntas objetivas antes de sugerir a versão final. Apresente textos prontos para copiar e colar.

---

## 12. Prévia mobile — `index.html`

- Botão flutuante: **Ver prévia**
- Título do overlay: **Prévia do currículo**
- Fechar — `aria-label`: **Fechar prévia**

---

## 13. Toasts gerais — `app.js`

- Ao trocar de modelo: **Modelo alterado para {nome}.**
- Ao salvar automaticamente: **Salvo**
- Erros diversos: usar mensagens específicas, diretas e orientadas à correção do problema.

---

## 14. Acessibilidade e rótulos técnicos

- **Pular para o conteúdo**
- **Fechar**
- **Fechar prévia**
- **Modelo anterior**
- **Próximo modelo**
- **Ver prévia do currículo**
- **Prévia do currículo**
- **Etapa {n}: {nome da seção}**
- **Ver dica do campo**
- **Remover {nome da habilidade}**
