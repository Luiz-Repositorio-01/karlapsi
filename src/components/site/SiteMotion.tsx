'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import {
  MotionProvider,
  PageTransition,
  ScrollProgress,
} from '@/components/motion';

/** Observer para seções com data-motion-section (progressive enhancement). */
function MotionSectionObserver() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('[data-motion-section]').forEach((el) => {
        el.classList.add('motion-visible');
      });
      return;
    }

    const reduced =
      document.documentElement.classList.contains('motion-reduced') ||
      document.documentElement.classList.contains('a11y-reduce-motion') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      document.querySelectorAll('.motion-reveal').forEach((el) => el.classList.add('motion-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('motion-visible');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
    );

    document.querySelectorAll('[data-motion-section], .motion-section-auto .motion-reveal').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}

export function SiteMotion({ children }: { children: ReactNode }) {
  return (
    <MotionProvider>
      <ScrollProgress />
      <PageTransition>{children}</PageTransition>
      <MotionSectionObserver />
    </MotionProvider>
  );
}
