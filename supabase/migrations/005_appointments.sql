-- =============================================================================
-- 005_appointments.sql — Agenda, bloqueios e solicitações públicas
--
-- PREVENÇÃO DE DOUBLE BOOKING: garantida por EXCLUSION CONSTRAINT no banco.
-- A interface e a API são apenas camadas de conveniência; o banco é a única
-- fonte de verdade sobre conflito de horário.
-- =============================================================================

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients (id) on delete set null,
  service_id uuid references public.services (id) on delete set null,
  professional_id uuid references public.profiles (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status appointment_status not null default 'requested',
  origin appointment_origin not null default 'admin',
  price_cents integer,
  payment_method payment_method,
  -- Snapshot dos dados de contato informados no agendamento público, para o
  -- caso de a solicitação ainda não ter sido convertida em paciente.
  contact_name text,
  contact_email text,
  contact_phone text,
  patient_notes text,
  admin_notes text,
  cancellation_reason text,
  rescheduled_from uuid references public.appointments (id) on delete set null,
  is_demo boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_order check (ends_at > starts_at),
  constraint appointments_duration_max check (ends_at - starts_at <= interval '12 hours'),
  constraint appointments_price_positive check (price_cents is null or price_cents >= 0),
  -- Um horário só pode ter um atendimento ativo por profissional.
  -- Status finais/negativos liberam o horário automaticamente.
  constraint appointments_no_overlap exclude using gist (
    (coalesce(professional_id, '00000000-0000-0000-0000-000000000000'::uuid)) with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('requested', 'confirmed', 'awaiting_payment', 'paid', 'completed'))
);

create index if not exists appointments_starts_at_idx on public.appointments (starts_at desc);
create index if not exists appointments_patient_idx on public.appointments (patient_id, starts_at desc);
create index if not exists appointments_status_idx on public.appointments (status, starts_at);
create index if not exists appointments_upcoming_idx on public.appointments (starts_at)
  where status in ('requested', 'confirmed', 'awaiting_payment', 'paid');
-- Suporta o limite de solicitações pendentes por e-mail (agendamento público).
create index if not exists appointments_pending_contact_idx on public.appointments (contact_email, starts_at)
  where status = 'requested';

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Bloqueios de horário (almoço extra, supervisão, compromissos pessoais)
-- -----------------------------------------------------------------------------
create table if not exists public.blocked_times (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  professional_id uuid references public.profiles (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint blocked_times_order check (ends_at > starts_at)
);

create index if not exists blocked_times_range_idx on public.blocked_times (starts_at, ends_at);

-- -----------------------------------------------------------------------------
-- Solicitações do site público
--
-- Não é duplicação de `appointments`: o appointment é a entidade de AGENDA
-- (reserva o horário via exclusion constraint), enquanto o request guarda a
-- SUBMISSÃO original (dados informados, consentimento, IP hash, user agent),
-- necessária para LGPD, auditoria e triagem.
-- -----------------------------------------------------------------------------
create table if not exists public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments (id) on delete set null,
  service_id uuid references public.services (id) on delete set null,
  requested_start timestamptz not null,
  full_name text not null,
  email text not null,
  phone text not null,
  birth_date date,
  is_for_dependent boolean not null default false,
  dependent_name text,
  message text,
  status request_status not null default 'new',
  consent_accepted boolean not null default false,
  consent_version text,
  ip_hash text,
  user_agent text,
  handled_by uuid references public.profiles (id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_requests_consent check (consent_accepted),
  constraint appointment_requests_name_len check (char_length(trim(full_name)) between 2 and 160),
  constraint appointment_requests_phone_len check (char_length(regexp_replace(phone, '\D', '', 'g')) between 10 and 13)
);

create index if not exists appointment_requests_status_idx on public.appointment_requests (status, created_at desc);
create index if not exists appointment_requests_email_idx on public.appointment_requests (email, created_at desc);
-- Suporta a checagem de rate limit por IP (hash) das últimas horas.
create index if not exists appointment_requests_ip_idx on public.appointment_requests (ip_hash, created_at desc)
  where ip_hash is not null;

drop trigger if exists appointment_requests_set_updated_at on public.appointment_requests;
create trigger appointment_requests_set_updated_at
  before update on public.appointment_requests
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Mensagens do formulário de contato
-- -----------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  status request_status not null default 'new',
  consent_accepted boolean not null default false,
  ip_hash text,
  user_agent text,
  handled_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_messages_message_len check (char_length(trim(message)) between 10 and 4000)
);

create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at desc);

drop trigger if exists contact_messages_set_updated_at on public.contact_messages;
create trigger contact_messages_set_updated_at
  before update on public.contact_messages
  for each row execute function app.set_updated_at();
