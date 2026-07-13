# Integrações de Saída (Exportação & Prompts IA)

**Status:** Concluído  
**Data:** 2026-07-13

## 1. Resumo e Objetivo

Este domínio engloba todos os fluxos de saída da plataforma: a exportação de currículos para formatos padrão (PDF, Word, TXT), a geração de textos prontos para sincronização manual com o perfil LinkedIn (Guia LinkedIn) e a montagem de prompts de contexto estruturados para interação com assistentes de IA externos (ChatGPT/Claude).

## 2. User Stories (Requisitos Funcionais)

- **US01:** Como candidato, quero exportar meu currículo em PDF, para enviar a recrutadores.
- **US02:** Como candidato, quero que o PDF inclua um QR Code com a URL do meu LinkedIn, para facilitar a visita ao meu perfil.
- **US03:** Como candidato, quero exportar meu currículo em Word (.docx), para editá-lo posteriormente se necessário.
- **US04:** Como candidato, quero exportar em TXT, para colar em sistemas ATS e formulários de vagas.
- **US05:** Como candidato, quero receber um guia passo a passo com os textos prontos do currículo formatados para colar direto no perfil do LinkedIn.
- **US06:** Como candidato, quero copiar prompts de IA completos (geral, por seção ou de tradução), escolhendo incluir ou não meus dados (via checkbox), para usá-los como copilotos externos.

## 3. Regras de Negócio e Casos de Falha (Edge Cases)

- **Regra 01 (Cálculo e Renderização de PDF):** O PDF é gerado via biblioteca `jsPDF` diretamente no cliente. O design tenta espelhar as dimensões físicas da folha A4. Caso a URL do LinkedIn esteja preenchida, o rodapé do documento adiciona um QR Code correspondente gerado via `QRCode.js` ([js/export.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/export.js)).
- **Regra 02 (Importação Dinâmica do docx.js):** Para reduzir o consumo inicial de dados e manter a aplicação veloz, a biblioteca `docx.js` para exportar em Word é carregada dinamicamente sob demanda via CDN apenas no momento da primeira exportação ([js/export.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/export.js) e [js/libs.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/libs.js)).
- **Regra 03 (Fallback de Indisponibilidade de Bibliotecas):** Se as bibliotecas de PDF ou QR Code falharem no carregamento (ex: rede offline), o sistema exibe uma mensagem via toast explicativo de erro e mantém ativas as opções estáveis de exportação TXT e Word (se disponível) ([js/libs.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/libs.js)).
- **Regra 04 (Geração de Prompts de IA):** A geração de prompts suporta três categorias estruturadas ([js/prompts.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/prompts.js#L5-L35)):
  - **Geral:** Introduz instruções de boas práticas e, opcionalmente, o estado completo de dados do currículo.
  - **Seção:** Cria um prompt focado no preenchimento exclusivo daquela etapa do wizard (ex: experiências).
  - **Tradução:** Configura a IA externa para realizar tradução para o inglês preservando empresas e termos.
- **Regra 05 (Proteção de Privacidade nos Prompts):** O checkbox "Incluir meus dados no prompt" controla a injeção do estado nos prompts gerados. Se marcado como ativo, um aviso visível de privacidade é exibido ao usuário indicando que dados de contato e e-mail serão visíveis no prompt que ele irá copiar ([js/prompts.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/prompts.js#L179-L188) e [index.html](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/index.html#L190-L196)).
- **Regra 06 (Mapeamento do Guia LinkedIn):** O guia LinkedIn cria uma listagem sequencial apenas dos campos contendo conteúdo preenchido. Oferece botões individuais com a API `navigator.clipboard.writeText` para facilidade de cópia rápida sem formatações estranhas de Rich Text ([js/linkedin-guide.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/linkedin-guide.js#L11-L156)).

## 4. Estrutura de Dados e Componentes

### Componentes / Scripts:
- **[export.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/export.js):** Codificação para geração de PDF (incluindo QR Code), DOCX e TXT.
- **[prompts.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/prompts.js):** Arquivo puramente lógico contendo os templates e a injeção condicional de dados de formulário.
- **[linkedin-guide.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/linkedin-guide.js):** Manipula o DOM final do guia LinkedIn para carregar dados e bindar ações de copiar.

## 5. Critérios de Aceite (verificáveis por teste)

- **[ ] CA01:** Dado um estado com dados preenchidos e a opção "Incluir meus dados" marcada, quando o prompt geral for gerado, então o texto do prompt deve conter o nome e e-mail do usuário.
- **[ ] CA02:** Dado que o usuário desmarcou a opção "Incluir meus dados", quando qualquer prompt (geral, seção ou tradução) for gerado, então o texto resultante não deve expor e-mail ou nome pessoal.
- **[ ] CA03:** Dado um estado com a seção "Idiomas" vazia, quando o Guia LinkedIn for renderizado, então a entrada de idioma não deve aparecer no guia.

## 6. Fora de Escopo

- Enviar dados diretamente para APIs de IA (OpenAI, Anthropic) no backend (todo o fluxo é baseado em cópia e colagem manual pelo usuário).
- Hospedagem ou armazenamento de arquivos PDF gerados em servidores remotos.

## 7. Dívidas e riscos observados

- **Acoplamento forte com recursos de CDN:** A dependência direta do carregamento em runtime do CDN da Cloudflare para jsPDF/QRCode.js e jsDelivr para docx.js gera riscos de lentidão ou falha de renderização se a conexão de internet do usuário estiver instável ou sob firewalls corporativos.
- **Geração de PDF por pixel/layout absoluto:** O código em [export.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/export.js) desenha linhas e retângulos usando coordenadas de pixel fixas. Qualquer alteração ou inclusão de novos templates ou seções exige reajustes minuciosos dessas coordenadas na mão, dificultando a escalabilidade.
