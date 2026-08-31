'use client';

import { useId, useState } from 'react';
import { Lock, ShoppingBag } from 'lucide-react';
import { Alert, FormField, fieldAria, inputClasses } from '@/components/ui';
import { SubmitButton, useToast } from '@/components/ui/interactive';
import { cn } from '@/lib/utils/cn';
import { formatCurrency } from '@/lib/utils/format';

/**
 * Checkout de material digital.
 *
 * O navegador envia apenas o slug do produto e os dados do comprador. O PREÇO
 * é sempre lido do banco no servidor — alterar o valor no cliente não tem
 * efeito. O servidor devolve a URL de checkout do Mercado Pago; nenhuma
 * credencial trafega até aqui.
 */
export function CheckoutForm({
  productSlug,
  priceCents,
  paymentsEnabled,
  consentVersion,
}: {
  productSlug: string;
  priceCents: number;
  paymentsEnabled: boolean;
  consentVersion: string;
}) {
  const formId = useId();
  const { notify } = useToast();

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    consentAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

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
    if (form.customerName.trim().length < 3) next.customerName = 'Informe o nome completo';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.customerEmail.trim())) {
      next.customerEmail = 'Informe um e-mail válido';
    }
    if (form.customerPhone && form.customerPhone.replace(/\D/g, '').length < 10) {
      next.customerPhone = 'Telefone incompleto';
    }
    if (!form.consentAccepted) next.consentAccepted = 'É necessário aceitar a política de privacidade';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setPending(true);

    try {
      const response = await fetch('/api/payments/mercadopago/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug,
          quantity: 1,
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim(),
          customerPhone: form.customerPhone || undefined,
          consentAccepted: true,
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        checkoutUrl?: string;
        message?: string;
        fields?: Record<string, string>;
      };

      if (!response.ok || !json.ok || !json.checkoutUrl) {
        if (json.fields) setErrors(json.fields);
        notify(json.message ?? 'Não foi possível abrir o checkout agora.', 'error');
        return;
      }

      // Redireciona para o ambiente do Mercado Pago (pagamento nunca acontece aqui).
      window.location.href = json.checkoutUrl;
    } catch {
      notify('Falha de conexão. Tente novamente.', 'error');
    } finally {
      setPending(false);
    }
  };

  if (!paymentsEnabled) {
    return (
      <Alert tone="info" title="Pagamento online em preparação">
        A integração de pagamento está implementada e aguarda apenas as credenciais do Mercado Pago.
        Enquanto isso, fale com a equipe para receber as instruções de pagamento e o acesso ao
        material.
      </Alert>
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
      <div className="space-y-4">
        <FormField label="Nome completo" htmlFor={`${formId}-nome`} required error={errors.customerName}>
          <input
            {...fieldAria(`${formId}-nome`, { error: Boolean(errors.customerName) })}
            type="text"
            autoComplete="name"
            value={form.customerName}
            onChange={(event) => update('customerName', event.target.value)}
            className={inputClasses}
            required
          />
        </FormField>

        <FormField
          label="E-mail"
          htmlFor={`${formId}-email`}
          required
          hint="O acesso ao material é enviado para este e-mail"
          error={errors.customerEmail}
        >
          <input
            {...fieldAria(`${formId}-email`, { hint: true, error: Boolean(errors.customerEmail) })}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={form.customerEmail}
            onChange={(event) => update('customerEmail', event.target.value)}
            className={inputClasses}
            required
          />
        </FormField>

        <FormField
          label="Telefone"
          htmlFor={`${formId}-telefone`}
          hint="Opcional"
          error={errors.customerPhone}
        >
          <input
            {...fieldAria(`${formId}-telefone`, { hint: true, error: Boolean(errors.customerPhone) })}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={form.customerPhone}
            onChange={(event) => update('customerPhone', event.target.value)}
            className={inputClasses}
          />
        </FormField>
      </div>

      <label
        className={cn(
          'mt-5 flex cursor-pointer items-start gap-3 rounded-xl p-4 ring-1 transition-colors',
          errors.consentAccepted ? 'bg-red-50/60 ring-red-300' : 'bg-surface-muted ring-petrol-100',
        )}
      >
        <input
          type="checkbox"
          checked={form.consentAccepted}
          onChange={(event) => update('consentAccepted', event.target.checked)}
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
          e os{' '}
          <a
            href="/termos"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-petrol-700 underline underline-offset-2"
          >
            termos de uso
          </a>
          .
          <span className="mt-1 block text-xs text-ink-faint">Versão do termo: {consentVersion}</span>
        </span>
      </label>
      {errors.consentAccepted ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">
          {errors.consentAccepted}
        </p>
      ) : null}

      <div className="mt-6">
        <SubmitButton pending={pending} pendingLabel="Abrindo checkout…" size="lg" className="w-full">
          <ShoppingBag aria-hidden="true" className="h-4 w-4" />
          Comprar por {formatCurrency(priceCents)}
        </SubmitButton>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-faint">
          <Lock aria-hidden="true" className="h-3 w-3" />
          Pagamento processado pelo Mercado Pago
        </p>
      </div>
    </form>
  );
}
