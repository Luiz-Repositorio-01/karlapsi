// ui.js — componentes de interface: modais, menus, miniaturas, propriedades, régua, zoom, busca.
import { $, $$, el, mmToPx } from './utils.js';
import { editor } from './editor-core.js';
import { PAGE_SIZES, MARGIN_PRESETS, LETTERHEADS, pageDimsMm } from './page-setup.js';
import * as Find from './find-replace.js';

// ---------------- Modal genérico ----------------
export function openModal({ title, bodyNode, footNodes, wide }) {
  const overlay = el('div', { class: 'overlay' });
  const dialog = el('div', { class: 'dialog' + (wide ? ' dialog--wide' : '') });
  const close = () => overlay.remove();
  dialog.append(
    el('div', { class: 'dialog__head' }, [
      el('span', { text: title }),
      el('button', { class: 'tbtn', html: '<i class="fa fa-times"></i>', onclick: close }),
    ]),
    el('div', { class: 'dialog__body' }, [bodyNode]),
    el('div', { class: 'dialog__foot' }, footNodes || []),
  );
  overlay.appendChild(dialog);
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
  document.body.appendChild(overlay);
  return { overlay, close };
}

// ---------------- Menu dropdown ----------------
let openMenuEl = null;
export function toggleMenu(menuEl, anchorEl) {
  if (openMenuEl && openMenuEl !== menuEl) closeMenu();
  const showing = !menuEl.hasAttribute('hidden');
  if (showing) { closeMenu(); return; }
  const r = anchorEl.getBoundingClientRect();
  menuEl.style.top = r.bottom + 4 + 'px';
  menuEl.style.left = Math.min(r.left, window.innerWidth - 230) + 'px';
  menuEl.removeAttribute('hidden');
  openMenuEl = menuEl;
  setTimeout(() => document.addEventListener('mousedown', onDocDown), 0);
}
function onDocDown(e) {
  if (openMenuEl && !openMenuEl.contains(e.target)) closeMenu();
}
export function closeMenu() {
  if (openMenuEl) openMenuEl.setAttribute('hidden', '');
  openMenuEl = null;
  document.removeEventListener('mousedown', onDocDown);
}

// ---------------- Seletor de grade de tabela ----------------
export function tableGridPicker(onPick) {
  const grid = el('div', { class: 'tablegrid' });
  const label = el('div', { class: 'tablegrid__label', text: 'Passe o mouse e clique' });
  const cells = [];
  const COLS = 8, ROWS = 8;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = el('div', { class: 'tablegrid__cell', dataset: { r: r + 1, c: c + 1 } });
      cell.addEventListener('mouseenter', () => {
        cells.forEach((x) => x.classList.toggle('on', +x.dataset.r <= r + 1 && +x.dataset.c <= c + 1));
        label.textContent = `${r + 1} × ${c + 1}`;
      });
      cell.addEventListener('click', () => { m.close(); onPick(r + 1, c + 1); });
      cells.push(cell);
      grid.appendChild(cell);
    }
  }
  const m = openModal({ title: 'Inserir tabela', bodyNode: el('div', {}, [grid, label]),
    footNodes: [el('button', { class: 'btn', text: 'Cancelar', onclick: () => m.close() })] });
}

