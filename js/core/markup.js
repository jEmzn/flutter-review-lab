/* Inline markup + content index.
   Inline syntax:  **bold**   `code`   [[7.5]]  [[7.5|ข้อความ]]  [[core/c2]]  [[ch13]]   \n → <br> */
(function () {
  'use strict';
  const { esc } = FR.util;

  // ---------- index (built lazily after all content scripts loaded) ----------
  const ORDER = ['map', 'core', 'ch07', 'ch08', 'ch09', 'ch10', 'ch11', 'ch12', 'ch13', 'dart', 'sql', 'exam', 'walk-ex13', 'walk-offline', 'bughunt', 'review'];
  let idx = null;
  function build() {
    const modules = [];
    const byId = {};
    for (const id of ORDER) {
      const m = FR.content[id];
      if (m) { modules.push(m); byId[id] = m; }
    }
    // also any unlisted
    for (const id in FR.content) if (!byId[id]) { modules.push(FR.content[id]); byId[id] = FR.content[id]; }
    const sections = {};
    const flat = [];
    for (const m of modules) {
      (m.sections || []).forEach((s, i) => {
        s._module = m; s._index = i;
        const key = m.id + '/' + s.id;
        s._key = key;
        flat.push(s);
        if (!sections[s.id]) sections[s.id] = s;
        sections[key] = s;
      });
    }
    idx = { modules, byId, sections, flat };
    return idx;
  }
  function index() { return idx || build(); }

  /** resolve a ref string → {href, label, module, section} or null */
  function resolve(ref) {
    const I = index();
    ref = String(ref).trim();
    if (I.byId[ref]) { const m = I.byId[ref]; return { href: '#/' + m.id, label: m.navTitle || m.title, module: m }; }
    const s = I.sections[ref];
    if (s) return { href: '#/' + s._module.id + '/' + s.id, label: (s._module.kind === 'chapter' ? s.id + ' ' : '') + s.title, module: s._module, section: s };
    // route-ish refs like exam, code/ex13
    if (/^(exam|review|dev|map|code\/[\w-]+)$/.test(ref)) return { href: '#/' + ref, label: ref };
    return null;
  }
  const unresolved = new Set();

  // ---------- inline markup ----------
  function inline(src) {
    if (src == null) return '';
    let s = String(src);
    const codes = [];
    s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, ref, text) => {
      const r = resolve(ref.replace(/&#39;/g, "'"));
      if (!r) { unresolved.add(ref); return `<span class="badref" title="unresolved ${ref}">${text || ref}</span>`; }
      return `<a href="${r.href}" class="xref">${text || esc(r.label)}</a>`;
    });
    s = s.replace(/\n/g, '<br>');
    s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[+i])}</code>`);
    return s;
  }
  /** create element with inline markup */
  function el(tag, src, attrs) {
    const e = FR.h(tag, attrs || null);
    e.innerHTML = inline(src);
    return e;
  }

  FR.markup = { inline, el, resolve, index, rebuildIndex: build, unresolved };
})();
