import { BookOpen } from 'lucide-react';
import { Alert, ButtonLink, Container, EmptyState, Section } from '@/components/ui';
import { CTASection, PageHero } from '@/components/site/sections';
import { InfobookCardMotion } from '@/components/site/InfobookCardMotion';
import { MotionBlock } from '@/components/site/MotionBlock';
import { StaggerList } from '@/components/motion';
import { JsonLd } from '@/components/seo/JsonLd';
import { DEFAULT_INFOBOOKS } from '@/lib/content/defaults';
import { getInfobooks, getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { listLegacyLandingSlugs } from '@/lib/legacy';

export const revalidate = 60;

function legacyInfobookTitle(slug: string): string {
  const known = DEFAULT_INFOBOOKS.find((item) => item.slug === slug);
  if (known) return known.title;
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function generateMetadata() {
  return buildMetadata({
    title: 'Infobooks',
    description:
      'Materiais digitais sobre desenvolvimento, aprendizagem e funções cognitivas, organizados para famílias, educadores e profissionais.',
    path: '/infobooks',
  });
}

export default async function InfobooksPage() {
  const [infobooks, settings] = await Promise.all([getInfobooks(), getSiteSettings()]);
  const legacySlugs = listLegacyLandingSlugs();

  const unregisteredLegacy = legacySlugs.filter(
    (slug) => !infobooks.some((infobook) => infobook.slug === slug),
  );

  return (
    <>
      <PageHero
        eyebrow="Materiais"
        title="Infobooks"
        description="Conteúdos organizados para aprofundar temas do dia a dia: o que observar, como apoiar e quando buscar avaliação."
        breadcrumb={[{ label: 'Infobooks' }]}
      />

      <Section tone="default">
        <Container>
          {infobooks.length > 0 ? (
            <StaggerList className="grid items-stretch gap-6 md:grid-cols-2" stagger={100}>
              {infobooks.map((infobook) => (
                <li key={infobook.id} className="h-full">
                  <InfobookCardMotion infobook={infobook} />
                </li>
              ))}
            </StaggerList>
          ) : (
            <EmptyState
              icon={<BookOpen aria-hidden="true" className="h-5 w-5" />}
              title="Nenhum infobook publicado ainda"
              description="Novos materiais digitais aparecerão aqui em breve."
              action={
                <ButtonLink href="/materiais" variant="secondary" size="sm">
                  Ver materiais disponíveis
                </ButtonLink>
              }
            />
          )}

          {unregisteredLegacy.length > 0 ? (
            <MotionBlock delay={120}>
            <Alert tone="info" title="Materiais complementares" className="mt-8">
              <p>Estes conteúdos também estão disponíveis para leitura:</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {unregisteredLegacy.map((slug) => (
                  <li key={slug}>
                    <ButtonLink href={`/infobooks/${slug}`} variant="secondary" size="sm">
                      {legacyInfobookTitle(slug)}
                    </ButtonLink>
                  </li>
                ))}
              </ul>
            </Alert>
            </MotionBlock>
          ) : null}
        </Container>
      </Section>

      <CTASection
        title="Prefere uma orientação individual?"
        description="Os materiais explicam o geral. A avaliação responde ao caso específico, com dados e devolutiva."
        whatsapp={settings.contact.whatsapp}
        secondaryHref="/agendamento"
        secondaryLabel="Agendar atendimento"
      />

      <JsonLd data={breadcrumbSchema([{ label: 'Infobooks', href: '/infobooks' }])} />
    </>
  );
}
