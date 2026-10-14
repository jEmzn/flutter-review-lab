/* Swimlane / sequence diagram with step-through.
   opts: {lanes:[{id,label,sub}], steps:[{from,to,label,kind:'call'|'ret'|'notify'|'fail'|'self', title, text, phase}],
          variants:{key:{label, steps}}, variant, onStep(i, step), auto} */
(function () {
  'use strict';
  const { h, clear } = FR.util;
  const md = (s) => FR.markup.inline(s);

  function create(body, opts) {
    const lanes = opts.lanes;
    const N = lanes.length;
    const laneIdx = {};
    lanes.forEach((l, i) => (laneIdx[l.id] = i));
    const el = h('div', { class: 'sl' });
    const head = h('div', { class: 'sl-head', style: { gridTemplateColumns: `repeat(${N}, minmax(0,1fr))` } },
      lanes.map((l) => h('div', { class: 'sl-lane' }, h('div', { class: 'sl-ln' }, l.label), l.sub ? h('div', { class: 'sl-sub' }, l.sub) : null)));
    const rowsEl = h('div', { class: 'sl-rows', style: { '--n': N } });
    let variantSel = null;
    if (opts.variants) {
      const keys = Object.keys(opts.variants);
      variantSel = FR.util.seg(keys.map((k) => ({ value: k, label: opts.variants[k].label })), opts.variant || keys[0], (k) => setVariant(k));
      el.appendChild(h('div', { class: 'sl-variant' }, h('span', { class: 'dim' }, opts.variantLabel || 'สถานการณ์:'), variantSel));
    }
    el.append(head, rowsEl);
    body.appendChild(el);

    let steps = opts.variants ? opts.variants[opts.variant || Object.keys(opts.variants)[0]].steps : opts.steps;
    let rowEls = [];

    function buildRows() {
      clear(rowsEl);
      rowEls = [];
      let lastPhase = null;
      steps.forEach((s, i) => {
        if (s.phase && s.phase !== lastPhase) {
          rowsEl.appendChild(h('div', { class: 'sl-phase' }, h('span', null, s.phase)));
          lastPhase = s.phase;
        }
        const a = laneIdx[s.from], b = laneIdx[s.to != null ? s.to : s.from];
        const row = h('div', { class: 'sl-row' });
        // lifelines
        for (let k = 0; k < N; k++) row.appendChild(h('div', { class: 'sl-cell' }));
        const kind = s.kind || (a === b ? 'self' : 'call');
        if (kind === 'self' || a === b) {
          const box = h('div', { class: 'sl-self k-' + (s.kind || 'self'), style: { left: `calc(${(a / N) * 100}% + 4px)`, width: `calc(${100 / N}% - 8px)` } },
            h('span', { class: 'sl-num' }, String(i + 1)), h('span', { class: 'sl-lbl', html: md(s.label) }));
          row.appendChild(box);
        } else {
          const lo = Math.min(a, b), hi = Math.max(a, b);
          const left = ((lo + 0.5) / N) * 100, width = ((hi - lo) / N) * 100;
          const arr = h('div', { class: 'sl-arrow k-' + kind + (b < a ? ' rev' : ''), style: { left: left + '%', width: width + '%' } },
            h('div', { class: 'sl-line' }),
            h('div', { class: 'sl-alabel' }, h('span', { class: 'sl-num' }, String(i + 1)), h('span', { class: 'sl-lbl', html: md(s.label) })));
          row.appendChild(arr);
        }
        row.addEventListener('click', () => stepper.go(i));
        rowEls.push(row);
        rowsEl.appendChild(row);
      });
    }

    const stepper = FR.Stepper.create({
      steps: steps.map(toStep),
      auto: opts.auto || 1500,
      intro: opts.intro,
      draw: (_, s, i) => {
        rowEls.forEach((r, k) => {
          r.classList.toggle('cur', k === i);
          r.classList.toggle('future', k > i);
          r.classList.toggle('past', k < i);
        });
        if (rowEls[i] && opts.scrollRows !== false) {
          const r = rowEls[i];
          const top = r.offsetTop - rowsEl.clientHeight / 2;
          if (rowsEl.scrollHeight > rowsEl.clientHeight) rowsEl.scrollTo({ top, behavior: 'smooth' });
        }
        opts.onStep && opts.onStep(i, steps[i] || null);
      },
    });
    function toStep(s) { return { title: s.title || s.label, text: s.text || '', kind: s.kind === 'fail' ? 'fail' : '' }; }
    el.appendChild(stepper.el);
    buildRows();

    function setVariant(k) {
      steps = opts.variants[k].steps;
      buildRows();
      stepper.setSteps(steps.map(toStep));
      opts.onVariant && opts.onVariant(k);
    }
    return { el, stepper, setVariant, setMode: (m) => { if (opts.variants && opts.variants[m]) { variantSel && variantSel.set(m); setVariant(m); } }, destroy: () => stepper.destroy() };
  }

  FR.Swimlane = { create };
  FR.viz.register('swimlane', (body, props) => create(body, props));
})();
