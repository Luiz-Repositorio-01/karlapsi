import type { MetadataRoute } from 'next';
import { getSiteSettings } from '@/lib/data/public';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();

  return {
    name: settings.seo.site_name,
    short_name: settings.identity.brand_name,
    description: settings.seo.default_description,
    start_url: '/',
    // id relativo à origem atual (evita warning "should be same origin" em localhost)
    id: '/',
    display: 'standalone',
    background_color: '#FBF8F3',
    theme_color: '#1E433B',
    lang: 'pt-BR',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
