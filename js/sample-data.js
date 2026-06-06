/**
 * Dados de exemplo para demonstracao do fluxo.
 */
const EuGeroSampleData = (function () {
  'use strict';

  function build() {
    return {
      template: 'modern',
      enabledSections: ['personal', 'summary', 'experiences', 'education', 'skills'],
      personal: {
        fullName: 'Ana Silva',
        headline: 'Analista de Produto | UX e dados',
        email: 'ana.silva@email.com',
        phone: '(11) 98765-4321',
        location: 'Sao Paulo, SP',
        linkedinUrl: 'https://linkedin.com/in/ana-silva-exemplo'
      },
      summary: 'Profissional de produto com 6 anos de experiencia. Liderei squads que aumentaram retencao em 18% e reduziram tempo de onboarding em 30%. Busco oportunidades em empresas orientadas a dados.',
      skillsText: 'Product Discovery; Figma; SQL; Roadmap; Metricas',
      experiences: [{
        company: 'Tech Brasil',
        title: 'Analista de Produto Pleno',
        startDate: '2021-03',
        endDate: '',
        endCurrent: true,
        description: 'Priorizei backlog com OKRs, conduzi 12 entrevistas com usuarios por trimestre e lancei funcionalidades que elevaram NPS de 42 para 51.'
      }],
      education: [{
        institution: 'Universidade Exemplo',
        degree: 'Administracao',
        startDate: '2014-02',
        endDate: '2018-12',
        endCurrent: false
      }],
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

  return { build };
})();
