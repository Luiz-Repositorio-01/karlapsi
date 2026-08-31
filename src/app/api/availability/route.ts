import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAvailability } from '@/lib/data/booking';
import { errorResponse, getClientIp, rateLimitResponse } from '@/lib/utils/request';
import { rateLimit } from '@/lib/utils/rate-limit';
import { dateOnlySchema, slugSchema } from '@/lib/validation/schemas';

/**
 * GET /api/availability?servico=<slug>&de=<AAAA-MM-DD>&dias=<n>
 *
 * Retorna apenas horários LIVRES. Nenhum dado de paciente é exposto: os
 * intervalos ocupados vêm da RPC `busy_ranges`, que devolve somente início/fim.
 */
export const dynamic = 'force-dynamic';

const querySchema = z.object({
  servico: slugSchema,
  de: dateOnlySchema.optional(),
  dias: z.coerce.number().int().min(1).max(60).optional(),
});

export async function GET(request: Request) {
  const ip = getClientIp(request) ?? 'anonimo';
  const limit = rateLimit({ key: `availability:${ip}`, limit: 60, windowSeconds: 60 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    servico: url.searchParams.get('servico') ?? undefined,
    de: url.searchParams.get('de') ?? undefined,
    dias: url.searchParams.get('dias') ?? undefined,
  });

  if (!parsed.success) {
    return errorResponse('Parâmetros inválidos.', 400, 'INVALID_QUERY');
  }

  const availability = await getAvailability({
    serviceSlug: parsed.data.servico,
    fromDate: parsed.data.de,
    days: parsed.data.dias ?? 21,
  });

  if (!availability) {
    return errorResponse('Serviço não encontrado ou indisponível para agendamento.', 404, 'SERVICE_NOT_FOUND');
  }

  return NextResponse.json(
    {
      ok: true,
      timezone: availability.timezone,
      service: {
        id: availability.service.id,
        name: availability.service.name,
        slug: availability.service.slug,
        durationMinutes: availability.service.duration_minutes,
      },
      usingFallbackSchedule: availability.usingFallbackSchedule,
      days: availability.days,
    },
    {
      headers: {
        // Nunca cachear: a agenda muda a cada solicitação recebida.
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
