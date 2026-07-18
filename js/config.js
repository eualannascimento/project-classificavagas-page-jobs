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
      description: 'Comece pelo básico. É assim que os recrutadores vão te encontrar.',
      linkedinHint: 'Perfil → foto de capa → seção de introdução no topo do perfil',
      fields: [
        { key: 'fullName', label: 'Nome completo', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Ex.: Cida Boaventura', tip: 'Escreva seu nome completo, do jeito que quer ser chamado.' },
        { key: 'headline', label: 'Cargo ou área desejada', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Ex.: Auxiliar Administrativo', tip: 'A vaga ou área que você busca. Ex.: Auxiliar Administrativo.' },
        { key: 'email', label: 'E-mail', type: 'email', required: true, minLength: 5, placeholder: 'voce@email.com', tip: 'Use um e-mail que você acessa sempre. É por onde te chamam.' },
        { key: 'phone', label: 'Telefone', type: 'tel', required: false, minLength: 8, placeholder: '(11) 90000-0000', tip: 'Com DDD. De preferência com WhatsApp.' },
        { key: 'location', label: 'Cidade', type: 'text', required: true, minLength: 3, placeholder: 'Cidade, UF', tip: 'Cidade e estado onde você mora. Ex.: Guarulhos, SP.' },
        { key: 'linkedinUrl', label: 'LinkedIn (opcional)', type: 'url', required: false, minLength: 10, placeholder: 'linkedin.com/in/voce', tip: 'Opcional. O endereço do seu perfil, se você tiver um.' }
      ]
    },
    {
      id: 'summary',
      title: 'Resumo',
      description: 'Duas ou três frases sobre quem você é e o que faz de melhor. Experiências do dia a dia valem!',
      linkedinHint: 'Perfil → seção "Sobre" → editar',
      fields: [
        { key: 'summary', label: 'Um parágrafo curto sobre você', type: 'textarea', rows: 7, required: true, minLength: 45, actionVerbs: true, fullWidth: true, placeholder: 'Ex.: Pessoa comunicativa e organizada, com experiência em vendas e atendimento ao público. Busco minha primeira oportunidade com carteira assinada.', tip: '2 a 3 frases sobre quem você é e o que faz bem. Experiências do dia a dia valem!' }
      ]
    },
    {
      id: 'experiences',
      title: 'Experiência',
      description: 'Descreva o que você fez. Trabalho informal, autônomo ou voluntário também conta.',
      linkedinHint: 'Perfil → seção "Experiência" → adicionar experiência',
      list: true,
      itemFields: [
        { key: 'title', label: 'Cargo ou função', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Ex.: Vendedora autônoma', tip: 'Como sua função era chamada. Trabalho informal ou autônomo também vale.' },
        { key: 'company', label: 'Onde', type: 'text', required: true, minLength: 2, placeholder: 'Ex.: Doces da Cida', tip: "O local. Pode ser 'autônomo', o nome de uma loja ou de um projeto." },
        { key: 'period', label: 'Período', type: 'text', required: false, minLength: 0, placeholder: 'Ex.: 2019 - atual', tip: 'De quando até quando. Ex.: 2019 - atual.' },
        { key: 'description', label: 'O que você fez e conquistou', type: 'textarea', required: true, minLength: 45, actionVerbs: true, fullWidth: true, placeholder: 'Ex.: Vendi doces caseiros e atendi mais de 200 clientes fiéis.', tip: 'Comece com um verbo (Vendi, Organizei…) e cite um número quando puder.' }
      ]
    },
    {
      id: 'education',
      title: 'Formação',
      description: 'Cursos, ensino médio, técnico ou oficinas. O mais recente primeiro.',
      linkedinHint: 'Perfil → seção "Formação acadêmica" → adicionar formação',
      list: true,
      itemFields: [
        { key: 'degree', label: 'Curso ou formação', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Ex.: Ensino Médio completo', tip: 'Ensino médio, técnico, cursos livres e oficinas também contam.' },
        { key: 'institution', label: 'Instituição', type: 'text', required: true, minLength: 3, placeholder: 'Ex.: EE Prof. João Ramos', tip: 'Onde você estudou. Ex.: escola, Senai, curso online.' },
        { key: 'period', label: 'Período', type: 'text', required: false, minLength: 0, placeholder: 'Ex.: 2018', tip: 'O ano de conclusão ou o período. Ex.: 2018.' }
      ]
    },
    {
      id: 'skills',
      title: 'Habilidades',
      description: 'Liste o que você sabe fazer. Misture habilidades técnicas e de convivência.',
      linkedinHint: 'Perfil → seção "Competências" → adicionar competência',
      fields: [
        { key: 'skillsText', label: 'Digite uma habilidade e aperte Enter', type: 'skillsTags', required: false, minLength: 2, fullWidth: true, tip: 'O que você sabe fazer. Misture técnicas (Excel) e de convivência (trabalho em equipe).', placeholder: 'Ex.: Atendimento ao cliente…' }
      ]
    },
    {
      id: 'languages',
      title: 'Idiomas',
      description: 'Idiomas que você fala e o nível de cada um.',
      linkedinHint: 'Perfil → seção "Idiomas" → adicionar idioma',
      list: true,
      itemFields: [
        { key: 'language', label: 'Idioma', type: 'text', required: true, minLength: 2, placeholder: 'Ex.: Inglês', tip: 'Idiomas que você fala, mesmo que básico.' },
        { key: 'level', label: 'Nível', type: 'select', required: false, minLength: 0, options: ['Básico', 'Intermediário', 'Avançado', 'Fluente', 'Nativo'] }
      ]
    },
    {
      id: 'certifications',
      title: 'Certificações',
      description: 'Cursos livres, certificações e treinamentos que você concluiu. Curso online e da prefeitura também valem!',
      linkedinHint: 'Perfil → seção "Licenças e certificados" → adicionar',
      list: true,
      itemFields: [
        { key: 'name', label: 'Nome do curso ou certificação', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Ex.: Informática Básica', tip: 'O que você concluiu. Cursos online, da prefeitura ou do SENAI também contam.' },
        { key: 'issuer', label: 'Onde você fez', type: 'text', required: true, minLength: 2, placeholder: 'Ex.: Fundação Bradesco', tip: 'A instituição que emitiu. Ex.: Fundação Bradesco, Senac, YouTube.' },
        { key: 'year', label: 'Ano', type: 'text', required: false, minLength: 0, placeholder: 'Ex.: 2023', tip: 'O ano em que você concluiu. Ex.: 2023.' }
      ]
    },
    {
      id: 'projects',
      title: 'Projetos',
      description: 'Trabalhos, projetos ou iniciativas de que você participou - na escola, na comunidade ou por conta própria.',
      linkedinHint: 'Perfil → seção "Projetos" → adicionar projeto',
      list: true,
      itemFields: [
        { key: 'name', label: 'Nome do projeto', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Ex.: Feira de empreendedorismo', tip: 'Um trabalho ou iniciativa: da escola, da comunidade ou por conta própria.' },
        { key: 'description', label: 'O que você fez', type: 'textarea', required: true, minLength: 30, actionVerbs: true, fullWidth: true, placeholder: 'Ex.: Organizei a barraca de doces com 2 colegas e cuidei do caixa, com lucro de R$ 300.', tip: 'Explique seu papel e o resultado. Comece com um verbo e cite um número quando puder.' },
        { key: 'url', label: 'Link (opcional)', type: 'url', required: false, minLength: 0, fullWidth: true, placeholder: 'Ex.: instagram.com/seuprojeto', tip: 'Opcional. Um link para ver o projeto, se existir (rede social, site, drive).' }
      ]
    }
  ];

  // 20 modelos. Todos pensados para uma vaga real (estéticos e legíveis); os
  // marcados atsFriendly: false têm coluna/selo e são os mais "criativos".
  // thumbAccent tinge o cartão de escolha; a prévia e o PDF usam o CSS do tema.
  const TEMPLATES = {
    classic: {
      id: 'classic', name: 'Clássico', description: 'Monocromático, limpo e profissional',
      layout: 'centered', thumbAccent: '#334155', atsFriendly: true
    },
    minimal: {
      id: 'minimal', name: 'Minimalista', description: 'Alinhado à esquerda, ultra limpo',
      layout: 'left', thumbAccent: '#334155', atsFriendly: true
    },
    serifado: {
      id: 'serifado', name: 'Serifado', description: 'Tipografia serifada tradicional',
      layout: 'centered', thumbAccent: '#2b2b2d', atsFriendly: true
    },
    elegant: {
      id: 'elegant', name: 'Elegante', description: 'Centrado, tipografia fina e espaçada',
      layout: 'centered', thumbAccent: '#334155', atsFriendly: true
    },
    linha: {
      id: 'linha', name: 'Linha', description: 'Títulos com fio fino acima, ar minimalista',
      layout: 'centered', thumbAccent: '#334155', atsFriendly: true
    },
    pilar: {
      id: 'pilar', name: 'Pilar', description: 'Títulos com barra lateral de acento',
      layout: 'left', thumbAccent: '#334155', atsFriendly: true
    },
    grafite: {
      id: 'grafite', name: 'Grafite', description: 'Esquerda, cinza grafite e títulos fortes',
      layout: 'left', thumbAccent: '#374151', atsFriendly: true
    },
    esmeralda: {
      id: 'esmeralda', name: 'Esmeralda', description: 'Centrado, acento verde esmeralda',
      layout: 'centered', thumbAccent: '#0f766e', atsFriendly: true
    },
    petroleo: {
      id: 'petroleo', name: 'Petróleo', description: 'Barra lateral em azul petróleo',
      layout: 'sidebar', thumbAccent: '#155e75', atsFriendly: false,
      atsNote: 'Barra lateral: alguns ATS leem melhor coluna única.'
    },
    marinho: {
      id: 'marinho', name: 'Marinho', description: 'Faixa superior em azul marinho',
      layout: 'banner', thumbAccent: '#1e3a5f', atsFriendly: true
    },
    bordo: {
      id: 'bordo', name: 'Bordô', description: 'Centrado, vinho sóbrio com serifa',
      layout: 'centered', thumbAccent: '#7a2230', atsFriendly: true
    },
    ambar: {
      id: 'ambar', name: 'Âmbar', description: 'Esquerda, acento âmbar acolhedor',
      layout: 'left', thumbAccent: '#92400e', atsFriendly: true
    },
    oliva: {
      id: 'oliva', name: 'Oliva', description: 'Barra lateral em verde oliva',
      layout: 'sidebar', thumbAccent: '#256345', atsFriendly: false,
      atsNote: 'Barra lateral: alguns ATS leem melhor coluna única.'
    },
    modern: {
      id: 'modern', name: 'Moderno', description: 'Barra lateral clara com acento azul',
      layout: 'sidebar', thumbAccent: '#5980a6', atsFriendly: false,
      atsNote: 'Barra lateral: alguns ATS leem melhor coluna única.'
    },
    executive: {
      id: 'executive', name: 'Executivo', description: 'Faixa superior escura',
      layout: 'banner', thumbAccent: '#1d2d3d', atsFriendly: true
    },
    carvao: {
      id: 'carvao', name: 'Carvão', description: 'Faixa superior em preto carvão',
      layout: 'banner', thumbAccent: '#1f2937', atsFriendly: true
    },
    faixa: {
      id: 'faixa', name: 'Faixa Clara', description: 'Faixa superior suave em azul claro',
      layout: 'banner', thumbAccent: '#c9dcf0', atsFriendly: true
    },
    violeta: {
      id: 'violeta', name: 'Violeta', description: 'Centrado, acento violeta contemporâneo',
      layout: 'centered', thumbAccent: '#573a8a', atsFriendly: true
    },
    creative: {
      id: 'creative', name: 'Criativo', description: 'Coluna única com selo de iniciais',
      layout: 'creative', thumbAccent: '#5980a6', atsFriendly: false,
      atsNote: 'Selo gráfico no topo: prefira modelos sem selo para ATS rigorosos.'
    },
    rosado: {
      id: 'rosado', name: 'Rosado', description: 'Selo de iniciais em rosé, para portfólios',
      layout: 'creative', thumbAccent: '#9f2544', atsFriendly: false,
      atsNote: 'Selo gráfico no topo: prefira modelos sem selo para ATS rigorosos.'
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
