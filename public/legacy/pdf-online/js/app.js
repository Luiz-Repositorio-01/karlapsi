// app.js — bootstrap do editor: conecta ribbon, menus, painéis e módulos.
import { $, $$, el, clamp, toast, formatDate } from './utils.js';
import { editor } from './editor-core.js';
import { createDocument } from './document-model.js';
import { getDoc, listDocs, deleteDoc, getLastDocId, getPrefs, setPref } from './storage.js';
import { initAutosave, saveNow } from './autosave.js';
import { initShortcuts } from './keyboard-shortcuts.js';
import { initTables, insertTable } from './tables.js';
import { initImages, pickImage } from './images.js';
import { initCharts, insertChart } from './charts.js';
import { initShapes, insertShape } from './shapes.js';
import { initPagination, reflow } from './pagination.js';
import { exportDoc } from './docx-export.js';
import * as Templates from './templates.js';
import * as F from './formatting.js';
import * as Insert from './insert.js';
import * as PDF from './pdf-export.js';
import { printDocument } from './print.js';
import { importFile } from './import.js';
import * as UI from './ui.js';

const state = { zoom: 1 };

// --------------------------------------------------------------------------
// Ações mapeadas por data-cmd nos botões do ribbon.
// --------------------------------------------------------------------------
const ACTIONS = {
  // inline
  bold: F.bold, italic: F.italic, underline: F.underline, strike: F.strike,
  superscript: F.superscript, subscript: F.subscript,
  alignLeft: F.alignLeft, alignCenter: F.alignCenter, alignRight: F.alignRight, alignJustify: F.alignJustify,
  ul: F.bulletList, ol: F.numberList, indent: F.indent, outdent: F.outdent,
  clearFormat: F.clearFormatting,
  upper: () => F.changeCase('upper'), lower: () => F.changeCase('lower'), capitalize: () => F.changeCase('capitalize'),
  cut: F.cut, copy: F.copy, paste: F.paste, pastePlain: F.pastePlain, selectAll: F.selectAll,
  link: () => UI.linkDialog((url) => F.insertLink(url)),
  unlink: F.removeLink,

  // inserir
  table: () => UI.tableGridPicker((r, c) => insertTable(r, c, true)),
  image: pickImage,
  chart: insertChart,
  shapeLine: () => insertShape('line'),
  shapeArrow: () => insertShape('arrow'),
  shapeRect: () => insertShape('rect'),
  shapeRound: () => insertShape('roundrect'),
  shapeEllipse: () => insertShape('ellipse'),
  shapeTriangle: () => insertShape('triangle'),
  shapeDiamond: () => insertShape('diamond'),
  shapeStar: () => insertShape('star'),
  hr: Insert.insertHorizontalLine,
  pageBreak: Insert.insertPageBreak,
  date: () => Insert.insertDate(false),
  datetime: () => Insert.insertDate(true),
  pageNumFooter: () => Insert.insertPageNumber('footer'),
  pageNumHeader: () => Insert.insertPageNumber('header'),
  textbox: Insert.insertTextBox,

  // layout / páginas
  pageSetup: UI.pageSetupDialog,
  orientationPortrait: () => editor.applySettings({ orientation: 'portrait' }),
  orientationLandscape: () => editor.applySettings({ orientation: 'landscape' }),
  letterheadKarla: () => { editor.applySettings({ letterhead: 'karla', marginPreset: 'timbrado', margins: { top: 52, right: 22, bottom: 59, left: 22 } }); toast('Timbrado da Karla aplicado.', 'ok'); },
  letterheadNone: () => { editor.applySettings({ letterhead: 'none' }); toast('Timbrado removido.'); },
  addPage: () => editor.addPage(),
  duplicatePage: () => editor.duplicatePage(),
  deletePage: () => confirmDeletePage(),
  movePageUp: () => editor.movePage(editor.activePageId, -1),
  movePageDown: () => editor.movePage(editor.activePageId, +1),
  reflow: () => { reflow(); toast('Páginas reajustadas.', 'ok'); },

  // modelos da Karla (sobre o timbrado)
  modeloRecibo: Templates.abrirRecibo,
  modeloComprovante: Templates.abrirComprovante,
  modeloComprovantePag: Templates.abrirComprovantePagamento,
  modeloDeclaracao: Templates.abrirDeclaracao,
  modeloDados: Templates.abrirDadosProfissional,

  // documento
  newDoc: () => newDocument(),
  open: () => openDocDialog(),
  save: () => saveNow(),
  print: () => { reflow(); printDocument(); },
  exportSearchable: () => { reflow(); PDF.exportSearchable(); },
  exportRaster: () => { reflow(); PDF.exportRasterPDF(); },
  exportHTML: () => PDF.exportHTML(),
  exportDoc: () => exportDoc(),
  importFile: () => pickImportFile(),

  // edição
  undo: () => editor.undo(),
  redo: () => editor.redo(),

  // Esc: sai do modo foco, fecha menus e a barra de busca
  escape: () => {
    const app = document.querySelector('.app');
    if (app.classList.contains('mode-focus')) app.classList.remove('mode-focus');
    UI.closeMenu();
    closeDrawers();
    const fb = $('#findbar');
    if (fb && !fb.hasAttribute('hidden')) fb.setAttribute('hidden', '');
  },

  // revisão / exibir
  find: () => UI.openFindbar($('#findbar'), false),
  replace: () => UI.openFindbar($('#findbar'), true),
  toggleLeft: () => togglePanel('left'),
  toggleRight: () => togglePanel('right'),
  toggleRuler: () => document.querySelector('.app').classList.toggle('show-ruler'),
  toggleMargins: () => document.querySelector('.app').classList.toggle('hide-margins'),
  toggleHF: () => document.querySelector('.app').classList.toggle('hide-hf'),
  focusMode: () => document.querySelector('.app').classList.toggle('mode-focus'),
  toggleTheme: () => toggleTheme(),
  zoomIn: () => setZoom(state.zoom + 0.1),
  zoomOut: () => setZoom(state.zoom - 0.1),
  zoomFit: () => fitWidth(),
};

