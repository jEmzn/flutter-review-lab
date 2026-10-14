/* Dart syntax playground cards.
   props: { src: 'code with {{name}} slots', inputs: [{ name, label, options: [{ label, dart, value }] }],
            run(vals) → { out?: string[], err?: string, kind?: 'compile'|'runtime', note?: string } }
   Messages in content were checked with `dart run` / `dart analyze` (Dart SDK bundled with Flutter 3.47.6). */
(function () {
  'use strict';
  const { h, clear, seg } = FR.util;
  const md = (s) => FR.markup.inline(s);

  FR.viz.register('dart.play', (body, props) => {
    const vals = {}, dartOf = {};
    (props.inputs || []).forEach((inp) => { const o = inp.options[inp.start || 0]; vals[inp.name] = o.value; dartOf[inp.name] = o.dart; });
    const code = h('pre', { class: 'sq-gen dp-code' });
    const out = h('div', { class: 'dp-out' });
    function draw() {
      const src = props.src.replace(/\{\{(\w+)\}\}/g, (_, k) => `\u0001${k}\u0002`);
      // highlight then mark the substituted slots
      let html = FR.highlight.inline(src.replace(/\u0001(\w+)\u0002/g, (_, k) => dartOf[k]), 'dart');
      const parts = src.split(/\u0001\w+\u0002/);
      if (parts.length > 1) {
        // re-highlight piecewise so slots can be wrapped
        html = '';
        let rest = src;
        const re = /\u0001(\w+)\u0002/;
        let m;
        while ((m = re.exec(rest))) {
          html += FR.highlight.inline(rest.slice(0, m.index), 'dart');
          html += `<span class="dp-slot">${FR.highlight.inline(dartOf[m[1]], 'dart')}</span>`;
          rest = rest.slice(m.index + m[0].length);
        }
        html += FR.highlight.inline(rest, 'dart');
      }
      code.innerHTML = html;
      clear(out);
      let r;
      try { r = props.run(vals) || {}; } catch (e) { r = { err: 'viz error: ' + e.message }; }
      if (r.out && r.out.length) out.appendChild(h('div', { class: 'dp-con' }, h('div', { class: 'sq-cap' }, 'ผลลัพธ์'), ...r.out.map((l) => h('div', { class: 'mono dp-ln' }, l))));
      if (r.err) out.appendChild(h('div', { class: 'dp-err' + (r.kind === 'compile' ? ' compile' : '') }, h('div', { class: 'sq-cap' }, r.kind === 'compile' ? 'คอมไพล์ไม่ผ่าน (dart analyze)' : 'Exception ตอนรัน'), h('div', { class: 'mono' }, r.err)));
      if (r.ok) out.appendChild(h('div', { class: 'vt-res ok', html: md(r.ok) }));
      if (r.note) out.appendChild(h('div', { class: 'vnote', html: md(r.note) }));
    }
    const ctrls = h('div', { class: 'dp-ctrls' });
    (props.inputs || []).forEach((inp) => {
      ctrls.appendChild(h('div', { class: 'dp-in' }, h('span', { class: 'dim' }, inp.label),
        seg(inp.options.map((o, i) => ({ value: i, label: o.label })), inp.start || 0, (i) => { const o = inp.options[i]; vals[inp.name] = o.value; dartOf[inp.name] = o.dart; draw(); })));
    });
    body.append(ctrls, h('div', { class: 'dp-grid' }, code, out));
    draw();
    return {};
  });
})();
