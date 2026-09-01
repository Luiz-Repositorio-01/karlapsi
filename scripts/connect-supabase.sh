#!/usr/bin/env bash
# Conecta ao projeto Supabase real da Karla Neuropsi.
# NÃO imprime secrets. Requer variáveis já exportadas no ambiente.
set -euo pipefail
PROJECT_REF="${SUPABASE_PROJECT_REF:-oerlxsstjuyptnryhpyi}"
SITE_URL_DEFAULT="https://oerlxsstjuyptnryhpyi.supabase.co"

required=(NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_ACCESS_TOKEN SUPABASE_DB_PASSWORD)
for k in "${required[@]}"; do
  if [[ -z "${!k:-}" ]]; then
    echo "PENDENTE DE CREDENCIAL: $k" >&2
    exit 1
  fi
done

export NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-$SITE_URL_DEFAULT}"

# Escreve .env.local sem ecoar valores
umask 077
{
  echo "NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL:-https://karlaneuropsi.com.br}"
  echo "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY"
  if [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
    echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
  fi
  if [[ -n "${NEXT_PUBLIC_WHATSAPP:-}" ]]; then
    echo "NEXT_PUBLIC_WHATSAPP=$NEXT_PUBLIC_WHATSAPP"
  else
    echo "NEXT_PUBLIC_WHATSAPP=5511988830377"
  fi
  echo "EMAIL_PROVIDER=${EMAIL_PROVIDER:-log}"
} > .env.local

echo "OK: .env.local escrito (valores omitidos neste log)."
echo "Linkando project-ref $PROJECT_REF…"
supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
echo "Estado remoto (migration list)…"
supabase migration list
echo "Aplicando migrations com db push (sem reset)…"
supabase db push
echo "Concluído. Rode: npm run db:validate && npm run verify"
