import Link from 'next/link';
import { History } from 'lucide-react';
import { Alert, Badge, Card, EmptyState } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/ui';
import { requirePermission } from '@/lib/auth/session';
import { listAuditLogs } from '@/lib/data/admin';
import { ROLE_LABELS } from '@/lib/auth/rbac';
import { formatDateTime } from '@/lib/utils/format';
import type { AuditLog } from '@/lib/types';

const ACTION_LABELS: Record<string, string> = {
  insert: 'Criação',
  create: 'Criação',
  update: 'Alteração',
  delete: 'Exclusão',
  sign_in: 'Login',
  status_change: 'Mudança de status',
  role_change: 'Mudança de papel',
  reschedule: 'Reagendamento',
  accept_request: 'Solicitação confirmada',
  anonymize: 'Anonimização (LGPD)',
  archive: 'Arquivamento',
  unarchive: 'Reativação',
  activate: 'Acesso reativado',
  deactivate: 'Acesso desativado',
  publish_scheduled: 'Publicação de agendados',
  upsert: 'Criação/alteração',
};

const ENTITY_LABELS: Record<string, string> = {
  patients: 'Pacientes',
  appointments: 'Agenda',
  appointment_requests: 'Solicitações',
  payments: 'Financeiro',
  orders: 'Pedidos',
  services: 'Serviços',
  availability_rules: 'Disponibilidade',
  availability_exceptions: 'Exceções de agenda',
  blocked_times: 'Bloqueios',
  profiles: 'Usuários',
  documents: 'Documentos',
  site_settings: 'Configurações',
  site_pages: 'Páginas',
  blog_posts: 'Blog',
  infobooks: 'Infobooks',
  landing_pages: 'Landing pages',
  products: 'Produtos',
  testimonials: 'Depoimentos',
  contact_messages: 'Mensagens',
  'auth.users': 'Autenticação',
};

const FILTERS = [
  { value: '', label: 'Tudo' },
  { value: 'patients', label: 'Pacientes' },
  { value: 'appointments', label: 'Agenda' },
  { value: 'payments', label: 'Financeiro' },
  { value: 'profiles', label: 'Usuários' },
  { value: 'auth.users', label: 'Acessos' },
  { value: 'site_settings', label: 'Configurações' },
];

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ entidade?: string }>;
}) {
  await requirePermission('audit:view', '/admin/auditoria');
  const { entidade } = await searchParams;

  const result = await listAuditLogs({ entity: entidade || undefined, limit: 200 });

  return (
    <>
      <AdminPageHeader
        title="Auditoria"
        description="Registro imutável das ações relevantes: quem fez, quando, em qual registro e quais campos mudaram."
      />

      <Alert tone="info" title="O que é e o que não é registrado" className="mb-6">
        <p>
          <strong>Registrado:</strong> login, criação, alteração, exclusão, mudança de status e de
          papel, reagendamento, anonimização e alterações de configuração.
        </p>
        <p className="mt-2">
          <strong>Nunca registrado:</strong> senhas, tokens e valores de campos sensíveis. Em tabelas
          com dado pessoal, a trilha guarda apenas <em>quais</em> campos mudaram — não os valores.
        </p>
        <p className="mt-2">
          A trilha não pode ser editada nem apagada pela aplicação: existe apenas política de
          leitura para OWNER/ADMIN.
        </p>
      </Alert>

      <nav aria-label="Filtrar auditoria" className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value || 'todos'}
            href={filter.value ? `/admin/auditoria?entidade=${filter.value}` : '/admin/auditoria'}
            aria-current={(entidade ?? '') === filter.value ? 'page' : undefined}
            className={
              (entidade ?? '') === filter.value
                ? 'rounded-full bg-petrol-700 px-4 py-2 text-sm font-medium text-white'
                : 'rounded-full bg-surface px-4 py-2 text-sm font-medium text-ink-soft ring-1 ring-petrol-200 transition-colors hover:bg-petrol-50'
            }
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <DataTable<AuditLog>
        items={result.data}
        caption="Registros de auditoria"
        emptyState={
          <EmptyState
            icon={<History aria-hidden="true" className="h-5 w-5" />}
            title="Nenhum registro"
            description="As ações realizadas no painel aparecem aqui automaticamente."
          />
        }
        columns={[
          {
            key: 'when',
            header: 'Quando',
            render: (log) => formatDateTime(log.created_at),
          },
          {
            key: 'actor',
            header: 'Quem',
            render: (log) => (
              <span>
                {log.actor_email ?? 'sistema'}
                {log.actor_role ? (
                  <span className="block text-xs text-ink-faint">
                    {ROLE_LABELS[log.actor_role]}
                  </span>
                ) : null}
              </span>
            ),
          },
          {
            key: 'action',
            header: 'Ação',
            render: (log) => <Badge>{ACTION_LABELS[log.action] ?? log.action}</Badge>,
          },
          {
            key: 'entity',
            header: 'Onde',
            render: (log) => ENTITY_LABELS[log.entity] ?? log.entity,
          },
          {
            key: 'fields',
            header: 'Campos alterados',
            hideOnMobile: true,
            render: (log) =>
              log.changed_fields && log.changed_fields.length > 0 ? (
                <span className="text-xs text-ink-muted">{log.changed_fields.join(', ')}</span>
              ) : (
                '—'
              ),
          },
        ]}
      />

      {result.data.length >= 200 ? (
        <Card className="mt-5 bg-surface-muted">
          <p className="text-xs text-ink-muted">
            Exibindo os 200 registros mais recentes. Para análise histórica completa, consulte a
            tabela <code>audit_logs</code> diretamente no Supabase.
          </p>
        </Card>
      ) : null}
    </>
  );
}
