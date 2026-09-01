import { Bell, Inbox, Mail, MessageSquare } from 'lucide-react';
import { Alert, Badge, Card, EmptyState } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { StatusBadge } from '@/components/admin/ui';
import { ActionButton, SimpleAction } from '@/components/admin/forms';
import { requirePermission } from '@/lib/auth/session';
import { listContactMessages, listNotifications } from '@/lib/data/admin';
import {
  markAllNotificationsRead,
  markNotificationRead,
  updateRequestStatus,
} from '@/app/admin/_actions/content';
import { isEmailConfigured, isWhatsAppApiConfigured } from '@/lib/env';
import { REQUEST_STATUS } from '@/lib/utils/labels';
import { formatDateTime, formatPhone } from '@/lib/utils/format';

const TEMPLATE_LABELS: Record<string, string> = {
  appointment_request_received: 'Nova solicitação de agendamento',
  appointment_request_received_patient: 'Confirmação de recebimento ao paciente',
  appointment_confirmed: 'Atendimento confirmado',
  appointment_cancelled: 'Atendimento cancelado',
  appointment_rescheduled: 'Atendimento reagendado',
  contact_message_received: 'Nova mensagem de contato',
  data_subject_request_received: 'Solicitação LGPD recebida',
  payment_approved: 'Pagamento aprovado',
  payment_status_changed: 'Status de pagamento alterado',
};

