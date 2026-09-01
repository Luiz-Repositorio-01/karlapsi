# Checklist de produção — Karla Dias Neuropsi

Status objetivo. **Não declare 100%** enquanto houver item `PENDENTE DE CREDENCIAL` ou `PENDENTE DE DADO REAL`.

Legenda:

| Status | Significado |
| --- | --- |
| IMPLEMENTADO | Código/migrations/UI existem no repositório |
| CONFIGURADO | Credencial/dado aplicado neste ambiente |
| TESTADO | Verificado localmente (unitário, db:validate, smoke ou QA) |
| PENDENTE DE CREDENCIAL | Aguarda env vars / projeto externo |
| PENDENTE DE DADO REAL | Aguarda conteúdo profissional ou arquivos legacy |

---

## Infra e banco

| Item | Status |
| --- | --- |
| Schema + migrations `001`–`012` | IMPLEMENTADO · TESTADO (`db:validate`) · CONFIGURADO: PENDENTE DE CREDENCIAL |
| Indexes / constraints / GiST exclusion | IMPLEMENTADO · TESTADO |
| RLS + policies | IMPLEMENTADO · TESTADO (38 asserções) |
| Storage buckets + policies | IMPLEMENTADO · TESTADO (SQL) · upload real: PENDENTE DE CREDENCIAL |
| Auth (login/logout/session/refresh) | IMPLEMENTADO · TESTADO live: PENDENTE DE CREDENCIAL |
| Primeiro OWNER (trigger, sem senha no código) | IMPLEMENTADO · documentado no README §5 · TESTADO live: PENDENTE DE CREDENCIAL |
| RBAC OWNER/ADMIN/ASSISTANT/PROFESSIONAL | IMPLEMENTADO · TESTADO (SQL) |

## Site e conteúdo

| Item | Status |
| --- | --- |
| Home / serviços / blog / agendamento / legal | IMPLEMENTADO · TESTADO (build + QA visual) |
| `/admin/configuracoes` (identidade, contato, mapa, formação, especializações, SEO/OG, booking, módulos) | IMPLEMENTADO · checklist de pendências no admin |
| Serviços CRUD completo | IMPLEMENTADO |
| Blog CRUD + metadata | IMPLEMENTADO |
| Infobooks / Landing Pages (catálogo + rewrites) | IMPLEMENTADO · arquivos legacy: PENDENTE DE DADO REAL |
| PDF Online (wrapper + empty state) | IMPLEMENTADO · runtime legacy: PENDENTE DE DADO REAL |
| Conteúdo profissional (CRP, bio, foto…) | Campos vazios por design · PENDENTE DE DADO REAL |
| Favicon + apple-icon + web manifest | IMPLEMENTADO |
| SEO (metadata, OG, sitemap, robots, JSON-LD) | IMPLEMENTADO · crawler prod: após DNS |

## Agenda e financeiro

| Item | Status |
| --- | --- |
| Double booking (exclusion + RPCs) | IMPLEMENTADO · TESTADO |
| Booking wizard UI | IMPLEMENTADO · TESTADO (QA) · fluxo com banco: PENDENTE DE CREDENCIAL |
| Mercado Pago preference + webhook idempotente | IMPLEMENTADO · CONFIGURADO: PENDENTE DE CREDENCIAL |
| E-mail transacional (templates + outbox) | IMPLEMENTADO · CONFIGURADO: PENDENTE DE CREDENCIAL |
| Cron `/api/notifications/dispatch` | IMPLEMENTADO · protegido por `CRON_SECRET` · PENDENTE DE CREDENCIAL |

## Qualidade

| Item | Status |
| --- | --- |
| `npm test` | TESTADO (85+ casos) |
| `npm run lint` / `typecheck` / `build` | TESTADO |
| `npm audit` | TESTADO (0 vulnerabilidades na última verificação) |
| Mobile / a11y / security headers | TESTADO localmente |
| LGPD (consentimento, direitos, anonimização) | IMPLEMENTADO · TESTADO (SQL) |
| Audit logs | IMPLEMENTADO · TESTADO (SQL) |

## Domínio `karlaneuropsi.com.br`

| Item | Status |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL=https://karlaneuropsi.com.br` | Documentado · CONFIGURADO: PENDENTE |
| DNS / HTTPS | Documentado no README §13 · PENDENTE (operacional) |

---

## O que você precisa enviar para avançar

1. **Supabase** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (+ aplicar migrations).
2. **Mercado Pago** (se checkout) — access token, public key, webhook secret.
3. **E-mail** — provider + API key + from.
4. **`CRON_SECRET`** — `openssl rand -hex 32`.
5. **Arquivos** em `public/legacy/` (PDF Online, LPs, infobooks).
6. **Dados reais** via `/admin/configuracoes` (CRP, bio, foto, preços, endereço…).

Enquanto (1) não chegar, auth, agenda real, pacientes, storage e financeiro conectado **não** podem ser marcados como CONFIGURADO/TESTADO em produção.
