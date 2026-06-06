/**
 * First-visit onboarding banner (CSS already defined in styles.css).
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'cv_onboarding_seen';

    window.cvOnboardingManager = {
        init() {
            const banner = document.getElementById('onboardingBanner');
            const dismiss = document.getElementById('onboardingDismiss');
            if (!banner || !dismiss) return;

            try {
                if (localStorage.getItem(STORAGE_KEY) === '1') return;
            } catch (_) {
                return;
            }

            banner.classList.remove('hidden');

            dismiss.addEventListener('click', () => {
                banner.classList.add('hidden');
                try {
                    localStorage.setItem(STORAGE_KEY, '1');
                } catch (_) { /* ignore */ }
            });
        }
    };
}());
