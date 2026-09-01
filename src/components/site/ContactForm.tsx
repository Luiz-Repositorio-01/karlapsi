'use client';

import { useId, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  Alert,
  Card,
  FormField,
  fieldAria,
  inputClasses,
} from '@/components/ui';
import { SubmitButton, useToast } from '@/components/ui/interactive';
import { cn } from '@/lib/utils/cn';

/** Formulário de contato público com validação, estados e feedback acessível. */
export function ContactForm({ consentVersion }: { consentVersion: string }) {
  const formId = useId();
  const { notify } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    consentAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 3) next.name = 'Informe seu nome';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) next.email = 'Informe um e-mail válido';
    if (form.phone && form.phone.replace(/\D/g, '').length < 10) {
      next.phone = 'Telefone incompleto (inclua o DDD)';
    }
    if (form.message.trim().length < 10) next.message = 'Escreva sua mensagem (mínimo 10 caracteres)';
    if (!form.consentAccepted) next.consentAccepted = 'É necessário aceitar a política de privacidade';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setPending(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone || undefined,
          subject: form.subject.trim() || undefined,
          message: form.message.trim(),
          consentAccepted: true,
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        message?: string;
        fields?: Record<string, string>;
      };

      if (!response.ok || !json.ok) {
        if (json.fields) setErrors(json.fields);
        notify(json.message ?? 'Não foi possível enviar a mensagem.', 'error');
        return;
      }

      setSent(true);
      notify('Mensagem enviada com sucesso.', 'success');
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
            <h2 className="font-display text-xl text-emerald-950">Mensagem enviada</h2>
            <p className="mt-2 text-sm leading-relaxed text-emerald-900">
              Recebemos seu contato e responderemos no e-mail informado. Se for urgente, use o
              WhatsApp.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Nome" htmlFor={`${formId}-nome`} required error={errors.name}>
          <input
            {...fieldAria(`${formId}-nome`, { error: Boolean(errors.name) })}
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            className={inputClasses}
            required
          />
        </FormField>

        <FormField label="E-mail" htmlFor={`${formId}-email`} required error={errors.email}>
          <input
            {...fieldAria(`${formId}-email`, { error: Boolean(errors.email) })}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            className={inputClasses}
            required
          />
        </FormField>

        <FormField
          label="Telefone"
          htmlFor={`${formId}-telefone`}
          hint="Opcional"
          error={errors.phone}
        >
          <input
            {...fieldAria(`${formId}-telefone`, { hint: true, error: Boolean(errors.phone) })}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(event) => update('phone', event.target.value)}
            className={inputClasses}
          />
        </FormField>

        <FormField label="Assunto" htmlFor={`${formId}-assunto`} hint="Opcional">
          <input
            {...fieldAria(`${formId}-assunto`, { hint: true })}
            type="text"
            value={form.subject}
            onChange={(event) => update('subject', event.target.value)}
            className={inputClasses}
          />
        </FormField>

        <FormField
          label="Mensagem"
          htmlFor={`${formId}-mensagem`}
          required
          hint="Evite incluir informações de saúde detalhadas neste formulário."
          error={errors.message}
          className="sm:col-span-2"
        >
          <textarea
            {...fieldAria(`${formId}-mensagem`, { hint: true, error: Boolean(errors.message) })}
            rows={6}
            value={form.message}
            onChange={(event) => update('message', event.target.value)}
            className={cn(inputClasses, 'resize-y')}
            required
          />
        </FormField>
      </div>

      <label
        className={cn(
          'mt-6 flex cursor-pointer items-start gap-3 rounded-xl p-4 ring-1 transition-colors',
          errors.consentAccepted ? 'bg-red-50/60 ring-red-300' : 'bg-surface-muted ring-petrol-100',
        )}
      >
        <input
          type="checkbox"
          checked={form.consentAccepted}
          onChange={(event) => update('consentAccepted', event.target.checked)}
          aria-invalid={errors.consentAccepted ? true : undefined}
          className="mt-0.5 h-4 w-4 accent-petrol-700"
          required
        />
        <span className="text-sm leading-relaxed text-ink-soft">
          Aceito a{' '}
          <a
            href="/politica-de-privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-petrol-700 underline underline-offset-2"
          >
            política de privacidade
          </a>{' '}
          e autorizo o contato pelos dados informados.
          <span className="mt-1 block text-xs text-ink-faint">Versão do termo: {consentVersion}</span>
        </span>
      </label>
      {errors.consentAccepted ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">
          {errors.consentAccepted}
        </p>
      ) : null}

      {Object.keys(errors).length > 0 ? (
        <Alert tone="danger" className="mt-5">
          Revise os campos destacados para enviar a mensagem.
        </Alert>
      ) : null}

      <div className="mt-7">
        <SubmitButton pending={pending} size="lg">
          Enviar mensagem
        </SubmitButton>
      </div>
    </form>
  );
}
