// editor-core.js — controlador central: modelo <-> DOM, páginas, histórico, serialização.
import { el, uuid, debounce } from './utils.js';
import { createDocument, createPage, normalizeDocument } from './document-model.js';
import { applyPageMetrics } from './page-setup.js';
import { History } from './history.js';

class Editor extends EventTarget {
  constructor() {
    super();
    this.doc = createDocument();
    this.pagesEl = null;       // container .canvas__pages
    this.history = new History();
    this.activePageId = null;
    this.dirty = false;
    this._suspendSnapshot = false;

    this._snapshotDebounced = debounce(() => this.snapshot(), 500);
  }

  init(pagesEl) {
    this.pagesEl = pagesEl;
    this._wireContentEvents();
  }

  emit(name, detail) { this.dispatchEvent(new CustomEvent(name, { detail })); }

  // ---------- Carregar / criar ----------
  loadDoc(doc) {
    this.doc = normalizeDocument(doc);
    this.activePageId = this.doc.pages[0]?.id || null;
    this.renderPages();
    this.history.reset(this._makeSnapshot());
    this.dirty = false;
    this.emit('doc-loaded', { doc: this.doc });
    this.emit('changed', {});
  }

  newDoc(title) {
    this.loadDoc(createDocument(title));
  }

  // ---------- Render ----------
  renderPages() {
    if (!this.pagesEl) return;
    this.pagesEl.innerHTML = '';
    this.doc.pages.forEach((p, i) => this.pagesEl.appendChild(this._buildPageEl(p, i)));
    this._refreshPageNumbers();
    this.emit('pages-rendered', {});
  }

  _buildPageEl(pageData, index) {
    const page = el('section', {
      class: 'page',
      'data-page-id': pageData.id,
      'data-index': index,
    });

    const bg = el('img', { class: 'page__bg', alt: '', 'aria-hidden': 'true', draggable: 'false' });
    const guide = el('div', { class: 'page__margin-guide' });
    const header = el('header', {
      class: 'page__header', contenteditable: 'true', 'data-role': 'header',
      'data-placeholder': 'Cabeçalho…', html: pageData.header || '',
    });
    const footer = el('footer', {
      class: 'page__footer', contenteditable: 'true', 'data-role': 'footer',
      'data-placeholder': 'Rodapé…', html: pageData.footer || '',
    });
    const content = el('main', {
      class: 'page__content', contenteditable: 'true', 'data-role': 'content', spellcheck: 'true',
      'data-placeholder': index === 0 ? 'Comece a digitar seu documento…' : '',
      html: pageData.html || '',
    });

    page.append(bg, guide, header, content, footer);
    applyPageMetrics(page, this.doc.settings);
    return page;
  }

  // ---------- Eventos de conteúdo ----------
  _wireContentEvents() {
    const c = this.pagesEl;
    // Rastreia página ativa por foco.
    c.addEventListener('focusin', (e) => {
      const page = e.target.closest('.page');
      if (page) {
        this.activePageId = page.dataset.pageId;
        this._markActivePage(page);
        this.emit('selection-changed', {});
      }
    });

    // Marca alterações e agenda snapshot (debounce) durante digitação.
    c.addEventListener('input', (e) => {
      if (!e.target.closest('.page')) return;
      this.markDirty();
      this._snapshotDebounced();
      this._refreshPageNumbers();
    });

    document.addEventListener('selectionchange', () => {
      if (document.activeElement && document.activeElement.closest &&
          document.activeElement.closest('.page')) {
        this.emit('selection-changed', {});
      }
    });
  }

  _markActivePage(page) {
    this.pagesEl.querySelectorAll('.page.is-active').forEach((p) => p.classList.remove('is-active'));
    if (page) page.classList.add('is-active');
  }

  // ---------- Acesso à página / conteúdo ativo ----------
  activePageEl() {
    return this.pagesEl.querySelector(`.page[data-page-id="${this.activePageId}"]`) ||
           this.pagesEl.querySelector('.page');
  }
  activeContentEl() {
    const p = this.activePageEl();
    return p ? p.querySelector('.page__content') : null;
  }
  focusActiveContent() {
    const c = this.activeContentEl();
    if (c) c.focus();
  }

  // ---------- Serialização DOM -> modelo ----------
  _cleanHTML(sourceEl) {
    // Clona e remove artefatos de UI que não devem persistir nem exportar.
    const clone = sourceEl.cloneNode(true);
    clone.querySelectorAll('.floatimg__handle, .floatimg__del, .chartobj__handle, .chartobj__bar, .shapeobj__handle, .shapeobj__bar')
      .forEach((n) => n.remove());
    clone.querySelectorAll('[data-wired]').forEach((n) => n.removeAttribute('data-wired'));
    clone.querySelectorAll('mark.find-hit').forEach((m) => {
      const parent = m.parentNode;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
    });
    clone.querySelectorAll('.cell-sel, .is-sel, .is-active').forEach((n) => {
      n.classList.remove('cell-sel', 'is-sel', 'is-active');
    });
    return clone.innerHTML;
  }

