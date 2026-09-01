import { Alert } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { CrudManager, type CrudField } from '@/components/admin/CrudManager';
import { requirePermission } from '@/lib/auth/session';
import { listAllProducts } from '@/lib/data/admin';
import { saveProduct } from '@/app/admin/_actions/catalog';
import { isMercadoPagoConfigured } from '@/lib/env';
import { formatCurrency } from '@/lib/utils/format';

const FIELDS: CrudField[] = [
  { name: 'name', label: 'Nome', type: 'text', required: true },
  { name: 'slug', label: 'Slug (URL)', type: 'slug', required: true, slugSource: 'name' },
  {
    name: 'type',
    label: 'Tipo',
    type: 'select',
    required: true,
    options: [
      { value: 'material', label: 'Material digital' },
      { value: 'infobook', label: 'Infobook' },
      { value: 'landing_page', label: 'Landing page' },
      { value: 'service', label: 'Serviço' },
      { value: 'other', label: 'Outro' },
    ],
  },
  { name: 'priceCents', label: 'Preço', type: 'currency-cents', min: 0, required: true },
  { name: 'summary', label: 'Resumo', type: 'textarea', rows: 2, fullWidth: true },
  { name: 'description', label: 'Descrição', type: 'textarea', rows: 6, fullWidth: true },
  {
    name: 'benefits',
    label: 'O que está incluído',
    type: 'textarea',
    rows: 5,
    fullWidth: true,
    hint: 'Um item por linha (máximo 12)',
  },
  { name: 'audience', label: 'Para quem é', type: 'textarea', rows: 2, fullWidth: true },
  { name: 'coverUrl', label: 'Capa (URL)', type: 'url' },
  {
    name: 'externalUrl',
    label: 'Link de acesso/entrega (URL)',
    type: 'url',
    hint: 'Usado nos materiais gratuitos',
  },
  { name: 'isFree', label: 'Gratuito', type: 'checkbox', hint: 'Zera o preço automaticamente' },
  { name: 'isActive', label: 'Ativo no site', type: 'checkbox' },
  { name: 'isFeatured', label: 'Destaque na loja', type: 'checkbox' },
];

export default async function ProdutosPage() {
  await requirePermission('products:view', '/admin/produtos');
  const result = await listAllProducts();

  return (
    <>
      <AdminPageHeader
        title="Produtos"
        description="Catálogo comercial dos materiais digitais. É esta tabela que alimenta o checkout — infobooks e landing pages apenas apontam para um produto."
      />

      {!isMercadoPagoConfigured() ? (
        <Alert tone="info" className="mb-5">
          O checkout online ficará ativo quando as credenciais do Mercado Pago forem configuradas.
          Até então, os materiais podem ser publicados como gratuitos ou com contato direto.
        </Alert>
      ) : null}

      <CrudManager
        items={result.data.map((product) => ({
          id: product.id,
          title: product.name,
          subtitle: product.summary,
          meta: `${product.is_free ? 'Gratuito' : formatCurrency(product.price_cents)} · /materiais/${product.slug}`,
          badges: [
            ...(!product.is_active ? [{ label: 'Inativo', tone: 'danger' as const }] : []),
            ...(product.is_featured ? [{ label: 'Destaque', tone: 'sand' as const }] : []),
            { label: product.type },
          ],
          values: {
            name: product.name,
            slug: product.slug,
            type: product.type,
            priceCents: product.price_cents,
            summary: product.summary,
            description: product.description,
            benefits: product.benefits.join('\n'),
            audience: product.audience,
            coverUrl: product.cover_url,
            externalUrl: product.external_url,
            isFree: product.is_free,
            isActive: product.is_active,
            isFeatured: product.is_featured,
          },
        }))}
        fields={FIELDS}
        action={saveProduct}
        createLabel="Novo produto"
        editLabel="Editar produto"
        emptyTitle="Nenhum produto cadastrado"
        emptyDescription="Cadastre um material digital para exibi-lo na loja com página de vendas e checkout."
      />
    </>
  );
}
