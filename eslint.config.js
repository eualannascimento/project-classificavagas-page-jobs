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
                history: 'readonly',
                location: 'readonly',
                Event: 'readonly',
                CustomEvent: 'readonly',
                Blob: 'readonly',
                FileReader: 'readonly',
                AbortController: 'readonly',
                XMLHttpRequest: 'readonly',
                Response: 'readonly',
                ResizeObserver: 'readonly'
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
        // Service worker tem escopo global proprio (self, clients, skipWaiting).
        files: ['service-worker.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                self: 'readonly', caches: 'readonly', clients: 'readonly',
                fetch: 'readonly', console: 'readonly', URL: 'readonly',
                Request: 'readonly', Response: 'readonly', Promise: 'readonly'
            }
        }
    },
    {
        // Gerador de curriculo: mesmo ambiente de browser da aplicacao principal.
        files: ['resume/js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                window: 'readonly', document: 'readonly', navigator: 'readonly',
                localStorage: 'readonly', console: 'readonly', setTimeout: 'readonly',
                clearTimeout: 'readonly', requestAnimationFrame: 'readonly',
                URL: 'readonly', Blob: 'readonly', FileReader: 'readonly',
                matchMedia: 'readonly', location: 'readonly', history: 'readonly',
                getComputedStyle: 'readonly', Image: 'readonly', ResizeObserver: 'readonly',
                CSS: 'readonly', alert: 'readonly', confirm: 'readonly',
                // Os modulos do gerador conversam por globais (padrao IIFE),
                // cada arquivo define o seu e consome os dos vizinhos.
                EuGeroA11y: 'writable',
                EuGeroApp: 'writable',
                EuGeroCharacters: 'writable',
                EuGeroConfig: 'writable',
                EuGeroDates: 'writable',
                EuGeroLinkedInGuide: 'writable',
                EuGeroPdfExport: 'writable',
                EuGeroPdfFonts: 'writable',
                EuGeroPreview: 'writable',
                EuGeroPromptModal: 'writable',
                EuGeroPrompts: 'writable',
                EuGeroReviewScreen: 'writable',
                EuGeroRouter: 'writable',
                EuGeroSampleData: 'writable',
                EuGeroScoring: 'writable',
                EuGeroStartScreen: 'writable',
                EuGeroStorage: 'writable',
                EuGeroUtils: 'writable',
                EuGeroValidation: 'writable',
                EuGeroWizardScreen: 'writable'
            }
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^EuGero' }],
            // Cada arquivo declara o proprio modulo global e consome os vizinhos;
            // declarar o nome em globals e redeclarar no arquivo e o padrao aqui.
            'no-redeclare': 'off'
        }
    },
    {
        ignores: [
            '_backup/**',
            'node_modules/**',
            '_site/**',
            'resume/js/vendor/**',
            'resume/.docs/**',
            'resume/tests/**',
            'tests/**'
        ]
    }
];
