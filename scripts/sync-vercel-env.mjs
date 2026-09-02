/**
 * Atualiza variáveis na Vercel a partir de .env.local, sem imprimir valores.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function loadDotEnv(path) {
  const map = {};
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map[line.slice(0, eq).trim()] = value;
  }
  return map;
}

const env = loadDotEnv('.env.local');
const names = [
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_WHATSAPP',
];

const vercel = process.platform === 'win32' ? 'vercel.cmd' : 'vercel';

for (const name of names) {
  const value = env[name];
  if (!value) {
    console.error(`FALHOU: ${name} ausente no .env.local`);
    process.exit(1);
  }
  for (const target of ['production', 'preview']) {
    const result = spawnSync(
      vercel,
      ['env', 'update', name, target, '--yes'],
      {
        input: `${value}\n`,
        encoding: 'utf8',
        windowsHide: true,
        shell: process.platform === 'win32',
        env: { ...process.env, NPM_CONFIG_LOGLEVEL: 'error' },
      },
    );
    const ok = result.status === 0;
    const raw = `${result.stderr || ''}\n${result.stdout || ''}\n${result.error?.message || ''}`;
    const err = raw.split(value).join('[redacted]').trim();
    if (!ok) {
      console.error(`FALHOU: ${name} ${target} status=${result.status}`);
      console.error(err.slice(0, 600) || 'sem detalhe');
      process.exit(1);
    }
    console.log(`OK: ${name} ${target}`);
  }
}
