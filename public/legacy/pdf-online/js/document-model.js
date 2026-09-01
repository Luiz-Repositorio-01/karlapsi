// document-model.js — modelo de dados do documento (serializável para IndexedDB).
import { uuid } from './utils.js';
import { defaultSettings } from './page-setup.js';

export function createDocument(title = 'Documento sem título') {
  const now = new Date().toISOString();
  return {
    id: 'doc-' + uuid(),
    title,
    createdAt: now,
    updatedAt: now,
    settings: defaultSettings(),
    pages: [createPage()],
    metadata: { author: '', subject: '', keywords: '' },
    versions: [],
  };
}

export function createPage(html = '') {
  return { id: 'page-' + uuid(), html, header: '', footer: '' };
}

/** Garante que um objeto lido do storage tem todos os campos (migração leve). */
export function normalizeDocument(doc) {
  if (!doc || typeof doc !== 'object') return createDocument();
  const base = createDocument();
  const out = {
    ...base,
    ...doc,
    settings: { ...base.settings, ...(doc.settings || {}) },
    metadata: { ...base.metadata, ...(doc.metadata || {}) },
  };
  out.settings.margins = { ...base.settings.margins, ...((doc.settings && doc.settings.margins) || {}) };
  if (!Array.isArray(out.pages) || out.pages.length === 0) out.pages = [createPage()];
  out.pages = out.pages.map((p) => ({ ...createPage(), ...p }));
  if (!Array.isArray(out.versions)) out.versions = [];
  return out;
}

/** Resumo para listagem (sem HTML pesado). */
export function documentSummary(doc) {
  return {
    id: doc.id,
    title: doc.title,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    pageCount: doc.pages.length,
  };
}
