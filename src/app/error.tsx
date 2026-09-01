'use client';

import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, ButtonLink, Container } from '@/components/ui';

/**
 * Erro inesperado em uma rota.
 *
 * O usuário final nunca vê stack trace. O `digest` é o identificador que o
 * Next.js associa ao erro no log do servidor — serve para a equipe localizar o
 * evento sem expor detalhes internos.
 */
export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[erro-de-rota]', error.digest ?? error.message);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center surface-warm">
      <Container size="narrow" className="py-20 text-center">
        <p className="eyebrow">Algo deu errado</p>
        <h1 className="mt-4 text-display-md">Não conseguimos carregar esta página</h1>
        <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-ink-muted">
          A falha foi registrada e será verificada. Você pode tentar novamente agora — normalmente
          funciona na segunda tentativa.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={reset} size="lg">
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Tentar novamente
          </Button>
          <ButtonLink href="/" variant="secondary" size="lg">
            Ir para o início
          </ButtonLink>
        </div>

        {error.digest ? (
          <p className="mt-10 text-xs text-ink-faint">
            Código de referência: <code>{error.digest}</code>
          </p>
        ) : null}
      </Container>
    </main>
  );
}
