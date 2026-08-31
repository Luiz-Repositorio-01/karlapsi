import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { Alert, Badge, ButtonLink, Card, EmptyState } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { DataTable, StatCard, StatusBadge } from '@/components/admin/ui';
import { PaymentFormModal } from '@/app/admin/financeiro/PaymentFormModal';
import { ActionButton } from '@/components/admin/forms';
import { requirePermission } from '@/lib/auth/session';
import { listOrders, listPatients, listPayments } from '@/lib/data/admin';
import { savePayment, updatePaymentStatus } from '@/app/admin/_actions/finance';
import { isMercadoPagoConfigured } from '@/lib/env';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '@/lib/utils/labels';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { Order, PaymentStatus, PaymentWithRelations } from '@/lib/types';

const STATUS_FILTERS: { value: string; label: string; statuses: PaymentStatus[] }[] = [
  { value: 'todos', label: 'Todos', statuses: [] },
  { value: 'pending', label: 'Pendentes', statuses: ['pending', 'in_process'] },
  { value: 'approved', label: 'Recebidos', statuses: ['approved', 'authorized'] },
  { value: 'cancelled', label: 'Cancelados', statuses: ['cancelled', 'rejected'] },
  { value: 'refunded', label: 'Estornados', statuses: ['refunded', 'charged_back'] },
];

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission('finance:view', '/admin/financeiro');
  const params = await searchParams;

  const activeFilter =
    STATUS_FILTERS.find((filter) => filter.value === params.status) ?? STATUS_FILTERS[0]!;

  const [paymentsResult, ordersResult, patientsResult] = await Promise.all([
    listPayments({ status: activeFilter.statuses.length > 0 ? activeFilter.statuses : undefined, limit: 200 }),
    listOrders(30),
    listPatients({ orderBy: 'name', limit: 500 }),
  ]);

  const payments = paymentsResult.data;
  const sum = (statuses: PaymentStatus[]) =>
    payments
      .filter((payment) => statuses.includes(payment.status))
      .reduce((total, payment) => total + payment.amount_cents, 0);

  const received = sum(['approved', 'authorized']);
  const pending = sum(['pending', 'in_process']);
  const refunded = sum(['refunded', 'charged_back']);
  const cancelled = sum(['cancelled', 'rejected']);

  return (
    <>
      <AdminPageHeader
        title="Financeiro"
        description="Cobranças, pagamentos e pedidos. Cobranças do Mercado Pago são conciliadas automaticamente pelo webhook e não podem ser alteradas à mão."
        actions={
          <PaymentFormModal
            action={savePayment}
            patients={patientsResult.data.map((patient) => ({
              id: patient.id,
              full_name: patient.full_name,
            }))}
            triggerLabel="Registrar cobrança"
          />
        }
      />

      {!isMercadoPagoConfigured() ? (
        <Alert tone="info" title="Mercado Pago aguardando credenciais" className="mb-6">
          A integração está implementada (checkout, retorno e webhook idempotente). Para ativá-la,
          informe <code>MERCADOPAGO_ACCESS_TOKEN</code> e <code>MERCADOPAGO_WEBHOOK_SECRET</code> nas
          variáveis de ambiente. Cobranças manuais (PIX, dinheiro, transferência) já funcionam.
        </Alert>
      ) : null}

      <section aria-label="Resumo financeiro" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Recebido"
          value={formatCurrency(received, 'R$ 0,00')}
          hint="Aprovado ou autorizado"
          tone="positive"
          icon={<Wallet aria-hidden="true" className="h-4 w-4" />}
        />
        <StatCard
          label="Pendente"
          value={formatCurrency(pending, 'R$ 0,00')}
          hint="Aguardando pagamento"
          tone={pending > 0 ? 'attention' : 'neutral'}
        />
        <StatCard label="Cancelado" value={formatCurrency(cancelled, 'R$ 0,00')} />
        <StatCard label="Estornado" value={formatCurrency(refunded, 'R$ 0,00')} />
      </section>

      <nav aria-label="Filtrar por status" className="mt-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value === 'todos' ? '/admin/financeiro' : `/admin/financeiro?status=${filter.value}`}
            aria-current={activeFilter.value === filter.value ? 'page' : undefined}
            className={
              activeFilter.value === filter.value
                ? 'rounded-full bg-petrol-700 px-4 py-2 text-sm font-medium text-white'
                : 'rounded-full bg-surface px-4 py-2 text-sm font-medium text-ink-soft ring-1 ring-petrol-200 transition-colors hover:bg-petrol-50'
            }
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="cobrancas-title" className="mt-6">
        <h2 id="cobrancas-title" className="mb-3 font-display text-lg text-ink">
          Cobranças
        </h2>

        <DataTable<PaymentWithRelations>
          items={payments}
          caption="Lista de cobranças"
          emptyState={
            <EmptyState
              icon={<Wallet aria-hidden="true" className="h-5 w-5" />}
              title="Nenhuma cobrança neste filtro"
              description="Registre uma cobrança manual ou aguarde a conciliação automática do Mercado Pago."
            />
          }
          columns={[
            {
              key: 'description',
              header: 'Descrição',
              render: (payment) => (
                <span className="flex flex-wrap items-center gap-2">
                  {payment.description}
                  {payment.provider_payment_id ? <Badge tone="info">Mercado Pago</Badge> : null}
                  {payment.is_demo ? <Badge tone="sand">DEMO</Badge> : null}
                </span>
              ),
            },
            {
              key: 'patient',
              header: 'Paciente',
              render: (payment) =>
                payment.patient ? (
                  <Link
                    href={`/admin/pacientes/${payment.patient.id}`}
                    className="text-petrol-700 hover:text-petrol-900"
                  >
                    {payment.patient.full_name}
                  </Link>
                ) : (
                  '—'
                ),
            },
            {
              key: 'amount',
              header: 'Valor',
              align: 'right',
              render: (payment) => (
                <span className="font-medium text-ink">{formatCurrency(payment.amount_cents)}</span>
              ),
            },
            {
              key: 'method',
              header: 'Método',
              render: (payment) => (payment.method ? PAYMENT_METHOD[payment.method] : '—'),
            },
            {
              key: 'due',
              header: 'Vencimento',
              render: (payment) =>
                payment.due_date
                  ? formatDate(`${payment.due_date}T12:00:00.000Z`, 'UTC')
                  : formatDate(payment.created_at),
            },
            {
              key: 'status',
              header: 'Status',
              render: (payment) => <StatusBadge {...PAYMENT_STATUS[payment.status]} />,
            },
          ]}
          actions={(payment) =>
            payment.provider_payment_id ? (
              <span className="text-xs text-ink-faint">conciliação automática</span>
            ) : (
              <>
                {payment.status === 'pending' ? (
                  <ActionButton
                    action={updatePaymentStatus}
                    label="Marcar recebido"
                    variant="primary"
                    fields={{ paymentId: payment.id, status: 'approved' }}
                  />
                ) : null}
                {payment.status !== 'cancelled' && payment.status !== 'refunded' ? (
                  <ActionButton
                    action={updatePaymentStatus}
                    label="Cancelar"
                    variant="ghost"
                    fields={{ paymentId: payment.id, status: 'cancelled' }}
                    confirm={{
                      title: 'Cancelar cobrança?',
                      confirmLabel: 'Cancelar cobrança',
                      danger: true,
                    }}
                  />
                ) : null}
              </>
            )
          }
        />
      </section>

      <section aria-labelledby="pedidos-title" className="mt-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="pedidos-title" className="font-display text-lg text-ink">
            Pedidos de materiais
          </h2>
          <ButtonLink href="/admin/produtos" variant="ghost" size="sm">
            Gerenciar produtos
          </ButtonLink>
        </div>

        <DataTable<Order>
          items={ordersResult.data}
          caption="Lista de pedidos"
          emptyState={
            <EmptyState
              title="Nenhum pedido registrado"
              description="Pedidos aparecem aqui quando alguém inicia uma compra de material digital."
            />
          }
          columns={[
            { key: 'number', header: 'Pedido', render: (order) => order.order_number },
            {
              key: 'customer',
              header: 'Cliente',
              render: (order) => (
                <span>
                  {order.customer_name}
                  <span className="block text-xs text-ink-faint">{order.customer_email}</span>
                </span>
              ),
            },
            {
              key: 'total',
              header: 'Total',
              align: 'right',
              render: (order) => formatCurrency(order.total_cents),
            },
            {
              key: 'status',
              header: 'Status',
              render: (order) => <StatusBadge {...ORDER_STATUS[order.status]} />,
            },
            {
              key: 'created',
              header: 'Data',
              render: (order) => formatDate(order.created_at),
            },
          ]}
        />
      </section>

      <Card className="mt-8 bg-surface-muted">
        <h2 className="font-display text-base text-ink">Como a conciliação funciona</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-muted">
          <li>
            O pedido nasce com status <strong>pendente</strong> antes do redirecionamento ao Mercado
            Pago.
          </li>
          <li>
            O status só muda quando o <strong>webhook</strong> recebe a notificação, valida a
            assinatura e consulta o pagamento na API do Mercado Pago.
          </li>
          <li>
            Reentrega do mesmo evento é ignorada (índice único em{' '}
            <code>payment_events</code>), então não há risco de dupla contagem.
          </li>
          <li>
            O retorno do navegador (página de sucesso) <strong>nunca</strong> confirma pagamento.
          </li>
        </ul>
      </Card>
    </>
  );
}
