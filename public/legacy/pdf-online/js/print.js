// print.js — impressão nativa do navegador (texto vetorial e pesquisável).
// Também é o caminho recomendado para "Salvar como PDF" com alta fidelidade.
import { editor } from './editor-core.js';
import { pageDimsMm } from './page-setup.js';

let styleEl = null;

function ensurePrintStyle() {
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-print-style';
    document.head.appendChild(styleEl);
  }
  return styleEl;
}

/** Ajusta @page ao tamanho/orientação atuais antes de imprimir. */
export function preparePrint() {
  const { w, h } = pageDimsMm(editor.doc.settings);
  // Altura EXATA (height, não só min-height) para o timbrado preencher a folha 1:1
  // e não sobrar/faltar milímetros que cortam a borda inferior.
  // Não forçamos a altura do timbrado aqui: a folga inferior (safeBottom) é
  // aplicada inline em cada .page__bg para a linha de baixo não ser cortada.
  ensurePrintStyle().textContent =
    `@media print { @page { size: ${w}mm ${h}mm; margin: 0; } ` +
    `.page { width: ${w}mm !important; height: ${h}mm !important; min-height: ${h}mm !important; overflow: hidden !important; } }`;
}

export function printDocument() {
  editor.serialize();
  preparePrint();
  // pequeno atraso garante que o estilo foi aplicado
  setTimeout(() => window.print(), 60);
}
