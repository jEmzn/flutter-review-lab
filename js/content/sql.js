/* ส่วนเสริม — SQL ที่โจทย์ใช้ (ไม่อยู่ในตำราแบบละเอียด) + playground บน SQLite จริง */
FR.content.sql = {
  id: 'sql', kind: 'supp', num: 'S', navTitle: 'SQL ที่โจทย์ใช้', crumb: 'SQL',
  title: 'SQL ที่โจทย์ใช้ + Playground',
  problem: 'ตำราสอน `insert/query/update/delete` กับ `where: \'id = ?\'` แต่โจทย์ซ้อมต้องการมากกว่านั้น: **ค้นหาด้วย LIKE, นับด้วย COUNT, รวมยอดด้วย SUM, จัดกลุ่ม, JOIN สองตาราง, แบ่งหน้า, ช่วงเวลา และจัดการ constraint ชนกัน** — ทุกภาพในหน้านี้รันบน **SQLite จริง** (sql.js รุ่นเดียวกับที่ใช้ในบทที่ 13) ข้อมูลตั้งต้นตาม entity ของโจทย์แต่ละข้อ',
  overview: [
    { t: 'callout', kind: 'supp', title: 'ทำไมต้องรู้ SQL มากกว่า CRUD', body: 'เกณฑ์ให้คะแนนของโจทย์หลายข้อ **ห้ามคำนวณใน Dart** เช่น “นับด้วย `COUNT(*)` ไม่ใช่วนนับใน Dart” (ข้อ 2), “ห้ามคำนวณ `total` โดยดึงรายการลูกทั้งหมดมาวนบวก” และ “ห้ามแบ่งหน้าด้วย `sublist`” (ข้อ 5) — เหตุผลเดียวกันทุกข้อ: **ให้ SQLite ทำงานใกล้ข้อมูล แล้วส่งมาเฉพาะคำตอบ** แทนการลากทุกแถวข้ามมาฝั่ง Dart' },
    { t: 'h', text: 'SQLite อ่านคำสั่ง SELECT ตามลำดับนี้ (ไม่ใช่ลำดับที่เขียน)' },
    { t: 'steps', items: [
      '`FROM` + `JOIN` — เอาแถวจากตาราง (JOIN อาจ **ขยาย** จำนวนแถว)',
      '`WHERE` — ตัด **แถว** ที่ไม่ตรงเงื่อนไข (ยังใช้ SUM/COUNT ไม่ได้)',
      '`GROUP BY` — ยุบแถวที่ค่าเหมือนกันเป็นกลุ่ม',
      '`HAVING` — ตัด **กลุ่ม** (ใช้ SUM/COUNT ได้)',
      '`SELECT` — คำนวณคอลัมน์ผลลัพธ์ + ตั้งชื่อด้วย `AS`',
      '`ORDER BY` — เรียง (ควรมีตัวตัดสินสุดท้ายที่ไม่ซ้ำ เช่น `id`)',
      '`LIMIT` / `OFFSET` — ตัดเอาหน้าที่ต้องการ',
    ] },
    { t: 'compare', cols: ['โจทย์', 'SQL ที่ต้องใช้', 'หัวข้อ'], rows: [
      ['ข้อ 1 สินค้า', 'ORDER BY name · `where id = ?`', '[[sql/basics]] [[sql/order]]'],
      ['ข้อ 2 งาน', 'where ประกอบหลายเงื่อนไข · LIKE ผ่าน ? · COUNT · partial update', '[[sql/where]] [[sql/like]] [[sql/agg]] [[sql/partial]]'],
      ['ข้อ 3 สมุดโทรศัพท์', 'UNIQUE + DatabaseException · LEFT JOIN + `AS group_name` · COUNT · ลบแม่ใน transaction', '[[sql/constraints]] [[sql/join]] [[sql/agg]]'],
      ['ข้อ 4 ไดอารี่', 'ALTER TABLE ADD COLUMN · สร้างตารางใหม่ + `INSERT INTO … SELECT`', '[[13.8]] [[sql/playground]]'],
      ['ข้อ 5 ร้านกาแฟ', 'LEFT JOIN + SUM + GROUP BY + COALESCE · LIMIT/OFFSET ผ่าน ? · ช่วงเวลา · CHECK · `id = ? AND status = ?`', '[[sql/join]] [[sql/group]] [[sql/paging]] [[sql/dates]] [[sql/partial]]'],
      ['ข้อ 6 สภาพอากาศ', 'LEFT JOIN แคชที่อาจไม่มี · UNIQUE(lat, lon) · ลบ+แทรกแคชใน transaction', '[[sql/join]] [[sql/upsert]] [[13.10]]'],
    ] },
  ],
  sections: [
    {
      id: 'basics', short: 'query()', tag: 'พื้นฐาน', supp: true,
      title: 'query() ของ sqflite คือ SQL ที่ถูกประกอบให้',
      gist: 'พารามิเตอร์ของ `db.query()` แต่ละตัวคือ **ชิ้นส่วนหนึ่งของคำสั่ง SELECT**: `columns` → SELECT, `where` → WHERE, `groupBy` → GROUP BY, `having`, `orderBy`, `limit`, `offset` · เมื่อต้องการ **JOIN หรือฟังก์ชันรวมที่ตั้งชื่อ** จึงใช้ `rawQuery(sql, args)` — ซึ่งยังต้องส่งค่าทาง `?` เหมือนเดิม',
      blocks: [
        { t: 'compare', cols: ['พารามิเตอร์ query()', 'กลายเป็น', 'ตัวอย่าง'], rows: [
          ["`'products'`", '`FROM products`', ''],
          ["`columns: ['id', 'name']`", '`SELECT id, name`', 'ไม่ระบุ = `SELECT *`'],
          ["`where: 'quantity = ?'`", '`WHERE quantity = ?`', 'สตริงคงที่ที่เราเขียนเอง'],
          ['`whereArgs: [0]`', 'ค่าที่ถูก **ผูก** แทน `?` ตามลำดับ', 'ค่าจากผู้ใช้อยู่ตรงนี้เท่านั้น'],
          ["`orderBy: 'name ASC'`", '`ORDER BY name ASC`', ''],
          ['`limit: 10, offset: 20`', '`LIMIT 10 OFFSET 20`', 'หน้าที่ 3 ถ้าหน้าละ 10'],
        ] },
        { t: 'viz', id: 'sql.lab', title: 'ร้านขายของชำ (ข้อ 1) — กดคำสั่งแล้วดู Dart → SQL → ผลลัพธ์', props: { seed: 'shop', presets: [
          { label: 'อ่านทั้งหมด A→Z', sql: 'SELECT * FROM products ORDER BY name ASC', dart: "await db.query('products', orderBy: 'name ASC');" },
          { label: 'เฉพาะบางคอลัมน์', sql: 'SELECT id, name FROM products', dart: "await db.query('products', columns: ['id', 'name']);" },
          { label: 'สินค้าหมด', sql: 'SELECT * FROM products WHERE quantity = ?', args: '[0]', dart: "await db.query('products', where: 'quantity = ?', whereArgs: [0]);" },
          { label: 'หน้า 2 (หน้าละ 3)', sql: 'SELECT * FROM products ORDER BY name ASC, id ASC LIMIT 3 OFFSET 3', dart: "await db.query('products', orderBy: 'name ASC, id ASC', limit: 3, offset: 3);" },
          { label: 'มูลค่าสต็อก (ต้อง rawQuery)', sql: 'SELECT COALESCE(SUM(price * quantity), 0) AS stock_value FROM products', note: 'ฟังก์ชันรวมที่ต้องการชื่อคอลัมน์ชัดเจน (`AS stock_value`) เขียนผ่าน `rawQuery` อ่านง่ายกว่า' },
        ] }, try: 'กดปุ่มคำสั่งทีละปุ่ม แล้วแก้ SQL ในกล่องเองได้ (Ctrl+Enter = รัน)' },
        { t: 'why', choice: 'ใช้ `query()` เมื่อเป็นตารางเดียว และ `rawQuery(sql, args)` เมื่อมี JOIN / ฟังก์ชันรวม / เงื่อนไขซับซ้อน',
          because: ['`query()` สั้นและกันพิมพ์คีย์เวิร์ดผิด', '`rawQuery` เขียน SQL ได้เต็มรูปแบบ แต่ **ค่าจากผู้ใช้ยังต้องเข้าทาง `?` + args** เหมือนกัน'],
          alts: [
            { alt: 'ทำไมไม่ใช้ rawQuery ทุกที่ให้เหมือนกันหมด?', result: 'ทำได้ แต่ต้องเขียน `SELECT … FROM … WHERE …` เองทุกครั้ง และเผลอต่อสตริงด้วย `$` ง่ายกว่า' },
            { alt: 'ทำไมไม่ query ทั้งตารางแล้วกรอง/เรียง/นับใน Dart?', result: 'ทุกแถวต้องข้ามจาก SQLite มาเป็น Map ใน Dart (ช้าและเปลืองหน่วยความจำเมื่อข้อมูลโต) และ **ผิดเกณฑ์ของโจทย์** ที่ระบุให้ใช้ SQL' },
          ] },
        { t: 'kv', items: [
          ['`rawQuery(sql, [args])`', 'คืน `List<Map<String, Object?>>`'],
          ['`rawInsert(sql, [args])`', 'คืน **id** ของแถวใหม่'],
          ['`rawUpdate` / `rawDelete`', 'คืน **จำนวนแถว** ที่ถูกแก้/ลบ'],
          ['`execute(sql)`', 'ไม่คืนค่า — ใช้กับ CREATE / ALTER / DROP'],
        ] },
      ],
      quiz: [
        { q: "`db.query('tasks', where: 'is_done = ?', whereArgs: [0], orderBy: 'due_date ASC', limit: 5)` สร้าง SQL แบบใด?", options: [
          { t: '`SELECT * FROM tasks WHERE is_done = ? ORDER BY due_date ASC LIMIT 5` โดยผูก 0 แทน ?', ok: true },
          { t: "`SELECT * FROM tasks WHERE is_done = '0' …` (ต่อสตริง)", why: 'whereArgs ไม่ต่อสตริง — ผูกค่าแยกจากคำสั่ง' },
          { t: '`SELECT is_done FROM tasks …`', why: 'ไม่ระบุ columns = `SELECT *`' },
        ] },
        { q: '`rawUpdate(...)` คืนค่าอะไร?', options: [
          { t: 'จำนวนแถวที่ถูกแก้', ok: true },
          { t: 'id ของแถวที่ถูกแก้', why: 'id คืนจาก insert/rawInsert' },
          { t: 'List ของแถวที่ถูกแก้', why: 'คืน int' },
        ] },
      ],
    },
    {
      id: 'where', short: 'WHERE', tag: 'ข้อ 2, 5', supp: true, exam: true,
      title: 'WHERE หลายเงื่อนไข: ประกอบ clauses + args',
      gist: 'ตัวกรองที่ผู้ใช้เลือกได้ (สถานะ, คำค้น, ระดับ) → เก็บ **รายการเงื่อนไข `clauses`** กับ **รายการค่า `args`** คู่กันไป แล้ว `where: clauses.join(\' AND \')`, `whereArgs: args` · ชิ้นส่วนที่ต่อเข้า SQL เป็น **ข้อความคงที่ที่เราเขียนเอง** ส่วนค่าจากผู้ใช้อยู่ใน args เสมอ · ระวัง `= NULL` (ไม่มีวันจริง) ต้องใช้ `IS NULL`',
      blocks: [
        { t: 'viz', id: 'sql.where', name: 'where', title: 'ตัวกรอง + ค้นหา ของโจทย์ข้อ 2 (tasks)', try: 'เลือกตัวกรองหลายแบบพร้อมกัน แล้วดูว่า clauses/args โตไปด้วยกันอย่างไร · กด “O\'Neil” แล้วเปิด “ต่อสตริงด้วย $”' },
        { t: 'code', title: 'แนวเฉลยข้อ 2 (ย่อ)', src: `Future<void> fetchAndSetTasks() async {
  final db = await _initDatabase();
  final clauses = <String>[];
  final args = <Object?>[];
  if (_filter == TaskFilter.pending) { clauses.add('is_done = ?'); args.add(0); }
  if (_filter == TaskFilter.done)    { clauses.add('is_done = ?'); args.add(1); }
  if (_search.trim().isNotEmpty) {
    clauses.add('title LIKE ?');
    args.add('%\${_search.trim()}%');  // ค่าผู้ใช้อยู่ใน args ไม่ใช่ในคำสั่ง SQL
  }
  final rows = await db.query(
    'tasks',
    where: clauses.isEmpty ? null : clauses.join(' AND '),
    whereArgs: args.isEmpty ? null : args,
    orderBy: 'is_done ASC, due_date ASC',
  );
  _tasks = rows.map(Task.fromMap).toList();
  notifyListeners();
}`, notes: [
          { at: 'final clauses = <String>[];', note: 'ชิ้นส่วน SQL ที่ **เราเขียนเอง** (มี `?` เป็นช่องว่าง)' },
          { at: 'final args = <Object?>[];', note: 'ค่าที่จะผูกแทน `?` — เพิ่ม **ทุกครั้งที่** เพิ่ม clause ที่มี `?` ลำดับจึงตรงกันเสมอ' },
          { at: "where: clauses.isEmpty ? null : clauses.join(' AND '),", note: 'ไม่มีตัวกรอง → `null` (ไม่ใช่สตริงว่าง ซึ่งจะได้ `WHERE` เปล่าแล้ว SQL พัง)' },
        ] },
        { t: 'why', choice: 'ประกอบ **clauses + args** แบบคู่ขนาน',
          because: ['ตัวกรองแต่ละตัวเปิด/ปิดอิสระ ได้ SQL ถูกทุกชุด', 'ค่าทุกตัวผ่าน `?` → ไม่มีช่อง SQL Injection และ `\'` ในคำค้นไม่ทำให้พัง'],
          alts: [
            { alt: "ทำไมไม่เขียน `where: \"title LIKE '%$kw%'\"` ให้จบในบรรทัดเดียว?", result: "คำค้นที่มี `'` (เช่น O'Neil) ทำให้ SQL พัง และเปิดช่อง SQL Injection — เกณฑ์ข้อ 2 ตัดคะแนนตรงนี้", viz: { name: 'where', mode: 'concat' } },
            { alt: 'ทำไมไม่เขียน if-else ครบทุกชุดของตัวกรอง (ทั้งหมด×ค้นหา×…)?', result: 'จำนวนชุดโตแบบทวีคูณ (3 สถานะ × มี/ไม่มีคำค้น × 4 ระดับ = 24 แบบ) และแก้ทีหลังลำบาก' },
          ] },
        { t: 'callout', kind: 'warn', title: 'NULL เปรียบเทียบด้วย = ไม่ได้', body: "`WHERE group_id = ?` กับ `whereArgs: [null]` → **ได้ 0 แถวเสมอ** เพราะ `NULL = NULL` ไม่ใช่ true (เป็น NULL) · ผู้ติดต่อที่ “ไม่มีกลุ่ม” ต้องใช้ `WHERE group_id IS NULL` (ไม่มี `?`) — ประกอบ clause ตามค่า: `groupId == null ? 'group_id IS NULL' : 'group_id = ?'`" },
        { t: 'callout', kind: 'note', title: 'AND มาก่อน OR — ใส่วงเล็บเมื่อผสม', body: "`status = ? OR status = ? AND customer_name LIKE ?` ถูกอ่านเป็น `status = ? OR (status = ? AND …)` · ถ้าตั้งใจอีกแบบต้องเขียน `(status = ? OR status = ?) AND customer_name LIKE ?` หรือใช้ `status IN (?, ?)`" },
      ],
      quiz: [
        { q: 'ไม่มีตัวกรองใดถูกเลือก ควรส่ง `where` เป็นอะไร?', options: [
          { t: '`null` (และ whereArgs เป็น null)', ok: true },
          { t: "`''` สตริงว่าง", why: "sqflite จะไม่ใส่ WHERE เมื่อเป็นสตริงว่างก็จริง แต่ `whereArgs: []` ไม่ตรงกับ ? — ใช้ null ชัดเจนที่สุด" },
          { t: "`'1 = 1'`", why: 'ใช้ได้ แต่ไม่จำเป็น' },
        ] },
        { q: "ต้องการหาผู้ติดต่อที่ไม่มีกลุ่ม ข้อใดได้ผลถูกต้อง?", options: [
          { t: "`where: 'group_id IS NULL'`", ok: true },
          { t: "`where: 'group_id = ?', whereArgs: [null]`", why: 'NULL = NULL ไม่เป็นจริง → 0 แถว' },
          { t: "`where: 'group_id = 0'`", why: 'ไม่มีกลุ่มเก็บเป็น NULL ไม่ใช่ 0' },
        ] },
        { type: 'spot', q: 'บรรทัดไหนทำให้แอปพังเมื่อผู้ใช้ค้นหาคำว่า `O\'Neil`?', code: `final clauses = <String>[];
final args = <Object?>[];
if (_filter == TaskFilter.done) { clauses.add('is_done = ?'); args.add(1); }
if (_search.isNotEmpty) clauses.add("title LIKE '%$_search%'");
final rows = await db.query('tasks',
    where: clauses.isEmpty ? null : clauses.join(' AND '),
    whereArgs: args.isEmpty ? null : args);`, bad: `if (_search.isNotEmpty) clauses.add("title LIKE '%$_search%'");`, explain: "ต่อคำค้นเข้าไปในคำสั่ง → `'` ปิดสตริงกลางทาง (และเป็น SQL Injection) · ที่ถูก: `clauses.add('title LIKE ?'); args.add('%$_search%');`" },
      ],
    },
    {
      id: 'like', short: 'LIKE', tag: 'ข้อ 2, 5', supp: true, exam: true,
      title: 'ค้นหาด้วย LIKE ผ่าน ?',
      gist: "`%` = อะไรก็ได้กี่ตัวก็ได้ · `_` = อักขระใดก็ได้ 1 ตัว · **สร้าง “ค่า” ที่มี % ใน Dart แล้วส่งทาง args**: `where: 'name LIKE ?', whereArgs: ['%$kw%']` · LIKE ของ SQLite ไม่สนตัวพิมพ์เฉพาะ A–Z · ถ้าผู้ใช้พิมพ์ `%` หรือ `_` เอง ต้อง escape (เสริม)",
      blocks: [
        { t: 'viz', id: 'sql.like', title: 'LIKE กับรายการสินค้า (ข้อ 1)', try: 'ลอง `lat`, `LAT`, `O\'B` แล้วลอง `%` กับ `_` ทั้งเปิดและปิด “escape”' },
        { t: 'why', choice: "ใส่ `%` ไว้ใน **ค่า** (`'%$kw%'`) แล้วส่งทาง `whereArgs`",
          because: ['ส่วนคำสั่ง `name LIKE ?` คงที่ ไม่มีข้อความผู้ใช้ปน', '`\'` ในคำค้นถูกเก็บเป็นข้อมูลตามจริง ไม่ทำให้ SQL พัง'],
          alts: [
            { alt: "ทำไมไม่เขียน `where: \"name LIKE '%$kw%'\"`?", result: 'SQL Injection + พังเมื่อมี `\'` (ข้อสอบตัดคะแนนตรงนี้ทั้งข้อ 2 และข้อ 5)' },
            { alt: "ทำไมไม่เขียน `where: \"name LIKE '%?%'\"`?", result: '`?` ที่อยู่ **ในเครื่องหมายคำพูด** เป็นแค่ตัวอักษร ? ธรรมดา ไม่ใช่ช่องผูกค่า → ค้นหาคำว่า “?” จริงๆ และ whereArgs เกินจำนวนช่อง (error)' },
          ] },
        { t: 'callout', kind: 'supp', title: 'escape เมื่อผู้ใช้พิมพ์ % หรือ _ (เกินตำรา)', body: [
          "ผู้ใช้ค้นหา “100%” → ค่าที่ส่งคือ `'%100%%'` ซึ่ง `%` ตัวท้ายเป็น wildcard → เจอทุกอย่างที่มี “100” · ถ้าต้องการให้ตรงตัวอักษร:",
          { t: 'code', src: `final esc = kw.replaceAll(r'\\', r'\\\\').replaceAll('%', r'\\%').replaceAll('_', r'\\_');
final rows = await db.query('products',
    where: r"name LIKE ? ESCAPE '\\'",
    whereArgs: ['%$esc%']);` },
          'เช็กลิสต์ข้อสอบให้ทดสอบ “ใส่ข้อความที่มี `\'` และ `%`” — ขั้นต่ำคือ **แอปต้องไม่พัง** (ผ่านด้วย args) ส่วนการ escape เป็นการขัดเกลาเพิ่ม',
        ] },
        { t: 'callout', kind: 'real', title: 'ตัวพิมพ์เล็ก-ใหญ่', body: 'LIKE ของ SQLite (ค่าเริ่มต้น) ไม่สนตัวพิมพ์ **เฉพาะตัวอักษร ASCII A–Z** — ภาษาไทยไม่มีตัวพิมพ์จึงไม่กระทบ แต่ตัวอักษรอย่าง `Ä/ä` ถือว่าต่างกัน (ทดลองใน sql.js 3.45 ที่ใช้ในเว็บนี้)' },
      ],
      quiz: [
        { q: 'ค้นหาสินค้าที่ชื่อ “มีคำ” ที่ผู้ใช้พิมพ์ ข้อใดถูกต้อง?', options: [
          { t: "`where: 'name LIKE ?', whereArgs: ['%$kw%']`", ok: true },
          { t: "`where: \"name LIKE '%$kw%'\"`", why: 'ต่อสตริง → injection / พังเมื่อมี \'' },
          { t: "`where: \"name LIKE '%?%'\", whereArgs: [kw]`", why: '? ในเครื่องหมายคำพูดไม่ใช่ placeholder' },
          { t: "`where: 'name = ?', whereArgs: [kw]`", why: 'ตรงทั้งคำเท่านั้น ไม่ใช่ “มีคำ”' },
        ] },
        { q: "ผู้ใช้พิมพ์ `_` แล้วค้นด้วย `'%$kw%'` (ไม่ escape) ผลคือ?", options: [
          { t: 'ได้ทุกชื่อที่ยาวอย่างน้อย 1 ตัวอักษร เพราะ _ คือ wildcard 1 ตัว', ok: true },
          { t: 'ได้เฉพาะชื่อที่มีเครื่องหมาย _', why: 'ต้อง escape ก่อนถึงจะตรงตัวอักษร' },
          { t: 'SQL error', why: 'ไม่ error' },
        ] },
      ],
    },
    {
      id: 'order', short: 'ORDER BY', tag: 'ข้อ 1, 5', supp: true,
      title: 'ORDER BY หลายคีย์ และตัวตัดสินที่ไม่ซ้ำ',
      gist: "`orderBy: 'is_favorite DESC, name ASC'` = เรียงด้วยคีย์แรก ถ้าเท่ากันค่อยใช้คีย์ถัดไป · แถวที่ค่าเท่ากันทุกคีย์ **SQL ไม่รับประกันลำดับ** → ใส่คีย์ที่ไม่ซ้ำ (`id`) ปิดท้ายเสมอ เช่น `created_at DESC, id DESC` · วันที่แบบ ISO-8601 เรียงตามตัวอักษร = เรียงตามเวลา",
      blocks: [
        { t: 'viz', id: 'sql.order', title: '12 ออเดอร์ที่สร้างใน 2 วินาที (เวลาซ้ำกัน)', try: 'อยู่ที่ `created_at DESC` แล้วสลับ “มี index” — สังเกตหน้า 2 · จากนั้นเปลี่ยนเป็น `created_at DESC, id DESC` แล้วสลับ index อีกครั้ง' },
        { t: 'callout', kind: 'real', title: 'ทดลองกับ SQLite จริง', body: 'คำสั่งเดียวกันทุกตัวอักษร `ORDER BY created_at DESC LIMIT 4 OFFSET 4` ให้หน้า 2 เป็น `#11 #12 #1 #2` เมื่อไม่มี index และ `#8 #7 #6 #5` เมื่อมี index — เพราะ SQLite เลือกวิธีค้นต่างกัน · ในแอปจริงแผนการค้นเปลี่ยนได้เมื่อเพิ่ม index ใน onUpgrade, เปลี่ยนเงื่อนไข WHERE/JOIN หรืออุปกรณ์ใช้ SQLite คนละรุ่น' },
        { t: 'why', choice: "ปิดท้าย `orderBy` ด้วยคอลัมน์ที่ไม่ซ้ำ (`id`)",
          because: ['ลำดับถูกกำหนดครบทุกแถว → ผลเหมือนกันทุกครั้ง ไม่ว่า SQLite จะค้นแบบไหน', 'การแบ่งหน้าด้วย OFFSET ต้องการลำดับที่คงที่ ไม่งั้นหน้าที่ 2 อาจมีรายการซ้ำ/ตกหล่น (เกณฑ์ “ORDER BY เสถียร” ข้อ 5)', 'ex_13 ใช้ `date DESC, id DESC` ด้วยเหตุผลเดียวกัน'],
          alts: [
            { alt: 'ทดสอบแล้วลำดับก็เหมือนเดิมทุกครั้ง ทำไมต้องใส่?', result: 'ที่เหมือนเดิมเป็นเพราะ “แผนการค้นตอนนี้” ไม่ใช่สิ่งที่ SQL สัญญา — ภาพด้านบนแสดงว่าแค่เพิ่ม index ลำดับก็เปลี่ยน' },
          ] },
        { t: 'callout', kind: 'note', title: 'ISO-8601 เรียงได้เพราะอะไร', body: '`2026-10-14T08:30:00.000` เรียงจากหน่วยใหญ่ไปเล็ก (ปี→เดือน→วัน→ชั่วโมง…) และเติม 0 ข้างหน้าให้ยาวเท่ากัน การเรียงแบบตัวอักษรจึงตรงกับการเรียงตามเวลา — **ตราบใดที่ทุกแถวใช้รูปแบบและเขตเวลาเดียวกัน** ([[sql/dates]])' },
      ],
      quiz: [
        { q: "`orderBy: 'is_favorite DESC, name ASC'` เรียงอย่างไร?", options: [
          { t: 'รายการโปรด (1) ขึ้นก่อน แล้วภายในกลุ่มเดียวกันเรียงชื่อ A→Z', ok: true },
          { t: 'เรียงชื่อก่อน แล้วค่อยรายการโปรด', why: 'คีย์แรกมีความสำคัญสูงสุด' },
          { t: 'รายการโปรดอยู่ท้าย', why: 'DESC → 1 มาก่อน 0' },
        ] },
        { q: 'ทำไมโจทย์ข้อ 5 กำหนด `ORDER BY o.created_at DESC, o.id DESC` แทน `created_at DESC` อย่างเดียว?', options: [
          { t: 'ให้ลำดับคงที่เมื่อเวลาเท่ากัน การแบ่งหน้าจะไม่ซ้ำ/ตกหล่น', ok: true },
          { t: 'เพราะ created_at เรียงไม่ได้', why: 'เรียงได้ (ISO)' },
          { t: 'ให้เร็วขึ้น', why: 'ไม่ใช่เหตุผล' },
        ] },
      ],
    },
    {
      id: 'agg', short: 'COUNT/SUM', tag: 'ข้อ 2, 3, 5', supp: true, exam: true,
      title: 'COUNT / SUM และการอ่านค่าใน Dart',
      gist: 'ฟังก์ชันรวมยุบหลายแถวเป็น **1 ค่า** · `COUNT(*)` ของชุดว่าง = 0 แต่ **`SUM` ของชุดว่าง = NULL** → ใช้ `COALESCE(SUM(...), 0)` · อ่านจำนวนเต็มด้วย `Sqflite.firstIntValue(rows) ?? 0` · อ่านเงิน (REAL) ด้วย `(rows.first[\'total\'] as num).toDouble()` — **ห้ามใช้ firstIntValue กับ SUM ของ REAL**',
      blocks: [
        { t: 'viz', id: 'sql.agg', title: 'order_items ของร้านกาแฟ (ข้อ 5)', try: 'เลือก SUM(ราคา×จำนวน) → ดูวิธีอ่านแบบที่ 1 (ได้ 0!) · เปลี่ยนเป็น order_id = 8 (ชุดว่าง) → แบบที่ 2 พัง → เปิด COALESCE' },
        { t: 'code', title: 'ตัวอย่างจากแนวเฉลยข้อ 2 และ 3', src: `// ข้อ 2: จำนวนงานค้างทั้งหมด (ไม่ขึ้นกับตัวกรอง)
_pendingCount = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM tasks WHERE is_done = 0')) ?? 0;

// ข้อ 3: นับสมาชิกของกลุ่ม — ค่าจากผู้ใช้ผ่าน ?
final rows = await db.rawQuery(
    'SELECT COUNT(*) FROM contacts WHERE group_id = ?', [groupId]);
return Sqflite.firstIntValue(rows) ?? 0;

// ข้อ 5 / แลป 13: ผลรวมเงิน (REAL) → อ่านผ่าน num
final r = await db.rawQuery(
    'SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = ?', ['expense']);
final total = (r.first['total'] as num).toDouble();`, notes: [
          { at: "Sqflite.firstIntValue(", note: 'คืนค่าคอลัมน์แรกของแถวแรกเป็น `int?` — เหมาะกับ `COUNT(*)` เพราะได้จำนวนเต็มเสมอ' },
          { at: "'SELECT COALESCE(SUM(amount), 0) AS total", note: '`AS total` ตั้งชื่อคอลัมน์ให้อ่านด้วย `r.first[\'total\']` ได้ · COALESCE กัน NULL เมื่อไม่มีแถว' },
          { at: "final total = (r.first['total'] as num).toDouble();", note: 'SUM ของ REAL ได้ double, ถ้าเป็น COALESCE(…, 0) ตอนไม่มีแถวได้ int 0 → อ่านผ่าน `num` รับได้ทั้งคู่' },
        ] },
        { t: 'callout', kind: 'real', title: 'Sqflite.firstIntValue กับผลรวมทศนิยม (ตรวจจากซอร์ส sqflite_common 2.5.13)', body: '`firstIntValue` เอาค่าแรกมา **`toString()` แล้ว `int.tryParse`** (`lib/utils/utils.dart`, `lib/src/utils.dart`) → ค่าอย่าง `675.0` หรือ `32.5` แปลงไม่ได้ ได้ **null** → `?? 0` กลายเป็น 0 **โดยไม่มี error** · ใช้ firstIntValue กับ COUNT/SUM ของ INTEGER เท่านั้น' },
        { t: 'why', choice: 'คำนวณยอดรวม/จำนวนด้วย **SQL** แล้วส่งมาแค่ 1 แถว',
          because: ['ไม่ต้องลากทุกแถวมาเป็น Map ใน Dart', 'ค่าที่แสดงตรงกับฐานข้อมูลเสมอ (แม้ลิสต์บนจอถูกกรองหรือแบ่งหน้าอยู่)', 'ตรงเกณฑ์ข้อ 2 (COUNT) และข้อ 5 (ห้ามวนบวก)'],
          alts: [
            { alt: 'ทำไมไม่ `_tasks.where((t) => !t.isDone).length`?', result: '`_tasks` คือรายการ **หลังกรอง/ค้นหา** — ถ้าผู้ใช้กรอง “เสร็จแล้ว” อยู่ ค่าจะเป็น 0 ทั้งที่ยังมีงานค้าง (โจทย์ข้อ 2 ระบุให้นับ “ทั้งหมดในตาราง ไม่ขึ้นกับตัวกรอง”)' },
            { alt: 'ทำไมไม่ใช้ SUM เฉยๆ ไม่ต้อง COALESCE?', result: 'ไม่มีแถว (เช่นวันนี้ยังขายไม่ได้) → NULL → `as num` พังด้วย TypeError' },
          ] },
      ],
      quiz: [
        { q: '`SELECT SUM(qty) FROM order_items WHERE order_id = 999` (ไม่มีแถวตรง) ได้อะไร?', options: [
          { t: 'NULL', ok: true },
          { t: '0', why: 'COUNT ได้ 0 แต่ SUM ได้ NULL' },
          { t: 'error', why: 'ไม่ error' },
        ] },
        { q: "`Sqflite.firstIntValue(await db.rawQuery('SELECT SUM(price) FROM products')) ?? 0` เมื่อ price เป็น REAL และผลรวมคือ 527.5 ได้ค่าใด?", options: [
          { t: '0 — firstIntValue แปลง "527.5" เป็น int ไม่ได้ จึงคืน null', ok: true },
          { t: '527', why: 'ไม่ปัดเศษ — tryParse ล้มเหลวทั้งค่า' },
          { t: '528', why: 'ไม่ปัด' },
        ] },
        { type: 'multi', q: 'ข้อใดเป็นวิธีที่ถูกในการได้ “ยอดคงเหลือ” ของแลป 13 (เลือกทุกข้อที่ถูก)', options: [
          { t: "`rawQuery(\"SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS balance FROM transactions\")`", ok: true },
          { t: "อ่านด้วย `(rows.first['balance'] as num).toDouble()`", ok: true },
          { t: 'ดึงทุกรายการแล้ว fold ใน Dart', why: 'ทำได้แต่ไม่ตรงเจตนาของความท้าทายข้อ 2 (ให้ใช้ SUM)' },
          { t: "อ่านด้วย `Sqflite.firstIntValue(rows)`", why: 'ยอดเงินเป็นทศนิยม → null' },
        ] },
      ],
    },
    {
      id: 'group', short: 'GROUP BY', tag: 'ข้อ 3, 5', supp: true,
      title: 'GROUP BY และ HAVING',
      gist: '`GROUP BY x` ยุบแถวที่ `x` เท่ากันเป็น **1 แถวต่อกลุ่ม** แล้วฟังก์ชันรวมคำนวณแยกต่อกลุ่ม · `WHERE` กรอง **แถว** ก่อนจัดกลุ่ม · `HAVING` กรอง **กลุ่ม** หลังรวม (ใช้ SUM/COUNT ได้) · ลืม GROUP BY เมื่อใช้ SUM ร่วมกับคอลัมน์อื่น = ได้แถวเดียว',
      blocks: [
        { t: 'viz', id: 'sql.group', name: 'group', title: 'เมนูขายดี: SUM(qty) ต่อเมนู', try: 'เลื่อน HAVING · เปิด WHERE qty >= 2 แล้วเทียบว่าแถวไหนหายก่อนจัดกลุ่ม · ลอง “ลืม GROUP BY”' },
        { t: 'compare', cols: ['', 'WHERE', 'HAVING'], rows: [
          ['ทำงานกับ', 'แต่ละ **แถว**', 'แต่ละ **กลุ่ม**'],
          ['เวลา', 'ก่อน GROUP BY', 'หลัง GROUP BY'],
          ['ใช้ SUM/COUNT ได้ไหม', 'ไม่ได้ (misuse of aggregate)', 'ได้'],
          ['ตัวอย่าง', "`WHERE status = 'paid'`", '`HAVING SUM(qty) >= 3`'],
        ] },
        { t: 'callout', kind: 'exam', title: 'จุดที่โจทย์ข้อ 5 เตือนไว้', body: '“ลืม `GROUP BY` → ได้แถวเดียวหรือแถวซ้ำ” — คิวรีรายการออเดอร์ที่มี `SUM(i.unit_price * i.qty)` ต้องมี `GROUP BY o.id` เสมอ ไม่งั้นทุกออเดอร์ถูกยุบรวมเป็นแถวเดียว ([[sql/join]])' },
        { t: 'callout', kind: 'real', title: 'SQLite ยอมให้รันแม้ความหมายผิด', body: '`SELECT product_name, SUM(qty) FROM order_items` (ไม่มี GROUP BY) — ฐานข้อมูลอื่นหลายตัวจะ error แต่ SQLite ยอมรัน และใส่ `product_name` จากแถวใดแถวหนึ่ง จึงไม่มีอะไรเตือนว่าผิด ต้องดูจากจำนวนแถวที่ได้' },
      ],
      quiz: [
        { q: 'ต้องการเฉพาะเมนูที่ขายได้รวมอย่างน้อย 3 แก้ว ใช้อะไร?', options: [
          { t: '`GROUP BY product_name HAVING SUM(qty) >= 3`', ok: true },
          { t: '`WHERE SUM(qty) >= 3 GROUP BY product_name`', why: 'WHERE ใช้ฟังก์ชันรวมไม่ได้' },
          { t: '`WHERE qty >= 3`', why: 'กรองทีละแถว ไม่ใช่ผลรวม' },
        ] },
        { type: 'order', q: 'เรียงลำดับที่ SQLite ประมวลผล', items: ['FROM / JOIN', 'WHERE', 'GROUP BY', 'HAVING', 'SELECT (+ AS)', 'ORDER BY', 'LIMIT / OFFSET'] },
      ],
    },
    {
      id: 'join', short: 'JOIN', tag: 'ข้อ 3, 5, 6', supp: true, exam: true,
      title: 'INNER vs LEFT JOIN (+ GROUP BY + COALESCE)',
      gist: '`JOIN` (INNER) เก็บเฉพาะแถวที่ **จับคู่ได้** · `LEFT JOIN` เก็บ **ทุกแถวของตารางซ้าย** แม้ไม่มีคู่ (ฝั่งขวาเป็น NULL) → ใช้ LEFT เมื่อแม่อาจไม่มีลูก (ออเดอร์ไม่มีรายการ, ผู้ติดต่อไม่มีกลุ่ม, เมืองยังไม่มีแคช) · JOIN ขยายจำนวนแถว → ต้อง `GROUP BY` แม่ แล้ว `COALESCE(SUM(...), 0)`',
      blocks: [
        { t: 'viz', id: 'sql.join', name: 'join', title: 'orders ⟷ order_items', try: 'ไล่ปุ่มจากซ้ายไปขวา: INNER → LEFT → + GROUP BY + SUM → + COALESCE · ดูออเดอร์ #4' },
        { t: 'code', lang: 'sql', title: 'คิวรีรายการของข้อ 5 (อ่านทีละบรรทัด)', src: `SELECT o.*, COALESCE(SUM(i.unit_price * i.qty), 0) AS total
FROM orders o
LEFT JOIN order_items i ON i.order_id = o.id
WHERE o.customer_name LIKE ? AND o.status = ?
GROUP BY o.id
ORDER BY o.created_at DESC, o.id DESC
LIMIT ? OFFSET ?`, notes: [
          { at: 'SELECT o.*, COALESCE', note: '`o.*` = ทุกคอลัมน์ของ orders · `AS total` คือชื่อที่ `CoffeeOrder.fromMap` อ่าน (ไม่มีคอลัมน์ total ในตาราง)' },
          { at: 'FROM orders o', note: '`o` คือชื่อย่อ (alias) — จำเป็นเมื่อสองตารางมีคอลัมน์ชื่อซ้ำ เช่น `id`' },
          { at: 'LEFT JOIN order_items i ON i.order_id = o.id', note: 'LEFT → ออเดอร์ที่ยังไม่มีรายการยังอยู่ (เกณฑ์ “COALESCE ให้ออเดอร์ที่ไม่มีลูกเป็น 0”)' },
          { at: 'GROUP BY o.id', note: 'ยุบแถวที่ JOIN ขยายออก กลับเป็น 1 แถวต่อออเดอร์' },
          { at: 'LIMIT ? OFFSET ?', note: 'ค่าแบ่งหน้าก็ผ่าน `?` ได้ ([[sql/paging]])' },
        ] },
        { t: 'why', choice: '`LEFT JOIN` เมื่อฝั่งขวา **อาจไม่มี**',
          because: ['ข้อ 3: ผู้ติดต่อที่ไม่มีกลุ่มต้องยังแสดง (group_name = null)', 'ข้อ 5: ออเดอร์ที่ยังไม่มีรายการต้องยังแสดง (total = 0)', 'ข้อ 6: เมืองที่ยังไม่เคยดึงสภาพอากาศต้องยังแสดง (แคชเป็น null)'],
          alts: [
            { alt: 'ทำไมไม่ใช้ JOIN ธรรมดา (INNER)?', result: 'แถวที่ไม่มีคู่ **หายไปจากผลลัพธ์เงียบๆ** — ทั้งข้อ 5 และข้อ 6 ระบุเป็นจุดที่ผู้สอบมักพลาด', viz: { name: 'join', mode: 'inner' } },
            { alt: 'ทำไมไม่ query สองตารางแยกแล้วจับคู่ใน Dart?', result: 'ต้องอ่านลูกทุกแถว (ข้อ 5 ห้ามวนบวกใน Dart) และเขียนโค้ดจับคู่เองซึ่งพลาดง่าย' },
          ] },
        { t: 'callout', kind: 'exam', title: 'คอลัมน์ที่ได้จาก JOIN ห้ามกลับเข้า toMap', body: "`Contact.fromMap` อ่าน `map['group_name'] as String?` ได้ แต่ `Contact.toMap()` **ต้องไม่มี** `'group_name'` — ไม่งั้น insert/update พังด้วย `table contacts has no column named group_name` (ข้อ 3) · ทำนองเดียวกับ `total` ใน `CoffeeOrder` (ข้อ 5)" },
      ],
      quiz: [
        { q: 'แสดงรายชื่อเมืองทั้งหมดพร้อมอุณหภูมิที่แคชไว้ (บางเมืองยังไม่เคยดึง) ใช้ JOIN แบบใด?', options: [
          { t: '`FROM cities c LEFT JOIN weather_current w ON w.city_id = c.id`', ok: true },
          { t: '`FROM cities c JOIN weather_current w ON w.city_id = c.id`', why: 'เมืองที่ไม่มีแคชหายจากลิสต์' },
          { t: '`FROM weather_current w LEFT JOIN cities c ON …`', why: 'ตารางซ้ายผิด — เก็บทุกแคช ไม่ใช่ทุกเมือง' },
        ] },
        { q: 'คิวรี LEFT JOIN + SUM แต่ลืม `GROUP BY o.id` ได้ผลอย่างไร?', options: [
          { t: 'ได้แถวเดียว ยอดรวมของทุกออเดอร์ปนกัน', ok: true },
          { t: 'ได้ทุกออเดอร์ตามปกติ', why: 'SUM ยุบทุกแถวเมื่อไม่มี GROUP BY' },
          { t: 'error', why: 'SQLite ยอมรัน' },
        ] },
        { type: 'spot', q: 'บรรทัดไหนทำให้ insert ผู้ติดต่อพัง?', code: `Map<String, Object?> toMap() => {
  if (id != null) 'id': id,
  'name': name,
  'phone': phone,
  'is_favorite': isFavorite ? 1 : 0,
  'group_id': groupId,
  'group_name': groupName,
};`, bad: "'group_name': groupName,", explain: '`group_name` ได้มาจาก JOIN เท่านั้น ไม่มีคอลัมน์นี้ในตาราง contacts → `table contacts has no column named group_name`' },
      ],
    },
    {
      id: 'paging', short: 'LIMIT/OFFSET', tag: 'ข้อ 5', supp: true, exam: true,
      title: 'แบ่งหน้าด้วย LIMIT / OFFSET',
      gist: '`LIMIT ? OFFSET ?` กับ args `[_pageSize, _page * _pageSize]` · `_hasMore = page.length == _pageSize` · `loadMore()` เริ่มด้วย `if (_isLoadingMore || !_hasMore) return;` · เปลี่ยนคำค้น/ตัวกรอง = `refresh()` (ล้างลิสต์ + `_page = 0`) · ต้องมี ORDER BY ที่เสถียร',
      blocks: [
        { t: 'viz', id: 'sql.pager', title: '35 ออเดอร์ หน้าละ 10', try: 'กด loadMore จนหมด (ดู `_hasMore`) → refresh → loadMore 1 ครั้ง → กด “ออเดอร์ใหม่เข้ามา” → loadMore อีกครั้ง (มีรายการซ้ำ) · ลองเปิด “sublist ใน Dart” แล้วดูตัวนับแถวที่ข้ามมา' },
        { t: 'code', title: 'loadMore ของแนวเฉลยข้อ 5', src: `Future<void> loadMore() async {
  if (_isLoadingMore || !_hasMore) return;   // กันเรียกซ้อน + หยุดเมื่อหมด
  _isLoadingMore = true;
  notifyListeners();
  try {
    final db = await _initDatabase();
    final rows = await db.rawQuery('''
      SELECT o.*, COALESCE(SUM(i.unit_price * i.qty), 0) AS total
      FROM orders o LEFT JOIN order_items i ON i.order_id = o.id
      $where
      GROUP BY o.id
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT ? OFFSET ?''', [...args, _pageSize, _page * _pageSize]);
    final page = rows.map(CoffeeOrder.fromMap).toList();
    _orders.addAll(page);
    _hasMore = page.length == _pageSize;
    _page++;
  } finally {
    _isLoadingMore = false;
    notifyListeners();
  }
}`, notes: [
          { at: 'if (_isLoadingMore || !_hasMore) return;', note: 'ScrollController ยิง listener หลายครั้งต่อการเลื่อนหนึ่งครั้ง — ถ้าไม่กัน หน้าเดียวกันถูกต่อท้ายซ้ำ' },
          { at: '      $where', note: '`$where` คือ **ชิ้นส่วนคงที่** ที่เราประกอบเอง (`WHERE o.status = ?` หรือว่าง) — ค่าจริงอยู่ใน args' },
          { at: "LIMIT ? OFFSET ?''', [...args, _pageSize, _page * _pageSize]);", note: 'ลำดับใน list ต้องตรงกับลำดับของ `?` ในคำสั่ง: ค่าของ WHERE ก่อน แล้วค่อย LIMIT, OFFSET' },
          { at: '_hasMore = page.length == _pageSize;', note: 'ได้ไม่เต็มหน้า = หมดแล้ว · (ถ้าจำนวนพอดีกับหน้า จะมีการเรียกเพิ่ม 1 ครั้งที่ได้ 0 แถว ซึ่งรับได้)' },
        ] },
        { t: 'why', choice: 'ให้ SQLite ตัดหน้าด้วย **LIMIT/OFFSET**',
          because: ['แต่ละครั้งข้ามมา Dart แค่ 10 แถว', 'ตรงเกณฑ์ “ห้ามแบ่งหน้าโดยโหลดทั้งตารางแล้ว sublist”'],
          alts: [
            { alt: 'ทำไมไม่ query ทั้งหมดครั้งเดียวแล้ว `sublist` ทีละหน้า?', result: 'ทุกการโหลดหน้าใหม่ลากทั้งตารางมา (ดูตัวนับในภาพ) — ความหมายของการแบ่งหน้าหายไป' },
          ] },
        { t: 'callout', kind: 'supp', title: 'ทำไมมีรายการซ้ำเมื่อมีออเดอร์ใหม่ระหว่างเลื่อน', body: 'OFFSET นับ “ตำแหน่ง” ไม่ใช่ “รายการ” — ออเดอร์ใหม่ที่ขึ้นบนสุดดันทุกแถวลง 1 ตำแหน่ง หน้าถัดไปจึงเริ่มที่แถวที่เคยแสดงแล้ว · ทางที่โจทย์ใช้: หลัง `createOrder` เรียก `refresh()` (เริ่มหน้าแรกใหม่) · ทางขั้นสูงคือ keyset pagination (`WHERE (created_at, id) < (?, ?)`) ซึ่งเกินขอบเขต' },
      ],
      quiz: [
        { q: 'หน้าละ 10 รายการ ต้องการหน้าที่ 3 (นับหน้าแรกเป็น 0) ใช้ args ใด?', options: [
          { t: '`[10, 20]` สำหรับ `LIMIT ? OFFSET ?`', ok: true },
          { t: '`[10, 30]`', why: 'หน้า index 2 → offset 2×10 = 20' },
          { t: '`[20, 10]`', why: 'สลับลำดับกับ ?' },
        ] },
        { q: 'ผู้ใช้พิมพ์คำค้นใหม่ ควรทำอะไรก่อนโหลด?', options: [
          { t: 'ล้าง `_orders`, ตั้ง `_page = 0`, `_hasMore = true` แล้วโหลดหน้าแรก', ok: true },
          { t: 'เรียก loadMore ต่อเลย', why: 'ผลค้นหาใหม่จะไปต่อท้ายผลเก่า' },
          { t: 'ไม่ต้องทำอะไร', why: 'ลิสต์ไม่เปลี่ยน' },
        ] },
      ],
    },
    {
      id: 'dates', short: 'ช่วงเวลา', tag: 'ข้อ 5', supp: true,
      title: 'ช่วงเวลา: “ยอดขายวันนี้” ด้วยสตริง ISO',
      gist: 'วันนี้ = **ช่วงครึ่งเปิด** `created_at >= start AND created_at < end` โดย `start = DateTime(y, m, d)`, `end = start + 1 วัน` ส่งเป็น `toIso8601String()` ทาง whereArgs · ห้าม `BETWEEN … 23:59:59` (ตกเสี้ยววินาทีสุดท้าย) · ทั้งแอปต้องเก็บเวลา **รูปแบบเดียวกัน** (local ทั้งหมด หรือ UTC ทั้งหมด)',
      blocks: [
        { t: 'viz', id: 'sql.dates', title: 'ออเดอร์รอบเที่ยงคืน', try: 'สลับสามวิธี แล้วดูแถวสีแดง · เปิด “#5 บันทึกเป็น UTC”' },
        { t: 'code', title: 'todayRevenue ของแนวเฉลยข้อ 5', src: `final now = DateTime.now();
final start = DateTime(now.year, now.month, now.day);
final end = DateTime(now.year, now.month, now.day + 1);
final rows = await db.rawQuery('''
  SELECT COALESCE(SUM(i.unit_price * i.qty), 0) AS revenue
  FROM orders o JOIN order_items i ON i.order_id = o.id
  WHERE o.status = ? AND o.created_at >= ? AND o.created_at < ?''',
  [OrderStatus.paid.name, start.toIso8601String(), end.toIso8601String()]);
_todayRevenue = (rows.first['revenue'] as num).toDouble();`, notes: [
          { at: 'final end = DateTime(now.year, now.month, now.day + 1);', note: '`DateTime` จัดการวันที่ 32 → วันที่ 1 ของเดือนถัดไปให้เอง (ปลอดภัยกว่า `start.add(Duration(days: 1))` ในประเทศที่มีเวลาออมแสง)' },
          { at: 'FROM orders o JOIN order_items i ON i.order_id = o.id', note: 'ใช้ JOIN ธรรมดาได้ เพราะต้องการเฉพาะออเดอร์ที่มีรายการ (และ COALESCE ปิดกรณีไม่มีเลย)' },
          { at: 'WHERE o.status = ? AND o.created_at >= ? AND o.created_at < ?', note: '`>=` ต้นวัน และ `<` ต้นวันถัดไป — ครอบทุกเสี้ยววินาทีโดยไม่ต้องรู้ว่าเก็บละเอียดถึงหลักไหน' },
        ] },
        { t: 'why', choice: 'ช่วงครึ่งเปิด `[ต้นวันนี้, ต้นวันพรุ่งนี้)`',
          because: ['ไม่ตกขอบใดๆ ไม่ว่าเวลาจะมีมิลลิ/ไมโครวินาที', 'ใช้ index ของ created_at ได้ (เปรียบเทียบช่วง)'],
          alts: [
            { alt: "ทำไมไม่ใช้ `BETWEEN '…T00:00:00' AND '…T23:59:59'`?", result: '`23:59:59.900` มากกว่า `23:59:59` (สตริงยาวกว่า) → ออเดอร์ช่วงเสี้ยววินาทีสุดท้ายของวันตกหล่น' },
            { alt: "ทำไมไม่ใช้ `LIKE '2026-10-14%'`?", result: 'ใช้ได้ถ้าข้อมูลสะอาด แต่ผูกกับรูปแบบสตริงตรงตัว และพังทันทีถ้ามีบางแถวเป็น UTC' },
          ] },
        { t: 'callout', kind: 'warn', title: 'local กับ UTC ห้ามปนกัน', body: '`DateTime.now().toIso8601String()` → `2026-10-14T00:00:00.000` (ไม่มี Z) · `DateTime.now().toUtc().toIso8601String()` → `2026-10-13T17:00:00.000Z` (เวลาเดียวกันในไทย) — สองแบบนี้เรียงตามตัวอักษรแล้ว **ไม่ตรงกับเวลาจริง** · เลือกแบบเดียวทั้งแอป ([[13.7]])' },
      ],
      quiz: [
        { q: 'เงื่อนไขใดนับ “ออเดอร์ของวันที่ 14” ได้ครบทุกกรณี?', options: [
          { t: "`created_at >= '2026-10-14T00:00:00.000' AND created_at < '2026-10-15T00:00:00.000'`", ok: true },
          { t: "`created_at BETWEEN '2026-10-14T00:00:00' AND '2026-10-14T23:59:59'`", why: 'ตก 23:59:59.xxx' },
          { t: "`created_at = '2026-10-14'`", why: 'เท่ากันเฉพาะสตริงที่ตรงทุกตัว' },
        ] },
      ],
    },
    {
      id: 'constraints', short: 'Constraint', tag: 'ข้อ 3, 5', supp: true, exam: true,
      title: 'Constraint ชนกัน → DatabaseException → ข้อความที่ผู้ใช้เข้าใจ',
      gist: '`UNIQUE` / `NOT NULL` / `CHECK` ถูกบังคับเสมอ → sqflite โยน **`DatabaseException`** · จับด้วย `on DatabaseException catch (e)` + `e.isUniqueConstraintError()` แล้วแปลงเป็นข้อความ (“ชื่อกลุ่มนี้มีอยู่แล้ว”) · `FOREIGN KEY` **ไม่ถูกบังคับ** จนกว่าจะ `PRAGMA foreign_keys = ON` → โจทย์ให้จัดการลูกเองใน transaction',
      blocks: [
        { t: 'viz', id: 'sql.lab', title: 'สมุดโทรศัพท์ (ข้อ 3) — ลองชน constraint', props: { seed: 'contacts', presets: [
          { label: 'กลุ่มชื่อซ้ำ (UNIQUE)', sql: 'INSERT INTO groups(name) VALUES (?)', args: "['ครอบครัว']", dart: "await db.insert('groups', {'name': 'ครอบครัว'});" },
          { label: 'เบอร์เป็น null (NOT NULL)', sql: 'INSERT INTO contacts(name, phone) VALUES (?, ?)', args: "['ป้าแดง', null]", dart: "await db.insert('contacts', {'name': 'ป้าแดง', 'phone': null});" },
          { label: 'ไม่ใส่ is_favorite (DEFAULT 0)', sql: 'INSERT INTO contacts(name, phone) VALUES (?, ?)', args: "['ลุงดำ', '081-000-0000']", dart: "await db.insert('contacts', {'name': 'ลุงดำ', 'phone': '081-000-0000'});" },
          { label: 'ใส่ group_name ใน toMap', sql: 'INSERT INTO contacts(name, phone, group_name) VALUES (?, ?, ?)', args: "['เอ', '080', 'ครอบครัว']", dart: "await db.insert('contacts', contact.toMap());  // toMap มี 'group_name'" },
          { label: 'ลบกลุ่มตรงๆ (FK ไม่ถูกบังคับ)', sql: 'DELETE FROM groups WHERE id = ?', args: '[1]', note: 'ลบได้โดยไม่มี error — ดูตาราง contacts: แม่กับพี่ต้นยังมี `group_id = 1` ที่ชี้ไปกลุ่มที่ไม่มีแล้ว (Dropdown ที่ value = 1 จะ assert ว่าไม่มี item)' },
          { label: 'เปิด PRAGMA foreign_keys แล้วลบ', sql: `PRAGMA foreign_keys = ON;
DELETE FROM groups WHERE id = 2;`, note: 'เมื่อเปิดการบังคับ FK การลบแม่ที่ยังมีลูกถูกปฏิเสธ — ใน sqflite เปิดด้วย `onConfigure: (db) => db.execute(\'PRAGMA foreign_keys = ON\')` (โจทย์ข้อ 3 ระบุว่าไม่ต้องพึ่งสิ่งนี้)' },
        ] }, try: 'กดทีละปุ่ม ดูข้อความ error จริง และบรรทัด `on DatabaseException catch (e)` ใน log' },
        { t: 'code', title: 'แปลง UNIQUE ชนกัน → ข้อความของแอป (แนวเฉลยข้อ 3)', src: `class DuplicateGroupException implements Exception {
  const DuplicateGroupException();
}

Future<void> addGroup(String name) async {
  final db = await DatabaseHelper.instance.database;
  try {
    await db.insert('groups', {'name': name.trim()});
  } on DatabaseException catch (e) {
    if (e.isUniqueConstraintError()) throw const DuplicateGroupException();
    rethrow; // error อื่นไม่ใช่เรื่องชื่อซ้ำ อย่ากลืน
  }
  await fetchAndSetGroups();
}

// ใน dialog
try {
  await context.read<GroupProvider>().addGroup(_ctrl.text);
  if (!context.mounted) return;
  Navigator.pop(context);
} on DuplicateGroupException {
  setState(() => _error = 'ชื่อกลุ่มนี้มีอยู่แล้ว'); // dialog ไม่ปิด
}`, notes: [
          { at: 'if (e.isUniqueConstraintError()) throw const DuplicateGroupException();', note: 'เมธอดตัวช่วยของ `DatabaseException` ใน sqflite: `isUniqueConstraintError`, `isNotNullConstraintError`, `isNoSuchTableError`, `isSyntaxError`, `isDuplicateColumnError` … (ไม่มีตัวสำหรับ CHECK/FK)' },
          { at: 'rethrow; // error อื่นไม่ใช่เรื่องชื่อซ้ำ อย่ากลืน', note: 'ไม่กลืนทุก error เป็น “ชื่อซ้ำ” — ไม่งั้นดีบักไม่ได้' },
          { at: 'setState(() => _error = \'ชื่อกลุ่มนี้มีอยู่แล้ว\'); // dialog ไม่ปิด', note: 'เกณฑ์ข้อ 3: “dialog ชื่อซ้ำไม่ปิด”' },
        ] },
        { t: 'why', choice: 'ให้ **UNIQUE ในฐานข้อมูล** เป็นด่านสุดท้าย แล้วจับ exception',
          because: ['ฐานข้อมูลรับประกันได้จริงแม้มีสองทางเข้าพร้อมกัน', 'Provider แปลงเป็น exception ของแอปที่ UI เข้าใจ'],
          alts: [
            { alt: 'ทำไมไม่ query ดูก่อนว่าชื่อซ้ำไหม แล้วค่อย insert?', result: 'ใช้เป็น UX เสริมได้ (เตือนตั้งแต่พิมพ์) แต่ระหว่าง “ตรวจ” กับ “insert” อาจมีการเพิ่มชื่อเดียวกันแทรกเข้ามา — UNIQUE ยังต้องมีอยู่ดี' },
          ] },
        { t: 'viz', id: 'sql.lab', title: 'CHECK + transaction: ออเดอร์ที่มีรายการผิดต้องหายทั้งก้อน (ข้อ 5 T6)', props: { seed: 'pos', tables: ['orders', 'order_items'], presets: [
          { label: 'ไม่มี transaction (ออเดอร์ค้าง)', sql: `INSERT INTO orders(customer_name, created_at, status) VALUES ('ทดสอบ rollback', '2026-10-14T17:00:00.000', 'pending');
INSERT INTO order_items(order_id, product_name, unit_price, qty) VALUES (last_insert_rowid(), 'Latte', 55, 1);
INSERT INTO order_items(order_id, product_name, unit_price, qty) VALUES ((SELECT MAX(id) FROM orders), 'Mocha', 60, 0);`, note: 'แถวที่ 3 ชน `CHECK(qty > 0)` แต่ออเดอร์และรายการแรกถูกบันทึกไปแล้ว → **ออเดอร์ครึ่งๆ กลางๆ ค้างในระบบ** (ดูตาราง)' },
          { label: 'ใน transaction (rollback)', sql: `BEGIN;
INSERT INTO orders(customer_name, created_at, status) VALUES ('ทดสอบ rollback', '2026-10-14T17:00:00.000', 'pending');
INSERT INTO order_items(order_id, product_name, unit_price, qty) VALUES (last_insert_rowid(), 'Latte', 55, 1);
INSERT INTO order_items(order_id, product_name, unit_price, qty) VALUES ((SELECT MAX(id) FROM orders), 'Mocha', 60, 0);
COMMIT;`, note: 'ชน CHECK ภายใน transaction → **ROLLBACK ทั้งก้อน** ไม่มีออเดอร์ค้าง — ตรงกับ `db.transaction((txn) async {...})` ที่โยน exception' },
        ] }, try: 'รันแบบแรก แล้วดูตาราง orders (มีออเดอร์ค้าง) → กดรีเซ็ต → รันแบบที่สอง' },
      ],
      quiz: [
        { q: 'insert กลุ่มชื่อซ้ำกับ `name TEXT NOT NULL UNIQUE` ใน sqflite เกิดอะไร?', options: [
          { t: 'โยน `DatabaseException` ที่ `isUniqueConstraintError()` เป็น true', ok: true },
          { t: 'insert คืนค่า 0', why: 'คืน 0 เฉพาะเมื่อใช้ ConflictAlgorithm.ignore' },
          { t: 'แทนที่แถวเดิมอัตโนมัติ', why: 'ต้องระบุ replace เอง' },
        ] },
        { q: 'ประกาศ `FOREIGN KEY(group_id) REFERENCES groups(id)` แล้วลบกลุ่มที่ยังมีสมาชิก (ไม่ได้เปิด PRAGMA) ผลคือ?', options: [
          { t: 'ลบได้ สมาชิกยังมี group_id ชี้ไปกลุ่มที่ไม่มีแล้ว', ok: true },
          { t: 'error FOREIGN KEY constraint failed', why: 'SQLite ไม่บังคับ FK จนกว่าจะเปิด PRAGMA foreign_keys = ON' },
          { t: 'สมาชิกถูกลบตาม', why: 'ต้องมี ON DELETE CASCADE และเปิด FK' },
        ] },
      ],
    },
    {
      id: 'upsert', short: 'conflictAlgorithm', tag: 'ข้อ 6', supp: true,
      title: 'conflictAlgorithm: abort / ignore / replace',
      gist: '`db.insert(..., conflictAlgorithm: ...)` บอกว่าทำอะไรเมื่อชน UNIQUE/PK · ไม่ระบุ = **abort** (โยน exception) · **ignore** = ไม่แทรก ไม่มี error คืน 0 · **replace** = **ลบแถวเดิมแล้วแทรกใหม่** → id ใหม่ + คอลัมน์ที่ไม่ได้ส่งหาย + แถวลูกกำพร้า · ถ้าตั้งใจ “มีแล้วให้แก้” ใช้ `update` เฉพาะคอลัมน์ (0 แถว → ค่อย insert)',
      blocks: [
        { t: 'viz', id: 'sql.upsert', name: 'upsert', title: 'cities UNIQUE(latitude, longitude) + forecast_days', try: 'กดทั้งสี่ปุ่มตามลำดับ (รีเซ็ตก่อน replace) · ดู id, nickname และ “แถวกำพร้า”' },
        { t: 'compare', cols: ['ConflictAlgorithm', 'เมื่อชน', 'insert คืน', 'ใช้เมื่อ'], rows: [
          ['(ไม่ระบุ) / abort', 'โยน DatabaseException', '—', 'อยากรู้ว่าซ้ำ แล้วบอกผู้ใช้ (ข้อ 3, ข้อ 6 addCity)'],
          ['ignore', 'ไม่ทำอะไร ไม่มี error', '**0**', 'ข้อมูลชุดเดิมถูกต้องอยู่แล้ว ไม่ต้องแจ้ง'],
          ['replace', '**DELETE แถวเดิม** แล้ว INSERT', 'id ใหม่', 'แถวไม่มีลูกอ้างถึง และส่ง **ทุกคอลัมน์** มาครบ (เช่นแคชที่ PK คือ city_id)'],
        ] },
        { t: 'why', choice: 'ไม่ใช้ `replace` กับแถวที่ “มีคนอ้างถึง” หรือมีคอลัมน์ที่ผู้ใช้ตั้งเอง',
          because: ['replace ไม่ใช่ “แก้ไข” แต่เป็น “ลบแล้วสร้างใหม่”'],
          alts: [
            { alt: 'replace ดูเหมือน upsert สะดวกดี ทำไมไม่ใช้กับ cities?', result: 'Bangkok ได้ id ใหม่ → `nickname` ที่ผู้ใช้ตั้งหาย และ `forecast_days` / `weather_current` ของ id เดิมกลายเป็นแถวกำพร้า', viz: { name: 'upsert', mode: 'replace' } },
          ] },
        { t: 'callout', kind: 'supp', title: 'INSERT … ON CONFLICT DO UPDATE (upsert แท้) — ระวังรุ่น SQLite', body: 'SQLite 3.24 ขึ้นไปมี `INSERT INTO cities(...) VALUES (...) ON CONFLICT(latitude, longitude) DO UPDATE SET name = excluded.name` ซึ่งแก้แถวเดิมโดย id ไม่เปลี่ยน — แต่ sqflite บน Android ใช้ SQLite ของระบบ ซึ่ง **Android 10 ลงไปเป็นรุ่นต่ำกว่า 3.24** จึงใช้ไม่ได้ทุกเครื่อง (หลักเดียวกับเรื่อง ALTER TABLE ใน [[13.8]]) · ทางที่ใช้ได้ทุกเครื่อง: `update` ก่อน ถ้าได้ 0 ค่อย `insert`' },
      ],
      quiz: [
        { q: '`ConflictAlgorithm.replace` ทำอะไรเมื่อชน UNIQUE?', options: [
          { t: 'ลบแถวเดิมที่ชน แล้วแทรกแถวใหม่ (ได้ id ใหม่)', ok: true },
          { t: 'แก้เฉพาะคอลัมน์ที่ส่งมาในแถวเดิม', why: 'นั่นคือ update / ON CONFLICT DO UPDATE' },
          { t: 'ข้ามไปเฉยๆ', why: 'นั่นคือ ignore' },
        ] },
        { q: '`db.insert(..., conflictAlgorithm: ConflictAlgorithm.ignore)` แล้วชน — ค่าที่คืน?', options: [
          { t: '0 (ไม่ได้แทรก)', ok: true },
          { t: 'id ของแถวเดิม', why: 'ไม่คืน id เดิม' },
          { t: 'โยน exception', why: 'ignore ไม่โยน' },
        ] },
      ],
    },
    {
      id: 'partial', short: 'update บางคอลัมน์', tag: 'ข้อ 2, 3, 5', supp: true, exam: true,
      title: 'update เฉพาะคอลัมน์ + เงื่อนไขสถานะ + ใช้ค่าที่คืน',
      gist: "`db.update('contacts', {'is_favorite': 1}, where: 'id = ?', whereArgs: [id])` แก้ **เฉพาะคอลัมน์ใน Map** · เปลี่ยนสถานะอย่างปลอดภัย: `where: 'id = ? AND status = ?'` แล้ว **ตรวจค่าที่คืน** (0 = ไม่ได้แก้ เช่นถูกยกเลิกไปแล้ว) · ช่องที่ผู้ใช้ลบจนว่าง → เก็บ NULL",
      blocks: [
        { t: 'viz', id: 'sql.lab', title: 'ร้านกาแฟ (ข้อ 5) — markPaid / cancel', props: { seed: 'pos', tables: ['orders'], presets: [
          { label: 'markPaid #7 (pending)', sql: 'UPDATE orders SET status = ? WHERE id = ? AND status = ?', args: "['paid', 7, 'pending']", dart: "final n = await db.update('orders', {'status': OrderStatus.paid.name}, where: 'id = ? AND status = ?', whereArgs: [7, OrderStatus.pending.name]);", note: 'กดซ้ำอีกครั้ง → ได้ **0** เพราะ #7 ไม่ใช่ pending แล้ว → UI แสดง “ออเดอร์นี้เปลี่ยนสถานะไปแล้ว”' },
          { label: 'cancel #6 (paid ไปแล้ว)', sql: 'UPDATE orders SET status = ? WHERE id = ? AND status = ?', args: "['cancelled', 6, 'pending']", dart: "final n = await db.update('orders', {'status': OrderStatus.cancelled.name}, where: 'id = ? AND status = ?', whereArgs: [6, OrderStatus.pending.name]);", note: 'ได้ 0 → ยกเลิกออเดอร์ที่จ่ายแล้วไม่ได้ (กันกดซ้ำ/กดจากหน้าจอเก่า)' },
          { label: 'markPaid แบบไม่เช็กสถานะ (ผิด)', sql: 'UPDATE orders SET status = ? WHERE id = ?', args: "['paid', 9]", dart: "await db.update('orders', {'status': 'paid'}, where: 'id = ?', whereArgs: [9]);", note: '#9 ถูกยกเลิกไปแล้วแต่กลายเป็น paid — **จุดที่ผู้สอบมักพลาด** ในข้อ 5' },
          { label: 'แก้ชื่อลูกค้าอย่างเดียว', sql: 'UPDATE orders SET customer_name = ? WHERE id = ?', args: "['คุณจี (แก้ชื่อ)', 7]", dart: "await db.update('orders', {'customer_name': name}, where: 'id = ?', whereArgs: [id]);" },
        ] }, try: 'กด markPaid #7 สองครั้ง แล้วดู “แถวที่ถูกแก้”' },
        { t: 'why', choice: 'ส่ง Map ที่มี **เฉพาะคอลัมน์ที่เปลี่ยน**',
          because: ['ไม่เขียนทับคอลัมน์อื่นด้วยค่าเก่าจากอ็อบเจกต์ที่ถืออยู่ (อาจล้าสมัย)', 'ตรงเกณฑ์ “toggleFavorite อัปเดตเฉพาะคอลัมน์” (ข้อ 3) และ partial update (ข้อ 2)'],
          alts: [
            { alt: "ทำไมไม่ `update('contacts', contact.copyWith(isFavorite: true).toMap(), ...)`?", result: 'ทำงานได้ แต่เขียนทุกคอลัมน์จากอ็อบเจกต์ในหน่วยความจำ — ถ้าอีกหน้าจอเพิ่งแก้เบอร์โทร ค่าใหม่ถูกทับด้วยค่าเก่า' },
          ] },
        { t: 'why', choice: "เปลี่ยนสถานะด้วย `where: 'id = ? AND status = ?'` แล้วใช้จำนวนแถวที่คืน",
          because: ['ฐานข้อมูลตรวจและแก้ใน **คำสั่งเดียว** — ไม่มีช่องว่างระหว่าง “อ่านสถานะ” กับ “เขียน”', '`n == 1` บอก UI ได้ทันทีว่าสำเร็จหรือไม่'],
          alts: [
            { alt: 'ทำไมไม่ query ดูสถานะก่อนแล้วค่อย update?', result: 'สองคำสั่งแยกกัน — ระหว่างนั้นสถานะอาจเปลี่ยน (อีกเครื่อง/อีกหน้าจอ) และโค้ดยาวกว่า' },
          ] },
        { t: 'code', title: 'ชื่อเล่นว่าง → NULL (ข้อ 6 renameNickname)', src: `Future<void> renameNickname(int cityId, String nickname) async {
  final value = nickname.trim();
  await _db.update(
    'cities',
    {'nickname': value.isEmpty ? null : value}, // ว่าง = ไม่มีชื่อเล่น
    where: 'id = ?',
    whereArgs: [cityId],
  );
}` },
      ],
      quiz: [
        { q: "`final n = await db.update('orders', {'status': 'paid'}, where: 'id = ? AND status = ?', whereArgs: [7, 'pending']);` ได้ `n == 0` หมายความว่า?", options: [
          { t: 'ออเดอร์ #7 ไม่ได้อยู่ในสถานะ pending แล้ว (หรือไม่มี #7) จึงไม่ได้แก้', ok: true },
          { t: 'แก้สำเร็จ', why: 'สำเร็จต้องได้ 1' },
          { t: 'เกิด error', why: 'update ไม่ error เมื่อไม่มีแถวตรง' },
        ] },
        { type: 'spot', q: 'toggleFavorite นี้ผิดเกณฑ์ “อัปเดตเฉพาะคอลัมน์” — บรรทัดไหน?', code: `Future<void> toggleFavorite(Contact c) async {
  final db = await DatabaseHelper.instance.database;
  final updated = c.copyWith(isFavorite: !c.isFavorite);
  await db.update('contacts', updated.toMap(),
      where: 'id = ?', whereArgs: [c.id]);
  await fetchAndSetContacts();
}`, bad: "await db.update('contacts', updated.toMap(),", explain: "เขียนทุกคอลัมน์ทับจากอ็อบเจกต์เดิม — ควรเป็น `db.update('contacts', {'is_favorite': c.isFavorite ? 0 : 1}, where: 'id = ?', whereArgs: [c.id])`" },
      ],
    },
    {
      id: 'playground', short: 'Playground', tag: 'ลองเอง', supp: true,
      title: 'Playground: ข้อมูลตั้งต้นของโจทย์ทั้ง 6 ข้อ + แลป 13',
      gist: 'เลือกชุดข้อมูลของโจทย์ แล้วพิมพ์ SQL เองได้อิสระ (หลายคำสั่งคั่นด้วย `;`, ใช้ `BEGIN; … COMMIT;` จำลอง transaction, ใส่ args แบบ Dart list เมื่อมีคำสั่งเดียว) · ทุกอย่างอยู่ในหน่วยความจำของเบราว์เซอร์ — รีโหลดหน้า = เริ่มใหม่',
      blocks: [
        { t: 'viz', id: 'sql.lab', title: 'SQL Playground (SQLite จริง)', props: { seed: 'pos', seedSwitch: true }, try: 'สลับชุดข้อมูลด้านบน · ปุ่มสีเทาคือคิวรีจากแนวเฉลยของข้อนั้น · ข้อ 4 ลองรันขั้น v2 แล้ว v3 ตามลำดับ แล้วดู `PRAGMA table_info(entries)`' },
        { t: 'callout', kind: 'note', title: 'ต่างจาก sqflite บนมือถือตรงไหน', body: 'ภาพนี้ใช้ SQLite 3.45 (sql.js) ส่วนบน Android ใช้ SQLite ของระบบซึ่งอาจเก่ากว่า — คำสั่งพื้นฐานในหน้านี้ใช้ได้ทั้งคู่ ยกเว้นที่ระบุไว้ (`ON CONFLICT DO UPDATE`, `RENAME COLUMN`, `DROP COLUMN`) · และ `BEGIN/COMMIT` ในแอปจริงให้ใช้ `db.transaction((txn) async {...})` แทน' },
      ],
    },
  ],
  rules: [
    'ค่าจากผู้ใช้เข้าทาง `?` + `whereArgs`/args **เท่านั้น** (รวม LIKE: `[\'%$kw%\']`, LIMIT/OFFSET)',
    'where หลายเงื่อนไข: `clauses` + `args` คู่กัน → `clauses.join(\' AND \')` · ไม่มีเงื่อนไข = `null`',
    'NULL ใช้ `IS NULL` ไม่ใช่ `= ?` กับ null',
    '`orderBy` ปิดท้ายด้วยคอลัมน์ไม่ซ้ำ: `created_at DESC, id DESC`',
    'COUNT → `Sqflite.firstIntValue(rows) ?? 0` · SUM ของเงิน → `COALESCE(SUM(x), 0) AS total` + `(row[\'total\'] as num).toDouble()`',
    'ใช้ SUM ร่วมกับคอลัมน์อื่น → ต้อง `GROUP BY` · กรองกลุ่มด้วย `HAVING`',
    'แม่ที่อาจไม่มีลูก → `LEFT JOIN` (INNER ทำแถวหาย)',
    'คอลัมน์จาก JOIN/SUM (`group_name`, `total`) อ่านใน fromMap ได้ แต่ **ห้ามอยู่ใน toMap**',
    'แบ่งหน้า: `LIMIT ? OFFSET ?` + `_hasMore = page.length == pageSize` + กันเรียกซ้อน + refresh เมื่อเปลี่ยนเงื่อนไข',
    'วันนี้ = `>= ต้นวัน AND < ต้นวันถัดไป` (ISO รูปแบบเดียวทั้งแอป)',
    'UNIQUE ชน → `on DatabaseException catch (e) { if (e.isUniqueConstraintError()) … else rethrow; }`',
    'FK ไม่ถูกบังคับโดยค่าเริ่มต้น → ลบแม่ + จัดการลูกใน transaction ด้วย `txn`',
    '`ConflictAlgorithm.replace` = ลบแล้วแทรกใหม่ (id ใหม่) — “มีแล้วให้แก้” ใช้ update ก่อน',
    'เปลี่ยนสถานะ: `where: \'id = ? AND status = ?\'` แล้วเช็กจำนวนแถวที่คืน',
  ],
  quiz: [
    { q: 'คิวรีรายการออเดอร์ (ข้อ 5) ต้องมีครบข้อใด?', options: [
      { t: 'LEFT JOIN + COALESCE(SUM(...), 0) AS total + GROUP BY o.id + ORDER BY … , o.id DESC + LIMIT ? OFFSET ?', ok: true },
      { t: 'JOIN + SUM + LIMIT', why: 'INNER ทำออเดอร์ที่ไม่มีรายการหาย และไม่มี GROUP BY ได้แถวเดียว' },
      { t: 'query ทั้งสองตารางแล้วรวมใน Dart', why: 'ผิดข้อจำกัดของโจทย์' },
    ] },
    { type: 'multi', q: 'ข้อใดปลอดภัยจาก SQL Injection (เลือกทุกข้อ)', options: [
      { t: "`db.query('t', where: 'name LIKE ?', whereArgs: ['%$kw%'])`", ok: true },
      { t: "`db.rawQuery('SELECT * FROM t WHERE id = ?', [id])`", ok: true },
      { t: "`db.rawQuery('... ${groupId == null ? '' : 'WHERE group_id = ?'}', ...)` (ชิ้นส่วนคงที่ที่เราเขียนเอง)", ok: true },
      { t: "`db.rawQuery(\"SELECT * FROM t WHERE name = '$name'\")`", why: 'ต่อข้อความผู้ใช้เข้าคำสั่ง' },
    ] },
    { q: 'ลบกลุ่มในข้อ 3 อย่างถูกต้องคือ?', options: [
      { t: "`db.transaction((txn) async { await txn.update('contacts', {'group_id': null}, where: 'group_id = ?', whereArgs: [id]); await txn.delete('groups', where: 'id = ?', whereArgs: [id]); })`", ok: true },
      { t: "`db.delete('groups', where: 'id = ?', whereArgs: [id])` อย่างเดียว", why: 'FK ไม่ถูกบังคับ → ผู้ติดต่อชี้ไปกลุ่มที่ไม่มีแล้ว' },
      { t: 'ใน transaction เรียก `db.update` แล้ว `txn.delete`', why: 'ใช้ db ในบล็อก transaction → ค้าง' },
    ] },
  ],
};
