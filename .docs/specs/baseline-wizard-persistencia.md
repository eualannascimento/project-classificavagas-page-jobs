# Wizard & Persistência

**Status:** Concluído  
**Data:** 2026-07-13

## 1. Resumo e Objetivo

Este domínio é responsável pela navegação em etapas do formulário de preenchimento do currículo (Wizard), validação inline dos dados inseridos pelo usuário e persistência automática local para garantir resiliência e privacidade absoluta dos dados.

## 2. User Stories (Requisitos Funcionais)

- **US01:** Como candidato a emprego, quero preencher meu currículo em etapas organizadas (Wizard), para não me sentir sobrecarregado com um formulário longo de uma vez só.
- **US02:** Como candidato, quero que a plataforma funcione completamente no navegador sem depender de servidor, para ter garantia de que meus dados nunca saem do meu dispositivo.
- **US03:** Como candidato, quero que meu progresso seja salvo automaticamente no meu navegador, para poder fechar a aba e continuar depois de onde parei.
- **US04:** Como candidato, quero poder baixar meus dados inseridos em formato JSON e carregá-los de volta, para manter backups ou preencher em dispositivos diferentes.

## 3. Regras de Negócio e Casos de Falha (Edge Cases)

- **Regra 01 (Validação de E-mail):** O e-mail deve respeitar o formato `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i`. Se estiver incorreto, retorna a mensagem `'Formato de e-mail invalido.'` ([js/validation.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/validation.js#L7-L19)).
- **Regra 02 (Validação de URL):** A URL é opcional, mas se informada, deve começar com `http://` ou `https://` e ser passível de instanciação na classe nativa `URL`. Caso contrário, retorna erro de validação ([js/validation.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/validation.js#L8-L31)).
- **Regra 03 (Seções Obrigatórias):** A seção `personal` (Dados Pessoais) é obrigatória e sempre ativa. Mesmo se o estado recuperado tentar omiti-la, ela é forçada na normalização ([js/config.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/config.js#L15) e [js/config.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/config.js#L281-L284)).
- **Regra 04 (Auto-save no LocalStorage):** Cada alteração de input ou troca de rota invoca a gravação do estado JSON no `localStorage` usando a chave `'eugero-curriculo-state'` ([js/storage.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/storage.js#L7-L15)).
- **Regra 05 (Validação de Importação):** O JSON carregado deve conter as chaves estruturais `personal` de tipo objeto. Se faltar ou se o conteúdo for corrompido, o carregamento é rejeitado com um alerta descritivo ([js/storage.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/storage.js#L56-L70)).
- **Regra 06 (Habilidades):** Ao digitar habilidades, o separador aceito para criar novos itens na listagem interna é ponto e vírgula `;` ou vírgula `,` ([js/config.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/config.js#L262-L265)).
- **Regra 07 (Hash Routing):** A navegação é orientada pelas hashes `#/`, `#/start`, `#/wizard/<sectionId>`, `#/review`, `#/guide`. Se o hash for inválido ou ausente, a aplicação redireciona para a home (`#/`) ([js/router.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/router.js#L7-L25)).

## 4. Estrutura de Dados e Componentes

### Componentes / Scripts:
- **[router.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/router.js):** Gerencia mudanças de hash e histórico do navegador.
- **[storage.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/storage.js):** Comunica-se com o `localStorage` e gerencia upload/download de JSON.
- **[validation.js](file:///Users/eualannascimento/Development/projeto-eu-gero-meu-curriculo/js/validation.js):** Validações estruturadas de campos e seções.

### Modelo do Estado em Memória (`state`):
```javascript
{
  version: '1.0.0',
  template: 'classic',
  currentStep: 0,
  enabledSections: ['personal', 'summary', 'experiences', 'education', 'skills'],
  personal: { fullName: '', headline: '', email: '', phone: '', location: '', linkedinUrl: '' },
  summary: '',
  skillsText: '',
  experiences: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
  projects: [],
  volunteering: [],
  publications: [],
  awards: [],
  organizations: [],
  courses: []
}
```

## 5. Critérios de Aceite (verificáveis por teste)

- **[ ] CA01:** Dado um endereço de e-mail inválido, quando validado, deve retornar `ok: false` com a mensagem correspondente.
- **[ ] CA02:** Dado um JSON de importação sem a estrutura de dados `personal`, quando o importador validar os dados, então deve rejeitar a importação e retornar erro.
- **[ ] CA03:** Dado o estado inicial vazio, quando uma seção opcional for ativada, o wizard deve recalcular os passos ativos sequencialmente e incluí-la.
- **[ ] CA04:** Dado um input textual de habilidades separado por vírgulas ou ponto e vírgulas, quando parseado, então deve retornar uma lista limpa de strings mapeadas.

## 6. Fora de Escopo

- Qualquer persistência na nuvem, banco de dados remoto ou API externa.
- Cadastro ou recuperação de dados com login/senha.

## 7. Dívidas e riscos observados

- **Sem sanitização profunda de JSON:** O importador valida a presença de `personal` e se a versão é string, mas não sanitiza a fundo tipos inesperados ou injeções de script no JSON importado (risco de XSS se o usuário ler dados arbitrários no preview).
- **Tratamento genérico de exceções de parsing:** O parseamento em `JSON.parse` direto no localStorage ou importador assume formato JSON perfeito e, embora envolto em try/catch, pode poluir o console ou resetar o estado em caso de falha estrutural.
