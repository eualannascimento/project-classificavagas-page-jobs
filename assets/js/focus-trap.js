/**
 * Lightweight focus trap for modal dialogs and bottom sheets.
 */
(function () {
    'use strict';

    const FOCUSABLE =
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    let activeContainer = null;
    let keydownHandler = null;

    function getFocusable(container) {
        return Array.from(container.querySelectorAll(FOCUSABLE)).filter((el) => {
            if (el.offsetParent === null && !el.closest('.bottom-sheet.visible, .legal-panel:not(.hidden), #shortcutsOverlay:not(.hidden)')) {
                return false;
            }
            return !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true';
        });
    }

    function handleKeydown(e) {
        if (e.key !== 'Tab' || !activeContainer) return;

        const focusable = getFocusable(activeContainer);
        if (!focusable.length) {
            e.preventDefault();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (e.shiftKey && active === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        } else if (!activeContainer.contains(active)) {
            e.preventDefault();
            first.focus();
        }
    }

    window.cvFocusTrap = {
        activate(container) {
            if (!container) return;
            this.deactivate();
            activeContainer = container;
            keydownHandler = handleKeydown;
            document.addEventListener('keydown', keydownHandler);
        },

        deactivate() {
            if (keydownHandler) {
                document.removeEventListener('keydown', keydownHandler);
            }
            activeContainer = null;
            keydownHandler = null;
        },

        isActive(container) {
            return activeContainer === container;
        }
    };
}());
