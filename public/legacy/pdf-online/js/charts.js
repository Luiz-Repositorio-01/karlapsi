// charts.js — gráficos em Canvas (colunas, barras, linha, área, pizza, rosca).
// Objeto flutuante com dados editáveis; redesenha ao alterar dados/tamanho.
import { el, uuid } from './utils.js';
import { editor } from './editor-core.js';
import { openModal } from './ui.js';

const PALETTE = ['#2b6cb0', '#e0983a', '#2f9e6b', '#c0504d', '#8064a2', '#4bacc6', '#9bbb59', '#f0a30a'];

let selected = null;
const wiredSet = new WeakSet();
function afterEdit() { editor.markDirty(); editor.snapshot(); }

function defaultConfig() {
  return {
    type: 'column',
    title: 'Gráfico',
    labels: ['Jan', 'Fev', 'Mar', 'Abr'],
    series: [{ name: 'Série 1', values: [12, 19, 8, 15] }],
  };
}

// ---------------- Desenho ----------------
function draw(canvas, cfg) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 320;
  const H = canvas.clientHeight || 220;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#222';
  ctx.font = '600 13px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  if (cfg.title) ctx.fillText(cfg.title, W / 2, 18);

  if (cfg.type === 'pie' || cfg.type === 'doughnut') return drawPie(ctx, W, H, cfg);
  return drawAxes(ctx, W, H, cfg);
}

function drawAxes(ctx, W, H, cfg) {
  const padL = 38, padR = 12, padT = 28, padB = 28;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const all = cfg.series.flatMap((s) => s.values.map(Number));
  const max = Math.max(1, ...all);
  const min = Math.min(0, ...all);
  const range = max - min || 1;
  const y = (v) => padT + plotH - ((v - min) / range) * plotH;

  // grade + eixo
  ctx.strokeStyle = '#e5e8ee'; ctx.fillStyle = '#888'; ctx.font = '10px Segoe UI';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const v = min + (range * i) / 4;
    const yy = y(v);
    ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(W - padR, yy); ctx.stroke();
    ctx.fillText(Math.round(v), padL - 4, yy + 3);
  }

  const n = cfg.labels.length;
  const groupW = plotW / n;
  ctx.textAlign = 'center'; ctx.fillStyle = '#666';
  cfg.labels.forEach((lb, i) => ctx.fillText(lb, padL + groupW * i + groupW / 2, H - 8));

  const ns = cfg.series.length;
  cfg.series.forEach((s, si) => {
    const color = PALETTE[si % PALETTE.length];
    if (cfg.type === 'line' || cfg.type === 'area') {
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
      s.values.forEach((v, i) => {
        const px = padL + groupW * i + groupW / 2;
        const py = y(Number(v));
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      });
      ctx.stroke();
      if (cfg.type === 'area') {
        ctx.lineTo(padL + groupW * (n - 1) + groupW / 2, y(min));
        ctx.lineTo(padL + groupW / 2, y(min));
        ctx.closePath(); ctx.globalAlpha = 0.18; ctx.fillStyle = color; ctx.fill(); ctx.globalAlpha = 1;
      }
      s.values.forEach((v, i) => {
        ctx.fillStyle = color; ctx.beginPath();
        ctx.arc(padL + groupW * i + groupW / 2, y(Number(v)), 3, 0, Math.PI * 2); ctx.fill();
      });
    } else {
      // column / bar (barras verticais)
      const barW = (groupW * 0.7) / ns;
      s.values.forEach((v, i) => {
        const px = padL + groupW * i + groupW * 0.15 + barW * si;
        const py = y(Number(v));
        ctx.fillStyle = color;
        ctx.fillRect(px, py, barW - 1, y(min) - py);
      });
    }
  });

  // legenda
  ctx.textAlign = 'left'; ctx.font = '10px Segoe UI';
  cfg.series.forEach((s, si) => {
    const lx = padL + si * 80;
    ctx.fillStyle = PALETTE[si % PALETTE.length]; ctx.fillRect(lx, padT - 16, 10, 10);
    ctx.fillStyle = '#444'; ctx.fillText(s.name, lx + 14, padT - 7);
  });
}

