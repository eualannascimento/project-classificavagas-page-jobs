/**
 * IndexedDB cache for parsed job catalog (C1 - docs/ux-audit.md).
 */
(function () {
    'use strict';

    const DB_NAME = 'cv_jobs_v1';
    const DB_VERSION = 1;
    const STORE = 'catalog';
    const RECORD_KEY = 'open_jobs';

    function openDb() {
        return new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) {
                reject(new Error('IndexedDB unavailable'));
                return;
            }
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onerror = () => reject(req.error || new Error('IDB open failed'));
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    db.createObjectStore(STORE);
                }
            };
            req.onsuccess = () => resolve(req.result);
        });
    }

    function withStore(mode, fn) {
        return openDb().then((db) => new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, mode);
            const store = tx.objectStore(STORE);
            let result;
            try {
                result = fn(store);
            } catch (err) {
                reject(err);
                return;
            }
            tx.oncomplete = () => resolve(result);
            tx.onerror = () => reject(tx.error || new Error('IDB tx failed'));
        }));
    }

    window.cvJobCache = {
        buildVersion(lastModified, jobCount) {
            return `${lastModified || 'unknown'}:${jobCount || 0}`;
        },

        async get() {
            try {
                return await withStore('readonly', (store) => new Promise((resolve, reject) => {
                    const req = store.get(RECORD_KEY);
                    req.onsuccess = () => resolve(req.result || null);
                    req.onerror = () => reject(req.error);
                }));
            } catch (_) {
                return null;
            }
        },

        async set(payload) {
            try {
                await withStore('readwrite', (store) => store.put(payload, RECORD_KEY));
                return true;
            } catch (_) {
                return false;
            }
        },

        async clear() {
            try {
                await withStore('readwrite', (store) => store.delete(RECORD_KEY));
            } catch (_) { /* ignore */ }
        }
    };
}());
