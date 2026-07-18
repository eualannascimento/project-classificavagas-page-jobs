/**
 * Configuração de seções, campos, dicas e verbos de ação.
 */
const EuGeroConfig = (function () {
  const ACTION_VERBS = [
    'implementei', 'liderei', 'desenvolvi', 'gerenciei', 'coordenei', 'otimizei',
    'criei', 'projetei', 'analisei', 'melhorei', 'reduzi', 'aumentei', 'automatizei',
    'organizei', 'treinei', 'mentorei', 'negociei', 'executei', 'conduzi', 'estabeleci',
    'planejei', 'supervisionei', 'revisei', 'documentei', 'apresentei', 'negociei',
    'alcancei', 'entreguei', 'construí', 'desenvolvi', 'implementei', 'realizei',
    'promovi', 'facilitei', 'resolvi', 'identifiquei', 'proponho', 'propus',
    'colabori', 'participei', 'contribuí', 'capacitei', 'estruturei', 'reestruturei'
  ];

  const REQUIRED_SECTION_IDS = ['personal', 'summary', 'skills'];
  const DEFAULT_ENABLED_SECTION_IDS = [
    'personal', 'summary', 'experiences', 'education', 'skills', 'languages'
  ];

  const SECTION_LABELS = {
    personal: 'Dados pessoais',
    summary: 'Resumo',
    experiences: 'Experiência',
    education: 'Formação',
    skills: 'Habilidades',
    languages: 'Idiomas',
    certifications: 'Certificações',
    projects: 'Projetos'
  };

  const SECTIONS = [
    {
      id: 'personal',
      title: 'Dados pessoais',
      description: 'Comece pelas informações que os recrutadores usarão para entrar em contato.',
      linkedinHint: 'Perfil → foto de capa → seção de introdução no topo do perfil',
      fields: [
        { key: 'fullName', label: 'Nome completo', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Ex.: Cida Boaventura', tip: 'Informe seu nome completo como deseja que ele apareça no currículo.' },
        { key: 'headline', label: 'Cargo ou área desejada', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Ex.: Auxiliar administrativo', tip: 'Informe o cargo ou a área em que deseja trabalhar.' },
        { key: 'email', label: 'E-mail', type: 'email', required: true, minLength: 5, placeholder: 'voce@email.com', tip: 'Use um endereço de e-mail que você acessa com frequência.' },
        { key: 'phone', label: 'Telefone', type: 'tel', required: false, minLength: 8, placeholder: '(11) 90000-0000', tip: 'Inclua o DDD e, de preferência, um número com WhatsApp.' },
        { key: 'location', label: 'Cidade', type: 'text', required: true, minLength: 3, placeholder: 'Cidade, UF', tip: 'Informe a cidade e o estado onde você mora. Ex.: Guarulhos, SP.' },
        { key: 'linkedinUrl', label: 'LinkedIn (opcional)', type: 'url', required: false, minLength: 10, placeholder: 'linkedin.com/in/voce', tip: 'Informe o endereço do seu perfil, caso tenha um.' }
      ]
    },
    {
      id: 'summary',
      title: 'Resumo',
      description: 'Apresente, em duas ou três frases, seu perfil e seus principais pontos fortes. Experiências do dia a dia também contam.',
      linkedinHint: 'Perfil → seção "Sobre" → editar',
      fields: [
        { key: 'summary', label: 'Um parágrafo curto sobre você', type: 'textarea', rows: 7, required: true, minLength: 45, actionVerbs: true, fullWidth: true, placeholder: 'Ex.: Pessoa comunicativa e organizada, com experiência em vendas e atendimento ao público. Busco minha primeira oportunidade com carteira assinada.', tip: 'Escreva de duas a três frases sobre seu perfil, suas habilidades e o que você busca.' }
      ]
    },
    {
      id: 'experiences',
      title: 'Experiência',
      description: 'Descreva suas principais atividades e resultados. Trabalhos informais, autônomos e voluntários também contam.',
      linkedinHint: 'Perfil → seção "Experiência" → adicionar experiência',
      list: true,
      itemFields: [
        { key: 'title', label: 'Cargo ou função', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Ex.: Vendedora autônoma', tip: 'Informe o nome da função exercida. Trabalhos informais ou autônomos também podem ser incluídos.' },
        { key: 'company', label: 'Onde', type: 'text', required: true, minLength: 2, placeholder: 'Ex.: Doces da Cida', tip: 'Informe o local, a empresa, o projeto ou escreva “Autônomo”.' },
        { key: 'period', label: 'Período', type: 'text', required: false, minLength: 0, placeholder: 'Ex.: 2019 - atual', tip: 'Informe o início e o fim da atividade. Ex.: 2019 - atual.' },
        { key: 'description', label: 'O que você fez e conquistou', type: 'textarea', required: true, minLength: 45, actionVerbs: true, fullWidth: true, placeholder: 'Ex.: Vendi doces caseiros e atendi mais de 200 clientes recorrentes.', tip: 'Comece com um verbo de ação e inclua números ou resultados, quando possível.' }
      ]
    },
    {
      id: 'education',
      title: 'Formação',
      description: 'Inclua ensino médio, cursos técnicos, graduações, cursos livres ou oficinas, começando pelo mais recente.',
      linkedinHint: 'Perfil → seção "Formação acadêmica" → adicionar formação',
      list: true,
      itemFields: [
        { key: 'degree', label: 'Curso ou formação', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Ex.: Ensino médio completo', tip: 'Inclua sua formação escolar, técnica, acadêmica ou cursos relevantes.' },
        { key: 'institution', label: 'Instituição', type: 'text', required: true, minLength: 3, placeholder: 'Ex.: EE Prof. João Ramos', tip: 'Informe a escola, faculdade, plataforma ou instituição responsável.' },
        { key: 'period', label: 'Período', type: 'text', required: false, minLength: 0, placeholder: 'Ex.: 2018', tip: 'Informe o ano de conclusão ou o período cursado.' }
      ]
    },
    {
      id: 'skills',
      title: 'Habilidades',
      description: 'Liste habilidades técnicas e comportamentais relevantes para o trabalho que você busca.',
      linkedinHint: 'Perfil → seção "Competências" → adicionar competência',
      fields: [
        { key: 'skillsText', label: 'Digite uma habilidade e pressione Enter', type: 'skillsTags', required: false, minLength: 2, fullWidth: true, tip: 'Combine conhecimentos técnicos, como Excel, com habilidades comportamentais, como trabalho em equipe.', placeholder: 'Ex.: Atendimento ao cliente…' }
      ]
    },
    {
      id: 'languages',
      title: 'Idiomas',
      description: 'Informe os idiomas que você conhece e o nível de domínio de cada um.',
      linkedinHint: 'Perfil → seção "Idiomas" → adicionar idioma',
      list: true,
      itemFields: [
        { key: 'language', label: 'Idioma', type: 'text', required: true, minLength: 2, placeholder: 'Ex.: Inglês', tip: 'Inclua os idiomas que você conhece, mesmo em nível básico.' },
        { key: 'level', label: 'Nível', type: 'select', required: false, minLength: 0, options: ['Básico', 'Intermediário', 'Avançado', 'Fluente', 'Nativo'] }
      ]
    },
    {
      id: 'certifications',
      title: 'Certificações',
      description: 'Inclua cursos livres, certificações e treinamentos concluídos. Cursos online ou oferecidos por instituições públicas também contam.',
      linkedinHint: 'Perfil → seção "Licenças e certificados" → adicionar',
      list: true,
      itemFields: [
        { key: 'name', label: 'Nome do curso ou certificação', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Ex.: Informática básica', tip: 'Informe o nome do curso, treinamento ou certificação concluída.' },
        { key: 'issuer', label: 'Instituição', type: 'text', required: true, minLength: 2, placeholder: 'Ex.: Fundação Bradesco', tip: 'Informe a instituição ou plataforma responsável pela emissão.' },
        { key: 'year', label: 'Ano', type: 'text', required: false, minLength: 0, placeholder: 'Ex.: 2023', tip: 'Informe o ano de conclusão.' }
      ]
    },
    {
      id: 'projects',
      title: 'Projetos',
      description: 'Inclua projetos da escola, da comunidade, do trabalho ou desenvolvidos por iniciativa própria.',
      linkedinHint: 'Perfil → seção "Projetos" → adicionar projeto',
      list: true,
      itemFields: [
        { key: 'name', label: 'Nome do projeto', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Ex.: Feira de empreendedorismo', tip: 'Informe o nome de um trabalho, projeto ou iniciativa relevante.' },
        { key: 'description', label: 'O que você fez', type: 'textarea', required: true, minLength: 30, actionVerbs: true, fullWidth: true, placeholder: 'Ex.: Organizei a barraca de doces com dois colegas e cuidei do caixa, gerando R$ 300 de lucro.', tip: 'Explique sua participação e o resultado. Comece com um verbo de ação e inclua números, quando possível.' },
        { key: 'url', label: 'Link (opcional)', type: 'url', required: false, minLength: 0, fullWidth: true, placeholder: 'Ex.: instagram.com/seuprojeto', tip: 'Adicione um link para o projeto, caso ele esteja disponível online.' }
      ]
    }
  ];

  // 20 modelos. Todos pensados para uma vaga real (estéticos e legíveis); os
  // marcados atsFriendly: false têm coluna/selo e são os mais "criativos".
  // thumbAccent tinge o cartão de escolha; a prévia e o PDF usam o CSS do tema.
  const TEMPLATES = {
    classic: {
      id: 'classic', name: 'Clássico', description: 'Visual monocromático, limpo e profissional',
      layout: 'centered', thumbAccent: '#334155', atsFriendly: true
    },
    minimal: {
      id: 'minimal', name: 'Minimalista', description: 'Alinhamento à esquerda e visual essencial',
      layout: 'left', thumbAccent: '#334155', atsFriendly: true
    },
    serifado: {
      id: 'serifado', name: 'Serifado', description: 'Tipografia serifada de estilo tradicional',
      layout: 'centered', thumbAccent: '#2b2b2d', atsFriendly: true
    },
    elegant: {
      id: 'elegant', name: 'Elegante', description: 'Conteúdo centralizado, com tipografia leve e espaçada',
      layout: 'centered', thumbAccent: '#334155', atsFriendly: true
    },
    linha: {
      id: 'linha', name: 'Linha', description: 'Títulos destacados por linhas finas e visual minimalista',
      layout: 'centered', thumbAccent: '#334155', atsFriendly: true
    },
    pilar: {
      id: 'pilar', name: 'Pilar', description: 'Títulos com barra lateral de destaque',
      layout: 'left', thumbAccent: '#334155', atsFriendly: true
    },
    grafite: {
      id: 'grafite', name: 'Grafite', description: 'Alinhamento à esquerda, tons de grafite e títulos marcantes',
      layout: 'left', thumbAccent: '#374151', atsFriendly: true
    },
    esmeralda: {
      id: 'esmeralda', name: 'Esmeralda', description: 'Conteúdo centralizado com detalhes em verde-esmeralda',
      layout: 'centered', thumbAccent: '#0f766e', atsFriendly: true
    },
    petroleo: {
      id: 'petroleo', name: 'Petróleo', description: 'Barra lateral em azul-petróleo',
      layout: 'sidebar', thumbAccent: '#155e75', atsFriendly: false,
      atsNote: 'Alguns sistemas ATS interpretam melhor currículos em coluna única.'
    },
    marinho: {
      id: 'marinho', name: 'Marinho', description: 'Faixa superior em azul-marinho',
      layout: 'banner', thumbAccent: '#1e3a5f', atsFriendly: true
    },
    bordo: {
      id: 'bordo', name: 'Bordô', description: 'Conteúdo centralizado, com tom bordô e tipografia serifada',
      layout: 'centered', thumbAccent: '#7a2230', atsFriendly: true
    },
    ambar: {
      id: 'ambar', name: 'Âmbar', description: 'Alinhamento à esquerda e detalhes em âmbar',
      layout: 'left', thumbAccent: '#92400e', atsFriendly: true
    },
    oliva: {
      id: 'oliva', name: 'Oliva', description: 'Barra lateral em verde-oliva',
      layout: 'sidebar', thumbAccent: '#256345', atsFriendly: false,
      atsNote: 'Alguns sistemas ATS interpretam melhor currículos em coluna única.'
    },
    modern: {
      id: 'modern', name: 'Moderno', description: 'Barra lateral clara com detalhes em azul',
      layout: 'sidebar', thumbAccent: '#5980a6', atsFriendly: false,
      atsNote: 'Alguns sistemas ATS interpretam melhor currículos em coluna única.'
    },
    executive: {
      id: 'executive', name: 'Executivo', description: 'Faixa superior escura e visual formal',
      layout: 'banner', thumbAccent: '#1d2d3d', atsFriendly: true
    },
    carvao: {
      id: 'carvao', name: 'Carvão', description: 'Faixa superior em preto-carvão',
      layout: 'banner', thumbAccent: '#1f2937', atsFriendly: true
    },
    faixa: {
      id: 'faixa', name: 'Faixa Clara', description: 'Faixa superior suave em azul-claro',
      layout: 'banner', thumbAccent: '#c9dcf0', atsFriendly: true
    },
    violeta: {
      id: 'violeta', name: 'Violeta', description: 'Conteúdo centralizado com detalhes em violeta',
      layout: 'centered', thumbAccent: '#573a8a', atsFriendly: true
    },
    creative: {
      id: 'creative', name: 'Criativo', description: 'Coluna única com selo de iniciais',
      layout: 'creative', thumbAccent: '#5980a6', atsFriendly: false,
      atsNote: 'Para sistemas ATS mais rigorosos, prefira um modelo sem elementos gráficos no topo.'
    },
    rosado: {
      id: 'rosado', name: 'Rosado', description: 'Selo de iniciais em tom rosé, indicado para portfólios',
      layout: 'creative', thumbAccent: '#9f2544', atsFriendly: false,
      atsNote: 'Para sistemas ATS mais rigorosos, prefira um modelo sem elementos gráficos no topo.'
    }
  };

  const TEMPLATE_IDS = Object.keys(TEMPLATES);

  function getTemplateMeta(templateId) {
    return TEMPLATES[templateId] || TEMPLATES.classic;
  }

  function isSidebarTemplate(templateId) {
    return getTemplateMeta(templateId).layout === 'sidebar';
  }

  const STORAGE_KEY = 'eugero-curriculo-state';
  const APP_VERSION = '1.0.0';

  function createEmptyState() {
    return {
      version: APP_VERSION,
      template: 'classic',
      margin: 'padrao',
      density: 'normal',
      currentStep: 0,
      enabledSections: [...DEFAULT_ENABLED_SECTION_IDS],
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
    };
  }

  function parseSkillsText(text) {
    if (!text || typeof text !== 'string') return [];
    return text.split(/[;,]/).map(s => s.trim()).filter(Boolean).map(name => ({ name }));
  }

  function skillsToText(state) {
    if (state.skillsText) return state.skillsText;
    if (state.skills?.length) {
      return state.skills.map(s => s.name || s).filter(Boolean).join('; ');
    }
    return '';
  }

  function getSkillsFromState(state) {
    if (state.skillsText) return parseSkillsText(state.skillsText);
    if (state.skills?.length) return state.skills;
    return [];
  }

  function normalizeEnabledSections(enabledSections) {
    const set = new Set([...REQUIRED_SECTION_IDS, ...(enabledSections || DEFAULT_ENABLED_SECTION_IDS)]);
    return SECTIONS.map(s => s.id).filter(id => set.has(id));
  }

  function getActiveSections(enabledSections) {
    const enabled = normalizeEnabledSections(enabledSections);
    return SECTIONS.filter(s => enabled.includes(s.id));
  }

  function isSectionMandatory(sectionId) {
    return REQUIRED_SECTION_IDS.includes(sectionId);
  }

  function createEmptyListItem(sectionId) {
    const section = SECTIONS.find(s => s.id === sectionId);
    if (!section || !section.itemFields) return {};
    const item = { endCurrent: false };
    section.itemFields.forEach(f => { item[f.key] = ''; });
    return item;
  }

  const SHORT_LABELS = {
    personal: 'Dados',
    summary: 'Resumo',
    experiences: 'Experiência',
    education: 'Formação',
    skills: 'Habilidades',
    languages: 'Idiomas',
    certifications: 'Certificações',
    projects: 'Projetos'
  };

  return {
    ACTION_VERBS,
    SECTIONS,
    SECTION_LABELS,
    TEMPLATES,
    TEMPLATE_IDS,
    getTemplateMeta,
    isSidebarTemplate,
    STORAGE_KEY,
    APP_VERSION,
    REQUIRED_SECTION_IDS,
    DEFAULT_ENABLED_SECTION_IDS,
    createEmptyState,
    createEmptyListItem,
    parseSkillsText,
    skillsToText,
    getSkillsFromState,
    normalizeEnabledSections,
    getActiveSections,
    isSectionMandatory,
    SHORT_LABELS
  };
})();
