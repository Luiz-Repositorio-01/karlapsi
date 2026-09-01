import { FileText, ShieldCheck } from 'lucide-react';
import { Alert, Badge, Card, EmptyState } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/ui';
import { DocumentUploader } from '@/app/admin/documentos/DocumentUploader';
import { DocumentActions } from '@/app/admin/documentos/DocumentActions';
import { requirePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { listDocuments, listPatients } from '@/lib/data/admin';
import { isSupabaseConfigured } from '@/lib/env';
import { formatDate } from '@/lib/utils/format';
import type { DocumentRecord } from '@/lib/types';

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentosPage() {
  const session = await requirePermission('documents:view', '/admin/documentos');
  const [documentsResult, patientsResult] = await Promise.all([
    listDocuments(80),
    listPatients({ orderBy: 'name', limit: 500 }),
  ]);

  const canManage = can(session.profile.role, 'documents:manage');

  return (
    <>
      <AdminPageHeader
        title="Documentos"
        description="Arquivos vinculados a pacientes e conteúdos, guardados em bucket privado do Supabase Storage."
      />

      <Alert tone="info" title="Como o acesso é protegido" className="mb-6">
        <ul className="space-y-1.5">
          <li>
            O bucket <code>patient-documents</code> é <strong>privado</strong>: não existe URL
            pública. O download acontece por link assinado e temporário, gerado no servidor.
          </li>
          <li>
            Tipos permitidos: PDF, imagens (PNG/JPEG/WebP) e documentos Word. Limite de 25 MB por
            arquivo — restrições aplicadas pelo próprio Storage.
          </li>
          <li>Somente OWNER/ADMIN podem excluir arquivos; a equipe pode enviar e visualizar.</li>
        </ul>
      </Alert>

      {canManage && isSupabaseConfigured() ? (
        <div className="mb-6">
          <DocumentUploader
            patients={patientsResult.data.map((patient) => ({
              id: patient.id,
              full_name: patient.full_name,
            }))}
          />
        </div>
      ) : null}

      <DataTable<DocumentRecord>
        items={documentsResult.data}
        caption="Lista de documentos"
        emptyState={
          <EmptyState
            icon={<FileText aria-hidden="true" className="h-5 w-5" />}
            title="Nenhum documento enviado"
            description="Envie relatórios, autorizações e comprovantes vinculados a um paciente."
          />
        }
        columns={[
          { key: 'title', header: 'Documento', render: (document) => document.title },
          {
            key: 'patient',
            header: 'Paciente',
            render: (document) => {
              const patient = patientsResult.data.find((item) => item.id === document.patient_id);
              return patient?.full_name ?? '—';
            },
          },
          {
            key: 'type',
            header: 'Tipo',
            render: (document) => document.mime_type ?? '—',
          },
          {
            key: 'size',
            header: 'Tamanho',
            align: 'right',
            render: (document) => formatBytes(document.size_bytes),
          },
          {
            key: 'visibility',
            header: 'Visibilidade',
            render: (document) => (
              <Badge tone={document.visibility === 'public' ? 'warning' : 'success'}>
                {document.visibility === 'public'
                  ? 'público'
                  : document.visibility === 'staff'
                    ? 'equipe'
                    : 'privado'}
              </Badge>
            ),
          },
          {
            key: 'created',
            header: 'Enviado em',
            render: (document) => formatDate(document.created_at),
          },
        ]}
        actions={(document) => (
          <DocumentActions
            documentId={document.id}
            title={document.title}
            canDelete={canManage}
          />
        )}
      />

      <Card className="mt-8 bg-surface-muted">
        <h2 className="flex items-center gap-2 font-display text-base text-ink">
          <ShieldCheck aria-hidden="true" className="h-4 w-4 text-petrol-500" />
          Boa prática com dado sensível
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Documentos com conteúdo clínico são dados pessoais sensíveis (LGPD, art. 5º, II). Guarde
          apenas o necessário, evite anexar documentos ao cadastro quando não houver finalidade
          definida e prefira nomes de arquivo sem informação identificável.
        </p>
      </Card>
    </>
  );
}
