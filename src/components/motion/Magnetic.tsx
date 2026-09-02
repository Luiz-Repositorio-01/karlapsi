'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { useMagnetic } from './hooks';

export function Magnetic({
  children,
  className,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const [ref, style] = useMagnetic(!disabled);

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn('motion-magnetic inline-flex transition-transform duration-300 ease-soft', className)}
      style={style}
    >
      {children}
    </div>
  );
}
