/**
 * Geração de prompts para IA externa - módulo puro testável.
 */
const EuGeroPrompts = (function () {
  const SECTION_PROMPTS = {
    personal: 'Revise meus dados pessoais para o currículo e o LinkedIn. Sugira um título profissional claro, uma apresentação adequada dos contatos e melhorias para a URL do LinkedIn.',
    summary: 'Ajude a escrever um resumo profissional curto, com duas ou três frases, destacando experiência, habilidades, objetivo e proposta de valor. Não invente informações.',
    experiences: 'Ajude a melhorar as descrições das minhas experiências. Use verbos de ação, destaque responsabilidades e inclua resultados mensuráveis apenas quando houver dados suficientes.',
    education: 'Ajude a organizar minha formação acadêmica, incluindo curso, instituição, período e informações relevantes já fornecidas.',
    skills: 'Sugira habilidades técnicas e comportamentais coerentes com meu perfil e com o cargo desejado. Separe sugestões confirmadas das que precisam ser validadas por mim.',
    languages: 'Ajude a apresentar meus idiomas e níveis de proficiência de forma clara e adequada ao currículo e ao LinkedIn.',
    certifications: 'Ajude a organizar minhas certificações e cursos, com nome, instituição e ano de conclusão.',
    projects: 'Ajude a descrever meus projetos, destacando objetivo, participação, tecnologias e resultados já informados.',
    volunteering: 'Ajude-me a descrever minhas experiências de Voluntariado de forma impactante para currículo.',
    publications: 'Ajude-me a formatar minhas Publicações para perfil LinkedIn e currículo.',
    awards: 'Ajude-me a descrever meus Prêmios e Honrarias de forma profissional.',
    organizations: 'Ajude-me a listar minhas participações em Organizações profissionais.',
    courses: 'Ajude-me a formatar meus Cursos complementares para currículo e LinkedIn.'
  };

  const GENERAL_INTRO = `Atue como especialista em recrutamento e otimização de currículos para o mercado brasileiro.

Ajude a revisar e melhorar meu currículo e meu perfil no LinkedIn.

Siga estas orientações:
- use verbos de ação em português;
- inclua resultados mensuráveis sempre que houver informações suficientes;
- escreva de forma clara, concisa e profissional;
- adapte o conteúdo ao cargo desejado;
- organize a resposta pelas seções do currículo;
- não invente experiências, resultados ou qualificações.`;

  const TRANSLATION_INTRO = `Traduza meu currículo do português para um inglês profissional e natural.

Mantenha a organização por seções, adapte corretamente os termos técnicos e preserve os nomes de empresas e instituições.

Use verbos de ação adequados ao contexto e não acrescente informações que não estejam no texto original.

Apresente a tradução seção por seção.`;

  function formatPersonalData(state) {
    const p = state.personal || {};
    return `Nome: ${p.fullName || '(não preenchido)'}
Cargo desejado: ${p.headline || '(não preenchido)'}
E-mail: ${p.email || '(não preenchido)'}
Telefone: ${p.phone || '(não preenchido)'}
Localização: ${p.location || '(não preenchido)'}
LinkedIn: ${p.linkedinUrl || '(não preenchido)'}`;
  }

  function formatListSection(items, formatter) {
    if (!items || items.length === 0) return '(não preenchido)';
    return items.map((item, i) => `--- Item ${i + 1} ---\n${formatter(item)}`).join('\n\n');
  }

  function formatStateData(state) {
    const parts = [];

    parts.push(`## Dados Pessoais\n${formatPersonalData(state)}`);

    if (state.summary) {
      parts.push(`## Resumo/Sobre\n${state.summary}`);
    }

    if (state.experiences?.length) {
      parts.push(`## Experiências\n${formatListSection(state.experiences, e =>
        `Cargo: ${e.title}\nOnde: ${e.company}\nPeríodo: ${e.period || `${e.startDate || ''} - ${e.endDate || 'Atual'}`}\nDescrição: ${e.description}`
      )}`);
    }

    if (state.education?.length) {
      parts.push(`## Formação\n${formatListSection(state.education, e =>
        `Curso: ${e.degree}\nInstituição: ${e.institution}\nPeríodo: ${e.period || `${e.startDate || ''} - ${e.endDate || ''}`}`
      )}`);
    }

    const skills = EuGeroConfig.getSkillsFromState(state);
    if (skills.length) {
      parts.push(`## Habilidades\n${skills.map(s => s.name || s).filter(Boolean).join(', ')}`);
    }

    if (state.languages?.length) {
      parts.push(`## Idiomas\n${formatListSection(state.languages, l =>
        `${l.language}: ${l.level}`
      )}`);
    }

    if (state.certifications?.length) {
      parts.push(`## Certificados\n${formatListSection(state.certifications, c =>
        `${c.name} - ${c.issuer} (${c.year || c.date || ''})`
      )}`);
    }

    if (state.projects?.length) {
      parts.push(`## Projetos\n${formatListSection(state.projects, p =>
        `${p.name}: ${p.description}`
      )}`);
    }

    if (state.volunteering?.length) {
      parts.push(`## Voluntariado\n${formatListSection(state.volunteering, v =>
        `${v.organization} - ${v.role}: ${v.description || ''}`
      )}`);
    }

    if (state.publications?.length) {
      parts.push(`## Publicações\n${formatListSection(state.publications, p =>
        `"${p.title}" - ${p.publisher} (${p.date || ''})`
      )}`);
    }

    if (state.awards?.length) {
      parts.push(`## Prêmios\n${formatListSection(state.awards, a =>
        `${a.title} - ${a.issuer}: ${a.description || ''}`
      )}`);
    }

    if (state.organizations?.length) {
      parts.push(`## Organizações\n${formatListSection(state.organizations, o =>
        `${o.name} - ${o.role}`
      )}`);
    }

    if (state.courses?.length) {
      parts.push(`## Cursos\n${formatListSection(state.courses, c =>
        `${c.name} - ${c.institution} (${c.date || ''})`
      )}`);
    }

    return parts.join('\n\n');
  }

  function formatSectionData(sectionId, state) {
    switch (sectionId) {
      case 'personal':
        return formatPersonalData(state);
      case 'summary':
        return state.summary || '(não preenchido)';
      case 'skills':
        return EuGeroConfig.skillsToText(state) || '(não preenchido)';
      default:
        if (Array.isArray(state[sectionId])) {
          const section = EuGeroConfig.SECTIONS.find(s => s.id === sectionId);
          if (!section) return '(não preenchido)';
          return formatListSection(state[sectionId], item =>
            section.itemFields.map(f => `${f.label}: ${item[f.key] || ''}`).join('\n')
          );
        }
        return '(não preenchido)';
    }
  }

  function buildGeneralPrompt(state, includeData) {
    let prompt = GENERAL_INTRO;
    if (includeData) {
      prompt += '\n\n--- MEUS DADOS ATUAIS ---\n\n' + formatStateData(state);
    } else {
      prompt += '\n\n(Não incluí meus dados pessoais. Forneça sugestões genéricas baseadas nas informações que eu fornecer em seguida.)';
    }
    return prompt;
  }

  function buildSectionPrompt(sectionId, state, includeData) {
    const label = EuGeroConfig.SECTION_LABELS?.[sectionId]
      || EuGeroConfig.SECTIONS.find(s => s.id === sectionId)?.title
      || 'esta seção';
    const instruction = SECTION_PROMPTS[sectionId] || 'Ajude-me com esta seção do currículo.';
    let prompt = `Estou preenchendo a seção “${label}” do meu currículo.\n\n${instruction}\n\nRevise o conteúdo para deixá-lo claro, curto e profissional. Use verbos de ação e destaque resultados quando houver dados suficientes. Não invente informações. Caso falte algo importante, faça perguntas objetivas antes de sugerir a versão final. Apresente textos prontos para copiar e colar.`;
    if (includeData) {
      prompt += '\n\n--- MEU CURRÍCULO COMPLETO ATÉ AGORA (foque na seção "' + label + '", mas use o restante como contexto) ---\n\n' + formatStateData(state);
    } else {
      prompt += '\n\n(Não incluí meus dados. Aguardo fornecer as informações necessárias.)';
    }
    return prompt;
  }

  function buildTranslationPrompt(state, includeData) {
    let prompt = TRANSLATION_INTRO;
    if (includeData) {
      prompt += '\n\n--- CURRÍCULO EM PORTUGUÊS ---\n\n' + formatStateData(state);
    } else {
      prompt += '\n\n(Preciso fornecer o conteúdo do currículo em português para tradução.)';
    }
    return prompt;
  }

  function containsPersonalData(prompt) {
    const patterns = [
      /@\w+\.\w+/,
      /\+?\d{10,}/,
      /linkedin\.com/i,
      /MEUS DADOS/i,
      /CURRÍCULO EM PORTUGUÊS/i
    ];
    return patterns.some(p => p.test(prompt));
  }

  return {
    SECTION_PROMPTS,
    buildGeneralPrompt,
    buildSectionPrompt,
    buildTranslationPrompt,
    formatStateData,
    formatSectionData,
    containsPersonalData
  };
})();
