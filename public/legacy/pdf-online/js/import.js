// import.js — importação de TXT, DOCX (Mammoth) e PDF (PDF.js -> texto por página).
import { editor } from './editor-core.js';
import { createPage } from './document-model.js';
import { loadScript, toast, escapeHtml } from './utils.js';

const MAMMOTH_URL = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';
const PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

function textToHtml(text) {
  return text.split(/\n{2,}/).map((p) =>
    '<p>' + escapeHtml(p.trim()).replace(/\n/g, '<br>') + '</p>'
  ).join('') || '<p><br></p>';
}

export async function importTxt(file) {
  const text = await file.text();
  appendAsContent(textToHtml(text));
  toast('Texto importado.', 'ok');
}

export async function importDocx(file) {
  toast('Importando DOCX…', 'info', 5000);
  try {
    await loadScript(MAMMOTH_URL);
    const buf = await file.arrayBuffer();
    const result = await window.mammoth.convertToHtml({ arrayBuffer: buf });
    appendAsContent(result.value || '<p><br></p>');
    toast('DOCX importado (formatação básica preservada).', 'ok');
  } catch (e) {
    toast('Falha ao importar DOCX. Verifique a conexão.', 'erro');
  }
}

export async function importPdf(file) {
  toast('Lendo PDF…', 'info', 6000);
  try {
    await loadScript(PDFJS_URL);
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    const buf = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    const pages = [];
    let hadText = false;
    for (let i = 1; i <= pdf.numPages; i++) {
      // eslint-disable-next-line no-await-in-loop
      const page = await pdf.getPage(i);
      // eslint-disable-next-line no-await-in-loop
      const tc = await page.getTextContent();
      const text = tc.items.map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim();
      if (text) hadText = true;
      pages.push(text);
    }
    editor.serialize();
    editor.doc.pages = pages.map((t) => createPage(textToHtml(t || '')));
    if (!editor.doc.pages.length) editor.doc.pages = [createPage()];
    editor.activePageId = editor.doc.pages[0].id;
    editor.renderPages();
    editor.snapshot();
    editor.markDirty();
    if (hadText) toast('PDF importado como texto editável.', 'ok');
    else toast('PDF sem camada de texto (parece digitalizado). OCR ainda não implementado.', 'aviso', 5000);
  } catch (e) {
    toast('Falha ao ler PDF: ' + (e.message || e), 'erro');
  }
}

function appendAsContent(html) {
  const content = editor.activeContentEl();
  if (!content) return;
  if (content.innerHTML.trim() === '' || content.innerHTML === '<br>') content.innerHTML = html;
  else content.insertAdjacentHTML('beforeend', html);
  editor.markDirty();
  editor.snapshot();
  editor.emit('changed', {});
}

export function importFile(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (ext === 'txt') return importTxt(file);
  if (ext === 'docx') return importDocx(file);
  if (ext === 'pdf') return importPdf(file);
  if (/^(png|jpe?g|webp|gif)$/.test(ext)) {
    import('./images.js').then((m) => {
      const reader = new FileReader();
      reader.onload = () => m.insertImageFromDataUrl(reader.result);
      reader.readAsDataURL(file);
    });
    return Promise.resolve();
  }
  toast('Formato não suportado: .' + ext, 'erro');
  return Promise.resolve();
}
