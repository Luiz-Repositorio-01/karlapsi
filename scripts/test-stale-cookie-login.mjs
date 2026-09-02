const base = process.env.APP_URL || 'https://karlapsi.vercel.app';
const email = 'luiz.dev@auryxmedia.com.br';
const password = 'Luizao2026!';

const stale = 'sb-oerlxsstjuyptnryhpyi-auth-token=base64-invalid';

for (const [label, headers] of [
  ['clean', { 'Content-Type': 'application/json' }],
  ['stale-cookie', { 'Content-Type': 'application/json', Cookie: stale }],
]) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, remember: true }),
  });
  console.log(label, res.status, await res.text());
}