// ---------------- Diálogo de configuração de página ----------------
export function pageSetupDialog() {
  const s = editor.doc.settings;
  const sizeSel = el('select', {},
    [...Object.entries(PAGE_SIZES).map(([k, v]) => el('option', { value: k, text: `${v.label} (${v.w}×${v.h} mm)` })),
     el('option', { value: 'custom', text: 'Personalizado' })]);
  sizeSel.value = s.pageSize;
  const orient = el('select', {}, [
    el('option', { value: 'portrait', text: 'Retrato' }),
    el('option', { value: 'landscape', text: 'Paisagem' }),
  ]);
  orient.value = s.orientation;
  const cw = el('input', { type: 'number', value: s.customW, min: '50', max: '600' });
  const ch = el('input', { type: 'number', value: s.customH, min: '50', max: '900' });
  const customRow = el('div', { class: 'field-row', style: { display: s.pageSize === 'custom' ? 'flex' : 'none' } }, [
    el('div', { class: 'field' }, [el('label', { text: 'Largura (mm)' }), cw]),
    el('div', { class: 'field' }, [el('label', { text: 'Altura (mm)' }), ch]),
  ]);
  sizeSel.addEventListener('change', () => { customRow.style.display = sizeSel.value === 'custom' ? 'flex' : 'none'; });

  const presetSel = el('select', {},
    [...Object.entries(MARGIN_PRESETS).map(([k, v]) => el('option', { value: k, text: v.label })),
     el('option', { value: 'personalizada', text: 'Personalizada' })]);
  presetSel.value = s.marginPreset || 'normal';
  const mkM = (v) => el('input', { type: 'number', value: v, min: '0', max: '100', step: '0.1' });
  const mt = mkM(s.margins.top), mr = mkM(s.margins.right), mb = mkM(s.margins.bottom), ml = mkM(s.margins.left);
  presetSel.addEventListener('change', () => {
    const p = MARGIN_PRESETS[presetSel.value];
    if (p) { mt.value = p.top; mr.value = p.right; mb.value = p.bottom; ml.value = p.left; }
  });

  const letterSel = el('select', {},
    Object.entries(LETTERHEADS).map(([k, v]) => el('option', { value: k, text: v.label })));
  letterSel.value = s.letterhead || 'none';
  letterSel.addEventListener('change', () => {
    const lh = LETTERHEADS[letterSel.value];
    if (lh && lh.margins) {
      mt.value = lh.margins.top; mr.value = lh.margins.right; mb.value = lh.margins.bottom; ml.value = lh.margins.left;
      presetSel.value = 'timbrado';
    }
  });

  const body = el('div', {}, [
    el('div', { class: 'field-row' }, [
      el('div', { class: 'field' }, [el('label', { text: 'Tamanho' }), sizeSel]),
      el('div', { class: 'field' }, [el('label', { text: 'Orientação' }), orient]),
    ]),
    customRow,
    el('div', { class: 'field' }, [el('label', { text: 'Papel timbrado' }), letterSel]),
    el('div', { class: 'field' }, [el('label', { text: 'Margens (preset)' }), presetSel]),
    el('div', { class: 'field-row' }, [
      el('div', { class: 'field' }, [el('label', { text: 'Superior' }), mt]),
      el('div', { class: 'field' }, [el('label', { text: 'Inferior' }), mb]),
      el('div', { class: 'field' }, [el('label', { text: 'Esquerda' }), ml]),
      el('div', { class: 'field' }, [el('label', { text: 'Direita' }), mr]),
    ]),
    el('p', { class: 'hint', text: 'As margens e o tamanho são aplicados imediatamente a todas as páginas.' }),
  ]);

  const apply = () => {
    editor.applySettings({
      pageSize: sizeSel.value,
      orientation: orient.value,
      customW: +cw.value, customH: +ch.value,
      letterhead: letterSel.value,
      marginPreset: presetSel.value,
      margins: { top: +mt.value, right: +mr.value, bottom: +mb.value, left: +ml.value },
    });
    m.close();
  };
  const m = openModal({
    title: 'Configuração da página', bodyNode: body,
    footNodes: [
      el('button', { class: 'btn', text: 'Cancelar', onclick: () => m.close() }),
      el('button', { class: 'btn btn--primary', text: 'Aplicar', onclick: apply }),
    ],
  });
}

// ---------------- Diálogo de link ----------------
export function linkDialog(onOk) {
  const input = el('input', { type: 'url', placeholder: 'https://…' });
  const body = el('div', {}, [el('div', { class: 'field' }, [el('label', { text: 'Endereço do link' }), input])]);
  const m = openModal({
    title: 'Inserir link', bodyNode: body,
    footNodes: [
      el('button', { class: 'btn', text: 'Cancelar', onclick: () => m.close() }),
      el('button', { class: 'btn btn--primary', text: 'Inserir', onclick: () => { onOk(input.value.trim()); m.close(); } }),
    ],
  });
  setTimeout(() => input.focus(), 50);
}

