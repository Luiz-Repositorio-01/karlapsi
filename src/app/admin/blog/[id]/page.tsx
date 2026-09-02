import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Alert, ButtonLink } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { PostEditor } from '@/app/admin/blog/[id]/PostEditor';
import { requirePermission } from '@/lib/auth/session';
import { getPost, listAllCategories } from '@/lib/data/admin';
import { saveBlogPost } from '@/app/admin/_actions/content';

export default async function BlogEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  await requirePermission('content:manage', `/admin/blog/${id}`);

  const isNew = id === 'novo';
  const [postResult, categoriesResult] = await Promise.all([
    isNew ? Promise.resolve({ data: null }) : getPost(id),
    listAllCategories(),
  ]);

  if (!isNew && !postResult.data) notFound();

  return (
    <>
      <Link
        href="/admin/blog"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-petrol-700 transition-colors hover:text-petrol-900"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Voltar para o blog
      </Link>

      <AdminPageHeader
        title={isNew ? 'Novo artigo' : 'Editar artigo'}
        description="O conteúdo aceita Markdown simples: ## título, **negrito**, *itálico*, listas, > citação e [link](url)."
      />

      {created === '1' && postResult.data ? (
        <Alert tone="success" title="Artigo criado" className="mb-5">
          {postResult.data.status === 'published' ? (
            <>
              O artigo já está no ar.{' '}
              <ButtonLink href={`/blog/${postResult.data.slug}`} external variant="ghost" size="sm">
                Ver no site
              </ButtonLink>
            </>
          ) : (
            'Salvo como rascunho. Altere o status para "Publicado" para exibir no site.'
          )}
        </Alert>
      ) : null}

      <PostEditor
        action={saveBlogPost}
        post={postResult.data}
        categories={categoriesResult.data.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
      />
    </>
  );
}
