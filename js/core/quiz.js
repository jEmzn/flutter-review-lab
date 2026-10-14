/* Quiz engine: mcq | multi | order | spot.  Results go to FR.store (per item id). */
(function () {
  'use strict';
  const { h, shuffle } = FR.util;
  const md = (s) => FR.markup.inline(s);

  function hash(s) { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return Math.abs(x); }

  function statusChip(id) {
    const r = FR.store.quiz(id);
    if (!r) return null;
    return h('span', { class: 'chip ' + (r.ok ? 'ok' : 'err') }, r.ok ? 'ตอบถูกแล้ว' : 'เคยตอบผิด');
  }

  function feedback(ok, text) {
    const d = h('div', { class: 'qfb ' + (ok ? 'ok' : 'no') });
    d.innerHTML = (ok ? '<strong>ถูกต้อง</strong> — ' : '<strong>ยังไม่ใช่</strong> — ') + md(text || '');
    return d;
  }

  function codeBlock(item) {
    if (!item.code) return null;
    return FR.CodeView.create({ src: item.code, lang: item.lang || 'dart', title: item.codeTitle }).el;
  }

  function mcq(item, id, multi) {
    const box = h('div');
    const opts = shuffle(item.options.map((o, i) => Object.assign({ _i: i }, o)), item.noShuffle ? null : hash(id));
    const order = item.noShuffle ? item.options.map((o, i) => Object.assign({ _i: i }, o)) : opts;
    const wrap = h('div', { class: 'qopts', role: multi ? 'group' : 'radiogroup' });
    const btns = [];
    let done = false;
    const picked = new Set();
    order.forEach((o, k) => {
      const b = h('button', { type: 'button', class: 'qopt' + (multi ? ' multi' : '') },
        h('span', { class: 'mk' }, String.fromCharCode(65 + k)),
        h('span', { class: 'ot' }, h('span', { html: md(o.t) })));
      b._o = o;
      b.addEventListener('click', () => {
        if (done) return;
        if (multi) { picked.has(o) ? picked.delete(o) : picked.add(o); b.classList.toggle('sel'); }
        else { picked.clear(); picked.add(o); check(); }
      });
      btns.push(b);
      wrap.appendChild(b);
    });
    box.appendChild(wrap);
    const act = h('div', { class: 'qactions' });
    const fbHolder = h('div');
    function check() {
      if (!picked.size && multi) return;
      done = true;
      const correctSet = order.filter((o) => o.ok);
      const ok = multi ? correctSet.length === picked.size && correctSet.every((o) => picked.has(o)) : [...picked][0].ok;
      btns.forEach((b) => {
        b.disabled = true;
        const o = b._o;
        if (o.ok) b.classList.add('right');
        if (picked.has(o) && !o.ok) b.classList.add('wrong');
        if ((picked.has(o) || o.ok) && o.why) {
          const w = h('span', { class: 'ow', html: md(o.why) });
          b.querySelector('.ot').appendChild(w);
        }
      });
      fbHolder.appendChild(feedback(ok, item.explain));
      FR.store.quizResult(id, ok);
      checkBtn && (checkBtn.hidden = true);
      retry.hidden = false;
    }
    let checkBtn = null;
    if (multi) { checkBtn = FR.util.btn('ตรวจคำตอบ', check, 'primary sm'); act.appendChild(checkBtn); }
    const retry = FR.util.btn('ลองใหม่', () => { const n = mcq(item, id, multi); box.replaceWith(n); }, 'ghost sm');
    retry.hidden = true;
    act.appendChild(retry);
    box.appendChild(fbHolder);
    box.appendChild(act);
    return box;
  }

  function order(item, id) {
    const box = h('div');
    const correct = item.items.slice();
    let cur = shuffle(correct, hash(id));
    if (cur.every((x, i) => x === correct[i])) cur = cur.slice().reverse();
    const ol = h('ol', { class: 'qorder' });
    let done = false;
    function render() {
      FR.util.clear(ol);
      cur.forEach((t, i) => {
        const up = h('button', { type: 'button', 'aria-label': 'เลื่อนขึ้น', disabled: done || i === 0 }, '↑');
        const dn = h('button', { type: 'button', 'aria-label': 'เลื่อนลง', disabled: done || i === cur.length - 1 }, '↓');
        up.addEventListener('click', () => { [cur[i - 1], cur[i]] = [cur[i], cur[i - 1]]; render(); });
        dn.addEventListener('click', () => { [cur[i + 1], cur[i]] = [cur[i], cur[i + 1]]; render(); });
        const li = h('li', null, h('span', { class: 't', html: md(t) }), h('span', { class: 'mv' }, up, dn));
        if (done) li.classList.add(t === correct[i] ? 'right' : 'wrong');
        ol.appendChild(li);
      });
    }
    render();
    box.appendChild(ol);
    const fbHolder = h('div');
    const act = h('div', { class: 'qactions' });
    const checkBtn = FR.util.btn('ตรวจลำดับ', () => {
      done = true;
      const ok = cur.every((t, i) => t === correct[i]);
      render();
      let txt = item.explain || '';
      if (!ok) txt = 'ลำดับที่ถูกคือ: ' + correct.map((c, i) => `(${i + 1}) ${c}`).join(' → ') + (txt ? '\n' + txt : '');
      fbHolder.appendChild(feedback(ok, txt));
      FR.store.quizResult(id, ok);
      checkBtn.hidden = true; retry.hidden = false;
    }, 'primary sm');
    const retry = FR.util.btn('ลองใหม่', () => box.replaceWith(order(item, id)), 'ghost sm');
    retry.hidden = true;
    act.append(checkBtn, retry);
    box.append(fbHolder, act);
    return box;
  }

  function spot(item, id) {
    const box = h('div');
    const bads = Array.isArray(item.bad) ? item.bad : [item.bad];
    const fbHolder = h('div');
    let cv;
    cv = FR.CodeView.create({
      src: item.code, lang: item.lang || 'dart', title: item.codeTitle || 'คลิกบรรทัดที่มีปัญหา',
      spot: (i) => {
        const badIdx = bads.map((b) => cv.findLine(b));
        const ok = badIdx.includes(i);
        cv.lock();
        badIdx.forEach((bi) => cv.mark(bi, 'bad'));
        if (!ok) cv.mark(i, 'picked');
        fbHolder.appendChild(feedback(ok, item.explain));
        FR.store.quizResult(id, ok);
        retry.hidden = false;
      },
    });
    box.appendChild(cv.el);
    const retry = FR.util.btn('ลองใหม่', () => box.replaceWith(spot(item, id)), 'ghost sm');
    retry.hidden = true;
    box.append(fbHolder, h('div', { class: 'qactions' }, retry));
    return box;
  }

  function renderItem(item, id, n) {
    const type = item.type || 'mcq';
    const card = h('div', { class: 'qitem', id: 'q-' + id.replace(/[^\w-]/g, '_') });
    const head = h('div', { class: 'qn' }, `ข้อ ${n}`, ' ', type === 'order' ? '· เรียงลำดับ' : type === 'multi' ? '· เลือกได้หลายข้อ' : type === 'spot' ? '· หาบรรทัดที่ผิด' : '');
    const st = statusChip(id);
    if (st) { head.appendChild(document.createTextNode(' ')); head.appendChild(st); }
    card.appendChild(head);
    card.appendChild(h('div', { class: 'qq', html: md(item.q) }));
    if (type !== 'spot') { const cb = codeBlock(item); if (cb) card.appendChild(cb); }
    if (type === 'order') card.appendChild(order(item, id));
    else if (type === 'spot') card.appendChild(spot(item, id));
    else card.appendChild(mcq(item, id, type === 'multi'));
    return card;
  }

  /** render a list of quiz items; idBase like 'ch07/7.5' */
  function render(items, idBase, opts = {}) {
    const wrap = h('section', { class: 'quiz' });
    wrap.appendChild(h('div', { class: 'qhd' }, h('h3', null, opts.title || 'แบบทดสอบท้ายหัวข้อ'), h('span', { class: 'chip' }, `${items.length} ข้อ`)));
    items.forEach((it, i) => wrap.appendChild(renderItem(it, it.id || `${idBase}#${i + 1}`, i + 1)));
    return wrap;
  }

  FR.quiz = { render, renderItem };
})();
