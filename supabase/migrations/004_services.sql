-- =============================================================================
-- 004_services.sql — Serviços, disponibilidade semanal e exceções de agenda
-- =============================================================================

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  summary text,
  description text,
  duration_minutes integer not null default 50,
  price_cents integer,
  currency char(3) not null default 'BRL',
  show_price_publicly boolean not null default false,
  allows_online_booking boolean not null default true,
  requires_payment boolean not null default false,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  image_url text,
  preparation_notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_slug_unique unique (slug),
  constraint services_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint services_duration_range check (duration_minutes between 10 and 600),
  constraint services_price_positive check (price_cents is null or price_cents >= 0),
  constraint services_name_len check (char_length(trim(name)) between 2 and 120)
);

create index if not exists services_public_idx on public.services (sort_order, name) where is_active;
create index if not exists services_bookable_idx on public.services (id) where is_active and allows_online_booking;

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
  before update on public.services
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Disponibilidade semanal recorrente
-- weekday: 0 = domingo ... 6 = sábado (compatível com Date#getDay do JS)
-- -----------------------------------------------------------------------------
create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null,
  start_time time not null,
  end_time time not null,
  slot_interval_minutes integer not null default 30,
  break_start_time time,
  break_end_time time,
  service_id uuid references public.services (id) on delete cascade,
  professional_id uuid references public.profiles (id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_weekday_range check (weekday between 0 and 6),
  constraint availability_time_order check (end_time > start_time),
  constraint availability_interval_range check (slot_interval_minutes between 5 and 240),
  constraint availability_break_valid check (
    (break_start_time is null and break_end_time is null)
    or (break_start_time is not null and break_end_time is not null and break_end_time > break_start_time)
  )
);

create index if not exists availability_rules_weekday_idx on public.availability_rules (weekday) where is_active;

drop trigger if exists availability_rules_set_updated_at on public.availability_rules;
create trigger availability_rules_set_updated_at
  before update on public.availability_rules
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Exceções: feriados, férias, bloqueios de dia inteiro e horários especiais
-- -----------------------------------------------------------------------------
create table if not exists public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  exception_date date not null,
  is_available boolean not null default false,
  start_time time,
  end_time time,
  slot_interval_minutes integer,
  reason text,
  professional_id uuid references public.profiles (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint availability_exceptions_times check (
    (not is_available)
    or (start_time is not null and end_time is not null and end_time > start_time)
  )
);

create unique index if not exists availability_exceptions_unique
  on public.availability_exceptions (exception_date, coalesce(professional_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- -----------------------------------------------------------------------------
-- Regras gerais de agendamento (janela mínima/máxima etc.) ficam em
-- site_settings (chave `booking`) para serem editáveis pelo painel.
-- -----------------------------------------------------------------------------
