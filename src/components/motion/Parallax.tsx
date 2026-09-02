'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { useParallaxOffset, useReducedMotion } from './hooks';

export function Parallax({
  children,
  className,
  strength = 0.12,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  disabled?: boolean;
}) {
  const reduced = useReducedMotion();
  const [ref, offset] = useParallaxOffset(strength, !disabled && !reduced);

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn('motion-parallax', className)}
      style={{ transform: offset ? `translate3d(0, ${offset}px, 0)` : undefined }}
    >
      {children}
    </div>
  );
}
