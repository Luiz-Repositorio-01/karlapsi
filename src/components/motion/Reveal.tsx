'use client';

import type { CSSProperties, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { MOTION, type RevealVariant } from './config';
import { useInViewOnce, useReducedMotion } from './hooks';

type RevealElement = 'div' | 'section' | 'article' | 'span' | 'header' | 'footer' | 'aside';

export function Reveal({
  children,
  as: Tag = 'div',
  className,
  variant = 'fade-up',
  delay = 0,
  duration = MOTION.duration.base,
  distance = MOTION.distance.md,
  disabled,
  style,
}: {
  children: ReactNode;
  as?: RevealElement;
  className?: string;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  distance?: number;
  disabled?: boolean;
  style?: CSSProperties;
  once?: boolean;
}) {
  const reduced = useReducedMotion();
  const isDisabled = disabled || reduced;
  const [ref, visible] = useInViewOnce<HTMLElement>(isDisabled);

  const cssVars = {
    '--motion-delay': `${delay}ms`,
    '--motion-duration': `${duration}s`,
    '--motion-distance': `${distance}px`,
  } as CSSProperties;

  const Component = Tag as ElementType;

  return (
    <Component
      ref={ref}
      className={cn(
        'motion-reveal',
        `motion-reveal--${variant}`,
        visible && 'motion-visible',
        className,
      )}
      style={{ ...cssVars, ...style }}
    >
      {children}
    </Component>
  );
}
