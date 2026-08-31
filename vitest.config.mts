import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      /*
       * `server-only` é uma barreira de build do Next (impede que um módulo de
       * servidor entre no bundle do cliente). Sob Vitest, a resolução cai na
       * variante que lança erro, então o substituímos por um módulo vazio: a
       * proteção continua valendo no build real.
       */
      'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
    },
  },
});
