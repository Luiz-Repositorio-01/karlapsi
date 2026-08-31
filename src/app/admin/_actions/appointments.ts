'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { TZDate } from '@date-fns/tz';
import { getSiteSettings } from '@/lib/data/public';
import { appointmentSchema, blockedTimeSchema } from '@/lib/validation/schemas';
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

/** Converte data + hora locais do consultório em instante absoluto (UTC). */
function toInstant(date: string, time: string, timezone: string): string {
  const [year = '1970', month = '01', day = '01'] = date.split('-');
  const [hours = '00', minutes = '00'] = time.split(':');

  const zoned = new TZDate(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    0,
    0,
    timezone,
  );

  return new Date(zoned.getTime()).toISOString();
}

export async function saveAppointment(
  appointmentId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('agenda:manage');

    const parsed = parseForm(appointmentSchema, formData, {
      booleans: [],
      numbers: ['priceCents'],
    });
    if (!parsed.ok) return parsed.state;

    const settings = await getSiteSettings();
    const timezone = settings.booking.timezone;
    const input = parsed.data;

    const payload = {
      patient_id: input.patientId ?? null,
      service_id: input.serviceId ?? null,
      starts_at: toInstant(input.date, input.startTime, timezone),
      ends_at: toInstant(input.date, input.endTime, timezone),
      status: input.status,
      origin: input.origin,
      price_cents: input.priceCents ?? null,
      payment_method: input.paymentMethod ?? null,
      contact_name: input.contactName ?? null,
      contact_email: input.contactEmail ?? null,
      contact_phone: input.contactPhone ?? null,
      admin_notes: input.adminNotes ?? null,
    };

    if (appointmentId) {
      const { error } = await context.supabase
        .from('appointments')
        .update(payload)
        .eq('id', appointmentId);

      if (error) return databaseErrorState(error);
      await audit(context, 'update', 'appointments', appointmentId, { status: input.status });
    } else {
      const { data, error } = await context.supabase
        .from('appointments')
        .insert({ ...payload, created_by: context.session.id })
        .select('id')
        .single();

      if (error) return databaseErrorState(error);
      await audit(context, 'create', 'appointments', (data as { id: string }).id, {
        status: input.status,
      });
    }

    revalidatePath('/admin/agenda');
    revalidatePath('/admin');
    return successState(appointmentId ? 'Atendimento atualizado.' : 'Atendimento criado.');
  });
}

const statusSchema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum([
    'requested',
    'confirmed',
    'awaiting_payment',
    'paid',
    'completed',
    'cancelled',
    'no_show',
  ]),
  reason: z.string().trim().max(300).optional(),
});

export async function updateAppointmentStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('agenda:manage');

    const parsed = statusSchema.safeParse({
      appointmentId: formData.get('appointmentId'),
      status: formData.get('status'),
      reason: formData.get('reason') || undefined,
    });
    if (!parsed.success) return errorState('Dados inválidos para alterar o status.');

    const { appointmentId, status, reason } = parsed.data;

    const { error } = await context.supabase
      .from('appointments')
      .update({
        status,
        cancellation_reason:
          status === 'cancelled' || status === 'no_show' ? (reason ?? null) : null,
      })
      .eq('id', appointmentId);

    if (error) return databaseErrorState(error);

    await audit(context, 'status_change', 'appointments', appointmentId, { status });

    // Notificação: a entrega é feita pelos adaptadores (email/WhatsApp).
    if (status === 'confirmed' || status === 'cancelled') {
      const { data: appointment } = await context.supabase
        .from('appointments')
        .select('contact_email, starts_at')
        .eq('id', appointmentId)
        .maybeSingle();

      const contact = appointment as { contact_email: string | null; starts_at: string } | null;

      if (contact?.contact_email) {
        await context.supabase.from('notifications').insert({
          channel: 'email',
          template: status === 'confirmed' ? 'appointment_confirmed' : 'appointment_cancelled',
          recipient: contact.contact_email,
          subject:
            status === 'confirmed' ? 'Seu atendimento foi confirmado' : 'Atendimento cancelado',
          payload: { starts_at: contact.starts_at },
          related_table: 'appointments',
          related_id: appointmentId,
        });
      }
    }

    revalidatePath('/admin/agenda');
    revalidatePath('/admin');
    return successState('Status atualizado.');
  });
}

const rescheduleSchema = z.object({
  appointmentId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  reason: z.string().trim().max(300).optional(),
});

