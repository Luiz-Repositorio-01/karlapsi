import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { env, isSupabaseConfigured, isSupabaseAdminConfigured } from '@/lib/env';

/**
 * Cliente de servidor ligado à sessão do usuário (cookies).
 * A autorização continua sendo do banco (RLS) — este cliente apenas propaga
 * a identidade autenticada.
 */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient(env.supabase.url!, env.supabase.anonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            });
          }
        } catch {
          // Server Components não podem escrever cookies; a renovação da
          // sessão acontece no middleware. Ignorar é o comportamento correto.
        }
      },
    },
  });
}

/**
 * Cliente privilegiado (service role). IGNORA RLS — por isso:
 * - só pode ser usado em Route Handlers / Server Actions;
 * - toda chamada precisa ter a autorização verificada ANTES, no servidor;
 * - nunca deve ser exposto ao cliente nem retornar dados sem filtro.
 *
 * Usos legítimos: webhook de pagamento, cálculo de horários livres para
 * visitantes anônimos e tarefas de manutenção.
 */
export function createSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) return null;

  return createServerClient(env.supabase.url!, env.supabase.serviceRoleKey!, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        /* cliente sem sessão: nada a persistir */
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
