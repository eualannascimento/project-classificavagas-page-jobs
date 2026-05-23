(function () {
    'use strict';

    const clearButton = document.getElementById('clearLocalData');
    const status = document.getElementById('clearLocalDataStatus');

    if (!clearButton) return;

    clearButton.addEventListener('click', () => {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i += 1) {
                const key = localStorage.key(i);
                if (key && key.startsWith('cv_')) keysToRemove.push(key);
            }

            keysToRemove.forEach((key) => localStorage.removeItem(key));

            if (status) {
                status.textContent = keysToRemove.length
                    ? 'Dados locais do classificavagas.com removidos deste navegador.'
                    : 'Nenhum dado local do classificavagas.com foi encontrado neste navegador.';
            }
        } catch (_) {
            if (status) {
                status.textContent = 'Não foi possível acessar os dados locais neste navegador.';
            }
        }
    });
}());
