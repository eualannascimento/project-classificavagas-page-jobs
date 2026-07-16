/**
 * Deteccao de bibliotecas externas (CDN ou vendor local).
 */
const EuGeroLibs = (function () {
  'use strict';

  let docxChecked = null;
  let docxAvailable = false;

  function hasJsPdf() {
    return typeof window.jspdf !== 'undefined' || typeof jspdf !== 'undefined';
  }

  function hasQrCode() {
    return typeof QRCode !== 'undefined';
  }

  async function checkDocx() {
    if (docxChecked) return docxAvailable;
    docxChecked = true;
    try {
      // Mesma URL usada em export.js: a checagem deve refletir o caminho real de export.
      await import('https://cdn.jsdelivr.net/npm/docx@8.5.0/+esm');
      docxAvailable = true;
    } catch (e) {
      docxAvailable = false;
    }
    return docxAvailable;
  }

  function markDocxAvailable() {
    docxChecked = true;
    docxAvailable = true;
  }

  function hasDocxSync() {
    return docxAvailable;
  }

  async function probeAll() {
    const pdf = hasJsPdf();
    const qr = hasQrCode();
    const docx = await checkDocx();
    return { pdf, qr, docx, txt: true };
  }

  function missingMessages(capabilities) {
    const msgs = [];
    if (!capabilities.pdf) {
      msgs.push('PDF: biblioteca jsPDF nao carregada. Use conexao na primeira visita ou arquivo em vendor/.');
    }
    if (!capabilities.qr) {
      msgs.push('QR Code no PDF: biblioteca qrcode nao carregada.');
    }
    if (!capabilities.docx) {
      msgs.push('Word: exportacao DOCX exige internet na primeira exportacao (CDN docx.js).');
    }
    return msgs;
  }

  return {
    hasJsPdf,
    hasQrCode,
    checkDocx,
    markDocxAvailable,
    hasDocxSync,
    probeAll,
    missingMessages
  };
})();
