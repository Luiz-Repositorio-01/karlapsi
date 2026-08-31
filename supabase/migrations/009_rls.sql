-- =============================================================================
-- 009_rls.sql — Row Level Security
--
-- PRINCÍPIOS
-- 1. RLS habilitado em TODAS as tabelas do schema public.
-- 2. `anon` só lê conteúdo institucional publicado. Nunca dados pessoais.
-- 3. Estar autenticado NÃO dá acesso a nada: é preciso ter um profile ativo
--    com papel (`app.is_staff()`), e a escrita é filtrada por papel.
-- 4. Escrita pública acontece exclusivamente por funções SECURITY DEFINER
--    (011_booking_functions.sql), que validam as regras de negócio.
-- =============================================================================

-- Nenhum privilégio implícito de tabela para os papéis de API.
revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;

alter table public.profiles                enable row level security;
alter table public.patients                enable row level security;
alter table public.patient_contacts        enable row level security;
alter table public.consents                enable row level security;
alter table public.data_subject_requests   enable row level security;
alter table public.services                enable row level security;
alter table public.availability_rules      enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.appointments            enable row level security;
alter table public.blocked_times           enable row level security;
alter table public.appointment_requests    enable row level security;
alter table public.contact_messages        enable row level security;
alter table public.products                enable row level security;
alter table public.orders                  enable row level security;
alter table public.order_items             enable row level security;
alter table public.payments                enable row level security;
alter table public.payment_events          enable row level security;
alter table public.blog_categories         enable row level security;
alter table public.blog_posts              enable row level security;
alter table public.infobooks               enable row level security;
alter table public.landing_pages           enable row level security;
alter table public.faqs                    enable row level security;
alter table public.testimonials            enable row level security;
alter table public.site_settings           enable row level security;
alter table public.site_pages              enable row level security;
alter table public.documents               enable row level security;
alter table public.notifications           enable row level security;

-- Força RLS também para o dono das tabelas (defesa extra em migrações).
alter table public.patients  force row level security;
alter table public.payments  force row level security;
alter table public.documents force row level security;

-- =============================================================================
-- PROFILES
-- =============================================================================
grant select, insert, update on public.profiles to authenticated;

drop policy if exists "profiles: staff read" on public.profiles;
create policy "profiles: staff read"
  on public.profiles for select to authenticated
  using (id = auth.uid() or app.is_staff());

drop policy if exists "profiles: self update" on public.profiles;
create policy "profiles: self update"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles: admin manage" on public.profiles;
create policy "profiles: admin manage"
  on public.profiles for update to authenticated
  using (app.is_admin())
  with check (app.is_admin());

drop policy if exists "profiles: admin insert" on public.profiles;
create policy "profiles: admin insert"
  on public.profiles for insert to authenticated
  with check (app.is_admin());

-- Autores públicos ficam visíveis para o site (nome, bio, foto).
drop policy if exists "profiles: public authors" on public.profiles;
create policy "profiles: public authors"
  on public.profiles for select to anon
  using (is_public_author and is_active);

-- =============================================================================
-- PACIENTES — dado pessoal: nada de acesso anônimo, nunca.
-- =============================================================================
grant select, insert, update on public.patients to authenticated;
grant select, insert, update, delete on public.patient_contacts to authenticated;

drop policy if exists "patients: staff read" on public.patients;
create policy "patients: staff read"
  on public.patients for select to authenticated
  using (app.is_staff());

drop policy if exists "patients: staff write" on public.patients;
create policy "patients: staff write"
  on public.patients for insert to authenticated
  with check (app.is_staff());

drop policy if exists "patients: staff update" on public.patients;
create policy "patients: staff update"
  on public.patients for update to authenticated
  using (app.is_staff())
  with check (app.is_staff());

-- Exclusão definitiva não é permitida via API: usar arquivamento ou
-- `public.anonymize_patient()` (mantém integridade histórica e atende à LGPD).

drop policy if exists "patient_contacts: staff all" on public.patient_contacts;
create policy "patient_contacts: staff all"
  on public.patient_contacts for all to authenticated
  using (app.is_staff())
  with check (app.is_staff());

