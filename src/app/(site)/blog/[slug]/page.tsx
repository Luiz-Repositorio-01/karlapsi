import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, ButtonLink, Card, Container, Section } from '@/components/ui';
import { CTASection } from '@/components/site/sections';
import {
  BlogPostAuthorMotion,
  BlogPostBodyMotion,
  BlogPostCoverMotion,
  BlogPostHeroMotion,
} from '@/components/site/BlogPostMotion';
import { MotionBlock } from '@/components/site/MotionBlock';
import { StaggerList } from '@/components/motion';
import { BlogCard } from '@/components/site/cards';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  getPostBySlug,
  getPublishedPosts,
  getRelatedPosts,
  getSiteSettings,
} from '@/lib/data/public';
import { articleSchema, breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { renderMarkdown } from '@/lib/content/markdown';
import { formatDate, initials, truncateText } from '@/lib/utils/format';

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getPublishedPosts(30);
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return buildMetadata({ title: 'Artigo não encontrado', path: `/blog/${slug}`, noIndex: true });
  }

  return buildMetadata({
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || undefined,
    path: `/blog/${post.slug}`,
    image: post.cover_url,
    type: 'article',
    publishedTime: post.published_at,
    modifiedTime: post.updated_at,
    keywords: post.tags,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getPostBySlug(slug), getSiteSettings()]);

  if (!post) notFound();

  const related = await getRelatedPosts(post, 3);
  const authorName = post.author?.full_name || settings.identity.professional_name;
  const authorBio = truncateText(
    post.author?.bio || settings.identity.short_bio || '',
    240,
  );
  const html = renderMarkdown(post.content);

  return (
    <>
      <article>
        <header className="surface-warm border-b border-sand-200/70">
          <Container size="narrow" className="pb-12 pt-12 sm:pt-16">
            <BlogPostHeroMotion>
              <nav aria-label="Você está aqui" className="mb-6">
                <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                  <li>
                    <Link href="/" className="transition-colors hover:text-petrol-700">
                      Início
                    </Link>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="text-ink-faint">
                      /
                    </span>
                    <Link href="/blog" className="transition-colors hover:text-petrol-700">
                      Blog
                    </Link>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="text-ink-faint">
                      /
                    </span>
                    <span aria-current="page" className="font-medium text-ink-soft">
                      {post.title}
                    </span>
                  </li>
                </ol>
              </nav>

              {post.category ? (
                <Link href={`/blog?categoria=${post.category.slug}`}>
                  <Badge tone="sand">{post.category.name}</Badge>
                </Link>
              ) : null}

              <h1 className="mt-4 text-display-lg">{post.title}</h1>

              {post.excerpt ? (
                <p className="mt-5 text-lg leading-relaxed text-ink-muted">{post.excerpt}</p>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-ink-muted">
                <div className="flex items-center gap-3">
                  {post.author?.avatar_url ? (
                    <Image
                      src={post.author.avatar_url}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-label={authorName}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-petrol-700 text-xs font-semibold text-white"
                    >
                      <span aria-hidden="true">{initials(authorName)}</span>
                    </span>
                  )}
                  <div>
                    <p className="font-medium text-ink">{authorName}</p>
                    {post.author?.specialty ? (
                      <p className="text-xs text-ink-faint">{post.author.specialty}</p>
                    ) : (
                      <p className="text-xs text-ink-faint">{settings.identity.positioning}</p>
                    )}
                  </div>
                </div>

                <span aria-hidden="true" className="text-ink-faint">
                  ·
                </span>

                {post.published_at ? (
                  <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                ) : null}

                {post.reading_minutes ? (
                  <>
                    <span aria-hidden="true" className="text-ink-faint">
                      ·
                    </span>
                    <span>{post.reading_minutes} min de leitura</span>
                  </>
                ) : null}
              </div>
            </BlogPostHeroMotion>
          </Container>
        </header>

        {post.cover_url ? (
          <div className="bg-surface">
            <Container size="narrow" className="pt-10">
              <BlogPostCoverMotion>
                <div className="relative aspect-[16/9] w-full bg-surface-sunken">
                  <Image
                    src={post.cover_url}
                    alt={post.cover_alt ?? ''}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover"
                  />
                </div>
              </BlogPostCoverMotion>
            </Container>
          </div>
        ) : null}

        <Section tone="default" className="pt-10">
          <Container size="narrow">
            <BlogPostBodyMotion>
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: html }}
              />

              {post.tags.length > 0 ? (
                <ul className="mt-10 flex flex-wrap gap-2" aria-label="Assuntos do artigo">
                  {post.tags.map((tag) => (
                    <li key={tag}>
                      <Badge>{tag}</Badge>
                    </li>
                  ))}
                </ul>
              ) : null}
            </BlogPostBodyMotion>

            <BlogPostAuthorMotion>
              <Card className="mt-12 bg-surface-muted">
                <div className="flex flex-wrap items-start gap-5">
                  {post.author?.avatar_url ? (
                    <Image
                      src={post.author.avatar_url}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-label={authorName}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-petrol-700 text-sm font-semibold text-white"
                    >
                      <span aria-hidden="true">{initials(authorName)}</span>
                    </span>
                  )}
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-ink-faint">Autoria</p>
                    <p className="mt-1 font-display text-lg text-ink">{authorName}</p>
                    <p className="text-sm text-petrol-700">
                      {post.author?.specialty || settings.identity.positioning}
                    </p>
                    {authorBio ? (
                      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{authorBio}</p>
                    ) : null}
                    <ButtonLink href="/sobre" variant="ghost" size="sm" className="mt-4">
                      Sobre quem escreve
                    </ButtonLink>
                  </div>
                </div>
              </Card>
            </BlogPostAuthorMotion>
          </Container>
        </Section>
      </article>

      {related.length > 0 ? (
        <Section tone="muted" ariaLabelledBy="relacionados-title">
          <Container>
            <MotionBlock>
              <h2 id="relacionados-title" className="text-display-sm">
                Continue lendo
              </h2>
            </MotionBlock>
            <StaggerList className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3" stagger={90}>
              {related.map((item) => (
                <li key={item.id}>
                  <BlogCard post={item} authorName={settings.identity.professional_name} />
                </li>
              ))}
            </StaggerList>
          </Container>
        </Section>
      ) : null}

      <CTASection
        title="Quer avaliar o seu caso?"
        description="Agende a entrevista inicial e entenda quais respostas a avaliação pode oferecer."
        whatsapp={settings.contact.whatsapp}
        secondaryHref="/blog"
        secondaryLabel="Ver mais artigos"
      />

      <JsonLd
        data={breadcrumbSchema([
          { label: 'Blog', href: '/blog' },
          { label: post.title, href: `/blog/${post.slug}` },
        ])}
      />
      <JsonLd data={articleSchema(post, settings)} />
    </>
  );
}
