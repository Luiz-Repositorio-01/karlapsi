'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { blogPostSchema } from '@/lib/validation/schemas';
import { estimateReadingMinutes } from '@/lib/utils/format';
import { excerptFromMarkdown } from '@/lib/content/markdown';
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

/** Blog, depoimentos e notificações internas. */

export async function saveBlogPost(
  postId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('content:manage');

    const parsed = parseForm(blogPostSchema, formData);
    if (!parsed.ok) return parsed.state;

    const input = parsed.data;

    // Publicação agendada precisa de data futura; publicação imediata recebe
    // published_at automaticamente (o banco também exige isso).
    let publishedAt: string | null = null;
    let scheduledFor: string | null = null;

    if (input.status === 'published') {
      publishedAt = new Date().toISOString();
    } else if (input.status === 'scheduled') {
      if (!input.scheduledFor) {
        return errorState('Informe a data e hora da publicação agendada.', {
          scheduledFor: 'Obrigatório para agendar',
        });
      }
      const parsedDate = new Date(input.scheduledFor);
      if (Number.isNaN(parsedDate.getTime())) {
        return errorState('Data de agendamento inválida.', { scheduledFor: 'Data inválida' });
      }
      scheduledFor = parsedDate.toISOString();
    }

    const row = {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt ?? excerptFromMarkdown(input.content),
      content: input.content,
      cover_url: input.coverUrl ?? null,
      cover_alt: input.coverAlt ?? null,
      category_id: input.categoryId ?? null,
      status: input.status,
      published_at: publishedAt,
      scheduled_for: scheduledFor,
      seo_title: input.seoTitle ?? null,
      seo_description: input.seoDescription ?? null,
      tags: input.tags,
      reading_minutes: estimateReadingMinutes(input.content),
      author_id: context.session.id,
    };

    if (postId) {
      // Mantém a data original de publicação ao reeditar um post já publicado.
      const { data: existing } = await context.supabase
        .from('blog_posts')
        .select('published_at')
        .eq('id', postId)
        .maybeSingle();

      const previous = (existing as { published_at: string | null } | null)?.published_at;

      const { error } = await context.supabase
        .from('blog_posts')
        .update({
          ...row,
          published_at: input.status === 'published' ? (previous ?? row.published_at) : null,
        })
        .eq('id', postId);

      if (error) return databaseErrorState(error);
      await audit(context, 'update', 'blog_posts', postId, { status: input.status });
    } else {
      const { data, error } = await context.supabase
        .from('blog_posts')
        .insert(row)
        .select('id')
        .single();

      if (error) return databaseErrorState(error);
      await audit(context, 'create', 'blog_posts', (data as { id: string }).id, {
        status: input.status,
      });
    }

    revalidatePath('/admin/blog');
    revalidatePath('/blog');
    revalidatePath(`/blog/${input.slug}`);
    revalidatePath('/');
    return successState(postId ? 'Artigo atualizado.' : 'Artigo criado.');
  });
}

export async function deleteBlogPost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('content:manage');

    const postId = String(formData.get('postId') ?? '');
    if (!postId) return errorState('Artigo não informado.');

    const { error } = await context.supabase.from('blog_posts').delete().eq('id', postId);
    if (error) return databaseErrorState(error);

    await audit(context, 'delete', 'blog_posts', postId);
    revalidatePath('/admin/blog');
    revalidatePath('/blog');
    return successState('Artigo excluído.');
  });
}

export async function publishScheduledPosts(): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('content:manage');

    const { data, error } = await context.supabase.rpc('publish_scheduled_posts');
    if (error) return databaseErrorState(error);

    const count = Number(data ?? 0);
    if (count > 0) {
      await audit(context, 'publish_scheduled', 'blog_posts', null, { count });
      revalidatePath('/blog');
      revalidatePath('/admin/blog');
    }

    return successState(
      count > 0
        ? `${count} ${count === 1 ? 'artigo publicado' : 'artigos publicados'}.`
        : 'Nenhum artigo agendado para publicar agora.',
    );
  });
}

// -----------------------------------------------------------------------------
// Depoimentos
//
// A publicação exige registro da autorização de uso — regra garantida também
// por check constraint no banco.
// -----------------------------------------------------------------------------
const testimonialSchema = z.object({
  authorDisplayName: z.string().trim().min(2).max(120),
  authorContext: z.string().trim().max(120).optional(),
  content: z.string().trim().min(10).max(1200),
  isPublished: z.boolean().default(false),
  authorizationReference: z.string().trim().max(200).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export async function saveTestimonial(
  testimonialId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('content:manage');

    const parsed = parseForm(testimonialSchema, formData, { booleans: ['isPublished'] });
    if (!parsed.ok) return parsed.state;

    const input = parsed.data;

    if (input.isPublished && !input.authorizationReference) {
      return errorState(
        'Para publicar um depoimento é obrigatório registrar a autorização de uso do autor.',
        { authorizationReference: 'Obrigatório para publicar' },
      );
    }

    const row = {
      author_display_name: input.authorDisplayName,
      author_context: input.authorContext ?? null,
      content: input.content,
      is_published: input.isPublished,
      authorization_reference: input.authorizationReference ?? null,
      authorized_at: input.isPublished ? new Date().toISOString() : null,
      sort_order: input.sortOrder,
      created_by: context.session.id,
    };

    if (testimonialId) {
      const { error } = await context.supabase
        .from('testimonials')
        .update(row)
        .eq('id', testimonialId);
      if (error) return databaseErrorState(error);
      await audit(context, 'update', 'testimonials', testimonialId);
    } else {
      const { data, error } = await context.supabase
        .from('testimonials')
        .insert(row)
        .select('id')
        .single();
      if (error) return databaseErrorState(error);
      await audit(context, 'create', 'testimonials', (data as { id: string }).id);
    }

    revalidatePath('/admin/depoimentos');
    revalidatePath('/');
    return successState(testimonialId ? 'Depoimento atualizado.' : 'Depoimento cadastrado.');
  });
}

// -----------------------------------------------------------------------------
// Notificações internas
// -----------------------------------------------------------------------------
export async function markNotificationRead(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('notifications:view');

    const notificationId = String(formData.get('notificationId') ?? '');
    if (!notificationId) return errorState('Notificação não informada.');

    const { error } = await context.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) return databaseErrorState(error);

    revalidatePath('/admin/notificacoes');
    revalidatePath('/admin');
    return successState('Notificação marcada como lida.');
  });
}

export async function markAllNotificationsRead(): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('notifications:view');

    const { error } = await context.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('channel', 'internal')
      .is('read_at', null);

    if (error) return databaseErrorState(error);

    revalidatePath('/admin/notificacoes');
    revalidatePath('/admin');
    return successState('Todas as notificações foram marcadas como lidas.');
  });
}

export async function updateRequestStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('notifications:view');

    const table = String(formData.get('table') ?? '');
    const id = String(formData.get('id') ?? '');
    const status = String(formData.get('status') ?? '');

    const allowedTables = ['contact_messages', 'appointment_requests', 'data_subject_requests'];
    const allowedStatuses = ['new', 'in_review', 'accepted', 'declined', 'archived'];

    if (!allowedTables.includes(table) || !allowedStatuses.includes(status) || !id) {
      return errorState('Solicitação inválida.');
    }

    const { error } = await context.supabase
      .from(table)
      .update({ status, handled_by: context.session.id })
      .eq('id', id);

    if (error) return databaseErrorState(error);

    await audit(context, 'status_change', table, id, { status });
    revalidatePath('/admin/notificacoes');
    return successState('Status atualizado.');
  });
}
