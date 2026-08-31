import 'server-only';

import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * MÓDULOS LEGADOS PRESERVADOS
 *
 * O PDF Online, os infobooks e as landing pages originais continuam sendo
 * arquivos estáticos servidos a partir de `public/legacy/`. Eles NÃO são
 * reescritos nem processados pelo Next.js: são entregues exatamente como
 * estavam. As URLs antigas seguem funcionando pelos rewrites declarados em
 * `next.config.ts`.
 *
 * Este módulo apenas DETECTA a presença desses arquivos, para que o site
 * mostre o conteúdo real quando ele existir e uma instrução clara quando ainda
 * não tiver sido copiado — em vez de exibir um iframe quebrado.
 *
 * Os caminhos absolutos são construídos a partir de segmentos LITERAIS
 * (`public/legacy/...`), mantendo o acesso ao disco restrito a essa subpasta.
 * Isso evita que o empacotador precise rastrear o projeto inteiro e impede
 * qualquer traversal a partir de dados do banco.
 */

const LEGACY_ABS = path.join(process.cwd(), 'public', 'legacy');
const LEGACY_PDF_ABS = path.join(process.cwd(), 'public', 'legacy', 'pdf-online');
const LEGACY_LANDING_ABS = path.join(process.cwd(), 'public', 'legacy', 'landing-pages');
const LEGACY_INFOBOOKS_ABS = path.join(process.cwd(), 'public', 'legacy', 'infobooks');

export const LEGACY_PDF_DIR = 'legacy/pdf-online';
export const LEGACY_LANDING_DIR = 'legacy/landing-pages';

/** Aceita apenas nomes simples de pasta/arquivo (sem `..`, sem `/`). */
function isSafeSegment(segment: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(segment);
}

function existsSafe(absolutePath: string): boolean {
  try {
    return existsSync(absolutePath);
  } catch {
    return false;
  }
}

function readDirSafe(absolutePath: string, options?: { directoriesOnly?: boolean }): string[] {
  if (!existsSafe(absolutePath)) return [];
  try {
    const entries = readdirSync(absolutePath, { withFileTypes: true });
    return entries
      .filter((entry) => (options?.directoriesOnly ? entry.isDirectory() : entry.isFile()))
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

/**
 * Verifica um caminho relativo a /public. Só caminhos dentro de `legacy/` são
 * aceitos — o restante de /public não é consultado por esta API.
 */
export function legacyFileExists(relativePath: string): boolean {
  const normalized = relativePath.replace(/^\/+/, '');
  if (!normalized.startsWith('legacy/')) return false;

  const segments = normalized.slice('legacy/'.length).split('/').filter(Boolean);
  if (segments.length === 0 || !segments.every(isSafeSegment)) return false;

  const resolved = path.join(LEGACY_ABS, ...segments);
  if (!resolved.startsWith(LEGACY_ABS + path.sep)) return false;

  return existsSafe(resolved);
}

/** Caminho público do index.html do PDF Online, se estiver publicado. */
export function getLegacyPdfEntry(): string | null {
  for (const candidate of ['index.html', 'pdf.html']) {
    if (existsSafe(path.join(LEGACY_PDF_ABS, candidate))) {
      return `/${LEGACY_PDF_DIR}/${candidate}`;
    }
  }
  return null;
}

/** PDFs disponíveis para leitura online, quando presentes. */
export function listLegacyPdfFiles(): string[] {
  return readDirSafe(LEGACY_PDF_ABS)
    .filter((file) => file.toLowerCase().endsWith('.pdf'))
    .map((file) => `/${LEGACY_PDF_DIR}/${file}`);
}

/**
 * Resolve o caminho de uma landing page/infobook legado.
 * Aceita o caminho salvo no banco (`legacy_path`) ou a convenção
 * `legacy/landing-pages/<slug>/index.html`.
 */
export function getLegacyEntry(slug: string, legacyPath?: string | null): string | null {
  if (legacyPath && legacyFileExists(legacyPath)) {
    return `/${legacyPath.replace(/^\/+/, '')}`;
  }

  if (!isSafeSegment(slug)) return null;

  const candidates: { abs: string; url: string }[] = [
    {
      abs: path.join(LEGACY_LANDING_ABS, slug, 'index.html'),
      url: `/legacy/landing-pages/${slug}/index.html`,
    },
    {
      abs: path.join(LEGACY_INFOBOOKS_ABS, slug, 'index.html'),
      url: `/legacy/infobooks/${slug}/index.html`,
    },
    {
      abs: path.join(LEGACY_ABS, slug, 'index.html'),
      url: `/legacy/${slug}/index.html`,
    },
  ];

  for (const candidate of candidates) {
    if (existsSafe(candidate.abs)) return candidate.url;
  }
  return null;
}

/** Slugs de módulos legados presentes no disco (vitrines e sitemap). */
export function listLegacyLandingSlugs(): string[] {
  const fromLanding = readDirSafe(LEGACY_LANDING_ABS, { directoriesOnly: true }).filter((name) =>
    existsSafe(path.join(LEGACY_LANDING_ABS, name, 'index.html')),
  );

  const fromInfobooks = readDirSafe(LEGACY_INFOBOOKS_ABS, { directoriesOnly: true }).filter((name) =>
    existsSafe(path.join(LEGACY_INFOBOOKS_ABS, name, 'index.html')),
  );

  return Array.from(new Set([...fromLanding, ...fromInfobooks]));
}
