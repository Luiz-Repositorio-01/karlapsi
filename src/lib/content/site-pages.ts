import type { SitePageSection } from '@/lib/types';

/**
 * Conversão entre o texto editável no painel e a estrutura `sections` de
 * `site_pages`.
 *
 * Formato adotado (para não exigir JSON de quem escreve):
 *
 *   ## Título da seção
 *   Parágrafo livre da seção.
 *   - Item da lista :: descrição do item
 *
 * Funções puras — ficam fora do arquivo de Server Actions (que só pode
 * exportar funções assíncronas) e são reutilizadas na leitura e na escrita.
 */

/** Converte o texto das seções na estrutura salva no banco. */
export function parseSections(input: string): SitePageSection[] {
  const sections: SitePageSection[] = [];
  let current: SitePageSection | null = null;
  let index = 0;

  const slugify = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);

  for (const rawLine of input.replace(/\r\n/g, '\n').split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const headingMatch = /^##\s+(.*)$/.exec(line);
    if (headingMatch) {
      index += 1;
      current = {
        id: slugify(headingMatch[1]!) || `secao-${index}`,
        heading: headingMatch[1]!,
      };
      sections.push(current);
      continue;
    }

    if (!current) {
      index += 1;
      current = { id: `secao-${index}`, heading: 'Seção' };
      sections.push(current);
    }

    const itemMatch = /^[-*]\s+(.*)$/.exec(line);
    if (itemMatch) {
      const [title, description] = itemMatch[1]!.split('::').map((part) => part.trim());
      current.items = [...(current.items ?? []), { title: title ?? '', description }];
      continue;
    }

    current.body = current.body ? `${current.body}\n\n${line}` : line;
  }

  return sections;
}

/** Converte a estrutura do banco de volta para o texto editável. */
export function sectionsToText(sections: SitePageSection[]): string {
  return sections
    .map((section) => {
      const lines = [`## ${section.heading}`];
      if (section.body) lines.push(section.body);
      for (const item of section.items ?? []) {
        lines.push(`- ${item.title}${item.description ? ` :: ${item.description}` : ''}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');
}
