// find-replace.js — localizar e substituir com destaque real no DOM.
import { editor } from './editor-core.js';

let hits = [];
let current = -1;

function clearHighlights() {
  editor.pagesEl.querySelectorAll('mark.find-hit').forEach((m) => {
    const parent = m.parentNode;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
    parent.normalize();
  });
  hits = [];
  current = -1;
}

function highlight(term, matchCase) {
  clearHighlights();
  if (!term) return 0;
  const flags = matchCase ? 'g' : 'gi';
  let re;
  try { re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags); } catch { return 0; }

  editor.pagesEl.querySelectorAll('.page__content').forEach((content) => {
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement.closest('mark.find-hit') ? NodeFilter.FILTER_REJECT
        : n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach((node) => {
      const text = node.nodeValue;
      re.lastIndex = 0;
      if (!re.test(text)) return;
      re.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let last = 0, m;
      while ((m = re.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        const mark = document.createElement('mark');
        mark.className = 'find-hit';
        mark.textContent = m[0];
        frag.appendChild(mark);
        hits.push(mark);
        last = m.index + m[0].length;
        if (m[0].length === 0) re.lastIndex++;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  });
  return hits.length;
}

function focusHit(i) {
  if (!hits.length) return;
  current = (i + hits.length) % hits.length;
  hits.forEach((h, idx) => h.classList.toggle('is-current', idx === current));
  hits[current].scrollIntoView({ block: 'center', behavior: 'smooth' });
}

export function find(term, matchCase) {
  const count = highlight(term, matchCase);
  if (count) focusHit(0);
  return { count, current: count ? 1 : 0 };
}
export function next() { focusHit(current + 1); return { count: hits.length, current: current + 1 }; }
export function prev() { focusHit(current - 1); return { count: hits.length, current: current + 1 }; }

export function replaceOne(replacement) {
  if (current < 0 || !hits[current]) return { count: hits.length, current: 0 };
  const mark = hits[current];
  const text = document.createTextNode(replacement);
  mark.parentNode.replaceChild(text, mark);
  hits.splice(current, 1);
  editor.markDirty(); editor.snapshot();
  if (hits.length) focusHit(current);
  return { count: hits.length, current: hits.length ? current + 1 : 0 };
}

export function replaceAll(term, replacement, matchCase) {
  highlight(term, matchCase);
  const n = hits.length;
  hits.forEach((mark) => { mark.parentNode.replaceChild(document.createTextNode(replacement), mark); });
  hits = []; current = -1;
  editor.markDirty(); editor.snapshot();
  return n;
}

export function close() { clearHighlights(); }
