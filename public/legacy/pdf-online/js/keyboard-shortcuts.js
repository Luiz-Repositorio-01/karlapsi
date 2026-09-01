// keyboard-shortcuts.js — atalhos globais do editor.
import { editor } from './editor-core.js';
import * as F from './formatting.js';

export function initShortcuts(actions) {
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) {
      if (e.key === 'Escape') actions.escape?.();
      return;
    }
    const k = e.key.toLowerCase();

    // Ctrl+Shift+…
    if (e.shiftKey) {
      if (k === 'z') { e.preventDefault(); editor.redo(); return; }
      if (k === 'v') { e.preventDefault(); F.pastePlain(); return; }
      return;
    }

    switch (k) {
      case 'b': e.preventDefault(); F.bold(); break;
      case 'i': e.preventDefault(); F.italic(); break;
      case 'u': e.preventDefault(); F.underline(); break;
      case 'z': e.preventDefault(); editor.undo(); break;
      case 'y': e.preventDefault(); editor.redo(); break;
      case 's': e.preventDefault(); actions.save?.(); break;
      case 'p': e.preventDefault(); actions.print?.(); break;
      case 'n': e.preventDefault(); actions.newDoc?.(); break;
      case 'o': e.preventDefault(); actions.open?.(); break;
      case 'f': e.preventDefault(); actions.find?.(); break;
      case 'h': e.preventDefault(); actions.replace?.(); break;
      case 'k': e.preventDefault(); actions.link?.(); break;
      case 'enter': e.preventDefault(); actions.pageBreak?.(); break;
      default: break;
    }
  });
}
