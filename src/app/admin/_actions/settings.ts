'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { settingsSchema } from '@/lib/validation/schemas';
import {
  audit,
  authorize,
  databaseErrorState,
  errorState,
  runAction,
  successState,
  validationState,
  type ActionState,
} from './shared';

/**
 * Configurações do site e gestão de usuários.
 *
 * Tudo o que é texto público, contato, SEO e regra de agendamento vive em
 * `site_settings` e é editável aqui — sem alterar código.
 */

function readBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === 'on' || value === 'true';
}

export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('settings:manage');

    const payload = {
      identity: {
        brand_name: String(formData.get('identity.brand_name') ?? ''),
        professional_name: String(formData.get('identity.professional_name') ?? ''),
        positioning: String(formData.get('identity.positioning') ?? ''),
        headline: String(formData.get('identity.headline') ?? ''),
        subheadline: String(formData.get('identity.subheadline') ?? ''),
        professional_registration_label: String(
          formData.get('identity.professional_registration_label') ?? '',
        ),
        professional_registration_value: String(
          formData.get('identity.professional_registration_value') ?? '',
        ),
        short_bio: String(formData.get('identity.short_bio') ?? ''),
        photo_url: String(formData.get('identity.photo_url') ?? ''),
      },
      contact: {
        whatsapp: String(formData.get('contact.whatsapp') ?? ''),
        phone: String(formData.get('contact.phone') ?? ''),
        email: String(formData.get('contact.email') ?? ''),
        instagram: String(formData.get('contact.instagram') ?? ''),
        address_line: String(formData.get('contact.address_line') ?? ''),
        city: String(formData.get('contact.city') ?? ''),
        state: String(formData.get('contact.state') ?? ''),
        service_area: String(formData.get('contact.service_area') ?? ''),
        office_hours_label: String(formData.get('contact.office_hours_label') ?? ''),
      },
      booking: {
        timezone: String(formData.get('booking.timezone') ?? 'America/Sao_Paulo'),
        min_lead_hours: formData.get('booking.min_lead_hours'),
        max_advance_days: formData.get('booking.max_advance_days'),
        default_slot_interval_minutes: formData.get('booking.default_slot_interval_minutes'),
        auto_confirm: readBoolean(formData, 'booking.auto_confirm'),
        show_prices_publicly: readBoolean(formData, 'booking.show_prices_publicly'),
        require_consent: true,
        consent_version: String(formData.get('booking.consent_version') ?? '1.0'),
      },
      seo: {
        site_name: String(formData.get('seo.site_name') ?? ''),
        default_title: String(formData.get('seo.default_title') ?? ''),
        default_description: String(formData.get('seo.default_description') ?? ''),
        default_keywords: String(formData.get('seo.default_keywords') ?? ''),
      },
      features: {
        show_testimonials: readBoolean(formData, 'features.show_testimonials'),
        enable_online_payments: readBoolean(formData, 'features.enable_online_payments'),
        enable_pdf_online: readBoolean(formData, 'features.enable_pdf_online'),
        enable_blog: readBoolean(formData, 'features.enable_blog'),
        enable_store: readBoolean(formData, 'features.enable_store'),
      },
    };

    const parsed = settingsSchema.safeParse(payload);
    if (!parsed.success) return validationState(parsed.error);

    const rows = Object.entries(parsed.data).map(([key, value]) => ({
      key,
      value,
      updated_by: context.session.id,
    }));

    const { error } = await context.supabase.from('site_settings').upsert(rows, {
      onConflict: 'key',
    });

    if (error) return databaseErrorState(error);

    await audit(context, 'update', 'site_settings', null, { keys: Object.keys(parsed.data) });

    // O site público lê essas configurações em várias rotas.
    revalidatePath('/', 'layout');
    revalidatePath('/admin/configuracoes');
    return successState('Configurações salvas.');
  });
}

// -----------------------------------------------------------------------------
// Usuários e papéis
// -----------------------------------------------------------------------------
const roleSchema = z.object({
  profileId: z.string().uuid(),
  role: z.enum(['OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL']),
});

/**
 * Alteração de papel.
 *
 * A permissão `users:manage` é exclusiva do OWNER, e o banco reforça as
 * regras: ninguém altera o próprio papel e somente o OWNER concede OWNER.
 */
export async function updateUserRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('users:manage');

    const parsed = roleSchema.safeParse({
      profileId: formData.get('profileId'),
      role: formData.get('role'),
    });
    if (!parsed.success) return errorState('Papel inválido.');

    if (parsed.data.profileId === context.session.id) {
      return errorState('Não é possível alterar o seu próprio papel de acesso.');
    }

    const { error } = await context.supabase
      .from('profiles')
      .update({ role: parsed.data.role })
      .eq('id', parsed.data.profileId);

    if (error) return databaseErrorState(error);

    await audit(context, 'role_change', 'profiles', parsed.data.profileId, {
      role: parsed.data.role,
    });

    revalidatePath('/admin/usuarios');
    return successState('Papel atualizado.');
  });
}

export async function toggleUserActive(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('users:manage');

    const profileId = String(formData.get('profileId') ?? '');
    const isActive = formData.get('isActive') === 'true';

    if (!profileId) return errorState('Usuário não informado.');
    if (profileId === context.session.id) {
      return errorState('Não é possível desativar o seu próprio acesso.');
    }

    const { error } = await context.supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', profileId);

    if (error) return databaseErrorState(error);

    await audit(context, isActive ? 'activate' : 'deactivate', 'profiles', profileId);
    revalidatePath('/admin/usuarios');
    return successState(isActive ? 'Acesso reativado.' : 'Acesso desativado.');
  });
}

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(20).optional(),
  specialty: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
  avatarUrl: z.string().trim().max(500).optional(),
  isPublicAuthor: z.boolean().default(false),
});

/** Cada usuário edita o próprio perfil (aparece como autoria no blog). */
export async function updateOwnProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('dashboard:view');

    const parsed = profileSchema.safeParse({
      fullName: formData.get('fullName'),
      phone: formData.get('phone') || undefined,
      specialty: formData.get('specialty') || undefined,
      bio: formData.get('bio') || undefined,
      avatarUrl: formData.get('avatarUrl') || undefined,
      isPublicAuthor: formData.get('isPublicAuthor') === 'on',
    });

    if (!parsed.success) return validationState(parsed.error);

    const { error } = await context.supabase
      .from('profiles')
      .update({
        full_name: parsed.data.fullName,
        phone: parsed.data.phone ?? null,
        specialty: parsed.data.specialty ?? null,
        bio: parsed.data.bio ?? null,
        avatar_url: parsed.data.avatarUrl ?? null,
        is_public_author: parsed.data.isPublicAuthor,
      })
      .eq('id', context.session.id);

    if (error) return databaseErrorState(error);

    await audit(context, 'update', 'profiles', context.session.id);
    revalidatePath('/admin/perfil');
    revalidatePath('/blog');
    return successState('Perfil atualizado.');
  });
}
