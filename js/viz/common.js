/* Shared viz building blocks: Console, Sorter, Decision, Meter, Controls row */
(function () {
  'use strict';
  const { h, clear } = FR.util;
  const md = (s) => FR.markup.inline(s);

  // ---------- Console (print / debugPrint output) ----------
  function Console(opts = {}) {
    const body = h('div', { class: 'con-body', role: 'log', 'aria-live': 'polite' });
    const el = h('div', { class: 'con' + (opts.compact ? ' compact' : '') },
      h('div', { class: 'con-hd' }, h('span', null, opts.title || 'Debug Console'), h('button', { type: 'button', class: 'btn sm ghost', onclick: () => api.clear() }, 'ล้าง')),
      body);
    if (opts.height) body.style.height = opts.height;
    let n = 0;
    const api = {
      el,
      log(text, kind = '') {
        n++;
        const line = h('div', { class: 'con-ln ' + kind }, h('span', { class: 'n' }, String(n).padStart(2, '0')), h('span', { class: 't', html: opts.markup ? md(text) : FR.util.esc(text) }));
        body.appendChild(line);
        FR.util.flash(line, 'new', 700);
        while (body.children.length > (opts.max || 200)) body.removeChild(body.firstChild);
        body.scrollTop = body.scrollHeight;
        return line;
      },
      sep(label) { body.appendChild(h('div', { class: 'con-sep' }, label || '')); body.scrollTop = body.scrollHeight; },
      clear() { clear(body); n = 0; },
    };
    return api;
  }

  // ---------- Sorter: classify items into buckets ----------
  /* opts: {buckets:[{id,label,desc}], items:[{t, bucket, why}], prompt} */
  function Sorter(opts) {
    const el = h('div', { class: 'sorter' });
    const score = h('div', { class: 'sorter-score' });
    const list = h('div', { class: 'sorter-items' });
    let answered = 0, correct = 0;
    const legend = h('div', { class: 'sorter-legend' }, opts.buckets.map((b) => h('div', { class: 'sb' }, h('strong', null, b.label), b.desc ? h('span', { html: ' — ' + md(b.desc) }) : null)));
    opts.items.forEach((it) => {
      const fb = h('div', { class: 'si-fb' });
      const btns = opts.buckets.map((b) => {
        const bt = h('button', { type: 'button', class: 'btn sm' }, b.label);
        bt.addEventListener('click', () => {
          if (row.dataset.done) return;
          row.dataset.done = '1';
          answered++;
          const ok = it.bucket === b.id;
          if (ok) correct++;
          btns.forEach((x) => (x.disabled = true));
          bt.classList.add(ok ? 'ok' : 'danger');
          if (!ok) btns[opts.buckets.findIndex((q) => q.id === it.bucket)].classList.add('ok');
          row.classList.add(ok ? 'right' : 'wrong');
          fb.innerHTML = (ok ? '✓ ' : '✗ ควรเป็น <strong>' + FR.util.esc(opts.buckets.find((q) => q.id === it.bucket).label) + '</strong> — ') + md(it.why || '');
          updScore();
        });
        return bt;
      });
      const row = h('div', { class: 'si' }, h('div', { class: 'si-t', html: md(it.t) }), h('div', { class: 'btn-row' }, btns), fb);
      list.appendChild(row);
    });
    function updScore() { score.textContent = `ตอบแล้ว ${answered}/${opts.items.length} · ถูก ${correct}`; }
    updScore();
    const reset = FR.util.btn('เริ่มใหม่', () => el.replaceWith(Sorter(opts)), 'sm ghost');
    if (opts.prompt) el.appendChild(h('p', { class: 'dim', html: md(opts.prompt) }));
    el.append(legend, list, h('div', { class: 'btn-row' }, score, reset));
    return el;
  }

  // ---------- Decision flow ----------
  /* opts: {start:'q1', nodes:{q1:{q, options:[{label, next}]}, r1:{result, why, ref}}} */
  function Decision(opts) {
    const el = h('div', { class: 'decision' });
    const trail = h('div', { class: 'dec-trail' });
    const stage = h('div', { class: 'dec-stage' });
    el.append(trail, stage);
    const path = [];
    function show(id) {
      const n = opts.nodes[id];
      clear(stage);
      clear(trail);
      path.forEach((p, i) => trail.appendChild(h('button', { type: 'button', class: 'dec-crumb', onclick: () => { path.length = i; show(p.id); } }, h('span', { class: 'q', html: md(opts.nodes[p.id].q) }), h('span', { class: 'a' }, '→ ' + p.label))));
      if (n.q) {
        stage.appendChild(h('div', { class: 'dec-q', html: md(n.q) }));
        stage.appendChild(h('div', { class: 'btn-row' }, n.options.map((o) => FR.util.btn(o.label, () => { path.push({ id, label: o.label }); show(o.next); }, 'primary'))));
      } else {
        stage.appendChild(h('div', { class: 'dec-result' }, h('div', { class: 'lbl' }, 'คำตอบ'), h('div', { class: 'r', html: md(n.result) }), n.why ? h('div', { class: 'w', html: md(n.why) }) : null));
        stage.appendChild(h('div', { class: 'btn-row' }, FR.util.btn('เริ่มใหม่', () => { path.length = 0; show(opts.start); }, 'sm ghost')));
      }
    }
    show(opts.start);
    return el;
  }

  // ---------- Meter ----------
  function Meter(label, opts = {}) {
    const fill = h('i');
    const val = h('span', { class: 'mv' });
    const el = h('div', { class: 'meter ' + (opts.kind || '') }, h('span', { class: 'ml' }, label), h('div', { class: 'mb' }, fill), val);
    return {
      el,
      set(v, max = opts.max || 100, text) {
        fill.style.width = Math.max(0, Math.min(100, (v / max) * 100)) + '%';
        val.textContent = text != null ? text : String(v);
      },
    };
  }

  /** small labelled panel */
  function Panel(title, ...children) {
    return h('div', { class: 'vpanel' }, title ? h('div', { class: 'vp-hd', html: md(title) }) : null, h('div', { class: 'vp-bd' }, children));
  }

  FR.Console = { create: Console };
  FR.Sorter = { create: Sorter };
  FR.Decision = { create: Decision };
  FR.Meter = { create: Meter };
  FR.Panel = Panel;

  // generic registrations usable directly from content
  FR.viz.register('sorter', (body, props) => { body.appendChild(Sorter(props)); });
  FR.viz.register('decision', (body, props) => { body.appendChild(Decision(props)); });
})();
