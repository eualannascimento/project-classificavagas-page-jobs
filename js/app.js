/**
 * Eu Gero Meu Currículo — aplicação principal.
 */
(function () {
  'use strict';

  const { SECTIONS, TEMPLATES, ACTION_VERBS, createEmptyState, createEmptyListItem } = EuGeroConfig;

  let state = EuGeroStorage.load();
  let currentView = 'template'; // template | wizard | review | guide

  // DOM refs
  const els = {};

  function init() {
    cacheElements();
    bindGlobalEvents();
    restoreView();
    render();
  }

  function cacheElements() {
    els.app = document.getElementById('app');
    els.screenTemplate = document.getElementById('screen-template');
    els.screenWizard = document.getElementById('screen-wizard');
    els.screenReview = document.getElementById('screen-review');
    els.screenGuide = document.getElementById('screen-guide');
    els.wizardForm = document.getElementById('wizard-form');
    els.wizardSteps = document.getElementById('wizard-steps');
    els.wizardProgress = document.getElementById('wizard-progress');
    els.previewContent = document.getElementById('preview-content');
    els.previewPanel = document.getElementById('preview-panel');
    els.previewOverlay = document.getElementById('preview-overlay');
    els.reviewContent = document.getElementById('review-content');
    els.guideContent = document.getElementById('guide-content');
    els.modalPrompt = document.getElementById('modal-prompt');
    els.promptText = document.getElementById('prompt-text');
    els.modalTemplate = document.getElementById('modal-template');
    els.fileImport = document.getElementById('file-import');
    els.toast = document.getElementById('toast');
  }

  function bindGlobalEvents() {
    document.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => selectTemplate(card.dataset.template));
    });

    document.getElementById('btn-change-template')?.addEventListener('click', () => openModal(els.modalTemplate));
    document.getElementById('btn-change-template-wizard')?.addEventListener('click', () => openModal(els.modalTemplate));
    document.getElementById('btn-prev')?.addEventListener('click', prevStep);
    document.getElementById('btn-next')?.addEventListener('click', nextStep);
    document.getElementById('btn-review')?.addEventListener('click', goToReview);
    document.getElementById('btn-back-wizard')?.addEventListener('click', () => goToWizard());
    document.getElementById('btn-guide')?.addEventListener('click', goToGuide);
    document.getElementById('btn-back-review')?.addEventListener('click', goToReview);

    document.getElementById('btn-export-json')?.addEventListener('click', exportJson);
    document.getElementById('btn-export-json-review')?.addEventListener('click', exportJson);
    document.getElementById('btn-import-json')?.addEventListener('click', () => els.fileImport.click());
    document.getElementById('btn-import-json-review')?.addEventListener('click', () => els.fileImport.click());
    els.fileImport?.addEventListener('change', handleImport);

    document.getElementById('btn-export-pdf')?.addEventListener('click', () => EuGeroExport.exportPdf(state, state.template));
    document.getElementById('btn-export-docx')?.addEventListener('click', () => EuGeroExport.exportDocx(state));
    document.getElementById('btn-export-txt')?.addEventListener('click', () => EuGeroExport.exportTxt(state));

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
    const saved = EuGeroStorage.load();
    if (saved.currentStep > 0 || saved.personal?.fullName) {
      currentView = 'wizard';
      state = saved;
    }
  }

  function saveState() {
    EuGeroStorage.save(state);
  }

  function selectTemplate(templateId) {
    state.template = templateId;
    state.currentStep = 0;
    currentView = 'wizard';
    saveState();
    render();
  }

  function switchTemplate(templateId) {
    state.template = templateId;
    saveState();
    updatePreview();
    updateTemplateIndicators();
    showToast(`Template alterado para ${TEMPLATES[templateId].name}`);
  }

  function updateTemplateIndicators() {
    document.querySelectorAll('[data-current-template]').forEach(el => {
      el.textContent = TEMPLATES[state.template].name;
    });
  }

  function prevStep() {
    if (state.currentStep > 0) {
      state.currentStep--;
      saveState();
      renderWizardStep();
    }
  }

  function nextStep() {
    if (state.currentStep < SECTIONS.length - 1) {
      state.currentStep++;
      saveState();
      renderWizardStep();
    } else {
      goToReview();
    }
  }

  function goToWizard(step) {
    currentView = 'wizard';
    if (typeof step === 'number') state.currentStep = step;
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
    els.screenTemplate.hidden = view !== 'template';
    els.screenWizard.hidden = view !== 'wizard';
    els.screenReview.hidden = view !== 'review';
    els.screenGuide.hidden = view !== 'guide';
  }

  function render() {
    showView(currentView);
    updateTemplateIndicators();

    if (currentView === 'wizard') {
      renderWizardStep();
      updatePreview();
    } else if (currentView === 'review') {
      renderReview();
      updatePreview();
    } else if (currentView === 'guide') {
      EuGeroLinkedInGuide.renderGuide(els.guideContent, state);
    }
  }

  function renderWizardStep() {
    const section = SECTIONS[state.currentStep];
    if (!section) return;

    els.wizardProgress.textContent = `Etapa ${state.currentStep + 1} de ${SECTIONS.length}: ${section.title}`;

    els.wizardSteps.innerHTML = '';
    const stepEl = document.createElement('div');
    stepEl.className = 'wizard-step';
    stepEl.innerHTML = `<h2 class="step-title">${section.title}</h2>`;

    if (section.list) {
      stepEl.appendChild(renderListSection(section));
    } else {
      section.fields.forEach(field => {
        stepEl.appendChild(renderField(section, field));
      });
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
      state.currentStep === SECTIONS.length - 1 ? 'Ir para revisão' : 'Próximo';
  }

  function renderField(section, field) {
    const wrap = document.createElement('div');
    wrap.className = 'field-group';
    wrap.dataset.section = section.id;
    wrap.dataset.field = field.key;

    let value = '';
    if (section.id === 'personal') {
      value = state.personal[field.key] || '';
    } else if (section.id === 'summary') {
      value = state.summary || '';
    }

    const id = `field-${section.id}-${field.key}`;
    let inputHtml = '';

    if (field.type === 'textarea') {
      inputHtml = `<textarea id="${id}" name="${field.key}" rows="5" ${field.required ? 'required' : ''}>${escapeAttr(value)}</textarea>`;
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
      <p class="field-tip">${field.tip}</p>
      <div class="field-score" aria-live="polite"></div>
    `;

    const input = wrap.querySelector('input, textarea, select');
    input.addEventListener('input', () => {
      updateFieldValue(section, field, input.value);
      updateFieldScore(wrap, field, input.value);
      updatePreview();
      saveState();
    });

    updateFieldScore(wrap, field, value);
    return wrap;
  }

  function renderListSection(section) {
    const container = document.createElement('div');
    container.className = 'list-section';
    container.dataset.sectionId = section.id;

    if (!Array.isArray(state[section.id])) {
      state[section.id] = [];
    }
    const items = state[section.id];
    const listEl = document.createElement('div');
    listEl.className = 'list-items';

    if (items.length === 0) {
      items.push(createEmptyListItem(section.id));
    }

    if (items.length > 0) {
      items.forEach((item, index) => {
        listEl.appendChild(createListItemEl(section, item, index));
      });
    }

    container.appendChild(listEl);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-secondary btn-add-item';
    addBtn.textContent = '+ Adicionar item';
    addBtn.addEventListener('click', () => {
      state[section.id].push(createEmptyListItem(section.id));
      saveState();
      renderWizardStep();
      updatePreview();
    });
    container.appendChild(addBtn);

    return container;
  }

  function createListItemEl(section, item, index) {
    const card = document.createElement('div');
    card.className = 'list-item-card';
    card.dataset.index = index;

    section.itemFields.forEach(field => {
      const wrap = document.createElement('div');
      wrap.className = 'field-group';
      const id = `field-${section.id}-${index}-${field.key}`;
      const value = item[field.key] || '';

      let inputHtml = '';
      if (field.type === 'textarea') {
        inputHtml = `<textarea id="${id}" rows="3">${escapeAttr(value)}</textarea>`;
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
        <p class="field-tip">${field.tip}</p>
        <div class="field-score" aria-live="polite"></div>
      `;

      const input = wrap.querySelector('input, textarea, select');
      input.addEventListener('input', () => {
        state[section.id][index][field.key] = input.value;
        updateFieldScore(wrap, field, input.value);
        updatePreview();
        saveState();
      });
      updateFieldScore(wrap, field, value);
      card.appendChild(wrap);
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-danger btn-remove-item';
    removeBtn.textContent = 'Remover';
    removeBtn.addEventListener('click', () => {
      state[section.id].splice(index, 1);
      saveState();
      renderWizardStep();
      updatePreview();
    });
    card.appendChild(removeBtn);

    return card;
  }

  function updateFieldValue(section, field, value) {
    if (section.id === 'personal') {
      state.personal[field.key] = value;
    } else if (section.id === 'summary') {
      state.summary = value;
    } else {
      state[section.id] = value;
    }
  }

  function updateFieldScore(wrap, field, value) {
    const scoreEl = wrap.querySelector('.field-score');
    if (!scoreEl) return;

    const score = EuGeroScoring.scoreField(value, field, ACTION_VERBS);
    scoreEl.textContent = EuGeroScoring.getLabelText(score);
    scoreEl.className = `field-score score-${score}`;
  }

  function renderReview() {
    const results = EuGeroScoring.scoreState(state, SECTIONS, ACTION_VERBS);
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
            ${aggregate.weakFields.map(f => `<li><button type="button" class="link-btn" data-section="${f.sectionId}">${escapeHtml(f.displayName)}</button></li>`).join('')}
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
        const sectionId = btn.dataset.section;
        const stepIndex = SECTIONS.findIndex(s => s.id === sectionId);
        if (stepIndex >= 0) goToWizard(stepIndex);
      });
    });

    document.getElementById('btn-export-pdf')?.addEventListener('click', () => EuGeroExport.exportPdf(state, state.template));
    document.getElementById('btn-export-docx')?.addEventListener('click', () => EuGeroExport.exportDocx(state));
    document.getElementById('btn-export-txt')?.addEventListener('click', () => EuGeroExport.exportTxt(state));

    const reviewPreview = document.getElementById('preview-content-review');
    if (reviewPreview) {
      EuGeroPreview.updatePreview(reviewPreview, state, state.template);
    }
  }

  function updatePreview() {
    EuGeroPreview.updatePreview(els.previewContent, state, state.template);
    if (els.previewOverlay) {
      const overlayContent = els.previewOverlay.querySelector('.preview-content');
      if (overlayContent) {
        EuGeroPreview.updatePreview(overlayContent, state, state.template);
      }
    }
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
        saveState();
        currentView = state.personal?.fullName ? 'wizard' : 'template';
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

    if (type === 'general') {
      prompt = EuGeroPrompts.buildGeneralPrompt(state, includeData);
    } else if (type === 'section') {
      prompt = EuGeroPrompts.buildSectionPrompt(sectionId, state, includeData);
    } else if (type === 'translation') {
      prompt = EuGeroPrompts.buildTranslationPrompt(state, includeData);
    }

    els.promptText.value = prompt;
    openModal(els.modalPrompt);
  }

  function copyPrompt() {
    els.promptText.select();
    navigator.clipboard.writeText(els.promptText.value).then(() => {
      showToast('Prompt copiado!');
    });
  }

  function openModal(modal) {
    if (modal) modal.hidden = false;
  }

  function closeModal(modal) {
    if (modal) modal.hidden = true;
  }

  function togglePreviewOverlay() {
    els.previewOverlay.hidden = !els.previewOverlay.hidden;
    if (!els.previewOverlay.hidden) updatePreview();
  }

  function closePreviewOverlay() {
    els.previewOverlay.hidden = true;
  }

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

  // Expor API para testes
  window.EuGeroApp = {
    getState: () => ({ ...state, personal: { ...state.personal } }),
    setState: (newState) => { state = EuGeroStorage.mergeWithDefaults(newState); },
    switchTemplate: (t) => switchTemplate(t),
    getTemplate: () => state.template,
    render,
    saveState
  };

  document.addEventListener('DOMContentLoaded', init);
})();
