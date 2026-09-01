import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { ButtonLink, Card, Container, Section, SectionHeader } from '@/components/ui';
import { Accordion } from '@/components/ui/interactive';
import { cn } from '@/lib/utils/cn';
import { whatsappLink } from '@/lib/utils/format';
import type { Faq, SitePage, SitePageSection } from '@/lib/types';

/** Cabeçalho padrão das páginas internas do site público. */
export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumb,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <header className="surface-warm border-b border-sand-200/70">
      <Container className="pb-14 pt-12 sm:pb-16 sm:pt-16">
        {breadcrumb && breadcrumb.length > 0 ? (
          <nav aria-label="Você está aqui" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
              <li>
                <Link href="/" className="transition-colors hover:text-petrol-700">
                  Início
                </Link>
              </li>
              {breadcrumb.map((item, index) => (
                <li key={item.label} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="text-ink-faint">
                    /
                  </span>
                  {item.href && index < breadcrumb.length - 1 ? (
                    <Link href={item.href} className="transition-colors hover:text-petrol-700">
                      {item.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="font-medium text-ink-soft">
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-3 max-w-3xl text-display-lg">{title}</h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">{description}</p>
        ) : null}
        {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
      </Container>
    </header>
  );
}

/** Renderiza as seções editáveis de uma página institucional. */
export function SitePageSections({ page }: { page: SitePage }) {
  return (
    <>
      {page.sections.map((section, index) => (
        <Section key={section.id} tone={index % 2 === 1 ? 'muted' : 'default'} id={section.id}>
          <Container>
            <SitePageSectionBlock section={section} />
          </Container>
        </Section>
      ))}
    </>
  );
}

export function SitePageSectionBlock({ section }: { section: SitePageSection }) {
  return (
    <div>
      <h2 className="text-display-sm">{section.heading}</h2>
      {section.body ? (
        <p className="article-body mt-4 max-w-3xl">{section.body}</p>
      ) : null}

      {section.items && section.items.length > 0 ? (
        <ul
          className={cn(
            'mt-8 grid gap-4',
            section.items.length > 2 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2',
          )}
        >
          {section.items.map((item) => (
            <li key={item.title}>
              <Card className="h-full">
                <p className="font-display text-base text-ink">{item.title}</p>
                {item.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.description}</p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function FaqSection({
  faqs,
  title = 'Perguntas frequentes',
  description,
  tone = 'muted',
  id = 'faq',
}: {
  faqs: Faq[];
  title?: string;
  description?: string;
  tone?: 'default' | 'muted' | 'sunken';
  id?: string;
}) {
  if (faqs.length === 0) return null;

  return (
    <Section tone={tone} id={id} ariaLabelledBy={`${id}-title`}>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
          <SectionHeader
            id={`${id}-title`}
            eyebrow="Dúvidas"
            title={title}
            description={description}
          />
          <Accordion
            items={faqs.map((faq) => ({
              id: faq.id,
              question: faq.question,
              answer: faq.answer,
            }))}
          />
        </div>
      </Container>
    </Section>
  );
}

export function CTASection({
  title,
  description,
  whatsapp,
  primaryHref = '/agendamento',
  primaryLabel = 'Agendar atendimento',
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  description?: string;
  whatsapp?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <Section tone="deep" ariaLabelledBy="cta-title">
      <Container>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,20rem)]">
          <div>
            <h2 id="cta-title" className="text-display-md text-white">
              {title}
            </h2>
            {description ? (
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-petrol-100">{description}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <ButtonLink href={primaryHref} variant="onDark" size="lg" className="w-full">
              {primaryLabel}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </ButtonLink>

            {secondaryHref && secondaryLabel ? (
              <ButtonLink href={secondaryHref} variant="outlineOnDark" size="lg" className="w-full">
                {secondaryLabel}
              </ButtonLink>
            ) : null}

            {whatsapp ? (
              <ButtonLink
                href={whatsappLink(whatsapp, 'Olá! Vim pelo site e gostaria de informações.')}
                external
                variant="outlineOnDark"
                size="lg"
                className="w-full"
              >
                <MessageCircle aria-hidden="true" className="h-4 w-4" />
                Falar pelo WhatsApp
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}

/** Grade de destaques em texto (usada na Home e em páginas de conteúdo). */
export function HighlightGrid({
  items,
  columns = 3,
}: {
  items: { title: string; description: string }[];
  columns?: 2 | 3;
}) {
  return (
    <ul
      className={cn(
        'grid gap-5',
        columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2',
      )}
    >
      {items.map((item) => (
        <li key={item.title}>
          <Card className="h-full">
            <p className="font-display text-lg text-ink">{item.title}</p>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{item.description}</p>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function StepList({
  steps,
}: {
  steps: { step: string; title: string; description: string }[];
}) {
  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((item) => (
        <li key={item.step}>
          <div className="relative h-full rounded-2xl bg-surface p-6 ring-1 ring-petrol-100">
            <span className="font-display text-3xl text-petrol-200">{item.step}</span>
            <p className="mt-3 font-display text-lg text-ink">{item.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