// --------------------------------------------------------------------------
// Inicialização
// --------------------------------------------------------------------------
async function boot() {
  editor.init($('#pages'));
  initEditorEvents();
  bindRibbon();
  bindTabs();
  bindMenus();
  bindSelectsAndColors();
  bindZoom();
  UI.initFindbar($('#findbar'));
  initTables();
  initImages($('#canvas'));
  initCharts();
  initShapes();
  initPagination();
  initAutosave($('#saveStatus'));
  initShortcuts(ACTIONS);
  applyStoredPrefs();
  buildRuler();
  initTouch();

  // Carrega último documento ou cria um novo.
  const params = new URLSearchParams(location.search);
  const wantId = params.get('doc') || getLastDocId();
  let doc = null;
  if (wantId) { try { doc = await getDoc(wantId); } catch { /* ignore */ } }
  editor.loadDoc(doc || createDocument());

  registerServiceWorker();
}

function initEditorEvents() {
  const refresh = () => { updateStats(); refreshUndoRedo(); };
  editor.addEventListener('changed', refresh);
  editor.addEventListener('doc-loaded', () => {
    $('#docTitle').value = editor.doc.title;
    refresh();
    refreshThumbs();
    UI.renderProps($('#props'));
  });
  editor.addEventListener('pages-rendered', () => { refreshThumbs(); applyZoom(); });
  editor.addEventListener('selection-changed', syncToolbarState);
  editor.addEventListener('dirty', () => { updateStats(); });
  editor.history.onChange = (u, r) => {
    $$('[data-cmd="undo"]').forEach((b) => (b.disabled = !u));
    $$('[data-cmd="redo"]').forEach((b) => (b.disabled = !r));
  };

  // título editável
  $('#docTitle').addEventListener('input', (e) => { editor.doc.title = e.target.value || 'Documento sem título'; editor.markDirty(); });

  // atualiza miniaturas/props ao digitar (leve, debounce via rAF)
  let raf;
  editor.addEventListener('dirty', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { UI.renderProps($('#props')); });
  });
}

