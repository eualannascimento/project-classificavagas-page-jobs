/**
 * Offline detection and user messaging (M4 - docs/ux-audit.md).
 */
(function () {
    'use strict';

    window.cvOfflineManager = {
        isOnline() {
            return typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
        },

        offlineMessage() {
            return 'Você está offline. Conecte-se à internet e tente novamente.';
        },

        init(onChange) {
            const handler = () => {
                if (typeof onChange === 'function') onChange(this.isOnline());
            };
            window.addEventListener('online', handler);
            window.addEventListener('offline', handler);
        }
    };
}());
