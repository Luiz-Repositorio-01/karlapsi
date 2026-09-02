import { notFound } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Alert, ButtonLink, Card, Container, Section } from '@/components/ui';
import { PageHero } from '@/components/site/sections';
import {
  PaymentStatusActions,
  PaymentStatusAlert,
  PaymentStatusCard,
  PaymentStatusMotion,
} from '@/components/site/PaymentStatusMotion';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/data/public';
import { buildMetadata } from '@/lib/seo/metadata';
import { ORDER_STATUS } from '@/lib/utils/labels';
import { formatCurrency, whatsappLink } from '@/lib/utils/format';
import type { OrderStatus } from '@/lib/types';

/**
 * Retorno do checkout.
 *
 * IMPORTANTE: esta página NUNCA marca um pagamento como aprovado. O parâmetro
 * de retorno do navegador é apenas uma dica de navegação; o status exibido é
 * lido do banco, que só é atualizado pelo webhook após consulta à API do
 * Mercado Pago.
 */
export const dynamic = 'force-dynamic';

const VARIANTS = {
  sucesso: {
    icon: CheckCircle2,
    tone: 'success' as const,
    title: 'Pagamento recebido para conferência',
    description:
      'O retorno do checkout foi concluído. A liberação do material acontece após a confirmação oficial do pagamento.',
  },
  pendente: {
    icon: Clock,
    tone: 'warning' as const,
    title: 'Pagamento pendente',
    description:
      'O pagamento foi iniciado e ainda está em processamento. Assim que for confirmado, o acesso é enviado por e-mail.',
  },
  erro: {
    icon: XCircle,
    tone: 'danger' as const,
    title: 'Não foi possível concluir o pagamento',
    description:
      'O pagamento não foi finalizado. Nenhum valor foi cobrado. Você pode tentar novamente ou escolher outra forma de pagamento.',
  },
} as const;

type StatusKey = keyof typeof VARIANTS;

function isStatusKey(value: string): value is StatusKey {
  return value in VARIANTS;
}

export async function generateStaticParams() {
  return Object.keys(VARIANTS).map((status) => ({ status }));
}

export async function generateMetadata({ params }: { params: Promise<{ status: string }> }) {
  const { status } = await params;
  const variant = isStatusKey(status) ? VARIANTS[status] : null;

  return buildMetadata({
    title: variant?.title ?? 'Pagamento',
    path: `/pagamento/${status}`,
    noIndex: true,
  });
}

export default async function PagamentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ status: string }>;
  searchParams: Promise<{ pedido?: string }>;
}) {
  const [{ status }, { pedido }, settings] = await Promise.all([
    params,
    searchParams,
    getSiteSettings(),
  ]);

  if (!isStatusKey(status)) notFound();
  const variant = VARIANTS[status];
  const Icon = variant.icon;

  // Consulta o estado real do pedido (fonte de verdade: banco + webhook).
  interface OrderSummary {
    order_number: string;
    status: OrderStatus;
    total_cents: number;
  }

  let order: OrderSummary | null = null;

  if (pedido) {
    const supabase = createSupabaseAdminClient();
    if (supabase) {
      const { data } = await supabase
        .from('orders')
        .select('order_number, status, total_cents')
        .eq('order_number', pedido)
        .maybeSingle();
      order = (data as OrderSummary | null) ?? null;
    }
  }

  const orderStatus = order ? ORDER_STATUS[order.status] : null;
  const isConfirmed = order?.status === 'paid' || order?.status === 'fulfilled';

  return (
    <>
      <PageHero
        eyebrow="Pagamento"
        title={variant.title}
        description={variant.description}
        breadcrumb={[{ label: 'Materiais', href: '/materiais' }, { label: 'Pagamento' }]}
      />

      <Section tone="default">
        <Container size="narrow">
          <PaymentStatusMotion>
            <PaymentStatusCard>
          <Card>
            <div className="flex items-start gap-4">
              <Icon
                aria-hidden="true"
                className={
                  variant.tone === 'success'
                    ? 'mt-0.5 h-6 w-6 shrink-0 text-emerald-600'
                    : variant.tone === 'warning'
                      ? 'mt-0.5 h-6 w-6 shrink-0 text-amber-600'
                      : 'mt-0.5 h-6 w-6 shrink-0 text-red-600'
                }
              />
              <div className="flex-1">
                <p className="font-display text-lg text-ink">
                  {order ? `Pedido ${order.order_number}` : 'Status do pedido'}
                </p>

                {order ? (
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-ink-faint">
                        Situação registrada
                      </dt>
                      <dd className="mt-0.5 font-medium text-ink">{orderStatus?.label}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-ink-faint">Valor</dt>
                      <dd className="mt-0.5 font-medium text-ink">
                        {formatCurrency(order.total_cents)}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    Não foi possível localizar o pedido com os dados do retorno. Se o pagamento foi
                    concluído, a confirmação chegará por e-mail assim que for processada.
                  </p>
                )}
              </div>
            </div>
          </Card>
            </PaymentStatusCard>

          {status === 'sucesso' && !isConfirmed ? (
            <PaymentStatusAlert>
            <Alert tone="info" title="Confirmação em processamento" className="mt-6">
              <p>
                O acesso é liberado somente quando o pagamento é confirmado pelo Mercado Pago —
                nunca apenas pelo retorno do navegador. Isso pode levar alguns instantes (ou até
                alguns dias, no caso de boleto).
              </p>
              <p className="mt-2">
                Você receberá um e-mail assim que a confirmação chegar. Não é necessário pagar
                novamente.
              </p>
            </Alert>
            </PaymentStatusAlert>
          ) : null}

          {isConfirmed ? (
            <PaymentStatusAlert>
            <Alert tone="success" title="Pagamento confirmado" className="mt-6">
              O pagamento foi confirmado e o acesso ao material será enviado ao e-mail informado na
              compra.
            </Alert>
            </PaymentStatusAlert>
          ) : null}

          {status === 'erro' ? (
            <PaymentStatusAlert>
            <Alert tone="warning" title="Nada foi cobrado" className="mt-6">
              <span className="flex items-start gap-2">
                <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                Se você viu uma cobrança no extrato, envie o número do pedido pelos nossos canais
                para verificação.
              </span>
            </Alert>
            </PaymentStatusAlert>
          ) : null}

          <PaymentStatusActions>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/materiais">Voltar aos materiais</ButtonLink>
            {settings.contact.whatsapp ? (
              <ButtonLink
                href={whatsappLink(
                  settings.contact.whatsapp,
                  `Olá! Preciso de ajuda com o pedido ${pedido ?? ''}`.trim(),
                )}
                external
                variant="secondary"
              >
                Falar com a equipe
              </ButtonLink>
            ) : (
              <ButtonLink href="/contato" variant="secondary">
                Falar com a equipe
              </ButtonLink>
            )}
          </div>
          </PaymentStatusActions>
          </PaymentStatusMotion>
        </Container>
      </Section>
    </>
  );
}
