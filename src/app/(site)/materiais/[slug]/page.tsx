import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Check, Download, ExternalLink } from 'lucide-react';
import { Badge, ButtonLink, Card, Container, Section } from '@/components/ui';
import { CTASection, FaqSection, PageHero } from '@/components/site/sections';
import { CheckoutForm } from '@/components/store/CheckoutForm';
import { JsonLd } from '@/components/seo/JsonLd';
import { getFaqs, getProductBySlug, getProducts, getSiteSettings } from '@/lib/data/public';
import { isMercadoPagoConfigured } from '@/lib/env';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatCurrency } from '@/lib/utils/format';

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return buildMetadata({ title: 'Material não encontrado', path: `/materiais/${slug}`, noIndex: true });
  }

  return buildMetadata({
    title: product.name,
    description: product.summary ?? undefined,
    path: `/materiais/${product.slug}`,
    image: product.cover_url,
  });
}

export default async function MaterialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings, faqs] = await Promise.all([
    getProductBySlug(slug),
    getSiteSettings(),
    getFaqs('materiais'),
  ]);

  if (!product) notFound();

  const paymentsEnabled = isMercadoPagoConfigured() && settings.features.enable_online_payments;

  return (
    <>
      <PageHero
        eyebrow="Material digital"
        title={product.name}
        description={product.summary ?? undefined}
        breadcrumb={[{ label: 'Materiais', href: '/materiais' }, { label: product.name }]}
      />

      <Section tone="default">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
            <div>
              {product.cover_url ? (
                <div className="relative mb-8 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-surface-sunken">
                  <Image
                    src={product.cover_url}
                    alt={`Imagem de ${product.name}`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 720px"
                    className="object-cover"
                  />
                </div>
              ) : null}

              {product.description ? (
                <div className="article-body max-w-prose">
                  {product.description.split('\n\n').map((paragraph) => (
                    <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                  ))}
                </div>
              ) : null}

              {product.benefits.length > 0 ? (
                <div className="mt-10">
                  <h2 className="text-display-sm">O que está incluído</h2>
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {product.benefits.map((benefit) => (
                      <li key={benefit} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                        <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-petrol-600" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {product.audience ? (
                <Card className="mt-10 bg-surface-muted">
                  <h2 className="font-display text-lg text-ink">Para quem é</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{product.audience}</p>
                </Card>
              ) : null}

              {product.preview_url ? (
                <div className="mt-10">
                  <ButtonLink href={product.preview_url} external variant="secondary">
                    Ver prévia
                    <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  </ButtonLink>
                </div>
              ) : null}
            </div>

            <aside>
              <Card className="lg:sticky lg:top-28">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl text-ink">
                    {product.is_free ? 'Gratuito' : formatCurrency(product.price_cents)}
                  </span>
                  {product.compare_at_cents && product.compare_at_cents > product.price_cents ? (
                    <span className="text-sm text-ink-faint line-through">
                      {formatCurrency(product.compare_at_cents)}
                    </span>
                  ) : null}
                </div>

                {product.is_free ? (
                  <Badge tone="success" className="mt-3">
                    Acesso liberado
                  </Badge>
                ) : null}

                <div className="mt-6">
                  {product.is_free ? (
                    product.external_url ? (
                      <ButtonLink href={product.external_url} external className="w-full" size="lg">
                        <Download aria-hidden="true" className="h-4 w-4" />
                        Baixar material
                      </ButtonLink>
                    ) : (
                      <p className="text-sm leading-relaxed text-ink-muted">
                        O link de download deste material gratuito será publicado no painel
                        administrativo.
                      </p>
                    )
                  ) : (
                    <CheckoutForm
                      productSlug={product.slug}
                      priceCents={product.price_cents}
                      paymentsEnabled={paymentsEnabled}
                      consentVersion={settings.booking.consent_version}
                    />
                  )}
                </div>
              </Card>
            </aside>
          </div>
        </Container>
      </Section>

      <FaqSection faqs={faqs} title="Perguntas frequentes" tone="muted" />

      <CTASection
        title="Quer uma avaliação individual?"
        description="Materiais informam. A avaliação neuropsicológica responde ao caso específico com dados."
        whatsapp={settings.contact.whatsapp}
        secondaryHref="/materiais"
        secondaryLabel="Ver outros materiais"
      />

      <JsonLd
        data={breadcrumbSchema([
          { label: 'Materiais', href: '/materiais' },
          { label: product.name, href: `/materiais/${product.slug}` },
        ])}
      />
    </>
  );
}
