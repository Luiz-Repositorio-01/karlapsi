import { Skeleton } from '@/components/ui';

/**
 * Estado de carregamento do painel.
 * `role="status"` + `aria-live` anunciam a espera para leitores de tela.
 */
export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Carregando a página do painel…</span>

      <div className="mb-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
