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
        if (!Array.isArray(data)) {
            throw new Error('Invalid jobs data');
        }
        self.postMessage({ id, type: 'parsed', data });
    } catch (err) {
        self.postMessage({ id, type: 'error', message: err.message || 'Parse failed' });
    }
};
