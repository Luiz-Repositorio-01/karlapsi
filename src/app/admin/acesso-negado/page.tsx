import { ShieldOff } from 'lucide-react';
import { ButtonLink, Card } from '@/components/ui';
import { requireSession } from '@/lib/auth/session';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/auth/rbac';

/** Exibida quando o papel do usuário não cobre a área solicitada. */
export default async function AcessoNegadoPage() {
  const session = await requireSession('/admin');

  return (
    <div className="mx-auto max-w-lg py-12">
      <Card className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
          <ShieldOff aria-hidden="true" className="h-5 w-5 text-amber-600" />
        </span>

        <h1 className="mt-5 font-display text-2xl text-ink">Acesso não permitido</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Seu perfil (<strong>{ROLE_LABELS[session.profile.role]}</strong>) não tem permissão para
          esta área. {ROLE_DESCRIPTIONS[session.profile.role]}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Se você precisa deste acesso, fale com a proprietária da conta para ajustar suas
          permissões.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/admin">Voltar ao painel</ButtonLink>
          <ButtonLink href="/admin/perfil" variant="secondary">
            Ver meu perfil
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
