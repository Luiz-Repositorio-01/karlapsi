-- =============================================================================
-- 002_auth_profiles.sql — Perfis, RBAC e helpers de autorização
-- =============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role user_role not null default 'ASSISTANT',
  phone text,
  avatar_url text,
  bio text,
  specialty text,
  is_active boolean not null default true,
  is_public_author boolean not null default false,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_unique unique (email),
  -- Emails são sempre normalizados em minúsculas (evita duplicidade de conta).
  constraint profiles_email_lower check (email = lower(email)),
  constraint profiles_full_name_len check (char_length(full_name) <= 160)
);

create index if not exists profiles_role_idx on public.profiles (role) where is_active;
create index if not exists profiles_public_author_idx on public.profiles (is_public_author) where is_public_author;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Helpers de autorização
--
-- SECURITY DEFINER + search_path fixo: as policies precisam ler `profiles`
-- sem recursão de RLS. As funções são STABLE e não expõem dados.
-- -----------------------------------------------------------------------------
create or replace function app.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid() and p.is_active
  limit 1;
$$;

create or replace function app.has_role(roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app.current_role() = any (roles), false);
$$;

-- Qualquer membro ativo da equipe (usado para leitura operacional).
create or replace function app.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.current_role() is not null;
$$;

-- Administração plena (OWNER/ADMIN): permissões, financeiro, configurações.
create or replace function app.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.has_role(array['OWNER', 'ADMIN']::public.user_role[]);
$$;

create or replace function app.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.has_role(array['OWNER']::public.user_role[]);
$$;

grant execute on function app.current_role, app.has_role, app.is_staff, app.is_admin, app.is_owner
  to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Provisionamento de perfil
--
-- O PRIMEIRO usuário criado torna-se OWNER automaticamente. Qualquer usuário
-- posterior entra como ASSISTANT (menor privilégio) e precisa ser promovido
-- por um OWNER/ADMIN. Não existe senha fixa nem usuário semeado no código.
-- -----------------------------------------------------------------------------
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
  v_has_owner boolean;
begin
  select exists (select 1 from public.profiles where role = 'OWNER') into v_has_owner;

  if v_has_owner then
    -- Permite pré-definir o papel via metadata apenas para papéis não administrativos.
    v_role := case
      when coalesce(new.raw_user_meta_data ->> 'role', '') in ('ASSISTANT', 'PROFESSIONAL')
        then (new.raw_user_meta_data ->> 'role')::public.user_role
      else 'ASSISTANT'::public.user_role
    end;
  else
    v_role := 'OWNER'::public.user_role;
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    v_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- -----------------------------------------------------------------------------
-- Trava de escalonamento de privilégio
--
-- Um usuário nunca pode alterar seu próprio papel, e apenas OWNER pode criar
-- outro OWNER. A regra vive no banco — o frontend não é fonte de verdade.
-- -----------------------------------------------------------------------------
create or replace function app.guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is null then
      -- service_role / migrations: permitido (uso administrativo controlado).
      return new;
    end if;

    if auth.uid() = old.id then
      raise exception 'Não é permitido alterar o próprio papel de acesso.';
    end if;

    if not app.is_admin() then
      raise exception 'Apenas OWNER ou ADMIN podem alterar papéis de acesso.';
    end if;

    if (new.role = 'OWNER' or old.role = 'OWNER') and not app.is_owner() then
      raise exception 'Apenas o OWNER pode conceder ou remover o papel OWNER.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_role_change on public.profiles;
create trigger profiles_guard_role_change
  before update on public.profiles
  for each row execute function app.guard_role_change();

-- Garante que sempre exista pelo menos um OWNER ativo.
create or replace function app.guard_last_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_count integer;
begin
  select count(*) into v_owner_count
  from public.profiles
  where role = 'OWNER' and is_active and id <> old.id;

  if v_owner_count = 0 and old.role = 'OWNER' then
    if tg_op = 'DELETE' or new.role <> 'OWNER' or not new.is_active then
      raise exception 'É obrigatório manter ao menos um OWNER ativo.';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_last_owner on public.profiles;
create trigger profiles_guard_last_owner
  before update or delete on public.profiles
  for each row execute function app.guard_last_owner();
