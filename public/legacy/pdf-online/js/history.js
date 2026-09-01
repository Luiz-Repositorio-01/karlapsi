// history.js — desfazer/refazer baseado em snapshots do documento inteiro.
// Cobre texto, formatação, imagens, tabelas, páginas, margens e exclusões,
// pois captura o HTML de todas as páginas + as configurações.
export class History {
  constructor(limit = 120) {
    this.stack = [];
    this.index = -1;
    this.limit = limit;
    this.onChange = null;
  }

  reset(snapshot) {
    this.stack = snapshot ? [snapshot] : [];
    this.index = this.stack.length - 1;
    this._notify();
  }

  push(snapshot) {
    // Evita duplicar snapshot idêntico ao topo.
    if (this.index >= 0 && this.stack[this.index] === snapshot) return;
    // Descarta o "futuro" ao editar após desfazer.
    this.stack = this.stack.slice(0, this.index + 1);
    this.stack.push(snapshot);
    if (this.stack.length > this.limit) this.stack.shift();
    this.index = this.stack.length - 1;
    this._notify();
  }

  canUndo() { return this.index > 0; }
  canRedo() { return this.index < this.stack.length - 1; }

  undo() {
    if (!this.canUndo()) return null;
    this.index--;
    this._notify();
    return this.stack[this.index];
  }

  redo() {
    if (!this.canRedo()) return null;
    this.index++;
    this._notify();
    return this.stack[this.index];
  }

  _notify() { if (this.onChange) this.onChange(this.canUndo(), this.canRedo()); }
}
