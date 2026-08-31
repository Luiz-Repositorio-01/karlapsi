import { Container, Section, Skeleton } from '@/components/ui';

export default function AgendamentoLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Carregando a agenda…</span>

      <header className="surface-warm border-b border-sand-200/70">
        <Container className="pb-14 pt-12 sm:pb-16 sm:pt-16">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-5 h-12 w-full max-w-lg" />
          <Skeleton className="mt-5 h-5 w-full max-w-2xl" />
        </Container>
      </header>

      <Section tone="default">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14">
            <div>
              <Skeleton className="h-9 w-full max-w-md" />
              <div className="mt-8 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 rounded-2xl" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
