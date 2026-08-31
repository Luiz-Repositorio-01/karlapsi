import Link from 'next/link';
import { ArrowRight, Home, Search } from 'lucide-react';
import { ButtonLink, Container } from '@/components/ui';

/** Página 404 — linguagem humana e caminhos úteis, sem detalhe técnico. */
export default function NotFound() {
  const suggestions = [
    { label: 'Neuropsicologia', href: '/neuropsicologia' },
    { label: 'Serviços', href: '/servicos' },
    { label: 'Agendamento', href: '/agendamento' },
    { label: 'Blog', href: '/blog' },
    { label: 'Infobooks', href: '/infobooks' },
    { label: 'PDF Online', href: '/pdf-online' },
    { label: 'Contato', href: '/contato' },
  ];

  return (
    <main className="flex min-h-dvh items-center surface-warm">
      <Container size="narrow" className="py-20 text-center">
        <p className="eyebrow">Erro 404</p>
        <h1 className="mt-4 text-display-lg">Não encontramos esta página</h1>
        <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-ink-muted">
          O endereço pode ter mudado ou o link pode estar incompleto. Nada foi perdido — abaixo estão
          os caminhos mais procurados.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" size="lg">
            <Home aria-hidden="true" className="h-4 w-4" />
            Ir para o início
          </ButtonLink>
          <ButtonLink href="/agendamento" variant="secondary" size="lg">
            Agendar atendimento
          </ButtonLink>
        </div>

        <nav aria-label="Páginas sugeridas" className="mt-12">
          <p className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-faint">
            <Search aria-hidden="true" className="h-3.5 w-3.5" />
            Talvez você procure
          </p>
          <ul className="mt-5 flex flex-wrap justify-center gap-2">
            {suggestions.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-sm font-medium text-petrol-800 ring-1 ring-petrol-200 transition-colors hover:bg-petrol-50"
                >
                  {item.label}
                  <ArrowRight aria-hidden="true" className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </main>
  );
}
