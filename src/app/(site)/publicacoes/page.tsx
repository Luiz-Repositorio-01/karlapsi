import { ArrowRight, BookOpen, FileText, ShoppingBag } from 'lucide-react';
import { ButtonLink, Card, Container, Section, SectionHeader } from '@/components/ui';
import { Reveal } from '@/components/ui/interactive';
import { CTASection, PageHero } from '@/components/site/sections';
import { BlogCard, InfobookCard, ProductCard } from '@/components/site/cards';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  getInfobooks,
  getProducts,
  getPublishedPosts,
  getSiteSettings,
} from '@/lib/data/public';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';

export const revalidate = 300;

export async function generateMetadata() {
  return buildMetadata({
    title: 'Publicações',
    description:
      'Tudo o que é publicado em um só lugar: artigos do blog, infobooks, PDF Online e materiais digitais.',
    path: '/publicacoes',
  });
}

export default async function PublicacoesPage() {
  const [posts, infobooks, products, settings] = await Promise.all([
    getPublishedPosts(3),
    getInfobooks(),
    getProducts(),
    getSiteSettings(),
  ]);

  const areas = [
    {
      icon: FileText,
      title: 'Blog',
      description: 'Artigos sobre cognição, aprendizagem e o processo de avaliação.',
      href: '/blog',
      count: posts.length,
    },
    {
      icon: BookOpen,
      title: 'Infobooks',
      description: 'Materiais organizados por tema, gratuitos ou pagos.',
      href: '/infobooks',
      count: infobooks.length,
    },
    {
      icon: FileText,
      title: 'PDF Online',
      description: 'Leitura do material diretamente no navegador.',
      href: '/pdf-online',
      count: null,
    },
    {
      icon: ShoppingBag,
      title: 'Materiais',
      description: 'Catálogo de produtos digitais com checkout.',
      href: '/materiais',
      count: products.length,
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="Conteúdos"
        title="Publicações"
        description="Todo o material publicado reunido em um índice: artigos, infobooks, PDF Online e materiais digitais."
        breadcrumb={[{ label: 'Publicações' }]}
      />

      <Section tone="default">
        <Container>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {areas.map((area, index) => (
              <Reveal as="li" key={area.href} delay={index * 50}>
                <Card interactive className="flex h-full flex-col">
                  <area.icon aria-hidden="true" className="h-5 w-5 text-petrol-600" />
                  <p className="mt-4 font-display text-lg text-ink">{area.title}</p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                    {area.description}
                  </p>
                  {area.count !== null ? (
                    <p className="mt-3 text-xs text-ink-faint">
                      {area.count} {area.count === 1 ? 'item publicado' : 'itens publicados'}
                    </p>
                  ) : null}
                  <ButtonLink href={area.href} variant="ghost" size="sm" className="mt-4 self-start">
                    Acessar
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </ButtonLink>
                </Card>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      {posts.length > 0 ? (
        <Section tone="muted">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeader eyebrow="Blog" title="Artigos recentes" />
              <ButtonLink href="/blog" variant="ghost">
                Ver todos
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </ButtonLink>
            </div>
            <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <Reveal as="li" key={post.id} delay={index * 50}>
                  <BlogCard post={post} />
                </Reveal>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {infobooks.length > 0 ? (
        <Section tone="default">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeader eyebrow="Infobooks" title="Materiais para aprofundar" />
              <ButtonLink href="/infobooks" variant="ghost">
                Ver todos
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </ButtonLink>
            </div>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {infobooks.slice(0, 4).map((infobook, index) => (
                <Reveal as="li" key={infobook.id} delay={index * 50}>
                  <InfobookCard infobook={infobook} />
                </Reveal>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {products.length > 0 ? (
        <Section tone="muted">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeader eyebrow="Materiais" title="Produtos digitais" />
              <ButtonLink href="/materiais" variant="ghost">
                Ver catálogo
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </ButtonLink>
            </div>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, 3).map((product, index) => (
                <Reveal as="li" key={product.id} delay={index * 50}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <CTASection
        title="Prefere uma conversa?"
        description="Agende a entrevista inicial para tratar do seu caso especificamente."
        whatsapp={settings.contact.whatsapp}
        secondaryHref="/contato"
        secondaryLabel="Enviar mensagem"
      />

      <JsonLd data={breadcrumbSchema([{ label: 'Publicações', href: '/publicacoes' }])} />
    </>
  );
}
