'use client';

import { useActionState } from 'react';
import { Alert, FormField, fieldAria, inputClasses } from '@/components/ui';
import { SubmitButton } from '@/components/ui/interactive';
import { setNewPassword } from '@/app/login/_actions';
import { IDLE_STATE, type ActionState } from '@/lib/actions/state';

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    setNewPassword,
    IDLE_STATE,
  );

  return (
    <form action={action} className="space-y-4">
      {state.status === 'error' ? <Alert tone="danger">{state.message}</Alert> : null}

      <FormField
        label="Nova senha"
        htmlFor="nova-senha"
        required
        hint="Mínimo de 10 caracteres, com maiúscula, minúscula e número"
        error={state.fields?.password}
      >
        <input
          {...fieldAria('nova-senha', { hint: true, error: Boolean(state.fields?.password) })}
          type="password"
          name="password"
          autoComplete="new-password"
          className={inputClasses}
          required
          minLength={10}
        />
      </FormField>

      <FormField
        label="Confirmar senha"
        htmlFor="confirmar-senha"
        required
        error={state.fields?.confirmPassword}
      >
        <input
          {...fieldAria('confirmar-senha', { error: Boolean(state.fields?.confirmPassword) })}
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          className={inputClasses}
          required
          minLength={10}
        />
      </FormField>

      <SubmitButton pending={pending} pendingLabel="Salvando…" className="w-full">
        Salvar nova senha
      </SubmitButton>
    </form>
  );
}
