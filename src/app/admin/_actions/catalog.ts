'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  availabilityExceptionSchema,
  availabilityRuleSchema,
  productSchema,
  serviceSchema,
  slugSchema,
} from '@/lib/validation/schemas';
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

/** Serviços, disponibilidade, produtos, infobooks e landing pages. */

const BOOLEAN_SERVICE_FIELDS = [
  'showPricePublicly',
  'allowsOnlineBooking',
  'requiresPayment',
  'isActive',
  'isFeatured',
];

export async function saveService(
  serviceId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('services:manage');

    const parsed = parseForm(serviceSchema, formData, {
      booleans: BOOLEAN_SERVICE_FIELDS,
      numbers: ['priceCents'],
    });
    if (!parsed.ok) return parsed.state;

    const input = parsed.data;
    const row = {
      name: input.name,
      slug: input.slug,
      summary: input.summary ?? null,
      description: input.description ?? null,
      duration_minutes: input.durationMinutes,
      price_cents: input.priceCents ?? null,
      show_price_publicly: input.showPricePublicly,
      allows_online_booking: input.allowsOnlineBooking,
      requires_payment: input.requiresPayment,
      is_active: input.isActive,
      is_featured: input.isFeatured,
      image_url: input.imageUrl ?? null,
      preparation_notes: input.preparationNotes ?? null,
      sort_order: input.sortOrder,
    };

    if (serviceId) {
      const { error } = await context.supabase.from('services').update(row).eq('id', serviceId);
      if (error) return databaseErrorState(error);
      await audit(context, 'update', 'services', serviceId);
    } else {
      const { data, error } = await context.supabase
        .from('services')
        .insert(row)
        .select('id')
        .single();
      if (error) return databaseErrorState(error);
      await audit(context, 'create', 'services', (data as { id: string }).id);
    }

    revalidatePath('/admin/servicos');
    revalidatePath('/servicos');
    revalidatePath('/');
    return successState(serviceId ? 'Serviço atualizado.' : 'Serviço criado.');
  });
}

export async function toggleServiceActive(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('services:manage');

    const serviceId = String(formData.get('serviceId') ?? '');
    const isActive = formData.get('isActive') === 'true';
    if (!serviceId) return errorState('Serviço não informado.');

    const { error } = await context.supabase
      .from('services')
      .update({ is_active: isActive })
      .eq('id', serviceId);

    if (error) return databaseErrorState(error);

    await audit(context, 'update', 'services', serviceId, { is_active: isActive });
    revalidatePath('/admin/servicos');
    revalidatePath('/servicos');
    return successState(isActive ? 'Serviço ativado.' : 'Serviço desativado.');
  });
}

export async function saveAvailabilityRule(
  ruleId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('availability:manage');

    const parsed = parseForm(availabilityRuleSchema, formData, { booleans: ['isActive'] });
    if (!parsed.ok) return parsed.state;

    const row = {
      weekday: parsed.data.weekday,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
      slot_interval_minutes: parsed.data.slotIntervalMinutes,
      break_start_time: parsed.data.breakStartTime ?? null,
      break_end_time: parsed.data.breakEndTime ?? null,
      is_active: parsed.data.isActive,
    };

    if (ruleId) {
      const { error } = await context.supabase
        .from('availability_rules')
        .update(row)
        .eq('id', ruleId);
      if (error) return databaseErrorState(error);
      await audit(context, 'update', 'availability_rules', ruleId);
    } else {
      const { data, error } = await context.supabase
        .from('availability_rules')
        .insert(row)
        .select('id')
        .single();
      if (error) return databaseErrorState(error);
      await audit(context, 'create', 'availability_rules', (data as { id: string }).id);
    }

    revalidatePath('/admin/disponibilidade');
    return successState(ruleId ? 'Horário atualizado.' : 'Horário adicionado.');
  });
}

