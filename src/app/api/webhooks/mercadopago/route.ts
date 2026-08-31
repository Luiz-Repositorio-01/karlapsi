import {
  GET as webhookGet,
  POST as webhookPost,
} from '@/app/api/payments/mercadopago/webhook/route';

/**
 * Alias do webhook antigo `/api/webhooks/mercadopago`. Se essa URL já estiver
 * cadastrada no painel do Mercado Pago, continua funcionando: delega para a
 * implementação canônica, que é idempotente.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return webhookPost(request);
}

export async function GET() {
  return webhookGet();
}
