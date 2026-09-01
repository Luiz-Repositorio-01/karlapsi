import { POST as createPreferenceRoute } from '@/app/api/payments/mercadopago/preference/route';

/**
 * Alias do endpoint antigo `/api/checkout`, citado na documentação da versão
 * anterior. Mantido para não quebrar integrações e links existentes: delega
 * para a implementação canônica em /api/payments/mercadopago/preference.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return createPreferenceRoute(request);
}
