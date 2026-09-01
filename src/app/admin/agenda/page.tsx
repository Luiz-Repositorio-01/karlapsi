import { Alert } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { AgendaBoard, type AgendaView } from '@/components/admin/AgendaBoard';
import { requirePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { listAppointments, listBlockedTimes, listAllServices, listPatients } from '@/lib/data/admin';
import { getSiteSettings } from '@/lib/data/public';
import {
  acceptRequest,
  createBlockedTime,
  deleteBlockedTime,
  rescheduleAppointment,
  saveAppointment,
  updateAppointmentStatus,
} from '@/app/admin/_actions/appointments';

const VIEWS: AgendaView[] = ['dia', 'semana', 'mes', 'lista'];

function isView(value: string | undefined): value is AgendaView {
  return Boolean(value && VIEWS.includes(value as AgendaView));
}

/** Intervalo consultado no banco conforme a visualização escolhida. */
function resolveRange(view: AgendaView, reference: string) {
  const [year = '1970', month = '01', day = '01'] = reference.split('-');
  const base = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  if (view === 'dia') {
    const from = new Date(base);
    from.setUTCDate(from.getUTCDate() - 1);
    const to = new Date(base);
    to.setUTCDate(to.getUTCDate() + 2);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  if (view === 'semana') {
    const from = new Date(base);
    from.setUTCDate(from.getUTCDate() - base.getUTCDay() - 1);
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 9);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  if (view === 'mes') {
    const from = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    from.setUTCDate(from.getUTCDate() - 7);
    const to = new Date(Date.UTC(Number(year), Number(month), 1));
    to.setUTCDate(to.getUTCDate() + 14);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  // Lista: janela ampla em torno de hoje.
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 14);
  const to = new Date();
  to.setUTCDate(to.getUTCDate() + 120);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ visao?: string; data?: string; status?: string }>;
}) {
  const session = await requirePermission('agenda:view', '/admin/agenda');
  const params = await searchParams;

  const view: AgendaView = isView(params.visao) ? params.visao : 'semana';
  const reference = /^\d{4}-\d{2}-\d{2}$/.test(params.data ?? '')
    ? params.data!
    : new Date().toISOString().slice(0, 10);

  const range = resolveRange(view, reference);
  const statusFilter = params.status ? params.status.split(',') : undefined;

  const [appointmentsResult, blocksResult, servicesResult, patientsResult, settings] =
    await Promise.all([
      listAppointments({ ...range, status: statusFilter }),
      listBlockedTimes(range),
      listAllServices(),
      listPatients({ orderBy: 'name', limit: 500 }),
      getSiteSettings(),
    ]);

  const canManage = can(session.profile.role, 'agenda:manage');
  const canSeeFinance = can(session.profile.role, 'finance:view');

  return (
    <>
      <AdminPageHeader
        title="Agenda"
        description="Visualize por dia, semana, mês ou lista. A prevenção de conflito de horário é aplicada pelo banco de dados, não apenas por esta tela."
        badge={statusFilter ? 'filtro ativo' : undefined}
      />

      {appointmentsResult.error ? (
        <Alert tone="warning" title="Não foi possível carregar a agenda" className="mb-5">
          Verifique se as migrations foram aplicadas no Supabase.
        </Alert>
      ) : null}

      <AgendaBoard
        view={view}
        referenceDate={reference}
        appointments={appointmentsResult.data}
        blockedTimes={blocksResult.data}
        services={servicesResult.data.filter((service) => service.is_active)}
        patients={patientsResult.data.map((patient) => ({
          id: patient.id,
          full_name: patient.full_name,
        }))}
        timezone={settings.booking.timezone}
        canManage={canManage}
        canSeeFinance={canSeeFinance}
        actions={{
          saveAppointment,
          updateStatus: updateAppointmentStatus,
          reschedule: rescheduleAppointment,
          createBlock: createBlockedTime,
          deleteBlock: deleteBlockedTime,
          acceptRequest,
        }}
      />
    </>
  );
}
