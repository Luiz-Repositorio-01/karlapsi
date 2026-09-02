'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Alert, Button, FormField, fieldAria, inputClasses } from '@/components/ui';
import { useToast } from '@/components/ui/interactive';
import { excerptFromMarkdown } from '@/lib/content/markdown';
import { cn } from '@/lib/utils/cn';

export function BlogCoverGenerator({
  title,
  content,
  excerpt,
  slug,
  coverUrl,
  coverAlt,
  onCoverUrlChange,
  onCoverAltChange,
}: {
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  coverUrl: string;
  coverAlt: string;
  onCoverUrlChange: (value: string) => void;
  onCoverAltChange: (value: string) => void;
}) {
  const { notify } = useToast();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = title.trim().length >= 3 && content.trim().length >= 20;

  const handleGenerate = async () => {
    if (!canGenerate) {
      setError('Preencha o título e o conteúdo antes de gerar a capa.');
      return;
    }

    setError(null);
    setGenerating(true);

    try {
      const response = await fetch('/api/blog/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          excerpt: excerpt.trim() || excerptFromMarkdown(content, 320),
          slug: slug.trim() || undefined,
          variation: crypto.randomUUID(),
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        coverUrl?: string;
        coverAlt?: string;
        fields?: Record<string, string>;
      };

      if (!response.ok || !result.ok || !result.coverUrl) {
        const fieldMessage = result.fields
          ? Object.values(result.fields).find(Boolean)
          : undefined;
        throw new Error(fieldMessage || result.message || 'Não foi possível gerar a capa.');
      }

      onCoverUrlChange(result.coverUrl);
      if (result.coverAlt) onCoverAltChange(result.coverAlt);
      notify(result.message ?? 'Nova capa gerada.', 'success');
    } catch (generationError) {
      const message =
        generationError instanceof Error
          ? generationError.message
          : 'Erro inesperado ao gerar a capa.';
      setError(message);
      notify(message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={generating || !canGenerate}
          onClick={handleGenerate}
        >
          {generating ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles aria-hidden="true" className="h-4 w-4" />
          )}
          {generating ? 'Gerando capa…' : 'Gerar capa'}
        </Button>
        <span className="text-xs text-ink-faint">
          Cada clique cria uma capa nova com base no texto do artigo.
        </span>
      </div>

      {coverUrl ? (
        <div className="overflow-hidden rounded-xl ring-1 ring-petrol-100">
          <div className="relative aspect-[16/9] w-full bg-surface-sunken">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL dinâmica do Storage */}
            <img
              src={coverUrl}
              alt={coverAlt || `Capa do artigo ${title || 'sem título'}`}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'flex aspect-[16/9] items-center justify-center rounded-xl border border-dashed border-petrol-200',
            'bg-gradient-to-br from-petrol-50/80 to-sand-100/60 px-4 text-center text-sm text-ink-muted',
          )}
        >
          Nenhuma capa definida. Use &quot;Gerar capa&quot; para criar uma ilustração editorial
          alinhada ao texto.
        </div>
      )}

      {error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        <p className="text-xs leading-relaxed text-ink-faint">
          Geração gratuita via Pollinations AI. A imagem é salva no bucket{' '}
          <code className="text-ink-soft">public-assets</code> do Supabase.
        </p>
      )}

      <FormField
        label="URL da imagem"
        htmlFor="post-capa"
        hint="Preenchida automaticamente ao gerar, ou cole uma URL do Storage"
      >
        <input
          {...fieldAria('post-capa', { hint: true })}
          type="url"
          name="coverUrl"
          value={coverUrl}
          onChange={(event) => onCoverUrlChange(event.target.value)}
          className={inputClasses}
        />
      </FormField>

      <FormField
        label="Texto alternativo"
        htmlFor="post-capa-alt"
        hint="Descreva a imagem para leitores de tela"
      >
        <input
          {...fieldAria('post-capa-alt', { hint: true })}
          type="text"
          name="coverAlt"
          value={coverAlt}
          onChange={(event) => onCoverAltChange(event.target.value)}
          className={inputClasses}
        />
      </FormField>
    </div>
  );
}
