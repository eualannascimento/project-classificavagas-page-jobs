/**
 * Pontuacao por qualidade - alinhada a CV de 1 pagina.
 */
const EuGeroScoring = (function () {
  const LABELS = { fraco: 'Fraco', bom: 'Bom', otimo: 'Ótimo' };
  const SCORE_VALUES = { fraco: 0, bom: 1, otimo: 2 };

  const CRITERIA_LEGEND = [
    'Fraco: vazio, invalido ou sem evidencia de impacto.',
    'Bom: preenchido com clareza; pode incluir verbo de acao ou dado numerico.',
    'Otimo: conciso, com verbo de acao e resultado mensuravel na faixa ideal.',
    'Textos curtos e objetivos nao sao penalizados se forem claros e com impacto.',
    'Textos muito longos reduzem a nota (meta: caber em 1 pagina A4).'
  ];

  const PROFILES = {
    summary: { idealMin: 80, idealMax: 550, hardMax: 750, needsVerbs: true },
    description: { idealMin: 40, idealMax: 260, hardMax: 380, needsVerbs: true },
    default: { idealMin: 3, idealMax: 120, hardMax: 200, needsVerbs: false },
    skills: { idealMin: 2, idealMax: 180, hardMax: 260, needsVerbs: false }
  };

  function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  function hasActionVerb(text, verbs) {
    if (!text || typeof text !== 'string') return false;
    const lower = text.toLowerCase();
    return verbs.some(verb => lower.includes(verb.toLowerCase()));
  }

  function hasQuantifiedResult(text) {
    if (!text) return false;
    return /\d/.test(text);
  }

  function getProfile(fieldConfig) {
    if (fieldConfig.actionVerbs) {
      if (fieldConfig.key === 'summary') return PROFILES.summary;
      return PROFILES.description;
    }
    if (fieldConfig.key === 'skillsText') return PROFILES.skills;
    return PROFILES.default;
  }

  function scoreLengthTier(len, profile) {
    if (len > profile.hardMax) return 'long';
    if (len > profile.idealMax) return 'over';
    if (len >= profile.idealMin) return 'ideal';
    if (len >= Math.max(1, Math.floor(profile.idealMin * 0.5))) return 'short';
    return 'tooShort';
  }

  function scoreField(value, fieldConfig, actionVerbs) {
    const trimmed = typeof value === 'string' ? value.trim() : value;
    const required = fieldConfig.required === true;
    const minLength = fieldConfig.minLength || 0;

    if (required && isEmpty(trimmed)) return 'fraco';
    if (!required && isEmpty(trimmed)) return 'otimo';

    const text = String(trimmed);
    if (text.length < minLength && minLength > 0) return 'fraco';

    const profile = getProfile(fieldConfig);
    const tier = scoreLengthTier(text.length, profile);
    const verb = hasActionVerb(text, actionVerbs);
    const metric = hasQuantifiedResult(text);

    if (tier === 'long') return 'fraco';
    if (tier === 'over') return 'bom';

    if (profile.needsVerbs) {
      if ((verb && metric) || (verb && tier === 'ideal')) return 'otimo';
      if (verb || metric || tier === 'ideal') return 'bom';
      if (tier === 'short' && text.length >= minLength) return 'bom';
      return 'fraco';
    }

    if (tier === 'ideal') return metric ? 'otimo' : 'bom';
    if (tier === 'short') return 'bom';
    return 'bom';
  }

  function scoreListItem(item, itemFields, actionVerbs) {
    const scores = itemFields
      .filter(f => !isEmpty(item[f.key]) || f.required)
      .map(f => scoreField(item[f.key] || '', f, actionVerbs));

    if (scores.length === 0) return 'otimo';
    if (scores.includes('fraco')) return 'fraco';
    if (scores.every(s => s === 'otimo')) return 'otimo';
    return 'bom';
  }

  function scoreState(state, sections, actionVerbs) {
    const results = [];

    sections.forEach(section => {
      if (section.list) {
        (state[section.id] || []).forEach((item, index) => {
          section.itemFields.forEach(field => {
            const value = item[field.key] || '';
            if (isEmpty(value) && !field.required) return;
            results.push({
              sectionId: section.id,
              fieldKey: field.key,
              itemIndex: index,
              score: scoreField(value, field, actionVerbs),
              displayName: (state[section.id].length > 1)
                ? `${field.label} (${section.title} #${index + 1})`
                : `${field.label} (${section.title})`
            });
          });
        });
      } else {
        section.fields.forEach(field => {
          let value;
          if (section.id === 'personal') value = (state.personal || {})[field.key] || '';
          else if (section.id === 'summary') value = state.summary || '';
          else if (section.id === 'skills') {
            value = state.skillsText || (typeof EuGeroConfig !== 'undefined' ? EuGeroConfig.skillsToText(state) : '');
          } else value = state[field.key] || '';

          if (isEmpty(value) && !field.required) return;

          results.push({
            sectionId: section.id,
            fieldKey: field.key,
            itemIndex: null,
            score: scoreField(value, field, actionVerbs),
            displayName: `${field.label} (${section.title})`
          });
        });
      }
    });

    return results;
  }

  const PAGE_CHAR_SOFT_LIMIT = 3200;
  const PAGE_CHAR_HARD_LIMIT = 4200;
  const PAGE_MAX_EXPERIENCES = 4;
  const PAGE_MAX_LIST_ITEMS = 12;

  function listItemHasContent(item, fields) {
    return fields.some(f => !isEmpty(item[f.key]));
  }

  function countFilledListItems(state, section) {
    return (state[section.id] || []).filter(item => listItemHasContent(item, section.itemFields || [])).length;
  }

  function estimateContentVolume(state, sections) {
    let totalChars = 0;
    let listItems = 0;
    let experienceCount = 0;

    sections.forEach(section => {
      if (section.list) {
        const count = countFilledListItems(state, section);
        listItems += count;
        if (section.id === 'experiences') experienceCount = count;
        (state[section.id] || []).forEach(item => {
          (section.itemFields || []).forEach(field => {
            const val = item[field.key];
            if (!isEmpty(val)) totalChars += String(val).trim().length;
          });
        });
      } else if (section.fields) {
        section.fields.forEach(field => {
          let value = '';
          if (section.id === 'personal') value = (state.personal || {})[field.key] || '';
          else if (section.id === 'summary') value = state.summary || '';
          else if (section.id === 'skills') {
            value = state.skillsText || (typeof EuGeroConfig !== 'undefined' ? EuGeroConfig.skillsToText(state) : '');
          } else value = state[field.key] || '';
          if (!isEmpty(value)) totalChars += String(value).trim().length;
        });
      }
    });

    return { totalChars, listItems, experienceCount, sectionCount: sections.length };
  }

  function scorePageFit(state, sections) {
    const metrics = estimateContentVolume(state, sections);
    const issues = [];
    let level = 'ok';

    if (metrics.totalChars >= PAGE_CHAR_HARD_LIMIT) {
      level = 'overflow';
      issues.push(`Texto muito extenso (${metrics.totalChars} caracteres) - risco alto de ultrapassar 1 pagina`);
    } else if (metrics.totalChars >= PAGE_CHAR_SOFT_LIMIT) {
      level = 'warning';
      issues.push(`Conteudo denso (${metrics.totalChars} caracteres) - pode nao caber em 1 pagina`);
    }

    if (metrics.experienceCount > PAGE_MAX_EXPERIENCES) {
      level = 'overflow';
      issues.push(`Muitas experiencias (${metrics.experienceCount}) - ideal ate ${PAGE_MAX_EXPERIENCES}`);
    }

    if (metrics.listItems > PAGE_MAX_LIST_ITEMS) {
      level = 'overflow';
      issues.push(`Muitos itens em listas (${metrics.listItems})`);
    }

    const charRatio = Math.min(1, metrics.totalChars / PAGE_CHAR_HARD_LIMIT);
    const listRatio = Math.min(1, metrics.listItems / PAGE_MAX_LIST_ITEMS);
    const fitScore = Math.max(0, Math.round(100 - (charRatio * 55 + listRatio * 45)));

    return { level, fitScore, issues, metrics };
  }

  function aggregateScore(results, pageFit) {
    if (results.length === 0) {
      const base = { overall: 0, label: 'Fraco', weakFields: [], total: 0, scored: 0 };
      return pageFit ? { ...base, pageFit } : base;
    }

    const sum = results.reduce((acc, r) => acc + SCORE_VALUES[r.score], 0);
    let overall = Math.round((sum / (results.length * 2)) * 100);
    const weakFields = results.filter(r => r.score === 'fraco');

    if (pageFit) {
      if (pageFit.level === 'overflow') overall = Math.min(overall, Math.min(pageFit.fitScore, 45));
      else if (pageFit.level === 'warning') overall = Math.min(overall, Math.round((overall + pageFit.fitScore) / 2));
    }

    let label = 'Bom';
    if (overall >= 75) label = 'Ótimo';
    else if (overall < 50) label = 'Fraco';

    const out = { overall, label, weakFields, total: results.length, scored: results.length };
    if (pageFit) out.pageFit = pageFit;
    return out;
  }

  function getLabelText(score) {
    return LABELS[score] || score;
  }

  return {
    LABELS,
    SCORE_VALUES,
    CRITERIA_LEGEND,
    PAGE_CHAR_SOFT_LIMIT,
    PAGE_CHAR_HARD_LIMIT,
    isEmpty,
    hasActionVerb,
    hasQuantifiedResult,
    scoreField,
    scoreListItem,
    scoreState,
    estimateContentVolume,
    scorePageFit,
    aggregateScore,
    getLabelText
  };
})();
