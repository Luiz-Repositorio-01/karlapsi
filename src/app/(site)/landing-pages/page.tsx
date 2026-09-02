import { FileText } from 'lucide-react';
import { Alert, ButtonLink, Container, EmptyState, Section } from '@/components/ui';
import { CTASection, PageHero } from '@/components/site/sections';
import { MotionBlock } from '@/components/site/MotionBlock';
import { StaggerList } from '@/components/motion';
import { LandingPageCard } from '@/components/site/cards';
import { JsonLd } from '@/components/seo/JsonLd';
import { getLandingPages, getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { listLegacyLandingSlugs } from '@/lib/legacy';

export const revalidate = 60;

export async function generateMetadata() {
  return buildMetadata({
    title: 'Landing pages',
    description:
      'Vitrine das páginas comerciais dos materiais digitais: para quem é, o que inclui e como acessar.',
    path: '/landing-pages',
  });
}

export default async function LandingPagesPage() {
  const [pages, settings] = await Promise.all([getLandingPages(), getSiteSettings()]);
  const legacySlugs = listLegacyLandingSlugs();

  const unregisteredLegacy = legacySlugs.filter(
    (slug) => !pages.some((page) => page.slug === slug),
  );

  return (
    <>
      <PageHero
        eyebrow="Produtos"
        title="Landing pages"
        description="As páginas dos materiais reunidas em um só lugar. As páginas originais continuam funcionando exatamente como antes."
        breadcrumb={[{ label: 'Landing pages' }]}
      />

      <Section tone="default">
        <Container>
          {pages.length > 0 ? (
            <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={90}>
              {pages.map((page) => (
                <li key={page.id}>
                  <LandingPageCard page={page} />
                </li>
              ))}
            </StaggerList>
          ) : (
            <MotionBlock>
              <EmptyState
                icon={<FileText aria-hidden="true" className="h-5 w-5" />}
                title="Nenhuma landing page cadastrada ainda"
                description="Cadastre no painel apontando para a página original (campo Caminho legado) para exibi-la aqui com capa, benefícios e CTA — sem alterar o arquivo original."
                action={
                  <ButtonLink href="/materiais" variant="secondary" size="sm">
                    Ver materiais
                  </ButtonLink>
                }
              />
            </MotionBlock>
          )}

          {unregisteredLegacy.length > 0 ? (
            <MotionBlock delay={120}>
              <Alert tone="info" title="Páginas originais publicadas" className="mt-8">
                <p>
                  Estas páginas originais estão acessíveis e ainda não têm cadastro na vitrine:
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {unregisteredLegacy.map((slug) => (
                    <li key={slug}>
                      <ButtonLink href={`/landing-pages/${slug}`} variant="secondary" size="sm">
                        {slug}
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
        title="Dúvida sobre qual material escolher?"
        description="Fale diretamente e receba a indicação mais adequada ao seu contexto."
        whatsapp={settings.contact.whatsapp}
        primaryHref="/contato"
        primaryLabel="Falar sobre os materiais"
        secondaryHref="/infobooks"
        secondaryLabel="Ver infobooks"
      />

      <JsonLd data={breadcrumbSchema([{ label: 'Landing pages', href: '/landing-pages' }])} />
    </>
  );
}
