/**
 * Diagnóstico de login do usuário DEVELOPER.
 * Não imprime senhas.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

function loadDotEnv(path) {
  const text = readFileSync(path, 'utf8');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv('.env.local');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.DEV_EMAIL?.trim() || 'luiz.dev@auryxmedia.com.br').toLowerCase();
const password = process.env.DEV_PASSWORD || 'KarlaDev2026';

console.log('Supabase URL:', url);
console.log('Testando login:', email);

const admin = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: listed } = await admin.auth.admin.listUsers({ perPage: 500 });
const luizUsers = listed?.users.filter((u) =>
  u.email?.toLowerCase().includes('luiz'),
);

console.log('\nUsuários com "luiz" no e-mail:');
for (const u of luizUsers ?? []) {
  console.log(` - ${u.email} | confirmado=${Boolean(u.email_confirmed_at)} | id=${u.id}`);
}

const target = listed?.users.find((u) => u.email?.toLowerCase() === email);
if (!target) {
  console.error('\nFALHOU: usuário alvo não encontrado no Auth:', email);
  process.exit(1);
}

const { data: profile } = await admin
  .from('profiles')
  .select('email, role, is_active')
  .eq('id', target.id)
  .maybeSingle();

console.log('\nPerfil no banco:', profile ?? 'AUSENTE');

const publicClient = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: signInData, error: signInError } = await publicClient.auth.signInWithPassword({
  email,
  password,
});

if (signInError) {
  console.error('\nFALHOU signInWithPassword:', signInError.message, signInError.status);
  process.exit(1);
}

console.log('\nOK: login funcionou via API.');
console.log('User ID:', signInData.user?.id);
console.log('Session:', signInData.session ? 'criada' : 'ausente');
