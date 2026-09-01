import { notFound } from 'next/navigation';
import { ButtonLink, Container, Section, SectionHeader } from '@/components/ui';
import { CTASection, FaqSection, PageHero, SitePageSections, StepList } from '@/components/site/sections';
import { JsonLd } from '@/components/seo/JsonLd';
import { getFaqs, getServiceBySlug, getSitePage, getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema, faqSchema, serviceSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { HOW_IT_WORKS_STEPS } from '@/lib/content/defaults';

export const revalidate = 300;

const SLUG = 'avaliacao-neuropsicologica';

export async function generateMetadata() {
  const page = await getSitePage(SLUG);
  return buildMetadata({
    title: page?.seo_title ?? 'Avaliação neuropsicológica',
    description: page?.seo_description ?? page?.subtitle ?? undefined,
    path: `/${SLUG}`,
  });
}

export default async function AvaliacaoPage() {
  const [page, settings, faqs, service] = await Promise.all([
    getSitePage(SLUG),
    getSiteSettings(),
    getFaqs('neuropsicologia'),
    getServiceBySlug(SLUG),
  ]);

  if (!page) notFound();

  return (
    <>
      <PageHero
        eyebrow="Serviço principal"
        title={page.title}
        description={page.subtitle ?? undefined}
        breadcrumb={[
          { label: 'Neuropsicologia', href: '/neuropsicologia' },
          { label: 'Avaliação neuropsicológica' },
        ]}
        actions={
          <>
            <ButtonLink href={`/agendamento?servico=${SLUG}`}>Agendar atendimento</ButtonLink>
            <ButtonLink href="/servicos" variant="secondary">
              Ver todos os serviços
            </ButtonLink>
          </>
        }
      />

      <SitePageSections page={page} />

      <Section tone="sunken">
        <Container>
          <SectionHeader
            eyebrow="Percurso"
            title="Do agendamento à devolutiva"
            description="O que acontece em cada momento do processo."
            align="center"
          />
          <div className="mt-12">
            <StepList steps={HOW_IT_WORKS_STEPS} />
          </div>
        </Container>
      </Section>

      <FaqSection faqs={faqs} title="Perguntas sobre a avaliação" tone="default" />

      <CTASection
        title="Agendar atendimento"
        description="O primeiro encontro define objetivos e etapas — sem compromisso de continuidade."
        whatsapp={settings.contact.whatsapp}
        primaryHref={`/agendamento?servico=${SLUG}`}
        secondaryHref="/contato"
        secondaryLabel="Tirar uma dúvida antes"
      />

      <JsonLd
        data={breadcrumbSchema([
          { label: 'Neuropsicologia', href: '/neuropsicologia' },
          { label: 'Avaliação neuropsicológica', href: `/${SLUG}` },
        ])}
      />
      <JsonLd data={faqSchema(faqs)} />
      {service ? <JsonLd data={serviceSchema(service, settings)} /> : null}
    </>
  );
}
