(function () {
    'use strict';

    function clearLocalData(statusEl) {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i += 1) {
                const key = localStorage.key(i);
                if (key && key.startsWith('cv_')) keysToRemove.push(key);
            }

            keysToRemove.forEach((key) => localStorage.removeItem(key));

            if (statusEl) {
                statusEl.textContent = keysToRemove.length
                    ? 'Dados locais do classificavagas.com removidos deste navegador.'
                    : 'Nenhum dado local do classificavagas.com foi encontrado neste navegador.';
            }
            return keysToRemove.length;
        } catch (_) {
            if (statusEl) {
                statusEl.textContent = 'Não foi possível acessar os dados locais neste navegador.';
            }
            return 0;
        }
    }

    window.cvClearLocalData = clearLocalData;

    const clearButton = document.getElementById('clearLocalData');
    const status = document.getElementById('clearLocalDataStatus');

    if (clearButton) {
        clearButton.addEventListener('click', () => clearLocalData(status));
    }
}());
