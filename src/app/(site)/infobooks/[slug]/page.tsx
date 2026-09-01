import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BookOpen, Download, ExternalLink, ShoppingBag } from 'lucide-react';
import { Alert, Badge, ButtonLink, Card, Container, Section } from '@/components/ui';
import { CTASection, PageHero } from '@/components/site/sections';
import { JsonLd } from '@/components/seo/JsonLd';
import { getInfobookBySlug, getInfobooks, getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { getLegacyEntry, listLegacyLandingSlugs } from '@/lib/legacy';
import { formatCurrency } from '@/lib/utils/format';

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const [infobooks, legacySlugs] = await Promise.all([
    getInfobooks(),
    Promise.resolve(listLegacyLandingSlugs()),
  ]);

  const slugs = new Set([...infobooks.map((item) => item.slug), ...legacySlugs]);
  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const infobook = await getInfobookBySlug(slug);

  if (!infobook) {
    return buildMetadata({
      title: 'Infobook',
      description: 'Material digital publicado por Karla Dias.',
      path: `/infobooks/${slug}`,
    });
  }

  return buildMetadata({
    title: infobook.seo_title || infobook.title,
    description: infobook.seo_description || infobook.description || undefined,
    path: `/infobooks/${infobook.slug}`,
    image: infobook.cover_url,
  });
}

export default async function InfobookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [infobook, settings] = await Promise.all([getInfobookBySlug(slug), getSiteSettings()]);

  // Módulo original preservado: mesmo sem registro no banco, o arquivo
  // continua acessível por esta rota (nenhum link antigo é perdido).
  const legacyEntry = getLegacyEntry(slug, infobook?.legacy_path);

  if (!infobook && !legacyEntry) notFound();

  const title = infobook?.title ?? slug.replace(/-/g, ' ');
  const isFree = infobook?.is_free ?? true;
  const accessUrl = infobook?.public_file_url || legacyEntry || infobook?.preview_url || null;

  return (
    <>
      <PageHero
        eyebrow="Infobook"
        title={title}
        description={infobook?.description ?? undefined}
        breadcrumb={[{ label: 'Infobooks', href: '/infobooks' }, { label: title }]}
        actions={
          <>
            {accessUrl ? (
              <ButtonLink href={accessUrl} external>
                {isFree ? (
                  <>
                    <Download aria-hidden="true" className="h-4 w-4" />
                    Baixar
                  </>
                ) : (
                  <>
                    <ExternalLink aria-hidden="true" className="h-4 w-4" />
                    Acessar
                  </>
                )}
              </ButtonLink>
            ) : null}

            {!isFree && infobook?.product_id ? (
              <ButtonLink href={`/materiais/${slug}`} variant={accessUrl ? 'secondary' : 'primary'}>
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
              {legacyEntry ? (
                <>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <Badge tone="success">Material original preservado</Badge>
                    <ButtonLink href={legacyEntry} external variant="ghost" size="sm">
                      Abrir em nova aba
                      <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                    </ButtonLink>
                  </div>
                  <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-petrol-100">
                    <iframe
                      src={legacyEntry}
                      title={`${title} — material original`}
                      className="h-[70vh] min-h-[480px] w-full"
                      loading="lazy"
                    />
                  </div>
                </>
              ) : infobook?.preview_url ? (
                <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-petrol-100">
                  <iframe
                    src={infobook.preview_url}
                    title={`${title} — prévia`}
                    className="h-[70vh] min-h-[480px] w-full"
                    loading="lazy"
                  />
                </div>
              ) : (
                <Alert tone="info" title="Prévia não disponível">
                  Este material não tem prévia pública cadastrada. Use o botão de acesso para obter
                  o conteúdo completo.
                </Alert>
              )}
            </div>

            <aside>
              <Card className="lg:sticky lg:top-28">
                {infobook?.cover_url ? (
                  <div className="relative mb-5 aspect-[4/5] w-full overflow-hidden rounded-xl bg-surface-sunken">
                    <Image
                      src={infobook.cover_url}
                      alt={`Capa de ${title}`}
                      fill
                      sizes="320px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="mb-5 flex aspect-[4/5] items-center justify-center rounded-xl bg-gradient-to-br from-sand-100 to-petrol-50">
                    <BookOpen aria-hidden="true" className="h-9 w-9 text-petrol-300" />
                  </div>
                )}

                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">Acesso</dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {isFree ? 'Gratuito' : formatCurrency(infobook?.price_cents ?? null)}
                    </dd>
                  </div>
                  {infobook?.category ? (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-ink-faint">Categoria</dt>
                      <dd className="mt-0.5 font-medium text-ink">{infobook.category}</dd>
                    </div>
                  ) : null}
                  {infobook?.pages ? (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-ink-faint">Páginas</dt>
                      <dd className="mt-0.5 font-medium text-ink">{infobook.pages}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">Autoria</dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {settings.identity.professional_name}
                    </dd>
                  </div>
                </dl>

                {accessUrl ? (
                  <ButtonLink href={accessUrl} external className="mt-6 w-full">
                    {isFree ? 'Baixar material' : 'Acessar material'}
                  </ButtonLink>
                ) : null}
              </Card>
            </aside>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Precisa de avaliação individual?"
        description="Os materiais orientam de forma geral. Para o seu caso, a avaliação neuropsicológica traz dados específicos."
        whatsapp={settings.contact.whatsapp}
        secondaryHref="/infobooks"
        secondaryLabel="Ver outros infobooks"
      />

      <JsonLd
        data={breadcrumbSchema([
          { label: 'Infobooks', href: '/infobooks' },
          { label: title, href: `/infobooks/${slug}` },
        ])}
      />
    </>
  );
}
