import 'server-only';

import { env, isEmailConfigured, isWhatsAppApiConfigured } from '@/lib/env';
import { renderEmailTemplate } from '@/lib/email/templates';

/**
 * Adaptadores de entrega de notificação.
 *
 * Cada canal implementa a mesma interface. Sem credencial configurada, o
 * adaptador informa `skipped` com o motivo — a mensagem permanece na fila do
 * banco e nada é perdido nem inventado.
 *
 * Provedores de e-mail suportados hoje: Resend e Brevo (ambos por HTTP, sem
 * SDK). Para adicionar outro, basta um novo `case` em `sendEmail`.
 */

export interface DeliveryResult {
  status: 'sent' | 'failed' | 'skipped';
  error?: string;
}

export interface NotificationPayload {
  template: string;
  recipient: string | null;
  subject: string | null;
  data: Record<string, unknown>;
  brandName: string;
  timezone: string;
}

async function sendWithResend(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<DeliveryResult> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.email.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.email.from,
      to: [options.to],
      subject: options.subject,
      text: options.text,
      html: options.html,
    }),
  });

  if (!response.ok) {
    // Corpo do erro não é logado por completo para evitar vazar dados.
    return { status: 'failed', error: `RESEND_HTTP_${response.status}` };
  }
  return { status: 'sent' };
}

async function sendWithBrevo(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<DeliveryResult> {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.email.apiKey!,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: env.email.from },
      to: [{ email: options.to }],
      subject: options.subject,
      textContent: options.text,
      htmlContent: options.html,
    }),
  });

  if (!response.ok) {
    return { status: 'failed', error: `BREVO_HTTP_${response.status}` };
  }
  return { status: 'sent' };
}

export async function sendEmail(payload: NotificationPayload): Promise<DeliveryResult> {
  if (!payload.recipient) {
    return { status: 'skipped', error: 'SEM_DESTINATARIO' };
  }

  if (!isEmailConfigured()) {
    return { status: 'skipped', error: 'EMAIL_NAO_CONFIGURADO' };
  }

  const content = renderEmailTemplate(payload.template, {
    brandName: payload.brandName,
    timezone: payload.timezone,
    siteUrl: env.siteUrl,
    data: payload.data,
  });

  if (!content) {
    return { status: 'skipped', error: `TEMPLATE_DESCONHECIDO:${payload.template}` };
  }

  const message = {
    to: payload.recipient,
    subject: payload.subject ?? content.subject,
    text: content.text,
    html: content.html,
  };

  try {
    switch (env.email.provider) {
      case 'resend':
        return await sendWithResend(message);
      case 'brevo':
        return await sendWithBrevo(message);
      case 'log':
        // Modo de desenvolvimento: registra o assunto, nunca o corpo.
        console.warn(`[email:log] para=${message.to} assunto="${message.subject}"`);
        return { status: 'skipped', error: 'PROVIDER_LOG' };
      default:
        return { status: 'skipped', error: `PROVIDER_DESCONHECIDO:${env.email.provider}` };
    }
  } catch (error) {
    console.error('[email] falha de rede no envio:', error);
    return { status: 'failed', error: 'ERRO_DE_REDE' };
  }
}

/**
 * WhatsApp via Cloud API (Meta).
 *
 * Requer template aprovado pela Meta para mensagens iniciadas pelo negócio;
 * por isso o adaptador envia o template pelo nome configurado no payload e não
 * texto livre. Sem credenciais, retorna `skipped`.
 */
export async function sendWhatsApp(payload: NotificationPayload): Promise<DeliveryResult> {
  if (!payload.recipient) return { status: 'skipped', error: 'SEM_DESTINATARIO' };

  if (!isWhatsAppApiConfigured()) {
    return { status: 'skipped', error: 'WHATSAPP_NAO_CONFIGURADO' };
  }

  const phone = payload.recipient.replace(/\D/g, '');

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${env.whatsapp.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.whatsapp.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: payload.template,
            language: { code: 'pt_BR' },
          },
        }),
      },
    );

    if (!response.ok) {
      return { status: 'failed', error: `WHATSAPP_HTTP_${response.status}` };
    }
    return { status: 'sent' };
  } catch (error) {
    console.error('[whatsapp] falha de rede no envio:', error);
    return { status: 'failed', error: 'ERRO_DE_REDE' };
  }
}

/** Push: estrutura pronta; nenhum provedor conectado ainda. */
export async function sendPush(_payload: NotificationPayload): Promise<DeliveryResult> {
  return { status: 'skipped', error: 'PUSH_NAO_CONFIGURADO' };
}

export async function deliver(
  channel: string,
  payload: NotificationPayload,
): Promise<DeliveryResult> {
  switch (channel) {
    case 'email':
      return sendEmail(payload);
    case 'whatsapp':
      return sendWhatsApp(payload);
    case 'push':
      return sendPush(payload);
    case 'internal':
      // Avisos internos são exibidos no painel; não há entrega externa.
      return { status: 'skipped', error: 'CANAL_INTERNO' };
    default:
      return { status: 'skipped', error: `CANAL_DESCONHECIDO:${channel}` };
  }
}
