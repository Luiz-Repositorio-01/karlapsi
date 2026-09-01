import type { SiteSettings } from '@/lib/types';
import { integrationStatus } from '@/lib/env';
import { getLegacyPdfEntry, listLegacyLandingSlugs } from '@/lib/legacy';

/**
 * Checklist de prontidão para produção / go-live.
 * Não inventa conteúdo: apenas lista o que ainda falta configurar.
 */

export type ReadinessItem = {
  id: string;
  label: string;
  status: 'ok' | 'pending' | 'blocked';
  group: 'dados' | 'integracao' | 'legacy';
  hint?: string;
};

function filled(value: string | undefined | null): boolean {
  return Boolean(value && value.trim().length > 0);
}

export function getContentReadiness(settings: SiteSettings): ReadinessItem[] {
  const { identity, contact, seo } = settings;

  return [
    {
      id: 'crp',
      label: 'Registro profissional (CRP)',
      status: filled(identity.professional_registration_value) ? 'ok' : 'pending',
      group: 'dados',
      hint: 'Preencha em Identidade → Número do registro',
    },
    {
      id: 'bio',
      label: 'Biografia profissional',
      status: filled(identity.short_bio) ? 'ok' : 'pending',
      group: 'dados',
      hint: 'Aparece em /sobre somente quando preenchida',
    },
    {
      id: 'formation',
      label: 'Formação',
      status: filled(identity.formation) ? 'ok' : 'pending',
      group: 'dados',
    },
    {
      id: 'specializations',
      label: 'Especializações',
      status: filled(identity.specializations) ? 'ok' : 'pending',
      group: 'dados',
    },
    {
      id: 'photo',
      label: 'Foto profissional',
      status: filled(identity.photo_url) ? 'ok' : 'pending',
      group: 'dados',
      hint: 'Foto em public/images/karla-dias.jpg',
    },
    {
      id: 'email',
      label: 'E-mail de contato público',
      status: filled(contact.email) ? 'ok' : 'pending',
      group: 'dados',
    },
    {
      id: 'address',
      label: 'Endereço / localização',
      status: filled(contact.address_line) || filled(contact.city) ? 'ok' : 'pending',
      group: 'dados',
    },
    {
      id: 'instagram',
      label: 'Instagram',
      status: filled(contact.instagram) ? 'ok' : 'pending',
      group: 'dados',
    },
    {
      id: 'og',
      label: 'Imagem Open Graph',
      status: filled(seo.default_og_image) ? 'ok' : 'pending',
      group: 'dados',
      hint: 'Recomendado para compartilhamento em redes',
    },
  ];
}

export function getLegacyReadiness(): ReadinessItem[] {
  const pdf = getLegacyPdfEntry();
  const landings = listLegacyLandingSlugs();

  return [
    {
      id: 'legacy-pdf',
      label: 'Arquivos PDF Online (public/legacy/pdf-online)',
      status: pdf ? 'ok' : 'pending',
      group: 'legacy',
      hint: 'Arquivos em public/legacy/pdf-online — acesso só no painel (/admin/pdf-online)',
    },
    {
      id: 'legacy-catalog',
      label: 'Infobooks / Landing Pages legados',
      status: landings.length > 0 ? 'ok' : 'pending',
      group: 'legacy',
      hint:
        landings.length > 0
          ? `${landings.length} módulo(s) detectado(s)`
          : 'Copie pastas para public/legacy/infobooks/<slug>/',
    },
  ];
}

export function getIntegrationReadiness(): ReadinessItem[] {
  return integrationStatus().map((item) => ({
    id: item.id,
    label: item.label,
    status: item.configured ? 'ok' : item.required ? 'blocked' : 'pending',
    group: 'integracao' as const,
    hint: item.variables.join(', '),
  }));
}

export function getProductionReadiness(settings: SiteSettings): {
  items: ReadinessItem[];
  pendingCount: number;
  blockedCount: number;
} {
  const items = [
    ...getIntegrationReadiness(),
    ...getContentReadiness(settings),
    ...getLegacyReadiness(),
  ];
  return {
    items,
    pendingCount: items.filter((item) => item.status === 'pending').length,
    blockedCount: items.filter((item) => item.status === 'blocked').length,
  };
}

/** Linhas de especialização (uma por linha), sem vazios. */
export function parseSpecializations(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
