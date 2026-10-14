/* Chapter 11 visualizations — Consumer, select/Selector, ladder, measuring, swimlane, MultiProvider, splitting */
(function () {
  'use strict';
  const { h, clear, sleep, flash, seg, btn, toggle } = FR.util;
  const md = (s) => FR.markup.inline(s);
  const R = FR.viz.register;

  // ───────── 11.1 feed: watch per post vs Consumer around count ─────────
  R('ch11.feed', (body) => {
    let mode = 'watch';
    let rebuilt = 0;
    const posts = [['ต้นกล้า', 'ไปทะเลมา 🌊', 12], ['ใบเฟิร์น', 'ทำขนมครั้งแรก 🍰', 8], ['นภา', 'แมวที่บ้าน 🐈', 30], ['ภูผา', 'ปีนเขาสำเร็จ ⛰', 5]];
    const feed = h('div', { class: 'feed' });
    const meter = FR.Meter.create('วิดเจ็ตที่ build ใหม่ (สะสม)', { max: 60, kind: 'flash' });
    meter.set(0, 60, '0');
    function draw() {
      clear(feed);
      posts.forEach((p, i) => {
        const parts = [h('div', { class: 'fp-av' }, p[0][0]), h('div', { class: 'fp-name' }, p[0]), h('div', { class: 'fp-img' }, '🖼'), h('div', { class: 'fp-text' }, p[1])];
        const cnt = h('span', { class: 'fp-cnt' + (mode === 'consumer' ? ' cons' : '') }, `❤ ${p[2]}`);
        const like = btn('ถูกใจ', () => {
          p[2]++; cnt.textContent = `❤ ${p[2]}`;
          const targets = mode === 'watch' ? [...parts, cnt, like, card] : [cnt];
          targets.forEach((t) => flash(t, 'rbf', 1000));
          rebuilt += targets.length; meter.set(Math.min(rebuilt, 60), 60, String(rebuilt));
        }, 'sm');
        const card = h('div', { class: 'fp-card' + (mode === 'watch' ? ' watching' : '') }, h('div', { class: 'fp-head' }, parts[0], parts[1], mode === 'watch' ? h('span', { class: 'fp-ear' }, '👂 watch') : null), parts[2], parts[3], h('div', { class: 'fp-foot' }, like, mode === 'consumer' ? h('span', { class: 'fp-ear' }, '👂 Consumer') : null, cnt));
        feed.appendChild(card);
      });
    }
    const s = seg([{ value: 'watch', label: 'watch ที่วิดเจ็ตหลักของโพสต์' }, { value: 'consumer', label: 'Consumer ห่อเฉพาะตัวนับ' }], mode, (v) => { mode = v; rebuilt = 0; meter.set(0, 60, '0'); draw(); });
    body.append(h('div', { class: 'vctrl' }, s), feed, h('div', { style: { marginTop: '10px' } }, meter.el));
    draw();
    return { setMode(m) { s.set(m); mode = m; draw(); } };
  });

  // ───────── 11.2 rebuild scope: watch / Consumer / Consumer+child ─────────
  R('ch11.scope', (body) => {
    let mode = 'watch', n = 0;
    const box = h('div');
    const con = FR.Console.create({ title: 'Debug Console (print ในโค้ดของตำรา)' });
    let tv;
    function spec() {
      if (mode === 'watch') return { id: 'w', label: 'UserProfileWidget  (watch ใน build)', kind: 'stateless', children: [{ id: 'col', label: 'Column', kind: 'leaf', children: [
        { id: 'av', label: 'CircleAvatar(profileImageUrl)', kind: 'leaf' }, { id: 'real', label: 'Text(realName)', kind: 'leaf' }, { id: 'nick', label: "Text('ชื่อเล่น: …')", kind: 'leaf' }] }] };
      const consumer = { id: 'cons', label: 'Consumer<UserProvider>', kind: 'consumer', children: mode === 'child'
        ? [{ id: 'row', label: 'Row', kind: 'leaf', children: [{ id: 'nick', label: "Text('ชื่อเล่น: …')", kind: 'leaf' }, { id: 'badge', label: 'ExpensiveBadge (ส่งทาง child:)', kind: 'stateless', const: true }] }]
        : [{ id: 'nick', label: "Text('ชื่อเล่น: …')", kind: 'leaf' }] };
      return { id: 'w', label: 'UserProfileWidgetEfficient', kind: 'stateless', children: [{ id: 'col', label: 'Column', kind: 'leaf', children: [
        { id: 'av', label: 'CircleAvatar(read → profileImageUrl)', kind: 'leaf' }, { id: 'real', label: 'Text(read → realName)', kind: 'leaf' }, consumer] }] };
    }
    function build() {
      clear(box); con.clear(); n = 0;
      tv = FR.Tree.create(box, spec(), { compact: true });
      tv.rebuild(tv.subtree('w', { skip: () => false }));
      con.log(mode === 'watch' ? 'UserProfileWidget build() ถูกเรียก!' : 'UserProfileWidgetEfficient build() ถูกเรียก!');
      if (mode !== 'watch') con.log(mode === 'child' ? 'builder ทำงาน แต่ ExpensiveBadge ไม่ถูกสร้างใหม่' : 'Consumer สำหรับ "ชื่อเล่น" ถูกเรียก!');
      if (mode === 'child') con.log('ExpensiveBadge build() ถูกเรียก!  (ครั้งเดียวตอน Consumer ถูกสร้าง)', 'dim');
      con.sep('กด FAB → changeNickname()');
    }
    function change() {
      n++;
      tv.setMeta('nick', `ต้นกล้า คนที่ ${n}`);
      if (mode === 'watch') { tv.rebuild(tv.subtree('w')); con.log('UserProfileWidget build() ถูกเรียก!', 'flash'); }
      else if (mode === 'consumer') { tv.rebuild(tv.subtree('cons')); con.log('Consumer สำหรับ "ชื่อเล่น" ถูกเรียก!', 'flash'); }
      else { tv.rebuild(tv.subtree('cons')); con.log('builder ทำงาน แต่ ExpensiveBadge ไม่ถูกสร้างใหม่', 'flash'); }
    }
    const s = seg([{ value: 'watch', label: 'context.watch (ทั้งวิดเจ็ต)' }, { value: 'consumer', label: 'Consumer (เฉพาะชื่อเล่น)' }, { value: 'child', label: 'Consumer + child' }], mode, (v) => { mode = v; build(); });
    body.append(h('div', { class: 'vctrl' }, s, btn('✎ FAB: changeNickname()', change, 'primary')), h('div', { class: 'vrow' }, h('div', { class: 'grow' }, box, h('div', { class: 'tv-legend' }, h('span', { class: 'l-rb' }, 'build ×n = ถูกเรียกกี่ครั้ง'), h('span', { class: 'l-ok' }, 'const / child = ไม่สร้างใหม่'))), h('div', { style: { flex: '0 1 340px' } }, con.el)));
    build();
    return { setMode(m) { s.set(m); mode = m; build(); } };
  });

  // ───────── 11.3 select / Selector + equality lab ─────────
  R('ch11.select', (body) => {
    const st = { nickname: 'ต้นกล้า', realName: 'ณัฐพงษ์ ใจดี', profileImageUrl: 'pic1.jpg' };
    const counts = { cons: 0, sel: 0, selw: 0 };
    const vals = {};
    const box = h('div', { class: 'sel-grid' });
    const W = [
      ['cons', 'Consumer<UserProvider>', 'builder ทำงานทุก notifyListeners()'],
      ['sel', 'context.select((p) => p.nickname)', 'build เมื่อ nickname เปลี่ยนเท่านั้น'],
      ['selw', 'Selector<UserProvider, String>', 'เหมือน select แต่เป็นวิดเจ็ต (ตีกรอบเฉพาะส่วน)'],
    ];
    W.forEach(([k, t, d]) => {
      vals[k] = h('span', { class: 'sel-c' }, '0');
      box.appendChild(h('div', { class: 'sel-w', 'data-k': k }, h('div', { class: 'mono sel-t' }, t), h('div', { class: 'dim', style: { fontSize: '.76rem' } }, d), h('div', null, 'build ×', vals[k])));
    });
    const prov = h('div', { class: 'vkv' });
    function drawProv() { clear(prov); Object.entries(st).forEach(([k, v]) => prov.append(h('span', { class: 'k' }, k), h('span', { class: 'v' }, v))); }
    drawProv();
    function notify(field) {
      const prevNick = st.nickname;
      if (field === 'nickname') st.nickname = st.nickname === 'ต้นกล้า' ? 'ต้นกล้า 2' : 'ต้นกล้า';
      if (field === 'realName') st.realName = st.realName.endsWith('ดี') ? 'ณัฐพงษ์ ใจงาม' : 'ณัฐพงษ์ ใจดี';
      if (field === 'profileImageUrl') st.profileImageUrl = st.profileImageUrl === 'pic1.jpg' ? 'pic2.jpg' : 'pic1.jpg';
      drawProv();
      const hit = (k) => { counts[k]++; vals[k].textContent = counts[k]; flash(box.querySelector(`[data-k=${k}]`), 'rbf', 1000); };
      hit('cons');
      if (st.nickname !== prevNick) { hit('sel'); hit('selw'); }
    }
    // equality lab
    const EQ = {
      len: { label: 'items.length (int)', code: '(p) => p.items.length' },
      names: { label: 'map(name).toList() (List<String>)', code: '(p) => p.items.map((i) => i.name).toList()' },
      objs: { label: 'map(→ object ใหม่).toList()', code: '(p) => p.items.map((i) => ItemView(i.name)).toList()' },
      same: { label: 'p.items (ลิสต์เดิม แก้ไขในที่)', code: '(p) => p.items  // แต่ updateItem แก้ object เดิม' },
    };
    const ACT = { none: 'notify โดยไม่มีอะไรเปลี่ยน', rename: 'แก้ชื่อสินค้าชิ้นที่ 1' };
    let eqSel = 'names', eqAct = 'none';
    const eqOut = h('div', { class: 'eq-out' });
    function eqRun() {
      // book (==) semantics vs provider 6.x DeepCollectionEquality
      const r = {
        len: { none: [false, false], rename: [false, false] },
        names: { none: [true, false], rename: [true, true] },
        objs: { none: [true, true], rename: [true, true] },
        same: { none: [false, false], rename: [false, false] },
      }[eqSel][eqAct];
      clear(eqOut);
      const cell = (rb, why) => h('div', { class: 'eq-cell ' + (rb ? 'rb' : 'no') }, h('div', { class: 'eq-v' }, rb ? '↻ build ใหม่' : '— ไม่ build'), h('div', { class: 'eq-why', html: md(why) }));
      const whyBook = { len: 'int เทียบด้วย == ได้ตรงๆ', names: '`toList()` ได้ลิสต์ **ใหม่ทุกครั้ง** → `==` ของ List เทียบ “ตัวตน” → ไม่เท่ากันเสมอ', objs: 'object ใหม่ทุกครั้ง → ไม่เท่ากันเสมอ', same: 'ลิสต์ตัวเดิม → เท่ากันเสมอ' }[eqSel];
      const whyReal = { len: 'ตัวเลขเท่าเดิม (ชื่อเปลี่ยนแต่จำนวนไม่เปลี่ยน)', names: 'DeepCollectionEquality เทียบ **สมาชิกทีละตัว** → ชื่อเหมือนเดิมก็ไม่ build, ชื่อเปลี่ยนจึง build', objs: 'สมาชิกเป็น object ใหม่ที่ไม่ได้ override `==` → ไม่เท่ากันเสมอ → build ทุกครั้ง', same: '**กับดักใหม่**: object ตัวเดิมถูกแก้ในที่ (mutate) → เทียบแล้ว “เท่ากัน” → **ไม่ build ทั้งที่ข้อมูลเปลี่ยน**' }[eqSel];
      eqOut.append(h('div', { class: 'eq-col' }, h('div', { class: 'eq-h' }, 'ตามตำรา (เทียบด้วย ==)'), cell(r[0], whyBook)), h('div', { class: 'eq-col' }, h('div', { class: 'eq-h real' }, 'provider 6.x จริง (DeepCollectionEquality)'), cell(r[1], whyReal)));
    }
    const eqCode = h('code', null, EQ[eqSel].code);
    const s1 = seg(Object.keys(EQ).map((k) => ({ value: k, label: EQ[k].label })), eqSel, (v) => { eqSel = v; eqCode.textContent = EQ[v].code; eqRun(); });
    const s2 = seg(Object.keys(ACT).map((k) => ({ value: k, label: ACT[k] })), eqAct, (v) => { eqAct = v; eqRun(); });
    body.append(
      h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, h('span', { class: 'dim', style: { fontSize: '.82rem' } }, 'UserProvider เปลี่ยนฟิลด์:'), btn('nickname', () => notify('nickname'), 'primary sm'), btn('realName', () => notify('realName'), 'sm'), btn('profileImageUrl', () => notify('profileImageUrl'), 'sm')),
      h('div', { class: 'vrow' }, h('div', { style: { flex: '0 1 260px' } }, FR.Panel('UserProvider', prov)), h('div', { class: 'grow' }, box)),
      h('h4', null, 'ห้องทดลอง: selector คืนค่าอะไร → build ใหม่หรือไม่'),
      h('div', { class: 'vctrl' }, h('span', { class: 'lbl' }, 'selector:'), s1), h('div', { class: 'vctrl' }, h('span', { class: 'lbl' }, 'เหตุการณ์:'), s2),
      h('div', { class: 'vnote' }, 'context.select<ItemProvider, …>', eqCode), eqOut);
    eqRun();
  });

  // ───────── 11.4 ladder ─────────
  R('ch11.ladder', (body) => {
    const RUNGS = [
      ['read', 'context.read<T>()', 'ไม่รับฟังเลย', 'สั่งงานใน onPressed'],
      ['watch', 'context.watch<T>()', 'รับฟังทั้งเมธอด build', 'เกือบทั้งวิดเจ็ตขึ้นกับ state / วิดเจ็ตเล็ก'],
      ['consumer', 'Consumer<T>', 'รับฟังเฉพาะพื้นที่ที่ห่อ', 'แม่มีหลายชิ้น เปลี่ยนแค่บางชิ้น'],
      ['select', 'select / Selector', 'รับฟังเฉพาะค่าที่ระบุ', 'provider หลายฟิลด์ แจ้งบ่อยจากฟิลด์ที่ไม่สนใจ'],
    ];
    const ladder = h('div', { class: 'ladder' });
    RUNGS.forEach(([k, t, w, u], i) => ladder.appendChild(h('div', { class: 'rung', 'data-k': k }, h('div', { class: 'rg-i' }, String(i + 1)), h('div', null, h('div', { class: 'mono rg-t' }, t), h('div', { class: 'rg-w' }, w), h('div', { class: 'rg-u dim' }, 'ใช้เมื่อ: ' + u)))));
    const axis = h('div', { class: 'ladder-axis' }, h('span', null, '⬆ กว้าง · โค้ดง่าย'), h('span', null, '⬇ แคบ · โค้ดซับซ้อนขึ้น'));
    const sorter = FR.Sorter.create({
      buckets: RUNGS.map(([k, t]) => ({ id: k, label: t })),
      prompt: 'เลือกเครื่องมือที่ “พอดี” กับแต่ละสถานการณ์ (เริ่มจากตัวที่อ่านง่ายที่สุดที่ยังทำงานถูก):',
      items: [
        { t: 'ปุ่ม “เพิ่มลงตะกร้า” ที่แค่เรียก `cart.add(item)`', bucket: 'read', why: 'สั่งงานอย่างเดียว หน้าตาปุ่มไม่ขึ้นกับ state' },
        { t: 'หน้าโปรไฟล์เล็กๆ ที่ทุกบรรทัดมาจาก UserProvider', bucket: 'watch', why: 'เกือบทั้งวิดเจ็ตขึ้นกับ state และเล็กพอที่ตีกรอบไม่คุ้มความซับซ้อน' },
        { t: 'การ์ดสินค้าที่มีรูปใหญ่ ราคา คำอธิบาย แต่มีแค่ “จำนวนในตะกร้า” ที่เปลี่ยน', bucket: 'consumer', why: 'แม่มีหลายชิ้น เปลี่ยนแค่ชิ้นเดียว → ห่อเฉพาะชิ้นนั้น' },
        { t: 'AppBar แสดงชื่อผู้ใช้ ขณะที่ UserProvider แจ้งเตือนบ่อยเพราะตำแหน่ง GPS เปลี่ยนทุกวินาที', bucket: 'select', why: 'แจ้งบ่อยจากฟิลด์ที่วิดเจ็ตนี้ไม่สนใจ → เลือกเฉพาะ name' },
        { t: '`_saveForm()` ในหน้าแก้ไขที่เรียก `updateItem(...)` แล้ว pop', bucket: 'read', why: 'fire and forget ([[11.6]])' },
      ],
    });
    body.append(h('div', { class: 'vrow' }, h('div', { class: 'grow' }, ladder, axis)), h('div', { style: { marginTop: '12px' } }, sorter));
  });

  // ───────── 11.5 measuring (simulated DevTools) ─────────
  R('ch11.measure', (body) => {
    let mode = 'top', build = 'profile', printOn = false;
    const bars = h('div', { class: 'fb-bars' });
    const table = h('div');
    const note = h('div', { class: 'vnote' });
    function frameCost() {
      // simulated numbers for explanation only
      const base = mode === 'top' ? 11 : 3.5; // ms in profile
      const mult = build === 'debug' ? 3.2 : 1;
      const pr = printOn ? 4 : 0;
      return base * mult + pr;
    }
    function run() {
      clear(bars);
      const c = frameCost();
      for (let i = 0; i < 24; i++) {
        const v = Math.max(1, c + (Math.sin(i * 1.7) * c) / 6);
        const pct = Math.min(100, (v / 40) * 100);
        bars.appendChild(h('div', { class: 'fb-bar' + (v > 16 ? ' over' : '') , style: { height: pct + '%' }, title: v.toFixed(1) + ' ms' }));
      }
      const rows = mode === 'top'
        ? [['ItemListScreen', 1, 1], ['Consumer<ItemProvider> builder', 1, 25], ['ListView.builder', 1, 25], ['ListTile ×(แถวที่เห็น)', 12, 300], ['Image ×(แถวที่เห็น)', 12, 300]]
        : [['ItemListScreen', 0, 1], ['Selector (แถวที่แก้)', 1, 25], ['ListTile (แถวที่แก้)', 1, 25], ['Image', 0, 12]];
      clear(table);
      table.appendChild(h('table', { class: 'tg-t' }, h('thead', null, h('tr', null, h('th', null, 'Widget'), h('th', null, 'rebuild เฟรมล่าสุด'), h('th', null, 'รวมตั้งแต่เข้าหน้า'))), h('tbody', null, rows.map((r) => h('tr', null, h('td', null, r[0]), h('td', { class: 'num' }, String(r[1])), h('td', { class: 'num' }, String(r[2])))))));
      note.innerHTML = md(`เฟรมเฉลี่ย ≈ **${c.toFixed(1)} ms** ${c > 16 ? '→ เกินงบ 16 ms (60 fps) ผู้ใช้รู้สึกกระตุก' : '→ อยู่ในงบ 16 ms'} · ${build === 'debug' ? '⚠ โหมด debug ช้ากว่าความจริงหลายเท่า **อย่าใช้ตัวเลขนี้ตัดสิน**' : 'โหมด profile ใกล้เคียงของจริง'}${printOn ? ' · print ทุกเฟรมเพิ่มต้นทุนเอง' : ''} _(ตัวเลขจำลองเพื่ออธิบาย)_`);
    }
    body.append(
      h('div', { class: 'vctrl' }, h('span', { class: 'lbl' }, 'โค้ด:'), seg([{ value: 'top', label: 'Consumer ห่อ ListView ทั้งก้อน (รายการหลายร้อยแถว)' }, { value: 'row', label: 'Selector ใน itemBuilder' }], mode, (v) => { mode = v; run(); })),
      h('div', { class: 'vctrl' }, h('span', { class: 'lbl' }, 'โหมด:'), seg(['profile', 'debug'], build, (v) => { build = v; run(); }), toggle('print ใน build ทุกเฟรม', printOn, (v) => { printOn = v; run(); })),
      h('div', { class: 'vrow' }, h('div', { class: 'grow' }, FR.Panel('Frame timeline (เส้น = 16 ms)', h('div', { class: 'fb-wrap' }, h('div', { class: 'fb-line' }), bars)), note), h('div', { class: 'grow' }, FR.Panel('Flutter Performance › widget rebuild information', table))));
    run();
  });

  // ───────── 11.6 swimlane: edit → provider → list ─────────
  R('ch11.swim', (body) => {
    const lanes = [
      { id: 'u', label: 'ผู้ใช้', sub: 'ลูกค้า' },
      { id: 'e', label: 'EditItemScreen', sub: 'UI · สั่งงาน' },
      { id: 'p', label: 'ItemProvider', sub: 'พ่อครัว' },
      { id: 'l', label: 'ItemListScreen', sub: 'Consumer = พนักงานเสิร์ฟ' },
    ];
    const base = (variant) => [
      { from: 'u', to: 'l', label: 'แตะ “Dell XPS 15”', text: 'ListTile.onTap → `pushNamed(EditItemScreen.routeName, arguments: item)`' },
      { from: 'l', to: 'e', label: 'pushNamed + arguments', text: 'หน้าแก้ไขขึ้นมาบนสุดของ stack' },
      { from: 'e', label: 'didChangeDependencies: อ่าน args, สร้าง controller', text: 'ใช้ `_isInit` กันทำซ้ำ ([[lab11]])' },
      { from: 'u', to: 'e', label: 'แก้คำอธิบาย + กดบันทึก' },
      { from: 'e', to: 'p', label: 'context.read<ItemProvider>().updateItem(…)', text: '**fire and forget** — ลูกค้ายื่นออเดอร์แล้วกลับไปนั่ง ไม่ยืนคุมหน้าเตา', kind: 'call' },
      { from: 'e', to: 'l', label: 'Navigator.pop', kind: 'ret', text: 'หน้าแก้ไขปิดตัว' },
      { from: 'p', label: '_items[index].description = …', text: 'พ่อครัวปรุงอาหารอยู่หลังร้าน' },
      variant === 'nonotify'
        ? { from: 'p', label: '(ลืม notifyListeners)', kind: 'fail', text: 'พ่อครัว **ลืมสั่นกระดิ่ง** — ไม่มีใครรู้ว่าอาหารเสร็จ' }
        : { from: 'p', to: 'l', label: 'notifyListeners() 🔔', kind: 'notify', text: 'พ่อครัวสั่นกระดิ่ง' },
      variant === 'read'
        ? { from: 'l', label: 'ใช้ read แทน Consumer → ไม่ได้ฟัง', kind: 'fail', text: 'พนักงานเสิร์ฟ **ใส่หูฟัง** ไม่ได้ยินกระดิ่ง' }
        : variant === 'nonotify' ? { from: 'l', label: 'Consumer ไม่ได้รับสัญญาณ', kind: 'fail', text: 'ไม่มีกระดิ่ง ก็ไม่มีการเสิร์ฟ' } : { from: 'l', label: 'Consumer builder ทำงาน → ListView ใหม่', kind: 'ok', text: 'พนักงานเสิร์ฟได้ยินแล้วนำจานไปเสิร์ฟ' },
      variant === 'ok' ? { from: 'l', to: 'u', label: 'เห็นคำอธิบายใหม่ ✓', kind: 'ret' } : { from: 'l', to: 'u', label: 'เห็นข้อมูลเก่า ✗', kind: 'fail', text: 'อาการ: “กดบันทึกแล้วหน้าหลักไม่อัปเดต”' },
    ];
    FR.Swimlane.create(body, {
      lanes,
      variants: { ok: { label: 'ทำงานปกติ', steps: base('ok') }, nonotify: { label: 'พัง: ลืม notifyListeners()', steps: base('nonotify') }, read: { label: 'พัง: หน้ารายการใช้ read', steps: base('read') } },
      variantLabel: 'สถานการณ์:',
      intro: 'กด “ขั้นต่อไป” หรือ ▷ เล่น เพื่อไล่ลำดับ · ลองเลือกสถานการณ์ที่พัง แล้วดูว่าเลนไหนเป็นต้นเหตุ',
    });
  });

  // ───────── 11.7 MultiProvider: nesting, order, lazy ─────────
  R('ch11.multi', (body) => {
    let names = ['AuthProvider', 'CartProvider', 'ProductProvider'];
    let extra = 0;
    const codeBox = h('div', { class: 'two' });
    function nested(list) {
      let s = '', ind = '';
      list.forEach((n, i) => { s += `${ind}ChangeNotifierProvider(\n${ind}  create: (context) => ${n}(),\n${ind}  child: `; ind += '  '; if (i === list.length - 1) s += 'const MyApp(),\n'; else s += '\n'; });
      for (let i = list.length - 1; i >= 0; i--) { ind = '  '.repeat(i); s += `${ind})${i ? ',' : ''}\n`; }
      return s.replace(/child: \n/g, 'child: ');
    }
    function multi(list) { return `MultiProvider(\n  providers: [\n${list.map((n) => `    ChangeNotifierProvider(create: (context) => ${n}()),`).join('\n')}\n  ],\n  child: const MyApp(),\n)`; }
    function render() {
      clear(codeBox);
      const list = names.concat(Array.from({ length: extra }, (_, i) => 'NewProvider' + (i + 1)));
      codeBox.append(FR.CodeView.create({ src: '// ซ้อนกัน (Pyramid of Doom)\n' + nested(list), lang: 'dart', title: `ซ้อนกัน · เพิ่ม 1 ตัว = แก้การเยื้อง ${list.length + 2}+ บรรทัด` }).el, FR.CodeView.create({ src: '// MultiProvider\n' + multi(list), lang: 'dart', title: 'MultiProvider · เพิ่ม 1 ตัว = +1 บรรทัด' }).el);
    }
    // order + lazy demo
    let order = ['AuthProvider', 'CartProvider ⟵ ProxyProvider<AuthProvider, CartProvider>', 'ProductProvider'];
    let lazy = true;
    const orderBox = h('div', { class: 'ord' });
    const con = FR.Console.create({ title: 'รันแอป', compact: true });
    function drawOrder() {
      clear(orderBox);
      order.forEach((n, i) => orderBox.appendChild(h('div', { class: 'ord-r' }, h('span', { class: 'mono' }, `${i + 1}. ${n}`), h('span', { class: 'mv' }, btn('↑', () => { if (i) { [order[i - 1], order[i]] = [order[i], order[i - 1]]; drawOrder(); } }, 'sm ghost'), btn('↓', () => { if (i < order.length - 1) { [order[i + 1], order[i]] = [order[i], order[i + 1]]; drawOrder(); } }, 'sm ghost')))));
    }
    function runApp() {
      con.clear();
      const ai = order.findIndex((n) => n.startsWith('Auth')), ci = order.findIndex((n) => n.startsWith('Cart'));
      con.log('ตัวที่ประกาศก่อน = อยู่ชั้นบนกว่าใน widget tree', 'dim');
      if (!lazy) order.forEach((n) => con.log(`create: ${n.split(' ')[0]}()  (lazy: false → สร้างทันทีตอนเปิดแอป)`, 'sys'));
      else con.log('lazy (ค่าเริ่มต้น): ยังไม่มี create ไหนทำงาน จนกว่าจะมีวิดเจ็ตร้องขอ', 'sys');
      con.log('หน้าแรกเรียก context.watch<CartProvider>()…');
      if (ci < ai) { con.log('ProviderNotFoundException: Error: Could not find the correct Provider<AuthProvider> above this ChangeNotifierProxyProvider<AuthProvider, CartProvider> Widget', 'err'); con.log('→ CartProvider ต้องประกาศ “หลัง” AuthProvider ที่มันพึ่งพา', 'info'); }
      else { if (lazy) con.log('create: AuthProvider() → create: CartProvider() (สร้างตอนถูกร้องขอครั้งแรก)', 'sys'); con.log('แอปทำงานปกติ ✓', 'ok'); }
    }
    drawOrder();
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, btn('+ เพิ่ม provider อีก 1 ตัว', () => { extra++; render(); }, 'primary sm'), btn('รีเซ็ต', () => { extra = 0; render(); }, 'sm ghost')), codeBox,
      h('h4', null, 'ลำดับในรายการมีความหมาย + lazy'),
      h('div', { class: 'vrow' }, h('div', { class: 'grow vcol' }, orderBox, h('div', { class: 'btn-row' }, toggle('lazy: true (ค่าเริ่มต้น)', lazy, (v) => (lazy = v)), btn('▶ รันแอป', runApp, 'primary sm'))), h('div', { class: 'grow' }, con.el)));
    render();
  });

  // ───────── 11.8 splitting + ProxyProvider reuse ─────────
  R('ch11.split', (body) => {
    const sorter = FR.Sorter.create({
      prompt: 'แอปร้านค้ามีของต่อไปนี้ ควรอยู่ใน provider ตัวไหน (หั่นตามความรับผิดชอบ ไม่ใช่ตามหน้าจอ):',
      buckets: [{ id: 'auth', label: 'AuthProvider' }, { id: 'cart', label: 'CartProvider' }, { id: 'chat', label: 'ChatProvider' }],
      items: [
        { t: 'userId ของคนที่ล็อกอิน, login(), logout()', bucket: 'auth', why: 'เปลี่ยนด้วยเหตุผลเดียว: การยืนยันตัวตน' },
        { t: 'สินค้าในตะกร้า, add(), remove(), total', bucket: 'cart', why: 'ข้อมูลชุดเดียวที่เปลี่ยนไปด้วยกัน' },
        { t: 'กติกาคิดส่วนลดของตะกร้า', bucket: 'cart', why: 'แก้เมื่อกติกาตะกร้าเปลี่ยน — ความรับผิดชอบเดียวกับตะกร้า' },
        { t: 'ประวัติข้อความแชตกับร้าน', bucket: 'chat', why: 'ไม่เคยเปลี่ยนพร้อมตะกร้า — ถ้าอยู่รวมกัน notify ครั้งเดียวปลุกวิดเจ็ตที่ไม่เกี่ยว' },
      ],
    });
    // proxy demo
    let reuse = true;
    let cart = { id: 1, items: ['ปากกา', 'สมุด'], user: 'u1' };
    let nextId = 2;
    const view = h('div', { class: 'vkv' });
    const con = FR.Console.create({ title: 'Debug Console', compact: true });
    function draw() { clear(view); view.append(h('span', { class: 'k' }, 'CartProvider อินสแตนซ์'), h('span', { class: 'v' }, '#' + cart.id), h('span', { class: 'k' }, 'userId'), h('span', { class: 'v' }, cart.user), h('span', { class: 'k' }, 'สินค้าในตะกร้า'), h('span', { class: 'v' + (cart.items.length ? '' : ' chg') }, cart.items.length ? cart.items.join(', ') : '(ว่าง!)')); }
    function authChanged() {
      con.log('AuthProvider.notifyListeners() (เช่น ต่ออายุ token) → update(context, auth, previousCart)');
      if (reuse) { cart.user = 'u1'; con.log('(previousCart ?? CartProvider())..setUser(auth.userId) → ใช้อ็อบเจกต์เดิม', 'ok'); }
      else { cart = { id: nextId++, items: [], user: 'u1' }; con.log('CartProvider()..setUser(auth.userId) → อ็อบเจกต์ใหม่ → state ที่สะสมไว้หายหมด', 'err'); }
      draw(); flash(view);
    }
    draw();
    body.append(sorter, h('h4', null, 'ChangeNotifierProxyProvider: update ต้องใช้ของเดิม'),
      h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, seg([{ value: 'r', label: 'คืน previousCart (ถูก)' }, { value: 'n', label: 'สร้าง CartProvider() ใหม่ทุกครั้ง' }], 'r', (v) => (reuse = v === 'r')), btn('+ เพิ่มสินค้า', () => { cart.items.push(['คลิป', 'ยางลบ', 'ไม้บรรทัด'][cart.items.length % 3]); draw(); }, 'sm'), btn('AuthProvider เปลี่ยน', authChanged, 'primary sm')),
      h('div', { class: 'vrow' }, h('div', { class: 'grow' }, FR.Panel('CartProvider', view)), h('div', { class: 'grow' }, con.el)));
  });

  // ───────── Lab: didChangeDependencies guard ─────────
  R('ch11.didchange', (body) => {
    let guard = true, isInit = false, ctrlCount = 0, crashed = false;
    const con = FR.Console.create({ title: 'Debug Console' });
    const ctrlV = h('span', { class: 'v' }, '0');
    const status = h('span', { class: 'pill on' }, 'ทำงานปกติ');
    function dcd(reason) {
      if (crashed) return;
      con.log(`didChangeDependencies()  ← ${reason}`);
      if (guard && isInit) { con.log('if (_isInit) return;  → ข้าม ไม่สร้าง controller ซ้ำ', 'ok'); return; }
      if (!guard && isInit) {
        ctrlCount += 2; ctrlV.textContent = ctrlCount;
        con.log("LateInitializationError: Field '_nameController' has already been initialized.", 'err');
        con.log(`controller เดิม 2 ตัวไม่ถูก dispose → ค้างในหน่วยความจำ`, 'warn');
        status.textContent = 'พัง: LateInitializationError'; status.className = 'pill off'; crashed = true; return;
      }
      isInit = true;
      con.log('_item = ModalRoute.of(context)!.settings.arguments as Item;');
      ctrlCount += 2; ctrlV.textContent = ctrlCount;
      con.log('_nameController = TextEditingController(text: _item.name);  (+ description)', 'sys');
    }
    function open() {
      con.clear(); isInit = false; ctrlCount = 0; ctrlV.textContent = '0'; crashed = false; status.textContent = 'ทำงานปกติ'; status.className = 'pill on';
      con.sep('เปิด EditItemScreen');
      con.log('initState()  — context ยัง “เสียบปลั๊กแต่ยังไม่เปิดสวิตช์” อ่าน ModalRoute ไม่ได้', 'dim');
      dcd('ครั้งแรก ทันทีหลัง initState');
      con.log('build()');
    }
    const t = toggle('มียาม _isInit', guard, (v) => { guard = v; open(); });
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, t, btn('เปิดหน้าแก้ไขใหม่', open, 'primary sm'), btn('📱 หมุนจอ', () => dcd('MediaQuery เปลี่ยน (หมุนจอ)'), 'sm'), btn('🎨 เปลี่ยนธีม', () => dcd('Theme เปลี่ยน'), 'sm'), btn('🌐 เปลี่ยนภาษา', () => dcd('Locale เปลี่ยน'), 'sm')),
      h('div', { class: 'vrow' }, h('div', { class: 'grow' }, con.el), h('div', { style: { flex: '0 1 240px' } }, FR.Panel('สถานะ', h('div', { class: 'vkv' }, h('span', { class: 'k' }, 'controller ที่ถูกสร้าง'), ctrlV), h('div', { style: { marginTop: '6px' } }, status)))));
    open();
  });

  // ───────── Lab: items getter: direct vs copy vs unmodifiable ─────────
  R('ch11.getter', (body) => {
    const MODES = {
      direct: ['`List<Item> get items => _items;`', 'Lab 1'],
      copy: ['`List<Item> get items => [..._items];`', 'Lab 2'],
      unmod: ['`List<Item> get items => List.unmodifiable(_items);`', 'บทที่ 12'],
    };
    let mode = 'direct';
    const con = FR.Console.create({ title: 'ผลลัพธ์', compact: true });
    const real = h('span', { class: 'v' });
    const screen = h('span', { class: 'v' });
    let data, shown;
    function reset() { data = ['MacBook Pro', 'Dell XPS 15', 'Logitech MX']; shown = data.slice(); draw(); con.clear(); }
    function draw() { real.textContent = `[${data.join(', ')}] (${data.length})`; screen.textContent = `[${shown.join(', ')}] (${shown.length})`; }
    function hack() {
      con.log("หน้าจอเขียนโค้ดลัด: context.read<ItemProvider>().items.add(Item('ปากกา'))", 'warn');
      if (mode === 'direct') { data.push('ปากกา'); con.log('สำเร็จ… _items ข้างใน provider ถูกแก้ แต่ไม่มี notifyListeners() → จอไม่รู้ ข้อมูลกับจอไม่ตรงกัน', 'err'); }
      else if (mode === 'copy') { con.log('แก้ได้ แต่แก้ “สำเนา” ที่ทิ้งไปทันที → _items จริงไม่เปลี่ยน การแก้หายไปเงียบๆ (บั๊กที่หายาก)', 'warn'); }
      else { con.log('Unsupported operation: Cannot add to an unmodifiable list', 'err'); con.log('พังทันทีตอนพัฒนา → บังคับให้ไปเรียกเมธอดของ provider ที่ notify (fail fast ✓)', 'ok'); }
      draw(); flash(real);
    }
    const s = seg(Object.keys(MODES).map((k) => ({ value: k, label: MODES[k][1] })), mode, (v) => { mode = v; reset(); code.innerHTML = md(MODES[v][0]); });
    const code = h('div', { class: 'vnote', html: md(MODES[mode][0]) });
    body.append(h('div', { class: 'vctrl' }, h('span', { class: 'lbl' }, 'getter:'), s, btn('ลองแก้ลิสต์จากหน้าจอโดยตรง', hack, 'danger sm'), btn('รีเซ็ต', reset, 'sm ghost')), code,
      h('div', { class: 'vkv', style: { margin: '8px 0' } }, h('span', { class: 'k' }, '_items จริงใน provider'), real, h('span', { class: 'k' }, 'ที่จอแสดงอยู่'), screen), con.el);
    reset();
  });
})();
