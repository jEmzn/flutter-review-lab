/* Block renderer: turns content block arrays into DOM.
   Block types: string(p) | p | h | list | steps | code | callout | why | compare | kv | more | viz | quiz | two | html | src */
(function () {
  'use strict';
  const { h } = FR.util;
  const md = (s) => FR.markup.inline(s);

  const CALLOUT = {
    supp: { ic: '◆', t: 'เสริม — ไม่อยู่ในตำรา' },
    real: { ic: 'ⓘ', t: 'หมายเหตุ: พฤติกรรมจริง' },
    warn: { ic: '⚠', t: 'ข้อควรระวัง' },
    exam: { ic: '✎', t: 'จุดออกสอบ' },
    analogy: { ic: '≈', t: 'อุปมา' },
    note: { ic: '•', t: 'หมายเหตุ' },
    ok: { ic: '✓', t: 'สรุป' },
  };

  /** ctx: { vizByName: Map, keyBase: 'ch07/7.5' } */
  function render(blocks, ctx) {
    ctx = ctx || { vizByName: new Map() };
    const frag = document.createDocumentFragment();
    (blocks || []).forEach((b) => { const e = one(b, ctx); if (e) frag.appendChild(e); });
    return frag;
  }

  function one(b, ctx) {
    if (b == null) return null;
    if (typeof b === 'string') return FR.markup.el('p', b);
    const t = b.t;
    switch (t) {
      case 'p': return FR.markup.el('p', b.text, b.class ? { class: b.class } : null);
      case 'h': return FR.markup.el(b.level === 4 ? 'h4' : 'h3', b.text);
      case 'list': {
        const l = h(b.ordered ? 'ol' : 'ul');
        b.items.forEach((it) => l.appendChild(typeof it === 'string' ? FR.markup.el('li', it) : h('li', null, render(it, ctx))));
        return l;
      }
      case 'steps': {
        const l = h('ol', { class: 'steps' });
        b.items.forEach((it) => l.appendChild(FR.markup.el('li', it)));
        return l;
      }
      case 'rules': {
        const l = h('ul', { class: 'rules' });
        b.items.forEach((it) => l.appendChild(FR.markup.el('li', it)));
        return l;
      }
      case 'code': {
        const cv = FR.CodeView.create({ src: b.src, lang: b.lang || 'dart', title: b.title, notes: b.notes, hl: b.hl, openNotes: b.open, maxHeight: b.maxHeight, startLine: b.startLine });
        if (b.name) ctx.codeByName = Object.assign(ctx.codeByName || {}, { [b.name]: cv });
        return cv.el;
      }
      case 'callout': {
        const k = CALLOUT[b.kind] || CALLOUT.note;
        const box = h('div', { class: 'callout ' + (b.kind || 'note') });
        box.appendChild(h('div', { class: 'hd' }, h('span', { class: 'ic', 'aria-hidden': 'true' }, k.ic), h('span', { html: md(b.title || k.t) })));
        const bd = h('div', { class: 'bd' });
        if (typeof b.body === 'string') bd.appendChild(FR.markup.el('p', b.body));
        else bd.appendChild(render(b.body, ctx));
        box.appendChild(bd);
        return box;
      }
      case 'why': return why(b, ctx);
      case 'compare': {
        const wrap = h('div', { class: 'tbl-wrap' });
        const tbl = h('table', { class: 'tbl' });
        const thead = h('thead', null, h('tr', null, b.cols.map((c) => h('th', { html: md(c) }))));
        const tbody = h('tbody', null, b.rows.map((r) => h('tr', null, r.map((c) => h('td', { html: md(c) })))));
        tbl.append(thead, tbody);
        wrap.appendChild(tbl);
        return wrap;
      }
      case 'kv': {
        const dl = h('dl', { class: 'kv' });
        b.items.forEach(([k, v]) => { dl.appendChild(h('dt', { html: md(k) })); dl.appendChild(h('dd', { html: md(v) })); });
        return dl;
      }
      case 'more': {
        const d = h('details', { class: 'more' });
        if (b.open) d.open = true;
        d.appendChild(h('summary', { html: md(b.title || 'ลงลึก') }));
        const bd = h('div', { class: 'bd' });
        bd.appendChild(render(b.body, ctx));
        d.appendChild(bd);
        return d;
      }
      case 'two': {
        const d = h('div', { class: 'two' });
        b.cols.forEach((c) => d.appendChild(h('div', null, render(c, ctx))));
        return d;
      }
      case 'viz': return FR.viz.mount(b, ctx);
      case 'quiz': return FR.quiz.render(b.items, (ctx.keyBase || 'x') + (b.idSuffix || '-inline'), { title: b.title || 'ลองตอบ' });
      case 'html': return h('div', { html: b.html });
      case 'src': return h('div', { class: 'tag-src' }, b.text);
      case 'img': return h('figure', null, h('img', { src: b.src, alt: b.alt || '' }), b.caption ? FR.markup.el('figcaption', b.caption) : null);
      default:
        console.warn('unknown block', b);
        return h('pre', null, JSON.stringify(b, null, 2));
    }
  }

  /** why card: { choice, because:[], alts:[{alt, result, ok, viz:{name, mode}}] } */
  function why(b, ctx) {
    const box = h('div', { class: 'why' });
    const ch = h('div', { class: 'choice' });
    ch.appendChild(h('span', { class: 'lbl' }, b.label || '✓ เลือกแบบนี้'));
    ch.appendChild(FR.markup.el('div', b.choice, { class: 'c' }));
    if (b.because && b.because.length) {
      const ul = h('ul', { class: 'because' });
      b.because.forEach((x) => ul.appendChild(FR.markup.el('li', x)));
      ch.appendChild(ul);
    }
    box.appendChild(ch);
    if (b.alts && b.alts.length) {
      const alts = h('div', { class: 'alts' });
      alts.appendChild(h('span', { class: 'lbl' }, 'แล้วทำไมไม่…?'));
      b.alts.forEach((a) => {
        const d = h('details', { class: 'alt' });
        d.appendChild(h('summary', null, h('span', { class: 'q', html: md(a.alt) })));
        const body = h('div', { class: 'body' });
        if (a.result) body.appendChild(h('div', { class: 'row' }, h('span', { class: 'k res' }, 'ถ้าทำ'), h('span', { html: md(a.result) })));
        if (a.ok) body.appendChild(h('div', { class: 'row' }, h('span', { class: 'k okw' }, 'ใช้ได้เมื่อ'), h('span', { html: md(a.ok) })));
        if (a.more) body.appendChild(render(a.more, ctx));
        if (a.viz) {
          const go = FR.util.btn('▶ ดูผลในภาพ', () => FR.viz.trigger(ctx, a.viz), 'sm');
          body.appendChild(h('div', { class: 'row', style: { marginTop: '8px' } }, go));
        }
        d.appendChild(body);
        alts.appendChild(d);
      });
      box.appendChild(alts);
    }
    return box;
  }

  FR.blocks = { render, one };
})();
