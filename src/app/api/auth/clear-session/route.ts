import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/** Remove cookies de sessão quebrados e volta para o login. */
export async function GET(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  const response = NextResponse.redirect(loginUrl);

  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.includes('auth-token')) {
      response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' });
    }
  }

  return response;
}
