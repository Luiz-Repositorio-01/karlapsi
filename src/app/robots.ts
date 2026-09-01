import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Áreas privadas e endpoints nunca devem ser indexados.
        // Áreas privadas e endpoints nunca devem ser indexados.
        disallow: ['/admin', '/admin/', '/api/', '/login', '/pagamento/', '/legacy/pdf-online'],
      },
    ],
    sitemap: new URL('/sitemap.xml', env.siteUrl).toString(),
    host: env.siteUrl,
  };
}
