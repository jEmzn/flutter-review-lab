/* TreeView — widget tree renderer with rebuild counters, flashes, marks, lookup animation and arrows.
   spec node: {id, label, kind, note, const, meta, children:[]}
   kinds: stateless | stateful | provider | consumer | selector | system | inherited | form | field | leaf | element | state */
(function () {
  'use strict';
  const { h, clear, sleep } = FR.util;

  const KIND = {
    stateless: ['SL', 'StatelessWidget'],
    stateful: ['SF', 'StatefulWidget'],
    state: ['S', 'State object'],
    provider: ['P', 'Provider'],
    consumer: ['C', 'Consumer'],
    selector: ['Sel', 'Selector / select'],
    system: ['sys', 'Widget ของระบบ (MaterialApp, Navigator, Scaffold …)'],
    inherited: ['IW', 'InheritedWidget'],
    form: ['F', 'Form'],
    field: ['FF', 'FormField'],
    leaf: ['w', 'วิดเจ็ตธรรมดา'],
    element: ['E', 'Element'],
    nav: ['N', 'Navigator'],
    route: ['R', 'Route'],
  };

  function walk(node, fn, depth = 0, parent = null) {
    fn(node, depth, parent);
    (node.children || []).forEach((c) => walk(c, fn, depth + 1, node));
  }
  function findNode(spec, id) { let r = null; walk(spec, (n) => { if (n.id === id) r = n; }); return r; }
  /** ids rebuilt when `id` rebuilds: itself + all descendants except const / cached (skip) subtrees */
  function subtreeIds(spec, id, opts = {}) {
    const start = findNode(spec, id);
    const out = [];
    if (!start) return out;
    (function rec(n, isRoot) {
      if (!isRoot && (n.const || (opts.skip && opts.skip(n)))) return;
      out.push(n.id);
      (n.children || []).forEach((c) => rec(c, false));
    })(start, true);
    return out;
  }
  function ancestors(spec, id) {
    const parents = {};
    walk(spec, (n, d, p) => { parents[n.id] = p ? p.id : null; });
    const out = [];
    let cur = parents[id];
    while (cur) { out.push(cur); cur = parents[cur]; }
    return out;
  }

  function create(container, spec, opts = {}) {
    const root = h('div', { class: 'tv' + (opts.compact ? ' compact' : '') });
    const rowsEl = h('div', { class: 'tv-rows' });
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'tv-arrows');
    svg.setAttribute('aria-hidden', 'true');
    root.append(rowsEl, svg);
    container.appendChild(root);

    const rows = {};
    const counts = {};
    let arrows = [];
    let curSpec = spec;

    function render() {
      clear(rowsEl);
      walk(curSpec, (n, d) => {
        const [ab, title] = KIND[n.kind] || KIND.leaf;
        const cnt = h('span', { class: 'tv-cnt', title: 'จำนวนครั้งที่ build() ถูกเรียก' });
        const meta = h('span', { class: 'tv-meta' });
        if (n.meta) meta.innerHTML = FR.markup.inline(n.meta);
        const lbl = h('span', { class: 'tv-lbl' }, n.label);
        const row = h('div', { class: 'tv-row k-' + (n.kind || 'leaf') + (n.const ? ' is-const' : ''), 'data-id': n.id, style: { '--d': d } },
          h('span', { class: 'tv-kind', title }, ab), lbl,
          n.const ? h('span', { class: 'tv-const', title: 'const — สร้างครั้งเดียว ไม่ถูกสร้างใหม่เมื่อ parent rebuild' }, 'const') : null,
          n.note ? h('span', { class: 'tv-note', html: FR.markup.inline(n.note) }) : null,
          meta, cnt);
        row._lbl = lbl; row._meta = meta; row._cnt = cnt;
        rows[n.id] = row;
        if (counts[n.id] == null) counts[n.id] = 0;
        updCount(n.id);
        rowsEl.appendChild(row);
      });
      if (opts.hideCounts) root.classList.add('no-counts');
      drawArrows();
    }
    function updCount(id) {
      const r = rows[id];
      if (!r) return;
      r._cnt.textContent = counts[id] ? `build ×${counts[id]}` : '';
      r._cnt.classList.toggle('z', !counts[id]);
    }

    // arrows
    function drawArrows() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const W = root.clientWidth, H = rowsEl.offsetHeight;
      svg.setAttribute('width', W); svg.setAttribute('height', H);
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const defs = document.createElementNS(svgNS, 'defs');
      ['lookup', 'data', 'callback', 'notify', 'err', 'key'].forEach((k) => {
        const m = document.createElementNS(svgNS, 'marker');
        m.setAttribute('id', 'ah-' + k + '-' + uidBase);
        m.setAttribute('viewBox', '0 0 10 10'); m.setAttribute('refX', '8'); m.setAttribute('refY', '5');
        m.setAttribute('markerWidth', '7'); m.setAttribute('markerHeight', '7'); m.setAttribute('orient', 'auto-start-reverse');
        const p = document.createElementNS(svgNS, 'path');
        p.setAttribute('d', 'M0,0 L10,5 L0,10 z'); p.setAttribute('class', 'ah ah-' + k);
        m.appendChild(p); defs.appendChild(m);
      });
      svg.appendChild(defs);
      arrows.forEach((a, idx) => {
        const r1 = rows[a.from], r2 = rows[a.to];
        if (!r1 || !r2) return;
        const y1 = r1.offsetTop + r1.offsetHeight / 2, y2 = r2.offsetTop + r2.offsetHeight / 2;
        const x1 = Math.min(W - 30, r1._lbl.offsetLeft + r1._lbl.offsetWidth + 10);
        const x2 = Math.min(W - 30, r2._lbl.offsetLeft + r2._lbl.offsetWidth + 10);
        const bulge = Math.min(W * 0.35, 60 + Math.abs(y2 - y1) * 0.35) + idx * 10;
        const cx = Math.max(x1, x2) + bulge;
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`);
        path.setAttribute('class', 'tv-arrow k-' + a.kind);
        path.setAttribute('marker-end', `url(#ah-${a.kind}-${uidBase})`);
        svg.appendChild(path);
        if (a.label) {
          const t = document.createElementNS(svgNS, 'text');
          t.setAttribute('x', Math.min(cx - 4, W - 4));
          t.setAttribute('y', (y1 + y2) / 2 + 4);
          t.setAttribute('text-anchor', 'end');
          t.setAttribute('class', 'tv-alabel k-' + a.kind);
          t.textContent = a.label;
          svg.appendChild(t);
        }
      });
    }
    const uidBase = FR.util.uid('tv');
    const ro = new ResizeObserver(() => drawArrows());
    ro.observe(root);

    render();

    const api = {
      el: root,
      rows,
      spec: () => curSpec,
      setTree(s) { curSpec = s; render(); },
      rebuild(ids, cls = 'rb') {
        (Array.isArray(ids) ? ids : [ids]).forEach((id) => {
          counts[id] = (counts[id] || 0) + 1; updCount(id);
          FR.util.flash(rows[id], cls, 1100);
        });
      },
      pulse(ids, cls = 'pl') { (Array.isArray(ids) ? ids : [ids]).forEach((id) => FR.util.flash(rows[id], cls, 1100)); },
      mark(id, cls, on = true) { if (rows[id]) rows[id].classList.toggle(cls, on); },
      unmarkAll(cls) { Object.values(rows).forEach((r) => r.classList.remove(cls)); },
      setMeta(id, md) { if (rows[id]) rows[id]._meta.innerHTML = FR.markup.inline(md || ''); },
      setLabel(id, text) { if (rows[id]) rows[id]._lbl.textContent = text; },
      count: (id) => counts[id] || 0,
      resetCounts() { Object.keys(counts).forEach((k) => { counts[k] = 0; updCount(k); }); },
      arrow(from, to, kind = 'data', label = '') { arrows.push({ from, to, kind, label }); drawArrows(); },
      clearArrows() { arrows = []; drawArrows(); },
      subtree: (id, o) => subtreeIds(curSpec, id, o),
      ancestors: (id) => ancestors(curSpec, id),
      find: (id) => findNode(curSpec, id),
      /** animate lookup up the tree; returns found id or null */
      async lookup(fromId, pred, { delay = 260, cls = 'look' } = {}) {
        api.unmarkAll(cls); api.unmarkAll('found'); api.unmarkAll('miss');
        api.mark(fromId, cls);
        for (const a of ancestors(curSpec, fromId)) {
          await sleep(delay);
          const n = findNode(curSpec, a);
          if (pred(n)) { api.mark(a, 'found'); return a; }
          api.mark(a, cls);
        }
        await sleep(delay);
        api.mark(fromId, 'miss');
        return null;
      },
      destroy() { ro.disconnect(); },
    };
    return api;
  }

  FR.Tree = { create, subtreeIds, ancestors, findNode, walk, KIND };
})();
