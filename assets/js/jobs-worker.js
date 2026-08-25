/**
 * Web Worker: parse large jobs JSON off the main thread.
 */
'use strict';

self.onmessage = (event) => {
    const { id, type, text } = event.data || {};
    if (type !== 'parse' || typeof text !== 'string') {
        self.postMessage({ id, type: 'error', message: 'Invalid parse request' });
        return;
    }
    try {
        const data = JSON.parse(text);
        // Dois formatos chegam aqui: a lista de objetos do recent_jobs.json e
        // o colunar do catalogo completo, `{campos, vagas}`. Aceitar so array
        // fazia o colunar ser rejeitado antes de chegar na reidratacao, e o
        // site caia no formato antigo depois de ja ter baixado o novo: eram
        // 27 MB em vez de 7,4.
        const colunar = data && Array.isArray(data.campos) && Array.isArray(data.vagas);
        if (!Array.isArray(data) && !colunar) {
            throw new Error('Invalid jobs data');
        }
        self.postMessage({ id, type: 'parsed', data });
    } catch (err) {
        self.postMessage({ id, type: 'error', message: err.message || 'Parse failed' });
    }
};