function refreshThumbs() {
  const c = $('#thumbs');
  if (c) UI.renderThumbnails(c, (id) => {
    editor.activePageId = id;
    const p = editor.pagesEl.querySelector(`.page[data-page-id="${id}"]`);
    if (p) { p.scrollIntoView({ behavior: 'smooth', block: 'start' }); p.querySelector('.page__content').focus(); }
    if (isMobile()) closeDrawers();
    refreshThumbs();
  });
}

function updateStats() {
  const s = editor.stats();
  $('#statPages').textContent = `${s.pages} pág.`;
  $('#statWords').textContent = `${s.words} palavras`;
  $('#statChars').textContent = `${s.chars} caracteres`;
}
function refreshUndoRedo() { editor.history._notify(); }

// --------------------------------------------------------------------------
// Ribbon / abas / menus
// --------------------------------------------------------------------------
function bindRibbon() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cmd]');
    if (!btn || btn.disabled) return;
    const cmd = btn.dataset.cmd;
    const fn = ACTIONS[cmd];
    if (fn) { e.preventDefault(); fn(); UI.closeMenu(); }
  });
  // Preserva a seleção do texto ao clicar em botões do ribbon.
  $$('.ribbon, .table-toolbar').forEach((r) => r.addEventListener('mousedown', (e) => {
    if (e.target.closest('.tbtn, .tcolor')) e.preventDefault();
  }));
  document.querySelector('.ribbon').addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) e.preventDefault();
  });
}

function bindTabs() {
  $$('.tab').forEach((tab) => tab.addEventListener('click', () => {
    $$('.tab').forEach((t) => t.setAttribute('aria-selected', 'false'));
    tab.setAttribute('aria-selected', 'true');
    const name = tab.dataset.tab;
    $$('.ribbon__panel').forEach((p) => p.classList.toggle('is-active', p.dataset.panel === name));
  }));
}

function bindMenus() {
  $$('[data-menu]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = $('#' + btn.dataset.menu);
      if (menu) UI.toggleMenu(menu, btn);
    });
  });
}

function bindSelectsAndColors() {
  const selFont = $('#selFont');
  const selSize = $('#selSize');
  const selStyle = $('#selStyle');
  selFont?.addEventListener('change', () => F.fontFamily(selFont.value));
  selSize?.addEventListener('change', () => F.fontSize(parseFloat(selSize.value)));
  selStyle?.addEventListener('change', () => F.paragraphStyle(selStyle.value));
  $('#colText')?.addEventListener('input', (e) => F.textColor(e.target.value));
  $('#colHi')?.addEventListener('input', (e) => F.highlight(e.target.value));
  $('#selLine')?.addEventListener('change', (e) => F.lineHeight(e.target.value));
}

