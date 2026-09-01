'use server';

import { revalidatePath } from 'next/cache';
import { patientSchema } from '@/lib/validation/schemas';
import {
  audit,
  authorize,
  databaseErrorState,
  errorState,
  parseForm,
  runAction,
  successState,
  type ActionState,
} from './shared';

function toPatientRow(input: ReturnType<typeof patientSchema.parse>) {
  return {
    full_name: input.fullName,
    social_name: input.socialName ?? null,
    cpf: input.cpf ?? null,
    rg: input.rg ?? null,
    birth_date: input.birthDate ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    whatsapp: input.whatsapp ?? null,
    address_street: input.addressStreet ?? null,
    address_number: input.addressNumber ?? null,
    address_complement: input.addressComplement ?? null,
    address_district: input.addressDistrict ?? null,
    address_city: input.addressCity ?? null,
    address_state: input.addressState ?? null,
    address_zip: input.addressZip ?? null,
    guardian_name: input.guardianName ?? null,
    guardian_phone: input.guardianPhone ?? null,
    guardian_relationship: input.guardianRelationship ?? null,
    referral_source: input.referralSource ?? null,
    admin_notes: input.adminNotes ?? null,
  };
}

export async function savePatient(
  patientId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('patients:manage');

    const parsed = parseForm(patientSchema, formData);
    if (!parsed.ok) return parsed.state;

    const row = toPatientRow(parsed.data);

    if (patientId) {
      const { error } = await context.supabase.from('patients').update(row).eq('id', patientId);
      if (error) return databaseErrorState(error);

      // A auditoria registra apenas QUAIS campos mudaram (sem valores).
      await audit(context, 'update', 'patients', patientId);
      revalidatePath(`/admin/pacientes/${patientId}`);
    } else {
      const { data, error } = await context.supabase
        .from('patients')
        .insert({ ...row, created_by: context.session.id })
        .select('id')
        .single();

      if (error) return databaseErrorState(error);
      await audit(context, 'create', 'patients', (data as { id: string }).id);
    }

    revalidatePath('/admin/pacientes');
    return successState(patientId ? 'Paciente atualizado.' : 'Paciente cadastrado.');
  });
}

export async function togglePatientArchive(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('patients:manage');

    const patientId = String(formData.get('patientId') ?? '');
    const archive = formData.get('archive') === 'true';
    if (!patientId) return errorState('Paciente não informado.');

    const { error } = await context.supabase
      .from('patients')
      .update({ archived_at: archive ? new Date().toISOString() : null })
      .eq('id', patientId);

    if (error) return databaseErrorState(error);

    await audit(context, archive ? 'archive' : 'unarchive', 'patients', patientId);

    revalidatePath('/admin/pacientes');
    revalidatePath(`/admin/pacientes/${patientId}`);
    return successState(archive ? 'Paciente arquivado.' : 'Paciente reativado.');
  });
}

/**
 * Anonimização definitiva (LGPD art. 18, IV).
 * Remove os dados identificáveis mantendo o histórico de atendimentos para
 * fins estatísticos e de integridade referencial. Ação irreversível.
 */
export async function anonymizePatient(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('patients:anonymize');

    const patientId = String(formData.get('patientId') ?? '');
    const confirmation = String(formData.get('confirmation') ?? '');

    if (!patientId) return errorState('Paciente não informado.');
    if (confirmation.trim().toUpperCase() !== 'ANONIMIZAR') {
      return errorState('Digite ANONIMIZAR para confirmar a operação irreversível.');
    }

    const { error } = await context.supabase.rpc('anonymize_patient', {
      p_patient_id: patientId,
    });

    if (error) return databaseErrorState(error);

    await audit(context, 'anonymize', 'patients', patientId, { lgpd: true });

    revalidatePath('/admin/pacientes');
    revalidatePath(`/admin/pacientes/${patientId}`);
    return successState('Dados do paciente anonimizados.');
  });
}
