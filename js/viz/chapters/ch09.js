/* Chapter 9 visualizations — Navigator, routes, data in/out, named routes, stack ops, PopScope */
(function () {
  'use strict';
  const { h, clear, sleep, flash, seg, btn, toggle } = FR.util;
  const md = (s) => FR.markup.inline(s);
  const R = FR.viz.register;

  // ───────── MiniNav: a tiny Navigator driving a Phone ─────────
  function MiniNav(phone, opts) {
    const stack = [];
    let uid = 0;
    let platform = opts.platform || 'android';
    const listeners = [];
    function top() { return stack[stack.length - 1]; }
    function render(anim) {
      const r = top();
      phone.setDark(!r);
      phone.setFab(null);
      if (!r) { phone.setTitle(''); phone.setBack(null); phone.setBody(null); emit(); return; }
      const scr = opts.screens[r.name](r, api);
      phone.setTitle(scr.title || r.name);
      phone.setBack(stack.length > 1 && scr.back !== false ? () => tryPop('appbar') : null);
      phone.setBody(scr.body);
      if (scr.fab) phone.setFab(scr.fab[0], scr.fab[1]);
      if (anim) { phone.body.classList.remove('tr-push-android', 'tr-push-ios', 'tr-pop'); void phone.body.offsetWidth; phone.body.classList.add(anim === 'pop' ? 'tr-pop' : 'tr-push-' + platform); }
      emit();
    }
    function emit() { listeners.forEach((f) => f(stack)); }
    function push(name, args) {
      return new Promise((resolve) => { stack.push({ name, args, id: ++uid, resolve, born: Date.now() }); render('push'); });
    }
    function pop(result) {
      const r = stack.pop();
      if (r) { r.dead = true; r.resolve(result === undefined ? null : result); (opts.onDispose || (() => {}))(r); }
      render('pop');
      return r;
    }
    /** a back gesture from any channel → respects PopScope (screen.canPop / onPopInvoked) */
    function tryPop(channel) {
      const r = top();
      if (!r) return;
      const scr = opts.screens[r.name](r, api);
      const canPop = scr.canPop ? scr.canPop() : true;
      if (opts.onBackAttempt) opts.onBackAttempt(channel, canPop, r);
      if (!canPop) { scr.onPopInvoked && scr.onPopInvoked(false, null); return; }
      pop(null);
    }
    const api = {
      stack, push, pop, tryPop, top,
      get platform() { return platform; },
      setPlatform(p) { platform = p; },
      canPop: () => stack.length > 1,
      maybePop(result) { if (stack.length > 1) { pop(result); return true; } return false; },
      pushReplacement(name, args) { const old = stack.pop(); if (old) { old.dead = true; old.resolve(null); (opts.onDispose || (() => {}))(old); } return push(name, args); },
      pushAndRemoveUntil(name, args, pred) {
        const p = new Promise((resolve) => {
          const entry = { name, args, id: ++uid, resolve, born: Date.now() };
          while (stack.length && !pred(stack[stack.length - 1])) { const x = stack.pop(); x.dead = true; x.resolve(null); (opts.onDispose || (() => {}))(x); }
          stack.push(entry);
          render('push');
        });
        return p;
      },
      popUntil(pred) { while (stack.length > 1 && !pred(top())) { const x = stack.pop(); x.dead = true; x.resolve(null); (opts.onDispose || (() => {}))(x); } render('pop'); },
      reset(names) { stack.splice(0).forEach((x) => { x.dead = true; }); names.forEach((n) => stack.push({ name: typeof n === 'string' ? n : n.name, args: n.args, id: ++uid, resolve: () => {}, born: Date.now() })); render(); },
      refresh: () => render(),
      onChange(f) { listeners.push(f); },
    };
    return api;
  }
  FR.MiniNav = MiniNav;

  /** stack panel: plates bottom→top */
  function StackPanel(nav, opts = {}) {
    const el = h('div', { class: 'plates' });
    const lbl = h('div', { class: 'plates-l' });
    function draw(stack) {
      clear(el);
      if (!stack.length) el.appendChild(h('div', { class: 'plate empty' }, '(stack ว่าง → จอดำ)'));
      stack.slice().reverse().forEach((r, i) => {
        const isTop = i === 0;
        el.appendChild(h('div', { class: 'plate' + (isTop ? ' top' : '') + (r.name === 'Dialog' ? ' dlg' : '') },
          h('span', { class: 'mono' }, r.name + (opts.showArgs && r.args ? `(${typeof r.args === 'string' ? `'${r.args}'` : '…'})` : '')),
          h('span', { class: 'pl-meta' }, isTop ? 'มองเห็น' : 'ถูกทับ · State ยังอยู่'),
          opts.ticks && r.ticks != null ? h('span', { class: 'pl-tick', title: 'timer ของหน้านี้ยังทำงาน' }, '⏱ ' + r.ticks) : null));
      });
      lbl.textContent = `${stack.length} หน้าใน stack`;
    }
    nav.onChange(draw);
    draw(nav.stack);
    return { el: h('div', { class: 'plates-wrap' }, h('div', { class: 'plates-h' }, 'Navigator stack (บนสุด = ที่ผู้ใช้เห็น)'), el, lbl), draw };
  }

  // reusable simple screens
  function simpleScreens(log, extra = {}) {
    const U = FR.ui;
    return Object.assign({
      Home: (r, nav) => ({ title: 'หน้าหลัก', body: U.center(U.text('HomeScreen'), U.btn('ไปที่รายละเอียด', () => { log('Navigator.push(context, MaterialPageRoute(builder: (c) => const DetailScreen()))'); nav.push('Detail'); })) }),
      Detail: (r, nav) => ({ title: 'หน้ารายละเอียด', body: U.center(U.text(r.args || 'รายละเอียดอยู่ที่นี่'), U.btn('ย้อนกลับ', () => { log('Navigator.pop(context)'); nav.pop(); }, 'tonal')) }),
      Login: (r, nav) => ({ title: 'เข้าสู่ระบบ', body: U.center(U.text('🔐 LoginScreen'), U.btn('เข้าสู่ระบบ', () => extra.onLogin ? extra.onLogin(nav) : nav.push('Home'))) }),
      Profile: () => ({ title: 'โปรไฟล์', body: U.center(U.text('👤 ProfileScreen')) }),
      Settings: (r, nav) => ({ title: 'ตั้งค่า', body: U.center(U.text('⚙ SettingsScreen'), U.btn('ออกจากระบบ', () => extra.onLogout ? extra.onLogout(nav) : null, 'outlined')) }),
      Product: () => ({ title: 'สินค้า', body: U.center(U.text('☕ ProductScreen')) }),
      Cart: () => ({ title: 'ตะกร้า', body: U.center(U.text('🛒 CartScreen')) }),
      Checkout: (r, nav) => ({ title: 'ชำระเงิน', body: U.center(U.text('💳 CheckoutScreen'), U.btn('สั่งซื้อสำเร็จ', () => extra.onCheckout ? extra.onCheckout(nav) : null)) }),
    }, extra.screens || {});
  }

  // ───────── 9.2/9.3/9.7 Navigator stack playground ─────────
  R('ch09.stack', (body, props) => {
    const con = FR.Console.create({ title: 'คำสั่งที่ถูกเรียก', compact: true });
    const log = (t, k) => con.log(t, k);
    const ph = FR.Phone.create({ small: true, height: 380 });
    let platform = 'android';
    let scen = props.scenarios ? 'login' : null;
    let tickTimer = null;
    const nav = MiniNav(ph, {
      platform,
      screens: simpleScreens(log, {
        onLogin: (n) => { if (loginMode === 'push') { log('Navigator.push(… HomeScreen)', 'warn'); n.push('Home'); } else { log('Navigator.pushReplacement(… HomeScreen)', 'ok'); n.pushReplacement('Home'); } },
        onLogout: (n) => { if (logoutMode === 'push') { log('Navigator.push(… LoginScreen)', 'warn'); n.push('Login'); } else { log('Navigator.pushAndRemoveUntil(… LoginScreen, (route) => false)', 'ok'); n.pushAndRemoveUntil('Login', null, () => false); } },
        onCheckout: (n) => { log('Navigator.popUntil(context, (route) => route.isFirst)', 'ok'); n.popUntil((r) => r === n.stack[0]); },
      }),
      onDispose: (r) => log(`dispose() ของ ${r.name}`, 'dim'),
    });
    const sp = StackPanel(nav, { ticks: !!props.scenarios });
    let loginMode = 'replace', logoutMode = 'remove';
    const ops = h('div', { class: 'btn-row' });
    const names = ['Detail', 'Profile', 'Settings', 'Product', 'Cart'];
    let ni = 0;
    function basicOps() {
      clear(ops);
      ops.append(
        btn('push', () => { const n = names[ni++ % names.length]; log(`Navigator.push(context, MaterialPageRoute(builder: (c) => const ${n}Screen()))`); nav.push(n); }, 'primary sm'),
        btn('pop', () => { log('Navigator.pop(context)'); if (nav.stack.length === 1) log('pop หน้าสุดท้าย → ไม่มี error แต่จอดำ!', 'err'); nav.pop(); }, 'sm'),
        btn('maybePop', () => { const ok = nav.maybePop(); log(`Navigator.maybePop(context) → ${ok ? 'pop แล้ว' : 'ไม่มีหน้าก่อนหน้า ไม่ทำอะไร'}`, ok ? '' : 'ok'); }, 'sm'),
        btn('canPop?', () => log(`Navigator.canPop(context) → ${nav.canPop()}`, 'info'), 'sm ghost'),
        btn('pushReplacement', () => { const n = names[ni++ % names.length]; log(`Navigator.pushReplacement(… ${n}Screen)`); nav.pushReplacement(n); }, 'sm'),
        btn('popUntil(isFirst)', () => { log('Navigator.popUntil(context, (route) => route.isFirst)'); nav.popUntil((r) => r === nav.stack[0]); }, 'sm'),
        btn('เริ่มใหม่', () => { con.clear(); nav.reset(['Home']); }, 'sm ghost'));
    }
    const scenBox = h('div');
    function scenario(k) {
      scen = k; clear(scenBox); con.clear();
      if (k === 'login') {
        nav.reset(['Login']);
        scenBox.append(h('div', { class: 'vnote', html: md('ผู้ใช้กด “เข้าสู่ระบบ” ในหน้า Login แล้วลองกด ← ย้อนกลับจากหน้าหลัก') }), seg([{ value: 'push', label: 'ใช้ push ธรรมดา' }, { value: 'replace', label: 'ใช้ pushReplacement' }], loginMode, (v) => { loginMode = v; nav.reset(['Login']); con.clear(); }));
      } else if (k === 'logout') {
        nav.reset(['Home', 'Profile', 'Settings']);
        scenBox.append(h('div', { class: 'vnote', html: md('ผู้ใช้อยู่ลึก 3 ชั้นแล้วกด “ออกจากระบบ” — ลองกด ← ย้อนกลับหลังออกจากระบบ') }), seg([{ value: 'push', label: 'ใช้ push ธรรมดา' }, { value: 'remove', label: 'ใช้ pushAndRemoveUntil' }], logoutMode, (v) => { logoutMode = v; nav.reset(['Home', 'Profile', 'Settings']); con.clear(); }));
      } else if (k === 'checkout') {
        nav.reset(['Home', 'Product', 'Cart', 'Checkout']);
        scenBox.append(h('div', { class: 'vnote', html: md('กด “สั่งซื้อสำเร็จ” — กลับหน้าแรกรวดเดียวด้วย popUntil แทนการกดย้อนกลับ 3 ครั้ง · สังเกต ⏱ ของหน้าที่ถูกทับ: timer ยังเดินอยู่') }));
      }
    }
    const platSeg = seg([{ value: 'android', label: 'Android (จางเข้า)' }, { value: 'ios', label: 'iOS (เลื่อนจากขวา)' }], platform, (v) => { platform = v; nav.setPlatform(v); });
    if (props.scenarios) {
      const s = seg([{ value: 'login', label: 'เข้าสู่ระบบ' }, { value: 'logout', label: 'ออกจากระบบ' }, { value: 'checkout', label: 'กลับหน้าแรกหลังสั่งซื้อ' }], scen, scenario);
      body.appendChild(h('div', { class: 'vctrl' }, h('span', { class: 'lbl' }, 'สถานการณ์:'), s));
      body.appendChild(scenBox);
      scenario(scen);
      tickTimer = setInterval(() => { nav.stack.forEach((r) => { if (['Product', 'Cart', 'Profile'].includes(r.name)) r.ticks = (r.ticks || 0) + 1; }); sp.draw(nav.stack); }, 1000);
    } else {
      basicOps();
      body.appendChild(h('div', { class: 'vctrl' }, h('span', { class: 'lbl' }, 'แพลตฟอร์ม:'), platSeg));
      body.appendChild(ops);
      nav.reset(['Home']);
    }
    body.appendChild(h('div', { class: 'vrow', style: { marginTop: '10px' } }, ph.el, h('div', { class: 'grow vcol' }, sp.el, con.el)));
    return { destroy() { clearInterval(tickTimer); }, setMode(m) { if (props.scenarios) scenario(m); } };
  });

  // ───────── 9.2 context lookup + trap ─────────
  R('ch09.lookup', (body) => {
    let trap = false;
    const box = h('div');
    const out = h('div');
    let tv;
    function spec() {
      return trap
        ? { id: 'myapp', label: 'MyApp  ← context ที่ปุ่มใช้ (ของ build ของ MyApp)', kind: 'stateless', children: [
            { id: 'mat', label: 'MaterialApp', kind: 'system', children: [
              { id: 'nav', label: 'Navigator (MaterialApp สร้างให้)', kind: 'nav', children: [
                { id: 'scaf', label: 'Scaffold (เขียนตรงใน home:)', kind: 'system', children: [
                  { id: 'btn', label: 'ElevatedButton(onPressed: () => Navigator.push(context, …))', kind: 'leaf' }] }] }] }] }
        : { id: 'myapp', label: 'MyApp', kind: 'stateless', children: [
            { id: 'mat', label: 'MaterialApp(home: const HomeScreen())', kind: 'system', children: [
              { id: 'nav', label: 'Navigator (MaterialApp สร้างให้)', kind: 'nav', children: [
                { id: 'home', label: 'HomeScreen  ← context ของ build นี้', kind: 'stateless', children: [
                  { id: 'scaf', label: 'Scaffold', kind: 'system', children: [
                    { id: 'btn', label: 'ElevatedButton(onPressed: () => Navigator.push(context, …))', kind: 'leaf' }] }] }] }] }] };
    }
    function build() { clear(box); clear(out); tv = FR.Tree.create(box, spec(), { hideCounts: true }); }
    async function press() {
      clear(out);
      const start = trap ? 'myapp' : 'home';
      tv.mark('btn', 'sel');
      const found = await tv.lookup(start, (n) => n.kind === 'nav', { delay: 380 });
      tv.mark('btn', 'sel', false);
      if (found) { tv.arrow(start, found, 'lookup', 'เจอ Navigator'); out.appendChild(h('div', { class: 'vt-res ok' }, '✓ push สำเร็จ — ไล่ขึ้นจาก HomeScreen เจอ Navigator ที่ใกล้ที่สุด')); }
      else out.appendChild(h('div', { class: 'vt-res bad mono', style: { fontSize: '.8rem' } }, 'FlutterError: Navigator operation requested with a context that does not include a Navigator.'));
    }
    const s = seg([{ value: 'ok', label: 'แยก HomeScreen เป็นคลาส (ถูก)' }, { value: 'trap', label: 'เขียนหน้าแรกใน build ของ MyApp (กับดัก)' }], 'ok', (v) => { trap = v === 'trap'; build(); });
    body.append(h('div', { class: 'vctrl' }, s, btn('กดปุ่ม → Navigator.push', press, 'primary')), box, h('div', { class: 'tv-legend' }, h('span', { class: 'l-lk' }, 'ไล่ขึ้นตาม tree'), h('span', { class: 'l-ok' }, 'เจอ')), out);
    build();
    return { setMode(m) { s.set(m); trap = m === 'trap'; build(); } };
  });

  // ───────── 9.4 constructor vs arguments: compile-time check ─────────
  R('ch09.ctor', (body) => {
    const st = { itemId: true, message: true, idType: 'String' };
    const code = h('div'); const res = h('div');
    function render() {
      const args = [];
      if (st.itemId) args.push(st.idType === 'String' ? "itemId: 'Item-123'" : 'itemId: 123');
      if (st.message) args.push("message: 'สวัสดีจากหน้าโฮม!'");
      clear(code);
      code.appendChild(FR.CodeView.create({ lang: 'dart', title: 'หน้าต้นทาง', src: `Navigator.push(\n  context,\n  MaterialPageRoute(\n    builder: (context) => DetailScreen(${args.length ? '\n      ' + args.join(',\n      ') + ',\n    ' : ''}),\n  ),\n);` }).el);
      clear(res);
      const errs = [];
      if (!st.itemId) errs.push("Error: Required named parameter 'itemId' must be provided.");
      if (!st.message) errs.push("Error: Required named parameter 'message' must be provided.");
      if (st.itemId && st.idType === 'int') errs.push("Error: The argument type 'int' can't be assigned to the parameter type 'String'.");
      if (errs.length) res.appendChild(h('div', { class: 'vt-res bad' }, h('div', null, '✗ compile ไม่ผ่าน — รู้ตั้งแต่ก่อนรันแอป'), errs.map((e) => h('div', { class: 'mono', style: { fontSize: '.76rem' } }, e))));
      else res.appendChild(h('div', { class: 'vt-res ok' }, '✓ compile ผ่าน — คอมไพเลอร์ตรวจชื่อและชนิดให้ครบทุกจุดที่ push'));
    }
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '8px' } },
      toggle('ส่ง itemId', st.itemId, (v) => { st.itemId = v; render(); }),
      toggle('ส่ง message', st.message, (v) => { st.message = v; render(); }),
      seg([{ value: 'String', label: "itemId: 'Item-123'" }, { value: 'int', label: 'itemId: 123' }], st.idType, (v) => { st.idType = v; render(); })),
      h('div', { class: 'vrow' }, h('div', { class: 'grow' }, FR.CodeView.create({ lang: 'dart', title: 'DetailScreen (ปลายทาง)', src: "class DetailScreen extends StatelessWidget {\n  final String itemId;\n  final String message;\n\n  const DetailScreen({\n    super.key,\n    required this.itemId,\n    required this.message,\n  });\n  // ...\n}" }).el), h('div', { class: 'grow vcol' }, code, res)));
    render();
  });

  // ───────── 9.5 await push / pop(result) ─────────
  R('ch09.result', (body) => {
    let typed = true, guard = true, killed = false;
    const con = FR.Console.create({ title: 'Debug Console', compact: true });
    const ph = FR.Phone.create({ small: true, height: 360 });
    const CODE = (t) => `Future<void> _navigateToSelectionScreen() async {
  final result = await Navigator.push${t ? '<String>' : ''}(
    context,
    MaterialPageRoute(builder: (context) => const SelectionScreen()),
  );
${guard ? '  if (!mounted) return;\n' : ''}  ${t ? "final text = result == null ? 'ไม่มีการเลือก' : 'เลือก: $result';" : "final text = 'เลือก: ' + result.toUpperCase();"}
  ScaffoldMessenger.of(context)
    ..removeCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(text)));
}`;
    const codeBox = h('div');
    let cv;
    function drawCode() { clear(codeBox); cv = FR.CodeView.create({ src: CODE(typed), lang: 'dart', title: 'ภายในคลาส State ของ HomeScreen', autoScroll: false }); codeBox.appendChild(cv.el); }
    const status = h('div', { class: 'res-status' });
    const nav = MiniNav(ph, {
      screens: {
        Home: (r, n) => ({ title: 'หน้าหลัก', body: FR.ui.center(FR.ui.text('HomeScreen'), FR.ui.btn('ไปที่หน้าจอเลือก', go)) }),
        Selection: (r, n) => ({ title: 'เลือกตัวเลือก', body: FR.ui.pad(FR.ui.text('เลือกหนึ่งข้อ (หรือกดย้อนกลับ)', 'dim'),
          FR.ui.btn('ตัวเลือก ก', () => { con.log("Navigator.pop(context, 'ตัวเลือก ก')"); n.pop('ตัวเลือก ก'); }),
          FR.ui.btn('ตัวเลือก ข', () => { con.log("Navigator.pop(context, 'ตัวเลือก ข')"); n.pop('ตัวเลือก ข'); }, 'tonal')) }),
        Login: () => ({ title: 'เข้าสู่ระบบ', body: FR.ui.center(FR.ui.text('(ถูกล้าง stack มาหน้านี้)', 'dim')) }),
      },
    });
    async function go() {
      killed = false;
      cv.active('await Navigator.push');
      status.innerHTML = md('⏸ **ฟังก์ชันหยุดรอที่บรรทัด await** — หน้าจอใหม่ทำงานไป (หน่วยสอดแนมออกปฏิบัติภารกิจ)');
      con.log(`await Navigator.push${typed ? '<String>' : ''}(…SelectionScreen)`);
      const result = await nav.push('Selection');
      con.log(`กลับมาที่บรรทัด await: result = ${result === null ? 'null' : "'" + result + "'"}  (ชนิด ${typed ? 'String?' : 'dynamic'})`, result === null ? 'warn' : 'ok');
      await sleep(300);
      if (guard) {
        cv.active('if (!mounted) return;');
        if (killed) { con.log('mounted == false → return (ไม่แตะ context)', 'ok'); status.innerHTML = md('🛡 **ป้อมยาม mounted** กันไว้ — หน้าหลักถูกล้างไปแล้ว จึงไม่ใช้ context'); return; }
        await sleep(300);
      } else if (killed) {
        cv.active('ScaffoldMessenger.of(context)');
        con.log("FlutterError: Looking up a deactivated widget's ancestor is unsafe.", 'err');
        status.innerHTML = md('💥 ใช้ context ของหน้าที่ถูกนำออกไปแล้ว — ต้องมี `if (!mounted) return;`');
        return;
      }
      cv.active(typed ? 'final text' : 'final text');
      if (!typed && result === null) {
        con.log("NoSuchMethodError: The method 'toUpperCase' was called on null.", 'err');
        status.innerHTML = md('🟥 **Red Screen of Death** — push ไม่ระบุชนิด ผลเป็น dynamic คอมไพเลอร์ไม่เตือนเรื่อง null');
        ph.setBody(h('div', { class: 'redscreen' }, "NoSuchMethodError: The method 'toUpperCase' was called on null."));
        return;
      }
      const text = typed ? (result == null ? 'ไม่มีการเลือก' : 'เลือก: ' + result) : 'เลือก: ' + String(result).toUpperCase();
      cv.active('..showSnackBar');
      ph.snack(text);
      status.innerHTML = md(result == null ? 'ผู้ใช้ย้อนกลับเอง → `null` → แสดง “ไม่มีการเลือก” (รองรับกรณี null แล้ว)' : `ได้ผลลัพธ์ “${result}” → SnackBar`);
    }
    const killB = btn('ระหว่างรอ: ล้าง stack (pushAndRemoveUntil → Login)', () => {
      if (nav.stack.length < 2) { con.log('ต้องเปิดหน้าจอเลือกก่อน', 'dim'); return; }
      killed = true; con.log('โค้ดอีกส่วน: Navigator.pushAndRemoveUntil(…Login, (r) => false)', 'warn');
      nav.pushAndRemoveUntil('Login', null, () => false);
    }, 'danger sm');
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '8px' } },
      seg([{ value: 't', label: 'push<String> (ระบุชนิด)' }, { value: 'u', label: 'push (ไม่ระบุชนิด)' }], 't', (v) => { typed = v === 't'; drawCode(); }),
      toggle('มี if (!mounted) return;', guard, (v) => { guard = v; drawCode(); }),
      btn('เริ่มใหม่', () => { nav.reset(['Home']); con.clear(); clear(status); cv.active([]); }, 'sm ghost')),
      h('div', { class: 'btn-row', style: { marginBottom: '10px' } }, h('span', { class: 'dim', style: { fontSize: '.82rem' } }, 'ช่องทางย้อนกลับที่ไม่ส่งผลลัพธ์:'), btn('← AppBar', () => nav.tryPop('appbar'), 'sm'), btn('◁ ปุ่ม Back ของ Android', () => nav.tryPop('android'), 'sm'), btn('⟵ ปัดจากขอบ (iOS)', () => nav.tryPop('swipe'), 'sm'), killB),
      h('div', { class: 'vrow' }, ph.el, h('div', { class: 'grow vcol' }, codeBox, status, con.el)));
    drawCode();
    nav.reset(['Home']);
  });

  // ───────── 9.6 named routes lookup ─────────
  R('ch09.named', (body) => {
    const st = { cfg: 'ogr', name: '/detail', args: 'class' };
    const ARGS = {
      none: ['ไม่ส่ง arguments', 'null'],
      map: ["Map<String,String>", "{'itemId': 'Item-456', 'message': 'ข้อมูลผ่าน arguments'}"],
      map2: ["Map + 'count': 3", "{'itemId': 'Item-456', 'message': '…', 'count': 3}"],
      class: ['DetailArgs', "const DetailArgs(itemId: 'Item-456', message: '…')"],
    };
    const lanes = h('div', { class: 'nr-lanes' });
    const result = h('div');
    const steps = ['routes', 'onGenerateRoute', 'onUnknownRoute', 'error'];
    const boxes = {};
    const desc = {
      routes: () => st.cfg === 'map' ? "{ '/': HomeScreen, '/detail': DetailScreen (อ่าน args เอง) }" : "{ '/': HomeScreen }",
      onGenerateRoute: () => st.cfg === 'map' ? '(ไม่ได้กำหนด)' : "if (settings.name == '/detail' && args is DetailArgs) → MaterialPageRoute(DetailScreen(itemId, message)) else null",
      onUnknownRoute: () => st.cfg === 'map' ? '(ไม่ได้กำหนด)' : "หน้า 'ไม่พบหน้า'",
      error: () => 'Could not find a generator for route …',
    };
    steps.forEach((k) => { boxes[k] = h('div', { class: 'nr-box' }, h('div', { class: 'nr-k mono' }, k), h('div', { class: 'nr-d mono' })); lanes.appendChild(boxes[k]); });
    function paint() { steps.forEach((k) => { boxes[k].className = 'nr-box'; boxes[k].lastChild.textContent = desc[k](); }); clear(result); }
    async function go() {
      paint();
      const mark = async (k, cls) => { boxes[k].classList.add(cls); await sleep(420); };
      const show = (ok, t) => result.appendChild(h('div', { class: 'vt-res ' + (ok ? 'ok' : 'bad') }, t));
      // 1. routes
      const inRoutes = st.name === '/' || (st.cfg === 'map' && st.name === '/detail');
      await mark('routes', inRoutes ? 'hit' : 'miss');
      if (inRoutes) {
        if (st.name === '/') return show(true, 'เปิด HomeScreen');
        // detail reads ModalRoute args as Map<String,String>?
        if (st.args === 'none') return show(true, "DetailScreen แสดง 'No ID' — args เป็น null แล้วตกไปใช้ค่าเริ่มต้นอย่างเงียบๆ");
        if (st.args === 'map') return show(true, 'DetailScreen แสดง Item-456 ✓ (cast Map<String, String>? ผ่าน)');
        if (st.args === 'map2') return show(false, "TypeError: type '_Map<String, Object>' is not a subtype of type 'Map<String, String>?' in type cast — พังตอนรัน คอมไพเลอร์ไม่เตือน");
        return show(false, "TypeError: type 'DetailArgs' is not a subtype of type 'Map<String, String>?' in type cast");
      }
      if (st.cfg === 'map') { await mark('onGenerateRoute', 'skip'); await mark('onUnknownRoute', 'skip'); await mark('error', 'miss'); return show(false, `FlutterError: Could not find a generator for route RouteSettings("${st.name}", …) in the _WidgetsAppState.`); }
      const okGen = st.name === '/detail' && st.args === 'class';
      await mark('onGenerateRoute', okGen ? 'hit' : 'miss');
      if (okGen) return show(true, 'onGenerateRoute: args is DetailArgs ✓ → DetailScreen(itemId: args.itemId, message: args.message) — รับผ่าน constructor อีกครั้ง');
      await mark('onUnknownRoute', 'hit');
      return show(true, `หน้า “ไม่พบหน้า” (ไม่มีหน้าชื่อ ${st.name}) — แอปไม่พัง`);
    }
    body.append(
      h('div', { class: 'vctrl' }, h('span', { class: 'lbl' }, 'MaterialApp:'), seg([{ value: 'map', label: 'routes อย่างเดียว (อ่าน args เป็น Map)' }, { value: 'ogr', label: 'routes + onGenerateRoute + onUnknownRoute (ตำรา)' }], st.cfg, (v) => { st.cfg = v; paint(); })),
      h('div', { class: 'vctrl' }, h('span', { class: 'lbl' }, 'pushNamed:'), seg(['/', '/detail', '/settings'], st.name, (v) => { st.name = v; paint(); })),
      h('div', { class: 'vctrl' }, h('span', { class: 'lbl' }, 'arguments:'), seg(Object.keys(ARGS).map((k) => ({ value: k, label: ARGS[k][0] })), st.args, (v) => { st.args = v; paint(); }), btn('▶ Navigator.pushNamed', go, 'primary')),
      lanes, result);
    paint();
  });

  // ───────── 9.8 PopScope ─────────
  R('ch09.popscope', (body) => {
    const con = FR.Console.create({ title: 'Debug Console', compact: true });
    const ph = FR.Phone.create({ small: true, height: 380 });
    let dirty = false;
    const canPopP = h('span', { class: 'pill' });
    let nav;
    function upd() { canPopP.textContent = `canPop: ${!dirty}`; canPopP.className = 'pill ' + (dirty ? 'off' : 'on'); }
    async function confirmDiscard() {
      nav.stack.push({ name: 'Dialog', id: 999, resolve: () => {} }); nav.onChange && sp.draw(nav.stack);
      con.log('showDialog<bool>(…) → push route ของ dialog ขึ้น stack', 'sys');
      const v = await ph.dialog({ title: 'ทิ้งการแก้ไข?', body: 'ข้อความที่พิมพ์ไว้จะหายไป', actions: [{ label: 'แก้ต่อ', value: false }, { label: 'ทิ้ง', value: true }] });
      nav.stack.pop(); sp.draw(nav.stack);
      con.log(`dialog pop → ${v === null ? 'null (แตะนอกกรอบ) → ถือว่า false' : v}`, 'dim');
      return v ?? false;
    }
    nav = MiniNav(ph, {
      screens: {
        Home: (r, n) => ({ title: 'บันทึกของฉัน', body: FR.ui.center(FR.ui.text('NotesScreen'), FR.ui.btn('แก้ไขบันทึก', () => { dirty = false; upd(); n.push('Edit'); })) }),
        Edit: (r, n) => {
          const f = FR.ui.field({ label: 'บันทึก', hint: 'พิมพ์อะไรก็ได้' });
          f.input.addEventListener('input', () => { if (!dirty) { dirty = true; upd(); con.log('onChanged → setState(() => _dirty = true)', 'dim'); } });
          return {
            title: 'แก้ไขบันทึก', body: FR.ui.pad(f.el, FR.ui.text('PopScope(canPop: !_dirty, …)', 'dim')),
            canPop: () => !dirty,
            onPopInvoked: async (didPop) => {
              con.log(`onPopInvokedWithResult(didPop: ${didPop}, result: null)`, 'warn');
              if (didPop) return;
              const discard = await confirmDiscard();
              if (discard) { con.log('context.mounted ✓ → Navigator.pop(context)', 'ok'); dirty = false; upd(); n.pop(); }
            },
          };
        },
      },
      onBackAttempt: (ch, can) => {
        const name = { appbar: 'ลูกศรใน AppBar', android: 'ปุ่ม Back ของ Android', swipe: 'ปัดจากขอบ (iOS) / predictive back' }[ch];
        con.log(`พยายามย้อนกลับ: ${name}`);
        if (ch === 'swipe') { ph.screen.classList.remove('peek', 'nopeek'); void ph.screen.offsetWidth; ph.screen.classList.add(can ? 'peek' : 'nopeek'); con.log(can ? 'canPop = true → แสดงแอนิเมชันเผยหน้าก่อนหน้าได้ตั้งแต่เริ่มลาก' : 'canPop = false → ไม่เผยหน้าก่อนหน้า (รู้ล่วงหน้าก่อนนิ้วลาก)', can ? 'ok' : 'warn'); }
        if (can) con.log('pop ตามปกติ', 'ok');
      },
    });
    const sp = StackPanel(nav);
    upd();
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, canPopP, h('span', { class: 'dim', style: { fontSize: '.82rem' } }, 'ช่องทางย้อนกลับ:'), btn('← AppBar', () => nav.tryPop('appbar'), 'sm'), btn('◁ Back ของ Android', () => nav.tryPop('android'), 'sm'), btn('⟵ ปัดจากขอบ', () => nav.tryPop('swipe'), 'sm'), btn('เริ่มใหม่', () => { dirty = false; upd(); con.clear(); nav.reset(['Home', 'Edit']); }, 'sm ghost')),
      h('div', { class: 'vrow' }, ph.el, h('div', { class: 'grow vcol' }, sp.el, con.el)));
    nav.reset(['Home', 'Edit']);
  });

  // ───────── 9.11 cart with only ctor/args/pop ─────────
  R('ch09.cart', (body) => {
    const steps = [
      { title: 'เก็บตะกร้าไว้ที่ “หน้ารายการ” (หน้าล่างสุดที่อยู่ตลอด)', text: 'หน้ารายการถือ `List<Item> _cart` ใน State แล้วส่งต่อให้หน้าอื่นผ่าน constructor', apply: (s) => { s.hold = 'list'; s.edits = 1; } },
      { title: 'เปิดหน้ารายละเอียด: ส่ง `cartCount` ไปด้วย (constructor)', text: 'เพื่อให้มุมขวาบนแสดงตัวเลขได้ → แก้ constructor ของ DetailScreen + ทุกจุดที่ push ไปหน้านี้', apply: (s) => { s.path = ['list', 'detail']; s.hops = 1; s.edits += 2; } },
      { title: 'กด “เพิ่มลงตะกร้า” แล้วย้อนกลับ: ส่งผลลัพธ์ผ่าน `pop(item)`', text: 'หน้ารายการต้อง `await push` แล้ว `setState` เพิ่มลง `_cart` — แต่ถ้าผู้ใช้ปัดย้อนกลับเอง ผลเป็น `null`', apply: (s) => { s.path = ['detail', 'list']; s.hops = 1; s.edits += 2; } },
      { title: 'เปิดตะกร้าจากหน้ารายละเอียดโดยตรง', text: 'รายการ → รายละเอียด → ตะกร้า: ข้อมูลตะกร้าต้องเดินทาง **2 ทอด** ผ่านหน้ารายละเอียดที่ไม่ได้ใช้มันเอง (เป็นแค่ทางผ่าน) และถ้าลบของในตะกร้า ต้อง pop ผลกลับ 2 ทอดเช่นกัน', apply: (s) => { s.path = ['list', 'detail', 'cart']; s.hops = 2; s.edits += 3; } },
      { title: 'เพิ่มหน้าที่ 4 และ 5 ที่ต้องแสดงตัวเลขเดียวกัน', text: 'แต่ละหน้าต้องมี constructor param ใหม่ + ทุกจุดที่ push + จัดการผล pop กลับ — จำนวนจุดที่ต้องแก้โตตามจำนวนหน้าและเส้นทาง', apply: (s) => { s.pages = 5; s.path = ['list', 'detail', 'cart', 'p4', 'p5']; s.hops = 4; s.edits += 6; } },
      { title: 'บทที่ 10 เปิดด้วยปัญหานี้พอดี', text: 'ถ้ามี “ที่เก็บกลาง” ที่ทุกหน้าอ่านได้ตรงๆ แต่ละหน้าแก้แค่จุดเดียว (อ่านจากที่เก็บกลาง) → [[10.1]]', apply: (s) => { s.provider = true; } },
    ];
    const diag = h('div', { class: 'cart-diag' });
    const meters = h('div', { class: 'vkv' });
    const nodes = { list: 'รายการสินค้า', detail: 'รายละเอียด', cart: 'ตะกร้า', p4: 'หน้า 4', p5: 'หน้า 5' };
    const stp = FR.Stepper.create({
      steps, initial: () => ({ pages: 3, path: [], hops: 0, edits: 0, hold: null, provider: false }),
      draw: (s) => {
        clear(diag);
        Object.keys(nodes).slice(0, s.pages).forEach((k) => {
          diag.appendChild(h('div', { class: 'cart-node' + (s.path.includes(k) ? ' on' : '') + (s.hold === k ? ' hold' : '') }, h('div', null, nodes[k]), h('div', { class: 'cart-badge' }, '🛒 ?'), s.hold === k ? h('div', { class: 'dim', style: { fontSize: '.7rem' } }, 'ถือ _cart') : null));
        });
        if (s.provider) diag.appendChild(h('div', { class: 'cart-store' }, '🏪 ที่เก็บกลาง (Provider) — ทุกหน้าอ่านจากที่นี่'));
        clear(meters);
        meters.append(h('span', { class: 'k' }, 'ทอดที่ข้อมูลต้องเดินทาง'), h('span', { class: 'v' }, String(s.hops)), h('span', { class: 'k' }, 'จุดที่ต้องแก้ (สะสม โดยประมาณ)'), h('span', { class: 'v chg' }, String(s.edits)));
      },
    });
    body.append(diag, meters, stp.el);
    return { destroy: () => stp.destroy() };
  });

  // ───────── Lab ─────────
  R('ch09.lab', (body) => {
    let ex = 3;
    const con = FR.Console.create({ title: 'Debug Console', compact: true });
    const ph = FR.Phone.create({ small: true, height: 360 });
    const U = FR.ui;
    const nav = MiniNav(ph, {
      screens: {
        Home: (r, n) => ({ title: 'หน้าหลัก', body: U.center(U.btn('ไปที่รายละเอียด', async () => {
          if (ex === 1) { con.log('Navigator.push(…DetailScreen())'); n.push('Detail'); }
          else if (ex === 2) { con.log("Navigator.push(…DetailScreen(message: 'ข้อมูลส่งมาจากหน้าหลัก!'))"); n.push('Detail', { message: 'ข้อมูลส่งมาจากหน้าหลัก!' }); }
          else if (ex === 3) {
            con.log('final result = await Navigator.push(…)');
            const result = await n.push('Detail', { message: 'ข้อมูลส่งมาจากหน้าหลัก!' });
            con.log('if (context.mounted) ✓');
            ph.snack(result != null && typeof result === 'string' ? 'ผลลัพธ์: ' + result : 'ไม่มีผลลัพธ์ส่งกลับมา');
          } else if (ex === 4) { con.log('Navigator.pushNamed(context, DetailScreen.routeName)'); n.push('Detail', { named: true }); }
          else { con.log("Navigator.pushNamed(context, '/detail', arguments: {'id': 'ARG-789', 'title': 'ข้อมูลจาก Named Route Args'})"); n.push('Detail', { named: true, map: { id: 'ARG-789', title: 'ข้อมูลจาก Named Route Args' } }); }
        })) }),
        Detail: (r, n) => {
          const a = r.args || {};
          const title = a.map ? 'ไอเท็ม: ' + a.map.id : a.named ? 'หน้ารายละเอียด (Named)' : 'หน้ารายละเอียด';
          const text = a.map ? 'ได้รับ: ' + a.map.title : a.named ? 'เนื้อหาหน้ารายละเอียด' : a.message || 'รายละเอียดอยู่ที่นี่';
          return { title, body: U.center(U.text(text), U.btn('ย้อนกลับ', () => { if (ex === 3) { con.log("Navigator.pop(context, 'สำเร็จ! ข้อมูลจากรายละเอียด')"); n.pop('สำเร็จ! ข้อมูลจากรายละเอียด'); } else { con.log('Navigator.pop(context)'); n.pop(); } }, 'tonal')) };
        },
      },
    });
    const s = seg([1, 2, 3, 4, 5].map((i) => ({ value: i, label: 'แบบฝึกหัด ' + i })), ex, (v) => { ex = v; con.clear(); nav.reset(['Home']); });
    body.append(h('div', { class: 'vctrl' }, s), h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, h('span', { class: 'dim', style: { fontSize: '.82rem' } }, 'ลองย้อนกลับด้วยระบบ (ผลเป็น null):'), btn('◁ Back ของ Android', () => nav.tryPop('android'), 'sm')), h('div', { class: 'vrow' }, ph.el, h('div', { class: 'grow' }, con.el)));
    nav.reset(['Home']);
  });
})();
