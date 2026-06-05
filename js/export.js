/**
 * Exportação PDF, Word, TXT.
 */
const EuGeroExport = (function () {
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
    const p = state.personal || {};
    const lines = [];
    const divider = '---';

    lines.push(p.fullName || '');
    lines.push(p.headline || '');
    lines.push([p.email, p.phone, p.location, p.linkedinUrl].filter(Boolean).join(' | '));
    lines.push('');

    if (state.summary) {
      lines.push(divider, 'RESUMO', divider, state.summary, '');
    }

    if (state.experiences?.length) {
      lines.push(divider, 'EXPERIÊNCIA PROFISSIONAL', divider);
      state.experiences.forEach(e => {
        lines.push(`${e.title} | ${e.company}`);
        lines.push(`${e.startDate || ''} - ${e.endDate || 'Atual'}`);
        if (e.description) lines.push(e.description);
        lines.push('');
      });
    }

    if (state.education?.length) {
      lines.push(divider, 'FORMAÇÃO ACADÊMICA', divider);
      state.education.forEach(e => {
        lines.push(`${e.degree} | ${e.institution}`);
        lines.push(`${e.startDate || ''} - ${e.endDate || ''}`);
        lines.push('');
      });
    }

    if (state.skills?.length) {
      lines.push(divider, 'HABILIDADES', divider);
      lines.push(state.skills.map(s => s.name || s).filter(Boolean).join(', '));
      lines.push('');
    }

    if (state.languages?.length) {
      lines.push(divider, 'IDIOMAS', divider);
      state.languages.forEach(l => lines.push(`${l.language}: ${l.level}`));
      lines.push('');
    }

    if (state.certifications?.length) {
      lines.push(divider, 'CERTIFICADOS', divider);
      state.certifications.forEach(c => lines.push(`${c.name} — ${c.issuer} (${c.date || ''})`));
      lines.push('');
    }

    if (state.projects?.length) {
      lines.push(divider, 'PROJETOS', divider);
      state.projects.forEach(p => {
        lines.push(p.name);
        if (p.description) lines.push(p.description);
        lines.push('');
      });
    }

    if (state.volunteering?.length) {
      lines.push(divider, 'VOLUNTARIADO', divider);
      state.volunteering.forEach(v => lines.push(`${v.role} — ${v.organization}: ${v.description || ''}`));
      lines.push('');
    }

    if (state.publications?.length) {
      lines.push(divider, 'PUBLICAÇÕES', divider);
      state.publications.forEach(pub => lines.push(`"${pub.title}" — ${pub.publisher}`));
      lines.push('');
    }

    if (state.awards?.length) {
      lines.push(divider, 'PRÊMIOS', divider);
      state.awards.forEach(a => lines.push(`${a.title} — ${a.issuer}`));
      lines.push('');
    }

    if (state.organizations?.length) {
      lines.push(divider, 'ORGANIZAÇÕES', divider);
      state.organizations.forEach(o => lines.push(`${o.name} — ${o.role}`));
      lines.push('');
    }

    if (state.courses?.length) {
      lines.push(divider, 'CURSOS', divider);
      state.courses.forEach(c => lines.push(`${c.name} — ${c.institution} (${c.date || ''})`));
    }

    return lines.join('\n');
  }

  function exportTxt(state) {
    const text = buildPlainText(state);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, getFileName(state, 'txt'));
  }

  async function generateQrDataUrl(url) {
    if (!url || typeof QRCode === 'undefined') return null;
    try {
      return await QRCode.toDataURL(url, { width: 80, margin: 1 });
    } catch (e) {
      console.warn('Erro ao gerar QR Code:', e);
      return null;
    }
  }

  async function exportPdf(state, template) {
    if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
      alert('Biblioteca jsPDF não carregada. Verifique sua conexão.');
      return;
    }

    const { jsPDF } = window.jspdf || jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const p = state.personal || {};
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;
    const lineHeight = 6;
    const contentWidth = pageWidth - margin * 2;

    function checkPageBreak(needed) {
      if (y + needed > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = margin;
      }
    }

    function addText(text, size, style, color) {
      if (!text) return;
      doc.setFontSize(size);
      doc.setFont('helvetica', style || 'normal');
      if (color) doc.setTextColor(...color);
      else doc.setTextColor(0, 0, 0);

      const lines = doc.splitTextToSize(text, contentWidth);
      checkPageBreak(lines.length * lineHeight);
      doc.text(lines, margin, y);
      y += lines.length * lineHeight + 2;
    }

    function addSection(title) {
      checkPageBreak(12);
      y += 4;
      if (template === 'modern') {
        doc.setFillColor(41, 98, 255);
        doc.rect(margin, y - 4, contentWidth, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin + 2, y + 1);
        doc.setTextColor(0, 0, 0);
      } else {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, y);
      }
      y += lineHeight + 2;
    }

    // Header
    if (template === 'modern') {
      doc.setFillColor(41, 98, 255);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(p.fullName || 'Seu Nome', margin, 15);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(p.headline || '', margin, 23);
      const contact = [p.email, p.phone, p.location].filter(Boolean).join(' · ');
      doc.setFontSize(9);
      doc.text(contact, margin, 30);
      doc.setTextColor(0, 0, 0);
      y = 42;
    } else {
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(p.fullName || 'Seu Nome', margin, y);
      y += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(p.headline || '', margin, y);
      y += 6;
      const contact = [p.email, p.phone, p.location, p.linkedinUrl].filter(Boolean).join(' · ');
      doc.setFontSize(9);
      addText(contact, 9);
    }

    if (state.summary) {
      addSection('Resumo');
      addText(state.summary, 10);
    }

    if (state.experiences?.length) {
      addSection('Experiência Profissional');
      state.experiences.forEach(e => {
        addText(`${e.title} — ${e.company}`, 11, 'bold');
        addText(`${e.startDate || ''} - ${e.endDate || 'Atual'}`, 9);
        addText(e.description, 10);
      });
    }

    if (state.education?.length) {
      addSection('Formação Acadêmica');
      state.education.forEach(e => {
        addText(`${e.degree} — ${e.institution}`, 11, 'bold');
        addText(`${e.startDate || ''} - ${e.endDate || ''}`, 9);
      });
    }

    if (state.skills?.length) {
      addSection('Habilidades');
      addText(state.skills.map(s => s.name || s).filter(Boolean).join(', '), 10);
    }

    if (state.languages?.length) {
      addSection('Idiomas');
      state.languages.forEach(l => addText(`${l.language}: ${l.level}`, 10));
    }

    if (state.certifications?.length) {
      addSection('Certificados');
      state.certifications.forEach(c => addText(`${c.name} — ${c.issuer}`, 10));
    }

    if (state.projects?.length) {
      addSection('Projetos');
      state.projects.forEach(proj => {
        addText(proj.name, 11, 'bold');
        addText(proj.description, 10);
      });
    }

    if (state.volunteering?.length) {
      addSection('Voluntariado');
      state.volunteering.forEach(v => addText(`${v.role} — ${v.organization}`, 10));
    }

    if (state.publications?.length) {
      addSection('Publicações');
      state.publications.forEach(pub => addText(`"${pub.title}" — ${pub.publisher}`, 10));
    }

    if (state.awards?.length) {
      addSection('Prêmios');
      state.awards.forEach(a => addText(`${a.title} — ${a.issuer}`, 10));
    }

    if (state.organizations?.length) {
      addSection('Organizações');
      state.organizations.forEach(o => addText(`${o.name} — ${o.role}`, 10));
    }

    if (state.courses?.length) {
      addSection('Cursos');
      state.courses.forEach(c => addText(`${c.name} — ${c.institution}`, 10));
    }

    // QR Code footer
    const linkedinUrl = p.linkedinUrl?.trim();
    if (linkedinUrl) {
      const qrDataUrl = await generateQrDataUrl(linkedinUrl);
      const pageHeight = doc.internal.pageSize.getHeight();
      if (qrDataUrl) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('LinkedIn:', margin, pageHeight - 15);
        doc.addImage(qrDataUrl, 'PNG', margin, pageHeight - 14, 12, 12);
        doc.text(linkedinUrl, margin + 15, pageHeight - 8);
      }
    }

    doc.save(getFileName(state, 'pdf'));
  }

  async function exportDocx(state) {
    try {
      const docx = await import('https://cdn.jsdelivr.net/npm/docx@8.5.0/+esm');
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;
      const p = state.personal || {};
      const children = [];

      children.push(new Paragraph({
        children: [new TextRun({ text: p.fullName || 'Currículo', bold: true, size: 32 })],
        heading: HeadingLevel.TITLE
      }));

      if (p.headline) {
        children.push(new Paragraph({ children: [new TextRun({ text: p.headline, size: 24 })] }));
      }

      const contact = [p.email, p.phone, p.location, p.linkedinUrl].filter(Boolean).join(' | ');
      if (contact) {
        children.push(new Paragraph({ children: [new TextRun({ text: contact, size: 20 })] }));
      }

      children.push(new Paragraph({ text: '' }));

      function addSection(title, items) {
        children.push(new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1
        }));
        items.forEach(item => children.push(item));
      }

      if (state.summary) {
        addSection('Resumo', [new Paragraph({ text: state.summary })]);
      }

      if (state.experiences?.length) {
        const items = [];
        state.experiences.forEach(e => {
          items.push(new Paragraph({ children: [new TextRun({ text: `${e.title} — ${e.company}`, bold: true })] }));
          items.push(new Paragraph({ text: `${e.startDate || ''} - ${e.endDate || 'Atual'}` }));
          if (e.description) items.push(new Paragraph({ text: e.description }));
          items.push(new Paragraph({ text: '' }));
        });
        addSection('Experiência Profissional', items);
      }

      if (state.education?.length) {
        const items = state.education.map(e =>
          new Paragraph({ children: [new TextRun({ text: `${e.degree} — ${e.institution}`, bold: true })] })
        );
        addSection('Formação Acadêmica', items);
      }

      if (state.skills?.length) {
        addSection('Habilidades', [
          new Paragraph({ text: state.skills.map(s => s.name || s).filter(Boolean).join(', ') })
        ]);
      }

      if (state.languages?.length) {
        addSection('Idiomas', state.languages.map(l =>
          new Paragraph({ text: `${l.language}: ${l.level}` })
        ));
      }

      if (state.certifications?.length) {
        addSection('Certificados', state.certifications.map(c =>
          new Paragraph({ text: `${c.name} — ${c.issuer}` })
        ));
      }

      if (state.projects?.length) {
        addSection('Projetos', state.projects.flatMap(proj => [
          new Paragraph({ children: [new TextRun({ text: proj.name, bold: true })] }),
          new Paragraph({ text: proj.description || '' })
        ]));
      }

      if (state.volunteering?.length) {
        addSection('Voluntariado', state.volunteering.map(v =>
          new Paragraph({ text: `${v.role} — ${v.organization}` })
        ));
      }

      if (state.publications?.length) {
        addSection('Publicações', state.publications.map(pub =>
          new Paragraph({ text: `"${pub.title}" — ${pub.publisher}` })
        ));
      }

      if (state.awards?.length) {
        addSection('Prêmios', state.awards.map(a =>
          new Paragraph({ text: `${a.title} — ${a.issuer}` })
        ));
      }

      if (state.organizations?.length) {
        addSection('Organizações', state.organizations.map(o =>
          new Paragraph({ text: `${o.name} — ${o.role}` })
        ));
      }

      if (state.courses?.length) {
        addSection('Cursos', state.courses.map(c =>
          new Paragraph({ text: `${c.name} — ${c.institution}` })
        ));
      }

      const document = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(document);
      downloadBlob(blob, getFileName(state, 'docx'));
    } catch (e) {
      console.error('Erro ao exportar Word:', e);
      alert('Não foi possível gerar o arquivo Word. Verifique sua conexão e tente novamente.');
    }
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
