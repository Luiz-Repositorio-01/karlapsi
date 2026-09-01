-- Restringe chaves `private_%` de site_settings a OWNER/ADMIN.
-- Antes, a policy "staff read" usava `is_staff() OR not private`, o que
-- permitia ASSISTANT/PROFESSIONAL lerem configuração interna.

drop policy if exists "site_settings: staff read" on public.site_settings;
create policy "site_settings: staff read"
  on public.site_settings for select to authenticated
  using (
    app.is_admin()
    or (app.is_staff() and key !~ '^private_')
  );
