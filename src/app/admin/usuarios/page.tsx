import { Shield, UserPlus } from 'lucide-react';
import { Alert, Badge, Card, EmptyState } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { ActionButton } from '@/components/admin/forms';
import { RoleSelector } from '@/app/admin/usuarios/RoleSelector';
import { requirePermission } from '@/lib/auth/session';
import { listProfiles } from '@/lib/data/admin';
import { toggleUserActive, updateUserRole } from '@/app/admin/_actions/settings';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/auth/rbac';
import { formatDateTime } from '@/lib/utils/format';
import type { UserRole } from '@/lib/types';

const ROLES: UserRole[] = ['OWNER', 'ADMIN', 'PROFESSIONAL', 'ASSISTANT'];

export default async function UsuariosPage() {
  const session = await requirePermission('users:manage', '/admin/usuarios');
  const result = await listProfiles();

  return (
    <>
      <AdminPageHeader
        title="Usuários e permissões"
        description="Controle de acesso da equipe. Apenas a proprietária (OWNER) altera papéis."
      />

      <Alert tone="info" title="Como criar um novo acesso" className="mb-6">
        <p>
          Convide a pessoa pelo painel do Supabase (<strong>Authentication → Users → Invite</strong>
          ) ou peça que use &quot;Esqueci minha senha&quot; após a criação. O perfil é criado
          automaticamente com o papel <strong>Secretaria</strong> (menor privilégio) e você promove
          aqui.
        </p>
        <p className="mt-2">
          Nenhuma senha é definida por este sistema, e não existe senha padrão no código.
        </p>
      </Alert>

      {result.data.length === 0 ? (
        <EmptyState
          icon={<UserPlus aria-hidden="true" className="h-5 w-5" />}
          title="Nenhum usuário encontrado"
          description="Crie o primeiro usuário no painel do Supabase — ele se torna OWNER automaticamente."
        />
      ) : (
        <ul className="space-y-3">
          {result.data.map((profile) => {
            const isSelf = profile.id === session.id;

            return (
              <li key={profile.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-ink">
                          {profile.full_name || profile.email}
                        </p>
                        <Badge tone={profile.role === 'OWNER' ? 'sand' : 'neutral'}>
                          {ROLE_LABELS[profile.role]}
                        </Badge>
                        {isSelf ? <Badge tone="info">você</Badge> : null}
                        {!profile.is_active ? <Badge tone="danger">Desativado</Badge> : null}
                        {profile.is_public_author ? <Badge>Autoria pública</Badge> : null}
                      </div>

                      <p className="mt-1 text-sm text-ink-muted">{profile.email}</p>
                      <p className="mt-1.5 text-xs text-ink-faint">
                        {ROLE_DESCRIPTIONS[profile.role]}
                      </p>
                      {profile.last_sign_in_at ? (
                        <p className="mt-1 text-xs text-ink-faint">
                          Último acesso: {formatDateTime(profile.last_sign_in_at)}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-ink-faint">Nunca acessou</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isSelf ? (
                        <span className="text-xs text-ink-faint">
                          Você não pode alterar seu próprio papel
                        </span>
                      ) : (
                        <>
                          <RoleSelector
                            action={updateUserRole}
                            profileId={profile.id}
                            currentRole={profile.role}
                            roles={ROLES}
                          />
                          <ActionButton
                            action={toggleUserActive}
                            label={profile.is_active ? 'Desativar' : 'Reativar'}
                            variant="ghost"
                            fields={{ profileId: profile.id, isActive: !profile.is_active }}
                            confirm={
                              profile.is_active
                                ? {
                                    title: 'Desativar acesso?',
                                    description:
                                      'A pessoa perde o acesso ao painel imediatamente. O histórico é preservado.',
                                    confirmLabel: 'Desativar',
                                    danger: true,
                                  }
                                : undefined
                            }
                          />
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Card className="mt-8 bg-surface-muted">
        <h2 className="flex items-center gap-2 font-display text-base text-ink">
          <Shield aria-hidden="true" className="h-4 w-4 text-petrol-500" />
          Regras aplicadas pelo banco de dados
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-muted">
          <li>Ninguém pode alterar o próprio papel de acesso.</li>
          <li>Somente OWNER concede ou remove o papel OWNER.</li>
          <li>É obrigatório manter pelo menos um OWNER ativo.</li>
          <li>Financeiro é restrito a OWNER e ADMIN.</li>
          <li>Todas as alterações de papel ficam registradas na auditoria.</li>
        </ul>
        <p className="mt-3 text-xs text-ink-faint">
          Essas regras são triggers e políticas no PostgreSQL: valem mesmo para quem tentar burlar a
          interface.
        </p>
      </Card>
    </>
  );
}
