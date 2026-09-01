'use client';

import { useId, useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { Alert, Card, FormField, fieldAria, inputClasses } from '@/components/ui';
import { SubmitButton, useToast } from '@/components/ui/interactive';
import { cn } from '@/lib/utils/cn';

const REQUEST_TYPES = [
  { value: 'access', label: 'Acessar meus dados' },
  { value: 'rectification', label: 'Corrigir meus dados' },
  { value: 'deletion', label: 'Excluir/anonimizar meus dados' },
  { value: 'portability', label: 'Receber meus dados (portabilidade)' },
  { value: 'revoke_consent', label: 'Revogar consentimento' },
] as const;

/**
 * Exercício dos direitos do titular (LGPD art. 18).
 * A solicitação é registrada com data e hora para controle do prazo legal.
 */
export function DataSubjectRequestForm() {
  const formId = useId();
  const { notify } = useToast();

  const [form, setForm] = useState({
    requesterName: '',
    requesterEmail: '',
    requestType: 'access' as (typeof REQUEST_TYPES)[number]['value'],
    details: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (form.requesterName.trim().length < 3) next.requesterName = 'Informe seu nome completo';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.requesterEmail.trim())) {
      next.requesterEmail = 'Informe um e-mail válido';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    try {
      const response = await fetch('/api/lgpd/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterName: form.requesterName.trim(),
          requesterEmail: form.requesterEmail.trim(),
          requestType: form.requestType,
          details: form.details.trim() || undefined,
        }),
      });

      const json = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !json.ok) {
        notify(json.message ?? 'Não foi possível registrar a solicitação.', 'error');
        return;
      }

      setSent(true);
      notify('Solicitação registrada.', 'success');
    } catch {
      notify('Falha de conexão. Tente novamente.', 'error');
    } finally {
      setPending(false);
    }
  };

  if (sent) {
    return (
      <Card className="bg-emerald-50 ring-emerald-200">
        <div className="flex items-start gap-4">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <p className="font-display text-lg text-emerald-950">Solicitação registrada</p>
            <p className="mt-2 text-sm leading-relaxed text-emerald-900">
              O pedido foi protocolado com data e hora. A resposta será enviada ao e-mail informado.
              Pode ser necessário confirmar sua identidade antes da execução do pedido.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <ShieldCheck aria-hidden="true" className="h-5 w-5 text-petrol-600" />
        <h2 className="font-display text-lg text-ink">Solicitar meus direitos</h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Use este formulário para exercer os direitos previstos no art. 18 da LGPD.
      </p>

      <form
        noValidate
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <FormField label="Nome completo" htmlFor={`${formId}-nome`} required error={errors.requesterName}>
          <input
            {...fieldAria(`${formId}-nome`, { error: Boolean(errors.requesterName) })}
            type="text"
            autoComplete="name"
            value={form.requesterName}
            onChange={(event) =>
              setForm((current) => ({ ...current, requesterName: event.target.value }))
            }
            className={inputClasses}
            required
          />
        </FormField>

        <FormField label="E-mail" htmlFor={`${formId}-email`} required error={errors.requesterEmail}>
          <input
            {...fieldAria(`${formId}-email`, { error: Boolean(errors.requesterEmail) })}
            type="email"
            autoComplete="email"
            value={form.requesterEmail}
            onChange={(event) =>
              setForm((current) => ({ ...current, requesterEmail: event.target.value }))
            }
            className={inputClasses}
            required
          />
        </FormField>

        <FormField label="Tipo de solicitação" htmlFor={`${formId}-tipo`} required>
          <select
            {...fieldAria(`${formId}-tipo`, {})}
            value={form.requestType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                requestType: event.target.value as typeof current.requestType,
              }))
            }
            className={inputClasses}
          >
            {REQUEST_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Detalhes"
          htmlFor={`${formId}-detalhes`}
          hint="Opcional. Não inclua dados sensíveis neste campo."
        >
          <textarea
            {...fieldAria(`${formId}-detalhes`, { hint: true })}
            rows={4}
            value={form.details}
            onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))}
            className={cn(inputClasses, 'resize-y')}
          />
        </FormField>

        {Object.keys(errors).length > 0 ? (
          <Alert tone="danger">Revise os campos destacados.</Alert>
        ) : null}

        <SubmitButton pending={pending} className="w-full">
          Enviar solicitação
        </SubmitButton>
      </form>
    </Card>
  );
}
