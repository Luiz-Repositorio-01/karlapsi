'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Bell,
  BookOpen,
  Brain,
  Briefcase,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  History,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Package,
  PencilLine,
  Settings,
  Shield,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge, buttonClasses } from '@/components/ui';
import { Drawer } from '@/components/ui/interactive';
import type { AdminIconName, AdminNavGroup } from '@/components/admin/navigation';
import { ROLE_LABELS } from '@/lib/auth/rbac';
import { initials } from '@/lib/utils/format';
import type { UserRole } from '@/lib/types';

const ICONS: Record<AdminIconName, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  calendar: Calendar,
  users: Users,
  briefcase: Briefcase,
  clock: Clock,
  wallet: Wallet,
  package: Package,
  book: BookOpen,
  layout: LayoutTemplate,
  edit: PencilLine,
  file: FileText,
  bell: Bell,
  settings: Settings,
  shield: Shield,
  history: History,
};

/**
 * Shell do painel: sidebar fixa no desktop e drawer no mobile.
 * Os grupos já chegam filtrados pelo RBAC (montagem no servidor).
 */
export function AdminShell({
  groups,
  user,
  unreadCount,
  brandName,
  signOutAction,
  children,
}: {
  groups: AdminNavGroup[];
  user: { name: string; email: string; role: UserRole };
  unreadCount: number;
  brandName: string;
  signOutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const navigation = (
    <nav aria-label="Navegação do painel" className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            {group.label}
          </p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = isActive(item.href, item.exact);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex touch-target items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                      active
                        ? 'bg-petrol-700 font-medium text-white'
                        : 'text-ink-soft hover:bg-petrol-50 hover:text-petrol-800',
                    )}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.href === '/admin/notificacoes' && unreadCount > 0 ? (
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[0.6875rem] font-semibold',
                          active ? 'bg-white/20 text-white' : 'bg-clay-500 text-white',
                        )}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const userBlock = (
    <div className="border-t border-petrol-100 pt-4">
      <div className="flex items-center gap-3 px-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-petrol-700 text-xs font-semibold text-white"
        >
          {initials(user.name || user.email)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{user.name || user.email}</p>
          <p className="truncate text-xs text-ink-faint">{ROLE_LABELS[user.role]}</p>
        </div>
      </div>

      <div className="mt-3 space-y-0.5">
        <Link
          href="/admin/perfil"
          className="flex touch-target items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-soft transition-colors hover:bg-petrol-50"
        >
          <UserRound aria-hidden="true" className="h-4 w-4" />
          Meu perfil
        </Link>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex touch-target items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-soft transition-colors hover:bg-petrol-50"
        >
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
          Ver o site
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full touch-target items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-soft transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Sair
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-surface-muted">
      {/* ------------------------------------------------- sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-petrol-100 bg-surface lg:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-petrol-700">
            <Brain aria-hidden="true" className="h-4 w-4 text-white" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm text-ink">{brandName}</p>
            <p className="text-[0.625rem] uppercase tracking-[0.14em] text-petrol-600">Painel</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">{navigation}</div>
        <div className="px-2 pb-4">{userBlock}</div>
      </aside>

      {/* --------------------------------------------------- topbar (mobile) */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-petrol-100 bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu do painel"
          aria-expanded={menuOpen}
          className="touch-target flex items-center justify-center rounded-xl p-2 text-ink transition-colors hover:bg-petrol-50"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>

        <p className="truncate font-display text-sm text-ink">{brandName}</p>

        <Link
          href="/admin/notificacoes"
          aria-label={`Notificações${unreadCount > 0 ? `: ${unreadCount} não lidas` : ''}`}
          className="relative touch-target flex items-center justify-center rounded-xl p-2 text-ink transition-colors hover:bg-petrol-50"
        >
          <Bell aria-hidden="true" className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-clay-500" />
          ) : null}
        </Link>
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Painel" side="left">
        {navigation}
        <div className="mt-6">{userBlock}</div>
      </Drawer>

      {/* -------------------------------------------------------- conteúdo */}
      <div className="lg:pl-64">
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

/** Cabeçalho padrão das páginas do painel. */
export function AdminPageHeader({
  title,
  description,
  actions,
  badge,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  badge?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl text-ink sm:text-3xl">{title}</h1>
          {badge ? <Badge>{badge}</Badge> : null}
        </div>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export { buttonClasses };
