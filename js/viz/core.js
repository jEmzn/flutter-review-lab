/* Core (แกนกลาง) visualizations — Widget/Element/State, BuildContext lookup, InheritedWidget dependents, rebuild vs repaint.
   Rules are taken from the Flutter framework source (Widget.canUpdate, Element.updateChild, dependOnInheritedWidgetOfExactType). */
(function () {
  'use strict';
  const { h, clear, btn, seg, toggle, flash } = FR.util;
  const md = (s) => FR.markup.inline(s);
  const R = FR.viz.register;

  // ───────────────────────── c1: reconciliation (canUpdate) ─────────────────────────
  R('core.recon', (body) => {
    let wid = 0, eid = 0, sid = 0, keys = false, order = ['A', 'B'], wrapA = false;
    let elements = [];
    const con = FR.Console.create({ title: 'สิ่งที่ framework ตัดสิน', compact: true });
    const grid = h('div', { class: 'rc-grid' });
    const newState = (label) => ({ sid: ++sid, count: 0, born: label });
    function widgetsFor() {
      return order.map((label) => {
        const counter = { type: 'Counter', label, key: keys ? label : null, wid: ++wid };
        if (label === 'A' && wrapA) return { type: 'Padding', key: null, wid: ++wid, child: counter };
        return counter;
      });
    }
    const wName = (w) => `${w.type}${w.type === 'Counter' ? `('${w.label}')` : ''}#w${w.wid}${w.key ? ` key: ValueKey('${w.key}')` : ''}`;
    function mountEl(w) {
      const e = { eid: ++eid, type: w.type, key: w.key, widget: w };
      if (w.type === 'Counter') { e.state = newState(w.label); con.log(`  สร้าง Element #e${e.eid} → createState() → State #s${e.state.sid} (count = 0)`, 'sys'); }
      if (w.child) { con.log(`  สร้าง Element #e${e.eid} (Padding)`, 'sys'); e.child = mountEl(w.child); }
      return e;
    }
    function updateEl(e, w) {
      e.widget = w;
      if (e.child && w.child) {
        const ok = e.child.type === w.child.type && e.child.key === w.child.key;
        if (ok) { e.child.widget = w.child; } else { disposeEl(e.child); e.child = mountEl(w.child); }
      }
    }
    function disposeEl(e) {
      if (e.state) con.log(`  dispose() State #s${e.state.sid} — count ${e.state.count} หายไปด้วย`, 'err');
      if (e.child) disposeEl(e.child);
    }
    function reconcile(ws) {
      const old = elements, used = new Set(), next = [];
      ws.forEach((w, i) => {
        let j = -1;
        if (w.key != null) j = old.findIndex((e, k) => !used.has(k) && e.key === w.key);
        else if (old[i] && !used.has(i) && old[i].key == null) j = i;
        const cand = j >= 0 ? old[j] : old[i];
        const can = j >= 0 && old[j].type === w.type && old[j].key === w.key;
        if (cand) con.log(`ช่อง ${i}: canUpdate(${cand.widget ? wName(cand.widget) : cand.type} → ${wName(w)}) = ${can}${can && w.key != null ? ' (จับคู่ด้วย key)' : ''}`, can ? 'ok' : 'err');
        else con.log(`ช่อง ${i}: ไม่มี Element เดิม`, 'sys');
        if (can) { used.add(j); updateEl(old[j], w); next.push(old[j]); }
        else next.push(mountEl(w));
      });
      old.forEach((e, k) => { if (!used.has(k)) { con.log(`Element #e${e.eid} ไม่ถูกใช้ต่อ → unmount`, 'err'); disposeEl(e); } });
      elements = next;
    }
    function counterOf(e) { return e.type === 'Counter' ? e : e.child; }
    function draw(flashIds) {
      clear(grid);
      grid.append(h('div', { class: 'rc-h' }, 'Widget (พิมพ์เขียว — สร้างใหม่ทุก build)'), h('div', { class: 'rc-h' }, 'Element (ตำแหน่งในต้นไม้ — อยู่ยาว)'), h('div', { class: 'rc-h' }, 'State (ข้อมูลที่จำไว้)'), h('div', { class: 'rc-h' }, 'สิ่งที่ผู้ใช้เห็น'));
      elements.forEach((e, i) => {
        const c = counterOf(e);
        const w = e.widget;
        const wBox = h('div', { class: 'rc-c rc-w' }, h('span', { class: 'mono' }, `${w.type}#w${w.wid}`), w.type === 'Padding' ? h('div', { class: 'mono dim' }, `└ Counter('${w.child.label}')#w${w.child.wid}`) : h('span', { class: 'mono dim' }, ` label: '${w.label}'`), w.key || (w.child && w.child.key) ? h('div', { class: 'pill' }, `key: ValueKey('${w.key || w.child.key}')`) : null);
        const eBox = h('div', { class: 'rc-c rc-e' }, h('span', { class: 'mono' }, `#e${e.eid} ${e.type}`), e.child ? h('div', { class: 'mono dim' }, `└ #e${e.child.eid} Counter`) : null);
        const st = c.state;
        const sBox = h('div', { class: 'rc-c rc-s' }, h('span', { class: 'mono' }, `State #s${st.sid}`), h('span', { class: 'mono' }, ` count = ${st.count}`), h('div', { class: 'dim', style: { fontSize: '.72rem' } }, `เกิดมาพร้อม '${st.born}'`));
        const label = c.widget.label;
        const mismatch = label !== st.born;
        const plus = btn('+1', () => { st.count++; con.log(`setState ใน State #s${st.sid} → count = ${st.count} (Widget/Element ไม่เปลี่ยน)`, 'flash'); draw([st.sid]); }, 'sm');
        const scr = h('div', { class: 'rc-c rc-scr' + (mismatch ? ' bad' : '') }, h('b', null, `${label}: ${st.count}`), plus, mismatch ? h('div', { class: 'vnote' }, `⚠ ป้าย ${label} แต่ตัวเลขเป็นของ ${st.born}`) : null);
        if (flashIds && flashIds.includes(st.sid)) flash(sBox, 'flash', 900);
        grid.append(wBox, eBox, sBox, scr);
      });
    }
    function rebuild(msg) { con.log('── ' + msg + ' ──', 'sys'); reconcile(widgetsFor()); draw(); }
    function reset() { wid = eid = sid = 0; order = ['A', 'B']; wrapA = false; elements = []; con.clear(); con.log('สร้างครั้งแรก', 'sys'); reconcile(widgetsFor()); elements[0].state && (elements[0].state.count = 3); draw(); keysT.set(keys); }
    const keysT = toggle('ใส่ ValueKey ให้ Counter', keys, (v) => { keys = v; rebuild(v ? 'เพิ่ม key (key เปลี่ยนจาก null → canUpdate เป็น false!)' : 'ถอด key ออก'); });
    body.append(
      h('div', { class: 'btn-row', style: { marginBottom: '8px' } },
        btn('parent rebuild (config เดิม)', () => rebuild('parent เรียก build() ใหม่'), 'primary sm'),
        btn('สลับลำดับ A ↔ B', () => { order = order.slice().reverse(); rebuild('สลับลำดับ'); }, 'sm'),
        btn(wrapA ? 'เอา Padding ออก' : 'ห่อ A ด้วย Padding', () => { wrapA = !wrapA; rebuild(wrapA ? "ห่อ A ด้วย Padding" : 'เอา Padding ออก'); }, 'sm'),
        keysT, btn('เริ่มใหม่', reset, 'sm ghost')),
      grid, con.el);
    reset();
    return { setMode(m) { if (m === 'swap') { reset(); order = ['B', 'A']; rebuild('สลับลำดับ'); } if (m === 'wrap') { reset(); wrapA = true; rebuild('ห่อ A ด้วย Padding'); } } };
  });

  // ───────────────────────── c2: BuildContext lookup ─────────────────────────
  R('core.context', (body) => {
    const spec = { id: 'myapp', label: 'MyApp', kind: 'stateless', meta: '**context ①** (build ของ MyApp)', children: [
      { id: 'prov', label: 'ChangeNotifierProvider<CartProvider>', kind: 'provider', children: [
        { id: 'mat', label: 'MaterialApp', kind: 'system', note: 'สร้าง 3 ชั้นข้างล่างให้อัตโนมัติ', children: [
          { id: 'theme', label: 'Theme', kind: 'inherited', children: [
            { id: 'msgr', label: 'ScaffoldMessenger', kind: 'inherited', children: [
              { id: 'nav', label: 'Navigator', kind: 'nav', children: [
                { id: 'route', label: 'MaterialPageRoute → HomeScreen', kind: 'route', children: [
                  { id: 'home', label: 'HomeScreen', kind: 'stateful', meta: '**context ②** (build ของ State)', children: [
                    { id: 'scaf', label: 'Scaffold', kind: 'system', children: [
                      { id: 'form', label: 'Form', kind: 'form', children: [
                        { id: 'builder', label: 'Builder', kind: 'leaf', meta: '**context ③** (builder: (ctx) => …)', children: [
                          { id: 'field', label: 'TextFormField', kind: 'field' },
                          { id: 'btn', label: 'ElevatedButton(onPressed: …)', kind: 'leaf' },
                        ] }] }] }] }] }] }] }] }] }] }] };
    const CTX = { myapp: '① MyApp', home: '② HomeScreen (State)', builder: '③ Builder ใต้ Form' };
    const CALLS = {
      nav: { label: 'Navigator.of(context)', pred: (n) => n.kind === 'nav', miss: '`Navigator operation requested with a context that does not include a Navigator.` — context อยู่ **เหนือ** MaterialApp ซึ่งเป็นผู้สร้าง Navigator', fix: 'เรียกจาก context ที่อยู่ใต้ MaterialApp (เช่นใน build ของหน้าจอ)' },
      theme: { label: 'Theme.of(context)', pred: (n) => n.id === 'theme', miss: '**ไม่ error** — `Theme.of` คืน ThemeData สำรอง (fallback) ที่ไม่ใช่ธีมของแอป → สีผิดแบบเงียบๆ', fix: 'ใช้ context ที่อยู่ใต้ MaterialApp' },
      msgr: { label: 'ScaffoldMessenger.of(context)', pred: (n) => n.id === 'msgr', miss: 'ไม่พบ ScaffoldMessenger → error (SnackBar แสดงไม่ได้)', fix: 'ใช้ context ใต้ MaterialApp' },
      read: { label: 'context.read<CartProvider>()', pred: (n) => n.kind === 'provider', miss: '`ProviderNotFoundException: Could not find the correct Provider<CartProvider> above this MyApp Widget` — context ของ MyApp อยู่ **เหนือ** Provider ที่ตัวเองสร้าง', fix: 'ย้าย Provider ขึ้นไปห่อ MyApp ใน main() หรืออ่านจากวิดเจ็ตที่อยู่ใต้ Provider' },
      form: { label: 'Form.of(context)', pred: (n) => n.kind === 'form', miss: '`Form.of() was called with a context that does not contain a Form widget.` — Form ถูกสร้าง **ใน build นี้เอง** จึงอยู่ใต้ context ไม่ใช่เหนือ', fix: 'ใช้ GlobalKey<FormState> (บทที่ 8) หรือห่อส่วนที่เรียกด้วย Builder เพื่อได้ context ③' },
    };
    let ctx = 'home', call = 'nav', busy = false, again = false;
    const tv = FR.Tree.create(h('div'), spec, { compact: true, hideCounts: true });
    const out = h('div', { class: 'cx-out' });
    async function go() {
      if (busy) { again = true; return; } // re-run with the latest choice once the current walk ends
      busy = true;
      clear(out);
      const c = CALLS[call];
      out.appendChild(h('div', { class: 'mono' }, `${c.label}  // จาก context ${CTX[ctx]}`));
      const found = await tv.lookup(ctx, c.pred, { delay: 240 });
      if (found) out.appendChild(h('div', { class: 'vt-res ok', html: md(`✓ เจอ **${tv.find(found).label}** ที่อยู่เหนือขึ้นไป ${tv.ancestors(ctx).indexOf(found) + 1} ชั้น`) }));
      else { out.appendChild(h('div', { class: 'vt-res bad', html: md('✗ ' + c.miss) })); out.appendChild(h('div', { class: 'vnote', html: md('แก้: ' + c.fix) })); }
      busy = false;
      if (again) { again = false; go(); }
    }
    body.append(
      h('div', { class: 'btn-row', style: { marginBottom: '6px' } }, h('span', { class: 'dim', style: { fontSize: '.8rem' } }, 'context:'), seg(Object.keys(CTX).map((k) => ({ value: k, label: CTX[k] })), ctx, (v) => { ctx = v; go(); })),
      h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, h('span', { class: 'dim', style: { fontSize: '.8rem' } }, 'เรียก:'), seg(Object.keys(CALLS).map((k) => ({ value: k, label: CALLS[k].label })), call, (v) => { call = v; go(); })),
      h('div', { class: 'vrow' }, h('div', { class: 'grow' }, tv.el), h('div', { class: 'grow' }, FR.Panel('ผลการค้นหา (ไล่ขึ้นทีละชั้น ไม่มองลง ไม่มองข้าง)', out))));
    setTimeout(go, 50);
    return { destroy: () => tv.destroy(), setMode(m) { const [a, b] = m.split(':'); if (CTX[a]) ctx = a; if (CALLS[b]) call = b; go(); } };
  });

  // ───────────────────────── c3: InheritedWidget dependents ─────────────────────────
  R('core.inherited', (body) => {
    const spec = { id: 'cnp', label: 'ChangeNotifierProvider<CartProvider>', kind: 'provider', children: [
      { id: 'app', label: 'MaterialApp → … → ShopScreen', kind: 'system', children: [
        { id: 'appbar', label: 'AppBar', kind: 'system', children: [{ id: 'badge', label: 'CartBadge', kind: 'consumer' }] },
        { id: 'list', label: 'ProductList', kind: 'stateless', children: [{ id: 'tile', label: 'ProductTile (ปุ่ม “ใส่ตะกร้า”)', kind: 'stateless' }] },
        { id: 'total', label: 'TotalText', kind: 'consumer' },
        { id: 'title', label: 'PageTitle', kind: 'leaf', const: true },
      ] }] };
    let count = 0, badgeMode = 'watch', totalMode = 'watch', tileMode = 'read';
    const shown = { badge: 0, total: 0 };
    const tv = FR.Tree.create(h('div'), spec, { compact: true });
    const deps = h('div', { class: 'ih-deps' }), out = h('div'), con = FR.Console.create({ title: 'Console', compact: true });
    function registered() { return ['badge', 'total'].filter((id) => (id === 'badge' ? badgeMode : totalMode) === 'watch'); }
    function draw() {
      tv.setMeta('badge', `\`context.${badgeMode}\` ใน build · แสดง **${shown.badge}**` + (shown.badge !== count ? ' ⚠ ค้าง' : ''));
      tv.setMeta('total', `\`context.${totalMode}\` ใน build · แสดง **${shown.total}**` + (shown.total !== count ? ' ⚠ ค้าง' : ''));
      tv.setMeta('tile', `\`context.${tileMode}\` ใน onPressed`);
      tv.setMeta('cnp', `count = **${count}**`);
      ['badge', 'total'].forEach((id) => tv.mark(id, 'stale', shown[id] !== count));
      clear(deps);
      deps.appendChild(h('div', { class: 'sq-cap' }, 'รายชื่อ dependents ที่ลงทะเบียนไว้กับ Provider'));
      const r = registered();
      r.forEach((id) => deps.appendChild(h('div', { class: 'pill' }, tv.find(id).label)));
      if (!r.length) deps.appendChild(h('div', { class: 'dim' }, '(ไม่มี — ไม่มีใครถูกแจ้งเมื่อข้อมูลเปลี่ยน)'));
    }
    function add() {
      clear(out);
      if (tileMode === 'watch') {
        out.appendChild(h('div', { class: 'vt-res bad', html: md('✗ `Tried to listen to a value exposed with provider, from outside of the widget tree.` — `onPressed` ไม่ได้อยู่ระหว่าง build จึงลงทะเบียนเป็นผู้ฟังไม่ได้ → ใช้ `context.read`') }));
        con.log('onPressed: context.watch<CartProvider>() → exception', 'err');
        return;
      }
      count++;
      con.log(`onPressed: context.read<CartProvider>().add() → count = ${count} → notifyListeners()`, 'flash');
      tv.pulse('cnp');
      const r = registered();
      r.forEach((id) => { shown[id] = count; });
      tv.rebuild(r);
      con.log(r.length ? `แจ้ง dependents: ${r.map((id) => tv.find(id).label).join(', ')} → build ใหม่` : 'ไม่มี dependents → ไม่มีใคร build ใหม่', r.length ? 'ok' : 'err');
      draw();
    }
    function parentRebuild() {
      ['badge', 'total'].forEach((id) => { shown[id] = count; });
      tv.rebuild(tv.subtree('app'));
      con.log('ShopScreen ถูก build ใหม่ด้วยเหตุอื่น (เช่น setState ข้างบน) → ทุกตัวอ่านค่าล่าสุดได้ แม้ใช้ read', 'sys');
      draw();
    }
    const initErr = () => { clear(out); out.appendChild(h('div', { class: 'vt-res bad', html: md('✗ `dependOnInheritedWidgetOfExactType<…>() or dependOnInheritedElement() was called before _ShopScreenState.initState() completed.` — ข้อความจริงจาก framework: ถ้าอ้างอิงไว้ใน initState วิดเจ็ตจะไม่สะท้อนการเปลี่ยนแปลงภายหลัง') }), h('div', { class: 'vnote', html: md('ทางเลือก: `context.read` ใน initState (อ่านครั้งเดียว ไม่ลงทะเบียน) · หรือทำใน `didChangeDependencies` (แลปบทที่ 11 ใช้ `_isInit`) · หรือ `watch` ใน build') })); };
    body.append(
      h('div', { class: 'btn-row', style: { marginBottom: '6px' } },
        h('span', { class: 'dim', style: { fontSize: '.8rem' } }, 'CartBadge:'), seg(['watch', 'read'], badgeMode, (v) => { badgeMode = v; draw(); }),
        h('span', { class: 'dim', style: { fontSize: '.8rem' } }, 'TotalText:'), seg(['watch', 'read'], totalMode, (v) => { totalMode = v; draw(); }),
        h('span', { class: 'dim', style: { fontSize: '.8rem' } }, 'ProductTile.onPressed:'), seg(['read', 'watch'], tileMode, (v) => { tileMode = v; draw(); })),
      h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, btn('กด “ใส่ตะกร้า”', add, 'primary sm'), btn('ShopScreen rebuild ด้วยเหตุอื่น', parentRebuild, 'sm'), btn('ลอง watch ใน initState', initErr, 'sm danger')),
      h('div', { class: 'vrow' }, h('div', { class: 'grow' }, tv.el, deps), h('div', { class: 'grow' }, out, con.el)));
    draw();
    return { destroy: () => tv.destroy(), setMode(m) { if (m === 'badgeRead') { badgeMode = 'read'; draw(); add(); } } };
  });

  // ───────────────────────── c4: rebuild ≠ repaint, const ─────────────────────────
  R('core.paint', (body) => {
    const consts = { appbar: true, chart: false, footer: true };
    let count = 0, ms = 0;
    const COST = { page: 0.2, scaf: 0.2, appbar: 0.4, col: 0.1, text: 0.1, chart: 4, footer: 0.3 };
    const paints = { text: 0 };
    const mkSpec = () => ({ id: 'page', label: 'CounterPage (State: setState)', kind: 'stateful', children: [
      { id: 'scaf', label: 'Scaffold', kind: 'system', children: [
        { id: 'appbar', label: "AppBar(title: Text('ตัวนับ'))", kind: 'system', const: consts.appbar },
        { id: 'col', label: 'Column', kind: 'leaf', children: [
          { id: 'text', label: "Text('$_count')", kind: 'leaf' },
          { id: 'chart', label: 'ExpensiveChart()  (build ~4 ms)', kind: 'stateless', const: consts.chart },
          { id: 'footer', label: 'Footer()', kind: 'stateless', const: consts.footer },
        ] }] }] });
    let tv = FR.Tree.create(h('div'), mkSpec(), { compact: true });
    const holder = h('div'); holder.appendChild(tv.el);
    const meter = FR.Meter.create('เวลา build สะสม (จำลอง)', { max: 40 });
    const info = h('div', { class: 'vnote' });
    function meta() {
      tv.setMeta('text', `แสดง **${count}** · วาดใหม่ ×${paints.text}`);
      ['appbar', 'chart', 'footer'].forEach((id) => tv.setMeta(id, `วาดใหม่ ×0`));
      meter.set(ms, 40, ms.toFixed(1) + ' ms');
    }
    function tap() {
      count++;
      const ids = tv.subtree('page');
      tv.rebuild(ids);
      ms += ids.reduce((s, id) => s + (COST[id] || 0), 0);
      paints.text++;
      meta();
      const skipped = ['appbar', 'chart', 'footer'].filter((id) => !ids.includes(id));
      info.innerHTML = md(`build ใหม่ ${ids.length} วิดเจ็ต` + (skipped.length ? ` · ข้าม (const) ${skipped.length} ตัว` : '') + ' · แต่ **วาดใหม่จริงเฉพาะ Text** เพราะเป็นตัวเดียวที่ค่าที่แสดงเปลี่ยน — RenderObject ของตัวอื่นได้ค่าเดิม จึงไม่ต้อง layout/paint ใหม่');
    }
    function rebuildTree() { tv.destroy(); clear(holder); tv = FR.Tree.create(holder, mkSpec(), { compact: true }); meta(); }
    body.append(
      h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, btn('setState(() => _count++)', tap, 'primary sm'),
        toggle('const AppBar', consts.appbar, (v) => { consts.appbar = v; rebuildTree(); }),
        toggle('const ExpensiveChart', consts.chart, (v) => { consts.chart = v; rebuildTree(); }),
        toggle('const Footer', consts.footer, (v) => { consts.footer = v; rebuildTree(); }),
        btn('ล้างตัวนับ', () => { ms = 0; paints.text = 0; tv.resetCounts(); meta(); info.textContent = ''; }, 'sm ghost')),
      holder, meter.el, info);
    meta();
    return { destroy: () => tv.destroy() };
  });
})();