  serialize() {
    if (!this.pagesEl) return this.doc;
    const pages = Array.from(this.pagesEl.querySelectorAll('.page')).map((pg) => ({
      id: pg.dataset.pageId,
      html: this._cleanHTML(pg.querySelector('.page__content')),
      header: pg.querySelector('.page__header').innerHTML,
      footer: pg.querySelector('.page__footer').innerHTML,
    }));
    if (pages.length) this.doc.pages = pages;
    this.doc.updatedAt = new Date().toISOString();
    return this.doc;
  }

  _makeSnapshot() {
    this.serialize();
    return JSON.stringify({ pages: this.doc.pages, settings: this.doc.settings });
  }

  snapshot() {
    if (this._suspendSnapshot) return;
    this.history.push(this._makeSnapshot());
  }

  applySnapshot(snap) {
    if (!snap) return;
    try {
      const data = JSON.parse(snap);
      this.doc.pages = data.pages;
      this.doc.settings = data.settings;
      this._suspendSnapshot = true;
      this.renderPages();
      this._suspendSnapshot = false;
      this.markDirty();
      this.emit('changed', {});
      // reposiciona caret no fim da página ativa
      const c = this.activeContentEl();
      if (c) { c.focus(); this._caretToEnd(c); }
    } catch { /* snapshot corrompido — ignora */ }
  }

  _caretToEnd(node) {
    const r = document.createRange();
    r.selectNodeContents(node);
    r.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }

  undo() { const s = this.history.undo(); if (s != null) this.applySnapshot(s); }
  redo() { const s = this.history.redo(); if (s != null) this.applySnapshot(s); }

  // ---------- Operações de página ----------
  addPage(afterId = this.activePageId) {
    this.serialize();
    const idx = this.doc.pages.findIndex((p) => p.id === afterId);
    const np = createPage();
    this.doc.pages.splice(idx >= 0 ? idx + 1 : this.doc.pages.length, 0, np);
    this.activePageId = np.id;
    this.renderPages();
    this.snapshot();
    this.markDirty();
    this.emit('changed', {});
    const c = this.activeContentEl();
    if (c) c.focus();
    return np;
  }

  duplicatePage(id = this.activePageId) {
    this.serialize();
    const idx = this.doc.pages.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const src = this.doc.pages[idx];
    const copy = { ...src, id: 'page-' + uuid() };
    this.doc.pages.splice(idx + 1, 0, copy);
    this.activePageId = copy.id;
    this.renderPages();
    this.snapshot();
    this.markDirty();
    this.emit('changed', {});
  }

  deletePage(id = this.activePageId) {
    if (this.doc.pages.length <= 1) return false;
    this.serialize();
    const idx = this.doc.pages.findIndex((p) => p.id === id);
    if (idx < 0) return false;
    this.doc.pages.splice(idx, 1);
    this.activePageId = this.doc.pages[Math.max(0, idx - 1)].id;
    this.renderPages();
    this.snapshot();
    this.markDirty();
    this.emit('changed', {});
    return true;
  }

  movePage(id, dir) {
    this.serialize();
    const idx = this.doc.pages.findIndex((p) => p.id === id);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= this.doc.pages.length) return;
    const [p] = this.doc.pages.splice(idx, 1);
    this.doc.pages.splice(to, 0, p);
    this.renderPages();
    this.snapshot();
    this.markDirty();
    this.emit('changed', {});
  }

  _refreshPageNumbers() {
    this.pagesEl.querySelectorAll('.page').forEach((pg, i) => {
      pg.dataset.index = i;
      pg.querySelectorAll('.page__num').forEach((n) => { n.dataset.num = i + 1; });
    });
  }

  // ---------- Configurações (layout) ----------
  applySettings(patch) {
    this.doc.settings = { ...this.doc.settings, ...patch };
    if (patch.margins) this.doc.settings.margins = { ...this.doc.settings.margins, ...patch.margins };
    this.pagesEl.querySelectorAll('.page').forEach((pg) => applyPageMetrics(pg, this.doc.settings));
    this.snapshot();
    this.markDirty();
    this.emit('changed', {});
    this.emit('settings-changed', { settings: this.doc.settings });
  }

  // ---------- Estado ----------
  markDirty() {
    this.dirty = true;
    this.emit('dirty', {});
  }
  markClean() {
    this.dirty = false;
    this.emit('saved', {});
  }

  stats() {
    let text = '';
    this.pagesEl?.querySelectorAll('.page__content').forEach((c) => { text += ' ' + c.textContent; });
    const words = (text.trim().match(/\S+/g) || []).length;
    const chars = text.replace(/\s/g, '').length;
    return { words, chars, pages: this.doc.pages.length };
  }
}

export const editor = new Editor();
