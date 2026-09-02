'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { MOTION } from './config';
import { useInViewOnce, useReducedMotion } from './hooks';

export function RevealImage({
  children,
  className,
  delay = 0,
  variant = 'scale',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: 'scale' | 'fade-up' | 'mask';
}) {
  const reduced = useReducedMotion();
  const [ref, visible] = useInViewOnce<HTMLDivElement>(reduced);

  return (
    <div
      ref={ref}
      className={cn(
        'motion-image-reveal overflow-hidden',
        variant === 'mask' && 'motion-image-reveal--mask',
        className,
      )}
    >
      <div
        className={cn(
          'motion-reveal',
          variant === 'scale' ? 'motion-reveal--scale' : 'motion-reveal--fade-up',
          visible && 'motion-visible',
        )}
        style={
          {
            '--motion-delay': `${delay}ms`,
            '--motion-duration': `${MOTION.duration.slow}s`,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}