export async function deleteAvailabilityRule(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('availability:manage');

    const ruleId = String(formData.get('ruleId') ?? '');
    if (!ruleId) return errorState('Horário não informado.');

    const { error } = await context.supabase.from('availability_rules').delete().eq('id', ruleId);
    if (error) return databaseErrorState(error);

    await audit(context, 'delete', 'availability_rules', ruleId);
    revalidatePath('/admin/disponibilidade');
    return successState('Horário removido.');
  });
}

export async function saveAvailabilityException(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('availability:manage');

    const parsed = parseForm(availabilityExceptionSchema, formData, { booleans: ['isAvailable'] });
    if (!parsed.ok) return parsed.state;

    const { data, error } = await context.supabase
      .from('availability_exceptions')
      .upsert(
        {
          exception_date: parsed.data.exceptionDate,
          is_available: parsed.data.isAvailable,
          start_time: parsed.data.startTime ?? null,
          end_time: parsed.data.endTime ?? null,
          reason: parsed.data.reason ?? null,
          created_by: context.session.id,
        },
        { onConflict: 'exception_date' },
      )
      .select('id')
      .single();

    if (error) return databaseErrorState(error);

    await audit(context, 'upsert', 'availability_exceptions', (data as { id: string }).id, {
      date: parsed.data.exceptionDate,
      available: parsed.data.isAvailable,
    });

    revalidatePath('/admin/disponibilidade');
    return successState('Exceção registrada.');
  });
}

export async function deleteAvailabilityException(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('availability:manage');

    const exceptionId = String(formData.get('exceptionId') ?? '');
    if (!exceptionId) return errorState('Exceção não informada.');

    const { error } = await context.supabase
      .from('availability_exceptions')
      .delete()
      .eq('id', exceptionId);
    if (error) return databaseErrorState(error);

    await audit(context, 'delete', 'availability_exceptions', exceptionId);
    revalidatePath('/admin/disponibilidade');
    return successState('Exceção removida.');
  });
}

// -----------------------------------------------------------------------------
// Produtos
// -----------------------------------------------------------------------------
export async function saveProduct(
  productId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('products:manage');

    const parsed = parseForm(productSchema, formData, {
      booleans: ['isFree', 'isActive', 'isFeatured'],
      numbers: ['priceCents'],
    });
    if (!parsed.ok) return parsed.state;

    const input = parsed.data;
    const row = {
      name: input.name,
      slug: input.slug,
      type: input.type,
      summary: input.summary ?? null,
      description: input.description ?? null,
      price_cents: input.isFree ? 0 : input.priceCents,
      is_free: input.isFree,
      is_active: input.isActive,
      is_featured: input.isFeatured,
      cover_url: input.coverUrl ?? null,
      external_url: input.externalUrl ?? null,
      audience: input.audience ?? null,
      benefits: input.benefits,
    };

    if (productId) {
      const { error } = await context.supabase.from('products').update(row).eq('id', productId);
      if (error) return databaseErrorState(error);
      await audit(context, 'update', 'products', productId);
    } else {
      const { data, error } = await context.supabase
        .from('products')
        .insert(row)
        .select('id')
        .single();
      if (error) return databaseErrorState(error);
      await audit(context, 'create', 'products', (data as { id: string }).id);
    }

    revalidatePath('/admin/produtos');
    revalidatePath('/materiais');
    return successState(productId ? 'Material atualizado.' : 'Material criado.');
  });
}

// -----------------------------------------------------------------------------
// Infobooks e landing pages
//
// Os campos `legacy_path` apontam para os arquivos ORIGINAIS em /public/legacy.
// Salvar aqui apenas registra o caminho — o arquivo nunca é alterado.
// -----------------------------------------------------------------------------
const infobookSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: slugSchema,
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(80).optional(),
  coverUrl: z.string().trim().max(500).optional(),
  isFree: z.boolean().default(false),
  priceCents: z.coerce.number().int().min(0).optional(),
  publicFileUrl: z.string().trim().max(500).optional(),
  previewUrl: z.string().trim().max(500).optional(),
  legacyPath: z.string().trim().max(300).optional(),
  pages: z.coerce.number().int().min(1).max(5000).optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']).default('published'),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(320).optional(),
});

