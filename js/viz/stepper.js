/* Stepper — step-through controller. State is recomputed by replaying apply() from initial, so ◀ works.
   opts: {steps:[{title, text, apply(state), ...}], initial(): state, draw(state, step, i), auto: ms, startAt: -1|0} */
(function () {
  'use strict';
  const { h } = FR.util;
  const md = (s) => FR.markup.inline(s);

  function create(opts) {
    let steps = opts.steps;
    let i = opts.startAt != null ? opts.startAt : -1;
    let timer = null;
    const pos = h('span', { class: 'st-pos' });
    const title = h('div', { class: 'st-title' });
    const text = h('div', { class: 'st-text' });
    const dots = h('div', { class: 'st-dots' });
    const bReset = h('button', { type: 'button', class: 'btn sm ghost', title: 'เริ่มใหม่' }, '⟲');
    const bPrev = h('button', { type: 'button', class: 'btn sm', title: 'ย้อน' }, '◀');
    const bNext = h('button', { type: 'button', class: 'btn sm primary', title: 'ขั้นต่อไป' }, 'ขั้นต่อไป ▶');
    const bPlay = h('button', { type: 'button', class: 'btn sm ghost', title: 'เล่นอัตโนมัติ' }, '▷ เล่น');
    const ctrls = h('div', { class: 'st-ctrls' }, bReset, bPrev, bNext, bPlay, pos);
    const el = h('div', { class: 'stepper', tabindex: '0' }, ctrls, dots, h('div', { class: 'st-box' }, title, text));

    function compute(idx) {
      let st = opts.initial ? opts.initial() : {};
      for (let k = 0; k <= idx; k++) if (steps[k] && steps[k].apply) { const r = steps[k].apply(st, k); if (r !== undefined) st = r; }
      return st;
    }
    function renderDots() {
      FR.util.clear(dots);
      steps.forEach((s, k) => {
        const d = h('button', { type: 'button', class: 'st-dot' + (k < i ? ' past' : k === i ? ' cur' : '') + (s.kind ? ' ' + s.kind : ''), title: s.title ? s.title.replace(/[*`]/g, '') : 'ขั้น ' + (k + 1), 'aria-label': 'ไปขั้น ' + (k + 1) });
        d.addEventListener('click', () => go(k));
        dots.appendChild(d);
      });
    }
    function go(k) {
      i = Math.max(-1, Math.min(steps.length - 1, k));
      const st = compute(i);
      const s = steps[i];
      pos.textContent = i < 0 ? `0/${steps.length}` : `${i + 1}/${steps.length}`;
      title.innerHTML = s ? md(s.title || '') : md(opts.introTitle || 'กด “ขั้นต่อไป” เพื่อเริ่ม');
      text.innerHTML = s ? md(s.text || '') : md(opts.intro || '');
      bPrev.disabled = i < 0;
      bNext.disabled = i >= steps.length - 1;
      renderDots();
      try { opts.draw(st, s || null, i); } catch (e) { console.error(e); FR.reportError && FR.reportError('stepper draw: ' + e.message); }
      if (i >= steps.length - 1) stop();
    }
    function stop() { clearInterval(timer); timer = null; bPlay.textContent = '▷ เล่น'; }
    bReset.addEventListener('click', () => { stop(); go(opts.startAt != null ? opts.startAt : -1); });
    bPrev.addEventListener('click', () => { stop(); go(i - 1); });
    bNext.addEventListener('click', () => go(i + 1));
    bPlay.addEventListener('click', () => {
      if (timer) return stop();
      if (i >= steps.length - 1) go(-1);
      bPlay.textContent = '❚❚ หยุด';
      timer = setInterval(() => go(i + 1), opts.auto || 1600);
    });
    el.addEventListener('keydown', (e) => {
      if (e.target !== el) return;
      if (e.key === 'ArrowRight') { go(i + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { go(i - 1); e.preventDefault(); }
    });

    const api = {
      el, go, next: () => go(i + 1), prev: () => go(i - 1),
      get index() { return i; },
      setSteps(s, keep) { steps = s; stop(); go(keep ? Math.min(i, s.length - 1) : (opts.startAt != null ? opts.startAt : -1)); },
      destroy: stop,
    };
    queueMicrotask(() => go(i));
    return api;
  }

  FR.Stepper = { create };
})();
