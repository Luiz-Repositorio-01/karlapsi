// tables.js — tabelas HTML reais editáveis + barra de contexto.
import { el } from './utils.js';
import { editor } from './editor-core.js';
import { getRange, insertNodeAtCaret } from './selection.js';

let toolbar = null;

function afterEdit() { editor.markDirty(); editor.snapshot(); }

export function insertTable(rows = 3, cols = 3, withHeader = true) {
  const content = editor.activeContentEl();
  if (!content) return;
  content.focus();

  const table = el('table', { class: 'striped' });
  if (withHeader) {
    const thead = el('thead');
    const tr = el('tr');
    for (let c = 0; c < cols; c++) tr.appendChild(el('th', { html: '&nbsp;' }));
    thead.appendChild(tr);
    table.appendChild(thead);
  }
  const tbody = el('tbody');
  const bodyRows = withHeader ? rows - 1 : rows;
  for (let r = 0; r < Math.max(1, bodyRows); r++) {
    const tr = el('tr');
    for (let c = 0; c < cols; c++) tr.appendChild(el('td', { html: '&nbsp;' }));
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  const wrap = el('p');
  wrap.appendChild(table);
  const after = el('p', { html: '<br>' });

  insertNodeAtCaret(after, content);
  after.parentNode.insertBefore(wrap, after);
  afterEdit();
}

// ---- Detecção de célula atual ----
function currentCell() {
  const r = getRange();
  if (!r) return null;
  let n = r.startContainer;
  if (n.nodeType === 3) n = n.parentElement;
  return n ? n.closest('td, th') : null;
}
function currentTable() {
  const c = currentCell();
  return c ? c.closest('table') : null;
}
function cellIndex(cell) {
  return Array.from(cell.parentElement.children).indexOf(cell);
}

// ---- Operações ----
export function addRow(where) {
  const cell = currentCell(); if (!cell) return;
  const tr = cell.closest('tr');
  const cols = tr.children.length;
  const nr = el('tr');
  for (let i = 0; i < cols; i++) nr.appendChild(el('td', { html: '&nbsp;' }));
  if (where === 'above') tr.parentNode.insertBefore(nr, tr);
  else tr.parentNode.insertBefore(nr, tr.nextSibling);
  afterEdit();
}

export function addColumn(where) {
  const cell = currentCell(); if (!cell) return;
  const table = cell.closest('table');
  const idx = cellIndex(cell);
  table.querySelectorAll('tr').forEach((tr) => {
    const isHead = tr.parentElement.tagName === 'THEAD';
    const nc = el(isHead ? 'th' : 'td', { html: '&nbsp;' });
    const ref = tr.children[idx];
    if (where === 'left') tr.insertBefore(nc, ref);
    else tr.insertBefore(nc, ref ? ref.nextSibling : null);
  });
  afterEdit();
}

export function deleteRow() {
  const cell = currentCell(); if (!cell) return;
  const tr = cell.closest('tr');
  const table = tr.closest('table');
  if (table.querySelectorAll('tr').length <= 1) { deleteTable(); return; }
  tr.remove();
  afterEdit();
}

export function deleteColumn() {
  const cell = currentCell(); if (!cell) return;
  const table = cell.closest('table');
  const idx = cellIndex(cell);
  const firstRow = table.querySelector('tr');
  if (firstRow && firstRow.children.length <= 1) { deleteTable(); return; }
  table.querySelectorAll('tr').forEach((tr) => { if (tr.children[idx]) tr.children[idx].remove(); });
  afterEdit();
}

export function deleteTable() {
  const table = currentTable(); if (!table) return;
  const wrap = table.closest('p') || table;
  wrap.remove();
  hideToolbar();
  afterEdit();
}

// Mescla a célula atual com a próxima da mesma linha (colspan).
export function mergeRight() {
  const cell = currentCell(); if (!cell) return;
  const next = cell.nextElementSibling;
  if (!next) return;
  const span = (parseInt(cell.getAttribute('colspan') || '1', 10)) + (parseInt(next.getAttribute('colspan') || '1', 10));
  cell.setAttribute('colspan', span);
  if (next.innerHTML.trim() && next.innerHTML.trim() !== '&nbsp;') cell.innerHTML += ' ' + next.innerHTML;
  next.remove();
  afterEdit();
}

// Divide célula mesclada (reduz colspan devolvendo uma célula).
export function splitCell() {
  const cell = currentCell(); if (!cell) return;
  const span = parseInt(cell.getAttribute('colspan') || '1', 10);
  if (span <= 1) return;
  cell.setAttribute('colspan', span - 1);
  const nc = el(cell.tagName.toLowerCase(), { html: '&nbsp;' });
  cell.parentNode.insertBefore(nc, cell.nextSibling);
  afterEdit();
}

export function toggleBorders() {
  const table = currentTable(); if (!table) return;
  table.classList.toggle('no-border');
  afterEdit();
}
export function toggleStriped() {
  const table = currentTable(); if (!table) return;
  table.classList.toggle('striped');
  afterEdit();
}

// ---- Barra de contexto flutuante ----
function buildToolbar() {
  const tb = el('div', { class: 'table-toolbar' });
  const btn = (icon, title, fn) => el('button', {
    class: 'tbtn', title, onmousedown: (e) => e.preventDefault(),
    onclick: fn, html: `<i class="fa ${icon}"></i>`,
  });
  tb.append(
    btn('fa-arrow-up', 'Inserir linha acima', () => addRow('above')),
    btn('fa-arrow-down', 'Inserir linha abaixo', () => addRow('below')),
    btn('fa-arrow-left', 'Coluna à esquerda', () => addColumn('left')),
    btn('fa-arrow-right', 'Coluna à direita', () => addColumn('right')),
    btn('fa-delete-left', 'Excluir linha', deleteRow),
    btn('fa-eraser', 'Excluir coluna', deleteColumn),
    btn('fa-object-group', 'Mesclar com a próxima', mergeRight),
    btn('fa-object-ungroup', 'Dividir célula', splitCell),
    btn('fa-border-all', 'Alternar bordas', toggleBorders),
    btn('fa-table-cells', 'Alternar zebra', toggleStriped),
    btn('fa-trash', 'Excluir tabela', deleteTable),
  );
  document.body.appendChild(tb);
  return tb;
}

function showToolbarFor(table) {
  if (!toolbar) toolbar = buildToolbar();
  const rect = table.getBoundingClientRect();
  toolbar.style.display = 'flex';
  toolbar.style.top = Math.max(8, rect.top - toolbar.offsetHeight - 6) + 'px';
  toolbar.style.left = Math.max(8, rect.left) + 'px';
}
function hideToolbar() { if (toolbar) toolbar.style.display = 'none'; }

export function initTables() {
  editor.addEventListener('selection-changed', () => {
    const table = currentTable();
    if (table) showToolbarFor(table);
    else hideToolbar();
  });
  editor.addEventListener('pages-rendered', hideToolbar);
  window.addEventListener('scroll', () => { const t = currentTable(); if (t) showToolbarFor(t); }, true);
}
