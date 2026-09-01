'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, Menu, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { buttonClasses } from '@/components/ui';
import { Drawer } from '@/components/ui/interactive';
import { PRIMARY_NAV, isNavGroup } from '@/components/site/navigation';
import { whatsappLink } from '@/lib/utils/format';

export function Header({
  brandName,
  positioning,
  whatsapp,
  logoUrl,
}: {
  brandName: string;
  positioning: string;
  whatsapp: string;
  logoUrl?: string;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  /*
   * Menu e submenu guardam a rota em que foram abertos. Assim a navegação os
   * fecha naturalmente, sem `useEffect` observando o pathname (que causaria
   * render em cascata).
   */
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null);
  const [openGroupAt, setOpenGroupAt] = useState<{ group: string; path: string } | null>(null);

  const menuOpen = menuOpenAt === pathname;
  const openGroup = openGroupAt?.path === pathname ? openGroupAt.group : null;
  const setMenuOpen = (value: boolean) => setMenuOpenAt(value ? pathname : null);
  const setOpenGroup = (group: string | null) =>
    setOpenGroupAt(group ? { group, path: pathname } : null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      id="navegacao"
      className={cn(
        'sticky top-0 z-40 transition-shadow duration-300',
        scrolled ? 'shadow-[0_1px_0_rgba(20,33,30,0.08)]' : '',
      )}
    >
      <div
        className={cn(
          'transition-colors duration-300',
          scrolled ? 'bg-surface/95 backdrop-blur-md' : 'bg-surface-muted/80 backdrop-blur-sm',
        )}
      >
        <div className="mx-auto flex h-[var(--header-height)] max-w-container items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-3"
            aria-label={`${brandName} — página inicial`}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL local ou Storage
              <img
                src={logoUrl}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 rounded-full object-cover"
              />
            ) : null}
            <span className="flex min-w-0 flex-col justify-center leading-none">
              <span className="font-display text-lg tracking-tight text-ink sm:text-xl">
                {brandName}
              </span>
              <span className="mt-1 text-[0.625rem] font-medium uppercase tracking-[0.12em] text-petrol-600 sm:text-[0.6875rem]">
                {positioning}
              </span>
            </span>
          </Link>

          <nav aria-label="Navegação principal" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {PRIMARY_NAV.map((item) => {
                if (!isNavGroup(item)) {
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive(item.href) ? 'page' : undefined}
                        className={cn(
                          'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                          isActive(item.href)
                            ? 'bg-petrol-50 text-petrol-800'
                            : 'text-ink-soft hover:bg-petrol-50/70 hover:text-petrol-800',
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                }

                const groupActive = item.items.some((sub) => isActive(sub.href));

                return (
                  <li
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => setOpenGroup(item.label)}
                    onMouseLeave={() => setOpenGroup(null)}
                  >
                    <button
                      type="button"
                      aria-expanded={openGroup === item.label}
                      aria-haspopup="true"
                      onClick={() => setOpenGroup(openGroup === item.label ? null : item.label)}
                      className={cn(
                        'flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                        groupActive
                          ? 'bg-petrol-50 text-petrol-800'
                          : 'text-ink-soft hover:bg-petrol-50/70 hover:text-petrol-800',
                      )}
                    >
                      {item.label}
                      <ChevronDown
                        aria-hidden="true"
                        className={cn(
                          'h-3.5 w-3.5 transition-transform',
                          openGroup === item.label && 'rotate-180',
                        )}
                      />
                    </button>

                    {openGroup === item.label ? (
                      <div className="absolute left-0 top-full w-80 pt-2">
                        <ul className="overflow-hidden rounded-2xl bg-surface p-2 shadow-lift ring-1 ring-petrol-100 animate-fade-up">
                          {item.items.map((sub) => (
                            <li key={sub.href}>
                              <Link
                                href={sub.href}
                                className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-petrol-50"
                              >
                                <span className="block text-sm font-medium text-ink">
                                  {sub.label}
                                </span>
                                {sub.description ? (
                                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
                                    {sub.description}
                                  </span>
                                ) : null}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            {whatsapp ? (
              <a
                href={whatsappLink(whatsapp, 'Olá! Vim pelo site e gostaria de informações.')}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses('ghost', 'sm', 'hidden xl:inline-flex')}
              >
                <MessageCircle aria-hidden="true" className="h-4 w-4" />
                WhatsApp
              </a>
            ) : null}

            <Link
              href="/agendamento"
              className={buttonClasses('primary', 'sm', 'hidden shrink-0 sm:inline-flex')}
            >
              Agendar atendimento
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu de navegação"
              aria-expanded={menuOpen}
              className="touch-target flex items-center justify-center rounded-full p-2 text-ink transition-colors hover:bg-petrol-50 lg:hidden"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      <div className="hairline" />

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Navegação">
        <nav aria-label="Navegação móvel">
          <ul className="space-y-1">
            {PRIMARY_NAV.map((item) => {
              if (!isNavGroup(item)) {
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className={cn(
                        'block rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                        isActive(item.href)
                          ? 'bg-petrol-50 text-petrol-800'
                          : 'text-ink-soft hover:bg-petrol-50',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.label} className="pt-2">
                  <p className="px-3 pb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    {item.label}
                  </p>
                  <ul>
                    {item.items.map((sub) => (
                      <li key={sub.href}>
                        <Link
                          href={sub.href}
                          aria-current={isActive(sub.href) ? 'page' : undefined}
                          className={cn(
                            'block rounded-xl px-3 py-3 text-sm transition-colors',
                            isActive(sub.href)
                              ? 'bg-petrol-50 font-medium text-petrol-800'
                              : 'text-ink-soft hover:bg-petrol-50',
                          )}
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-6 space-y-3 border-t border-petrol-100 pt-6">
          <Link href="/agendamento" className={buttonClasses('primary', 'md', 'w-full')}>
            Agendar atendimento
          </Link>
          {whatsapp ? (
            <a
              href={whatsappLink(whatsapp, 'Olá! Vim pelo site e gostaria de informações.')}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses('secondary', 'md', 'w-full')}
            >
              <MessageCircle aria-hidden="true" className="h-4 w-4" />
              Falar pelo WhatsApp
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          ) : null}
          <Link href="/login" className={buttonClasses('ghost', 'sm', 'w-full')}>
            Área profissional
          </Link>
        </div>
      </Drawer>
    </header>
  );
}
