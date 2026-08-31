'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Plus,
  RefreshCcw,
  UserRound,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  fieldAria,
  inputClasses,
} from '@/components/ui';
import { Modal } from '@/components/ui/interactive';
import { ActionButton, ActionForm } from '@/components/admin/forms';
import { StatusBadge } from '@/components/admin/ui';
import { cn } from '@/lib/utils/cn';
import {
  APPOINTMENT_ORIGIN,
  APPOINTMENT_STATUS,
  PAYMENT_METHOD,
} from '@/lib/utils/labels';
import {
  formatCurrency,
  formatDate,
  formatDateKeyLabel,
  formatLongDate,
  formatTime,
  WEEKDAY_SHORT_NAMES,
} from '@/lib/utils/format';
import type { ActionState } from '@/lib/actions/state';
import type {
  AppointmentStatus,
  AppointmentWithRelations,
  BlockedTime,
  Patient,
  Service,
} from '@/lib/types';

/**
 * Agenda administrativa com quatro visualizações (dia, semana, mês e lista).
 *
 * A navegação por período usa a URL (?visao=&data=), então o estado é
 * compartilhável e o servidor busca somente o intervalo necessário.
 * No mobile, dia e lista mostram cards; semana e mês têm rolagem horizontal
 * controlada — não é o desktop comprimido.
 */

export type AgendaView = 'dia' | 'semana' | 'mes' | 'lista';

interface AgendaBoardProps {
  view: AgendaView;
  referenceDate: string;
  appointments: AppointmentWithRelations[];
  blockedTimes: BlockedTime[];
  services: Service[];
  patients: Pick<Patient, 'id' | 'full_name'>[];
  timezone: string;
  canManage: boolean;
  canSeeFinance: boolean;
  /**
   * Server Actions recebidas como props. `saveAppointment` mantém o id como
   * primeiro parâmetro e é vinculado no cliente com `.bind` — funções comuns
   * não podem cruzar a fronteira servidor→cliente, apenas Server Actions.
   */
  actions: {
    saveAppointment: (
      appointmentId: string | null,
      state: ActionState,
      formData: FormData,
    ) => Promise<ActionState>;
    updateStatus: (state: ActionState, formData: FormData) => Promise<ActionState>;
    reschedule: (state: ActionState, formData: FormData) => Promise<ActionState>;
    createBlock: (state: ActionState, formData: FormData) => Promise<ActionState>;
    deleteBlock: (state: ActionState, formData: FormData) => Promise<ActionState>;
    acceptRequest: (state: ActionState, formData: FormData) => Promise<ActionState>;
  };
}

const STATUS_OPTIONS: AppointmentStatus[] = [
  'requested',
  'confirmed',
  'awaiting_payment',
  'paid',
  'completed',
  'cancelled',
  'no_show',
];

