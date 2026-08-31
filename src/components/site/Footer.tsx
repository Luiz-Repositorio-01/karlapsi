import Link from 'next/link';
import { Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Container } from '@/components/ui';
import { FOOTER_NAV } from '@/components/site/navigation';
import { formatPhone, whatsappLink } from '@/lib/utils/format';
import type { SiteSettings } from '@/lib/types';

export function Footer({ settings }: { settings: SiteSettings }) {
  const { identity, contact } = settings;
  const year = new Date().getFullYear();

  const contactItems = [
    contact.whatsapp
      ? {
          icon: MessageCircle,
          label: formatPhone(contact.whatsapp),
          href: whatsappLink(contact.whatsapp, 'Olá! Vim pelo site.'),
          external: true,
        }
      : null,
    contact.phone
      ? { icon: Phone, label: formatPhone(contact.phone), href: `tel:${contact.phone.replace(/\D/g, '')}` }
      : null,
    contact.email ? { icon: Mail, label: contact.email, href: `mailto:${contact.email}` } : null,
    contact.instagram
      ? {
          icon: Instagram,
          label: contact.instagram.replace(/^@/, '@'),
          href: contact.instagram.startsWith('http')
            ? contact.instagram
            : `https://instagram.com/${contact.instagram.replace(/^@/, '')}`,
          external: true,
        }
      : null,
  ].filter(Boolean) as {
    icon: typeof Mail;
    label: string;
    href: string;
    external?: boolean;
  }[];

  const location = [contact.address_line, [contact.city, contact.state].filter(Boolean).join(' - ')]
    .filter(Boolean)
    .join(' · ');

  return (
    <footer className="surface-deep text-petrol-100">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="font-display text-2xl text-white">{identity.brand_name}</p>
            <p className="mt-1 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-petrol-300">
              {identity.positioning}
            </p>

            {identity.professional_registration_value ? (
              <p className="mt-4 text-sm text-petrol-200">
                {identity.professional_registration_label || 'Registro profissional'}:{' '}
                {identity.professional_registration_value}
              </p>
            ) : null}

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-petrol-200">
              {contact.service_area}
            </p>

            {contactItems.length > 0 ? (
              <ul className="mt-6 space-y-3">
                {contactItems.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      {...(item.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="inline-flex items-center gap-2.5 text-sm text-petrol-100 transition-colors hover:text-white"
                    >
                      <item.icon aria-hidden="true" className="h-4 w-4 text-petrol-300" />
                      {item.label}
                    </a>
                  </li>
                ))}
                {location ? (
                  <li className="inline-flex items-start gap-2.5 text-sm text-petrol-200">
                    <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-petrol-300" />
                    {location}
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FOOTER_NAV.map((group) => (
              <nav key={group.label} aria-label={group.label}>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-petrol-300">
                  {group.label}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {group.items.map((item) => (
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
            ))}
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-3 text-xs text-petrol-300 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} {identity.brand_name}. Todos os direitos reservados.
            </p>
            <p className="max-w-xl leading-relaxed">
              As informações deste site têm caráter informativo e não substituem consulta,
              diagnóstico ou orientação profissional individualizada.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
