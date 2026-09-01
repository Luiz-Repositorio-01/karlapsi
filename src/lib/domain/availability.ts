import { TZDate } from '@date-fns/tz';
import type { AvailabilityException, AvailabilityRule, BusyRange } from '@/lib/types';

/**
 * Geração de horários livres.
 *
 * Função PURA: recebe regras, exceções e intervalos ocupados e devolve os
 * horários disponíveis. É a única implementação do algoritmo na aplicação
 * (usada pela API pública e pelo painel) e está coberta por testes unitários.
 *
 * A confirmação definitiva NÃO acontece aqui: o banco tem uma exclusion
 * constraint que recusa qualquer sobreposição, mesmo em corrida entre dois
 * visitantes que carregaram a mesma lista.
 */

export interface SlotOption {
  /** Instante de início em ISO 8601 com offset (ex.: 2026-03-10T13:00:00.000Z). */
  startsAt: string;
  endsAt: string;
  /** Rótulo local já formatado (HH:mm) no fuso do consultório. */
  label: string;
}

export interface DayAvailability {
  /** Data local no formato YYYY-MM-DD. */
  date: string;
  weekday: number;
  slots: SlotOption[];
}

export interface ComputeSlotsInput {
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
  busy: BusyRange[];
  /** Duração do serviço em minutos. */
  durationMinutes: number;
  timezone: string;
  /** Primeiro dia considerado (YYYY-MM-DD, hora local do consultório). */
  fromDate: string;
  /** Quantidade de dias a partir de `fromDate`. */
  days: number;
  /** Antecedência mínima em horas para aceitar um horário. */
  minLeadHours: number;
  /** Momento de referência (injeta o "agora" para permitir teste determinístico). */
  now: Date;
  /** Restringe às regras de um serviço específico, quando existirem. */
  serviceId?: string | null;
}

const MINUTE_MS = 60_000;

function parseTimeToMinutes(time: string): number {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
}

export function formatDateKey(date: Date, timezone: string): string {
  const zoned = new TZDate(date, timezone);
  const year = zoned.getFullYear();
  const month = String(zoned.getMonth() + 1).padStart(2, '0');
  const day = String(zoned.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Cria um instante absoluto a partir de data local + minutos desde 00:00. */
export function zonedInstant(dateKey: string, minutesFromMidnight: number, timezone: string): Date {
  const [year = '1970', month = '01', day = '01'] = dateKey.split('-');
  const base = new TZDate(
    Number(year),
    Number(month) - 1,
    Number(day),
    0,
    0,
    0,
    0,
    timezone,
  );
  return new Date(base.getTime() + minutesFromMidnight * MINUTE_MS);
}

function addDaysToKey(dateKey: string, amount: number): string {
  const [year = '1970', month = '01', day = '01'] = dateKey.split('-');
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function weekdayOfKey(dateKey: string): number {
  const [year = '1970', month = '01', day = '01'] = dateKey.split('-');
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay();
}

function overlaps(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && endA > startB;
}

interface Window {
  startMinutes: number;
  endMinutes: number;
  intervalMinutes: number;
  breakStartMinutes: number | null;
  breakEndMinutes: number | null;
}

function windowsForDay(
  dateKey: string,
  input: Pick<ComputeSlotsInput, 'rules' | 'exceptions' | 'serviceId'>,
): Window[] {
  const exception = input.exceptions.find((item) => item.exception_date === dateKey);

  if (exception) {
    // Exceção substitui a regra semanal: bloqueia o dia ou define horário especial.
    if (!exception.is_available || !exception.start_time || !exception.end_time) return [];
    return [
      {
        startMinutes: parseTimeToMinutes(exception.start_time),
        endMinutes: parseTimeToMinutes(exception.end_time),
        intervalMinutes: exception.slot_interval_minutes ?? 30,
        breakStartMinutes: null,
        breakEndMinutes: null,
      },
    ];
  }

  const weekday = weekdayOfKey(dateKey);

  return input.rules
    .filter((rule) => rule.is_active && rule.weekday === weekday)
    .filter((rule) => !rule.service_id || !input.serviceId || rule.service_id === input.serviceId)
    .map((rule) => ({
      startMinutes: parseTimeToMinutes(rule.start_time),
      endMinutes: parseTimeToMinutes(rule.end_time),
      intervalMinutes: rule.slot_interval_minutes,
      breakStartMinutes: rule.break_start_time ? parseTimeToMinutes(rule.break_start_time) : null,
      breakEndMinutes: rule.break_end_time ? parseTimeToMinutes(rule.break_end_time) : null,
    }));
}

export function computeAvailability(input: ComputeSlotsInput): DayAvailability[] {
  const {
    busy,
    durationMinutes,
    timezone,
    fromDate,
    days,
    minLeadHours,
    now,
  } = input;

  const earliestAllowed = now.getTime() + minLeadHours * 60 * MINUTE_MS;
  const busyRanges = busy.map((range) => ({
    start: new Date(range.starts_at).getTime(),
    end: new Date(range.ends_at).getTime(),
  }));

  const result: DayAvailability[] = [];

  for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
    const dateKey = addDaysToKey(fromDate, dayOffset);
    const slots: SlotOption[] = [];

    for (const window of windowsForDay(dateKey, input)) {
      for (
        let startMinutes = window.startMinutes;
        startMinutes + durationMinutes <= window.endMinutes;
        startMinutes += window.intervalMinutes
      ) {
        const endMinutes = startMinutes + durationMinutes;

        const collidesWithBreak =
          window.breakStartMinutes !== null &&
          window.breakEndMinutes !== null &&
          overlaps(startMinutes, endMinutes, window.breakStartMinutes, window.breakEndMinutes);

        if (collidesWithBreak) continue;

        const startsAt = zonedInstant(dateKey, startMinutes, timezone);
        const endsAt = zonedInstant(dateKey, endMinutes, timezone);

        if (startsAt.getTime() < earliestAllowed) continue;

        const isBusy = busyRanges.some((range) =>
          overlaps(startsAt.getTime(), endsAt.getTime(), range.start, range.end),
        );
        if (isBusy) continue;

        const hours = String(Math.floor(startMinutes / 60)).padStart(2, '0');
        const minutes = String(startMinutes % 60).padStart(2, '0');

        slots.push({
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          label: `${hours}:${minutes}`,
        });
      }
    }

    slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

    result.push({
      date: dateKey,
      weekday: weekdayOfKey(dateKey),
      // Janelas diferentes podem gerar o mesmo horário; mantém apenas um.
      slots: slots.filter(
        (slot, index, list) => list.findIndex((item) => item.startsAt === slot.startsAt) === index,
      ),
    });
  }

  return result;
}
