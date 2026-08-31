import { formatDateTime } from '@/lib/utils/format';

/**
 * Templates de e-mail transacional.
 *
 * Regras:
 * - texto e HTML são gerados aqui (sem dependência de provedor);
 * - todo valor dinâmico é escapado antes de entrar no HTML;
 * - nenhum dado de saúde é incluído: apenas serviço, data e horário.
 */

export type EmailTemplateId =
  | 'appointment_request_received_patient'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'payment_approved'
  | 'payment_pending'
  | 'contact_message_received'
  | 'password_recovery_notice';

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(options: { brandName: string; title: string; body: string; footer?: string }) {
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#FBF8F3;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#14211E;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:28px 28px 8px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#265449;font-weight:600;">${escapeHtml(options.brandName)}</p>
      <h1 style="margin:12px 0 0;font-size:22px;line-height:1.25;">${escapeHtml(options.title)}</h1>
    </td></tr>
    <tr><td style="padding:16px 28px 28px;font-size:15px;line-height:1.7;color:#2C3B37;">
      ${options.body}
    </td></tr>
    <tr><td style="padding:18px 28px;background:#F4EFE7;font-size:12px;line-height:1.6;color:#5C6B66;">
      ${options.footer ?? 'Esta é uma mensagem automática. Responda este e-mail se precisar de ajuda.'}
    </td></tr>
  </table>
</body>
</html>`;
}

export interface TemplateContext {
  brandName: string;
  timezone: string;
  siteUrl: string;
  data: Record<string, unknown>;
}

function readString(data: Record<string, unknown>, key: string, fallback = ''): string {
  const value = data[key];
  return typeof value === 'string' ? value : fallback;
}

export function renderEmailTemplate(
  template: EmailTemplateId | string,
  context: TemplateContext,
): EmailContent | null {
  const { brandName, timezone, data } = context;
  const name = readString(data, 'name');
  const service = readString(data, 'service');
  const startsAt = readString(data, 'starts_at');
  const when = startsAt ? formatDateTime(startsAt, timezone) : '';

  switch (template) {
    case 'appointment_request_received_patient':
      return {
        subject: 'Recebemos sua solicitação de agendamento',
        text: `Olá${name ? `, ${name}` : ''}!\n\nRecebemos sua solicitação${service ? ` para ${service}` : ''}${
          when ? ` em ${when}` : ''
        }.\n\nO horário está reservado com status "aguardando confirmação". Você receberá um novo e-mail assim que a agenda for confirmada.\n\n${brandName}`,
        html: layout({
          brandName,
          title: 'Recebemos sua solicitação',
          body: `<p>Olá${name ? `, ${escapeHtml(name)}` : ''}!</p>
<p>Sua solicitação${service ? ` para <strong>${escapeHtml(service)}</strong>` : ''}${
            when ? ` em <strong>${escapeHtml(when)}</strong>` : ''
          } foi registrada.</p>
<p>O horário está reservado com o status <strong>aguardando confirmação</strong>. Assim que a agenda for verificada, você recebe a confirmação por e-mail.</p>`,
        }),
      };

    case 'appointment_confirmed':
      return {
        subject: 'Seu atendimento está confirmado',
        text: `Olá${name ? `, ${name}` : ''}!\n\nSeu atendimento${when ? ` em ${when}` : ''} está confirmado.\n\nSe precisar remarcar, responda este e-mail com antecedência.\n\n${brandName}`,
        html: layout({
          brandName,
          title: 'Atendimento confirmado',
          body: `<p>Olá${name ? `, ${escapeHtml(name)}` : ''}!</p>
<p>Seu atendimento${when ? ` em <strong>${escapeHtml(when)}</strong>` : ''} está confirmado.</p>
<p>Chegue com alguns minutos de antecedência. Se precisar remarcar, responda este e-mail o quanto antes.</p>`,
        }),
      };

    case 'appointment_cancelled':
      return {
        subject: 'Atendimento cancelado',
        text: `Olá${name ? `, ${name}` : ''}.\n\nO atendimento${when ? ` de ${when}` : ''} foi cancelado e o horário voltou a ficar disponível.\n\nSe quiser reagendar, acesse ${context.siteUrl}/agendamento.\n\n${brandName}`,
        html: layout({
          brandName,
          title: 'Atendimento cancelado',
          body: `<p>Olá${name ? `, ${escapeHtml(name)}` : ''}.</p>
<p>O atendimento${when ? ` de <strong>${escapeHtml(when)}</strong>` : ''} foi cancelado.</p>
<p><a href="${escapeHtml(context.siteUrl)}/agendamento" style="color:#1E433B;">Escolher um novo horário</a></p>`,
        }),
      };

    case 'appointment_rescheduled': {
      const from = readString(data, 'from');
      const to = readString(data, 'to');
      return {
        subject: 'Seu atendimento foi reagendado',
        text: `Olá!\n\nSeu atendimento foi reagendado${from ? ` de ${formatDateTime(from, timezone)}` : ''}${
          to ? ` para ${formatDateTime(to, timezone)}` : ''
        }.\n\n${brandName}`,
        html: layout({
          brandName,
          title: 'Atendimento reagendado',
          body: `<p>Seu atendimento foi reagendado${
            from ? ` de <strong>${escapeHtml(formatDateTime(from, timezone))}</strong>` : ''
          }${to ? ` para <strong>${escapeHtml(formatDateTime(to, timezone))}</strong>` : ''}.</p>
<p>Se o novo horário não funcionar, responda este e-mail.</p>`,
        }),
      };
    }

    case 'payment_approved':
      return {
        subject: 'Pagamento confirmado',
        text: `Seu pagamento foi confirmado. O acesso ao material será enviado para este e-mail.\n\n${brandName}`,
        html: layout({
          brandName,
          title: 'Pagamento confirmado',
          body: '<p>Seu pagamento foi confirmado pelo processador. O acesso ao material será enviado para este e-mail.</p>',
        }),
      };

    case 'payment_pending':
      return {
        subject: 'Pagamento em processamento',
        text: `Seu pagamento foi iniciado e está em processamento. Você receberá uma nova mensagem quando for confirmado. Não é necessário pagar novamente.\n\n${brandName}`,
        html: layout({
          brandName,
          title: 'Pagamento em processamento',
          body: '<p>Seu pagamento está em processamento. Você recebe uma nova mensagem quando ele for confirmado.</p><p><strong>Não é necessário pagar novamente.</strong></p>',
        }),
      };

    case 'contact_message_received':
      return {
        subject: 'Recebemos sua mensagem',
        text: `Olá${name ? `, ${name}` : ''}!\n\nRecebemos sua mensagem e responderemos neste e-mail.\n\n${brandName}`,
        html: layout({
          brandName,
          title: 'Recebemos sua mensagem',
          body: `<p>Olá${name ? `, ${escapeHtml(name)}` : ''}!</p><p>Sua mensagem foi recebida e será respondida neste endereço de e-mail.</p>`,
        }),
      };

    default:
      return null;
  }
}
