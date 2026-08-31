import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Callback do Supabase Auth (recuperação de senha e confirmação de e-mail).
 *
 * Troca o código recebido no link por uma sessão e redireciona. O destino é
 * validado como caminho interno, evitando open redirect.
 */
export const dynamic = 'force-dynamic';

const ALLOWED_NEXT = ['/nova-senha', '/admin'];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const requestedNext = url.searchParams.get('next') ?? '/admin';
  const next = ALLOWED_NEXT.includes(requestedNext) ? requestedNext : '/admin';

  if (!code) {
    return NextResponse.redirect(new URL('/login?erro=link-invalido', request.url));
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(new URL('/login?erro=indisponivel', request.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/login?erro=link-expirado', request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
