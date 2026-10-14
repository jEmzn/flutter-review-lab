/* CodeView — highlighted code with per-line annotations, active-line sync and spot-the-bug mode. */
(function () {
  'use strict';
  const { h, clear } = FR.util;

  function findLine(rawLines, matcher, from = 0) {
    if (typeof matcher === 'number') return matcher;
    for (let i = from; i < rawLines.length; i++) if (rawLines[i].includes(matcher)) return i;
    return -1;
  }

  function create(opts) {
    const src = String(opts.src || '').replace(/^\n+|\s+$/g, '');
    const lang = opts.lang || 'dart';
    const raw = src.split('\n');
    const html = FR.highlight.lines(src, lang);
    const startLine = opts.startLine || 1;

    const root = h('div', { class: 'code' + (opts.spot ? ' spot' : '') });
    const hd = h('div', { class: 'hd' });
    if (opts.title) hd.appendChild(FR.markup.el('span', opts.title));
    const langLbl = h('span', { class: 'lang' }, opts.langLabel || lang);
    hd.appendChild(langLbl);

    const pre = h('pre', { tabindex: '0' });
    if (opts.maxHeight) pre.style.maxHeight = opts.maxHeight;
    const lineEls = [];
    const noteEls = {};
    raw.forEach((_, i) => {
      const ln = h('div', { class: 'ln', 'data-i': i },
        h('span', { class: 'g' }, String(i + startLine)),
        h('span', { class: 's', html: html[i] || '' }));
      lineEls.push(ln);
      pre.appendChild(ln);
    });

    // notes
    const notes = [];
    (opts.notes || []).forEach((n) => {
      const i = findLine(raw, n.at != null ? n.at : n.line);
      if (i < 0) { console.warn('[codeview] note anchor not found:', n.at); FR._badAnchors = (FR._badAnchors || []).concat([n.at]); return; }
      notes.push({ i, note: n.note });
    });
    function toggleNote(i, force) {
      const existing = noteEls[i];
      if (existing && force !== true) { existing.remove(); delete noteEls[i]; return; }
      if (existing) return;
      const texts = notes.filter((n) => n.i === i).map((n) => n.note);
      if (!texts.length) return;
      const ne = h('div', { class: 'note' });
      ne.innerHTML = texts.map(FR.markup.inline).join('<br><br>');
      lineEls[i].after(ne);
      noteEls[i] = ne;
    }
    notes.forEach((n) => {
      const ln = lineEls[n.i];
      if (ln.classList.contains('has-note')) return;
      ln.classList.add('has-note');
      ln.title = 'คลิกเพื่อดูคำอธิบาย';
      ln.addEventListener('click', () => { if (!opts.spot) toggleNote(n.i); });
    });
    if (notes.length) {
      let allOpen = !!opts.openNotes;
      const b = h('button', { type: 'button', class: 'btn sm ghost copy' }, '');
      const lbl = () => { b.textContent = allOpen ? 'ซ่อนคำอธิบาย' : `● คำอธิบาย ${new Set(notes.map((n) => n.i)).size} จุด`; };
      b.addEventListener('click', () => {
        allOpen = !allOpen;
        [...new Set(notes.map((n) => n.i))].forEach((i) => (allOpen ? toggleNote(i, true) : noteEls[i] && toggleNote(i)));
        lbl();
      });
      lbl();
      hd.appendChild(b);
      if (allOpen) [...new Set(notes.map((n) => n.i))].forEach((i) => toggleNote(i, true));
    }
    // copy
    const cp = h('button', { type: 'button', class: 'btn sm ghost copy', title: 'คัดลอกโค้ด' }, 'คัดลอก');
    cp.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(src); cp.textContent = 'คัดลอกแล้ว'; }
      catch (e) { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); cp.textContent = 'เลือกข้อความแล้ว'; }
      setTimeout(() => (cp.textContent = 'คัดลอก'), 1400);
    });
    hd.appendChild(cp);
    root.appendChild(hd);
    root.appendChild(pre);

    // static highlights
    (opts.hl || []).forEach((m) => { const i = findLine(raw, m); if (i >= 0) lineEls[i].classList.add('hl'); });

    // spot mode
    if (opts.spot) {
      lineEls.forEach((ln, i) => ln.addEventListener('click', () => {
        if (root.dataset.locked) return;
        lineEls.forEach((l) => l.classList.remove('picked'));
        ln.classList.add('picked');
        opts.spot(i, raw[i]);
      }));
    }

    const api = {
      el: root,
      raw,
      lineEls,
      findLine: (m, from) => findLine(raw, m, from),
      active(matchers) {
        lineEls.forEach((l) => l.classList.remove('act'));
        const list = matchers == null ? [] : Array.isArray(matchers) ? matchers : [matchers];
        let first = -1;
        list.forEach((m) => {
          if (m && typeof m === 'object' && m.from != null) {
            const a = findLine(raw, m.from), b = findLine(raw, m.to, Math.max(a, 0));
            for (let i = a; i >= 0 && i <= b; i++) { lineEls[i].classList.add('act'); if (first < 0) first = i; }
          } else {
            const i = findLine(raw, m);
            if (i >= 0) { lineEls[i].classList.add('act'); if (first < 0) first = i; }
          }
        });
        if (first >= 0 && opts.autoScroll !== false) {
          const ln = lineEls[first];
          // offsetTop is relative to the nearest positioned ancestor, so measure from the first line instead
          const top = ln.offsetTop - lineEls[0].offsetTop - pre.clientHeight / 3;
          if (pre.scrollHeight > pre.clientHeight) pre.scrollTo({ top, behavior: 'smooth' });
        }
        return first;
      },
      mark(i, cls) { if (lineEls[i]) lineEls[i].classList.add(cls); },
      clearMarks(cls) { lineEls.forEach((l) => cls ? l.classList.remove(cls) : l.classList.remove('bad', 'good', 'picked', 'act')); },
      lock() { root.dataset.locked = '1'; },
      openNote: (i) => toggleNote(i, true),
      setTitle(t) { const s = hd.querySelector('span'); if (s) s.innerHTML = FR.markup.inline(t); },
    };
    return api;
  }

  FR.CodeView = { create, findLine };
})();
