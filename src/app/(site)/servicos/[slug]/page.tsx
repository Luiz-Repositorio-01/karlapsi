import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Clock, Info } from 'lucide-react';
import { Alert, ButtonLink, Card, Container, Section } from '@/components/ui';
import { CTASection, PageHero } from '@/components/site/sections';
import { ServicoDetailMotion } from '@/components/site/ServicoDetailMotion';
import { JsonLd } from '@/components/seo/JsonLd';
import { getServiceBySlug, getServices, getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema, serviceSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatCurrency, formatDuration } from '@/lib/utils/format';

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    return buildMetadata({ title: 'Serviço não encontrado', path: `/servicos/${slug}`, noIndex: true });
  }

  return buildMetadata({
    title: service.name,
    description: service.summary ?? undefined,
    path: `/servicos/${slug}`,
    image: service.image_url,
  });
}

export default async function ServicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [service, settings] = await Promise.all([getServiceBySlug(slug), getSiteSettings()]);

  if (!service) notFound();

  const showPrice =
    settings.booking.show_prices_publicly &&
    service.show_price_publicly &&
    service.price_cents !== null;

  return (
    <>
      <PageHero
        eyebrow="Serviço"
        title={service.name}
        description={service.summary ?? undefined}
        breadcrumb={[{ label: 'Serviços', href: '/servicos' }, { label: service.name }]}
        actions={
          service.allows_online_booking ? (
            <>
              <ButtonLink href={`/agendamento?servico=${service.slug}`}>Agendar</ButtonLink>
              <ButtonLink href="/contato" variant="secondary">
                Tirar uma dúvida
              </ButtonLink>
            </>
          ) : (
            <ButtonLink href="/contato">Falar sobre este serviço</ButtonLink>
          )
        }
      />

      <Section tone="default">
        <Container>
          <ServicoDetailMotion
            image={
              service.image_url ? (
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={service.image_url}
                    alt={service.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 42rem"
                    className="object-cover"
                  />
                </div>
              ) : undefined
            }
            content={
              <div className="article-body max-w-prose">
                {service.description ? (
                  service.description.split('\n\n').map((paragraph) => (
                    <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                  ))
                ) : (
                  <p>{service.summary}</p>
                )}

                {service.preparation_notes ? (
                  <Alert tone="info" title="Como se preparar" className="mt-8">
                    {service.preparation_notes}
                  </Alert>
                ) : null}
              </div>
            }
            sidebar={
              <Card className="lg:sticky lg:top-28">
                <dl className="space-y-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock aria-hidden="true" className="h-4 w-4 text-petrol-500" />
                    <dt className="sr-only">Duração</dt>
                    <dd className="font-medium text-ink">
                      {formatDuration(service.duration_minutes)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">Valor</dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {showPrice ? formatCurrency(service.price_cents) : 'Informado na entrevista inicial'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">
                      Agendamento online
                    </dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {service.allows_online_booking ? 'Disponível' : 'Sob consulta'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">Modalidade</dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {settings.contact.service_area}
                    </dd>
                  </div>
                </dl>

                {service.allows_online_booking ? (
                  <ButtonLink
                    href={`/agendamento?servico=${service.slug}`}
                    className="mt-6 w-full"
                    size="md"
                  >
                    Ver horários
                  </ButtonLink>
                ) : null}

                <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-faint">
                  <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  A solicitação entra como &quot;aguardando confirmação&quot; e você recebe a
                  confirmação após a checagem da agenda.
                </p>
              </Card>
            }
          />
        </Container>
      </Section>

      <CTASection
        title="Ainda com dúvidas?"
        description="Fale diretamente para entender se este é o serviço mais adequado ao seu caso."
        whatsapp={settings.contact.whatsapp}
        primaryHref={`/agendamento?servico=${service.slug}`}
        secondaryHref="/servicos"
        secondaryLabel="Comparar serviços"
      />

      <JsonLd
        data={breadcrumbSchema([
          { label: 'Serviços', href: '/servicos' },
          { label: service.name, href: `/servicos/${service.slug}` },
        ])}
      />
      <JsonLd data={serviceSchema(service, settings)} />
    </>
  );
}
