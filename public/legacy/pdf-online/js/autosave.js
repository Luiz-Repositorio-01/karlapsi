// autosave.js — salvamento automático em IndexedDB + recuperação após fechamento.
import { editor } from './editor-core.js';
import { saveDoc, setLastDocId } from './storage.js';
import { debounce } from './utils.js';

let statusEl = null;
let saving = false;

function setStatus(state) {
  if (!statusEl) return;
  const map = {
    salvo: '<span class="saved-dot" style="color:#7bd88f"></span> Salvo',
    salvando: '<span class="spinner"></span> Salvando…',
    naoSalvo: '<span class="saved-dot" style="color:#e0b34a"></span> Alterações não salvas',
    erro: '<span class="saved-dot" style="color:#e06a6a"></span> Erro ao salvar',
  };
  statusEl.innerHTML = map[state] || '';
}

export async function saveNow() {
  if (saving) return;
  saving = true;
  setStatus('salvando');
  try {
    editor.serialize();
    await saveDoc(editor.doc);
    setLastDocId(editor.doc.id);
    editor.markClean();
    setStatus('salvo');
  } catch (e) {
    setStatus('erro');
  } finally {
    saving = false;
  }
}

const autoSave = debounce(saveNow, 1500);

export function initAutosave(statusElement) {
  statusEl = statusElement;
  setStatus('salvo');
  editor.addEventListener('dirty', () => { setStatus('naoSalvo'); autoSave(); });
  editor.addEventListener('saved', () => setStatus('salvo'));

  // Salva ao sair/ocultar a aba (recuperação após fechamento inesperado).
  window.addEventListener('beforeunload', (e) => {
    if (editor.dirty) {
      editor.serialize();
      // tentativa síncrona de salvar
      autoSave.flush();
      e.preventDefault();
      e.returnValue = '';
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && editor.dirty) saveNow();
  });
}
