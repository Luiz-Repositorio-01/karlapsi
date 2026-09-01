// utils.js — helpers genéricos reutilizados por todos os módulos.
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/** Cria elemento com atributos e filhos. */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

export function debounce(fn, ms = 200) {
  let t;
  const wrapped = (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  wrapped.cancel = () => clearTimeout(t);
  wrapped.flush = (...args) => { clearTimeout(t); fn(...args); };
  return wrapped;
}

export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Converte milímetros para pixels de tela (96dpi CSS). */
export const mmToPx = (mm) => (mm * 96) / 25.4;
export const pxToMm = (px) => (px * 25.4) / 96;
export const mmToPt = (mm) => (mm * 72) / 25.4;

export function formatDate(iso) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString('pt-BR');
}
export function formatDateTime(iso) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

let toastWrap;
export function toast(msg, tipo = '', ms = 2600) {
  if (!toastWrap) {
    toastWrap = el('div', { class: 'toast-wrap' });
    document.body.appendChild(toastWrap);
  }
  const t = el('div', { class: 'toast' + (tipo ? ' toast--' + tipo : ''), text: msg });
  toastWrap.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity .3s';
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 320);
  }, ms);
}

/** Carrega um script externo uma única vez (para libs sob demanda). */
const loaded = {};
export function loadScript(src) {
  if (loaded[src]) return loaded[src];
  loaded[src] = new Promise((resolve, reject) => {
    const s = el('script', { src, onload: resolve, onerror: () => reject(new Error('Falha ao carregar ' + src)) });
    document.head.appendChild(s);
  });
  return loaded[src];
}
