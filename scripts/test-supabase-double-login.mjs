/**
 * Testa se signOut antes do signIn resolve login com cookie antigo.
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
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = 'luiz.dev@auryxmedia.com.br';
const password = 'Luizao2026!';

const client = createClient(url, key, { auth: { persistSession: false } });

const { error: signIn1 } = await client.auth.signInWithPassword({ email, password });
console.log('signIn 1', signIn1?.message ?? 'OK');

const { error: signIn2 } = await client.auth.signInWithPassword({ email, password });
console.log('signIn 2 immediate', signIn2?.message ?? 'OK');

await new Promise((r) => setTimeout(r, 2000));

const { error: signIn3 } = await client.auth.signInWithPassword({ email, password });
console.log('signIn 3 after 2s', signIn3?.message ?? 'OK');