-- =============================================================================
-- CONSENTIMENTOS E DIREITOS DO TITULAR
-- =============================================================================
grant select on public.consents to authenticated;
grant select, update on public.data_subject_requests to authenticated;

drop policy if exists "consents: staff read" on public.consents;
create policy "consents: staff read"
  on public.consents for select to authenticated
  using (app.is_staff());

drop policy if exists "dsr: staff read" on public.data_subject_requests;
create policy "dsr: staff read"
  on public.data_subject_requests for select to authenticated
  using (app.is_staff());

drop policy if exists "dsr: admin update" on public.data_subject_requests;
create policy "dsr: admin update"
  on public.data_subject_requests for update to authenticated
  using (app.is_admin())
  with check (app.is_admin());

-- =============================================================================
-- SERVIÇOS E DISPONIBILIDADE — leitura pública somente do que está ativo
-- =============================================================================
grant select on public.services to anon, authenticated;
grant insert, update, delete on public.services to authenticated;
grant select on public.availability_rules to anon, authenticated;
grant insert, update, delete on public.availability_rules to authenticated;
grant select on public.availability_exceptions to anon, authenticated;
grant insert, update, delete on public.availability_exceptions to authenticated;

drop policy if exists "services: public read active" on public.services;
create policy "services: public read active"
  on public.services for select to anon
  using (is_active);

drop policy if exists "services: staff read" on public.services;
create policy "services: staff read"
  on public.services for select to authenticated
  using (is_active or app.is_staff());

drop policy if exists "services: admin manage" on public.services;
create policy "services: admin manage"
  on public.services for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

-- A grade de horários é informação pública (necessária para o agendamento),
-- mas não revela nenhum dado de paciente.
drop policy if exists "availability: public read" on public.availability_rules;
create policy "availability: public read"
  on public.availability_rules for select to anon, authenticated
  using (is_active);

drop policy if exists "availability: admin manage" on public.availability_rules;
create policy "availability: admin manage"
  on public.availability_rules for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

drop policy if exists "availability exceptions: public read" on public.availability_exceptions;
create policy "availability exceptions: public read"
  on public.availability_exceptions for select to anon, authenticated
  using (true);

drop policy if exists "availability exceptions: staff manage" on public.availability_exceptions;
create policy "availability exceptions: staff manage"
  on public.availability_exceptions for all to authenticated
  using (app.is_staff())
  with check (app.is_staff());

-- =============================================================================
-- AGENDA — sem leitura anônima. Horários livres são calculados por RPC.
-- =============================================================================
grant select, insert, update on public.appointments to authenticated;
grant select, insert, update, delete on public.blocked_times to authenticated;
grant select, update on public.appointment_requests to authenticated;
grant select, update on public.contact_messages to authenticated;

drop policy if exists "appointments: staff read" on public.appointments;
create policy "appointments: staff read"
  on public.appointments for select to authenticated
  using (app.is_staff());

drop policy if exists "appointments: staff insert" on public.appointments;
create policy "appointments: staff insert"
  on public.appointments for insert to authenticated
  with check (app.is_staff());

drop policy if exists "appointments: staff update" on public.appointments;
create policy "appointments: staff update"
  on public.appointments for update to authenticated
  using (app.is_staff())
  with check (app.is_staff());

drop policy if exists "blocked_times: staff all" on public.blocked_times;
create policy "blocked_times: staff all"
  on public.blocked_times for all to authenticated
  using (app.is_staff())
  with check (app.is_staff());

drop policy if exists "appointment_requests: staff read" on public.appointment_requests;
create policy "appointment_requests: staff read"
  on public.appointment_requests for select to authenticated
  using (app.is_staff());

drop policy if exists "appointment_requests: staff update" on public.appointment_requests;
create policy "appointment_requests: staff update"
  on public.appointment_requests for update to authenticated
  using (app.is_staff())
  with check (app.is_staff());

drop policy if exists "contact_messages: staff read" on public.contact_messages;
create policy "contact_messages: staff read"
  on public.contact_messages for select to authenticated
  using (app.is_staff());

drop policy if exists "contact_messages: staff update" on public.contact_messages;
create policy "contact_messages: staff update"
  on public.contact_messages for update to authenticated
  using (app.is_staff())
  with check (app.is_staff());

