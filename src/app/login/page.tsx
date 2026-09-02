import Link from 'next/link';
import { Brain, ShieldCheck } from 'lucide-react';
import { Alert, Card, Container } from '@/components/ui';
import { LoginForm } from '@/app/login/LoginForm';
import { getSiteSettings } from '@/lib/data/public';
import { isSupabaseConfigured } from '@/lib/env';
import { buildMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return buildMetadata({
    title: 'Área profissional',
    description: 'Acesso restrito à equipe.',
    path: '/login',
    noIndex: true,
  });
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const [{ redirectTo }, settings] = await Promise.all([searchParams, getSiteSettings()]);
  const safeRedirect = redirectTo?.startsWith('/admin') ? redirectTo : '/admin';

  return (
    <main className="flex min-h-dvh items-center surface-warm py-12">
      <a href="#login-form" className="skip-link">
        Pular para o formulário de login
      </a>
      <Container size="narrow">
        <div className="mx-auto max-w-md">
          <Link href="/" className="flex flex-col items-center text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-petrol-700">
              <Brain aria-hidden="true" className="h-5 w-5 text-white" />
            </span>
            <span className="mt-3 font-display text-lg text-ink">
              {settings.identity.brand_name}
            </span>
            <span className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-petrol-600">
              {settings.identity.positioning}
            </span>
          </Link>

          <div id="login-form" tabIndex={-1} className="outline-none">
          <Card className="mt-8 shadow-card">
            {!isSupabaseConfigured() ? (
              <Alert tone="warning" title="Autenticação não configurada" className="mb-6">
                As credenciais do Supabase ainda não foram informadas neste ambiente. Configure
                <code className="mx-1">NEXT_PUBLIC_SUPABASE_URL</code> e
                <code className="mx-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> para habilitar o login.
              </Alert>
            ) : null}

            <LoginForm redirectTo={safeRedirect} />
          </Card>
          </div>

          <p className="mt-6 flex items-start justify-center gap-2 px-4 text-center text-xs leading-relaxed text-ink-faint">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Acessos e ações administrativas são registrados em trilha de auditoria. Credenciais são
            pessoais e não devem ser compartilhadas.
          </p>
        </div>
      </Container>
    </main>
  );
}
