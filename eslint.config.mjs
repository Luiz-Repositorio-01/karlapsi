import next from 'eslint-config-next';
import coreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  {
    // Os arquivos originais preservados em /public/legacy nunca são lintados.
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'public/legacy/**', 'next-env.d.ts'],
  },
  ...next,
  ...coreWebVitals,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    rules: {
      // `console.warn`/`console.error` são usados de propósito para
      // observabilidade no servidor; `console.log` não deve ir para produção.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];

export default config;
