// shapes.js — formas e linhas em SVG (flutuantes, mover/redimensionar, cor/borda).
import { el, uuid } from './utils.js';
import { editor } from './editor-core.js';

const SVGNS = 'http://www.w3.org/2000/svg';
let selected = null;
const wiredSet = new WeakSet();
function afterEdit() { editor.markDirty(); editor.snapshot(); }

export const SHAPES = ['line', 'arrow', 'darrow', 'rect', 'roundrect', 'ellipse', 'triangle', 'diamond', 'star'];

function defaultCfg(kind) {
  const line = /arrow|line/.test(kind);
  return { kind, fill: line ? 'none' : '#dbe7f5', stroke: '#2b6cb0', strokeWidth: 2 };
}

function svgMarkup(cfg) {
  const { kind, fill, stroke, strokeWidth: sw } = cfg;
  const common = `fill="${fill}" stroke="${stroke}" stroke-width="${sw}" vector-effect="non-scaling-stroke"`;
  const defs = `<defs><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="${stroke}"/></marker></defs>`;
  switch (kind) {
    case 'line': return `<line x1="2" y1="98" x2="98" y2="2" stroke="${stroke}" stroke-width="${sw}" vector-effect="non-scaling-stroke"/>`;
    case 'arrow': return `${defs}<line x1="2" y1="50" x2="94" y2="50" stroke="${stroke}" stroke-width="${sw}" vector-effect="non-scaling-stroke" marker-end="url(#ah)"/>`;
    case 'darrow': return `${defs}<line x1="6" y1="50" x2="94" y2="50" stroke="${stroke}" stroke-width="${sw}" vector-effect="non-scaling-stroke" marker-end="url(#ah)" marker-start="url(#ah)"/>`;
    case 'rect': return `<rect x="2" y="2" width="96" height="96" ${common}/>`;
    case 'roundrect': return `<rect x="2" y="2" width="96" height="96" rx="14" ${common}/>`;
    case 'ellipse': return `<ellipse cx="50" cy="50" rx="48" ry="48" ${common}/>`;
    case 'triangle': return `<polygon points="50,2 98,98 2,98" ${common}/>`;
    case 'diamond': return `<polygon points="50,2 98,50 50,98 2,50" ${common}/>`;
    case 'star': return `<polygon points="${starPoints()}" ${common}/>`;
    default: return `<rect x="2" y="2" width="96" height="96" ${common}/>`;
  }
}
function starPoints() {
  const pts = []; const cx = 50, cy = 52, R = 48, r = 20;
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    pts.push(`${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy + rad * Math.sin(ang)).toFixed(1)}`);
  }
  return pts.join(' ');
}

function readCfg(obj) { try { return JSON.parse(obj.dataset.shape); } catch { return defaultCfg('rect'); } }
function writeCfg(obj, cfg) { obj.dataset.shape = JSON.stringify(cfg); }

