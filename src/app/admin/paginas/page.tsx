import { Alert, Badge, ButtonLink, Card } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { SitePageEditor } from '@/app/admin/paginas/SitePageEditor';
import { requirePermission } from '@/lib/auth/session';
import { listSitePages } from '@/lib/data/admin';
import { saveSitePage } from '@/app/admin/_actions/pages';
import { sectionsToText } from '@/lib/content/site-pages';
import { DEFAULT_SITE_PAGES } from '@/lib/content/defaults';
import type { SitePage } from '@/lib/types';

/** Páginas institucionais cujo texto profissional é editável pela equipe. */
const EDITABLE_PAGES = [
  { slug: 'sobre', label: 'Sobre', route: '/sobre' },
  { slug: 'neuropsicologia', label: 'Neuropsicologia', route: '/neuropsicologia' },
  {
    slug: 'avaliacao-neuropsicologica',
    label: 'Avaliação neuropsicológica',
    route: '/avaliacao-neuropsicologica',
  },
  { slug: 'atendimentos', label: 'Atendimentos', route: '/atendimentos' },
] as const;

export default async function PaginasPage() {
  await requirePermission('settings:manage', '/admin/paginas');
  const result = await listSitePages();

  const pages = EDITABLE_PAGES.map((page) => {
    const stored = result.data.find((item) => item.slug === page.slug) ?? null;
    const fallback: SitePage | undefined = DEFAULT_SITE_PAGES[page.slug];

    return {
      ...page,
      stored,
      content: stored ?? fallback ?? null,
    };
  });

  return (
    <>
      <AdminPageHeader
        title="Páginas institucionais"
        description="Texto das páginas de conteúdo profissional. Enquanto uma página não é salva aqui, o site usa o texto padrão — neutro e sem informação inventada."
      />

      <Alert tone="info" title="Como escrever as seções" className="mb-6">
        <p>Use um formato simples, sem código:</p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-white/70 p-3 font-mono text-xs leading-relaxed text-ink-soft">
{`## Título da seção
Parágrafo livre desta seção.
- Item da lista :: descrição do item
- Outro item :: outra descrição`}
        </pre>
        <p className="mt-2">
          Cada <code>##</code> começa uma nova seção. Linhas com <code>-</code> viram cartões, e o
          texto após <code>::</code> é a descrição do cartão.
        </p>
      </Alert>

      <div className="space-y-6">
        {pages.map((page) => (
          <Card key={page.slug}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg text-ink">{page.label}</h2>
                <Badge tone={page.stored ? 'success' : 'neutral'}>
                  {page.stored ? 'texto personalizado' : 'texto padrão'}
                </Badge>
              </div>
              <ButtonLink href={page.route} external variant="ghost" size="sm">
                Ver no site
              </ButtonLink>
            </div>

            <SitePageEditor
              action={saveSitePage}
              slug={page.slug}
              title={page.content?.title ?? page.label}
              subtitle={page.content?.subtitle ?? ''}
              sectionsText={sectionsToText(page.content?.sections ?? [])}
              seoTitle={page.content?.seo_title ?? ''}
              seoDescription={page.content?.seo_description ?? ''}
              isPublished={page.content?.is_published ?? true}
            />
          </Card>
        ))}
      </div>
    </>
  );
}
