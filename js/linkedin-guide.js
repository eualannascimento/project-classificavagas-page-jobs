/**
 * Guia LinkedIn — passos curtos e acionáveis, com o caminho exato
 * dentro do LinkedIn e o texto pronto para colar (agrupado por seção).
 */
const EuGeroLinkedInGuide = (function () {
  function isEmpty(val) {
    if (!val) return true;
    if (typeof val === 'string') return val.trim().length === 0;
    return false;
  }

  function slugFromName(name) {
    return (name || 'seunome').trim().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '') || 'seunome';
  }

  function buildEntries(state) {
    const p = state.personal || {};
    const entries = [];

    entries.push({
      title: 'Foto e capa',
      path: 'Seu perfil → toque na foto → Adicionar foto',
      content: '',
      tip: 'Foto de rosto, fundo neutro e um leve sorriso. A capa pode ser algo simples ligado à sua área.'
    });

    entries.push({
      title: 'Título do perfil',
      path: 'Seu perfil → lápis (✎) no topo → campo "Título"',
      content: [p.headline, p.location].filter(Boolean).join(' · '),
      tip: 'Vá além do cargo: diga o que você faz ou busca.'
    });

    if (!isEmpty(state.summary)) {
      entries.push({
        title: 'Sobre',
        path: 'Seu perfil → seção "Sobre" → lápis (✎)',
        content: state.summary,
        tip: 'Escreva em primeira pessoa e diga o que você procura hoje.'
      });
    }

    const exps = (state.experiences || []).filter(e => e.title || e.company);
    if (exps.length) {
      entries.push({
        title: 'Experiência',
        path: 'Seu perfil → seção "Experiência" → botão + → Adicionar cargo',
        content: exps.map(e => [
          `Cargo: ${e.title || ''}`,
          `Empresa: ${e.company || ''}`,
          `Período: ${e.period || 'preencha no LinkedIn'}`,
          e.description ? `Descrição: ${e.description}` : ''
        ].filter(Boolean).join('\n')).join('\n\n'),
        tip: 'No LinkedIn cabe mais detalhe que no currículo - aproveite para contar resultados.'
      });
    }

    const edus = (state.education || []).filter(e => e.degree || e.institution);
    if (edus.length) {
      entries.push({
        title: 'Formação',
        path: 'Seu perfil → seção "Formação acadêmica" → botão +',
        content: edus.map(e => `${e.degree || ''} - ${e.institution || ''}${e.period ? ` (${e.period})` : ''}`).join('\n'),
        tip: 'Cursos técnicos e livres também contam.'
      });
    }

    const skills = EuGeroConfig.getSkillsFromState(state).map(s => s.name || s).filter(Boolean);
    if (skills.length) {
      entries.push({
        title: 'Competências',
        path: 'Seu perfil → seção "Competências" → botão + (adicione uma por vez)',
        content: skills.join(', '),
        tip: 'Fixe as 3 principais no topo e peça a colegas para validá-las.'
      });
    }

    const langs = (state.languages || []).filter(l => l.language);
    if (langs.length) {
      entries.push({
        title: 'Idiomas',
        path: 'Seu perfil → "Adicionar seção do perfil" → Idiomas',
        content: langs.map(l => `${l.language}${l.level ? ` - ${l.level}` : ''}`).join('\n'),
        tip: 'Seja honesto com o nível - podem testar na entrevista.'
      });
    }

    entries.push({
      title: 'URL personalizada',
      path: 'Seu perfil → "Editar perfil público e URL" (canto superior direito)',
      content: `linkedin.com/in/${slugFromName(p.fullName)}`,
      tip: 'Um link curto e limpo fica ótimo no topo do currículo.'
    });

    entries.push({
      title: 'Recomendações',
      path: 'Perfil de um colega → botão "Mais" → Solicitar recomendação',
      content: '',
      tip: 'Peça a um professor, colega ou ex-chefe. Para quem está começando, vale muito.'
    });

    return entries;
  }

  function renderGuide(container, state) {
    if (!container) return;
    const entries = buildEntries(state);

    container.innerHTML = entries.map((entry, index) => `
      <div class="blueprint guide-entry" style="padding: 16px 18px;" data-index="${index}">
        <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <span style="display: flex; align-items: baseline; gap: 10px;">
            <span style="font-family: var(--font-heading); font-weight: 600; font-size: 13px; color: var(--color-accent-700);">${String(index + 1).padStart(2, '0')}</span>
            <span style="font-family: var(--font-heading); font-weight: 600; font-size: 17px; text-transform: uppercase;">${escapeHtml(entry.title)}</span>
          </span>
          ${entry.content ? `<button type="button" class="btn btn-secondary btn-copy-guide" data-index="${index}" style="font-size: 13px; min-height: 34px;">Copiar</button>` : ''}
        </div>
        <p style="display: flex; gap: 8px; align-items: baseline; font-size: 13.5px; margin: 8px 0 0; color: color-mix(in srgb, var(--color-text) 82%, transparent);">
          <span style="font-family: var(--font-heading); font-weight: 600; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-accent-700); flex: none;">Onde</span>
          <span>${escapeHtml(entry.path)}</span>
        </p>
        ${entry.content ? `<p class="guide-entry-content" style="font-size: 13.5px; line-height: 1.5; color: var(--color-accent-900); background: var(--color-accent-100); border: 1px solid var(--color-divider); padding: 10px 12px; margin: 10px 0 0; white-space: pre-wrap; max-height: 130px; overflow-y: auto;" data-index="${index}"></p>` : ''}
        <p style="display: flex; gap: 8px; align-items: baseline; font-size: 13.5px; margin: 8px 0 0; color: color-mix(in srgb, var(--color-text) 72%, transparent);">
          <span style="font-family: var(--font-heading); font-weight: 600; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: color-mix(in srgb, var(--color-text) 50%, transparent); flex: none;">Dica</span>
          <span>${escapeHtml(entry.tip)}</span>
        </p>
        <span class="copy-feedback" aria-live="polite" style="font-size: 12px; color: var(--color-success); display: block; height: 14px;"></span>
      </div>
    `).join('');

    container.querySelectorAll('.guide-entry-content').forEach(el => {
      el.textContent = entries[parseInt(el.dataset.index, 10)].content;
    });

    container.querySelectorAll('.btn-copy-guide').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index, 10);
        navigator.clipboard.writeText(entries[index].content).then(() => {
          const card = btn.closest('.guide-entry');
          const feedback = card?.querySelector('.copy-feedback');
          if (feedback) {
            feedback.textContent = 'Copiado!';
            setTimeout(() => { feedback.textContent = ''; }, 2000);
          }
        });
      });
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    buildEntries,
    renderGuide
  };
})();
