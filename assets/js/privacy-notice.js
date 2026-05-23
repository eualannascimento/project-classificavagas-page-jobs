(function () {
    'use strict';

    const NOTICE_KEY = 'cv_privacy_notice_v1';
    const notice = document.getElementById('privacyNotice');
    const dismiss = document.getElementById('privacyNoticeDismiss');

    if (!notice || !dismiss) return;

    try {
        if (localStorage.getItem(NOTICE_KEY) === '1') return;
    } catch (_) {
        return;
    }

    notice.classList.remove('hidden');

    dismiss.addEventListener('click', () => {
        notice.classList.add('hidden');
        try {
            localStorage.setItem(NOTICE_KEY, '1');
        } catch (_) { /* ignore */ }
    });
}());
