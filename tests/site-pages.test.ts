import { describe, expect, it } from 'vitest';
import { parseSections, sectionsToText } from '@/lib/content/site-pages';

/**
 * Conteúdo institucional: o painel edita texto simples, o site consome
 * estrutura. A conversão precisa ser reversível para não perder conteúdo em
 * edições sucessivas.
 */
describe('parseSections', () => {
  it('converte títulos, parágrafos e itens', () => {
    const sections = parseSections(
      [
        '## O que é neuropsicologia',
        'A área investiga funções cognitivas.',
        '- Atenção :: sustentar e alternar o foco',
        '- Memória :: registrar e recuperar informação',
        '',
        '## Para quem é',
        '- Crianças',
      ].join('\n'),
    );

    expect(sections).toHaveLength(2);
    expect(sections[0]?.id).toBe('o-que-e-neuropsicologia');
    expect(sections[0]?.heading).toBe('O que é neuropsicologia');
    expect(sections[0]?.body).toBe('A área investiga funções cognitivas.');
    expect(sections[0]?.items).toEqual([
      { title: 'Atenção', description: 'sustentar e alternar o foco' },
      { title: 'Memória', description: 'registrar e recuperar informação' },
    ]);
    expect(sections[1]?.items).toEqual([{ title: 'Crianças', description: undefined }]);
  });

  it('junta parágrafos da mesma seção', () => {
    const sections = parseSections('## Título\nPrimeiro.\nSegundo.');
    expect(sections[0]?.body).toBe('Primeiro.\n\nSegundo.');
  });

  it('cria seção implícita quando o texto começa sem título', () => {
    const sections = parseSections('Texto solto sem título.');
    expect(sections).toHaveLength(1);
    expect(sections[0]?.id).toBe('secao-1');
    expect(sections[0]?.body).toBe('Texto solto sem título.');
  });

  it('devolve lista vazia para entrada vazia', () => {
    expect(parseSections('')).toEqual([]);
    expect(parseSections('   \n  \n')).toEqual([]);
  });
});

describe('sectionsToText', () => {
  it('faz o caminho de volta sem perder conteúdo', () => {
    const original = [
      '## Etapas',
      'O processo tem quatro fases.',
      '- Entrevista :: levantamento da demanda',
      '- Testagem :: aplicação de instrumentos',
    ].join('\n');

    const roundTrip = sectionsToText(parseSections(original));
    expect(roundTrip).toBe(original);
    expect(parseSections(roundTrip)).toEqual(parseSections(original));
  });

  it('gera texto vazio para estrutura vazia', () => {
    expect(sectionsToText([])).toBe('');
  });
});
