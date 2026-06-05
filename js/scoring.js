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

  function aggregateScore(results) {
    if (results.length === 0) {
      return { overall: 0, label: 'Fraco', weakFields: [], total: 0, scored: 0 };
    }

    const total = results.length;
    const sum = results.reduce((acc, r) => acc + SCORE_VALUES[r.score], 0);
    const overall = Math.round((sum / (total * 2)) * 100);
    const weakFields = results.filter(r => r.score === 'fraco');

    let label = 'Bom';
    if (overall >= 75) label = 'Ótimo';
    else if (overall < 50) label = 'Fraco';

    return { overall, label, weakFields, total, scored: total };
  }

  function getLabelText(score) {
    return LABELS[score] || score;
  }

  return {
    LABELS,
    SCORE_VALUES,
    isEmpty,
    hasActionVerb,
    scoreField,
    scoreListItem,
    scoreState,
    aggregateScore,
    getLabelText
  };
})();
