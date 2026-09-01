import { BookOpen } from 'lucide-react';
import { Alert, ButtonLink, Container, EmptyState, Section } from '@/components/ui';
import { CTASection, PageHero } from '@/components/site/sections';
import { InfobookCard } from '@/components/site/cards';
import { JsonLd } from '@/components/seo/JsonLd';
import { getInfobooks, getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { listLegacyLandingSlugs } from '@/lib/legacy';

export const revalidate = 60;

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

  // Módulos originais publicados em /public/legacy que ainda não têm registro
  // no banco continuam acessíveis — a vitrine os lista sem alterar os arquivos.
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
            <ul className="grid gap-6 lg:grid-cols-2">
              {infobooks.map((infobook) => (
                <li key={infobook.id}>
                  <InfobookCard infobook={infobook} featured />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<BookOpen aria-hidden="true" className="h-5 w-5" />}
              title="Nenhum infobook cadastrado ainda"
              description="Ao cadastrar um infobook no painel administrativo — inclusive apontando para um arquivo já existente — ele aparece nesta vitrine com capa, descrição, preço e botão de acesso."
              action={
                <ButtonLink href="/materiais" variant="secondary" size="sm">
                  Ver materiais disponíveis
                </ButtonLink>
              }
            />
          )}

          {unregisteredLegacy.length > 0 ? (
            <Alert tone="info" title="Materiais originais disponíveis" className="mt-8">
              <p>
                Estes módulos originais estão publicados e acessíveis, mas ainda não têm cadastro no
                painel (capa, descrição e preço):
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {unregisteredLegacy.map((slug) => (
                  <li key={slug}>
                    <ButtonLink href={`/infobooks/${slug}`} variant="secondary" size="sm">
                      {slug}
                    </ButtonLink>
                  </li>
                ))}
              </ul>
            </Alert>
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
