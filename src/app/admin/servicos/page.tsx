import { Alert, Badge } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { CrudManager, CrudRow, type CrudField } from '@/components/admin/CrudManager';
import { ActionButton } from '@/components/admin/forms';
import { requirePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { listAllServices } from '@/lib/data/admin';
import { saveService, toggleServiceActive } from '@/app/admin/_actions/catalog';
import { formatCurrency, formatDuration } from '@/lib/utils/format';
import type { Service } from '@/lib/types';

const FIELDS: CrudField[] = [
  { name: 'name', label: 'Nome', type: 'text', required: true },
  { name: 'slug', label: 'Slug (URL)', type: 'slug', required: true, slugSource: 'name' },
  {
    name: 'summary',
    label: 'Resumo',
    type: 'textarea',
    rows: 2,
    fullWidth: true,
    hint: 'Aparece nos cartões do site',
  },
  { name: 'description', label: 'Descrição completa', type: 'textarea', rows: 6, fullWidth: true },
  {
    name: 'durationMinutes',
    label: 'Duração (minutos)',
    type: 'number',
    required: true,
    min: 10,
    max: 600,
    step: 5,
  },
  {
    name: 'priceCents',
    label: 'Valor em centavos',
    type: 'currency-cents',
    min: 0,
    hint: 'Ex.: 35000 = R$ 350,00. Deixe vazio para "a combinar".',
  },
  { name: 'sortOrder', label: 'Ordem de exibição', type: 'number', min: 0, max: 999 },
  {
    name: 'imageUrl',
    label: 'Imagem (URL)',
    type: 'url',
    hint: 'Opcional. Use uma URL do Supabase Storage.',
  },
  {
    name: 'preparationNotes',
    label: 'Orientações de preparo',
    type: 'textarea',
    rows: 3,
    fullWidth: true,
  },
  {
    name: 'showPricePublicly',
    label: 'Exibir valor no site',
    type: 'checkbox',
    hint: 'Só marque se quiser divulgar o valor publicamente.',
  },
  {
    name: 'allowsOnlineBooking',
    label: 'Permitir agendamento online',
    type: 'checkbox',
  },
  {
    name: 'requiresPayment',
    label: 'Exige pagamento para confirmar',
    type: 'checkbox',
  },
  { name: 'isActive', label: 'Ativo', type: 'checkbox' },
  { name: 'isFeatured', label: 'Destacar na Home', type: 'checkbox' },
];

export default async function ServicosAdminPage() {
  const session = await requirePermission('services:view', '/admin/servicos');
  const result = await listAllServices();
  const canManage = can(session.profile.role, 'services:manage');

  return (
    <>
      <AdminPageHeader
        title="Serviços"
        description="Nome, duração, valor, visibilidade do preço e liberação para agendamento online. Tudo controlado por aqui, sem alterar código."
      />

      {!canManage ? (
        <Alert tone="info" className="mb-5">
          Seu perfil pode consultar os serviços, mas não alterá-los.
        </Alert>
      ) : null}

      <CrudManager<Service>
        items={result.data}
        fields={FIELDS}
        action={saveService}
        getId={(service) => service.id}
        getValues={(service) => ({
          name: service.name,
          slug: service.slug,
          summary: service.summary,
          description: service.description,
          durationMinutes: service.duration_minutes,
          priceCents: service.price_cents,
          sortOrder: service.sort_order,
          imageUrl: service.image_url,
          preparationNotes: service.preparation_notes,
          showPricePublicly: service.show_price_publicly,
          allowsOnlineBooking: service.allows_online_booking,
          requiresPayment: service.requires_payment,
          isActive: service.is_active,
          isFeatured: service.is_featured,
        })}
        createLabel="Novo serviço"
        editLabel="Editar serviço"
        emptyTitle="Nenhum serviço cadastrado"
        emptyDescription="Cadastre os serviços oferecidos para que apareçam no site e no agendamento."
        renderItem={(service, onEdit) => (
          <CrudRow
            title={service.name}
            subtitle={service.summary}
            meta={`${formatDuration(service.duration_minutes)} · ${
              service.price_cents === null
                ? 'valor a combinar'
                : formatCurrency(service.price_cents)
            }${service.show_price_publicly ? ' (visível no site)' : ' (não exibido)'} · /${service.slug}`}
            badges={
              <>
                {!service.is_active ? <Badge tone="danger">Inativo</Badge> : null}
                {service.is_featured ? <Badge tone="sand">Destaque</Badge> : null}
                {!service.allows_online_booking ? <Badge>Sem agendamento online</Badge> : null}
              </>
            }
            onEdit={onEdit}
            actions={
              canManage ? (
                <ActionButton
                  action={toggleServiceActive}
                  label={service.is_active ? 'Desativar' : 'Ativar'}
                  variant="ghost"
                  fields={{ serviceId: service.id, isActive: !service.is_active }}
                />
              ) : null
            }
          />
        )}
      />
    </>
  );
}
