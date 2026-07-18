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
    try {
      downloadBlob(new Blob([buildPlainText(state)], { type: 'text/plain;charset=utf-8' }), getFileName(state, 'txt'));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Nao foi possivel gerar o TXT.' };
    }
  }

  async function generateQrDataUrl(url) {
    if (!url || typeof QRCode === 'undefined') return null;
    try {
      return await QRCode.toDataURL(url, { width: 80, margin: 1 });
    } catch (e) {
      return null;
    }
  }

  /**
   * Word editável fiel à prévia: gera um .doc em HTML com o MESMO markup
   * da prévia e o CSS dos templates com as variáveis resolvidas
   * (Word não entende var()/color-mix). Abre no Word e no Google Docs.
   */
  const DOC_VAR_MAP = [
    ["var(--font-heading)", "'Arial Narrow', Arial, sans-serif"],
    ["var(--font-body)", "Arial, sans-serif"],
    ['var(--color-accent-2-100)', '#eef6ff'],
    ['var(--color-accent-100)', '#eef6ff'],
    ['var(--color-accent-700)', '#416180'],
    ['var(--color-accent-800)', '#2c455d'],
    ['var(--color-accent-900)', '#1d2d3d'],
    ['var(--color-accent)', '#5980a6'],
    ['var(--color-neutral-100)', '#f5f5f8'],
    ['var(--color-neutral-200)', '#e7e7ea'],
    ['var(--color-neutral-500)', '#98989b'],
    ['var(--color-neutral-600)', '#7a7a7d'],
    ['var(--color-neutral-800)', '#424244'],
    ['var(--color-divider)', '#d4d4d7'],
    ['var(--color-text)', '#1d1f20']
  ];

  let cvCssCache = null;

  function getCvCss() {
    // Le as regras do curriculo direto da folha ja carregada (sem rede).
    if (cvCssCache) return cvCssCache;
    let css = '';
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      if (!rules) continue;
      for (const rule of rules) {
        const sel = rule.selectorText || '';
        if (/^\.(cv|template-|preview-content)/.test(sel) || sel.includes(' .cv') || sel.includes('.cv-')) {
          css += rule.cssText + '\n';
        }
      }
    }
    DOC_VAR_MAP.forEach(([from, to]) => { css = css.split(from).join(to); });
    css = css.replace(/color-mix\([^)]*\)/g, '#7a7a7d');
    cvCssCache = css;
    return css;
  }

  async function exportDoc(state) {
    try {
      const sections = EuGeroConfig.getActiveSections(state.enabledSections);
      const inner = EuGeroPreview.render(state, state.template, sections);
      const css = getCvCss();
      const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Currículo</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; line-height: 1.35; color: #1a1a2e; margin: 24px; }
  ${css}
  /* Cabecalhos de item legiveis no Word (sem flex) */
  .cv-item-header { display: block; }
  .cv-item-header .cv-period { float: right; }
</style></head>
<body>${inner}</body></html>`;
      downloadBlob(new Blob(['﻿', html], { type: 'application/msword' }), getFileName(state, 'doc'));
      return { ok: true };
    } catch (e) {
      console.error('Erro ao exportar Word:', e);
      return { ok: false, error: 'Nao foi possivel gerar o arquivo Word.' };
    }
  }

  /**
   * Aplica margens e espaçamento escolhidos na prévia ao PDF:
   * escala todas as fontes (densidade) e devolve o fator de margem.
   */
  function tunePdf(pdf, state) {
    const fsFactor = state?.density === 'condensado' ? 0.94 : 1;
    if (fsFactor !== 1) {
      const original = pdf.setFontSize.bind(pdf);
      pdf.setFontSize = (n) => original(n * fsFactor);
    }
    if (state?.margin === 'estreita') return 0.72;
    if (state?.margin === 'confortavel') return 1.28;
    return 1;
  }

  async function exportPdf(state, templateId) {
    if (typeof EuGeroLibs !== 'undefined' && !EuGeroLibs.hasJsPdf()) {
      return { ok: false, error: 'PDF indisponivel: biblioteca jsPDF nao carregada. Verifique conexao ou pasta vendor/.' };
    }
    if (typeof window.jspdf === 'undefined' && typeof jspdf === 'undefined') {
      return { ok: false, error: 'PDF indisponivel: biblioteca jsPDF nao carregada.' };
    }

    try {
      const { jsPDF } = window.jspdf || jspdf;
      const meta = EuGeroConfig.getTemplateMeta(templateId);
      const enabledSections = EuGeroConfig.getActiveSections(state.enabledSections);
      const cvDoc = EuGeroCvData.build(state, enabledSections);

      switch (meta.layout) {
        case 'sidebar':
          await exportPdfSidebar(jsPDF, cvDoc, state, meta, templateId);
          break;
        case 'banner':
          await exportPdfBanner(jsPDF, cvDoc, state, meta);
          break;
        case 'left':
          await exportPdfLeft(jsPDF, cvDoc, state, meta);
          break;
        case 'creative':
          await exportPdfCreative(jsPDF, cvDoc, state, meta);
          break;
        default:
          await exportPdfClassic(jsPDF, cvDoc, state, meta);
      }
      return { ok: true };
    } catch (e) {
      console.error('Erro ao exportar PDF:', e);
      return { ok: false, error: 'Nao foi possivel gerar o PDF.' };
    }
  }

  async function exportPdfClassic(jsPDF, cvDoc, state, meta) {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const margin = Math.round(18 * tunePdf(pdf, state));
    const contentW = W - margin * 2;
    let y = 22;
    const accent = meta?.accentRgb || CLASSIC_DARK;
    const isElegant = meta?.id === 'elegant';

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
    pdf.setTextColor(...accent);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(isElegant ? 19 : 18);
    pdf.text((p.fullName || 'Seu Nome').toUpperCase(), W / 2, y, { align: 'center' });
    y += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...accent);
    pdf.text((p.headline || '').toUpperCase(), W / 2, y, { align: 'center' });
    y += 5;
    const contact = cvDoc.sidebar.contact.join('  ·  ');
    pdf.setFontSize(8);
    pdf.text(contact || '', W / 2, y, { align: 'center' });
    y += isElegant ? 5 : 4;
    pdf.setDrawColor(...accent);
    pdf.setLineWidth(isElegant ? 0.6 : 0.4);
    pdf.line(margin, y, W - margin, y);
    if (isElegant) {
      y += 1.5;
      pdf.setLineWidth(0.2);
      pdf.line(margin + 20, y, W - margin - 20, y);
    }
    y += 6;

    cvDoc.sections.forEach(section => {
      newPageIfNeeded(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...(isElegant ? [29, 31, 32] : accent));
      if (isElegant) {
        pdf.text(section.title.toUpperCase().split('').join(' '), W / 2, y, { align: 'center' });
      } else {
        pdf.text(section.title.toUpperCase(), margin, y);
      }
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
          pdf.setTextColor(29, 31, 32);
          pdf.text(block.title, margin, y);
          if (block.period) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(107, 109, 111);
            pdf.text(block.period, W - margin, y, { align: 'right' });
          }
          y += 4;
          if (block.subtitle) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(...accent);
            pdf.text(block.subtitle, margin, y);
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

  async function exportPdfCreative(jsPDF, cvDoc, state, meta) {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const margin = Math.round(18 * tunePdf(pdf, state));
    const contentW = W - margin * 2;
    let y = 20;
    const accent = meta?.accentRgb || [89, 128, 166];
    const badge = meta?.badgeRgb || accent;

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
      if (y + need > H - 22) { pdf.addPage(); y = 22; }
    };

    const p = cvDoc.personal;
    const parts = (p.fullName || '').trim().split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'SN';

    // Selo de iniciais
    const badgeSize = 16;
    pdf.setFillColor(...badge);
    pdf.rect(margin, y, badgeSize, badgeSize, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text(initials, margin + badgeSize / 2, y + badgeSize / 2 + 2, { align: 'center' });

    // Identificacao ao lado do selo
    const idX = margin + badgeSize + 5;
    let iy = y + 4;
    pdf.setTextColor(29, 31, 32);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.text(p.fullName || 'Seu Nome', idX, iy);
    iy += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...accent);
    pdf.text((p.headline || '').toUpperCase(), idX, iy);
    iy += 4;
    pdf.setFontSize(8);
    pdf.setTextColor(107, 109, 111);
    pdf.text(cvDoc.sidebar.contact.join('  ·  ') || '', idX, iy);
    y = Math.max(y + badgeSize, iy) + 7;

    cvDoc.sections.forEach(section => {
      newPageIfNeeded(14);
      pdf.setFillColor(...accent);
      pdf.rect(margin, y - 2.6, 5, 1.4, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...accent);
      pdf.text(section.title.toUpperCase(), margin + 7, y);
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
          pdf.setTextColor(51, 65, 85);
          pdf.text(block.text, margin, y);
          y += 5;
        } else if (block.type === 'entry') {
          newPageIfNeeded(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(29, 31, 32);
          pdf.text(block.title, margin, y);
          if (block.period) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(107, 109, 111);
            pdf.text(block.period, W - margin, y, { align: 'right' });
          }
          y += 4;
          if (block.subtitle) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(...accent);
            pdf.text(block.subtitle, margin, y);
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

  async function exportPdfSidebar(jsPDF, cvDoc, state, meta, templateId) {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    tunePdf(pdf, state);
    const sidebarW = 68;
    const mainX = sidebarW + 8;
    const mainW = W - mainX - 12;
    let mainY = 18;
    // Sidebar clara com texto escuro, igual à prévia (accent-100 / accent-2-100).
    const isCreativeSide = meta.id === 'creative';
    const SIDE_BG = isCreativeSide ? [238, 246, 255] : [238, 246, 255];
    const SIDE_NAME = isCreativeSide ? [31, 45, 58] : [29, 45, 61];
    const SIDE_ACCENT = isCreativeSide ? [72, 96, 119] : [65, 97, 128];
    const SIDE_TEXT = [58, 60, 62];
    const accentRgb = SIDE_ACCENT;

    const drawSidebar = () => {
      pdf.setFillColor(...SIDE_BG);
      pdf.rect(0, 0, sidebarW, H, 'F');
      pdf.setDrawColor(200, 205, 210);
      pdf.setLineWidth(0.2);
      pdf.line(sidebarW, 0, sidebarW, H);

      let sy = 16;
      pdf.setTextColor(...SIDE_NAME);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      const nameLines = pdf.splitTextToSize((cvDoc.personal.fullName || 'Seu Nome').toUpperCase(), sidebarW - 12);
      pdf.text(nameLines, 8, sy);
      sy += nameLines.length * 5 + 2;

      pdf.setTextColor(...SIDE_ACCENT);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      const headLines = pdf.splitTextToSize((cvDoc.personal.headline || '').toUpperCase(), sidebarW - 12);
      pdf.text(headLines, 8, sy);
      sy += headLines.length * 3.5 + 6;

      const sidebarBlock = (title, lines) => {
        if (!lines.length) return;
        pdf.setTextColor(...SIDE_ACCENT);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.text(title.toUpperCase(), 8, sy);
        sy += 4;
        pdf.setTextColor(...SIDE_TEXT);
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
      sidebarBlock('Idiomas', cvDoc.sidebar.languages.map(l => `${l.language}${l.level ? ' - ' + l.level : ''}`));
    };

    const mainSections = EuGeroCvData.getMainSections(cvDoc, templateId);

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
      pdf.setTextColor(...accentRgb);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(section.title.toUpperCase(), mainX, mainY);
      mainY += 1;
      pdf.setDrawColor(...accentRgb);
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

  async function exportPdfBanner(jsPDF, cvDoc, state, meta) {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const margin = Math.round(15 * tunePdf(pdf, state));
    const contentW = W - margin * 2;
    const bannerColor = meta.bannerRgb || [15, 23, 42];
    let y = 38;

    pdf.setFillColor(...bannerColor);
    pdf.rect(0, 0, W, 32, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text(cvDoc.personal.fullName || 'Seu Nome', margin, 14);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(cvDoc.personal.headline || '', margin, 21);
    pdf.setFontSize(8);
    pdf.text(cvDoc.sidebar.contact.join('  ·  '), margin, 27);

    const renderSections = (startY) => {
      let cy = startY;
      const newPageIfNeeded = (need) => {
        if (cy + need > H - 18) { pdf.addPage(); cy = 20; }
      };
      cvDoc.sections.forEach(section => {
        newPageIfNeeded(14);
        pdf.setTextColor(...bannerColor);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(section.title.toUpperCase(), margin, cy);
        cy += 5;
        section.blocks.forEach(block => {
          pdf.setTextColor(51, 65, 85);
          pdf.setFontSize(8.5);
          if (block.type === 'text') {
            const lines = pdf.splitTextToSize(block.text, contentW);
            newPageIfNeeded(lines.length * 3.5);
            pdf.text(lines, margin, cy);
            cy += lines.length * 3.5 + 3;
          } else if (block.type === 'tags') {
            pdf.text(block.items.join(' · '), margin, cy);
            cy += 5;
          } else if (block.type === 'entry') {
            pdf.setFont('helvetica', 'bold');
            pdf.text(block.title, margin, cy);
            cy += 4;
            pdf.setFont('helvetica', 'normal');
            if (block.subtitle) { pdf.text(block.subtitle, margin, cy); cy += 4; }
            if (block.description) {
              const lines = pdf.splitTextToSize(block.description, contentW);
              pdf.text(lines, margin, cy);
              cy += lines.length * 3.5;
            }
            cy += 3;
          }
        });
        cy += 3;
      });
      return cy;
    };

    renderSections(y);
    pdf.save(getFileName(state, 'pdf'));
  }

  async function exportPdfLeft(jsPDF, cvDoc, state, meta) {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const margin = Math.round(20 * tunePdf(pdf, state));
    const contentW = W - margin * 2;
    let y = 22;

    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(cvDoc.personal.fullName || 'Seu Nome', margin, y);
    y += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(cvDoc.personal.headline || '', margin, y);
    y += 4;
    pdf.setFontSize(8);
    pdf.text(cvDoc.sidebar.contact.join('  ·  '), margin, y);
    y += 8;

    const newPageIfNeeded = (need) => {
      if (y + need > H - 18) { pdf.addPage(); y = 20; }
    };

    cvDoc.sections.forEach(section => {
      newPageIfNeeded(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(section.title.toUpperCase(), margin, y);
      y += 5;
      section.blocks.forEach(block => {
        pdf.setTextColor(51, 65, 85);
        pdf.setFontSize(8.5);
        if (block.type === 'text') {
          const lines = pdf.splitTextToSize(block.text, contentW);
          newPageIfNeeded(lines.length * 3.5);
          pdf.text(lines, margin, y);
          y += lines.length * 3.5 + 3;
        } else if (block.type === 'entry') {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 41, 59);
          pdf.text(block.title, margin, y);
          y += 4;
          pdf.setFont('helvetica', 'normal');
          if (block.subtitle) { pdf.text(block.subtitle, margin, y); y += 4; }
          if (block.description) {
            const lines = pdf.splitTextToSize(block.description, contentW);
            pdf.text(lines, margin, y);
            y += lines.length * 3.5;
          }
          y += 3;
        }
      });
      y += 4;
    });

    pdf.save(getFileName(state, 'pdf'));
  }

  async function exportDocx(state, templateId) {
    try {
      const docx = await import('https://cdn.jsdelivr.net/npm/docx@8.5.0/+esm');
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
    sidebarSection('Idiomas', cvDoc.sidebar.languages.map(l => `${l.language} · ${l.level}`));

    const mainChildren = [];
    EuGeroCvData.getMainSections(cvDoc, templateId).forEach(section => {
      mainChildren.push(new Paragraph({
        children: [new TextRun({ text: section.title.toUpperCase(), bold: true, size: 20, color: fill })],
        spacing: { before: 160, after: 60 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: fill } }
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
              shading: { type: ShadingType.CLEAR, fill },
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
      section.blocks.forEach(block => {
        if (block.type === 'text') children.push(new Paragraph({ text: block.text, spacing: { after: 120 } }));
        else if (block.type === 'entry') children.push(...entryParagraphs(Paragraph, TextRun, block));
      });
    });
    const document = new Document({ sections: [{ children }] });
    downloadBlob(await Packer.toBlob(document), getFileName(state, 'docx'));
  }

  async function exportDocxLeft(docx, cvDoc, state) {
    await exportDocxClassic(docx, cvDoc, state, { accentHex: '64748B', layout: 'left' });
  }

  return {
    exportDoc,
    exportTxt,
    exportPdf,
    exportDocx,
    buildPlainText,
    downloadBlob,
    getFileName
  };
})();