-- =============================================================================
-- COMÉRCIO — produtos públicos; pedidos e pagamentos apenas para equipe
-- =============================================================================
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select, insert, update on public.payments to authenticated;
grant select on public.payment_events to authenticated;

drop policy if exists "products: public read active" on public.products;
create policy "products: public read active"
  on public.products for select to anon
  using (is_active);

drop policy if exists "products: staff read" on public.products;
create policy "products: staff read"
  on public.products for select to authenticated
  using (is_active or app.is_staff());

drop policy if exists "products: admin manage" on public.products;
create policy "products: admin manage"
  on public.products for all to authenticated
  using (app.is_admin())
  with check (app.is_admin());

drop policy if exists "orders: staff read" on public.orders;
create policy "orders: staff read"
  on public.orders for select to authenticated
  using (app.is_staff());

drop policy if exists "orders: admin update" on public.orders;
create policy "orders: admin update"
  on public.orders for update to authenticated
  using (app.is_admin())
  with check (app.is_admin());

drop policy if exists "order_items: staff read" on public.order_items;
create policy "order_items: staff read"
  on public.order_items for select to authenticated
  using (app.is_staff());

-- Financeiro é restrito a OWNER/ADMIN (ASSISTANT/PROFESSIONAL não veem valores).
drop policy if exists "payments: admin read" on public.payments;
create policy "payments: admin read"
  on public.payments for select to authenticated
  using (app.is_admin());

drop policy if exists "payments: admin write" on public.payments;
create policy "payments: admin write"
  on public.payments for insert to authenticated
  with check (app.is_admin());

drop policy if exists "payments: admin update" on public.payments;
create policy "payments: admin update"
  on public.payments for update to authenticated
  using (app.is_admin())
  with check (app.is_admin());

-- Eventos de webhook são gravados apenas pelo service_role (servidor).
drop policy if exists "payment_events: admin read" on public.payment_events;
create policy "payment_events: admin read"
  on public.payment_events for select to authenticated
  using (app.is_admin());

-- =============================================================================
-- CONTEÚDO — público lê apenas o que está publicado
-- =============================================================================
grant select on public.blog_categories, public.blog_posts, public.infobooks,
                public.landing_pages, public.faqs, public.testimonials,
                public.site_settings, public.site_pages to anon, authenticated;
grant insert, update, delete on public.blog_categories, public.blog_posts, public.infobooks,
                public.landing_pages, public.faqs, public.testimonials,
                public.site_settings, public.site_pages to authenticated;

drop policy if exists "blog_categories: public read" on public.blog_categories;
create policy "blog_categories: public read"
  on public.blog_categories for select to anon, authenticated using (true);

drop policy if exists "blog_categories: staff manage" on public.blog_categories;
create policy "blog_categories: staff manage"
  on public.blog_categories for all to authenticated
  using (app.is_staff()) with check (app.is_staff());

drop policy if exists "blog_posts: public read published" on public.blog_posts;
create policy "blog_posts: public read published"
  on public.blog_posts for select to anon
  using (status = 'published' and coalesce(published_at, now()) <= now());

drop policy if exists "blog_posts: staff read all" on public.blog_posts;
create policy "blog_posts: staff read all"
  on public.blog_posts for select to authenticated
  using (app.is_staff() or (status = 'published' and coalesce(published_at, now()) <= now()));

drop policy if exists "blog_posts: staff manage" on public.blog_posts;
create policy "blog_posts: staff manage"
  on public.blog_posts for all to authenticated
  using (app.is_staff()) with check (app.is_staff());

drop policy if exists "infobooks: public read published" on public.infobooks;
create policy "infobooks: public read published"
  on public.infobooks for select to anon
  using (status = 'published');

drop policy if exists "infobooks: staff read all" on public.infobooks;
create policy "infobooks: staff read all"
  on public.infobooks for select to authenticated
  using (app.is_staff() or status = 'published');

drop policy if exists "infobooks: staff manage" on public.infobooks;
create policy "infobooks: staff manage"
  on public.infobooks for all to authenticated
  using (app.is_staff()) with check (app.is_staff());

