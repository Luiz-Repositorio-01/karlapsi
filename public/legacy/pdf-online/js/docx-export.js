// docx-export.js — exportação para Word (.doc HTML-Word, aberto pelo Word/LibreOffice).
// Preserva texto, títulos, listas, tabelas, imagens, alinhamento e configuração de página.
// Observação honesta: o timbrado (fundo) é garantido no PDF/impressão; no .doc o foco é o conteúdo.
import { editor } from './editor-core.js';
import { pageDimsMm } from './page-setup.js';
import { download, toast } from './utils.js';

export function exportDoc() {
  editor.serialize();
  const s = editor.doc.settings;
  const { w, h } = pageDimsMm(s);
  const m = s.margins;

  const pagesHtml = editor.doc.pages.map((p, i) => {
    const brk = i > 0 ? "<br clear=all style='page-break-before:always'>" : '';
    return `${brk}<div>${p.html}</div>`;
  }).join('\n');

  const html =
`<html xmlns:o='urn:schemas-microsoft-com:office:office'
       xmlns:w='urn:schemas-microsoft-com:office:word'
       xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${escapeXml(editor.doc.title)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
@page Section1 { size: ${w}mm ${h}mm; margin: ${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm; }
div.Section1 { page: Section1; }
body { font-family: '${s.fontFamily}', serif; font-size: ${s.fontSize}pt; }
table { border-collapse: collapse; }
td, th { border: 1px solid #444; padding: 4px 6px; }
h1{font-size:2em}h2{font-size:1.5em}h3{font-size:1.25em}
blockquote{border-left:3px solid #999;margin:0;padding-left:12px;color:#555}
</style>
</head>
<body><div class='Section1'>${pagesHtml}</div></body>
</html>`;

  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const name = (editor.doc.title || 'documento').replace(/[^\w\-À-ÿ ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'documento';
  download(blob, name + '.doc');
  toast('Documento Word (.doc) exportado.', 'ok');
}

function escapeXml(s) {
  return String(s || '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}
