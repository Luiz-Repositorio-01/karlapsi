'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { MOTION } from './config';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const POINTER_FINE = '(pointer: fine)';
const MOBILE_QUERY = '(max-width: 767px)';

function subscribeReducedMotion(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener('change', onChange);

  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  return () => {
    query.removeEventListener('change', onChange);
    observer.disconnect();
  };
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    document.documentElement.classList.contains('a11y-reduce-motion') ||
    document.documentElement.classList.contains('motion-reduced') ||
    window.matchMedia(REDUCED_QUERY).matches
  );
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, () => false);
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

export function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

function waitForMotionActive(callback: () => void) {
  if (document.documentElement.classList.contains('motion-active')) {
    requestAnimationFrame(() => requestAnimationFrame(callback));
    return;
  }

  const observer = new MutationObserver(() => {
    if (!document.documentElement.classList.contains('motion-active')) return;
    observer.disconnect();
    requestAnimationFrame(() => requestAnimationFrame(callback));
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  window.setTimeout(() => {
    observer.disconnect();
    callback();
  }, 600);
}

/**
 * Revela o elemento uma vez ao entrar na viewport.
 * Sempre usa IntersectionObserver para animação ao rolar.
 */
export function useInViewOnce<T extends HTMLElement>(
  disabled = false,
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(disabled);

  useEffect(() => {
    if (disabled) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    let cancelled = false;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.disconnect();
          waitForMotionActive(() => {
            if (!cancelled) setVisible(true);
          });
          break;
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );

    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
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
