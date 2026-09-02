'use client';

import type { ReactElement, ReactNode } from 'react';
import { Children, cloneElement, isValidElement } from 'react';
import { cn } from '@/lib/utils/cn';
import { MOTION } from './config';
import { mergeRefs, useInViewOnce, useReducedMotion } from './hooks';

type StaggerChild = ReactElement<{
  className?: string;
  style?: React.CSSProperties;
  ref?: React.Ref<HTMLElement>;
}>;

function StaggerRevealItem({
  child,
  delay,
  variant,
  itemClassName,
  disabled,
}: {
  child: StaggerChild;
  delay: number;
  variant: string;
  itemClassName?: string;
  disabled: boolean;
}) {
  const [ref, visible] = useInViewOnce<HTMLElement>(disabled);

  return cloneElement(child, {
    ref: mergeRefs(ref, child.props.ref),
    className: cn(
      'motion-reveal',
      `motion-reveal--${variant}`,
      'h-full',
      visible && 'motion-visible',
      itemClassName,
      child.props.className,
    ),
    style: {
      ...child.props.style,
      '--motion-delay': `${delay}ms`,
    } as React.CSSProperties,
  });
}

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
  const items = Children.toArray(children);

  return (
    <div className={className}>
      {items.map((child, index) => {
        const itemDelay = delay + Math.min(index, cap) * stagger;
        if (!isValidElement(child)) return child;

        return (
          <StaggerRevealItem
            key={child.key ?? index}
            child={child as StaggerChild}
            delay={itemDelay}
            variant={variant}
            disabled={reduced}
          />
        );
      })}
    </div>
  );
}

/** Cada filho revela individualmente ao entrar na viewport, com stagger. */
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
  const items = Children.toArray(children);

  return (
    <Tag className={className}>
      {items.map((child, index) => {
        const itemDelay = delay + Math.min(index, MOTION.staggerCap) * stagger;
        if (!isValidElement(child)) return child;

        return (
          <StaggerRevealItem
            key={child.key ?? index}
            child={child as StaggerChild}
            delay={itemDelay}
            variant="fade-up"
            itemClassName={itemClassName}
            disabled={reduced}
          />
        );
      })}
    </Tag>
  );
}
