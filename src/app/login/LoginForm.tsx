'use client';

import { useActionState, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Lock, Mail } from 'lucide-react';
import { Alert, Button, FormField, fieldAria, inputClasses } from '@/components/ui';
import { PasswordInput, SubmitButton } from '@/components/ui/interactive';
import { requestPasswordReset } from '@/app/login/_actions';
import { IDLE_STATE, type ActionState } from '@/lib/actions/state';

/** Formulário de acesso à área profissional, com recuperação de senha. */
export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [mode, setMode] = useState<'signin' | 'reset'>('signin');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signInPending, startSignIn] = useTransition();
  const [resetState, resetAction, resetPending] = useActionState<ActionState, FormData>(
    requestPasswordReset,
    IDLE_STATE,
  );

  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignInError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') ?? '')
      .trim()
      .toLowerCase();
    const password = String(formData.get('password') ?? '').trim();

    if (!email.includes('@') || password.length < 8) {
      setSignInError('Verifique os campos informados.');
      return;
    }

    const remember = formData.get('remember') === 'on';

    startSignIn(async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password, remember }),
      });

      if (response.status === 429) {
        setSignInError(
          'Muitas tentativas em sequência. Aguarde 1–2 minutos ou use o link abaixo para limpar a sessão.',
        );
        return;
      }

      if (!response.ok) {
        setSignInError('E-mail ou senha incorretos.');
        return;
      }

      window.location.assign(redirectTo);
    });
  };

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
        Acesso restrito à equipe. Use o e-mail completo cadastrado (ex.:{' '}
        <span className="font-medium text-ink-soft">nome@dominio.com</span>).
      </p>

      {signInError ? (
        <Alert tone="danger" className="mt-6">
          {signInError}
        </Alert>
      ) : null}

      <form onSubmit={handleSignIn} className="mt-6 space-y-4">
        <FormField label="E-mail" htmlFor="login-email" required>
          <input
            {...fieldAria('login-email', {})}
            type="email"
            name="email"
            autoComplete="username email"
            inputMode="email"
            spellCheck={false}
            className={inputClasses}
            required
          />
        </FormField>

        <FormField label="Senha" htmlFor="login-password" required>
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            required
          />
        </FormField>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="inline-flex cursor-pointer select-none items-center gap-2.5 text-sm text-ink-soft">
            <input
              type="checkbox"
              name="remember"
              value="on"
              defaultChecked
              className="h-4 w-4 rounded border-petrol-300 text-petrol-700 focus:ring-petrol-500"
            />
            Manter conectado
          </label>

          <Button type="button" variant="ghost" size="sm" onClick={() => setMode('reset')}>
            <KeyRound aria-hidden="true" className="h-3.5 w-3.5" />
            Esqueci minha senha
          </Button>
        </div>

        <SubmitButton pending={signInPending} pendingLabel="Entrando…" size="lg" className="w-full">
          <Lock aria-hidden="true" className="h-4 w-4" />
          Entrar
        </SubmitButton>
      </form>

      <p className="mt-4 text-center text-xs text-ink-faint">
        Problemas para entrar?{' '}
        <a
          href="/api/auth/clear-session"
          className="font-medium text-petrol-700 underline-offset-2 hover:underline"
        >
          Limpar sessão e tentar de novo
        </a>
      </p>

      <div className="mt-6 border-t border-petrol-100 pt-5 text-center">
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
