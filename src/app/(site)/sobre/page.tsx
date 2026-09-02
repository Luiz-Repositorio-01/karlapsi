import { notFound } from 'next/navigation';
import { ButtonLink, Card, Container, Section } from '@/components/ui';
import { CTASection, PageHero, SitePageSectionBlock } from '@/components/site/sections';
import { ProfessionalPortrait } from '@/components/site/ProfessionalPortrait';
import { SobreMotionLayout } from '@/components/site/SobreMotionLayout';
import { MotionBlock } from '@/components/site/MotionBlock';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSitePage, getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema, personSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { parseSpecializations } from '@/lib/settings/readiness';
import type { SitePageSection } from '@/lib/types';

export const revalidate = 300;

/** Texto padrão do painel — não deve aparecer no site quando já há biografia real. */
function isPlaceholderPresentation(section: SitePageSection) {
  return (
    section.id === 'apresentacao' ||
    (section.heading === 'Apresentação' && section.body?.includes('painel administrativo'))
  );
}

export async function generateMetadata() {
  const page = await getSitePage('sobre');
  return buildMetadata({
    title: page?.seo_title ?? 'Sobre',
    description: page?.seo_description ?? page?.subtitle ?? undefined,
    path: '/sobre',
  });
}

export default async function SobrePage() {
  const [page, settings] = await Promise.all([getSitePage('sobre'), getSiteSettings()]);

  if (!page) notFound();

  const { identity, contact } = settings;
  const hasRegistration = Boolean(identity.professional_registration_value);
  const specializations = parseSpecializations(identity.specializations);
  const extraSections = page.sections.filter((section) => !isPlaceholderPresentation(section));
  const hasBio = Boolean(identity.short_bio || identity.formation);

  return (
    <>
      <PageHero
        eyebrow="Sobre"
        title={identity.professional_name}
        description={page.subtitle ?? undefined}
        breadcrumb={[{ label: 'Sobre' }]}
      />

      <Section tone="default">
        <Container>
          <SobreMotionLayout
            sidebar={
              <div className="lg:sticky lg:top-28">
                <ProfessionalPortrait
                  name={identity.professional_name}
                  positioning={identity.positioning}
                  photoUrl={identity.photo_url}
                  className="max-w-none rounded-2xl"
                />

                <Card className="mt-5">
                  <dl className="space-y-4 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-ink-faint">Atuação</dt>
                      <dd className="mt-1 font-medium leading-relaxed text-ink">
                        {identity.positioning}
                      </dd>
                    </div>
                    {hasRegistration ? (
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-ink-faint">
                          {identity.professional_registration_label || 'Registro profissional'}
                        </dt>
                        <dd className="mt-1 font-medium text-ink">
                          {identity.professional_registration_value}
                        </dd>
                      </div>
                    ) : null}
                    {specializations.length > 0 ? (
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-ink-faint">
                          Especializações
                        </dt>
                        <dd className="mt-1">
                          <ul className="space-y-1.5 font-medium leading-relaxed text-ink">
                            {specializations.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-ink-faint">
                        Modalidades
                      </dt>
                      <dd className="mt-1 font-medium text-ink">{contact.service_area}</dd>
                    </div>
                  </dl>
                </Card>

                <div className="mt-5 hidden flex-col gap-3 lg:flex">
                  <ButtonLink href="/agendamento" className="w-full">
                    Agendar atendimento
                  </ButtonLink>
                  <ButtonLink href="/neuropsicologia" variant="secondary" className="w-full">
                    Conhecer a Neuropsicologia
                  </ButtonLink>
                </div>
              </div>
            }
            main={
              <>
                {hasBio ? (
                  <div className="article-body max-w-none space-y-8">
                    {identity.short_bio
                      ? identity.short_bio.split('\n\n').map((paragraph) => (
                          <p key={paragraph.slice(0, 32)} className="text-base leading-relaxed">
                            {paragraph}
                          </p>
                        ))
                      : null}

                    {identity.formation ? (
                      <div>
                        <h2 className="font-display text-2xl text-ink">Formação</h2>
                        <div className="mt-4 space-y-4">
                          {identity.formation.split('\n\n').map((paragraph) => (
                            <p key={paragraph.slice(0, 32)} className="text-base leading-relaxed">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : page.subtitle ? (
                  <p className="text-base leading-relaxed text-ink-muted">{page.subtitle}</p>
                ) : null}

                {extraSections.map((section, index) => (
                  <MotionBlock
                    key={section.id}
                    delay={index * 80}
                    className={
                      index > 0 || hasBio || page.subtitle
                        ? 'border-t border-petrol-100/80 pt-10'
                        : undefined
                    }
                  >
                    <SitePageSectionBlock section={section} compact />
                  </MotionBlock>
                ))}

                <div className="flex flex-wrap gap-3 border-t border-petrol-100/80 pt-10 lg:hidden">
                  <ButtonLink href="/agendamento">Agendar atendimento</ButtonLink>
                  <ButtonLink href="/neuropsicologia" variant="secondary">
                    Conhecer a Neuropsicologia
                  </ButtonLink>
                </div>
              </>
            }
          />
        </Container>
      </Section>

      <CTASection
        title="Vamos conversar sobre o seu caso"
        description="A entrevista inicial é o espaço para entender a demanda e definir, com clareza, o melhor caminho."
        whatsapp={contact.whatsapp}
        secondaryHref="/contato"
        secondaryLabel="Enviar uma mensagem"
      />

      <JsonLd data={breadcrumbSchema([{ label: 'Sobre', href: '/sobre' }])} />
      <JsonLd data={personSchema(settings)} />
    </>
  );
}
