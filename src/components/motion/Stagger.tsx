'use client';

import type { ReactElement, ReactNode } from 'react';
import { Children, cloneElement, isValidElement } from 'react';
import { cn } from '@/lib/utils/cn';
import { MOTION } from './config';
import { useInViewOnce, useReducedMotion } from './hooks';

export function Stagger({
  children,
  className,
  stagger = MOTION.stagger.md,
  delay = 0,
  cap = MOTION.staggerCap,
  variant = 'fade-up',
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  cap?: number;
  variant?: 'fade-up' | 'fade-in' | 'scale';
}) {
  const reduced = useReducedMotion();
  const [ref, visible] = useInViewOnce<HTMLDivElement>(reduced);
  const items = Children.toArray(children);

  return (
    <div ref={ref} className={className}>
      {items.map((child, index) => {
        const itemDelay = delay + Math.min(index, cap) * stagger;
        if (!isValidElement(child)) return child;

        const el = child as ReactElement<{ className?: string; style?: React.CSSProperties }>;
        return cloneElement(el, {
          className: cn(
            'motion-reveal',
            `motion-reveal--${variant}`,
            visible && 'motion-visible',
            el.props.className,
          ),
          style: {
            ...el.props.style,
            '--motion-delay': `${itemDelay}ms`,
          } as React.CSSProperties,
        });
      })}
    </div>
  );
}

/** Envolve <li> dentro de <ul> com stagger automático. */
export function StaggerList({
  children,
  className,
  itemClassName,
  stagger = MOTION.stagger.md,
  delay = 0,
  as: Tag = 'ul',
}: {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  stagger?: number;
  delay?: number;
  as?: 'ul' | 'ol' | 'div';
}) {
  const reduced = useReducedMotion();
  const [ref, visible] = useInViewOnce<HTMLDivElement>(reduced);
  const items = Children.toArray(children);

  return (
    <div ref={ref}>
      <Tag className={className}>
      {items.map((child, index) => {
        const itemDelay = delay + Math.min(index, MOTION.staggerCap) * stagger;
        if (!isValidElement(child)) return child;

        const el = child as ReactElement<{ className?: string; style?: React.CSSProperties }>;
        return cloneElement(el, {
          className: cn(
            'motion-reveal motion-reveal--fade-up',
            visible && 'motion-visible',
            itemClassName,
            el.props.className,
          ),
          style: {
            ...el.props.style,
            '--motion-delay': `${itemDelay}ms`,
          } as React.CSSProperties,
        });
      })}
      </Tag>
    </div>
  );
}
