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

  const SECTIONS = [
    {
      id: 'personal',
      title: 'Dados Pessoais',
      linkedinHint: 'Perfil → foto de capa → seção de introdução no topo do perfil',
      fields: [
        { key: 'fullName', label: 'Nome completo', type: 'text', required: true, minLength: 3, tip: 'Use seu nome como aparece em documentos oficiais. Evite apelidos.' },
        { key: 'headline', label: 'Cargo desejado / Título profissional', type: 'text', required: true, minLength: 10, tip: 'Descreva sua função e especialidade em uma linha. Ex: "Desenvolvedor Full Stack | React & Node.js"' },
        { key: 'email', label: 'E-mail', type: 'email', required: true, minLength: 5, tip: 'Use um e-mail profissional. Evite apelidos ou números aleatórios.' },
        { key: 'phone', label: 'Telefone', type: 'tel', required: false, minLength: 8, tip: 'Inclua DDD. Formato: (11) 99999-9999' },
        { key: 'location', label: 'Cidade / Estado', type: 'text', required: true, minLength: 3, tip: 'Informe cidade e estado. Ex: "São Paulo, SP"' },
        { key: 'linkedinUrl', label: 'URL do LinkedIn', type: 'url', required: false, minLength: 10, tip: 'Cole a URL completa do seu perfil. Será usada no QR Code do PDF.' }
      ]
    },
    {
      id: 'summary',
      title: 'Resumo / Sobre',
      linkedinHint: 'Perfil → seção "Sobre" → editar',
      fields: [
        { key: 'summary', label: 'Resumo profissional', type: 'textarea', required: true, minLength: 100, actionVerbs: true, tip: 'Conte sua história em 3-4 parágrafos: quem você é, o que faz, principais conquistas e objetivo. Use verbos de ação e números quando possível.' }
      ]
    },
    {
      id: 'experiences',
      title: 'Experiências Profissionais',
      linkedinHint: 'Perfil → seção "Experiência" → adicionar experiência',
      list: true,
      itemFields: [
        { key: 'company', label: 'Empresa', type: 'text', required: true, minLength: 2, tip: 'Nome oficial da empresa.' },
        { key: 'title', label: 'Cargo', type: 'text', required: true, minLength: 3, tip: 'Título exato ou equivalente ao cargo exercido.' },
        { key: 'startDate', label: 'Início', type: 'text', required: true, minLength: 4, tip: 'Ex: Jan 2020 ou 01/2020' },
        { key: 'endDate', label: 'Fim', type: 'text', required: false, minLength: 0, tip: 'Deixe em branco ou escreva "Atual" se ainda trabalha aqui.' },
        { key: 'description', label: 'Descrição das atividades', type: 'textarea', required: true, minLength: 50, actionVerbs: true, tip: 'Use bullet points mentais: verbos de ação + resultado mensurável. Ex: "Implementei sistema que reduziu tempo de processamento em 40%".' }
      ]
    },
    {
      id: 'education',
      title: 'Formação Acadêmica',
      linkedinHint: 'Perfil → seção "Formação acadêmica" → adicionar formação',
      list: true,
      itemFields: [
        { key: 'institution', label: 'Instituição', type: 'text', required: true, minLength: 3, tip: 'Nome completo da universidade ou escola.' },
        { key: 'degree', label: 'Curso / Grau', type: 'text', required: true, minLength: 3, tip: 'Ex: Bacharelado em Ciência da Computação' },
        { key: 'startDate', label: 'Início', type: 'text', required: false, minLength: 4, tip: 'Ano ou mês/ano de início.' },
        { key: 'endDate', label: 'Conclusão', type: 'text', required: false, minLength: 4, tip: 'Ano de conclusão ou previsão.' }
      ]
    },
    {
      id: 'skills',
      title: 'Habilidades',
      linkedinHint: 'Perfil → seção "Competências" → adicionar competência',
      list: true,
      simpleList: true,
      itemFields: [
        { key: 'name', label: 'Habilidade', type: 'text', required: true, minLength: 2, tip: 'Liste habilidades relevantes para a vaga desejada. Priorize as mais importantes.' }
      ]
    },
    {
      id: 'languages',
      title: 'Idiomas',
      linkedinHint: 'Perfil → seção "Idiomas" → adicionar idioma',
      list: true,
      itemFields: [
        { key: 'language', label: 'Idioma', type: 'text', required: true, minLength: 2, tip: 'Ex: Inglês, Espanhol, Francês' },
        { key: 'level', label: 'Nível de proficiência', type: 'select', options: ['Básico', 'Intermediário', 'Avançado', 'Fluente', 'Nativo'], required: true, minLength: 3, tip: 'Seja honesto — recrutadores podem testar em entrevistas.' }
      ]
    },
    {
      id: 'certifications',
      title: 'Certificados e Licenças',
      linkedinHint: 'Perfil → seção "Licenças e certificados" → adicionar',
      list: true,
      itemFields: [
        { key: 'name', label: 'Nome do certificado', type: 'text', required: true, minLength: 3, tip: 'Nome oficial como aparece no certificado.' },
        { key: 'issuer', label: 'Emissor', type: 'text', required: true, minLength: 2, tip: 'Ex: AWS, Google, Coursera, Microsoft' },
        { key: 'date', label: 'Data de emissão', type: 'text', required: false, minLength: 4, tip: 'Mês/ano ou ano de emissão.' },
        { key: 'url', label: 'URL (opcional)', type: 'url', required: false, minLength: 0, tip: 'Link para verificação do certificado, se disponível.' }
      ]
    },
    {
      id: 'projects',
      title: 'Projetos',
      linkedinHint: 'Perfil → seção "Projetos" → adicionar projeto',
      list: true,
      itemFields: [
        { key: 'name', label: 'Nome do projeto', type: 'text', required: true, minLength: 3, tip: 'Nome claro que descreva o projeto.' },
        { key: 'description', label: 'Descrição', type: 'textarea', required: true, minLength: 30, actionVerbs: true, tip: 'Descreva objetivo, sua contribuição e resultados alcançados.' },
        { key: 'url', label: 'URL (opcional)', type: 'url', required: false, minLength: 0, tip: 'Link para repositório, demo ou portfólio.' }
      ]
    },
    {
      id: 'volunteering',
      title: 'Voluntariado',
      linkedinHint: 'Perfil → seção "Voluntariado" → adicionar experiência',
      list: true,
      itemFields: [
        { key: 'organization', label: 'Organização', type: 'text', required: true, minLength: 3, tip: 'Nome da ONG, instituição ou causa.' },
        { key: 'role', label: 'Cargo / Função', type: 'text', required: true, minLength: 3, tip: 'Sua função no voluntariado.' },
        { key: 'startDate', label: 'Início', type: 'text', required: false, minLength: 4, tip: 'Período de início.' },
        { key: 'endDate', label: 'Fim', type: 'text', required: false, minLength: 0, tip: 'Deixe em branco se ainda atua.' },
        { key: 'description', label: 'Descrição', type: 'textarea', required: false, minLength: 20, actionVerbs: true, tip: 'Descreva suas contribuições e impacto gerado.' }
      ]
    },
    {
      id: 'publications',
      title: 'Publicações',
      linkedinHint: 'Perfil → seção "Publicações" → adicionar publicação',
      list: true,
      itemFields: [
        { key: 'title', label: 'Título', type: 'text', required: true, minLength: 5, tip: 'Título completo da publicação.' },
        { key: 'publisher', label: 'Publicação / Veículo', type: 'text', required: true, minLength: 2, tip: 'Revista, blog, conferência ou editora.' },
        { key: 'date', label: 'Data', type: 'text', required: false, minLength: 4, tip: 'Data de publicação.' },
        { key: 'url', label: 'URL (opcional)', type: 'url', required: false, minLength: 0, tip: 'Link para a publicação online.' }
      ]
    },
    {
      id: 'awards',
      title: 'Prêmios e Honrarias',
      linkedinHint: 'Perfil → seção "Prêmios e honrarias" → adicionar',
      list: true,
      itemFields: [
        { key: 'title', label: 'Título do prêmio', type: 'text', required: true, minLength: 3, tip: 'Nome oficial do prêmio ou honraria.' },
        { key: 'issuer', label: 'Emissor', type: 'text', required: true, minLength: 2, tip: 'Organização que concedeu o prêmio.' },
        { key: 'date', label: 'Data', type: 'text', required: false, minLength: 4, tip: 'Quando recebeu o prêmio.' },
        { key: 'description', label: 'Descrição', type: 'textarea', required: false, minLength: 10, tip: 'Contexto e motivo do reconhecimento.' }
      ]
    },
    {
      id: 'organizations',
      title: 'Organizações',
      linkedinHint: 'Perfil → seção "Organizações" → adicionar',
      list: true,
      itemFields: [
        { key: 'name', label: 'Nome da organização', type: 'text', required: true, minLength: 3, tip: 'Associação, sindicato, grupo profissional etc.' },
        { key: 'role', label: 'Cargo / Função', type: 'text', required: true, minLength: 3, tip: 'Seu papel na organização.' },
        { key: 'startDate', label: 'Início', type: 'text', required: false, minLength: 4, tip: 'Período de participação.' },
        { key: 'endDate', label: 'Fim', type: 'text', required: false, minLength: 0, tip: 'Deixe em branco se ainda participa.' }
      ]
    },
    {
      id: 'courses',
      title: 'Cursos',
      linkedinHint: 'Perfil → seção "Cursos" → adicionar curso',
      list: true,
      itemFields: [
        { key: 'name', label: 'Nome do curso', type: 'text', required: true, minLength: 3, tip: 'Nome do curso ou treinamento.' },
        { key: 'institution', label: 'Instituição', type: 'text', required: true, minLength: 2, tip: 'Plataforma ou instituição que ofereceu o curso.' },
        { key: 'date', label: 'Data de conclusão', type: 'text', required: false, minLength: 4, tip: 'Quando concluiu o curso.' }
      ]
    }
  ];

  const TEMPLATES = {
    classic: { id: 'classic', name: 'Clássico', description: 'Monocromático, limpo e profissional' },
    modern: { id: 'modern', name: 'Moderno', description: 'Barra lateral colorida com destaque visual' }
  };

  const STORAGE_KEY = 'eugero-curriculo-state';
  const APP_VERSION = '1.0.0';

  function createEmptyState() {
    return {
      version: APP_VERSION,
      template: 'classic',
      currentStep: 0,
      personal: { fullName: '', headline: '', email: '', phone: '', location: '', linkedinUrl: '' },
      summary: '',
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

  function createEmptyListItem(sectionId) {
    const section = SECTIONS.find(s => s.id === sectionId);
    if (!section || !section.itemFields) return {};
    const item = {};
    section.itemFields.forEach(f => { item[f.key] = ''; });
    return item;
  }

  return {
    ACTION_VERBS,
    SECTIONS,
    TEMPLATES,
    STORAGE_KEY,
    APP_VERSION,
    createEmptyState,
    createEmptyListItem
  };
})();
