# Checklist de produção — Karla Dias

Status objetivo. **Não declare 100%** enquanto houver item pendente.

**Marca pública:** Karla Dias (nunca “Karla Dias Neuropsi” como brand primária)  
**Identificadores:** domínio `karlaneuropsi.com.br` · Instagram `@karlaneuropsi`  
Projeto Supabase (ref): `oerlxsstjuyptnryhpyi`  
Migrations no remoto: `001`–`013`  
Encerramento técnico (esta passagem): 2026-09-01

## Status por área

| Área | Status |
| --- | --- |
| Site (rebrand público, nav, home, CTAs) | OK |
| Neuropsicologia | OK |
| Agendamento | OK |
| Agenda | OK |
| Pacientes | OK |
| Serviços | OK |
| Financeiro | OK |
| Blog / Calendário editorial (`scheduled_for` + `publish_scheduled_posts`) | OK |
| Novidades (`/novidades`) | OK |
| Infobooks (vitrine pública) | OK |
| PDF Online (UX pública removida; redirects + rewrites legacy) | PENDENTE DE ARQUIVO |
| Landing Pages (fora do nav/sitemap; admin + legacy OK) | PENDENTE DE ARQUIVO |
| Hotmart (2 produtos com URLs oficiais no banco) | OK |
| Supabase | OK |
| Database | OK |
| RLS | OK |
| Auth | OK |
| OWNER | OK |
| RBAC | OK |
| Storage | OK |
| LGPD | OK |
| Mercado Pago | PENDENTE DE CREDENCIAL |
| Email | PENDENTE DE CREDENCIAL |
| Cron | PENDENTE DE CREDENCIAL |
| SEO (sitemap sem PDF Online / LP) | OK |
| Acessibilidade | OK |
| Performance | OK |
| Segurança | OK |
| Domínio / DNS / HTTPS | PENDENTE OPERACIONAL |
| Deploy Vercel (token) | PENDENTE DE CREDENCIAL |
| Testes | OK |
| Build | OK |
| Foto profissional (moldura tipográfica verde no ar) | PENDENTE DE ARQUIVO |
| Bio / CRP / formação / especializações / e-mail / endereço / preços / depoimentos | PENDENTE DE DADO REAL |
| Legacy (`site_kaka.zip`) | PENDENTE DE ARQUIVO |

## UX pública vs legacy (decisão desta passagem)

- **Removido da experiência pública:** links/áreas de PDF Online e Landing Pages (nav, home, footer, `/publicacoes`, CTAs de infobooks, sitemap).
- **Mantido:** rewrites de arquivos legacy; redirects 301 `/pdf-online` → `/infobooks`, `/landing-pages` → `/materiais`; ferramentas admin de LP/infobooks.
- **Feature flag:** `enable_pdf_online = false` no banco e em `defaults.ts`.

## Busca do legacy (esta execução)

Procurou-se `site_kaka.zip` e foto profissional em disco, attachments, Git e domínio.

**Resultado:** arquivos **não encontrados**. Integração permanece pronta:

```bash
./scripts/import-legacy-zip.sh /caminho/para/site_kaka.zip
```

Foto: manter moldura tipográfica (`.photo-frame`); **não** inventar rosto com IA.

## Dados profissionais (estado no banco / defaults)

Presentes (reais): marca **Karla Dias**, posicionamento *Psicóloga e Neuropsicóloga*, headline *Especialista em Transtornos do Neurodesenvolvimento*, WhatsApp `5511988830377`, Instagram `@karlaneuropsi`, SEO básico, serviços seed (sem preço público), 2 produtos Hotmart.

Pendentes (não inventados): CRP, bio, formação, especializações, foto, e-mail público, endereço, preços, OG image, depoimentos.

Editar em `/admin/configuracoes` quando a profissional fornecer.

## Credenciais (presença no ambiente)

| Variável | Estado |
| --- | --- |
| Supabase URL / anon / service role | SET |
| `MERCADOPAGO_ACCESS_TOKEN` / webhook | MISSING |
| `EMAIL_API_KEY` / `EMAIL_FROM` | MISSING (`EMAIL_PROVIDER=log`) |
| `CRON_SECRET` | MISSING |
| Token Vercel CLI / deploy | MISSING |

Checkout e cron respondem `503` com erro claro (sem token no client).

## Domínio

`karlaneuropsi.com.br` / `www` — **sem DNS**. Auth redirects de produção já cadastrados no Supabase. Não alterar DNS sem autorização.

## Evidências técnicas desta passagem

- `npm test` · lint · typecheck · build · `db:validate` · `npm audit`
- RLS `013`: ASSISTANT não lê `private_*`; OWNER lê
- Double booking remoto: segundo request → `SLOT_TAKEN`
- DEMO = 0
- Rotas públicas 200; `/admin/*` → 307 `/login`
- `.env.local` gitignored

## Ações humanas restantes (bloqueiam go-live completo)

1. Anexar foto profissional + `site_kaka.zip` e rodar o import
2. Preencher dados reais (CRP, bio, formação, etc.) em `/admin/configuracoes`
3. Configurar Mercado Pago + e-mail + `CRON_SECRET` no provedor de hospedagem
4. Autorizar e apontar DNS/HTTPS do domínio
5. Conectar token Vercel (ou hospedagem equivalente) para deploy de produção
