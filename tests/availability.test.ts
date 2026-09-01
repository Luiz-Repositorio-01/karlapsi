import { describe, expect, it } from 'vitest';
import { computeAvailability, formatDateKey, zonedInstant } from '@/lib/domain/availability';
import type { AvailabilityException, AvailabilityRule, BusyRange } from '@/lib/types';

/**
 * Geração de horários livres.
 *
 * O algoritmo é a única fonte da lista mostrada ao paciente, então precisa
 * respeitar grade, pausas, exceções, antecedência mínima e — principalmente —
 * esconder horários já ocupados.
 */

const TZ = 'America/Sao_Paulo';

function rule(overrides: Partial<AvailabilityRule> = {}): AvailabilityRule {
  return {
    id: 'rule-1',
    weekday: 3, // quarta-feira
    start_time: '09:00',
    end_time: '12:00',
    slot_interval_minutes: 60,
    break_start_time: null,
    break_end_time: null,
    service_id: null,
    professional_id: null,
    is_active: true,
    ...overrides,
  };
}

/** Quarta-feira, 2026-09-02. */
const WEDNESDAY = '2026-09-02';
/** Referência de "agora" bem antes da data usada nos testes. */
const NOW = new Date('2026-08-25T12:00:00.000Z');

function baseInput(overrides: Partial<Parameters<typeof computeAvailability>[0]> = {}) {
  return {
    rules: [rule()],
    exceptions: [] as AvailabilityException[],
    busy: [] as BusyRange[],
    durationMinutes: 60,
    timezone: TZ,
    fromDate: WEDNESDAY,
    days: 1,
    minLeadHours: 12,
    now: NOW,
    ...overrides,
  };
}

