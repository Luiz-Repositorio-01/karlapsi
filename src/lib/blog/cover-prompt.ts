/**
 * Monta o prompt visual da capa a partir do texto do artigo.
 * Funções puras — testáveis sem rede.
 */

export interface CoverPromptInput {
  title: string;
  content: string;
  excerpt?: string;
  /** Identificador único por clique — garante variação mesmo com o mesmo texto. */
  variation: string;
}

export function stripMarkdownForPrompt(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`[^`]+`/g, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extrai termos visuais do artigo para ancorar a capa no conteúdo. */
export function extractVisualThemes(text: string, maxWords = 48): string {
  const stopwords = new Set([
    'a', 'o', 'e', 'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas', 'um', 'uma',
    'para', 'por', 'com', 'sem', 'que', 'como', 'mais', 'muito', 'sobre', 'entre', 'seu', 'sua',
    'seus', 'suas', 'este', 'esta', 'isso', 'essa', 'esse', 'aos', 'às', 'ao', 'à', 'é', 'são',
    'ser', 'estar', 'ter', 'pode', 'podem', 'quando', 'onde', 'qual', 'quais', 'também', 'ainda',
    'the', 'and', 'for', 'with', 'from', 'this', 'that', 'are', 'was', 'were',
  ]);

  const words = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopwords.has(word));

  const unique: string[] = [];
  for (const word of words) {
    if (!unique.includes(word)) unique.push(word);
    if (unique.length >= maxWords) break;
  }

  return unique.join(', ');
}

export function buildBlogCoverPrompt(input: CoverPromptInput): string {
  const plain = stripMarkdownForPrompt(input.content);
  const summary = (input.excerpt?.trim() || plain.slice(0, 520)).replace(/\s+/g, ' ').trim();
  const themes = extractVisualThemes(`${input.title}. ${summary}`);
  const variationToken = input.variation.replace(/-/g, '').slice(0, 12);

  return [
    `Editorial blog cover illustration for a neuropsychology and psychology article.`,
    `Article title: "${input.title.trim()}".`,
    `Core themes and concepts from the article text: ${themes || summary.slice(0, 200)}.`,
    `Visual narrative inspired by this passage: ${summary.slice(0, 280)}.`,
    `Style: premium healthcare editorial, warm and trustworthy, abstract brain wellness and cognitive care symbols,`,
    `soft petrol green (#1E433B) and sand cream palette, soft natural light, cinematic depth,`,
    `no text, no letters, no words, no watermark, no logo, no faces of real people,`,
    `16:9 horizontal composition, high-end magazine cover aesthetic.`,
    `Unique creative variation ${variationToken}.`,
  ].join(' ');
}

export function buildPollinationsImageUrl(prompt: string, seed: number): string {
  const params = new URLSearchParams({
    width: '1200',
    height: '675',
    seed: String(seed),
    nologo: 'true',
    enhance: 'true',
    model: 'flux',
  });

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
}

export function createCoverSeed(variation: string): number {
  let hash = 0;
  const input = `${variation}:${Date.now()}:${Math.random()}`;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash) % 2_147_483_647 || 1;
}
