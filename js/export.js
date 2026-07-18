/**
 * Exportação do currículo.
 *
 * - PDF: gerado pela impressão do navegador ("Salvar como PDF") sobre o mesmo
 *   HTML da prévia (ver printCv em app.js) — fica idêntico ao que está na tela.
 * - Word (.docx): documento OOXML real (via docx.js), totalmente editável e
 *   compatível com Microsoft Word, Google Docs e Apple Pages. Reflete as mesmas
 *   seções e o mesmo modelo da prévia (EuGeroCvData).
 *
 * Padrão de nome dos arquivos: CV_<NOME>_<CARGO>.<ext>
 */
const EuGeroExport = (function () {
  const DOCX_CDN = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/+esm';

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** Higieniza um trecho para uso em nome de arquivo (sem acento nem símbolo). */
  function sanitizeSegment(text) {
    return (text || '')
      .normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /** Nome-base sem extensão: CV_<NOME>_<CARGO> (usado no PDF via título da página). */
  function getBaseName(state) {
    const nome = sanitizeSegment(state?.personal?.fullName) || 'Curriculo';
    const cargo = sanitizeSegment(state?.personal?.headline);
    return cargo ? `CV_${nome}_${cargo}` : `CV_${nome}`;
  }

  function getFileName(state, ext) {
    return `${getBaseName(state)}.${ext}`;
  }

  async function exportDocx(state, templateId) {
    try {
      const docx = await import(DOCX_CDN);
      if (typeof EuGeroLibs !== 'undefined') EuGeroLibs.markDocxAvailable?.();
      const meta = EuGeroConfig.getTemplateMeta(templateId);
      const enabledSections = EuGeroConfig.getActiveSections(state.enabledSections);
      const cvDoc = EuGeroCvData.build(state, enabledSections);

      switch (meta.layout) {
        case 'sidebar':
          await exportDocxSidebar(docx, cvDoc, state, meta, templateId);
          break;
        case 'banner':
          await exportDocxBanner(docx, cvDoc, state, meta);
          break;
        case 'left':
          await exportDocxLeft(docx, cvDoc, state, meta);
          break;
        default:
          await exportDocxClassic(docx, cvDoc, state, meta);
      }
      return { ok: true };
    } catch (e) {
      console.error('Erro ao exportar Word:', e);
      return { ok: false, error: 'Word indisponivel: exige internet na primeira exportacao (CDN docx.js).' };
    }
  }

  function entryParagraphs(Paragraph, TextRun, block) {
    const out = [];
    out.push(new Paragraph({
      children: [new TextRun({ text: block.title, bold: true, size: 20 })],
      spacing: { after: 40 }
    }));
    if (block.subtitle) {
      out.push(new Paragraph({
        children: [new TextRun({ text: block.subtitle, size: 18, color: '64748B' })],
        spacing: { after: 40 }
      }));
    }
    if (block.period) {
      out.push(new Paragraph({
        children: [new TextRun({ text: block.period, size: 16, color: '94A3B8', italics: true })],
        spacing: { after: 60 }
      }));
    }
    if (block.description) {
      out.push(new Paragraph({
        children: [new TextRun({ text: block.description, size: 18 })],
        spacing: { after: 120 }
      }));
    }
    return out;
  }

  /** Converte um bloco do modelo em parágrafos docx (usado nas seções principais). */
  function blockParagraphs(docx, block) {
    const { Paragraph, TextRun } = docx;
    if (block.type === 'text') {
      return [new Paragraph({ children: [new TextRun({ text: block.text, size: 18 })], spacing: { after: 120 } })];
    }
    if (block.type === 'tags') {
      return [new Paragraph({ children: [new TextRun({ text: block.items.join('  ·  '), size: 18 })], spacing: { after: 120 } })];
    }
    if (block.type === 'line') {
      return [new Paragraph({ children: [new TextRun({ text: block.text, size: 18 })], spacing: { after: 80 } })];
    }
    if (block.type === 'entry') {
      return entryParagraphs(Paragraph, TextRun, block);
    }
    return [];
  }

  async function exportDocxClassic(docx, cvDoc, state, meta) {
    const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = docx;
    const p = cvDoc.personal;
    const accent = meta?.accentHex || '1E293B';
    const children = [];

    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: p.fullName || 'Currículo', bold: true, size: 36, color: accent })],
      spacing: { after: 80 }
    }));
    if (p.headline) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: p.headline, size: 22, color: '475569' })],
        spacing: { after: 60 }
      }));
    }
    if (cvDoc.sidebar.contact.length) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: cvDoc.sidebar.contact.join('  ·  '), size: 18, color: '64748B' })],
        spacing: { after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: accent } }
      }));
    }

    cvDoc.sections.forEach(section => {
      children.push(new Paragraph({
        children: [new TextRun({ text: section.title.toUpperCase(), bold: true, size: 20, color: accent })],
        spacing: { before: 200, after: 60 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' } }
      }));
      section.blocks.forEach(block => children.push(...blockParagraphs(docx, block)));
    });

    const document = new Document({ sections: [{ children }] });
    downloadBlob(await Packer.toBlob(document), getFileName(state, 'docx'));
  }

  async function exportDocxSidebar(docx, cvDoc, state, meta, templateId) {
    const {
      Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
      WidthType, ShadingType, VerticalAlign, BorderStyle
    } = docx;
    const fill = meta.accentHex || '2962FF';

    const sidebarChildren = [];
    const p = cvDoc.personal;

    sidebarChildren.push(new Paragraph({
      children: [new TextRun({ text: p.fullName || 'Nome', bold: true, size: 28, color: 'FFFFFF' })],
      spacing: { after: 80 }
    }));
    if (p.headline) {
      sidebarChildren.push(new Paragraph({
        children: [new TextRun({ text: p.headline, size: 18, color: 'FFFFFF' })],
        spacing: { after: 160 }
      }));
    }

    const sidebarSection = (title, lines) => {
      if (!lines.length) return;
      sidebarChildren.push(new Paragraph({
        children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 16, color: 'FFFFFF' })],
        spacing: { before: 120, after: 40 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'FFFFFF' } }
      }));
      lines.forEach(line => {
        sidebarChildren.push(new Paragraph({
          children: [new TextRun({ text: line, size: 16, color: 'FFFFFF' })],
          spacing: { after: 40 }
        }));
      });
    };

    sidebarSection('Contato', cvDoc.sidebar.contact);
    sidebarSection('Habilidades', cvDoc.sidebar.skills);
    sidebarSection('Idiomas', cvDoc.sidebar.languages.map(l => `${l.language}${l.level ? ' · ' + l.level : ''}`));

    const mainChildren = [];
    EuGeroCvData.getMainSections(cvDoc, templateId).forEach(section => {
      mainChildren.push(new Paragraph({
        children: [new TextRun({ text: section.title.toUpperCase(), bold: true, size: 20, color: fill })],
        spacing: { before: 160, after: 60 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: fill } }
      }));
      section.blocks.forEach(block => mainChildren.push(...blockParagraphs(docx, block)));
    });

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE }
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 32, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 200, bottom: 200, left: 200, right: 120 },
              children: sidebarChildren
            }),
            new TableCell({
              width: { size: 68, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 200, bottom: 200, left: 200, right: 200 },
              children: mainChildren.length ? mainChildren : [new Paragraph({ text: '' })]
            })
          ]
        })
      ]
    });

    const document = new Document({ sections: [{ children: [table] }] });
    downloadBlob(await Packer.toBlob(document), getFileName(state, 'docx'));
  }

  async function exportDocxBanner(docx, cvDoc, state, meta) {
    const { Document, Packer, Paragraph, TextRun, BorderStyle } = docx;
    const accent = meta.accentHex || '0F172A';
    const children = [];
    children.push(new Paragraph({
      children: [new TextRun({ text: cvDoc.personal.fullName || 'Currículo', bold: true, size: 36, color: 'FFFFFF' })],
      shading: { fill: accent },
      spacing: { after: 40 }
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: cvDoc.personal.headline || '', size: 22, color: 'FFFFFF' })],
      shading: { fill: accent },
      spacing: { after: 40 }
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: cvDoc.sidebar.contact.join(' · '), size: 18, color: 'FFFFFF' })],
      shading: { fill: accent },
      spacing: { after: 200 }
    }));
    cvDoc.sections.forEach(section => {
      children.push(new Paragraph({
        children: [new TextRun({ text: section.title.toUpperCase(), bold: true, size: 20, color: accent })],
        spacing: { before: 160, after: 60 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: accent } }
      }));
      section.blocks.forEach(block => children.push(...blockParagraphs(docx, block)));
    });
    const document = new Document({ sections: [{ children }] });
    downloadBlob(await Packer.toBlob(document), getFileName(state, 'docx'));
  }

  async function exportDocxLeft(docx, cvDoc, state) {
    await exportDocxClassic(docx, cvDoc, state, { accentHex: '64748B', layout: 'left' });
  }

  return {
    exportDocx,
    downloadBlob,
    getFileName,
    getBaseName
  };
})();