function render(obj) {
  const cfg = readCfg(obj);
  let svg = obj.querySelector('svg');
  if (!svg) { svg = document.createElementNS(SVGNS, 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none'); obj.insertBefore(svg, obj.firstChild); }
  svg.innerHTML = svgMarkup(cfg);
}

function selectShape(obj) {
  if (selected && selected !== obj) selected.classList.remove('is-sel');
  selected = obj;
  if (obj) obj.classList.add('is-sel');
}

function ensureControls(obj) {
  if (obj.querySelector('.shapeobj__handle')) return;
  const cfg = readCfg(obj);
  const fill = el('input', { type: 'color', value: cfg.fill === 'none' ? '#ffffff' : cfg.fill });
  const stroke = el('input', { type: 'color', value: cfg.stroke });
  const width = el('input', { type: 'range', min: '1', max: '12', value: cfg.strokeWidth, title: 'Espessura' });
  fill.addEventListener('input', () => { const c = readCfg(obj); c.fill = fill.value; writeCfg(obj, c); render(obj); });
  fill.addEventListener('change', afterEdit);
  stroke.addEventListener('input', () => { const c = readCfg(obj); c.stroke = stroke.value; writeCfg(obj, c); render(obj); });
  stroke.addEventListener('change', afterEdit);
  width.addEventListener('input', () => { const c = readCfg(obj); c.strokeWidth = +width.value; writeCfg(obj, c); render(obj); });
  width.addEventListener('change', afterEdit);

  const bar = el('div', { class: 'shapeobj__bar', onmousedown: (e) => e.preventDefault() }, [
    el('label', { title: 'Preenchimento' }, [fill]),
    el('label', { title: 'Contorno' }, [stroke]),
    width,
    el('button', { class: 'tbtn', title: 'Enviar p/ trás', html: '<i class="fa fa-arrow-down"></i>', onclick: (e) => { e.stopPropagation(); obj.style.zIndex = '3'; afterEdit(); } }),
    el('button', { class: 'tbtn', title: 'Trazer p/ frente', html: '<i class="fa fa-arrow-up"></i>', onclick: (e) => { e.stopPropagation(); obj.style.zIndex = '6'; afterEdit(); } }),
    el('button', { class: 'tbtn', title: 'Excluir', html: '<i class="fa fa-trash"></i>', onclick: (e) => { e.stopPropagation(); obj.remove(); selected = null; afterEdit(); } }),
  ]);
  const handle = el('span', { class: 'shapeobj__handle' });
  obj.append(bar, handle);
  wireResize(obj, handle);
}

function wire(obj) {
  render(obj);
  if (wiredSet.has(obj)) return;
  wiredSet.add(obj);
  obj.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.shapeobj__handle') || e.target.closest('.shapeobj__bar')) return;
    e.preventDefault(); selectShape(obj); ensureControls(obj);
    const sx = e.clientX, sy = e.clientY;
    const l0 = parseFloat(obj.style.left) || 0, t0 = parseFloat(obj.style.top) || 0;
    obj.setPointerCapture(e.pointerId);
    const mv = (ev) => { obj.style.left = (l0 + ev.clientX - sx) + 'px'; obj.style.top = (t0 + ev.clientY - sy) + 'px'; };
    const up = (ev) => { obj.removeEventListener('pointermove', mv); obj.removeEventListener('pointerup', up); try { obj.releasePointerCapture(ev.pointerId); } catch {} afterEdit(); };
    obj.addEventListener('pointermove', mv); obj.addEventListener('pointerup', up);
  });
}

function wireResize(obj, handle) {
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation(); selectShape(obj);
    const sx = e.clientX, sy = e.clientY, w0 = obj.offsetWidth, h0 = obj.offsetHeight;
    handle.setPointerCapture(e.pointerId);
    const mv = (ev) => {
      obj.style.width = Math.max(16, w0 + ev.clientX - sx) + 'px';
      obj.style.height = Math.max(16, h0 + ev.clientY - sy) + 'px';
    };
    const up = (ev) => { handle.removeEventListener('pointermove', mv); handle.removeEventListener('pointerup', up); try { handle.releasePointerCapture(ev.pointerId); } catch {} afterEdit(); };
    handle.addEventListener('pointermove', mv); handle.addEventListener('pointerup', up);
  });
}

export function insertShape(kind = 'rect') {
  const content = editor.activeContentEl();
  if (!content) return;
  content.focus();
  const line = /arrow|line/.test(kind);
  const obj = el('div', {
    class: 'shapeobj', contenteditable: 'false', 'data-shape-id': uuid(),
    style: { left: '50px', top: '50px', width: line ? '160px' : '110px', height: line ? '60px' : '110px' },
  });
  writeCfg(obj, defaultCfg(kind));
  content.appendChild(obj);
  wire(obj); ensureControls(obj); selectShape(obj);
  afterEdit();
}

export function initShapes() {
  editor.addEventListener('pages-rendered', () => {
    editor.pagesEl.querySelectorAll('.shapeobj').forEach((obj) => { obj.setAttribute('contenteditable', 'false'); wire(obj); });
    selected = null;
  });
  editor.pagesEl.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.shapeobj')) { if (selected) selected.classList.remove('is-sel'); selected = null; }
  });
}
