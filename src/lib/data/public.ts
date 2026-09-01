import { createSupabasePublicClient } from '@/lib/supabase/public';
import {
  DEFAULT_FAQS,
  DEFAULT_INFOBOOKS,
  DEFAULT_SERVICES,
  DEFAULT_SETTINGS,
  DEFAULT_SITE_PAGES,
} from '@/lib/content/defaults';
import type {
  BlogCategory,
  BlogPost,
  BlogPostWithRelations,
  Faq,
  Infobook,
  LandingPage,
  Product,
  Profile,
  Service,
  SitePage,
  SiteSettings,
  Testimonial,
} from '@/lib/types';

/**
 * Leitura de conteúdo público.
 *
 * Estratégia de degradação: quando o Supabase ainda não está conectado (ou a
 * consulta falha), a aplicação usa o conteúdo padrão de
 * `src/lib/content/defaults.ts`. O site nunca fica em branco nem retorna 500 —
 * e nada é inventado: os textos padrão são neutros e editáveis no painel.
 *
 * A conversão de tipos acontece somente aqui, na borda entre o banco e o
 * domínio da aplicação.
 */

async function query<T>(
  run: (client: NonNullable<ReturnType<typeof createSupabasePublicClient>>) => Promise<T>,
  fallback: T,
): Promise<T> {
  const client = createSupabasePublicClient();
  if (!client) return fallback;
  try {
    return await run(client);
  } catch (error) {
    console.error('[data/public] consulta falhou, usando conteúdo padrão:', error);
    return fallback;
  }
}

// -----------------------------------------------------------------------------
// Configurações
// -----------------------------------------------------------------------------
export async function getSiteSettings(): Promise<SiteSettings> {
  return query(async (client) => {
    const { data, error } = await client.from('site_settings').select('key, value');
    if (error) throw error;

    const rows = (data ?? []) as { key: string; value: Record<string, unknown> }[];
    const byKey = new Map(rows.map((row) => [row.key, row.value]));

    // Mescla campo a campo: uma chave ausente no banco não apaga o padrão.
    // String vazia no banco também não esconde foto/logo/OG já publicados em /public.
    const identity = {
      ...DEFAULT_SETTINGS.identity,
      ...(byKey.get('identity') ?? {}),
    } as SiteSettings['identity'];
    const seo = { ...DEFAULT_SETTINGS.seo, ...(byKey.get('seo') ?? {}) } as SiteSettings['seo'];

    return {
      identity: {
        ...identity,
        photo_url: identity.photo_url?.trim() || DEFAULT_SETTINGS.identity.photo_url,
        logo_url: identity.logo_url?.trim() || DEFAULT_SETTINGS.identity.logo_url,
      },
      contact: { ...DEFAULT_SETTINGS.contact, ...(byKey.get('contact') ?? {}) },
      booking: { ...DEFAULT_SETTINGS.booking, ...(byKey.get('booking') ?? {}) },
      seo: {
        ...seo,
        default_og_image: seo.default_og_image?.trim() || DEFAULT_SETTINGS.seo.default_og_image,
      },
      features: { ...DEFAULT_SETTINGS.features, ...(byKey.get('features') ?? {}) },
    } as SiteSettings;
  }, DEFAULT_SETTINGS);
}

// -----------------------------------------------------------------------------
// Serviços
// -----------------------------------------------------------------------------
export async function getServices(): Promise<Service[]> {
  return query(async (client) => {
    const { data, error } = await client
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw error;
    const services = (data ?? []) as Service[];
    return services.length > 0 ? services : DEFAULT_SERVICES;
  }, DEFAULT_SERVICES);
}

export async function getBookableServices(): Promise<Service[]> {
  const services = await getServices();
  return services.filter((service) => service.allows_online_booking);
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const services = await getServices();
  return services.find((service) => service.slug === slug) ?? null;
}

