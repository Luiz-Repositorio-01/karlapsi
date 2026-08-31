import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import {
  getPayment,
  mapOrderStatus,
  mapPaymentStatus,
  verifyWebhookSignature,
} from '@/lib/mercadopago/client';
import { isMercadoPagoConfigured, isSupabaseAdminConfigured } from '@/lib/env';

/**
 * POST /api/payments/mercadopago/webhook
 *
 * Regras aplicadas (nesta ordem):
 * 1. Assinatura `x-signature` validada por HMAC quando
 *    MERCADOPAGO_WEBHOOK_SECRET está configurado. Assinatura inválida → 401,
 *    sem tocar no banco.
 * 2. O corpo da notificação NÃO é fonte de verdade. O status é obtido
 *    consultando a API do Mercado Pago com o `payment_id` recebido.
 * 3. Idempotência garantida por índice único em
 *    `payment_events (provider, event_key)`: reentrega do mesmo evento é
 *    reconhecida e ignorada, respondendo 200.
 * 4. Sempre responde 200 para eventos já processados ou irrelevantes, para o
 *    Mercado Pago não reenfileirar indefinidamente.
 *
 * Nada de token, dado de cartão ou payload bruto sensível vai para os logs.
 */
export const dynamic = 'force-dynamic';

interface WebhookBody {
  id?: number | string;
  type?: string;
  action?: string;
  data?: { id?: number | string };
  date_created?: string;
}

