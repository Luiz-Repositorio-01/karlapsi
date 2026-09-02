'use client';

import { Accessibility, Minus, Plus, RotateCcw, Type, Underline, Zap, ZapOff } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  DEFAULT_A11Y,
  type A11yPrefs,
  readA11yPrefs,
  saveA11yPrefs,
} from '@/components/motion/MotionProvider';

const TEXT_SIZES: A11yPrefs['textSize'][] = ['default', 'lg', 'xl'];

export function AccessibilityWidget() {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(() =>
    typeof window === 'undefined' ? DEFAULT_A11Y : readA11yPrefs(),
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  const update = (patch: Partial<A11yPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    saveA11yPrefs(next);
  };

  const reset = () => {
    setPrefs(DEFAULT_A11Y);
    saveA11yPrefs(DEFAULT_A11Y);
  };

  const cycleTextSize = () => {
    const index = TEXT_SIZES.indexOf(prefs.textSize);
    const next = TEXT_SIZES[(index + 1) % TEXT_SIZES.length];
    update({ textSize: next });
  };

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col items-start gap-3 sm:bottom-6 sm:left-6">
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={`${panelId}-title`}
          className="motion-a11y-panel w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl bg-surface p-4 shadow-lift ring-1 ring-petrol-100 animate-fade-up"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p id={`${panelId}-title`} className="font-display text-base text-ink">
                Acessibilidade
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                Ajustes visuais salvos neste dispositivo.
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="touch-target flex shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-petrol-50 hover:text-petrol-800"
              aria-label="Restaurar configurações padrão"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <ul className="mt-4 space-y-2">
            <li>
              <button
                type="button"
                onClick={cycleTextSize}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-petrol-50"
              >
                <Type aria-hidden="true" className="h-4 w-4 text-petrol-600" />
                <span className="flex-1">
                  Tamanho do texto
                  <span className="mt-0.5 block text-xs text-ink-faint">
                    {prefs.textSize === 'default'
                      ? 'Padrão'
                      : prefs.textSize === 'lg'
                        ? 'Grande'
                        : 'Extra grande'}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-ink-faint" aria-hidden="true">
                  <Minus className="h-3.5 w-3.5" />
                  <Plus className="h-3.5 w-3.5" />
                </span>
              </button>
            </li>

            <li>
              <ToggleRow
                label="Alto contraste"
                description="Mais contraste entre texto e fundo"
                pressed={prefs.highContrast}
                onPressedChange={(v) => update({ highContrast: v })}
                icon={<Zap aria-hidden="true" className="h-4 w-4 text-petrol-600" />}
              />
            </li>

            <li>
              <ToggleRow
                label="Reduzir movimento"
                description="Menos animações e transições"
                pressed={prefs.reduceMotion}
                onPressedChange={(v) => update({ reduceMotion: v })}
                icon={<ZapOff aria-hidden="true" className="h-4 w-4 text-petrol-600" />}
              />
            </li>

            <li>
              <ToggleRow
                label="Sublinhar links"
                description="Destaque visual em links do conteúdo"
                pressed={prefs.underlineLinks}
                onPressedChange={(v) => update({ underlineLinks: v })}
                icon={<Underline aria-hidden="true" className="h-4 w-4 text-petrol-600" />}
              />
            </li>
          </ul>
        </div>
      ) : null}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? 'Fechar painel de acessibilidade' : 'Abrir painel de acessibilidade'}
        className={cn(
          'motion-a11y-trigger touch-target flex h-12 w-12 items-center justify-center rounded-full',
          'bg-petrol-800 text-white shadow-lift ring-1 ring-white/20',
          'transition-all duration-300 ease-soft hover:-translate-y-0.5 hover:bg-petrol-900 hover:shadow-lift',
          'active:translate-y-0 active:scale-[0.98]',
          open && 'bg-petrol-900',
        )}
      >
        <Accessibility aria-hidden="true" className="h-5 w-5" />
      </button>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  pressed,
  onPressedChange,
  icon,
}: {
  label: string;
  description: string;
  pressed: boolean;
  onPressedChange: (value: boolean) => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
        pressed ? 'bg-petrol-50 ring-1 ring-inset ring-petrol-200' : 'hover:bg-petrol-50/70',
      )}
    >
      {icon}
      <span className="flex-1">
        {label}
        <span className="mt-0.5 block text-xs text-ink-faint">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full transition-colors',
          pressed ? 'bg-petrol-600' : 'bg-petrol-200',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-soft',
            pressed ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  );
}

/** Aplica preferências antes da hidratação (evita flash). */
export function A11yInitScript() {
  const script = `
    try {
      var k = 'karlapsi-a11y';
      var d = JSON.parse(localStorage.getItem(k) || '{}');
      var r = document.documentElement;
      if (d.textSize === 'lg') r.classList.add('a11y-text-lg');
      if (d.textSize === 'xl') r.classList.add('a11y-text-xl');
      if (d.highContrast) r.classList.add('a11y-high-contrast');
      if (d.reduceMotion) r.classList.add('a11y-reduce-motion','motion-reduced');
      if (d.underlineLinks) r.classList.add('a11y-underline-links');
    } catch (e) {}
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
