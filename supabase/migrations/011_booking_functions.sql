-- =============================================================================
-- 011_booking_functions.sql — Escrita pública controlada (SECURITY DEFINER)
--
-- O visitante anônimo NÃO tem permissão de INSERT em nenhuma tabela. Toda
-- escrita vinda do site público passa por estas funções, que validam serviço,
-- janela de agendamento, disponibilidade, consentimento e rate limiting.
-- A prevenção de conflito final é da exclusion constraint em `appointments`.
-- =============================================================================

create or replace function app.clinic_timezone()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select value #>> '{timezone}' from public.site_settings where key = 'booking'),
    'America/Sao_Paulo'
  );
$$;

create or replace function app.booking_setting(p_path text[], p_default numeric)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select (value #>> p_path)::numeric from public.site_settings where key = 'booking'),
    p_default
  );
$$;

-- -----------------------------------------------------------------------------
-- Intervalos ocupados (agenda + bloqueios)
--
-- Retorna apenas início e fim. Nenhum dado de paciente é exposto — é o que o
-- site público precisa para esconder horários indisponíveis.
-- -----------------------------------------------------------------------------
create or replace function public.busy_ranges(p_from timestamptz, p_to timestamptz)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select a.starts_at, a.ends_at
  from public.appointments a
  where a.status in ('requested', 'confirmed', 'awaiting_payment', 'paid', 'completed')
    and a.starts_at < p_to
    and a.ends_at > p_from
  union all
  select b.starts_at, b.ends_at
  from public.blocked_times b
  where b.starts_at < p_to and b.ends_at > p_from;
$$;

