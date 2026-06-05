/**
 * Preview ao vivo do currículo nos templates Clássico e Moderno.
 */
const EuGeroPreview = (function () {
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatPeriod(start, end) {
    if (!start && !end) return '';
    return `${start || ''}${start && end ? ' — ' : ''}${end || 'Atual'}`;
  }

  function renderSection(title, content) {
    if (!content) return '';
    return `<section class="cv-section"><h2>${escapeHtml(title)}</h2>${content}</section>`;
  }

  function renderExperiences(items) {
    if (!items?.length) return '';
    const html = items.map(e => `
      <article class="cv-item">
        <div class="cv-item-header">
          <strong>${escapeHtml(e.title)}</strong>
          <span class="cv-period">${escapeHtml(formatPeriod(e.startDate, e.endDate))}</span>
        </div>
        <div class="cv-item-sub">${escapeHtml(e.company)}</div>
        ${e.description ? `<p class="cv-desc">${escapeHtml(e.description).replace(/\n/g, '<br>')}</p>` : ''}
      </article>
    `).join('');
    return renderSection('Experiência Profissional', html);
  }

  function renderEducation(items) {
    if (!items?.length) return '';
    const html = items.map(e => `
      <article class="cv-item">
        <strong>${escapeHtml(e.degree)}</strong>
        <div class="cv-item-sub">${escapeHtml(e.institution)}</div>
        <span class="cv-period">${escapeHtml(formatPeriod(e.startDate, e.endDate))}</span>
      </article>
    `).join('');
    return renderSection('Formação Acadêmica', html);
  }

  function renderSkills(items) {
    if (!items?.length) return '';
    const names = items.map(s => s.name || s).filter(Boolean);
    if (!names.length) return '';
    const html = `<div class="cv-skills">${names.map(s => `<span class="cv-skill-tag">${escapeHtml(s)}</span>`).join('')}</div>`;
    return renderSection('Habilidades', html);
  }

  function renderLanguages(items) {
    if (!items?.length) return '';
    const html = items.map(l => `<div class="cv-item"><strong>${escapeHtml(l.language)}</strong> — ${escapeHtml(l.level)}</div>`).join('');
    return renderSection('Idiomas', html);
  }

  function renderGenericList(title, items, formatter) {
    if (!items?.length) return '';
    const html = items.map(formatter).join('');
    return renderSection(title, html);
  }

  function buildContent(state) {
    const p = state.personal || {};
    let content = '';

    if (state.summary) {
      content += renderSection('Resumo', `<p class="cv-summary">${escapeHtml(state.summary).replace(/\n/g, '<br>')}</p>`);
    }

    content += renderExperiences(state.experiences);
    content += renderEducation(state.education);
    content += renderSkills(state.skills);
    content += renderLanguages(state.languages);

    content += renderGenericList('Certificados e Licenças', state.certifications, c => `
      <article class="cv-item">
        <strong>${escapeHtml(c.name)}</strong>
        <div class="cv-item-sub">${escapeHtml(c.issuer)}${c.date ? ` · ${escapeHtml(c.date)}` : ''}</div>
      </article>
    `);

    content += renderGenericList('Projetos', state.projects, p => `
      <article class="cv-item">
        <strong>${escapeHtml(p.name)}</strong>
        ${p.description ? `<p class="cv-desc">${escapeHtml(p.description).replace(/\n/g, '<br>')}</p>` : ''}
      </article>
    `);

    content += renderGenericList('Voluntariado', state.volunteering, v => `
      <article class="cv-item">
        <strong>${escapeHtml(v.role)}</strong> — ${escapeHtml(v.organization)}
        <span class="cv-period">${escapeHtml(formatPeriod(v.startDate, v.endDate))}</span>
        ${v.description ? `<p class="cv-desc">${escapeHtml(v.description).replace(/\n/g, '<br>')}</p>` : ''}
      </article>
    `);

    content += renderGenericList('Publicações', state.publications, pub => `
      <article class="cv-item">
        <strong>${escapeHtml(pub.title)}</strong>
        <div class="cv-item-sub">${escapeHtml(pub.publisher)}${pub.date ? ` · ${escapeHtml(pub.date)}` : ''}</div>
      </article>
    `);

    content += renderGenericList('Prêmios e Honrarias', state.awards, a => `
      <article class="cv-item">
        <strong>${escapeHtml(a.title)}</strong> — ${escapeHtml(a.issuer)}
        ${a.description ? `<p class="cv-desc">${escapeHtml(a.description)}</p>` : ''}
      </article>
    `);

    content += renderGenericList('Organizações', state.organizations, o => `
      <article class="cv-item">
        <strong>${escapeHtml(o.name)}</strong> — ${escapeHtml(o.role)}
        <span class="cv-period">${escapeHtml(formatPeriod(o.startDate, o.endDate))}</span>
      </article>
    `);

    content += renderGenericList('Cursos', state.courses, c => `
      <article class="cv-item">
        <strong>${escapeHtml(c.name)}</strong>
        <div class="cv-item-sub">${escapeHtml(c.institution)}${c.date ? ` · ${escapeHtml(c.date)}` : ''}</div>
      </article>
    `);

    return { personal: p, content };
  }

  function renderClassic(state) {
    const { personal, content } = buildContent(state);
    const contacts = [
      personal.email,
      personal.phone,
      personal.location,
      personal.linkedinUrl
    ].filter(Boolean);

    return `
      <div class="cv cv-classic">
        <header class="cv-header-classic">
          <h1 class="cv-name">${escapeHtml(personal.fullName) || 'Seu Nome'}</h1>
          <p class="cv-headline">${escapeHtml(personal.headline) || 'Seu cargo desejado'}</p>
          ${contacts.length ? `<p class="cv-contacts">${contacts.map(c => escapeHtml(c)).join(' · ')}</p>` : ''}
        </header>
        <div class="cv-body">${content || '<p class="cv-placeholder">Preencha o formulário para ver seu currículo aqui.</p>'}</div>
      </div>
    `;
  }

  function renderModern(state) {
    const { personal, content } = buildContent(state);

    return `
      <div class="cv cv-modern">
        <aside class="cv-sidebar">
          <h1 class="cv-name">${escapeHtml(personal.fullName) || 'Seu Nome'}</h1>
          <p class="cv-headline">${escapeHtml(personal.headline) || 'Seu cargo desejado'}</p>
          <div class="cv-sidebar-section">
            <h3>Contato</h3>
            ${personal.email ? `<p>${escapeHtml(personal.email)}</p>` : ''}
            ${personal.phone ? `<p>${escapeHtml(personal.phone)}</p>` : ''}
            ${personal.location ? `<p>${escapeHtml(personal.location)}</p>` : ''}
            ${personal.linkedinUrl ? `<p class="cv-link">${escapeHtml(personal.linkedinUrl)}</p>` : ''}
          </div>
          ${state.skills?.length ? `
            <div class="cv-sidebar-section">
              <h3>Habilidades</h3>
              ${state.skills.map(s => `<p>${escapeHtml(s.name || s)}</p>`).filter(Boolean).join('')}
            </div>
          ` : ''}
          ${state.languages?.length ? `
            <div class="cv-sidebar-section">
              <h3>Idiomas</h3>
              ${state.languages.map(l => `<p>${escapeHtml(l.language)} — ${escapeHtml(l.level)}</p>`).join('')}
            </div>
          ` : ''}
        </aside>
        <main class="cv-main">
          ${state.summary ? `<section class="cv-section"><h2>Resumo</h2><p class="cv-summary">${escapeHtml(state.summary).replace(/\n/g, '<br>')}</p></section>` : ''}
          ${renderExperiences(state.experiences)}
          ${renderEducation(state.education)}
          ${renderGenericList('Certificados', state.certifications, c => `<article class="cv-item"><strong>${escapeHtml(c.name)}</strong><div class="cv-item-sub">${escapeHtml(c.issuer)}</div></article>`)}
          ${renderGenericList('Projetos', state.projects, p => `<article class="cv-item"><strong>${escapeHtml(p.name)}</strong><p class="cv-desc">${escapeHtml(p.description || '')}</p></article>`)}
          ${renderGenericList('Voluntariado', state.volunteering, v => `<article class="cv-item"><strong>${escapeHtml(v.role)}</strong> — ${escapeHtml(v.organization)}</article>`)}
          ${renderGenericList('Publicações', state.publications, pub => `<article class="cv-item"><strong>${escapeHtml(pub.title)}</strong></article>`)}
          ${renderGenericList('Prêmios', state.awards, a => `<article class="cv-item"><strong>${escapeHtml(a.title)}</strong></article>`)}
          ${renderGenericList('Organizações', state.organizations, o => `<article class="cv-item"><strong>${escapeHtml(o.name)}</strong></article>`)}
          ${renderGenericList('Cursos', state.courses, c => `<article class="cv-item"><strong>${escapeHtml(c.name)}</strong></article>`)}
          ${!content && !state.summary ? '<p class="cv-placeholder">Preencha o formulário para ver seu currículo aqui.</p>' : ''}
        </main>
      </div>
    `;
  }

  function render(state, template) {
    return template === 'modern' ? renderModern(state) : renderClassic(state);
  }

  function updatePreview(container, state, template) {
    if (!container) return;
    container.innerHTML = render(state, template);
    container.className = `preview-content template-${template}`;
  }

  return {
    render,
    updatePreview,
    buildContent,
    escapeHtml
  };
})();
