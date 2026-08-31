'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Lock, Mail } from 'lucide-react';
import { Alert, Button, FormField, fieldAria, inputClasses } from '@/components/ui';
import { SubmitButton } from '@/components/ui/interactive';
import { requestPasswordReset, signIn } from '@/app/login/_actions';
import { IDLE_STATE, type ActionState } from '@/lib/actions/state';

/** Formulário de acesso à área profissional, com recuperação de senha. */
export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [mode, setMode] = useState<'signin' | 'reset'>('signin');
  const [signInState, signInAction, signInPending] = useActionState<ActionState, FormData>(
    signIn,
    IDLE_STATE,
  );
  const [resetState, resetAction, resetPending] = useActionState<ActionState, FormData>(
    requestPasswordReset,
    IDLE_STATE,
  );

  if (mode === 'reset') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setMode('signin')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-petrol-700 transition-colors hover:text-petrol-900"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Voltar para o acesso
        </button>

        <h1 className="mt-5 font-display text-2xl text-ink">Recuperar senha</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Informe o e-mail cadastrado. Se existir uma conta, enviaremos um link para definir uma
          nova senha.
        </p>

        {resetState.status === 'success' ? (
          <Alert tone="success" className="mt-6">
            {resetState.message}
          </Alert>
        ) : null}
        {resetState.status === 'error' ? (
          <Alert tone="danger" className="mt-6">
            {resetState.message}
          </Alert>
        ) : null}

        <form action={resetAction} className="mt-6 space-y-4">
          <FormField label="E-mail" htmlFor="reset-email" required>
            <input
              {...fieldAria('reset-email', {})}
              type="email"
              name="email"
              autoComplete="email"
              className={inputClasses}
              required
            />
          </FormField>

          <SubmitButton pending={resetPending} className="w-full">
            <Mail aria-hidden="true" className="h-4 w-4" />
            Enviar instruções
          </SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Área profissional</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Acesso restrito à equipe. Use suas credenciais individuais.
      </p>

      {signInState.status === 'error' ? (
        <Alert tone="danger" className="mt-6">
          {signInState.message}
        </Alert>
      ) : null}

      <form action={signInAction} className="mt-6 space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <FormField label="E-mail" htmlFor="login-email" required error={signInState.fields?.email}>
          <input
            {...fieldAria('login-email', { error: Boolean(signInState.fields?.email) })}
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            className={inputClasses}
            required
          />
        </FormField>

        <FormField
          label="Senha"
          htmlFor="login-password"
          required
          error={signInState.fields?.password}
        >
          <input
            {...fieldAria('login-password', { error: Boolean(signInState.fields?.password) })}
            type="password"
            name="password"
            autoComplete="current-password"
            className={inputClasses}
            required
          />
        </FormField>

        <SubmitButton pending={signInPending} pendingLabel="Entrando…" size="lg" className="w-full">
          <Lock aria-hidden="true" className="h-4 w-4" />
          Entrar
        </SubmitButton>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-petrol-100 pt-5">
        <Button type="button" variant="ghost" size="sm" onClick={() => setMode('reset')}>
          <KeyRound aria-hidden="true" className="h-3.5 w-3.5" />
          Esqueci minha senha
        </Button>
        <Link
          href="/"
          className="text-sm font-medium text-ink-muted transition-colors hover:text-petrol-700"
        >
          Voltar ao site
        </Link>
      </div>
    </div>
  );
}
