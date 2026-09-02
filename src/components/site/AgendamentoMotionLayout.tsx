'use client';

import type { ReactNode } from 'react';
import { Reveal, Stagger } from '@/components/motion';

export function AgendamentoMotionLayout({
  wizard,
  asideItems,
  asideFooter,
}: {
  wizard: ReactNode;
  asideItems: ReactNode[];
  asideFooter?: ReactNode;
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14">
      <Reveal variant="fade-up">{wizard}</Reveal>
      <Reveal variant="slide-left" delay={120}>
        <aside className="space-y-4">
          <Stagger stagger={90} className="space-y-4">
            {asideItems}
          </Stagger>
          {asideFooter}
        </aside>
      </Reveal>
    </div>
  );
}
