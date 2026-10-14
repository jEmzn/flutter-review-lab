/* Viz registry + frame.  Content declares: {t:'viz', id:'ch07.lifecycle', name:'lc', title, try:'…', props:{…}}
   Factories: FR.viz.register('ch07.lifecycle', (body, props, api) => instance)
   instance may expose setMode(mode), destroy(). */
(function () {
  'use strict';
  const { h } = FR.util;
  const reg = {};
  const live = new Set();

  function register(id, factory, meta) { reg[id] = { factory, meta: meta || {} }; }
  function has(id) { return !!reg[id]; }

  function mount(b, ctx) {
    const frame = h('div', { class: 'viz' + (b.wide ? ' wide' : '') });
    const hd = h('div', { class: 'vhd' }, h('span', { class: 'badge' }, 'ภาพโต้ตอบ'), b.title ? h('span', { class: 'ttl', html: FR.markup.inline(b.title) }) : null);
    const body = h('div', { class: 'vbd' });
    frame.append(hd, body);
    if (b.try) frame.appendChild(h('div', { class: 'vtry', html: '<b>ลองทำ:</b> ' + FR.markup.inline(b.try) }));
    const r = reg[b.id];
    if (!r) {
      body.appendChild(h('div', { class: 'callout warn' }, 'ยังไม่มีภาพ: ' + b.id));
      FR._missingViz = (FR._missingViz || []).concat([b.id]);
      return frame;
    }
    // defer creation until in DOM so layout measurements work
    queueMicrotask(() => {
      const fail = (e) => {
        console.error(e);
        body.appendChild(h('div', { class: 'callout warn' }, 'ภาพนี้แสดงผลผิดพลาด: ' + e.message));
        FR.reportError && FR.reportError('viz ' + b.id + ': ' + e.message);
      };
      const done = (inst) => {
        inst = inst || {};
        inst._frame = frame;
        live.add(inst);
        if (b.name) { ctx.vizByName = ctx.vizByName || new Map(); ctx.vizByName.set(b.name, inst); }
        if (b.mode && inst.setMode) inst.setMode(b.mode);
      };
      try {
        const res = r.factory(body, b.props || {}, { frame, header: hd, ctx });
        if (res && typeof res.then === 'function') res.then(done, fail); // async factories (e.g. SQLite)
        else done(res);
      } catch (e) { fail(e); }
    });
    return frame;
  }

  function trigger(ctx, spec) {
    const inst = ctx.vizByName && ctx.vizByName.get(spec.name);
    if (!inst) return;
    if (inst.setMode) inst.setMode(spec.mode, spec);
    const fr = inst._frame;
    if (fr) {
      fr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      FR.util.flash(fr, 'pulse', 900);
    }
  }

  function destroyAll() {
    live.forEach((i) => { try { i.destroy && i.destroy(); } catch (e) {} });
    live.clear();
  }

  FR.viz = { register, mount, trigger, destroyAll, has, list: () => Object.keys(reg) };
})();
