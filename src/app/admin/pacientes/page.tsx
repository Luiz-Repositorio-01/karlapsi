import Link from 'next/link';
import { Search, Users } from 'lucide-react';
import { Alert, Badge, ButtonLink, Card, EmptyState, inputClasses } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/ui';
import { PatientFormModal } from '@/app/admin/pacientes/PatientFormModal';
import { requirePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { listPatients } from '@/lib/data/admin';
import { savePatient } from '@/app/admin/_actions/patients';
import { formatAge, formatCpf, formatDate, formatPhone } from '@/lib/utils/format';
import type { Patient } from '@/lib/types';

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; arquivados?: string; ordem?: string; novo?: string }>;
}) {
  const session = await requirePermission('patients:view', '/admin/pacientes');
  const params = await searchParams;

  const includeArchived = params.arquivados === '1';
  const result = await listPatients({
    search: params.q,
    includeArchived,
    orderBy: params.ordem === 'recentes' ? 'recent' : 'name',
    limit: 200,
  });

  const canManage = can(session.profile.role, 'patients:manage');

  return (
    <>
      <AdminPageHeader
        title="Pacientes"
        description="Cadastro administrativo. Informações clínicas não são armazenadas aqui — use a área de documentos, com acesso restrito."
        actions={
          canManage ? (
            <PatientFormModal
              action={savePatient}
              openByDefault={params.novo === '1'}
              triggerLabel="Novo paciente"
            />
          ) : undefined
        }
      />

      {/* ------------------------------------------------------------ filtros */}
      <Card className="mb-5 p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[14rem] flex-1">
            <label
              htmlFor="busca-paciente"
              className="mb-1.5 block text-sm font-medium text-ink-soft"
            >
              Buscar
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
              />
              <input
                id="busca-paciente"
                type="search"
                name="q"
                defaultValue={params.q ?? ''}
                placeholder="Nome, e-mail, telefone ou CPF"
                className={`${inputClasses} pl-10`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="ordem-paciente" className="mb-1.5 block text-sm font-medium text-ink-soft">
              Ordenar
            </label>
            <select
              id="ordem-paciente"
              name="ordem"
              defaultValue={params.ordem ?? 'nome'}
              className={inputClasses}
            >
              <option value="nome">Nome (A–Z)</option>
              <option value="recentes">Cadastro recente</option>
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface-muted px-4 py-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              name="arquivados"
              value="1"
              defaultChecked={includeArchived}
              className="h-4 w-4 accent-petrol-700"
            />
            Incluir arquivados
          </label>

          <button
            type="submit"
            className="min-h-[44px] rounded-full bg-petrol-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-petrol-800"
          >
            Filtrar
          </button>

          {params.q || includeArchived || params.ordem ? (
            <Link
              href="/admin/pacientes"
              className="min-h-[44px] px-3 py-3 text-sm font-medium text-ink-muted hover:text-petrol-700"
            >
              Limpar
            </Link>
          ) : null}
        </form>
      </Card>

      {result.error ? (
        <Alert tone="warning" title="Não foi possível carregar os pacientes" className="mb-5">
          Verifique se as migrations foram aplicadas e se o seu perfil tem acesso.
        </Alert>
      ) : null}

      <p className="mb-3 text-sm text-ink-muted">
        {result.data.length} {result.data.length === 1 ? 'paciente' : 'pacientes'}
        {params.q ? ` para “${params.q}”` : ''}
      </p>

      <DataTable<Patient>
        items={result.data}
        caption="Lista de pacientes"
        rowHref={(patient) => `/admin/pacientes/${patient.id}`}
        emptyState={
          <EmptyState
            icon={<Users aria-hidden="true" className="h-5 w-5" />}
            title={params.q ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
            description={
              params.q
                ? 'Revise o termo buscado ou inclua os arquivados no filtro.'
                : 'Cadastre o primeiro paciente ou confirme uma solicitação de agendamento — o cadastro é criado automaticamente.'
            }
            action={
              params.q ? (
                <ButtonLink href="/admin/pacientes" variant="secondary" size="sm">
                  Limpar busca
                </ButtonLink>
              ) : undefined
            }
          />
        }
        columns={[
          {
            key: 'name',
            header: 'Nome',
            render: (patient) => (
              <span className="flex flex-wrap items-center gap-2">
                {patient.full_name}
                {patient.archived_at ? <Badge>Arquivado</Badge> : null}
                {patient.is_demo ? <Badge tone="sand">DEMO</Badge> : null}
              </span>
            ),
          },
          {
            key: 'contact',
            header: 'Contato',
            render: (patient) => (
              <span className="block">
                {patient.phone ? formatPhone(patient.phone) : '—'}
                {patient.email ? (
                  <span className="block text-xs text-ink-faint">{patient.email}</span>
                ) : null}
              </span>
            ),
          },
          {
            key: 'birth',
            header: 'Idade',
            render: (patient) =>
              patient.birth_date ? (
                <span>
                  {formatAge(patient.birth_date)}
                  <span className="block text-xs text-ink-faint">
                    {formatDate(`${patient.birth_date}T12:00:00.000Z`, 'UTC')}
                  </span>
                </span>
              ) : (
                '—'
              ),
          },
          {
            // CPF sempre mascarado nesta tela (minimização de dados).
            key: 'cpf',
            header: 'CPF',
            render: (patient) => (patient.cpf ? formatCpf(patient.cpf) : '—'),
          },
          {
            key: 'guardian',
            header: 'Responsável',
            hideOnMobile: true,
            render: (patient) => patient.guardian_name ?? '—',
          },
          {
            key: 'created',
            header: 'Cadastro',
            render: (patient) => formatDate(patient.created_at),
          },
        ]}
        actions={(patient) => (
          <ButtonLink href={`/admin/pacientes/${patient.id}`} variant="secondary" size="sm">
            Abrir
          </ButtonLink>
        )}
      />
    </>
  );
}