drop policy if exists "landing_pages: public read published" on public.landing_pages;
create policy "landing_pages: public read published"
  on public.landing_pages for select to anon
  using (status = 'published');

drop policy if exists "landing_pages: staff read all" on public.landing_pages;
create policy "landing_pages: staff read all"
  on public.landing_pages for select to authenticated
  using (app.is_staff() or status = 'published');

drop policy if exists "landing_pages: staff manage" on public.landing_pages;
create policy "landing_pages: staff manage"
  on public.landing_pages for all to authenticated
  using (app.is_staff()) with check (app.is_staff());

drop policy if exists "faqs: public read active" on public.faqs;
create policy "faqs: public read active"
  on public.faqs for select to anon using (is_active);

drop policy if exists "faqs: staff read all" on public.faqs;
create policy "faqs: staff read all"
  on public.faqs for select to authenticated using (app.is_staff() or is_active);

drop policy if exists "faqs: staff manage" on public.faqs;
create policy "faqs: staff manage"
  on public.faqs for all to authenticated
  using (app.is_staff()) with check (app.is_staff());

drop policy if exists "testimonials: public read published" on public.testimonials;
create policy "testimonials: public read published"
  on public.testimonials for select to anon using (is_published);

drop policy if exists "testimonials: staff read all" on public.testimonials;
create policy "testimonials: staff read all"
  on public.testimonials for select to authenticated using (app.is_staff() or is_published);

drop policy if exists "testimonials: admin manage" on public.testimonials;
create policy "testimonials: admin manage"
  on public.testimonials for all to authenticated
  using (app.is_admin()) with check (app.is_admin());

-- site_settings: chaves com prefixo `private_` nunca são expostas ao público.
drop policy if exists "site_settings: public read" on public.site_settings;
create policy "site_settings: public read"
  on public.site_settings for select to anon
  using (key not like 'private_%');

drop policy if exists "site_settings: staff read" on public.site_settings;
create policy "site_settings: staff read"
  on public.site_settings for select to authenticated
  using (app.is_staff() or key not like 'private_%');

drop policy if exists "site_settings: admin manage" on public.site_settings;
create policy "site_settings: admin manage"
  on public.site_settings for all to authenticated
  using (app.is_admin()) with check (app.is_admin());

drop policy if exists "site_pages: public read published" on public.site_pages;
create policy "site_pages: public read published"
  on public.site_pages for select to anon using (is_published);

drop policy if exists "site_pages: staff read all" on public.site_pages;
create policy "site_pages: staff read all"
  on public.site_pages for select to authenticated using (app.is_staff() or is_published);

drop policy if exists "site_pages: admin manage" on public.site_pages;
create policy "site_pages: admin manage"
  on public.site_pages for all to authenticated
  using (app.is_admin()) with check (app.is_admin());

-- =============================================================================
-- DOCUMENTOS — metadados restritos à equipe
-- =============================================================================
grant select, insert, update, delete on public.documents to authenticated;

drop policy if exists "documents: staff read" on public.documents;
create policy "documents: staff read"
  on public.documents for select to authenticated
  using (app.is_staff());

drop policy if exists "documents: staff insert" on public.documents;
create policy "documents: staff insert"
  on public.documents for insert to authenticated
  with check (app.is_staff());

drop policy if exists "documents: admin update" on public.documents;
create policy "documents: admin update"
  on public.documents for update to authenticated
  using (app.is_admin()) with check (app.is_admin());

drop policy if exists "documents: admin delete" on public.documents;
create policy "documents: admin delete"
  on public.documents for delete to authenticated
  using (app.is_admin());

-- =============================================================================
-- NOTIFICAÇÕES
-- =============================================================================
grant select, update on public.notifications to authenticated;

drop policy if exists "notifications: staff read" on public.notifications;
create policy "notifications: staff read"
  on public.notifications for select to authenticated
  using (app.is_staff());

drop policy if exists "notifications: staff update" on public.notifications;
create policy "notifications: staff update"
  on public.notifications for update to authenticated
  using (app.is_staff()) with check (app.is_staff());

-- Sequências usadas por defaults de tabela.
grant usage, select on sequence public.order_number_seq to authenticated, service_role;
