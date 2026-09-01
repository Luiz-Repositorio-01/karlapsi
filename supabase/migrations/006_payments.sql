-- =============================================================================
-- 006_payments.sql — Financeiro, produtos digitais, pedidos e Mercado Pago
-- =============================================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  type product_type not null default 'material',
  summary text,
  description text,
  price_cents integer not null default 0,
  compare_at_cents integer,
  currency char(3) not null default 'BRL',
  is_free boolean not null default false,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  cover_url text,
  -- Caminho no bucket privado `products` (entrega após pagamento aprovado).
  file_path text,
  preview_url text,
  external_url text,
  benefits text[] not null default '{}',
  audience text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_slug_unique unique (slug),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint products_price_positive check (price_cents >= 0),
  constraint products_free_price check (not is_free or price_cents = 0)
);

create index if not exists products_public_idx on public.products (sort_order, name) where is_active;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Pedidos (produtos digitais)
-- -----------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null default ('KN-' || nextval('public.order_number_seq')::text),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  status order_status not null default 'pending',
  subtotal_cents integer not null default 0,
  total_cents integer not null default 0,
  currency char(3) not null default 'BRL',
  -- external_reference é o identificador enviado ao Mercado Pago; único para
  -- permitir conciliação idempotente via webhook.
  external_reference text,
  consent_accepted boolean not null default false,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_number_unique unique (order_number),
  constraint orders_external_reference_unique unique (external_reference),
  constraint orders_totals_positive check (subtotal_cents >= 0 and total_cents >= 0)
);

create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists orders_email_idx on public.orders (customer_email, created_at desc);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function app.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name_snapshot text not null,
  unit_price_cents integer not null,
  quantity integer not null default 1,
  total_cents integer not null,
  created_at timestamptz not null default now(),
  constraint order_items_quantity_range check (quantity between 1 and 20),
  constraint order_items_prices_positive check (unit_price_cents >= 0 and total_cents >= 0)
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- -----------------------------------------------------------------------------
-- Cobranças e pagamentos
-- -----------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients (id) on delete set null,
  appointment_id uuid references public.appointments (id) on delete set null,
  order_id uuid references public.orders (id) on delete cascade,
  service_id uuid references public.services (id) on delete set null,
  description text not null,
  amount_cents integer not null,
  currency char(3) not null default 'BRL',
  status payment_status not null default 'pending',
  method payment_method,
  due_date date,
  paid_at timestamptz,
  provider text,
  -- ID do pagamento no provedor (Mercado Pago). Único para garantir
  -- idempotência de conciliação.
  provider_payment_id text,
  provider_status text,
  provider_preference_id text,
  checkout_url text,
  metadata jsonb not null default '{}'::jsonb,
  is_demo boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_positive check (amount_cents >= 0),
  constraint payments_description_len check (char_length(trim(description)) between 2 and 300)
);

create unique index if not exists payments_provider_payment_unique
  on public.payments (provider, provider_payment_id)
  where provider_payment_id is not null;
create index if not exists payments_status_idx on public.payments (status, created_at desc);
create index if not exists payments_patient_idx on public.payments (patient_id, created_at desc);
create index if not exists payments_due_idx on public.payments (due_date) where status = 'pending';

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function app.set_updated_at();

-- Marca `paid_at` automaticamente quando o pagamento é aprovado.
create or replace function app.sync_payment_paid_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status in ('approved', 'authorized') and new.paid_at is null then
    new.paid_at = now();
  elsif new.status in ('pending', 'in_process', 'rejected', 'cancelled') then
    new.paid_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists payments_sync_paid_at on public.payments;
create trigger payments_sync_paid_at
  before insert or update of status on public.payments
  for each row execute function app.sync_payment_paid_at();

-- -----------------------------------------------------------------------------
-- Eventos de webhook — idempotência
--
-- Cada notificação recebida é registrada com o par (provider, event_key) único.
-- Se o par já existir, o webhook responde 200 sem reprocessar.
-- -----------------------------------------------------------------------------
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments (id) on delete set null,
  provider text not null default 'mercadopago',
  event_key text not null,
  event_type text,
  provider_status text,
  signature_valid boolean,
  -- Payload já sanitizado na aplicação (sem tokens/dados de cartão).
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  constraint payment_events_key_unique unique (provider, event_key)
);

create index if not exists payment_events_payment_idx on public.payment_events (payment_id, created_at desc);
