'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/** Hero interno — animação imediata (sem esperar scroll). */
export function PageHeroMotion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <header className="surface-warm border-b border-sand-200/70">
      <div
        className={cn('motion-hero-item', className)}
        style={{ '--motion-delay': '80ms' } as React.CSSProperties}
      >
        {children}
      </div>
    </header>
  );
}
