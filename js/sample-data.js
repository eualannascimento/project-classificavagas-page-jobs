/**
 * Dados de exemplo para demonstracao do fluxo (igual ao modelo de referencia).
 */
const EuGeroSampleData = (function () {
  'use strict';

  function build() {
    return {
      template: 'classic',
      enabledSections: ['personal', 'summary', 'experiences', 'education', 'skills', 'languages'],
      personal: {
        fullName: 'Rafael Nunes',
        headline: 'Jovem Aprendiz / Auxiliar Administrativo',
        email: 'rafael.nunes@email.com',
        phone: '(21) 99999-0000',
        location: 'Rio de Janeiro, RJ',
        linkedinUrl: ''
      },
      summary: 'Tenho 18 anos e busco minha primeira oportunidade formal. Sou comunicativo, aprendo rápido e já ajudei no comércio da família e em projetos da escola. Tenho facilidade com computador e gosto de atendimento ao público.',
      skillsText: 'Atendimento ao cliente; Informática básica; Trabalho em equipe; Organização; Comunicação; Proatividade',
      experiences: [
        {
          company: 'Lanchonete do Seu Zé',
          title: 'Atendente (fins de semana)',
          period: '2023 - 2024',
          startDate: '',
          endDate: '',
          endCurrent: false,
          description: 'Atendi clientes no balcão e no caixa, organizei os pedidos nos horários de pico e ajudei a controlar o estoque de bebidas.'
        },
        {
          company: 'Projeto Reforço na Praça',
          title: 'Monitor voluntário',
          period: '2022 - 2023',
          startDate: '',
          endDate: '',
          endCurrent: false,
          description: 'Dei reforço de matemática para 12 crianças e organizei o material de estudo toda semana.'
        }
      ],
      education: [{
        institution: 'Colégio Estadual Brasil',
        degree: 'Ensino Médio completo',
        period: '2024',
        startDate: '',
        endDate: '',
        endCurrent: false
      }],
      languages: [
        { language: 'Português', level: 'Nativo' },
        { language: 'Inglês', level: 'Básico' }
      ],
      certifications: [
        { name: 'Informática Básica (Word, Excel e Internet)', issuer: 'Fundação Bradesco', year: '2023' },
        { name: 'Atendimento ao Cliente', issuer: 'Senac (curso livre)', year: '2024' }
      ],
      projects: [{
        name: 'Feira de empreendedorismo da escola',
        description: 'Montei e cuidei da barraca de doces com dois colegas: organizei o caixa e as vendas do dia, com lucro de R$ 300.',
        url: ''
      }]
    };
  }

  return { build };
})();
