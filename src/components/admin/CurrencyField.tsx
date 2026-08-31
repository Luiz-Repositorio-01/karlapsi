'use client';

import { useState } from 'react';
import { FormField, fieldAria, inputClasses } from '@/components/ui';
import { formatCentsInput, parseCurrencyToCents } from '@/lib/utils/format';

/**
 * Campo de valor em reais.
 *
 * A pessoa digita "350,00"; o formulário envia centavos (350 00) em um campo
 * oculto, que é o formato usado no banco. Evita pedir "valor em centavos" na
 * interface e elimina erro de digitação por fator 100.
 */
export function CurrencyField({
  name,
  label,
  defaultCents,
  hint,
  error,
  required,
  className,
}: {
  name: string;
  label: string;
  defaultCents?: number | null;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}) {
  const [display, setDisplay] = useState(formatCentsInput(defaultCents));
  const cents = parseCurrencyToCents(display);
  const id = `moeda-${name}`;

  return (
    <FormField
      label={label}
      htmlFor={id}
      hint={hint ?? 'Em reais, ex.: 350,00'}
      error={error ?? (display.trim() && cents === null ? 'Valor inválido' : undefined)}
      required={required}
      className={className}
    >
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink-faint"
        >
          R$
        </span>
        <input
          {...fieldAria(id, { hint: true, error: Boolean(error) })}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={display}
          onChange={(event) => setDisplay(event.target.value)}
          className={`${inputClasses} pl-11`}
          required={required}
          placeholder="0,00"
        />
      </div>
      {/* Valor efetivamente enviado ao servidor. */}
      <input type="hidden" name={name} value={cents === null ? '' : String(cents)} />
    </FormField>
  );
}
