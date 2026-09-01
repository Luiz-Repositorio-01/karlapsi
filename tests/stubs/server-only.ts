/**
 * Substituto de `server-only` para os testes unitários.
 *
 * No build do Next, importar `server-only` garante que o módulo nunca entre no
 * bundle do cliente. Nos testes esse pacote resolve para a variante que lança
 * erro, então esta versão vazia é usada em seu lugar (ver `vitest.config.mts`).
 */
export {};
