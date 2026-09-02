import { ArrowRight } from 'lucide-react';
import { ButtonLink, Container, EmptyState, Section, SectionHeader } from '@/components/ui';
import { CTASection, PageHero } from '@/components/site/sections';
import { MotionBlock } from '@/components/site/MotionBlock';
import { StaggerList } from '@/components/motion';
import { BlogCard, ProductCard } from '@/components/site/cards';
import { JsonLd } from '@/components/seo/JsonLd';
import { getProducts, getPublishedPosts, getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';

export const revalidate = 300;

export async function generateMetadata() {
  return buildMetadata({
    title: 'Novidades',
    description: 'Artigos e materiais digitais publicados recentemente por Karla Dias.',
    path: '/novidades',
  });
}

export default async function NovidadesPage() {
  const [posts, products, settings] = await Promise.all([
    getPublishedPosts(6),
    getProducts(),
    getSiteSettings(),
  ]);

  const recentProducts = products.slice(0, 3);
  const hasContent = posts.length > 0 || recentProducts.length > 0;

  return (
    <>
      <PageHero
        eyebrow="Atualizações"
        title="Novidades"
        description="O que saiu recentemente no blog e no catálogo de materiais."
        breadcrumb={[{ label: 'Novidades' }]}
      />

      {!hasContent ? (
        <Section tone="default">
          <Container>
            <MotionBlock>
              <EmptyState
                title="Nenhuma novidade publicada ainda"
                description="Quando houver artigos ou produtos publicados, eles aparecem nesta página."
                action={
                  <ButtonLink href="/blog" variant="secondary" size="sm">
                    Ir ao blog
                  </ButtonLink>
                }
              />
            </MotionBlock>
          </Container>
        </Section>
      ) : null}

      {posts.length > 0 ? (
        <Section tone="default">
          <Container>
            <MotionBlock>
              <div className="flex flex-wrap items-end justify-between gap-6">
                <SectionHeader eyebrow="Blog" title="Artigos recentes" />
                <ButtonLink href="/blog" variant="ghost">
                  Ver todos
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </ButtonLink>
              </div>
            </MotionBlock>
            <StaggerList className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3" stagger={90}>
              {posts.map((post) => (
                <li key={post.id}>
                  <BlogCard post={post} />
                </li>
              ))}
            </StaggerList>
          </Container>
        </Section>
      ) : null}

      {recentProducts.length > 0 ? (
        <Section tone="muted">
          <Container>
            <MotionBlock>
              <div className="flex flex-wrap items-end justify-between gap-6">
                <SectionHeader eyebrow="Materiais" title="Produtos em destaque" />
                <ButtonLink href="/materiais" variant="ghost">
                  Ver catálogo
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </ButtonLink>
              </div>
            </MotionBlock>
            <StaggerList className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={90}>
              {recentProducts.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </StaggerList>
          </Container>
        </Section>
      ) : null}

      <CTASection
        title="Prefere uma conversa?"
        description="Agende o atendimento para tratar do seu caso especificamente."
        whatsapp={settings.contact.whatsapp}
        primaryHref="/agendamento"
        primaryLabel="Agendar atendimento"
        secondaryHref="/contato"
        secondaryLabel="Enviar mensagem"
      />

      <JsonLd data={breadcrumbSchema([{ label: 'Novidades', href: '/novidades' }])} />
    </>
  );
}
