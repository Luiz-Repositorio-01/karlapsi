-- =============================================================================
-- 012_defaults.sql — Configuração inicial editável pelo painel
--
-- Aqui NÃO existe conteúdo profissional inventado: nenhum registro
-- profissional, certificado, especialização, tempo de experiência ou
-- depoimento. Campos que dependem de informação real da profissional ficam
-- vazios e são preenchidos em /admin/configuracoes.
--
-- Os textos institucionais padrão (explicativos e neutros) vivem na aplicação
-- (`src/lib/content/defaults.ts`) e são usados apenas enquanto não houver
-- registro correspondente em `site_pages` — evitando duplicar conteúdo.
-- =============================================================================

insert into public.site_settings (key, value, description) values
(
  'identity',
  jsonb_build_object(
    'brand_name', 'Karla Dias Neuropsi',
    'professional_name', 'Karla Dias',
    'positioning', 'Neuropsicologia',
    'headline', 'Avaliação neuropsicológica com ciência, escuta e clareza',
    'subheadline', 'Um processo estruturado para entender como a pessoa aprende, se organiza e se relaciona — com devolutiva compreensível e orientações práticas.',
    -- Preencher no painel somente com informação real e verificável.
    'professional_registration_label', '',
    'professional_registration_value', '',
    'short_bio', '',
    'photo_url', ''
  ),
  'Nome, posicionamento e apresentação da profissional'
),
(
  'contact',
  jsonb_build_object(
    'whatsapp', '5511988830377',
    'phone', '',
    'email', '',
    'instagram', '',
    'address_line', '',
    'city', '',
    'state', '',
    'service_area', 'Atendimento presencial e online',
    'office_hours_label', ''
  ),
  'Canais de contato exibidos no site'
),
(
  'booking',
  jsonb_build_object(
    'timezone', 'America/Sao_Paulo',
    'min_lead_hours', 12,
    'max_advance_days', 90,
    'default_slot_interval_minutes', 30,
    'auto_confirm', false,
    'show_prices_publicly', false,
    'require_consent', true,
    'consent_version', '1.0'
  ),
  'Regras do agendamento público'
),
(
  'seo',
  jsonb_build_object(
    'site_name', 'Karla Dias Neuropsi',
    'default_title', 'Karla Dias Neuropsi — Neuropsicologia',
    'default_description', 'Avaliação neuropsicológica, atendimentos e materiais sobre desenvolvimento, aprendizagem e funções cognitivas.',
    'default_keywords', 'neuropsicologia, avaliação neuropsicológica, aprendizagem, funções cognitivas'
  ),
  'Metadados padrão do site'
),
(
  'features',
  jsonb_build_object(
    'show_testimonials', true,
    'enable_online_payments', false,
    'enable_pdf_online', true,
    'enable_blog', true,
    'enable_store', true
  ),
  'Liga/desliga módulos do site público'
),
(
  'private_notifications',
  jsonb_build_object(
    'internal_email', '',
    'notify_on_request', true,
    'notify_on_payment', true
  ),
  'Configuração interna de notificações (não exposta ao público)'
)
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- Serviços iniciais
--
-- Valores ficam NULL e `show_price_publicly = false`: preço é definido pela
-- profissional no painel, nunca presumido pelo sistema.
-- -----------------------------------------------------------------------------
insert into public.services
  (name, slug, summary, duration_minutes, price_cents, show_price_publicly, allows_online_booking, is_featured, sort_order)
values
(
  'Avaliação neuropsicológica',
  'avaliacao-neuropsicologica',
  'Processo estruturado de investigação das funções cognitivas, com entrevista inicial, sessões de testagem e devolutiva com orientações.',
  60, null, false, true, true, 1
),
(
  'Entrevista inicial',
  'entrevista-inicial',
  'Primeiro encontro para entender a demanda, alinhar objetivos e explicar como funciona o processo.',
  50, null, false, true, true, 2
),
(
  'Devolutiva e orientação',
  'devolutiva-e-orientacao',
  'Encontro para apresentação dos resultados, esclarecimento de dúvidas e orientações práticas para família e escola/trabalho.',
  50, null, false, true, false, 3
)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Disponibilidade padrão: segunda a sexta, 9h–18h com intervalo 12h–13h.
-- Ajustável em /admin/disponibilidade.
-- -----------------------------------------------------------------------------
insert into public.availability_rules (weekday, start_time, end_time, slot_interval_minutes, break_start_time, break_end_time)
select w, time '09:00', time '18:00', 60, time '12:00', time '13:00'
from generate_series(1, 5) as w
where not exists (select 1 from public.availability_rules);

-- -----------------------------------------------------------------------------
-- Categorias do blog
-- -----------------------------------------------------------------------------
insert into public.blog_categories (name, slug, description, sort_order) values
  ('Neuropsicologia', 'neuropsicologia', 'Conceitos, processos e boas práticas em avaliação neuropsicológica.', 1),
  ('Desenvolvimento e aprendizagem', 'desenvolvimento-e-aprendizagem', 'Temas de desenvolvimento infantil, escola e aprendizagem.', 2),
  ('Família e escola', 'familia-e-escola', 'Orientações práticas para o cotidiano de famílias e educadores.', 3)
on conflict (slug) do nothing;
