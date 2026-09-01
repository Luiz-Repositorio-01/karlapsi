import { randomUUID } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getProductBySlug, getSiteSettings } from '@/lib/data/public';
import { createPreference } from '@/lib/mercadopago/client';
import { checkoutSchema } from '@/lib/validation/schemas';
import { env, isMercadoPagoConfigured, isSupabaseAdminConfigured } from '@/lib/env';
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
 * POST /api/payments/mercadopago/preference
 *
 * Fluxo: navegador → esta rota → Mercado Pago.
 * O access token nunca sai do servidor. O pedido e a cobrança são criados
 * ANTES do redirecionamento, com `external_reference` único, para que o
 * webhook consiga conciliar de forma idempotente.
 *
 * O pedido nasce com status `pending` e SÓ é considerado pago quando o webhook
 * confirma o pagamento consultando a API do Mercado Pago.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit({ key: `checkout:${ip ?? 'anonimo'}`, limit: 10, windowSeconds: 600 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  if (!isMercadoPagoConfigured()) {
    return errorResponse(
      'O pagamento online ainda não está ativo. Fale com a equipe para receber as instruções de pagamento.',
      503,
      'MERCADOPAGO_NOT_CONFIGURED',
    );
  }

  if (!isSupabaseAdminConfigured()) {
    return errorResponse(
      'O registro de pedidos ainda não está configurado neste ambiente.',
      503,
      'SUPABASE_ADMIN_NOT_CONFIGURED',
    );
  }

  let payload: unknown;
  try {
    payload = await readJson(request);
  } catch {
    return errorResponse('Requisição inválida.', 400, 'INVALID_PAYLOAD');
  }

  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  // O preço vem SEMPRE do banco — nunca do que o navegador enviou.
  const product = await getProductBySlug(parsed.data.productSlug);
  if (!product || !product.is_active) {
    return errorResponse('Material não encontrado ou indisponível.', 404, 'PRODUCT_NOT_FOUND');
  }
  if (product.is_free || product.price_cents <= 0) {
    return errorResponse('Este material é gratuito e não exige pagamento.', 400, 'PRODUCT_IS_FREE');
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return errorResponse('Serviço temporariamente indisponível.', 503, 'SUPABASE_UNAVAILABLE');
  }

  const quantity = parsed.data.quantity;
  const totalCents = product.price_cents * quantity;
  const externalReference = `KN-${randomUUID()}`;
  const settings = await getSiteSettings();

  // 1. Pedido
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: parsed.data.customerName,
      customer_email: parsed.data.customerEmail,
      customer_phone: parsed.data.customerPhone ?? null,
      status: 'pending',
      subtotal_cents: totalCents,
      total_cents: totalCents,
      external_reference: externalReference,
      consent_accepted: true,
      metadata: { product_slug: product.slug, quantity },
    })
    .select('id, order_number')
    .single();

  if (orderError || !orderData) {
    console.error('[checkout] falha ao criar pedido:', orderError?.message);
    return errorResponse('Não foi possível iniciar o pagamento.', 500, 'ORDER_CREATE_FAILED');
  }

  const order = orderData as { id: string; order_number: string };

  // 2. Itens do pedido
  const { error: itemsError } = await supabase.from('order_items').insert({
    order_id: order.id,
    product_id: product.id,
    name_snapshot: product.name,
    unit_price_cents: product.price_cents,
    quantity,
    total_cents: totalCents,
  });

  if (itemsError) {
    console.error('[checkout] falha ao criar itens do pedido:', itemsError.message);
  }

  // 3. Cobrança pendente (conciliada depois pelo webhook)
  const { data: paymentData, error: paymentError } = await supabase
    .from('payments')
    .insert({
      order_id: order.id,
      description: `${product.name} (pedido ${order.order_number})`,
      amount_cents: totalCents,
      status: 'pending',
      method: 'mercadopago',
      provider: 'mercadopago',
      metadata: { external_reference: externalReference },
    })
    .select('id')
    .single();

  if (paymentError || !paymentData) {
    console.error('[checkout] falha ao criar cobrança:', paymentError?.message);
    return errorResponse('Não foi possível iniciar o pagamento.', 500, 'PAYMENT_CREATE_FAILED');
  }

  const payment = paymentData as { id: string };

  // 4. Preferência no Mercado Pago
  const preference = await createPreference({
    externalReference,
    idempotencyKey: externalReference,
    items: [
      {
        id: product.slug,
        title: product.name,
        description: product.summary ?? undefined,
        quantity,
        unitPriceCents: product.price_cents,
      },
    ],
    payer: {
      name: parsed.data.customerName,
      email: parsed.data.customerEmail,
      phone: parsed.data.customerPhone,
    },
    notificationUrl: new URL('/api/payments/mercadopago/webhook', env.siteUrl).toString(),
    backUrls: {
      success: new URL(`/pagamento/sucesso?pedido=${order.order_number}`, env.siteUrl).toString(),
      failure: new URL(`/pagamento/erro?pedido=${order.order_number}`, env.siteUrl).toString(),
      pending: new URL(`/pagamento/pendente?pedido=${order.order_number}`, env.siteUrl).toString(),
    },
    statementDescriptor: settings.identity.brand_name,
  });

  if (!preference.ok || !preference.data) {
    await supabase
      .from('payments')
      .update({ status: 'cancelled', metadata: { error: preference.error } })
      .eq('id', payment.id);
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);

    return errorResponse(
      'Não foi possível abrir o checkout agora. Tente novamente em alguns instantes.',
      502,
      'MERCADOPAGO_PREFERENCE_FAILED',
    );
  }

  await supabase
    .from('payments')
    .update({
      provider_preference_id: preference.data.preferenceId,
      checkout_url: preference.data.checkoutUrl,
    })
    .eq('id', payment.id);

  return successResponse({
    orderNumber: order.order_number,
    checkoutUrl: preference.data.checkoutUrl,
    preferenceId: preference.data.preferenceId,
  });
}