describe('computeAvailability', () => {
  it('gera horários conforme a grade da regra semanal', () => {
    const [day] = computeAvailability(baseInput());

    expect(day?.slots.map((slot) => slot.label)).toEqual(['09:00', '10:00', '11:00']);
  });

  it('não gera horário que ultrapasse o fim da janela', () => {
    const [day] = computeAvailability(
      baseInput({ durationMinutes: 90, rules: [rule({ slot_interval_minutes: 30 })] }),
    );

    // Janela 09:00–12:00 com 90 min: 09:00, 09:30 e 10:00 (10:30 terminaria 12:00 — cabe).
    expect(day?.slots.map((slot) => slot.label)).toEqual(['09:00', '09:30', '10:00', '10:30']);
  });

  it('respeita o intervalo de pausa', () => {
    const [day] = computeAvailability(
      baseInput({
        rules: [
          rule({
            start_time: '09:00',
            end_time: '15:00',
            break_start_time: '12:00',
            break_end_time: '13:00',
          }),
        ],
      }),
    );

    expect(day?.slots.map((slot) => slot.label)).toEqual([
      '09:00',
      '10:00',
      '11:00',
      '13:00',
      '14:00',
    ]);
  });

  it('esconde horários ocupados por atendimento existente', () => {
    const busyStart = zonedInstant(WEDNESDAY, 10 * 60, TZ);
    const busyEnd = zonedInstant(WEDNESDAY, 11 * 60, TZ);

    const [day] = computeAvailability(
      baseInput({
        busy: [{ starts_at: busyStart.toISOString(), ends_at: busyEnd.toISOString() }],
      }),
    );

    expect(day?.slots.map((slot) => slot.label)).toEqual(['09:00', '11:00']);
  });

  it('esconde horários com sobreposição parcial', () => {
    // Ocupado 10:30–11:30 elimina 10:00 e 11:00 (ambos se sobrepõem).
    const busyStart = zonedInstant(WEDNESDAY, 10 * 60 + 30, TZ);
    const busyEnd = zonedInstant(WEDNESDAY, 11 * 60 + 30, TZ);

    const [day] = computeAvailability(
      baseInput({
        busy: [{ starts_at: busyStart.toISOString(), ends_at: busyEnd.toISOString() }],
      }),
    );

    expect(day?.slots.map((slot) => slot.label)).toEqual(['09:00']);
  });

  it('permite horário encostado no fim do anterior (fim exclusivo)', () => {
    const busyStart = zonedInstant(WEDNESDAY, 9 * 60, TZ);
    const busyEnd = zonedInstant(WEDNESDAY, 10 * 60, TZ);

    const [day] = computeAvailability(
      baseInput({
        busy: [{ starts_at: busyStart.toISOString(), ends_at: busyEnd.toISOString() }],
      }),
    );

    expect(day?.slots.map((slot) => slot.label)).toEqual(['10:00', '11:00']);
  });

  it('aplica a antecedência mínima', () => {
    // "Agora" às 09:00 locais do mesmo dia, com 4h de antecedência mínima:
    // apenas horários a partir de 13:00 sobram.
    const [day] = computeAvailability(
      baseInput({
        rules: [rule({ start_time: '09:00', end_time: '18:00' })],
        minLeadHours: 4,
        now: zonedInstant(WEDNESDAY, 9 * 60, TZ),
      }),
    );

    expect(day?.slots.map((slot) => slot.label)).toEqual([
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
    ]);
  });

  it('bloqueia o dia inteiro quando existe exceção indisponível', () => {
    const [day] = computeAvailability(
      baseInput({
        exceptions: [
          {
            id: 'exc-1',
            exception_date: WEDNESDAY,
            is_available: false,
            start_time: null,
            end_time: null,
            slot_interval_minutes: null,
            reason: 'Feriado',
          },
        ],
      }),
    );

    expect(day?.slots).toEqual([]);
  });

  it('usa o horário especial da exceção em vez da regra semanal', () => {
    const [day] = computeAvailability(
      baseInput({
        exceptions: [
          {
            id: 'exc-2',
            exception_date: WEDNESDAY,
            is_available: true,
            start_time: '14:00',
            end_time: '16:00',
            slot_interval_minutes: 60,
            reason: 'Atendimento especial',
          },
        ],
      }),
    );

    expect(day?.slots.map((slot) => slot.label)).toEqual(['14:00', '15:00']);
  });

  it('não gera horários em dia sem regra ativa', () => {
    // 2026-09-03 é quinta-feira; a regra é só de quarta.
    const [day] = computeAvailability(baseInput({ fromDate: '2026-09-03' }));

    expect(day?.slots).toEqual([]);
    expect(day?.weekday).toBe(4);
  });

  it('ignora regra desativada', () => {
    const [day] = computeAvailability(baseInput({ rules: [rule({ is_active: false })] }));
    expect(day?.slots).toEqual([]);
  });

  it('filtra regra específica de outro serviço', () => {
    const [day] = computeAvailability(
      baseInput({
        rules: [rule({ service_id: 'servico-a' })],
        serviceId: 'servico-b',
      }),
    );

    expect(day?.slots).toEqual([]);
  });

  it('remove horários duplicados quando duas faixas se sobrepõem', () => {
    const [day] = computeAvailability(
      baseInput({
        rules: [
          rule({ id: 'r1', start_time: '09:00', end_time: '11:00' }),
          rule({ id: 'r2', start_time: '09:00', end_time: '12:00' }),
        ],
      }),
    );

    expect(day?.slots.map((slot) => slot.label)).toEqual(['09:00', '10:00', '11:00']);
  });

  it('cobre vários dias mantendo a ordem cronológica', () => {
    const days = computeAvailability(
      baseInput({
        rules: [rule({ weekday: 3 }), rule({ id: 'r-sex', weekday: 5 })],
        days: 5,
      }),
    );

    expect(days).toHaveLength(5);
    expect(days.filter((day) => day.slots.length > 0).map((day) => day.date)).toEqual([
      '2026-09-02',
      '2026-09-04',
    ]);
  });

  it('gera instantes UTC coerentes com o fuso do consultório', () => {
    const [day] = computeAvailability(baseInput());
    // 09:00 em São Paulo (UTC-3) equivale a 12:00 UTC.
    expect(day?.slots[0]?.startsAt).toBe('2026-09-02T12:00:00.000Z');
    expect(day?.slots[0]?.endsAt).toBe('2026-09-02T13:00:00.000Z');
  });
});

describe('formatDateKey', () => {
  it('usa a data local do consultório, não a UTC', () => {
    // 2026-09-03T01:00Z ainda é 2026-09-02 em São Paulo (UTC-3).
    expect(formatDateKey(new Date('2026-09-03T01:00:00.000Z'), TZ)).toBe('2026-09-02');
  });
});
