-- =============================================================================
-- 007_content.sql — Blog, infobooks, landing pages, FAQ, depoimentos e settings
-- =============================================================================

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint blog_categories_slug_unique unique (slug),
  constraint blog_categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  excerpt text,
  -- Conteúdo em Markdown; renderizado com sanitização no servidor.
  content text not null default '',
  cover_url text,
  cover_alt text,
  category_id uuid references public.blog_categories (id) on delete set null,
  author_id uuid references public.profiles (id) on delete set null,
  status content_status not null default 'draft',
  published_at timestamptz,
  scheduled_for timestamptz,
  seo_title text,
  seo_description text,
  tags text[] not null default '{}',
  reading_minutes integer,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_slug_unique unique (slug),
  constraint blog_posts_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint blog_posts_title_len check (char_length(trim(title)) between 3 and 200),
  constraint blog_posts_seo_description_len check (seo_description is null or char_length(seo_description) <= 320),
  constraint blog_posts_published_requires_date check (status <> 'published' or published_at is not null),
  constraint blog_posts_scheduled_requires_date check (status <> 'scheduled' or scheduled_for is not null)
);

create index if not exists blog_posts_published_idx on public.blog_posts (published_at desc)
  where status = 'published';
create index if not exists blog_posts_scheduled_idx on public.blog_posts (scheduled_for)
  where status = 'scheduled';
create index if not exists blog_posts_search_idx on public.blog_posts
  using gin (to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(excerpt, '')));

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function app.set_updated_at();

-- Publica automaticamente posts agendados cujo horário já passou.
-- Pode ser chamada por cron (pg_cron) ou pelo próprio app.
create or replace function public.publish_scheduled_posts()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  with updated as (
    update public.blog_posts
    set status = 'published', published_at = coalesce(published_at, scheduled_for)
    where status = 'scheduled' and scheduled_for <= now()
    returning 1
  )
  select count(*) into v_count from updated;
  return v_count;
end;
$$;

-- -----------------------------------------------------------------------------
-- Infobooks — conteúdo editorial. A cobrança (quando houver) fica em products,
-- evitando duplicar preço/checkout em duas tabelas.
-- -----------------------------------------------------------------------------
create table if not exists public.infobooks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  description text,
  category text,
  cover_url text,
  author_id uuid references public.profiles (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  is_free boolean not null default true,
  price_cents integer,
  -- Arquivo no bucket privado (pagos) ou URL pública (gratuitos).
  file_path text,
  public_file_url text,
  preview_url text,
  -- Caminho do módulo original preservado em /public/legacy (não editar!).
  legacy_path text,
  pages integer,
  status content_status not null default 'published',
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint infobooks_slug_unique unique (slug),
  constraint infobooks_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint infobooks_price_when_paid check (is_free or coalesce(price_cents, 0) > 0)
);

drop trigger if exists infobooks_set_updated_at on public.infobooks;
create trigger infobooks_set_updated_at
  before update on public.infobooks
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Landing pages — vitrine das páginas comerciais já existentes.
-- `legacy_path` aponta para o HTML original preservado, garantindo que os
-- links antigos continuem funcionando sem reescrever o conteúdo.
-- -----------------------------------------------------------------------------
create table if not exists public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  headline text,
  description text,
  benefits text[] not null default '{}',
  audience text,
  cover_url text,
  price_cents integer,
  cta_label text default 'Acessar',
  cta_url text,
  legacy_path text,
  product_id uuid references public.products (id) on delete set null,
  status content_status not null default 'published',
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landing_pages_slug_unique unique (slug),
  constraint landing_pages_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

drop trigger if exists landing_pages_set_updated_at on public.landing_pages;
create trigger landing_pages_set_updated_at
  before update on public.landing_pages
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- FAQ
-- -----------------------------------------------------------------------------
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null default 'geral',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint faqs_question_len check (char_length(trim(question)) between 5 and 300)
);

drop trigger if exists faqs_set_updated_at on public.faqs;
create trigger faqs_set_updated_at
  before update on public.faqs
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Depoimentos
--
-- A tabela nasce VAZIA de propósito: o site só exibe depoimentos reais,
-- cadastrados pela profissional, com registro de autorização de uso.
-- -----------------------------------------------------------------------------
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_display_name text not null,
  author_context text,
  content text not null,
  is_published boolean not null default false,
  authorization_reference text,
  authorized_at timestamptz,
  sort_order integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testimonials_content_len check (char_length(trim(content)) between 10 and 1200),
  -- Não é possível publicar sem registro de autorização do autor.
  constraint testimonials_requires_authorization check (
    not is_published or (authorization_reference is not null and authorized_at is not null)
  )
);

drop trigger if exists testimonials_set_updated_at on public.testimonials;
create trigger testimonials_set_updated_at
  before update on public.testimonials
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Configurações do site (chave/valor JSON) — tudo editável pelo painel
-- -----------------------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint site_settings_key_format check (key ~ '^[a-z0-9_]+$')
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Conteúdo editorial das páginas institucionais (sobre, neuropsicologia, ...)
-- Permite ajustar textos profissionais sem alterar código.
-- -----------------------------------------------------------------------------
create table if not exists public.site_pages (
  slug text primary key,
  title text not null,
  subtitle text,
  -- Estrutura livre por seção: [{ id, heading, body, items: [] }]
  sections jsonb not null default '[]'::jsonb,
  seo_title text,
  seo_description text,
  is_published boolean not null default true,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint site_pages_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

drop trigger if exists site_pages_set_updated_at on public.site_pages;
create trigger site_pages_set_updated_at
  before update on public.site_pages
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Documentos (metadados; o arquivo vive no Supabase Storage)
-- -----------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  bucket text not null default 'patient-documents',
  file_path text not null,
  mime_type text,
  size_bytes bigint,
  visibility document_visibility not null default 'private',
  patient_id uuid references public.patients (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint documents_path_unique unique (bucket, file_path),
  constraint documents_size_limit check (size_bytes is null or size_bytes <= 26214400) -- 25 MB
);

create index if not exists documents_patient_idx on public.documents (patient_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Notificações (outbox): a entrega é feita por adaptadores na aplicação
-- (email/WhatsApp/push). O banco guarda apenas a fila e o resultado.
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  channel notification_channel not null default 'internal',
  template text not null,
  recipient text,
  subject text,
  payload jsonb not null default '{}'::jsonb,
  status notification_status not null default 'queued',
  error text,
  related_table text,
  related_id uuid,
  read_at timestamptz,
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists notifications_queue_idx on public.notifications (status, scheduled_for)
  where status = 'queued';
create index if not exists notifications_unread_idx on public.notifications (created_at desc)
  where channel = 'internal' and read_at is null;
