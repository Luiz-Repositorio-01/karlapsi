import { Alert, Badge } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { CrudManager, CrudRow, type CrudField } from '@/components/admin/CrudManager';
import { requirePermission } from '@/lib/auth/session';
import { listTestimonials } from '@/lib/data/admin';
import { saveTestimonial } from '@/app/admin/_actions/content';
import type { Testimonial } from '@/lib/types';

const FIELDS: CrudField[] = [
  {
    name: 'authorDisplayName',
    label: 'Como o autor será identificado',
    type: 'text',
    required: true,
    hint: 'Use a forma autorizada pelo autor (ex.: "Mãe de paciente, 8 anos")',
  },
  {
    name: 'authorContext',
    label: 'Contexto',
    type: 'text',
    hint: 'Ex.: avaliação neuropsicológica infantil',
  },
  {
    name: 'content',
    label: 'Depoimento',
    type: 'textarea',
    rows: 5,
    required: true,
    fullWidth: true,
  },
  {
    name: 'authorizationReference',
    label: 'Registro da autorização',
    type: 'text',
    fullWidth: true,
    hint: 'Obrigatório para publicar. Ex.: "Termo assinado 12/03/2026" ou "Autorização por e-mail".',
  },
  { name: 'sortOrder', label: 'Ordem', type: 'number', min: 0, max: 999 },
  {
    name: 'isPublished',
    label: 'Publicar no site',
    type: 'checkbox',
    hint: 'Só é aceito com o registro de autorização preenchido.',
  },
];

export default async function DepoimentosPage() {
  await requirePermission('content:view', '/admin/depoimentos');
  const result = await listTestimonials();

  return (
    <>
      <AdminPageHeader
        title="Depoimentos"
        description="A Home exibe a seção de depoimentos apenas quando existe pelo menos um depoimento real publicado."
      />

      <Alert tone="warning" title="Regra aplicada pelo sistema" className="mb-5">
        Nenhum depoimento é criado automaticamente e não é possível publicar sem registrar a
        autorização de uso do autor — a restrição existe também no banco de dados, não apenas nesta
        tela. Atenção às normas do conselho profissional sobre divulgação de depoimentos.
      </Alert>

      <CrudManager<Testimonial>
        items={result.data}
        fields={FIELDS}
        action={saveTestimonial}
        getId={(testimonial) => testimonial.id}
        getValues={(testimonial) => ({
          authorDisplayName: testimonial.author_display_name,
          authorContext: testimonial.author_context,
          content: testimonial.content,
          sortOrder: testimonial.sort_order,
          isPublished: testimonial.is_published,
        })}
        modalSize="md"
        createLabel="Novo depoimento"
        editLabel="Editar depoimento"
        emptyTitle="Nenhum depoimento cadastrado"
        emptyDescription="Enquanto não houver depoimento real publicado, a seção não aparece no site."
        renderItem={(testimonial, onEdit) => (
          <CrudRow
            title={testimonial.author_display_name}
            subtitle={testimonial.content}
            meta={testimonial.author_context}
            badges={
              testimonial.is_published ? (
                <Badge tone="success">Publicado</Badge>
              ) : (
                <Badge>Não publicado</Badge>
              )
            }
            onEdit={onEdit}
          />
        )}
      />
    </>
  );
}
