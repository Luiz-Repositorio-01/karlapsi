import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

/** Componentes de apresentação do painel (server-safe). */

export function StatCard({
  label,
  value,
  hint,
  href,
  tone = 'neutral',
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: 'neutral' | 'positive' | 'attention';
  icon?: ReactNode;
}) {
  const content = (
    <Card
      interactive={Boolean(href)}
      className={cn(
        'h-full',
        tone === 'attention' && 'ring-amber-200 bg-amber-50/50',
        tone === 'positive' && 'ring-emerald-200 bg-emerald-50/40',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
        {icon ? <span className="text-petrol-500">{icon}</span> : null}
      </div>
      <p className="mt-3 font-display text-3xl text-ink">{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-ink-muted">{hint}</p> : null}
      {href ? (
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-petrol-700">
          Abrir
          <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
        </span>
      ) : null}
    </Card>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
}

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  const map: Record<Tone, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
    neutral: 'neutral',
    info: 'info',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
  };
  return <Badge tone={map[tone]}>{label}</Badge>;
}

/**
 * Tabela responsiva.
 *
 * No desktop renderiza `<table>` semântica; no mobile, cada linha vira um card
 * com rótulo + valor. Não é o desktop "encolhido": é outra composição, com as
 * mesmas informações e ações acessíveis.
 */
export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  /** Oculta a coluna no card do mobile (ex.: coluna redundante). */
  hideOnMobile?: boolean;
  align?: 'left' | 'right';
  width?: string;
}

export function DataTable<T extends { id: string | number }>({
  items,
  columns,
  caption,
  rowHref,
  actions,
  emptyState,
}: {
  items: T[];
  columns: DataTableColumn<T>[];
  caption: string;
  rowHref?: (item: T) => string;
  actions?: (item: T) => ReactNode;
  emptyState?: ReactNode;
}) {
  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {/* ------------------------------------------------------- desktop */}
      <div className="hidden overflow-hidden rounded-2xl bg-surface ring-1 ring-petrol-100 lg:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-petrol-100 bg-surface-muted/60">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-faint',
                    column.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {column.header}
                </th>
              ))}
              {actions ? (
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Ações
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-petrol-50 transition-colors last:border-0 hover:bg-petrol-50/40"
              >
                {columns.map((column, index) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-3 align-middle text-ink-soft',
                      column.align === 'right' && 'text-right',
                    )}
                  >
                    {index === 0 && rowHref ? (
                      <Link
                        href={rowHref(item)}
                        className="font-medium text-ink transition-colors hover:text-petrol-700"
                      >
                        {column.render(item)}
                      </Link>
                    ) : (
                      column.render(item)
                    )}
                  </td>
                ))}
                {actions ? (
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">{actions(item)}</div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* -------------------------------------------------------- mobile */}
      <ul className="space-y-3 lg:hidden" aria-label={caption}>
        {items.map((item) => {
          const [first, ...others] = columns;
          return (
            <li key={item.id}>
              <Card className="p-4">
                {first ? (
                  <div className="font-display text-base text-ink">
                    {rowHref ? (
                      <Link href={rowHref(item)} className="hover:text-petrol-700">
                        {first.render(item)}
                      </Link>
                    ) : (
                      first.render(item)
                    )}
                  </div>
                ) : null}

                <dl className="mt-3 space-y-2">
                  {others
                    .filter((column) => !column.hideOnMobile)
                    .map((column) => (
                      <div key={column.key} className="flex items-start justify-between gap-3">
                        <dt className="text-xs uppercase tracking-wide text-ink-faint">
                          {column.header}
                        </dt>
                        <dd className="text-right text-sm text-ink-soft">{column.render(item)}</dd>
                      </div>
                    ))}
                </dl>

                {actions ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-petrol-50 pt-3">
                    {actions(item)}
                  </div>
                ) : null}
              </Card>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Aviso de leitura restrita (quando o papel não vê certos dados). */
export function RestrictedNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-surface-sunken px-4 py-3 text-xs leading-relaxed text-ink-muted">
      <TrendingUp aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {children}
    </div>
  );
}
