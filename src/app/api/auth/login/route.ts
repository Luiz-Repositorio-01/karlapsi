import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { loginSchema } from '@/lib/validation/schemas';
import { rateLimit } from '@/lib/utils/rate-limit';

export const dynamic = 'force-dynamic';

function isAuthThrottled(message: string, status?: number) {
  const normalized = message.toLowerCase();
  return (
    status === 429 ||
    normalized.includes('rate limit') ||
    normalized.includes('too many') ||
    normalized.includes('muitas tentativas')
  );
}

function applyAuthCookies(
  target: NextResponse,
  cookiesToSet: { name: string; value: string; options: CookieOptions }[],
  maxAge: number,
) {
  for (const { name, value, options } of cookiesToSet) {
    target.cookies.set(name, value, {
      ...options,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      ...(name.includes('auth-token') ? { maxAge } : {}),
    });
  }
}

function clearAuthCookies(request: NextRequest, target: NextResponse) {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.includes('auth-token')) {
      target.cookies.set(cookie.name, '', { maxAge: 0, path: '/' });
    }
  }
}

/**
 * Login via Route Handler.
 * Autentica com cliente stateless e grava a nova sessão na resposta HTTP.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'desconhecido';
  const limit = rateLimit({
    key: `login:${ip}:${parsed.data.email}`,
    limit: 20,
    windowSeconds: 600,
  });

  if (!limit.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
  }

  const remember =
    typeof body === 'object' &&
    body !== null &&
    'remember' in body &&
    (body as { remember?: boolean }).remember === true;

  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12;

  let response = NextResponse.json({ ok: true });

  const sessionClient = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        response = NextResponse.json({ ok: true });
        applyAuthCookies(response, cookiesToSet, maxAge);
      },
    },
  });

  await sessionClient.auth.signOut({ scope: 'local' });

  const authClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await authClient.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.session) {
    if (error && isAuthThrottled(error.message, error.status)) {
      const throttled = NextResponse.json({ error: 'rate_limited' }, { status: 429 });
      clearAuthCookies(request, throttled);
      return throttled;
    }

    const failResponse = NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
    clearAuthCookies(request, failResponse);
    return failResponse;
  }

  response = NextResponse.json({ ok: true });

  const writeSessionClient = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        response = NextResponse.json({ ok: true });
        applyAuthCookies(response, cookiesToSet, maxAge);
      },
    },
  });

  const { error: sessionError } = await writeSessionClient.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  if (sessionError) {
    const failResponse = NextResponse.json({ error: 'session_failed' }, { status: 500 });
    clearAuthCookies(request, failResponse);
    return failResponse;
  }

  return response;
}
