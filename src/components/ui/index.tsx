import Link from 'next/link';
import type { ComponentProps, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Primitivos de interface (server-safe).
 *
 * Tudo aqui é renderizável no servidor: nenhum `useState`/`useEffect`. Os
 * componentes interativos ficam em `components/ui/interactive.tsx`, marcados
 * com 'use client', para não enviar JS desnecessário ao navegador.
 */

// -----------------------------------------------------------------------------
// Layout
// -----------------------------------------------------------------------------
export function Container({
  className,
  children,
  size = 'default',
}: {
  className?: string;
  children: ReactNode;
  size?: 'default' | 'narrow' | 'wide';
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 sm:px-6 lg:px-8',
        size === 'default' && 'max-w-container',
        size === 'narrow' && 'max-w-3xl',
        size === 'wide' && 'max-w-[88rem]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Section({
  className,
  children,
  id,
  tone = 'default',
  as: Tag = 'section',
  ariaLabelledBy,
}: {
  className?: string;
  children: ReactNode;
  id?: string;
  tone?: 'default' | 'muted' | 'sunken' | 'deep' | 'warm';
  as?: ElementType;
  ariaLabelledBy?: string;
}) {
  return (
    <Tag
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        'py-section',
        tone === 'default' && 'bg-surface',
        tone === 'muted' && 'bg-surface-muted',
        tone === 'sunken' && 'bg-surface-sunken',
        tone === 'warm' && 'surface-warm',
        tone === 'deep' && 'surface-deep text-petrol-50',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  id,
  tone = 'light',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  id?: string;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'max-w-3xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow ? (
        <p className={cn('eyebrow', tone === 'dark' && 'text-petrol-200')}>{eyebrow}</p>
      ) : null}
      <h2
        id={id}
        className={cn(
          'mt-3 text-display-md',
          tone === 'dark' && 'text-white',
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            'mt-4 text-lg leading-relaxed text-ink-muted',
            tone === 'dark' && 'text-petrol-100',
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Botões e links de ação
// -----------------------------------------------------------------------------
const buttonBase =
  'inline-flex touch-target items-center justify-center gap-2 rounded-full text-sm font-semibold ' +
  'transition-all duration-200 ease-soft disabled:pointer-events-none disabled:opacity-55';

const buttonVariants = {
  primary: 'bg-petrol-700 text-white shadow-card hover:bg-petrol-800 hover:shadow-lift active:scale-[0.98]',
  secondary: 'bg-white text-petrol-800 ring-1 ring-inset ring-petrol-200 hover:bg-petrol-50 hover:ring-petrol-300',
  outline: 'bg-transparent text-petrol-800 ring-1 ring-inset ring-petrol-300 hover:bg-petrol-50',
  ghost: 'bg-transparent text-petrol-800 hover:bg-petrol-50',
  clay: 'bg-clay-500 text-white shadow-card hover:bg-clay-600 hover:shadow-lift active:scale-[0.98]',
  onDark: 'bg-white text-petrol-900 shadow-lift hover:bg-sand-100 active:scale-[0.98]',
  danger: 'bg-red-600 text-white hover:bg-red-700',
} as const;

const buttonSizes = {
  sm: 'px-4 py-2 text-[0.8125rem]',
  md: 'px-5 py-2.5',
  lg: 'px-7 py-3.5 text-base',
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  href,
  external,
  ...props
}: Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  external?: boolean;
}) {
  if (external) {
    return (
      <a
        href={href}
        className={buttonClasses(variant, size, className)}
        target="_blank"
        rel="noopener noreferrer"
        {...(props as ComponentProps<'a'>)}
      />
    );
  }

  return <Link href={href} className={buttonClasses(variant, size, className)} {...props} />;
}

// -----------------------------------------------------------------------------
// Superfícies
// -----------------------------------------------------------------------------
export function Card({
  className,
  children,
  as: Tag = 'div',
  interactive = false,
}: {
  className?: string;
  children: ReactNode;
  as?: ElementType;
  interactive?: boolean;
}) {
  return (
    <Tag
      className={cn(
        'rounded-2xl bg-surface p-6 ring-1 ring-petrol-100/80',
        interactive &&
          'shadow-card transition-all duration-300 ease-soft hover:-translate-y-0.5 hover:shadow-lift hover:ring-petrol-200',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

const badgeTones = {
  neutral: 'bg-petrol-50 text-petrol-700 ring-petrol-200',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-900 ring-amber-200',
  danger: 'bg-red-50 text-red-800 ring-red-200',
  sand: 'bg-sand-100 text-sand-800 ring-sand-300',
} as const;

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof badgeTones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-medium text-petrol-800 ring-1 ring-inset ring-petrol-200 backdrop-blur',
        className,
      )}
    >
      {children}
    </span>
  );
}

// -----------------------------------------------------------------------------
// Estados
// -----------------------------------------------------------------------------
export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-petrol-200 bg-surface/60 px-6 py-14 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-petrol-50 text-petrol-600">
          {icon}
        </div>
      ) : null}
      <p className="font-display text-lg text-ink">{title}</p>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('relative overflow-hidden rounded-lg bg-petrol-100/70', className)}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

/** Estado de carregamento anunciado a leitores de tela. */
export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 py-8 text-sm text-ink-muted">
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-petrol-200 border-t-petrol-600"
      />
      {label}
    </div>
  );
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const tones = {
    info: 'bg-sky-50 text-sky-900 ring-sky-200',
    success: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
    warning: 'bg-amber-50 text-amber-950 ring-amber-200',
    danger: 'bg-red-50 text-red-900 ring-red-200',
  } as const;

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('rounded-xl px-4 py-3 text-sm ring-1 ring-inset', tones[tone], className)}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={cn(title && 'mt-1', 'leading-relaxed')}>{children}</div> : null}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Formulário (estrutura acessível; o estado fica nos componentes client)
// -----------------------------------------------------------------------------
export const inputClasses =
  'w-full rounded-xl border-0 bg-surface px-4 py-3 text-sm text-ink ring-1 ring-inset ring-petrol-200 ' +
  'placeholder:text-ink-faint transition focus:ring-2 focus:ring-petrol-500 disabled:bg-surface-sunken disabled:text-ink-faint';

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-soft">
        {label}
        {required ? (
          <span className="ml-1 text-clay-500" aria-hidden="true">
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (obrigatório)</span> : null}
      </label>
      {children}
      {hint ? (
        <p id={hintId} className="text-xs leading-relaxed text-ink-faint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Ajuda a montar os atributos ARIA corretos de um campo com erro/dica. */
export function fieldAria(id: string, options: { hint?: boolean; error?: boolean }) {
  const describedBy = [options.hint ? `${id}-hint` : null, options.error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ');

  return {
    id,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': options.error ? true : undefined,
  };
}
