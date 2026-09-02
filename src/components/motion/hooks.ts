'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MOTION } from './config';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const POINTER_FINE = '(pointer: fine)';
const MOBILE_QUERY = '(max-width: 767px)';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(REDUCED_QUERY);
    const check = () => {
      const forced =
        document.documentElement.classList.contains('a11y-reduce-motion') ||
        document.documentElement.classList.contains('motion-reduced');
      setReduced(forced || mq.matches);
    };
    check();
    mq.addEventListener('change', check);
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      mq.removeEventListener('change', check);
      observer.disconnect();
    };
  }, []);

  return reduced;
}

export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(POINTER_FINE);
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return fine;
}

export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return mobile;
}

/** Observer compartilhado — um callback por elemento, sem duplicar observers. */
const observerCallbacks = new WeakMap<Element, () => void>();
let sharedObserver: IntersectionObserver | null = null;

function getSharedObserver() {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const cb = observerCallbacks.get(entry.target);
        cb?.();
        sharedObserver?.unobserve(entry.target);
        observerCallbacks.delete(entry.target);
      }
    },
    { rootMargin: '0px 0px -2% 0px', threshold: 0.01 },
  );
  return sharedObserver;
}

export function useInViewOnce<T extends HTMLElement>(
  disabled = false,
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(
    () => disabled || typeof IntersectionObserver === 'undefined',
  );

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') return;

    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    if (inView) {
      setVisible(true);
      return;
    }

    const show = () => setVisible(true);
    observerCallbacks.set(el, show);
    getSharedObserver().observe(el);

    return () => {
      observerCallbacks.delete(el);
      sharedObserver?.unobserve(el);
    };
  }, [disabled]);

  return [ref, visible];
}

/** Parallax leve via transform — desabilitado em mobile e reduced motion. */
export function useParallaxOffset(
  strength = 0.12,
  enabled = true,
): [React.RefObject<HTMLElement | null>, number] {
  const ref = useRef<HTMLElement | null>(null);
  const [offset, setOffset] = useState(0);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const active = enabled && !reduced && !mobile;

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - window.innerHeight / 2;
        const clamped = Math.max(
          -MOTION.parallax.max,
          Math.min(MOTION.parallax.max, center * strength * -0.05),
        );
        setOffset(clamped);
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [active, strength]);

  return [ref, active ? offset : 0];
}

export function useMagnetic(
  enabled = true,
): [React.RefObject<HTMLElement | null>, React.CSSProperties] {
  const ref = useRef<HTMLElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const active = enabled && fine && !reduced;

  const reset = useCallback(() => setStyle({}), []);

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      const max = MOTION.magnetic.max;
      const tx = Math.max(-max, Math.min(max, x * 0.12));
      const ty = Math.max(-max, Math.min(max, y * 0.12));
      setStyle({ transform: `translate3d(${tx}px, ${ty}px, 0)` });
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', reset);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', reset);
    };
  }, [active, reset]);

  return [ref, active ? style : {}];
}
