'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { MOTION } from './config';
import { useInViewOnce, useReducedMotion } from './hooks';

export function NumberReveal({
  value,
  suffix = '',
  prefix = '',
  className,
  duration = MOTION.duration.slow,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  const [ref, visible] = useInViewOnce<HTMLSpanElement>(reduced);
  const [display, setDisplay] = useState(() => (reduced ? value : 0));
  const ran = useRef(false);

  useEffect(() => {
    if (!visible || ran.current || reduced) return;
    ran.current = true;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(value * eased));
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [visible, value, duration, reduced]);

  const shown = reduced ? value : visible ? display : 0;

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}
