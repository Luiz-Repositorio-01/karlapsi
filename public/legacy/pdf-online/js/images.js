// images.js — imagens flutuantes posicionáveis dentro da folha (atômicas, não editáveis).
import { el } from './utils.js';
import { editor } from './editor-core.js';
import { insertNodeAtCaret } from './selection.js';

let selected = null;
const wiredSet = new WeakSet();

function afterEdit() { editor.markDirty(); editor.snapshot(); }

function selectImg(fig) {
  if (selected && selected !== fig) selected.classList.remove('is-sel');
  selected = fig;
  if (fig) fig.classList.add('is-sel');
  editor.emit('object-selected', { type: fig ? 'image' : null, node: fig });
}

function ensureHandles(fig) {
  if (fig.querySelector('.floatimg__handle')) return;
  const del = el('button', {
    class: 'floatimg__del', title: 'Excluir imagem', html: '<i class="fa fa-times"></i>',
    onmousedown: (e) => { e.preventDefault(); e.stopPropagation(); },
    onclick: (e) => { e.preventDefault(); e.stopPropagation(); fig.remove(); selected = null; afterEdit(); },
  });
  const se = el('span', { class: 'floatimg__handle floatimg__handle--se' });
  fig.append(del, se);
  wireResize(fig, se);
}

function wireDrag(fig) {
  if (wiredSet.has(fig)) return;
  wiredSet.add(fig);
  fig.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.floatimg__handle') || e.target.closest('.floatimg__del')) return;
    e.preventDefault();
    selectImg(fig);
    const page = fig.closest('.page__content');
    const start = { x: e.clientX, y: e.clientY };
    const left0 = parseFloat(fig.style.left) || 0;
    const top0 = parseFloat(fig.style.top) || 0;
    fig.setPointerCapture(e.pointerId);
    const move = (ev) => {
      fig.style.left = (left0 + (ev.clientX - start.x)) + 'px';
      fig.style.top = (top0 + (ev.clientY - start.y)) + 'px';
    };
    const up = (ev) => {
      fig.removeEventListener('pointermove', move);
      fig.removeEventListener('pointerup', up);
      try { fig.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
      afterEdit();
    };
    fig.addEventListener('pointermove', move);
    fig.addEventListener('pointerup', up);
  });
}

function wireResize(fig, handle) {
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    selectImg(fig);
    const start = { x: e.clientX, y: e.clientY };
    const w0 = fig.offsetWidth, h0 = fig.offsetHeight;
    const ratio = w0 / h0;
    handle.setPointerCapture(e.pointerId);
    const move = (ev) => {
      const nw = Math.max(24, w0 + (ev.clientX - start.x));
      fig.style.width = nw + 'px';
      fig.style.height = (nw / ratio) + 'px';
    };
    const up = (ev) => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      try { handle.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
      afterEdit();
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
  });
}

function makeFig(dataUrl, w, h) {
  const fig = el('div', {
    class: 'floatimg', contenteditable: 'false',
    style: { width: w + 'px', height: h + 'px', left: '40px', top: '40px' },
  }, [el('img', { src: dataUrl, alt: 'Imagem inserida', draggable: 'false' })]);
  wireDrag(fig);
  return fig;
}

export function insertImageFromDataUrl(dataUrl) {
  const content = editor.activeContentEl();
  if (!content) return;
  content.focus();
  const probe = new Image();
  probe.onload = () => {
    const ratio = probe.naturalWidth / probe.naturalHeight || 1;
    let w = Math.min(320, content.clientWidth * 0.5 || 320);
    const h = w / ratio;
    const fig = makeFig(dataUrl, w, h);
    // insere no início do conteúdo para não quebrar o fluxo de texto
    content.appendChild(fig);
    selectImg(fig);
    ensureHandles(fig);
    afterEdit();
  };
  probe.src = dataUrl;
}

export function pickImage() {
  const input = el('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
  document.body.appendChild(input);
  input.onchange = () => {
    const file = input.files && input.files[0];
    if (file) readImage(file);
    input.remove();
  };
  input.click();
}

function readImage(file) {
  if (!/^image\//.test(file.type)) return;
  const reader = new FileReader();
  reader.onload = () => insertImageFromDataUrl(reader.result);
  reader.readAsDataURL(file);
}

export function initImages(canvasEl) {
  // Seleção/deseleção e alças.
  editor.pagesEl.addEventListener('pointerdown', (e) => {
    const fig = e.target.closest('.floatimg');
    if (fig) { selectImg(fig); ensureHandles(fig); }
    else selectImg(null);
  });
  // Rebind após render (documento carregado / undo).
  editor.addEventListener('pages-rendered', () => {
    editor.pagesEl.querySelectorAll('.floatimg').forEach((fig) => {
      fig.setAttribute('contenteditable', 'false');
      wireDrag(fig);
    });
    selected = null;
  });
  // Arrastar-e-soltar imagem no canvas.
  const stop = (e) => { e.preventDefault(); };
  canvasEl.addEventListener('dragover', stop);
  canvasEl.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) readImage(file);
  });
  // Colar imagem da área de transferência.
  document.addEventListener('paste', (e) => {
    if (!e.target.closest || !e.target.closest('.page__content')) return;
    const item = Array.from(e.clipboardData?.items || []).find((i) => /^image\//.test(i.type));
    if (item) { const f = item.getAsFile(); if (f) { e.preventDefault(); readImage(f); } }
  });
}
