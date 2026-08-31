import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data/public';

/**
 * Monta metadata consistente por página: título, descrição, canonical,
 * Open Graph e Twitter cards a partir das configurações do site.
 */
export async function buildMetadata(options: {
  title: string;
  description?: string;
  path: string;
  image?: string | null;
  type?: 'website' | 'article';
  publishedTime?: string | null;
  modifiedTime?: string | null;
  noIndex?: boolean;
  keywords?: string[];
}): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = options.description ?? settings.seo.default_description;
  const canonical = options.path;

  return {
    title: options.title,
    description,
    keywords: options.keywords,
    alternates: { canonical },
    robots: options.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: options.type ?? 'website',
      locale: 'pt_BR',
      siteName: settings.seo.site_name,
      title: options.title,
      description,
      url: canonical,
      ...(options.image ? { images: [{ url: options.image }] } : {}),
      ...(options.publishedTime ? { publishedTime: options.publishedTime } : {}),
      ...(options.modifiedTime ? { modifiedTime: options.modifiedTime } : {}),
    },
    twitter: {
      card: options.image ? 'summary_large_image' : 'summary',
      title: options.title,
      description,
      ...(options.image ? { images: [options.image] } : {}),
    },
  };
}
