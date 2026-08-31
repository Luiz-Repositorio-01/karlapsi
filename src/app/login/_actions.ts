'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import {
  fieldErrors,
  loginSchema,
  newPasswordSchema,
  passwordResetSchema,
} from '@/lib/validation/schemas';
import { rateLimit } from '@/lib/utils/rate-limit';
import type { ActionState } from '@/lib/actions/state';

/**
 * Autenticação com Supabase Auth.
 *
 * Pontos de segurança:
 * - a senha nunca é registrada em log, nem em auditoria;
 * - erro de login é genérico ("credenciais inválidas"), sem revelar se o
 *   e-mail existe;
 * - rate limiting por IP+e-mail antes de tentar autenticar;
 * - o cookie de sessão é httpOnly, sameSite=lax e secure em produção;
 * - o registro do acesso é feito por trigger no banco (auth.users →
 *   audit_logs), sem passar por credenciais.
 */

async function clientIp(): Promise<string> {
  const headerList = await headers();
  return headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'desconhecido';
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Verifique os campos informados.',
      fields: fieldErrors(parsed.error),
    };
  }

  const ip = await clientIp();
  const limit = rateLimit({
    key: `login:${ip}:${parsed.data.email}`,
    limit: 8,
    windowSeconds: 600,
  });

  if (!limit.allowed) {
    return {
      status: 'error',
      message: `Muitas tentativas. Tente novamente em ${Math.ceil(limit.retryAfterSeconds / 60)} minuto(s).`,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      status: 'error',
      message:
        'O acesso ainda não está disponível: as credenciais do Supabase não foram configuradas neste ambiente.',
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Mensagem única para credencial inválida, usuário inexistente e conta
    // desativada — evita enumeração de contas.
    return { status: 'error', message: 'E-mail ou senha incorretos.' };
  }

  const redirectTo = String(formData.get('redirectTo') ?? '/admin');
  // Só aceita destino interno, para impedir open redirect.
  const safeRedirect = redirectTo.startsWith('/admin') ? redirectTo : '/admin';

  redirect(safeRedirect);
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect('/login');
}

export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = passwordResetSchema.safeParse({ email: formData.get('email') });

  if (!parsed.success) {
    return { status: 'error', message: 'Informe um e-mail válido.' };
  }

  const ip = await clientIp();
  const limit = rateLimit({ key: `reset:${ip}`, limit: 4, windowSeconds: 900 });
  if (!limit.allowed) {
    return { status: 'error', message: 'Muitas solicitações. Aguarde alguns minutos.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: 'error', message: 'Recuperação indisponível: Supabase não configurado.' };
  }

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: new URL('/auth/callback?next=/nova-senha', env.siteUrl).toString(),
  });

  // Resposta idêntica exista ou não a conta (evita enumeração de e-mails).
  return {
    status: 'success',
    message: 'Se este e-mail estiver cadastrado, enviaremos as instruções de recuperação.',
  };
}

export async function setNewPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Verifique os requisitos da senha.',
      fields: fieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: 'error', message: 'Supabase não configurado.' };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: 'error',
      message: 'O link de recuperação expirou. Solicite um novo e-mail de recuperação.',
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { status: 'error', message: 'Não foi possível alterar a senha. Tente novamente.' };
  }

  redirect('/admin');
}
