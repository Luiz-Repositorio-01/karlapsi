'use client';

import { useState } from 'react';
import { Eye, PencilLine } from 'lucide-react';
import { Alert, Badge, Button, Card, FormField, fieldAria, inputClasses } from '@/components/ui';
import { ActionForm } from '@/components/admin/forms';
import { cn } from '@/lib/utils/cn';
import { renderMarkdown } from '@/lib/content/markdown';
import { estimateReadingMinutes, slugify } from '@/lib/utils/format';
import type { ActionState } from '@/lib/actions/state';
import type { BlogPost } from '@/lib/types';

/**
 * Editor de artigo.
 *
 * Markdown com pré-visualização usando exatamente o mesmo renderizador do site
 * (`renderMarkdown`), que escapa o HTML antes de converter — o que aparece aqui
 * é o que será publicado, sem risco de injeção.
 */
export function PostEditor({
  action,
  post,
  categories,
}: {
  action: (
    postId: string | null,
    state: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
  post: BlogPost | null;
  categories: { id: string; name: string }[];
}) {
  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));
  const [content, setContent] = useState(post?.content ?? '');
  const [status, setStatus] = useState(post?.status ?? 'draft');
  const [seoDescription, setSeoDescription] = useState(post?.seo_description ?? '');
  const [tab, setTab] = useState<'editar' | 'preview'>('editar');

  const readingMinutes = estimateReadingMinutes(content || ' ');

  return (
    <ActionForm
      action={action.bind(null, post?.id ?? null)}
      submitLabel={post ? 'Salvar artigo' : 'Criar artigo'}
      pendingLabel="Salvando…"
    >
      {(state) => (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-5">
            <FormField label="Título" htmlFor="post-titulo" required error={state.fields?.title}>
              <input
                {...fieldAria('post-titulo', { error: Boolean(state.fields?.title) })}
                type="text"
                name="title"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (!slugTouched) setSlug(slugify(event.target.value));
                }}
                className={inputClasses}
                required
              />
            </FormField>

            <FormField
              label="Slug (URL)"
              htmlFor="post-slug"
              required
              hint={`Endereço final: /blog/${slug || 'seu-artigo'}`}
              error={state.fields?.slug}
            >
              <input
                {...fieldAria('post-slug', { hint: true, error: Boolean(state.fields?.slug) })}
                type="text"
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(slugify(event.target.value));
                }}
                className={inputClasses}
                required
              />
            </FormField>

            <FormField
              label="Resumo"
              htmlFor="post-resumo"
              hint="Aparece nos cartões e nas buscas. Se vazio, é gerado a partir do conteúdo."
              error={state.fields?.excerpt}
            >
              <textarea
                {...fieldAria('post-resumo', { hint: true, error: Boolean(state.fields?.excerpt) })}
                name="excerpt"
                rows={2}
                defaultValue={post?.excerpt ?? ''}
                className={cn(inputClasses, 'resize-y')}
              />
            </FormField>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div
                  role="tablist"
                  aria-label="Modo de edição"
                  className="flex gap-1 rounded-xl bg-surface p-1 ring-1 ring-petrol-100"
                >
                  {(['editar', 'preview'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="tab"
                      aria-selected={tab === option}
                      onClick={() => setTab(option)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors',
                        tab === option ? 'bg-petrol-700 text-white' : 'text-ink-soft hover:bg-petrol-50',
                      )}
                    >
                      {option === 'editar' ? (
                        <PencilLine aria-hidden="true" className="h-3.5 w-3.5" />
                      ) : (
                        <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                      )}
                      {option}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-ink-faint">
                  {readingMinutes} min de leitura estimados
                </span>
              </div>

              {tab === 'editar' ? (
                <FormField
                  label="Conteúdo (Markdown)"
                  htmlFor="post-conteudo"
                  required
                  error={state.fields?.content}
                >
                  <textarea
                    {...fieldAria('post-conteudo', { error: Boolean(state.fields?.content) })}
                    name="content"
                    rows={22}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    className={cn(inputClasses, 'resize-y font-mono text-[0.8125rem] leading-relaxed')}
                    required
                  />
                </FormField>
              ) : (
                <>
                  {/* O textarea segue no DOM para que o valor seja enviado. */}
                  <textarea name="content" value={content} readOnly hidden />
                  <Card className="max-h-[38rem] overflow-y-auto">
                    {content.trim() ? (
                      <div
                        className="article-body"
                        /* Mesmo renderizador do site, com escape prévio do HTML. */
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                      />
                    ) : (
                      <p className="text-sm text-ink-muted">
                        Escreva o conteúdo para ver a pré-visualização.
                      </p>
                    )}
                  </Card>
                </>
              )}
            </div>
          </div>

          <aside className="space-y-5">
            <Card>
              <h2 className="font-display text-base text-ink">Publicação</h2>

              <div className="mt-4 space-y-4">
                <FormField label="Status" htmlFor="post-status" required>
                  <select
                    {...fieldAria('post-status', {})}
                    name="status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as typeof status)}
                    className={inputClasses}
                  >
                    <option value="draft">Rascunho</option>
                    <option value="scheduled">Agendado</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </FormField>

                {status === 'scheduled' ? (
                  <FormField
                    label="Publicar em"
                    htmlFor="post-agendamento"
                    required
                    error={state.fields?.scheduledFor}
                  >
                    <input
                      {...fieldAria('post-agendamento', {
                        error: Boolean(state.fields?.scheduledFor),
                      })}
                      type="datetime-local"
                      name="scheduledFor"
                      defaultValue={
                        post?.scheduled_for ? post.scheduled_for.slice(0, 16) : undefined
                      }
                      className={inputClasses}
                      required
                    />
                  </FormField>
                ) : null}

                <FormField label="Categoria" htmlFor="post-categoria">
                  <select
                    {...fieldAria('post-categoria', {})}
                    name="categoryId"
                    defaultValue={post?.category_id ?? ''}
                    className={inputClasses}
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Tags"
                  htmlFor="post-tags"
                  hint="Separadas por vírgula (máximo 12)"
                >
                  <input
                    {...fieldAria('post-tags', { hint: true })}
                    type="text"
                    name="tags"
                    defaultValue={post?.tags.join(', ') ?? ''}
                    className={inputClasses}
                  />
                </FormField>
              </div>
            </Card>

            <Card>
              <h2 className="font-display text-base text-ink">SEO</h2>

              <div className="mt-4 space-y-4">
                <FormField
                  label="Título para busca"
                  htmlFor="post-seo-titulo"
                  hint="Ideal até 60 caracteres. Se vazio, usa o título do artigo."
                >
                  <input
                    {...fieldAria('post-seo-titulo', { hint: true })}
                    type="text"
                    name="seoTitle"
                    maxLength={70}
                    defaultValue={post?.seo_title ?? ''}
                    className={inputClasses}
                  />
                </FormField>

                <FormField
                  label="Meta description"
                  htmlFor="post-seo-descricao"
                  hint={`${seoDescription.length}/160 caracteres recomendados`}
                >
                  <textarea
                    {...fieldAria('post-seo-descricao', { hint: true })}
                    name="seoDescription"
                    rows={3}
                    maxLength={320}
                    value={seoDescription}
                    onChange={(event) => setSeoDescription(event.target.value)}
                    className={cn(inputClasses, 'resize-y')}
                  />
                </FormField>

                {seoDescription.length > 165 ? (
                  <Alert tone="warning">
                    Descrições muito longas são cortadas nos resultados de busca.
                  </Alert>
                ) : null}
              </div>
            </Card>

            <Card>
              <h2 className="font-display text-base text-ink">Imagem de capa</h2>
              <div className="mt-4 space-y-4">
                <FormField
                  label="URL da imagem"
                  htmlFor="post-capa"
                  hint="Use uma URL do Supabase Storage (bucket public-assets)"
                >
                  <input
                    {...fieldAria('post-capa', { hint: true })}
                    type="url"
                    name="coverUrl"
                    defaultValue={post?.cover_url ?? ''}
                    className={inputClasses}
                  />
                </FormField>

                <FormField
                  label="Texto alternativo"
                  htmlFor="post-capa-alt"
                  hint="Descreva a imagem para leitores de tela"
                >
                  <input
                    {...fieldAria('post-capa-alt', { hint: true })}
                    type="text"
                    name="coverAlt"
                    defaultValue={post?.cover_alt ?? ''}
                    className={inputClasses}
                  />
                </FormField>
              </div>
            </Card>

            {post ? (
              <Card className="bg-surface-muted">
                <p className="text-xs text-ink-faint">
                  Criado em {new Date(post.created_at).toLocaleDateString('pt-BR')} · última
                  atualização {new Date(post.updated_at).toLocaleDateString('pt-BR')}
                </p>
                {post.status === 'published' ? (
                  <Badge tone="success" className="mt-3">
                    No ar
                  </Badge>
                ) : null}
              </Card>
            ) : null}

            <Button type="button" variant="ghost" size="sm" className="w-full" disabled>
              As alterações são salvas ao enviar o formulário
            </Button>
          </aside>
        </div>
      )}
    </ActionForm>
  );
}
