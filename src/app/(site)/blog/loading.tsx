import { Container, Section, Skeleton } from '@/components/ui';

export default function BlogLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Carregando os artigos…</span>

      <header className="surface-warm border-b border-sand-200/70">
        <Container className="pb-14 pt-12 sm:pb-16 sm:pt-16">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-5 h-12 w-64" />
          <Skeleton className="mt-5 h-5 w-full max-w-2xl" />
        </Container>
      </header>

      <Section tone="default">
        <Container>
          <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-80 rounded-2xl" />
            ))}
          </div>
        </Container>
      </Section>
    </div>
  );
}
