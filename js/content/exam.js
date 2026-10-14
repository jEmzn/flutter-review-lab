/* ชั้นเตรียมสอบ — สูตร 7 ขั้น, ลำดับเวลา, เช็กลิสต์ที่บันทึกได้, การ์ดโจทย์ 6 ข้อ, แผนที่โจทย์ × หัวข้อ
   ที่มา: exam_questions/README.md + q1–q6 + review_final_app/lib/chapters/ch13/expense/providers/transaction_provider.dart */
(function () {
  const CHECK = [
    { g: 'Model', items: [
      ['m1', '`id` เป็น `int?` และ `toMap()` ใส่ `\'id\'` **เฉพาะเมื่อไม่ใช่ null** (ไม่งั้น update ได้ `datatype mismatch`)', '13.7'],
      ['m2', '`amount`/`price` อ่านด้วย `(map[\'x\'] as num).toDouble()`', 'dart/d7'],
      ['m3', '`enum` เก็บ `.name` อ่านด้วย `values.byName()` (ห้าม `.index`)', '13.7'],
      ['m4', '`bool` เก็บ 1/0 · `DateTime` เก็บ `toIso8601String()` รูปแบบเดียวทั้งแอป', 'sql/dates'],
      ['m5', 'คีย์ใน `toMap`/`fromMap` ตรงกับชื่อคอลัมน์ใน `CREATE TABLE` ทุกตัว (ระวัง snake_case กับ camelCase)', '13.5'],
      ['m6', 'คอลัมน์ที่ได้จาก JOIN/SUM (`group_name`, `total`) อ่านใน fromMap ได้ แต่ **ไม่อยู่ใน toMap**', 'sql/join'],
      ['m7', 'ไม่ตั้งชื่อคลาส `Transaction` / `Database` (ชนกับ sqflite)', 'lab13'],
    ] },
    { g: 'Provider', items: [
      ['p1', '`update` และ `delete` มี `where: \'id = ?\'` + `whereArgs: [id]` เสมอ', '13.6'],
      ['p2', 'ค่าจากผู้ใช้เข้าทาง `whereArgs` เท่านั้น (รวม LIKE `\'%$kw%\'` และ LIMIT/OFFSET) ห้ามต่อสตริงด้วย `$`', 'sql/where'],
      ['p3', 'หลังข้อมูลเปลี่ยน โหลดใหม่จาก DB แล้ว `notifyListeners()`', 'lab13'],
      ['p4', 'getter คืน `List.unmodifiable(...)` หรือสำเนา `[..._items]`', 'dart/d4'],
      ['p5', 'ใน `db.transaction((txn) {...})` ใช้ `txn` ทุกคำสั่ง ห้ามเรียก `db` หรือเมธอดอื่นที่ใช้ `db` (แอปค้าง)', '13.9'],
      ['p6', 'เปิด DB ครั้งเดียว (`Future<Database>?` + `??=` หรือ Singleton) และจัดการ onCreate/onUpgrade จุดเดียว', '13.4'],
      ['p7', 'เปลี่ยน schema = เพิ่ม `version` + `onUpgrade` (`if (oldVersion < N)`) **และ** แก้ `onCreate` เป็นโครงสร้างล่าสุด', '13.8'],
    ] },
    { g: 'UI', items: [
      ['u1', '`TextEditingController` ทุกตัว `dispose()` ใน `dispose()`', '8.3'],
      ['u2', 'หลัง `await` เช็ก `mounted` (ใน State) หรือ `context.mounted` ก่อนใช้ context / setState', 'core/c5'],
      ['u3', '`context.read` ใน event handler · `context.watch`/`Consumer` ใน build', 'core/c3'],
      ['u4', 'ปุ่มบันทึกกันกดซ้ำ (`_saving`) และแสดง `SnackBar` เมื่อ DB ล้มเหลว', 'dart/d5'],
      ['u5', 'มีสถานะว่าง (empty), กำลังโหลด และข้อผิดพลาด', '12.8'],
      ['u6', 'หน้าแก้ไข prefill ค่าเดิมครบ และบันทึกกลับด้วย `id` เดิม', '9.4'],
    ] },
    { g: 'API / Offline-first', items: [
      ['a1', 'หน้าจอแสดงข้อมูลจาก DB เท่านั้น — API มีหน้าที่เขียนทับลง DB', '13.10'],
      ['a2', 'เรียก API ให้สำเร็จ **ก่อน** แตะ DB · ล้มเหลวแล้วแคชเก่าต้องอยู่ครบ', '13.10'],
      ['a3', 'ไม่ `await` เครือข่ายภายใน `db.transaction`', '13.9'],
      ['a4', 'ทุกคำขอมี `.timeout(...)` · ตรวจ `statusCode` · จับ `FormatException`', '12.6'],
      ['a5', 'ตัวเลขใน JSON อ่านผ่าน `num` · คีย์ที่อาจไม่มี (`results`, `country`) รับมือ `null`', '12.5'],
      ['a6', 'สิทธิ์ `INTERNET` ใน `AndroidManifest.xml` ของ `main` + `http` ใน `pubspec.yaml`', '12.5'],
      ['a7', 'ครบ 4 สถานะ: ไม่มีข้อมูล+โหลด / มีข้อมูล+โหลด / มีข้อมูล+ผิดพลาด / ไม่มีข้อมูล+ผิดพลาด', '13.10'],
    ] },
    { g: 'ทดสอบก่อนส่ง', items: [
      ['t1', 'เพิ่ม → แก้ → ลบ → **ปิดแอปแล้วเปิดใหม่ (ไม่ใช่ Hot Reload)** ข้อมูลต้องตรงกับก่อนปิด', '13.6'],
      ['t2', 'ใส่ข้อความที่มี `\'` และ `%` ในทุกช่อง แอปต้องไม่พังและเก็บค่าตามที่พิมพ์', 'sql/like'],
      ['t3', 'ถ้าเปลี่ยน schema: รันทับโดยไม่ถอนการติดตั้ง ข้อมูลเดิมต้องไม่หาย', '13.8'],
    ] },
  ];

  const FORMULA = [
    ['Model', 'ฟิลด์ + ชนิด, `id` เป็น `int?`, `toMap` (ใส่ id เฉพาะเมื่อมีค่า), `factory fromMap`', '13.7'],
    ['Schema', '`CREATE TABLE` ชื่อคอลัมน์ตรงกับคีย์ใน toMap เป๊ะ + ชนิดตามตารางแปลง (double→REAL, enum→TEXT, bool→INTEGER, DateTime→TEXT)', '13.5'],
    ['Provider', '`Future<Database>?` / `_database`, `List<Model> _items`, getter (สำเนา), `_initDatabase`', '13.4'],
    ['CRUD', '`add` / `fetchAndSet` / `update` / `delete` — ทุกเมธอด `await` การเปิด DB แล้วจบด้วย fetchAndSet (→ notifyListeners)', '13.6'],
    ['main', '`ChangeNotifierProvider(create: (_) => XProvider())` **เหนือ** MaterialApp', '10.3'],
    ['List UI', '`Consumer<XProvider>` + `ListView.builder` + ปุ่มลบ + FAB เพิ่ม + แตะเพื่อแก้', '11.2'],
    ['Form UI', '`Form` + validator + บันทึก → `context.read<...>().add/update` → `pop` (เช็ก mounted)', '8.7'],
  ];

  const TIMELINE = [
    [5, 'อ่านโจทย์ + starter', 'ห้ามเขียนใหม่ทั้งหมด ให้ดัดแปลงของเดิม · หา entity, ชื่อเมธอดที่โจทย์กำหนด'],
    [10, 'Model + schema', 'รันดูว่าตารางถูกสร้าง (print ใน onCreate)'],
    [20, 'Provider ทีละเมธอด', 'fetch → add → update → delete'],
    [25, 'UI', 'รายการ → ฟอร์ม → เชื่อมการนำทาง'],
    [20, 'ส่วนพิเศษของโจทย์', 'filter / JOIN / transaction / migration / แบ่งหน้า / API'],
    [10, 'เช็กลิสต์ + ปิด-เปิดแอป', 'ไล่เช็กลิสต์ด้านล่าง แล้วทดสอบปิดแอปจริง'],
  ];

  const QS = [
    { n: 1, lv: 'ง่าย', ent: '`Product` (products)', time: '30–40 นาที', file: 'q1_easy_product.md', topics: ['13.5', '13.6', '13.7', 'sql/basics', '8.7', '9.4'],
      what: 'CRUD พื้นฐานครบวงจร, Form + validator, เรียงชื่อ A→Z, ป้าย “หมด” เมื่อ quantity = 0',
      traps: ["ลืม `if (id != null)` ใน toMap → update ได้ `id = null`", 'ใช้ `double.tryParse` ตรวจจำนวน (quantity) ทำให้ `2.5` ผ่าน — ต้องเป็น `int.tryParse`', 'สร้าง Product ใหม่ตอนแก้โดยลืมส่ง `id`'] },
    { n: 2, lv: 'ปานกลาง', ent: '`Task` (tasks)', time: '45–60 นาที', file: 'q2_medium_task.md', topics: ['13.7', 'sql/where', 'sql/like', 'sql/agg', 'sql/partial'],
      what: 'แปลง bool/DateTime/enum, partial update, ตัวกรอง + ค้นหาด้วย LIKE ผ่าน whereArgs, นับงานค้างด้วย COUNT',
      traps: ["`'is_done': isDone` (bool) ตรงๆ → sqflite ไม่รองรับชนิด", "`where: \"title LIKE '%$kw%'\"` (SQL Injection)", 'ลืมเรียก fetch หลัง setFilter', 'เก็บ `\'\'` แทน `NULL` ใน detail'] },
    { n: 3, lv: 'ยาก', ent: '`ContactGroup` + `Contact`', time: '75–90 นาที', file: 'q3_hard_contacts_groups.md', topics: ['13.4', 'sql/join', 'sql/constraints', 'sql/agg', '13.9', '11.7'],
      what: '2 ตาราง, DatabaseHelper Singleton, 2 Provider ใช้ DB เดียวกัน (MultiProvider), LEFT JOIN ชื่อกลุ่ม, UNIQUE ชน, ลบกลุ่มใน transaction',
      traps: ["`Contact.toMap()` ใส่ `'group_name'` → `no column named group_name`", 'ใน transaction เรียก `db.update` แทน `txn.update` → ค้าง', 'ไม่มี `Future<Database>? _dbFuture` → เปิดซ้อนตอนเริ่มแอป', 'ลบกลุ่มแล้วลืม reload ContactProvider / Dropdown ชี้ค่าที่ถูกลบ'] },
    { n: 4, lv: 'ยาก', ent: '`DiaryEntry` v1 → v3', time: '75–90 นาที', file: 'q4_hard_diary_migration.md', topics: ['13.8', '13.9', 'sql/playground'],
      what: 'onUpgrade แบบ `if (oldVersion < N)`, เปลี่ยนชื่อคอลัมน์ด้วยการสร้างตารางใหม่, transaction + batch, rollback ของ restoreBackup',
      traps: ['`if (oldVersion == 1)` → ผู้ใช้ที่มาจาก v2 ตกขั้น', 'ทดสอบด้วยการถอนการติดตั้ง → ไม่เคยเจอบั๊กของ onUpgrade', 'คอลัมน์ใหม่ `NOT NULL` ไม่มี DEFAULT ใน ALTER → ล้มเหลว', "`DateTime.parse(map['created_at'] as String)` กับแถวเก่าที่เป็น NULL → crash"] },
    { n: 5, lv: 'ยาก', ent: '`Order` + `OrderItem`', time: '90 นาที', file: 'q5_hard_pos_orders.md', topics: ['13.9', 'sql/join', 'sql/group', 'sql/paging', 'sql/dates', 'sql/partial', '11.3'],
      what: 'transaction สร้างแม่-ลูก, LEFT JOIN + SUM + GROUP BY + COALESCE, แบ่งหน้า LIMIT/OFFSET, ยอดขายวันนี้, markPaid ด้วยเงื่อนไขสถานะ, Selector',
      traps: ['แทรกแม่นอก transaction → ลูกที่ qty = 0 ล้มแต่แม่ค้าง', '`db.batch()` แทน `txn.batch()`', 'INNER JOIN ทำออเดอร์ที่ไม่มีรายการหาย · ลืม GROUP BY', '`ORDER BY created_at DESC` อย่างเดียว · markPaid ไม่เช็ก status'] },
    { n: 6, lv: 'ยาก', ent: '`City` + แคชสภาพอากาศ', time: '90–100 นาที', file: 'q6_hard_weather_offline_first.md', topics: ['13.10', '13.10.1', '12.5', '12.6', 'sql/join', 'sql/upsert'],
      what: 'Offline-first: API → repository → SQLite → Provider, 4 สถานะหน้าจอ, เขียนแคชใน transaction, lastSynced ที่คงอยู่',
      traps: ['หน้าจอแสดง response ของ API ตรงๆ → ออฟไลน์ไม่มีข้อมูล', 'เปิด transaction แล้ว await API ข้างใน · ลบแคชก่อนเรียก API', 'INNER JOIN แคช → เมืองที่ยังไม่มีแคชหาย', "`json['temperature_2m'] as double` → crash เมื่อได้ 24 (int)"] },
  ];

  const MATRIX = [
    ['13.5 CREATE TABLE + constraint', '13.5', [1, 1, 1, 1, 1, 1]],
    ['13.6 insert/query/update/delete', '13.6', [1, 1, 1, 1, 1, 1]],
    ['where + whereArgs / Injection', 'sql/where', [1, 1, 1, 0, 1, 1]],
    ['13.7 toMap/fromMap, id int?', '13.7', [1, 1, 1, 1, 1, 1]],
    ['bool/DateTime/enum', '13.7', [0, 1, 1, 1, 1, 1]],
    ['13.8 onUpgrade', '13.8', [0, 0, 0, 1, 0, 0]],
    ['13.9 transaction + batch (txn)', '13.9', [0, 0, 1, 1, 1, 1]],
    ['13.4 Singleton / หลาย Provider', '13.4', [0, 0, 1, 0, 0, 0]],
    ['13.10 Offline-first', '13.10', [0, 0, 0, 0, 0, 1]],
    ['บท 12 http / ApiException', '12.6', [0, 0, 0, 0, 0, 1]],
    ['บท 8 Form / validator / dispose', '8.7', [1, 1, 1, 1, 1, 1]],
    ['บท 9 push/pop ส่งข้อมูล', '9.4', [1, 1, 1, 1, 1, 1]],
    ['บท 10–11 Provider/Consumer/Selector', '11.2', [1, 1, 1, 1, 1, 1]],
    ['บท 12 mounted / loading / error', 'core/c5', [1, 1, 1, 1, 1, 1]],
    ['SQL: JOIN / SUM / GROUP BY', 'sql/join', [0, 0, 1, 0, 1, 1]],
    ['SQL: LIMIT / OFFSET', 'sql/paging', [0, 0, 0, 0, 1, 0]],
  ];

  FR.content.exam = {
    id: 'exam', kind: 'exam', navTitle: 'ชั้นเตรียมสอบ', title: 'ชั้นเตรียมสอบ', num: '✎',
    page(main, { md, h }) {
      const page = h('article', { class: 'read' });
      const ref = (r) => { const x = FR.markup.resolve(r); return x ? h('a', { class: 'xref ex-ref', href: x.href, title: x.label }, r) : h('span', { class: 'badref' }, r); };
      page.append(
        h('div', { class: 'eyebrow' }, h('span', { class: 'chip exam' }, 'เตรียมสอบ'), h('span', { class: 'chip' }, 'ที่มา: exam_questions/ + review_final_app')),
        h('h1', null, 'ชั้นเตรียมสอบ'),
        FR.markup.el('p', 'ข้อสอบจริงจะ **กำหนด entity มาให้** แล้วให้ออกแบบ Model, Provider, UI ที่ CRUD กับ SQLite ได้ถูกต้อง โดยเริ่มจาก starter ที่น่าจะหน้าตาเหมือน `ex_13` **ก่อนทำการบ้าน** (ยังไม่มีหน้าฟอร์ม)', { class: 'lede' }));
      page.appendChild(FR.blocks.one({ t: 'callout', kind: 'warn', title: 'ex_13 ในเครื่องคือ “ตัวอย่างที่ทำเสร็จแล้ว” ไม่ใช่ starter', body: 'โฟลเดอร์ `ex_13` มีหน้า `AddEditTransactionScreen`, คอลัมน์ `note` (version 2) และเทสต์ครบแล้ว — ใช้เป็นแบบอ่านเทียบ ([[code/ex13|walkthrough ex_13]]) แต่ตอนซ้อมให้เริ่มจากโครงที่ยังไม่มีหน้าฟอร์ม' }, {}));

      // 1) formula
      page.appendChild(h('h2', null, 'สูตร 7 ขั้นเมื่อได้ entity มา'));
      page.appendChild(FR.markup.el('p', 'จากคอมเมนต์หัวไฟล์ `review_final_app/lib/chapters/ch13/expense/providers/transaction_provider.dart` — ทำตามลำดับนี้แล้วรันทดสอบทุกขั้น', { class: 'dim' }));
      const fl = h('ol', { class: 'ex-formula' });
      FORMULA.forEach(([t, d, r], i) => fl.appendChild(h('li', null, h('span', { class: 'ex-fn' }, String(i + 1)), h('div', null, h('b', null, t), h('div', { html: md(d) })), ref(r))));
      page.appendChild(fl);

      // 2) timeline
      page.appendChild(h('h2', null, 'ลำดับเวลาในห้องสอบ (ตัวอย่างสำหรับ 90 นาที)'));
      const total = TIMELINE.reduce((s, x) => s + x[0], 0);
      const bar = h('div', { class: 'ex-tl' });
      let acc = 0;
      TIMELINE.forEach(([m, t, d], i) => {
        const seg = h('div', { class: 'ex-tl-s c' + i, style: { flexGrow: String(m) }, tabindex: '0', title: d }, h('b', null, `${acc}–${acc + m}`), h('span', null, t));
        acc += m;
        bar.appendChild(seg);
      });
      page.appendChild(bar);
      const tlList = h('ul', { class: 'ex-tl-list' });
      acc = 0;
      TIMELINE.forEach(([m, t, d]) => { tlList.appendChild(h('li', { html: md(`**นาทีที่ ${acc}–${acc + m}** ${t} — ${d}`) })); acc += m; });
      page.appendChild(tlList);
      page.appendChild(FR.markup.el('p', `รวม ${total} นาที — ถ้าเวลาไม่พอ **ทำให้ CRUD พื้นฐานรันได้ก่อน** แล้วค่อยเพิ่มส่วนพิเศษ (คะแนนส่วนใหญ่อยู่ที่ Model/Provider/UI ที่ถูกต้อง)`, { class: 'dim' }));

      // 3) checklist
      page.appendChild(h('h2', null, 'เช็กลิสต์ “จุดที่ผู้สอบมักพลาด” (บันทึกในเครื่อง)'));
      const sumEl = h('div', { class: 'ex-sum' });
      const allIds = CHECK.flatMap((g) => g.items.map((x) => 'exam:' + x[0]));
      function sum() { const n = allIds.filter((id) => FR.store.checked(id)).length; sumEl.innerHTML = md(`ติ๊กแล้ว **${n}/${allIds.length}** ข้อ`); }
      page.appendChild(sumEl);
      CHECK.forEach((g) => {
        const box = h('div', { class: 'ex-group' }, h('h3', null, g.g));
        g.items.forEach(([id, text, r]) => {
          const key = 'exam:' + id;
          const cb = h('input', { type: 'checkbox', id: 'cb-' + id });
          cb.checked = FR.store.checked(key);
          cb.addEventListener('change', () => { FR.store.setCheck(key, cb.checked); row.classList.toggle('on', cb.checked); sum(); });
          const row = h('div', { class: 'ex-ck' + (cb.checked ? ' on' : '') }, cb, h('label', { for: 'cb-' + id, html: md(text) }), ref(r));
          box.appendChild(row);
        });
        page.appendChild(box);
      });
      page.appendChild(h('div', { class: 'btn-row' }, FR.util.btn('ล้างเช็กลิสต์ (เริ่มรอบซ้อมใหม่)', () => { allIds.forEach((id) => FR.store.setCheck(id, false)); FR.app.route(); }, 'sm ghost')));
      sum();

      // 4) questions
      page.appendChild(h('h2', null, 'โจทย์ซ้อม 6 ข้อ'));
      page.appendChild(FR.markup.el('p', 'ไฟล์โจทย์อยู่ที่ `exam_questions/` (มีเกณฑ์ให้คะแนน สถานการณ์ทดสอบ และแนวเฉลยพับไว้ท้ายไฟล์) — ลองทำเองก่อนเปิดเฉลย', { class: 'dim' }));
      const grid = h('div', { class: 'ex-qs' });
      QS.forEach((q) => {
        grid.appendChild(h('div', { class: 'ex-q lv-' + (q.lv === 'ง่าย' ? 'e' : q.lv === 'ปานกลาง' ? 'm' : 'h') },
          h('div', { class: 'ex-q-hd' }, h('span', { class: 'ex-q-n' }, 'ข้อ ' + q.n), h('span', { class: 'chip' }, q.lv), h('span', { class: 'dim' }, q.time)),
          h('div', { class: 'ex-q-ent', html: md(q.ent) }),
          h('div', { class: 'ex-q-w', html: md(q.what) }),
          h('div', { class: 'sq-cap' }, 'กับดักที่โจทย์เตือน'),
          h('ul', { class: 'ex-q-tr' }, q.traps.map((t) => h('li', { html: md(t) }))),
          h('div', { class: 'ex-q-ft' }, q.topics.map(ref), h('a', { class: 'btn sm ghost', href: '../exam_questions/' + q.file, target: '_blank', rel: 'noopener' }, 'เปิดไฟล์โจทย์'))));
      });
      page.appendChild(grid);

      // 5) matrix
      page.appendChild(h('h2', null, 'แผนที่: โจทย์ข้อไหนวัดหัวข้ออะไร'));
      const tbl = h('table', { class: 'tbl ex-mx' });
      tbl.appendChild(h('thead', null, h('tr', null, h('th', null, 'หัวข้อ'), [1, 2, 3, 4, 5, 6].map((n) => h('th', null, 'ข้อ ' + n)))));
      const tb = h('tbody');
      MATRIX.forEach(([t, r, cells]) => {
        const x = FR.markup.resolve(r);
        tb.appendChild(h('tr', null, h('td', null, x ? h('a', { class: 'xref', href: x.href }, t) : t), cells.map((c) => h('td', { class: c ? 'y' : 'n' }, c ? '✔' : ''))));
      });
      tbl.appendChild(tb);
      page.appendChild(h('div', { class: 'tbl-wrap' }, tbl));

      page.appendChild(FR.blocks.one({ t: 'callout', kind: 'note', title: 'เรื่อง API ในข้อ 6', body: 'ข้อ 6 ใช้ Open-Meteo (ไม่ต้องมี API key) แต่ข้อสอบจริงอาจใช้ API อื่น — หลักการเหมือนกันทุกเจ้า: แยก service / repository / provider, เขียน API → DB ด้วย transaction แล้วให้หน้าจออ่านจาก DB เท่านั้น · ถ้า API ต้องใช้ key ห้าม commit key ลง repo ที่ส่งตรวจ' }, {}));
      main.appendChild(page);
    },
  };
})();
