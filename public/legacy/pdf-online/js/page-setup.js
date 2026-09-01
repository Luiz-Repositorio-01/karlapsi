// page-setup.js — tamanhos de página, orientação, margens e presets.
import { mmToPx } from './utils.js';

// Dimensões em milímetros (retrato).
export const PAGE_SIZES = {
  A3: { w: 297, h: 420, label: 'A3' },
  A4: { w: 210, h: 297, label: 'A4' },
  A5: { w: 148, h: 210, label: 'A5' },
  Carta: { w: 215.9, h: 279.4, label: 'Carta' },
  Oficio: { w: 216, h: 330, label: 'Ofício' },
  Legal: { w: 215.9, h: 355.6, label: 'Legal' },
  Executivo: { w: 184.15, h: 266.7, label: 'Executivo' },
};

export const MARGIN_PRESETS = {
  normal: { top: 25, right: 25, bottom: 25, left: 25, label: 'Normal' },
  estreita: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7, label: 'Estreita' },
  moderada: { top: 25.4, right: 19, bottom: 25.4, left: 19, label: 'Moderada' },
  larga: { top: 25.4, right: 50.8, bottom: 25.4, left: 50.8, label: 'Larga' },
  timbrado: { top: 52, right: 22, bottom: 59, left: 22, label: 'Timbrado Karla' },
};

// Papéis timbrados (imagem de fundo full-page + margens do espaço seguro).
export const LETTERHEADS = {
  none: { label: 'Nenhum', url: null, margins: null },
  karla: {
    label: 'Karla Dias',
    url: 'assets/karla-dias/timbrado.png',
    margins: { top: 52, right: 22, bottom: 59, left: 22 },
    // Folga inferior (mm): encolhe o timbrado só na base para a linha de baixo
    // não cair na margem que a impressora não imprime. Ajuste fino se precisar.
    safeBottom: 8,
  },
};

export function defaultSettings() {
  return {
    pageSize: 'A4',
    orientation: 'portrait',
    customW: 210,
    customH: 297,
    // Padrão deste projeto: sai com o timbrado da Karla.
    letterhead: 'karla',
    margins: { ...MARGIN_PRESETS.timbrado },
    marginPreset: 'timbrado',
    fontFamily: 'Times New Roman',
    fontSize: 12,
  };
}

/** Retorna dimensões finais (mm) considerando tamanho + orientação. */
export function pageDimsMm(settings) {
  let w, h;
  if (settings.pageSize === 'custom') {
    w = settings.customW; h = settings.customH;
  } else {
    const s = PAGE_SIZES[settings.pageSize] || PAGE_SIZES.A4;
    w = s.w; h = s.h;
  }
  if (settings.orientation === 'landscape') return { w: h, h: w };
  return { w, h };
}

/** Aplica as métricas de página (em px de tela) a um elemento .page. */
export function applyPageMetrics(pageEl, settings) {
  const { w, h } = pageDimsMm(settings);
  const m = settings.margins;
  pageEl.style.width = mmToPx(w) + 'px';
  pageEl.style.minHeight = mmToPx(h) + 'px';
  pageEl.dataset.wmm = w;
  pageEl.dataset.hmm = h;

  // Timbrado como <img> real (imprime de forma confiável, diferente de background CSS).
  const lh = LETTERHEADS[settings.letterhead] || LETTERHEADS.none;
  const bg = pageEl.querySelector('.page__bg');
  if (lh && lh.url) {
    if (bg && bg.getAttribute('src') !== lh.url) bg.setAttribute('src', lh.url);
    if (bg) {
      bg.style.display = 'block';
      bg.style.top = '0';
      // encolhe só a base para a linha inferior não ser cortada na impressão
      bg.style.height = lh.safeBottom ? `calc(100% - ${lh.safeBottom}mm)` : '100%';
    }
    pageEl.classList.add('has-letterhead');
  } else {
    if (bg) { bg.removeAttribute('src'); bg.style.display = 'none'; bg.style.height = '100%'; }
    pageEl.classList.remove('has-letterhead');
  }

  const content = pageEl.querySelector('.page__content');
  if (content) {
    content.style.marginTop = mmToPx(m.top) + 'px';
    content.style.marginRight = mmToPx(m.right) + 'px';
    content.style.marginBottom = mmToPx(m.bottom) + 'px';
    content.style.marginLeft = mmToPx(m.left) + 'px';
    content.style.fontFamily = settings.fontFamily;
    content.style.fontSize = settings.fontSize + 'pt';
  }
  const guide = pageEl.querySelector('.page__margin-guide');
  if (guide) {
    guide.style.top = mmToPx(m.top) + 'px';
    guide.style.right = mmToPx(m.right) + 'px';
    guide.style.bottom = mmToPx(m.bottom) + 'px';
    guide.style.left = mmToPx(m.left) + 'px';
  }
}
