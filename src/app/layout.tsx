import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/interactive';
import { getSiteSettings } from '@/lib/data/public';
import { env } from '@/lib/env';

const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  // Só os pesos usados no design — menos bytes de fonte.
  weight: ['400', '500', '600', '700'],
});

const display = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600'],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const ogImage = settings.seo.default_og_image || undefined;

  return {
    metadataBase: new URL(env.siteUrl),
    title: {
      default: settings.seo.default_title,
      template: `%s — ${settings.seo.site_name}`,
    },
    description: settings.seo.default_description,
    applicationName: settings.seo.site_name,
    keywords: settings.seo.default_keywords.split(',').map((item) => item.trim()),
    authors: [{ name: settings.identity.professional_name }],
    creator: settings.identity.professional_name,
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      siteName: settings.seo.site_name,
      title: settings.seo.default_title,
      description: settings.seo.default_description,
      url: env.siteUrl,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: settings.seo.default_title,
      description: settings.seo.default_description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    alternates: { canonical: '/' },
    formatDetection: { telephone: false, address: false, email: false },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1E433B',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-dvh font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
