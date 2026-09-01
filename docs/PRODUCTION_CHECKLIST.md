# Checklist de produção — Karla Dias Neuropsi

Status objetivo. **Não declare 100%** enquanto houver item pendente.

Projeto Supabase (ref): `oerlxsstjuyptnryhpyi`

| Área | Resultado |
| --- | --- |
| Supabase | OK (conectado) |
| CLI | OK |
| Database | OK (remoto) |
| Migrations `001`–`012` | OK (`db push`) |
| RLS | OK (local + remoto: anon bloqueado em pacientes/pagamentos/documentos) |
| Auth | OK (redirects exatos + MFA/confirmations restaurados) |
| OWNER | OK (profile ativo; sessão/refresh/logout + RLS admin testados sem senha inventada) |
| RBAC | OK (OWNER acesso completo no remoto; anon sem escrita admin) |
| Storage | OK (buckets + MIME; privado com signed URL; anon bloqueado) |
| Pacientes | OK (CRUD DEMO remoto + limpeza) |
| Serviços | OK (CRUD DEMO remoto + limpeza; seed público ativo) |
| Agenda | OK (RPC pública + `SLOT_TAKEN` em conflito; DEMO removido) |
| Blog | OK (publish DEMO + limpeza) |
| Configurações | OK (persistência + restore no remoto) |
| Testes | OK |
| Build | OK |
| Legacy | PENDENTE DE ARQUIVO |
| Mercado Pago | PENDENTE DE CREDENCIAL |
| Email | PENDENTE DE CREDENCIAL |
| Cron | PENDENTE DE CREDENCIAL |
| Conteúdo profissional (CRP/bio/foto) | PENDENTE DE DADO REAL |

## Próximo passo humano (OWNER)

OWNER ativo com login confirmado (`last_sign_in` presente).
Continue o go-live com dados reais em `/admin/configuracoes` e, quando houver,
credenciais de Mercado Pago / e-mail / cron e arquivos em `public/legacy/`.
