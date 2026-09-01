// pdf-export.js — dois caminhos de exportação:
//   1) Pesquisável (recomendado): usa a impressão nativa -> "Salvar como PDF" (texto vetorial).
//   2) Download direto (imagem): rasteriza cada folha com html2canvas + jsPDF.
// A opção 1 preserva texto selecionável/pesquisável; a 2 é conveniência offline.
import { editor } from './editor-core.js';
import { pageDimsMm } from './page-setup.js';
import { loadScript, toast } from './utils.js';
import { printDocument } from './print.js';

const JSPDF_URL = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
const H2C_URL = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';

/** Caminho recomendado — texto pesquisável via diálogo de impressão. */
export function exportSearchable() {
  toast('Abrindo impressão — escolha "Salvar como PDF" para texto pesquisável.', 'info', 4000);
  printDocument();
}

/** Download direto (imagem de alta resolução por página). */
export async function exportRasterPDF(opts = {}) {
  const scale = opts.scale || 2;
  editor.serialize();
  toast('Gerando PDF…', 'info', 6000);
  try {
    await loadScript(JSPDF_URL);
    await loadScript(H2C_URL);
  } catch (e) {
    toast('Não foi possível carregar as bibliotecas de PDF (sem internet?). Use "Exportar (pesquisável)".', 'erro', 5000);
    return;
  }
  const { jsPDF } = window.jspdf;
  const { w, h } = pageDimsMm(editor.doc.settings);
  const orientation = w > h ? 'l' : 'p';
  const pdf = new jsPDF({ unit: 'mm', format: [w, h], orientation, compress: true });

  const pages = Array.from(editor.pagesEl.querySelectorAll('.page'));
  // Esconde temporariamente guias/seleções.
  document.body.classList.add('exporting');
  for (let i = 0; i < pages.length; i++) {
    const pageEl = pages[i];
    // eslint-disable-next-line no-await-in-loop
    const canvas = await window.html2canvas(pageEl, {
      scale, backgroundColor: '#ffffff', useCORS: true, logging: false,
      windowWidth: pageEl.scrollWidth, windowHeight: pageEl.scrollHeight,
    });
    const img = canvas.toDataURL('image/jpeg', opts.quality || 0.92);
    if (i > 0) pdf.addPage([w, h], orientation);
    pdf.addImage(img, 'JPEG', 0, 0, w, h, undefined, 'FAST');
  }
  document.body.classList.remove('exporting');

  const name = (editor.doc.title || 'documento').replace(/[^\w\-À-ÿ ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase();
  pdf.save(`${name || 'documento'}.pdf`);
  toast('PDF gerado.', 'ok');
}

/** Exporta o documento como HTML autônomo. */
export function exportHTML() {
  editor.serialize();
  const s = editor.doc.settings;
  const body = editor.doc.pages.map((p) => (
    `<section class="page"><div class="content">${p.html}</div></section>`
  )).join('\n');
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${editor.doc.title}</title>
<style>
body{background:#eee;font-family:'Times New Roman',serif;margin:0;padding:20px}
.page{background:#fff;width:${pageDimsMm(s).w}mm;min-height:${pageDimsMm(s).h}mm;margin:0 auto 20px;box-shadow:0 2px 10px rgba(0,0,0,.2)}
.content{padding:${s.margins.top}mm ${s.margins.right}mm ${s.margins.bottom}mm ${s.margins.left}mm}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #444;padding:4px 6px}
@media print{body{background:#fff}.page{box-shadow:none;margin:0}}
</style></head><body>${body}</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (editor.doc.title || 'documento') + '.html';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  toast('HTML exportado.', 'ok');
}
