/**
 * Acessibilidade: modais, focus trap, overlay.
 */
const EuGeroA11y = (function () {
  'use strict';

  let activeDialog = null;
  let previousFocus = null;
  let keydownHandler = null;

  const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

  function getFocusable(container) {
    return Array.from(container.querySelectorAll(FOCUSABLE))
      .filter(el => el.offsetParent !== null || el === document.activeElement);
  }

  function trapFocus(container, event) {
    if (event.key !== 'Tab') return;
    const focusable = getFocusable(container);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openDialog(el, trigger) {
    if (!el) return;
    previousFocus = trigger || document.activeElement;
    activeDialog = el;
    el.hidden = false;
    el.setAttribute('aria-modal', 'true');
    el.removeAttribute('aria-hidden');

    keydownHandler = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialog(el);
        return;
      }
      trapFocus(el, event);
    };
    document.addEventListener('keydown', keydownHandler);

    requestAnimationFrame(() => {
      const focusable = getFocusable(el);
      (focusable[0] || el).focus();
    });
  }

  function closeDialog(el) {
    if (!el) return;
    el.hidden = true;
    el.setAttribute('aria-hidden', 'true');
    el.removeAttribute('aria-modal');

    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }

    if (activeDialog === el) activeDialog = null;

    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
    previousFocus = null;
  }

  function openOverlay(el, trigger) {
    openDialog(el, trigger);
  }

  function closeOverlay(el) {
    closeDialog(el);
  }

  return {
    openDialog,
    closeDialog,
    openOverlay,
    closeOverlay,
    getFocusable
  };
})();
