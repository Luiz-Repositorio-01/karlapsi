import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui';
import { CTASection, FaqSection, PageHero, SitePageSections } from '@/components/site/sections';
import { JsonLd } from '@/components/seo/JsonLd';
import { getFaqs, getSitePage, getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema, faqSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';

export const revalidate = 300;

const SLUG = 'neuropsicologia';

export async function generateMetadata() {
  const page = await getSitePage(SLUG);
  return buildMetadata({
    title: page?.seo_title ?? 'Neuropsicologia',
    description: page?.seo_description ?? page?.subtitle ?? undefined,
    path: '/neuropsicologia',
    keywords: ['neuropsicologia', 'avaliação neuropsicológica', 'funções cognitivas'],
  });
}

export default async function NeuropsicologiaPage() {
  const [page, settings, faqs] = await Promise.all([
    getSitePage(SLUG),
    getSiteSettings(),
    getFaqs('neuropsicologia'),
  ]);

  if (!page) notFound();

  return (
    <>
      <PageHero
        eyebrow="Área de atuação"
        title={page.title}
        description={page.subtitle ?? undefined}
        breadcrumb={[{ label: 'Neuropsicologia' }]}
        actions={
          <>
            <ButtonLink href="/agendamento">Agendar atendimento</ButtonLink>
            <ButtonLink href="/avaliacao-neuropsicologica" variant="secondary">
              Ver a avaliação em detalhe
            </ButtonLink>
          </>
        }
      />

      <SitePageSections page={page} />

      <FaqSection
        faqs={faqs}
        title="Dúvidas sobre neuropsicologia"
        description="Respostas objetivas para as perguntas que mais aparecem antes de iniciar o processo."
      />

      <CTASection
        title="Quer entender o que está acontecendo?"
        description="A entrevista inicial existe justamente para isso: ouvir a demanda e explicar, sem compromisso de continuidade, o que a avaliação pode responder."
        whatsapp={settings.contact.whatsapp}
        secondaryHref="/servicos"
        secondaryLabel="Ver serviços"
      />

      <JsonLd data={breadcrumbSchema([{ label: 'Neuropsicologia', href: '/neuropsicologia' }])} />
      <JsonLd data={faqSchema(faqs)} />
    </>
  );
}
