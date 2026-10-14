/* Walkthrough renderer — file tree + CodeView (real sources from FR.data.sources) + annotations + action tracing.
   spec: { id, title, lede, intro:[blocks], files:[{key, role, refs:[], summary, notes:[{at, note}]}],
           actions:{ key:{ label, steps:[{ file, at, to?, text }] } }, after:[blocks] } */
(function () {
  'use strict';
  const { h, clear, seg, btn } = FR.util;
  const md = (s) => FR.markup.inline(s);

  function render(main, spec) {
    const ctx = { vizByName: new Map(), keyBase: spec.id };
    const page = h('article', { class: 'read wk-page' });
    page.append(
      h('div', { class: 'eyebrow' }, h('span', { class: 'chip exam' }, 'Walkthrough โค้ดจริง'), h('span', { class: 'chip' }, spec.source || '')),
      h('h1', null, spec.title));
    if (spec.lede) page.appendChild(FR.markup.el('p', spec.lede, { class: 'lede' }));
    if (spec.intro) page.appendChild(FR.blocks.render(spec.intro, ctx));

    const src = (FR.data && FR.data.sources) || {};
    const ui = FR.store.ui('walk:' + spec.id) || {};
    let mode = ui.mode || 'file', fileKey = ui.file && spec.files.some((f) => f.key === ui.file) ? ui.file : spec.files[0].key;
    let actKey = ui.action || Object.keys(spec.actions || {})[0], stepIdx = 0;
    const save = () => FR.store.ui('walk:' + spec.id, { mode, file: fileKey, action: actKey });

    const wrap = h('div', { class: 'wk viz' });
    const bar = h('div', { class: 'wk-bar' });
    const tree = h('nav', { class: 'wk-tree', 'aria-label': 'ไฟล์' });
    const info = h('div', { class: 'wk-info' });
    const codeBox = h('div', { class: 'wk-code' });
    const stepBox = h('div', { class: 'wk-step' });
    wrap.append(bar, h('div', { class: 'wk-grid' }, tree, h('div', { class: 'wk-main' }, stepBox, info, codeBox)));
    page.appendChild(wrap);
    if (spec.after) page.appendChild(FR.blocks.render(spec.after, ctx));
    main.appendChild(page);

    let cv = null, cvKey = null;
    function fileSpec(k) { return spec.files.find((f) => f.key === k) || { key: k }; }
    function showFile(k, force) {
      fileKey = k;
      if (cvKey !== k || force) {
        const f = fileSpec(k);
        const text = src[k];
        clear(codeBox);
        if (text == null) { codeBox.appendChild(h('div', { class: 'callout warn' }, 'ไม่พบซอร์ส ' + k + ' — รัน node tools/gen-sources.mjs')); cv = null; cvKey = null; }
        else {
          cv = FR.CodeView.create({ src: text, lang: k.endsWith('.yaml') ? 'yaml' : 'dart', title: '`' + k.replace(/^(ex13|offline|rfa)\//, '') + '`', notes: f.notes, maxHeight: '620px' });
          codeBox.appendChild(cv.el);
          cvKey = k;
        }
        clear(info);
        info.append(
          h('div', { class: 'wk-role' }, h('b', { html: md(f.role || k) }), (f.refs || []).map((r) => { const x = FR.markup.resolve(r); return x ? h('a', { class: 'xref ex-ref', href: x.href, title: x.label }, r) : null; })),
          f.summary ? h('div', { class: 'wk-sum', html: md(f.summary) }) : null);
      }
      tree.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b._key === k));
      save();
    }
    function drawTree() {
      clear(tree);
      let lastDir = null;
      spec.files.forEach((f) => {
        const disp = f.key.replace(/^(ex13|offline|rfa)\//, '');
        const dir = disp.includes('/') ? disp.slice(0, disp.lastIndexOf('/')) : '';
        if (dir !== lastDir) { tree.appendChild(h('div', { class: 'wk-dir' }, dir ? dir + '/' : '/')); lastDir = dir; }
        const b = h('button', { type: 'button', class: 'wk-f' }, h('span', { class: 'mono' }, disp.slice(disp.lastIndexOf('/') + 1)), f.tag ? h('span', { class: 'wk-tag' }, f.tag) : null);
        b._key = f.key;
        b.addEventListener('click', () => { if (mode === 'action') { mode = 'file'; modeSeg.set('file'); drawMode(); } showFile(f.key); });
        tree.appendChild(b);
      });
    }
    // ---- action tracing ----
    const acts = spec.actions || {};
    function drawStep() {
      clear(stepBox);
      if (mode !== 'action') { stepBox.hidden = true; if (cv) cv.active(null); return; }
      stepBox.hidden = false;
      const a = acts[actKey];
      const s = a.steps[stepIdx];
      showFile(s.file);
      if (cv) {
        const first = cv.active(s.to ? { from: s.at, to: s.to } : s.at);
        if (first < 0) FR._badAnchors = (FR._badAnchors || []).concat([s.at]);
      }
      const list = h('ol', { class: 'wk-steps' });
      a.steps.forEach((x, i) => {
        const li = h('li', { class: i === stepIdx ? 'cur' : i < stepIdx ? 'done' : '' }, h('button', { type: 'button' }, h('span', { class: 'mono dim' }, x.file.split('/').pop()), ' ', h('span', { html: md(x.short || '') })));
        li.firstChild.addEventListener('click', () => { stepIdx = i; drawStep(); });
        list.appendChild(li);
      });
      stepBox.append(
        h('div', { class: 'wk-step-hd' },
          h('span', { class: 'chip flash' }, `ขั้น ${stepIdx + 1}/${a.steps.length}`),
          btn('◀ ก่อนหน้า', () => { if (stepIdx > 0) { stepIdx--; drawStep(); } }, 'sm'),
          btn('ถัดไป ▶', () => { if (stepIdx < a.steps.length - 1) { stepIdx++; drawStep(); } }, 'sm primary')),
        h('div', { class: 'wk-step-t', html: md(s.text) }),
        h('details', { class: 'wk-steps-d' }, h('summary', null, 'ดูทุกขั้นของ action นี้'), list));
    }
    const actSeg = Object.keys(acts).length ? seg(Object.keys(acts).map((k) => ({ value: k, label: acts[k].label })), actKey, (k) => { actKey = k; stepIdx = 0; save(); drawStep(); }) : null;
    const actWrap = h('div', { class: 'wk-acts' }, h('span', { class: 'dim' }, 'action:'), actSeg);
    function drawMode() { actWrap.hidden = mode !== 'action'; save(); drawStep(); }
    const modeSeg = seg([{ value: 'file', label: 'อ่านทีละไฟล์' }].concat(Object.keys(acts).length ? [{ value: 'action', label: 'ไล่ตาม action (ข้ามไฟล์)' }] : []), mode, (m) => { mode = m; stepIdx = 0; drawMode(); });
    bar.append(modeSeg, actWrap);
    drawTree();
    showFile(fileKey, true);
    drawMode();
  }

  FR.walk = { render };
})();
