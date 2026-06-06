import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        files: ['assets/js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                requestAnimationFrame: 'readonly',
                requestIdleCallback: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                DOMParser: 'readonly',
                CSS: 'readonly',
                IntersectionObserver: 'readonly',
                matchMedia: 'readonly',
                fetch: 'readonly',
                caches: 'readonly',
                self: 'readonly',
                clients: 'readonly',
                DecompressionStream: 'readonly',
                TextDecoder: 'readonly',
                Worker: 'readonly',
                indexedDB: 'readonly',
                IDBDatabase: 'readonly',
                history: 'readonly',
                location: 'readonly',
                Event: 'readonly',
                CustomEvent: 'readonly',
                Blob: 'readonly',
                FileReader: 'readonly',
                AbortController: 'readonly',
                XMLHttpRequest: 'readonly',
                Response: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
            eqeqeq: ['error', 'always', { null: 'ignore' }],
            'no-var': 'error',
            'prefer-const': 'warn'
        }
    },
    {
        ignores: ['_backup/**', 'node_modules/**', '_site/**']
    }
];
