'use client';

import type { ReactNode } from 'react';
import { Reveal, RevealImage } from '@/components/motion';

/** Layout animado para páginas de detalhe com conteúdo + sidebar opcional. */
export function DetailPageMotion({
  content,
  sidebar,
  image,
}: {
  content: ReactNode;
  sidebar: ReactNode;
  image?: ReactNode;
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
      <div className="space-y-8">
        {image ? (
          <RevealImage variant="mask" className="max-w-prose overflow-hidden rounded-2xl">
            {image}
          </RevealImage>
        ) : null}
        <Reveal variant="slide-right" delay={image ? 80 : 0}>
          {content}
        </Reveal>
      </div>
      <Reveal variant="slide-left" delay={140}>
        {sidebar}
      </Reveal>
    </div>
  );

}
