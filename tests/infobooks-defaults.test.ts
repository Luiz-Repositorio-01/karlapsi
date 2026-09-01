import { describe, expect, it } from 'vitest';
import { DEFAULT_INFOBOOKS } from '@/lib/content/defaults';

describe('DEFAULT_INFOBOOKS', () => {
  it('publica os dois infobooks originais com os links Hotmart reais', () => {
    const slugs = DEFAULT_INFOBOOKS.map((item) => item.slug);
    expect(slugs).toEqual(['autismo', 'cuidar']);

    const autismo = DEFAULT_INFOBOOKS.find((item) => item.slug === 'autismo');
    const cuidar = DEFAULT_INFOBOOKS.find((item) => item.slug === 'cuidar');

    expect(autismo?.title).toBe('Desenvolvimento Infantil e Autismo');
    expect(autismo?.public_file_url).toBe('https://go.hotmart.com/U105876781J');
    expect(autismo?.is_free).toBe(false);
    expect(autismo?.cover_url).toMatch(/autismo/);

    expect(cuidar?.title).toBe('Cuidar, Ensinar e Acompanhar');
    expect(cuidar?.public_file_url).toBe('https://go.hotmart.com/S105848508C');
    expect(cuidar?.price_cents).toBe(3400);
    expect(cuidar?.cover_url).toMatch(/cuidar/);
  });
});
