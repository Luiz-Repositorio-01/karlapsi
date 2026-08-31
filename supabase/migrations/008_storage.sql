-- =============================================================================
-- 008_storage.sql — Buckets do Supabase Storage e políticas de acesso
--
-- Regra central: documentos de paciente e arquivos pagos NUNCA são públicos.
-- O acesso acontece por URL assinada gerada no servidor, com expiração curta.
-- =============================================================================

-- `public-assets`: logo, capas, imagens do site. Leitura pública.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-assets', 'public-assets', true, 10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = excluded.allowed_mime_types;

-- `products`: infobooks/materiais pagos. Privado — entrega por URL assinada.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products', 'products', false, 52428800,
  array['application/pdf', 'application/epub+zip', 'application/zip', 'image/png', 'image/jpeg']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 52428800,
      allowed_mime_types = excluded.allowed_mime_types;

-- `patient-documents`: documentos administrativos e clínicos. Máxima restrição.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-documents', 'patient-documents', false, 26214400,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 26214400,
      allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Políticas
-- -----------------------------------------------------------------------------

-- public-assets: leitura por qualquer visitante; escrita apenas equipe admin.
drop policy if exists "public assets are readable" on storage.objects;
create policy "public assets are readable"
  on storage.objects for select
  using (bucket_id = 'public-assets');

drop policy if exists "admins manage public assets" on storage.objects;
create policy "admins manage public assets"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'public-assets' and app.is_admin())
  with check (bucket_id = 'public-assets' and app.is_admin());

-- products: nenhuma leitura anônima. Equipe lê; admin escreve.
drop policy if exists "staff read product files" on storage.objects;
create policy "staff read product files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'products' and app.is_staff());

drop policy if exists "admins manage product files" on storage.objects;
create policy "admins manage product files"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'products' and app.is_admin())
  with check (bucket_id = 'products' and app.is_admin());

-- patient-documents: apenas equipe autenticada; exclusão restrita a admin.
drop policy if exists "staff read patient documents" on storage.objects;
create policy "staff read patient documents"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'patient-documents' and app.is_staff());

drop policy if exists "staff upload patient documents" on storage.objects;
create policy "staff upload patient documents"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'patient-documents' and app.is_staff());

drop policy if exists "admins update patient documents" on storage.objects;
create policy "admins update patient documents"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'patient-documents' and app.is_admin())
  with check (bucket_id = 'patient-documents' and app.is_admin());

drop policy if exists "admins delete patient documents" on storage.objects;
create policy "admins delete patient documents"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'patient-documents' and app.is_admin());
