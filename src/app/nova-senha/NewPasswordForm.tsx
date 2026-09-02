'use client';

import { useActionState } from 'react';
import { Alert, FormField } from '@/components/ui';
import { PasswordInput, SubmitButton } from '@/components/ui/interactive';
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
        <PasswordInput
          id="nova-senha"
          name="password"
          autoComplete="new-password"
          required
          minLength={10}
          hint
          error={Boolean(state.fields?.password)}
        />
      </FormField>

      <FormField
        label="Confirmar senha"
        htmlFor="confirmar-senha"
        required
        error={state.fields?.confirmPassword}
      >
        <PasswordInput
          id="confirmar-senha"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={10}
          error={Boolean(state.fields?.confirmPassword)}
        />
      </FormField>

      <SubmitButton pending={pending} pendingLabel="Salvando…" className="w-full">
        Salvar nova senha
      </SubmitButton>
    </form>
  );
}
