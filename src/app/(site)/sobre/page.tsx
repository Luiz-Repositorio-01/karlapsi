import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Alert, ButtonLink, Card, Container, Section } from '@/components/ui';
import { Reveal } from '@/components/ui/interactive';
import { CTASection, PageHero, SitePageSections } from '@/components/site/sections';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSitePage, getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema, personSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';

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
          <Reveal>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
              <div>
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-surface-sunken ring-1 ring-petrol-100">
                  {identity.photo_url ? (
                    <Image
                      src={identity.photo_url}
                      alt={`Retrato de ${identity.professional_name}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 320px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-petrol-700 to-petrol-900 p-6 text-center">
                      <p className="font-display text-2xl text-white">
                        {identity.professional_name}
                      </p>
                    </div>
                  )}
                </div>

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
                {identity.short_bio ? (
                  <div className="article-body max-w-prose">
                    {identity.short_bio.split('\n\n').map((paragraph) => (
                      <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                    ))}
                  </div>
                ) : (
                  <Alert tone="info" title="Apresentação profissional a ser preenchida">
                    O texto de apresentação, a formação e os registros profissionais são
                    cadastrados pela própria profissional em <strong>Configurações</strong> no
                    painel administrativo. Nada é publicado aqui sem essa confirmação — o site não
                    presume nem gera informação profissional.
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
          </Reveal>
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