function syncToolbarState() {
  const st = F.queryState();
  const map = { bold: 'bold', italic: 'italic', underline: 'underline', strike: 'strike',
    ul: 'ul', ol: 'ol', alignLeft: 'alignLeft', alignCenter: 'alignCenter', alignRight: 'alignRight', alignJustify: 'alignJustify' };
  Object.entries(map).forEach(([cmd, key]) => {
    $$(`[data-cmd="${cmd}"]`).forEach((b) => b.classList.toggle('is-active', !!st[key]));
  });
  const selStyle = $('#selStyle');
  if (selStyle && st.block) {
    const opt = { p: 'normal', h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', blockquote: 'citacao' }[st.block] || 'normal';
    selStyle.value = opt;
  }
  const selSize = $('#selSize');
  if (selSize && st.fontSize) selSize.value = st.fontSize;
  const selFont = $('#selFont');
  if (selFont && st.fontFamily && [...selFont.options].some((o) => o.value === st.fontFamily)) selFont.value = st.fontFamily;
}

// --------------------------------------------------------------------------
// Zoom / painéis / régua / tema
// --------------------------------------------------------------------------
function bindZoom() {
  const range = $('#zoomRange');
  range?.addEventListener('input', () => setZoom(range.value / 100));
}
function setZoom(z) {
  state.zoom = clamp(z, 0.25, 4);
  applyZoom();
}
function applyZoom() {
  $('#pages').style.transform = `scale(${state.zoom})`;
  $('#pages').style.transformOrigin = 'top center';
  const pct = Math.round(state.zoom * 100);
  const r = $('#zoomRange'); if (r) r.value = pct;
  const l = $('#zoomLabel'); if (l) l.textContent = pct + '%';
  setPref('zoom', state.zoom);
}
function fitWidth() {
  const page = editor.pagesEl.querySelector('.page');
  if (!page) return;
  const avail = $('#canvas').clientWidth - 60;
  setZoom(avail / page.offsetWidth);
}

function isMobile() { return window.innerWidth <= 1024; }

function closeDrawers() {
  $('#panelLeft').classList.add('is-collapsed');
  $('#panelRight').classList.add('is-collapsed');
  const bd = $('#drawerBackdrop');
  if (bd) bd.setAttribute('hidden', '');
}

function togglePanel(side) {
  const p = side === 'left' ? $('#panelLeft') : $('#panelRight');
  const other = side === 'left' ? $('#panelRight') : $('#panelLeft');
  const opening = p.classList.contains('is-collapsed');
  const bd = $('#drawerBackdrop');

  if (isMobile()) {
    // gaveta: abre uma por vez, com fundo escuro
    other.classList.add('is-collapsed');
    p.classList.toggle('is-collapsed', !opening);
    if (bd) bd.toggleAttribute('hidden', !opening);
    return;
  }
  // desktop: encaixa/recolhe e memoriza preferência
  p.classList.toggle('is-collapsed');
  if (bd) bd.setAttribute('hidden', '');
  setPref('panel_' + side, !p.classList.contains('is-collapsed'));
}

function toggleTheme() {
  const root = document.documentElement;
  const dark = root.getAttribute('data-tema') === 'escuro';
  root.setAttribute('data-tema', dark ? 'claro' : 'escuro');
  setPref('tema', dark ? 'claro' : 'escuro');
}

function applyStoredPrefs() {
  const p = getPrefs();
  if (p.tema) document.documentElement.setAttribute('data-tema', p.tema);
  if (p.zoom && !isMobile()) state.zoom = p.zoom;
  if (isMobile()) {
    // No celular/tablet os painéis começam recolhidos (viram gavetas).
    $('#panelLeft').classList.add('is-collapsed');
    $('#panelRight').classList.add('is-collapsed');
  } else {
    if (p.panel_left === false) $('#panelLeft').classList.add('is-collapsed');
    if (p.panel_right === false) $('#panelRight').classList.add('is-collapsed');
  }
}

// Toque: gavetas fecham no fundo; ajusta zoom à tela; pinça para dar zoom.
function initTouch() {
  const bd = $('#drawerBackdrop');
  if (bd) bd.addEventListener('click', closeDrawers);
  // Tocar no canvas fecha gavetas abertas (mobile).
  $('#canvas').addEventListener('pointerdown', () => {
    if (isMobile() && !$('#panelLeft').classList.contains('is-collapsed')) closeDrawers();
    else if (isMobile() && !$('#panelRight').classList.contains('is-collapsed')) closeDrawers();
  }, true);

  // Ajuste automático à largura no mobile (abrir + girar a tela).
  const autoFit = () => { if (isMobile()) fitWidth(); };
  editor.addEventListener('doc-loaded', () => setTimeout(autoFit, 120));
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(autoFit, 200); });
  window.addEventListener('orientationchange', () => setTimeout(autoFit, 300));

  // Pinça para dar zoom (2 dedos) no canvas.
  const canvas = $('#canvas');
  const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  let pinch = null;
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) pinch = { d: dist(e.touches), z: state.zoom };
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && pinch) {
      e.preventDefault();
      setZoom(pinch.z * (dist(e.touches) / pinch.d));
    }
  }, { passive: false });
  canvas.addEventListener('touchend', (e) => { if (e.touches.length < 2) pinch = null; });
}

