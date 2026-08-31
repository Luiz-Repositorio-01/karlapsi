-- =============================================================================
-- supabase/seed/demo.sql — Dados de DEMONSTRAÇÃO (opcional)
--
-- Executar apenas em ambiente de desenvolvimento/homologação:
--   psql "$DATABASE_URL" -f supabase/seed/demo.sql
--
-- Todos os registros são fictícios e marcados com `is_demo = true` / prefixo
-- "[DEMO]", o que permite removê-los com um único comando (ver final do
-- arquivo). NUNCA rodar em produção com dados reais de pacientes.
-- =============================================================================

begin;

insert into public.patients (full_name, email, phone, birth_date, admin_notes, is_demo, tags)
values
  ('[DEMO] Paciente Demonstração', 'demo.paciente@example.com', '11999990000', date '1995-04-12',
   'Registro fictício criado pelo seed de demonstração.', true, array['demo']),
  ('[DEMO] Criança Demonstração', 'demo.responsavel@example.com', '11999990001', date '2015-09-03',
   'Registro fictício com responsável, para testar o fluxo de dependentes.', true, array['demo'])
on conflict do nothing;

update public.patients
set guardian_name = '[DEMO] Responsável Demonstração',
    guardian_phone = '11999990001',
    guardian_relationship = 'Mãe'
where full_name = '[DEMO] Criança Demonstração';

-- Agendamento de demonstração: amanhã, 10h no fuso do consultório.
insert into public.appointments (patient_id, service_id, starts_at, ends_at, status, origin, admin_notes, is_demo)
select
  p.id,
  s.id,
  ((current_date + 1)::timestamp + time '10:00') at time zone coalesce(
    (select value #>> '{timezone}' from public.site_settings where key = 'booking'), 'America/Sao_Paulo'
  ),
  ((current_date + 1)::timestamp + time '11:00') at time zone coalesce(
    (select value #>> '{timezone}' from public.site_settings where key = 'booking'), 'America/Sao_Paulo'
  ),
  'confirmed',
  'admin',
  '[DEMO] Agendamento fictício do seed.',
  true
from public.patients p
cross join public.services s
where p.full_name = '[DEMO] Paciente Demonstração'
  and s.slug = 'avaliacao-neuropsicologica'
on conflict do nothing;

insert into public.payments (patient_id, description, amount_cents, status, method, due_date, is_demo)
select p.id, '[DEMO] Cobrança de demonstração', 35000, 'pending', 'pix', current_date + 7, true
from public.patients p
where p.full_name = '[DEMO] Paciente Demonstração'
on conflict do nothing;

insert into public.products (name, slug, type, summary, price_cents, is_free, is_active, benefits)
values (
  '[DEMO] Material de demonstração',
  'demo-material-demonstracao',
  'material',
  'Produto fictício usado apenas para testar o fluxo de checkout em ambiente de desenvolvimento.',
  1990,
  false,
  true,
  array['Fluxo de checkout de teste', 'Não representa um material real']
)
on conflict (slug) do nothing;

commit;

-- =============================================================================
-- REMOÇÃO DOS DADOS DE DEMONSTRAÇÃO
-- =============================================================================
-- begin;
--   delete from public.payments where is_demo;
--   delete from public.appointments where is_demo;
--   delete from public.patients where is_demo;
--   delete from public.products where slug like 'demo-%';
-- commit;
