import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const DEFAULT_PHOTO = '/images/karla-dias.jpg';
const DEFAULT_LOGO = '/images/logo-kd.jpg';

/**
 * Retrato na moldura petrol + logo KD.
 * Usa <img> nativo para a foto local sempre aparecer (sem depender do
 * otimizador do Next nem de animação de scroll).
 */
export function ProfessionalPortrait({
  name,
  positioning,
  headline,
  photoUrl,
  logoUrl,
  registrationLabel,
  registrationValue,
  className,
}: {
  name: string;
  positioning?: string;
  headline?: string;
  photoUrl?: string | null;
  logoUrl?: string | null;
  registrationLabel?: string;
  registrationValue?: string;
  priority?: boolean;
  className?: string;
}) {
  const photo = photoUrl?.trim() || DEFAULT_PHOTO;
  const logo = logoUrl?.trim() || DEFAULT_LOGO;

  return (
    <div
      className={cn(
        'photo-frame relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] shadow-lift ring-1 ring-white/60',
        className,
      )}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- arquivo local em /public; precisa renderizar sem o otimizador
        <img
          src={photo}
          alt={`Retrato de ${name}`}
          width={1086}
          height={1448}
          className="absolute inset-0 z-[2] h-full w-full object-cover object-[center_12%]"
        />
      ) : (
        <div className="relative z-[2] flex h-full flex-col justify-between p-8 text-petrol-50">
          <Brain aria-hidden="true" className="h-9 w-9 text-petrol-300" />
          <div>
            <p className="font-display text-3xl leading-tight text-white">{name}</p>
            {positioning ? (
              <p className="mt-2 text-sm uppercase tracking-[0.14em] text-petrol-300">
                {positioning}
              </p>
            ) : null}
            {headline ? (
              <p className="mt-4 max-w-[16rem] text-sm leading-relaxed text-petrol-200">
                {headline}
              </p>
            ) : null}
            {registrationValue ? (
              <p className="mt-4 text-sm text-petrol-200">
                {registrationLabel || 'Registro'}: {registrationValue}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {logo ? (
        <div className="absolute left-4 top-4 z-[3] h-[4.25rem] w-[4.25rem] overflow-hidden rounded-full bg-white shadow-lift ring-2 ring-white/90 sm:h-[4.75rem] sm:w-[4.75rem]">
          {/* eslint-disable-next-line @next/next/no-img-element -- mesmo motivo da foto */}
          <img src={logo} alt="" width={80} height={80} className="h-full w-full object-cover" />
        </div>
      ) : null}
    </div>
  );
}
