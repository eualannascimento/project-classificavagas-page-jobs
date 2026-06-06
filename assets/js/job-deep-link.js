/**
 * Deep links to individual jobs via URL hash (M2 - docs/ux-audit.md).
 */
(function () {
    'use strict';

    const PREFIX = 'v-';

    window.cvJobDeepLink = {
        hashForKey(jobKey) {
            return `#${PREFIX}${jobKey.replace(/^cv_v_/, '')}`;
        },

        parseHash() {
            const hash = window.location.hash.replace(/^#/, '');
            if (!hash.startsWith(PREFIX)) return null;
            return `cv_v_${hash.slice(PREFIX.length)}`;
        },

        setHash(jobKey) {
            const next = this.hashForKey(jobKey);
            if (window.location.hash !== next) {
                history.replaceState(history.state, '', window.location.pathname + window.location.search + next);
            }
        },

        scrollToJob(jobKey) {
            const el = document.querySelector(`[data-job-key="${jobKey}"]`);
            if (!el) return false;
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('flash-highlight');
            setTimeout(() => el.classList.remove('flash-highlight'), 1200);
            return true;
        },

        tryRestoreFromHash(_getAllJobs) {
            const key = this.parseHash();
            if (!key) return;
            const attempt = (tries = 0) => {
                if (this.scrollToJob(key)) return;
                if (tries < 20) setTimeout(() => attempt(tries + 1), 250);
            };
            attempt();
        },

        injectJobPostingLd(jobs, _escapeHtml) {
            const existing = document.getElementById('jobPostingLd');
            if (existing) existing.remove();
            if (!jobs?.length) return;

            const postings = jobs.slice(0, 12).map((job) => ({
                '@type': 'JobPosting',
                title: job.title || 'Vaga',
                hiringOrganization: {
                    '@type': 'Organization',
                    name: job.company || 'Empresa'
                },
                datePosted: job.published_date || job.inserted_date || undefined,
                jobLocation: job.location ? {
                    '@type': 'Place',
                    address: job.location
                } : undefined,
                url: job.url
            })).filter((p) => p.url);

            if (!postings.length) return;

            const script = document.createElement('script');
            script.id = 'jobPostingLd';
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify({
                '@context': 'https://schema.org',
                '@graph': postings
            });
            document.head.appendChild(script);
        }
    };
}());
