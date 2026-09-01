import { Alert, Badge, ButtonLink } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { CrudManager, CrudRow, type CrudField } from '@/components/admin/CrudManager';
import { requirePermission } from '@/lib/auth/session';
import { listAllInfobooks } from '@/lib/data/admin';
import { saveInfobook } from '@/app/admin/_actions/catalog';
import { listLegacyLandingSlugs } from '@/lib/legacy';
import { formatCurrency } from '@/lib/utils/format';
import type { Infobook } from '@/lib/types';

const FIELDS: CrudField[] = [
  { name: 'title', label: 'Título', type: 'text', required: true },
  { name: 'slug', label: 'Slug (URL)', type: 'slug', required: true, slugSource: 'title' },
  { name: 'category', label: 'Categoria', type: 'text' },
  { name: 'pages', label: 'Páginas', type: 'number', min: 1, max: 5000 },
  { name: 'description', label: 'Descrição', type: 'textarea', rows: 4, fullWidth: true },
  { name: 'coverUrl', label: 'Capa (URL)', type: 'url', hint: 'Imagem da vitrine. Pode ser /images/infobooks/arquivo.jpg' },
  {
    name: 'publicFileUrl',
    label: 'Link de venda (Hotmart ou produto próprio)',
    type: 'url',
    hint: 'Cole o checkout da Hotmart (ex.: https://go.hotmart.com/...) ou o link do seu próprio produto/arquivo. O botão Comprar do site abre este endereço.',
    fullWidth: true,
  },
  { name: 'previewUrl', label: 'Prévia (URL)', type: 'url' },
  {
    name: 'legacyPath',
    label: 'Caminho do arquivo original',
    type: 'text',
    hint: 'Ex.: legacy/infobooks/cuidar/index.html — o arquivo NÃO é alterado, apenas exibido.',
    fullWidth: true,
  },
  {
    name: 'priceCents',
    label: 'Preço',
    type: 'currency-cents',
    min: 0,
    hint: 'Valor exibido na vitrine. Use 37,90 para R$ 37,90.',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'published', label: 'Publicado' },
      { value: 'draft', label: 'Rascunho' },
      { value: 'archived', label: 'Arquivado' },
    ],
  },
  { name: 'sortOrder', label: 'Ordem', type: 'number', min: 0, max: 999 },
  { name: 'seoTitle', label: 'SEO — título', type: 'text' },
  { name: 'seoDescription', label: 'SEO — descrição', type: 'textarea', rows: 2, fullWidth: true },
  { name: 'isFree', label: 'Gratuito (sem cobrança)', type: 'checkbox' },
];

export default async function InfobooksAdminPage() {
  await requirePermission('content:view', '/admin/infobooks');
  const result = await listAllInfobooks();
  const legacySlugs = listLegacyLandingSlugs();

  const unregistered = legacySlugs.filter(
    (slug) => !result.data.some((infobook) => infobook.slug === slug),
  );

  return (
    <>
      <AdminPageHeader
        title="Infobooks"
        description="Cadastre, edite e publique Infobooks para venda: título, descrição, capa, preço e o link de checkout (Hotmart ou produto próprio). O que estiver com status Publicado aparece na home e em /infobooks."
      />

      <Alert tone="info" title="Como vender um Infobook" className="mb-5">
        Clique em <strong>Novo infobook</strong>. Preencha título, descrição, capa e preço. Em
        <strong> Link de venda</strong>, cole o checkout da Hotmart ou o endereço do seu próprio
        produto. Marque <strong>Publicado</strong>. O site exibe o preço e o botão Comprar abre esse
        link. Para editar Autismo (R$ 37,90) ou Cuidar (R$ 34,00), abra o item na lista abaixo.
      </Alert>

      {unregistered.length > 0 ? (
        <Alert tone="info" title="Módulos originais sem cadastro" className="mb-5">
          Encontramos estes arquivos originais em <code>public/legacy</code>:{' '}
          <strong>{unregistered.join(', ')}</strong>. Eles já estão acessíveis pelo site; cadastre-os
          aqui usando o mesmo slug para exibir capa, descrição e preço.
        </Alert>
      ) : null}

      <CrudManager<Infobook>
        items={result.data}
        fields={FIELDS}
        action={saveInfobook}
        getId={(infobook) => infobook.id}
        getValues={(infobook) => ({
          title: infobook.title,
          slug: infobook.slug,
          category: infobook.category,
          pages: infobook.pages,
          description: infobook.description,
          coverUrl: infobook.cover_url,
          publicFileUrl: infobook.public_file_url,
          previewUrl: infobook.preview_url,
          legacyPath: infobook.legacy_path,
          priceCents: infobook.price_cents,
          status: infobook.status,
          sortOrder: infobook.sort_order,
          seoTitle: infobook.seo_title,
          seoDescription: infobook.seo_description,
          isFree: infobook.is_free,
        })}
        createLabel="Novo infobook"
        editLabel="Editar infobook"
        emptyTitle="Nenhum infobook cadastrado"
        emptyDescription="Clique em Novo infobook para vender um material: preencha título, descrição, capa, preço e o link da Hotmart ou do seu próprio produto. Com status Publicado, ele entra na vitrine."
        renderItem={(infobook, onEdit) => (
          <CrudRow
            title={infobook.title}
            subtitle={infobook.description}
            meta={`${infobook.is_free ? 'Gratuito' : formatCurrency(infobook.price_cents)} · /infobooks/${infobook.slug}${
              infobook.legacy_path ? ` · original: ${infobook.legacy_path}` : ''
            }`}
            badges={
              <>
                {infobook.status !== 'published' ? <Badge tone="warning">{infobook.status}</Badge> : null}
                {infobook.legacy_path ? <Badge tone="success">Original preservado</Badge> : null}
              </>
            }
            onEdit={onEdit}
            actions={
              <ButtonLink
                href={`/infobooks/${infobook.slug}`}
                external
                variant="ghost"
                size="sm"
              >
                Ver no site
              </ButtonLink>
            }
          />
        )}
      />
    </>
  );
}
