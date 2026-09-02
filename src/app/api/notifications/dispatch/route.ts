import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/data/public';
import { deliver } from '@/lib/notifications/adapters';
import { isSupabaseAdminConfigured } from '@/lib/env';

/**
 * POST /api/notifications/dispatch — processa a fila de notificações.
 *
 * Projetado para ser chamado por um agendador (cron do provedor de hospedagem,
 * Supabase Scheduled Function ou similar), não por navegador.
 *
 * Segurança: exige `x-cron-secret` ou `Authorization: Bearer` igual a
 * `CRON_SECRET`. Sem essa variável, o endpoint responde 503 e não processa
 * nada — assim não existe endpoint aberto capaz de disparar e-mails.
 */
export const dynamic = 'force-dynamic';

const MAX_BATCH = 25;

function providedSecret(request: Request): string {
  const header = request.headers.get('x-cron-secret');
  if (header) return header;
  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return '';
}

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const provided = providedSecret(request);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

async function handleDispatch(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      {
        ok: false,
        error: 'CRON_SECRET_NOT_CONFIGURED',
        message:
          'Defina CRON_SECRET para habilitar o processamento automático da fila de notificações.',
      },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: 'SUPABASE_ADMIN_NOT_CONFIGURED' }, { status: 503 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'SUPABASE_UNAVAILABLE' }, { status: 503 });
  }

  const settings = await getSiteSettings();

  const { data, error } = await supabase
    .from('notifications')
    .select('id, channel, template, recipient, subject, payload, attempts')
    .eq('status', 'queued')
    .neq('channel', 'internal')
    .lte('scheduled_for', new Date().toISOString())
    .lt('attempts', 5)
    .order('scheduled_for', { ascending: true })
    .limit(MAX_BATCH);

  if (error) {
    console.error('[dispatch] falha ao ler a fila:', error.message);
    return NextResponse.json({ ok: false, error: 'QUEUE_READ_FAILED' }, { status: 500 });
  }

  const queue = (data ?? []) as {
    id: string;
    channel: string;
    template: string;
    recipient: string | null;
    subject: string | null;
    payload: Record<string, unknown>;
    attempts: number;
  }[];

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of queue) {
    const result = await deliver(item.channel, {
      template: item.template,
      recipient: item.recipient,
      subject: item.subject,
      data: item.payload ?? {},
      brandName: settings.identity.brand_name,
      timezone: settings.booking.timezone,
    });

    if (result.status === 'sent') sent += 1;
    else if (result.status === 'failed') failed += 1;
    else skipped += 1;

    await supabase
      .from('notifications')
      .update({
        status: result.status,
        error: result.error ?? null,
        sent_at: result.status === 'sent' ? new Date().toISOString() : null,
        attempts: item.attempts + 1,
      })
      .eq('id', item.id);
  }

  return NextResponse.json({ ok: true, processed: queue.length, sent, failed, skipped });
}

/** O cron da Vercel chama GET com Authorization: Bearer CRON_SECRET. */
export async function GET(request: Request) {
  return handleDispatch(request);
}

export async function POST(request: Request) {
  return handleDispatch(request);
}
