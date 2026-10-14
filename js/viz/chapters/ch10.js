/* Chapter 10 visualizations — Provider intro */
(function () {
  'use strict';
  const { h, clear, sleep, flash, seg, btn, toggle } = FR.util;
  const md = (s) => FR.markup.inline(s);
  const R = FR.viz.register;

  // ───────── 10.1 prop drilling vs Provider ─────────
  R('ch10.drill', (body, props) => {
    let mode = props.mode || 'drill';
    const box = h('div');
    const stats = h('div', { class: 'vkv' });
    const con = FR.Console.create({ title: 'สิ่งที่เกิดขึ้น', compact: true });
    let tv, cart = 0;
    function spec() {
      if (mode === 'drill') return { id: 'app', label: 'MyApp', kind: 'stateless', children: [
        { id: 'mat', label: 'MaterialApp', kind: 'system', children: [
          { id: 'shop', label: '_ShopHomeState  (List<Item> _cart)', kind: 'stateful', meta: `_cart = ${cart} ชิ้น`, children: [
            { id: 'bar', label: 'AppBar', kind: 'system', children: [{ id: 'badge', label: 'CartBadge(count)', kind: 'leaf', meta: `count: ${cart}` }] },
            { id: 'list', label: 'ProductList(cart, onAdd)', kind: 'stateless', note: 'ทางผ่าน: ไม่ได้ใช้เอง', children: [
              { id: 'card', label: 'ProductCard(cart, onAdd)', kind: 'stateless', note: 'ทางผ่าน: ไม่ได้ใช้เอง', children: [
                { id: 'img', label: 'Image', kind: 'leaf', const: true },
                { id: 'add', label: 'AddButton(onAdd)', kind: 'leaf' }] }] }] }] }] };
      return { id: 'prov', label: 'ChangeNotifierProvider<CartProvider>', kind: 'provider', meta: `items: ${cart} ชิ้น`, children: [
        { id: 'app', label: 'MyApp', kind: 'stateless', children: [
          { id: 'mat', label: 'MaterialApp', kind: 'system', children: [
            { id: 'shop', label: 'ShopHome', kind: 'stateless', children: [
              { id: 'bar', label: 'AppBar', kind: 'system', children: [{ id: 'badge', label: 'CartBadge  → context.watch<CartProvider>()', kind: 'leaf', meta: `count: ${cart}` }] },
              { id: 'list', label: 'ProductList', kind: 'stateless', children: [
                { id: 'card', label: 'ProductCard', kind: 'stateless', children: [
                  { id: 'img', label: 'Image', kind: 'leaf', const: true },
                  { id: 'add', label: 'AddButton  → context.read<CartProvider>().add()', kind: 'leaf' }] }] }] }] }] }] };
    }
    function drawStats(rebuilt) {
      clear(stats);
      const pass = mode === 'drill' ? 2 : 0;
      stats.append(h('span', { class: 'k' }, 'ชั้นที่รับข้อมูลแค่เพื่อส่งต่อ'), h('span', { class: 'v' + (pass ? ' chg' : '') }, pass ? `${pass} ชั้น (ProductList, ProductCard)` : '0'),
        h('span', { class: 'k' }, 'วิดเจ็ตที่ build ใหม่เมื่อกดเพิ่ม'), h('span', { class: 'v' }, rebuilt == null ? '—' : String(rebuilt)));
    }
    function build() { clear(box); tv = FR.Tree.create(box, spec(), { compact: true }); drawStats(); if (mode === 'drill') { tv.arrow('shop', 'badge', 'data', 'count'); tv.arrow('shop', 'add', 'data', 'cart, onAdd ↓↓'); } }
    async function add() {
      tv.clearArrows();
      if (mode === 'drill') {
        con.log('AddButton เรียก onAdd(item)  — callback ที่ถูกส่งลงมา 3 ชั้น', 'flash');
        tv.arrow('add', 'shop', 'callback', 'onAdd() ↑↑↑');
        await sleep(700);
        cart++;
        con.log('_ShopHomeState: setState(() { _cart.add(item); })');
        tv.setMeta('shop', `_cart = ${cart} ชิ้น`); tv.setMeta('badge', `count: ${cart}`);
        const ids = tv.subtree('shop');
        tv.rebuild(ids);
        drawStats(ids.length);
        con.log(`rebuild ทั้ง subtree ของ ShopHome: ${ids.length} วิดเจ็ต (ยกเว้น const)`, 'warn');
      } else {
        con.log('AddButton: context.read<CartProvider>().add(item)  — ไม่สมัครฟัง', 'flash');
        tv.arrow('add', 'prov', 'lookup', 'read → หา provider ด้านบน');
        await sleep(700);
        cart++;
        tv.setMeta('prov', `items: ${cart} ชิ้น`); tv.setMeta('badge', `count: ${cart}`);
        con.log('CartProvider: _items.add(item); notifyListeners();');
        tv.clearArrows(); tv.arrow('prov', 'badge', 'notify', 'แจ้งผู้ฟัง');
        tv.pulse('prov', 'pl');
        tv.rebuild(['badge']);
        drawStats(1);
        con.log('rebuild เฉพาะ CartBadge (ตัวเดียวที่ watch)', 'ok');
      }
    }
    const s = seg([{ value: 'drill', label: 'setState + ยก state ขึ้น' }, { value: 'prov', label: 'Provider' }], mode, (v) => { mode = v; cart = 0; con.clear(); build(); });
    body.append(h('div', { class: 'vctrl' }, s, btn('🛒 กดเพิ่มลงตะกร้าที่ AddButton', add, 'primary')), box, h('div', { class: 'tv-legend' }, h('span', { class: 'l-ok' }, 'ข้อมูลลง'), h('span', { class: 'l-rb' }, 'callback ขึ้น / build ใหม่'), h('span', { class: 'l-pl' }, 'notify'), h('span', { class: 'l-lk' }, 'ค้นหา provider')), h('div', { class: 'vrow', style: { marginTop: '8px' } }, h('div', { class: 'grow' }, FR.Panel('ตัวเลข', stats)), h('div', { class: 'grow' }, con.el)));
    build();
    return { setMode(m) { s.set(m); mode = m; cart = 0; build(); } };
  });

  // ───────── 10.3 API picker: who listens, who rebuilds ─────────
  R('ch10.api', (body) => {
    let api = 'watch';
    const state = { name: 'ต้นกล้า', likes: 0 };
    const box = h('div');
    const info = h('div', { class: 'vnote' });
    const con = FR.Console.create({ title: 'build() ที่ถูกเรียก', compact: true });
    let tv;
    const DESC = {
      watch: ['`context.watch<UserProvider>()` ใน build ของ ProfileScreen', 'สมัครฟัง **ทั้งเมธอด build** ของ ProfileScreen → ทุกการแจ้งเตือน ทั้งหน้าถูก build ใหม่ · ใช้ใน build เท่านั้น'],
      read: ['`context.read<UserProvider>().like()` ใน onPressed ของ LikeButton', '**ไม่สมัครฟังเลย** — ใช้เรียกเมธอดใน event handler · ถ้าใช้ใน build เพื่อแสดงค่า หน้าจอจะไม่อัปเดต (ค่าค้าง)'],
      consumer: ['`Consumer<UserProvider>(builder: …)` ห่อเฉพาะ LikesText', 'ฟัง **เฉพาะกิ่งที่ห่อ** → แจ้งเตือนเมื่อไรก็ build แค่ builder ของ Consumer'],
      select: ['`context.select<UserProvider, String>((u) => u.name)` ใน NameText', 'ฟัง **เฉพาะค่าที่เลือก** → build ใหม่เมื่อ name เปลี่ยนเท่านั้น likes เปลี่ยนไม่สะเทือน'],
    };
    function spec() {
      const listen = { watch: 'screen', read: null, consumer: 'cons', select: 'name' }[api];
      return { id: 'prov', label: 'ChangeNotifierProvider<UserProvider>', kind: 'provider', meta: `name: ${state.name} · likes: ${state.likes}`, children: [
        { id: 'screen', label: 'ProfileScreen' + (api === 'watch' ? '  (watch ใน build)' : ''), kind: 'stateless', children: [
          { id: 'col', label: 'Column', kind: 'leaf', children: [
            { id: 'avatar', label: 'Avatar', kind: 'leaf', const: true },
            { id: 'name', label: api === 'select' ? 'NameText  (select → name)' : 'NameText', kind: api === 'select' ? 'selector' : 'leaf' },
            api === 'consumer' ? { id: 'cons', label: 'Consumer<UserProvider>', kind: 'consumer', children: [{ id: 'likes', label: 'LikesText', kind: 'leaf' }] } : { id: 'likes', label: 'LikesText', kind: 'leaf' },
            { id: 'btn', label: api === 'read' ? 'LikeButton  (read ใน onPressed)' : 'LikeButton', kind: 'leaf' }] }] }], _listen: listen };
    }
    function build() {
      clear(box); con.clear();
      const sp = spec();
      tv = FR.Tree.create(box, sp, { compact: true });
      if (sp._listen) { tv.mark(sp._listen, 'listen'); }
      info.innerHTML = '<b>' + md(DESC[api][0]) + '</b><br>' + md(DESC[api][1]);
    }
    function change(field) {
      const prev = state.name;
      if (field === 'likes') state.likes++; else state.name = state.name === 'ต้นกล้า' ? 'ต้นกล้า 2' : 'ต้นกล้า';
      tv.setMeta('prov', `name: ${state.name} · likes: ${state.likes}`);
      tv.pulse('prov', 'pl');
      con.sep(`notifyListeners() (${field} เปลี่ยน)`);
      let ids = [];
      if (api === 'watch') ids = tv.subtree('screen');
      else if (api === 'consumer') ids = tv.subtree('cons');
      else if (api === 'select') ids = field === 'name' ? tv.subtree('name') : [];
      if (ids.length) { tv.rebuild(ids); ids.forEach((i) => con.log('build: ' + tv.find(i).label.split('  ')[0], 'flash')); }
      else con.log(api === 'read' ? 'ไม่มีใครฟัง → ไม่มีอะไร build ใหม่ (ถ้าจอแสดงค่าผ่าน read จะค้าง)' : 'select: ค่าที่เลือก (name) ไม่เปลี่ยน → ไม่ build', 'dim');
    }
    const s = seg([{ value: 'watch', label: 'watch' }, { value: 'read', label: 'read' }, { value: 'consumer', label: 'Consumer' }, { value: 'select', label: 'select' }], api, (v) => { api = v; build(); });
    body.append(h('div', { class: 'vctrl' }, h('span', { class: 'lbl' }, 'วิธีเข้าถึง:'), s), info,
      h('div', { class: 'btn-row', style: { margin: '8px 0' } }, btn('❤ likes เปลี่ยน', () => change('likes'), 'primary sm'), btn('✎ name เปลี่ยน', () => change('name'), 'sm')),
      h('div', { class: 'vrow' }, h('div', { class: 'grow' }, box, h('div', { class: 'tv-legend' }, h('span', null, '👂 = สมัครฟังตรงนี้'), h('span', { class: 'l-rb' }, 'build ใหม่'))), h('div', { style: { flex: '0 1 280px' } }, con.el)));
    build();
    return { setMode(m) { s.set(m); api = m; build(); } };
  });

  // ───────── 10.4 ChangeNotifier internals + two displays ─────────
  R('ch10.notifier', (body) => {
    let count = 0, forget = false, readInBuild = false;
    const listeners = h('div', { class: 'cn-list' });
    const countV = h('span', { class: 'v' }, '0');
    const bell = h('span', { class: 'cn-bell' }, '🔔');
    const model = h('div', { class: 'cn-model' },
      h('div', { class: 'mono cn-h' }, 'CounterProvider extends ChangeNotifier'),
      h('div', { class: 'vkv' }, h('span', { class: 'k' }, '_count'), countV),
      h('div', { class: 'cn-lh' }, '_listeners (วิดเจ็ตที่ watch อยู่):', bell), listeners);
    const con = FR.Console.create({ title: 'Debug Console', compact: true });
    const ph = FR.Phone.create({ title: 'Provider Counter', small: true, height: 330 });
    const main = FR.ui.text('0', 'big');
    const disp = FR.ui.text('ค่าจาก Provider: 0');
    ph.setBody(FR.ui.center(FR.ui.text('You have pushed the button this many times:', 'dim'), main, disp));
    const W = [
      { id: 'home', label: '_MyHomePageState.build', el: main, fmt: (c) => String(c) },
      { id: 'disp', label: 'CounterDisplay.build', el: disp, fmt: (c) => 'ค่าจาก Provider: ' + c },
    ];
    const rows = {};
    function drawListeners() {
      clear(listeners);
      W.forEach((w) => {
        const subscribed = !(readInBuild && w.id === 'disp');
        rows[w.id] = h('div', { class: 'cn-l' + (subscribed ? '' : ' off') }, subscribed ? '● ' + w.label : '○ ' + w.label + ' (ใช้ read ใน build → ไม่ได้ลงทะเบียน)');
        listeners.appendChild(rows[w.id]);
      });
      listeners.appendChild(h('div', { class: 'cn-l off' }, '○ FloatingActionButton (ใช้ read ใน onPressed → ไม่ต้องฟัง ถูกต้อง)'));
    }
    drawListeners();
    async function increment() {
      con.log('onPressed: () => context.read<CounterProvider>().increment()');
      count++; countV.textContent = count; flash(countV);
      con.log(`_count++ → ${count}`);
      if (forget) { con.log('(ลืม notifyListeners) → ไม่มีใครรู้ว่าค่าเปลี่ยน จอค้าง', 'err'); return; }
      con.log('notifyListeners() 🔔');
      flash(bell, 'ring', 700);
      await sleep(250);
      W.forEach((w) => {
        const subscribed = !(readInBuild && w.id === 'disp');
        if (!subscribed) return;
        flash(rows[w.id], 'flash');
        w.el.textContent = w.fmt(count); flash(w.el);
        if (w.id === 'disp') con.log(`CounterDisplay rebuild: ${count}`, 'flash');
      });
    }
    ph.setFab('+', increment);
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '10px' } },
      toggle('ลืมเรียก notifyListeners()', forget, (v) => { forget = v; }),
      toggle('CounterDisplay ใช้ read แทน watch ใน build (ผิด)', readInBuild, (v) => { readInBuild = v; drawListeners(); }),
      btn('รีเซ็ต', () => { count = 0; countV.textContent = '0'; main.textContent = '0'; disp.textContent = 'ค่าจาก Provider: 0'; con.clear(); }, 'sm ghost')),
      h('div', { class: 'vrow' }, ph.el, h('div', { class: 'grow vcol' }, model, con.el)));
  });

  // ───────── 10.5 pubspec ─────────
  R('ch10.pubspec', (body) => {
    const V = {
      ok: { label: 'ถูกต้อง', yaml: 'dependencies:\n  flutter:\n    sdk: flutter\n  provider: ^6.1.2 # ตรวจสอบเวอร์ชันล่าสุดบน pub.dev เสมอ', out: ['Resolving dependencies...', '+ provider 6.1.2', '+ nested 1.0.0', 'Changed 2 dependencies!', 'Got dependencies!'], ok: true },
      under: { label: 'เยื้องเข้าไปใต้ flutter', yaml: 'dependencies:\n  flutter:\n    sdk: flutter\n    provider: ^6.1.2', out: ['Error on line 4, column 5 of pubspec.yaml: A dependency may only have one source.', '  provider: ^6.1.2', '  ^^^^^^^^'], ok: false },
      root: { label: 'ไม่เยื้องเลย', yaml: 'dependencies:\n  flutter:\n    sdk: flutter\nprovider: ^6.1.2', out: ['(provider กลายเป็น key ระดับบนสุด ไม่ใช่ dependency)', "Error: Couldn't resolve the package 'provider' in 'package:provider/provider.dart'."], ok: false },
    };
    let k = 'ok';
    const ed = h('div'); const out = h('div');
    function render() {
      clear(ed); clear(out);
      ed.appendChild(FR.CodeView.create({ src: V[k].yaml, lang: 'yaml', title: 'pubspec.yaml' }).el);
      out.appendChild(h('div', { class: 'con' }, h('div', { class: 'con-hd' }, h('span', null, '$ flutter pub get')), h('div', { class: 'con-body', style: { height: 'auto', minHeight: '90px' } }, V[k].out.map((l) => h('div', { class: 'con-ln ' + (V[k].ok ? 'ok' : 'err') }, h('span', { class: 't' }, l))))));
    }
    body.append(h('div', { class: 'vctrl' }, seg(Object.keys(V).map((x) => ({ value: x, label: V[x].label })), k, (v) => { k = v; render(); })), h('div', { class: 'vrow' }, h('div', { class: 'grow' }, ed), h('div', { class: 'grow' }, out)),
      h('div', { class: 'vnote', style: { marginTop: '6px' }, html: md('YAML ใช้การ **เยื้องด้วยช่องว่าง** บอกโครงสร้าง — `provider` ต้องอยู่ระดับเดียวกับ `flutter` (ลูกของ `dependencies`) · ข้อความ error ในภาพเป็นตัวอย่างที่ใกล้เคียงของจริง') }));
    render();
  });

  // ───────── Lab: refactor stepper (before → after) ─────────
  R('ch10.refactor', (body) => {
    const BEFORE = `class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0; // State เดิมที่ใช้ setState

  void _incrementCounter() {
    setState(() {
      _counter++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text('You have pushed the button this many times:'),
            Text(
              '$_counter', // แสดง state เดิม
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter, // เรียกใช้ setState เดิม
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ),
    );
  }
}`;
    const AFTER = `// lib/providers/counter_provider.dart
import 'package:flutter/foundation.dart';

class CounterProvider extends ChangeNotifier {
  int _count = 0;
  int get count => _count;

  void increment() {
    _count++;
    notifyListeners(); // แจ้งเตือน listeners ว่า state เปลี่ยนแปลง!
  }
}

// lib/main.dart
void main() {
  runApp(
    ChangeNotifierProvider( // ห่อ MyApp ด้วย Provider
      create: (context) => CounterProvider(), // สร้างอินสแตนซ์ของ Provider
      child: const MyApp(), // MyApp เป็น child
    ),
  );
}

class _MyHomePageState extends State<MyHomePage> {
  // ลบ: int _counter = 0;
  // ลบ: void _incrementCounter() { ... }

  @override
  Widget build(BuildContext context) {
    // ใช้ context.watch เพื่อรับค่าและ listen การเปลี่ยนแปลง
    final counterValue = context.watch<CounterProvider>().count;
    return Scaffold(
      // ...
            Text(
              '$counterValue', // แสดงค่าจาก Provider
              style: Theme.of(context).textTheme.headlineMedium,
            ),
      // ...
      floatingActionButton: FloatingActionButton(
        // ใช้ context.read เพื่อเรียกเมธอดโดยไม่ต้อง listen
        onPressed: () => context.read<CounterProvider>().increment(),
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ),
    );
  }
}`;
    const left = FR.CodeView.create({ src: BEFORE, lang: 'dart', title: 'ก่อน: setState', maxHeight: '420px' });
    const right = FR.CodeView.create({ src: AFTER, lang: 'dart', title: 'หลัง: Provider', maxHeight: '420px' });
    const steps = [
      { title: 'ส่วนที่ 1: เพิ่ม `provider: ^6.1.2` ใน pubspec แล้ว `flutter pub get`', text: 'ยังไม่แตะโค้ด — แค่ติดตั้งแพ็กเกจ', L: [], Rr: [] },
      { title: 'ส่วนที่ 2: ย้าย state `_counter` → `_count` ใน CounterProvider', text: 'state เป็น private (`_count`) + getter สาธารณะ (`count`) — คนนอกอ่านได้แต่แก้ตรงๆ ไม่ได้', L: ['int _counter = 0;'], Rr: ['int _count = 0;', 'int get count => _count;'] },
      { title: 'ส่วนที่ 2 (ต่อ): ย้ายตรรกะ `_incrementCounter` → `increment()` + `notifyListeners()`', text: '**สำคัญ**: setState หายไป แทนที่ด้วย notifyListeners() — คนที่บอกว่า “ข้อมูลเปลี่ยน” ย้ายจาก State ไปที่ model', L: [{ from: 'void _incrementCounter() {', to: '_counter++;' }], Rr: ['void increment() {', '_count++;', 'notifyListeners();'] },
      { title: 'ส่วนที่ 3: ห่อ `MyApp` ด้วย `ChangeNotifierProvider` ใน `main()`', text: '`create` คืนอินสแตนซ์ **ใหม่** — Provider ถือมันไว้และ dispose ให้เองเมื่อถูกถอดออก', L: [], Rr: ['ChangeNotifierProvider(', 'create: (context) => CounterProvider(),', 'child: const MyApp(),'] },
      { title: 'ส่วนที่ 4: อ่านค่าด้วย `context.watch` ใน build', text: 'watch ค้นหา CounterProvider ที่ใกล้ที่สุดด้านบน + ทำให้ `_MyHomePageState` build ใหม่เมื่อ notifyListeners()', L: ["'$_counter', // แสดง state เดิม"], Rr: ['final counterValue = context.watch<CounterProvider>().count;', "'$counterValue', // แสดงค่าจาก Provider"] },
      { title: 'ส่วนที่ 5: กดปุ่มด้วย `context.read` ใน onPressed', text: 'ปุ่มไม่ต้อง rebuild เมื่อค่าเปลี่ยน แค่ต้องเรียกเมธอดครั้งเดียว', L: ['onPressed: _incrementCounter,'], Rr: ['onPressed: () => context.read<CounterProvider>().increment(),'] },
      { title: 'ส่วนที่ 6–7: Hot Restart แล้วทดสอบ + เพิ่ม CounterDisplay', text: 'ต้อง **Hot Restart** เพราะแก้ `main()` · ค่าแสดงสองที่อัปเดตพร้อมกัน = state ส่วนกลางเพียงแห่งเดียว ([[10.4]])', L: [], Rr: [] },
    ];
    const st = FR.Stepper.create({ steps, draw: (_, s) => { left.active(s ? s.L : []); right.active(s ? s.Rr : []); } });
    body.append(h('div', { class: 'two' }, left.el, right.el), st.el);
    return { destroy: () => st.destroy() };
  });
})();
