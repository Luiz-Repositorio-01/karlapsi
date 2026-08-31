'use client';

import { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/interactive';
import { ActionButton } from '@/components/admin/forms';
import { createDocumentDownloadUrl, deleteDocument } from '@/app/admin/_actions/documents';

/**
 * Ações de um documento.
 *
 * O download nunca usa URL pública: a Server Action gera um link assinado de
 * 120 segundos, registra o acesso na auditoria e o navegador abre esse link.
 */
export function DocumentActions({
  documentId,
  title,
  canDelete,
}: {
  documentId: string;
  title: string;
  canDelete: boolean;
}) {
  const { notify } = useToast();
  const [pending, setPending] = useState(false);

  const openDocument = async () => {
    setPending(true);
    try {
      const result = await createDocumentDownloadUrl(documentId);
      if (!result.ok || !result.url) {
        notify(result.message ?? 'Não foi possível abrir o documento.', 'error');
        return;
      }
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch {
      notify('Falha ao gerar o link de acesso.', 'error');
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pending}
        aria-busy={pending}
        onClick={() => void openDocument()}
      >
        <Download aria-hidden="true" className="h-3.5 w-3.5" />
        {pending ? 'Gerando link…' : 'Abrir'}
      </Button>

      {canDelete ? (
        <ActionButton
          action={deleteDocument}
          label={
            <>
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
              Excluir
            </>
          }
          variant="ghost"
          fields={{ documentId }}
          confirm={{
            title: `Excluir “${title}”?`,
            description:
              'O arquivo é apagado do Storage e o registro é removido. Ação irreversível.',
            confirmLabel: 'Excluir documento',
            danger: true,
          }}
        />
      ) : null}
    </>
  );
}
