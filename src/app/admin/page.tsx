import Link from 'next/link';
import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  FileText,
  Users,
  Wallet,
} from 'lucide-react';
import { Alert, Badge, ButtonLink, Card, EmptyState } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { StatCard, StatusBadge } from '@/components/admin/ui';
import { ActionButton } from '@/components/admin/forms';
import { requirePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import {
  getDashboardMetrics,
  listPendingRequests,
  listUpcomingAppointments,
} from '@/lib/data/admin';
import { getSiteSettings } from '@/lib/data/public';
import { acceptRequest, updateAppointmentStatus } from '@/app/admin/_actions/appointments';
import { APPOINTMENT_ORIGIN, APPOINTMENT_STATUS } from '@/lib/utils/labels';
import { formatCurrency, formatDateTime, formatDuration } from '@/lib/utils/format';
import { integrationStatus } from '@/lib/env';

export default async function AdminDashboard() {
  const session = await requirePermission('dashboard:view');
  const showClinical = can(session.profile.role, 'agenda:view');
  const showFinance = can(session.profile.role, 'finance:view');

  const [metricsResult, upcomingResult, pendingResult, settings] = await Promise.all([
    getDashboardMetrics(),
    showClinical ? listUpcomingAppointments(6) : Promise.resolve({ data: [] }),
    showClinical ? listPendingRequests(6) : Promise.resolve({ data: [] }),
    getSiteSettings(),
  ]);

  const metrics = metricsResult.data;
  const timezone = settings.booking.timezone;
  const pendingIntegrations = integrationStatus().filter(
    (item) => item.required && !item.configured,
  );

  return (
    <>
      <AdminPageHeader
        title={`Olá, ${session.profile.full_name.split(' ')[0] || 'bem-vinda'}`}
        description={
          showClinical
            ? 'Visão geral do dia: atendimentos, solicitações pendentes e indicadores da operação.'
            : 'Visão técnica do site: conteúdo, configurações e integrações — sem dados clínicos ou financeiros.'
        }
        actions={
          showClinical ? (
            <>
              <ButtonLink href="/admin/agenda?novo=1" size="sm">
                Novo atendimento
              </ButtonLink>
              <ButtonLink href="/admin/pacientes?novo=1" variant="secondary" size="sm">
                Novo paciente
              </ButtonLink>
            </>
          ) : (
            <>
              <ButtonLink href="/admin/blog" size="sm">
                Conteúdo
              </ButtonLink>
              <ButtonLink href="/admin/configuracoes" variant="secondary" size="sm">
                Configurações
              </ButtonLink>
            </>
          )
        }
      />

      {metricsResult.error ? (
        <Alert tone="warning" title="Não foi possível carregar os indicadores" className="mb-6">
          Verifique se as migrations do banco foram aplicadas. Detalhe técnico registrado no log do
          servidor.
        </Alert>
      ) : null}

      {pendingIntegrations.length > 0 ? (
        <Alert tone="info" title="Integrações pendentes" className="mb-6">
          {pendingIntegrations.map((item) => item.label).join(' · ')} — configure as variáveis de
          ambiente indicadas em <Link href="/admin/configuracoes">Configurações</Link>.
        </Alert>
      ) : null}

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {showClinical ? (
          <>
            <StatCard
              label="Atendimentos hoje"
              value={metrics?.appointments_today ?? 0}
              hint="Confirmados, pagos ou realizados"
              href="/admin/agenda"
              icon={<CalendarDays aria-hidden="true" className="h-4 w-4" />}
            />
            <StatCard
              label="Próximos atendimentos"
              value={metrics?.upcoming_appointments ?? 0}
              hint="A partir de agora"
              href="/admin/agenda?visao=lista"
              icon={<CalendarClock aria-hidden="true" className="h-4 w-4" />}
            />
            <StatCard
              label="Solicitações pendentes"
              value={metrics?.pending_requests ?? 0}
              hint="Aguardando confirmação"
              tone={(metrics?.pending_requests ?? 0) > 0 ? 'attention' : 'neutral'}
              href="/admin/agenda?status=requested"
              icon={<AlertCircle aria-hidden="true" className="h-4 w-4" />}
            />
            <StatCard
              label="Pacientes ativos"
              value={metrics?.active_patients ?? 0}
              hint="Cadastros não arquivados"
              href="/admin/pacientes"
              icon={<Users aria-hidden="true" className="h-4 w-4" />}
            />
          </>
        ) : (
          <>
            <StatCard
              label="Conteúdos publicados"
              value={metrics?.published_posts ?? 0}
              hint="Artigos no ar"
              href="/admin/blog"
              icon={<FileText aria-hidden="true" className="h-4 w-4" />}
            />
            <StatCard
              label="Notificações não lidas"
              value={metrics?.unread_notifications ?? 0}
              hint="Avisos internos"
              href="/admin/notificacoes"
            />
            <StatCard
              label="Integrações pendentes"
              value={pendingIntegrations.length}
              hint="Variáveis de ambiente"
              tone={pendingIntegrations.length > 0 ? 'attention' : 'neutral'}
              href="/admin/configuracoes"
              icon={<AlertCircle aria-hidden="true" className="h-4 w-4" />}
            />
            <StatCard
              label="Site"
              value="Online"
              hint={settings.identity.brand_name}
              href="/"
              icon={<CheckCircle2 aria-hidden="true" className="h-4 w-4" />}
            />
          </>
        )}
      </section>

      {showFinance ? (
        <section aria-label="Financeiro" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Recebido no mês"
            value={formatCurrency(metrics?.revenue_month_cents ?? 0, 'R$ 0,00')}
            hint="Pagamentos aprovados"
            tone="positive"
            href="/admin/financeiro?status=approved"
            icon={<Wallet aria-hidden="true" className="h-4 w-4" />}
          />
          <StatCard
            label="A receber"
            value={formatCurrency(metrics?.pending_payments_cents ?? 0, 'R$ 0,00')}
            hint="Cobranças pendentes ou em análise"
            tone={(metrics?.pending_payments_cents ?? 0) > 0 ? 'attention' : 'neutral'}
            href="/admin/financeiro?status=pending"
          />
          <StatCard
            label="Conteúdos publicados"
            value={metrics?.published_posts ?? 0}
            hint="Artigos no ar"
            href="/admin/blog"
            icon={<FileText aria-hidden="true" className="h-4 w-4" />}
          />
          <StatCard
            label="Notificações não lidas"
            value={metrics?.unread_notifications ?? 0}
            hint="Avisos internos"
            href="/admin/notificacoes"
          />
        </section>
      ) : null}

      {showClinical ? (
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {/* ------------------------------------------ solicitações pendentes */}
        <section aria-labelledby="solicitacoes-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="solicitacoes-title" className="font-display text-lg text-ink">
              Solicitações aguardando confirmação
            </h2>
            {pendingResult.data.length > 0 ? (
              <Badge tone="warning">{pendingResult.data.length}</Badge>
            ) : null}
          </div>

          {pendingResult.data.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 aria-hidden="true" className="h-5 w-5" />}
              title="Nenhuma solicitação pendente"
              description="Novas solicitações do site aparecem aqui para confirmação."
            />
          ) : (
            <ul className="space-y-3">
              {pendingResult.data.map((appointment) => (
                <li key={appointment.id}>
                  <Card className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">
                          {appointment.patient?.full_name ??
                            appointment.contact_name ??
                            'Sem identificação'}
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                          {appointment.service?.name ?? 'Serviço não informado'} ·{' '}
                          {formatDateTime(appointment.starts_at, timezone)}
                        </p>
                        <p className="mt-1 text-xs text-ink-faint">
                          Origem: {APPOINTMENT_ORIGIN[appointment.origin]}
                          {appointment.contact_phone ? ` · ${appointment.contact_phone}` : ''}
                        </p>
                      </div>
                      <StatusBadge {...APPOINTMENT_STATUS[appointment.status]} />
                    </div>

                    {can(session.profile.role, 'agenda:manage') ? (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-petrol-50 pt-3">
                        <ActionButton
                          action={acceptRequest}
                          label="Confirmar"
                          variant="primary"
                          fields={{ appointmentId: appointment.id }}
                        />
                        <ActionButton
                          action={updateAppointmentStatus}
                          label="Cancelar"
                          variant="ghost"
                          fields={{ appointmentId: appointment.id, status: 'cancelled' }}
                          confirm={{
                            title: 'Cancelar solicitação?',
                            description:
                              'O horário volta a ficar disponível no site e o solicitante é notificado.',
                            confirmLabel: 'Cancelar solicitação',
                            danger: true,
                          }}
                        />
                        <ButtonLink
                          href={`/admin/agenda?visao=dia&data=${appointment.starts_at.slice(0, 10)}`}
                          variant="ghost"
                          size="sm"
                        >
                          Ver no dia
                        </ButtonLink>
                      </div>
                    ) : null}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* --------------------------------------------- próximos atendimentos */}
        <section aria-labelledby="proximos-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="proximos-title" className="font-display text-lg text-ink">
              Próximos atendimentos
            </h2>
            <ButtonLink href="/admin/agenda" variant="ghost" size="sm">
              Ver agenda
            </ButtonLink>
          </div>

          {upcomingResult.data.length === 0 ? (
            <EmptyState
              icon={<CalendarDays aria-hidden="true" className="h-5 w-5" />}
              title="Agenda livre"
              description="Nenhum atendimento confirmado a partir de agora."
              action={
                <ButtonLink href="/admin/agenda?novo=1" size="sm">
                  Criar atendimento
                </ButtonLink>
              }
            />
          ) : (
            <ul className="space-y-3">
              {upcomingResult.data.map((appointment) => {
                const duration = Math.round(
                  (new Date(appointment.ends_at).getTime() -
                    new Date(appointment.starts_at).getTime()) /
                    60000,
                );

                return (
                  <li key={appointment.id}>
                    <Card className="flex flex-wrap items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">
                          {appointment.patient?.full_name ??
                            appointment.contact_name ??
                            'Sem identificação'}
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                          {formatDateTime(appointment.starts_at, timezone)} ·{' '}
                          {formatDuration(duration)}
                        </p>
                        <p className="mt-1 text-xs text-ink-faint">
                          {appointment.service?.name ?? 'Serviço não informado'}
                        </p>
                      </div>
                      <StatusBadge {...APPOINTMENT_STATUS[appointment.status]} />
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
      ) : null}
    </>
  );
}
