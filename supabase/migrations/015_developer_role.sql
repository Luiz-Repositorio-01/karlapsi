-- =============================================================================
-- Passo 1/2 — adicionar DEVELOPER ao enum user_role
-- =============================================================================
-- No SQL Editor do Supabase: cole SOMENTE a linha abaixo e clique Run.
-- Não execute junto com o 016. Aguarde "Success" antes de continuar.
--
-- Se der "already exists", o enum já está OK — pule para o 016.
-- Se "IF NOT EXISTS" falhar, use a linha alternativa nos comentários.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'DEVELOPER';

-- Alternativa (sem IF NOT EXISTS):
-- ALTER TYPE public.user_role ADD VALUE 'DEVELOPER';

-- Confirme (deve aparecer DEVELOPER na lista):
-- SELECT e.enumlabel
-- FROM pg_enum e
-- JOIN pg_type t ON t.oid = e.enumtypid
-- WHERE t.typname = 'user_role'
-- ORDER BY e.enumsortorder;
