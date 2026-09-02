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
  root.classList.remove(
    'a11y-text-lg',
    'a11y-text-xl',
    'a11y-high-contrast',
    'a11y-reduce-motion',
    'a11y-underline-links',
    'motion-reduced',
  );
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

/** Script síncrono no <head> — esconde elementos antes da primeira pintura. */
export function MotionInitScript() {
  const script = `
    try {
      document.documentElement.classList.add('motion-ready');
    } catch (e) {}
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('motion-ready');
    applyA11yPrefs(readA11yPrefs());

    const reduced =
      root.classList.contains('motion-reduced') ||
      root.classList.contains('a11y-reduce-motion') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      root.classList.add('motion-active');
      return;
    }

    // Duplo rAF: garante estado oculto pintado antes de ativar transições.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.add('motion-active');
      });
    });

    // Segurança: itens presos na viewport após 4s (não mata animações ao rolar).
    const safety = window.setTimeout(() => {
      const viewportBottom = window.innerHeight;
      document
        .querySelectorAll('.motion-reveal:not(.motion-visible)')
        .forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < viewportBottom && rect.bottom > 0) {
            el.classList.add('motion-visible');
          }
        });
    }, 4000);

    return () => {
      window.clearTimeout(safety);
    };
  }, []);

  return children;
}
