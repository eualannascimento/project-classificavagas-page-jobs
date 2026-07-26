(function () {
    'use strict';

    const NOTICE_KEY = 'cv_privacy_notice_v1';
    const notice = document.getElementById('privacyNotice');
    const dismiss = document.getElementById('privacyNoticeDismiss');

    if (!notice || !dismiss) return;

    // O toast e ancorado no rodape, igual ao aviso. Sem saber a altura real do
    // aviso (que muda com a quebra de linha no mobile), os dois se sobrepoem.
    const GAP = 12;

    function publishOffset() {
        const height = notice.classList.contains('hidden') ? 0 : notice.offsetHeight + GAP;
        document.documentElement.style.setProperty('--privacy-notice-offset', `${height}px`);
    }

    function hide() {
        notice.classList.add('hidden');
        publishOffset();
    }

    try {
        if (localStorage.getItem(NOTICE_KEY) === '1') return;
    } catch (_) {
        return;
    }

    notice.classList.remove('hidden');
    publishOffset();

    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(publishOffset).observe(notice);
    } else {
        window.addEventListener('resize', publishOffset);
    }

    dismiss.addEventListener('click', () => {
        hide();
        try {
            localStorage.setItem(NOTICE_KEY, '1');
        } catch (_) { /* ignore */ }
    });
}());
