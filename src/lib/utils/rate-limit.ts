import 'server-only';

/**
 * Rate limiting em memória (janela fixa).
 *
 * É a PRIMEIRA barreira, propositalmente simples e sem dependência externa.
 * Em ambiente com várias instâncias o contador é por instância — por isso o
 * limite definitivo é aplicado no banco, dentro das funções SECURITY DEFINER
 * (`create_appointment_request`, `submit_contact_message`), que contam as
 * requisições reais por e-mail/IP na última hora.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(options: {
  key: string;
  limit: number;
  windowSeconds: number;
}): RateLimitResult {
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;

  // Limpeza oportunista para o mapa não crescer indefinidamente.
  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }

  const existing = buckets.get(options.key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(options.key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: options.limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: options.limit - existing.count,
    retryAfterSeconds: 0,
  };
}
