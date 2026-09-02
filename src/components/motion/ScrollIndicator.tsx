'use client';

import { cn } from '@/lib/utils/cn';
import { useReducedMotion } from './hooks';

export function ScrollIndicator({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <div
      className={cn(
        'motion-scroll-hint flex flex-col items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-petrol-600/80',
        className,
      )}
      aria-hidden="true"
    >
      <span>Explorar</span>
      <span className="motion-scroll-hint__line h-10 w-px bg-gradient-to-b from-petrol-400/80 to-transparent" />
    </div>
  );
}
