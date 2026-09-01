'use client';

/**
 * Fallback de último recurso: usado quando o próprio layout raiz falha.
 * Precisa renderizar <html>/<body> por conta própria e não pode depender de
 * CSS da aplicação — por isso os estilos são inline.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FBF8F3',
          color: '#14211E',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          padding: '2rem',
        }}
      >
        <main style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.75rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#265449',
              fontWeight: 600,
            }}
          >
            Erro inesperado
          </p>
          <h1 style={{ margin: '1rem 0 0', fontSize: '1.875rem', lineHeight: 1.2 }}>
            Não conseguimos carregar o site agora
          </h1>
          <p style={{ margin: '1.25rem 0 0', lineHeight: 1.7, color: '#5C6B66' }}>
            A falha foi registrada. Tente novamente em alguns instantes.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '2rem',
              minHeight: 44,
              padding: '0.75rem 1.75rem',
              borderRadius: 999,
              border: 'none',
              backgroundColor: '#1E433B',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
          {error.digest ? (
            <p style={{ marginTop: '2.5rem', fontSize: '0.75rem', color: '#8A9894' }}>
              Código de referência: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
