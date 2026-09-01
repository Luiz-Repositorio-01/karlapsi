import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { WhatsAppFloat } from '@/components/site/WhatsAppFloat';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteSettings } from '@/lib/data/public';
import { organizationSchema, websiteSchema } from '@/lib/seo/jsonld';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <a href="#navegacao" className="skip-link">
        Pular para o menu
      </a>

      <Header
        brandName={settings.identity.brand_name}
        positioning={settings.identity.positioning}
        whatsapp={settings.contact.whatsapp}
        logoUrl={settings.identity.logo_url || undefined}
      />

      <main id="conteudo" tabIndex={-1} className="min-h-[60vh] bg-surface outline-none">
        {children}
      </main>

      <Footer settings={settings} />
      <WhatsAppFloat number={settings.contact.whatsapp} />

      <JsonLd data={organizationSchema(settings)} />
      <JsonLd data={websiteSchema(settings)} />
    </>
  );
}
