import Link from 'next/link';
import { Clock, PencilLine } from 'lucide-react';
import { Alert, Badge, ButtonLink, Card, EmptyState } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { StatusBadge } from '@/components/admin/ui';
import { ActionButton, SimpleAction } from '@/components/admin/forms';
import { requirePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { listAllPosts } from '@/lib/data/admin';
import { deleteBlogPost, publishScheduledPosts } from '@/app/admin/_actions/content';
import { CONTENT_STATUS } from '@/lib/utils/labels';
import { formatDate, formatDateTime } from '@/lib/utils/format';

export default async function BlogAdminPage() {
  const session = await requirePermission('content:view', '/admin/blog');
  const result = await listAllPosts();
  const canManage = can(session.profile.role, 'content:manage');

  const scheduled = result.data.filter((post) => post.status === 'scheduled');
  const pendingPublication = scheduled.filter(
    (post) => post.scheduled_for && new Date(post.scheduled_for) <= new Date(),
  );

  return (
    <>
      <AdminPageHeader
        title="Calendário editorial"
        description="Blog e agenda de publicação: rascunho, agendamento (scheduled_for), publicação, SEO, categoria e tags."
        actions={
          canManage ? (
            <>
              <ButtonLink href="/admin/blog/novo" size="sm">
                Novo artigo
              </ButtonLink>
              {pendingPublication.length > 0 ? (
                <SimpleAction action={publishScheduledPosts} label="Publicar agendados" />
              ) : null}
            </>
          ) : undefined
        }
      />

      {scheduled.length > 0 && pendingPublication.length === 0 ? (
        <Alert tone="info" title="Calendário editorial" className="mb-5">
          {scheduled.length}{' '}
          {scheduled.length === 1 ? 'artigo agendado' : 'artigos agendados'} no calendário. A
          publicação automática usa <code className="mx-1">publish_scheduled_posts()</code> (cron
          ou botão abaixo quando a data chegar).
        </Alert>
      ) : null}

      {pendingPublication.length > 0 ? (
        <Alert tone="warning" title="Artigos agendados aguardando publicação" className="mb-5">
          {pendingPublication.length}{' '}
          {pendingPublication.length === 1 ? 'artigo já passou' : 'artigos já passaram'} da data
          agendada. Use &quot;Publicar agendados&quot; ou configure um cron chamando a função
          <code className="mx-1">publish_scheduled_posts()</code> no Supabase.
        </Alert>
      ) : null}

      {result.data.length === 0 ? (
        <EmptyState
          icon={<PencilLine aria-hidden="true" className="h-5 w-5" />}
          title="Nenhum artigo criado"
          description="Escreva o primeiro artigo para começar a atrair visitantes pela busca orgânica."
          action={
            canManage ? (
              <ButtonLink href="/admin/blog/novo" size="sm">
                Criar artigo
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {result.data.map((post) => (
            <li key={post.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="font-medium text-ink transition-colors hover:text-petrol-700"
                      >
                        {post.title}
                      </Link>
                      <StatusBadge {...CONTENT_STATUS[post.status]} />
                      {post.tags.length > 0 ? (
                        <span className="text-xs text-ink-faint">{post.tags.join(', ')}</span>
                      ) : null}
                    </div>

                    {post.excerpt ? (
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-muted">
                        {post.excerpt}
                      </p>
                    ) : null}

                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
                      <span>/blog/{post.slug}</span>
                      {post.published_at ? (
                        <span>Publicado em {formatDate(post.published_at)}</span>
                      ) : null}
                      {post.scheduled_for ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock aria-hidden="true" className="h-3 w-3" />
                          Agendado para {formatDateTime(post.scheduled_for)}
                        </span>
                      ) : null}
                      {post.reading_minutes ? <span>{post.reading_minutes} min</span> : null}
                      {!post.seo_description ? (
                        <Badge tone="warning">Sem meta description</Badge>
                      ) : null}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <ButtonLink href={`/admin/blog/${post.id}`} variant="secondary" size="sm">
                      Editar
                    </ButtonLink>
                    {post.status === 'published' ? (
                      <ButtonLink href={`/blog/${post.slug}`} external variant="ghost" size="sm">
                        Ver no site
                      </ButtonLink>
                    ) : null}
                    {canManage ? (
                      <ActionButton
                        action={deleteBlogPost}
                        label="Excluir"
                        variant="ghost"
                        fields={{ postId: post.id }}
                        confirm={{
                          title: 'Excluir artigo?',
                          description: 'Esta ação não pode ser desfeita.',
                          confirmLabel: 'Excluir',
                          danger: true,
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
