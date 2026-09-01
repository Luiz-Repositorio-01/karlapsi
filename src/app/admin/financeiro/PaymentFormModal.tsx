'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, FormField, fieldAria, inputClasses } from '@/components/ui';
import { Modal } from '@/components/ui/interactive';
import { ActionForm } from '@/components/admin/forms';
import { CurrencyField } from '@/components/admin/CurrencyField';
import { PAYMENT_METHOD, PAYMENT_STATUS } from '@/lib/utils/labels';
import type { ActionState } from '@/lib/actions/state';

/** Cobrança manual (PIX, dinheiro, transferência, convênio). */
export function PaymentFormModal({
  action,
  patients,
  triggerLabel,
}: {
  action: (
    paymentId: string | null,
    state: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
  patients: { id: string; full_name: string }[];
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" className="h-4 w-4" />
        {triggerLabel}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Registrar cobrança"
        description="Para pagamentos fora do Mercado Pago. Cobranças do checkout são criadas automaticamente."
      >
        <ActionForm
          action={action.bind(null, null)}
          submitLabel="Registrar"
          pendingLabel="Salvando…"
          onSuccess={() => setOpen(false)}
        >
          {(state) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Descrição"
                htmlFor="cobranca-descricao"
                required
                error={state.fields?.description}
                className="sm:col-span-2"
              >
                <input
                  {...fieldAria('cobranca-descricao', {
                    error: Boolean(state.fields?.description),
                  })}
                  type="text"
                  name="description"
                  placeholder="Avaliação neuropsicológica — parcela 1/3"
                  className={inputClasses}
                  required
                />
              </FormField>

              <FormField label="Paciente" htmlFor="cobranca-paciente">
                <select
                  {...fieldAria('cobranca-paciente', {})}
                  name="patientId"
                  className={inputClasses}
                >
                  <option value="">Sem vínculo</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </option>
                  ))}
                </select>
              </FormField>

              <CurrencyField
                name="amountCents"
                label="Valor"
                required
                error={state.fields?.amountCents}
              />

              <FormField label="Forma de pagamento" htmlFor="cobranca-metodo">
                <select
                  {...fieldAria('cobranca-metodo', {})}
                  name="method"
                  defaultValue="pix"
                  className={inputClasses}
                >
                  <option value="">Não definida</option>
                  {Object.entries(PAYMENT_METHOD)
                    .filter(([value]) => value !== 'mercadopago')
                    .map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                </select>
              </FormField>

              <FormField label="Status" htmlFor="cobranca-status" required>
                <select
                  {...fieldAria('cobranca-status', {})}
                  name="status"
                  defaultValue="pending"
                  className={inputClasses}
                  required
                >
                  {(['pending', 'approved', 'cancelled', 'refunded'] as const).map((status) => (
                    <option key={status} value={status}>
                      {PAYMENT_STATUS[status].label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Vencimento" htmlFor="cobranca-vencimento">
                <input
                  {...fieldAria('cobranca-vencimento', {})}
                  type="date"
                  name="dueDate"
                  className={inputClasses}
                />
              </FormField>
            </div>
          )}
        </ActionForm>
      </Modal>
    </>
  );
}
