import 'server-only';

import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { can, type Permission } from '@/lib/auth/rbac';
import type { Profile } from '@/lib/types';

export interface SessionUser {
  id: string;
  email: string;
  profile: Profile;
}

/**
 * Lê a sessão atual e o perfil (papel) do usuário.
 * `cache` evita múltiplas idas ao Supabase no mesmo request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  // getUser() valida o JWT no servidor de auth — não confiar no cookie cru.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return null;

  const typedProfile = profile as Profile;
  if (!typedProfile.is_active) return null;

  return { id: user.id, email: user.email ?? typedProfile.email, profile: typedProfile };
});

/** Exige sessão válida; caso contrário volta para o login. */
export async function requireSession(returnTo = '/admin'): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) {
    redirect(`/login?redirectTo=${encodeURIComponent(returnTo)}`);
  }
  return session;
}

/** Exige sessão + permissão. Sem permissão, mostra a página de acesso negado. */
export async function requirePermission(
  permission: Permission,
  returnTo = '/admin',
): Promise<SessionUser> {
  const session = await requireSession(returnTo);
  if (!can(session.profile.role, permission)) {
    redirect('/admin/acesso-negado');
  }
  return session;
}

/** Versão para Route Handlers: nunca redireciona, apenas informa. */
export async function getApiSession(): Promise<SessionUser | null> {
  return getSessionUser();
}
