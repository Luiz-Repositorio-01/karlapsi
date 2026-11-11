'use client';

import Image from 'next/image';
import { Check, Download, X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { buttonClasses } from '@/components/ui';

/**
 * Oferta do guia gratuito na página inicial.
 * Abre uma vez por visita; depois de fechar, o download continua acessível
 * por um atalho na própria home.
 */

const STORAGE_KEY = 'karla-mapa-desenvolvimento-dismissed';
const PDF_PATH = '/downloads/mapa-do-desenvolvimento-infantil.pdf';
const PDF_FILENAME = 'Mapa-do-Desenvolvimento-Infantil-Karla-Dias.pdf';

const TOPICS = [
  'Comunicação, interação social, brincadeira, comportamento, sensorial e autonomia.',
  'O que observar no dia a dia e o que pode merecer mais atenção.',
  'Fichas para registrar o que você viu e escolher o próximo passo.',
];

const emptySubscribe = () => () => {};

function useIsMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function subscribeDismissed(onChange: () => void) {
  window.addEventListener('karla-mapa-dismissed', onChange);
  return () => window.removeEventListener('karla-mapa-dismissed', onChange);
}

function writeDismissed() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Sem persistência a oferta só deixa de aparecer nesta renderização.
  }
  window.dispatchEvent(new Event('karla-mapa-dismissed'));
}

export function FreeMaterialPopup() {
  const titleId = useId();
  const descriptionId = useId();
  const mounted = useIsMounted();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dismissed = useSyncExternalStore(subscribeDismissed, readDismissed, () => false);
  const [open, setOpen] = useState(false);

  const dismiss = useCallback(() => {
    writeDismissed();
    setOpen(false);
  }, []);

  useEffect(() => {
    if (dismissed) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setOpen(true), reduceMotion ? 0 : 700);
    return () => window.clearTimeout(timer);
  }, [dismissed]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(
        container?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    container?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, dismiss]);

  if (!mounted) return null;

  const dialog = open
    ? createPortal(
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6">
          <div
            className="absolute inset-0 bg-ink/50 animate-fade-in backdrop-blur-[2px]"
            onClick={dismiss}
            aria-hidden="true"
          />
          <div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            className="relative flex max-h-[min(92dvh,44rem)] w-full max-w-[54rem] flex-col overflow-hidden rounded-3xl bg-surface shadow-lift outline-none animate-fade-up sm:flex-row"
          >
            <div className="relative flex h-52 shrink-0 items-center justify-center bg-[#F6F1E8] sm:h-auto sm:w-[19.5rem]">
              <div className="relative h-[11.25rem] w-[8.4rem] overflow-hidden rounded-md shadow-lift ring-1 ring-black/10 sm:h-[22.5rem] sm:w-[16.75rem]">
                <Image
                  src="/images/materiais/mapa-desenvolvimento-infantil.jpg"
                  alt="Capa do guia Mapa do Desenvolvimento Infantil, por Karla Dias"
                  fill
                  sizes="(min-width: 640px) 268px, 134px"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-4 sm:px-7 sm:pt-7">
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label="Fechar"
                  className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-surface/90 text-ink-muted shadow-card transition-colors hover:bg-petrol-50 hover:text-ink sm:bg-transparent sm:shadow-none"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>

                <p className="pr-12 text-eyebrow font-semibold uppercase text-petrol-600">
                  Material gratuito para baixar
                </p>
                <h2 id={titleId} className="mt-3 pr-8 font-display text-[1.65rem] leading-[1.15] text-ink sm:text-[1.85rem]">
                  Mapa do Desenvolvimento Infantil
                </h2>
                <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-[0.95rem]">
                  Um guia prático para pais e cuidadores que querem olhar para o desenvolvimento com
                  mais clareza e menos ansiedade.
                </p>

                <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
                  PDF · 12 páginas · Karla Dias
                </p>

                <ul className="mt-4 space-y-2.5">
                  {TOPICS.map((topic) => (
                    <li key={topic} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
                      <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-petrol-600" />
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="shrink-0 border-t border-petrol-100 bg-surface px-5 py-4 sm:px-7">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <a
                    href={PDF_PATH}
                    download={PDF_FILENAME}
                    className={buttonClasses('primary', 'lg', 'w-full sm:w-auto')}
                  >
                    <Download aria-hidden="true" className="h-4 w-4" />
                    Baixar grátis em PDF
                  </a>
                  <button type="button" onClick={dismiss} className={buttonClasses('ghost', 'md', 'w-full sm:w-auto')}>
                    Agora não
                  </button>
                </div>
                <p className="mt-3 text-sm font-medium leading-relaxed text-petrol-800">
                  Download gratuito. Sem cadastro e sem pagamento — o arquivo é seu.
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-faint">
                  Conteúdo informativo. Não substitui avaliação profissional.
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  const reopen =
    dismissed && !open
      ? createPortal(
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="fixed bottom-24 left-4 z-30 flex max-w-[calc(100vw-8.5rem)] items-center gap-2 rounded-full bg-petrol-800 px-4 py-3 text-left text-white shadow-lift transition-colors hover:bg-petrol-900 sm:left-6"
          >
            <Download aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="min-w-0">
              <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-sand-200">
                Material gratuito
              </span>
              <span className="block truncate text-sm font-medium">Baixar o mapa em PDF</span>
            </span>
          </button>,
          document.body,
        )
      : null;

  return (
    <>
      {dialog}
      {reopen}
    </>
  );
}
