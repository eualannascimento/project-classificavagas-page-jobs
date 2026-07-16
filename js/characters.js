/**
 * Personagens de exemplo para a tela de seleção (estilo "escolha seu personagem").
 * Figuras de domínio público, com contatos reservados para exemplo
 * (@exemplo.com.br e telefones de preenchimento) - risco zero.
 */
const EuGeroCharacters = (function () {
  'use strict';

  const SHERLOCK = {
    version: '1.0.0',
    template: 'executive',
    margin: 'padrao',
    density: 'condensado',
    currentStep: 0,
    enabledSections: ['personal', 'summary', 'experiences', 'education', 'skills', 'languages'],
    personal: {
      fullName: 'Sherlock Holmes',
      headline: 'Especialista em Inteligência Investigativa | Analista de Dados Complexos',
      email: 'sherlock.holmes@exemplo.com.br',
      phone: '(11) 99999-0001',
      location: 'Londres, Reino Unido',
      linkedinUrl: 'linkedin.com/in/sholmes-deduction'
    },
    summary: 'Profissional sênior com vasta experiência em inteligência analítica, resolução de problemas complexos e reconhecimento de padrões. Especialista em cruzar grandes volumes de dados (evidências) para gerar insights precisos e acionáveis. Histórico comprovado de redução de tempo na resolução de incidentes críticos em parceria com o setor público.',
    skillsText: 'Pensamento Crítico; Análise Preditiva; Resolução de Problemas; Investigação de Fraudes; Atenção a Detalhes; Comunicação Estratégica',
    experiences: [
      {
        company: 'Prática Privada (221B Baker St.)',
        title: 'Consultor Investigativo Sênior',
        period: '1881 - Presente',
        startDate: '', endDate: '', endCurrent: true,
        description: 'Desenvolveu e implementou metodologias de dedução lógica que aumentaram a taxa de elucidação de casos em 95%. Liderou a investigação independente de mais de 100 incidentes de alta complexidade, elaborando relatórios técnicos detalhados para tomada de decisão.'
      },
      {
        company: 'Scotland Yard',
        title: 'Consultor Técnico Especialista',
        period: '1881 - Presente',
        startDate: '', endDate: '', endCurrent: true,
        description: 'Presta consultoria técnica sob demanda para diretores e inspetores. Otimizou processos de análise de cenas, reduzindo o tempo de triagem inicial de evidências pela metade através de protocolos inovadores.'
      }
    ],
    education: [
      {
        institution: 'Universidade de Oxford (Christ Church)',
        degree: 'Especialização em Química Forense e Metodologias Analíticas',
        period: '1870 - 1874',
        startDate: '', endDate: '', endCurrent: false
      }
    ],
    skills: [
      { name: 'Análise de Dados Complexos' },
      { name: 'Reconhecimento de Padrões' },
      { name: 'Gestão de Crises' },
      { name: 'Criminologia Aplicada' },
      { name: 'Engenharia Social' },
      { name: 'Elaboração de Relatórios Técnicos' }
    ],
    languages: [
      { language: 'Inglês', level: 'Nativo' },
      { language: 'Francês', level: 'Fluente' },
      { language: 'Alemão', level: 'Intermediário Avançado' }
    ],
    certifications: [],
    projects: [
      {
        name: 'Classificação Analítica de Evidências Residuais',
        description: 'Criação de um banco de dados empírico catalogando 140 variáveis de resíduos de tabaco, padronizando a coleta de provas no setor investigativo.',
        url: ''
      }
    ]
  };

  const ROBIN = {
    version: '1.0.0',
    template: 'executive',
    margin: 'padrao',
    density: 'condensado',
    currentStep: 0,
    enabledSections: ['personal', 'summary', 'experiences', 'education', 'skills', 'languages'],
    personal: {
      fullName: 'Robin de Locksley (Robin Hood)',
      headline: 'Gerente de Operações Estratégicas | Liderança Ágil | Impacto Social',
      email: 'robin.locksley@exemplo.com.br',
      phone: '(11) 99999-0002',
      location: 'Nottinghamshire, Inglaterra',
      linkedinUrl: ''
    },
    summary: 'Líder estratégico orientado a resultados e impacto social, com forte atuação em operações de campo e logística reversa. Especialista em construir e motivar equipes de alto desempenho em cenários de recursos limitados. Foco na reestruturação de processos financeiros para garantir a distribuição equitativa de ativos empresariais.',
    skillsText: 'Liderança de Equipes; Gestão de Operações; Planejamento Estratégico; Logística Reversa; Negociação de Conflitos; Metodologias Ágeis',
    experiences: [
      {
        company: 'Organização Merry Men',
        title: 'Diretor de Operações e Estratégia (COO)',
        period: '1190 - Presente',
        startDate: '', endDate: '', endCurrent: true,
        description: 'Lidera uma equipe multifuncional de mais de 50 colaboradores na execução de operações táticas diárias. Implementou um sistema eficiente de interceptação e redistribuição de ativos, aumentando o repasse de recursos à comunidade local em 300% no primeiro ano.'
      },
      {
        company: 'Forças Armadas (Campanha Terceira Cruzada)',
        title: 'Gestor de Equipes Táticas',
        period: '1189 - 1192',
        startDate: '', endDate: '', endCurrent: false,
        description: 'Comandou esquadrões de apoio em operações internacionais. Gerenciou recursos críticos e desenvolveu estratégias de posicionamento que reduziram as perdas operacionais em 40% durante as campanhas.'
      }
    ],
    education: [
      {
        institution: 'Academia de Locksley',
        degree: 'Formação Executiva em Estratégia de Defesa e Gestão de Recursos',
        period: '1175 - 1185',
        startDate: '', endDate: '', endCurrent: false
      }
    ],
    skills: [
      { name: 'Liderança e Mentoria' },
      { name: 'Estratégia Operacional' },
      { name: 'Gestão de Stakeholders' },
      { name: 'Gerenciamento de Riscos' },
      { name: 'Comunicação Assertiva' },
      { name: 'Precisão Técnica (Arquearia)' }
    ],
    languages: [
      { language: 'Inglês Antigo', level: 'Nativo' },
      { language: 'Francês Normando', level: 'Fluente' }
    ],
    certifications: [],
    projects: [
      {
        name: 'Iniciativa Fundo Sherwood',
        description: 'Estruturou um fundo comunitário autossustentável para apoio microfinanceiro a pequenos agricultores afetados por políticas fiscais agressivas.',
        url: ''
      }
    ]
  };

  const HERCULES = {
    version: '1.0.0',
    template: 'executive',
    margin: 'padrao',
    density: 'condensado',
    currentStep: 0,
    enabledSections: ['personal', 'summary', 'experiences', 'education', 'skills', 'languages'],
    personal: {
      fullName: 'Hércules (Heracles)',
      headline: 'Gerente de Projetos Críticos | Especialista em Execução de Escopos Complexos',
      email: 'heracles.projetos@exemplo.com.br',
      phone: '(11) 99999-0003',
      location: 'Monte Olimpo, Grécia',
      linkedinUrl: ''
    },
    summary: 'Gerente de Projetos focado na execução de iniciativas de altíssima complexidade e prazos agressivos. Reconhecido pela resiliência, capacidade de lidar com pressão extrema e foco inabalável na entrega. Especialista em reverter cenários adversos, gerenciar riscos severos e otimizar infraestruturas físicas através de soluções não convencionais.',
    skillsText: 'Gerenciamento de Projetos (Cascata/Ágil); Resolução de Problemas; Gestão de Crises; Alta Resiliência; Otimização de Processos; Foco em Entregáveis',
    experiences: [
      {
        company: 'Micenas S.A. (Governo de Euristeu)',
        title: 'Project Manager Sênior (Portfólio 12 Trabalhos)',
        period: 'Idade Heroica',
        startDate: '', endDate: '', endCurrent: false,
        description: "Gerenciou e entregou com sucesso 12 projetos classificados como de 'Risco Nível Máximo', cumprindo 100% do escopo original. Atuou ativamente na mitigação de ameaças biológicas (ex: controle populacional da Hidra) e na logística complexa de transporte de ativos internacionais."
      },
      {
        company: 'Expedição Argonautas',
        title: 'Coordenador de Segurança Operacional',
        period: 'Idade Heroica',
        startDate: '', endDate: '', endCurrent: false,
        description: 'Responsável pela integridade física da equipe e pela proteção dos ativos da embarcação durante expedição de longo prazo. Garantiu a continuidade dos negócios frente a incidentes climáticos e operacionais imprevisíveis.'
      }
    ],
    education: [
      {
        institution: 'Academia Quíron de Excelência',
        degree: 'Bacharelado em Estratégia de Combate e Gestão de Sobrevivência',
        period: 'Juventude',
        startDate: '', endDate: '', endCurrent: false
      }
    ],
    skills: [
      { name: 'Entrega Focada em Resultados' },
      { name: 'Trabalho sob Alta Pressão' },
      { name: 'Resolução de Conflitos Físicos/Táticos' },
      { name: 'Adaptação Rápida a Mudanças' },
      { name: 'Pensamento Criativo (Out-of-the-box)' },
      { name: 'Liderança pelo Exemplo' }
    ],
    languages: [
      { language: 'Grego Antigo', level: 'Nativo' }
    ],
    certifications: [
      {
        name: 'Certificação PMP (Project Management Professional) - Equivalência Olimpo',
        issuer: 'Conselho do Monte Olimpo',
        year: ''
      }
    ],
    projects: [
      {
        name: 'Otimização Sanitária das Cavalariças de Áugias',
        description: 'Redesenhou a arquitetura hídrica local desviando o curso de dois rios, automatizando o processo de limpeza e reduzindo um backlog de 30 anos para apenas 24 horas.',
        url: ''
      }
    ]
  };

  const CHAPEUZINHO = {
    version: '1.0.0',
    template: 'executive',
    margin: 'padrao',
    density: 'condensado',
    currentStep: 0,
    enabledSections: ['personal', 'summary', 'experiences', 'education', 'skills', 'languages'],
    personal: {
      fullName: 'Chapeuzinho Vermelho',
      headline: 'Especialista em Logística Last-Mile | Gestão de Cadeia de Suprimentos | Atendimento ao Cliente',
      email: 'chapeuzinho.logistica@exemplo.com.br',
      phone: '(11) 99999-0004',
      location: 'Vila da Floresta',
      linkedinUrl: ''
    },
    summary: "Profissional dinâmica focada em operações logísticas de 'última milha' (last-mile) e atendimento a clientes prioritários. Experiência comprovada no transporte seguro de cargas sensíveis (alimentos e itens de saúde) garantindo SLAs rigorosos. Altamente adaptável e treinada em gestão de crises e protocolos de segurança em ambientes de alto risco.",
    skillsText: 'Logística Last-Mile; Mapeamento de Rotas; Gestão de Prazos (SLA); Atendimento Humanizado; Gerenciamento de Riscos; Resolução Rápida de Problemas',
    experiences: [
      {
        company: 'Distribuidora Florestal / Contrato Familiar',
        title: 'Coordenadora de Entregas Prioritárias',
        period: 'Contínuo',
        startDate: '', endDate: '', endCurrent: true,
        description: 'Responsável pela ponta da cadeia de suprimentos, garantindo a entrega de kits de saúde e nutrição para o público sênior em zonas remotas. Mantém uma taxa de 100% de precisão nos pedidos despachados e forte relacionamento com os clientes finais.'
      },
      {
        company: 'Comitê de Segurança da Rota dos Lenhadores',
        title: 'Analista de Mitigação de Riscos',
        period: 'Pós-Incidente',
        startDate: '', endDate: '', endCurrent: true,
        description: 'Mapeou vulnerabilidades na rota de entrega principal, elaborando um plano de contingência focado em desvios seguros e comunicação de emergência. A iniciativa reduziu a exposição da equipe a abordagens não autorizadas (predadores locais).'
      }
    ],
    education: [
      {
        institution: 'Ensino Domiciliar Aplicado',
        degree: 'Formação em Logística Básica, Botânica e Orientação Geográfica',
        period: 'Concluído',
        startDate: '', endDate: '', endCurrent: false
      }
    ],
    skills: [
      { name: 'Otimização de Rotas (Routing)' },
      { name: 'Atendimento a Clientes VIP/Sênior' },
      { name: 'Aderência a Procedimentos de Segurança' },
      { name: 'Trabalho Autônomo e Proatividade' },
      { name: 'Controle de Qualidade de Produtos Perecíveis' },
      { name: 'Inteligência Emocional sob Estresse' }
    ],
    languages: [
      { language: 'Português', level: 'Nativo' }
    ],
    certifications: [
      {
        name: 'Workshop de Compliance e Prevenção a Fraudes de Identidade',
        issuer: 'Instituto de Segurança da Floresta',
        year: ''
      }
    ],
    projects: [
      {
        name: 'Protocolo de Verificação de Identidade (PVI)',
        description: 'Desenvolveu um checklist de 3 etapas (Orelhas, Olhos e Dentes) para validar a identidade do recebedor final, erradicando tentativas de fraude na entrega.',
        url: ''
      }
    ]
  };

  const CHARACTERS = [
    {
      id: 'sherlock',
      name: 'Sherlock Holmes',
      role: 'Investigação e análise de dados',
      initials: 'SH',
      tagline: 'Exemplo pronto',
      state: SHERLOCK
    },
    {
      id: 'robin',
      name: 'Robin Hood',
      role: 'Liderança e operações estratégicas',
      initials: 'RH',
      tagline: 'Exemplo pronto',
      state: ROBIN
    },
    {
      id: 'hercules',
      name: 'Hércules',
      role: 'Projetos críticos sob pressão',
      initials: 'HC',
      tagline: 'Exemplo pronto',
      state: HERCULES
    },
    {
      id: 'chapeuzinho',
      name: 'Chapeuzinho Vermelho',
      role: 'Logística e atendimento ao cliente',
      initials: 'CV',
      tagline: 'Exemplo pronto',
      state: CHAPEUZINHO
    },
    {
      id: 'blank',
      name: 'Em branco',
      role: 'Comece do zero, do seu jeito',
      initials: '+',
      tagline: 'Página limpa',
      state: null
    }
  ];

  function getById(id) {
    return CHARACTERS.find((c) => c.id === id) || null;
  }

  return { CHARACTERS, getById };
})();
