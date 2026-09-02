/**
 * Cria ou atualiza o usuário OWNER no Supabase Auth.
 * Lê URL/service role de .env.local e e-mail/senha de OWNER_EMAIL / OWNER_PASSWORD.
 * Não imprime segredos.
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
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
const password = process.env.OWNER_PASSWORD;

if (!url || !serviceRole) {
  console.error('FALHOU: Supabase URL ou service role ausentes.');
  process.exit(1);
}
if (!email || !password) {
  console.error('FALHOU: OWNER_EMAIL e OWNER_PASSWORD são obrigatórios.');
  process.exit(1);
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
const { data: profiles, error: profileError } = await admin.from('profiles').select('id, role, is_active');
if (profileError) {
  console.error('FALHOU: profiles', profileError.message);
  process.exit(1);
}

const ownerProfile = (profiles ?? []).find((row) => row.role === 'OWNER' && row.is_active);

if (existing) {
  const { error } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  if (error) {
    console.error('FALHOU: updateUser', error.message);
    process.exit(1);
  }
  console.log('OK: usuário existente atualizado (senha redefinida, e-mail confirmado).');
} else if (ownerProfile) {
  const { error } = await admin.auth.admin.updateUserById(ownerProfile.id, {
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error('FALHOU: updateOwnerIdentity', error.message);
    process.exit(1);
  }
  console.log('OK: conta OWNER existente passou a usar o e-mail informado.');
} else {
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error('FALHOU: createUser', error.message);
    process.exit(1);
  }
  console.log('OK: usuário criado. O primeiro perfil vira OWNER pelo trigger do banco.');
}

const { data: finalUsers, error: finalListError } = await admin.auth.admin.listUsers({
  perPage: 200,
});
if (finalListError) {
  console.error('FALHOU: listUsers final', finalListError.message);
  process.exit(1);
}
const owner = finalUsers.users.find((user) => user.email?.toLowerCase() === email);
if (!owner) {
  console.error('FALHOU: e-mail do OWNER não encontrado após a operação.');
  process.exit(1);
}
const { data: ownerRow, error: ownerRowError } = await admin
  .from('profiles')
  .select('role, is_active')
  .eq('id', owner.id)
  .maybeSingle();
if (ownerRowError) {
  console.error('FALHOU: conferir perfil', ownerRowError.message);
  process.exit(1);
}
const { error: authorFlagError } = await admin
  .from('profiles')
  .update({ is_public_author: true })
  .eq('id', owner.id);
if (authorFlagError) {
  console.error('FALHOU: is_public_author', authorFlagError.message);
  process.exit(1);
}

console.log(
  `PERFIL: ${ownerRow?.role ?? 'ausente'} ativo=${ownerRow?.is_active ?? false} autoria_publica=true`,
);
