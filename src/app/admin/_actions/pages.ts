'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  audit,
  authorize,
  databaseErrorState,
  runAction,
  successState,
  validationState,
  type ActionState,
} from './shared';
import { parseSections } from '@/lib/content/site-pages';

/**
 * Conteúdo institucional editável (`site_pages`).
 *
 * As seções são digitadas em texto simples — sem exigir JSON de quem edita:
 *
 *   ## Título da seção
 *   Parágrafo livre da seção.
 *   - Item da lista :: descrição do item
 *
 * O parser abaixo converte esse formato na estrutura `sections` usada pelo
 * site. Enquanto não existir registro em `site_pages`, o site usa o texto
 * padrão de `src/lib/content/defaults.ts`.
 */

const pageSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug inválido'),
  title: z.string().trim().min(2, 'Informe o título').max(160),
  subtitle: z.string().trim().max(400).optional(),
  sectionsText: z.string().trim().max(30_000),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  isPublished: z.boolean().default(true),
});

export async function saveSitePage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('settings:manage');

    const parsed = pageSchema.safeParse({
      slug: formData.get('slug'),
      title: formData.get('title'),
      subtitle: formData.get('subtitle') || undefined,
      sectionsText: formData.get('sectionsText') ?? '',
      seoTitle: formData.get('seoTitle') || undefined,
      seoDescription: formData.get('seoDescription') || undefined,
      isPublished: formData.get('isPublished') === 'on',
    });

    if (!parsed.success) return validationState(parsed.error);

    const { error } = await context.supabase.from('site_pages').upsert(
      {
        slug: parsed.data.slug,
        title: parsed.data.title,
        subtitle: parsed.data.subtitle ?? null,
        sections: parseSections(parsed.data.sectionsText),
        seo_title: parsed.data.seoTitle ?? null,
        seo_description: parsed.data.seoDescription ?? null,
        is_published: parsed.data.isPublished,
        updated_by: context.session.id,
      },
      { onConflict: 'slug' },
    );

    if (error) return databaseErrorState(error);

    await audit(context, 'upsert', 'site_pages', parsed.data.slug);

    revalidatePath('/admin/paginas');
    revalidatePath(`/${parsed.data.slug}`);
    revalidatePath('/');
    return successState('Página atualizada.');
  });
}
