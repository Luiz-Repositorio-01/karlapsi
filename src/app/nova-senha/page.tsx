import { Card, Container } from '@/components/ui';
import { NewPasswordForm } from '@/app/nova-senha/NewPasswordForm';
import { buildMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return buildMetadata({ title: 'Definir nova senha', path: '/nova-senha', noIndex: true });
}

export default function NovaSenhaPage() {
  return (
    <main className="flex min-h-dvh items-center surface-warm py-12">
      <Container size="narrow">
        <div className="mx-auto max-w-md">
          <Card>
            <h1 className="font-display text-2xl text-ink">Definir nova senha</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Escolha uma senha forte: ao menos 10 caracteres, com letras maiúsculas, minúsculas e
              número.
            </p>
            <div className="mt-6">
              <NewPasswordForm />
            </div>
          </Card>
        </div>
      </Container>
    </main>
  );
}
