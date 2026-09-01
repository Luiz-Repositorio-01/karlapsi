import { notFound } from 'next/navigation';
import { Alert, ButtonLink, Card, Container, Section } from '@/components/ui';
import { CTASection, PageHero, SitePageSections } from '@/components/site/sections';
import { ProfessionalPortrait } from '@/components/site/ProfessionalPortrait';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSitePage, getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema, personSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { parseSpecializations } from '@/lib/settings/readiness';

export const revalidate = 300;

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
  const hasProfessionalCopy =
    Boolean(identity.short_bio) ||
    Boolean(identity.formation) ||
    specializations.length > 0 ||
    hasRegistration;

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
            <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
              <div>
                <ProfessionalPortrait
                  name={identity.professional_name}
                  positioning={identity.positioning}
                  photoUrl={identity.photo_url}
                  className="max-w-none rounded-2xl"
                />

                <Card className="mt-5">
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-ink-faint">Atuação</dt>
                      <dd className="mt-0.5 font-medium text-ink">{identity.positioning}</dd>
                    </div>
                    {hasRegistration ? (
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-ink-faint">
                          {identity.professional_registration_label || 'Registro profissional'}
                        </dt>
                        <dd className="mt-0.5 font-medium text-ink">
                          {identity.professional_registration_value}
                        </dd>
                      </div>
                    ) : null}
                    {specializations.length > 0 ? (
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-ink-faint">
                          Especializações
                        </dt>
                        <dd className="mt-0.5">
                          <ul className="space-y-1 font-medium text-ink">
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
                      <dd className="mt-0.5 font-medium text-ink">{contact.service_area}</dd>
                    </div>
                  </dl>
                </Card>
              </div>

              <div>
                {hasProfessionalCopy ? (
                  <div className="article-body max-w-prose space-y-6">
                    {identity.short_bio
                      ? identity.short_bio.split('\n\n').map((paragraph) => (
                          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                        ))
                      : null}
                    {identity.formation ? (
                      <div>
                        <h2 className="font-display text-xl text-ink">Formação</h2>
                        <div className="mt-3 space-y-3">
                          {identity.formation.split('\n\n').map((paragraph) => (
                            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <Alert tone="info" title="Apresentação profissional a ser preenchida">
                    O texto de apresentação, a formação, as especializações e os registros
                    profissionais são cadastrados pela própria profissional em{' '}
                    <strong>Configurações</strong> no painel administrativo. Nada é publicado aqui
                    sem essa confirmação — o site não presume nem gera informação profissional.
                  </Alert>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink href="/agendamento">Agendar atendimento</ButtonLink>
                  <ButtonLink href="/neuropsicologia" variant="secondary">
                    Conhecer a Neuropsicologia
                  </ButtonLink>
                </div>
              </div>
            </div>
        </Container>
      </Section>

      <SitePageSections page={page} />

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
