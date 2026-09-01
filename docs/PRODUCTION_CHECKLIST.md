# Checklist de produção — Karla Dias Neuropsi

Status objetivo. **Não declare 100%** enquanto houver item pendente.

Projeto Supabase (ref): `oerlxsstjuyptnryhpyi`  
Migrations aplicadas no remoto: `001`–`013`  
Última auditoria contínua: 2026-09-01

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
| Testes | OK |
| Build | OK |
| Domínio | PENDENTE OPERACIONAL |
| Conteúdo profissional (CRP/bio/foto/preços reais) | PENDENTE DE DADO REAL |
| Legacy (ZIP/assets originais) | PENDENTE DE ARQUIVO |

## Evidências desta execução

- Rotas públicas (`/`, `/sobre`, `/neuropsicologia`, `/servicos`, `/atendimentos`, `/blog`, `/infobooks`, `/landing-pages`, `/pdf-online`, `/agendamento`, `/contato`, legal, `/login`): HTTP 200.
- `/admin/*` sem sessão → redirect `/login`.
- 404 humano sem stack; CSP/HSTS/nosniff presentes.
- CRUD remoto (paciente, serviço, blog, produto) + limpeza DEMO (0 resíduos).
- Booking público + conflito `SLOT_TAKEN` (double booking impedido no banco).
- Storage: upload público + documento privado com signed URL; anon bloqueado no bucket privado.
- RBAC: ASSISTANT não altera settings/`private_*`, não lê pagamentos nem audit; OWNER lê/escreve.
- Checkout Mercado Pago sem token → `503 MERCADOPAGO_NOT_CONFIGURED`.
- Cron sem/`CRON_SECRET` inválido → `503`.
- `npm audit`: 0 vulnerabilidades.
- Migrations `001`–`013` no remoto (`013` restringe `private_%` a OWNER/ADMIN).

## Pendências que exigem ação humana

1. **Arquivos legacy** em `public/legacy/` (PDF Online, Infobooks, Landing Pages).
2. **Credenciais:** `MERCADOPAGO_*`, `EMAIL_*`, `CRON_SECRET`.
3. **Dados reais** em `/admin/configuracoes` (CRP, bio, foto, preços — sem inventar).
4. **DNS/HTTPS** para `karlaneuropsi.com.br` / `www` (sem alterar DNS sem autorização).

## Próximo passo humano (OWNER)

OWNER ativo (`karladiaspsicologa@gmail.com`, login confirmado).  
Go-live: preencher dados reais → enviar legacy → configurar MP/e-mail/cron → apontar DNS → smoke no domínio final.
