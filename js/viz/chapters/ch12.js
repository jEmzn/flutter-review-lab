/* Chapter 12 visualizations — async, frames, event loop, FutureBuilder, JSON, failures, isolates, provider */
(function () {
  'use strict';
  const { h, clear, sleep, flash, seg, btn, toggle } = FR.util;
  const md = (s) => FR.markup.inline(s);
  const R = FR.viz.register;

  // ───────── 12.2 one waiter: blocking vs async on the UI isolate ─────────
  R('ch12.waiter', (body) => {
    let hz = 60, running = false, timer = null;
    const BUDGET = { 60: 16, 90: 11, 120: 8 };
    const frames = h('div', { class: 'wt-frames' });
    const spinner = h('div', { class: 'u-spin wt-spin' });
    const status = h('div', { class: 'vnote' });
    const lanes = h('div', { class: 'wt-lanes' });
    const uiLane = h('div', { class: 'wt-lane' }, h('span', { class: 'wt-l' }, 'UI isolate (พนักงานเสิร์ฟคนเดียว)'));
    const netLane = h('div', { class: 'wt-lane' }, h('span', { class: 'wt-l' }, 'นอก isolate (OS / เครือข่าย = ครัว)'));
    lanes.append(uiLane, netLane);
    let blockedUntil = 0, netUntil = 0, t = 0, pendingResult = false;
    const cells = [];
    function reset() { clear(frames); cells.length = 0; t = 0; blockedUntil = 0; netUntil = 0; pendingResult = false; spinner.style.animationPlayState = 'running'; uiLane.querySelectorAll('.wt-seg').forEach((x) => x.remove()); netLane.querySelectorAll('.wt-seg').forEach((x) => x.remove()); }
    function tick() {
      t++;
      const blocked = t <= blockedUntil;
      const c = h('div', { class: 'wt-f ' + (blocked ? 'drop' : 'ok') , title: blocked ? 'เฟรมถูกข้าม (jank)' : 'วาดทัน' });
      frames.appendChild(c); cells.push(c);
      while (frames.children.length > 48) frames.removeChild(frames.firstChild);
      spinner.style.animationPlayState = blocked ? 'paused' : 'running';
      uiLane.appendChild(h('div', { class: 'wt-seg ' + (blocked ? 'busy' : 'draw') }));
      netLane.appendChild(h('div', { class: 'wt-seg ' + (t <= netUntil ? 'net' : 'idle') }));
      [uiLane, netLane].forEach((l) => { const segs = l.querySelectorAll('.wt-seg'); if (segs.length > 48) segs[0].remove(); });
      if (pendingResult && t > netUntil) { pendingResult = false; status.innerHTML = md('✓ คำตอบมาถึง → กริ่งดัง → พนักงานกลับมารับจาน (setState) — **ระหว่างรอ จอวาดครบทุกเฟรม**'); }
      if (blocked && t === blockedUntil) status.innerHTML = md('✗ จบการรอแบบ synchronous — ระหว่างนั้น **ทุกเฟรมถูกข้าม** วงล้อหมุนค้าง ถ้านานหลายวินาที OS อาจเตือนว่าแอปไม่ตอบสนอง');
    }
    function start() { if (running) return; running = true; timer = setInterval(tick, 1000 / hz * 6); } // slowed ×6 to be visible
    function stop() { running = false; clearInterval(timer); }
    const syncB = btn('รอ API แบบ synchronous (ยืนรอหน้าเตา)', () => { blockedUntil = t + 14; status.innerHTML = md('พนักงานยืนรอหน้าเตา… **ร้านทั้งร้านหยุด**'); }, 'danger');
    const asyncB = btn('await http.get (ส่งเข้าครัวแล้วไปรับโต๊ะอื่น)', () => { netUntil = t + 14; pendingResult = true; status.innerHTML = md('ส่งงานให้ OS/เครือข่ายทำ — UI isolate ว่าง วาดเฟรมต่อได้'); }, 'primary');
    const hzSeg = seg([60, 90, 120].map((x) => ({ value: x, label: x + ' Hz' })), hz, (v) => { hz = v; budget.textContent = `งบต่อเฟรม ≈ ${BUDGET[v]} ms`; stop(); reset(); start(); });
    const budget = h('span', { class: 'pill' }, `งบต่อเฟรม ≈ ${BUDGET[hz]} ms`);
    body.append(h('div', { class: 'vctrl' }, hzSeg, budget, h('span', { class: 'dim', style: { fontSize: '.78rem' } }, '(ชะลอเวลาลงให้มองเห็น)')),
      h('div', { class: 'btn-row', style: { marginBottom: '10px' } }, syncB, asyncB),
      h('div', { class: 'vrow' }, h('div', { class: 'wt-ph' }, spinner, h('div', { class: 'dim', style: { fontSize: '.72rem' } }, 'วงล้อบนจอ')), h('div', { class: 'grow vcol' }, FR.Panel('เฟรมที่วาดได้ (เขียว) / ถูกข้าม (แดง)', frames), lanes, status)));
    reset(); start();
    return { destroy: stop };
  });

  // ───────── 12.2 / core: event loop step-through ─────────
  const EL_CODE = `void onRefreshPressed() async {
  print('A: เริ่ม');
  final response = await http.get(uri);
  print('C: ได้คำตอบ \${response.statusCode}');
}

// ระหว่างนั้น Flutter ยังวาดเฟรมต่อไป
void drawFrame() { print('B: วาดเฟรม'); }`;
  R('ch12.eventloop', (body) => {
    const cv = FR.CodeView.create({ src: EL_CODE, lang: 'dart', title: 'await หยุดเฉพาะฟังก์ชันนั้น' });
    const P = { stack: h('div', { class: 'el-box' }), micro: h('div', { class: 'el-box' }), event: h('div', { class: 'el-box' }), os: h('div', { class: 'el-box' }) };
    const con = FR.Console.create({ title: 'print', compact: true });
    const steps = [
      { title: 'ผู้ใช้แตะปุ่ม → event “tap” เข้าคิว', text: 'Event queue เก็บงานที่มาจากภายนอก (แตะจอ, เฟรม, I/O เสร็จ)', st: { event: ['tap'] }, line: null },
      { title: 'event loop หยิบ tap มารัน → `onRefreshPressed()` ขึ้น call stack', st: { stack: ['onRefreshPressed()'] }, line: "print('A: เริ่ม');", out: 'A: เริ่ม' },
      { title: '`http.get(uri)` ส่งงานเครือข่ายให้ OS ทำ แล้วคืน Future ทันที', text: 'ตัว I/O ไม่ได้ทำบน UI isolate', st: { stack: ['onRefreshPressed()', 'http.get()'], os: ['HTTP GET กำลังรอเซิร์ฟเวอร์…'] }, line: 'final response = await http.get(uri);' },
      { title: '`await` → **ฟังก์ชันหยุดชั่วคราว** และถูกยกออกจาก call stack', text: 'โปรแกรมทั้งโปรแกรม **ไม่ได้หยุด** — call stack ว่าง event loop ทำงานอื่นต่อได้', st: { stack: [], os: ['HTTP GET กำลังรอเซิร์ฟเวอร์…'] }, line: 'final response = await http.get(uri);' },
      { title: 'เฟรมถัดไปมาถึง → วาดจอได้ตามปกติ', st: { stack: ['drawFrame()'], event: [], os: ['HTTP GET กำลังรอเซิร์ฟเวอร์…'] }, line: "void drawFrame() { print('B: วาดเฟรม'); }", out: 'B: วาดเฟรม' },
      { title: 'อีกเฟรม… (UI ลื่นตลอดการรอ)', st: { stack: ['drawFrame()'], os: ['HTTP GET กำลังรอเซิร์ฟเวอร์…'] }, line: "void drawFrame() { print('B: วาดเฟรม'); }", out: 'B: วาดเฟรม' },
      { title: 'คำตอบมาถึง → event “response” เข้าคิว', st: { event: ['response 200'], os: [] }, line: null },
      { title: 'Future ของ http.get สำเร็จ → นัดให้ฟังก์ชันทำต่อ (microtask)', text: 'microtask queue ทำก่อน event queue เสมอ', st: { micro: ['resume onRefreshPressed()'] }, line: null },
      { title: 'ฟังก์ชันกลับมาทำต่อจากบรรทัดหลัง await', st: { stack: ['onRefreshPressed()'] }, line: "print('C: ได้คำตอบ", out: 'C: ได้คำตอบ 200' },
    ];
    function drawBox(k, items) { clear(P[k]); (items || []).forEach((x) => P[k].appendChild(h('div', { class: 'el-item' }, x))); if (!items || !items.length) P[k].appendChild(h('div', { class: 'el-empty' }, '(ว่าง)')); }
    const st = FR.Stepper.create({ steps, intro: 'กดขั้นต่อไปเพื่อดูว่า await ทำอะไรกับ call stack', draw: (_, s, i) => {
      ['stack', 'micro', 'event', 'os'].forEach((k) => drawBox(k, s ? s.st[k] : []));
      cv.active(s && s.line ? s.line : []);
      con.clear(); steps.slice(0, i + 1).forEach((x) => x.out && con.log(x.out));
    } });
    body.append(h('div', { class: 'vrow' }, h('div', { class: 'grow' }, cv.el), h('div', { class: 'grow' }, h('div', { class: 'el-grid' },
      FR.Panel('Call stack (UI isolate)', P.stack), FR.Panel('Microtask queue', P.micro), FR.Panel('Event queue', P.event), FR.Panel('นอก isolate: OS/เครือข่าย', P.os)), con.el)), st.el);
    return { destroy: () => st.destroy() };
  });

  // ───────── 12.2 fetch in build floods the server ─────────
  R('ch12.buildfetch', (body) => {
    let mode = 'build', builds = 0, reqs = 0;
    const bV = h('div', { class: 'vbig' }, '0'), rV = h('div', { class: 'vbig' }, '0');
    const meter = FR.Meter.create('ภาระเซิร์ฟเวอร์', { max: 100, kind: 'err' });
    meter.set(0, 100, '0');
    const fb = h('div', { class: 'vnote' });
    function build(n, why) {
      for (let i = 0; i < n; i++) { builds++; if (mode === 'build') reqs++; }
      bV.textContent = builds; rV.textContent = reqs; flash(bV); if (mode === 'build') flash(rV);
      meter.set(Math.min(reqs, 100), 100, String(reqs));
      fb.innerHTML = md(mode === 'build'
        ? `${why}: build ×${n} → **ยิงคำขอ ×${n}** · และ FutureBuilder ได้ Future ใหม่ทุกครั้ง → วงล้อหมุนไม่รู้จบ`
        : `${why}: build ×${n} → คำขอยังเป็น 1 (Future ถูกเก็บไว้ในตัวแปรของ State)`);
    }
    function reset() { builds = 1; reqs = 1; bV.textContent = 1; rV.textContent = 1; meter.set(1, 100, '1'); fb.textContent = 'เปิดหน้าจอ: build ครั้งแรก + คำขอแรก'; }
    const s = seg([{ value: 'build', label: 'fetchHeadline() ใน build' }, { value: 'init', label: 'เก็บ Future ใน initState (ถูก)' }], mode, (v) => { mode = v; reset(); });
    body.append(h('div', { class: 'vctrl' }, s), h('div', { class: 'btn-row', style: { marginBottom: '10px' } },
      btn('แอนิเมชันเล่น 1 วินาที', () => build(60, 'แอนิเมชัน 60 fps'), 'sm'), btn('คีย์บอร์ดเด้ง', () => build(12, 'คีย์บอร์ดเลื่อนขึ้น'), 'sm'), btn('วิดเจ็ตแม่ setState', () => build(1, 'parent rebuild'), 'sm'), btn('ผู้ใช้เลื่อนลิสต์', () => build(30, 'เลื่อนจอ'), 'sm')),
      h('div', { class: 'vrow' }, FR.Panel('build() ถูกเรียก', bV), FR.Panel('คำขอที่ยิงไปเซิร์ฟเวอร์', rV), h('div', { class: 'grow' }, meter.el, fb)));
    reset();
    return { setMode(m) { s.set(m); mode = m; reset(); } };
  });

  // ───────── 12.2 mounted & context across await ─────────
  R('ch12.mounted', (body) => {
    let mode = 'none';
    const con = FR.Console.create({ title: 'Debug Console', compact: true });
    const ph = FR.Phone.create({ small: true, height: 330 });
    const CODES = {
      none: "await saveToServer(); // 3 วินาที\nsetState(() => _saved = true);\nScaffoldMessenger.of(context).showSnackBar(...);",
      capture: "final messenger = ScaffoldMessenger.of(context); // ดึงก่อน await\nawait saveToServer();\nmessenger.showSnackBar(const SnackBar(content: Text('บันทึกแล้ว')));",
      mounted: "await saveToServer();\nif (!mounted) return; // หน้าจอถูกปิดไปแล้ว ไม่ต้องทำอะไรต่อ\nScaffoldMessenger.of(context).showSnackBar(...);",
    };
    const codeBox = h('div');
    function drawCode() { clear(codeBox); codeBox.appendChild(FR.CodeView.create({ src: CODES[mode], lang: 'dart', title: 'หลังกดบันทึก' }).el); }
    let alive = true;
    const nav = FR.MiniNav(ph, { screens: {
      Home: (r, n) => ({ title: 'รายการ', body: FR.ui.center(FR.ui.text('ListScreen'), FR.ui.btn('เปิดหน้าแก้ไข', () => { alive = true; n.push('Edit'); })) }),
      Edit: (r, n) => ({ title: 'แก้ไข', body: FR.ui.center(FR.ui.btn('บันทึก (ใช้เวลา 3 วิ)', async () => {
        con.sep('กดบันทึก'); con.log('await saveToServer() …');
        const p = sleep(3000);
        await p;
        if (!alive) {
          if (mode === 'none') { con.log('setState() called after dispose(): _EditScreenState#4f2a1(lifecycle state: defunct, not mounted)', 'err'); con.log("Looking up a deactivated widget's ancestor is unsafe.", 'err'); }
          else if (mode === 'capture') { con.log('messenger.showSnackBar(...) ✓ ใช้ messenger ที่ดึงไว้ก่อน ไม่แตะ context ของหน้าที่ปิดแล้ว', 'ok'); ph.snack('บันทึกแล้ว'); }
          else con.log('mounted == false → return  ✓ ไม่แตะ context', 'ok');
          return;
        }
        con.log('บันทึกเสร็จ (ผู้ใช้ยังอยู่ในหน้านี้) ✓', 'ok'); ph.snack('บันทึกแล้ว');
      })) }),
    }, onDispose: (r) => { if (r.name === 'Edit') { alive = false; con.log('ผู้ใช้กดย้อนกลับ → หน้าแก้ไขถูก dispose (เพื่อนวางสายแล้ว)', 'warn'); } } });
    const s = seg([{ value: 'none', label: 'ไม่ป้องกัน' }, { value: 'capture', label: 'ดึง messenger ก่อน await' }, { value: 'mounted', label: 'if (!mounted) return;' }], mode, (v) => { mode = v; drawCode(); });
    body.append(h('div', { class: 'vctrl' }, s), h('div', { class: 'vnote' }, 'ลอง: เปิดหน้าแก้ไข → กดบันทึก → กด ← ภายใน 3 วินาที'),
      h('div', { class: 'vrow', style: { marginTop: '8px' } }, ph.el, h('div', { class: 'grow vcol' }, codeBox, con.el)));
    drawCode(); nav.reset(['Home']);
  });

  // ───────── 12.3 AsyncSnapshot inspector + two builder orders ─────────
  R('ch12.snapshot', (body) => {
    let snap = { cs: 'none', data: null, error: null }, futureN = 0, initialData = false, nextData = 1;
    const fields = h('div', { class: 'vkv' });
    const phA = FR.Phone.create({ title: 'waiting ก่อน (12.3)', small: true, height: 250 });
    const phB = FR.Phone.create({ title: 'error → !hasData → data (12.6)', small: true, height: 250 });
    const con = FR.Console.create({ title: 'builder ถูกเรียกด้วย', compact: true });
    function list(n) { return FR.ui.col(...Array.from({ length: 3 }, (_, i) => FR.ui.listTile({ leading: String(i + 1), title: `รายการ ${i + 1} (ชุดที่ ${n})` }))); }
    function render() {
      const hasData = snap.data != null, hasError = snap.error != null;
      clear(fields);
      [['connectionState', 'ConnectionState.' + snap.cs], ['hasData', String(hasData)], ['data', hasData ? `ชุดที่ ${snap.data}` : 'null'], ['hasError', String(hasError)], ['error', hasError ? `'${snap.error}'` : 'null']].forEach(([k, v]) => fields.append(h('span', { class: 'k' }, k), h('span', { class: 'v' }, v)));
      // A: waiting-first
      let a;
      if (snap.cs === 'waiting') a = FR.ui.center(FR.ui.spinner(), FR.ui.text('กำลังโหลด…', 'dim'));
      else if (hasError) a = FR.ui.center(FR.ui.text('เกิดข้อผิดพลาด: ' + snap.error));
      else if (hasData) a = list(snap.data);
      else a = FR.ui.center(FR.ui.text('ยังไม่มีข้อมูล', 'dim'));
      phA.setBody(a);
      // B: error-first
      let b;
      if (hasError) b = FR.ui.center(FR.ui.text(snap.error), FR.ui.btn('ลองใหม่', () => reload(), 'tonal'));
      else if (!hasData) b = FR.ui.center(FR.ui.spinner());
      else b = h('div', null, snap.cs === 'waiting' ? FR.ui.linear() : null, list(snap.data));
      phB.setBody(b);
      con.log(`AsyncSnapshot(${snap.cs}, hasData: ${hasData}, hasError: ${hasError})`);
    }
    function start() { futureN++; snap = { cs: 'waiting', data: initialData ? 0 : null, error: null }; con.sep(`future = Future #${futureN}`); render(); }
    function reload() { futureN++; snap = { cs: 'waiting', data: snap.data, error: snap.error }; con.sep(`setState: future = Future #${futureN} (ตัวใหม่)`); render(); }
    function complete() { if (snap.cs !== 'waiting') return; snap = { cs: 'done', data: nextData++, error: null }; render(); }
    function fail() { if (snap.cs !== 'waiting') return; snap = { cs: 'done', data: null, error: 'เชื่อมต่ออินเทอร์เน็ตไม่ได้' }; render(); }
    function setNull() { snap = { cs: 'none', data: snap.data, error: snap.error }; con.sep('future = null'); render(); }
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, btn('① เริ่ม (initState)', start, 'primary sm'), btn('② สำเร็จ', complete, 'ok sm'), btn('② ล้มเหลว', fail, 'danger sm'), btn('③ โหลดใหม่ (Future ใหม่)', reload, 'sm'), btn('future = null', setNull, 'sm ghost'), toggle('initialData (ข้อมูลแคช)', initialData, (v) => (initialData = v))),
      h('div', { class: 'vrow' }, h('div', { style: { flex: '0 1 250px' } }, FR.Panel('snapshot', fields), con.el), phA.el, phB.el));
    render();
  });

  // ───────── 12.4 Future.delayed playground ─────────
  R('ch12.delay', (body) => {
    let secs = 3, willThrow = false, n = 0;
    const ph = FR.Phone.create({ title: 'FutureBuilder Demo', small: true, height: 260 });
    const label = h('span', { class: 'mono' }, '3 วินาที');
    async function run() {
      const my = ++n;
      ph.setBody(FR.ui.center(FR.ui.spinner(), FR.ui.text('กำลังโหลดข้อมูล...', 'dim')));
      await sleep(secs * 1000);
      if (my !== n) return;
      if (willThrow) ph.setBody(FR.ui.center(h('div', { class: 'u-text', style: { color: 'var(--err)' } }, 'เกิดข้อผิดพลาด: Exception: เกิดข้อผิดพลาดโดยตั้งใจ')));
      else ph.setBody(FR.ui.center(h('div', { class: 'u-text', style: { color: 'var(--ok)' } }, 'สำเร็จ! ได้รับข้อมูล: ข้อมูลจากการทำงานที่ใช้เวลานาน')));
    }
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, h('span', { class: 'dim' }, 'Duration(seconds:'), FR.ui.slider(3, (v) => { secs = v; label.textContent = v + ' วินาที'; }, { min: 1, max: 6 }), label, toggle('throw Exception(...)', willThrow, (v) => (willThrow = v)), btn('Hot Restart (initState ใหม่)', run, 'primary sm')),
      h('div', { class: 'vrow' }, ph.el, h('div', { class: 'grow vnote', html: md('ควบคุมได้ทั้ง **เวลา** และ **ผลลัพธ์** → ทดสอบ UI ครบ 3 สถานะก่อนต่อเครือข่ายจริง ถ้าต่อจริงไปพร้อมกันแล้วจอว่าง จะแยกไม่ออกว่าผิดที่เครือข่าย ข้อมูล หรือโค้ด UI') })));
    run();
  });

  // ───────── 12.5 JSON → jsonDecode → Map → fromJson ─────────
  R('ch12.json', (body) => {
    const ta = h('textarea', { class: 'sql-editor', style: { minHeight: '130px' }, spellcheck: 'false' });
    ta.value = '{\n  "userId": 1,\n  "id": 1,\n  "title": "delectus aut autem",\n  "completed": false\n}';
    let access = 'model';
    const s1 = h('div', { class: 'jp-stage' }), s2 = h('div', { class: 'jp-stage' }), s3 = h('div', { class: 'jp-stage' }), s4 = h('div', { class: 'jp-stage' });
    function dartType(v) { return v === null ? 'Null' : typeof v === 'number' ? (Number.isInteger(v) ? 'int' : 'double') : typeof v === 'boolean' ? 'bool' : typeof v === 'string' ? 'String' : Array.isArray(v) ? 'List<dynamic>' : 'Map<String, dynamic>'; }
    function run() {
      [s2, s3, s4].forEach(clear);
      s1.className = 'jp-stage ok';
      let obj;
      try { obj = JSON.parse(ta.value); }
      catch (e) { s2.className = 'jp-stage bad'; s2.append(h('div', { class: 'jp-h' }, 'jsonDecode(response.body)'), h('div', { class: 'mono jp-err' }, 'FormatException: ' + e.message.replace(/^JSON.parse: /, ''))); s3.className = s4.className = 'jp-stage skip'; return; }
      s2.className = 'jp-stage ok';
      s2.append(h('div', { class: 'jp-h' }, 'jsonDecode → ' + dartType(obj)), h('div', { class: 'vkv' }, Object.entries(obj || {}).flatMap(([k, v]) => [h('span', { class: 'k' }, `'${k}'`), h('span', { class: 'v' }, `${JSON.stringify(v)}  `, h('span', { class: 'dim' }, dartType(v)))])));
      if (access === 'raw') {
        s3.className = 'jp-stage skip'; s3.append(h('div', { class: 'jp-h' }, '(ข้ามขั้น fromJson — ใช้ Map ดิบใน UI)'));
        const v = obj && obj['titel'];
        s4.className = 'jp-stage bad';
        s4.append(h('div', { class: 'jp-h' }, "UI: Text(json['titel'] as String)  ← พิมพ์ผิด 1 ตัว"), h('div', { class: 'mono jp-err' }, `ตอนรัน: type 'Null' is not a subtype of type 'String' in type cast`), h('div', { class: 'dim', style: { fontSize: '.78rem' } }, 'analyzer ไม่เตือนเลย เพราะคีย์เป็นแค่สตริง — พังตอนผู้ใช้เปิดหน้าจอ'));
        return;
      }
      const spec = [['userId', 'int'], ['id', 'int'], ['title', 'String'], ['completed', 'bool']];
      const errs = [];
      for (const [k, t] of spec) { const v = obj[k]; if (dartType(v) !== t) { errs.push(`json['${k}'] as ${t}: type '${dartType(v)}' is not a subtype of type '${t}' in type cast`); break; } }
      if (errs.length) { s3.className = 'jp-stage bad'; s3.append(h('div', { class: 'jp-h' }, 'Todo.fromJson(map)'), h('div', { class: 'mono jp-err' }, 'TypeError: ' + errs[0])); s4.className = 'jp-stage skip'; return; }
      s3.className = 'jp-stage ok'; s3.append(h('div', { class: 'jp-h' }, 'Todo.fromJson(map) — ล่ามแปล'), h('div', { class: 'vkv' }, spec.flatMap(([k, t]) => [h('span', { class: 'k' }, `final ${t} ${k}`), h('span', { class: 'v' }, JSON.stringify(obj[k]))])));
      s4.className = 'jp-stage ok'; s4.append(h('div', { class: 'jp-h' }, 'UI: Text(todo.title)'), h('div', null, FR.ui.listTile({ leading: String(obj.id), title: obj.title, trailing: obj.completed ? '☑' : '☐' })), h('div', { class: 'dim', style: { fontSize: '.76rem' } }, 'ถ้าพิมพ์ todo.titel → compile error ทันที: “The getter \'titel\' isn\'t defined for the type \'Todo\'”'));
    }
    ta.addEventListener('input', run);
    const presets = h('div', { class: 'btn-row' }, h('span', { class: 'dim', style: { fontSize: '.8rem' } }, 'ลองแก้ JSON:'),
      btn('ปกติ', () => { ta.value = '{\n  "userId": 1,\n  "id": 1,\n  "title": "delectus aut autem",\n  "completed": false\n}'; run(); }, 'sm ghost'),
      btn('ขาดฟิลด์ completed', () => { ta.value = '{\n  "userId": 1,\n  "id": 1,\n  "title": "delectus aut autem"\n}'; run(); }, 'sm ghost'),
      btn('id เป็นข้อความ', () => { ta.value = '{\n  "userId": 1,\n  "id": "1",\n  "title": "delectus aut autem",\n  "completed": false\n}'; run(); }, 'sm ghost'),
      btn('ได้หน้า HTML (captive portal)', () => { ta.value = '<html><body>กรุณาเข้าสู่ระบบ Wi-Fi</body></html>'; run(); }, 'sm ghost'));
    const s = seg([{ value: 'model', label: 'ผ่าน Model (fromJson)' }, { value: 'raw', label: 'ใช้ Map ดิบใน UI' }], access, (v) => { access = v; run(); });
    s1.append(h('div', { class: 'jp-h' }, 'response.body (String)'), ta);
    body.append(h('div', { class: 'vctrl' }, s), presets, h('div', { class: 'jp-flow' }, s1, h('div', { class: 'jp-ar' }, '→'), s2, h('div', { class: 'jp-ar' }, '→'), s3, h('div', { class: 'jp-ar' }, '→'), s4));
    run();
  });

  // ───────── 12.6 failures → ApiException ─────────
  const ROBUST = `Future<List<Todo>> fetchTodos() async {
  final uri = Uri.parse('https://jsonplaceholder.typicode.com/todos');
  try {
    final response = await http
        .get(uri, headers: {'Accept': 'application/json'})
        .timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as List<dynamic>;
      return data
          .map((item) => Todo.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    if (response.statusCode >= 500) {
      throw const ApiException('เซิร์ฟเวอร์ขัดข้องชั่วคราว โปรดลองอีกครั้ง');
    }
    throw ApiException(
      'ไม่พบข้อมูลที่ร้องขอ (รหัส \${response.statusCode})',
      canRetry: false,
    );
  } on TimeoutException {
    throw const ApiException('เซิร์ฟเวอร์ตอบกลับช้าเกินไป โปรดลองอีกครั้ง');
  } on FormatException {
    throw const ApiException('รูปแบบข้อมูลที่ได้รับไม่ถูกต้อง', canRetry: false);
  } on ApiException {
    rethrow;
  } catch (_) {
    throw const ApiException('เชื่อมต่ออินเทอร์เน็ตไม่ได้ โปรดตรวจสอบการเชื่อมต่อ');
  }
}`;
  R('ch12.fail', (body) => {
    const SC = {
      ok: { label: '✓ ปกติ', raw: '200 OK + JSON', path: ['.timeout(', 'if (response.statusCode == 200)', '.toList();'], res: null },
      offline: { label: '✈ ไม่มีสัญญาณ', raw: 'SocketException: Failed host lookup', path: ['.timeout(', 'catch (_) {', "throw const ApiException('เชื่อมต่อ"], res: ['เชื่อมต่ออินเทอร์เน็ตไม่ได้ โปรดตรวจสอบการเชื่อมต่อ', true] },
      slow: { label: '🐢 ช้า 15 วิ', raw: 'TimeoutException after 0:00:10', path: ['.timeout(', 'on TimeoutException {', "throw const ApiException('เซิร์ฟเวอร์ตอบกลับช้า"], res: ['เซิร์ฟเวอร์ตอบกลับช้าเกินไป โปรดลองอีกครั้ง', true] },
      e404: { label: '404', raw: 'statusCode = 404', path: ['.timeout(', 'if (response.statusCode >= 500)', 'throw ApiException(', 'on ApiException {', 'rethrow;'], res: ['ไม่พบข้อมูลที่ร้องขอ (รหัส 404)', false] },
      e503: { label: '503', raw: 'statusCode = 503', path: ['.timeout(', 'if (response.statusCode >= 500)', "throw const ApiException('เซิร์ฟเวอร์ขัดข้อง", 'on ApiException {', 'rethrow;'], res: ['เซิร์ฟเวอร์ขัดข้องชั่วคราว โปรดลองอีกครั้ง', true] },
      html: { label: '🌐 ได้หน้า HTML', raw: "200 OK แต่ body = '<html>…'", path: ['.timeout(', 'if (response.statusCode == 200)', 'final data = jsonDecode', 'on FormatException {', "throw const ApiException('รูปแบบข้อมูล"], res: ['รูปแบบข้อมูลที่ได้รับไม่ถูกต้อง', false] },
      missing: { label: '⚠ JSON ขาดฟิลด์', raw: "200 OK แต่ไม่มี 'title'", path: ['.timeout(', 'if (response.statusCode == 200)', '.map((item) => Todo.fromJson', 'catch (_) {', "throw const ApiException('เชื่อมต่อ"], res: ['เชื่อมต่ออินเทอร์เน็ตไม่ได้ โปรดตรวจสอบการเชื่อมต่อ', true], bug: true },
    };
    let sc = 'offline', skeleton = true, fut = 0;
    const cv = FR.CodeView.create({ src: ROBUST, lang: 'dart', title: 'lib/services/api_service.dart (12.6)', maxHeight: '380px' });
    const ph = FR.Phone.create({ title: 'Todo List from API', small: true, height: 330 });
    const out = h('div', { class: 'vkv' });
    const note = h('div');
    async function run() {
      fut++;
      clear(out); clear(note);
      ph.setBody(skeleton ? FR.ui.skeleton(5) : FR.ui.center(FR.ui.spinner()));
      out.append(h('span', { class: 'k' }, 'Future'), h('span', { class: 'v' }, '#' + fut + (fut > 1 ? ' (ตัวใหม่จากการลองใหม่)' : '')));
      const s = SC[sc];
      for (const line of s.path) { cv.active(line); await sleep(450); }
      out.append(h('span', { class: 'k' }, 'สิ่งที่เกิดจริง'), h('span', { class: 'v' }, s.raw));
      if (!s.res) {
        out.append(h('span', { class: 'k' }, 'ผล'), h('span', { class: 'v' }, 'List<Todo> 200 รายการ'));
        ph.setBody(FR.ui.col(...Array.from({ length: 5 }, (_, i) => FR.ui.listTile({ leading: String(i + 1), title: ['delectus aut autem', 'quis ut nam facilis', 'fugiat veniam minus', 'et porro tempora', 'laboriosam mollitia'][i] }))));
        return;
      }
      const [msg, canRetry] = s.res;
      out.append(h('span', { class: 'k' }, 'ApiException.message'), h('span', { class: 'v' }, `'${msg}'`), h('span', { class: 'k' }, 'canRetry'), h('span', { class: 'v' }, String(canRetry)));
      ph.setBody(FR.ui.center(FR.ui.text(msg), canRetry ? FR.ui.btn('ลองใหม่', () => run(), 'tonal') : FR.ui.text('(ไม่แสดงปุ่มลองใหม่ — ลองซ้ำก็ได้ผลเดิม)', 'dim')));
      if (s.bug) note.appendChild(h('div', { class: 'callout real' }, h('div', { class: 'hd' }, 'ⓘ จับผิดโค้ดในตำรา'), h('div', { class: 'bd', html: md('ตำราบอกว่า JSON ขาดฟิลด์จะเป็น **TypeError** แต่โค้ดไม่มี `on TypeError` → ตกไปที่ `catch (_)` แล้วแสดงว่า “**เชื่อมต่ออินเทอร์เน็ตไม่ได้**” พร้อมปุ่มลองใหม่ ทั้งที่เน็ตปกติและลองกี่ครั้งก็ได้ผลเดิม — ควรเพิ่ม `on TypeError { throw const ApiException(\'รูปแบบข้อมูลที่ได้รับไม่ถูกต้อง\', canRetry: false); }`') })));
    }
    const s1 = seg(Object.keys(SC).map((k) => ({ value: k, label: SC[k].label })), sc, (v) => { sc = v; fut = 0; run(); });
    body.append(h('div', { class: 'vctrl' }, h('span', { class: 'lbl' }, 'สถานการณ์:'), s1), h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, toggle('ใช้ skeleton แทนวงล้อ', skeleton, (v) => (skeleton = v)), btn('▶ ยิงคำขอ', () => { fut = 0; run(); }, 'primary sm')),
      h('div', { class: 'vrow' }, ph.el, h('div', { class: 'grow vcol' }, cv.el, FR.Panel('ผลลัพธ์ที่หน้าจอได้รับ', out), note)));
    run();
  });

  // ───────── 12.7 compute / isolate ─────────
  R('ch12.isolate', (body) => {
    let items = 5000, useCompute = false;
    const PER_ITEM = 0.02, SPAWN = 6; // ms (simulated)
    const ui = h('div', { class: 'iso-lane' }), wk = h('div', { class: 'iso-lane' });
    const info = h('div', { class: 'vnote' });
    const lbl = h('span', { class: 'mono' });
    function draw() {
      clear(ui); clear(wk);
      const parse = items * PER_ITEM;
      lbl.textContent = items.toLocaleString() + ' รายการ';
      const frames = 30;
      const parseFrames = Math.ceil(parse / 16);
      const at = 8;
      for (let i = 0; i < frames; i++) {
        let cls = 'ok';
        if (!useCompute && i >= at && i < at + parseFrames) cls = 'drop';
        if (useCompute && i === at && SPAWN > 0) cls = 'ok';
        ui.appendChild(h('div', { class: 'iso-f ' + cls }));
        let w = 'idle';
        if (useCompute && i >= at && i < at + Math.ceil((parse + SPAWN) / 16)) w = 'busy';
        wk.appendChild(h('div', { class: 'iso-f ' + w }));
      }
      const jank = !useCompute && parse > 16;
      info.innerHTML = md(useCompute
        ? `ใช้ \`compute(_parseTodos, response.body)\` → แปลงใน isolate อื่น ~${parse.toFixed(0)} ms + ค่าสร้าง isolate ~${SPAWN} ms · UI isolate **วาดทุกเฟรมได้** ${parse < SPAWN ? '— แต่ข้อมูลน้อยขนาดนี้ **ค่า spawn แพงกว่างานเอง** ไม่คุ้ม' : ''}`
        : `\`jsonDecode\` + \`fromJson\` บน UI isolate ~${parse.toFixed(1)} ms ${jank ? `→ **เกินงบ 16 ms** เฟรมถูกข้าม ~${parseFrames} เฟรม (กระตุกตอน “โหลดเสร็จ”)` : '→ ยังอยู่ในงบ ไม่ต้องย้าย'}`) + ' _(ตัวเลขจำลอง)_';
    }
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, h('span', { class: 'dim', style: { fontSize: '.82rem' } }, 'ขนาดข้อมูล'), FR.ui.slider(5000, (v) => { items = v; draw(); }, { min: 100, max: 20000, step: 100 }), lbl, toggle('ใช้ compute', useCompute, (v) => { useCompute = v; draw(); })),
      h('div', { class: 'iso-wrap' }, h('div', { class: 'iso-l' }, 'UI isolate (วาดจอ)'), ui, h('div', { class: 'iso-l' }, 'isolate ใหม่ (compute)'), wk), info);
    draw();
  });

  // ───────── 12.8 FutureBuilder per screen vs one provider ─────────
  R('ch12.provider', (body) => {
    let mode = 'fb', serverVer = 1, reqs = 0;
    const screens = [['หน้าแรก', 'badge จำนวนในตะกร้า'], ['ค้นหา', 'รายการในตะกร้า'], ['ชำระเงิน', 'ยอดรวม']];
    const box = h('div', { class: 'pv-screens' });
    const reqV = h('span', { class: 'v' }, '0');
    const note = h('div', { class: 'vnote' });
    let provVer = null;
    function open(i) {
      let ver;
      if (mode === 'fb') { reqs++; ver = serverVer; }
      else { if (provVer == null) { reqs++; provVer = serverVer; } ver = provVer; }
      reqV.textContent = reqs;
      const c = box.children[i];
      c.querySelector('.pv-v').textContent = `ข้อมูลรุ่น v${ver}`;
      c.classList.add('open'); flash(c);
      const vers = [...box.querySelectorAll('.pv-v')].map((x) => x.textContent).filter((x) => x !== '—');
      const same = new Set(vers).size <= 1;
      note.innerHTML = md(same ? 'ทุกหน้าที่เปิดเห็นข้อมูลรุ่นเดียวกัน ✓' : '⚠ **หน้าจอแสดงข้อมูลคนละรุ่น** — ตะกร้าที่หน้าแรกกับหน้าชำระเงินไม่ตรงกัน');
    }
    function draw() {
      clear(box); reqs = 0; reqV.textContent = 0; provVer = null; serverVer = 1; clear(note);
      screens.forEach(([n, d], i) => box.appendChild(h('div', { class: 'pv-s' }, h('div', { class: 'pv-n' }, n), h('div', { class: 'dim', style: { fontSize: '.74rem' } }, d), h('div', { class: 'pv-v mono' }, '—'), btn(mode === 'fb' ? 'เปิด (FutureBuilder ยิงเอง)' : 'เปิด (Consumer อ่านจาก provider)', () => open(i), 'sm'))));
    }
    const s = seg([{ value: 'fb', label: 'FutureBuilder ในแต่ละหน้า' }, { value: 'prov', label: 'TodoProvider ตัวเดียว' }], mode, (v) => { mode = v; draw(); });
    body.append(h('div', { class: 'vctrl' }, s, btn('ข้อมูลบนเซิร์ฟเวอร์เปลี่ยน (v+1)', () => { serverVer++; note.innerHTML = md(`เซิร์ฟเวอร์มีข้อมูลรุ่น v${serverVer} แล้ว`); }, 'sm')), box,
      h('div', { class: 'vkv', style: { marginTop: '8px' } }, h('span', { class: 'k' }, 'คำขอที่ยิงทั้งหมด'), reqV), note);
    draw();
    return { setMode(m) { s.set(m); mode = m; draw(); } };
  });

  // ───────── 12.8 states of TodoProvider + addPostFrameCallback ─────────
  R('ch12.states', (body) => {
    const st = { isLoading: false, hasTodos: false, error: false };
    const ph = FR.Phone.create({ title: 'Todo List with Provider', small: true, height: 300 });
    const which = h('div', { class: 'vnote' });
    function render() {
      let view, branch;
      if (st.isLoading && !st.hasTodos) { view = FR.ui.center(FR.ui.spinner()); branch = '`isLoading && todos.isEmpty` → วงล้อ (โหลดครั้งแรก)'; }
      else if (st.error && !st.hasTodos) { view = FR.ui.center(FR.ui.text('เชื่อมต่ออินเทอร์เน็ตไม่ได้'), FR.ui.btn('ลองใหม่', () => {}, 'tonal')); branch = '`errorMessage != null && todos.isEmpty` → ข้อความ + ลองใหม่'; }
      else {
        view = h('div', null, st.hasTodos ? FR.ui.col(...[1, 2, 3].map((i) => FR.ui.listTile({ title: 'งานที่ ' + i }))) : h('div', { class: 'u-pad' }));
        branch = 'ตกไปที่ `ListView.builder`';
        if (!st.hasTodos) branch += ' — ⚠ **ลิสต์ว่างเปล่าโดยไม่มีข้อความ** (สำเร็จแต่ไม่มีรายการ ควรบอกผู้ใช้)';
        if (st.hasTodos && st.error) branch += ' — ⚠ **error ถูกเก็บไว้แต่ไม่แสดง** ผู้ใช้ไม่รู้ว่ารีเฟรชล้มเหลว';
        if (st.hasTodos && st.isLoading) branch += ' — ข้อมูลเดิมค้างอยู่ระหว่างรีเฟรช ✓ (แต่ไม่มีตัวบอกว่ากำลังรีเฟรช)';
      }
      ph.setBody(view);
      which.innerHTML = md('Consumer เลือกสาขา: ' + branch);
    }
    const t1 = toggle('isLoading', st.isLoading, (v) => { st.isLoading = v; render(); });
    const t2 = toggle('todos ไม่ว่าง', st.hasTodos, (v) => { st.hasTodos = v; render(); });
    const t3 = toggle('errorMessage != null', st.error, (v) => { st.error = v; render(); });
    // addPostFrameCallback
    const con = FR.Console.create({ title: 'initState ของหน้าจอ', compact: true });
    function direct() { con.clear(); con.log('initState(): context.read<TodoProvider>().loadTodos();'); con.log('loadTodos(): _isLoading = true; notifyListeners();  ← ขณะเฟรมแรกยัง build อยู่', 'warn'); con.log('FlutterError: setState() or markNeedsBuild() called during build.', 'err'); }
    function post() { con.clear(); con.log('initState(): WidgetsBinding.instance.addPostFrameCallback((_) { … })'); con.log('… เฟรมแรกวาดเสร็จ', 'dim'); con.log('if (!mounted) return;  ✓'); con.log('context.read<TodoProvider>().loadTodos();  → notifyListeners() ปลอดภัย', 'ok'); }
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, t1, t2, t3), h('div', { class: 'vrow' }, ph.el, h('div', { class: 'grow vcol' }, which,
      FR.Panel('เริ่มโหลดตอนเปิดหน้าจอ', h('div', { class: 'btn-row', style: { marginBottom: '6px' } }, btn('เรียกตรงใน initState', direct, 'danger sm'), btn('ผ่าน addPostFrameCallback', post, 'ok sm')), con.el))));
    render();
  });

  // ───────── 12.10 elevator ─────────
  R('ch12.elevator', (body) => {
    let mode = 'now';
    const tl = h('div', { class: 'elv' });
    const ph = FR.Phone.create({ title: 'รายการของฉัน', small: true, height: 300 });
    function draw(scene) {
      if (scene === 'home') ph.setBody(FR.ui.col(...[1, 2, 3, 4].map((i) => FR.ui.listTile({ title: 'งานที่ ' + i, subtitle: 'โหลดเมื่อ 08:12' }))));
      else if (mode === 'now') { ph.setBody(FR.ui.center(FR.ui.spinner())); setTimeout(() => ph.setBody(FR.ui.center(FR.ui.text('เชื่อมต่ออินเทอร์เน็ตไม่ได้'), FR.ui.btn('ลองใหม่', () => {}, 'tonal'))), 900); }
      else ph.setBody(h('div', null, h('div', { class: 'elv-banner' }, 'ออฟไลน์ · แสดงข้อมูลเมื่อ 08:12'), FR.ui.linear(), FR.ui.col(...[1, 2, 3, 4].map((i) => FR.ui.listTile({ title: 'งานที่ ' + i, subtitle: 'โหลดเมื่อ 08:12' })))));
    }
    tl.append(btn('🏠 08:12 ที่บ้าน (สัญญาณดี)', () => draw('home'), 'sm'), h('span', { class: 'dim' }, '→'), btn('🛗 11:30 ในลิฟต์ (ไม่มีสัญญาณ)', () => draw('lift'), 'sm primary'));
    const s = seg([{ value: 'now', label: 'แอปตอนจบบทที่ 12 (ข้อมูลในหน่วยความจำ)' }, { value: 'want', label: 'สิ่งที่อยากได้ (บทที่ 13)' }], mode, (v) => { mode = v; draw('lift'); });
    body.append(h('div', { class: 'vctrl' }, s), tl, h('div', { class: 'vrow', style: { marginTop: '10px' } }, ph.el, h('div', { class: 'grow vnote', html: md('สถานะที่ 4 ที่คำถามท้ายบทถึง: **มีข้อมูลเก่าอยู่ + กำลังรีเฟรช/ออฟไลน์** — ต้องเก็บข้อมูลไว้ **ในเครื่อง** และบอกผู้ใช้ว่าเป็นข้อมูลเมื่อไร → [[13.10]]') })));
    draw('home');
  });
})();
