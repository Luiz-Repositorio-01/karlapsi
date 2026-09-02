'use client';

import type { ReactNode } from 'react';
import { Reveal } from '@/components/motion';

export function MotionBlock({
  children,
  className,
  delay = 0,
  variant = 'fade-up',
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale' | 'blur-up';
  as?: 'div' | 'section' | 'article';
}) {
  return (
    <Reveal as={as} className={className} delay={delay} variant={variant}>
      {children}
    </Reveal>
  );
}