export async function saveInfobook(
  infobookId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('content:manage');

    const parsed = parseForm(infobookSchema, formData, {
      booleans: ['isFree'],
      numbers: ['priceCents', 'pages'],
    });
    if (!parsed.ok) return parsed.state;

    const input = parsed.data;
    const row = {
      title: input.title,
      slug: input.slug,
      description: input.description || null,
      category: input.category || null,
      cover_url: input.coverUrl || null,
      is_free: input.isFree,
      price_cents: input.isFree ? null : (input.priceCents ?? null),
      public_file_url: input.publicFileUrl || null,
      preview_url: input.previewUrl || null,
      legacy_path: input.legacyPath || null,
      pages: input.pages ?? null,
      status: input.status,
      sort_order: input.sortOrder,
      seo_title: input.seoTitle || null,
      seo_description: input.seoDescription || null,
    };

    if (infobookId) {
      const { error } = await context.supabase.from('infobooks').update(row).eq('id', infobookId);
      if (error) return databaseErrorState(error);
      await audit(context, 'update', 'infobooks', infobookId);
    } else {
      const { data, error } = await context.supabase
        .from('infobooks')
        .insert(row)
        .select('id')
        .single();
      if (error) return databaseErrorState(error);
      await audit(context, 'create', 'infobooks', (data as { id: string }).id);
    }

    revalidatePath('/admin/infobooks');
    revalidatePath('/infobooks');
    revalidatePath(`/infobooks/${input.slug}`);
    revalidatePath('/');
    return successState(infobookId ? 'Infobook atualizado.' : 'Infobook criado.');
  });
}

const landingPageSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: slugSchema,
  headline: z.string().trim().max(240).optional(),
  description: z.string().trim().max(4000).optional(),
  audience: z.string().trim().max(300).optional(),
  coverUrl: z.string().trim().max(500).optional(),
  priceCents: z.coerce.number().int().min(0).optional(),
  ctaLabel: z.string().trim().max(40).optional(),
  ctaUrl: z.string().trim().max(500).optional(),
  legacyPath: z.string().trim().max(300).optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']).default('published'),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  benefits: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 12)
        : [],
    ),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(320).optional(),
});

export async function saveLandingPage(
  landingPageId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('content:manage');

    const parsed = parseForm(landingPageSchema, formData, { numbers: ['priceCents'] });
    if (!parsed.ok) return parsed.state;

    const input = parsed.data;
    const row = {
      name: input.name,
      slug: input.slug,
      headline: input.headline || null,
      description: input.description || null,
      audience: input.audience || null,
      cover_url: input.coverUrl || null,
      price_cents: input.priceCents ?? null,
      cta_label: input.ctaLabel || 'Acessar',
      cta_url: input.ctaUrl || null,
      legacy_path: input.legacyPath || null,
      status: input.status,
      sort_order: input.sortOrder,
      benefits: input.benefits,
      seo_title: input.seoTitle || null,
      seo_description: input.seoDescription || null,
    };

    if (landingPageId) {
      const { error } = await context.supabase
        .from('landing_pages')
        .update(row)
        .eq('id', landingPageId);
      if (error) return databaseErrorState(error);
      await audit(context, 'update', 'landing_pages', landingPageId);
    } else {
      const { data, error } = await context.supabase
        .from('landing_pages')
        .insert(row)
        .select('id')
        .single();
      if (error) return databaseErrorState(error);
      await audit(context, 'create', 'landing_pages', (data as { id: string }).id);
    }

    revalidatePath('/admin/landing-pages');
    revalidatePath('/landing-pages');
    return successState(landingPageId ? 'Landing page atualizada.' : 'Landing page criada.');
  });
}
