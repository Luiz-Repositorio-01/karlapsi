import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  History,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { Alert, Badge, ButtonLink, Card, EmptyState } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { StatusBadge } from '@/components/admin/ui';
import { ActionButton } from '@/components/admin/forms';
import { PatientFormModal } from '@/app/admin/pacientes/PatientFormModal';
import { AnonymizePatient } from '@/app/admin/pacientes/[id]/AnonymizePatient';
import { requirePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { getPatient, getPatientTimeline } from '@/lib/data/admin';
import { getSiteSettings } from '@/lib/data/public';
import {
  anonymizePatient,
  savePatient,
  togglePatientArchive,
} from '@/app/admin/_actions/patients';
import { APPOINTMENT_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '@/lib/utils/labels';
import {
  formatAge,
  formatCpf,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
} from '@/lib/utils/format';

export default async function PacienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requirePermission('patients:view', `/admin/pacientes/${id}`);

  const [patientResult, settings] = await Promise.all([getPatient(id), getSiteSettings()]);
  const patient = patientResult.data;

  if (!patient) notFound();

  const timeline = await getPatientTimeline(id);
  const canManage = can(session.profile.role, 'patients:manage');
  const canSeeFinance = can(session.profile.role, 'finance:view');
  const canAnonymize = can(session.profile.role, 'patients:anonymize');
  const timezone = settings.booking.timezone;

  return (
    <>
      <Link
        href="/admin/pacientes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-petrol-700 transition-colors hover:text-petrol-900"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Voltar para pacientes
      </Link>

      <AdminPageHeader
        title={patient.full_name}
        description={[
          patient.social_name ? `Nome social: ${patient.social_name}` : null,
          patient.birth_date ? `${formatAge(patient.birth_date)}` : null,
          patient.referral_source ? `Origem: ${patient.referral_source}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        badge={patient.archived_at ? 'arquivado' : undefined}
        actions={
          canManage ? (
            <>
              <PatientFormModal
                action={savePatient}
                patient={patient}
                triggerLabel="Editar"
                triggerVariant="secondary"
              />
              <ActionButton
                action={togglePatientArchive}
                label={patient.archived_at ? 'Reativar' : 'Arquivar'}
                variant="ghost"
                fields={{ patientId: patient.id, archive: !patient.archived_at }}
                confirm={
                  patient.archived_at
                    ? undefined
                    : {
                        title: 'Arquivar paciente?',
                        description:
                          'O cadastro sai das listas ativas, mas o histórico é preservado. É possível reativar depois.',
                        confirmLabel: 'Arquivar',
                      }
                }
              />
            </>
          ) : undefined
        }
      />

      {patient.is_demo ? (
        <Alert tone="info" title="Registro de demonstração" className="mb-5">
          Este cadastro veio do seed de demonstração e pode ser removido com segurança.
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          {/* --------------------------------------------- próximos atendimentos */}
          <section aria-labelledby="proximos-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="proximos-title" className="font-display text-lg text-ink">
                Próximos atendimentos
              </h2>
              <ButtonLink href="/admin/agenda?novo=1" variant="ghost" size="sm">
                Agendar
              </ButtonLink>
            </div>

            {timeline.upcoming.length === 0 ? (
              <EmptyState
                icon={<CalendarDays aria-hidden="true" className="h-5 w-5" />}
                title="Nenhum atendimento futuro"
                description="Agende um novo horário pela agenda."
              />
            ) : (
              <ul className="space-y-3">
                {timeline.upcoming.map((appointment) => (
                  <li key={appointment.id}>
                    <Card className="flex flex-wrap items-start justify-between gap-3 p-4">
                      <div>
                        <p className="font-medium text-ink">
                          {formatDateTime(appointment.starts_at, timezone)}
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                          {appointment.service?.name ?? 'Serviço não informado'}
                        </p>
                      </div>
                      <StatusBadge {...APPOINTMENT_STATUS[appointment.status]} />
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ------------------------------------------------------- histórico */}
          <section aria-labelledby="historico-title">
            <h2 id="historico-title" className="mb-3 font-display text-lg text-ink">
              Histórico de atendimentos
            </h2>

            {timeline.past.length === 0 ? (
              <EmptyState title="Sem histórico" description="Nenhum atendimento anterior registrado." />
            ) : (
              <ol className="relative space-y-4 border-l border-petrol-100 pl-5">
                {timeline.past.map((appointment) => (
                  <li key={appointment.id} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[1.6875rem] top-1.5 h-2.5 w-2.5 rounded-full bg-petrol-300 ring-4 ring-surface-muted"
                    />
                    <Card className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {formatDateTime(appointment.starts_at, timezone)}
                          </p>
                          <p className="mt-1 text-sm text-ink-muted">
                            {appointment.service?.name ?? 'Serviço não informado'}
                          </p>
                          {appointment.admin_notes ? (
                            <p className="mt-2 rounded-lg bg-surface-muted px-3 py-2 text-xs leading-relaxed text-ink-soft">
                              {appointment.admin_notes}
                            </p>
                          ) : null}
                        </div>
                        <StatusBadge {...APPOINTMENT_STATUS[appointment.status]} />
                      </div>
                    </Card>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* ------------------------------------------------------ pagamentos */}
          {canSeeFinance ? (
            <section aria-labelledby="pagamentos-title">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 id="pagamentos-title" className="font-display text-lg text-ink">
                  Pagamentos
                </h2>
                <ButtonLink href="/admin/financeiro" variant="ghost" size="sm">
                  Ver financeiro
                </ButtonLink>
              </div>

              {timeline.payments.length === 0 ? (
                <EmptyState
                  icon={<Wallet aria-hidden="true" className="h-5 w-5" />}
                  title="Nenhuma cobrança registrada"
                  description="Registre cobranças no módulo financeiro."
                />
              ) : (
                <ul className="space-y-3">
                  {timeline.payments.map((payment) => (
                    <li key={payment.id}>
                      <Card className="flex flex-wrap items-start justify-between gap-3 p-4">
                        <div>
                          <p className="font-medium text-ink">{payment.description}</p>
                          <p className="mt-1 text-sm text-ink-muted">
                            {formatCurrency(payment.amount_cents)}
                            {payment.method ? ` · ${PAYMENT_METHOD[payment.method]}` : ''}
                          </p>
                          <p className="mt-1 text-xs text-ink-faint">
                            {payment.due_date
                              ? `Vencimento: ${formatDate(`${payment.due_date}T12:00:00.000Z`, 'UTC')}`
                              : `Criada em ${formatDate(payment.created_at)}`}
                          </p>
                        </div>
                        <StatusBadge {...PAYMENT_STATUS[payment.status]} />
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {/* ------------------------------------------------------- documentos */}
          <section aria-labelledby="documentos-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="documentos-title" className="font-display text-lg text-ink">
                Documentos
              </h2>
              <ButtonLink href="/admin/documentos" variant="ghost" size="sm">
                Gerenciar
              </ButtonLink>
            </div>

            {timeline.documents.length === 0 ? (
              <EmptyState
                icon={<FileText aria-hidden="true" className="h-5 w-5" />}
                title="Nenhum documento vinculado"
                description="Documentos ficam em bucket privado, acessíveis apenas por link temporário."
              />
            ) : (
              <ul className="space-y-2">
                {timeline.documents.map((document) => (
                  <li key={document.id}>
                    <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <p className="text-sm font-medium text-ink">{document.title}</p>
                        <p className="mt-0.5 text-xs text-ink-faint">
                          {formatDate(document.created_at)} · {document.mime_type ?? 'arquivo'}
                        </p>
                      </div>
                      <Badge tone={document.visibility === 'public' ? 'warning' : 'neutral'}>
                        {document.visibility === 'public' ? 'público' : 'privado'}
                      </Badge>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ---------------------------------------------------------- coluna lateral */}
        <aside className="space-y-4">
          <Card>
            <h2 className="font-display text-base text-ink">Dados cadastrais</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                { label: 'Telefone', value: patient.phone ? formatPhone(patient.phone) : null },
                { label: 'WhatsApp', value: patient.whatsapp ? formatPhone(patient.whatsapp) : null },
                { label: 'E-mail', value: patient.email },
                {
                  label: 'Nascimento',
                  value: patient.birth_date
                    ? `${formatDate(`${patient.birth_date}T12:00:00.000Z`, 'UTC')} (${formatAge(patient.birth_date)})`
                    : null,
                },
                // CPF mascarado: o número completo não é necessário nesta tela.
                { label: 'CPF', value: patient.cpf ? formatCpf(patient.cpf) : null },
                {
                  label: 'Endereço',
                  value: [
                    patient.address_street,
                    patient.address_number,
                    patient.address_district,
                    patient.address_city,
                    patient.address_state,
                  ]
                    .filter(Boolean)
                    .join(', '),
                },
                {
                  label: 'Responsável',
                  value: patient.guardian_name
                    ? `${patient.guardian_name}${
                        patient.guardian_relationship ? ` (${patient.guardian_relationship})` : ''
                      }`
                    : null,
                },
              ]
                .filter((item) => item.value)
                .map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">{item.label}</dt>
                    <dd className="mt-0.5 text-ink-soft">{item.value}</dd>
                  </div>
                ))}
            </dl>

            {patient.cpf ? (
              <p className="mt-4 text-xs leading-relaxed text-ink-faint">
                O CPF é exibido parcialmente por padrão (LGPD — minimização na exibição).
              </p>
            ) : null}
          </Card>

          {patient.admin_notes ? (
            <Card>
              <h2 className="font-display text-base text-ink">Observações administrativas</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {patient.admin_notes}
              </p>
            </Card>
          ) : null}

          <Card>
            <h2 className="flex items-center gap-2 font-display text-base text-ink">
              <History aria-hidden="true" className="h-4 w-4 text-petrol-500" />
              Histórico de alterações
            </h2>

            {timeline.history.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">Nenhuma alteração registrada.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {timeline.history.map((entry) => (
                  <li key={entry.id} className="text-xs">
                    <p className="font-medium text-ink-soft">
                      {entry.action === 'create'
                        ? 'Cadastro criado'
                        : entry.action === 'anonymize'
                          ? 'Dados anonimizados'
                          : 'Cadastro alterado'}
                    </p>
                    <p className="text-ink-faint">
                      {formatDateTime(entry.created_at, timezone)}
                      {entry.actor_email ? ` · ${entry.actor_email}` : ''}
                    </p>
                    {entry.changed_fields && entry.changed_fields.length > 0 ? (
                      <p className="mt-0.5 text-ink-faint">
                        Campos: {entry.changed_fields.join(', ')}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 text-xs leading-relaxed text-ink-faint">
              A trilha registra quais campos mudaram, sem copiar os valores — minimização de dados.
            </p>
          </Card>

          {canAnonymize ? (
            <Card className="ring-red-200">
              <h2 className="flex items-center gap-2 font-display text-base text-ink">
                <ShieldAlert aria-hidden="true" className="h-4 w-4 text-red-600" />
                Direitos do titular (LGPD)
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                A anonimização remove nome, contatos, documentos e endereço, mantendo o histórico de
                atendimentos para fins estatísticos. A operação é irreversível.
              </p>
              <div className="mt-4">
                <AnonymizePatient action={anonymizePatient} patientId={patient.id} />
              </div>
            </Card>
          ) : null}
        </aside>
      </div>
    </>
  );
}
