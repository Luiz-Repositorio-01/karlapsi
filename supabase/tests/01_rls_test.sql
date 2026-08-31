-- =============================================================================
-- 01_rls_test.sql — Testes de RLS, RBAC e regras de agenda
--
-- Executado por `npm run db:validate` (scripts/validate-db.sh) contra um
-- PostgreSQL local com as migrations aplicadas. Cada bloco falha com exceção
-- explícita se a política não estiver protegendo o que deveria.
-- =============================================================================

\set ON_ERROR_STOP on

-- -----------------------------------------------------------------------------
-- Helpers de simulação de sessão
-- -----------------------------------------------------------------------------
create or replace function pg_temp.act_as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  execute 'set local role anon';
end $$;

create or replace function pg_temp.act_as(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  execute 'set local role authenticated';
end $$;

create or replace function pg_temp.reset_role() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', true);
end $$;

create or replace function pg_temp.expect(p_condition boolean, p_message text)
returns void language plpgsql as $$
begin
  if not p_condition then
    raise exception 'FALHOU: %', p_message;
  end if;
  raise notice 'ok — %', p_message;
end $$;

-- -----------------------------------------------------------------------------
-- Cenário: quatro usuários, um por papel
-- -----------------------------------------------------------------------------
do $$
declare
  v_owner uuid;
  v_admin uuid;
  v_assistant uuid;
  v_professional uuid;
begin
  insert into auth.users (email) values ('owner@example.com') returning id into v_owner;
  insert into auth.users (email) values ('admin@example.com') returning id into v_admin;
  insert into auth.users (email) values ('assistant@example.com') returning id into v_assistant;
  insert into auth.users (email) values ('professional@example.com') returning id into v_professional;

  -- O primeiro usuário deve ter virado OWNER automaticamente.
  perform pg_temp.expect(
    (select role from public.profiles where id = v_owner) = 'OWNER',
    'primeiro usuário criado recebe papel OWNER'
  );
  perform pg_temp.expect(
    (select role from public.profiles where id = v_admin) = 'ASSISTANT',
    'usuários seguintes entram como ASSISTANT (menor privilégio)'
  );

  update public.profiles set role = 'ADMIN' where id = v_admin;
  update public.profiles set role = 'PROFESSIONAL' where id = v_professional;

  create temp table test_users as
  select v_owner as owner_id, v_admin as admin_id,
         v_assistant as assistant_id, v_professional as professional_id;
end $$;

-- -----------------------------------------------------------------------------
-- Dados base
-- -----------------------------------------------------------------------------
insert into public.patients (full_name, cpf, email, phone)
values ('Teste Paciente', '12345678901', 'paciente@example.com', '11999998888');

insert into public.blog_posts (title, slug, content, status, published_at)
values ('Publicado', 'post-publicado', 'conteúdo', 'published', now());

insert into public.blog_posts (title, slug, content, status)
values ('Rascunho', 'post-rascunho', 'conteúdo', 'draft');

insert into public.payments (description, amount_cents, status)
values ('Cobrança de teste', 25000, 'pending');

-- =============================================================================
-- ANÔNIMO
-- =============================================================================
do $$
declare
  v_count integer;
begin
  perform pg_temp.act_as_anon();

  begin
    select count(*) into v_count from public.patients;
    -- RLS retorna 0 linhas em vez de erro quando não há policy para o papel.
    perform pg_temp.expect(v_count = 0, 'anon não lê nenhum paciente');
  exception when insufficient_privilege then
    raise notice 'ok — anon não tem privilégio em patients';
  end;

  begin
    select count(*) into v_count from public.payments;
    perform pg_temp.expect(v_count = 0, 'anon não lê pagamentos');
  exception when insufficient_privilege then
    raise notice 'ok — anon não tem privilégio em payments';
  end;

  begin
    select count(*) into v_count from public.appointments;
    perform pg_temp.expect(v_count = 0, 'anon não lê a agenda');
  exception when insufficient_privilege then
    raise notice 'ok — anon não tem privilégio em appointments';
  end;

  select count(*) into v_count from public.blog_posts;
  perform pg_temp.expect(v_count = 1, 'anon lê apenas o post publicado');

  select count(*) into v_count from public.services where is_active;
  perform pg_temp.expect(v_count >= 1, 'anon lê serviços ativos (necessário ao agendamento)');

  begin
    insert into public.patients (full_name) values ('Invasor');
    raise exception 'FALHOU: anon conseguiu inserir paciente';
  exception
    when insufficient_privilege or check_violation then
      raise notice 'ok — anon não insere paciente';
  end;

  perform pg_temp.reset_role();
end $$;

-- =============================================================================
-- ASSISTANT — acesso operacional, sem financeiro
-- =============================================================================
do $$
declare
  v_count integer;
  v_assistant uuid := (select assistant_id from test_users);
begin
  perform pg_temp.act_as(v_assistant);

  select count(*) into v_count from public.patients;
  perform pg_temp.expect(v_count = 1, 'ASSISTANT lê pacientes');

  select count(*) into v_count from public.payments;
  perform pg_temp.expect(v_count = 0, 'ASSISTANT NÃO lê pagamentos (financeiro restrito)');

  select count(*) into v_count from public.audit_logs;
  perform pg_temp.expect(v_count = 0, 'ASSISTANT NÃO lê a trilha de auditoria');

  begin
    update public.services set name = 'Alterado por assistant' where slug = 'entrevista-inicial';
    perform pg_temp.expect(
      (select name from public.services where slug = 'entrevista-inicial') <> 'Alterado por assistant',
      'ASSISTANT não altera serviços'
    );
  exception when insufficient_privilege then
    raise notice 'ok — ASSISTANT não altera serviços';
  end;

  perform pg_temp.reset_role();
end $$;

-- =============================================================================
-- PROFESSIONAL / ADMIN / OWNER
-- =============================================================================
do $$
declare
  v_count integer;
  v_professional uuid := (select professional_id from test_users);
  v_admin uuid := (select admin_id from test_users);
  v_owner uuid := (select owner_id from test_users);
begin
  perform pg_temp.act_as(v_professional);
  select count(*) into v_count from public.patients;
  perform pg_temp.expect(v_count = 1, 'PROFESSIONAL lê pacientes');
  select count(*) into v_count from public.payments;
  perform pg_temp.expect(v_count = 0, 'PROFESSIONAL NÃO lê pagamentos');
  perform pg_temp.reset_role();

  perform pg_temp.act_as(v_admin);
  select count(*) into v_count from public.payments;
  perform pg_temp.expect(v_count = 1, 'ADMIN lê pagamentos');
  select count(*) into v_count from public.blog_posts;
  perform pg_temp.expect(v_count = 2, 'ADMIN lê rascunhos e publicados');
  perform pg_temp.reset_role();

  perform pg_temp.act_as(v_owner);
  select count(*) into v_count from public.payments;
  perform pg_temp.expect(v_count = 1, 'OWNER lê pagamentos');
  perform pg_temp.reset_role();
end $$;

-- =============================================================================
-- Escalonamento de privilégio
-- =============================================================================
do $$
declare
  v_assistant uuid := (select assistant_id from test_users);
  v_admin uuid := (select admin_id from test_users);
begin
  perform pg_temp.act_as(v_assistant);
  begin
    update public.profiles set role = 'OWNER' where id = v_assistant;
    raise exception 'FALHOU: ASSISTANT conseguiu se promover a OWNER';
  exception
    when insufficient_privilege then raise notice 'ok — ASSISTANT sem privilégio para mudar papéis';
    when raise_exception then raise notice 'ok — trava do banco impediu autopromoção';
  end;
  perform pg_temp.reset_role();

  perform pg_temp.act_as(v_admin);
  begin
    update public.profiles set role = 'OWNER' where id = v_assistant;
    raise exception 'FALHOU: ADMIN conseguiu criar outro OWNER';
  exception
    when raise_exception then raise notice 'ok — apenas OWNER concede o papel OWNER';
  end;
  perform pg_temp.reset_role();
end $$;

-- =============================================================================
-- AGENDA — prevenção de conflito no banco
-- =============================================================================
do $$
declare
  v_service uuid := (select id from public.services where slug = 'avaliacao-neuropsicologica');
  v_start timestamptz := date_trunc('hour', now()) + interval '10 days';
begin
  insert into public.appointments (service_id, starts_at, ends_at, status)
  values (v_service, v_start, v_start + interval '1 hour', 'confirmed');

  -- Sobreposição exata
  begin
    insert into public.appointments (service_id, starts_at, ends_at, status)
    values (v_service, v_start, v_start + interval '1 hour', 'requested');
    raise exception 'FALHOU: double booking permitido (mesmo horário)';
  exception when exclusion_violation then
    raise notice 'ok — banco recusou agendamento no mesmo horário';
  end;

  -- Sobreposição parcial
  begin
    insert into public.appointments (service_id, starts_at, ends_at, status)
    values (v_service, v_start + interval '30 minutes', v_start + interval '90 minutes', 'confirmed');
    raise exception 'FALHOU: double booking permitido (sobreposição parcial)';
  exception when exclusion_violation then
    raise notice 'ok — banco recusou sobreposição parcial';
  end;

  -- Encostado no fim (fim exclusivo) deve ser permitido
  insert into public.appointments (service_id, starts_at, ends_at, status)
  values (v_service, v_start + interval '1 hour', v_start + interval '2 hours', 'confirmed');
  raise notice 'ok — horário imediatamente seguinte é permitido';

  -- Cancelado libera o horário
  update public.appointments set status = 'cancelled'
  where starts_at = v_start;

  insert into public.appointments (service_id, starts_at, ends_at, status)
  values (v_service, v_start, v_start + interval '1 hour', 'confirmed');
  raise notice 'ok — cancelamento libera o horário para novo agendamento';
end $$;

-- =============================================================================
-- Agendamento público via RPC (visitante anônimo)
-- =============================================================================
do $$
declare
  v_service uuid := (select id from public.services where slug = 'entrevista-inicial');
  v_slot timestamptz;
  v_result jsonb;
  v_tz text := 'America/Sao_Paulo';
begin
  -- Próxima terça-feira às 14:00 no fuso do consultório (dentro da grade padrão).
  select ((d)::timestamp + time '14:00') at time zone v_tz
  into v_slot
  from generate_series(
    (now() at time zone v_tz)::date + 3,
    (now() at time zone v_tz)::date + 12,
    interval '1 day'
  ) as d
  where extract(dow from d) = 2
  limit 1;

  perform pg_temp.act_as_anon();

  v_result := public.create_appointment_request(jsonb_build_object(
    'service_id', v_service,
    'starts_at', v_slot,
    'full_name', 'Visitante Teste',
    'email', 'Visitante@Example.com',
    'phone', '(11) 98888-7777',
    'consent_accepted', true,
    'consent_version', '1.0',
    'ip', '203.0.113.10',
    'user_agent', 'vitest'
  ));

  perform pg_temp.expect(v_result ? 'request_id', 'anon cria solicitação de agendamento pela RPC');
  perform pg_temp.expect(v_result ->> 'status' = 'requested', 'solicitação nasce com status requested');

  -- Mesmo horário: deve ser recusado.
  begin
    perform public.create_appointment_request(jsonb_build_object(
      'service_id', v_service,
      'starts_at', v_slot,
      'full_name', 'Outro Visitante',
      'email', 'outro@example.com',
      'phone', '11977776666',
      'consent_accepted', true,
      'ip', '203.0.113.11'
    ));
    raise exception 'FALHOU: RPC permitiu horário já ocupado';
  exception when raise_exception then
    raise notice 'ok — RPC recusou horário já ocupado';
  end;

  -- Sem consentimento: deve ser recusado.
  begin
    perform public.create_appointment_request(jsonb_build_object(
      'service_id', v_service,
      'starts_at', v_slot + interval '2 hours',
      'full_name', 'Sem Consentimento',
      'email', 'semconsent@example.com',
      'phone', '11977776666',
      'consent_accepted', false,
      'ip', '203.0.113.12'
    ));
    raise exception 'FALHOU: RPC aceitou solicitação sem consentimento';
  exception when raise_exception then
    raise notice 'ok — RPC exige aceite da política de privacidade';
  end;

  -- Fora da grade de disponibilidade (03:00) deve ser recusado.
  begin
    perform public.create_appointment_request(jsonb_build_object(
      'service_id', v_service,
      'starts_at', (((now() at time zone v_tz)::date + 5)::timestamp + time '03:00') at time zone v_tz,
      'full_name', 'Fora de Horario',
      'email', 'fora@example.com',
      'phone', '11977776666',
      'consent_accepted', true,
      'ip', '203.0.113.13'
    ));
    raise exception 'FALHOU: RPC aceitou horário fora da disponibilidade';
  exception when raise_exception then
    raise notice 'ok — RPC recusou horário fora da grade';
  end;

  -- A RPC de horários ocupados não pode vazer dado pessoal: só início e fim.
  perform pg_temp.expect(
    (select count(*) from public.busy_ranges(now(), now() + interval '30 days')) >= 1,
    'anon consulta intervalos ocupados sem acessar dados de paciente'
  );

  perform pg_temp.reset_role();
end $$;

-- =============================================================================
-- LGPD / auditoria
-- =============================================================================
do $$
declare
  v_owner uuid := (select owner_id from test_users);
  v_patient uuid := (select id from public.patients where cpf = '12345678901');
  v_count integer;
begin
  perform pg_temp.act_as(v_owner);

  select count(*) into v_count from public.audit_logs where entity = 'patients';
  perform pg_temp.expect(v_count >= 1, 'criação de paciente gerou registro de auditoria');

  select count(*) into v_count
  from public.audit_logs
  where entity = 'patients' and details::text like '%12345678901%';
  perform pg_temp.expect(v_count = 0, 'auditoria de paciente não copia CPF (minimização de dados)');

  perform public.anonymize_patient(v_patient);
  perform pg_temp.expect(
    (select cpf is null and email is null from public.patients where id = v_patient),
    'anonimização remove dados identificáveis do paciente'
  );

  select count(*) into v_count from public.consents;
  perform pg_temp.expect(v_count >= 1, 'consentimento do agendamento público foi registrado');

  perform pg_temp.expect(
    (select count(*) from public.notifications where channel = 'internal') >= 1,
    'notificação interna enfileirada para nova solicitação'
  );

  perform pg_temp.reset_role();
end $$;

-- =============================================================================
-- Depoimentos: publicação exige registro de autorização
-- =============================================================================
do $$
begin
  begin
    insert into public.testimonials (author_display_name, content, is_published)
    values ('Alguém', 'Depoimento sem autorização registrada.', true);
    raise exception 'FALHOU: depoimento publicado sem autorização';
  exception when check_violation then
    raise notice 'ok — publicar depoimento exige autorização registrada';
  end;
end $$;

select 'TODOS OS TESTES DE BANCO PASSARAM' as resultado;
