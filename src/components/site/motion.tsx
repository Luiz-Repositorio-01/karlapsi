'use client';

import { CalendarCheck } from 'lucide-react';
import { ButtonLink, Container } from '@/components/ui';
import { ProfessionalPortrait } from '@/components/site/ProfessionalPortrait';
import { Magnetic, Parallax, ScrollIndicator } from '@/components/motion';
import { MOTION } from '@/components/motion/config';

export function HomeHero({
  displayName,
  positioning,
  headline,
  shortBio,
  subheadline,
  photoUrl,
  registrationLabel,
  registrationValue,
}: {
  displayName: string;
  positioning: string;
  headline: string;
  shortBio?: string;
  subheadline?: string;
  photoUrl?: string | null;
  registrationLabel?: string;
  registrationValue?: string;
}) {
  const subtitle = shortBio ? shortBio.split('\n\n')[0] : subheadline;

  return (
    <section className="relative overflow-hidden surface-warm" aria-labelledby="hero-title">
      {/* Fundo cinematográfico */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 motion-hero-bg">
        <div className="motion-hero-bg__layer motion-hero-bg__layer--1" />
        <div className="motion-hero-bg__layer motion-hero-bg__layer--2" />
        <Parallax strength={0.08} className="absolute -right-16 top-10 h-64 w-64 opacity-40 sm:h-80 sm:w-80">
          <div className="h-full w-full rounded-full bg-petrol-300/20 blur-3xl" />
        </Parallax>
        <Parallax strength={0.06} className="absolute -left-10 bottom-0 h-48 w-48 opacity-30">
          <div className="h-full w-full rounded-full bg-sand-300/30 blur-3xl" />
        </Parallax>
      </div>

      <Container className="relative py-16 sm:py-20 lg:py-28">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14">
          <div className="flex max-w-xl flex-col justify-center">
            <p
              className="motion-hero-item font-display text-display-xl leading-none text-petrol-800"
              style={{ '--motion-delay': `${MOTION.heroSequence.name}ms` } as React.CSSProperties}
            >
              {displayName}
            </p>
            <p
              className="motion-hero-item mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-petrol-600"
              style={{ '--motion-delay': `${MOTION.heroSequence.positioning}ms` } as React.CSSProperties}
            >
              {positioning}
            </p>

            <h1
              id="hero-title"
              className="motion-hero-item mt-6 text-display-sm text-ink-soft sm:text-display-md"
              style={{ '--motion-delay': `${MOTION.heroSequence.title}ms` } as React.CSSProperties}
            >
              {headline}
            </h1>

            {subtitle ? (
              <p
                className="motion-hero-item mt-5 text-base leading-relaxed text-ink-muted sm:text-lg"
                style={{ '--motion-delay': `${MOTION.heroSequence.subtitle}ms` } as React.CSSProperties}
              >
                {subtitle}
              </p>
            ) : null}

            <div
              className="motion-hero-item mt-9 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap"
              style={{ '--motion-delay': `${MOTION.heroSequence.cta}ms` } as React.CSSProperties}
            >
              <Magnetic>
                <ButtonLink href="/agendamento" size="lg" className="w-full sm:w-auto">
                  <CalendarCheck aria-hidden="true" className="h-4 w-4" />
                  Agendar atendimento
                </ButtonLink>
              </Magnetic>
              <ButtonLink href="/sobre" variant="secondary" size="lg" className="w-full sm:w-auto">
                Conheça meu trabalho
              </ButtonLink>
            </div>
          </div>

          <div
            className="motion-hero-item motion-hero-portrait relative"
            style={{ '--motion-delay': `${MOTION.heroSequence.portrait}ms` } as React.CSSProperties}
          >
            <ProfessionalPortrait
              name={displayName}
              positioning={positioning}
              headline={headline}
              photoUrl={photoUrl}
              registrationLabel={registrationLabel}
              registrationValue={registrationValue}
              priority
              className="w-full max-w-none"
            />
          </div>
        </div>

        <div
          className="motion-hero-item mt-12 hidden justify-center lg:flex"
          style={{ '--motion-delay': `${MOTION.heroSequence.scrollHint}ms` } as React.CSSProperties}
        >
          <ScrollIndicator />
        </div>
      </Container>
    </section>
  );
}
