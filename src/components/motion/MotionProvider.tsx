'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'karlapsi-a11y';

export type A11yPrefs = {
  textSize: 'default' | 'lg' | 'xl';
  highContrast: boolean;
  reduceMotion: boolean;
  underlineLinks: boolean;
};

export const DEFAULT_A11Y: A11yPrefs = {
  textSize: 'default',
  highContrast: false,
  reduceMotion: false,
  underlineLinks: false,
};

export function readA11yPrefs(): A11yPrefs {
  if (typeof window === 'undefined') return DEFAULT_A11Y;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_A11Y;
    return { ...DEFAULT_A11Y, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_A11Y;
  }
}

export function applyA11yPrefs(prefs: A11yPrefs) {
  const root = document.documentElement;
  root.classList.remove('a11y-text-lg', 'a11y-text-xl', 'a11y-high-contrast', 'a11y-reduce-motion', 'a11y-underline-links', 'motion-reduced');
  if (prefs.textSize === 'lg') root.classList.add('a11y-text-lg');
  if (prefs.textSize === 'xl') root.classList.add('a11y-text-xl');
  if (prefs.highContrast) root.classList.add('a11y-high-contrast');
  if (prefs.reduceMotion) {
    root.classList.add('a11y-reduce-motion', 'motion-reduced');
  }
  if (prefs.underlineLinks) root.classList.add('a11y-underline-links');
}

export function saveA11yPrefs(prefs: A11yPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  applyA11yPrefs(prefs);
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('motion-ready');
    applyA11yPrefs(readA11yPrefs());

    const frame = window.requestAnimationFrame(() => {
      root.classList.add('motion-active');
    });

    // Fallback: se animações/observers falharem, garante conteúdo visível.
    const fallback = window.setTimeout(() => {
      root.classList.add('motion-fallback');
      document.querySelectorAll('.motion-reveal, .motion-hero-item, .motion-text-part').forEach((el) => {
        el.classList.add('motion-visible');
      });
    }, 1800);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(fallback);
    };
  }, []);

  return children;
}
