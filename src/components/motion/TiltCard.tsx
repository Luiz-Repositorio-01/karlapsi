'use client';

import type { ReactNode, PointerEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { MOTION } from './config';
import { useFinePointer, useReducedMotion } from './hooks';

export function TiltCard({
  children,
  className,
  max = MOTION.tilt.max,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  disabled?: boolean;
}) {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const active = !disabled && !reduced && fine;
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const onMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!active || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const rotateX = (-y * max).toFixed(2);
      const rotateY = (x * max).toFixed(2);
      setTransform(`perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`);
    },
    [active, max],
  );

  const onLeave = useCallback(() => setTransform(''), []);

  return (
    <div
      ref={ref}
      className={cn('motion-tilt transition-transform duration-300 ease-soft', className)}
      style={{ transform: transform || undefined }}
      onPointerMove={active ? onMove : undefined}
      onPointerLeave={active ? onLeave : undefined}
    >
      {children}
    </div>
  );
}
