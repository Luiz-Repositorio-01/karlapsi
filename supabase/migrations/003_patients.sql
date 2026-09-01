-- =============================================================================
-- 003_patients.sql — Cadastro de pacientes (dados administrativos) + LGPD
--
-- IMPORTANTE: esta tabela guarda apenas dados ADMINISTRATIVOS/cadastrais.
-- Nenhum dado clínico (hipóteses, laudos, testes) é armazenado aqui. Conteúdo
-- clínico deve trafegar como documento privado no Storage, com acesso restrito
-- (ver 008_storage.sql).
-- =============================================================================

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  social_name text,
  cpf text,
  rg text,
  birth_date date,
  email text,
  phone text,
  whatsapp text,
  address_street text,
  address_number text,
  address_complement text,
  address_district text,
  address_city text,
  address_state text,
  address_zip text,
  guardian_name text,
  guardian_phone text,
  guardian_relationship text,
  referral_source text,
  admin_notes text,
  tags text[] not null default '{}',
  is_demo boolean not null default false,
  archived_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patients_full_name_len check (char_length(trim(full_name)) between 2 and 160),
  -- CPF é armazenado somente em dígitos; a formatação é responsabilidade da UI.
  constraint patients_cpf_format check (cpf is null or cpf ~ '^[0-9]{11}$'),
  constraint patients_birth_date_sane check (birth_date is null or birth_date > date '1900-01-01'),
  constraint patients_email_format check (
    email is null or (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
  )
);

-- CPF é único quando informado (permite cadastros sem CPF, ex.: crianças).
create unique index if not exists patients_cpf_unique on public.patients (cpf) where cpf is not null;
create index if not exists patients_active_idx on public.patients (full_name) where archived_at is null;
create index if not exists patients_email_idx on public.patients (email) where email is not null;
create index if not exists patients_search_idx on public.patients
  using gin (to_tsvector('portuguese', coalesce(full_name, '') || ' ' || coalesce(social_name, '')));

drop trigger if exists patients_set_updated_at on public.patients;
create trigger patients_set_updated_at
  before update on public.patients
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Contatos adicionais
-- -----------------------------------------------------------------------------
create table if not exists public.patient_contacts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  kind text not null check (kind in ('phone', 'email', 'whatsapp', 'guardian', 'other')),
  label text,
  value text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint patient_contacts_value_len check (char_length(trim(value)) between 3 and 200)
);

create index if not exists patient_contacts_patient_idx on public.patient_contacts (patient_id);
create unique index if not exists patient_contacts_primary_unique
  on public.patient_contacts (patient_id, kind) where is_primary;

-- -----------------------------------------------------------------------------
-- Registro de consentimento (LGPD, art. 8º §1º — prova do consentimento)
-- -----------------------------------------------------------------------------
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients (id) on delete cascade,
  subject_email text,
  subject_name text,
  consent_type consent_type not null,
  granted boolean not null default true,
  policy_version text not null,
  source text not null default 'public_site',
  ip_hash text,
  user_agent text,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint consents_subject_present check (patient_id is not null or subject_email is not null)
);

create index if not exists consents_patient_idx on public.consents (patient_id);
create index if not exists consents_email_idx on public.consents (subject_email);

-- -----------------------------------------------------------------------------
-- Solicitações do titular de dados (LGPD art. 18): acesso, correção, exclusão
-- -----------------------------------------------------------------------------
create table if not exists public.data_subject_requests (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients (id) on delete set null,
  requester_name text not null,
  requester_email text not null,
  request_type text not null check (request_type in ('access', 'rectification', 'deletion', 'portability', 'revoke_consent')),
  details text,
  status request_status not null default 'new',
  handled_by uuid references public.profiles (id) on delete set null,
  handled_at timestamptz,
  resolution_notes text,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists dsr_set_updated_at on public.data_subject_requests;
create trigger dsr_set_updated_at
  before update on public.data_subject_requests
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Anonimização (LGPD): preserva histórico estatístico sem dado identificável.
-- -----------------------------------------------------------------------------
create or replace function public.anonymize_patient(p_patient_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app.is_admin() then
    raise exception 'Apenas OWNER ou ADMIN podem anonimizar pacientes.';
  end if;

  update public.patients set
    full_name = 'Paciente anonimizado',
    social_name = null,
    cpf = null,
    rg = null,
    email = null,
    phone = null,
    whatsapp = null,
    birth_date = null,
    address_street = null,
    address_number = null,
    address_complement = null,
    address_district = null,
    address_city = null,
    address_state = null,
    address_zip = null,
    guardian_name = null,
    guardian_phone = null,
    guardian_relationship = null,
    admin_notes = null,
    tags = '{}',
    archived_at = coalesce(archived_at, now())
  where id = p_patient_id;

  delete from public.patient_contacts where patient_id = p_patient_id;
end;
$$;

revoke all on function public.anonymize_patient(uuid) from public, anon;
grant execute on function public.anonymize_patient(uuid) to authenticated, service_role;
