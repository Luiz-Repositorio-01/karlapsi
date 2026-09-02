/**
 * Garante CRON_SECRET no .env.local e na Vercel, sem imprimir o valor.
 */
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

function loadDotEnv(path) {
  const map = {};
  if (!existsSync(path)) return map;
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

const envPath = '.env.local';
const env = loadDotEnv(envPath);
const secret = env.CRON_SECRET?.trim() || randomBytes(32).toString('hex');

const lines = existsSync(envPath)
  ? readFileSync(envPath, 'utf8').split(/\r?\n/)
  : [];
let replaced = false;
const next = lines.map((line) => {
  if (line.startsWith('CRON_SECRET=')) {
    replaced = true;
    return `CRON_SECRET=${secret}`;
  }
  return line;
});
if (!replaced) {
  if (next.length && next[next.length - 1] !== '') next.push('');
  next.push(`CRON_SECRET=${secret}`);
}
writeFileSync(envPath, `${next.filter((line, i, arr) => !(i === arr.length - 1 && line === '')).join('\n')}\n`, {
  mode: 0o600,
});
console.log('OK: CRON_SECRET gravado em .env.local');

const vercel = process.platform === 'win32' ? 'vercel.cmd' : 'vercel';
for (const target of ['production', 'preview']) {
  const add = spawnSync(vercel, ['env', 'add', 'CRON_SECRET', target], {
    input: `${secret}\n`,
    encoding: 'utf8',
    windowsHide: true,
    shell: process.platform === 'win32',
    env: { ...process.env, NPM_CONFIG_LOGLEVEL: 'error' },
  });
  if (add.status === 0) {
    console.log(`OK: CRON_SECRET adicionado em ${target}`);
    continue;
  }
  const update = spawnSync(vercel, ['env', 'update', 'CRON_SECRET', target, '--yes'], {
    input: `${secret}\n`,
    encoding: 'utf8',
    windowsHide: true,
    shell: process.platform === 'win32',
    env: { ...process.env, NPM_CONFIG_LOGLEVEL: 'error' },
  });
  if (update.status !== 0) {
    const raw = `${add.stderr || ''}\n${update.stderr || ''}`;
    console.error(`FALHOU: ${target}`);
    console.error(raw.split(secret).join('[redacted]').slice(0, 500));
    process.exit(1);
  }
  console.log(`OK: CRON_SECRET atualizado em ${target}`);
}
