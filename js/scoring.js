/**
 * Módulo puro de pontuação por campo — testável sem DOM.
 */
const EuGeroScoring = (function () {
  const LABELS = { fraco: 'Fraco', bom: 'Bom', otimo: 'Ótimo' };
  const SCORE_VALUES = { fraco: 0, bom: 1, otimo: 2 };

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

  /**
   * Avalia um campo individual.
   * @param {string} value - Valor do campo
   * @param {object} fieldConfig - { required, minLength, actionVerbs }
   * @param {string[]} actionVerbs - Lista de verbos de ação
   * @returns {'fraco'|'bom'|'otimo'}
   */
  function scoreField(value, fieldConfig, actionVerbs) {
    const trimmed = typeof value === 'string' ? value.trim() : value;
    const required = fieldConfig.required === true;
    const minLength = fieldConfig.minLength || 0;
    const needsVerbs = fieldConfig.actionVerbs === true;

    if (required && isEmpty(trimmed)) {
      return 'fraco';
    }

    if (!required && isEmpty(trimmed)) {
      return 'otimo';
    }

    const text = String(trimmed);
    const lengthOk = text.length >= minLength;
    const verbOk = !needsVerbs || hasActionVerb(text, actionVerbs);

    if (!lengthOk) {
      return 'fraco';
    }

    if (needsVerbs) {
      if (verbOk && text.length >= minLength * 1.5) {
        return 'otimo';
      }
      if (verbOk || text.length >= minLength * 1.2) {
        return 'bom';
      }
      return 'fraco';
    }

    if (text.length >= minLength * 1.5) {
      return 'otimo';
    }
    if (lengthOk) {
      return 'bom';
    }
    return 'fraco';
  }

  /**
   * Avalia um item de lista (média dos campos preenchidos).
   */
  function scoreListItem(item, itemFields, actionVerbs) {
    const scores = itemFields
      .filter(f => {
        const val = item[f.key];
        return !isEmpty(val) || f.required;
      })
      .map(f => scoreField(item[f.key] || '', f, actionVerbs));

    if (scores.length === 0) return 'otimo';
    if (scores.includes('fraco')) return 'fraco';
    if (scores.every(s => s === 'otimo')) return 'otimo';
    return 'bom';
  }

  /**
   * Pontuação geral do estado do formulário.
   */
  function scoreState(state, sections, actionVerbs) {
    const results = [];

    sections.forEach(section => {
      if (section.list) {
        const items = state[section.id] || [];
        if (items.length === 0) return;

        items.forEach((item, index) => {
          section.itemFields.forEach(field => {
            const value = item[field.key] || '';
            if (isEmpty(value) && !field.required) return;
            results.push({
              sectionId: section.id,
              sectionTitle: section.title,
              fieldKey: field.key,
              fieldLabel: field.label,
              itemIndex: index,
              score: scoreField(value, field, actionVerbs),
              displayName: items.length > 1
                ? `${field.label} (${section.title} #${index + 1})`
                : `${field.label} (${section.title})`
            });
          });
        });
      } else {
        section.fields.forEach(field => {
          let value;
          if (section.id === 'personal') {
            value = (state.personal || {})[field.key] || '';
          } else if (section.id === 'summary') {
            value = state.summary || '';
          } else if (section.id === 'skills') {
            value = state.skillsText || (typeof EuGeroConfig !== 'undefined' ? EuGeroConfig.skillsToText(state) : '');
          } else {
            value = state[section.id] || '';
          }

          if (isEmpty(value) && !field.required) return;

          results.push({
            sectionId: section.id,
            sectionTitle: section.title,
            fieldKey: field.key,
            fieldLabel: field.label,
            itemIndex: null,
            score: scoreField(value, field, actionVerbs),
            displayName: `${field.label} (${section.title})`
          });
        });
      }
    });

    return results;
  }

  /** Limite aproximado de caracteres para currículo de uma página A4. */
  const PAGE_CHAR_SOFT_LIMIT = 3200;
  const PAGE_CHAR_HARD_LIMIT = 4200;
  const PAGE_MAX_EXPERIENCES = 4;
  const PAGE_MAX_LIST_ITEMS = 12;

  function listItemHasContent(item, fields) {
    return fields.some(f => !isEmpty(item[f.key]));
  }

  function countFilledListItems(state, section) {
    const items = state[section.id] || [];
    return items.filter(item => listItemHasContent(item, section.itemFields || [])).length;
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

  /**
   * Avalia se o conteúdo cabe em uma página — currículos devem ser concisos.
   * @returns {{ level: 'ok'|'warning'|'overflow', fitScore: number, issues: string[], metrics: object }}
   */
  function scorePageFit(state, sections) {
    const metrics = estimateContentVolume(state, sections);
    const issues = [];
    let level = 'ok';

    if (metrics.totalChars >= PAGE_CHAR_HARD_LIMIT) {
      level = 'overflow';
      issues.push(`Texto muito extenso (${metrics.totalChars} caracteres) — risco alto de ultrapassar 1 página`);
    } else if (metrics.totalChars >= PAGE_CHAR_SOFT_LIMIT) {
      level = level === 'overflow' ? level : 'warning';
      issues.push(`Conteúdo denso (${metrics.totalChars} caracteres) — pode não caber em 1 página`);
    }

    if (metrics.experienceCount > PAGE_MAX_EXPERIENCES) {
      level = 'overflow';
      issues.push(`Muitas experiências (${metrics.experienceCount}) — ideal até ${PAGE_MAX_EXPERIENCES} para 1 página`);
    } else if (metrics.experienceCount === PAGE_MAX_EXPERIENCES) {
      if (level === 'ok') level = 'warning';
      issues.push(`Limite de experiências para 1 página (${PAGE_MAX_EXPERIENCES})`);
    }

    if (metrics.listItems > PAGE_MAX_LIST_ITEMS) {
      level = 'overflow';
      issues.push(`Muitos itens em listas (${metrics.listItems}) — resuma ou remova seções opcionais`);
    } else if (metrics.listItems > PAGE_MAX_LIST_ITEMS - 3 && level === 'ok') {
      level = 'warning';
      issues.push('Volume alto de itens — considere enxugar seções');
    }

    const optionalSections = sections.filter(s => !['personal', 'summary', 'experiences', 'education', 'skills'].includes(s.id));
    if (optionalSections.length >= 4 && metrics.totalChars > PAGE_CHAR_SOFT_LIMIT * 0.7) {
      level = level === 'ok' ? 'warning' : level;
      issues.push('Várias seções opcionais + conteúdo extenso dificultam caber em 1 página');
    }

    const charRatio = Math.min(1, metrics.totalChars / PAGE_CHAR_HARD_LIMIT);
    const listRatio = Math.min(1, metrics.listItems / PAGE_MAX_LIST_ITEMS);
    const fitScore = Math.max(0, Math.round(100 - (charRatio * 55 + listRatio * 45)));

    return { level, fitScore, issues, metrics };
  }

  function aggregateScore(results, pageFit) {
    if (results.length === 0) {
      const base = { overall: 0, label: 'Fraco', weakFields: [], total: 0, scored: 0 };
      if (pageFit) return { ...base, pageFit };
      return base;
    }

    const total = results.length;
    const sum = results.reduce((acc, r) => acc + SCORE_VALUES[r.score], 0);
    let overall = Math.round((sum / (total * 2)) * 100);
    const weakFields = results.filter(r => r.score === 'fraco');

    if (pageFit) {
      if (pageFit.level === 'overflow') {
        overall = Math.min(overall, Math.min(pageFit.fitScore, 45));
      } else if (pageFit.level === 'warning') {
        overall = Math.min(overall, Math.round((overall + pageFit.fitScore) / 2));
      }
    }

    let label = 'Bom';
    if (overall >= 75) label = 'Ótimo';
    else if (overall < 50) label = 'Fraco';

    const out = { overall, label, weakFields, total, scored: total };
    if (pageFit) out.pageFit = pageFit;
    return out;
  }

  function getLabelText(score) {
    return LABELS[score] || score;
  }

  return {
    LABELS,
    SCORE_VALUES,
    PAGE_CHAR_SOFT_LIMIT,
    PAGE_CHAR_HARD_LIMIT,
    isEmpty,
    hasActionVerb,
    scoreField,
    scoreListItem,
    scoreState,
    estimateContentVolume,
    scorePageFit,
    aggregateScore,
    getLabelText
  };
})();
