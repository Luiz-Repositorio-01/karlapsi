import type {
  AppointmentOrigin,
  AppointmentStatus,
  ContentStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RequestStatus,
} from '@/lib/types';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export const APPOINTMENT_STATUS: Record<AppointmentStatus, { label: string; tone: Tone }> = {
  requested: { label: 'Solicitado', tone: 'warning' },
  confirmed: { label: 'Confirmado', tone: 'info' },
  awaiting_payment: { label: 'Aguardando pagamento', tone: 'warning' },
  paid: { label: 'Pago', tone: 'success' },
  completed: { label: 'Realizado', tone: 'success' },
  cancelled: { label: 'Cancelado', tone: 'danger' },
  no_show: { label: 'Não compareceu', tone: 'danger' },
  rescheduled: { label: 'Reagendado', tone: 'neutral' },
};

/** Status que ocupam horário na agenda (espelha a exclusion constraint do banco). */
export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'requested',
  'confirmed',
  'awaiting_payment',
  'paid',
  'completed',
];

export const APPOINTMENT_ORIGIN: Record<AppointmentOrigin, string> = {
  public_site: 'Site',
  admin: 'Painel',
  whatsapp: 'WhatsApp',
  phone: 'Telefone',
  import: 'Importação',
  other: 'Outro',
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pendente', tone: 'warning' },
  in_process: { label: 'Em análise', tone: 'info' },
  authorized: { label: 'Autorizado', tone: 'info' },
  approved: { label: 'Recebido', tone: 'success' },
  rejected: { label: 'Recusado', tone: 'danger' },
  cancelled: { label: 'Cancelado', tone: 'neutral' },
  refunded: { label: 'Estornado', tone: 'neutral' },
  charged_back: { label: 'Contestado', tone: 'danger' },
};

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  mercadopago: 'Mercado Pago',
  pix: 'PIX',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  cash: 'Dinheiro',
  bank_transfer: 'Transferência',
  health_insurance: 'Convênio',
  other: 'Outro',
};

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Aguardando pagamento', tone: 'warning' },
  paid: { label: 'Pago', tone: 'success' },
  cancelled: { label: 'Cancelado', tone: 'neutral' },
  refunded: { label: 'Estornado', tone: 'neutral' },
  fulfilled: { label: 'Entregue', tone: 'success' },
};

export const CONTENT_STATUS: Record<ContentStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Rascunho', tone: 'neutral' },
  scheduled: { label: 'Agendado', tone: 'info' },
  published: { label: 'Publicado', tone: 'success' },
  archived: { label: 'Arquivado', tone: 'neutral' },
};

export const REQUEST_STATUS: Record<RequestStatus, { label: string; tone: Tone }> = {
  new: { label: 'Nova', tone: 'warning' },
  in_review: { label: 'Em análise', tone: 'info' },
  accepted: { label: 'Aceita', tone: 'success' },
  declined: { label: 'Recusada', tone: 'danger' },
  archived: { label: 'Arquivada', tone: 'neutral' },
};

/** Mensagens de erro do banco/RPC traduzidas para linguagem humana. */
export const DOMAIN_ERROR_MESSAGES: Record<string, string> = {
  SLOT_TAKEN: 'Este horário acabou de ser reservado. Escolha outro horário disponível.',
  SLOT_TOO_SOON: 'Este horário está muito próximo. Escolha um horário com mais antecedência.',
  SLOT_TOO_FAR: 'Este horário está fora do período liberado para agendamento.',
  SLOT_OUTSIDE_AVAILABILITY: 'Este horário não está mais disponível na agenda.',
  SERVICE_UNAVAILABLE: 'Este serviço não está disponível para agendamento online.',
  CONSENT_REQUIRED: 'É necessário aceitar a política de privacidade para continuar.',
  RATE_LIMITED: 'Recebemos várias solicitações recentes. Aguarde alguns minutos e tente novamente.',
  TOO_MANY_PENDING:
    'Já existe solicitação aguardando confirmação para este e-mail. Aguarde a resposta antes de reservar outro horário.',
  INVALID_EMAIL: 'Informe um e-mail válido.',
  INVALID_PHONE: 'Informe um telefone válido com DDD.',
  INVALID_NAME: 'Informe o nome completo.',
  INVALID_SLOT: 'Selecione um horário válido.',
  FORBIDDEN: 'Você não tem permissão para executar esta ação.',
  APPOINTMENT_NOT_FOUND: 'Atendimento não encontrado.',
};

export function humanizeDomainError(message: string | null | undefined, fallback: string): string {
  if (!message) return fallback;
  for (const [code, text] of Object.entries(DOMAIN_ERROR_MESSAGES)) {
    if (message.includes(code)) return text;
  }
  return fallback;
}
