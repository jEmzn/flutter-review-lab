/* SQL supplement visualizations — real SQLite (sql.js) with seeds from exam_questions q1–q6 + lab 13.
   Registers: sql.lab, sql.where, sql.like, sql.agg, sql.group, sql.join, sql.order, sql.pager, sql.dates, sql.upsert */
(function () {
  'use strict';
  const { h, clear, btn, seg, toggle, flash } = FR.util;
  const md = (s) => FR.markup.inline(s);
  const R = FR.viz.register;
  const dv = (v) => FR.sql.dv(v);
  const hl = (src, lang) => FR.highlight.inline(src, lang || 'dart');
  const gen = (src, lang) => h('pre', { class: 'sq-gen', html: hl(src, lang) });

  function loading(body) { const l = h('div', { class: 'vnote' }, 'กำลังโหลด SQLite (sql.js)…'); body.appendChild(l); return l; }

  // ───────────────────────── seeds (ตาม entity ในโจทย์) ─────────────────────────
  const SEEDS = {
    shop: {
      label: 'ข้อ 1 ร้านขายของชำ', file: 'shop.db',
      sql: `CREATE TABLE products(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL);
INSERT INTO products(name, price, quantity) VALUES
  ('น้ำปลาทิพรส', 32.5, 12), ('ไข่ไก่ เบอร์ 2 (แผง)', 115, 4), ('Latte กระป๋อง', 25, 0),
  ('นมสด 1 ลิตร', 54, 9), ('ข้าวหอมมะลิ 5 กก.', 189, 3), ('น้ำส้ม 100%', 45, 0),
  ('O''Brien''s Chips', 39, 7), ('ซอส_พริก', 28, 15);`,
      presets: [
        { label: 'อ่านทั้งหมด เรียง A→Z', sql: 'SELECT * FROM products ORDER BY name ASC' },
        { label: 'สินค้าหมด', sql: 'SELECT * FROM products WHERE quantity = ?', args: '[0]' },
        { label: 'ค้นชื่อ (LIKE ผ่าน ?)', sql: 'SELECT * FROM products WHERE name LIKE ?', args: "['%น้ำ%']" },
        { label: 'มูลค่าสต็อกรวม', sql: 'SELECT COALESCE(SUM(price * quantity), 0) AS stock_value FROM products' },
        { label: 'แก้ราคาเฉพาะแถว', sql: 'UPDATE products SET price = ? WHERE id = ?', args: '[35.0, 1]' },
      ],
    },
    tasks: {
      label: 'ข้อ 2 งาน (Task)', file: 'tasks.db',
      sql: `CREATE TABLE tasks(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  detail TEXT,
  due_date TEXT NOT NULL,
  priority TEXT NOT NULL,
  is_done INTEGER NOT NULL DEFAULT 0);
INSERT INTO tasks(title, detail, due_date, priority, is_done) VALUES
  ('ส่งรายงาน Flutter', 'บทที่ 13', '2026-10-15T09:00:00.000', 'high', 0),
  ('อ่านบท Provider', NULL, '2026-10-16T18:00:00.000', 'medium', 0),
  ('ซื้อนม', 'นมจืด 2 กล่อง', '2026-10-14T17:00:00.000', 'low', 1),
  ('ซ้อมสอบ SQLite', 'ข้อ 2 และ 5', '2026-10-17T10:00:00.000', 'high', 0),
  ('จ่ายค่าเน็ต', NULL, '2026-10-13T12:00:00.000', 'medium', 1),
  ('Review Form validator', NULL, '2026-10-18T09:00:00.000', 'low', 0),
  ('ลดราคา 50% สินค้าเก่า', NULL, '2026-10-19T09:00:00.000', 'medium', 0),
  ('แก้บั๊กชื่อ O''Neil', NULL, '2026-10-15T13:00:00.000', 'high', 1);`,
      presets: [
        { label: 'งานค้าง เรียงตามกำหนดส่ง', sql: 'SELECT * FROM tasks WHERE is_done = ? ORDER BY due_date ASC', args: '[0]' },
        { label: 'นับงานค้าง (COUNT)', sql: 'SELECT COUNT(*) FROM tasks WHERE is_done = 0' },
        { label: 'สลับสถานะเฉพาะคอลัมน์', sql: 'UPDATE tasks SET is_done = ? WHERE id = ?', args: '[1, 2]' },
        { label: 'นับตามระดับความสำคัญ', sql: 'SELECT priority, COUNT(*) AS n FROM tasks GROUP BY priority ORDER BY n DESC' },
      ],
    },
    contacts: {
      label: 'ข้อ 3 สมุดโทรศัพท์', file: 'contacts.db',
      sql: `CREATE TABLE groups(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE);
CREATE TABLE contacts(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  group_id INTEGER,
  FOREIGN KEY(group_id) REFERENCES groups(id));
INSERT INTO groups(name) VALUES ('ครอบครัว'), ('ที่ทำงาน'), ('ชมรมแบด');
INSERT INTO contacts(name, phone, is_favorite, group_id) VALUES
  ('แม่', '081-234-5678', 1, 1), ('พี่ต้น', '089-111-2222', 0, 1),
  ('หัวหน้าฝ่าย', '02-123-4567', 1, 2), ('Ann (HR)', '090-555-0101', 0, 2),
  ('ช่างแอร์', '086-777-8888', 0, NULL), ('Bob', '+66 81 000 1111', 0, NULL);`,
      presets: [
        { label: 'ผู้ติดต่อ + ชื่อกลุ่ม (LEFT JOIN)', sql: `SELECT c.*, g.name AS group_name
FROM contacts c
LEFT JOIN groups g ON c.group_id = g.id
ORDER BY c.is_favorite DESC, c.name ASC` },
        { label: 'นับสมาชิกของกลุ่ม', sql: 'SELECT COUNT(*) FROM contacts WHERE group_id = ?', args: '[1]' },
        { label: 'สมาชิกต่อกลุ่ม (รวมกลุ่มว่าง)', sql: `SELECT g.id, g.name, COUNT(c.id) AS members
FROM groups g
LEFT JOIN contacts c ON c.group_id = g.id
GROUP BY g.id
ORDER BY g.name` },
        { label: 'เพิ่มกลุ่มชื่อซ้ำ (UNIQUE)', sql: 'INSERT INTO groups(name) VALUES (?)', args: "['ครอบครัว']" },
        { label: 'ลบกลุ่มแบบโจทย์ (transaction)', sql: `BEGIN;
UPDATE contacts SET group_id = NULL WHERE group_id = 1;
DELETE FROM groups WHERE id = 1;
COMMIT;` },
      ],
    },
    diary: {
      label: 'ข้อ 4 ไดอารี่ (ไฟล์ v1)', file: 'diary.db',
      sql: `CREATE TABLE entries(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL);
INSERT INTO entries(title, content) VALUES
  ('วันแรก', 'เริ่มเขียนไดอารี่'), ('สอบย่อย', 'ทำได้ 8/10'), ('ฝนตก', 'ลืมร่มอีกแล้ว');
PRAGMA user_version = 1;`,
      presets: [
        { label: 'ดูโครงสร้างตาราง', sql: 'PRAGMA table_info(entries)' },
        { label: 'ขั้น v2: เพิ่ม mood', sql: 'ALTER TABLE entries ADD COLUMN mood TEXT' },
        { label: 'ขั้น v3: content → body (สร้างตารางใหม่)', sql: `CREATE TABLE entries_new(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  mood TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT);
INSERT INTO entries_new(id, title, body, mood)
  SELECT id, title, content, mood FROM entries;
DROP TABLE entries;
ALTER TABLE entries_new RENAME TO entries;` },
        { label: 'เพิ่ม NOT NULL ไม่มี DEFAULT (พัง)', sql: 'ALTER TABLE entries ADD COLUMN weather TEXT NOT NULL' },
        { label: 'อ่านเวอร์ชันไฟล์', sql: 'PRAGMA user_version' },
      ],
    },
    pos: {
      label: 'ข้อ 5 ร้านกาแฟ (POS)', file: 'coffee_pos.db',
      sql: `CREATE TABLE orders(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL);
CREATE TABLE order_items(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  unit_price REAL NOT NULL,
  qty INTEGER NOT NULL CHECK(qty > 0),
  FOREIGN KEY(order_id) REFERENCES orders(id));
INSERT INTO orders(customer_name, created_at, status) VALUES
  ('คุณเอ', '2026-10-12T08:15:00.000', 'paid'),
  ('คุณบี', '2026-10-12T12:40:00.000', 'cancelled'),
  ('คุณซี', '2026-10-13T09:05:00.000', 'paid'),
  ('คุณดี', '2026-10-13T23:59:59.500', 'paid'),
  ('คุณอี', '2026-10-14T00:00:00.000', 'paid'),
  ('คุณเอฟ', '2026-10-14T08:30:00.000', 'paid'),
  ('คุณจี', '2026-10-14T08:30:00.000', 'pending'),
  ('คุณเอช', '2026-10-14T10:10:00.000', 'pending'),
  ('คุณไอ', '2026-10-14T13:45:00.000', 'cancelled'),
  ('คุณเจ', '2026-10-14T23:59:59.900', 'paid'),
  ('คุณเค', '2026-10-15T00:00:00.000', 'paid'),
  ('คุณแอล', '2026-10-14T15:20:00.000', 'paid');
INSERT INTO order_items(order_id, product_name, unit_price, qty) VALUES
  (1, 'Latte', 55, 2), (1, 'Croissant', 65, 1), (2, 'Americano', 45, 1),
  (3, 'Matcha', 60, 1), (3, 'Latte', 55, 1), (4, 'Cocoa', 50, 2),
  (5, 'Americano', 45, 2), (6, 'Latte', 55, 1), (6, 'Croissant', 65, 2),
  (7, 'Matcha', 60, 3), (9, 'Latte', 55, 1), (10, 'Cocoa', 50, 1),
  (11, 'Americano', 45, 1), (12, 'Latte', 55, 2), (12, 'Americano', 45, 1), (12, 'Croissant', 65, 1);`,
      presets: [
        { label: 'รายการออเดอร์ + total (คิวรีของโจทย์)', sql: `SELECT o.*, COALESCE(SUM(i.unit_price * i.qty), 0) AS total
FROM orders o
LEFT JOIN order_items i ON i.order_id = o.id
WHERE o.customer_name LIKE ?
GROUP BY o.id
ORDER BY o.created_at DESC, o.id DESC
LIMIT ? OFFSET ?`, args: "['%คุณ%', 10, 0]" },
        { label: 'ยอดขายวันนี้ (ช่วงครึ่งเปิด)', sql: `SELECT COALESCE(SUM(i.unit_price * i.qty), 0) AS revenue
FROM orders o JOIN order_items i ON i.order_id = o.id
WHERE o.status = ? AND o.created_at >= ? AND o.created_at < ?`, args: "['paid', '2026-10-14T00:00:00.000', '2026-10-15T00:00:00.000']" },
        { label: 'markPaid เฉพาะที่ยัง pending', sql: "UPDATE orders SET status = 'paid' WHERE id = ? AND status = ?", args: "[7, 'pending']" },
        { label: 'qty = 0 (CHECK)', sql: 'INSERT INTO order_items(order_id, product_name, unit_price, qty) VALUES (?, ?, ?, ?)', args: "[8, 'Latte', 55, 0]" },
        { label: 'สร้างออเดอร์แม่-ลูกใน transaction', sql: `BEGIN;
INSERT INTO orders(customer_name, created_at, status) VALUES ('คุณใหม่', '2026-10-14T16:00:00.000', 'pending');
INSERT INTO order_items(order_id, product_name, unit_price, qty) VALUES (last_insert_rowid(), 'Latte', 55, 1);
COMMIT;` },
      ],
    },
    weather: {
      label: 'ข้อ 6 สภาพอากาศ (แคช)', file: 'weather.db',
      sql: `CREATE TABLE cities(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  country TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  nickname TEXT,
  UNIQUE(latitude, longitude));
CREATE TABLE weather_current(
  city_id INTEGER PRIMARY KEY,
  temperature REAL NOT NULL,
  humidity INTEGER NOT NULL,
  wind_speed REAL NOT NULL,
  weather_code INTEGER NOT NULL,
  fetched_at TEXT NOT NULL);
CREATE TABLE forecast_days(
  city_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  weather_code INTEGER NOT NULL,
  temp_max REAL NOT NULL,
  temp_min REAL NOT NULL,
  PRIMARY KEY(city_id, date));
INSERT INTO cities(name, country, latitude, longitude, nickname) VALUES
  ('Bangkok', 'Thailand', 13.75, 100.5167, 'บ้าน'),
  ('Chiang Mai', 'Thailand', 18.7904, 98.9847, NULL),
  ('Tokyo', 'Japan', 35.6895, 139.6917, 'ทริปปีหน้า');
INSERT INTO weather_current VALUES
  (1, 31.4, 70, 9.2, 3, '2026-10-14T07:55:12.000'),
  (2, 27.8, 82, 4.1, 61, '2026-10-14T07:55:13.000');
INSERT INTO forecast_days VALUES
  (1, '2026-10-14', 3, 33.1, 25.9), (1, '2026-10-15', 61, 31.0, 25.2), (1, '2026-10-16', 80, 30.4, 24.8),
  (2, '2026-10-14', 61, 29.9, 21.3), (2, '2026-10-15', 63, 28.2, 21.0), (2, '2026-10-16', 3, 29.5, 20.7);`,
      presets: [
        { label: 'เมือง + แคช (LEFT JOIN)', sql: `SELECT c.*, w.temperature, w.humidity, w.fetched_at
FROM cities c
LEFT JOIN weather_current w ON w.city_id = c.id
ORDER BY c.name ASC` },
        { label: 'INNER JOIN (Tokyo หาย)', sql: `SELECT c.name, w.temperature
FROM cities c
JOIN weather_current w ON w.city_id = c.id` },
        { label: 'พยากรณ์ของเมือง', sql: 'SELECT * FROM forecast_days WHERE city_id = ? ORDER BY date', args: '[1]' },
        { label: 'เพิ่มเมืองซ้ำพิกัด (UNIQUE)', sql: 'INSERT INTO cities(name, country, latitude, longitude) VALUES (?, ?, ?, ?)', args: "['Krung Thep', 'Thailand', 13.75, 100.5167]" },
        { label: 'เขียนทับแคชของเมือง (transaction)', sql: `BEGIN;
DELETE FROM weather_current WHERE city_id = 2;
DELETE FROM forecast_days WHERE city_id = 2;
INSERT INTO weather_current VALUES (2, 26.0, 88, 3.0, 63, '2026-10-14T09:00:00.000');
INSERT INTO forecast_days VALUES (2, '2026-10-14', 63, 28.0, 21.0), (2, '2026-10-15', 61, 28.5, 21.4), (2, '2026-10-16', 3, 30.1, 20.9);
COMMIT;` },
      ],
    },
    expense: {
      label: 'แลป 13 / ex_13 บัญชีรายรับ-รายจ่าย', file: 'expenses.db',
      sql: `CREATE TABLE transactions(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  note TEXT);
INSERT INTO transactions(title, amount, date, type, note) VALUES
  ('เงินเดือน', 18000, '2026-10-01T09:00:00.000', 'income', NULL),
  ('ค่าหอ', 4500, '2026-10-02T10:00:00.000', 'expense', 'ตุลาคม'),
  ('ข้าวกลางวัน', 65.5, '2026-10-14T12:10:00.000', 'expense', NULL),
  ('ขายหนังสือมือสอง', 350, '2026-10-12T15:00:00.000', 'income', NULL),
  ('ค่ารถไฟฟ้า', 42, '2026-10-14T08:05:00.000', 'expense', NULL);`,
      presets: [
        { label: 'อ่านทั้งหมด (date DESC, id DESC)', sql: 'SELECT * FROM transactions ORDER BY date DESC, id DESC' },
        { label: 'ยอดคงเหลือ (SUM + CASE)', sql: `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS balance
FROM transactions` },
        { label: 'รวมตามประเภท', sql: 'SELECT type, SUM(amount) AS total, COUNT(*) AS n FROM transactions GROUP BY type' },
        { label: 'ลบโดยลืม WHERE (อย่าทำ!)', sql: 'DELETE FROM transactions' },
      ],
    },
  };
  FR.sqlSeeds = SEEDS;

  // ───────────────────────── helpers ─────────────────────────
  /** split a script into statements (respects quotes and -- comments) */
  function splitSql(src) {
    const out = [];
    let cur = '', q = null;
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (q) { cur += c; if (c === q) { if (src[i + 1] === q) cur += src[++i]; else q = null; } continue; }
      if (c === "'" || c === '"') { q = c; cur += c; continue; }
      if (c === '-' && src[i + 1] === '-') { const nl = src.indexOf('\n', i); const end = nl < 0 ? src.length : nl; cur += src.slice(i, end); i = end - 1; continue; }
      if (c === ';') { if (cur.trim()) out.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out.filter((s) => s.replace(/--[^\n]*/g, '').trim());
  }
  /** parse a Dart-ish list literal: ['a', 1, null, 2.5] */
  function parseArgs(text) {
    const s = String(text || '').trim();
    if (!s) return [];
    let i = 0;
    const src = s.replace(/^\[/, '').replace(/\]$/, '');
    const out = [];
    const ws = () => { while (i < src.length && /\s/.test(src[i])) i++; };
    while (i < src.length) {
      ws();
      if (i >= src.length) break;
      const c = src[i];
      if (c === "'" || c === '"') {
        let v = ''; i++;
        while (i < src.length && src[i] !== c) { if (src[i] === '\\' && i + 1 < src.length) { v += src[i + 1]; i += 2; } else v += src[i++]; }
        i++; out.push(v);
      } else {
        let tok = '';
        while (i < src.length && src[i] !== ',') tok += src[i++];
        tok = tok.trim();
        if (tok === 'null') out.push(null);
        else if (tok === 'true') out.push(1);
        else if (tok === 'false') out.push(0);
        else if (tok !== '' && !isNaN(+tok)) out.push(+tok);
        else throw new Error('อ่าน args ไม่ได้ตรง: ' + tok);
      }
      ws();
      if (src[i] === ',') i++;
    }
    return out;
  }
  function kindOf(sql) {
    const k = (sql.replace(/^(\s|--[^\n]*\n)*/, '').match(/^\w+/) || [''])[0].toUpperCase();
    if (/^(SELECT|WITH|PRAGMA|VALUES)$/.test(k)) return 'rawQuery';
    if (k === 'INSERT' || k === 'REPLACE') return 'rawInsert';
    if (k === 'UPDATE') return 'rawUpdate';
    if (k === 'DELETE') return 'rawDelete';
    return 'execute';
  }
  function dartStr(sql) {
    if (/\n/.test(sql) || /'/.test(sql)) return `'''\n${sql}\n'''`;
    return `'${sql}'`;
  }
  function dartFor(sql, args) {
    const k = kindOf(sql);
    if (/^\s*(BEGIN|COMMIT|ROLLBACK)/i.test(sql)) return `// ${sql.trim()} → ใน sqflite ใช้ db.transaction((txn) async {...})`;
    return `await db.${k}(${dartStr(sql)}${args && args.length ? ', ' + dv(args) : ''});`;
  }
  /** what a sqflite DatabaseException helper would say for this error */
  function excHints(msg) {
    const m = String(msg || '');
    const out = [];
    if (/UNIQUE constraint failed/.test(m)) out.push('e.isUniqueConstraintError() == true');
    if (/NOT NULL constraint failed/.test(m)) out.push('e.isNotNullConstraintError() == true');
    if (/no such table/.test(m)) out.push('e.isNoSuchTableError() == true');
    if (/duplicate column/.test(m)) out.push('e.isDuplicateColumnError() == true');
    if (/syntax error|incomplete input/.test(m)) out.push('e.isSyntaxError() == true');
    if (/CHECK constraint failed|FOREIGN KEY constraint failed|datatype mismatch|has no column/.test(m)) out.push('ไม่มีเมธอดเฉพาะ — ตรวจด้วย e.toString().contains(...) หรือ e.getResultCode()');
    return out;
  }
  /** run one statement and return an enriched trace */
  function runOne(db, sql, args, dart) {
    const k = kindOf(sql);
    const t = db.rawQuery(sql, args || [], { dart: dart || dartFor(sql, args) });
    if (t.ok) {
      if (k === 'rawInsert') { const id = db._lastId(); t.result = `แถวที่เพิ่ม = ${t.changes}` + (t.changes ? ` · id ใหม่ = ${id}` : ''); }
      else if (k === 'rawUpdate' || k === 'rawDelete') t.result = `แถวที่${k === 'rawUpdate' ? 'ถูกแก้' : 'ถูกลบ'} = ${t.changes}`;
      else if (k === 'execute') t.result = 'สำเร็จ';
      else t.result = `${t.rows.length} แถว`;
    } else {
      const hints = excHints(t.error);
      if (hints.length) t.note = '`on DatabaseException catch (e)` → ' + hints.map((x) => '`' + x + '`').join(' · ');
    }
    return t;
  }
  /** grids for all tables of a db */
  function Grids(db, opts = {}) {
    const el = h('div', { class: 'sq-grids' });
    let grids = {};
    function refresh() {
      const names = opts.tables || db.tables();
      clear(el); grids = {};
      names.forEach((n) => { const g = FR.TableGrid.create({ db, table: n, maxHeight: opts.maxHeight || '220px' }); grids[n] = g; el.appendChild(g.el); });
      if (!names.length) el.appendChild(h('div', { class: 'tg-empty' }, '(ไม่มีตาราง)'));
    }
    refresh();
    return { el, refresh, grid: (n) => grids[n] };
  }
  const reseed = (db, key) => {
    db.tables().forEach((t) => { try { db.db.exec(`DROP TABLE IF EXISTS "${t}"`); } catch (e) {} });
    try { db.db.exec('DELETE FROM sqlite_sequence'); } catch (e) {}
    try { db.db.exec('PRAGMA foreign_keys = OFF; PRAGMA user_version = 0;'); } catch (e) {}
    db.db.exec(SEEDS[key].sql);
  };

  // ───────────────────────── sql.lab (generic runner / playground) ─────────────────────────
  // props: { seed, presets?, start?, seedSwitch?, tables? }
  R('sql.lab', async (body, props) => {
    const ld = loading(body);
    let key = props.seed || 'pos';
    const db = await FR.sql.open(SEEDS[key].sql);
    ld.remove();
    const editor = h('textarea', { class: 'sql-editor', spellcheck: 'false', 'aria-label': 'คำสั่ง SQL' });
    const argsIn = h('input', { class: 'vinput sq-argsin', placeholder: "args เช่น ['%lat%', 10]  (เว้นว่างได้)", 'aria-label': 'args' });
    const log = FR.SqlLog.create({ height: '300px' });
    const out = h('div', { class: 'sq-out' });
    const grids = Grids(db, { tables: props.tables });
    const presetRow = h('div', { class: 'btn-row sq-presets' });
    const fileLbl = h('span', { class: 'pill mono' });
    function presetsFor() { return props.presets || SEEDS[key].presets || []; }
    function drawPresets() {
      clear(presetRow);
      presetRow.appendChild(h('span', { class: 'dim', style: { fontSize: '.8rem' } }, 'ลองคำสั่ง:'));
      presetsFor().forEach((p) => presetRow.appendChild(btn(p.label, () => { editor.value = p.sql; argsIn.value = p.args || ''; lastP = p; run(p); }, 'sm ghost')));
      fileLbl.textContent = SEEDS[key].file;
    }
    function run(p) {
      clear(out);
      let args;
      try { args = parseArgs(argsIn.value); } catch (e) { out.appendChild(h('div', { class: 'vt-res bad' }, e.message)); return; }
      const stmts = splitSql(editor.value);
      if (!stmts.length) return;
      if (args.length && stmts.length > 1) { out.appendChild(h('div', { class: 'vt-res bad' }, 'args ใช้ได้กับคำสั่งเดียว (sqflite ก็เช่นกัน)')); return; }
      let last = null;
      for (const s of stmts) {
        const same = p && p.dart && stmts.length === 1 && editor.value === p.sql && argsIn.value === (p.args || '');
        const t = runOne(db, s, stmts.length === 1 ? args : [], same ? p.dart : null);
        log.add(t);
        last = t;
        if (!t.ok) {
          if (db.inTx) { db.rollback(); log.add({ ok: true, op: 'rollback', sql: 'ROLLBACK', dart: '// exception ภายใน transaction → ยกเลิกทั้งก้อน', result: 'ทุกคำสั่งตั้งแต่ BEGIN ถูกยกเลิก' }); }
          break;
        }
      }
      if (last && last.ok && last.columns && last.columns.length) out.appendChild(FR.ResultTable(last.columns, last.rows));
      else if (last && !last.ok) out.appendChild(h('div', { class: 'vt-res bad' }, '✗ ' + last.error));
      else if (last) out.appendChild(h('div', { class: 'vt-res ok' }, '✓ ' + (last.result || 'สำเร็จ')));
      if (p && p.note) out.appendChild(h('div', { class: 'vnote', html: md(p.note) }));
      grids.refresh();
    }
    let lastP = null;
    const runBtn = btn('▶ รัน', () => run(lastP), 'primary sm');
    editor.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(lastP); } });
    const resetBtn = btn('รีเซ็ตข้อมูล', () => { reseed(db, key); log.clear(); clear(out); grids.refresh(); }, 'sm ghost');
    const top = h('div', { class: 'btn-row', style: { marginBottom: '8px' } });
    if (props.seedSwitch) {
      top.appendChild(seg(Object.keys(SEEDS).map((k) => ({ value: k, label: SEEDS[k].label })), key, (k) => {
        key = k; reseed(db, key); log.clear(); clear(out); drawPresets(); grids.refresh();
        const p0 = presetsFor()[0]; lastP = p0 || null; if (p0) { editor.value = p0.sql; argsIn.value = p0.args || ''; }
      }));
    }
    top.appendChild(fileLbl);
    drawPresets();
    const p0 = presetsFor()[props.start || 0];
    if (p0) { editor.value = p0.sql; argsIn.value = p0.args || ''; lastP = p0; }
    body.append(top, presetRow, editor,
      h('div', { class: 'btn-row', style: { margin: '6px 0 10px' } }, argsIn, runBtn, resetBtn, h('span', { class: 'dim', style: { fontSize: '.76rem' } }, 'Ctrl+Enter = รัน')),
      h('div', { class: 'two' }, h('div', null, h('div', { class: 'sq-cap' }, 'ผลลัพธ์'), out), log.el),
      h('div', { class: 'sq-cap', style: { marginTop: '12px' } }, 'ตารางในไฟล์ตอนนี้'), grids.el);
    // auto-run only read-only presets — a write on load would 'use up' the demo before the reader clicks
    if (props.autorun !== false && p0 && splitSql(p0.sql).every((x) => kindOf(x) === 'rawQuery')) run(p0);
    return { destroy: () => db.close() };
  });

  // ───────────────────────── sql.where — ประกอบ where จากตัวกรอง (ข้อ 2) ─────────────────────────
  R('sql.where', async (body) => {
    const ld = loading(body);
    const db = await FR.sql.open(SEEDS.tasks.sql);
    ld.remove();
    let filter = 'all', prio = null, search = '', concat = false;
    const searchIn = h('input', { class: 'vinput', placeholder: 'ค้นหาชื่องาน…', 'aria-label': 'ค้นหา', style: { minWidth: '180px' } });
    const codeBox = h('div'), logBox = h('div'), resBox = h('div'), countBox = h('div', { class: 'sq-count' });
    function build() {
      const clauses = [], args = [];
      if (filter === 'pending') { clauses.push('is_done = ?'); args.push(0); }
      if (filter === 'done') { clauses.push('is_done = ?'); args.push(1); }
      if (prio) { clauses.push('priority = ?'); args.push(prio); }
      const kw = search.trim();
      if (kw) {
        if (concat) clauses.push(`title LIKE '%${kw}%'`);
        else { clauses.push('title LIKE ?'); args.push(`%${kw}%`); }
      }
      return { clauses, args, kw };
    }
    function draw() {
      const { clauses, args, kw } = build();
      const lines = ['final clauses = <String>[];', 'final args = <Object?>[];'];
      if (filter !== 'all') lines.push(`if (_filter == TaskFilter.${filter}) { clauses.add('is_done = ?'); args.add(${filter === 'done' ? 1 : 0}); }  // ✓ ทำงาน`);
      else lines.push("// _filter == all → ไม่เพิ่มเงื่อนไข");
      if (prio) lines.push(`if (_priority != null) { clauses.add('priority = ?'); args.add(_priority!.name); }  // '${prio}'`);
      if (kw) lines.push(concat ? `clauses.add("title LIKE '%$kw%'");  // ✗ ต่อสตริง` : `clauses.add('title LIKE ?'); args.add('%$kw%');  // '${'%' + kw + '%'}'`);
      lines.push('', 'final rows = await db.query(', "  'tasks',", `  where: clauses.isEmpty ? null : clauses.join(' AND '),  // ${clauses.length ? dv(clauses.join(' AND ')) : 'null'}`, `  whereArgs: args.isEmpty ? null : args,                  // ${args.length ? dv(args) : 'null'}`, "  orderBy: 'is_done ASC, due_date ASC',", ');');
      clear(codeBox); codeBox.appendChild(gen(lines.join('\n')));
      const t = db.query('tasks', { where: clauses.length ? clauses.join(' AND ') : undefined, whereArgs: args.length ? args : undefined, orderBy: 'is_done ASC, due_date ASC' });
      const lg = FR.SqlLog.create({ title: 'SQL ที่ sqflite สร้างจริง', showDart: false }); lg.add(t);
      clear(logBox); logBox.appendChild(lg.el);
      clear(resBox);
      if (t.ok) resBox.appendChild(FR.ResultTable(['id', 'title', 'due_date', 'priority', 'is_done'], t.rows));
      else resBox.appendChild(h('div', { class: 'vt-res bad' }, 'คำสั่ง SQL พัง: ' + t.error + ' — เพราะ \' ในคำค้นไปปิดสตริงของ SQL'));
      const c = db.rawQuery('SELECT COUNT(*) AS n FROM tasks WHERE is_done = 0');
      countBox.innerHTML = md(`งานค้างทั้งหมด **${c.rows[0].n}** งาน — นับด้วย \`SELECT COUNT(*) FROM tasks WHERE is_done = 0\` แยกจากตัวกรอง จึงไม่เปลี่ยนตามการกรอง/ค้นหา`);
    }
    searchIn.addEventListener('input', () => { search = searchIn.value; draw(); });
    const presets = h('div', { class: 'btn-row' }, h('span', { class: 'dim', style: { fontSize: '.8rem' } }, 'ลองค้น:'),
      ['ส่ง', 'flutter', "O'Neil", '50%'].map((v) => btn(v, () => { searchIn.value = v; search = v; draw(); }, 'sm ghost')));
    body.append(
      h('div', { class: 'btn-row', style: { marginBottom: '6px' } },
        seg([{ value: 'all', label: 'ทั้งหมด' }, { value: 'pending', label: 'ยังไม่เสร็จ' }, { value: 'done', label: 'เสร็จแล้ว' }], filter, (v) => { filter = v; draw(); }),
        seg([{ value: null, label: 'ทุกระดับ' }, { value: 'high', label: 'high' }, { value: 'medium', label: 'medium' }, { value: 'low', label: 'low' }], prio, (v) => { prio = v; draw(); }),
        searchIn, toggle('ต่อสตริงด้วย $ แทน ?', concat, (v) => { concat = v; draw(); })),
      presets, countBox,
      h('div', { class: 'two', style: { marginTop: '8px' } }, codeBox, h('div', null, logBox, resBox)));
    draw();
    return { destroy: () => db.close(), setMode(m) { if (m === 'concat') { concat = true; searchIn.value = "O'Neil"; search = "O'Neil"; draw(); } } };
  });

  // ───────────────────────── sql.like ─────────────────────────
  R('sql.like', async (body) => {
    const ld = loading(body);
    const db = await FR.sql.open(SEEDS.shop.sql);
    ld.remove();
    let mode = 'contains', escape = false;
    const kwIn = h('input', { class: 'vinput', value: 'lat', 'aria-label': 'คำค้น', style: { minWidth: '160px' } });
    const list = h('div', { class: 'lk-list' }), info = h('div'), codeBox = h('div');
    const all = db.rawQuery('SELECT id, name FROM products ORDER BY id').rows;
    function draw() {
      const raw = kwIn.value;
      const kw = escape ? raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_') : raw;
      const pat = mode === 'contains' ? `%${kw}%` : mode === 'prefix' ? `${kw}%` : kw;
      const where = mode === 'exact' ? 'name = ?' : `name LIKE ?${escape ? " ESCAPE '\\'" : ''}`;
      const t = db.query('products', { columns: ['id'], where, whereArgs: [pat] });
      const ids = new Set(t.ok ? t.rows.map((r) => r.id) : []);
      clear(list);
      all.forEach((r) => list.appendChild(h('div', { class: 'lk-row' + (ids.has(r.id) ? ' hit' : '') }, h('span', { class: 'mk' }, ids.has(r.id) ? '✓' : '·'), h('span', { class: 'mono' }, r.name))));
      const dartKw = escape ? "final esc = kw.replaceAll(r'\\', r'\\\\').replaceAll('%', r'\\%').replaceAll('_', r'\\_');\n" : '';
      const argExpr = mode === 'contains' ? (escape ? "'%$esc%'" : "'%$kw%'") : mode === 'prefix' ? (escape ? "'$esc%'" : "'$kw%'") : 'kw';
      clear(codeBox);
      codeBox.appendChild(gen(`${dartKw}final rows = await db.query(\n  'products',\n  where: ${dv(where)},\n  whereArgs: [${argExpr}],   // → ${dv(pat)}\n);`));
      clear(info);
      const notes = [];
      if (/[%_]/.test(raw) && !escape && mode !== 'exact') notes.push(`⚠ ผู้ใช้พิมพ์ \`${raw.match(/[%_]/)[0]}\` ซึ่ง LIKE ถือเป็น **wildcard** (\`%\` = อะไรก็ได้กี่ตัวก็ได้, \`_\` = อักขระใดก็ได้ 1 ตัว) — ผลจึงกว้างเกินที่ตั้งใจ · เปิด “escape % และ _”`);
      if (/[A-Z]/.test(raw) && mode !== 'exact') notes.push('LIKE ของ SQLite **ไม่สนตัวพิมพ์เล็ก-ใหญ่เฉพาะ A–Z** (ASCII) — `LAT` เจอ `Latte`');
      if (raw.includes("'")) notes.push("มี `'` ในคำค้นก็ไม่พัง เพราะค่าเดินทางทาง `whereArgs` ไม่ได้ต่อเข้าไปในคำสั่ง");
      info.appendChild(h('div', { class: 'sq-count', html: md(`ตรง **${ids.size}** จาก ${all.length} รายการ`) }));
      notes.forEach((n) => info.appendChild(h('div', { class: 'vnote', html: md(n) })));
    }
    kwIn.addEventListener('input', draw);
    body.append(
      h('div', { class: 'btn-row', style: { marginBottom: '6px' } }, kwIn,
        seg([{ value: 'contains', label: "มีคำนี้ '%kw%'" }, { value: 'prefix', label: "ขึ้นต้น 'kw%'" }, { value: 'exact', label: '= ? ตรงทั้งคำ' }], mode, (v) => { mode = v; draw(); }),
        toggle('escape % และ _', escape, (v) => { escape = v; draw(); })),
      h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, h('span', { class: 'dim', style: { fontSize: '.8rem' } }, 'ลองพิมพ์:'),
        ['lat', 'LAT', 'น้ำ', "O'B", '%', '_', '100%'].map((v) => btn(v, () => { kwIn.value = v; draw(); }, 'sm ghost'))),
      h('div', { class: 'two' }, h('div', null, list, info), codeBox));
    draw();
    return { destroy: () => db.close() };
  });

  // ───────────────────────── sql.agg — COUNT/SUM + การอ่านค่าใน Dart ─────────────────────────
  R('sql.agg', async (body) => {
    const ld = loading(body);
    const db = await FR.sql.open(SEEDS.pos.sql);
    ld.remove();
    let fn = 'SUM', scope = 'all', coalesce = false;
    const FN = { COUNT: 'COUNT(*)', SUM: 'SUM(unit_price * qty)', AVG: 'AVG(unit_price * qty)', MAX: 'MAX(unit_price * qty)', 'SUM(qty)': 'SUM(qty)' };
    const rowsBox = h('div', { class: 'agg-rows' }), resBox = h('div', { class: 'agg-res' }), readBox = h('div'), sqlBox = h('div');
    function draw() {
      const where = scope === 'all' ? '' : ' WHERE order_id = ?';
      const args = scope === 'all' ? [] : [scope === 'o1' ? 1 : 8];
      const expr = coalesce ? `COALESCE(${FN[fn]}, 0)` : FN[fn];
      const src = db.rawQuery(`SELECT id, order_id, product_name, unit_price, qty, unit_price * qty AS sub FROM order_items${where}`, args).rows;
      const sql = `SELECT ${expr} AS v FROM order_items${where}`;
      const t = db.rawQuery(sql, args, { dart: `final rows = await db.rawQuery(${dv(sql)}${args.length ? ', ' + dv(args) : ''});` });
      const ty = db.rawQuery(`SELECT typeof(${expr}) AS t FROM order_items${where}`, args).rows[0].t;
      const v = t.rows[0].v;
      clear(rowsBox);
      src.forEach((r) => rowsBox.appendChild(h('div', { class: 'agg-r' }, h('span', { class: 'mono dim' }, `#${r.order_id}`), h('span', null, r.product_name), h('span', { class: 'mono' }, `${r.unit_price}×${r.qty}`), h('span', { class: 'mono num' }, String(r.sub)))));
      if (!src.length) rowsBox.appendChild(h('div', { class: 'tg-empty' }, 'ไม่มีแถวที่ตรงเงื่อนไข (ชุดว่าง) — ออเดอร์ #8 ยังไม่มีรายการ'));
      clear(sqlBox); const lg = FR.SqlLog.create({ title: 'Dart → SQL' }); lg.add(t); sqlBox.appendChild(lg.el);
      const dartVal = v === null ? 'null' : ty === 'real' ? (Number.isInteger(v) ? v.toFixed(1) : String(v)) : String(v);
      clear(resBox);
      resBox.append(h('div', { class: 'agg-arrow' }, `${src.length} แถว ⟶ 1 แถว`), h('div', { class: 'agg-v' + (v === null ? ' null' : '') }, `v = ${dartVal}`), h('div', { class: 'dim', style: { fontSize: '.78rem' } }, `ชนิดใน SQLite: ${ty} → Dart: ${ty === 'real' ? 'double' : ty === 'integer' ? 'int' : 'Null'}`));
      // three ways to read
      const fiv = ty === 'integer' ? v : null; // firstIntValue: toString() → int.tryParse
      const ways = [
        { code: 'Sqflite.firstIntValue(rows) ?? 0', out: fiv === null ? '0' : String(fiv), bad: fiv === null && v !== null, why: fiv === null && v !== null ? `firstIntValue แปลง \`${dartVal}\` เป็นข้อความแล้ว \`int.tryParse\` → **null** → \`?? 0\` ได้ 0 แบบเงียบๆ (ผิด!)` : v === null ? 'ชุดว่าง → null → 0' : 'ใช้ได้ เพราะค่าเป็น int' },
        { code: "(rows.first['v'] as num).toDouble()", out: v === null ? "TypeError: type 'Null' is not a subtype of type 'num' in type cast" : (ty === 'real' ? dartVal : v.toFixed(1)), bad: v === null, why: v === null ? '`SUM` ของชุดว่างคืน **NULL** (ไม่ใช่ 0) → cast พัง · ใช้ `COALESCE(..., 0)` ใน SQL' : 'ใช้ได้กับทั้ง int และ double' },
        { code: "(rows.first['v'] as num?)?.toDouble() ?? 0", out: v === null ? '0.0' : (ty === 'real' ? dartVal : v.toFixed(1)), bad: false, why: 'ปลอดภัยแม้ไม่มี COALESCE' },
      ];
      clear(readBox);
      ways.forEach((w) => readBox.appendChild(h('div', { class: 'agg-way' + (w.bad ? ' bad' : ' ok') }, h('code', null, w.code), h('div', { class: 'mono agg-out' }, '→ ' + w.out), h('div', { class: 'vnote', html: md(w.why) }))));
    }
    body.append(
      h('div', { class: 'btn-row', style: { marginBottom: '8px' } },
        seg(Object.keys(FN).map((k) => ({ value: k, label: k === 'COUNT' ? 'COUNT(*)' : k === 'SUM(qty)' ? 'SUM(qty)' : k + '(ราคา×จำนวน)' })), fn, (v) => { fn = v; draw(); }),
        seg([{ value: 'all', label: 'ทุกแถว' }, { value: 'o1', label: 'order_id = 1' }, { value: 'o8', label: 'order_id = 8 (ว่าง)' }], scope, (v) => { scope = v; draw(); }),
        toggle('COALESCE(…, 0)', coalesce, (v) => { coalesce = v; draw(); })),
      h('div', { class: 'agg-flow' }, rowsBox, resBox),
      h('div', { class: 'two', style: { marginTop: '10px' } }, sqlBox, h('div', null, h('div', { class: 'sq-cap' }, 'อ่านค่าใน Dart 3 แบบ'), readBox)));
    draw();
    return { destroy: () => db.close() };
  });

  // ───────────────────────── sql.group — GROUP BY / HAVING ─────────────────────────
  R('sql.group', async (body) => {
    const ld = loading(body);
    const db = await FR.sql.open(SEEDS.pos.sql);
    ld.remove();
    let grouped = true, minCups = 0, whereQty = false;
    const COLORS = { Latte: '#e0af68', Croissant: '#ff9e64', Americano: '#7aa2f7', Matcha: '#9ece6a', Cocoa: '#bb9af7' };
    const left = h('div', { class: 'grp-rows' }), right = h('div'), sqlBox = h('div'), note = h('div', { class: 'vnote' });
    const slider = h('input', { type: 'range', min: '0', max: '8', value: '0', 'aria-label': 'HAVING SUM(qty) >=' });
    const sliderLbl = h('span', { class: 'mono' });
    function draw() {
      sliderLbl.textContent = `HAVING SUM(qty) >= ${minCups}`;
      const rows = db.rawQuery(`SELECT id, order_id, product_name, qty, unit_price FROM order_items${whereQty ? ' WHERE qty >= 2' : ''} ORDER BY product_name, id`).rows;
      const allRows = db.rawQuery('SELECT id, product_name, qty FROM order_items ORDER BY product_name, id').rows;
      const kept = new Set(rows.map((r) => r.id));
      clear(left);
      allRows.forEach((r) => left.appendChild(h('div', { class: 'grp-r' + (kept.has(r.id) ? '' : ' out'), style: { '--gc': COLORS[r.product_name] || '#888' } }, h('span', { class: 'sw' }), h('span', null, r.product_name), h('span', { class: 'mono' }, '×' + r.qty), kept.has(r.id) ? null : h('span', { class: 'dim', style: { fontSize: '.72rem' } }, 'WHERE ตัดทิ้ง'))));
      let sql = 'SELECT product_name, SUM(qty) AS cups, SUM(unit_price * qty) AS revenue\nFROM order_items';
      if (whereQty) sql += '\nWHERE qty >= 2';
      if (grouped) sql += '\nGROUP BY product_name';
      if (grouped && minCups > 0) sql += `\nHAVING SUM(qty) >= ${minCups}`;
      if (grouped) sql += '\nORDER BY cups DESC';
      const t = db.rawQuery(sql);
      clear(sqlBox); sqlBox.appendChild(gen(sql, 'sql'));
      clear(right);
      if (t.ok) {
        const tb = h('div', { class: 'grp-out' });
        t.rows.forEach((r) => tb.appendChild(h('div', { class: 'grp-g', style: { '--gc': COLORS[r.product_name] || '#888' } }, h('span', { class: 'sw' }), h('b', null, r.product_name), h('span', { class: 'mono' }, `${r.cups} แก้ว`), h('span', { class: 'mono num' }, `฿${r.revenue}`))));
        if (!t.rows.length) tb.appendChild(h('div', { class: 'tg-empty' }, '(0 กลุ่ม)'));
        right.appendChild(tb);
      }
      note.innerHTML = md(!grouped
        ? '⚠ **ไม่มี GROUP BY** → ฟังก์ชันรวมยุบ **ทุกแถวเป็นแถวเดียว** และ `product_name` ที่ได้เป็นค่าจากแถวใดแถวหนึ่ง (SQLite ยอมให้รัน แต่ความหมายผิด) — อาการ “ได้แถวเดียว” ในโจทย์ข้อ 5'
        : whereQty ? '`WHERE` กรอง **แถว** ก่อนจัดกลุ่ม (แถวที่ qty = 1 ไม่ถูกนับเลย) · `HAVING` กรอง **กลุ่ม** หลังรวมแล้ว'
          : minCups > 0 ? '`HAVING` ใช้ผลรวมได้ (`SUM(qty)`) เพราะทำงานหลังจัดกลุ่ม — ใส่ `SUM(...)` ใน `WHERE` ไม่ได้ (misuse of aggregate)' : 'แถวที่ `product_name` เหมือนกันถูกยุบเป็น 1 กลุ่ม แล้ว `SUM` คำนวณแยกต่อกลุ่ม');
    }
    slider.addEventListener('input', () => { minCups = +slider.value; draw(); });
    body.append(
      h('div', { class: 'btn-row', style: { marginBottom: '8px' } },
        seg([{ value: true, label: 'GROUP BY product_name' }, { value: false, label: 'ลืม GROUP BY' }], grouped, (v) => { grouped = v; draw(); }),
        toggle('WHERE qty >= 2 (ก่อนจัดกลุ่ม)', whereQty, (v) => { whereQty = v; draw(); }),
        h('label', { class: 'btn-row', style: { fontSize: '.82rem' } }, slider, sliderLbl)),
      h('div', { class: 'agg-flow' }, h('div', null, h('div', { class: 'sq-cap' }, 'order_items (สีตามเมนู)'), left), h('div', null, h('div', { class: 'sq-cap' }, 'ผลลัพธ์'), right)),
      sqlBox, note);
    draw();
    return { destroy: () => db.close(), setMode(m) { if (m === 'nogroup') { grouped = false; draw(); } } };
  });

  // ───────────────────────── sql.join — INNER vs LEFT + GROUP BY + COALESCE ─────────────────────────
  R('sql.join', async (body) => {
    const ld = loading(body);
    const db = await FR.sql.open(`CREATE TABLE orders(id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL, status TEXT NOT NULL);
CREATE TABLE order_items(id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, product_name TEXT NOT NULL, unit_price REAL NOT NULL, qty INTEGER NOT NULL CHECK(qty > 0));
INSERT INTO orders(customer_name, status) VALUES ('คุณเอ','paid'), ('คุณบี','pending'), ('คุณซี','paid'), ('คุณดี','pending'), ('คุณอี','cancelled');
INSERT INTO order_items(order_id, product_name, unit_price, qty) VALUES (1,'Latte',55,2), (1,'Croissant',65,1), (2,'Americano',45,1), (3,'Matcha',60,1), (3,'Latte',55,1), (3,'Cocoa',50,2), (5,'Latte',55,1);`);
    ld.remove();
    let stage = 'left';
    const STAGES = {
      inner: { label: 'INNER JOIN', sql: 'SELECT o.id, o.customer_name, i.product_name, i.unit_price * i.qty AS sub\nFROM orders o\nJOIN order_items i ON i.order_id = o.id\nORDER BY o.id' },
      left: { label: 'LEFT JOIN', sql: 'SELECT o.id, o.customer_name, i.product_name, i.unit_price * i.qty AS sub\nFROM orders o\nLEFT JOIN order_items i ON i.order_id = o.id\nORDER BY o.id' },
      group: { label: '+ GROUP BY + SUM', sql: 'SELECT o.id, o.customer_name, SUM(i.unit_price * i.qty) AS total\nFROM orders o\nLEFT JOIN order_items i ON i.order_id = o.id\nGROUP BY o.id\nORDER BY o.id' },
      coalesce: { label: '+ COALESCE (คิวรีของข้อ 5)', sql: 'SELECT o.id, o.customer_name, COALESCE(SUM(i.unit_price * i.qty), 0) AS total\nFROM orders o\nLEFT JOIN order_items i ON i.order_id = o.id\nGROUP BY o.id\nORDER BY o.id' },
    };
    const NOTE = {
      inner: 'INNER JOIN เก็บเฉพาะคู่ที่ **จับคู่ได้** — ออเดอร์ #4 ที่ยังไม่มีรายการ **หายไปจากผลลัพธ์** (บั๊ก “ออเดอร์หายจากลิสต์” ของข้อ 5 / เมืองที่ยังไม่มีแคชหายในข้อ 6)',
      left: 'LEFT JOIN เก็บ **ทุกแถวของตารางซ้าย** — #4 ยังอยู่ โดยคอลัมน์ฝั่งขวาเป็น NULL · สังเกตว่าออเดอร์ที่มี 3 รายการ **กลายเป็น 3 แถว** (JOIN ขยายจำนวนแถว)',
      group: 'GROUP BY o.id ยุบแถวที่ถูกขยายกลับเป็น 1 แถวต่อออเดอร์ แล้ว SUM ต่อออเดอร์ — แต่ #4 ได้ **NULL** เพราะ SUM ของกลุ่มที่ไม่มีค่าเลยคือ NULL',
      coalesce: '`COALESCE(x, 0)` = “ถ้า x เป็น NULL ใช้ 0” → ทุกออเดอร์มี total เป็นตัวเลข แล้ว `fromMap` อ่านด้วย `(map[\'total\'] as num).toDouble()` ได้เสมอ',
    };
    const wrap = h('div', { class: 'jn' });
    const L = h('div', { class: 'jn-col' }), Rr = h('div', { class: 'jn-col' });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'jn-svg');
    wrap.append(L, svg, Rr);
    const sqlBox = h('div'), resBox = h('div'), note = h('div', { class: 'vnote' });
    const orders = db.rawQuery('SELECT * FROM orders ORDER BY id').rows;
    const items = db.rawQuery('SELECT * FROM order_items ORDER BY order_id, id').rows;
    L.appendChild(h('div', { class: 'sq-cap' }, 'orders (ซ้าย)'));
    Rr.appendChild(h('div', { class: 'sq-cap' }, 'order_items (ขวา)'));
    const oEl = {}, iEl = {};
    orders.forEach((o) => { oEl[o.id] = h('div', { class: 'jn-o' }, h('span', { class: 'mono' }, '#' + o.id), o.customer_name); L.appendChild(oEl[o.id]); });
    items.forEach((i) => { iEl[i.id] = h('div', { class: 'jn-i' }, h('span', { class: 'mono dim' }, h('span', { class: 'jn-k' }, 'order_id '), '→#' + i.order_id), i.product_name, h('span', { class: 'mono' }, `${i.unit_price}×${i.qty}`)); Rr.appendChild(iEl[i.id]); });
    function lines() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const wr = wrap.getBoundingClientRect(), sr = svg.getBoundingClientRect();
      if (!sr.width) return;
      svg.setAttribute('viewBox', `0 0 ${sr.width} ${wr.height}`);
      svg.style.height = wr.height + 'px';
      items.forEach((i) => {
        const a = oEl[i.order_id], b = iEl[i.id];
        if (!a || !b) return;
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        const y1 = ra.top + ra.height / 2 - wr.top, y2 = rb.top + rb.height / 2 - wr.top;
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', `M0 ${y1} C ${sr.width / 2} ${y1}, ${sr.width / 2} ${y2}, ${sr.width} ${y2}`);
        p.setAttribute('class', 'jn-ln');
        svg.appendChild(p);
      });
    }
    function draw() {
      const st = STAGES[stage];
      const t = db.rawQuery(st.sql);
      orders.forEach((o) => { const has = items.some((i) => i.order_id === o.id); oEl[o.id].classList.toggle('lost', stage === 'inner' && !has); oEl[o.id].classList.toggle('lonely', stage !== 'inner' && !has); });
      clear(sqlBox); sqlBox.appendChild(gen(st.sql, 'sql'));
      clear(resBox); resBox.append(h('div', { class: 'sq-cap' }, `ผลลัพธ์ ${t.rows.length} แถว`), FR.ResultTable(t.columns, t.rows));
      note.innerHTML = md(NOTE[stage]);
      requestAnimationFrame(lines);
    }
    const onR = () => lines();
    window.addEventListener('resize', onR);
    body.append(
      h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, seg(Object.keys(STAGES).map((k) => ({ value: k, label: STAGES[k].label })), stage, (v) => { stage = v; draw(); })),
      wrap, note, h('div', { class: 'two', style: { marginTop: '8px' } }, sqlBox, resBox));
    draw();
    return { destroy: () => { window.removeEventListener('resize', onR); db.close(); }, setMode(m) { if (STAGES[m]) { stage = m; draw(); } } };
  });

  // ───────────────────────── sql.order — ลำดับของค่าที่เท่ากัน ─────────────────────────
  R('sql.order', async (body) => {
    const ld = loading(body);
    let seed = 'CREATE TABLE orders(id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL, created_at TEXT NOT NULL, status TEXT NOT NULL);\n';
    for (let i = 1; i <= 12; i++) seed += `INSERT INTO orders(customer_name, created_at, status) VALUES ('ลูกค้า ${i}', '2026-10-14T09:00:0${i <= 6 ? 1 : 2}.000', 'paid');\n`;
    const db = await FR.sql.open(seed);
    ld.remove();
    let tie = false, idx = false;
    const out = h('div', { class: 'ord-out' }), sqlBox = h('div'), note = h('div', { class: 'vnote' });
    let prev = null;
    function draw() {
      const ob = tie ? 'created_at DESC, id DESC' : 'created_at DESC';
      const pages = [0, 1, 2].map((p) => db.rawQuery(`SELECT id, created_at FROM orders ORDER BY ${ob} LIMIT 4 OFFSET ${p * 4}`).rows);
      clear(sqlBox); sqlBox.appendChild(gen(`-- index ที่ created_at: ${idx ? 'มี' : 'ไม่มี'}\nSELECT id, created_at FROM orders\nORDER BY ${ob}\nLIMIT 4 OFFSET ?   -- หน้า 1: 0, หน้า 2: 4, หน้า 3: 8`, 'sql'));
      clear(out);
      const ids = [];
      pages.forEach((rows, p) => {
        const row = h('div', { class: 'ord-page' }, h('span', { class: 'sq-cap' }, `หน้า ${p + 1}`));
        rows.forEach((r) => { ids.push(r.id); row.appendChild(h('span', { class: 'ord-chip t' + r.created_at.slice(18, 19) }, h('b', null, '#' + r.id), h('span', { class: 'mono' }, r.created_at.slice(11, 19)))); });
        out.appendChild(row);
      });
      const changed = prev && prev.join() !== ids.join();
      note.innerHTML = md((changed ? '**ลำดับเปลี่ยน ทั้งที่คำสั่ง SQL เหมือนเดิมทุกตัวอักษร** · ' : '') + (tie
        ? 'มี `id DESC` เป็นตัวตัดสิน → ออเดอร์ที่เวลาเท่ากันเรียงใหม่→เก่าเสมอ ไม่ว่าจะมี index หรือไม่ (ลองสลับ index ดู ลำดับไม่ขยับ)'
        : 'ออเดอร์ 6 รายการในแต่ละวินาทีมีค่า `created_at` เท่ากัน → SQL **ไม่รับประกัน** ว่าจะเรียงแบบไหน ลำดับจึงขึ้นกับวิธีที่ SQLite เลือกค้น (มี/ไม่มี index, JOIN, รุ่นของ SQLite) — ลองสลับ “มี index”'));
      prev = ids;
    }
    body.append(
      h('div', { class: 'btn-row', style: { marginBottom: '8px' } },
        seg([{ value: false, label: "orderBy: 'created_at DESC'" }, { value: true, label: "orderBy: 'created_at DESC, id DESC'" }], tie, (v) => { tie = v; prev = null; draw(); }),
        toggle('มี index ที่ created_at', idx, (v) => { idx = v; db.db.exec(v ? 'CREATE INDEX idx_created ON orders(created_at)' : 'DROP INDEX idx_created'); draw(); })),
      h('div', { class: 'dim', style: { fontSize: '.8rem', marginBottom: '6px' } }, 'สีบอกวินาทีที่สร้าง: เหลือง = 09:00:01 (#1–#6) · ฟ้า = 09:00:02 (#7–#12)'),
      out, note, sqlBox);
    draw();
    return { destroy: () => db.close() };
  });

  // ───────────────────────── sql.pager — LIMIT/OFFSET + loadMore (ข้อ 5) ─────────────────────────
  R('sql.pager', async (body) => {
    const ld = loading(body);
    let seed = SEEDS.pos.sql.split('INSERT INTO orders')[0];
    seed += 'INSERT INTO orders(customer_name, created_at, status) VALUES\n' + Array.from({ length: 35 }, (_, i) => {
      const m = 10 + Math.floor(i * 1.5);
      return `('ลูกค้า ${i + 1}', '2026-10-14T${String(8 + Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00.000', '${['paid', 'pending', 'cancelled'][i % 3]}')`;
    }).join(',\n') + ';';
    const db = await FR.sql.open(seed);
    ld.remove();
    const PAGE = 10;
    let list = [], page = 0, hasMore = true, transferred = 0, calls = 0, sublist = false, nextNew = 1;
    const listBox = h('div', { class: 'pg-list' }), stat = h('div', { class: 'vkv' }), log = FR.SqlLog.create({ height: '220px' });
    const note = h('div', { class: 'vnote' });
    function stats() {
      clear(stat);
      [['_page', String(page)], ['_orders.length', String(list.length)], ['_hasMore', String(hasMore)], ['เรียก DB แล้ว', calls + ' ครั้ง'], ['แถวที่ข้ามจาก SQLite มา Dart', String(transferred)]].forEach(([k, v]) => stat.append(h('span', { class: 'k' }, k), h('span', { class: 'v' }, v)));
    }
    function drawList(newIds) {
      clear(listBox);
      const seen = new Map();
      list.forEach((o) => seen.set(o.id, (seen.get(o.id) || 0) + 1));
      list.forEach((o, i) => {
        if (i > 0 && i % PAGE === 0) listBox.appendChild(h('div', { class: 'pg-sep' }, `── หน้า ${i / PAGE + 1} ──`));
        const dup = seen.get(o.id) > 1;
        const el = h('div', { class: 'pg-i' + (dup ? ' dup' : '') + (newIds && newIds.has(o.id) && !dup ? ' new' : '') }, h('b', null, '#' + o.id), h('span', null, o.customer_name), h('span', { class: 'mono dim' }, o.created_at.slice(11, 16)), dup ? h('span', { class: 'chip err' }, 'ซ้ำ!') : null);
        listBox.appendChild(el);
      });
      if (!list.length) listBox.appendChild(h('div', { class: 'tg-empty' }, '(ยังไม่โหลด)'));
      const last = listBox.lastChild; if (last && last.scrollIntoView && newIds) listBox.scrollTop = listBox.scrollHeight;
    }
    function loadMore() {
      if (!hasMore) { note.innerHTML = md('`if (_isLoadingMore || !_hasMore) return;` — ไม่เรียก DB อีก'); return; }
      calls++;
      let rows;
      if (sublist) {
        const t = db.query('orders', { orderBy: 'created_at DESC, id DESC', dart: "final all = await db.query('orders', orderBy: 'created_at DESC, id DESC');  // ทั้งตาราง!" });
        log.add(t); rows = t.rows; transferred += rows.length;
        const start = page * PAGE;
        rows = rows.slice(start, start + PAGE);
        log.add({ ok: true, op: 'dart', dart: `all.sublist(${start}, min(${start + PAGE}, all.length));  // ทิ้ง ${t.rows.length - rows.length} แถวที่เพิ่งอ่านมา`, result: `${rows.length} แถวที่ใช้จริง` });
      } else {
        const t = db.rawQuery('SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?', [PAGE, page * PAGE], { dart: `await db.rawQuery('''…ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?''', [_pageSize, _page * _pageSize]);  // [${PAGE}, ${page * PAGE}]` });
        log.add(t); rows = t.rows; transferred += rows.length;
      }
      list = list.concat(rows);
      hasMore = rows.length === PAGE;
      page++;
      note.innerHTML = md(hasMore ? `ได้ ${rows.length} แถว = เต็มหน้า → \`_hasMore = page.length == _pageSize\` ยังเป็น true` : `ได้ ${rows.length} แถว (< ${PAGE}) → \`_hasMore = false\` หยุดโหลด`);
      drawList(new Set(rows.map((r) => r.id))); stats();
    }
    function refresh() { list = []; page = 0; hasMore = true; note.innerHTML = md('`refresh()` ล้างลิสต์ + `_page = 0` แล้วโหลดหน้าแรกใหม่'); loadMore(); }
    function newOrder() {
      const t = db.insert('orders', { customer_name: 'ออเดอร์ใหม่ ' + nextNew++, created_at: '2026-10-14T23:00:00.000', status: 'pending' });
      log.add(t);
      note.innerHTML = md('มีออเดอร์ใหม่ (เวลาล่าสุด → ขึ้นบนสุดของลำดับ) **ระหว่างที่ผู้ใช้เลื่อนอยู่** · หน้าถัดไปที่ใช้ OFFSET เดิม จะเลื่อนไป 1 ตำแหน่ง → **แถวสุดท้ายของหน้าก่อนโผล่ซ้ำ** · ข้อ 5 จึงให้เรียก `refresh()` หลัง `createOrder`');
    }
    body.append(
      h('div', { class: 'btn-row', style: { marginBottom: '8px' } },
        btn('loadMore()', loadMore, 'primary sm'), btn('refresh()', refresh, 'sm'), btn('+ ออเดอร์ใหม่เข้ามาระหว่างเลื่อน', newOrder, 'sm'),
        toggle('แบ่งหน้าด้วย sublist ใน Dart', sublist, (v) => { sublist = v; list = []; page = 0; hasMore = true; transferred = 0; calls = 0; log.clear(); drawList(); stats(); })),
      h('div', { class: 'two' }, h('div', null, h('div', { class: 'sq-cap' }, '_orders (ที่หน้าจอแสดง)'), listBox), h('div', null, stat, note, log.el)));
    stats(); drawList();
    return { destroy: () => db.close() };
  });

  // ───────────────────────── sql.dates — ยอดขายวันนี้ (ช่วงเวลา) ─────────────────────────
  R('sql.dates', async (body) => {
    const ld = loading(body);
    const db = await FR.sql.open(SEEDS.pos.sql);
    ld.remove();
    let method = 'half', utc = false;
    const TRUTH = new Set([5, 6, 10, 12]); // paid orders whose local time is on 2026-10-14
    const METHODS = {
      half: { label: '>= ? AND < ? (ครึ่งเปิด)', where: 'o.created_at >= ? AND o.created_at < ?', args: ['2026-10-14T00:00:00.000', '2026-10-15T00:00:00.000'], dart: "[start.toIso8601String(), end.toIso8601String()]" },
      between: { label: "BETWEEN ? AND '…23:59:59'", where: 'o.created_at BETWEEN ? AND ?', args: ['2026-10-14T00:00:00', '2026-10-14T23:59:59'], dart: "['2026-10-14T00:00:00', '2026-10-14T23:59:59']" },
      like: { label: "LIKE '2026-10-14%'", where: 'o.created_at LIKE ?', args: ['2026-10-14%'], dart: "['${dateStr}%']" },
    };
    const tl = h('div', { class: 'dt-list' }), sqlBox = h('div'), res = h('div'), note = h('div', { class: 'vnote' });
    function draw() {
      db.db.exec(`UPDATE orders SET created_at = '${utc ? '2026-10-13T17:00:00.000Z' : '2026-10-14T00:00:00.000'}' WHERE id = 5`);
      const m = METHODS[method];
      const sql = `SELECT COALESCE(SUM(i.unit_price * i.qty), 0) AS revenue\nFROM orders o JOIN order_items i ON i.order_id = o.id\nWHERE o.status = ? AND ${m.where}`;
      const t = db.rawQuery(sql, ['paid', ...m.args]);
      const inc = new Set(db.rawQuery(`SELECT o.id FROM orders o WHERE o.status = ? AND ${m.where}`, ['paid', ...m.args]).rows.map((r) => r.id));
      const all = db.rawQuery(`SELECT o.id, o.customer_name, o.created_at, o.status, COALESCE(SUM(i.unit_price * i.qty), 0) AS total FROM orders o LEFT JOIN order_items i ON i.order_id = o.id GROUP BY o.id ORDER BY o.created_at`).rows;
      clear(tl);
      all.forEach((o) => {
        const should = TRUTH.has(o.id), got = inc.has(o.id);
        const cls = o.status !== 'paid' ? 'skip' : got && should ? 'ok' : got && !should ? 'bad' : !got && should ? 'miss' : '';
        tl.appendChild(h('div', { class: 'dt-r ' + cls },
          h('span', { class: 'mono' }, o.created_at), h('span', null, `#${o.id} ${o.customer_name}`), h('span', { class: 'pill' }, o.status), h('span', { class: 'mono' }, '฿' + o.total),
          h('span', { class: 'dt-m' }, o.status !== 'paid' ? '' : got && should ? '✓ นับ' : got ? '✗ ไม่ควรนับ' : should ? '✗ ตกหล่น' : '')));
      });
      clear(sqlBox); sqlBox.appendChild(gen(sql + `\n-- whereArgs: ['paid', ...${dv(m.args)}]`, 'sql'));
      const v = t.rows[0].revenue;
      clear(res); res.append(h('div', { class: 'agg-v' + (v === 545 ? '' : ' null') }, `revenue = ${v}`), h('div', { class: 'dim', style: { fontSize: '.8rem' } }, 'ค่าที่ถูก (paid ของวันที่ 14 ตามเวลาไทย) = 545'));
      const n = [];
      if (method === 'half') n.push('ช่วง **[00:00 วันนี้, 00:00 พรุ่งนี้)** ครอบทุกเสี้ยววินาทีของวัน และใช้ index ได้ — วิธีที่โจทย์ข้อ 5 ต้องการ');
      if (method === 'between') n.push('`BETWEEN` รวมปลายทั้งสองข้าง และปลายบนเขียน `23:59:59` → ออเดอร์ #10 ที่ `23:59:59.900` **ตกหล่น** (สตริงที่ยาวกว่ามากกว่าเสมอ)');
      if (method === 'like') n.push('ได้ผลถูกเมื่อทุกแถวเป็นเวลาท้องถิ่นรูปแบบเดียวกัน แต่เปรียบเทียบแบบข้อความทั้งคอลัมน์ (ใช้ index แบบช่วงไม่ได้) และพังทันทีที่มีแถวเป็น UTC');
      if (utc) n.push('**#5 ถูกบันทึกด้วย `DateTime.now().toUtc()`** → เก็บเป็น `2026-10-13T17:00:00.000Z` ทั้งที่เป็นเที่ยงคืนของวันที่ 14 ตามเวลาไทย → ทุกวิธีที่เปรียบเทียบข้อความนับผิด · **กฎ: ทั้งแอปใช้รูปแบบเวลาแบบเดียว** ([[13.7]])');
      note.innerHTML = md(n.join('<br>'));
    }
    body.append(
      h('div', { class: 'btn-row', style: { marginBottom: '8px' } },
        seg(Object.keys(METHODS).map((k) => ({ value: k, label: METHODS[k].label })), method, (v) => { method = v; draw(); }),
        toggle('ออเดอร์ #5 บันทึกเป็นเวลา UTC', utc, (v) => { utc = v; draw(); })),
      h('div', { class: 'dim', style: { fontSize: '.8rem', marginBottom: '6px' } }, '“วันนี้” ในภาพนี้ = 2026-10-14 (เวลาไทย) · เขียว = นับถูก · แดง = นับผิด/ตกหล่น · จาง = ไม่ใช่ paid'),
      tl, h('div', { class: 'two', style: { marginTop: '8px' } }, sqlBox, h('div', null, res, note)));
    draw();
    return { destroy: () => db.close() };
  });

  // ───────────────────────── sql.upsert — conflictAlgorithm (ข้อ 6) ─────────────────────────
  R('sql.upsert', async (body) => {
    const ld = loading(body);
    const db = await FR.sql.open(SEEDS.weather.sql);
    ld.remove();
    const grids = Grids(db, { tables: ['cities', 'forecast_days'], maxHeight: '200px' });
    const log = FR.SqlLog.create({ height: '240px' });
    const orphan = h('div', { class: 'sq-count' });
    const nameIn = h('input', { class: 'vinput', value: 'Bangkok', 'aria-label': 'ชื่อเมืองจากผลค้นหา' });
    const vals = () => ({ name: nameIn.value, country: 'Thailand', latitude: 13.75, longitude: 100.5167 });
    function after(t) {
      if (!t.ok && !t.note) { const hs = excHints(t.error); if (hs.length) t.note = '`on DatabaseException catch (e)` → ' + hs.map((x) => '`' + x + '`').join(' · ') + ' → แจ้งผู้ใช้ว่า “เพิ่มเมืองนี้ไว้แล้ว”'; }
      log.add(t); grids.refresh();
      const orph = db.rawQuery('SELECT rowid AS r FROM forecast_days WHERE city_id NOT IN (SELECT id FROM cities)').rows.map((x) => x.r);
      const fg = grids.grid('forecast_days');
      if (fg) orph.forEach((r) => { const tr = fg.el.querySelector(`tr[data-rid="${r}"]`); if (tr) { tr.classList.add('orphan'); tr.title = 'แถวกำพร้า: city_id นี้ไม่มีในตาราง cities แล้ว'; } });
      const o = orph.length;
      const c = db.rawQuery('SELECT id, nickname FROM cities WHERE latitude = 13.75 AND longitude = 100.5167').rows[0];
      orphan.innerHTML = md(`เมืองที่พิกัดนี้: ${c ? `id = **${c.id}** · nickname = **${c.nickname == null ? 'NULL' : c.nickname}**` : '—'} · แถวกำพร้าใน forecast_days (city_id ชี้ไปเมืองที่ไม่มีแล้ว): **${o}**`);
      orphan.classList.toggle('bad', o > 0 || (c && c.nickname == null));
    }
    const b = (label, fn, cls) => btn(label, fn, cls || 'sm');
    body.append(
      h('div', { class: 'btn-row', style: { marginBottom: '6px' } }, h('span', { class: 'dim', style: { fontSize: '.82rem' } }, 'ผู้ใช้กดเพิ่มเมืองจากผลค้นหาซ้ำ (พิกัดเดิม 13.75, 100.5167) ชื่อ:'), nameIn),
      h('div', { class: 'btn-row', style: { marginBottom: '8px' } },
        b('insert (ค่าเริ่มต้น = abort)', () => after(db.insert('cities', vals()))),
        b('ConflictAlgorithm.ignore', () => { const t = db.insert('cities', vals(), { conflict: 'ignore' }); if (!t.changes) t.note = 'ไม่ได้แทรกและไม่มี error — sqflite คืน **0** (ไม่ใช่ id) · ชื่อใหม่ที่ผู้ใช้เลือกถูกทิ้งเงียบๆ'; after(t); }),
        b('ConflictAlgorithm.replace', () => after(db.insert('cities', vals(), { conflict: 'replace' })), 'danger sm'),
        b('ทางที่ปลอดภัย: update เฉพาะคอลัมน์', () => {
          const t = db.update('cities', { name: nameIn.value }, { where: 'latitude = ? AND longitude = ?', whereArgs: [13.75, 100.5167] });
          t.note = t.changes ? 'มีอยู่แล้ว → แก้แค่ชื่อ · id และ nickname เดิมอยู่ครบ (ถ้าได้ 0 ค่อย insert)' : 'ไม่มีเมืองนี้ → ค่อย `insert`';
          after(t);
        }, 'ok sm'),
        b('รีเซ็ต', () => { reseed(db, 'weather'); log.clear(); after({ ok: true, op: 'reset', sql: '-- รีเซ็ตข้อมูล', dart: '', result: 'พร้อม' }); }, 'sm ghost')),
      orphan,
      h('div', { class: 'two', style: { marginTop: '8px' } }, grids.el, log.el));
    after({ ok: true, op: 'start', sql: '-- ข้อมูลเริ่มต้น: Bangkok id 1 มี nickname “บ้าน” และพยากรณ์ 3 แถว', dart: '', result: 'พร้อม' });
    return { destroy: () => db.close(), setMode(m) { if (m === 'replace') after(db.insert('cities', vals(), { conflict: 'replace' })); } };
  });
})();
