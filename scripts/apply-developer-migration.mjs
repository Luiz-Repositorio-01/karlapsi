/**
 * Aplica as migrations 015 + 016 (papel DEVELOPER) no projeto remoto.
 * Requer SUPABASE_ACCESS_TOKEN ou sessão do `supabase login` com acesso ao projeto.
 *
 * O enum DEVELOPER precisa ser commitado antes das funções/policies (duas execuções).
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

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

async function runSql(projectRef, accessToken, sql, label) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken ?? ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    console.error(`FALHOU em ${label}.`);
    console.error(`HTTP ${response.status}: ${body}`);
    return false;
  }

  console.log(`OK: ${label}`);
  return true;
}

loadDotEnv('.env.local');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!url) {
  console.error('FALHOU: NEXT_PUBLIC_SUPABASE_URL ausente.');
  process.exit(1);
}

if (!accessToken) {
  console.error('FALHOU: SUPABASE_ACCESS_TOKEN ausente.');
  console.error(
    'Alternativa manual no SQL Editor (duas execuções separadas):\n' +
      '  1. supabase/migrations/015_developer_role.sql\n' +
      '  2. supabase/migrations/016_developer_role_policies.sql',
  );
  process.exit(1);
}

const projectRef = new URL(url).hostname.split('.')[0];

const step1 = readFileSync('supabase/migrations/015_developer_role.sql', 'utf8');
const step2 = readFileSync('supabase/migrations/016_developer_role_policies.sql', 'utf8');

const ok1 = await runSql(projectRef, accessToken, step1, '015 — enum DEVELOPER');
if (!ok1) {
  console.error(
    'Se o enum já existir, execute só o passo 2 no SQL Editor: 016_developer_role_policies.sql',
  );
  process.exit(1);
}

const ok2 = await runSql(projectRef, accessToken, step2, '016 — funções e políticas DEVELOPER');
if (!ok2) {
  console.error('Execute manualmente: supabase/migrations/016_developer_role_policies.sql');
  process.exit(1);
}

const ensure = spawnSync(process.execPath, ['scripts/ensure-developer.mjs'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
});
process.exit(ensure.status ?? 1);
