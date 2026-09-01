// formatting.js — formatação de texto.
// Estratégia híbrida: funções próprias com Selection/Range para o que o
// execCommand não faz bem (tamanho em pt, entrelinhamento, espaçamento),
// usando execCommand apenas como mecanismo/fallback para comandos consolidados.
import { editor } from './editor-core.js';
import { contentOfSelection, currentBlock, getRange, isCommandActive } from './selection.js';

function afterEdit() {
  editor.markDirty();
  editor.snapshot();
  editor.emit('selection-changed', {});
}

/** Garante que a seleção está dentro de uma folha antes de formatar. */
function ensureInContent() {
  const c = contentOfSelection();
  if (c) return c;
  const active = editor.activeContentEl();
  if (active) { active.focus(); return active; }
  return null;
}

function exec(cmd, value = null) {
  ensureInContent();
  try { document.execCommand('styleWithCSS', false, true); } catch { /* ignore */ }
  try { document.execCommand(cmd, false, value); } catch { /* ignore */ }
  afterEdit();
}

// ---- Inline consolidado ----
export const bold = () => exec('bold');
export const italic = () => exec('italic');
export const underline = () => exec('underline');
export const strike = () => exec('strikeThrough');
export const superscript = () => exec('superscript');
export const subscript = () => exec('subscript');
export const alignLeft = () => exec('justifyLeft');
export const alignCenter = () => exec('justifyCenter');
export const alignRight = () => exec('justifyRight');
export const alignJustify = () => exec('justifyFull');
export const bulletList = () => exec('insertUnorderedList');
export const numberList = () => exec('insertOrderedList');
export const indent = () => exec('indent');
export const outdent = () => exec('outdent');
export const textColor = (color) => exec('foreColor', color);
export const highlight = (color) => exec('hiliteColor', color);

// ---- Fonte e tamanho (conversão para span com estilo real) ----
function normalizeFontTags(content) {
  content.querySelectorAll('font').forEach((f) => {
    const span = document.createElement('span');
    if (f.getAttribute('size') === '7' && f.dataset.pt) span.style.fontSize = f.dataset.pt + 'pt';
    if (f.face) span.style.fontFamily = f.face;
    if (f.color) span.style.color = f.color;
    while (f.firstChild) span.appendChild(f.firstChild);
    f.replaceWith(span);
  });
}

export function fontFamily(family) {
  const content = ensureInContent();
  if (!content) return;
  // Precisa de styleWithCSS=false para gerar <font face> (que convertemos em span).
  try { document.execCommand('styleWithCSS', false, false); } catch { /* ignore */ }
  try { document.execCommand('fontName', false, family); } catch { /* ignore */ }
  content.querySelectorAll('font[face]').forEach((f) => {
    const span = document.createElement('span');
    span.style.fontFamily = f.getAttribute('face');
    while (f.firstChild) span.appendChild(f.firstChild);
    f.replaceWith(span);
  });
  afterEdit();
}

export function fontSize(pt) {
  const content = ensureInContent();
  if (!content) return;
  // Truque: fontSize 7 cria <font size=7>, depois convertemos para span com pt real.
  // Exige styleWithCSS=false para emitir a tag <font> (senão vira "xxx-large").
  try { document.execCommand('styleWithCSS', false, false); } catch { /* ignore */ }
  try { document.execCommand('fontSize', false, '7'); } catch { /* ignore */ }
  content.querySelectorAll('font[size="7"]').forEach((f) => {
    const span = document.createElement('span');
    span.style.fontSize = pt + 'pt';
    while (f.firstChild) span.appendChild(f.firstChild);
    f.replaceWith(span);
  });
  afterEdit();
}

// ---- Operações por bloco ----
function blocksInSelection() {
  const range = getRange();
  const content = ensureInContent();
  if (!content) return [];
  if (!range) { const b = currentBlock(); return b ? [b] : []; }
  const blocks = new Set();
  const all = content.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, div');
  all.forEach((b) => { if (range.intersectsNode(b)) blocks.add(b); });
  if (blocks.size === 0) { const b = currentBlock(); if (b && b !== content) blocks.add(b); }
  return Array.from(blocks);
}

export function lineHeight(value) {
  const blocks = blocksInSelection();
  if (!blocks.length) { const c = ensureInContent(); if (c) c.style.lineHeight = value; }
  blocks.forEach((b) => { b.style.lineHeight = value; });
  afterEdit();
}

export function spaceBefore(px) {
  blocksInSelection().forEach((b) => { b.style.marginTop = px + 'px'; });
  afterEdit();
}
export function spaceAfter(px) {
  blocksInSelection().forEach((b) => { b.style.marginBottom = px + 'px'; });
  afterEdit();
}