export default async function NotificacoesPage() {
  await requirePermission('notifications:view', '/admin/notificacoes');

  const [notificationsResult, messagesResult] = await Promise.all([
    listNotifications(60),
    listContactMessages(30),
  ]);

  const internal = notificationsResult.data.filter((item) => item.channel === 'internal');
  const outbox = notificationsResult.data.filter((item) => item.channel !== 'internal');
  const unread = internal.filter((item) => !item.read_at);

  return (
    <>
      <AdminPageHeader
        title="Notificações"
        description="Avisos internos, fila de envios e mensagens recebidas pelo site."
        actions={
          unread.length > 0 ? (
            <SimpleAction action={markAllNotificationsRead} label="Marcar todas como lidas" />
          ) : undefined
        }
      />

      <Alert tone="info" title="Como os envios funcionam" className="mb-6">
        <p>
          Os eventos são gravados em uma fila no banco (padrão <em>outbox</em>). A entrega é feita
          por adaptadores configuráveis:
        </p>
        <ul className="mt-2 space-y-1">
          <li>
            <strong>E-mail:</strong>{' '}
            {isEmailConfigured()
              ? 'configurado e ativo'
              : 'aguardando EMAIL_PROVIDER, EMAIL_API_KEY e EMAIL_FROM'}
          </li>
          <li>
            <strong>WhatsApp:</strong>{' '}
            {isWhatsAppApiConfigured()
              ? 'Cloud API configurada'
              : 'adaptador pronto, aguardando WHATSAPP_API_TOKEN e WHATSAPP_PHONE_NUMBER_ID'}
          </li>
          <li>
            <strong>Push:</strong> estrutura pronta; nenhum provedor conectado.
          </li>
        </ul>
        <p className="mt-2">
          Sem provedor configurado, os eventos ficam registrados na fila (nada é perdido) e aparecem
          aqui para acompanhamento manual.
        </p>
      </Alert>

      <div className="grid gap-8 xl:grid-cols-2">
        <section aria-labelledby="internas-title">
          <div className="mb-3 flex items-center gap-3">
            <h2 id="internas-title" className="font-display text-lg text-ink">
              Avisos internos
            </h2>
            {unread.length > 0 ? <Badge tone="warning">{unread.length} não lidos</Badge> : null}
          </div>

          {internal.length === 0 ? (
            <EmptyState
              icon={<Bell aria-hidden="true" className="h-5 w-5" />}
              title="Nenhum aviso"
              description="Novas solicitações, pagamentos e mensagens geram avisos aqui."
            />
          ) : (
            <ul className="space-y-3">
              {internal.map((notification) => (
                <li key={notification.id}>
                  <Card className={notification.read_at ? 'p-4' : 'bg-amber-50/50 p-4 ring-amber-200'}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">
                          {notification.subject ??
                            TEMPLATE_LABELS[notification.template] ??
                            notification.template}
                        </p>
                        <p className="mt-1 text-xs text-ink-faint">
                          {formatDateTime(notification.created_at)}
                          {notification.related_table ? ` · ${notification.related_table}` : ''}
                        </p>
                      </div>
                      {!notification.read_at ? (
                        <ActionButton
                          action={markNotificationRead}
                          label="Marcar lida"
                          variant="ghost"
                          fields={{ notificationId: notification.id }}
                        />
                      ) : (
                        <Badge>Lida</Badge>
                      )}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="fila-title">
          <h2 id="fila-title" className="mb-3 font-display text-lg text-ink">
            Fila de envios
          </h2>

          {outbox.length === 0 ? (
            <EmptyState
              icon={<Mail aria-hidden="true" className="h-5 w-5" />}
              title="Fila vazia"
              description="E-mails e mensagens enfileirados aparecem aqui com o resultado do envio."
            />
          ) : (
            <ul className="space-y-3">
              {outbox.map((notification) => (
                <li key={notification.id}>
                  <Card className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">
                          {TEMPLATE_LABELS[notification.template] ?? notification.template}
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                          {notification.recipient ?? 'sem destinatário'}
                        </p>
                        <p className="mt-1 text-xs text-ink-faint">
                          {notification.channel} · {formatDateTime(notification.created_at)}
                        </p>
                        {notification.error ? (
                          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
                            {notification.error}
                          </p>
                        ) : null}
                      </div>
                      <Badge
                        tone={
                          notification.status === 'sent'
                            ? 'success'
                            : notification.status === 'failed'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {notification.status === 'queued'
                          ? 'na fila'
                          : notification.status === 'sent'
                            ? 'enviado'
                            : notification.status === 'failed'
                              ? 'falhou'
                              : 'ignorado'}
                      </Badge>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="mensagens-title" className="mt-10">
        <h2 id="mensagens-title" className="mb-3 flex items-center gap-2 font-display text-lg text-ink">
          <MessageSquare aria-hidden="true" className="h-4 w-4 text-petrol-500" />
          Mensagens do formulário de contato
        </h2>

        {messagesResult.data.length === 0 ? (
          <EmptyState
            icon={<Inbox aria-hidden="true" className="h-5 w-5" />}
            title="Nenhuma mensagem recebida"
            description="As mensagens enviadas pelo site aparecem aqui."
          />
        ) : (
          <ul className="space-y-3">
            {messagesResult.data.map((message) => (
              <li key={message.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-ink">{message.name}</p>
                        <StatusBadge {...REQUEST_STATUS[message.status]} />
                      </div>
                      <p className="mt-1 text-sm text-ink-muted">
                        <a
                          href={`mailto:${message.email}`}
                          className="text-petrol-700 hover:text-petrol-900"
                        >
                          {message.email}
                        </a>
                        {message.phone ? ` · ${formatPhone(message.phone)}` : ''}
                      </p>
                      {message.subject ? (
                        <p className="mt-1.5 text-sm font-medium text-ink-soft">{message.subject}</p>
                      ) : null}
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                        {message.message}
                      </p>
                      <p className="mt-2 text-xs text-ink-faint">
                        {formatDateTime(message.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {message.status === 'new' ? (
                        <ActionButton
                          action={updateRequestStatus}
                          label="Em análise"
                          fields={{ table: 'contact_messages', id: message.id, status: 'in_review' }}
                        />
                      ) : null}
                      {message.status !== 'archived' ? (
                        <ActionButton
                          action={updateRequestStatus}
                          label="Arquivar"
                          variant="ghost"
                          fields={{ table: 'contact_messages', id: message.id, status: 'archived' }}
                        />
                      ) : null}
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
