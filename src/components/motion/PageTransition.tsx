'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { useReducedMotion } from './hooks';

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  return (
    <div
      key={reduced ? 'static' : pathname}
      className={cn('motion-page', !reduced && 'motion-page--enter')}
    >
      {children}
    </div>
  );
}
