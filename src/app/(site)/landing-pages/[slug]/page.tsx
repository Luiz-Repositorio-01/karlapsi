import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Check, ExternalLink, ShoppingBag } from 'lucide-react';
import { Alert, Badge, ButtonLink, Card, Container, Section } from '@/components/ui';
import { CTASection, PageHero } from '@/components/site/sections';
import { JsonLd } from '@/components/seo/JsonLd';
import { getLandingPageBySlug, getLandingPages, getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { getLegacyEntry, listLegacyLandingSlugs } from '@/lib/legacy';
import { formatCurrency } from '@/lib/utils/format';

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const pages = await getLandingPages();
  const slugs = new Set([...pages.map((page) => page.slug), ...listLegacyLandingSlugs()]);
  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getLandingPageBySlug(slug);

  if (!page) {
    return buildMetadata({
      title: slug.replace(/-/g, ' '),
      description: 'Página de material publicada por Karla Dias Neuropsi.',
      path: `/landing-pages/${slug}`,
    });
  }

  return buildMetadata({
    title: page.seo_title || page.name,
    description: page.seo_description || page.description || undefined,
    path: `/landing-pages/${page.slug}`,
    image: page.cover_url,
  });
}

export default async function LandingPageDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [page, settings] = await Promise.all([getLandingPageBySlug(slug), getSiteSettings()]);

  const legacyEntry = getLegacyEntry(slug, page?.legacy_path);
  if (!page && !legacyEntry) notFound();

  const title = page?.name ?? slug.replace(/-/g, ' ');
  const ctaUrl = page?.cta_url || legacyEntry || null;

  return (
    <>
      <PageHero
        eyebrow="Material"
        title={title}
        description={page?.headline ?? page?.description ?? undefined}
        breadcrumb={[{ label: 'Landing pages', href: '/landing-pages' }, { label: title }]}
        actions={
          <>
            {ctaUrl ? (
              <ButtonLink href={ctaUrl} external>
                {page?.cta_label || 'Acessar página'}
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
              </ButtonLink>
            ) : null}
            {page?.product_id ? (
              <ButtonLink href={`/materiais/${slug}`} variant={ctaUrl ? 'secondary' : 'primary'}>
                <ShoppingBag aria-hidden="true" className="h-4 w-4" />
                Comprar
              </ButtonLink>
            ) : null}
          </>
        }
      />

      <Section tone="default">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
            <div>
              {page?.cover_url ? (
                <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-surface-sunken">
                  <Image
                    src={page.cover_url}
                    alt={`Capa de ${title}`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 760px"
                    className="object-cover"
                  />
                </div>
              ) : null}

              {page?.description ? (
                <div className="article-body max-w-prose">
                  {page.description.split('\n\n').map((paragraph) => (
                    <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                  ))}
                </div>
              ) : null}

              {page && page.benefits.length > 0 ? (
                <div className="mt-10">
                  <h2 className="text-display-sm">O que você encontra</h2>
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {page.benefits.map((benefit) => (
                      <li key={benefit} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                        <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-petrol-600" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {legacyEntry ? (
                <div className="mt-12">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <Badge tone="success">Página original preservada</Badge>
                    <ButtonLink href={legacyEntry} external variant="ghost" size="sm">
                      Abrir em nova aba
                      <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                    </ButtonLink>
                  </div>
                  <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-petrol-100">
                    <iframe
                      src={legacyEntry}
                      title={`${title} — página original`}
                      className="h-[70vh] min-h-[480px] w-full"
                      loading="lazy"
                    />
                  </div>
                </div>
              ) : page ? (
                <Alert tone="info" title="Página original não localizada" className="mt-10">
                  O cadastro existe, mas o arquivo indicado em <em>Caminho legado</em> não foi
                  encontrado em <code>public/legacy</code>. A vitrine continua funcionando; ao
                  publicar o arquivo, ele passa a ser exibido aqui automaticamente.
                </Alert>
              ) : null}
            </div>

            <aside>
              <Card className="lg:sticky lg:top-28">
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">Investimento</dt>
                    <dd className="mt-0.5 font-display text-xl text-ink">
                      {page?.price_cents !== null && page?.price_cents !== undefined
                        ? formatCurrency(page.price_cents)
                        : 'Acesso livre'}
                    </dd>
                  </div>
                  {page?.audience ? (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-ink-faint">Para quem é</dt>
                      <dd className="mt-0.5 leading-relaxed text-ink-soft">{page.audience}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">Autoria</dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {settings.identity.professional_name}
                    </dd>
                  </div>
                </dl>

                {ctaUrl ? (
                  <ButtonLink href={ctaUrl} external className="mt-6 w-full">
                    {page?.cta_label || 'Acessar'}
                  </ButtonLink>
                ) : null}
                {page?.product_id ? (
                  <ButtonLink
                    href={`/materiais/${slug}`}
                    variant="secondary"
                    className="mt-3 w-full"
                  >
                    Comprar material
                  </ButtonLink>
                ) : null}
              </Card>
            </aside>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Quer uma orientação individual?"
        description="Materiais ajudam a entender o cenário. A avaliação responde ao caso concreto."
        whatsapp={settings.contact.whatsapp}
        secondaryHref="/landing-pages"
        secondaryLabel="Ver outras páginas"
      />

      <JsonLd
        data={breadcrumbSchema([
          { label: 'Landing pages', href: '/landing-pages' },
          { label: title, href: `/landing-pages/${slug}` },
        ])}
      />
    </>
  );
}
