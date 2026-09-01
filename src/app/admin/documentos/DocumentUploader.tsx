'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  FormField,
  fieldAria,
  inputClasses,
} from '@/components/ui';
import { useToast } from '@/components/ui/interactive';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { registerDocument } from '@/app/admin/_actions/documents';
import { cn } from '@/lib/utils/cn';
import { IDLE_STATE } from '@/lib/actions/state';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_SIZE_BYTES = 25 * 1024 * 1024;
const BUCKET = 'patient-documents';

/**
 * Envio de documento.
 *
 * O arquivo vai direto do navegador para o bucket privado (política do Storage
 * exige sessão de equipe). Depois, a Server Action registra os metadados,
 * revalidando tipo e tamanho no servidor.
 */
export function DocumentUploader({ patients }: { patients: { id: string; full_name: string }[] }) {
  const { notify } = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('file');
    const title = String(formData.get('title') ?? '').trim();

    if (!(file instanceof File) || file.size === 0) {
      setError('Selecione um arquivo.');
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Tipo de arquivo não permitido. Use PDF, imagem ou documento Word.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('O arquivo excede o limite de 25 MB.');
      return;
    }
    if (title.length < 2) {
      setError('Informe um título para o documento.');
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError('Supabase não configurado neste ambiente.');
      return;
    }

    setPending(true);

    try {
      const patientId = String(formData.get('patientId') ?? '');
      const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? 'bin';
      // Nome do arquivo sem dado identificável (o vínculo fica no banco).
      const filePath = `${patientId || 'geral'}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file, {
        cacheControl: '0',
        upsert: false,
        contentType: file.type,
      });

      if (uploadError) {
        setError(
          uploadError.message.includes('row-level security')
            ? 'Seu perfil não tem permissão para enviar documentos.'
            : 'Falha ao enviar o arquivo. Tente novamente.',
        );
        return;
      }

      const metadata = new FormData();
      metadata.set('title', title);
      metadata.set('description', String(formData.get('description') ?? ''));
      metadata.set('bucket', BUCKET);
      metadata.set('filePath', filePath);
      metadata.set('mimeType', file.type);
      metadata.set('sizeBytes', String(file.size));
      metadata.set('patientId', patientId);
      metadata.set('visibility', String(formData.get('visibility') ?? 'private'));

      const result = await registerDocument(IDLE_STATE, metadata);

      if (result.status === 'error') {
        // Metadado recusado: remove o arquivo para não deixar órfão no bucket.
        await supabase.storage.from(BUCKET).remove([filePath]);
        setError(result.message ?? 'Não foi possível registrar o documento.');
        return;
      }

      notify(result.message ?? 'Documento enviado.', 'success');
      form.reset();
    } catch {
      setError('Erro inesperado no envio. Tente novamente.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <h2 className="font-display text-base text-ink">Enviar documento</h2>
      <p className="mt-1.5 text-sm text-ink-muted">
        PDF, imagem ou Word, até 25 MB. O arquivo vai para um bucket privado.
      </p>

      <form onSubmit={handleSubmit} className="mt-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Título" htmlFor="documento-titulo" required>
            <input
              {...fieldAria('documento-titulo', {})}
              type="text"
              name="title"
              className={inputClasses}
              required
            />
          </FormField>

          <FormField label="Paciente" htmlFor="documento-paciente">
            <select
              {...fieldAria('documento-paciente', {})}
              name="patientId"
              className={inputClasses}
            >
              <option value="">Sem vínculo</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Arquivo"
            htmlFor="documento-arquivo"
            required
            hint="PDF, PNG, JPEG, WebP ou Word"
          >
            <input
              {...fieldAria('documento-arquivo', { hint: true })}
              type="file"
              name="file"
              accept={ALLOWED_TYPES.join(',')}
              className={cn(
                inputClasses,
                'file:mr-3 file:rounded-full file:border-0 file:bg-petrol-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-petrol-800',
              )}
              required
            />
          </FormField>

          <FormField label="Visibilidade" htmlFor="documento-visibilidade">
            <select
              {...fieldAria('documento-visibilidade', {})}
              name="visibility"
              defaultValue="private"
              className={inputClasses}
            >
              <option value="private">Privado (acesso restrito)</option>
              <option value="staff">Equipe</option>
            </select>
          </FormField>

          <FormField
            label="Descrição"
            htmlFor="documento-descricao"
            hint="Opcional. Evite informação sensível no título e na descrição."
            className="sm:col-span-2"
          >
            <textarea
              {...fieldAria('documento-descricao', { hint: true })}
              name="description"
              rows={2}
              className={cn(inputClasses, 'resize-y')}
            />
          </FormField>
        </div>

        {error ? (
          <Alert tone="danger" className="mt-4">
            {error}
          </Alert>
        ) : null}

        <div className="mt-5">
          <Button type="submit" disabled={pending} aria-busy={pending}>
            {pending ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
                Enviando…
              </>
            ) : (
              <>
                <Upload aria-hidden="true" className="h-4 w-4" />
                Enviar documento
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
