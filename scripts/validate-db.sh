#!/usr/bin/env bash
# =============================================================================
# validate-db.sh — Aplica as migrations em um PostgreSQL local e roda os
# testes de RLS/RBAC/agenda de supabase/tests.
#
# Uso:
#   ./scripts/validate-db.sh                  # cria/recria o banco karla_test
#   PGDATABASE=outro ./scripts/validate-db.sh
#
# Requisitos: PostgreSQL 14+ local com superusuário acessível.
# Este script NÃO toca no Supabase de produção.
# =============================================================================
set -euo pipefail

DB_NAME="${PGDATABASE:-karla_test}"
# `client_min_messages=warning` silencia os NOTICE de "drop ... if exists".
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"
PSQL_BASE=(psql -v ON_ERROR_STOP=1 -q)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Recriando banco de validação: ${DB_NAME}"
"${PSQL_BASE[@]}" -d postgres -c "drop database if exists ${DB_NAME};" >/dev/null
"${PSQL_BASE[@]}" -d postgres -c "create database ${DB_NAME};" >/dev/null

echo "==> Stubs do Supabase (auth/storage) — apenas para teste local"
"${PSQL_BASE[@]}" -d "${DB_NAME}" -f "${ROOT_DIR}/supabase/tests/00_supabase_stubs.sql" >/dev/null

echo "==> Aplicando migrations"
for file in "${ROOT_DIR}"/supabase/migrations/*.sql; do
  echo "    - $(basename "${file}")"
  "${PSQL_BASE[@]}" -d "${DB_NAME}" -f "${file}" >/dev/null
done

echo "==> Testes de RLS, RBAC, agenda e LGPD"
PGOPTIONS="-c client_min_messages=notice" "${PSQL_BASE[@]}" -d "${DB_NAME}" \
  -f "${ROOT_DIR}/supabase/tests/01_rls_test.sql" 2>&1 |
  sed -e 's/^NOTICE:  /    /' -e '/^$/d'

echo "==> Verificando que RLS está ativo em todas as tabelas de public"
"${PSQL_BASE[@]}" -d "${DB_NAME}" -t -c "
  select string_agg(relname, ', ')
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
" | grep -qE '^\s*$' && echo "    OK — nenhuma tabela sem RLS" || {
  echo "    FALHA — existem tabelas sem RLS acima"
  exit 1
}

echo "==> Seed de demonstração (dados fictícios)"
"${PSQL_BASE[@]}" -d "${DB_NAME}" -f "${ROOT_DIR}/supabase/seed/demo.sql" >/dev/null
echo "    OK — seed aplicado"

echo ""
echo "Validação de banco concluída com sucesso."