function drawPie(ctx, W, H, cfg) {
  const s = cfg.series[0] || { values: [] };
  const total = s.values.reduce((a, b) => a + Number(b), 0) || 1;
  const cx = W / 2, cy = H / 2 + 6, r = Math.min(W, H) / 2 - 30;
  let ang = -Math.PI / 2;
  s.values.forEach((v, i) => {
    const slice = (Number(v) / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, ang, ang + slice);
    ctx.closePath(); ctx.fillStyle = PALETTE[i % PALETTE.length]; ctx.fill();
    ang += slice;
  });
  if (cfg.type === 'doughnut') {
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  }
  ctx.textAlign = 'left'; ctx.font = '10px Segoe UI';
  cfg.labels.forEach((lb, i) => {
    const ly = 30 + i * 14;
    ctx.fillStyle = PALETTE[i % PALETTE.length]; ctx.fillRect(W - 78, ly - 8, 10, 10);
    ctx.fillStyle = '#444'; ctx.fillText(lb, W - 64, ly);
  });
}

// ---------------- Objeto flutuante ----------------
function readCfg(obj) { try { return JSON.parse(obj.dataset.chart); } catch { return defaultConfig(); } }
function writeCfg(obj, cfg) { obj.dataset.chart = JSON.stringify(cfg); }

function redrawObj(obj) { draw(obj.querySelector('canvas'), readCfg(obj)); }

function selectChart(obj) {
  if (selected && selected !== obj) selected.classList.remove('is-sel');
  selected = obj;
  if (obj) obj.classList.add('is-sel');
}

function wire(obj) {
  if (wiredSet.has(obj)) { redrawObj(obj); return; }
  wiredSet.add(obj);
  const canvas = obj.querySelector('canvas') || el('canvas');
  if (!obj.querySelector('canvas')) obj.appendChild(canvas);
  // barra + alça (não persistem: recriadas aqui)
  if (!obj.querySelector('.chartobj__handle')) {
    const bar = el('div', { class: 'chartobj__bar' }, [
      el('button', { class: 'tbtn', title: 'Editar dados', html: '<i class="fa fa-table"></i>', onmousedown: (e) => e.preventDefault(), onclick: (e) => { e.stopPropagation(); openDataEditor(obj); } }),
      el('button', { class: 'tbtn', title: 'Duplicar', html: '<i class="fa fa-clone"></i>', onmousedown: (e) => e.preventDefault(), onclick: (e) => { e.stopPropagation(); duplicate(obj); } }),
      el('button', { class: 'tbtn', title: 'Excluir', html: '<i class="fa fa-trash"></i>', onmousedown: (e) => e.preventDefault(), onclick: (e) => { e.stopPropagation(); obj.remove(); selected = null; afterEdit(); } }),
    ]);
    const handle = el('span', { class: 'chartobj__handle' });
    obj.append(bar, handle);
    wireResize(obj, handle);
  }
  obj.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.chartobj__handle') || e.target.closest('.chartobj__bar')) return;
    e.preventDefault(); selectChart(obj);
    const sx = e.clientX, sy = e.clientY;
    const l0 = parseFloat(obj.style.left) || 0, t0 = parseFloat(obj.style.top) || 0;
    obj.setPointerCapture(e.pointerId);
    const mv = (ev) => { obj.style.left = (l0 + ev.clientX - sx) + 'px'; obj.style.top = (t0 + ev.clientY - sy) + 'px'; };
    const up = (ev) => { obj.removeEventListener('pointermove', mv); obj.removeEventListener('pointerup', up); try { obj.releasePointerCapture(ev.pointerId); } catch {} afterEdit(); };
    obj.addEventListener('pointermove', mv); obj.addEventListener('pointerup', up);
  });
  obj.addEventListener('dblclick', (e) => { e.preventDefault(); openDataEditor(obj); });
  redrawObj(obj);
}

function wireResize(obj, handle) {
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation(); selectChart(obj);
    const sx = e.clientX, sy = e.clientY;
    const w0 = obj.offsetWidth, h0 = obj.offsetHeight;
    handle.setPointerCapture(e.pointerId);
    const mv = (ev) => {
      obj.style.width = Math.max(160, w0 + ev.clientX - sx) + 'px';
      obj.style.height = Math.max(120, h0 + ev.clientY - sy) + 'px';
      redrawObj(obj);
    };
    const up = (ev) => { handle.removeEventListener('pointermove', mv); handle.removeEventListener('pointerup', up); try { handle.releasePointerCapture(ev.pointerId); } catch {} afterEdit(); };
    handle.addEventListener('pointermove', mv); handle.addEventListener('pointerup', up);
  });
}

function duplicate(obj) {
  const cfg = readCfg(obj);
  const copy = createChartObj(cfg, parseFloat(obj.style.left) + 20, parseFloat(obj.style.top) + 20);
  obj.parentNode.appendChild(copy);
  wire(copy);
  afterEdit();
}

