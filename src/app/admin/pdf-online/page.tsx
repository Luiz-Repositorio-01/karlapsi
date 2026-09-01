import { ExternalLink, FileText } from 'lucide-react';
import { Alert, ButtonLink } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { requirePermission } from '@/lib/auth/session';
import { getLegacyPdfEntry } from '@/lib/legacy';

export default async function AdminPdfOnlinePage() {
  await requirePermission('documents:view', '/admin/pdf-online');
  const entry = getLegacyPdfEntry();

  return (
    <>
      <AdminPageHeader
        title="PDF Online"
        description="Editor original de documentos timbrados. Uso interno para emitir comprovantes — não aparece no site público."
      />

      <Alert tone="info" title="Somente equipe" className="mb-5">
        Esta ferramenta fica atrás do login. Visitantes do site não veem o editor nem o menu
        público. Os arquivos originais não foram alterados.
      </Alert>

      {entry ? (
        <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-petrol-100">
          <div className="flex items-center justify-between gap-3 border-b border-petrol-100 px-4 py-3">
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              <FileText aria-hidden="true" className="h-4 w-4 text-petrol-600" />
              Documentos timbrados
            </p>
            <ButtonLink href={entry} external variant="ghost" size="sm">
              Abrir em nova aba
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            </ButtonLink>
          </div>
          <iframe
            src={entry}
            title="Editor de documentos timbrados"
            className="h-[min(80vh,52rem)] min-h-[32rem] w-full bg-white"
          />
        </div>
      ) : (
        <Alert tone="warning" title="Arquivos ainda não copiados">
          O editor original precisa estar em <code>public/legacy/pdf-online/index.html</code>.
        </Alert>
      )}
    </>
  );
}
