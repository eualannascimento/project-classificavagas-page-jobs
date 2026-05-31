/**
 * Web Worker: parse and prepare large jobs JSON off the main thread.
 */
'use strict';

const FILTER_KEYS = [
    'company_type',
    'level',
    'category',
    'company',
    'location_scope',
    'location_country',
    'location_state',
    'location_city'
];

function normalizeSearchText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function buildSearchText(job) {
    return normalizeSearchText([
        job.title,
        job.company,
        job.company_type,
        job.level,
        job.category,
        job.sub_category,
        job.location,
        job.location_city,
        job.location_state
    ].filter(Boolean).join(' '));
}

function prepareJobs(data) {
    for (let i = 0; i < data.length; i++) {
        const job = data[i];
        job.id = i + 1;
        if (!job._searchText) {
            job._searchText = buildSearchText(job);
        }
    }
    return data;
}

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
        self.postMessage({ id, type: 'parsed', data: prepareJobs(data) });
    } catch (err) {
        self.postMessage({ id, type: 'error', message: err.message || 'Parse failed' });
    }
};
