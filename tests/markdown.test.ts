import { describe, expect, it } from 'vitest';
import { excerptFromMarkdown, renderMarkdown } from '@/lib/content/markdown';

/**
 * O conteúdo do blog é escrito no painel e renderizado como HTML. Estes testes
 * garantem que nenhuma marcação do autor consiga executar script no site.
 */
describe('renderMarkdown — segurança', () => {
  it('escapa tags HTML em vez de executá-las', () => {
    const html = renderMarkdown('<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapa atributos de evento em HTML embutido', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('descarta link com protocolo javascript', () => {
    const html = renderMarkdown('[clique](javascript:alert(1))');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('clique');
  });

  it('descarta link com data: URI', () => {
    const html = renderMarkdown('[x](data:text/html;base64,PHNjcmlwdD4=)');
    expect(html).not.toContain('data:text/html');
  });

  it('mantém links http externos com rel de segurança', () => {
    const html = renderMarkdown('[site](https://example.com)');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  it('mantém link interno sem target', () => {
    const html = renderMarkdown('[serviços](/servicos)');
    expect(html).toContain('href="/servicos"');
    expect(html).not.toContain('target="_blank"');
  });
});

describe('renderMarkdown — formatação', () => {
  it('converte títulos de nível 2 a 4', () => {
    expect(renderMarkdown('## Título')).toContain('<h2>Título</h2>');
    expect(renderMarkdown('### Sub')).toContain('<h3>Sub</h3>');
  });

  it('converte parágrafos separados por linha em branco', () => {
    const html = renderMarkdown('Primeiro.\n\nSegundo.');
    expect(html).toContain('<p>Primeiro.</p>');
    expect(html).toContain('<p>Segundo.</p>');
  });

  it('converte lista não ordenada', () => {
    const html = renderMarkdown('- um\n- dois');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>um</li>');
    expect(html).toContain('<li>dois</li>');
  });

  it('converte lista ordenada', () => {
    const html = renderMarkdown('1. primeiro\n2. segundo');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>primeiro</li>');
  });

  it('converte negrito, itálico e código', () => {
    const html = renderMarkdown('Texto **forte**, *suave* e `codigo`.');
    expect(html).toContain('<strong>forte</strong>');
    expect(html).toContain('<em>suave</em>');
    expect(html).toContain('<code>codigo</code>');
  });

  it('converte citação', () => {
    const html = renderMarkdown('> uma citação');
    expect(html).toContain('<blockquote>uma citação</blockquote>');
  });

  it('converte linha horizontal', () => {
    expect(renderMarkdown('---')).toContain('<hr />');
  });

  it('não deixa lista aberta ao final do documento', () => {
    const html = renderMarkdown('- um');
    expect(html.match(/<ul>/g)?.length).toBe(1);
    expect(html.match(/<\/ul>/g)?.length).toBe(1);
  });
});

describe('excerptFromMarkdown', () => {
  it('remove marcações e limita o tamanho', () => {
    const excerpt = excerptFromMarkdown(
      '## Título\n\nEste é um **texto** com [link](https://example.com) e muito conteúdo adicional para forçar o corte do resumo automático em algum ponto razoável do texto.',
      60,
    );

    expect(excerpt).not.toContain('#');
    expect(excerpt).not.toContain('**');
    expect(excerpt).not.toContain('https://');
    expect(excerpt.length).toBeLessThanOrEqual(61);
    expect(excerpt.endsWith('…')).toBe(true);
  });

  it('mantém o texto quando ele já é curto', () => {
    expect(excerptFromMarkdown('Texto curto.')).toBe('Texto curto.');
  });
});
