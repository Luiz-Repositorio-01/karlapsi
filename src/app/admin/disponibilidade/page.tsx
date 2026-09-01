import { CalendarOff, Clock } from 'lucide-react';
import { Alert, Badge, Card, EmptyState, FormField, fieldAria, inputClasses } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { ActionButton, ActionForm } from '@/components/admin/forms';
import { requirePermission } from '@/lib/auth/session';
import { listAvailabilityExceptions, listAvailabilityRules } from '@/lib/data/admin';
import { getSiteSettings } from '@/lib/data/public';
import {
  deleteAvailabilityException,
  deleteAvailabilityRule,
  saveAvailabilityException,
  saveAvailabilityRule,
} from '@/app/admin/_actions/catalog';
import { WEEKDAY_NAMES, formatDate } from '@/lib/utils/format';

export default async function DisponibilidadePage() {
  await requirePermission('availability:manage', '/admin/disponibilidade');

  const [rulesResult, exceptionsResult, settings] = await Promise.all([
    listAvailabilityRules(),
    listAvailabilityExceptions(),
    getSiteSettings(),
  ]);

  const byWeekday = WEEKDAY_NAMES.map((name, weekday) => ({
    weekday,
    name,
    rules: rulesResult.data.filter((rule) => rule.weekday === weekday),
  }));

  return (
    <>
      <AdminPageHeader
        title="Disponibilidade"
        description="Grade semanal de atendimento e exceções (feriados, férias, bloqueios de dia inteiro e horários especiais). O site público só oferece horários que caibam nesta grade."
      />

      <Alert tone="info" className="mb-6">
        Fuso do consultório: <strong>{settings.booking.timezone}</strong> · antecedência mínima de{' '}
        {settings.booking.min_lead_hours}h · agendamento liberado para até{' '}
        {settings.booking.max_advance_days} dias. Esses valores são ajustados em Configurações.
      </Alert>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        {/* ------------------------------------------------------ grade semanal */}
        <section aria-labelledby="grade-title">
          <h2 id="grade-title" className="mb-4 font-display text-lg text-ink">
            Grade semanal
          </h2>

          <ul className="space-y-3">
            {byWeekday.map((day) => (
              <li key={day.weekday}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-ink">{day.name}</p>
                    {day.rules.length === 0 ? (
                      <Badge>Sem atendimento</Badge>
                    ) : (
                      <Badge tone="success">
                        {day.rules.length} {day.rules.length === 1 ? 'faixa' : 'faixas'}
                      </Badge>
                    )}
                  </div>

                  {day.rules.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {day.rules.map((rule) => (
                        <li
                          key={rule.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-muted px-3 py-2.5"
                        >
                          <span className="flex items-center gap-2 text-sm text-ink-soft">
                            <Clock aria-hidden="true" className="h-3.5 w-3.5 text-petrol-500" />
                            {rule.start_time.slice(0, 5)} – {rule.end_time.slice(0, 5)}
                            <span className="text-xs text-ink-faint">
                              (intervalos de {rule.slot_interval_minutes} min
                              {rule.break_start_time
                                ? `, pausa ${rule.break_start_time.slice(0, 5)}–${rule.break_end_time?.slice(0, 5)}`
                                : ''}
                              )
                            </span>
                            {!rule.is_active ? <Badge tone="danger">Inativa</Badge> : null}
                          </span>

                          <ActionButton
                            action={deleteAvailabilityRule}
                            label="Remover"
                            variant="ghost"
                            fields={{ ruleId: rule.id }}
                            confirm={{
                              title: 'Remover faixa de horário?',
                              description:
                                'Os horários desta faixa deixam de ser oferecidos no site. Atendimentos já marcados não são afetados.',
                              confirmLabel: 'Remover',
                              danger: true,
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------------------------------- formulários */}
        <aside className="space-y-6">
          <Card>
            <h2 className="font-display text-base text-ink">Adicionar faixa de horário</h2>
            <ActionForm
              action={saveAvailabilityRule.bind(null, null)}
              submitLabel="Adicionar"
              pendingLabel="Salvando…"
              className="mt-4"
            >
              <div className="grid gap-4">
                  <FormField label="Dia da semana" htmlFor="regra-dia" required>
                    <select
                      {...fieldAria('regra-dia', {})}
                      name="weekday"
                      className={inputClasses}
                      required
                    >
                      {WEEKDAY_NAMES.map((name, index) => (
                        <option key={name} value={index}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Início" htmlFor="regra-inicio" required>
                      <input
                        {...fieldAria('regra-inicio', {})}
                        type="time"
                        name="startTime"
                        defaultValue="09:00"
                        className={inputClasses}
                        required
                      />
                    </FormField>
                    <FormField
                      label="Fim"
                      htmlFor="regra-fim"
                      required
                    >
                      <input
                        {...fieldAria('regra-fim', {})}
                        type="time"
                        name="endTime"
                        defaultValue="18:00"
                        className={inputClasses}
                        required
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="Intervalo entre horários (min)"
                    htmlFor="regra-intervalo"
                    required
                    hint="Define de quanto em quanto tempo os horários são oferecidos"
                  >
                    <input
                      {...fieldAria('regra-intervalo', { hint: true })}
                      type="number"
                      name="slotIntervalMinutes"
                      min={5}
                      max={240}
                      step={5}
                      defaultValue={settings.booking.default_slot_interval_minutes}
                      className={inputClasses}
                      required
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Pausa — início" htmlFor="regra-pausa-inicio">
                      <input
                        {...fieldAria('regra-pausa-inicio', {})}
                        type="time"
                        name="breakStartTime"
                        defaultValue="12:00"
                        className={inputClasses}
                      />
                    </FormField>
                    <FormField
                      label="Pausa — fim"
                      htmlFor="regra-pausa-fim"
                    >
                      <input
                        {...fieldAria('regra-pausa-fim', {})}
                        type="time"
                        name="breakEndTime"
                        defaultValue="13:00"
                        className={inputClasses}
                      />
                    </FormField>
                  </div>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface-muted p-3 text-sm text-ink-soft">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked
                      className="h-4 w-4 accent-petrol-700"
                    />
                    Faixa ativa
                  </label>
                </div>
            </ActionForm>
          </Card>

          <Card>
            <h2 className="font-display text-base text-ink">Exceções</h2>
            <p className="mt-1.5 text-sm text-ink-muted">
              Feriado, férias ou dia com horário diferente do habitual.
            </p>

            <ActionForm
              action={saveAvailabilityException}
              submitLabel="Registrar exceção"
              pendingLabel="Salvando…"
              className="mt-4"
            >
              <div className="grid gap-4">
                  <FormField label="Data" htmlFor="excecao-data" required>
                    <input
                      {...fieldAria('excecao-data', {})}
                      type="date"
                      name="exceptionDate"
                      className={inputClasses}
                      required
                    />
                  </FormField>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-surface-muted p-3 text-sm text-ink-soft">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      className="mt-0.5 h-4 w-4 accent-petrol-700"
                    />
                    <span>
                      Atender neste dia com horário especial
                      <span className="mt-0.5 block text-xs text-ink-faint">
                        Sem marcar, o dia fica totalmente bloqueado.
                      </span>
                    </span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      label="Início"
                      htmlFor="excecao-inicio"
                    >
                      <input
                        {...fieldAria('excecao-inicio', {})}
                        type="time"
                        name="startTime"
                        className={inputClasses}
                      />
                    </FormField>
                    <FormField label="Fim" htmlFor="excecao-fim">
                      <input
                        {...fieldAria('excecao-fim', {})}
                        type="time"
                        name="endTime"
                        className={inputClasses}
                      />
                    </FormField>
                  </div>

                  <FormField label="Motivo" htmlFor="excecao-motivo">
                    <input
                      {...fieldAria('excecao-motivo', {})}
                      type="text"
                      name="reason"
                      placeholder="Feriado, férias, congresso…"
                      className={inputClasses}
                    />
                  </FormField>
                </div>
            </ActionForm>

            <div className="mt-6 border-t border-petrol-100 pt-5">
              <h3 className="text-sm font-medium text-ink-soft">Próximas exceções</h3>

              {exceptionsResult.data.length === 0 ? (
                <EmptyState
                  className="mt-3 py-8"
                  icon={<CalendarOff aria-hidden="true" className="h-5 w-5" />}
                  title="Nenhuma exceção registrada"
                />
              ) : (
                <ul className="mt-3 space-y-2">
                  {exceptionsResult.data.map((exception) => (
                    <li
                      key={exception.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-muted px-3 py-2.5"
                    >
                      <span className="text-sm text-ink-soft">
                        {formatDate(`${exception.exception_date}T12:00:00.000Z`, 'UTC')}
                        {exception.is_available ? (
                          <span className="ml-2 text-xs text-ink-faint">
                            {exception.start_time?.slice(0, 5)}–{exception.end_time?.slice(0, 5)}
                          </span>
                        ) : (
                          <Badge tone="danger" className="ml-2">
                            Bloqueado
                          </Badge>
                        )}
                        {exception.reason ? (
                          <span className="block text-xs text-ink-faint">{exception.reason}</span>
                        ) : null}
                      </span>

                      <ActionButton
                        action={deleteAvailabilityException}
                        label="Remover"
                        variant="ghost"
                        fields={{ exceptionId: exception.id }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
