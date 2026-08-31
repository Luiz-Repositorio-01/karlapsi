import { submitDataSubjectRequest } from '@/lib/data/booking';
import { dataSubjectRequestSchema } from '@/lib/validation/schemas';
import {
  errorResponse,
  getClientIp,
  rateLimitResponse,
  readJson,
  successResponse,
  validationError,
} from '@/lib/utils/request';
import { rateLimit } from '@/lib/utils/rate-limit';

/**
 * POST /api/lgpd/request — exercício dos direitos do titular (LGPD art. 18):
 * acesso, correção, exclusão, portabilidade e revogação de consentimento.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit({ key: `lgpd:${ip ?? 'anonimo'}`, limit: 4, windowSeconds: 900 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  let payload: unknown;
  try {
    payload = await readJson(request);
  } catch {
    return errorResponse('Requisição inválida.', 400, 'INVALID_PAYLOAD');
  }

  const parsed = dataSubjectRequestSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  const result = await submitDataSubjectRequest({
    requesterName: parsed.data.requesterName,
    requesterEmail: parsed.data.requesterEmail,
    requestType: parsed.data.requestType,
    details: parsed.data.details,
    ip,
  });

  if (!result.ok) {
    if (result.code === 'SUPABASE_NOT_CONFIGURED') {
      return errorResponse(
        'O registro automático de solicitações ainda não está ativo neste ambiente. Envie o pedido pelo e-mail informado na Política de Privacidade.',
        503,
        'LGPD_UNAVAILABLE',
      );
    }
    return errorResponse('Não foi possível registrar a solicitação.', 400, 'LGPD_ERROR');
  }

  return successResponse(
    {
      message:
        'Solicitação registrada. O prazo de resposta e os próximos passos são informados no e-mail indicado.',
    },
    201,
  );
}
