/**
 * Eu Gero Meu Currículo — aplicação principal.
 */
(function () {
  'use strict';

  const {
    SECTIONS, TEMPLATES, ACTION_VERBS, createEmptyState, createEmptyListItem,
    getActiveSections, normalizeEnabledSections, isSectionMandatory, skillsToText, SHORT_LABELS
  } = EuGeroConfig;

  let state = EuGeroStorage.load();
  let currentView = 'start'; // start | wizard | review | guide

  const els = {};

  function init() {
    cacheElements();
    bindGlobalEvents();
    restoreView();
    render();
  }

  function cacheElements() {
    els.screenStart = document.getElementById('screen-start');
    els.screenWizard = document.getElementById('screen-wizard');
    els.screenReview = document.getElementById('screen-review');
    els.screenGuide = document.getElementById('screen-guide');
    els.wizardSteps = document.getElementById('wizard-steps');
    els.wizardTimeline = document.getElementById('wizard-timeline');
    els.sectionChecklist = document.getElementById('section-checklist');
    els.reviewContent = document.getElementById('review-content');
    els.guideContent = document.getElementById('guide-content');
    els.modalPrompt = document.getElementById('modal-prompt');
    els.promptText = document.getElementById('prompt-text');
    els.modalTemplate = document.getElementById('modal-template');
    els.fileImport = document.getElementById('file-import');
    els.toast = document.getElementById('toast');
    els.previewOverlay = document.getElementById('preview-overlay');
    els.headerActions = document.getElementById('header-actions-wizard');
  }

  function activeSections() {
    return getActiveSections(state.enabledSections);
  }

  function bindGlobalEvents() {
    document.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => pickTemplate(card.dataset.template));
    });

    document.getElementById('btn-start-wizard')?.addEventListener('click', startWizard);
    document.getElementById('btn-change-template-wizard')?.addEventListener('click', () => openModal(els.modalTemplate));
    document.getElementById('btn-prev')?.addEventListener('click', prevStep);
    document.getElementById('btn-next')?.addEventListener('click', nextStep);
    document.getElementById('btn-back-wizard')?.addEventListener('click', () => goToWizard());
    document.getElementById('btn-guide')?.addEventListener('click', goToGuide);
    document.getElementById('btn-back-review')?.addEventListener('click', goToReview);
    document.getElementById('btn-back-start')?.addEventListener('click', goToStart);

    document.getElementById('btn-export-json')?.addEventListener('click', exportJson);
    document.getElementById('btn-export-json-review')?.addEventListener('click', exportJson);
    document.getElementById('btn-import-json')?.addEventListener('click', () => els.fileImport.click());
    document.getElementById('btn-import-json-review')?.addEventListener('click', () => els.fileImport.click());
    document.getElementById('btn-import-start')?.addEventListener('click', () => els.fileImport.click());
    els.fileImport?.addEventListener('change', handleImport);

    document.getElementById('btn-prompt-general')?.addEventListener('click', () => showPrompt('general'));
    document.getElementById('btn-prompt-general-review')?.addEventListener('click', () => showPrompt('general'));
    document.getElementById('btn-prompt-translation')?.addEventListener('click', () => showPrompt('translation'));
    document.getElementById('btn-prompt-translation-guide')?.addEventListener('click', () => showPrompt('translation'));
    document.getElementById('btn-copy-prompt')?.addEventListener('click', copyPrompt);

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
    });

    document.querySelectorAll('.modal-template-option').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTemplate(btn.dataset.template);
        closeModal(els.modalTemplate);
      });
    });

    document.getElementById('btn-toggle-preview')?.addEventListener('click', togglePreviewOverlay);
    document.getElementById('btn-close-preview')?.addEventListener('click', closePreviewOverlay);

    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', e => {
        if (e.target === modal) closeModal(modal);
      });
    });
  }

  function restoreView() {
    if (state.personal?.fullName || state.currentStep > 0) {
      currentView = 'wizard';
    }
  }

  function saveState() {
    state.enabledSections = normalizeEnabledSections(state.enabledSections);
    state.skills = EuGeroConfig.parseSkillsText(state.skillsText);
    EuGeroStorage.save(state);
  }

  function pickTemplate(templateId) {
    state.template = templateId;
    document.querySelectorAll('.template-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.template === templateId);
    });
    updateTemplateIndicators();
    updateAllPreviews();
    saveState();
  }

  function startWizard() {
    state.currentStep = 0;
    currentView = 'wizard';
    saveState();
    render();
  }

  function goToStart() {
    currentView = 'start';
    saveState();
    render();
  }

  function switchTemplate(templateId) {
    state.template = templateId;
    document.querySelectorAll('.template-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.template === templateId);
    });
    saveState();
    updateTemplateIndicators();
    updateAllPreviews();
    showToast(`Template alterado para ${TEMPLATES[templateId].name}`);
  }

  function updateTemplateIndicators() {
    document.querySelectorAll('[data-current-template]').forEach(el => {
      el.textContent = TEMPLATES[state.template]?.name || 'Clássico';
    });
  }

  function toggleSection(sectionId, checked) {
    if (isSectionMandatory(sectionId)) return;
    let enabled = [...state.enabledSections];
    if (checked && !enabled.includes(sectionId)) {
      enabled.push(sectionId);
    } else if (!checked) {
      enabled = enabled.filter(id => id !== sectionId);
    }
    state.enabledSections = normalizeEnabledSections(enabled);
    const maxStep = activeSections().length - 1;
    if (state.currentStep > maxStep) state.currentStep = Math.max(0, maxStep);
    saveState();
    renderSectionChecklist();
    updateAllPreviews();
  }

  function goToStep(stepIndex) {
    const sections = activeSections();
    if (stepIndex < 0 || stepIndex >= sections.length) return;
    state.currentStep = stepIndex;
    saveState();
    renderWizardStep();
  }

  function prevStep() {
    if (state.currentStep > 0) {
      state.currentStep--;
      saveState();
      renderWizardStep();
    }
  }

  function nextStep() {
    const sections = activeSections();
    if (state.currentStep < sections.length - 1) {
      state.currentStep++;
      saveState();
      renderWizardStep();
    } else {
      goToReview();
    }
  }

  function goToWizard(step) {
    currentView = 'wizard';
    if (typeof step === 'number') {
      const sections = activeSections();
      state.currentStep = Math.min(step, sections.length - 1);
    }
    saveState();
    render();
  }

  function goToReview() {
    currentView = 'review';
    saveState();
    render();
  }

  function goToGuide() {
    currentView = 'guide';
    saveState();
    render();
  }

  function showView(view) {
    els.screenStart.hidden = view !== 'start';
    els.screenWizard.hidden = view !== 'wizard';
    els.screenReview.hidden = view !== 'review';
    els.screenGuide.hidden = view !== 'guide';
    if (els.headerActions) {
      els.headerActions.hidden = view !== 'wizard';
    }
  }

  function render() {
    showView(currentView);
    updateTemplateIndicators();
    document.querySelectorAll('.template-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.template === state.template);
    });

    if (currentView === 'start') {
      renderSectionChecklist();
      updateAllPreviews();
    } else if (currentView === 'wizard') {
      renderWizardStep();
      updateAllPreviews();
    } else if (currentView === 'review') {
      renderReview();
      updateAllPreviews();
    } else if (currentView === 'guide') {
      EuGeroLinkedInGuide.renderGuide(els.guideContent, state);
    }
  }

  function renderSectionChecklist() {
    if (!els.sectionChecklist) return;
    els.sectionChecklist.innerHTML = SECTIONS.map(section => {
      const mandatory = isSectionMandatory(section.id);
      const checked = state.enabledSections.includes(section.id);
      return `
        <label class="section-check ${mandatory ? 'section-check-mandatory' : ''}">
          <input type="checkbox" data-section-id="${section.id}" ${checked ? 'checked' : ''} ${mandatory ? 'disabled checked' : ''}>
          <span class="section-check-label">
            <strong>${section.title}</strong>
            ${mandatory ? '<span class="badge badge-required">Obrigatório</span>' : ''}
            <small>${section.description || ''}</small>
          </span>
        </label>
      `;
    }).join('');

    els.sectionChecklist.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', () => toggleSection(input.dataset.sectionId, input.checked));
    });
  }

  function renderWizardTimeline() {
    if (!els.wizardTimeline) return;
    const sections = activeSections();
    els.wizardTimeline.innerHTML = sections.map((section, i) => {
      const label = SHORT_LABELS[section.id] || section.title;
      const cls = [
        'timeline-step',
        i === state.currentStep ? 'active' : '',
        i < state.currentStep ? 'done' : ''
      ].filter(Boolean).join(' ');
      return `
        <button type="button" class="${cls}" data-step="${i}" title="${escapeAttr(section.title)}">
          <span class="timeline-num">${i + 1}</span>
          <span class="timeline-label">${escapeHtml(label)}</span>
        </button>
      `;
    }).join('');

    els.wizardTimeline.querySelectorAll('.timeline-step').forEach(btn => {
      btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.step, 10)));
    });

    const activeBtn = els.wizardTimeline.querySelector('.timeline-step.active');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  function renderWizardStep() {
    const sections = activeSections();
    const section = sections[state.currentStep];
    if (!section) {
      state.currentStep = 0;
      return renderWizardStep();
    }

    els.wizardProgress.textContent = `Etapa ${state.currentStep + 1} de ${sections.length}: ${section.title}`;

    els.wizardSteps.innerHTML = '';
    const stepEl = document.createElement('div');
    stepEl.className = 'wizard-step';

    if (section.list) {
      stepEl.appendChild(renderListSection(section));
    } else if (section.fields) {
      const grid = document.createElement('div');
      grid.className = section.id === 'personal' ? 'field-grid field-grid-personal' : 'field-grid';
      section.fields.forEach(field => {
        grid.appendChild(renderField(section, field));
      });
      stepEl.appendChild(grid);
    }

    const aiBtn = document.createElement('button');
    aiBtn.type = 'button';
    aiBtn.className = 'btn btn-outline btn-ai-section';
    aiBtn.textContent = 'Pedir ajuda à IA';
    aiBtn.addEventListener('click', () => showPrompt('section', section.id));
    stepEl.appendChild(aiBtn);

    els.wizardSteps.appendChild(stepEl);

    document.getElementById('btn-prev').disabled = state.currentStep === 0;
    document.getElementById('btn-next').textContent =
      state.currentStep === sections.length - 1 ? 'Ir para revisão' : 'Próximo';

    renderWizardTimeline();
  }

  function renderField(section, field) {
    const wrap = document.createElement('div');
    wrap.className = 'field-group' + (field.fullWidth ? ' field-full' : '');
    wrap.dataset.section = section.id;
    wrap.dataset.field = field.key;

    let value = getFieldValue(section, field);

    const id = `field-${section.id}-${field.key}`;
    let inputHtml = '';

    if (field.type === 'textarea') {
      inputHtml = `<textarea id="${id}" name="${field.key}" rows="${field.key === 'skillsText' ? 3 : 4}" placeholder="${escapeAttr(field.placeholder || '')}" ${field.required ? 'required' : ''}>${escapeAttr(value)}</textarea>`;
    } else if (field.type === 'select') {
      inputHtml = `<select id="${id}" name="${field.key}" ${field.required ? 'required' : ''}>
        <option value="">Selecione...</option>
        ${(field.options || []).map(o => `<option value="${escapeAttr(o)}" ${value === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
      </select>`;
    } else {
      inputHtml = `<input type="${field.type || 'text'}" id="${id}" name="${field.key}" value="${escapeAttr(value)}" ${field.required ? 'required' : ''}>`;
    }

    wrap.innerHTML = `
      <label for="${id}">${field.label}${field.required ? ' <span class="required">*</span>' : ''}</label>
      ${inputHtml}
      <details class="field-tip-details">
        <summary>Dica</summary>
        <p>${field.tip}</p>
      </details>
      <div class="field-score" aria-live="polite"></div>
    `;

    const input = wrap.querySelector('input, textarea, select');
    input.addEventListener('input', () => {
      setFieldValue(section, field, input.value);
      updateFieldScore(wrap, field, input.value);
      updateAllPreviews();
      saveState();
    });

    updateFieldScore(wrap, field, value);
    return wrap;
  }

  function getFieldValue(section, field) {
    if (section.id === 'personal') return state.personal[field.key] || '';
    if (section.id === 'summary') return state.summary || '';
    if (section.id === 'skills') return skillsToText(state);
    return state[field.key] || '';
  }

  function setFieldValue(section, field, value) {
    if (section.id === 'personal') {
      state.personal[field.key] = value;
    } else if (section.id === 'summary') {
      state.summary = value;
    } else if (section.id === 'skills') {
      state.skillsText = value;
      state.skills = EuGeroConfig.parseSkillsText(value);
    } else {
      state[field.key] = value;
    }
  }

  function renderListSection(section) {
    const container = document.createElement('div');
    container.className = 'list-section';

    if (!Array.isArray(state[section.id])) state[section.id] = [];
    const items = state[section.id];

    const listEl = document.createElement('div');
    listEl.className = 'list-items';

    if (items.length === 0) items.push(createEmptyListItem(section.id));

    items.forEach((item, index) => {
      listEl.appendChild(createListItemEl(section, item, index));
    });

    container.appendChild(listEl);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-secondary btn-add-item';
    addBtn.textContent = '+ Adicionar item';
    addBtn.addEventListener('click', () => {
      state[section.id].push(createEmptyListItem(section.id));
      saveState();
      renderWizardStep();
      updateAllPreviews();
    });
    container.appendChild(addBtn);

    return container;
  }

  function createListItemEl(section, item, index) {
    const card = document.createElement('div');
    card.className = 'list-item-card';
    card.dataset.index = index;

    const grid = document.createElement('div');
    grid.className = 'field-grid field-grid-item';

    section.itemFields.forEach(field => {
      const wrap = document.createElement('div');
      const isWide = field.type === 'textarea';
      wrap.className = 'field-group' + (isWide ? ' field-full' : '');
      const id = `field-${section.id}-${index}-${field.key}`;
      const value = item[field.key] || '';

      let inputHtml = '';
      if (field.type === 'textarea') {
        inputHtml = `<textarea id="${id}" rows="2">${escapeAttr(value)}</textarea>`;
      } else if (field.type === 'select') {
        inputHtml = `<select id="${id}">
          <option value="">Selecione...</option>
          ${(field.options || []).map(o => `<option value="${escapeAttr(o)}" ${value === o ? 'selected' : ''}>${o}</option>`).join('')}
        </select>`;
      } else {
        inputHtml = `<input type="${field.type || 'text'}" id="${id}" value="${escapeAttr(value)}">`;
      }

      wrap.innerHTML = `
        <label for="${id}">${field.label}</label>
        ${inputHtml}
        <details class="field-tip-details"><summary>Dica</summary><p>${field.tip}</p></details>
        <div class="field-score" aria-live="polite"></div>
      `;

      const input = wrap.querySelector('input, textarea, select');
      input.addEventListener('input', () => {
        state[section.id][index][field.key] = input.value;
        updateFieldScore(wrap, field, input.value);
        updateAllPreviews();
        saveState();
      });
      updateFieldScore(wrap, field, value);
      grid.appendChild(wrap);
    });

    card.appendChild(grid);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-danger btn-remove-item';
    removeBtn.textContent = 'Remover';
    removeBtn.addEventListener('click', () => {
      state[section.id].splice(index, 1);
      saveState();
      renderWizardStep();
      updateAllPreviews();
    });
    card.appendChild(removeBtn);

    return card;
  }

  function updateFieldScore(wrap, field, value) {
    const scoreEl = wrap.querySelector('.field-score');
    if (!scoreEl) return;
    const score = EuGeroScoring.scoreField(value, field, ACTION_VERBS);
    scoreEl.textContent = EuGeroScoring.getLabelText(score);
    scoreEl.className = `field-score score-${score}`;
  }

  function renderReview() {
    const sections = activeSections();
    const results = EuGeroScoring.scoreState(state, sections, ACTION_VERBS);
    const aggregate = EuGeroScoring.aggregateScore(results);

    let html = `
      <div class="review-summary">
        <h2>Revisão final</h2>
        <p class="review-overall-label">Qualidade geral: <strong>${aggregate.label}</strong></p>
        <div class="progress-bar" role="progressbar" aria-valuenow="${aggregate.overall}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-fill" style="width: ${aggregate.overall}%"></div>
        </div>
        <p class="progress-text">${aggregate.overall}% — ${aggregate.scored} campos avaliados</p>
      </div>
    `;

    if (aggregate.weakFields.length > 0) {
      html += `
        <div class="review-weak">
          <h3>Campos para revisar (nota Fraco)</h3>
          <ul>
            ${aggregate.weakFields.map(f => {
              const stepIndex = sections.findIndex(s => s.id === f.sectionId);
              return `<li><button type="button" class="link-btn" data-step="${stepIndex}">${escapeHtml(f.displayName)}</button></li>`;
            }).join('')}
          </ul>
        </div>
      `;
    } else {
      html += '<p class="review-success">Parabéns! Nenhum campo com nota Fraco.</p>';
    }

    html += `
      <div class="export-actions">
        <h3>Exportar currículo</h3>
        <div class="btn-group">
          <button type="button" class="btn btn-primary" id="btn-export-pdf">Exportar PDF</button>
          <button type="button" class="btn btn-primary" id="btn-export-docx">Exportar Word</button>
          <button type="button" class="btn btn-primary" id="btn-export-txt">Exportar TXT</button>
        </div>
      </div>
    `;

    els.reviewContent.innerHTML = html;

    els.reviewContent.querySelectorAll('.link-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        goToWizard(parseInt(btn.dataset.step, 10));
      });
    });

    document.getElementById('btn-export-pdf')?.addEventListener('click', () => EuGeroExport.exportPdf(state, state.template));
    document.getElementById('btn-export-docx')?.addEventListener('click', () => EuGeroExport.exportDocx(state, state.template));
    document.getElementById('btn-export-txt')?.addEventListener('click', () => EuGeroExport.exportTxt(state));
  }

  function updateAllPreviews() {
    const sections = activeSections();
    document.querySelectorAll('[data-preview]').forEach(container => {
      EuGeroPreview.updatePreview(container, state, state.template, sections);
    });
  }

  function exportJson() {
    EuGeroStorage.downloadJson(state);
    showToast('Rascunho exportado com sucesso!');
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      showToast('Selecione um arquivo .json válido.', true);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = EuGeroStorage.deserialize(reader.result);
        if (!result.valid) {
          showToast(result.error, true);
          return;
        }
        state = result.data;
        currentView = state.personal?.fullName ? 'wizard' : 'start';
        saveState();
        render();
        showToast('Rascunho carregado com sucesso!');
      } catch (err) {
        showToast('Arquivo corrompido ou inválido. Tente outro arquivo.', true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function showPrompt(type, sectionId) {
    const includeData = document.getElementById('include-data-checkbox')?.checked ?? true;
    let prompt = '';
    if (type === 'general') prompt = EuGeroPrompts.buildGeneralPrompt(state, includeData);
    else if (type === 'section') prompt = EuGeroPrompts.buildSectionPrompt(sectionId, state, includeData);
    else if (type === 'translation') prompt = EuGeroPrompts.buildTranslationPrompt(state, includeData);
    els.promptText.value = prompt;
    openModal(els.modalPrompt);
  }

  function copyPrompt() {
    navigator.clipboard.writeText(els.promptText.value).then(() => showToast('Prompt copiado!'));
  }

  function openModal(modal) { if (modal) modal.hidden = false; }
  function closeModal(modal) { if (modal) modal.hidden = true; }

  function togglePreviewOverlay() {
    els.previewOverlay.hidden = !els.previewOverlay.hidden;
    if (!els.previewOverlay.hidden) updateAllPreviews();
  }

  function closePreviewOverlay() { els.previewOverlay.hidden = true; }

  function showToast(message, isError) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.className = 'toast visible' + (isError ? ' toast-error' : '');
    setTimeout(() => { els.toast.className = 'toast'; }, 3000);
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAttr(text) {
    if (!text) return '';
    return String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  window.EuGeroApp = {
    getState: () => JSON.parse(JSON.stringify(state)),
    setState: (newState) => { state = EuGeroStorage.mergeWithDefaults(newState); },
    switchTemplate: (t) => switchTemplate(t),
    getTemplate: () => state.template,
    getActiveSections: () => activeSections(),
    render,
    saveState
  };

  document.addEventListener('DOMContentLoaded', init);
})();
