import { createAppointmentRequest } from '@/lib/data/booking';
import { getSiteSettings } from '@/lib/data/public';
import { appointmentRequestSchema } from '@/lib/validation/schemas';
import {
  errorResponse,
  getClientIp,
  getUserAgent,
  rateLimitResponse,
  readJson,
  successResponse,
  validationError,
} from '@/lib/utils/request';
import { rateLimit } from '@/lib/utils/rate-limit';
import { humanizeDomainError } from '@/lib/utils/labels';

/**
 * POST /api/appointments/request — solicitação pública de agendamento.
 *
 * Camadas de proteção, em ordem:
 * 1. Rate limit por IP nesta rota (barreira rápida).
 * 2. Validação de schema (Zod) no servidor.
 * 3. Função `create_appointment_request` no Postgres: revalida serviço,
 *    janela, disponibilidade, consentimento e rate limit por e-mail/IP.
 * 4. Exclusion constraint da tabela `appointments`: impossibilita, no nível do
 *    banco, dois atendimentos no mesmo horário.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit({ key: `appointment:${ip ?? 'anonimo'}`, limit: 8, windowSeconds: 600 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  let payload: unknown;
  try {
    payload = await readJson(request);
  } catch {
    return errorResponse('Requisição inválida.', 400, 'INVALID_PAYLOAD');
  }

  const parsed = appointmentRequestSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  const settings = await getSiteSettings();

  const result = await createAppointmentRequest({
    serviceId: parsed.data.serviceId,
    startsAt: parsed.data.startsAt,
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    birthDate: parsed.data.birthDate,
    isForDependent: parsed.data.isForDependent,
    dependentName: parsed.data.dependentName,
    message: parsed.data.message,
    consentVersion: settings.booking.consent_version,
    ip,
    userAgent: getUserAgent(request),
  });

  if (!result.ok) {
    if (result.code === 'SUPABASE_NOT_CONFIGURED') {
      return errorResponse(
        'O agendamento online ainda não está ativo neste ambiente. Fale com a equipe pelo WhatsApp ou pelo formulário de contato.',
        503,
        'BOOKING_UNAVAILABLE',
      );
    }

    const isConflict = result.code?.includes('SLOT_TAKEN');
    return errorResponse(
      humanizeDomainError(result.code, 'Não foi possível registrar a solicitação. Tente novamente.'),
      isConflict ? 409 : 400,
      isConflict ? 'SLOT_TAKEN' : 'BOOKING_ERROR',
    );
  }

  return successResponse(
    {
      request: {
        id: result.data?.request_id,
        startsAt: result.data?.starts_at,
        endsAt: result.data?.ends_at,
        serviceName: result.data?.service_name,
        durationMinutes: result.data?.duration_minutes,
        status: 'requested',
      },
      message: 'Solicitação registrada. Você receberá a confirmação por e-mail.',
    },
    201,
  );
}
