/** Configuração central de motion — ajuste global sem editar cada componente. */
export const MOTION = {
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  duration: {
    fast: 0.45,
    base: 0.75,
    slow: 1,
    hero: 1.2,
  },
  distance: {
    sm: 16,
    md: 32,
    lg: 48,
  },
  stagger: {
    sm: 60,
    md: 100,
    lg: 140,
  },
  parallax: {
    min: 5,
    max: 24,
  },
  tilt: {
    max: 4,
  },
  magnetic: {
    max: 6,
  },
  heroSequence: {
    /** Delays em ms para a abertura cinematográfica do hero */
    bg: 0,
    eyebrow: 120,
    name: 200,
    positioning: 280,
    title: 380,
    subtitle: 520,
    cta: 680,
    portrait: 300,
    scrollHint: 900,
  },
  /** Máximo de filhos com stagger individual */
  staggerCap: 8,
} as const;

export type RevealVariant =
  | 'fade-up'
  | 'fade-in'
  | 'fade-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale'
  | 'blur-up';

export const REVEAL_VARIANTS: Record<
  RevealVariant,
  { from: string; to: string }
> = {
  'fade-up': {
    from: 'translate3d(0, var(--motion-distance, 20px), 0)',
    to: 'translate3d(0, 0, 0)',
  },
  'fade-in': { from: 'none', to: 'none' },
  'fade-down': {
    from: 'translate3d(0, calc(var(--motion-distance, 20px) * -1), 0)',
    to: 'translate3d(0, 0, 0)',
  },
  'slide-left': {
    from: 'translate3d(var(--motion-distance, 20px), 0, 0)',
    to: 'translate3d(0, 0, 0)',
  },
  'slide-right': {
    from: 'translate3d(calc(var(--motion-distance, 20px) * -1), 0, 0)',
    to: 'translate3d(0, 0, 0)',
  },
  scale: {
    from: 'scale(0.96) translate3d(0, 8px, 0)',
    to: 'scale(1) translate3d(0, 0, 0)',
  },
  'blur-up': {
    from: 'translate3d(0, var(--motion-distance, 16px), 0)',
    to: 'translate3d(0, 0, 0)',
  },
};
