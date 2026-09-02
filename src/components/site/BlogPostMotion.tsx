'use client';

import type { ReactNode } from 'react';
import { Reveal, RevealImage } from '@/components/motion';

export function BlogPostHeroMotion({ children }: { children: ReactNode }) {
  return <Reveal variant="fade-up">{children}</Reveal>;
}

export function BlogPostCoverMotion({ children }: { children: ReactNode }) {
  return (
    <RevealImage variant="mask" className="overflow-hidden rounded-2xl">
      {children}
    </RevealImage>
  );
}

export function BlogPostBodyMotion({ children }: { children: ReactNode }) {
  return (
    <Reveal variant="fade-up" delay={80}>
      {children}
    </Reveal>
  );
}

export function BlogPostAuthorMotion({ children }: { children: ReactNode }) {
  return (
    <Reveal variant="fade-up" delay={120}>
      {children}
    </Reveal>
  );
}
