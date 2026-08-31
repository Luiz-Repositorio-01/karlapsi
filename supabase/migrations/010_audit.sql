-- =============================================================================
-- 010_audit.sql — Trilha de auditoria
--
-- O que é registrado: quem, quando, qual ação, qual entidade e QUAIS CAMPOS
-- mudaram. Em tabelas com dado pessoal (patients) registramos apenas a lista
-- de campos alterados — nunca os valores — aplicando minimização de dados.
-- Senhas e tokens nunca chegam ao banco.
-- =============================================================================

create table if not exists public.audit_logs (
  id bigserial primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  actor_email text,
  actor_role user_role,
  action text not null,
  entity text not null,
  entity_id text,
  changed_fields text[],
  -- `details` só recebe metadados não sensíveis (ex.: status anterior/novo).
  details jsonb not null default '{}'::jsonb,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity, entity_id, created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);

alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;

grant select on public.audit_logs to authenticated;
grant usage, select on sequence public.audit_logs_id_seq to authenticated, service_role;

-- Somente OWNER/ADMIN leem a trilha. Ninguém edita ou apaga pela API:
-- a inserção acontece por trigger/definer, mantendo a trilha imutável.
drop policy if exists "audit_logs: admin read" on public.audit_logs;
create policy "audit_logs: admin read"
  on public.audit_logs for select to authenticated
  using (app.is_admin());

-- -----------------------------------------------------------------------------
-- Registro programático (chamado pela aplicação em ações relevantes)
-- -----------------------------------------------------------------------------
create or replace function public.log_audit_event(
  p_action text,
  p_entity text,
  p_entity_id text default null,
  p_details jsonb default '{}'::jsonb,
  p_ip text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  select * into v_profile from public.profiles where id = auth.uid();

  insert into public.audit_logs (
    actor_id, actor_email, actor_role, action, entity, entity_id, details, ip_hash, user_agent
  )
  values (
    v_profile.id,
    v_profile.email,
    v_profile.role,
    p_action,
    p_entity,
    p_entity_id,
    -- Remove por precaução qualquer chave sensível que chegue por engano.
    (coalesce(p_details, '{}'::jsonb) - 'password' - 'token' - 'access_token' - 'secret' - 'cpf'),
    app.hash_ip(p_ip),
    left(coalesce(p_user_agent, ''), 400)
  );
end;
$$;

revoke all on function public.log_audit_event(text, text, text, jsonb, text, text) from public, anon;
grant execute on function public.log_audit_event(text, text, text, jsonb, text, text) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Trigger genérica de auditoria
-- -----------------------------------------------------------------------------
create or replace function app.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_changed text[] := '{}';
  v_details jsonb := '{}'::jsonb;
  v_entity_id text;
  -- Tabelas cujos valores não devem ser copiados para a trilha.
  v_sensitive boolean := tg_table_name in ('patients', 'patient_contacts', 'documents', 'appointment_requests', 'contact_messages');
begin
  select * into v_profile from public.profiles where id = auth.uid();

  if tg_op = 'UPDATE' then
    select coalesce(array_agg(o.key), '{}')
      into v_changed
    from jsonb_each(to_jsonb(old)) o
    join jsonb_each(to_jsonb(new)) n on n.key = o.key
    where o.value is distinct from n.value and o.key <> 'updated_at';

    if v_changed = '{}' then
      return new;
    end if;
  end if;

  v_entity_id := case
    when tg_op = 'DELETE' then (to_jsonb(old) ->> 'id')
    else (to_jsonb(new) ->> 'id')
  end;

  if not v_sensitive then
    v_details := case
      when tg_op = 'DELETE' then jsonb_build_object('before', to_jsonb(old))
      when tg_op = 'INSERT' then jsonb_build_object('after', to_jsonb(new))
      else jsonb_build_object(
        'before_status', to_jsonb(old) -> 'status',
        'after_status', to_jsonb(new) -> 'status'
      )
    end;
  end if;

  insert into public.audit_logs (
    actor_id, actor_email, actor_role, action, entity, entity_id, changed_fields, details
  )
  values (
    v_profile.id, v_profile.email, v_profile.role,
    lower(tg_op), tg_table_name, v_entity_id, v_changed,
    (v_details - 'password' - 'token' - 'access_token' - 'secret' - 'cpf' - 'rg')
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Tabelas sob auditoria automática.
do $$
declare
  t text;
begin
  foreach t in array array[
    'patients', 'appointments', 'appointment_requests', 'payments', 'orders',
    'services', 'availability_rules', 'availability_exceptions', 'blocked_times',
    'profiles', 'documents', 'site_settings', 'site_pages', 'blog_posts',
    'infobooks', 'landing_pages', 'products', 'testimonials'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_audit', t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function app.audit_row_change()',
      t || '_audit', t
    );
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Auditoria de autenticação
--
-- `auth.users.last_sign_in_at` é atualizado pelo GoTrue a cada login; usamos
-- isso para registrar o evento de acesso sem tocar em credenciais.
-- -----------------------------------------------------------------------------
create or replace function app.audit_sign_in()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at and new.last_sign_in_at is not null then
    update public.profiles set last_sign_in_at = new.last_sign_in_at where id = new.id;

    insert into public.audit_logs (actor_id, actor_email, action, entity, entity_id)
    values (new.id, new.email, 'sign_in', 'auth.users', new.id::text);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_sign_in on auth.users;
create trigger on_auth_user_sign_in
  after update of last_sign_in_at on auth.users
  for each row execute function app.audit_sign_in();
