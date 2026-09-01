import { Alert } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { CrudManager, type CrudField } from '@/components/admin/CrudManager';
import { requirePermission } from '@/lib/auth/session';
import { listAllLandingPages } from '@/lib/data/admin';
import { saveLandingPage } from '@/app/admin/_actions/catalog';
import { listLegacyLandingSlugs } from '@/lib/legacy';
import { formatCurrency } from '@/lib/utils/format';

const FIELDS: CrudField[] = [
  { name: 'name', label: 'Nome', type: 'text', required: true },
  { name: 'slug', label: 'Slug (URL)', type: 'slug', required: true, slugSource: 'name' },
  { name: 'headline', label: 'Chamada principal', type: 'text', fullWidth: true },
  { name: 'description', label: 'Descrição', type: 'textarea', rows: 5, fullWidth: true },
  {
    name: 'benefits',
    label: 'Benefícios',
    type: 'textarea',
    rows: 5,
    fullWidth: true,
    hint: 'Um por linha (máximo 12)',
  },
  { name: 'audience', label: 'Para quem é', type: 'textarea', rows: 2, fullWidth: true },
  { name: 'coverUrl', label: 'Capa (URL)', type: 'url' },
  { name: 'priceCents', label: 'Preço', type: 'currency-cents', min: 0 },
  { name: 'ctaLabel', label: 'Texto do botão', type: 'text', hint: 'Padrão: Acessar' },
  { name: 'ctaUrl', label: 'Link do botão (URL)', type: 'url' },
  {
    name: 'legacyPath',
    label: 'Caminho da página original',
    type: 'text',
    fullWidth: true,
    hint: 'Ex.: legacy/landing-pages/cuidar/index.html — a página original não é modificada.',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'published', label: 'Publicada' },
      { value: 'draft', label: 'Rascunho' },
      { value: 'archived', label: 'Arquivada' },
    ],
  },
  { name: 'sortOrder', label: 'Ordem', type: 'number', min: 0, max: 999 },
  { name: 'seoTitle', label: 'SEO — título', type: 'text' },
  { name: 'seoDescription', label: 'SEO — descrição', type: 'textarea', rows: 2, fullWidth: true },
];

export default async function LandingPagesAdminPage() {
  await requirePermission('content:view', '/admin/landing-pages');
  const result = await listAllLandingPages();
  const legacySlugs = listLegacyLandingSlugs();

  const unregistered = legacySlugs.filter(
    (slug) => !result.data.some((page) => page.slug === slug),
  );

  return (
    <>
      <AdminPageHeader
        title="Landing pages"
        description="Vitrine das páginas comerciais. As páginas originais continuam funcionando nos endereços antigos; aqui você adiciona capa, benefícios, preço e CTA."
      />

      <Alert tone="info" className="mb-5">
        URLs antigas preservadas: <code>/landing-pages/&lt;slug&gt;/index.html</code>,{' '}
        <code>/infobooks/&lt;slug&gt;/index.html</code> e os respectivos <code>/assets/*</code>{' '}
        continuam servindo os arquivos originais de <code>public/legacy</code>.
      </Alert>

      {unregistered.length > 0 ? (
        <Alert tone="warning" title="Páginas originais sem cadastro" className="mb-5">
          <strong>{unregistered.join(', ')}</strong> — já acessíveis, mas ainda sem vitrine. Cadastre
          usando o mesmo slug.
        </Alert>
      ) : null}

      <CrudManager
        items={result.data.map((page) => ({
          id: page.id,
          title: page.name,
          subtitle: page.headline ?? page.description,
          meta: `${page.price_cents === null ? 'Acesso livre' : formatCurrency(page.price_cents)} · /landing-pages/${page.slug}${
            page.legacy_path ? ` · original: ${page.legacy_path}` : ''
          }`,
          badges: [
            ...(page.status !== 'published'
              ? [{ label: page.status, tone: 'warning' as const }]
              : []),
            ...(page.legacy_path
              ? [{ label: 'Original preservada', tone: 'success' as const }]
              : []),
          ],
          href: `/landing-pages/${page.slug}`,
          values: {
            name: page.name,
            slug: page.slug,
            headline: page.headline,
            description: page.description,
            benefits: page.benefits.join('\n'),
            audience: page.audience,
            coverUrl: page.cover_url,
            priceCents: page.price_cents,
            ctaLabel: page.cta_label,
            ctaUrl: page.cta_url,
            legacyPath: page.legacy_path,
            status: page.status,
            sortOrder: page.sort_order,
            seoTitle: page.seo_title,
            seoDescription: page.seo_description,
          },
        }))}
        fields={FIELDS}
        action={saveLandingPage}
        createLabel="Nova landing page"
        editLabel="Editar landing page"
        emptyTitle="Nenhuma landing page cadastrada"
        emptyDescription="Cadastre uma página apontando para o arquivo original para exibi-la na vitrine comercial."
      />
    </>
  );
}
