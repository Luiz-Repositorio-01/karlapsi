/**
 * Logger mínimo para servidor.
 *
 * - nunca registra password, tokens, service_role ou authorization;
 * - em produção, evita dumps verbosos;
 * - tags estáveis facilitam filtrar no host (ex.: [webhook], [checkout]).
 */

type LogLevel = 'info' | 'warn' | 'error';

const SENSITIVE_KEY =
  /pass(word)?|secret|token|authorization|service[_-]?role|access[_-]?token|api[_-]?key|cookie|credential/i;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[…]';
  if (value == null) return value;
  if (typeof value === 'string') {
    if (value.length > 400) return `${value.slice(0, 400)}…`;
    return value;
  }
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redact(item, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : redact(entry, depth + 1);
  }
  return out;
}

function write(level: LogLevel, tag: string, message: string, meta?: Record<string, unknown>) {
  const payload = {
    level,
    tag,
    message,
    ...(meta ? { meta: redact(meta) as Record<string, unknown> } : {}),
    ts: new Date().toISOString(),
  };

  const line = `[${tag}] ${message}`;
  if (level === 'error') {
    console.error(line, payload.meta ?? '');
  } else if (level === 'warn') {
    console.warn(line, payload.meta ?? '');
  } else if (process.env.NODE_ENV !== 'production') {
    // info em desenvolvimento: usa warn para respeitar a regra eslint no-console
    console.warn(line, payload.meta ?? '');
  }
}

export const logger = {
  info: (tag: string, message: string, meta?: Record<string, unknown>) =>
    write('info', tag, message, meta),
  warn: (tag: string, message: string, meta?: Record<string, unknown>) =>
    write('warn', tag, message, meta),
  error: (tag: string, message: string, meta?: Record<string, unknown>) =>
    write('error', tag, message, meta),
};
