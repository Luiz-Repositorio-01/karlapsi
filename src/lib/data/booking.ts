import 'server-only';

import { createSupabasePublicClient } from '@/lib/supabase/public';
import { getBookableServices, getSiteSettings } from '@/lib/data/public';
import { computeAvailability, formatDateKey, type DayAvailability } from '@/lib/domain/availability';
import type {
  AvailabilityException,
  AvailabilityRule,
  BusyRange,
  Service,
} from '@/lib/types';

/**
 * Disponibilidade pública.
 *
 * Os horários ocupados vêm da RPC `busy_ranges`, que devolve apenas início e
 * fim — nenhum dado de paciente sai do banco para o site público. O cálculo
 * dos horários livres é feito pela função pura `computeAvailability`.
 */

const DEFAULT_RULES: AvailabilityRule[] = [1, 2, 3, 4, 5].map((weekday) => ({
  id: `default-${weekday}`,
  weekday,
  start_time: '09:00',
  end_time: '18:00',
  slot_interval_minutes: 60,
  break_start_time: '12:00',
  break_end_time: '13:00',
  service_id: null,
  professional_id: null,
  is_active: true,
}));

export interface AvailabilityResult {
  days: DayAvailability[];
  timezone: string;
  service: Service;
  /** Indica que a agenda real não pôde ser consultada (Supabase pendente). */
  usingFallbackSchedule: boolean;
}

export async function getAvailability(options: {
  serviceSlug: string;
  fromDate?: string;
  days?: number;
}): Promise<AvailabilityResult | null> {
  const [settings, services] = await Promise.all([getSiteSettings(), getBookableServices()]);
  const service = services.find((item) => item.slug === options.serviceSlug);
  if (!service) return null;

  const timezone = settings.booking.timezone;
  const now = new Date();
  const fromDate = options.fromDate ?? formatDateKey(now, timezone);
  const days = Math.min(options.days ?? 21, Number(settings.booking.max_advance_days) || 90);

  const client = createSupabasePublicClient();

  let rules = DEFAULT_RULES;
  let exceptions: AvailabilityException[] = [];
  let busy: BusyRange[] = [];
  let usingFallbackSchedule = true;

  if (client) {
    try {
      const rangeStart = new Date(`${fromDate}T00:00:00.000Z`);
      const rangeEnd = new Date(rangeStart.getTime() + (days + 2) * 24 * 60 * 60 * 1000);

      const [rulesResult, exceptionsResult, busyResult] = await Promise.all([
        client.from('availability_rules').select('*').eq('is_active', true),
        client
          .from('availability_exceptions')
          .select('*')
          .gte('exception_date', fromDate)
          .lte('exception_date', formatDateKey(rangeEnd, timezone)),
        client.rpc('busy_ranges', {
          p_from: rangeStart.toISOString(),
          p_to: rangeEnd.toISOString(),
        }),
      ]);

      if (rulesResult.error) throw rulesResult.error;
      if (busyResult.error) throw busyResult.error;

      const loadedRules = (rulesResult.data ?? []) as AvailabilityRule[];
      rules = loadedRules.length > 0 ? loadedRules : DEFAULT_RULES;
      exceptions = (exceptionsResult.data ?? []) as AvailabilityException[];
      busy = (busyResult.data ?? []) as BusyRange[];
      usingFallbackSchedule = false;
    } catch (error) {
      console.error('[booking] falha ao carregar agenda real:', error);
    }
  }

  const availability = computeAvailability({
    rules,
    exceptions,
    busy,
    durationMinutes: service.duration_minutes,
    timezone,
    fromDate,
    days,
    minLeadHours: Number(settings.booking.min_lead_hours) || 0,
    now,
    serviceId: service.id,
  });

  return { days: availability, timezone, service, usingFallbackSchedule };
}

export interface CreateAppointmentRequestPayload {
  serviceId: string;
  startsAt: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate?: string;
  isForDependent: boolean;
  dependentName?: string;
  message?: string;
  consentVersion: string;
  ip?: string;
  userAgent?: string;
}

export interface CreateAppointmentRequestResult {
  ok: boolean;
  code?: string;
  data?: {
    request_id: string;
    appointment_id: string;
    starts_at: string;
    ends_at: string;
    status: string;
    service_name: string;
    duration_minutes: number;
  };
}

/**
 * Cria a solicitação chamando a RPC transacional do banco.
 * Toda a validação crítica (janela, disponibilidade, conflito, consentimento,
 * rate limit) acontece dentro do Postgres — não é possível burlar pela API.
 */
export async function createAppointmentRequest(
  payload: CreateAppointmentRequestPayload,
): Promise<CreateAppointmentRequestResult> {
  const client = createSupabasePublicClient();
  if (!client) return { ok: false, code: 'SUPABASE_NOT_CONFIGURED' };

  const { data, error } = await client.rpc('create_appointment_request', {
    payload: {
      service_id: payload.serviceId,
      starts_at: payload.startsAt,
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      birth_date: payload.birthDate ?? null,
      is_for_dependent: payload.isForDependent,
      dependent_name: payload.dependentName ?? null,
      message: payload.message ?? null,
      consent_accepted: true,
      consent_version: payload.consentVersion,
      ip: payload.ip ?? null,
      user_agent: payload.userAgent ?? null,
    },
  });

  if (error) {
    return { ok: false, code: error.message };
  }

  return { ok: true, data: data as CreateAppointmentRequestResult['data'] };
}

export async function submitContactMessage(payload: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  consentVersion: string;
  ip?: string;
  userAgent?: string;
}): Promise<{ ok: boolean; code?: string }> {
  const client = createSupabasePublicClient();
  if (!client) return { ok: false, code: 'SUPABASE_NOT_CONFIGURED' };

  const { error } = await client.rpc('submit_contact_message', {
    payload: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone ?? null,
      subject: payload.subject ?? null,
      message: payload.message,
      consent_accepted: true,
      consent_version: payload.consentVersion,
      ip: payload.ip ?? null,
      user_agent: payload.userAgent ?? null,
    },
  });

  return error ? { ok: false, code: error.message } : { ok: true };
}

export async function submitDataSubjectRequest(payload: {
  requesterName: string;
  requesterEmail: string;
  requestType: string;
  details?: string;
  ip?: string;
}): Promise<{ ok: boolean; code?: string }> {
  const client = createSupabasePublicClient();
  if (!client) return { ok: false, code: 'SUPABASE_NOT_CONFIGURED' };

  const { error } = await client.rpc('submit_data_subject_request', {
    payload: {
      requester_name: payload.requesterName,
      requester_email: payload.requesterEmail,
      request_type: payload.requestType,
      details: payload.details ?? null,
      ip: payload.ip ?? null,
    },
  });

  return error ? { ok: false, code: error.message } : { ok: true };
}
