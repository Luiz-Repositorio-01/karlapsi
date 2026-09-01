# Karla Dias Neuropsi — plataforma

Site público de alta conversão + sistema interno de gestão para a prática em
**neuropsicologia**: agenda sem conflito, CRM de pacientes, financeiro,
conteúdos (blog, infobooks, landing pages, PDF Online) e integração de
pagamento.

- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript estrito ·
  Tailwind CSS · Supabase (PostgreSQL + Auth + Storage) · Zod · Vitest
- **Idioma:** pt-BR · **Fuso padrão:** America/Sao_Paulo (configurável)

---

## Sumário

1. [Instalação e desenvolvimento](#1-instalação-e-desenvolvimento)
2. [Scripts](#2-scripts)
3. [Variáveis de ambiente](#3-variáveis-de-ambiente)
4. [Supabase: banco, migrations e RLS](#4-supabase-banco-migrations-e-rls)
5. [Autenticação e criação do primeiro OWNER](#5-autenticação-e-criação-do-primeiro-owner)
6. [Perfis de acesso (RBAC)](#6-perfis-de-acesso-rbac)
7. [Storage](#7-storage)
8. [Mercado Pago](#8-mercado-pago)
9. [E-mail e notificações](#9-e-mail-e-notificações)
10. [Módulos preservados: PDF Online, Infobooks e Landing Pages](#10-módulos-preservados-pdf-online-infobooks-e-landing-pages)
11. [Estrutura do projeto](#11-estrutura-do-projeto)
12. [Testes e verificação](#12-testes-e-verificação)
13. [Deploy](#13-deploy)
14. [Backup e recuperação](#14-backup-e-recuperação)
15. [LGPD](#15-lgpd)
16. [Manutenção](#16-manutenção)

---

## 1. Instalação e desenvolvimento

Requisitos: **Node.js 20.9+** (recomendado 22) e npm 10+.

```bash
npm install
cp .env.example .env.local   # preencha as credenciais
npm run dev                  # http://localhost:3000
```

O projeto **sobe e funciona mesmo sem Supabase configurado**: o site público
usa o conteúdo padrão de `src/lib/content/defaults.ts` e as áreas que dependem
de banco exibem um aviso explícito em vez de erro. Isso permite avaliar o
layout antes de conectar as credenciais.

## 2. Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Executa o build de produção |
| `npm run lint` | ESLint (flat config, regras do Next + React Compiler) |
| `npm run typecheck` | `tsc --noEmit` com TypeScript estrito |
| `npm test` | Testes unitários (Vitest) |
| `npm run verify` | lint + typecheck + testes + build |
| `npm run db:validate` | Aplica migrations em um PostgreSQL local e roda os testes de RLS/RBAC/agenda |

## 3. Variáveis de ambiente

Todas estão documentadas com comentários em **`.env.example`**. Resumo:

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | produção | Metadata, sitemap, retorno do checkout |
| `NEXT_PUBLIC_SUPABASE_URL` | sim | Endpoint do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sim | Chave pública (protegida por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | sim | **Segredo.** Webhook e tarefas de servidor |
| `MERCADOPAGO_ACCESS_TOKEN` | opcional | **Segredo.** Criação de preferência de pagamento |
| `MERCADOPAGO_WEBHOOK_SECRET` | opcional | **Segredo.** Validação HMAC do webhook |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | opcional | Chave pública do checkout |
| `EMAIL_PROVIDER` / `EMAIL_API_KEY` / `EMAIL_FROM` | opcional | E-mail transacional (`resend`, `brevo` ou `log`) |
| `NEXT_PUBLIC_WHATSAPP` | opcional | Número do botão de WhatsApp |
| `WHATSAPP_API_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | opcional | Envio automático pela Cloud API |
| `CRON_SECRET` | opcional | **Segredo.** Protege o processamento da fila de notificações |

> Nenhum segredo é lido no navegador. O painel em `/admin/configuracoes`
> mostra apenas **se** cada credencial está presente — nunca o valor.

## 4. Supabase: banco, migrations e RLS

### 4.1 Aplicar as migrations

As migrations ficam em `supabase/migrations/`, numeradas e idempotentes
(podem ser reexecutadas sem erro):

| Arquivo | Conteúdo |
| --- | --- |
| `001_initial_schema.sql` | Extensões, enums e funções utilitárias |
| `002_auth_profiles.sql` | `profiles`, helpers de RBAC, provisionamento de usuário e travas de escalonamento |
| `003_patients.sql` | Pacientes, contatos, consentimentos, direitos do titular e anonimização |
| `004_services.sql` | Serviços, disponibilidade semanal e exceções |
| `005_appointments.sql` | Agenda (com prevenção de conflito), bloqueios, solicitações e contatos |
| `006_payments.sql` | Produtos, pedidos, cobranças e eventos de webhook |
| `007_content.sql` | Blog, infobooks, landing pages, FAQ, depoimentos, settings, documentos e notificações |
| `008_storage.sql` | Buckets e políticas do Storage |
| `009_rls.sql` | Row Level Security em todas as tabelas |
| `010_audit.sql` | Trilha de auditoria (tabela, triggers e função) |
| `011_booking_functions.sql` | RPCs de escrita pública, reagendamento e métricas |
| `012_defaults.sql` | Configuração inicial editável (sem conteúdo profissional inventado) |

**Projeto Supabase de produção (Karla Neuropsi):**

- Project Ref: `oerlxsstjuyptnryhpyi`
- URL: `https://oerlxsstjuyptnryhpyi.supabase.co`

**Opção A — Supabase CLI (recomendado):**

Com as variáveis já no ambiente (`NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`):

```bash
./scripts/connect-supabase.sh   # escreve .env.local, linka e faz db push (sem reset)
```

Ou manualmente:

```bash
supabase link --project-ref oerlxsstjuyptnryhpyi
supabase migration list         # conferir divergências ANTES
supabase db push                # NUNCA use db reset em produção
```

**Opção B — SQL Editor:** abra cada arquivo na ordem numérica e execute.

**Opção C — psql:**

```bash
for f in supabase/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

> **Service role:** usada só no servidor (`createSupabaseAdminClient`) —
> webhook Mercado Pago, preferência de pagamento, dispatch de notificações e
> páginas de retorno de pagamento. Nunca no frontend. Sem a chave, essas rotas
> degradam com aviso; a anon key **não** a substitui.
### 4.2 Dados de demonstração (opcional)

```bash
psql "$DATABASE_URL" -f supabase/seed/demo.sql
```

Cria paciente, agendamento, cobrança e produto **fictícios**, todos marcados
com `is_demo = true` / prefixo `[DEMO]`. O próprio arquivo traz o comando de
remoção. **Não execute em produção com dados reais.**

### 4.3 Row Level Security

RLS está **ativo em todas as tabelas** do schema `public`, e os privilégios
padrão de `anon`/`authenticated` são revogados antes das políticas.

| Papel | O que consegue ler/escrever |
| --- | --- |
| `anon` (visitante) | Só conteúdo publicado: serviços ativos, artigos publicados, infobooks, landing pages, FAQ, depoimentos publicados e configurações não privadas. **Zero acesso** a pacientes, agenda, pagamentos e auditoria. |
| `ASSISTANT` | Agenda, pacientes, solicitações, conteúdos. **Sem** financeiro e **sem** auditoria. |
| `PROFESSIONAL` | Agenda, pacientes, disponibilidade, conteúdos. **Sem** financeiro. |
| `ADMIN` | Tudo, exceto conceder o papel OWNER. |
| `OWNER` | Tudo, incluindo permissões. |

Escrita vinda do site público **não** usa INSERT direto: passa por funções
`SECURITY DEFINER` (`create_appointment_request`, `submit_contact_message`,
`submit_data_subject_request`) que validam serviço, janela de agendamento,
disponibilidade, consentimento e limites anti-abuso:

- no máximo 5 solicitações por hora do mesmo e-mail ou IP (hash);
- no máximo 2 horários reservados e não confirmados por e-mail;
- teto diário de solicitações públicas (`booking.max_daily_public_requests`,
  padrão 40), para que ninguém consiga esgotar a agenda com e-mails variados.

### 4.4 Validar o banco localmente

```bash
sudo apt-get install -y postgresql   # se necessário
./scripts/validate-db.sh
```

O script cria um banco temporário, aplica stubs mínimos do Supabase
(`auth`/`storage`), roda todas as migrations e executa **38 asserções** de
RLS, RBAC, prevenção de double booking, agendamento público, limites
anti-abuso e LGPD.

## 5. Autenticação e criação do primeiro OWNER

A autenticação é do **Supabase Auth** (e-mail + senha), com cookies `httpOnly`,
`sameSite=lax` e `secure` em produção.

**Não existe senha no código.** O primeiro usuário criado torna-se `OWNER`
automaticamente (trigger `app.handle_new_user`); os seguintes entram como
`ASSISTANT` (menor privilégio) e são promovidos em `/admin/usuarios`.

Passo a passo:

1. Supabase → **Authentication → Users → Add user** (ou *Invite*).
2. Informe o e-mail da profissional. Prefira **Invite**: a senha é definida por
   ela mesma, e ninguém mais a conhece.
3. Acesse `/login` e entre. Confirme em `/admin/usuarios` que o papel é
   *Proprietária*.
4. Preencha `/admin/configuracoes` (identidade, contato, SEO) e
   `/admin/disponibilidade` (grade de horários).

Recuperação de senha: `/login` → “Esqueci minha senha”. O link do e-mail chega
em `/auth/callback`, que troca o código por sessão e leva a `/nova-senha`
(mínimo de 10 caracteres, com maiúscula, minúscula e número).

Para habilitar MFA, ative *Multi-Factor Authentication* no painel do Supabase
(Authentication → Providers); a aplicação respeita a política do projeto.

## 6. Perfis de acesso (RBAC)

| Papel | Descrição |
| --- | --- |
| **OWNER** | Controle total, incluindo papéis e financeiro. |
| **ADMIN** | Administra sistema, agenda, pacientes, financeiro e conteúdos. |
| **ASSISTANT** | Secretaria: agenda, pacientes e solicitações. Sem financeiro. |
| **PROFESSIONAL** | Agenda, pacientes e conteúdos. Sem financeiro nem permissões. |

A matriz de permissões da interface está em `src/lib/auth/rbac.ts`; a
autorização **efetiva** é do PostgreSQL (RLS + triggers). Regras garantidas
pelo banco: ninguém altera o próprio papel, somente OWNER concede OWNER, e
sempre existe ao menos um OWNER ativo.

## 7. Storage

`supabase/migrations/008_storage.sql` cria três buckets:

| Bucket | Público? | Uso | Limite |
| --- | --- | --- | --- |
| `public-assets` | sim | Logo, capas, imagens do site e do blog | 10 MB |
| `products` | **não** | Infobooks e materiais pagos (`product-assets`) | 50 MB |
| `patient-documents` | **não** | Documentos de paciente (`private-documents`) | 25 MB |

Pastas sugeridas dentro de `public-assets`: `logo/`, `blog-images/`, `og/`.
Não há bucket separado `blog-images` — imagens de blog vão em `public-assets/blog-images/`.

Buckets privados não têm URL pública: o download passa por **URL assinada** de
120 segundos, gerada no servidor (`createDocumentDownloadUrl`). Tipos MIME e
tamanho são restritos no próprio Storage e revalidados no servidor.

## 8. Mercado Pago

Arquitetura: **navegador → nosso backend → Mercado Pago**. O access token nunca
sai do servidor.

| Etapa | Rota |
| --- | --- |
| Criação da preferência | `POST /api/payments/mercadopago/preference` (alias legado: `POST /api/checkout`) |
| Webhook | `POST /api/payments/mercadopago/webhook` (alias legado: `POST /api/webhooks/mercadopago`) |
| Retorno ao usuário | `/pagamento/sucesso`, `/pagamento/pendente`, `/pagamento/erro` |

Garantias implementadas:

- **Preço vem do banco**, nunca do que o navegador envia.
- **Idempotência na criação:** header `X-Idempotency-Key` com o
  `external_reference` do pedido.
- **Idempotência no webhook:** índice único em `payment_events (provider,
  event_key)`. Reentrega do mesmo evento responde 200 sem reprocessar.
- **Assinatura validada** por HMAC-SHA256 (`x-signature`) com comparação em
  tempo constante. Assinatura inválida → 401, sem tocar no banco.
- **Status vem da API**, não do corpo da notificação nem de query string: o
  webhook consulta `GET /v1/payments/{id}` antes de gravar.
- Estados mapeados: `pending`, `approved`, `authorized`, `in_process`,
  `rejected`, `cancelled`, `refunded`, `charged_back`.
- Cobranças conciliadas pelo provedor **não podem** ser editadas à mão no
  painel.

Configuração no painel do Mercado Pago:

1. Copie o **access token de produção** para `MERCADOPAGO_ACCESS_TOKEN`.
2. Cadastre o webhook `https://SEU_DOMINIO/api/payments/mercadopago/webhook`,
   evento **Pagamentos**.
3. Copie a **chave secreta** do webhook para `MERCADOPAGO_WEBHOOK_SECRET`.
4. Teste primeiro com credenciais de teste e o cartão de teste do provedor,
   acompanhando `payment_events` e `orders` no Supabase.

## 9. E-mail e notificações

Os eventos são gravados em uma fila (`notifications`, padrão *outbox*) dentro da
mesma transação da operação — nada é perdido se o provedor estiver fora.

A entrega é feita por adaptadores em `src/lib/notifications/adapters.ts`:

| Canal | Situação |
| --- | --- |
| E-mail | Resend e Brevo por HTTP (sem SDK). Provedor `log` grava só o assunto no log. |
| WhatsApp | Cloud API (Meta) com template aprovado. Inativo sem credenciais. |
| Push | Estrutura pronta; nenhum provedor conectado. |
| Interno | Exibido em `/admin/notificacoes`. |

Processamento da fila:

```bash
curl -X POST https://SEU_DOMINIO/api/notifications/dispatch \
  -H "x-cron-secret: $CRON_SECRET"
```

Agende essa chamada (cron do provedor ou Supabase Scheduled Function). Sem
`CRON_SECRET`, o endpoint responde 503 — não existe endpoint aberto capaz de
disparar e-mails.

Templates (assunto, texto e HTML) em `src/lib/email/templates.ts`:
confirmação de recebimento, confirmação de atendimento, cancelamento,
reagendamento, pagamento aprovado, pagamento pendente e contato recebido.

## 10. Módulos preservados: PDF Online, Infobooks e Landing Pages

Os arquivos originais moram em **`public/legacy/`** e são servidos como
estáticos, **sem passar pelo processamento do Next.js**. Nenhum conteúdo
original é reescrito.

```
public/legacy/
├── pdf-online/            → exibido em /pdf-online
└── landing-pages/<slug>/  → exibido em /landing-pages/<slug> e /infobooks/<slug>
```

- A detecção é automática (`src/lib/legacy.ts`): se o arquivo existe, a página
  o incorpora; se não, mostra uma instrução clara em vez de um iframe quebrado.
- **URLs antigas continuam válidas** por rewrites em `next.config.ts`:
  `/pdf-online/index.html`, `/pdf-online/assets/*`,
  `/infobooks/<slug>/index.html`, `/landing-pages/<slug>/index.html` e os
  respectivos `/assets/*`.
- Também há redirects 301 de URLs estáticas antigas (`/index.html`,
  `/sobre.html`, `/ebooks`, `/produtos`, `/privacidade` etc.).
- No painel, cada infobook/landing page tem o campo **Caminho legado** para
  apontar o arquivo original e ganhar capa, descrição, preço e CTA na vitrine.

> **Estado neste repositório:** o histórico do Git tinha um único commit apenas
> com arquivos de configuração — as pastas de `public/legacy` nunca foram
> versionadas. A integração está pronta e testada; basta copiar os arquivos
> originais para os caminhos acima e publicar. Detalhes em
> `public/legacy/README.md`.

## 11. Estrutura do projeto

```
src/
├── app/
│   ├── (site)/                 Site público (ISR)
│   ├── admin/                  Painel (sempre dinâmico)
│   │   └── _actions/           Server Actions com autorização + auditoria
│   ├── api/                    Route handlers (agenda, contato, LGPD, pagamentos)
│   ├── login/ nova-senha/ auth/callback/
│   ├── sitemap.ts robots.ts not-found.tsx error.tsx global-error.tsx
│   └── globals.css
├── components/
│   ├── ui/                     Primitivos (server) + interativos (client)
│   ├── site/ booking/ store/ admin/ seo/
├── lib/
│   ├── supabase/               Clientes público, de sessão e de serviço
│   ├── auth/                   Sessão e matriz RBAC
│   ├── data/                   Leituras públicas, de agenda e do painel
│   ├── domain/availability.ts  Algoritmo de horários (puro, testado)
│   ├── validation/schemas.ts   Zod (servidor é a fonte da verdade)
│   ├── content/                Conteúdo padrão + Markdown seguro
│   ├── mercadopago/ email/ notifications/ seo/ utils/
│   └── env.ts                  Leitura centralizada de env + diagnóstico
└── proxy.ts                    Renovação de sessão e barreira do /admin
supabase/{migrations,seed,tests}
scripts/validate-db.sh
tests/                          Vitest
```

## 12. Testes e verificação

```bash
npm run verify        # lint + typecheck + testes + build
npm run db:validate   # migrations + RLS/RBAC/agenda/LGPD (PostgreSQL local)
```

Cobertura dos testes unitários:

- **Agenda:** grade, pausas, exceções, antecedência mínima, sobreposição total
  e parcial, fim exclusivo, múltiplos dias e conversão de fuso.
- **Validação:** CPF com dígito verificador, normalização de e-mail/telefone,
  obrigatoriedade de consentimento, limites de quantidade e slug.
- **Markdown:** escape de `<script>`, bloqueio de `javascript:` e `data:`,
  `rel="noopener noreferrer"` em links externos.
- **Mercado Pago:** mapeamento de status (desconhecido → `pending`, nunca
  aprovado), assinatura HMAC válida/adulterada/ausente.
- **Formatação:** moeda, CPF mascarado, telefone, datas no fuso do consultório.
- **Prontidão:** checklist de configurações pendentes e schema de settings.

## 13. Deploy

Compatível com qualquer plataforma que rode Next.js em Node (Vercel, Fly,
Railway, VPS com Docker). Checklist:

1. `npm run verify` passando.
2. Variáveis de ambiente configuradas no provedor (ver seção 3).
3. `NEXT_PUBLIC_SITE_URL` com o domínio final e HTTPS.
4. Migrations aplicadas no Supabase de produção.
5. Webhook do Mercado Pago apontando para o domínio de produção.
6. Cron chamando `/api/notifications/dispatch`.
7. Conferir `https://SEU_DOMINIO/robots.txt` e `/sitemap.xml`.
8. Enviar o sitemap ao Google Search Console.

Checklist detalhado por status (implementado / configurado / pendente):
[`docs/PRODUCTION_CHECKLIST.md`](docs/PRODUCTION_CHECKLIST.md).

### 13.1 Domínio `karlaneuropsi.com.br` (DNS)

O código **não** configura DNS. No registrador / Cloudflare, prepare:

| Tipo | Nome | Valor | Observação |
| --- | --- | --- | --- |
| `A` ou `CNAME` | `@` (apex) | IP ou hostname do provedor de hospedagem | Vercel costuma pedir CNAME/`A` próprios — use o que o painel indicar |
| `CNAME` | `www` | `karlaneuropsi.com.br` ou o target do provedor | Redirecione `www` → apex (ou o contrário), sem loop |
| TXT | conforme provedor | verificação de domínio / SSL | Só se o host pedir |

Depois do DNS propagar:

1. Emita certificado HTTPS no provedor (Let’s Encrypt / automático).
2. Defina `NEXT_PUBLIC_SITE_URL=https://karlaneuropsi.com.br` (sem barra no final).
3. Atualize o redirect URL do Supabase Auth: `https://karlaneuropsi.com.br/auth/callback`.
4. Cadastre o webhook do Mercado Pago em `https://karlaneuropsi.com.br/api/payments/mercadopago/webhook`.
5. Agende o cron contra `https://karlaneuropsi.com.br/api/notifications/dispatch`.

**Headers de segurança** (em `next.config.ts`, aplicados a todas as rotas):
Content-Security-Policy, `X-Content-Type-Options: nosniff`,
`X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy` e HSTS
(`max-age` de 2 anos, `includeSubDomains`, `preload`). `/admin/*` recebe
`Cache-Control: no-store` e `X-Robots-Tag: noindex`.

**Cache:** páginas institucionais usam ISR (5 min), vitrines 1 min, agenda e
painel são sempre dinâmicos.

## 14. Backup e recuperação

Não existe “botão de backup” na aplicação — backup de banco é responsabilidade
da infraestrutura, e um botão falso daria falsa segurança. Estratégia
recomendada:

**Banco de dados**

- *Point-in-Time Recovery* do Supabase (planos pagos): restauração para
  qualquer instante da janela de retenção. Ative em Database → Backups.
- Dump lógico periódico, guardado fora do Supabase:

  ```bash
  pg_dump "$DATABASE_URL" --no-owner --format=custom --file="karla-$(date +%F).dump"
  ```

- Restauração:

  ```bash
  pg_restore --no-owner --clean --if-exists --dbname "$DATABASE_URL" karla-AAAA-MM-DD.dump
  ```

**Storage**

```bash
supabase storage download --recursive ss:///patient-documents ./backup/patient-documents
supabase storage download --recursive ss:///products ./backup/products
supabase storage download --recursive ss:///public-assets ./backup/public-assets
```

**Retenção sugerida:** diário por 7 dias, semanal por 4 semanas, mensal por 12
meses. Documentos de paciente exigem armazenamento criptografado e acesso
restrito, como qualquer dado sensível.

**Código e configuração:** o repositório Git é o backup do código. Guarde as
variáveis de ambiente em um gerenciador de segredos — nunca em planilha,
e-mail ou no repositório.

**Teste de restauração:** restaure em um projeto Supabase de homologação a cada
trimestre e rode `./scripts/validate-db.sh`. Backup não testado não é backup.

## 15. LGPD

Implementado nesta aplicação:

- **Política de privacidade** detalhada em `/politica-de-privacidade`, com
  bases legais e prazos.
- **Registro de consentimento** (tabela `consents`) com data, hora, versão do
  termo, origem e *hash* do IP. O IP nunca é gravado em texto claro.
- **Direitos do titular** (art. 18) por formulário próprio, gravados em
  `data_subject_requests` e acompanhados no painel.
- **Anonimização** irreversível de paciente (`anonymize_patient`), restrita a
  OWNER/ADMIN, com confirmação digitada e registro em auditoria.
- **Minimização:** CPF é exibido mascarado por padrão; a auditoria de tabelas
  com dado pessoal guarda apenas *quais* campos mudaram, não os valores.
- **Controle de acesso** por papel no banco (RLS), não apenas na interface.
- **Trilha de auditoria** imutável pela aplicação: só existe política de
  leitura, para OWNER/ADMIN.
- **Sem cookies de rastreamento** ou de publicidade de terceiros.

Providências que dependem da profissional: nomear encarregado (DPO) se
aplicável, definir prazos de guarda conforme as normas do conselho profissional
e assinar contratos de operador com Supabase, Mercado Pago e provedor de
e-mail.

## 16. Manutenção

**Rotina**

- Semanal: revisar solicitações em `/admin/agenda` e mensagens em
  `/admin/notificacoes`.
- Mensal: conferir `/admin/financeiro`, revisar `/admin/auditoria` e rodar
  `npm audit`.
- Trimestral: testar restauração de backup e revisar acessos em
  `/admin/usuarios`.

**Publicação de artigos agendados**

Use “Publicar agendados” em `/admin/blog` ou agende no Supabase:

```sql
select cron.schedule(
  'publicar-artigos-agendados',
  '*/15 * * * *',
  $$select public.publish_scheduled_posts()$$
);
```

**Atualização de dependências**

```bash
npm outdated
npm update
npm run verify
```

**Onde mexer no quê**

| Preciso mudar… | Onde |
| --- | --- |
| Textos, contato, preços, SEO, módulos | `/admin/configuracoes` (sem código) |
| Grade de horários e feriados | `/admin/disponibilidade` |
| Serviços, produtos, infobooks, landing pages | Páginas correspondentes do painel |
| Conteúdo institucional padrão | `src/lib/content/defaults.ts` (ou registro em `site_pages`) |
| Paleta, tipografia, espaçamento | `tailwind.config.ts` e `src/app/globals.css` |
| Regras de permissão | `src/lib/auth/rbac.ts` **e** as policies em `009_rls.sql` |
