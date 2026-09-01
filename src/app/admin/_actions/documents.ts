'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  audit,
  authorize,
  databaseErrorState,
  errorState,
  runAction,
  successState,
  validationState,
  type ActionState,
} from './shared';

/**
 * Documentos.
 *
 * O arquivo é enviado direto do navegador para o Supabase Storage (bucket
 * privado, com política que exige usuário autenticado da equipe). Esta ação
 * registra apenas os METADADOS, validando tipo e tamanho novamente no
 * servidor — o cliente nunca é a única barreira.
 */

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_SIZE_BYTES = 25 * 1024 * 1024;

const registerSchema = z.object({
  title: z.string().trim().min(2, 'Informe um título').max(200),
  description: z.string().trim().max(1000).optional(),
  bucket: z.literal('patient-documents'),
  filePath: z.string().trim().min(3).max(400),
  mimeType: z
    .string()
    .trim()
    .refine((value) => ALLOWED_MIME_TYPES.includes(value), 'Tipo de arquivo não permitido'),
  sizeBytes: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_SIZE_BYTES, 'Arquivo maior que o limite de 25 MB'),
  patientId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
  visibility: z.enum(['private', 'staff']).default('private'),
});

export async function registerDocument(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('documents:manage');

    const parsed = registerSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description') || undefined,
      bucket: formData.get('bucket'),
      filePath: formData.get('filePath'),
      mimeType: formData.get('mimeType'),
      sizeBytes: formData.get('sizeBytes'),
      patientId: formData.get('patientId') || undefined,
      visibility: formData.get('visibility') || 'private',
    });

    if (!parsed.success) return validationState(parsed.error);

    const { data, error } = await context.supabase
      .from('documents')
      .insert({
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        bucket: parsed.data.bucket,
        file_path: parsed.data.filePath,
        mime_type: parsed.data.mimeType,
        size_bytes: parsed.data.sizeBytes,
        visibility: parsed.data.visibility,
        patient_id: parsed.data.patientId ?? null,
        uploaded_by: context.session.id,
      })
      .select('id')
      .single();

    if (error) return databaseErrorState(error);

    await audit(context, 'create', 'documents', (data as { id: string }).id, {
      bucket: parsed.data.bucket,
    });

    revalidatePath('/admin/documentos');
    if (parsed.data.patientId) revalidatePath(`/admin/pacientes/${parsed.data.patientId}`);

    return successState('Documento registrado.');
  });
}

/**
 * Gera um link assinado de curta duração para leitura.
 * Documentos privados nunca recebem URL pública.
 */
export async function createDocumentDownloadUrl(
  documentId: string,
): Promise<{ ok: boolean; url?: string; message?: string }> {
  try {
    const context = await authorize('documents:view');

    const { data: record, error } = await context.supabase
      .from('documents')
      .select('bucket, file_path')
      .eq('id', documentId)
      .maybeSingle();

    if (error || !record) {
      return { ok: false, message: 'Documento não encontrado.' };
    }

    const document = record as { bucket: string; file_path: string };

    const { data: signed, error: signError } = await context.supabase.storage
      .from(document.bucket)
      .createSignedUrl(document.file_path, 120);

    if (signError || !signed) {
      return { ok: false, message: 'Não foi possível gerar o link de acesso.' };
    }

    await audit(context, 'download', 'documents', documentId);

    return { ok: true, url: signed.signedUrl };
  } catch {
    return { ok: false, message: 'Você não tem permissão para acessar este documento.' };
  }
}

export async function deleteDocument(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const context = await authorize('documents:manage');

    const documentId = String(formData.get('documentId') ?? '');
    if (!documentId) return errorState('Documento não informado.');

    const { data: record } = await context.supabase
      .from('documents')
      .select('bucket, file_path, patient_id')
      .eq('id', documentId)
      .maybeSingle();

    const document = record as
      | { bucket: string; file_path: string; patient_id: string | null }
      | null;

    if (document) {
      // Remove o arquivo antes do metadado, evitando registro órfão.
      await context.supabase.storage.from(document.bucket).remove([document.file_path]);
    }

    const { error } = await context.supabase.from('documents').delete().eq('id', documentId);
    if (error) return databaseErrorState(error);

    await audit(context, 'delete', 'documents', documentId);

    revalidatePath('/admin/documentos');
    if (document?.patient_id) revalidatePath(`/admin/pacientes/${document.patient_id}`);

    return successState('Documento removido.');
  });
}
