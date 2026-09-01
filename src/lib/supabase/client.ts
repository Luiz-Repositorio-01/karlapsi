'use client';

import { createBrowserClient } from '@supabase/ssr';
import { env, isSupabaseConfigured } from '@/lib/env';

/**
 * Cliente de navegador. Usa somente a chave pública (anon) e depende de RLS
 * para toda a autorização. Retorna `null` quando o Supabase ainda não foi
 * configurado, permitindo que a UI mostre um estado explícito.
 */
export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(env.supabase.url!, env.supabase.anonKey!);
}
