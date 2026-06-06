/**
 * Job catalog loader with IndexedDB hydration (C1/C2 - docs/ux-audit.md).
 */
(function () {
    'use strict';

    const DEFER_KEY = 'cv_defer_full_catalog';

    function shouldWarnBeforeFullDownload() {
        try {
            if (sessionStorage.getItem(DEFER_KEY) === '1') return false;
        } catch (_) { /* ignore */ }
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!conn) return false;
        if (conn.saveData) return true;
        const slow = ['slow-2g', '2g', '3g'];
        return slow.includes(conn.effectiveType);
    }

    window.cvDataLoader = {
        create(deps) {
            const {
                state,
                elements,
                CONFIG,
                utils,
                skeletonLoader,
                jobsWorkerBridge,
                setSplashProgress,
                onReady,
                getFilterManager,
                getVisitedFilter
            } = deps;

            return {
                _slowNetworkTimer: null,
                _loadPromise: null,
                _fullDownloadApproved: !shouldWarnBeforeFullDownload(),

                setSplashMsg(msg) {
                    const el = document.getElementById('splashMsg');
                    if (el) el.textContent = msg;
                },

                async fetchJson(url, onProgress, { preferGzip = true, method = 'GET' } = {}) {
                    if (preferGzip && typeof DecompressionStream !== 'undefined' && method === 'GET') {
                        try {
                            return await this._fetchGzipJson(url + '.gz', onProgress);
                        } catch (_) { /* fallback */ }
                    }
                    return this._fetchJsonXHR(url, onProgress, method);
                },

                _fetchGzipJson(url, onProgress) {
                    return new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', url);
                        xhr.responseType = 'arraybuffer';
                        xhr.onprogress = (e) => { if (onProgress) onProgress(e); };
                        xhr.onload = async () => {
                            if (xhr.status < 200 || xhr.status >= 300) {
                                reject(new Error(xhr.statusText || `HTTP ${xhr.status}`));
                                return;
                            }
                            try {
                                const stream = new Blob([xhr.response]).stream().pipeThrough(new DecompressionStream('gzip'));
                                const text = await new Response(stream).text();
                                const data = await jobsWorkerBridge.parseJsonText(text);
                                resolve({ data, lastModified: xhr.getResponseHeader('last-modified') });
                            } catch (err) {
                                reject(err);
                            }
                        };
                        xhr.onerror = () => reject(new Error('Network error'));
                        xhr.send();
                    });
                },

                _fetchJsonXHR(url, onProgress, method = 'GET') {
                    return new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open(method, url);
                        xhr.responseType = method === 'HEAD' ? 'text' : 'text';
                        xhr.onprogress = (e) => { if (onProgress) onProgress(e); };
                        xhr.onload = async () => {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                if (method === 'HEAD') {
                                    resolve({ data: null, lastModified: xhr.getResponseHeader('last-modified') });
                                    return;
                                }
                                try {
                                    const data = await jobsWorkerBridge.parseJsonText(xhr.responseText);
                                    resolve({ data, lastModified: xhr.getResponseHeader('last-modified') });
                                } catch (err) {
                                    reject(err);
                                }
                            } else {
                                reject(new Error(xhr.statusText || `HTTP ${xhr.status}`));
                            }
                        };
                        xhr.onerror = () => reject(new Error('Network error'));
                        xhr.send();
                    });
                },

                ingestJobs(data, lastModified) {
                    if (!Array.isArray(data)) throw new Error('Invalid jobs data');
                    state.allJobs = data.map((job, i) => ({ ...job, id: i + 1 }));
                    state.allJobs.forEach((job) => {
                        const key = utils.getJobKey(job);
                        if (utils.isVisited(key)) state.visitedJobs.add(key);
                    });
                    this.buildFilterOptions();
                    this.updateLastModifiedFromHeader(lastModified);
                },

                async persistCache(data, lastModified) {
                    if (!window.cvJobCache) return;
                    const version = window.cvJobCache.buildVersion(lastModified, data.length);
                    await window.cvJobCache.set({
                        jobs: data,
                        version,
                        lastModified: lastModified || '',
                        jobCount: data.length,
                        cachedAt: Date.now()
                    });
                },

                async hydrateFromCache() {
                    if (!window.cvJobCache) return null;
                    const cached = await window.cvJobCache.get();
                    if (!cached?.jobs?.length) return null;
                    return cached;
                },

                updatePartialBanner() {
                    const banner = document.getElementById('partialDataBanner');
                    if (!banner) return;
                    if (state.isPartialData) {
                        banner.classList.remove('hidden');
                        banner.textContent = `Exibindo vagas recentes (${state.allJobs.length.toLocaleString('pt-BR')}). Catálogo completo carregando em segundo plano…`;
                    } else {
                        banner.classList.add('hidden');
                    }
                },

                showDataUsageBanner(onApprove, onDefer) {
                    let banner = document.getElementById('dataUsageBanner');
                    if (!banner) {
                        banner = document.createElement('aside');
                        banner.id = 'dataUsageBanner';
                        banner.className = 'data-usage-banner';
                        banner.setAttribute('role', 'alertdialog');
                        banner.setAttribute('aria-labelledby', 'dataUsageTitle');
                        banner.innerHTML = `
                            <p id="dataUsageTitle"><strong>Download do catálogo completo</strong> (~2 MB). Sua conexão parece limitada.</p>
                            <div class="data-usage-actions">
                                <button type="button" class="text-button" id="dataUsageDefer">Adiar</button>
                                <button type="button" class="filled-button" id="dataUsageApprove">Baixar agora</button>
                            </div>`;
                        const chrome = document.getElementById('appChrome');
                        if (chrome) chrome.insertAdjacentElement('afterend', banner);
                    }
                    banner.classList.remove('hidden');
                    banner.querySelector('#dataUsageApprove')?.addEventListener('click', () => {
                        banner.classList.add('hidden');
                        this._fullDownloadApproved = true;
                        onApprove();
                    }, { once: true });
                    banner.querySelector('#dataUsageDefer')?.addEventListener('click', () => {
                        banner.classList.add('hidden');
                        try { sessionStorage.setItem(DEFER_KEY, '1'); } catch (_) { /* ignore */ }
                        onDefer();
                    }, { once: true });
                },

                showLoadError(err) {
                    console.error('Error loading jobs:', err);
                    skeletonLoader.hide();
                    this.showApp();
                    if (!elements.emptyState) return;
                    elements.jobsGrid.innerHTML = '';
                    elements.emptyState.classList.remove('hidden');
                    const h3 = elements.emptyState.querySelector('h3');
                    const p = elements.emptyState.querySelector('p');
                    const retryBtn = document.getElementById('emptyStateRetry');
                    const clearBtn = document.getElementById('emptyStateClear');
                    const offline = window.cvOfflineManager && !window.cvOfflineManager.isOnline();
                    if (h3) h3.textContent = offline ? 'Sem conexão' : 'Erro ao carregar';
                    if (p) {
                        p.textContent = offline
                            ? window.cvOfflineManager.offlineMessage()
                            : 'Não foi possível carregar as vagas. Verifique sua conexão e tente novamente.';
                    }
                    if (retryBtn) retryBtn.classList.remove('hidden');
                    if (clearBtn) clearBtn.classList.add('hidden');
                },

                load(options = {}) {
                    if (this._loadPromise) return this._loadPromise;
                    this._loadPromise = this._loadInternal(options).finally(() => {
                        this._loadPromise = null;
                    });
                    return this._loadPromise;
                },

                async _loadInternal({ soft = false } = {}) {
                    const filterManager = getFilterManager();
                    const visitedFilter = getVisitedFilter();

                    if (soft && state.allJobs.length > 0) {
                        try {
                            const recentResult = await this.fetchJson(CONFIG.RECENT_DATA_URL, null, { preferGzip: false });
                            if (recentResult.data?.length) {
                                this.ingestJobs(recentResult.data, recentResult.lastModified);
                                state.isPartialData = true;
                                this.updatePartialBanner();
                                filterManager.apply();
                                if (visitedFilter) visitedFilter.updateCount();
                            }
                        } catch (_) { /* optional */ }
                        try {
                            const fullResult = await this.fetchJson(CONFIG.DATA_URL);
                            this.ingestJobs(fullResult.data, fullResult.lastModified);
                            await this.persistCache(fullResult.data, fullResult.lastModified);
                            state.isPartialData = false;
                            this.updatePartialBanner();
                            filterManager.apply();
                            if (visitedFilter) visitedFilter.updateCount();
                            utils.showToast('Vagas atualizadas', 'theme-toast', 2500);
                        } catch (_) {
                            utils.showToast('Não foi possível atualizar o catálogo', 'theme-toast', 3000);
                        }
                        return;
                    }

                    let showedApp = false;
                    let cacheVersion = null;

                    const cached = await this.hydrateFromCache();
                    if (cached) {
                        this.ingestJobs(cached.jobs, cached.lastModified);
                        state.isPartialData = false;
                        cacheVersion = cached.version;
                        filterManager.apply();
                        if (visitedFilter) visitedFilter.updateCount();
                        this.showApp();
                        showedApp = true;
                        skeletonLoader.hide();
                        if (typeof onReady === 'function') onReady({ fromCache: true });
                    } else {
                        skeletonLoader.show();
                    }

                    let _lastSplashAt = Date.now();
                    const _setProgress = async (pct, msg) => {
                        setSplashProgress(pct, msg);
                        const minDelay = 250;
                        const elapsed = Date.now() - _lastSplashAt;
                        await new Promise((r) => setTimeout(r, Math.max(0, minDelay - elapsed)));
                        _lastSplashAt = Date.now();
                    };

                    if (!showedApp) {
                        if (this._slowNetworkTimer) clearTimeout(this._slowNetworkTimer);
                        this._slowNetworkTimer = setTimeout(() => {
                            this.setSplashMsg('Em redes lentas, o download completo pode levar alguns minutos.');
                        }, 8000);
                        await _setProgress(5, 'Conectando...');
                    }

                    try {
                        try {
                            const recentResult = await this.fetchJson(CONFIG.RECENT_DATA_URL, null, { preferGzip: false });
                            if (recentResult.data?.length) {
                                const useRecent = !cached || recentResult.data.length > state.allJobs.length;
                                if (useRecent) {
                                    this.ingestJobs(recentResult.data, recentResult.lastModified);
                                    state.isPartialData = true;
                                    if (!showedApp) await _setProgress(65, `Exibindo ${recentResult.data.length.toLocaleString('pt-BR')} vagas recentes...`);
                                    filterManager.apply();
                                    if (visitedFilter) visitedFilter.updateCount();
                                    this.updatePartialBanner();
                                    if (!showedApp) {
                                        this.showApp();
                                        showedApp = true;
                                        skeletonLoader.hide();
                                    }
                                }
                            }
                        } catch (_) { /* optional */ }

                        const runFullDownload = async () => {
                            let remoteVersion = null;
                            try {
                                const head = await this.fetchJson(CONFIG.DATA_URL, null, { preferGzip: false, method: 'HEAD' });
                                remoteVersion = window.cvJobCache?.buildVersion(head.lastModified, 0);
                            } catch (_) { /* ignore */ }

                            if (cached && remoteVersion && cacheVersion && remoteVersion.split(':')[0] === cacheVersion.split(':')[0] && !state.isPartialData) {
                                return;
                            }

                            const fullResult = await this.fetchJson(CONFIG.DATA_URL, (e) => {
                                if (e.lengthComputable) {
                                    const pct = showedApp ? 70 + (e.loaded / e.total) * 25 : 10 + (e.loaded / e.total) * 60;
                                    setSplashProgress(pct, `Baixando catálogo... ${Math.round(e.loaded / 1024).toLocaleString('pt-BR')} KB`);
                                } else if (!showedApp) {
                                    setSplashProgress(40, 'Baixando vagas...');
                                }
                            });

                            clearTimeout(this._slowNetworkTimer);
                            this._slowNetworkTimer = null;

                            const wasPartial = state.isPartialData;
                            if (!showedApp) await _setProgress(showedApp ? 90 : 80, `Processando ${fullResult.data.length.toLocaleString('pt-BR')} vagas...`);

                            this.ingestJobs(fullResult.data, fullResult.lastModified);
                            await this.persistCache(fullResult.data, fullResult.lastModified);
                            state.isPartialData = false;
                            this.updatePartialBanner();

                            filterManager.apply();
                            if (visitedFilter) visitedFilter.updateCount();

                            if (wasPartial) {
                                utils.showToast('Catálogo completo atualizado', 'theme-toast', 2500);
                            } else if (!showedApp) {
                                await _setProgress(95, 'Renderizando...');
                                setSplashProgress(100, 'Pronto!');
                                this.showApp();
                            }

                            skeletonLoader.hide();
                            if (typeof onReady === 'function') onReady({ fromCache: false });
                        };

                        if (!this._fullDownloadApproved && shouldWarnBeforeFullDownload()) {
                            this.showDataUsageBanner(
                                () => runFullDownload().catch((err) => {
                                    if (!showedApp) this.showLoadError(err);
                                    else utils.showToast('Não foi possível atualizar o catálogo completo', 'theme-toast', 3000);
                                }),
                                () => {
                                    if (typeof onReady === 'function') onReady({ fromCache: Boolean(cached), deferred: true });
                                }
                            );
                        } else {
                            await runFullDownload();
                        }
                    } catch (err) {
                        clearTimeout(this._slowNetworkTimer);
                        this._slowNetworkTimer = null;
                        if (!showedApp) this.showLoadError(err);
                        else utils.showToast('Não foi possível atualizar o catálogo completo', 'theme-toast', 3000);
                    }
                },

                buildFilterOptions() {
                    CONFIG.FILTER_CATEGORIES.forEach(({ key }) => {
                        const values = [...new Set(state.allJobs.map((j) => j[key]).filter(Boolean))];
                        values.sort((a, b) => a.localeCompare(b, 'pt-BR'));
                        state.filterOptions[key] = values;
                        state.filterCounts[key] = {};
                        values.forEach((value) => {
                            state.filterCounts[key][value] = state.allJobs.filter((j) => j[key] === value).length;
                        });
                    });
                },

                updateLastModifiedFromHeader(lastMod) {
                    if (!lastMod || !elements.lastUpdate) return;
                    const date = new Date(lastMod);
                    elements.lastUpdate.textContent = new Intl.DateTimeFormat('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }).format(date);
                },

                showApp() {
                    const splash = elements.splash || document.getElementById('splash');
                    const app = elements.app || document.getElementById('app');
                    if (splash) splash.classList.add('fade-out');
                    if (app) app.classList.add('visible');
                    setTimeout(() => { if (splash) splash.style.display = 'none'; }, 400);
                }
            };
        }
    };
}());
