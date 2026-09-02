/**
 * Cria ou atualiza um usuário DEVELOPER (Auryx / suporte técnico).
 * Uso: DEV_EMAIL=... DEV_PASSWORD=... DEV_FULL_NAME="Luiz Dev" node scripts/ensure-developer.mjs
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

const passwordFromCli = process.env.DEV_PASSWORD;
loadDotEnv('.env.local');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.DEV_EMAIL?.trim() || 'luiz.dev@auryxmedia.com.br').toLowerCase();
// Só aceita DEV_PASSWORD passado na linha de comando — não o valor do .env.local,
// para não divergir da senha comunicada ao usuário.
const password = passwordFromCli || 'KarlaDev2026';
const fullName = process.env.DEV_FULL_NAME?.trim() || 'Luiz Dev';

if (!url || !serviceRole) {
  console.error('FALHOU: Supabase URL ou service role ausentes.');
  process.exit(1);
}

if (!passwordFromCli) {
  console.warn('AVISO: usando senha provisória padrão (KarlaDev2026) — altere após o login.');
}

const admin = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: listed, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 });
if (listError) {
  console.error('FALHOU: listUsers', listError.message);
  process.exit(1);
}

const existing = listed.users.find((user) => user.email?.toLowerCase() === email);
let userId = existing?.id;

if (existing) {
  const { error } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    user_metadata: { role: 'DEVELOPER', full_name: fullName },
  });
  if (error) {
    console.error('FALHOU: updateUser', error.message);
    process.exit(1);
  }
  console.log('OK: usuário existente atualizado (senha e metadados).');
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'DEVELOPER', full_name: fullName },
  });
  if (error) {
    console.error('FALHOU: createUser', error.message);
    process.exit(1);
  }
  userId = data.user.id;
  console.log('OK: usuário criado.');
}

let profileRole = 'DEVELOPER';
let { error: profileError } = await admin
  .from('profiles')
  .update({
    role: profileRole,
    full_name: fullName,
    is_active: true,
    is_public_author: false,
  })
  .eq('id', userId);

// Enum DEVELOPER só existe após a migration 015. ADMIN no banco + metadata DEVELOPER
// mantém RLS de configurações até a migration ser aplicada; a app usa o papel efetivo.
if (profileError?.message?.includes('DEVELOPER')) {
  profileRole = 'ADMIN';
  const retry = await admin
    .from('profiles')
    .update({
      role: profileRole,
      full_name: fullName,
      is_active: true,
      is_public_author: false,
    })
    .eq('id', userId);
  profileError = retry.error;
  if (!profileError) {
    console.warn(
      'AVISO: enum DEVELOPER ausente — perfil gravado como ADMIN (bootstrap).',
    );
    console.warn(
      'Execute supabase/migrations/015_developer_role.sql e rode este script de novo para gravar DEVELOPER no banco.',
    );
  }
}

if (profileError) {
  console.error('FALHOU: perfil', profileError.message);
  process.exit(1);
}

const { data: row } = await admin
  .from('profiles')
  .select('role, is_active, email')
  .eq('id', userId)
  .maybeSingle();

console.log(`PERFIL: ${row?.role ?? 'ausente'} ativo=${row?.is_active ?? false} email=${row?.email ?? email}`);
console.log(`LOGIN: ${email} → /login → /admin`);
console.log('Altere a senha provisória assim que entrar (recuperação de senha ou painel).');
