/**
 * Testa POST /api/auth/login em produção e verifica se Set-Cookie vem na resposta.
 */
const base = process.env.APP_URL || 'https://karlapsi.vercel.app';
const email = process.env.DEV_EMAIL || 'luiz.dev@auryxmedia.com.br';
const password = process.env.DEV_PASSWORD || 'KarlaDev2026';

const res = await fetch(`${base}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, remember: true }),
});

console.log('Status:', res.status);
console.log('Body:', await res.text());

const cookies = res.headers.getSetCookie?.() ?? [];
if (cookies.length) {
  console.log('\nSet-Cookie (' + cookies.length + '):');
  for (const c of cookies) {
    console.log(' -', c.split(';')[0]);
  }
} else {
  const raw = res.headers.get('set-cookie');
  console.log('\nSet-Cookie header:', raw ? raw.slice(0, 120) + '...' : '(ausente)');
}

if (!res.ok) process.exit(1);
