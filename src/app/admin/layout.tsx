import type { Metadata } from 'next';
import { Alert, Container } from '@/components/ui';
import { AdminShell } from '@/components/admin/AdminShell';
import { ADMIN_NAV } from '@/components/admin/navigation';
import { requireSession } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { countUnreadNotifications } from '@/lib/data/admin';
import { getSiteSettings } from '@/lib/data/public';
import { isSupabaseConfigured } from '@/lib/env';
import { signOut } from '@/app/login/_actions';

export const metadata: Metadata = {
  title: 'Painel',
  robots: { index: false, follow: false },
};

// O painel sempre reflete o estado atual do banco.
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Sem Supabase configurado não há como autenticar: mostramos instruções em
  // vez de um loop de redirecionamento para o login.
  if (!isSupabaseConfigured()) {
    return (
      <main className="flex min-h-dvh items-center bg-surface-muted py-12">
        <Container size="narrow">
          <Alert tone="warning" title="Painel aguardando configuração do Supabase">
            <p>
              A área administrativa depende do Supabase para autenticação e dados. Defina as
              variáveis <code>NEXT_PUBLIC_SUPABASE_URL</code>,{' '}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> e <code>SUPABASE_SERVICE_ROLE_KEY</code>,
              aplique as migrations de <code>supabase/migrations</code> e crie o primeiro usuário
              OWNER conforme o README.
            </p>
            <p className="mt-3">
              O site público continua funcionando normalmente com o conteúdo padrão.
            </p>
          </Alert>
        </Container>
      </main>
    );
  }

  const session = await requireSession();
  const [settings, unreadCount] = await Promise.all([
    getSiteSettings(),
    countUnreadNotifications(),
  ]);

  // Filtro de menu por papel: o link nem chega ao HTML se não houver permissão.
  const groups = ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(session.profile.role, item.permission)),
  })).filter((group) => group.items.length > 0);

  return (
    <AdminShell
      groups={groups}
      user={{
        name: session.profile.full_name,
        email: session.email,
        role: session.profile.role,
      }}
      unreadCount={unreadCount}
      brandName={settings.identity.brand_name}
      signOutAction={signOut}
    >
      {children}
    </AdminShell>
  );
}
