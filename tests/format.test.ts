import { describe, expect, it } from 'vitest';
import {
  estimateReadingMinutes,
  formatAge,
  formatCpf,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
  formatPhone,
  formatTime,
  initials,
  parseCurrencyToCents,
  slugify,
  truncate,
  whatsappLink,
} from '@/lib/utils/format';

describe('formatCurrency', () => {
  it('formata centavos em Real', () => {
    expect(formatCurrency(35000).replace(/\u00a0/g, ' ')).toBe('R$ 350,00');
    expect(formatCurrency(1990).replace(/\u00a0/g, ' ')).toBe('R$ 19,90');
  });

  it('usa texto neutro quando não há valor definido', () => {
    expect(formatCurrency(null)).toBe('A combinar');
    expect(formatCurrency(undefined, 'Sob consulta')).toBe('Sob consulta');
  });
});

describe('parseCurrencyToCents', () => {
  it('aceita formato brasileiro e internacional', () => {
    expect(parseCurrencyToCents('350,00')).toBe(35000);
    expect(parseCurrencyToCents('1.250,50')).toBe(125050);
    expect(parseCurrencyToCents('19.90')).toBe(1990);
    expect(parseCurrencyToCents('R$ 350,00')).toBe(35000);
  });

  it('recusa valores inválidos', () => {
    expect(parseCurrencyToCents('abc')).toBeNull();
    expect(parseCurrencyToCents('')).toBeNull();
    expect(parseCurrencyToCents('-10')).toBeNull();
  });
});

describe('formatCpf', () => {
  it('mascara o CPF por padrão (minimização de dados)', () => {
    expect(formatCpf('52998224725')).toBe('***.982.***-25');
  });

  it('mostra o CPF completo somente quando solicitado explicitamente', () => {
    expect(formatCpf('52998224725', 'full')).toBe('529.982.247-25');
  });

  it('devolve vazio quando não há CPF', () => {
    expect(formatCpf(null)).toBe('');
  });
});

describe('formatPhone', () => {
  it('formata celular e fixo brasileiros', () => {
    expect(formatPhone('11988887777')).toBe('(11) 98888-7777');
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
  });

  it('remove o código do país quando presente', () => {
    expect(formatPhone('5511988887777')).toBe('(11) 98888-7777');
  });
});

describe('datas no fuso do consultório', () => {
  it('formata data, hora e data-hora em America/Sao_Paulo', () => {
    const instant = '2026-09-02T12:00:00.000Z'; // 09:00 em São Paulo
    expect(formatDate(instant)).toBe('02/09/2026');
    expect(formatTime(instant)).toBe('09:00');
    expect(formatDateTime(instant)).toBe('02/09/2026 às 09:00');
  });

  it('mantém o dia local correto perto da meia-noite', () => {
    // 01:00Z do dia 3 ainda é dia 2 no horário de São Paulo.
    expect(formatDate('2026-09-03T01:00:00.000Z')).toBe('02/09/2026');
  });
});

describe('formatDuration', () => {
  it('descreve a duração em linguagem natural', () => {
    expect(formatDuration(50)).toBe('50 min');
    expect(formatDuration(60)).toBe('1 hora');
    expect(formatDuration(120)).toBe('2 horas');
    expect(formatDuration(90)).toBe('1h30');
  });
});

describe('formatAge', () => {
  it('calcula a idade considerando o aniversário do ano', () => {
    expect(formatAge('2015-04-10', new Date('2026-04-09'))).toBe('10 anos');
    expect(formatAge('2015-04-10', new Date('2026-04-10'))).toBe('11 anos');
  });

  it('devolve vazio sem data de nascimento', () => {
    expect(formatAge(null)).toBe('');
  });
});

describe('slugify', () => {
  it('remove acentuação e normaliza separadores', () => {
    expect(slugify('Avaliação Neuropsicológica')).toBe('avaliacao-neuropsicologica');
    expect(slugify('  Espaços   demais  ')).toBe('espacos-demais');
    expect(slugify('Ação & Reação!')).toBe('acao-reacao');
  });
});

describe('utilidades de texto', () => {
  it('gera iniciais do nome', () => {
    expect(initials('Karla Dias')).toBe('KD');
    expect(initials('Ana')).toBe('A');
  });

  it('trunca preservando o limite', () => {
    expect(truncate('abcdefghij', 5)).toBe('abcd…');
    expect(truncate('abc', 5)).toBe('abc');
  });

  it('estima tempo de leitura com mínimo de 1 minuto', () => {
    expect(estimateReadingMinutes('palavra')).toBe(1);
    expect(estimateReadingMinutes(Array.from({ length: 400 }, () => 'palavra').join(' '))).toBe(2);
  });
});

describe('whatsappLink', () => {
  it('monta o link com mensagem codificada', () => {
    expect(whatsappLink('55 11 98888-7777')).toBe('https://wa.me/5511988887777');
    expect(whatsappLink('5511988887777', 'Olá!')).toBe(
      'https://wa.me/5511988887777?text=Ol%C3%A1!',
    );
  });
});
