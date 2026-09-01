import { submitContactMessage } from '@/lib/data/booking';
import { getSiteSettings } from '@/lib/data/public';
import { contactMessageSchema } from '@/lib/validation/schemas';
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

/** POST /api/contact — formulário público de contato. */
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit({ key: `contact:${ip ?? 'anonimo'}`, limit: 5, windowSeconds: 600 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  let payload: unknown;
  try {
    payload = await readJson(request);
  } catch {
    return errorResponse('Requisição inválida.', 400, 'INVALID_PAYLOAD');
  }

  const parsed = contactMessageSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  const settings = await getSiteSettings();

  const result = await submitContactMessage({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    subject: parsed.data.subject,
    message: parsed.data.message,
    consentVersion: settings.booking.consent_version,
    ip,
    userAgent: getUserAgent(request),
  });

  if (!result.ok) {
    if (result.code === 'SUPABASE_NOT_CONFIGURED') {
      return errorResponse(
        'O envio de mensagens ainda não está ativo neste ambiente. Use o WhatsApp para falar com a equipe.',
        503,
        'CONTACT_UNAVAILABLE',
      );
    }

    return errorResponse(
      humanizeDomainError(result.code, 'Não foi possível enviar a mensagem. Tente novamente.'),
      400,
      'CONTACT_ERROR',
    );
  }

  return successResponse(
    { message: 'Mensagem enviada. Responderemos no e-mail informado.' },
    201,
  );
}
