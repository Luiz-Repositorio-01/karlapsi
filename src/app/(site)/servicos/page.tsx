import { Container, Section } from '@/components/ui';
import { CTASection, FaqSection, PageHero } from '@/components/site/sections';
import { ServiceCard } from '@/components/site/cards';
import { StaggerList } from '@/components/motion';
import { MotionBlock } from '@/components/site/MotionBlock';
import { JsonLd } from '@/components/seo/JsonLd';
import { getFaqs, getServices, getSiteSettings } from '@/lib/data/public';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';

export const revalidate = 300;

export async function generateMetadata() {
  return buildMetadata({
    title: 'Serviços',
    description:
      'Avaliação neuropsicológica, entrevista inicial e devolutiva: duração, formato e como agendar cada atendimento.',
    path: '/servicos',
  });
}

export default async function ServicosPage() {
  const [services, settings, faqs] = await Promise.all([
    getServices(),
    getSiteSettings(),
    getFaqs('atendimento'),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Serviços"
        title="O que é oferecido"
        description="Cada serviço tem objetivo, duração e formato definidos. O valor é informado na entrevista inicial ou exibido aqui quando publicado."
        breadcrumb={[{ label: 'Serviços' }]}
      />

      <Section tone="default">
        <Container>
          <MotionBlock>
            <StaggerList className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" stagger={100}>
              {services.map((service) => (
                <li key={service.id}>
                  <ServiceCard service={service} showPrice={settings.booking.show_prices_publicly} />
                </li>
              ))}
            </StaggerList>
          </MotionBlock>
        </Container>
      </Section>

      <FaqSection faqs={faqs} title="Sobre os atendimentos" />

      <CTASection
        title="Agendar atendimento"
        description="Escolha o serviço e um horário disponível. A confirmação é enviada depois da checagem da agenda."
        whatsapp={settings.contact.whatsapp}
      />

      <JsonLd data={breadcrumbSchema([{ label: 'Serviços', href: '/servicos' }])} />
    </>
  );
}
