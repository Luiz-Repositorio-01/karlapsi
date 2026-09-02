'use client';

import type { ReactNode } from 'react';
import { Reveal } from '@/components/motion';

export function LegalPageMotion({
  content,
  aside,
}: {
  content: ReactNode;
  aside?: ReactNode;
}) {
  if (!aside) {
    return <Reveal variant="fade-up">{content}</Reveal>;
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
      <Reveal variant="slide-right">{content}</Reveal>
      <Reveal variant="slide-left" delay={120}>
        {aside}
      </Reveal>
    </div>
  );
}