export async function rescheduleAppointment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('agenda:manage');

    const parsed = rescheduleSchema.safeParse({
      appointmentId: formData.get('appointmentId'),
      date: formData.get('date'),
      startTime: formData.get('startTime'),
      reason: formData.get('reason') || undefined,
    });
    if (!parsed.success) return errorState('Informe a nova data e o novo horário.');

    const settings = await getSiteSettings();

    // A RPC libera o horário antigo e reserva o novo em uma única transação,
    // recusando conflito pela exclusion constraint.
    const { error } = await context.supabase.rpc('reschedule_appointment', {
      p_appointment_id: parsed.data.appointmentId,
      p_starts_at: toInstant(parsed.data.date, parsed.data.startTime, settings.booking.timezone),
      p_reason: parsed.data.reason ?? null,
    });

    if (error) return databaseErrorState(error);

    await audit(context, 'reschedule', 'appointments', parsed.data.appointmentId, {
      date: parsed.data.date,
      time: parsed.data.startTime,
    });

    revalidatePath('/admin/agenda');
    return successState('Atendimento reagendado.');
  });
}

export async function createBlockedTime(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('agenda:manage');

    const parsed = parseForm(blockedTimeSchema, formData);
    if (!parsed.ok) return parsed.state;

    const settings = await getSiteSettings();
    const timezone = settings.booking.timezone;

    const { data, error } = await context.supabase
      .from('blocked_times')
      .insert({
        starts_at: toInstant(parsed.data.date, parsed.data.startTime, timezone),
        ends_at: toInstant(parsed.data.date, parsed.data.endTime, timezone),
        reason: parsed.data.reason ?? null,
        created_by: context.session.id,
      })
      .select('id')
      .single();

    if (error) return databaseErrorState(error);

    await audit(context, 'create', 'blocked_times', (data as { id: string }).id);
    revalidatePath('/admin/agenda');
    return successState('Horário bloqueado.');
  });
}

export async function deleteBlockedTime(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('agenda:manage');

    const id = String(formData.get('blockedTimeId') ?? '');
    if (!id) return errorState('Bloqueio não informado.');

    const { error } = await context.supabase.from('blocked_times').delete().eq('id', id);
    if (error) return databaseErrorState(error);

    await audit(context, 'delete', 'blocked_times', id);
    revalidatePath('/admin/agenda');
    return successState('Bloqueio removido.');
  });
}

/**
 * Converte uma solicitação pública em paciente + atendimento confirmado.
 * Mantém o histórico da solicitação (LGPD/auditoria) e evita cadastro
 * duplicado ao reaproveitar paciente com o mesmo e-mail.
 */
export async function acceptRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('agenda:manage');

    const appointmentId = String(formData.get('appointmentId') ?? '');
    if (!appointmentId) return errorState('Atendimento não informado.');

    const { data: appointmentData, error: fetchError } = await context.supabase
      .from('appointments')
      .select('id, patient_id, contact_name, contact_email, contact_phone, patient_notes')
      .eq('id', appointmentId)
      .maybeSingle();

    if (fetchError) return databaseErrorState(fetchError);

    const appointment = appointmentData as {
      id: string;
      patient_id: string | null;
      contact_name: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      patient_notes: string | null;
    } | null;

    if (!appointment) return errorState('Atendimento não encontrado.');

    let patientId = appointment.patient_id;

    if (!patientId && appointment.contact_name) {
      if (appointment.contact_email) {
        const { data: existing } = await context.supabase
          .from('patients')
          .select('id')
          .eq('email', appointment.contact_email.toLowerCase())
          .maybeSingle();
        if (existing) patientId = (existing as { id: string }).id;
      }

      if (!patientId) {
        const { data: created, error: patientError } = await context.supabase
          .from('patients')
          .insert({
            full_name: appointment.contact_name,
            email: appointment.contact_email?.toLowerCase() ?? null,
            phone: appointment.contact_phone,
            referral_source: 'Agendamento pelo site',
            admin_notes: appointment.patient_notes,
            created_by: context.session.id,
          })
          .select('id')
          .single();

        if (patientError) return databaseErrorState(patientError);
        patientId = (created as { id: string }).id;
        await audit(context, 'create', 'patients', patientId, { origin: 'appointment_request' });
      }
    }

    const { error: updateError } = await context.supabase
      .from('appointments')
      .update({ status: 'confirmed', patient_id: patientId })
      .eq('id', appointmentId);

    if (updateError) return databaseErrorState(updateError);

    await context.supabase
      .from('appointment_requests')
      .update({
        status: 'accepted',
        handled_by: context.session.id,
        handled_at: new Date().toISOString(),
      })
      .eq('appointment_id', appointmentId);

    if (appointment.contact_email) {
      await context.supabase.from('notifications').insert({
        channel: 'email',
        template: 'appointment_confirmed',
        recipient: appointment.contact_email,
        subject: 'Seu atendimento foi confirmado',
        payload: { appointment_id: appointmentId },
        related_table: 'appointments',
        related_id: appointmentId,
      });
    }

    await audit(context, 'accept_request', 'appointments', appointmentId);

    revalidatePath('/admin/agenda');
    revalidatePath('/admin');
    revalidatePath('/admin/pacientes');
    return successState('Solicitação confirmada.');
  });
}
