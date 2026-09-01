-- =============================================================================
-- 001_initial_schema.sql — Extensões, enums e utilitários compartilhados
-- Projeto: Karla Neuropsi
--
-- DECISÃO DE ARQUITETURA (documentada intencionalmente):
-- O consultório é single-tenant (uma profissional + equipe de apoio). Por isso
-- NÃO existe tabela `organizations`: o isolamento necessário é por PAPEL
-- (RBAC + RLS) e não por organização. Caso a operação passe a ter múltiplas
-- clínicas, a migração natural é adicionar `org_id` às tabelas core e um
-- predicado extra nas policies — as policies já são centralizadas em funções
-- auxiliares (`app.is_staff()`, `app.has_role()`) para facilitar isso.
-- =============================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "btree_gist";    -- necessário para EXCLUDE com uuid + tstzrange

-- Schema técnico para funções auxiliares (não exposto na API REST).
create schema if not exists app;
revoke all on schema app from public, anon, authenticated;
grant usage on schema app to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('OWNER', 'ADMIN', 'ASSISTANT', 'PROFESSIONAL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_status as enum (
    'requested',        -- solicitado pelo paciente
    'confirmed',        -- confirmado pela equipe
    'awaiting_payment', -- aguardando pagamento
    'paid',             -- pago
    'completed',        -- realizado
    'cancelled',        -- cancelado
    'no_show',          -- não compareceu
    'rescheduled'       -- reagendado (registro histórico)
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_origin as enum ('public_site', 'admin', 'whatsapp', 'phone', 'import', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  -- Espelha os estados do Mercado Pago + estados internos.
  create type payment_status as enum (
    'pending', 'approved', 'authorized', 'in_process',
    'rejected', 'cancelled', 'refunded', 'charged_back'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum (
    'mercadopago', 'pix', 'credit_card', 'debit_card', 'cash', 'bank_transfer', 'health_insurance', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending', 'paid', 'cancelled', 'refunded', 'fulfilled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_status as enum ('draft', 'scheduled', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_type as enum ('infobook', 'landing_page', 'material', 'service', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type document_visibility as enum ('private', 'staff', 'public');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_channel as enum ('email', 'whatsapp', 'push', 'internal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_status as enum ('queued', 'sent', 'failed', 'skipped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type consent_type as enum (
    'privacy_policy', 'appointment_terms', 'marketing', 'sensitive_data_processing'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_status as enum ('new', 'in_review', 'accepted', 'declined', 'archived');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Utilitários
-- -----------------------------------------------------------------------------

-- Mantém `updated_at` sempre coerente, independentemente do cliente.
create or replace function app.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- `unaccent` exige extensão que pode não estar disponível em todos os planos;
-- este fallback cobre os acentos do português sem dependência externa.
create or replace function app.unaccent_safe(input text)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select translate(
    coalesce(input, ''),
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
  );
$$;

-- Normaliza slugs para URLs amigáveis (usado em checks e defaults).
create or replace function app.slugify(input text)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select trim(both '-' from
    regexp_replace(
      lower(app.unaccent_safe(coalesce(input, ''))),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;

-- Hash de IP para telemetria/rate limiting sem armazenar dado pessoal bruto (LGPD).
-- `sha256` é nativo do PostgreSQL (>= 11), sem dependência de pgcrypto.
create or replace function app.hash_ip(ip text)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select case
    when ip is null or ip = '' then null
    else encode(sha256((ip || '::karla-neuropsi')::bytea), 'hex')
  end;
$$;
