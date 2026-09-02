import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const DEFAULT_PHOTO = '/images/karla-dias.jpg';

/**
 * Retrato na moldura petrol, sem selo sobre a foto.
 * Usa <img> nativo para a foto local sempre aparecer (sem depender do
 * otimizador do Next nem de animação de scroll).
 */
export function ProfessionalPortrait({
  name,
  positioning,
  headline,
  photoUrl,
  registrationLabel,
  registrationValue,
  priority = false,
  className,
}: {
  name: string;
  positioning?: string;
  headline?: string;
  photoUrl?: string | null;
  registrationLabel?: string;
  registrationValue?: string;
  priority?: boolean;
  className?: string;
}) {
  const photo = photoUrl?.trim() || DEFAULT_PHOTO;

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
          alt={`Retrato de ${name}, psicóloga e neuropsicóloga, sorrindo ao ar livre`}
          width={640}
          height={800}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          className="absolute inset-0 z-[2] h-full w-full object-cover object-[center_18%]"
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
    </div>
  );
}
