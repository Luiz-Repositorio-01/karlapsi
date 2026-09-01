# Checklist de produção — Karla Dias Neuropsi

Status objetivo. **Não declare 100%** enquanto houver item pendente.

Projeto Supabase (ref): `oerlxsstjuyptnryhpyi`  
Migrations no remoto: `001`–`013`  
Encerramento técnico: 2026-09-01

## Status por área

| Área | Status |
| --- | --- |
| Site | OK |
| Neuropsicologia | OK |
| Agendamento | OK |
| Agenda | OK |
| Pacientes | OK |
| Serviços | OK |
| Financeiro | OK |
| Blog | OK |
| Infobooks | PENDENTE DE ARQUIVO |
| PDF Online | PENDENTE DE ARQUIVO |
| Landing Pages | PENDENTE DE ARQUIVO |
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
| SEO | OK |
| Acessibilidade | OK |
| Performance | OK |
| Segurança | OK |
| Domínio | PENDENTE OPERACIONAL |
| Testes | OK |
| Build | OK |
| Conteúdo profissional (CRP/bio/foto/formação/especializações/e-mail/endereço/Instagram/preços) | PENDENTE DE DADO REAL |
| Legacy (`site_kaka.zip`) | PENDENTE DE ARQUIVO |

## Busca do legacy (esta execução)

Procurou-se `site_kaka.zip` em:

- `/workspace`, `/home/ubuntu`, `/tmp`, `/opt/cursor`, `/mnt`, attachments
- histórico Git / objetos / releases GitHub
- domínio `karlaneuropsi.com.br` (DNS **sem registros A/AAAA**; host não resolve)

**Resultado:** arquivo **não encontrado**. Integração permanece pronta:

```bash
./scripts/import-legacy-zip.sh /caminho/para/site_kaka.zip
```

## Dados profissionais (estado no banco)

Presentes (reais): marca, nome profissional, WhatsApp `5511988830377`, SEO básico, serviços seed (sem preço público).

Pendentes (não inventados): CRP, bio, formação, especializações, foto, e-mail público, Instagram, endereço, preços, OG image.

Editar em `/admin/configuracoes` quando a profissional fornecer.

## Credenciais (presença no ambiente)

| Variável | Estado |
| --- | --- |
| Supabase URL / anon / service role | SET |
| `MERCADOPAGO_ACCESS_TOKEN` / webhook | MISSING |
| `EMAIL_API_KEY` / `EMAIL_FROM` | MISSING (`EMAIL_PROVIDER=log`) |
| `CRON_SECRET` | MISSING |

Checkout e cron respondem `503` com erro claro (sem token no client).

## Domínio

`karlaneuropsi.com.br` / `www` — **sem DNS**. Auth redirects de produção já cadastrados no Supabase. Não alterar DNS sem autorização.

## Evidências técnicas desta passagem

- `npm test` 91 · lint · typecheck · build · `db:validate` · `npm audit` 0
- RLS `013`: ASSISTANT não lê `private_*`; OWNER lê
- Double booking remoto: segundo request → `SLOT_TAKEN`
- DEMO = 0
- Rotas públicas 200; `/admin/*` → 307 `/login`
- `.env.local` gitignored

## Ações humanas restantes (bloqueiam go-live completo)

1. Anexar `site_kaka.zip` e rodar `./scripts/import-legacy-zip.sh`
2. Preencher dados reais em `/admin/configuracoes`
3. Configurar Mercado Pago + e-mail + `CRON_SECRET` no provedor de hospedagem
4. Autorizar e apontar DNS/HTTPS do domínio
