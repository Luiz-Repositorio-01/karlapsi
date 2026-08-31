'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  FormField,
  Skeleton,
  fieldAria,
  inputClasses,
} from '@/components/ui';
import { SubmitButton, useToast } from '@/components/ui/interactive';
import { cn } from '@/lib/utils/cn';
import {
  formatCurrency,
  formatDateKeyLabel,
  formatDuration,
  formatLongDate,
  formatTime,
} from '@/lib/utils/format';
import type { DayAvailability } from '@/lib/domain/availability';
import type { Service } from '@/lib/types';

/**
 * Fluxo de agendamento em 4 passos: serviço → data/hora → dados → confirmação.
 *
 * Os horários vêm de /api/availability (que já exclui horários ocupados) e são
 * recarregados a cada troca de serviço/semana. Se o horário for reservado por
 * outra pessoa no meio do caminho, o banco recusa e a lista é atualizada
 * automaticamente — a UI nunca "promete" um horário que não existe mais.
 */

interface ConfirmationData {
  startsAt: string;
  endsAt: string;
  serviceName: string;
  durationMinutes: number;
}

const STEPS = ['Serviço', 'Data e horário', 'Seus dados', 'Confirmação'] as const;

export function BookingWizard({
  services,
  initialServiceSlug,
  showPrices,
  minLeadHours,
  consentVersion,
  bookingEnabled,
}: {
  services: Service[];
  initialServiceSlug?: string;
  showPrices: boolean;
  minLeadHours: number;
  consentVersion: string;
  bookingEnabled: boolean;
}) {
  const { notify } = useToast();
  const formId = useId();

  const [step, setStep] = useState(0);
  const [serviceSlug, setServiceSlug] = useState(
    initialServiceSlug && services.some((service) => service.slug === initialServiceSlug)
      ? initialServiceSlug
      : (services[0]?.slug ?? ''),
  );
  const [weekOffset, setWeekOffset] = useState(0);
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    isForDependent: false,
    dependentName: '',
    birthDate: '',
    message: '',
    consentAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationData | null>(null);

  const service = useMemo(
    () => services.find((item) => item.slug === serviceSlug) ?? null,
    [services, serviceSlug],
  );

  const loadAvailability = useCallback(
    async (slug: string, offset: number) => {
      if (!slug) return;
      setLoadingSlots(true);
      setSlotsError(null);

      try {
        const from = new Date();
        from.setDate(from.getDate() + offset * 7);
        const fromKey = from.toISOString().slice(0, 10);

        const response = await fetch(
          `/api/availability?servico=${encodeURIComponent(slug)}&de=${fromKey}&dias=7`,
          { headers: { Accept: 'application/json' } },
        );
        const json = (await response.json()) as {
          ok: boolean;
          days?: DayAvailability[];
          timezone?: string;
          message?: string;
        };

        if (!response.ok || !json.ok) {
          setDays([]);
          setSlotsError(json.message ?? 'Não foi possível carregar os horários.');
          return;
        }

        setDays(json.days ?? []);
        if (json.timezone) setTimezone(json.timezone);
      } catch {
        setDays([]);
        setSlotsError('Não foi possível carregar os horários. Verifique sua conexão.');
      } finally {
        setLoadingSlots(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (step === 1) void loadAvailability(serviceSlug, weekOffset);
  }, [step, serviceSlug, weekOffset, loadAvailability]);

  useEffect(() => {
    // Trocar de serviço invalida a escolha anterior de horário.
    setSelectedSlot(null);
    setSelectedDate(null);
  }, [serviceSlug]);

  const daysWithSlots = days.filter((day) => day.slots.length > 0);
  const activeDay =
    days.find((day) => day.date === selectedDate) ?? daysWithSlots[0] ?? days[0] ?? null;

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  };

  const validateDetails = (): boolean => {
    const next: Record<string, string> = {};
    if (form.fullName.trim().length < 3) next.fullName = 'Informe o nome completo';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) next.email = 'Informe um e-mail válido';
    if (form.phone.replace(/\D/g, '').length < 10) next.phone = 'Informe o telefone com DDD';
    if (form.isForDependent && form.dependentName.trim().length < 3) {
      next.dependentName = 'Informe o nome de quem será atendido';
    }
    if (!form.consentAccepted) {
      next.consentAccepted = 'É necessário aceitar a política de privacidade';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!service || !selectedSlot) {
      notify('Selecione um horário disponível.', 'error');
      setStep(1);
      return;
    }
    if (!validateDetails()) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/appointments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          startsAt: selectedSlot,
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone,
          birthDate: form.birthDate || undefined,
          isForDependent: form.isForDependent,
          dependentName: form.isForDependent ? form.dependentName.trim() : undefined,
          message: form.message.trim() || undefined,
          consentAccepted: true,
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        message?: string;
        error?: string;
        fields?: Record<string, string>;
        request?: ConfirmationData;
      };

      if (!response.ok || !json.ok) {
        if (json.fields) setErrors(json.fields);

        if (json.error === 'SLOT_TAKEN') {
          notify(json.message ?? 'Este horário acabou de ser reservado.', 'error');
          setSelectedSlot(null);
          setStep(1);
          await loadAvailability(serviceSlug, weekOffset);
          return;
        }

        notify(json.message ?? 'Não foi possível registrar a solicitação.', 'error');
        return;
      }

      setConfirmation(json.request ?? null);
      setStep(3);
      notify('Solicitação enviada com sucesso.', 'success');
    } catch {
      notify('Falha de conexão. Tente novamente.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!bookingEnabled) {
    return (
      <Alert tone="warning" title="Agendamento online temporariamente indisponível">
        Nenhum serviço está liberado para agendamento online neste momento. Fale com a equipe pelo
        WhatsApp ou pelo formulário de contato para marcar um horário.
      </Alert>
    );
  }

  const consentLabelId = `${formId}-consent`;

  return (
    <div>
      {/* -------------------------------------------------------- indicador */}
      <ol
        aria-label="Etapas do agendamento"
        className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm"
      >
        {STEPS.map((label, index) => {
          const state = index === step ? 'current' : index < step ? 'done' : 'todo';
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                aria-current={state === 'current' ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 font-medium transition-colors',
                  state === 'current' && 'bg-petrol-700 text-white',
                  state === 'done' && 'bg-petrol-50 text-petrol-700',
                  state === 'todo' && 'text-ink-faint',
                )}
              >
                {state === 'done' ? (
                  <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
                ) : (
                  <span aria-hidden="true" className="text-xs">
                    {index + 1}
                  </span>
                )}
                {label}
              </span>
              {index < STEPS.length - 1 ? (
                <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-ink-faint" />
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* ---------------------------------------------------- passo 1: serviço */}
      {step === 0 ? (
        <div>
          <fieldset>
            <legend className="font-display text-xl text-ink">
              O que você gostaria de agendar?
            </legend>
            <p className="mt-2 text-sm text-ink-muted">
              Escolha o tipo de atendimento. A duração já considera o tempo reservado na agenda.
            </p>

            <ul className="mt-6 space-y-3">
              {services.map((item) => {
                const checked = item.slug === serviceSlug;
                const priceVisible =
                  showPrices && item.show_price_publicly && item.price_cents !== null;

                return (
                  <li key={item.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer gap-4 rounded-2xl bg-surface p-5 ring-1 transition-all',
                        checked
                          ? 'ring-2 ring-petrol-500 shadow-card'
                          : 'ring-petrol-100 hover:ring-petrol-300',
                      )}
                    >
                      <input
                        type="radio"
                        name="servico"
                        value={item.slug}
                        checked={checked}
                        onChange={() => setServiceSlug(item.slug)}
                        className="mt-1 h-4 w-4 shrink-0 accent-petrol-700"
                      />
                      <span className="flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-lg text-ink">{item.name}</span>
                          <Badge>
                            <Clock aria-hidden="true" className="h-3 w-3" />
                            {formatDuration(item.duration_minutes)}
                          </Badge>
                          {priceVisible ? (
                            <Badge tone="sand">{formatCurrency(item.price_cents)}</Badge>
                          ) : null}
                        </span>
                        {item.summary ? (
                          <span className="mt-2 block text-sm leading-relaxed text-ink-muted">
                            {item.summary}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <div className="mt-8 flex justify-end">
            <Button type="button" onClick={() => setStep(1)} disabled={!service} size="lg">
              Ver horários
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------ passo 2: data e hora */}
      {step === 1 ? (
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl text-ink">Escolha data e horário</h2>
              <p className="mt-2 text-sm text-ink-muted">
                {service?.name} · {formatDuration(service?.duration_minutes ?? 0)} · horários
                mostrados no fuso de {timezone.replace('America/', '').replace('_', ' ')}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setWeekOffset((current) => Math.max(0, current - 1))}
                disabled={weekOffset === 0 || loadingSlots}
                aria-label="Semana anterior"
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setWeekOffset((current) => Math.min(11, current + 1))}
                disabled={loadingSlots}
                aria-label="Semana seguinte"
              >
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {slotsError ? (
            <Alert tone="danger" title="Não foi possível carregar a agenda" className="mt-6">
              {slotsError}
            </Alert>
          ) : null}

          {loadingSlots ? (
            <div className="mt-6" role="status" aria-live="polite">
              <span className="sr-only">Carregando horários disponíveis</span>
              <div className="flex gap-2 overflow-hidden">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-28 shrink-0" />
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <Skeleton key={index} className="h-11" />
                ))}
              </div>
            </div>
          ) : daysWithSlots.length === 0 ? (
            <EmptyState
              className="mt-6"
              icon={<CalendarDays aria-hidden="true" className="h-5 w-5" />}
              title="Nenhum horário livre nesta semana"
              description={`Os horários exigem ao menos ${minLeadHours}h de antecedência. Veja a semana seguinte ou fale com a equipe.`}
              action={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setWeekOffset((current) => current + 1)}
                >
                  Ver próxima semana
                </Button>
              }
            />
          ) : (
            <>
              <div
                role="tablist"
                aria-label="Dias disponíveis"
                className="scroll-subtle mt-6 flex gap-2 overflow-x-auto pb-2"
              >
                {daysWithSlots.map((day) => {
                  const isActive = activeDay?.date === day.date;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => {
                        setSelectedDate(day.date);
                        setSelectedSlot(null);
                      }}
                      className={cn(
                        'touch-target shrink-0 rounded-xl px-4 py-3 text-left transition-all',
                        isActive
                          ? 'bg-petrol-700 text-white shadow-card'
                          : 'bg-surface text-ink-soft ring-1 ring-petrol-100 hover:ring-petrol-300',
                      )}
                    >
                      <span className="block text-xs opacity-80">
                        {formatDateKeyLabel(day.date).split(',')[0]}
                      </span>
                      <span className="mt-0.5 block text-sm font-semibold">
                        {formatDateKeyLabel(day.date).split(', ')[1]}
                      </span>
                      <span className="mt-1 block text-[0.6875rem] opacity-80">
                        {day.slots.length} {day.slots.length === 1 ? 'horário' : 'horários'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeDay ? (
                <fieldset className="mt-6">
                  <legend className="text-sm font-medium text-ink-soft">
                    Horários em {formatDateKeyLabel(activeDay.date)}
                  </legend>
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
                    {activeDay.slots.map((slot) => {
                      const checked = selectedSlot === slot.startsAt;
                      return (
                        <label
                          key={slot.startsAt}
                          className={cn(
                            'touch-target flex cursor-pointer items-center justify-center rounded-xl text-sm font-medium transition-all',
                            checked
                              ? 'bg-petrol-700 text-white shadow-card'
                              : 'bg-surface text-ink-soft ring-1 ring-petrol-100 hover:ring-petrol-400',
                          )}
                        >
                          <input
                            type="radio"
                            name="horario"
                            value={slot.startsAt}
                            checked={checked}
                            onChange={() => {
                              setSelectedSlot(slot.startsAt);
                              setSelectedDate(activeDay.date);
                            }}
                            className="sr-only"
                          />
                          {slot.label}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}
            </>
          )}

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep(0)}>
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Voltar
            </Button>
            <Button type="button" onClick={() => setStep(2)} disabled={!selectedSlot} size="lg">
              Continuar
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* -------------------------------------------------- passo 3: seus dados */}
      {step === 2 ? (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <h2 className="font-display text-xl text-ink">Seus dados</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Usamos estes dados apenas para confirmar o atendimento e entrar em contato.
          </p>

          {selectedSlot && service ? (
            <Card className="mt-6 bg-surface-muted">
              <p className="text-xs uppercase tracking-wide text-ink-faint">Horário selecionado</p>
              <p className="mt-1 font-display text-lg text-ink">
                {formatLongDate(selectedSlot, timezone)} às {formatTime(selectedSlot, timezone)}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {service.name} · {formatDuration(service.duration_minutes)}
              </p>
            </Card>
          ) : null}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <FormField
              label="Nome completo"
              htmlFor={`${formId}-nome`}
              required
              error={errors.fullName}
              className="sm:col-span-2"
            >
              <input
                {...fieldAria(`${formId}-nome`, { error: Boolean(errors.fullName) })}
                type="text"
                name="fullName"
                autoComplete="name"
                value={form.fullName}
                onChange={(event) => update('fullName', event.target.value)}
                className={inputClasses}
                required
              />
            </FormField>

            <FormField label="E-mail" htmlFor={`${formId}-email`} required error={errors.email}>
              <input
                {...fieldAria(`${formId}-email`, { error: Boolean(errors.email) })}
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                className={inputClasses}
                required
              />
            </FormField>

            <FormField
              label="Telefone / WhatsApp"
              htmlFor={`${formId}-telefone`}
              required
              hint="Com DDD, apenas números"
              error={errors.phone}
            >
              <input
                {...fieldAria(`${formId}-telefone`, { hint: true, error: Boolean(errors.phone) })}
                type="tel"
                name="phone"
                autoComplete="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
                className={inputClasses}
                required
              />
            </FormField>

            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-surface-muted p-4">
                <input
                  type="checkbox"
                  checked={form.isForDependent}
                  onChange={(event) => update('isForDependent', event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-petrol-700"
                />
                <span className="text-sm text-ink-soft">
                  O atendimento é para outra pessoa (filho, filha ou dependente)
                </span>
              </label>
            </div>

            {form.isForDependent ? (
              <>
                <FormField
                  label="Nome de quem será atendido"
                  htmlFor={`${formId}-dependente`}
                  required
                  error={errors.dependentName}
                >
                  <input
                    {...fieldAria(`${formId}-dependente`, {
                      error: Boolean(errors.dependentName),
                    })}
                    type="text"
                    value={form.dependentName}
                    onChange={(event) => update('dependentName', event.target.value)}
                    className={inputClasses}
                  />
                </FormField>

                <FormField
                  label="Data de nascimento"
                  htmlFor={`${formId}-nascimento`}
                  hint="Opcional — ajuda no planejamento da avaliação"
                >
                  <input
                    {...fieldAria(`${formId}-nascimento`, { hint: true })}
                    type="date"
                    value={form.birthDate}
                    onChange={(event) => update('birthDate', event.target.value)}
                    className={inputClasses}
                  />
                </FormField>
              </>
            ) : null}

            <FormField
              label="Conte brevemente o motivo do contato"
              htmlFor={`${formId}-mensagem`}
              hint="Opcional. Não inclua informações de saúde detalhadas neste campo."
              className="sm:col-span-2"
            >
              <textarea
                {...fieldAria(`${formId}-mensagem`, { hint: true })}
                rows={4}
                value={form.message}
                onChange={(event) => update('message', event.target.value)}
                className={cn(inputClasses, 'resize-y')}
              />
            </FormField>
          </div>

          <div className="mt-6">
            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl p-4 ring-1 transition-colors',
                errors.consentAccepted ? 'ring-red-300 bg-red-50/60' : 'ring-petrol-100 bg-surface',
              )}
            >
              <input
                type="checkbox"
                checked={form.consentAccepted}
                onChange={(event) => update('consentAccepted', event.target.checked)}
                aria-describedby={errors.consentAccepted ? `${consentLabelId}-error` : undefined}
                aria-invalid={errors.consentAccepted ? true : undefined}
                className="mt-0.5 h-4 w-4 accent-petrol-700"
                required
              />
              <span className="text-sm leading-relaxed text-ink-soft">
                Li e aceito a{' '}
                <a
                  href="/politica-de-privacidade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-petrol-700 underline underline-offset-2"
                >
                  política de privacidade
                </a>{' '}
                e autorizo o uso dos meus dados para contato e organização do atendimento.
                <span className="mt-1 block text-xs text-ink-faint">
                  Versão do termo: {consentVersion}. O aceite é registrado com data e hora.
                </span>
              </span>
            </label>
            {errors.consentAccepted ? (
              <p id={`${consentLabelId}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-700">
                {errors.consentAccepted}
              </p>
            ) : null}
          </div>

          {Object.keys(errors).length > 0 ? (
            <Alert tone="danger" className="mt-6">
              <span className="flex items-center gap-2">
                <AlertCircle aria-hidden="true" className="h-4 w-4" />
                Revise os campos destacados para continuar.
              </span>
            </Alert>
          ) : null}

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={submitting}>
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Voltar
            </Button>
            <SubmitButton pending={submitting} pendingLabel="Enviando solicitação…" size="lg">
              Enviar solicitação
            </SubmitButton>
          </div>
        </form>
      ) : null}

      {/* ------------------------------------------------ passo 4: confirmação */}
      {step === 3 && confirmation ? (
        <div>
          <div className="flex items-start gap-4 rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
            <div>
              <h2 className="font-display text-xl text-emerald-950">Solicitação registrada</h2>
              <p className="mt-2 text-sm leading-relaxed text-emerald-900">
                Seu horário está reservado com o status{' '}
                <strong>aguardando confirmação</strong>. Você receberá a confirmação no e-mail
                informado depois da checagem da agenda.
              </p>
            </div>
          </div>

          <Card className="mt-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-faint">Atendimento</dt>
                <dd className="mt-1 font-medium text-ink">{confirmation.serviceName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-faint">Duração</dt>
                <dd className="mt-1 font-medium text-ink">
                  {formatDuration(confirmation.durationMinutes)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-faint">Data</dt>
                <dd className="mt-1 font-medium text-ink">
                  {formatLongDate(confirmation.startsAt, timezone)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-faint">Horário</dt>
                <dd className="mt-1 font-medium text-ink">
                  {formatTime(confirmation.startsAt, timezone)} às{' '}
                  {formatTime(confirmation.endsAt, timezone)}
                </dd>
              </div>
            </dl>

            <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-ink-faint">
              <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Precisa alterar ou cancelar? Responda o e-mail de confirmação ou fale pelo WhatsApp.
            </p>
          </Card>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/">Voltar ao início</ButtonLink>
            <ButtonLink href="/neuropsicologia" variant="secondary">
              Ler sobre a avaliação
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </div>
  );
}