revoke all on function public.busy_ranges(timestamptz, timestamptz) from public;
grant execute on function public.busy_ranges(timestamptz, timestamptz) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- O horário pedido cabe na grade de disponibilidade?
-- -----------------------------------------------------------------------------
create or replace function app.slot_within_availability(
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz text := app.clinic_timezone();
  v_local_start timestamp := p_starts_at at time zone v_tz;
  v_local_end timestamp := p_ends_at at time zone v_tz;
  v_date date := v_local_start::date;
  v_start_time time := v_local_start::time;
  v_end_time time := v_local_end::time;
  v_exception public.availability_exceptions;
begin
  -- Atendimento não pode atravessar a virada do dia.
  if v_local_end::date <> v_date then
    return false;
  end if;

  select * into v_exception
  from public.availability_exceptions
  where exception_date = v_date
  order by professional_id nulls last
  limit 1;

  if v_exception.id is not null then
    if not v_exception.is_available then
      return false;
    end if;
    return v_start_time >= v_exception.start_time and v_end_time <= v_exception.end_time;
  end if;

  return exists (
    select 1
    from public.availability_rules r
    where r.is_active
      and r.weekday = extract(dow from v_date)::smallint
      and v_start_time >= r.start_time
      and v_end_time <= r.end_time
      and (
        r.break_start_time is null
        or v_end_time <= r.break_start_time
        or v_start_time >= r.break_end_time
      )
      -- O início precisa estar alinhado à grade de intervalos da regra.
      and mod(
        extract(epoch from (v_start_time - r.start_time))::integer,
        r.slot_interval_minutes * 60
      ) = 0
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Solicitação pública de agendamento (atômica)
-- -----------------------------------------------------------------------------
create or replace function public.create_appointment_request(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_service public.services;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_email text;
  v_phone text;
  v_name text;
  v_ip_hash text;
  v_appointment_id uuid;
  v_request_id uuid;
  v_min_lead_hours numeric := app.booking_setting(array['min_lead_hours'], 12);
  v_max_days numeric := app.booking_setting(array['max_advance_days'], 90);
  v_recent_count integer;
begin
  -- ---------------------------------------------------------------- validação
  if coalesce((payload ->> 'consent_accepted')::boolean, false) is not true then
    raise exception 'CONSENT_REQUIRED' using hint = 'É necessário aceitar a política de privacidade.';
  end if;

  v_name := nullif(trim(payload ->> 'full_name'), '');
  v_email := lower(nullif(trim(payload ->> 'email'), ''));
  v_phone := nullif(regexp_replace(coalesce(payload ->> 'phone', ''), '\D', '', 'g'), '');

  if v_name is null or char_length(v_name) < 2 then
    raise exception 'INVALID_NAME';
  end if;
  if v_email is null or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'INVALID_EMAIL';
  end if;
  if v_phone is null or char_length(v_phone) < 10 then
    raise exception 'INVALID_PHONE';
  end if;

  select * into v_service
  from public.services
  where id = (payload ->> 'service_id')::uuid;

  if v_service.id is null or not v_service.is_active or not v_service.allows_online_booking then
    raise exception 'SERVICE_UNAVAILABLE';
  end if;

  v_starts_at := (payload ->> 'starts_at')::timestamptz;
  if v_starts_at is null then
    raise exception 'INVALID_SLOT';
  end if;
  -- Os horários sempre caem em minutos exatos da grade.
  if extract(second from v_starts_at) <> 0 then
    v_starts_at := date_trunc('minute', v_starts_at);
  end if;
  v_ends_at := v_starts_at + make_interval(mins => v_service.duration_minutes);

  if v_starts_at < now() + make_interval(mins => (v_min_lead_hours * 60)::integer) then
    raise exception 'SLOT_TOO_SOON';
  end if;
  if v_starts_at > now() + make_interval(days => v_max_days::integer) then
    raise exception 'SLOT_TOO_FAR';
  end if;
  if not app.slot_within_availability(v_starts_at, v_ends_at) then
    raise exception 'SLOT_OUTSIDE_AVAILABILITY';
  end if;

  -- ------------------------------------------------------------ rate limiting
  v_ip_hash := app.hash_ip(payload ->> 'ip');

  select count(*) into v_recent_count
  from public.appointment_requests
  where created_at > now() - interval '1 hour'
    and (email = v_email or (v_ip_hash is not null and ip_hash = v_ip_hash));

  if v_recent_count >= 5 then
    raise exception 'RATE_LIMITED';
  end if;

  -- -------------------------------------------------------------- persistência
  begin
    insert into public.appointments (
      service_id, starts_at, ends_at, status, origin, price_cents,
      contact_name, contact_email, contact_phone, patient_notes
    )
    values (
      v_service.id, v_starts_at, v_ends_at, 'requested', 'public_site', v_service.price_cents,
      v_name, v_email, v_phone, nullif(trim(payload ->> 'message'), '')
    )
    returning id into v_appointment_id;
  exception
    when exclusion_violation then
      raise exception 'SLOT_TAKEN' using hint = 'Este horário acabou de ser reservado.';
  end;

  insert into public.appointment_requests (
    appointment_id, service_id, requested_start, full_name, email, phone, birth_date,
    is_for_dependent, dependent_name, message, consent_accepted, consent_version,
    ip_hash, user_agent
  )
  values (
    v_appointment_id, v_service.id, v_starts_at, v_name, v_email, v_phone,
    nullif(payload ->> 'birth_date', '')::date,
    coalesce((payload ->> 'is_for_dependent')::boolean, false),
    nullif(trim(payload ->> 'dependent_name'), ''),
    nullif(trim(payload ->> 'message'), ''),
    true,
    coalesce(nullif(payload ->> 'consent_version', ''), '1.0'),
    v_ip_hash,
    left(coalesce(payload ->> 'user_agent', ''), 400)
  )
  returning id into v_request_id;

  -- Prova do consentimento (LGPD).
  insert into public.consents (
    subject_email, subject_name, consent_type, granted, policy_version, source, ip_hash, user_agent
  )
  values (
    v_email, v_name, 'appointment_terms', true,
    coalesce(nullif(payload ->> 'consent_version', ''), '1.0'),
    'public_site', v_ip_hash, left(coalesce(payload ->> 'user_agent', ''), 400)
  );

  -- Fila de notificações (entrega feita pelos adaptadores da aplicação).
  insert into public.notifications (channel, template, recipient, subject, payload, related_table, related_id)
  values
    ('internal', 'appointment_request_received', null, 'Nova solicitação de agendamento',
     jsonb_build_object('service', v_service.name, 'starts_at', v_starts_at, 'name', v_name),
     'appointment_requests', v_request_id),
    ('email', 'appointment_request_received_patient', v_email::text, 'Recebemos sua solicitação',
     jsonb_build_object('service', v_service.name, 'starts_at', v_starts_at, 'name', v_name),
     'appointment_requests', v_request_id);

  insert into public.audit_logs (action, entity, entity_id, details, ip_hash)
  values ('create', 'appointment_requests', v_request_id::text,
          jsonb_build_object('origin', 'public_site', 'service', v_service.name), v_ip_hash);

  return jsonb_build_object(
    'request_id', v_request_id,
    'appointment_id', v_appointment_id,
    'starts_at', v_starts_at,
    'ends_at', v_ends_at,
    'status', 'requested',
    'service_name', v_service.name,
    'duration_minutes', v_service.duration_minutes
  );
end;
$$;

revoke all on function public.create_appointment_request(jsonb) from public;
grant execute on function public.create_appointment_request(jsonb) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Mensagem de contato
-- -----------------------------------------------------------------------------
create or replace function public.submit_contact_message(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_ip_hash text := app.hash_ip(payload ->> 'ip');
  v_email text := lower(nullif(trim(payload ->> 'email'), ''));
  v_recent integer;
begin
  if v_email is null or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'INVALID_EMAIL';
  end if;

  select count(*) into v_recent
  from public.contact_messages
  where created_at > now() - interval '1 hour'
    and (email = v_email or (v_ip_hash is not null and ip_hash = v_ip_hash));

  if v_recent >= 5 then
    raise exception 'RATE_LIMITED';
  end if;

  insert into public.contact_messages (
    name, email, phone, subject, message, consent_accepted, ip_hash, user_agent
  )
  values (
    nullif(trim(payload ->> 'name'), ''),
    v_email,
    nullif(regexp_replace(coalesce(payload ->> 'phone', ''), '\D', '', 'g'), ''),
    nullif(trim(payload ->> 'subject'), ''),
    trim(payload ->> 'message'),
    coalesce((payload ->> 'consent_accepted')::boolean, false),
    v_ip_hash,
    left(coalesce(payload ->> 'user_agent', ''), 400)
  )
  returning id into v_id;

  insert into public.consents (subject_email, subject_name, consent_type, granted, policy_version, source, ip_hash)
  values (v_email, nullif(trim(payload ->> 'name'), ''), 'privacy_policy', true,
          coalesce(nullif(payload ->> 'consent_version', ''), '1.0'), 'contact_form', v_ip_hash);

  insert into public.notifications (channel, template, subject, payload, related_table, related_id)
  values ('internal', 'contact_message_received', 'Nova mensagem de contato',
          jsonb_build_object('name', payload ->> 'name', 'email', v_email), 'contact_messages', v_id);

  return v_id;
end;
$$;

revoke all on function public.submit_contact_message(jsonb) from public;
grant execute on function public.submit_contact_message(jsonb) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Solicitação de direitos do titular (LGPD art. 18) pelo site
-- -----------------------------------------------------------------------------
create or replace function public.submit_data_subject_request(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if coalesce(payload ->> 'request_type', '') not in
     ('access', 'rectification', 'deletion', 'portability', 'revoke_consent') then
    raise exception 'INVALID_REQUEST_TYPE';
  end if;

  insert into public.data_subject_requests (
    requester_name, requester_email, request_type, details, ip_hash
  )
  values (
    nullif(trim(payload ->> 'requester_name'), ''),
    lower(nullif(trim(payload ->> 'requester_email'), '')),
    payload ->> 'request_type',
    nullif(trim(payload ->> 'details'), ''),
    app.hash_ip(payload ->> 'ip')
  )
  returning id into v_id;

  insert into public.notifications (channel, template, subject, payload, related_table, related_id)
  values ('internal', 'data_subject_request_received', 'Nova solicitação LGPD',
          jsonb_build_object('type', payload ->> 'request_type'), 'data_subject_requests', v_id);

  return v_id;
end;
$$;

revoke all on function public.submit_data_subject_request(jsonb) from public;
grant execute on function public.submit_data_subject_request(jsonb) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Reagendamento atômico (equipe)
-- -----------------------------------------------------------------------------
create or replace function public.reschedule_appointment(
  p_appointment_id uuid,
  p_starts_at timestamptz,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.appointments;
  v_duration integer;
  v_new_id uuid;
begin
  if not app.is_staff() then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_old from public.appointments where id = p_appointment_id;
  if v_old.id is null then
    raise exception 'APPOINTMENT_NOT_FOUND';
  end if;

  v_duration := ceil(extract(epoch from (v_old.ends_at - v_old.starts_at)) / 60)::integer;

  -- Libera o horário antigo antes de reservar o novo (evita autoconflito).
  update public.appointments
  set status = 'rescheduled',
      cancellation_reason = coalesce(p_reason, 'Reagendado')
  where id = p_appointment_id;

  begin
    insert into public.appointments (
      patient_id, service_id, professional_id, starts_at, ends_at, status, origin,
      price_cents, payment_method, contact_name, contact_email, contact_phone,
      patient_notes, admin_notes, rescheduled_from, created_by, is_demo
    )
    values (
      v_old.patient_id, v_old.service_id, v_old.professional_id,
      p_starts_at, p_starts_at + make_interval(mins => v_duration),
      case when v_old.status = 'requested' then 'requested' else 'confirmed' end,
      v_old.origin, v_old.price_cents, v_old.payment_method,
      v_old.contact_name, v_old.contact_email, v_old.contact_phone,
      v_old.patient_notes, v_old.admin_notes, v_old.id, auth.uid(), v_old.is_demo
    )
    returning id into v_new_id;
  exception
    when exclusion_violation then
      raise exception 'SLOT_TAKEN';
  end;

  insert into public.notifications (channel, template, recipient, subject, payload, related_table, related_id)
  values ('email', 'appointment_rescheduled', v_old.contact_email::text, 'Seu atendimento foi reagendado',
          jsonb_build_object('from', v_old.starts_at, 'to', p_starts_at), 'appointments', v_new_id);

  return v_new_id;
end;
$$;

revoke all on function public.reschedule_appointment(uuid, timestamptz, text) from public, anon;
grant execute on function public.reschedule_appointment(uuid, timestamptz, text) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Métricas do dashboard (uma consulta, sem expor dado pessoal)
-- -----------------------------------------------------------------------------
create or replace function public.dashboard_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz text := app.clinic_timezone();
  v_today date := (now() at time zone v_tz)::date;
  v_is_admin boolean := app.is_admin();
begin
  if not app.is_staff() then
    raise exception 'FORBIDDEN';
  end if;

  return jsonb_build_object(
    'appointments_today', (
      select count(*) from public.appointments
      where (starts_at at time zone v_tz)::date = v_today
        and status in ('confirmed', 'awaiting_payment', 'paid', 'completed')
    ),
    'upcoming_appointments', (
      select count(*) from public.appointments
      where starts_at > now() and status in ('confirmed', 'awaiting_payment', 'paid')
    ),
    'pending_requests', (
      select count(*) from public.appointments
      where status = 'requested' and starts_at > now()
    ),
    'active_patients', (
      select count(*) from public.patients where archived_at is null and not is_demo
    ),
    'revenue_month_cents', case when v_is_admin then (
      select coalesce(sum(amount_cents), 0) from public.payments
      where status in ('approved', 'authorized')
        and (paid_at at time zone v_tz)::date >= date_trunc('month', v_today)::date
    ) else null end,
    'pending_payments_cents', case when v_is_admin then (
      select coalesce(sum(amount_cents), 0) from public.payments
      where status in ('pending', 'in_process')
    ) else null end,
    'published_posts', (
      select count(*) from public.blog_posts where status = 'published'
    ),
    'unread_notifications', (
      select count(*) from public.notifications where channel = 'internal' and read_at is null
    )
  );
end;
$$;

revoke all on function public.dashboard_metrics() from public, anon;
grant execute on function public.dashboard_metrics() to authenticated, service_role;
