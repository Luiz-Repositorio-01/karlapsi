'use client';

import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { MOTION } from './config';
import { useInViewOnce, useReducedMotion } from './hooks';

type Mode = 'block' | 'lines' | 'words';

function splitContent(text: string, mode: Mode): string[] {
  if (mode === 'block') return [text];
  if (mode === 'lines') return text.split('\n').filter(Boolean);
  return text.split(/\s+/).filter(Boolean);
}

export function RevealText({
  children,
  as: Tag = 'span',
  className,
  mode = 'block',
  delay = 0,
  stagger = MOTION.stagger.sm,
  disabled,
}: {
  children: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  mode?: Mode;
  delay?: number;
  stagger?: number;
  disabled?: boolean;
}) {
  const reduced = useReducedMotion();
  const isDisabled = disabled || reduced;
  const [ref, visible] = useInViewOnce<HTMLDivElement>(isDisabled);
  const parts = splitContent(children, mode);

  if (isDisabled || mode === 'block') {
    const Component = Tag as ElementType;
    return (
      <Component
        ref={ref}
        className={cn('motion-reveal motion-reveal--fade-up', visible && 'motion-visible', className)}
        style={{ '--motion-delay': `${delay}ms` } as React.CSSProperties}
      >
        {children}
      </Component>
    );
  }

  const Component = Tag as ElementType;

  return (
    <div ref={ref} className={cn('motion-text-split', className)} aria-label={children}>
      <Component>
        {parts.map((part, index) => (
          <span
            key={`${part.slice(0, 12)}-${index}`}
            className={cn('motion-text-part', visible && 'motion-visible')}
            style={
              {
                '--motion-delay': `${delay + index * stagger}ms`,
              } as React.CSSProperties
            }
            aria-hidden="true"
          >
            {part}
            {mode === 'words' && index < parts.length - 1 ? '\u00A0' : null}
            {mode === 'lines' && index < parts.length - 1 ? <br /> : null}
          </span>
        ))}
      </Component>
      <span className="sr-only">{children}</span>
    </div>
  );
}

export function SplitTextReveal({
  lines,
  className,
  lineClassName,
  delay = 0,
}: {
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const [ref, visible] = useInViewOnce<HTMLDivElement>(reduced);

  return (
    <div ref={ref} className={className}>
      {lines.map((line, index) => (
        <div
          key={index}
          className={cn(
            'motion-reveal motion-reveal--fade-up overflow-hidden',
            visible && 'motion-visible',
            lineClassName,
          )}
          style={
            {
              '--motion-delay': `${delay + index * MOTION.stagger.md}ms`,
            } as React.CSSProperties
          }
        >
          {line}
        </div>
      ))}
    </div>
  );
}
