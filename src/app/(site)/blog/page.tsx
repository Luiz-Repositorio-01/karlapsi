import { FileText } from 'lucide-react';
import { ButtonLink, Container, EmptyState, Section } from '@/components/ui';
import { CTASection, PageHero } from '@/components/site/sections';
import { BlogCard } from '@/components/site/cards';
import { MotionBlock } from '@/components/site/MotionBlock';
import { StaggerList } from '@/components/motion';
import { JsonLd } from '@/components/seo/JsonLd';
import { getBlogCategories, getPublishedPosts, getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';

export const revalidate = 300;

export async function generateMetadata() {
  return buildMetadata({
    title: 'Blog',
    description:
      'Artigos sobre neuropsicologia, desenvolvimento, aprendizagem e funções cognitivas, escritos para famílias, educadores e profissionais.',
    path: '/blog',
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const [posts, categories, settings] = await Promise.all([
    getPublishedPosts(),
    getBlogCategories(),
    getSiteSettings(),
  ]);

  const authorName = settings.identity.professional_name;

  const filtered = categoria
    ? posts.filter((post) => post.category?.slug === categoria)
    : posts;

  const useFeaturedLayout = filtered.length > 1;
  const featuredPost = useFeaturedLayout ? filtered[0] : null;
  const gridPosts = useFeaturedLayout ? filtered.slice(1) : filtered;

  return (
    <>
      <PageHero
        eyebrow="Conteúdos"
        title="Blog"
        description="Textos para entender o funcionamento cognitivo e o que esperar de uma avaliação — sem jargão desnecessário."
        breadcrumb={[{ label: 'Blog' }]}
      />

      {categories.length > 0 ? (
        <div className="border-b border-petrol-100 bg-surface">
          <Container>
            <nav aria-label="Categorias do blog" className="scroll-subtle overflow-x-auto py-4">
              <ul className="flex items-center gap-2">
                <li>
                  <ButtonLink href="/blog" variant={categoria ? 'ghost' : 'secondary'} size="sm">
                    Todos
                  </ButtonLink>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <ButtonLink
                      href={`/blog?categoria=${category.slug}`}
                      variant={categoria === category.slug ? 'secondary' : 'ghost'}
                      size="sm"
                    >
                      {category.name}
                    </ButtonLink>
                  </li>
                ))}
              </ul>
            </nav>
          </Container>
        </div>
      ) : null}

      <Section tone="default">
        <Container>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<FileText aria-hidden="true" className="h-5 w-5" />}
              title={
                categoria
                  ? 'Nenhum artigo nesta categoria ainda'
                  : 'Os primeiros artigos estão sendo preparados'
              }
              description="Novos textos serão publicados em breve. Enquanto isso, explore os conteúdos sobre neuropsicologia."
              action={
                categoria ? (
                  <ButtonLink href="/blog" variant="secondary" size="sm">
                    Ver todos os artigos
                  </ButtonLink>
                ) : (
                  <ButtonLink href="/neuropsicologia" variant="secondary" size="sm">
                    Ler sobre neuropsicologia
                  </ButtonLink>
                )
              }
            />
          ) : (
            <div className="space-y-10">
              {featuredPost ? (
                <MotionBlock variant="scale">
                  <BlogCard post={featuredPost} authorName={authorName} featured />
                </MotionBlock>
              ) : null}

              {gridPosts.length > 0 ? (
                <StaggerList className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" stagger={90}>
                  {gridPosts.map((post) => (
                    <li key={post.id}>
                      <BlogCard post={post} authorName={authorName} />
                    </li>
                  ))}
                </StaggerList>
              ) : null}
            </div>
          )}
        </Container>
      </Section>

      <CTASection
        title="Precisa de uma avaliação?"
        description="Os artigos ajudam a entender o processo. A avaliação responde ao seu caso específico."
        whatsapp={settings.contact.whatsapp}
        secondaryHref="/servicos"
        secondaryLabel="Ver serviços"
      />

      <JsonLd data={breadcrumbSchema([{ label: 'Blog', href: '/blog' }])} />
    </>
  );
}
