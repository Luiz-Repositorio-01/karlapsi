import 'server-only';

import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';
import { fieldErrors } from '@/lib/validation/schemas';

/**
 * Utilidades de Route Handler: extração de metadados da requisição e respostas
 * de erro padronizadas.
 *
 * Regra de ouro: nada que vem do navegador é confiável. O IP é usado apenas
 * para rate limiting e é armazenado somente como hash (ver `app.hash_ip`).
 */

export function getClientIp(request: Request): string | undefined {
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip') ?? headers.get('cf-connecting-ip') ?? undefined;
}

export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent')?.slice(0, 400) ?? undefined;
}

/** Erro de validação: 422 com os erros por campo, sem vazar detalhes internos. */
export function validationError(error: ZodError) {
  return NextResponse.json(
    {
      ok: false,
      error: 'VALIDATION_ERROR',
      message: 'Verifique os campos destacados.',
      fields: fieldErrors(error),
    },
    { status: 422 },
  );
}

export function errorResponse(
  message: string,
  status = 400,
  code = 'REQUEST_ERROR',
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ ok: false, error: code, message, ...extra }, { status });
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      ok: false,
      error: 'RATE_LIMITED',
      message: 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.',
    },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  );
}

export function successResponse(data: Record<string, unknown>, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

/** Lê JSON com limite de tamanho, evitando payloads abusivos. */
export async function readJson(request: Request, maxBytes = 32_768): Promise<unknown> {
  const text = await request.text();
  if (text.length > maxBytes) {
    throw new Error('PAYLOAD_TOO_LARGE');
  }
  if (!text) return {};
  return JSON.parse(text);
}
