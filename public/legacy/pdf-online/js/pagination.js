// pagination.js — repaginação automática: redistribui blocos de texto entre páginas
// conforme a altura útil (tamanho da folha - margens), preservando cursor e objetos flutuantes.
import { editor } from './editor-core.js';
import { mmToPx } from './utils.js';
import { pageDimsMm } from './page-setup.js';
import { debounce } from './utils.js';

const FLOAT_SEL = '.floatimg, .chartobj, .shapeobj';
const CARET_ID = '__caret_marker__';

function isFloat(node) {
  return node.nodeType === 1 && node.matches && node.matches(FLOAT_SEL);
}

function availContentPx() {
  const s = editor.doc.settings;
  const { h } = pageDimsMm(s);
  return mmToPx(h - s.margins.top - s.margins.bottom);
}

function placeCaretMarker() {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;
  const range = sel.getRangeAt(0);
  const content = range.startContainer.parentElement?.closest?.('.page__content')
    || (range.startContainer.closest && range.startContainer.closest('.page__content'));
  if (!content) return false;
  const mark = document.createElement('span');
  mark.id = CARET_ID;
  mark.appendChild(document.createTextNode('​'));
  range.insertNode(mark);
  return true;
}

function restoreCaretMarker() {
  const mark = document.getElementById(CARET_ID);
  if (!mark) return;
  const content = mark.closest('.page__content');
  if (content) {
    editor.activePageId = mark.closest('.page').dataset.pageId;
    content.focus();
    const range = document.createRange();
    range.setStartAfter(mark);
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  mark.remove();
}

/** Executa a repaginação de todo o documento. Retorna true se mudou a nº de páginas. */
export function reflow() {
  if (!editor.pagesEl) return false;
  const hadCaret = placeCaretMarker();

  const pages = Array.from(editor.pagesEl.querySelectorAll('.page'));
  if (!pages.length) return false;

  // 1. Extrai objetos flutuantes (guardando a página de origem).
  const floats = [];
  pages.forEach((pg, i) => {
    pg.querySelectorAll(FLOAT_SEL).forEach((f) => { floats.push({ i, node: f }); f.remove(); });
  });

  // 2. Coleta blocos de fluxo em ordem, e cabeçalho/rodapé da 1ª página como modelo.
  const blocks = [];
  const headers = pages.map((p) => p.querySelector('.page__header').innerHTML);
  const footers = pages.map((p) => p.querySelector('.page__footer').innerHTML);
  pages.forEach((pg) => {
    const c = pg.querySelector('.page__content');
    Array.from(c.childNodes).forEach((n) => { if (!isFloat(n)) blocks.push(n); });
  });

  // 3. Reconstrói: mantém a 1ª página, remove as demais.
  const first = pages[0];
  pages.slice(1).forEach((p) => p.remove());
  const firstContent = first.querySelector('.page__content');
  firstContent.innerHTML = '';

  const avail = availContentPx();
  let current = first;
  let curContent = firstContent;
  let pageIndex = 0;
  const madePages = [first];

  const newPage = () => {
    pageIndex++;
    const pd = { id: 'page-' + Math.random().toString(36).slice(2, 10), html: '', header: headers[Math.min(pageIndex, headers.length - 1)] || '', footer: footers[Math.min(pageIndex, footers.length - 1)] || '' };
    const el = editor._buildPageEl(pd, pageIndex);
    editor.pagesEl.appendChild(el);
    madePages.push(el);
    current = el;
    curContent = el.querySelector('.page__content');
  };

  blocks.forEach((node) => {
    curContent.appendChild(node);
    if (curContent.scrollHeight > avail && curContent.childNodes.length > 1) {
      // move este bloco para uma nova página
      curContent.removeChild(node);
      newPage();
      curContent.appendChild(node);
    }
  });

  // 4. Reanexa flutuantes à página correspondente (limitada ao total atual).
  floats.forEach(({ i, node }) => {
    const target = madePages[Math.min(i, madePages.length - 1)].querySelector('.page__content');
    target.appendChild(node);
  });

  // 5. Sincroniza modelo e numeração.
  editor.serialize();
  editor._refreshPageNumbers();

  const changed = madePages.length !== pages.length;
  editor.emit('pages-rendered', {});
  if (hadCaret) restoreCaretMarker();
  editor.emit('changed', {});
  return changed;
}

// Repaginação automática discreta durante a edição (não briga com a digitação).
const autoReflow = debounce(() => {
  // Só age se alguma página estourou a altura útil.
  const avail = availContentPx();
  const overflow = Array.from(editor.pagesEl.querySelectorAll('.page__content'))
    .some((c) => c.scrollHeight > avail + 4);
  if (overflow) reflow();
}, 700);

export function initPagination() {
  editor.pagesEl.addEventListener('input', (e) => {
    if (e.target.closest('.page__content')) autoReflow();
  });
}