function createChartObj(cfg, left = 40, top = 40) {
  const obj = el('div', {
    class: 'chartobj', contenteditable: 'false', 'data-chart-id': uuid(),
    style: { left: left + 'px', top: top + 'px', width: '340px', height: '230px' },
  }, [el('canvas')]);
  writeCfg(obj, cfg);
  return obj;
}

export function insertChart() {
  const content = editor.activeContentEl();
  if (!content) return;
  content.focus();
  const obj = createChartObj(defaultConfig());
  content.appendChild(obj);
  wire(obj);
  selectChart(obj);
  afterEdit();
}

// ---------------- Editor de dados ----------------
function openDataEditor(obj) {
  const cfg = JSON.parse(JSON.stringify(readCfg(obj)));

  const typeSel = el('select', {}, ['column', 'bar', 'line', 'area', 'pie', 'doughnut'].map((t) =>
    el('option', { value: t, text: { column: 'Colunas', bar: 'Barras', line: 'Linhas', area: 'Área', pie: 'Pizza', doughnut: 'Rosca' }[t] })));
  typeSel.value = cfg.type;
  const titleInput = el('input', { type: 'text', value: cfg.title || '' });

  const tableWrap = el('div');
  function rebuildTable() {
    const table = el('table', { class: 'chart-data' });
    const head = el('tr', {}, [el('th', { text: 'Categoria' }), ...cfg.series.map((s, si) =>
      el('th', {}, [el('input', { class: 'lbl', value: s.name, oninput: (e) => { cfg.series[si].name = e.target.value; } })]))]);
    table.appendChild(head);
    cfg.labels.forEach((lb, ri) => {
      const tr = el('tr', {}, [
        el('td', {}, [el('input', { class: 'lbl', value: lb, oninput: (e) => { cfg.labels[ri] = e.target.value; } })]),
        ...cfg.series.map((s, si) => el('td', {}, [el('input', { type: 'number', value: s.values[ri] ?? 0, oninput: (e) => { cfg.series[si].values[ri] = parseFloat(e.target.value) || 0; } })])),
      ]);
      table.appendChild(tr);
    });
    tableWrap.innerHTML = '';
    tableWrap.appendChild(table);
  }
  rebuildTable();

  const btnRow = el('div', { style: { display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' } }, [
    el('button', { class: 'btn', text: '+ Linha', onclick: () => { cfg.labels.push('Item ' + (cfg.labels.length + 1)); cfg.series.forEach((s) => s.values.push(0)); rebuildTable(); } }),
    el('button', { class: 'btn', text: '- Linha', onclick: () => { if (cfg.labels.length > 1) { cfg.labels.pop(); cfg.series.forEach((s) => s.values.pop()); rebuildTable(); } } }),
    el('button', { class: 'btn', text: '+ Série', onclick: () => { cfg.series.push({ name: 'Série ' + (cfg.series.length + 1), values: cfg.labels.map(() => 0) }); rebuildTable(); } }),
    el('button', { class: 'btn', text: '- Série', onclick: () => { if (cfg.series.length > 1) { cfg.series.pop(); rebuildTable(); } } }),
  ]);

  const body = el('div', {}, [
    el('div', { class: 'field-row' }, [
      el('div', { class: 'field' }, [el('label', { text: 'Tipo' }), typeSel]),
      el('div', { class: 'field' }, [el('label', { text: 'Título' }), titleInput]),
    ]),
    tableWrap, btnRow,
  ]);

  const m = openModal({
    title: 'Dados do gráfico', wide: true, bodyNode: body,
    footNodes: [
      el('button', { class: 'btn', text: 'Cancelar', onclick: () => m.close() }),
      el('button', { class: 'btn btn--primary', text: 'Aplicar', onclick: () => {
        cfg.type = typeSel.value; cfg.title = titleInput.value;
        writeCfg(obj, cfg); redrawObj(obj); afterEdit(); m.close();
      } }),
    ],
  });
}

// ---------------- Inicialização / re-hidratação ----------------
export function initCharts() {
  editor.addEventListener('pages-rendered', () => {
    editor.pagesEl.querySelectorAll('.chartobj').forEach((obj) => { obj.setAttribute('contenteditable', 'false'); wire(obj); });
    selected = null;
  });
  editor.pagesEl.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.chartobj')) { if (selected) selected.classList.remove('is-sel'); selected = null; }
  });
}
