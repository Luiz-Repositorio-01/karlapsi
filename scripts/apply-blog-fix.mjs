/**
 * Aplica a migration 014 (GRANT SELECT em profiles para anon) no projeto remoto.
 * Requer SUPABASE_ACCESS_TOKEN (Personal Access Token) ou sessão do `supabase login`.
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

loadDotEnv('.env.local');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!url) {
  console.error('FALHOU: NEXT_PUBLIC_SUPABASE_URL ausente.');
  process.exit(1);
}

const projectRef = new URL(url).hostname.split('.')[0];
const sql = readFileSync('supabase/migrations/014_profiles_anon_select.sql', 'utf8');

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken ?? ''}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
});

if (!response.ok) {
  const body = await response.text();
  console.error('FALHOU: não foi possível aplicar SQL remoto.');
  console.error(`HTTP ${response.status}: ${body}`);
  console.error(
    'Alternativa: no painel Supabase → SQL Editor, execute supabase/migrations/014_profiles_anon_select.sql',
  );
  process.exit(1);
}

console.log('OK: GRANT SELECT em profiles aplicado no projeto remoto.');

// Garante autoria pública da OWNER para exibir nome/foto nos artigos.
const ensure = spawnSync(process.execPath, ['scripts/ensure-owner.mjs'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(ensure.status ?? 1);
