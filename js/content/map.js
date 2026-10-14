/* ชั้น 0 — แผนที่ภาพรวม: เส้นเรื่อง 7 บท + กายวิภาคแอปเดียว (ex_13) + ความคืบหน้า */
(function () {
  const HANDOFF = {
    ch08: { q: '7 → 8', t: 'ปุ่มกดอย่างเดียวไม่พอ — ผู้ใช้ต้อง **ป้อน** ข้อมูลได้ และต้องตรวจก่อนนำไปใช้' },
    ch09: { q: 'คำถาม 8.14', t: 'ข้อมูลที่กรอกเสร็จต้อง **เดินทางกลับ** ไปถึงหน้าที่เปิดฟอร์มขึ้นมา' },
    ch10: { q: 'คำถาม 9.11', t: 'ตัวเลขตะกร้าต้องแสดง **ทั้งสามหน้า** — ส่งผ่าน constructor ทุกชั้นไม่ไหว' },
    ch11: { q: '10 → 11', t: '`watch` ที่บนสุดทำให้ **ทั้งหน้า** build ใหม่ — ทำให้แคบลงได้ไหม และ provider ตัวเดียวใหญ่เกินไปหรือยัง' },
    ch12: { q: 'คำถาม 11.10', t: 'ระหว่างข้อมูล **ยังเดินทางมาไม่ถึง** provider ควรบอกหน้าจอว่าอะไร และถ้าล้มเหลวล่ะ' },
    ch13: { q: 'คำถาม 12.10', t: 'ผู้ใช้ **ในลิฟต์** เห็นแต่ “เชื่อมต่อไม่ได้” ทั้งที่ข้อมูลเพิ่งมาถึงเมื่อเช้า' },
  };
  const SHORT = {
    ch07: 'วิดเจ็ตเปลี่ยนไม่ได้ แต่จอต้องเปลี่ยน → State + setState',
    ch08: 'รับข้อมูล ตรวจ แล้วเก็บ → Form, validator, controller',
    ch09: 'หลายหน้าจอ ไป-กลับ ส่งข้อมูล → Navigator',
    ch10: 'state ที่หลายหน้าใช้ร่วมกัน → Provider + ChangeNotifier',
    ch11: 'rebuild ให้น้อยที่สุด + แยกความรับผิดชอบ → Consumer, Selector, MultiProvider',
    ch12: 'คุยกับอินเทอร์เน็ตโดยจอไม่ค้าง → async, http, FutureBuilder',
    ch13: 'ข้อมูลรอดข้ามการปิดแอป → SQLite, Model, migration, offline-first',
  };

  const L = [{ id: 'u', label: 'ผู้ใช้' }, { id: 's', label: 'หน้าจอ', sub: 'screens/' }, { id: 'n', label: 'Navigator' }, { id: 'p', label: 'Provider', sub: 'providers/' }, { id: 'd', label: 'SQLite', sub: 'expenses.db' }, { id: 'a', label: 'API', sub: '(ข้อ 6 / 13.10)' }];
  const VARIANTS = {
    open: { label: 'เปิดแอป', steps: [
      { from: 'p', label: "main(): ChangeNotifierProvider(create: (_) => TransactionProvider())", title: 'สร้าง Provider เหนือ MaterialApp', text: 'ทุกหน้าจอที่อยู่ใต้ MaterialApp หา provider นี้เจอ ([[10.3]], [[core/c2]])', phase: 'เริ่มแอป' },
      { from: 'p', label: 'constructor → unawaited(fetchAndSetTransactions())', title: 'เริ่มโหลดทันที โดยไม่รอใน constructor', text: 'constructor เป็น async ไม่ได้ จึงสั่งงานแล้วไม่รอ ([[dart/d6]])' },
      { from: 'p', to: 's', label: '_isLoading = true → notifyListeners()', kind: 'notify', title: 'บอกหน้าจอว่ากำลังโหลด', text: 'Consumer ใน TransactionListScreen build ใหม่ → ยังไม่มีข้อมูล จึงแสดงวงล้อ ([[12.8]])' },
      { from: 'p', to: 'd', label: '_initDatabase(): openDatabase(version: 2, onCreate / onUpgrade)', title: 'เปิดไฟล์ครั้งเดียว', text: '`_databaseFuture ??= _openDatabase()` — ครั้งแรกสร้างตาราง ([[13.5]]) · เครื่องที่มีไฟล์ v1 ไล่ `if (oldVersion < 2)` ([[13.8]])', phase: 'อ่านข้อมูล' },
      { from: 'p', to: 'd', label: "query('transactions', orderBy: 'date DESC, id DESC')", title: 'อ่านทุกแถว', text: '[[13.6]] · ลำดับเสถียรด้วย id ([[sql/order]])' },
      { from: 'd', to: 'p', label: 'List<Map<String, Object?>>', kind: 'ret' },
      { from: 'p', label: 'rows.map(MyTransaction.fromMap).toList()', title: 'แปลงแถวเป็น Model', text: 'amount ผ่าน num · date จาก ISO · type ด้วย byName ([[13.7]])' },
      { from: 'p', to: 's', label: 'finally: _isLoading = false → notifyListeners()', kind: 'notify', title: 'แจ้งหน้าจออีกครั้ง', text: 'Consumer build ใหม่ด้วยรายการ ([[11.2]])', phase: 'แสดงผล' },
      { from: 's', to: 'u', label: 'ListView ของรายการ', kind: 'ret' },
    ] },
    add: { label: 'เพิ่มรายการ', steps: [
      { from: 'u', to: 's', label: 'กด FAB (+)', phase: 'เปิดฟอร์ม' },
      { from: 's', to: 'n', label: 'Navigator.of(context).push(MaterialPageRoute(builder: (_) => AddEditTransactionScreen()))', title: 'ซ้อนหน้าฟอร์มบนกอง', text: '[[9.3]]' },
      { from: 'n', to: 's', label: 'initState: late final controllers, _type = expense', kind: 'ret', title: 'State ของฟอร์มเกิด', text: 'controller ต้อง dispose ใน dispose ([[8.3]], [[7.5]])' },
      { from: 'u', to: 's', label: 'กรอก → กด “บันทึก”', phase: 'ตรวจและบันทึก' },
      { from: 's', label: '_formKey.currentState!.validate() · _saving = true', title: 'ตรวจทุกช่อง + กันกดซ้ำ', text: '[[8.6]] [[8.7]] · `onPressed: _saving ? null : _save` ([[dart/d5]])' },
      { from: 's', to: 'p', label: 'context.read<TransactionProvider>().addTransaction(...)', title: 'read ใน event handler', text: '[[10.3]] [[core/c3]]' },
      { from: 'p', to: 'd', label: "insert('transactions', t.toMap())", title: 'toMap ไม่มี id', text: 'SQLite สร้าง id ให้ ([[13.7]])' },
      { from: 'd', to: 'p', label: 'id ใหม่', kind: 'ret' },
      { from: 'p', to: 'd', label: 'fetchAndSetTransactions() → query', title: 'อ่านใหม่จาก DB', text: 'ข้อมูลในหน่วยความจำตรงกับไฟล์เสมอ ([[lab13]])' },
      { from: 'p', to: 's', label: 'notifyListeners()', kind: 'notify', title: 'หน้ารายการ (ด้านหลัง) build ใหม่' },
      { from: 's', to: 'n', label: 'if (mounted) Navigator.of(context).pop()', title: 'กลับหน้ารายการ', text: 'หลัง await เช็ก mounted ก่อนใช้ context ([[core/c5]])', phase: 'กลับ' },
      { from: 's', to: 'u', label: 'เห็นรายการใหม่บนสุด', kind: 'ret' },
    ] },
    edit: { label: 'แก้ไข', steps: [
      { from: 'u', to: 's', label: 'แตะรายการ', phase: 'เปิดฟอร์ม' },
      { from: 's', to: 'n', label: 'push(AddEditTransactionScreen(transaction: t))', title: 'ส่งข้อมูลไปทาง constructor', text: '[[9.4]]' },
      { from: 'n', to: 's', label: 'initState: controller(text: widget.transaction?.title)', kind: 'ret', title: 'prefill ค่าเดิม', text: '`widget.x` ใช้ได้ใน initState ([[7.5]])' },
      { from: 'u', to: 's', label: 'แก้ → บันทึก', phase: 'บันทึก' },
      { from: 's', to: 'p', label: 'updateTransaction(existing.id!, MyTransaction(...))' },
      { from: 'p', to: 'd', label: "update(values, where: 'id = ?', whereArgs: [id])", title: 'มี where เสมอ', text: 'ลืม where = แก้ทุกแถว ([[13.6]])' },
      { from: 'd', to: 'p', label: 'แถวที่ถูกแก้ = 1', kind: 'ret' },
      { from: 'p', to: 's', label: 'fetch → notifyListeners()', kind: 'notify' },
      { from: 's', to: 'n', label: 'pop()', phase: 'กลับ' },
    ] },
    del: { label: 'ลบ', steps: [
      { from: 'u', to: 's', label: 'กดถังขยะ' },
      { from: 's', to: 'p', label: 'await context.read<TransactionProvider>().deleteTransaction(t.id!)' },
      { from: 'p', to: 'd', label: "delete(where: 'id = ?', whereArgs: [id])", title: 'where + whereArgs', text: '[[13.6]]' },
      { from: 'd', to: 'p', label: 'แถวที่ถูกลบ = 1', kind: 'ret' },
      { from: 'p', to: 's', label: 'fetch → notifyListeners()', kind: 'notify', title: 'รายการหายจากจอ' },
      { from: 's', to: 'u', label: 'ถ้า error: if (!context.mounted) return; → SnackBar', kind: 'fail', title: 'แจ้งความผิดพลาด', text: 'StatelessWidget ไม่มี `mounted` จึงใช้ `context.mounted` ([[core/c5]])' },
    ] },
    offline: { label: 'เปิดตอนออฟไลน์ (13.10)', steps: [
      { from: 'p', to: 'd', label: 'readCached()', title: 'แสดงของในเครื่องก่อน', text: 'หน้าจออ่านจาก DB เท่านั้น ([[13.10]])', phase: 'แคช' },
      { from: 'd', to: 'p', label: 'รายการเมื่อเช้า', kind: 'ret' },
      { from: 'p', to: 's', label: 'isRefreshing = true → notify', kind: 'notify', title: 'รายการเดิม + แถบบางใต้ AppBar' },
      { from: 'p', to: 'a', label: 'fetchTodos() (timeout 10 s)', phase: 'รีเฟรช' },
      { from: 'a', to: 'p', label: 'SocketException → ApiException', kind: 'fail', title: 'ล้มเหลว — ไม่แตะ DB เลย', text: 'เรียก API ให้สำเร็จก่อนค่อยเขียน ([[12.6]])' },
      { from: 'p', to: 's', label: 'errorMessage + lastSynced → notify', kind: 'notify', title: 'สถานะ ③', text: 'รายการเดิม + แถบ “แสดงข้อมูลเมื่อ …” + ลองใหม่ ([[13.10.1]])' },
      { from: 's', to: 'u', label: 'เห็นข้อมูลเมื่อเช้า (ไม่ใช่จอว่าง)', kind: 'ret' },
    ] },
  };

  function storyline(h, md) {
    const wrap = h('div', { class: 'mp-story' });
    ['ch07', 'ch08', 'ch09', 'ch10', 'ch11', 'ch12', 'ch13'].forEach((id) => {
      const m = FR.content[id];
      if (!m) return;
      if (HANDOFF[id]) wrap.appendChild(h('div', { class: 'mp-hand' }, h('span', { class: 'chip exam' }, HANDOFF[id].q), h('span', { html: md(HANDOFF[id].t) })));
      const p = FR.progress.moduleProgress(m);
      wrap.appendChild(h('a', { class: 'mp-ch' + (id === 'ch13' ? ' core' : ''), href: '#/' + id },
        h('div', { class: 'mp-num' }, m.num),
        h('div', { class: 'mp-body' },
          h('div', { class: 'mp-t' }, m.navTitle, id === 'ch13' ? h('span', { class: 'chip exam', style: { marginLeft: '8px' } }, 'แกนข้อสอบ') : null),
          h('div', { class: 'mp-g', html: md(SHORT[id]) }),
          h('div', { class: 'mp-tools' }, (m.tools || []).slice(0, 4).map((t) => h('span', { class: 'pill', html: md(t) }))),
          h('div', { class: 'mp-prog' }, h('div', { class: 'mp-bar' }, h('i', { style: { width: p.pct + '%' } })), h('span', { class: 'dim' }, `อ่าน ${p.seen}/${p.total} · ผ่านแบบทดสอบ ${p.done}`)))));
    });
    return wrap;
  }

  function moduleCards(h, md) {
    const items = [
      ['core', 'กลไกที่ทุกบทใช้: Element, context, InheritedWidget, rebuild, event loop'],
      ['dart', 'ไวยากรณ์ที่ตำราใช้แต่ไม่อธิบาย พร้อมการ์ดลองค่า'],
      ['sql', 'SQL ที่โจทย์ใช้ (LIKE, COUNT/SUM, JOIN, แบ่งหน้า) + playground บน SQLite จริง'],
      ['exam', 'เช็กลิสต์ก่อนส่ง · แผนที่โจทย์ 6 ข้อ · ลำดับทำข้อสอบ'],
      ['walk-ex13', 'อ่านโค้ด ex_13 ทั้งโปรเจกต์ ไล่ตาม action'],
      ['walk-offline', 'อ่านโค้ด offline-first (repository + DI)'],
      ['bughunt', 'ฝึกจับผิดโค้ดจริง (ex_13, review_final_app, ตำรา)'],
      ['review', 'ทบทวนเฉพาะข้อที่เคยตอบผิด'],
    ];
    const grid = h('div', { class: 'grid c2' });
    items.forEach(([id, d]) => {
      const m = FR.content[id];
      grid.appendChild(h('a', { class: 'card sec-card' + (m ? '' : ' soon'), href: '#/' + (id.startsWith('walk-') ? 'code/' + id.slice(5) : id) },
        h('div', { class: 'num' }, m ? (m.kind === 'supp' ? 'เสริม' : 'เตรียมสอบ') : 'เร็วๆ นี้'),
        h('div', { class: 'ttl' }, m ? m.navTitle || m.title : id),
        h('div', { class: 'g', html: md(d) })));
    });
    return grid;
  }

  FR.content.map = {
    id: 'map', kind: 'page', navTitle: 'แผนที่ภาพรวม', title: 'แผนที่ภาพรวม',
    page(main, { md, h }) {
      const ctx = { vizByName: new Map(), keyBase: 'map' };
      const page = h('article', { class: 'read' });
      page.append(
        h('div', { class: 'eyebrow' }, h('span', { class: 'chip src' }, 'ตำราบทที่ 7–13'), h('span', { class: 'chip supp' }, '+ ส่วนเสริม'), h('span', { class: 'chip exam' }, '+ เตรียมสอบ')),
        h('h1', null, 'ทบทวน Flutter บทที่ 7–13'),
        FR.markup.el('p', 'เริ่มจาก **ภาพรวมทั้งหมดในหน้านี้** → กดเข้าแต่ละบทเพื่อดูภาพรวมของบท → แล้วค่อยเจาะทีละหัวข้อ · ทุกหัวข้อมี **ภาพที่กดลองได้**, เหตุผลว่า “ทำไมเลือกแบบนี้ / ทำไมไม่ทำอีกแบบ”, โค้ดจากตำราพร้อมคำอธิบายรายบรรทัด และแบบทดสอบ', { class: 'lede' }),
        h('div', { class: 'mp-legend' },
          h('span', { class: 'chip supp' }, '◆ เสริม — ไม่อยู่ในตำรา'), h('span', { class: 'chip real' }, 'ⓘ พฤติกรรมจริง (ตรวจจากซอร์ส)'), h('span', { class: 'chip exam' }, '✎ จุดออกสอบ'), h('span', { class: 'chip' }, '≈ อุปมา'),
          h('span', { class: 'dim', style: { fontSize: '.8rem' } }, 'ค้นหา: Ctrl K หรือ /')));

      page.appendChild(h('h2', null, 'เส้นเรื่อง: แต่ละบทแก้ปัญหาที่บทก่อนทิ้งไว้'));
      page.appendChild(FR.markup.el('p', 'คำถามท้ายบทของตำรา **ส่งต่อ** ไปเป็นปัญหาของบทถัดไปเสมอ — อ่านแถบสีส้มระหว่างบทเพื่อเห็นว่าทำไมเครื่องมือของบทถัดไปจึงจำเป็น'));
      page.appendChild(storyline(h, md));

      page.appendChild(h('h2', null, 'กายวิภาคของแอปเดียว: ทุกบทอยู่ตรงไหนในแอปบัญชีรายรับ-รายจ่าย'));
      page.appendChild(FR.markup.el('p', 'แอป `ex_13` (แลปบทที่ 13 ที่ทำการบ้านเสร็จแล้ว) ใช้ความรู้ทุกบทพร้อมกัน — เลือก action แล้วกดเล่นทีละขั้น แต่ละขั้นมีลิงก์ไปหัวข้อที่อธิบายเหตุผล'));
      page.appendChild(FR.blocks.render([{ t: 'viz', id: 'swimlane', title: 'ไล่ action ผ่านทุกชั้นของแอป', props: { lanes: L, variants: VARIANTS, variant: 'open', variantLabel: 'action:' }, try: 'เลือก action ด้านบน แล้วกด ▷ เล่น หรือ “ถัดไป” ทีละขั้น' }], ctx));
      page.appendChild(FR.blocks.render([{ t: 'compare', cols: ['ชั้น', 'ไฟล์ใน ex_13', 'บทที่สอน'], rows: [
        ['หน้าจอ', '`screens/transaction_list_screen.dart`, `screens/add_edit_transaction_screen.dart`', '[[ch07]] [[ch08]] [[ch11]]'],
        ['Navigator', 'push / pop ในหน้าจอทั้งสอง', '[[ch09]]'],
        ['Provider', '`providers/transaction_provider.dart`', '[[ch10]] [[ch11]] [[ch12]]'],
        ['SQLite + Model', '`models/my_transaction.dart` + `openDatabase` ใน provider', '[[ch13]] [[sql]]'],
        ['API (ไม่มีใน ex_13)', '`services/api_service.dart` + repository ในโจทย์ข้อ 6', '[[ch12]] [[13.10]]'],
      ] }], ctx));

      page.appendChild(h('h2', null, 'ส่วนเสริมและเตรียมสอบ'));
      page.appendChild(moduleCards(h, md));

      // progress summary
      const mods = ['ch07', 'ch08', 'ch09', 'ch10', 'ch11', 'ch12', 'ch13', 'core', 'dart', 'sql'].map((id) => FR.content[id]).filter(Boolean);
      let seen = 0, total = 0, done = 0;
      mods.forEach((m) => { const p = FR.progress.moduleProgress(m); seen += p.seen; total += p.total; done += p.done; });
      const pct = total ? Math.round((seen / total) * 100) : 0;
      page.appendChild(h('h2', null, 'ความคืบหน้าของคุณ'));
      page.appendChild(h('div', { class: 'mp-total' },
        h('div', { class: 'mp-bar big' }, h('i', { style: { width: pct + '%' } })),
        h('div', null, h('b', null, pct + '%'), h('span', { class: 'dim' }, ` · อ่านแล้ว ${seen}/${total} หัวข้อ · ผ่านแบบทดสอบครบ ${done} หัวข้อ`)),
        h('div', { class: 'btn-row' },
          h('a', { class: 'btn sm', href: '#/review' }, 'ทบทวนข้อที่ผิด'),
          FR.util.btn('ล้างความคืบหน้าทั้งหมด', () => { if (confirm('ล้างประวัติการอ่าน แบบทดสอบ และเช็กลิสต์ทั้งหมด?')) { FR.store.reset(); FR.app.route(); } }, 'sm ghost'))));
      page.appendChild(FR.markup.el('p', 'ความคืบหน้าเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น (localStorage) — เปิดจากเบราว์เซอร์อื่นจะเริ่มใหม่', { class: 'dim' }));
      main.appendChild(page);
    },
  };
})();
