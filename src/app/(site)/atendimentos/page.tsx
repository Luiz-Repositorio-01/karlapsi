import { notFound } from 'next/navigation';
import { ButtonLink, Card, Container, Section, SectionHeader } from '@/components/ui';
import { CTASection, PageHero, SitePageSections } from '@/components/site/sections';
import { MotionBlock } from '@/components/site/MotionBlock';
import { StaggerList } from '@/components/motion';
import { JsonLd } from '@/components/seo/JsonLd';
import { getServices, getSitePage, getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatDuration } from '@/lib/utils/format';

export const revalidate = 300;

export async function generateMetadata() {
  const page = await getSitePage('atendimentos');
  return buildMetadata({
    title: page?.seo_title ?? 'Atendimentos',
    description: page?.seo_description ?? page?.subtitle ?? undefined,
    path: '/atendimentos',
  });
}

export default async function AtendimentosPage() {
  const [page, settings, services] = await Promise.all([
    getSitePage('atendimentos'),
    getSiteSettings(),
    getServices(),
  ]);

  if (!page) notFound();

  return (
    <>
      <PageHero
        eyebrow="Atendimentos"
        title={page.title}
        description={page.subtitle ?? undefined}
        breadcrumb={[{ label: 'Atendimentos' }]}
        actions={<ButtonLink href="/agendamento">Ver horários disponíveis</ButtonLink>}
      />

      <SitePageSections page={page} />

      <Section tone="sunken">
        <Container>
          <MotionBlock>
            <SectionHeader
              eyebrow="Duração"
              title="Tempo reservado por tipo de encontro"
              description="Cada atendimento tem duração definida — o horário fica exclusivo na agenda."
            />
          </MotionBlock>

          <StaggerList className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={80}>
            {services.map((service) => (
              <li key={service.id}>
                <Card className="flex h-full items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-lg text-ink">{service.name}</p>
                    {service.summary ? (
                      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                        {service.summary}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-full bg-petrol-50 px-3 py-1 text-xs font-medium text-petrol-700">
                    {formatDuration(service.duration_minutes)}
                  </span>
                </Card>
              </li>
            ))}
          </StaggerList>
        </Container>
      </Section>

      <CTASection
        title="Escolha o melhor horário"
        description="A agenda mostra apenas os horários realmente livres no momento da consulta."
        whatsapp={settings.contact.whatsapp}
      />

      <JsonLd data={breadcrumbSchema([{ label: 'Atendimentos', href: '/atendimentos' }])} />
    </>
  );
}
