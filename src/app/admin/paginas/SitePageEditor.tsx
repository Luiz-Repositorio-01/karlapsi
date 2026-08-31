'use client';

import { FormField, fieldAria, inputClasses } from '@/components/ui';
import { ActionForm } from '@/components/admin/forms';
import { cn } from '@/lib/utils/cn';
import type { ActionState } from '@/lib/actions/state';

export function SitePageEditor({
  action,
  slug,
  title,
  subtitle,
  sectionsText,
  seoTitle,
  seoDescription,
  isPublished,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  slug: string;
  title: string;
  subtitle: string;
  sectionsText: string;
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
}) {
  return (
    <ActionForm
      action={action}
      submitLabel="Salvar página"
      pendingLabel="Salvando…"
      hiddenFields={{ slug }}
    >
      {(state) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Título"
            htmlFor={`pagina-${slug}-titulo`}
            required
            error={state.fields?.title}
          >
            <input
              {...fieldAria(`pagina-${slug}-titulo`, { error: Boolean(state.fields?.title) })}
              type="text"
              name="title"
              defaultValue={title}
              className={inputClasses}
              required
            />
          </FormField>

          <FormField label="Subtítulo" htmlFor={`pagina-${slug}-subtitulo`}>
            <input
              {...fieldAria(`pagina-${slug}-subtitulo`, {})}
              type="text"
              name="subtitle"
              defaultValue={subtitle}
              className={inputClasses}
            />
          </FormField>

          <FormField
            label="Seções"
            htmlFor={`pagina-${slug}-secoes`}
            hint="Use ## para cada seção e - para itens (ver instruções acima)."
            className="sm:col-span-2"
          >
            <textarea
              {...fieldAria(`pagina-${slug}-secoes`, { hint: true })}
              name="sectionsText"
              rows={14}
              defaultValue={sectionsText}
              className={cn(inputClasses, 'resize-y font-mono text-[0.8125rem] leading-relaxed')}
            />
          </FormField>

          <FormField
            label="SEO — título"
            htmlFor={`pagina-${slug}-seo-titulo`}
            hint="Até 60 caracteres"
          >
            <input
              {...fieldAria(`pagina-${slug}-seo-titulo`, { hint: true })}
              type="text"
              name="seoTitle"
              maxLength={70}
              defaultValue={seoTitle}
              className={inputClasses}
            />
          </FormField>

          <FormField
            label="SEO — descrição"
            htmlFor={`pagina-${slug}-seo-descricao`}
            hint="Até 160 caracteres"
          >
            <input
              {...fieldAria(`pagina-${slug}-seo-descricao`, { hint: true })}
              type="text"
              name="seoDescription"
              maxLength={320}
              defaultValue={seoDescription}
              className={inputClasses}
            />
          </FormField>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface-muted p-4 text-sm text-ink-soft sm:col-span-2">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={isPublished}
              className="h-4 w-4 accent-petrol-700"
            />
            Publicada no site
          </label>
        </div>
      )}
    </ActionForm>
  );
}
