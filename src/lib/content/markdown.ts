/**
 * Renderizador Markdown mínimo e seguro.
 *
 * Estratégia de segurança (proteção contra XSS):
 * 1. TODO o texto de entrada é escapado primeiro (`&`, `<`, `>`, `"`, `'`).
 *    Assim, qualquer HTML vindo do editor deixa de ser executável.
 * 2. Somente depois as marcações Markdown são convertidas nas tags que ESTA
 *    função gera. Nenhuma tag do autor sobrevive.
 * 3. URLs de links passam por allowlist de protocolo (http, https, mailto e
 *    caminhos relativos) — `javascript:` e `data:` são descartados.
 *
 * Escopo intencionalmente pequeno: títulos, parágrafos, listas, ênfase,
 * links, citações, código e linha horizontal. Sem dependência externa e sem
 * possibilidade de injeção.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) return trimmed;
  if (/^\/[^/]/.test(trimmed) || trimmed.startsWith('/')) return trimmed;
  if (/^#[\w-]+$/.test(trimmed)) return trimmed;
  return null;
}

function renderInline(text: string): string {
  let output = text;

  // Código inline primeiro, para não sofrer as outras substituições.
  output = output.replace(/`([^`]+)`/g, (_match, code: string) => `<code>${code}</code>`);

  // Links [texto](url)
  output = output.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_match, label: string, url: string) => {
      const href = safeUrl(url.replace(/&amp;/g, '&'));
      if (!href) return label;
      const external = /^https?:\/\//i.test(href);
      const rel = external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${escapeHtml(href)}"${rel}>${label}</a>`;
    },
  );

  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  output = output.replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>');

  return output;
}

export function renderMarkdown(markdown: string): string {
  const escaped = escapeHtml(markdown.replace(/\r\n/g, '\n'));
  const lines = escaped.split('\n');
  const html: string[] = [];

  let listType: 'ul' | 'ol' | null = null;
  let paragraph: string[] = [];
  let quote: string[] = [];

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      html.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };

  const flushQuote = () => {
    if (quote.length > 0) {
      html.push(`<blockquote>${renderInline(quote.join(' '))}</blockquote>`);
      quote = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim() === '') {
      flushParagraph();
      flushQuote();
      closeList();
      continue;
    }

    const heading = /^(#{2,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushQuote();
      closeList();
      const level = heading[1]!.length;
      html.push(`<h${level}>${renderInline(heading[2]!)}</h${level}>`);
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushParagraph();
      flushQuote();
      closeList();
      html.push('<hr />');
      continue;
    }

    const quoteMatch = /^&gt;\s?(.*)$/.exec(line);
    if (quoteMatch) {
      flushParagraph();
      closeList();
      quote.push(quoteMatch[1]!);
      continue;
    }

    const unordered = /^[-*+]\s+(.*)$/.exec(line.trim());
    if (unordered) {
      flushParagraph();
      flushQuote();
      if (listType !== 'ul') {
        closeList();
        html.push('<ul>');
        listType = 'ul';
      }
      html.push(`<li>${renderInline(unordered[1]!)}</li>`);
      continue;
    }

    const ordered = /^\d+[.)]\s+(.*)$/.exec(line.trim());
    if (ordered) {
      flushParagraph();
      flushQuote();
      if (listType !== 'ol') {
        closeList();
        html.push('<ol>');
        listType = 'ol';
      }
      html.push(`<li>${renderInline(ordered[1]!)}</li>`);
      continue;
    }

    flushQuote();
    closeList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushQuote();
  closeList();

  return html.join('\n');
}

/** Resumo automático quando o autor não escreveu um `excerpt`. */
export function excerptFromMarkdown(markdown: string, maxLength = 180): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).replace(/\s+\S*$/, '')}…`;
}
