-- Permite que visitantes anônimos leiam perfis marcados como autoria pública.
-- A policy "profiles: public authors" já restringe a is_public_author + is_active;
-- sem este GRANT, o PostgREST nega qualquer SELECT em profiles para anon e quebra
-- as páginas do blog que embutem o autor do artigo.

grant select on public.profiles to anon;
