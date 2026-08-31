/**
 * Acesso centralizado às variáveis de ambiente.
 *
 * Regras:
 * - Nada de segredo com prefixo NEXT_PUBLIC_ (só chaves públicas por definição).
 * - A aplicação NUNCA quebra por falta de credencial: cada integração expõe um
 *   `isConfigured` e o sistema degrada com mensagens claras em vez de erro 500.
 */

function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export const env = {
  siteUrl:
    read('NEXT_PUBLIC_SITE_URL') ??
    (read('VERCEL_URL') ? `https://${read('VERCEL_URL')}` : undefined) ??
    'http://localhost:3000',

  supabase: {
    url: read('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: read('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    /** Server-only. Nunca importar em Client Component. */
    serviceRoleKey: read('SUPABASE_SERVICE_ROLE_KEY'),
  },

  mercadoPago: {
    accessToken: read('MERCADOPAGO_ACCESS_TOKEN'),
    publicKey: read('NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY') ?? read('MERCADOPAGO_PUBLIC_KEY'),
    webhookSecret: read('MERCADOPAGO_WEBHOOK_SECRET'),
  },

  email: {
    provider: read('EMAIL_PROVIDER') ?? 'log',
    apiKey: read('EMAIL_API_KEY'),
    from: read('EMAIL_FROM'),
    internalRecipient: read('EMAIL_INTERNAL_RECIPIENT'),
  },

  whatsapp: {
    /** Número público para o botão "Falar pelo WhatsApp" (não é credencial). */
    number: read('NEXT_PUBLIC_WHATSAPP'),
    /** Credenciais da Cloud API — opcionais; adaptador fica inativo sem elas. */
    apiToken: read('WHATSAPP_API_TOKEN'),
    phoneNumberId: read('WHATSAPP_PHONE_NUMBER_ID'),
  },
} as const;

/** Supabase disponível para leitura pública (anon key). */
export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabase.url && env.supabase.anonKey);
}

/** Operações privilegiadas de servidor (webhooks, conciliação). */
export function isSupabaseAdminConfigured(): boolean {
  return Boolean(env.supabase.url && env.supabase.serviceRoleKey);
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(env.mercadoPago.accessToken);
}

export function isEmailConfigured(): boolean {
  return Boolean(env.email.apiKey && env.email.from);
}

export function isWhatsAppApiConfigured(): boolean {
  return Boolean(env.whatsapp.apiToken && env.whatsapp.phoneNumberId);
}

/** Diagnóstico exibido em /admin/configuracoes (nunca mostra valores). */
export function integrationStatus() {
  return [
    {
      id: 'supabase',
      label: 'Supabase (banco, auth e storage)',
      configured: isSupabaseConfigured(),
      variables: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
      required: true,
    },
    {
      id: 'supabase-admin',
      label: 'Supabase service role (webhooks e conciliação)',
      configured: isSupabaseAdminConfigured(),
      variables: ['SUPABASE_SERVICE_ROLE_KEY'],
      required: true,
    },
    {
      id: 'mercadopago',
      label: 'Mercado Pago (checkout e webhook)',
      configured: isMercadoPagoConfigured(),
      variables: ['MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_WEBHOOK_SECRET'],
      required: false,
    },
    {
      id: 'email',
      label: 'E-mail transacional',
      configured: isEmailConfigured(),
      variables: ['EMAIL_PROVIDER', 'EMAIL_API_KEY', 'EMAIL_FROM'],
      required: false,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Cloud API (envio automático)',
      configured: isWhatsAppApiConfigured(),
      variables: ['WHATSAPP_API_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'],
      required: false,
    },
  ];
}
