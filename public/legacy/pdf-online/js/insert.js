// insert.js — inserções diversas no ponto do cursor.
import { el, formatDate, formatDateTime } from './utils.js';
import { editor } from './editor-core.js';
import { insertNodeAtCaret } from './selection.js';

function afterEdit() { editor.markDirty(); editor.snapshot(); }

function targetContent() {
  const c = editor.activeContentEl();
  if (c) c.focus();
  return c;
}

export function insertPageBreak() {
  const c = targetContent(); if (!c) return;
  const hr = el('div', { class: 'pagebreak', contenteditable: 'false' });
  const p = el('p', { html: '<br>' });
  insertNodeAtCaret(hr, c);
  hr.parentNode.insertBefore(p, hr.nextSibling);
  afterEdit();
}

export function insertHorizontalLine() {
  const c = targetContent(); if (!c) return;
  insertNodeAtCaret(el('hr'), c);
  afterEdit();
}

export function insertDate(withTime = false) {
  const c = targetContent(); if (!c) return;
  const txt = withTime ? formatDateTime() : formatDate();
  insertNodeAtCaret(document.createTextNode(txt), c);
  afterEdit();
}

/** Insere um campo de número de página (atualiza sozinho ao paginar). */
export function insertPageNumber(intoHeaderFooter = 'footer') {
  const page = editor.activePageEl();
  if (!page) return;
  const holder = page.querySelector('.page__' + (intoHeaderFooter === 'header' ? 'header' : 'footer'));
  if (!holder) return;
  const span = el('span', { class: 'page__num', contenteditable: 'false', 'data-num': (page.dataset.index | 0) + 1 });
  holder.appendChild(span);
  editor.emit('changed', {});
  afterEdit();
}

export function insertTextBox() {
  const c = targetContent(); if (!c) return;
  const box = el('div', {
    class: 'floatimg', contenteditable: 'false',
    style: { left: '40px', top: '40px', width: '220px', height: 'auto', minHeight: '60px' },
  }, [el('div', {
    contenteditable: 'true', class: 'code', style: { width: '100%', minHeight: '52px', background: '#fffde7', border: '1px solid #e0d000', padding: '6px', fontFamily: 'var(--fonte-documento)' },
    html: 'Caixa de texto', 'data-role': 'textbox',
  })]);
  c.appendChild(box);
  afterEdit();
}

export function insertSymbol(sym) {
  const c = targetContent(); if (!c) return;
  insertNodeAtCaret(document.createTextNode(sym), c);
  afterEdit();
}
