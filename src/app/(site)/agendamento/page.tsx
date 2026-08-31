import { CalendarCheck, Clock, MessageCircle, ShieldCheck } from 'lucide-react';
import { Alert, ButtonLink, Card, Container, Section } from '@/components/ui';
import { PageHero } from '@/components/site/sections';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { JsonLd } from '@/components/seo/JsonLd';
import { getBookableServices, getSiteSettings } from '@/lib/data/public';
import { isSupabaseConfigured } from '@/lib/env';
import { breadcrumbSchema } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { whatsappLink } from '@/lib/utils/format';

// A agenda muda a cada solicitação: nunca renderizar de forma estática.
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return buildMetadata({
    title: 'Agendamento',
    description:
      'Escolha o serviço, veja os horários realmente disponíveis e solicite seu atendimento em poucos passos.',
    path: '/agendamento',
  });
}

export default async function AgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ servico?: string }>;
}) {
  const [{ servico }, services, settings] = await Promise.all([
    searchParams,
    getBookableServices(),
    getSiteSettings(),
  ]);

  const supabaseReady = isSupabaseConfigured();

  return (
    <>
      <PageHero
        eyebrow="Agendamento"
        title="Solicitar um horário"
        description="Em quatro passos: escolher o serviço, ver os horários livres, informar seus dados e receber a confirmação."
        breadcrumb={[{ label: 'Agendamento' }]}
      />

      <Section tone="default">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14">
            <div>
              {!supabaseReady ? (
                <Alert
                  tone="warning"
                  title="Agenda em modo de demonstração"
                  className="mb-8"
                >
                  O banco de dados ainda não está conectado neste ambiente, então os horários
                  exibidos vêm da configuração padrão e a solicitação não é gravada. Assim que as
                  credenciais do Supabase forem informadas, a agenda real passa a ser usada
                  automaticamente — sem alteração de código.
                </Alert>
              ) : null}

              <BookingWizard
                services={services}
                initialServiceSlug={servico}
                showPrices={settings.booking.show_prices_publicly}
                minLeadHours={Number(settings.booking.min_lead_hours) || 0}
                consentVersion={settings.booking.consent_version}
                bookingEnabled={services.length > 0}
              />
            </div>

            <aside className="space-y-4">
              <Card>
                <h2 className="font-display text-lg text-ink">Como funciona</h2>
                <ol className="mt-4 space-y-3 text-sm text-ink-muted">
                  <li className="flex gap-3">
                    <CalendarCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-petrol-600" />
                    Você escolhe um horário livre e envia a solicitação.
                  </li>
                  <li className="flex gap-3">
                    <Clock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-petrol-600" />
                    O horário fica reservado com status &quot;aguardando confirmação&quot;.
                  </li>
                  <li className="flex gap-3">
                    <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-petrol-600" />
                    Após a checagem da agenda, a confirmação chega por e-mail.
                  </li>
                </ol>
              </Card>

              <Card>
                <h2 className="font-display text-lg text-ink">Regras da agenda</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">Antecedência</dt>
                    <dd className="mt-0.5 text-ink-soft">
                      mínimo de {settings.booking.min_lead_hours}h
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">
                      Período liberado
                    </dt>
                    <dd className="mt-0.5 text-ink-soft">
                      até {settings.booking.max_advance_days} dias à frente
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">Fuso</dt>
                    <dd className="mt-0.5 text-ink-soft">{settings.booking.timezone}</dd>
                  </div>
                </dl>
              </Card>

              {settings.contact.whatsapp ? (
                <Card className="bg-surface-muted">
                  <h2 className="font-display text-lg text-ink">Prefere falar antes?</h2>
                  <p className="mt-2 text-sm text-ink-muted">
                    Tire dúvidas sobre o processo antes de escolher um horário.
                  </p>
                  <ButtonLink
                    href={whatsappLink(
                      settings.contact.whatsapp,
                      'Olá! Gostaria de informações sobre agendamento.',
                    )}
                    external
                    variant="secondary"
                    size="sm"
                    className="mt-4 w-full"
                  >
                    <MessageCircle aria-hidden="true" className="h-4 w-4" />
                    Falar pelo WhatsApp
                  </ButtonLink>
                </Card>
              ) : null}

              <p className="px-1 text-xs leading-relaxed text-ink-faint">
                Seus dados são usados apenas para o atendimento. O aceite da política de privacidade
                é registrado com data e hora, conforme a LGPD.
              </p>
            </aside>
          </div>
        </Container>
      </Section>

      <JsonLd data={breadcrumbSchema([{ label: 'Agendamento', href: '/agendamento' }])} />
    </>
  );
}
