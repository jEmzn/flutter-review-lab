/* Chapter 7 visualizations — State, StatefulWidget, setState, lifecycle, lifting state */
(function () {
  'use strict';
  const { h, clear, sleep, flash, seg, btn } = FR.util;
  const md = (s) => FR.markup.inline(s);
  const R = FR.viz.register;

  // ───────── 7.0 Big picture: the setState loop ─────────
  R('ch07.loop', (body, props) => {
    let mode = 'ok';
    let counter = 0, shown = 0, builds = 1, busy = false;
    const ph = FR.Phone.create({ title: 'ตัวนับ', small: true });
    const num = FR.ui.text('0', 'big');
    ph.setBody(FR.ui.center(FR.ui.text('คุณกดปุ่มนี้ไปแล้ว:', 'dim'), num));
    const STEPS = [
      ['tap', 'ผู้ใช้แตะปุ่ม +', 'เหตุการณ์จากผู้ใช้'],
      ['method', '`onPressed: _incrementCounter`', 'เมธอดใน State ถูกเรียก'],
      ['fn', '`setState(() { _counter++; })`', 'callback ทำงานทันที → ตัวแปรในหน่วยความจำเปลี่ยน'],
      ['dirty', 'Element ถูกทำเครื่องหมาย **dirty**', 'จดไว้ว่า “ต้อง build ใหม่” ยังไม่วาดทันที'],
      ['frame', 'รอเฟรมถัดไป (~16ms)', 'Flutter รวมงานทั้งหมดในเฟรมเดียว'],
      ['build', '`build(context)` ถูกเรียกอีกครั้ง', 'สร้างวิดเจ็ตชุดใหม่จากค่า `_counter` ปัจจุบัน'],
      ['screen', 'หน้าจอแสดงค่าใหม่', 'สิ่งที่ผู้ใช้เห็นตรงกับข้อมูลแล้ว'],
    ];
    const nodes = STEPS.map(([id, t, d]) => h('div', { class: 'loop-node', 'data-id': id }, h('div', { class: 'ln-t', html: md(t) }), h('div', { class: 'ln-d', html: md(d) })));
    const memV = h('span', { class: 'mono' }, '0');
    const buildV = h('span', { class: 'mono' }, '1');
    const dirtyP = h('span', { class: 'pill' }, 'clean');
    const info = h('div', { class: 'vkv' }, h('span', { class: 'k' }, '_counter (หน่วยความจำ)'), memV, h('span', { class: 'k' }, 'build() ถูกเรียก'), buildV, h('span', { class: 'k' }, 'สถานะ element'), dirtyP);
    const modeSeg = seg([{ value: 'ok', label: 'ใช้ setState' }, { value: 'bad', label: 'ลืม setState (แก้ตัวแปรตรงๆ)' }], mode, (m) => { mode = m; reset(); });
    const resetB = btn('รีเซ็ต', () => reset(), 'sm ghost');
    function reset() { counter = 0; shown = 0; builds = 1; num.textContent = '0'; memV.textContent = '0'; buildV.textContent = '1'; dirtyP.textContent = 'clean'; dirtyP.className = 'pill'; nodes.forEach((n) => n.classList.remove('on', 'skip', 'done')); }
    async function press() {
      if (busy) return;
      busy = true;
      nodes.forEach((n) => n.classList.remove('on', 'skip', 'done'));
      for (let i = 0; i < STEPS.length; i++) {
        const id = STEPS[i][0];
        if (mode === 'bad' && i >= 3) { nodes[i].classList.add('skip'); continue; }
        nodes[i].classList.add('on');
        if (id === 'fn') { counter++; memV.textContent = counter; flash(memV); }
        if (id === 'dirty') { dirtyP.textContent = 'dirty'; dirtyP.className = 'pill warn'; }
        if (id === 'build') { builds++; buildV.textContent = builds; flash(buildV); dirtyP.textContent = 'clean'; dirtyP.className = 'pill'; }
        if (id === 'screen') { shown = counter; num.textContent = shown; flash(num); }
        await sleep(props.fast ? 60 : 380);
        nodes[i].classList.remove('on'); nodes[i].classList.add('done');
      }
      if (mode === 'bad') { memV.classList.add('chg'); }
      busy = false;
    }
    ph.setFab('+', press);
    body.appendChild(h('div', { class: 'vctrl' }, modeSeg, resetB));
    body.appendChild(h('div', { class: 'vrow' }, ph.el, h('div', { class: 'grow vcol' }, h('div', { class: 'loop' }, nodes), FR.Panel('ค่าจริงเบื้องหลัง', info))));
    return { setMode(m) { modeSeg.set(m); mode = m; reset(); } };
  });

  // ───────── 7.1 Widgets are immutable ─────────
  R('ch07.immutable', (body) => {
    const stage = h('div', { class: 'imm-stage' });
    const out = h('div');
    let n = 0;
    function card(val, cls) {
      return h('div', { class: 'imm-card ' + (cls || '') },
        h('div', { class: 'imm-h' }, h('span', { class: 'chip' }, 'Text#' + (++n)), h('span', { class: 'dim' }, ' 🔒 immutable')),
        h('pre', { class: 'mono imm-code', html: FR.highlight.inline(`const Text('${val}')\n// final String data = '${val}';`, 'dart') }));
    }
    let cur = card('0');
    stage.appendChild(cur);
    const b1 = btn("ลองแก้ค่า data ในวิดเจ็ตเดิมเป็น '1'", () => {
      clear(out);
      out.appendChild(h('div', { class: 'callout warn' }, h('div', { class: 'hd' }, '✗ Compile error'), h('div', { class: 'bd mono', style: { fontSize: '.82rem' } }, "text.data = '1';  // Error: 'data' can't be used as a setter because it's final.")));
      flash(cur, 'flash');
    });
    const b2 = btn("สร้าง Text('1') ตัวใหม่ แล้วให้ Flutter แทนที่", () => {
      clear(out);
      cur.classList.add('old');
      const nc = card('1', 'new');
      stage.appendChild(nc);
      setTimeout(() => { cur.remove(); cur = nc; nc.classList.remove('new'); }, 900);
      out.appendChild(h('div', { class: 'callout ok' }, h('div', { class: 'hd' }, '✓ ทำได้'), h('div', { class: 'bd', html: md('วิดเจ็ตไม่ถูก “แก้” แต่ถูก **สร้างใหม่ทั้งตัว** แล้วแทนที่ของเดิม — คำถามต่อไปคือ: เลข `1` ต้องถูก **จำไว้ที่ไหน** เพื่อให้รอบหน้ารู้ว่าต้องสร้าง `Text(\'2\')`? คำตอบคือ **ออบเจกต์ State** ที่อยู่ยาวกว่าวิดเจ็ต') })));
    }, 'primary');
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '10px' } }, b1, b2), stage, out);
  });

  // ───────── 7.2 State inspector ─────────
  R('ch07.inspector', (body) => {
    const rows = {};
    const tbl = h('div', { class: 'insp' });
    function row(name, type, val) {
      const v = h('span', { class: 'mono iv' }, val);
      const r = h('div', { class: 'insp-r' }, h('span', { class: 'mono in' }, name), h('span', { class: 'mono it' }, type), v);
      rows[name] = v;
      tbl.appendChild(r);
    }
    tbl.appendChild(h('div', { class: 'insp-r hd' }, h('span', null, 'ตัวแปร state'), h('span', null, 'ชนิด'), h('span', null, 'ค่าปัจจุบัน')));
    row('_isChecked', 'bool', 'false');
    row('_text', 'String', "''");
    row('_volume', 'double', '0.3');
    row('_counter', 'int', '0');
    row('_results', 'List<String>', '[]');
    const set = (k, v) => { rows[k].textContent = v; flash(rows[k].parentNode); };
    const all = ['ไก่ทอด', 'ไก่ย่าง', 'ข้าวมันไก่', 'ข้าวผัด', 'ผัดไทย', 'ต้มยำ'];
    const resList = h('div', { class: 'u-col', style: { gap: '2px' } });
    let c = 0;
    const counterT = FR.ui.text('0', 'big');
    const ui = h('div', { class: 'insp-ui' },
      FR.ui.checkbox('ยอมรับเงื่อนไข', false, (v) => set('_isChecked', String(v))),
      FR.ui.field({ label: 'พิมพ์ข้อความ', oninput: (v) => set('_text', `'${v}'`) }).el,
      h('div', null, h('div', { class: 'u-text dim' }, 'ระดับเสียง'), FR.ui.slider(30, (v) => set('_volume', (v / 100).toFixed(2)))),
      h('div', { class: 'u-row' }, counterT, FR.ui.btn('+1', () => { c++; counterT.textContent = c; set('_counter', String(c)); }, 'tonal')),
      FR.ui.field({ label: 'ค้นหาเมนู (ลอง “ไก่”)', oninput: (v) => {
        const r = v ? all.filter((x) => x.includes(v)) : [];
        clear(resList); r.forEach((x) => resList.appendChild(FR.ui.text('• ' + x)));
        set('_results', '[' + r.map((x) => `'${x}'`).join(', ') + ']');
      } }).el, resList);
    body.appendChild(h('div', { class: 'vrow' }, h('div', { class: 'insp-phone' }, ui), h('div', { class: 'grow' }, tbl)));
  });

  // ───────── 7.4 Widget vs State identity ─────────
  R('ch07.pair', (body) => {
    let wId = 1, sId = 1, eId = 1, counter = 0, title = 'หน้าแรก', builds = 1, alive = true;
    const con = FR.Console.create({ title: 'Debug Console', compact: true });
    const wCard = h('div', { class: 'pair-card k-w' });
    const eCard = h('div', { class: 'pair-card k-e' });
    const sCard = h('div', { class: 'pair-card k-s' });
    const hist = h('div', { class: 'pair-hist' });
    function draw() {
      wCard.innerHTML = `<div class="pc-h"><span class="chip">MyCounterWidget #w${wId}</span><span class="dim">🔒 immutable · ถูกสร้างใหม่บ่อย</span></div>` +
        `<div class="vkv"><span class="k">title</span><span class="v">'${title}'</span></div>`;
      eCard.innerHTML = `<div class="pc-h"><span class="chip ok">Element #e${eId}</span><span class="dim">ตำแหน่งในต้นไม้ (เสริม)</span></div><div class="vnote">ถือ widget ปัจจุบัน + State ไว้ด้วยกัน</div>`;
      sCard.innerHTML = alive
        ? `<div class="pc-h"><span class="chip" style="color:var(--k-stateful)">_MyCounterWidgetState #s${sId}</span><span class="dim">mutable · อยู่ยาว</span></div>` +
          `<div class="vkv"><span class="k">_counter</span><span class="v">${counter}</span><span class="k">widget.title</span><span class="v">'${title}'  ← อ่านจาก #w${wId}</span><span class="k">build() ×</span><span class="v">${builds}</span></div>`
        : '<div class="dim">State ถูก dispose แล้ว</div>';
    }
    function addHist(t) { hist.prepend(h('div', { class: 'ph-i', html: md(t) })); while (hist.children.length > 6) hist.lastChild.remove(); }
    draw();
    addHist(`สร้าง #w1 · createState() → #s1`);
    const b1 = btn('กด + (setState ใน State)', () => {
      counter++; builds++; draw(); flash(sCard);
      con.log(`setState → _counter = ${counter} → build() ของ #s${sId}`, 'flash');
      addHist(`setState: **#w${wId} เดิม**, #s${sId} เดิม, _counter = ${counter}`);
    }, 'primary');
    const b2 = btn('Parent rebuild ส่ง title ใหม่', () => {
      wId++; builds++; title = ['หน้าแรก', 'สวัสดี', 'ตัวนับของฉัน', 'Counter'][wId % 4];
      draw(); flash(wCard);
      con.log(`parent build → MyCounterWidget #w${wId}(title: '${title}')`);
      con.log(`didUpdateWidget(oldWidget: #w${wId - 1}) → build()  (_counter ยังเป็น ${counter})`, 'ok');
      addHist(`parent rebuild: **#w${wId} ใหม่** แต่ #s${sId} เดิม → _counter ยังอยู่ (${counter})`);
    });
    const b3 = btn('Parent เอาวิดเจ็ตออก แล้วใส่กลับ', () => {
      con.log(`dispose() ของ #s${sId}  (_counter ${counter} หายไปด้วย)`, 'err');
      wId++; sId++; eId++; counter = 0; builds = 1; draw(); flash(sCard); flash(eCard);
      con.log(`สร้าง Element #e${eId} → createState() → #s${sId} → initState() → build()`, 'sys');
      addHist(`ถอดแล้วใส่ใหม่: Element ใหม่ + **State ใหม่ #s${sId}** → _counter เริ่มที่ 0`);
    }, 'danger');
    body.appendChild(h('div', { class: 'btn-row', style: { marginBottom: '10px' } }, b1, b2, b3));
    body.appendChild(h('div', { class: 'pair' }, wCard, h('div', { class: 'pair-ar' }, '⇄'), eCard, h('div', { class: 'pair-ar' }, '⇄'), sCard));
    body.appendChild(h('div', { class: 'vrow', style: { marginTop: '10px' } }, h('div', { class: 'grow' }, FR.Panel('ประวัติ (ล่าสุดอยู่บน)', hist)), h('div', { class: 'grow' }, con.el)));
  });

  // ───────── 7.5 Lifecycle machine ─────────
  const LC_CODE = `class _MyCounterWidgetState extends State<MyCounterWidget> {
  int _counter = 0;

  @override
  void initState() {
    super.initState();            // เรียก super ก่อนเสมอ
    print('initState');
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    print('didChangeDependencies');
  }

  @override
  void didUpdateWidget(covariant MyCounterWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    print('didUpdateWidget: \${oldWidget.title} → \${widget.title}');
  }

  void _incrementCounter() {
    setState(() { _counter++; });
  }

  @override
  Widget build(BuildContext context) {
    print('build: \$_counter');
    return Text('\$_counter');
  }

  @override
  void deactivate() {
    print('deactivate');
    super.deactivate();
  }

  @override
  void dispose() {
    print('dispose');
    super.dispose();              // เรียก super ตอนท้ายเสมอ
  }
}`;
  R('ch07.lifecycle', (body) => {
    const TRACK = [
      ['createState', 'framework เรียก `createState()` สร้าง State'],
      ['initState', 'ครั้งเดียว: ตั้งค่าเริ่มต้น สร้าง controller'],
      ['didChangeDependencies', 'หลัง initState + เมื่อ InheritedWidget ที่พึ่งพาเปลี่ยน'],
      ['build', 'สร้าง UI จาก state ปัจจุบัน (เรียกบ่อย)'],
      ['didUpdateWidget', 'parent ส่ง widget ตัวใหม่ชนิดเดิมมา'],
      ['setState', 'ตัวกระตุ้น (ไม่ใช่ขั้นของวงจร) → dirty → build'],
      ['activate', 'ถูกใส่กลับเข้าต้นไม้ (เสริม — ไม่อยู่ในตำรา)'],
      ['deactivate', 'ถูกถอดออก อาจถูกใส่กลับที่อื่น'],
      ['dispose', 'ถอดถาวร: เก็บกวาด แล้ว super.dispose() ท้ายสุด'],
    ];
    const MATCH = { createState: null, initState: 'void initState', didChangeDependencies: 'void didChangeDependencies', build: 'Widget build', didUpdateWidget: 'void didUpdateWidget', setState: 'setState(() {', activate: null, deactivate: 'void deactivate', dispose: 'void dispose' };
    let phase = 'none', counter = 0, busy = false;
    const chips = {};
    const track = h('div', { class: 'lc-track' }, TRACK.map(([k, d]) => (chips[k] = h('div', { class: 'lc-node' + (k === 'setState' ? ' trig' : '') + (k === 'activate' ? ' supp' : '') }, h('span', { class: 'mono' }, k + '()'), h('span', { class: 'lc-d', html: md(d) })))));
    const phaseP = h('span', { class: 'pill' });
    const mountedP = h('span', { class: 'pill' });
    const con = FR.Console.create({ title: 'Debug Console' });
    const cv = FR.CodeView.create({ src: LC_CODE, lang: 'dart', title: '_MyCounterWidgetState', maxHeight: '300px' });
    const PHASE = { none: ['ยังไม่ถูกสร้าง', ''], active: ['active (อยู่ในต้นไม้)', 'on'], inactive: ['inactive (ถูกถอดชั่วคราว)', 'warn'], defunct: ['defunct (ตายแล้ว)', 'off'] };
    function status() {
      phaseP.textContent = PHASE[phase][0]; phaseP.className = 'pill ' + PHASE[phase][1];
      const m = phase === 'active' || phase === 'inactive';
      mountedP.textContent = 'mounted = ' + m; mountedP.className = 'pill ' + (m ? 'on' : 'off');
      evBtns.insert.disabled = phase === 'active' || phase === 'inactive';
      ['setState', 'update', 'inherit', 'move', 'remove'].forEach((k) => (evBtns[k].disabled = phase !== 'active' && !(k === 'setState' && phase === 'defunct')));
    }
    async function run(seq, label) {
      if (busy) return;
      busy = true;
      con.sep(label);
      Object.values(chips).forEach((c) => c.classList.remove('done'));
      for (const k of seq) {
        const c = chips[k];
        c.classList.add('on');
        cv.active(MATCH[k] || []);
        if (k === 'build') con.log(`build: ${counter}`); else if (k === 'setState') con.log(`setState(() { _counter++ })  → _counter = ${counter}`, 'flash'); else if (k === 'didUpdateWidget') con.log(`didUpdateWidget: หน้าเดิม → หน้าใหม่`); else con.log(k, k === 'dispose' ? 'err' : k === 'createState' ? 'sys' : '');
        await sleep(420);
        c.classList.remove('on'); c.classList.add('done');
      }
      busy = false;
      status();
    }
    const evBtns = {};
    const ev = (k, label, fn, cls) => (evBtns[k] = btn(label, fn, 'sm ' + (cls || '')));
    ev('insert', '① ใส่ลงต้นไม้', () => { phase = 'active'; counter = 0; run(['createState', 'initState', 'didChangeDependencies', 'build'], 'insert'); }, 'primary');
    ev('setState', '② กด + (setState)', () => {
      if (phase === 'defunct') { con.sep('setState หลัง dispose'); con.log('FlutterError: setState() called after dispose(): _MyCounterWidgetState#1a2b3(lifecycle state: defunct, not mounted)', 'err'); con.log('→ เกิดเมื่อ setState ถูกเรียกหลัง await ทั้งที่หน้าจอปิดไปแล้ว — กันด้วย if (!mounted) return;', 'info'); return; }
      counter++; run(['setState', 'build'], 'setState');
    });
    ev('update', '③ parent ส่ง config ใหม่', () => run(['didUpdateWidget', 'build'], 'parent rebuild'));
    ev('inherit', '④ Theme/InheritedWidget เปลี่ยน', () => run(['didChangeDependencies', 'build'], 'dependency changed'));
    ev('move', '⑤ ย้ายที่ด้วย GlobalKey', () => run(['deactivate', 'activate', 'build'], 'move with GlobalKey'));
    ev('remove', '⑥ ถอดออกถาวร', () => { phase = 'defunct'; run(['deactivate', 'dispose'], 'remove'); }, 'danger');
    const resetB = btn('รีเซ็ต', () => { phase = 'none'; counter = 0; con.clear(); Object.values(chips).forEach((c) => c.classList.remove('done', 'on')); cv.active([]); status(); }, 'sm ghost');
    body.appendChild(h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, Object.values(evBtns), resetB));
    body.appendChild(h('div', { class: 'btn-row', style: { marginBottom: '10px' } }, h('span', { class: 'dim', style: { fontSize: '.82rem' } }, 'สถานะ:'), phaseP, mountedP));
    body.appendChild(h('div', { class: 'vrow' }, h('div', { class: 'grow vcol' }, track, con.el), h('div', { class: 'grow' }, cv.el)));
    status();
  });

  // ───────── 7.6 setState: memory vs screen, dirty + frame batching ─────────
  R('ch07.setstate', (body) => {
    let mem = 0, shown = 0, dirty = false, builds = 1, frame = 0, pending = null;
    const ph = FR.Phone.create({ title: 'ตัวนับ', small: true, height: 300 });
    const scr = FR.ui.text('0', 'big');
    ph.setBody(FR.ui.center(FR.ui.text('ค่าตัวนับ:', 'dim'), scr));
    const memV = h('div', { class: 'vbig' }, '0');
    const dirtyP = h('span', { class: 'pill' }, 'clean');
    const buildsV = h('span', { class: 'mono' }, '1');
    const tl = h('div', { class: 'ss-tl' });
    const con = FR.Console.create({ title: 'Debug Console', compact: true });
    function scheduleFrame() {
      if (pending) return;
      pending = setTimeout(() => {
        pending = null; frame++;
        const fr = h('div', { class: 'ss-fr' + (dirty ? ' b' : '') }, h('span', { class: 'mono' }, 'เฟรม ' + frame), dirty ? h('span', null, ' build() ×1') : h('span', { class: 'dim' }, ' ไม่มีงาน'));
        tl.appendChild(fr); while (tl.children.length > 8) tl.firstChild.remove();
        if (dirty) { builds++; shown = mem; scr.textContent = shown; flash(scr); buildsV.textContent = builds; dirty = false; dirtyP.textContent = 'clean'; dirtyP.className = 'pill'; con.log(`เฟรม ${frame}: build() → แสดง ${shown}`, 'ok'); }
        sync();
      }, 650);
    }
    function sync() { memV.textContent = mem; memV.classList.toggle('stale', mem !== shown); }
    const wrong = btn('_counter++  (ไม่มี setState)', () => { mem++; flash(memV); con.log(`_counter++ → ${mem}  (ไม่มีใครรู้ว่าต้อง build)`, 'warn'); sync(); }, 'danger');
    const right = btn('setState(() { _counter++; })', () => { mem++; flash(memV); dirty = true; dirtyP.textContent = 'dirty'; dirtyP.className = 'pill warn'; con.log(`setState: _counter = ${mem} → mark dirty`); sync(); scheduleFrame(); }, 'primary');
    const three = btn('setState ×3 ในคลิกเดียว', () => { for (let i = 0; i < 3; i++) { mem++; dirty = true; con.log(`setState #${i + 1}: _counter = ${mem}`); } dirtyP.textContent = 'dirty'; dirtyP.className = 'pill warn'; flash(memV); sync(); scheduleFrame(); });
    const reset = btn('รีเซ็ต', () => { mem = shown = 0; builds = 1; frame = 0; dirty = false; scr.textContent = '0'; buildsV.textContent = '1'; dirtyP.textContent = 'clean'; dirtyP.className = 'pill'; clear(tl); con.clear(); sync(); }, 'sm ghost');
    body.appendChild(h('div', { class: 'btn-row', style: { marginBottom: '10px' } }, wrong, right, three, reset));
    body.appendChild(h('div', { class: 'vrow' }, ph.el, h('div', { class: 'grow vcol' },
      FR.Panel('หน่วยความจำ (ค่าจริงของ `_counter`)', memV, h('div', { class: 'vnote' }, 'ตัวเลขเป็นสีส้ม = ค่าในหน่วยความจำไม่ตรงกับจอ')),
      FR.Panel('Element', h('div', { class: 'btn-row' }, dirtyP, h('span', { class: 'dim', style: { fontSize: '.82rem' } }, 'build() ถูกเรียก'), buildsV)),
      FR.Panel('ไทม์ไลน์เฟรม (ชะลอให้เห็น)', tl), con.el)));
  });

  // ───────── 7.8 Lifting state up ─────────
  R('ch07.lift', (body) => {
    let mode = 'lift', parentActive = false, childActive = false;
    const treeBox = h('div');
    const preview = h('div', { class: 'lift-prev' });
    const con = FR.Console.create({ title: 'Debug Console', compact: true });
    let tv;
    const spec = () => ({
      id: 'p', label: mode === 'lift' ? '_ParentWidgetState  (_isActive)' : '_ParentWidgetState  (_isActive)', kind: 'stateful', meta: `_isActive = \`${parentActive}\``, children: [
        { id: 'col', label: 'Column', kind: 'leaf', children: [
          { id: 'txt', label: "Text('สถานะ Parent คือ …')", kind: 'leaf' },
          mode === 'lift'
            ? { id: 'child', label: 'ChildWidget(isActive, onActiveChanged)', kind: 'stateless', meta: `isActive = \`${parentActive}\``, children: [{ id: 'sw', label: 'Switch', kind: 'leaf' }] }
            : { id: 'child', label: '_ChildWidgetState  (เก็บ _isActive เอง)', kind: 'stateful', meta: `_isActive = \`${childActive}\``, children: [{ id: 'sw', label: 'Switch', kind: 'leaf' }] },
        ] },
      ] });
    function drawPreview() {
      clear(preview);
      const swVal = mode === 'lift' ? parentActive : childActive;
      const txt = FR.ui.text('สถานะ Parent คือ: ' + (parentActive ? 'Active' : 'Inactive'));
      const sw = FR.ui.switch('Switch ในลูก', swVal, (v) => toggle(v));
      const sync = (mode === 'lift' || parentActive === childActive);
      preview.append(txt, sw, h('div', { class: 'pill ' + (sync ? 'on' : 'off') }, sync ? 'ข้อมูลตรงกัน' : '⚠ ข้อมูลไม่ตรงกัน: จอบอก Inactive แต่ Switch เปิดอยู่'));
    }
    function build() { clear(treeBox); tv = FR.Tree.create(treeBox, spec(), { compact: true }); drawPreview(); }
    async function toggle(v) {
      if (mode === 'lift') {
        con.log(`ลูกเรียก onActiveChanged(${v})`, 'flash');
        tv.clearArrows(); tv.arrow('sw', 'p', 'callback', 'onActiveChanged(' + v + ')');
        await sleep(600);
        parentActive = v;
        con.log(`parent: setState(() { _isActive = ${v}; })`);
        tv.setMeta('p', `_isActive = \`${v}\``);
        tv.rebuild(tv.subtree('p'));
        await sleep(400);
        tv.clearArrows(); tv.arrow('p', 'txt', 'data', 'ข้อความใหม่'); tv.arrow('p', 'child', 'data', 'isActive: ' + v);
        tv.setMeta('child', `isActive = \`${v}\``);
        drawPreview();
        con.log('parent rebuild → ส่งค่าใหม่ลงไปให้ทั้ง Text และ ChildWidget', 'ok');
      } else {
        childActive = v;
        tv.clearArrows();
        tv.setMeta('child', `_isActive = \`${v}\``);
        tv.rebuild(tv.subtree('child'));
        con.log(`ลูก setState เอง: _isActive = ${v}  (parent ไม่รู้เรื่อง)`, 'warn');
        drawPreview();
      }
    }
    const s = seg([{ value: 'lift', label: 'ยก state ขึ้น (ตำรา)' }, { value: 'local', label: 'ลูกเก็บ state เอง' }], mode, (m) => { mode = m; parentActive = childActive = false; con.clear(); build(); });
    body.appendChild(h('div', { class: 'vctrl' }, s));
    body.appendChild(h('div', { class: 'vrow' }, h('div', { class: 'grow' }, treeBox, h('div', { class: 'tv-legend' }, h('span', { class: 'l-rb' }, 'build ใหม่'), h('span', { class: 'l-ok' }, 'ข้อมูลลง (constructor)'), h('span', { class: 'l-rb' }, 'callback ขึ้น'))), h('div', { class: 'vcol', style: { flex: '0 1 260px' } }, FR.Panel('หน้าจอ', preview), con.el)));
    build();
    return { setMode(m) { s.set(m); mode = m; parentActive = childActive = false; build(); } };
  });

  // ───────── Lab: ColorChanger ─────────
  R('ch07.lab', (body) => {
    const COLORS = [['red', '#e06c75'], ['green', '#7fb069'], ['yellow', '#e5c07b'], ['purple', '#a77ddb'], ['orange', '#e08a4f'], ['teal', '#4fb3a9']];
    const con = FR.Console.create({ title: 'Debug Console' });
    const ph = FR.Phone.create({ title: 'ปฏิบัติการบทที่ 7 - State', small: true });
    let cur, alive = false, useInit = true;
    const box = h('button', { type: 'button', class: 'cc-box' }, 'แตะฉัน!');
    function pick() { return COLORS[Math.floor(Math.random() * COLORS.length)]; }
    function paint() { box.style.background = cur[1]; }
    function mount() {
      alive = true;
      cur = useInit ? pick() : ['blue', '#5b8def'];
      con.sep('สร้างหน้าจอ');
      con.log('initState: Controller ถูกสร้างแล้ว');
      if (useInit) con.log(`สีเริ่มต้นที่ตั้งใน initState: Colors.${cur[0]}`, 'sys');
      paint();
      ph.setBody(FR.ui.center(box));
      ph.setBack(null);
    }
    box.addEventListener('click', () => { if (!alive) return; cur = pick(); paint(); flash(box, 'flash'); con.log(`setState → _currentColor = Colors.${cur[0]}`, 'flash'); });
    const restart = btn('Hot Restart (เริ่มแอปใหม่)', () => { con.log('— Hot Restart: State เดิมถูกทิ้ง สร้างใหม่ทั้งหมด —', 'dim'); mount(); }, 'primary');
    const reload = btn('Hot Reload', () => { con.log('— Hot Reload: State เดิมยังอยู่ initState ไม่ถูกเรียกซ้ำ สีเลยไม่สุ่มใหม่ —', 'dim'); flash(box, 'flash'); });
    const leave = btn('ออกจากหน้านี้ (pop)', () => {
      if (!alive) return;
      alive = false;
      con.log('dispose: กำลัง dispose controller', 'err');
      ph.setBody(FR.ui.center(FR.ui.text('(หน้าจอถูกปิดแล้ว)', 'dim'), FR.ui.btn('เปิดอีกครั้ง', mount, 'tonal')));
    }, 'danger');
    const initT = FR.util.toggle('ใช้ initState สุ่มสีเริ่มต้น (แบบฝึกหัด 4)', useInit, (v) => { useInit = v; });
    body.appendChild(h('div', { class: 'btn-row', style: { marginBottom: '10px' } }, restart, reload, leave, initT));
    body.appendChild(h('div', { class: 'vrow' }, ph.el, h('div', { class: 'grow' }, con.el)));
    mount();
  });
})();
