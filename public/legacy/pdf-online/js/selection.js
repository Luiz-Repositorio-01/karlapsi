// selection.js — utilidades de Selection/Range (base para formatação sem depender só de execCommand).
export function getSelection() { return window.getSelection(); }

export function getRange() {
  const sel = window.getSelection();
  if (sel && sel.rangeCount) return sel.getRangeAt(0);
  return null;
}

export function saveRange() {
  const r = getRange();
  return r ? r.cloneRange() : null;
}

export function restoreRange(range) {
  if (!range) return;
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

/** Elemento .page__content que contém a seleção atual (ou null). */
export function contentOfSelection() {
  const r = getRange();
  if (!r) return null;
  let node = r.commonAncestorContainer;
  if (node.nodeType === 3) node = node.parentElement;
  return node ? node.closest('.page__content') : null;
}

/** Bloco (p, h1..h6, li, blockquote) que contém o cursor. */
export function currentBlock() {
  const r = getRange();
  if (!r) return null;
  let node = r.startContainer;
  if (node.nodeType === 3) node = node.parentElement;
  while (node && !/^(P|H1|H2|H3|H4|H5|H6|LI|BLOCKQUOTE|DIV|TD|TH)$/.test(node.tagName)) {
    if (node.classList && node.classList.contains('page__content')) return node;
    node = node.parentElement;
  }
  return node;
}

/** True se a seleção está colapsada (só cursor). */
export function isCollapsed() {
  const sel = window.getSelection();
  return !sel || sel.isCollapsed;
}

/** Verifica se um estilo inline está ativo na seleção (queryCommandState quando aplicável). */
export function isCommandActive(cmd) {
  try { return document.queryCommandState(cmd); } catch { return false; }
}

/** Insere um nó no ponto do cursor e posiciona o cursor após ele. */
export function insertNodeAtCaret(node, contentEl) {
  const sel = window.getSelection();
  let range = getRange();
  if (!range || (contentEl && !contentEl.contains(range.commonAncestorContainer))) {
    range = document.createRange();
    range.selectNodeContents(contentEl);
    range.collapse(false);
  }
  range.deleteContents();
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}