function addDays(dateKey: string, amount: number): string {
  const [year = '1970', month = '01', day = '01'] = dateKey.split('-');
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function addMonths(dateKey: string, amount: number): string {
  const [year = '1970', month = '01'] = dateKey.split('-');
  const date = new Date(Date.UTC(Number(year), Number(month) - 1 + amount, 1));
  return date.toISOString().slice(0, 10);
}

function startOfWeek(dateKey: string): string {
  const [year = '1970', month = '01', day = '01'] = dateKey.split('-');
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return addDays(dateKey, -date.getUTCDay());
}

function monthGrid(dateKey: string): string[] {
  const [year = '1970', month = '01'] = dateKey.split('-');
  const first = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  const start = addDays(first.toISOString().slice(0, 10), -first.getUTCDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function AgendaBoard(props: AgendaBoardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [editing, setEditing] = useState<AppointmentWithRelations | null>(null);
  const [creating, setCreating] = useState(searchParams.get('novo') === '1');
  const [blocking, setBlocking] = useState(false);
  const [rescheduling, setRescheduling] = useState<AppointmentWithRelations | null>(null);

  const navigate = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete('novo');
    router.push(`/admin/agenda?${params.toString()}`);
  };

  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentWithRelations[]>();
    for (const appointment of props.appointments) {
      const key = new Date(appointment.starts_at).toLocaleDateString('en-CA', {
        timeZone: props.timezone,
      });
      const list = map.get(key) ?? [];
      list.push(appointment);
      map.set(key, list);
    }
    return map;
  }, [props.appointments, props.timezone]);

  const shift = (direction: number) => {
    if (props.view === 'mes') {
      navigate({ data: addMonths(props.referenceDate, direction) });
    } else if (props.view === 'semana') {
      navigate({ data: addDays(props.referenceDate, direction * 7) });
    } else {
      navigate({ data: addDays(props.referenceDate, direction) });
    }
  };

  const periodLabel = () => {
    if (props.view === 'mes') {
      const [year = '', month = '01'] = props.referenceDate.split('-');
      const months = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
      ];
      return `${months[Number(month) - 1]} de ${year}`;
    }
    if (props.view === 'semana') {
      const start = startOfWeek(props.referenceDate);
      return `${formatDateKeyLabel(start)} — ${formatDateKeyLabel(addDays(start, 6))}`;
    }
    if (props.view === 'dia') return formatDateKeyLabel(props.referenceDate);
    return 'Próximos e recentes';
  };

  return (
    <div>
      {/* ------------------------------------------------------ barra de ações */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Visualização da agenda"
          className="flex gap-1 rounded-xl bg-surface p-1 ring-1 ring-petrol-100"
        >
          {(['dia', 'semana', 'mes', 'lista'] as AgendaView[]).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={props.view === option}
              onClick={() => navigate({ visao: option })}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors',
                props.view === option
                  ? 'bg-petrol-700 text-white'
                  : 'text-ink-soft hover:bg-petrol-50',
              )}
            >
              {option === 'mes' ? 'mês' : option}
            </button>
          ))}
        </div>

        {props.canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => setCreating(true)}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              Novo atendimento
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setBlocking(true)}>
              <Lock aria-hidden="true" className="h-4 w-4" />
              Bloquear horário
            </Button>
          </div>
        ) : null}
      </div>

      {props.view !== 'lista' ? (
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => shift(-1)}
              aria-label="Período anterior"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => shift(1)}
              aria-label="Período seguinte"
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate({ data: new Date().toISOString().slice(0, 10) })}
            >
              Hoje
            </Button>
          </div>
          <p className="font-display text-base text-ink first-letter:uppercase sm:text-lg">
            {periodLabel()}
          </p>
        </div>
      ) : null}

      {/* --------------------------------------------------------- visão dia */}
      {props.view === 'dia' ? (
        <DayColumn
          dateKey={props.referenceDate}
          appointments={byDay.get(props.referenceDate) ?? []}
          blockedTimes={props.blockedTimes}
          timezone={props.timezone}
          canManage={props.canManage}
          onSelect={setEditing}
          actions={props.actions}
        />
      ) : null}

      {/* ------------------------------------------------------ visão semana */}
      {props.view === 'semana' ? (
        <div className="scroll-subtle -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="grid min-w-[52rem] grid-cols-7 gap-3">
            {Array.from({ length: 7 }, (_, index) =>
              addDays(startOfWeek(props.referenceDate), index),
            ).map((dateKey) => {
              const dayAppointments = byDay.get(dateKey) ?? [];
              const isToday = dateKey === new Date().toISOString().slice(0, 10);

              return (
                <div key={dateKey}>
                  <button
                    type="button"
                    onClick={() => navigate({ visao: 'dia', data: dateKey })}
                    className={cn(
                      'w-full rounded-xl px-2 py-2 text-left transition-colors hover:bg-petrol-50',
                      isToday && 'bg-petrol-50',
                    )}
                  >
                    <span className="block text-[0.6875rem] uppercase tracking-wide text-ink-faint">
                      {formatDateKeyLabel(dateKey).split(',')[0]}
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold text-ink">
                      {dateKey.slice(8)}
                    </span>
                  </button>

                  <ul className="mt-2 space-y-2">
                    {dayAppointments.length === 0 ? (
                      <li className="rounded-lg border border-dashed border-petrol-100 px-2 py-3 text-center text-xs text-ink-faint">
                        livre
                      </li>
                    ) : (
                      dayAppointments.map((appointment) => (
                        <li key={appointment.id}>
                          <button
                            type="button"
                            onClick={() => setEditing(appointment)}
                            className="w-full rounded-lg bg-surface p-2 text-left ring-1 ring-petrol-100 transition-all hover:shadow-card"
                          >
                            <span className="block text-xs font-semibold text-petrol-800">
                              {formatTime(appointment.starts_at, props.timezone)}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-ink-soft">
                              {appointment.patient?.full_name ??
                                appointment.contact_name ??
                                'Sem nome'}
                            </span>
                            <span className="mt-1 block">
                              <StatusBadge {...APPOINTMENT_STATUS[appointment.status]} />
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* --------------------------------------------------------- visão mês */}
      {props.view === 'mes' ? (
        <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-petrol-100">
          <div className="grid grid-cols-7 border-b border-petrol-100 bg-surface-muted/60">
            {WEEKDAY_SHORT_NAMES.map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-center text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-faint"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {monthGrid(props.referenceDate).map((dateKey) => {
              const dayAppointments = byDay.get(dateKey) ?? [];
              const inMonth = dateKey.slice(0, 7) === props.referenceDate.slice(0, 7);
              const isToday = dateKey === new Date().toISOString().slice(0, 10);

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => navigate({ visao: 'dia', data: dateKey })}
                  className={cn(
                    'min-h-[4.5rem] border-b border-r border-petrol-50 p-1.5 text-left transition-colors hover:bg-petrol-50/60 sm:min-h-[6rem] sm:p-2',
                    !inMonth && 'bg-surface-muted/40 text-ink-faint',
                    isToday && 'bg-petrol-50/70',
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      isToday ? 'text-petrol-800' : inMonth ? 'text-ink' : 'text-ink-faint',
                    )}
                  >
                    {dateKey.slice(8)}
                  </span>

                  {dayAppointments.length > 0 ? (
                    <span className="mt-1 block space-y-1">
                      {dayAppointments.slice(0, 2).map((appointment) => (
                        <span
                          key={appointment.id}
                          className="block truncate rounded bg-petrol-700/90 px-1.5 py-0.5 text-[0.625rem] font-medium text-white"
                        >
                          {formatTime(appointment.starts_at, props.timezone)}{' '}
                          {appointment.patient?.full_name ?? appointment.contact_name ?? ''}
                        </span>
                      ))}
                      {dayAppointments.length > 2 ? (
                        <span className="block text-[0.625rem] text-ink-muted">
                          +{dayAppointments.length - 2}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------------- visão lista */}
      {props.view === 'lista' ? (
        props.appointments.length === 0 ? (
          <EmptyState
            icon={<CalendarDays aria-hidden="true" className="h-5 w-5" />}
            title="Nenhum atendimento no período"
            description="Crie um atendimento ou ajuste o período consultado."
          />
        ) : (
          <ul className="space-y-3">
            {props.appointments.map((appointment) => (
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
                        {formatDate(appointment.starts_at, props.timezone)} ·{' '}
                        {formatTime(appointment.starts_at, props.timezone)}–
                        {formatTime(appointment.ends_at, props.timezone)}
                      </p>
                      <p className="mt-1 text-xs text-ink-faint">
                        {appointment.service?.name ?? 'Serviço não informado'} ·{' '}
                        {APPOINTMENT_ORIGIN[appointment.origin]}
                        {props.canSeeFinance && appointment.price_cents !== null
                          ? ` · ${formatCurrency(appointment.price_cents)}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge {...APPOINTMENT_STATUS[appointment.status]} />
                      {appointment.patient ? (
                        <Link
                          href={`/admin/pacientes/${appointment.patient.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-petrol-700 hover:text-petrol-900"
                        >
                          <UserRound aria-hidden="true" className="h-3 w-3" />
                          Ver paciente
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  {props.canManage ? (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-petrol-50 pt-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditing(appointment)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setRescheduling(appointment)}
                      >
                        <RefreshCcw aria-hidden="true" className="h-3.5 w-3.5" />
                        Reagendar
                      </Button>
                      {appointment.status === 'requested' ? (
                        <ActionButton
                          action={props.actions.acceptRequest}
                          label="Confirmar"
                          variant="primary"
                          fields={{ appointmentId: appointment.id }}
                        />
                      ) : null}
                      {appointment.status !== 'cancelled' ? (
                        <ActionButton
                          action={props.actions.updateStatus}
                          label="Cancelar"
                          variant="ghost"
                          fields={{ appointmentId: appointment.id, status: 'cancelled' }}
                          confirm={{
                            title: 'Cancelar atendimento?',
                            description: 'O horário volta a ficar disponível na agenda pública.',
                            confirmLabel: 'Cancelar',
                            danger: true,
                          }}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {/* -------------------------------------------------------------- modais */}
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Novo atendimento"
        description="O banco recusa automaticamente qualquer horário já ocupado."
        size="lg"
      >
        <AppointmentForm
          appointment={null}
          services={props.services}
          patients={props.patients}
          defaultDate={props.referenceDate}
          canSeeFinance={props.canSeeFinance}
          action={props.actions.saveAppointment.bind(null, null)}
          onDone={() => setCreating(false)}
        />
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Editar atendimento"
        size="lg"
      >
        {editing ? (
          <AppointmentForm
            appointment={editing}
            services={props.services}
            patients={props.patients}
            defaultDate={props.referenceDate}
            canSeeFinance={props.canSeeFinance}
            action={props.actions.saveAppointment.bind(null, editing.id)}
            onDone={() => setEditing(null)}
            timezone={props.timezone}
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(rescheduling)}
        onClose={() => setRescheduling(null)}
        title="Reagendar atendimento"
        description="O horário atual é liberado e o novo é reservado na mesma transação."
      >
        {rescheduling ? (
          <ActionForm
            action={props.actions.reschedule}
            submitLabel="Reagendar"
            pendingLabel="Reagendando…"
            hiddenFields={{ appointmentId: rescheduling.id }}
            onSuccess={() => setRescheduling(null)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nova data" htmlFor="reagendar-data" required>
                <input
                  {...fieldAria('reagendar-data', {})}
                  type="date"
                  name="date"
                  defaultValue={new Date(rescheduling.starts_at).toLocaleDateString('en-CA', {
                    timeZone: props.timezone,
                  })}
                  className={inputClasses}
                  required
                />
              </FormField>
              <FormField label="Novo horário" htmlFor="reagendar-hora" required>
                <input
                  {...fieldAria('reagendar-hora', {})}
                  type="time"
                  name="startTime"
                  defaultValue={formatTime(rescheduling.starts_at, props.timezone)}
                  className={inputClasses}
                  required
                />
              </FormField>
              <FormField label="Motivo" htmlFor="reagendar-motivo" className="sm:col-span-2">
                <input
                  {...fieldAria('reagendar-motivo', {})}
                  type="text"
                  name="reason"
                  className={inputClasses}
                />
              </FormField>
            </div>
          </ActionForm>
        ) : null}
      </Modal>

      <Modal
        open={blocking}
        onClose={() => setBlocking(false)}
        title="Bloquear horário"
        description="Bloqueios removem o intervalo da agenda pública."
      >
        <ActionForm
          action={props.actions.createBlock}
          submitLabel="Bloquear"
          pendingLabel="Salvando…"
          onSuccess={() => setBlocking(false)}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Data" htmlFor="bloqueio-data" required>
              <input
                {...fieldAria('bloqueio-data', {})}
                type="date"
                name="date"
                defaultValue={props.referenceDate}
                className={inputClasses}
                required
              />
            </FormField>
            <FormField label="Início" htmlFor="bloqueio-inicio" required>
              <input
                {...fieldAria('bloqueio-inicio', {})}
                type="time"
                name="startTime"
                defaultValue="12:00"
                className={inputClasses}
                required
              />
            </FormField>
            <FormField label="Fim" htmlFor="bloqueio-fim" required>
              <input
                {...fieldAria('bloqueio-fim', {})}
                type="time"
                name="endTime"
                defaultValue="13:00"
                className={inputClasses}
                required
              />
            </FormField>
            <FormField label="Motivo" htmlFor="bloqueio-motivo" className="sm:col-span-3">
              <input
                {...fieldAria('bloqueio-motivo', {})}
                type="text"
                name="reason"
                placeholder="Supervisão, almoço, compromisso pessoal…"
                className={inputClasses}
              />
            </FormField>
          </div>
        </ActionForm>
      </Modal>
    </div>
  );
}

/** Coluna de um dia, com atendimentos e bloqueios. */
function DayColumn({
  dateKey,
  appointments,
  blockedTimes,
  timezone,
  canManage,
  onSelect,
  actions,
}: {
  dateKey: string;
  appointments: AppointmentWithRelations[];
  blockedTimes: BlockedTime[];
  timezone: string;
  canManage: boolean;
  onSelect: (appointment: AppointmentWithRelations) => void;
  actions: AgendaBoardProps['actions'];
}) {
  const dayBlocks = blockedTimes.filter(
    (block) => new Date(block.starts_at).toLocaleDateString('en-CA', { timeZone: timezone }) === dateKey,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div>
        {appointments.length === 0 ? (
          <EmptyState
            icon={<CalendarDays aria-hidden="true" className="h-5 w-5" />}
            title="Nenhum atendimento neste dia"
            description={`${formatLongDate(`${dateKey}T12:00:00.000Z`, 'UTC')} está sem agendamentos.`}
          />
        ) : (
          <ul className="space-y-3">
            {appointments.map((appointment) => (
              <li key={appointment.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex gap-4">
                      <div className="shrink-0 text-center">
                        <p className="font-display text-lg text-petrol-800">
                          {formatTime(appointment.starts_at, timezone)}
                        </p>
                        <p className="text-xs text-ink-faint">
                          {formatTime(appointment.ends_at, timezone)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-ink">
                          {appointment.patient?.full_name ??
                            appointment.contact_name ??
                            'Sem identificação'}
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                          {appointment.service?.name ?? 'Serviço não informado'}
                        </p>
                        {appointment.contact_phone ? (
                          <p className="mt-1 text-xs text-ink-faint">{appointment.contact_phone}</p>
                        ) : null}
                        {appointment.admin_notes ? (
                          <p className="mt-2 rounded-lg bg-surface-muted px-3 py-2 text-xs leading-relaxed text-ink-soft">
                            {appointment.admin_notes}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <StatusBadge {...APPOINTMENT_STATUS[appointment.status]} />
                  </div>

                  {canManage ? (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-petrol-50 pt-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onSelect(appointment)}
                      >
                        Editar
                      </Button>
                      {appointment.status === 'requested' ? (
                        <ActionButton
                          action={actions.acceptRequest}
                          label="Confirmar"
                          variant="primary"
                          fields={{ appointmentId: appointment.id }}
                        />
                      ) : null}
                      {appointment.status === 'confirmed' ? (
                        <ActionButton
                          action={actions.updateStatus}
                          label="Marcar realizado"
                          fields={{ appointmentId: appointment.id, status: 'completed' }}
                        />
                      ) : null}
                      {appointment.status !== 'no_show' && appointment.status !== 'cancelled' ? (
                        <ActionButton
                          action={actions.updateStatus}
                          label="Não compareceu"
                          variant="ghost"
                          fields={{ appointmentId: appointment.id, status: 'no_show' }}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside>
        <h2 className="font-display text-base text-ink">Bloqueios do dia</h2>
        {dayBlocks.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-petrol-100 px-4 py-6 text-center text-xs text-ink-faint">
            Nenhum bloqueio
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {dayBlocks.map((block) => (
              <li key={block.id}>
                <Card className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                        <Clock aria-hidden="true" className="h-3.5 w-3.5 text-petrol-500" />
                        {formatTime(block.starts_at, timezone)}–{formatTime(block.ends_at, timezone)}
                      </p>
                      {block.reason ? (
                        <p className="mt-1 text-xs text-ink-muted">{block.reason}</p>
                      ) : null}
                    </div>
                    {canManage ? (
                      <ActionButton
                        action={actions.deleteBlock}
                        label="Remover"
                        variant="ghost"
                        fields={{ blockedTimeId: block.id }}
                      />
                    ) : null}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

/** Formulário de atendimento (criação e edição). */
function AppointmentForm({
  appointment,
  services,
  patients,
  defaultDate,
  canSeeFinance,
  action,
  onDone,
  timezone = 'America/Sao_Paulo',
}: {
  appointment: AppointmentWithRelations | null;
  services: Service[];
  patients: Pick<Patient, 'id' | 'full_name'>[];
  defaultDate: string;
  canSeeFinance: boolean;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  onDone: () => void;
  timezone?: string;
}) {
  const initialDate = appointment
    ? new Date(appointment.starts_at).toLocaleDateString('en-CA', { timeZone: timezone })
    : defaultDate;

  return (
    <ActionForm
      action={action}
      submitLabel={appointment ? 'Salvar alterações' : 'Criar atendimento'}
      pendingLabel="Salvando…"
      onSuccess={onDone}
    >
      {(state) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Paciente" htmlFor="atendimento-paciente" hint="Opcional para bloqueios internos">
            <select
              {...fieldAria('atendimento-paciente', { hint: true })}
              name="patientId"
              defaultValue={appointment?.patient_id ?? ''}
              className={inputClasses}
            >
              <option value="">Sem paciente vinculado</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Serviço" htmlFor="atendimento-servico">
            <select
              {...fieldAria('atendimento-servico', {})}
              name="serviceId"
              defaultValue={appointment?.service_id ?? ''}
              className={inputClasses}
            >
              <option value="">Sem serviço</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.duration_minutes} min)
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Data" htmlFor="atendimento-data" required error={state.fields?.date}>
            <input
              {...fieldAria('atendimento-data', { error: Boolean(state.fields?.date) })}
              type="date"
              name="date"
              defaultValue={initialDate}
              className={inputClasses}
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Início" htmlFor="atendimento-inicio" required>
              <input
                {...fieldAria('atendimento-inicio', {})}
                type="time"
                name="startTime"
                defaultValue={appointment ? formatTime(appointment.starts_at, timezone) : '09:00'}
                className={inputClasses}
                required
              />
            </FormField>
            <FormField
              label="Fim"
              htmlFor="atendimento-fim"
              required
              error={state.fields?.endTime}
            >
              <input
                {...fieldAria('atendimento-fim', { error: Boolean(state.fields?.endTime) })}
                type="time"
                name="endTime"
                defaultValue={appointment ? formatTime(appointment.ends_at, timezone) : '10:00'}
                className={inputClasses}
                required
              />
            </FormField>
          </div>

          <FormField label="Status" htmlFor="atendimento-status" required>
            <select
              {...fieldAria('atendimento-status', {})}
              name="status"
              defaultValue={appointment?.status ?? 'confirmed'}
              className={inputClasses}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {APPOINTMENT_STATUS[status].label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Origem" htmlFor="atendimento-origem" required>
            <select
              {...fieldAria('atendimento-origem', {})}
              name="origin"
              defaultValue={appointment?.origin ?? 'admin'}
              className={inputClasses}
            >
              {Object.entries(APPOINTMENT_ORIGIN).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>

          {canSeeFinance ? (
            <>
              <FormField label="Valor (centavos)" htmlFor="atendimento-valor" hint="Ex.: 35000 = R$ 350,00">
                <input
                  {...fieldAria('atendimento-valor', { hint: true })}
                  type="number"
                  name="priceCents"
                  min={0}
                  step={100}
                  defaultValue={appointment?.price_cents ?? ''}
                  className={inputClasses}
                />
              </FormField>

              <FormField label="Forma de pagamento" htmlFor="atendimento-pagamento">
                <select
                  {...fieldAria('atendimento-pagamento', {})}
                  name="paymentMethod"
                  defaultValue={appointment?.payment_method ?? ''}
                  className={inputClasses}
                >
                  <option value="">Não definida</option>
                  {Object.entries(PAYMENT_METHOD).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
            </>
          ) : null}

          <fieldset className="sm:col-span-2">
            <legend className="mb-3 text-sm font-medium text-ink-soft">
              Contato (quando não há paciente cadastrado)
            </legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Nome" htmlFor="atendimento-contato-nome">
                <input
                  {...fieldAria('atendimento-contato-nome', {})}
                  type="text"
                  name="contactName"
                  defaultValue={appointment?.contact_name ?? ''}
                  className={inputClasses}
                />
              </FormField>
              <FormField label="E-mail" htmlFor="atendimento-contato-email">
                <input
                  {...fieldAria('atendimento-contato-email', {})}
                  type="email"
                  name="contactEmail"
                  defaultValue={appointment?.contact_email ?? ''}
                  className={inputClasses}
                />
              </FormField>
              <FormField label="Telefone" htmlFor="atendimento-contato-telefone">
                <input
                  {...fieldAria('atendimento-contato-telefone', {})}
                  type="tel"
                  name="contactPhone"
                  defaultValue={appointment?.contact_phone ?? ''}
                  className={inputClasses}
                />
              </FormField>
            </div>
          </fieldset>

          <FormField
            label="Observações administrativas"
            htmlFor="atendimento-observacoes"
            hint="Uso interno. Não registre conteúdo clínico aqui."
            className="sm:col-span-2"
          >
            <textarea
              {...fieldAria('atendimento-observacoes', { hint: true })}
              name="adminNotes"
              rows={3}
              defaultValue={appointment?.admin_notes ?? ''}
              className={cn(inputClasses, 'resize-y')}
            />
          </FormField>

          {appointment?.origin === 'public_site' ? (
            <p className="sm:col-span-2">
              <Badge tone="sand">Solicitação recebida pelo site</Badge>
            </p>
          ) : null}
        </div>
      )}
    </ActionForm>
  );
}
