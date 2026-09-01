import { CalendarCheck, Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { ButtonLink, Card, Container, Section } from '@/components/ui';
import { PageHero } from '@/components/site/sections';
import { ContactForm } from '@/components/site/ContactForm';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatPhone, whatsappLink } from '@/lib/utils/format';

export const revalidate = 300;

export async function generateMetadata() {
  return buildMetadata({
    title: 'Contato',
    description:
      'Fale sobre avaliação neuropsicológica, atendimentos, encaminhamentos profissionais ou materiais.',
    path: '/contato',
  });
}

export default async function ContatoPage() {
  const settings = await getSiteSettings();
  const { contact } = settings;

  const channels = [
    contact.whatsapp
      ? {
          icon: MessageCircle,
          label: 'WhatsApp',
          value: formatPhone(contact.whatsapp),
          href: whatsappLink(contact.whatsapp, 'Olá! Vim pelo site e gostaria de informações.'),
          external: true,
        }
      : null,
    contact.phone
      ? {
          icon: Phone,
          label: 'Telefone',
          value: formatPhone(contact.phone),
          href: `tel:${contact.phone.replace(/\D/g, '')}`,
        }
      : null,
    contact.email
      ? { icon: Mail, label: 'E-mail', value: contact.email, href: `mailto:${contact.email}` }
      : null,
    contact.instagram
      ? {
          icon: Instagram,
          label: 'Instagram',
          value: contact.instagram,
          href: contact.instagram.startsWith('http')
            ? contact.instagram
            : `https://instagram.com/${contact.instagram.replace(/^@/, '')}`,
          external: true,
        }
      : null,
  ].filter(Boolean) as {
    icon: typeof Mail;
    label: string;
    value: string;
    href: string;
    external?: boolean;
  }[];

  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Fale com a equipe"
        description="Para dúvidas sobre o processo, encaminhamentos profissionais ou informações sobre materiais."
        breadcrumb={[{ label: 'Contato' }]}
      />

      <Section tone="default">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
            <div>
              <h2 className="font-display text-xl text-ink">Envie uma mensagem</h2>
              <p className="mt-2 max-w-prose text-sm text-ink-muted">
                Responderemos no e-mail informado. Para marcar um horário, o caminho mais rápido é o
                agendamento online.
              </p>
              <div className="mt-8">
                <ContactForm consentVersion={settings.booking.consent_version} />
              </div>
            </div>

            <aside className="space-y-4">
              <Card>
                <h2 className="font-display text-lg text-ink">Canais diretos</h2>
                {channels.length > 0 ? (
                  <ul className="mt-4 space-y-4">
                    {channels.map((channel) => (
                      <li key={channel.href}>
                        <a
                          href={channel.href}
                          {...(channel.external
                            ? { target: '_blank', rel: 'noopener noreferrer' }
                            : {})}
                          className="group flex items-start gap-3"
                        >
                          <channel.icon
                            aria-hidden="true"
                            className="mt-0.5 h-4 w-4 shrink-0 text-petrol-600"
                          />
                          <span>
                            <span className="block text-xs uppercase tracking-wide text-ink-faint">
                              {channel.label}
                            </span>
                            <span className="text-sm font-medium text-ink transition-colors group-hover:text-petrol-700">
                              {channel.value}
                            </span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                    Os canais de contato são cadastrados no painel administrativo, em
                    Configurações. Enquanto isso, use o formulário ao lado.
                  </p>
                )}

                {contact.address_line || contact.city ? (
                  <div className="mt-6 flex items-start gap-3 border-t border-petrol-100 pt-5">
                    <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-petrol-600" />
                    <div>
                      <p className="text-sm leading-relaxed text-ink-soft">
                        {contact.address_line}
                        {contact.address_line && contact.city ? <br /> : null}
                        {[contact.city, contact.state].filter(Boolean).join(' - ')}
                      </p>
                      {contact.map_url ? (
                        <a
                          href={contact.map_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-sm font-medium text-petrol-700 underline-offset-2 hover:underline"
                        >
                          Abrir no mapa
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : contact.map_url ? (
                  <div className="mt-6 flex items-start gap-3 border-t border-petrol-100 pt-5">
                    <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-petrol-600" />
                    <a
                      href={contact.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-petrol-700 underline-offset-2 hover:underline"
                    >
                      Ver localização no mapa
                    </a>
                  </div>
                ) : null}

                {contact.office_hours_label ? (
                  <p className="mt-4 text-xs text-ink-faint">{contact.office_hours_label}</p>
                ) : null}
              </Card>

              <Card className="bg-surface-muted">
                <CalendarCheck aria-hidden="true" className="h-5 w-5 text-petrol-600" />
                <h2 className="mt-3 font-display text-lg text-ink">Quer marcar um horário?</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  O agendamento online mostra os horários realmente livres.
                </p>
                <ButtonLink href="/agendamento" size="sm" className="mt-4 w-full">
                  Ir para o agendamento
                </ButtonLink>
              </Card>

              <p className="px-1 text-xs leading-relaxed text-ink-faint">
                Este canal não é destinado a urgências. Em caso de emergência, procure atendimento
                médico ou ligue para o serviço de emergência local.
              </p>
            </aside>
          </div>
        </Container>
      </Section>

      <JsonLd data={breadcrumbSchema([{ label: 'Contato', href: '/contato' }])} />
    </>
  );
}
