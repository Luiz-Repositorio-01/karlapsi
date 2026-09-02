'use client';

import type { ReactNode } from 'react';
import { Reveal, Stagger } from '@/components/motion';

export function PaymentStatusMotion({ children }: { children: ReactNode }) {
  return (
    <Stagger className="space-y-6" stagger={90}>
      {children}
    </Stagger>
  );
}

export function PaymentStatusCard({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function PaymentStatusAlert({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function PaymentStatusActions({ children }: { children: ReactNode }) {
  return (
    <Reveal variant="fade-up" delay={180}>
      {children}
    </Reveal>
  );
}
