import { ShoppingBag } from 'lucide-react';
import { ButtonLink, Container, EmptyState, Section, SectionHeader } from '@/components/ui';
import { CTASection, FaqSection, HighlightGrid, PageHero } from '@/components/site/sections';
import { MotionBlock } from '@/components/site/MotionBlock';
import { StaggerList } from '@/components/motion';
import { ProductCard } from '@/components/site/cards';
import { JsonLd } from '@/components/seo/JsonLd';
import { getFaqs, getProducts, getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';

export const revalidate = 60;

export async function generateMetadata() {
  return buildMetadata({
    title: 'Materiais',
    description:
      'Materiais digitais sobre desenvolvimento, aprendizagem e funções cognitivas — com conteúdo, público indicado e forma de acesso.',
    path: '/materiais',
  });
}

export default async function MateriaisPage() {
  const [products, settings, faqs] = await Promise.all([
    getProducts(),
    getSiteSettings(),
    getFaqs('materiais'),
  ]);

  const featured = products.filter((product) => product.is_featured);
  const rest = products.filter((product) => !product.is_featured);

  return (
    <>
      <PageHero
        eyebrow="Loja"
        title="Materiais digitais"
        description="Conteúdos organizados para levar informação de qualidade a quem não está em processo de avaliação."
        breadcrumb={[{ label: 'Materiais' }]}
        actions={
          products.length > 0 ? <ButtonLink href="#catalogo">Ver o catálogo</ButtonLink> : undefined
        }
      />

      <Section tone="default" id="catalogo">
        <Container>
          {products.length === 0 ? (
            <MotionBlock>
              <EmptyState
                icon={<ShoppingBag aria-hidden="true" className="h-5 w-5" />}
                title="Nenhum material publicado ainda"
                description="Os materiais cadastrados no painel aparecem aqui com descrição, benefícios, preço e checkout."
                action={
                  <ButtonLink href="/infobooks" variant="secondary" size="sm">
                    Ver infobooks
                  </ButtonLink>
                }
              />
            </MotionBlock>
          ) : (
            <div className="space-y-12">
              {featured.length > 0 ? (
                <div>
                  <MotionBlock>
                    <SectionHeader eyebrow="Destaques" title="Mais procurados" />
                  </MotionBlock>
                  <StaggerList className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={90}>
                    {featured.map((product) => (
                      <li key={product.id}>
                        <ProductCard product={product} />
                      </li>
                    ))}
                  </StaggerList>
                </div>
              ) : null}

              {rest.length > 0 ? (
                <div>
                  {featured.length > 0 ? (
                    <MotionBlock>
                      <SectionHeader eyebrow="Catálogo" title="Todos os materiais" />
                    </MotionBlock>
                  ) : null}
                  <StaggerList className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={90}>
                    {rest.map((product) => (
                      <li key={product.id}>
                        <ProductCard product={product} />
                      </li>
                    ))}
                  </StaggerList>
                </div>
              ) : null}
            </div>
          )}
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <MotionBlock>
            <SectionHeader
              eyebrow="Como funciona"
              title="Compra e acesso"
              description="Processo simples, com pagamento processado por instituição especializada."
              align="center"
            />
          </MotionBlock>
          <div className="mt-12">
            <HighlightGrid
              items={[
                {
                  title: 'Pagamento seguro',
                  description:
                    'O pagamento acontece no ambiente do Mercado Pago. Nenhum dado de cartão passa por este site.',
                },
                {
                  title: 'Acesso por e-mail',
                  description:
                    'Depois da confirmação do pagamento, o acesso é enviado ao e-mail informado na compra.',
                },
                {
                  title: 'Confirmação verificada',
                  description:
                    'A liberação depende da confirmação oficial do pagamento, não apenas do retorno do navegador.',
                },
              ]}
            />
          </div>
        </Container>
      </Section>

      <FaqSection faqs={faqs} title="Dúvidas sobre os materiais" tone="default" />

      <CTASection
        title="Precisa de avaliação, não de material?"
        description="Se a dúvida é sobre um caso específico, o caminho é a avaliação neuropsicológica."
        whatsapp={settings.contact.whatsapp}
        secondaryHref="/neuropsicologia"
        secondaryLabel="Entender a avaliação"
      />

      <JsonLd data={breadcrumbSchema([{ label: 'Materiais', href: '/materiais' }])} />
    </>
  );
}
