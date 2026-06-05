/**
 * Exportação PDF e Word fiéis aos templates Clássico e Moderno.
 */
const EuGeroExport = (function () {
  const MODERN_BLUE = [41, 98, 255];
  const CLASSIC_DARK = [30, 41, 59];

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

  function getFileName(state, ext) {
    const name = (state.personal?.fullName || 'curriculo').replace(/\s+/g, '-').toLowerCase();
    return `${name}.${ext}`;
  }

  function buildPlainText(state) {
    const doc = EuGeroCvData.build(state);
    const p = doc.personal;
    const lines = [];
    const divider = '---';

    lines.push(p.fullName, p.headline, doc.sidebar.contact.join(' | '), '');

    doc.sections.forEach(section => {
      lines.push(divider, section.title.toUpperCase(), divider);
      section.blocks.forEach(block => {
        if (block.type === 'text') lines.push(block.text);
        else if (block.type === 'tags') lines.push(block.items.join(', '));
        else if (block.type === 'line') lines.push(block.text);
        else if (block.type === 'entry') {
          lines.push(`${block.title}${block.subtitle ? ` | ${block.subtitle}` : ''}`);
          if (block.period) lines.push(block.period);
          if (block.description) lines.push(block.description);
        }
        lines.push('');
      });
    });

    return lines.join('\n');
  }

  function exportTxt(state) {
    downloadBlob(new Blob([buildPlainText(state)], { type: 'text/plain;charset=utf-8' }), getFileName(state, 'txt'));
  }

  async function generateQrDataUrl(url) {
    if (!url || typeof QRCode === 'undefined') return null;
    try {
      return await QRCode.toDataURL(url, { width: 80, margin: 1 });
    } catch (e) {
      return null;
    }
  }

  async function exportPdf(state, template) {
    if (typeof window.jspdf === 'undefined' && typeof jspdf === 'undefined') {
      alert('Biblioteca jsPDF não carregada.');
      return;
    }

    const { jsPDF } = window.jspdf || jspdf;
    const enabledSections = EuGeroConfig.getActiveSections(state.enabledSections);
    const doc = EuGeroCvData.build(state, enabledSections);
    const tpl = template === 'modern' ? 'modern' : 'classic';

    if (tpl === 'modern') {
      await exportPdfModern(jsPDF, doc, state);
    } else {
      await exportPdfClassic(jsPDF, doc, state);
    }
  }

  async function exportPdfClassic(jsPDF, cvDoc, state) {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const margin = 18;
    const contentW = W - margin * 2;
    let y = 22;

    const drawFooter = async () => {
      const url = cvDoc.personal.linkedinUrl?.trim();
      if (!url) return;
      const qr = await generateQrDataUrl(url);
      pdf.setFontSize(7);
      pdf.setTextColor(100, 100, 100);
      if (qr) {
        pdf.addImage(qr, 'PNG', margin, H - 18, 10, 10);
        pdf.text(url, margin + 12, H - 10);
      } else {
        pdf.text(url, margin, H - 10);
      }
    };

    const newPageIfNeeded = (need) => {
      if (y + need > H - 22) {
        pdf.addPage();
        y = 22;
      }
    };

    const p = cvDoc.personal;
    pdf.setTextColor(...CLASSIC_DARK);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text(p.fullName || 'Seu Nome', W / 2, y, { align: 'center' });
    y += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(71, 85, 105);
    pdf.text(p.headline || '', W / 2, y, { align: 'center' });
    y += 5;
    const contact = cvDoc.sidebar.contact.join('  ·  ');
    pdf.setFontSize(8);
    pdf.text(contact || '', W / 2, y, { align: 'center' });
    y += 4;
    pdf.setDrawColor(...CLASSIC_DARK);
    pdf.setLineWidth(0.4);
    pdf.line(margin, y, W - margin, y);
    y += 8;

    cvDoc.sections.forEach(section => {
      newPageIfNeeded(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...CLASSIC_DARK);
      pdf.text(section.title.toUpperCase(), margin, y);
      y += 1;
      pdf.setDrawColor(203, 213, 225);
      pdf.setLineWidth(0.2);
      pdf.line(margin, y, W - margin, y);
      y += 5;

      section.blocks.forEach(block => {
        if (block.type === 'text') {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(51, 65, 85);
          const lines = pdf.splitTextToSize(block.text, contentW);
          newPageIfNeeded(lines.length * 4 + 2);
          pdf.text(lines, margin, y);
          y += lines.length * 4 + 3;
        } else if (block.type === 'tags') {
          pdf.setFontSize(8);
          pdf.setTextColor(51, 65, 85);
          const text = block.items.join('   ·   ');
          const lines = pdf.splitTextToSize(text, contentW);
          newPageIfNeeded(lines.length * 4);
          pdf.text(lines, margin, y);
          y += lines.length * 4 + 3;
        } else if (block.type === 'line') {
          newPageIfNeeded(5);
          pdf.setFontSize(9);
          pdf.text(block.text, margin, y);
          y += 5;
        } else if (block.type === 'entry') {
          newPageIfNeeded(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(...CLASSIC_DARK);
          const titleLine = block.subtitle ? `${block.title}  —  ${block.subtitle}` : block.title;
          pdf.text(titleLine, margin, y);
          y += 4;
          if (block.period) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(148, 163, 184);
            pdf.text(block.period, margin, y);
            y += 4;
          }
          if (block.description) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8.5);
            pdf.setTextColor(51, 65, 85);
            const lines = pdf.splitTextToSize(block.description, contentW);
            newPageIfNeeded(lines.length * 3.5);
            pdf.text(lines, margin, y);
            y += lines.length * 3.5 + 1;
          }
          y += 2;
        }
      });
      y += 2;
    });

    await drawFooter();
    pdf.save(getFileName(state, 'pdf'));
  }

  async function exportPdfModern(jsPDF, cvDoc, state) {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const sidebarW = 68;
    const mainX = sidebarW + 8;
    const mainW = W - mainX - 12;
    let mainY = 18;

    const drawSidebar = () => {
      pdf.setFillColor(...MODERN_BLUE);
      pdf.rect(0, 0, sidebarW, H, 'F');

      let sy = 16;
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      const nameLines = pdf.splitTextToSize(cvDoc.personal.fullName || 'Seu Nome', sidebarW - 12);
      pdf.text(nameLines, 8, sy);
      sy += nameLines.length * 5 + 2;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      const headLines = pdf.splitTextToSize(cvDoc.personal.headline || '', sidebarW - 12);
      pdf.text(headLines, 8, sy);
      sy += headLines.length * 3.5 + 6;

      const sidebarBlock = (title, lines) => {
        if (!lines.length) return;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.text(title.toUpperCase(), 8, sy);
        sy += 1;
        pdf.setDrawColor(255, 255, 255);
        pdf.setLineWidth(0.15);
        pdf.line(8, sy, sidebarW - 8, sy);
        sy += 4;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        lines.forEach(line => {
          const wrapped = pdf.splitTextToSize(line, sidebarW - 14);
          pdf.text(wrapped, 8, sy);
          sy += wrapped.length * 3.2 + 1;
        });
        sy += 4;
      };

      sidebarBlock('Contato', cvDoc.sidebar.contact.length ? cvDoc.sidebar.contact : ['']);
      sidebarBlock('Habilidades', cvDoc.sidebar.skills);
      sidebarBlock('Idiomas', cvDoc.sidebar.languages.map(l => `${l.language} — ${l.level}`));
    };

    const mainSections = EuGeroCvData.getMainSections(cvDoc, 'modern');

    const newMainPage = () => {
      pdf.addPage();
      drawSidebar();
      mainY = 18;
    };

    const mainNewPageIfNeeded = (need) => {
      if (mainY + need > H - 18) newMainPage();
    };

    drawSidebar();

    mainSections.forEach(section => {
      mainNewPageIfNeeded(12);
      pdf.setTextColor(...MODERN_BLUE);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(section.title.toUpperCase(), mainX, mainY);
      mainY += 1;
      pdf.setDrawColor(...MODERN_BLUE);
      pdf.setLineWidth(0.25);
      pdf.line(mainX, mainY, mainX + mainW, mainY);
      mainY += 5;

      section.blocks.forEach(block => {
        if (block.type === 'text') {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8.5);
          pdf.setTextColor(51, 65, 85);
          const lines = pdf.splitTextToSize(block.text, mainW);
          mainNewPageIfNeeded(lines.length * 3.5);
          pdf.text(lines, mainX, mainY);
          mainY += lines.length * 3.5 + 3;
        } else if (block.type === 'line') {
          mainNewPageIfNeeded(5);
          pdf.setFontSize(8.5);
          pdf.setTextColor(51, 65, 85);
          pdf.text(block.text, mainX, mainY);
          mainY += 5;
        } else if (block.type === 'entry') {
          mainNewPageIfNeeded(10);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          pdf.setTextColor(30, 41, 59);
          pdf.text(block.title, mainX, mainY);
          if (block.period) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.5);
            pdf.setTextColor(148, 163, 184);
            pdf.text(block.period, mainX + mainW, mainY, { align: 'right' });
          }
          mainY += 4;
          if (block.subtitle) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(100, 116, 139);
            pdf.text(block.subtitle, mainX, mainY);
            mainY += 4;
          }
          if (block.description) {
            pdf.setFontSize(8);
            pdf.setTextColor(51, 65, 85);
            const lines = pdf.splitTextToSize(block.description, mainW);
            mainNewPageIfNeeded(lines.length * 3.5);
            pdf.text(lines, mainX, mainY);
            mainY += lines.length * 3.5 + 1;
          }
          mainY += 2;
        }
      });
      mainY += 2;
    });

    const url = cvDoc.personal.linkedinUrl?.trim();
    if (url) {
      const qr = await generateQrDataUrl(url);
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(7);
      if (qr) {
        pdf.addImage(qr, 'PNG', mainX, H - 16, 9, 9);
        pdf.text(url, mainX + 11, H - 10);
      }
    }

    pdf.save(getFileName(state, 'pdf'));
  }

  async function exportDocx(state, template) {
    try {
      const docx = await import('https://cdn.jsdelivr.net/npm/docx@8.5.0/+esm');
      const tpl = template === 'modern' ? 'modern' : 'classic';
      const enabledSections = EuGeroConfig.getActiveSections(state.enabledSections);
      const cvDoc = EuGeroCvData.build(state, enabledSections);

      if (tpl === 'modern') {
        await exportDocxModern(docx, cvDoc, state);
      } else {
        await exportDocxClassic(docx, cvDoc, state);
      }
    } catch (e) {
      console.error('Erro ao exportar Word:', e);
      alert('Não foi possível gerar o arquivo Word.');
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

  async function exportDocxClassic(docx, cvDoc, state) {
    const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = docx;
    const p = cvDoc.personal;
    const children = [];

    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: p.fullName || 'Currículo', bold: true, size: 36, color: '1E293B' })],
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
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1E293B' } }
      }));
    }

    cvDoc.sections.forEach(section => {
      children.push(new Paragraph({
        children: [new TextRun({ text: section.title.toUpperCase(), bold: true, size: 20, color: '1E293B' })],
        spacing: { before: 200, after: 60 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' } }
      }));
      section.blocks.forEach(block => {
        if (block.type === 'text') {
          children.push(new Paragraph({ children: [new TextRun({ text: block.text, size: 18 })], spacing: { after: 120 } }));
        } else if (block.type === 'tags') {
          children.push(new Paragraph({ children: [new TextRun({ text: block.items.join('  ·  '), size: 18 })], spacing: { after: 120 } }));
        } else if (block.type === 'line') {
          children.push(new Paragraph({ children: [new TextRun({ text: block.text, size: 18 })], spacing: { after: 80 } }));
        } else if (block.type === 'entry') {
          children.push(...entryParagraphs(Paragraph, TextRun, block));
        }
      });
    });

    const document = new Document({ sections: [{ children }] });
    downloadBlob(await Packer.toBlob(document), getFileName(state, 'docx'));
  }

  async function exportDocxModern(docx, cvDoc, state) {
    const {
      Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
      WidthType, ShadingType, VerticalAlign, BorderStyle, AlignmentType
    } = docx;

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
    sidebarSection('Idiomas', cvDoc.sidebar.languages.map(l => `${l.language} — ${l.level}`));

    const mainChildren = [];
    EuGeroCvData.getMainSections(cvDoc, 'modern').forEach(section => {
      mainChildren.push(new Paragraph({
        children: [new TextRun({ text: section.title.toUpperCase(), bold: true, size: 20, color: '2962FF' })],
        spacing: { before: 160, after: 60 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '2962FF' } }
      }));
      section.blocks.forEach(block => {
        if (block.type === 'text') {
          mainChildren.push(new Paragraph({ children: [new TextRun({ text: block.text, size: 18 })], spacing: { after: 120 } }));
        } else if (block.type === 'line') {
          mainChildren.push(new Paragraph({ children: [new TextRun({ text: block.text, size: 18 })], spacing: { after: 80 } }));
        } else if (block.type === 'entry') {
          mainChildren.push(...entryParagraphs(Paragraph, TextRun, block));
        }
      });
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
              width: { size: 28, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: '2962FF' },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 200, bottom: 200, left: 200, right: 120 },
              children: sidebarChildren
            }),
            new TableCell({
              width: { size: 72, type: WidthType.PERCENTAGE },
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

  return {
    exportTxt,
    exportPdf,
    exportDocx,
    buildPlainText,
    downloadBlob,
    getFileName
  };
})();
