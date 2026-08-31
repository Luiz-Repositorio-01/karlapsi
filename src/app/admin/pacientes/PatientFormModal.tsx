'use client';

import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Button, FormField, fieldAria, inputClasses } from '@/components/ui';
import { Modal } from '@/components/ui/interactive';
import { ActionForm } from '@/components/admin/forms';
import { cn } from '@/lib/utils/cn';
import type { ActionState } from '@/lib/actions/state';
import type { Patient } from '@/lib/types';

/**
 * Cadastro de paciente.
 *
 * O formulário separa claramente os blocos administrativos (identificação,
 * contato, endereço, responsável) e a observação administrativa. Não há campo
 * para conteúdo clínico — informação clínica deve ir para Documentos, que tem
 * acesso restrito e política própria no Storage.
 */
export function PatientFormModal({
  action,
  patient,
  openByDefault = false,
  triggerLabel,
  triggerVariant = 'primary',
}: {
  action: (
    patientId: string | null,
    state: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
  patient?: Patient;
  openByDefault?: boolean;
  triggerLabel: string;
  triggerVariant?: 'primary' | 'secondary';
}) {
  const [open, setOpen] = useState(openByDefault);

  return (
    <>
      <Button type="button" variant={triggerVariant} size="sm" onClick={() => setOpen(true)}>
        {patient ? (
          <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
        ) : (
          <Plus aria-hidden="true" className="h-4 w-4" />
        )}
        {triggerLabel}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={patient ? 'Editar paciente' : 'Novo paciente'}
        description="Dados administrativos e de contato."
        size="lg"
      >
        <ActionForm
          action={action.bind(null, patient?.id ?? null)}
          submitLabel={patient ? 'Salvar alterações' : 'Cadastrar paciente'}
          pendingLabel="Salvando…"
          onSuccess={() => setOpen(false)}
        >
          {(state) => (
            <div className="space-y-6">
              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-ink">Identificação</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Nome completo"
                    htmlFor="paciente-nome"
                    required
                    error={state.fields?.fullName}
                    className="sm:col-span-2"
                  >
                    <input
                      {...fieldAria('paciente-nome', { error: Boolean(state.fields?.fullName) })}
                      type="text"
                      name="fullName"
                      autoComplete="name"
                      defaultValue={patient?.full_name ?? ''}
                      className={inputClasses}
                      required
                    />
                  </FormField>

                  <FormField label="Nome social" htmlFor="paciente-nome-social">
                    <input
                      {...fieldAria('paciente-nome-social', {})}
                      type="text"
                      name="socialName"
                      defaultValue={patient?.social_name ?? ''}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField label="Data de nascimento" htmlFor="paciente-nascimento">
                    <input
                      {...fieldAria('paciente-nascimento', {})}
                      type="date"
                      name="birthDate"
                      defaultValue={patient?.birth_date ?? ''}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField
                    label="CPF"
                    htmlFor="paciente-cpf"
                    hint="Apenas números. Validado antes de salvar."
                    error={state.fields?.cpf}
                  >
                    <input
                      {...fieldAria('paciente-cpf', { hint: true, error: Boolean(state.fields?.cpf) })}
                      type="text"
                      name="cpf"
                      inputMode="numeric"
                      maxLength={14}
                      defaultValue={patient?.cpf ?? ''}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField label="RG" htmlFor="paciente-rg">
                    <input
                      {...fieldAria('paciente-rg', {})}
                      type="text"
                      name="rg"
                      defaultValue={patient?.rg ?? ''}
                      className={inputClasses}
                    />
                  </FormField>
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-ink">Contato</legend>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField label="E-mail" htmlFor="paciente-email" error={state.fields?.email}>
                    <input
                      {...fieldAria('paciente-email', { error: Boolean(state.fields?.email) })}
                      type="email"
                      name="email"
                      defaultValue={patient?.email ?? ''}
                      className={inputClasses}
                    />
                  </FormField>
                  <FormField label="Telefone" htmlFor="paciente-telefone" error={state.fields?.phone}>
                    <input
                      {...fieldAria('paciente-telefone', { error: Boolean(state.fields?.phone) })}
                      type="tel"
                      name="phone"
                      defaultValue={patient?.phone ?? ''}
                      className={inputClasses}
                    />
                  </FormField>
                  <FormField label="WhatsApp" htmlFor="paciente-whatsapp">
                    <input
                      {...fieldAria('paciente-whatsapp', {})}
                      type="tel"
                      name="whatsapp"
                      defaultValue={patient?.whatsapp ?? ''}
                      className={inputClasses}
                    />
                  </FormField>
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-ink">Endereço</legend>
                <div className="grid gap-4 sm:grid-cols-6">
                  <FormField label="Rua" htmlFor="paciente-rua" className="sm:col-span-3">
                    <input
                      {...fieldAria('paciente-rua', {})}
                      type="text"
                      name="addressStreet"
                      defaultValue={patient?.address_street ?? ''}
                      className={inputClasses}
                    />
                  </FormField>
                  <FormField label="Número" htmlFor="paciente-numero">
                    <input
                      {...fieldAria('paciente-numero', {})}
                      type="text"
                      name="addressNumber"
                      defaultValue={patient?.address_number ?? ''}
                      className={inputClasses}
                    />
                  </FormField>
                  <FormField label="Complemento" htmlFor="paciente-complemento" className="sm:col-span-2">
                    <input
                      {...fieldAria('paciente-complemento', {})}
                      type="text"
                      name="addressComplement"
                      defaultValue={patient?.address_complement ?? ''}
                      className={inputClasses}
                    />
                  </FormField>
                  <FormField label="Bairro" htmlFor="paciente-bairro" className="sm:col-span-2">
                    <input
                      {...fieldAria('paciente-bairro', {})}
                      type="text"
                      name="addressDistrict"
                      defaultValue={patient?.address_district ?? ''}
                      className={inputClasses}
                    />
                  </FormField>
                  <FormField label="Cidade" htmlFor="paciente-cidade" className="sm:col-span-2">
                    <input
                      {...fieldAria('paciente-cidade', {})}
                      type="text"
                      name="addressCity"
                      defaultValue={patient?.address_city ?? ''}
                      className={inputClasses}
                    />
                  </FormField>
                  <FormField label="UF" htmlFor="paciente-uf">
                    <input
                      {...fieldAria('paciente-uf', {})}
                      type="text"
                      name="addressState"
                      maxLength={2}
                      defaultValue={patient?.address_state ?? ''}
                      className={cn(inputClasses, 'uppercase')}
                    />
                  </FormField>
                  <FormField label="CEP" htmlFor="paciente-cep">
                    <input
                      {...fieldAria('paciente-cep', {})}
                      type="text"
                      name="addressZip"
                      maxLength={9}
                      defaultValue={patient?.address_zip ?? ''}
                      className={inputClasses}
                    />
                  </FormField>
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-ink">
                  Responsável (quando aplicável)
                </legend>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField label="Nome" htmlFor="paciente-responsavel">
                    <input
                      {...fieldAria('paciente-responsavel', {})}
                      type="text"
                      name="guardianName"
                      defaultValue={patient?.guardian_name ?? ''}
                      className={inputClasses}
                    />
                  </FormField>
                  <FormField label="Telefone" htmlFor="paciente-responsavel-telefone">
                    <input
                      {...fieldAria('paciente-responsavel-telefone', {})}
                      type="tel"
                      name="guardianPhone"
                      defaultValue={patient?.guardian_phone ?? ''}
                      className={inputClasses}
                    />
                  </FormField>
                  <FormField label="Parentesco" htmlFor="paciente-responsavel-parentesco">
                    <input
                      {...fieldAria('paciente-responsavel-parentesco', {})}
                      type="text"
                      name="guardianRelationship"
                      defaultValue={patient?.guardian_relationship ?? ''}
                      className={inputClasses}
                    />
                  </FormField>
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-ink">Administrativo</legend>
                <div className="grid gap-4">
                  <FormField
                    label="Como chegou até o consultório"
                    htmlFor="paciente-origem"
                    hint="Indicação, site, redes sociais, encaminhamento…"
                  >
                    <input
                      {...fieldAria('paciente-origem', { hint: true })}
                      type="text"
                      name="referralSource"
                      defaultValue={patient?.referral_source ?? ''}
                      className={inputClasses}
                    />
                  </FormField>

                  <FormField
                    label="Observações administrativas"
                    htmlFor="paciente-observacoes"
                    hint="Combinações de horário, pagamento e contato. Não registre conteúdo clínico."
                  >
                    <textarea
                      {...fieldAria('paciente-observacoes', { hint: true })}
                      name="adminNotes"
                      rows={4}
                      defaultValue={patient?.admin_notes ?? ''}
                      className={cn(inputClasses, 'resize-y')}
                    />
                  </FormField>
                </div>
              </fieldset>
            </div>
          )}
        </ActionForm>
      </Modal>
    </>
  );
}
