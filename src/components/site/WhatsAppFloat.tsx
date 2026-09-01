import { MessageCircle } from 'lucide-react';
import { whatsappLink } from '@/lib/utils/format';

/** Atalho flutuante para WhatsApp. Só aparece se o número estiver configurado. */
export function WhatsAppFloat({ number }: { number: string }) {
  if (!number) return null;

  return (
    <a
      href={whatsappLink(number, 'Olá! Vim pelo site e gostaria de informações.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar pelo WhatsApp (abre em nova aba)"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-petrol-700 text-white shadow-lift transition-all duration-300 ease-soft hover:scale-105 hover:bg-petrol-800 focus-visible:scale-105 sm:bottom-7 sm:right-7"
    >
      <MessageCircle aria-hidden="true" className="h-6 w-6" />
    </a>
  );
}
