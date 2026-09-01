import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '@/lib/content/defaults';
import {
  getContentReadiness,
  getProductionReadiness,
  parseSpecializations,
} from '@/lib/settings/readiness';
import { settingsSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/observability/logger';

describe('settings readiness', () => {
  it('marca dados profissionais vazios como pendentes (exceto Instagram real)', () => {
    const items = getContentReadiness(DEFAULT_SETTINGS);
    const byId = Object.fromEntries(items.map((item) => [item.id, item.status]));

    // Instagram oficial @karlaneuropsi já está no defaults; foto e logo reais também.
    expect(byId.instagram).toBe('ok');
    expect(byId.photo).toBe('ok');
    expect(byId.og).toBe('ok');
    expect(byId.crp).toBe('pending');
    expect(byId.bio).toBe('pending');
    expect(byId.formation).toBe('pending');
    expect(byId.specializations).toBe('pending');
    expect(byId.email).toBe('pending');
    expect(byId.address).toBe('pending');
  });

  it('marca CRP e bio como ok quando preenchidos', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      identity: {
        ...DEFAULT_SETTINGS.identity,
        professional_registration_value: '06/123456',
        short_bio: 'Texto real.',
        formation: 'Psicologia',
        specializations: 'Neuropsicologia\nAprendizagem',
        photo_url: 'https://example.com/foto.jpg',
      },
      contact: {
        ...DEFAULT_SETTINGS.contact,
        email: 'contato@example.com',
        city: 'São Paulo',
        instagram: '@exemplo',
      },
      seo: {
        ...DEFAULT_SETTINGS.seo,
        default_og_image: 'https://example.com/og.jpg',
      },
    };

    const pending = getContentReadiness(settings).filter((item) => item.status !== 'ok');
    expect(pending).toEqual([]);
  });

  it('parseSpecializations ignora linhas vazias', () => {
    expect(parseSpecializations('A\n\n B \n')).toEqual(['A', 'B']);
  });

  it('settingsSchema aceita os novos campos', () => {
    const parsed = settingsSchema.safeParse({
      ...DEFAULT_SETTINGS,
      identity: {
        ...DEFAULT_SETTINGS.identity,
        formation: 'Formação',
        specializations: 'Esp',
        logo_url: '',
      },
      contact: {
        ...DEFAULT_SETTINGS.contact,
        map_url: 'https://maps.example.com',
      },
      seo: {
        ...DEFAULT_SETTINGS.seo,
        default_og_image: '',
      },
    });
    expect(parsed.success).toBe(true);
  });

  it('getProductionReadiness conta bloqueios de integração', () => {
    const keys = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];
    const backup = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
    for (const key of keys) delete process.env[key];

    try {
      const result = getProductionReadiness(DEFAULT_SETTINGS);
      expect(result.blockedCount).toBeGreaterThan(0);
      expect(result.items.some((item) => item.id === 'supabase' && item.status === 'blocked')).toBe(
        true,
      );
    } finally {
      for (const [key, value] of Object.entries(backup)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});

describe('logger', () => {
  it('redige chaves sensíveis sem lançar', () => {
    expect(() =>
      logger.error('test', 'falha', {
        password: 'secret',
        access_token: 'tok',
        safe: 'ok',
      }),
    ).not.toThrow();
  });
});
