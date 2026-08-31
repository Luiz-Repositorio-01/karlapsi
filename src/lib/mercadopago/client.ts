import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { env, isMercadoPagoConfigured } from '@/lib/env';
import type { PaymentStatus } from '@/lib/types';

/**
 * Integração com o Mercado Pago (Checkout Pro).
 *
 * Arquitetura: navegador → nosso backend → Mercado Pago.
 * O access token vive apenas no servidor (`MERCADOPAGO_ACCESS_TOKEN`) e NUNCA
 * é enviado ao cliente. O navegador recebe somente a `init_point` (URL de
 * checkout) e o `preference_id`.
 *
 * A confirmação de pagamento vem exclusivamente do webhook, com consulta
 * ativa à API do Mercado Pago — nunca de query string de retorno.
 */

const API_BASE = 'https://api.mercadopago.com';

export interface PreferenceItem {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unitPriceCents: number;
}

export interface CreatePreferenceInput {
  externalReference: string;
  items: PreferenceItem[];
  payer: { name: string; email: string; phone?: string };
  /** Idempotência: mesma chave não gera duas preferências. */
  idempotencyKey: string;
  notificationUrl: string;
  backUrls: { success: string; failure: string; pending: string };
  statementDescriptor?: string;
}

export interface CreatePreferenceResult {
  ok: boolean;
  error?: string;
  data?: {
    preferenceId: string;
    checkoutUrl: string;
    sandboxUrl: string | null;
  };
}

export interface MercadoPagoPayment {
  id: string;
  status: string;
  statusDetail: string | null;
  externalReference: string | null;
  amountCents: number;
  paymentMethodId: string | null;
  payerEmail: string | null;
  approvedAt: string | null;
}

async function mpFetch(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<Response> {
  const { idempotencyKey, ...rest } = init;

  return fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${env.mercadoPago.accessToken}`,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
      ...(rest.headers ?? {}),
    },
    cache: 'no-store',
  });
}

export async function createPreference(
  input: CreatePreferenceInput,
): Promise<CreatePreferenceResult> {
  if (!isMercadoPagoConfigured()) {
    return { ok: false, error: 'MERCADOPAGO_NOT_CONFIGURED' };
  }

  const body = {
    external_reference: input.externalReference,
    items: input.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      quantity: item.quantity,
      currency_id: 'BRL',
      unit_price: Number((item.unitPriceCents / 100).toFixed(2)),
    })),
    payer: {
      name: input.payer.name,
      email: input.payer.email,
    },
    back_urls: {
      success: input.backUrls.success,
      failure: input.backUrls.failure,
      pending: input.backUrls.pending,
    },
    auto_return: 'approved',
    notification_url: input.notificationUrl,
    statement_descriptor: input.statementDescriptor?.slice(0, 22),
    binary_mode: false,
  };

  try {
    const response = await mpFetch('/checkout/preferences', {
      method: 'POST',
      body: JSON.stringify(body),
      idempotencyKey: input.idempotencyKey,
    });

    if (!response.ok) {
      // Loga apenas o status e a mensagem — nunca o token nem o corpo completo.
      const detail = await response.text();
      console.error('[mercadopago] falha ao criar preferência', response.status, detail.slice(0, 400));
      return { ok: false, error: `MERCADOPAGO_HTTP_${response.status}` };
    }

    const json = (await response.json()) as {
      id: string;
      init_point?: string;
      sandbox_init_point?: string;
    };

    const checkoutUrl = json.init_point ?? json.sandbox_init_point;
    if (!json.id || !checkoutUrl) {
      return { ok: false, error: 'MERCADOPAGO_INVALID_RESPONSE' };
    }

    return {
      ok: true,
      data: {
        preferenceId: json.id,
        checkoutUrl,
        sandboxUrl: json.sandbox_init_point ?? null,
      },
    };
  } catch (error) {
    console.error('[mercadopago] erro de rede ao criar preferência:', error);
    return { ok: false, error: 'MERCADOPAGO_NETWORK_ERROR' };
  }
}

/** Consulta o pagamento na origem — é esta a fonte de verdade do status. */
export async function getPayment(paymentId: string): Promise<MercadoPagoPayment | null> {
  if (!isMercadoPagoConfigured()) return null;

  try {
    const response = await mpFetch(`/v1/payments/${encodeURIComponent(paymentId)}`);
    if (!response.ok) {
      console.error('[mercadopago] falha ao consultar pagamento', response.status);
      return null;
    }

    const json = (await response.json()) as {
      id: number | string;
      status: string;
      status_detail?: string;
      external_reference?: string;
      transaction_amount?: number;
      payment_method_id?: string;
      payer?: { email?: string };
      date_approved?: string;
    };

    return {
      id: String(json.id),
      status: json.status,
      statusDetail: json.status_detail ?? null,
      externalReference: json.external_reference ?? null,
      amountCents: Math.round((json.transaction_amount ?? 0) * 100),
      paymentMethodId: json.payment_method_id ?? null,
      payerEmail: json.payer?.email ?? null,
      approvedAt: json.date_approved ?? null,
    };
  } catch (error) {
    console.error('[mercadopago] erro de rede ao consultar pagamento:', error);
    return null;
  }
}

/**
 * Valida a assinatura da notificação (header `x-signature`).
 *
 * Manifesto conforme documentação do Mercado Pago:
 *   id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 *
 * Sem `MERCADOPAGO_WEBHOOK_SECRET` configurado, retorna `null` (indefinido):
 * o webhook então NÃO confia no payload e faz a consulta ativa na API antes de
 * gravar qualquer coisa.
 */
export function verifyWebhookSignature(options: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
}): boolean | null {
  const secret = env.mercadoPago.webhookSecret;
  if (!secret) return null;
  if (!options.signatureHeader || !options.dataId) return false;

  const parts = options.signatureHeader.split(',').reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${options.dataId.toLowerCase()};${
    options.requestId ? `request-id:${options.requestId};` : ''
  }ts:${ts};`;

  const expected = createHmac('sha256', secret).update(manifest).digest('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(v1, 'hex');
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

/** Mapeia o status do Mercado Pago para o enum interno. */
export function mapPaymentStatus(status: string): PaymentStatus {
  switch (status) {
    case 'approved':
      return 'approved';
    case 'authorized':
      return 'authorized';
    case 'in_process':
    case 'in_mediation':
      return 'in_process';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
      return 'cancelled';
    case 'refunded':
      return 'refunded';
    case 'charged_back':
      return 'charged_back';
    case 'pending':
    default:
      return 'pending';
  }
}

/** Status do pedido derivado do status do pagamento. */
export function mapOrderStatus(status: PaymentStatus) {
  switch (status) {
    case 'approved':
    case 'authorized':
      return 'paid' as const;
    case 'refunded':
      return 'refunded' as const;
    case 'cancelled':
    case 'rejected':
      return 'cancelled' as const;
    default:
      return 'pending' as const;
  }
}
