import { describe, expect, it } from 'vitest';
import {
  buildBlogCoverPrompt,
  buildPollinationsImageUrl,
  createCoverSeed,
  extractVisualThemes,
  stripMarkdownForPrompt,
} from '@/lib/blog/cover-prompt';

describe('stripMarkdownForPrompt', () => {
  it('remove marcações comuns', () => {
    const plain = stripMarkdownForPrompt('## Título\n\n**neuropsicologia** e [link](https://exemplo.com)');
    expect(plain).toContain('Título');
    expect(plain).toContain('neuropsicologia');
    expect(plain).not.toContain('**');
    expect(plain).not.toContain('](');
  });
});

describe('extractVisualThemes', () => {
  it('prioriza substantivos do texto', () => {
    const themes = extractVisualThemes(
      'Avaliação neuropsicologica investiga memoria atencao e funcoes executivas em criancas',
    );
    expect(themes).toContain('avaliacao');
    expect(themes).toContain('neuropsicologica');
    expect(themes).toContain('memoria');
  });
});

describe('buildBlogCoverPrompt', () => {
  it('ancora o prompt no título e no conteúdo', () => {
    const prompt = buildBlogCoverPrompt({
      title: 'Funções executivas na infância',
      content: 'A avaliação neuropsicológica investiga atenção, memória e planejamento.',
      variation: '11111111-2222-3333-4444-555555555555',
    });

    expect(prompt).toContain('Funções executivas na infância');
    expect(prompt).toContain('neuropsychology');
    expect(prompt).toContain('no text');
    expect(prompt).toContain('Unique creative variation');
  });

  it('muda com nova variação', () => {
    const base = {
      title: 'TDAH e aprendizagem',
      content: 'Conteúdo sobre atenção sustentada e organização escolar no dia a dia.',
    };

    const first = buildBlogCoverPrompt({ ...base, variation: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
    const second = buildBlogCoverPrompt({ ...base, variation: 'ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj' });

    expect(first).not.toBe(second);
  });
});

describe('createCoverSeed', () => {
  it('gera seeds diferentes para variações distintas', () => {
    const first = createCoverSeed('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    const second = createCoverSeed('ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj');
    expect(first).not.toBe(second);
  });
});

describe('buildPollinationsImageUrl', () => {
  it('monta URL com seed e dimensões editoriais', () => {
    const url = buildPollinationsImageUrl('test prompt', 42);
    expect(url).toContain('image.pollinations.ai');
    expect(url).toContain('seed=42');
    expect(url).toContain('width=1200');
    expect(url).toContain('height=675');
  });
});
