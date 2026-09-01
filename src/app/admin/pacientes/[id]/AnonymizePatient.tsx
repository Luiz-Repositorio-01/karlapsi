'use client';

import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Alert, Button, FormField, fieldAria, inputClasses } from '@/components/ui';
import { Modal } from '@/components/ui/interactive';
import { ActionForm } from '@/components/admin/forms';
import type { ActionState } from '@/lib/actions/state';

/**
 * Anonimização de paciente.
 *
 * Operação irreversível: exige confirmação digitada, além da permissão
 * `patients:anonymize` (OWNER/ADMIN) verificada no servidor e no banco.
 */
export function AnonymizePatient({
  action,
  patientId,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  patientId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="danger" size="sm" onClick={() => setOpen(true)}>
        <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />
        Anonimizar dados
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Anonimizar dados do paciente"
        description="Esta ação não pode ser desfeita."
        size="sm"
      >
        <Alert tone="danger" title="O que será removido">
          Nome, nome social, CPF, RG, data de nascimento, e-mail, telefones, endereço, responsável e
          observações administrativas. O histórico de atendimentos permanece, sem identificação.
        </Alert>

        <ActionForm
          action={action}
          submitLabel="Confirmar anonimização"
          pendingLabel="Anonimizando…"
          variant="danger"
          hiddenFields={{ patientId }}
          onSuccess={() => setOpen(false)}
          className="mt-5"
        >
          {(state) => (
            <FormField
              label="Digite ANONIMIZAR para confirmar"
              htmlFor="confirmar-anonimizacao"
              required
              error={state.status === 'error' ? state.message : undefined}
            >
              <input
                {...fieldAria('confirmar-anonimizacao', { error: state.status === 'error' })}
                type="text"
                name="confirmation"
                autoComplete="off"
                className={inputClasses}
                required
              />
            </FormField>
          )}
        </ActionForm>
      </Modal>
    </>
  );
}
