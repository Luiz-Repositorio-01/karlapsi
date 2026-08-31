import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import {
  getInfobooks,
  getLandingPages,
  getProducts,
  getPublishedPosts,
  getServices,
} from '@/lib/data/public';
import { listLegacyLandingSlugs } from '@/lib/legacy';

export const revalidate = 3600;

function url(path: string): string {
  return new URL(path, env.siteUrl).toString();
}

/**
 * Sitemap gerado a partir do conteúdo realmente publicado.
 * Rotas privadas (/admin, /login) e endpoints ficam fora, e os módulos
 * legados publicados em /public/legacy também são incluídos para não perder
 * indexação.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: url('/'), changeFrequency: 'weekly', priority: 1, lastModified: now },
    { url: url('/neuropsicologia'), changeFrequency: 'monthly', priority: 0.9, lastModified: now },
    {
      url: url('/avaliacao-neuropsicologica'),
      changeFrequency: 'monthly',
      priority: 0.9,
      lastModified: now,
    },
    { url: url('/servicos'), changeFrequency: 'monthly', priority: 0.8, lastModified: now },
    { url: url('/atendimentos'), changeFrequency: 'monthly', priority: 0.7, lastModified: now },
    { url: url('/sobre'), changeFrequency: 'monthly', priority: 0.7, lastModified: now },
    { url: url('/agendamento'), changeFrequency: 'weekly', priority: 0.9, lastModified: now },
    { url: url('/blog'), changeFrequency: 'weekly', priority: 0.8, lastModified: now },
    { url: url('/publicacoes'), changeFrequency: 'weekly', priority: 0.6, lastModified: now },
    { url: url('/infobooks'), changeFrequency: 'weekly', priority: 0.7, lastModified: now },
    { url: url('/materiais'), changeFrequency: 'weekly', priority: 0.7, lastModified: now },
    { url: url('/pdf-online'), changeFrequency: 'monthly', priority: 0.6, lastModified: now },
    { url: url('/landing-pages'), changeFrequency: 'weekly', priority: 0.6, lastModified: now },
    { url: url('/contato'), changeFrequency: 'yearly', priority: 0.5, lastModified: now },
    {
      url: url('/politica-de-privacidade'),
      changeFrequency: 'yearly',
      priority: 0.3,
      lastModified: now,
    },
    { url: url('/termos'), changeFrequency: 'yearly', priority: 0.3, lastModified: now },
  ];

  const [posts, services, infobooks, landingPages, products] = await Promise.all([
    getPublishedPosts(),
    getServices(),
    getInfobooks(),
    getLandingPages(),
    getProducts(),
  ]);

  const legacySlugs = listLegacyLandingSlugs();

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...posts.map((post) => ({
      url: url(`/blog/${post.slug}`),
      lastModified: new Date(post.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...services.map((service) => ({
      url: url(`/servicos/${service.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...infobooks.map((infobook) => ({
      url: url(`/infobooks/${infobook.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...landingPages.map((page) => ({
      url: url(`/landing-pages/${page.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...products.map((product) => ({
      url: url(`/materiais/${product.slug}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...legacySlugs
      .filter((slug) => !landingPages.some((page) => page.slug === slug))
      .map((slug) => ({
        url: url(`/landing-pages/${slug}`),
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      })),
  ];

  // Remove duplicatas mantendo a primeira ocorrência.
  const seen = new Set<string>();
  return [...staticRoutes, ...dynamicRoutes].filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
