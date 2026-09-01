import { Card, FormField, fieldAria, inputClasses } from '@/components/ui';
import { AdminPageHeader } from '@/components/admin/AdminShell';
import { ActionForm } from '@/components/admin/forms';
import { requireSession } from '@/lib/auth/session';
import { updateOwnProfile } from '@/app/admin/_actions/settings';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/auth/rbac';
import { cn } from '@/lib/utils/cn';
import { formatDateTime } from '@/lib/utils/format';

export default async function PerfilPage() {
  const session = await requireSession('/admin/perfil');
  const { profile } = session;

  return (
    <>
      <AdminPageHeader
        title="Meu perfil"
        description="Seus dados e a assinatura usada como autoria nos artigos do blog."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <ActionForm action={updateOwnProfile} submitLabel="Salvar perfil" pendingLabel="Salvando…">
            {(state) => (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Nome completo"
                  htmlFor="perfil-nome"
                  required
                  error={state.fields?.fullName}
                  className="sm:col-span-2"
                >
                  <input
                    {...fieldAria('perfil-nome', { error: Boolean(state.fields?.fullName) })}
                    type="text"
                    name="fullName"
                    defaultValue={profile.full_name}
                    className={inputClasses}
                    required
                  />
                </FormField>

                <FormField label="Telefone" htmlFor="perfil-telefone">
                  <input
                    {...fieldAria('perfil-telefone', {})}
                    type="tel"
                    name="phone"
                    defaultValue={profile.phone ?? ''}
                    className={inputClasses}
                  />
                </FormField>

                <FormField
                  label="Especialidade / atuação"
                  htmlFor="perfil-especialidade"
                  hint="Aparece junto da assinatura nos artigos"
                >
                  <input
                    {...fieldAria('perfil-especialidade', { hint: true })}
                    type="text"
                    name="specialty"
                    defaultValue={profile.specialty ?? ''}
                    className={inputClasses}
                  />
                </FormField>

                <FormField
                  label="Foto (URL)"
                  htmlFor="perfil-foto"
                  hint="Bucket public-assets do Supabase Storage"
                  className="sm:col-span-2"
                >
                  <input
                    {...fieldAria('perfil-foto', { hint: true })}
                    type="text"
                    name="avatarUrl"
                    defaultValue={profile.avatar_url ?? ''}
                    className={inputClasses}
                  />
                </FormField>

                <FormField
                  label="Mini bio"
                  htmlFor="perfil-bio"
                  hint="Texto curto exibido ao final dos artigos. Publique apenas informação verdadeira."
                  className="sm:col-span-2"
                >
                  <textarea
                    {...fieldAria('perfil-bio', { hint: true })}
                    name="bio"
                    rows={5}
                    defaultValue={profile.bio ?? ''}
                    className={cn(inputClasses, 'resize-y')}
                  />
                </FormField>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-surface-muted p-4 text-sm text-ink-soft sm:col-span-2">
                  <input
                    type="checkbox"
                    name="isPublicAuthor"
                    defaultChecked={profile.is_public_author}
                    className="mt-0.5 h-4 w-4 accent-petrol-700"
                  />
                  <span>
                    Exibir como autor(a) no site público
                    <span className="mt-0.5 block text-xs text-ink-faint">
                      Torna nome, foto, especialidade e mini bio visíveis nos artigos.
                    </span>
                  </span>
                </label>
              </div>
            )}
          </ActionForm>
        </Card>

        <aside className="space-y-4">
          <Card>
            <h2 className="font-display text-base text-ink">Acesso</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-faint">E-mail</dt>
                <dd className="mt-0.5 break-words text-ink-soft">{session.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-faint">Papel</dt>
                <dd className="mt-0.5 text-ink-soft">{ROLE_LABELS[profile.role]}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-faint">Permissões</dt>
                <dd className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                  {ROLE_DESCRIPTIONS[profile.role]}
                </dd>
              </div>
              {profile.last_sign_in_at ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-faint">Último acesso</dt>
                  <dd className="mt-0.5 text-ink-soft">
                    {formatDateTime(profile.last_sign_in_at)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card className="bg-surface-muted">
            <h2 className="font-display text-base text-ink">Senha e segurança</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Para trocar a senha, saia da conta e use &quot;Esqueci minha senha&quot; na tela de
              acesso: o link chega por e-mail e a nova senha é definida com validação de força.
              Alterações de papel são feitas apenas pela proprietária.
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
