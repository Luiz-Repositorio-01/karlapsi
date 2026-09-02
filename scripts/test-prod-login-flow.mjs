/**
 * Simula login + acesso a /admin com cookies (fluxo completo).
 */
const base = process.env.APP_URL || 'https://karlapsi.vercel.app';
const email = process.env.DEV_EMAIL || 'luiz.dev@auryxmedia.com.br';
const password = process.env.DEV_PASSWORD || 'KarlaDev2026';

const loginRes = await fetch(`${base}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, remember: true }),
});

console.log('Login status:', loginRes.status);
if (!loginRes.ok) {
  console.log(await loginRes.text());
  process.exit(1);
}

const setCookies = loginRes.headers.getSetCookie?.() ?? [];
const cookieHeader = setCookies.map((c) => c.split(';')[0]).join('; ');
console.log('Cookies capturados:', setCookies.length);

const adminRes = await fetch(`${base}/admin`, {
  redirect: 'manual',
  headers: { Cookie: cookieHeader },
});

console.log('GET /admin status:', adminRes.status);
console.log('Location:', adminRes.headers.get('location') ?? '(nenhum)');

if (adminRes.status === 307 || adminRes.status === 302) {
  const loc = adminRes.headers.get('location') ?? '';
  if (loc.includes('/login')) {
    console.error('FALHOU: sessão não persistiu — redirecionou para login');
    process.exit(1);
  }
}

const body = await adminRes.text();
if (body.includes('Área profissional') && body.includes('login-email')) {
  console.error('FALHOU: HTML de login retornado em /admin');
  process.exit(1);
}

console.log('OK: /admin acessível com sessão (primeiros 80 chars):', body.slice(0, 80).replace(/\s+/g, ' '));
