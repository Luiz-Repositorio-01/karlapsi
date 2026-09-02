-- Passo 2/2: funções, triggers e políticas RLS para o papel DEVELOPER.
-- Pré-requisito: 015_developer_role.sql executado com sucesso (enum contém DEVELOPER).

DO $guard$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'user_role'
      AND e.enumlabel = 'DEVELOPER'
  ) THEN
    RAISE EXCEPTION
      'DEVELOPER ainda não existe em public.user_role. Execute primeiro (sozinho, uma linha): ALTER TYPE public.user_role ADD VALUE ''DEVELOPER'';';
  END IF;
END;
$guard$;

create or replace function app.is_developer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select p.role::text = 'DEVELOPER'
      from public.profiles p
      where p.id = auth.uid() and p.is_active
      limit 1
    ),
    false
  );
$$;

create or replace function app.can_manage_content()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.is_staff() or app.is_developer();
$$;

create or replace function app.can_manage_site()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.is_admin() or app.is_developer();
$$;

grant execute on function app.is_developer, app.can_manage_content, app.can_manage_site
  to authenticated, service_role;

-- Provisionamento: permite criar DEVELOPER via metadata (service role / convite).
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
    v_role := case
      when coalesce(new.raw_user_meta_data ->> 'role', '') in ('ASSISTANT', 'PROFESSIONAL', 'DEVELOPER')
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

-- Conteúdo editorial
drop policy if exists "blog_categories: staff manage" on public.blog_categories;
create policy "blog_categories: staff manage"
  on public.blog_categories for all to authenticated
  using (app.can_manage_content()) with check (app.can_manage_content());

drop policy if exists "blog_posts: staff read all" on public.blog_posts;
create policy "blog_posts: staff read all"
  on public.blog_posts for select to authenticated
  using (app.can_manage_content() or (status = 'published' and coalesce(published_at, now()) <= now()));

drop policy if exists "blog_posts: staff manage" on public.blog_posts;
create policy "blog_posts: staff manage"
  on public.blog_posts for all to authenticated
  using (app.can_manage_content()) with check (app.can_manage_content());

drop policy if exists "infobooks: staff read all" on public.infobooks;
create policy "infobooks: staff read all"
  on public.infobooks for select to authenticated
  using (app.can_manage_content() or status = 'published');

drop policy if exists "infobooks: staff manage" on public.infobooks;
create policy "infobooks: staff manage"
  on public.infobooks for all to authenticated
  using (app.can_manage_content()) with check (app.can_manage_content());

drop policy if exists "landing_pages: staff read all" on public.landing_pages;
create policy "landing_pages: staff read all"
  on public.landing_pages for select to authenticated
  using (app.can_manage_content() or status = 'published');

drop policy if exists "landing_pages: staff manage" on public.landing_pages;
create policy "landing_pages: staff manage"
  on public.landing_pages for all to authenticated
  using (app.can_manage_content()) with check (app.can_manage_content());

drop policy if exists "faqs: staff manage" on public.faqs;
create policy "faqs: staff manage"
  on public.faqs for all to authenticated
  using (app.can_manage_content()) with check (app.can_manage_content());

drop policy if exists "testimonials: admin manage" on public.testimonials;
create policy "testimonials: admin manage"
  on public.testimonials for all to authenticated
  using (app.can_manage_site()) with check (app.can_manage_site());

-- Configurações e páginas
drop policy if exists "site_settings: staff read" on public.site_settings;
create policy "site_settings: staff read"
  on public.site_settings for select to authenticated
  using (
    app.is_admin()
    or (app.is_staff() and key !~ '^private_')
    or (app.is_developer() and key !~ '^private_')
  );

drop policy if exists "site_settings: admin manage" on public.site_settings;
create policy "site_settings: admin manage"
  on public.site_settings for all to authenticated
  using (app.can_manage_site()) with check (app.can_manage_site());

drop policy if exists "site_pages: staff read" on public.site_pages;
create policy "site_pages: staff read"
  on public.site_pages for select to authenticated
  using (app.can_manage_content() or is_published);

drop policy if exists "site_pages: admin manage" on public.site_pages;
create policy "site_pages: admin manage"
  on public.site_pages for all to authenticated
  using (app.can_manage_site()) with check (app.can_manage_site());

-- Catálogo e disponibilidade (sem dados clínicos)
drop policy if exists "services: admin manage" on public.services;
create policy "services: admin manage"
  on public.services for all to authenticated
  using (app.can_manage_site()) with check (app.can_manage_site());

drop policy if exists "products: admin manage" on public.products;
create policy "products: admin manage"
  on public.products for all to authenticated
  using (app.can_manage_site()) with check (app.can_manage_site());

drop policy if exists "availability: admin manage" on public.availability_rules;
create policy "availability: admin manage"
  on public.availability_rules for all to authenticated
  using (app.can_manage_site()) with check (app.can_manage_site());

drop policy if exists "availability exceptions: admin manage" on public.availability_exceptions;
create policy "availability exceptions: admin manage"
  on public.availability_exceptions for all to authenticated
  using (app.can_manage_site()) with check (app.can_manage_site());

-- Auditoria técnica (sem valores financeiros na UI — RLS de payments permanece is_admin)
drop policy if exists "audit_logs: admin read" on public.audit_logs;
create policy "audit_logs: admin read"
  on public.audit_logs for select to authenticated
  using (app.can_manage_site());

-- Storage: assets públicos do site
drop policy if exists "admins manage public assets" on storage.objects;
create policy "admins manage public assets"
  on storage.objects for all to authenticated
  using (bucket_id = 'public-assets' and app.can_manage_site())
  with check (bucket_id = 'public-assets' and app.can_manage_site());

-- Notificações operacionais (contato/agendamento — sem prontuário)
drop policy if exists "contact_messages: staff read" on public.contact_messages;
create policy "contact_messages: staff read"
  on public.contact_messages for select to authenticated
  using (app.can_manage_site() or app.is_staff());

drop policy if exists "contact_messages: staff update" on public.contact_messages;
create policy "contact_messages: staff update"
  on public.contact_messages for update to authenticated
  using (app.can_manage_site() or app.is_staff())
  with check (app.can_manage_site() or app.is_staff());
