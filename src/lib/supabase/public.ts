import { createClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '@/lib/env';

/**
 * Cliente somente-leitura para conteúdo público.
 *
 * Não toca em cookies nem em sessão — por isso as páginas institucionais
 * continuam podendo ser renderizadas estaticamente e revalidadas por ISR.
 * O acesso é o do papel `anon`, restrito pelas policies de RLS.
 */
export function createSupabasePublicClient() {
  if (!isSupabaseConfigured()) return null;

  return createClient(env.supabase.url!, env.supabase.anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-application-name': 'karla-neuropsi-public' } },
  });
}