export async function POST(request: Request) {
  if (!isMercadoPagoConfigured() || !isSupabaseAdminConfigured()) {
    // 503 faz o Mercado Pago tentar novamente quando o ambiente estiver pronto.
    return NextResponse.json({ ok: false, error: 'NOT_CONFIGURED' }, { status: 503 });
  }

  const rawBody = await request.text();
  if (rawBody.length > 65_536) {
    return NextResponse.json({ ok: false, error: 'PAYLOAD_TOO_LARGE' }, { status: 413 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody || '{}') as WebhookBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const url = new URL(request.url);
  const dataId =
    body.data?.id !== undefined
      ? String(body.data.id)
      : (url.searchParams.get('data.id') ?? url.searchParams.get('id'));

  const signatureCheck = verifyWebhookSignature({
    signatureHeader: request.headers.get('x-signature'),
    requestId: request.headers.get('x-request-id'),
    dataId,
  });

  if (signatureCheck === false) {
    console.error('[webhook] assinatura inválida — evento descartado');
    return NextResponse.json({ ok: false, error: 'INVALID_SIGNATURE' }, { status: 401 });
  }

  const topic = body.type ?? url.searchParams.get('type') ?? url.searchParams.get('topic');

  // Só pagamentos interessam; os demais tópicos são confirmados e ignorados.
  if (topic && topic !== 'payment') {
    return NextResponse.json({ ok: true, ignored: topic });
  }

  if (!dataId) {
    return NextResponse.json({ ok: true, ignored: 'missing-data-id' });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'SUPABASE_UNAVAILABLE' }, { status: 503 });
  }

  // Chave de idempotência: identifica o evento de forma estável.
  const eventKey = `payment:${dataId}:${body.action ?? topic ?? 'update'}:${body.id ?? 'sem-id'}`;

  const { error: eventInsertError } = await supabase.from('payment_events').insert({
    provider: 'mercadopago',
    event_key: eventKey,
    event_type: body.action ?? topic ?? 'payment',
    signature_valid: signatureCheck,
    payload: {
      // Payload sanitizado: apenas o necessário para auditoria.
      data_id: dataId,
      action: body.action ?? null,
      type: topic ?? null,
      date_created: body.date_created ?? null,
    },
  });

  if (eventInsertError) {
    // 23505 = unique_violation → evento já processado antes.
    if (eventInsertError.code === '23505') {
      return NextResponse.json({ ok: true, duplicated: true });
    }
    console.error('[webhook] falha ao registrar evento:', eventInsertError.message);
    return NextResponse.json({ ok: false, error: 'EVENT_LOG_FAILED' }, { status: 500 });
  }

  // Consulta ativa: o status real vem da API, não do corpo da notificação.
  const mpPayment = await getPayment(dataId);

  if (!mpPayment) {
    await supabase
      .from('payment_events')
      .update({ error: 'PAYMENT_NOT_FOUND', processed_at: new Date().toISOString() })
      .eq('event_key', eventKey)
      .eq('provider', 'mercadopago');

    // 200 evita reenfileiramento infinito de um id inexistente.
    return NextResponse.json({ ok: true, ignored: 'payment-not-found' });
  }

  const status = mapPaymentStatus(mpPayment.status);
  const externalReference = mpPayment.externalReference;

  // Localiza a cobrança: primeiro pelo id do provedor, depois pelo pedido.
  let paymentId: string | null = null;

  const { data: byProvider } = await supabase
    .from('payments')
    .select('id')
    .eq('provider', 'mercadopago')
    .eq('provider_payment_id', mpPayment.id)
    .maybeSingle();

  if (byProvider) {
    paymentId = (byProvider as { id: string }).id;
  } else if (externalReference) {
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('external_reference', externalReference)
      .maybeSingle();

    if (order) {
      const { data: orderPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('order_id', (order as { id: string }).id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (orderPayment) paymentId = (orderPayment as { id: string }).id;
    }
  }

  if (!paymentId) {
    await supabase
      .from('payment_events')
      .update({ error: 'PAYMENT_RECORD_NOT_FOUND', processed_at: new Date().toISOString() })
      .eq('event_key', eventKey)
      .eq('provider', 'mercadopago');

    return NextResponse.json({ ok: true, ignored: 'unknown-payment' });
  }

  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status,
      provider_payment_id: mpPayment.id,
      provider_status: mpPayment.status,
      method: 'mercadopago',
      paid_at: mpPayment.approvedAt,
    })
    .eq('id', paymentId);

  if (updateError) {
    console.error('[webhook] falha ao atualizar cobrança:', updateError.message);
    return NextResponse.json({ ok: false, error: 'PAYMENT_UPDATE_FAILED' }, { status: 500 });
  }

  // Reflete no pedido e no atendimento vinculado, quando existirem.
  const { data: paymentRow } = await supabase
    .from('payments')
    .select('order_id, appointment_id, amount_cents')
    .eq('id', paymentId)
    .maybeSingle();

  const relation = paymentRow as
    | { order_id: string | null; appointment_id: string | null; amount_cents: number }
    | null;

  if (relation?.order_id) {
    await supabase
      .from('orders')
      .update({ status: mapOrderStatus(status) })
      .eq('id', relation.order_id);
  }

  if (relation?.appointment_id && (status === 'approved' || status === 'authorized')) {
    await supabase
      .from('appointments')
      .update({ status: 'paid', payment_method: 'mercadopago' })
      .eq('id', relation.appointment_id)
      .in('status', ['requested', 'confirmed', 'awaiting_payment']);
  }

  await supabase.from('payment_events').update({
    payment_id: paymentId,
    provider_status: mpPayment.status,
    processed_at: new Date().toISOString(),
  })
    .eq('event_key', eventKey)
    .eq('provider', 'mercadopago');

  await supabase.from('notifications').insert({
    channel: 'internal',
    template: status === 'approved' ? 'payment_approved' : 'payment_status_changed',
    subject: status === 'approved' ? 'Pagamento aprovado' : 'Status de pagamento atualizado',
    payload: { status, amount_cents: relation?.amount_cents ?? mpPayment.amountCents },
    related_table: 'payments',
    related_id: paymentId,
  });

  return NextResponse.json({ ok: true, status });
}

/** O Mercado Pago faz uma checagem GET na URL configurada. */
export async function GET() {
  return NextResponse.json({ ok: true, service: 'mercadopago-webhook' });
}