function buildRuler() {
  const ruler = $('#ruler');
  if (!ruler) return;
  const rebuild = () => {
    ruler.innerHTML = '';
    const page = editor.pagesEl.querySelector('.page');
    if (!page) return;
    const w = page.offsetWidth * state.zoom;
    const left = (($('#canvas').clientWidth - w) / 2);
    const cmPx = (96 / 2.54) * state.zoom;
    for (let i = 0; i * cmPx < w; i++) {
      const tick = el('div', { class: 'ruler__tick', style: { left: (left + i * cmPx) + 'px' } }, [el('span', { text: i })]);
      ruler.appendChild(tick);
    }
  };
  editor.addEventListener('pages-rendered', rebuild);
  window.addEventListener('resize', rebuild);
  setTimeout(rebuild, 200);
}

// --------------------------------------------------------------------------
// Documento: novo / abrir / importar / excluir página
// --------------------------------------------------------------------------
async function newDocument() {
  if (editor.dirty) await saveNow();
  editor.newDoc();
  toast('Novo documento criado.', 'ok');
}

function confirmDeletePage() {
  if (editor.doc.pages.length <= 1) { toast('O documento precisa de ao menos uma página.', 'aviso'); return; }
  const m = UI.openModal({
    title: 'Excluir página',
    bodyNode: el('p', { text: 'Tem certeza que deseja excluir a página atual? Esta ação pode ser desfeita com Ctrl+Z.' }),
    footNodes: [
      el('button', { class: 'btn', text: 'Cancelar', onclick: () => m.close() }),
      el('button', { class: 'btn btn--danger', text: 'Excluir', onclick: () => { editor.deletePage(); m.close(); } }),
    ],
  });
}

function pickImportFile() {
  const input = el('input', { type: 'file', accept: '.txt,.docx,.pdf,image/*', style: { display: 'none' } });
  document.body.appendChild(input);
  input.onchange = () => { if (input.files[0]) importFile(input.files[0]); input.remove(); };
  input.click();
}

async function openDocDialog() {
  const docs = await listDocs();
  const list = el('div', {});
  if (!docs.length) list.appendChild(el('p', { class: 'prop-empty', text: 'Nenhum documento salvo ainda.' }));
  docs.forEach((d) => {
    const row = el('div', { class: 'checkline', style: { justifyContent: 'space-between', borderBottom: '1px solid var(--cor-borda)', padding: '8px 4px' } }, [
      el('div', {}, [
        el('div', { style: { fontWeight: '600' }, text: d.title || 'Sem título' }),
        el('small', { style: { color: 'var(--cor-texto-fraco)' }, text: `${d.pages?.length || 1} pág. · ${formatDate(d.updatedAt)}` }),
      ]),
      el('div', { style: { display: 'flex', gap: '6px' } }, [
        el('button', { class: 'btn btn--primary', text: 'Abrir', onclick: async () => { m.close(); editor.loadDoc(await getDoc(d.id)); toast('Documento aberto.', 'ok'); } }),
        el('button', { class: 'btn btn--danger', html: '<i class="fa fa-trash"></i>', onclick: async () => { await deleteDoc(d.id); row.remove(); toast('Documento excluído.'); } }),
      ]),
    ]);
    list.appendChild(row);
  });
  const m = UI.openModal({ title: 'Abrir documento', wide: true, bodyNode: list,
    footNodes: [el('button', { class: 'btn', text: 'Fechar', onclick: () => m.close() })] });
}

// --------------------------------------------------------------------------
// PWA
// --------------------------------------------------------------------------
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // Se já havia um SW controlando, uma troca de controlador significa versão nova:
  // recarrega uma vez para aplicar os arquivos atualizados automaticamente.
  if (navigator.serviceWorker.controller) {
    let recarregando = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (recarregando) return;
      recarregando = true;
      location.reload();
    });
  }
  navigator.serviceWorker.register('./service-worker.js').then((reg) => {
    // procura atualização a cada carregamento
    reg.update?.().catch(() => {});
  }).catch(() => { /* offline opcional */ });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
