import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Mercado Pago: mapeamento de status e validação da assinatura do webhook.
 *
 * `src/lib/env.ts` lê as variáveis de ambiente no momento da importação; por
 * isso cada teste ajusta `process.env` e recarrega o módulo com
 * `vi.resetModules()`.
 */

const ORIGINAL_ENV = { ...process.env };

async function loadClient() {
  vi.resetModules();
  return import('@/lib/mercadopago/client');
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('mapPaymentStatus', () => {
  it('traduz os status do provedor para o enum interno', async () => {
    const { mapPaymentStatus } = await loadClient();

    expect(mapPaymentStatus('approved')).toBe('approved');
    expect(mapPaymentStatus('authorized')).toBe('authorized');
    expect(mapPaymentStatus('in_process')).toBe('in_process');
    expect(mapPaymentStatus('in_mediation')).toBe('in_process');
    expect(mapPaymentStatus('rejected')).toBe('rejected');
    expect(mapPaymentStatus('cancelled')).toBe('cancelled');
    expect(mapPaymentStatus('refunded')).toBe('refunded');
    expect(mapPaymentStatus('charged_back')).toBe('charged_back');
    expect(mapPaymentStatus('pending')).toBe('pending');
  });

  it('trata status desconhecido como pendente (nunca como aprovado)', async () => {
    const { mapPaymentStatus } = await loadClient();
    expect(mapPaymentStatus('algo_novo_do_provedor')).toBe('pending');
  });
});

describe('mapOrderStatus', () => {
  it('marca o pedido como pago apenas com aprovação ou autorização', async () => {
    const { mapOrderStatus } = await loadClient();

    expect(mapOrderStatus('approved')).toBe('paid');
    expect(mapOrderStatus('authorized')).toBe('paid');
    expect(mapOrderStatus('pending')).toBe('pending');
    expect(mapOrderStatus('in_process')).toBe('pending');
    expect(mapOrderStatus('rejected')).toBe('cancelled');
    expect(mapOrderStatus('cancelled')).toBe('cancelled');
    expect(mapOrderStatus('refunded')).toBe('refunded');
  });
});

describe('verifyWebhookSignature', () => {
  const SECRET = 'segredo-de-teste';
  const dataId = '123456789';
  const requestId = 'req-abc';
  const ts = '1700000000';

  function sign(manifest: string): string {
    return createHmac('sha256', SECRET).update(manifest).digest('hex');
  }

  it('retorna null quando não há segredo configurado (webhook consulta a API)', async () => {
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const { verifyWebhookSignature } = await loadClient();

    expect(
      verifyWebhookSignature({ signatureHeader: 'ts=1,v1=abc', requestId, dataId }),
    ).toBeNull();
  });

  it('valida assinatura correta', async () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;
    const { verifyWebhookSignature } = await loadClient();

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const header = `ts=${ts},v1=${sign(manifest)}`;

    expect(verifyWebhookSignature({ signatureHeader: header, requestId, dataId })).toBe(true);
  });

  it('recusa assinatura adulterada', async () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;
    const { verifyWebhookSignature } = await loadClient();

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const tampered = sign(manifest).replace(/^./, (char) => (char === 'a' ? 'b' : 'a'));

    expect(
      verifyWebhookSignature({ signatureHeader: `ts=${ts},v1=${tampered}`, requestId, dataId }),
    ).toBe(false);
  });

  it('recusa quando o id do pagamento é diferente do assinado', async () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;
    const { verifyWebhookSignature } = await loadClient();

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const header = `ts=${ts},v1=${sign(manifest)}`;

    expect(
      verifyWebhookSignature({ signatureHeader: header, requestId, dataId: '999999' }),
    ).toBe(false);
  });

  it('recusa header ausente ou malformado', async () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;
    const { verifyWebhookSignature } = await loadClient();

    expect(verifyWebhookSignature({ signatureHeader: null, requestId, dataId })).toBe(false);
    expect(verifyWebhookSignature({ signatureHeader: 'invalido', requestId, dataId })).toBe(false);
    expect(verifyWebhookSignature({ signatureHeader: `ts=${ts}`, requestId, dataId })).toBe(false);
  });

  it('recusa quando falta o id do pagamento', async () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;
    const { verifyWebhookSignature } = await loadClient();

    expect(
      verifyWebhookSignature({ signatureHeader: `ts=${ts},v1=abc`, requestId, dataId: null }),
    ).toBe(false);
  });
});

describe('createPreference sem credencial', () => {
  it('falha de forma controlada, sem lançar exceção', async () => {
    delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    const { createPreference } = await loadClient();

    const result = await createPreference({
      externalReference: 'KN-teste',
      idempotencyKey: 'KN-teste',
      items: [{ id: 'x', title: 'Material', quantity: 1, unitPriceCents: 1990 }],
      payer: { name: 'Ana', email: 'ana@example.com' },
      notificationUrl: 'https://exemplo.com/webhook',
      backUrls: {
        success: 'https://exemplo.com/ok',
        failure: 'https://exemplo.com/erro',
        pending: 'https://exemplo.com/pendente',
      },
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('MERCADOPAGO_NOT_CONFIGURED');
  });
});
