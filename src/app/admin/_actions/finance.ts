'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { paymentSchema } from '@/lib/validation/schemas';
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

/**
 * Financeiro.
 *
 * Cobranças registradas manualmente (PIX, dinheiro, transferência) são
 * gravadas aqui. Pagamentos do Mercado Pago NÃO são atualizados por esta via:
 * quem escreve o status deles é o webhook, após consulta à API do provedor.
 */

export async function savePayment(
  paymentId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('finance:manage');

    const parsed = parseForm(paymentSchema, formData, { numbers: ['amountCents'] });
    if (!parsed.ok) return parsed.state;

    const input = parsed.data;
    const row = {
      patient_id: input.patientId ?? null,
      appointment_id: input.appointmentId ?? null,
      description: input.description,
      amount_cents: input.amountCents,
      status: input.status,
      method: input.method ?? null,
      due_date: input.dueDate ?? null,
    };

    if (paymentId) {
      // Proteção: cobrança conciliada pelo provedor não é editada manualmente.
      const { data: existing } = await context.supabase
        .from('payments')
        .select('provider_payment_id')
        .eq('id', paymentId)
        .maybeSingle();

      if ((existing as { provider_payment_id: string | null } | null)?.provider_payment_id) {
        return errorState(
          'Esta cobrança é conciliada automaticamente pelo Mercado Pago e não pode ser editada manualmente.',
        );
      }

      const { error } = await context.supabase.from('payments').update(row).eq('id', paymentId);
      if (error) return databaseErrorState(error);
      await audit(context, 'update', 'payments', paymentId, { status: input.status });
    } else {
      const { data, error } = await context.supabase
        .from('payments')
        .insert({ ...row, created_by: context.session.id })
        .select('id')
        .single();

      if (error) return databaseErrorState(error);
      await audit(context, 'create', 'payments', (data as { id: string }).id, {
        status: input.status,
      });
    }

    revalidatePath('/admin/financeiro');
    revalidatePath('/admin');
    return successState(paymentId ? 'Cobrança atualizada.' : 'Cobrança registrada.');
  });
}

const statusSchema = z.object({
  paymentId: z.string().uuid(),
  status: z.enum([
    'pending',
    'approved',
    'authorized',
    'in_process',
    'rejected',
    'cancelled',
    'refunded',
    'charged_back',
  ]),
});

export async function updatePaymentStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('finance:manage');

    const parsed = statusSchema.safeParse({
      paymentId: formData.get('paymentId'),
      status: formData.get('status'),
    });
    if (!parsed.success) return errorState('Status inválido.');

    const { data: existing } = await context.supabase
      .from('payments')
      .select('provider_payment_id')
      .eq('id', parsed.data.paymentId)
      .maybeSingle();

    if ((existing as { provider_payment_id: string | null } | null)?.provider_payment_id) {
      return errorState(
        'O status desta cobrança é definido pelo Mercado Pago e não pode ser alterado manualmente.',
      );
    }

    const { error } = await context.supabase
      .from('payments')
      .update({ status: parsed.data.status })
      .eq('id', parsed.data.paymentId);

    if (error) return databaseErrorState(error);

    await audit(context, 'status_change', 'payments', parsed.data.paymentId, {
      status: parsed.data.status,
    });

    revalidatePath('/admin/financeiro');
    revalidatePath('/admin');
    return successState('Status do pagamento atualizado.');
  });
}