// -----------------------------------------------------------------------------
// Páginas institucionais e FAQ
// -----------------------------------------------------------------------------
export async function getSitePage(slug: string): Promise<SitePage | null> {
  const fallback = DEFAULT_SITE_PAGES[slug] ?? null;

  return query(async (client) => {
    const { data, error } = await client
      .from('site_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();
    if (error) throw error;
    return (data as SitePage | null) ?? fallback;
  }, fallback);
}

export async function getFaqs(category?: string): Promise<Faq[]> {
  const fallback = category
    ? DEFAULT_FAQS.filter((faq) => faq.category === category)
    : DEFAULT_FAQS;

  return query(async (client) => {
    let builder = client
      .from('faqs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (category) builder = builder.eq('category', category);

    const { data, error } = await builder;
    if (error) throw error;
    const faqs = (data ?? []) as Faq[];
    return faqs.length > 0 ? faqs : fallback;
  }, fallback);
}

/**
 * Depoimentos: retorna lista vazia quando não há registro real publicado.
 * A Home só renderiza a seção se houver conteúdo — nada é inventado.
 */
export async function getTestimonials(): Promise<Testimonial[]> {
  return query(async (client) => {
    const { data, error } = await client
      .from('testimonials')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Testimonial[];
  }, []);
}

// -----------------------------------------------------------------------------
// Blog
// -----------------------------------------------------------------------------
export async function getPublishedPosts(limit?: number): Promise<BlogPostWithRelations[]> {
  return query(async (client) => {
    let builder = client
      .from('blog_posts')
      .select(
        '*, category:blog_categories(*), author:profiles(id, full_name, avatar_url, bio, specialty)',
      )
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false });
    if (limit) builder = builder.limit(limit);

    const { data, error } = await builder;
    if (error) throw error;
    return (data ?? []) as BlogPostWithRelations[];
  }, []);
}

export async function getPostBySlug(slug: string): Promise<BlogPostWithRelations | null> {
  return query(async (client) => {
    const { data, error } = await client
      .from('blog_posts')
      .select(
        '*, category:blog_categories(*), author:profiles(id, full_name, avatar_url, bio, specialty)',
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .maybeSingle();
    if (error) throw error;
    return (data as BlogPostWithRelations | null) ?? null;
  }, null);
}

export async function getRelatedPosts(
  post: BlogPost,
  limit = 3,
): Promise<BlogPostWithRelations[]> {
  const posts = await getPublishedPosts(12);
  const sameCategory = posts.filter(
    (item) => item.id !== post.id && item.category_id && item.category_id === post.category_id,
  );
  const others = posts.filter((item) => item.id !== post.id && !sameCategory.includes(item));
  return [...sameCategory, ...others].slice(0, limit);
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
  return query(async (client) => {
    const { data, error } = await client
      .from('blog_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []) as BlogCategory[];
  }, []);
}

/** Autor público (usado no Article schema e na assinatura dos posts). */
export async function getPublicAuthor(): Promise<Profile | null> {
  return query(async (client) => {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('is_public_author', true)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as Profile | null) ?? null;
  }, null);
}

// -----------------------------------------------------------------------------
// Infobooks, landing pages e produtos
// -----------------------------------------------------------------------------
export async function getInfobooks(): Promise<Infobook[]> {
  return query(async (client) => {
    const { data, error } = await client
      .from('infobooks')
      .select('*')
      .eq('status', 'published')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    const items = (data ?? []) as Infobook[];
    if (items.length === 0) return DEFAULT_INFOBOOKS;
    return items.map((item) => {
      const fallback = DEFAULT_INFOBOOKS.find((entry) => entry.slug === item.slug);
      if (!fallback) return item;
      return {
        ...item,
        description: item.description || fallback.description,
        cover_url: item.cover_url || fallback.cover_url,
        public_file_url: item.public_file_url || fallback.public_file_url,
        price_cents: item.is_free ? null : (item.price_cents ?? fallback.price_cents),
      };
    });
  }, DEFAULT_INFOBOOKS);
}

export async function getInfobookBySlug(slug: string): Promise<Infobook | null> {
  const items = await getInfobooks();
  return items.find((item) => item.slug === slug) ?? null;
}

export async function getLandingPages(): Promise<LandingPage[]> {
  return query(async (client) => {
    const { data, error } = await client
      .from('landing_pages')
      .select('*')
      .eq('status', 'published')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []) as LandingPage[];
  }, []);
}

export async function getLandingPageBySlug(slug: string): Promise<LandingPage | null> {
  const items = await getLandingPages();
  return items.find((item) => item.slug === slug) ?? null;
}

export async function getProducts(): Promise<Product[]> {
  return query(async (client) => {
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Product[];
  }, []);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((product) => product.slug === slug) ?? null;
}
