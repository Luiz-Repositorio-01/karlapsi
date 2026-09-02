'use client';

import type { ReactNode } from 'react';
import { Reveal } from '@/components/motion';

export function SobreMotionLayout({
  sidebar,
  main,
}: {
  sidebar: ReactNode;
  main: ReactNode;
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12 xl:gap-16">
      <Reveal variant="slide-right" className="lg:col-span-4 xl:col-span-4">
        {sidebar}
      </Reveal>
      <Reveal
        variant="slide-left"
        delay={120}
        className="flex flex-col gap-10 lg:col-span-8 xl:col-span-8"
      >
        {main}
      </Reveal>
    </div>
  );
}
