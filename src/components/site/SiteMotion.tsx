'use client';

import type { ReactNode } from 'react';
import { MotionProvider, PageTransition, ScrollProgress } from '@/components/motion';

export function SiteMotion({ children }: { children: ReactNode }) {
  return (
    <MotionProvider>
      <ScrollProgress />
      <PageTransition>{children}</PageTransition>
    </MotionProvider>
  );
}