export function letterSpacing(em) {
  exec('styleWithCSS');
  const blocks = blocksInSelection();
  blocks.forEach((b) => { b.style.letterSpacing = em + 'em'; });
  afterEdit();
}

// ---- Estilo de parágrafo (Normal, Título 1..4, Citação, etc.) ----
export function paragraphStyle(kind) {
  const map = {
    normal: 'P', h1: 'H1', h2: 'H2', h3: 'H3', h4: 'H4',
    subtitulo: 'H3', citacao: 'BLOCKQUOTE',
  };
  const tag = map[kind] || 'P';
  ensureInContent();
  try { document.execCommand('formatBlock', false, tag); } catch { /* ignore */ }
  // ajustes visuais de "subtítulo" e "citação"
  const b = currentBlock();
  if (b) {
    if (kind === 'subtitulo') { b.style.fontWeight = '500'; b.style.color = '#555'; }
    if (kind === 'citacao') b.classList.add('is-quote');
  }
  afterEdit();
}

// ---- Link ----
export function insertLink(url) {
  if (!url) return;
  ensureInContent();
  try { document.execCommand('createLink', false, url); } catch { /* ignore */ }
  const c = ensureInContent();
  if (c) c.querySelectorAll('a[href]').forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });
  afterEdit();
}
export function removeLink() { exec('unlink'); }

// ---- Limpar formatação ----
export function clearFormatting() {
  ensureInContent();
  try { document.execCommand('removeFormat'); } catch { /* ignore */ }
  const b = currentBlock();
  if (b && b.style) { b.style.cssText = ''; }
  afterEdit();
}

// ---- Área de transferência (com fallback) ----
export const cut = () => exec('cut');
export const copy = () => exec('copy');
export async function paste() {
  const content = ensureInContent();
  if (!content) return;
  try {
    if (navigator.clipboard && navigator.clipboard.read) {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes('text/html')) {
          const blob = await item.getType('text/html');
          const html = await blob.text();
          document.execCommand('insertHTML', false, sanitizePasted(html));
          afterEdit();
          return;
        }
      }
    }
    const text = await navigator.clipboard.readText();
    document.execCommand('insertText', false, text);
    afterEdit();
  } catch {
    // Sem permissão de área de transferência — orienta o atalho nativo.
    try { document.execCommand('paste'); } catch { /* ignore */ }
  }
}

function sanitizePasted(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  tmp.querySelectorAll('script, style, meta, link, iframe, object').forEach((n) => n.remove());
  tmp.querySelectorAll('*').forEach((n) => {
    n.removeAttribute('onclick'); n.removeAttribute('onload'); n.removeAttribute('class'); n.removeAttribute('id');
  });
  return tmp.innerHTML;
}

export function pastePlain() {
  navigator.clipboard?.readText?.().then((t) => {
    ensureInContent();
    document.execCommand('insertText', false, t);
    afterEdit();
  }).catch(() => {
    // fallback: cola normal
    try { document.execCommand('paste'); } catch { /* ignore */ }
  });
}
export const selectAll = () => { const c = ensureInContent(); if (c) { const r = document.createRange(); r.selectNodeContents(c); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } };

// ---- Caixa maiúsc/minúsc/capitalizar (sobre a seleção) ----
export function changeCase(mode) {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return;
  const text = sel.toString();
  let out = text;
  if (mode === 'upper') out = text.toUpperCase();
  else if (mode === 'lower') out = text.toLowerCase();
  else if (mode === 'capitalize') out = text.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
  ensureInContent();
  document.execCommand('insertText', false, out);
  afterEdit();
}

// ---- Estado atual para sincronizar a barra ----
export function queryState() {
  const state = {
    bold: isCommandActive('bold'),
    italic: isCommandActive('italic'),
    underline: isCommandActive('underline'),
    strike: isCommandActive('strikeThrough'),
    ul: isCommandActive('insertUnorderedList'),
    ol: isCommandActive('insertOrderedList'),
    alignLeft: isCommandActive('justifyLeft'),
    alignCenter: isCommandActive('justifyCenter'),
    alignRight: isCommandActive('justifyRight'),
    alignJustify: isCommandActive('justifyFull'),
    block: 'p',
    fontFamily: '',
    fontSize: '',
  };
  const b = currentBlock();
  if (b && b.tagName) state.block = b.tagName.toLowerCase();
  const range = getRange();
  if (range) {
    let node = range.startContainer;
    if (node.nodeType === 3) node = node.parentElement;
    if (node) {
      const cs = getComputedStyle(node);
      state.fontFamily = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      state.fontSize = Math.round(parseFloat(cs.fontSize) * 72 / 96); // px->pt aprox
    }
  }
  return state;
}