// ---------------- Miniaturas (painel esquerdo) ----------------
export function renderThumbnails(container, onSelect) {
  container.innerHTML = '';
  const pages = editor.pagesEl.querySelectorAll('.page');
  pages.forEach((pageEl, i) => {
    const thumb = el('div', { class: 'thumb' + (pageEl.dataset.pageId === editor.activePageId ? ' is-active' : '') });
    // Clona a folha em escala reduzida.
    const clone = pageEl.cloneNode(true);
    clone.classList.remove('is-active');
    clone.querySelectorAll('[contenteditable]').forEach((n) => n.removeAttribute('contenteditable'));
    clone.querySelectorAll('.floatimg__handle, .floatimg__del').forEach((n) => n.remove());
    const mini = el('div', { class: 'thumb__mini' }, [clone]);
    // escala: largura do thumb / largura da página
    requestAnimationFrame(() => {
      const scale = (container.clientWidth - 20) / pageEl.offsetWidth;
      mini.style.transform = `scale(${scale})`;
    });
    thumb.append(mini, el('span', { class: 'thumb__num', text: i + 1 }));
    thumb.addEventListener('click', () => onSelect(pageEl.dataset.pageId));
    container.appendChild(thumb);
  });
}

// ---------------- Painel de propriedades ----------------
export function renderProps(container) {
  const s = editor.doc.settings;
  const dims = pageDimsMm(s);
  const st = editor.stats();
  container.innerHTML = '';
  container.append(
    el('div', { class: 'prop-group' }, [
      el('h4', { text: 'Documento' }),
      propLine('Título', editor.doc.title),
      propLine('Páginas', String(st.pages)),
      propLine('Palavras', String(st.words)),
      propLine('Caracteres', String(st.chars)),
    ]),
    el('div', { class: 'prop-group' }, [
      el('h4', { text: 'Página' }),
      propLine('Tamanho', `${s.pageSize} — ${dims.w}×${dims.h} mm`),
      propLine('Orientação', s.orientation === 'landscape' ? 'Paisagem' : 'Retrato'),
      propLine('Margens', `${s.margins.top}/${s.margins.right}/${s.margins.bottom}/${s.margins.left} mm`),
      propLine('Fonte base', `${s.fontFamily} ${s.fontSize}pt`),
    ]),
  );
}
function propLine(k, v) {
  return el('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '3px 0', gap: '8px' } }, [
    el('span', { style: { color: 'var(--cor-texto-fraco)' }, text: k }),
    el('span', { style: { textAlign: 'right' }, text: v }),
  ]);
}

// ---------------- Barra de busca ----------------
export function initFindbar(bar) {
  const term = $('#findTerm', bar);
  const repl = $('#findRepl', bar);
  const count = $('#findCount', bar);
  const showCount = (r) => { count.textContent = r.count ? `${r.current}/${r.count}` : '0/0'; };

  $('#findNext', bar).addEventListener('click', () => showCount(Find.next()));
  $('#findPrev', bar).addEventListener('click', () => showCount(Find.prev()));
  $('#findReplaceOne', bar).addEventListener('click', () => showCount(Find.replaceOne(repl.value)));
  $('#findReplaceAll', bar).addEventListener('click', () => {
    const n = Find.replaceAll(term.value, repl.value, $('#findCase', bar).checked);
    count.textContent = `${n} subst.`;
  });
  $('#findClose', bar).addEventListener('click', () => { Find.close(); bar.setAttribute('hidden', ''); });
  let t;
  term.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => showCount(Find.find(term.value, $('#findCase', bar).checked)), 200);
  });
  term.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); showCount(Find.next()); } });
}
export function openFindbar(bar, withReplace) {
  bar.removeAttribute('hidden');
  bar.querySelector('.findbar__replace').style.display = withReplace ? 'flex' : 'none';
  const term = $('#findTerm', bar);
  const sel = window.getSelection();
  if (sel && !sel.isCollapsed) term.value = sel.toString();
  term.focus(); term.select();
}
