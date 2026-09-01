import Link from 'next/link';
import { Instagram, MessageCircle } from 'lucide-react';
import { Container } from '@/components/ui';
import { FOOTER_NAV } from '@/components/site/navigation';
import { formatPhone, whatsappLink } from '@/lib/utils/format';
import type { SiteSettings } from '@/lib/types';

/** Rodapé estreito — marca Karla Dias + Instagram + crédito Auryx. */
export function Footer({ settings }: { settings: SiteSettings }) {
  const { identity, contact } = settings;
  const year = new Date().getFullYear();

  const instagramHref = contact.instagram
    ? contact.instagram.startsWith('http')
      ? contact.instagram
      : `https://instagram.com/${contact.instagram.replace(/^@/, '')}`
    : 'https://instagram.com/karlaneuropsi';

  const instagramLabel = contact.instagram?.replace(/^@/, '@') || '@karlaneuropsi';

  return (
    <footer className="surface-deep text-petrol-100">
      <Container className="py-8 sm:py-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          <div className="max-w-sm">
            <p className="font-display text-xl text-white">{identity.professional_name || 'Karla Dias'}</p>
            <p className="mt-1 text-sm text-petrol-200">{identity.positioning}</p>
            {identity.headline ? (
              <p className="mt-1 text-xs leading-relaxed text-petrol-300">{identity.headline}</p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <a
                href={instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-petrol-100 transition-colors hover:text-white"
              >
                <Instagram aria-hidden="true" className="h-3.5 w-3.5" />
                {instagramLabel}
              </a>
              {contact.whatsapp ? (
                <a
                  href={whatsappLink(contact.whatsapp, 'Olá! Vim pelo site.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-petrol-100 transition-colors hover:text-white"
                >
                  <MessageCircle aria-hidden="true" className="h-3.5 w-3.5" />
                  {formatPhone(contact.whatsapp)}
                </a>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-petrol-300">www.karlaneuropsi.com.br</p>
          </div>

          <nav aria-label="Rodapé" className="lg:pt-1">
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {FOOTER_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-petrol-100 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-7 border-t border-white/10 pt-4">
          <div className="flex flex-col gap-2 text-[0.6875rem] leading-relaxed text-petrol-300 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} {identity.professional_name || 'Karla Dias'}. Todos os direitos reservados.
            </p>
            <p>Produzido por Auryx Media — Soluções Tecnológicas</p>
          </div>
          <p className="mt-2 max-w-3xl text-[0.6875rem] leading-relaxed text-petrol-400">
            As informações deste site têm caráter informativo e não substituem consulta, diagnóstico
            ou orientação profissional individualizada.
          </p>
        </div>
      </Container>
    </footer>
  );
}
