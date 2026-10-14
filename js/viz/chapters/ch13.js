/* Chapter 13 visualizations — SQLite (real engine via sql.js) */
(function () {
  'use strict';
  const { h, clear, sleep, flash, seg, btn, toggle } = FR.util;
  const md = (s) => FR.markup.inline(s);
  const R = FR.viz.register;
  const dv = (v) => FR.sql.dv(v);

  function loading(body) { const l = h('div', { class: 'vnote' }, 'กำลังโหลด SQLite (sql.js)…'); body.appendChild(l); return l; }

  const NOTES_SQL = `CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL
);`;

  // ───────── 13.1 RAM vs disk ─────────
  R('ch13.ram', (body) => {
    let persist = false, ram = [], disk = [], alive = true, n = 0;
    const ph = FR.Phone.create({ title: 'โน้ตของฉัน', small: true, height: 300 });
    const ramBox = h('div', { class: 'mem-box' }), diskBox = h('div', { class: 'mem-box disk' });
    const con = FR.Console.create({ title: 'เหตุการณ์', compact: true });
    function draw() {
      ph.setDark(!alive);
      if (alive) ph.setBody(FR.ui.col(...(ram.length ? ram.map((t) => FR.ui.listTile({ title: t })) : [FR.ui.center(FR.ui.text('(ยังไม่มีโน้ต)', 'dim'))])));
      clear(ramBox); ram.forEach((t) => ramBox.appendChild(h('div', { class: 'mem-i' }, t))); if (!ram.length) ramBox.appendChild(h('div', { class: 'dim' }, '(ว่าง)'));
      clear(diskBox); disk.forEach((t) => diskBox.appendChild(h('div', { class: 'mem-i' }, t))); if (!disk.length) diskBox.appendChild(h('div', { class: 'dim' }, '(ว่าง)'));
    }
    ph.setFab('+', () => { if (!alive) return; n++; const t = 'โน้ตสำคัญ #' + n; ram.push(t); con.log(`พิมพ์ “${t}” → อยู่ใน RAM ทันที (เห็นบนจอปั๊บ)`); if (persist) { disk.push(t); con.log('  + db.insert(...) → ลงไฟล์ .db', 'ok'); } draw(); });
    const kill = btn('ปัดปิดแอป / แบตหมด', () => { alive = false; ram = []; con.log('ระบบปฏิบัติการคืนพื้นที่ RAM ของแอป → ข้อมูลใน RAM หายหมด', 'err'); draw(); }, 'danger');
    const open = btn('เปิดแอปใหม่', () => { alive = true; ram = disk.slice(); con.log(persist ? `โหลดจาก SQLite: ${disk.length} รายการ ✓` : 'ไม่มีที่เก็บถาวร → จอว่างเปล่า', persist ? 'ok' : 'warn'); draw(); });
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, toggle('บันทึกลง SQLite ด้วย', persist, (v) => (persist = v)), kill, open),
      h('div', { class: 'vrow' }, ph.el, h('div', { class: 'grow vcol' }, h('div', { class: 'two' }, FR.Panel('RAM (ต้องมีไฟเลี้ยง · OS เรียกคืนได้ทุกเมื่อ)', ramBox), FR.Panel('ไฟล์ SQLite บนดิสก์ (อยู่รอดข้ามการปิดแอป)', diskBox)), con.el)));
    draw();
  });

  // ───────── 13.2 text file vs SQLite ─────────
  R('ch13.filevs', (body) => {
    const TOTAL = 5000, TARGET = 2317;
    const fBar = FR.Meter.create('ไฟล์ข้อความ: อ่าน/เขียน', { max: TOTAL, kind: 'flash' });
    const sBar = FR.Meter.create('SQLite: แถวที่แตะ', { max: TOTAL, kind: 'ok' });
    fBar.set(0, TOTAL, '0'); sBar.set(0, TOTAL, '0');
    const out = h('div', { class: 'vnote' });
    let power = false;
    async function edit() {
      clear(out); fBar.set(0, TOTAL, '0'); sBar.set(0, TOTAL, '0');
      sBar.set(1, TOTAL, '1 แถว');
      for (let i = 0; i <= TOTAL; i += 250) {
        fBar.set(i, TOTAL, i + ' บรรทัด');
        await sleep(40);
        if (power && i >= 2500) { out.innerHTML = md('⚡ **ไฟดับขณะเขียนทับไฟล์** → ไฟล์มีครึ่งเก่าครึ่งใหม่ อาจเสียทั้งไฟล์ · SQLite: การเขียนแต่ละครั้ง “สำเร็จครบหรือไม่เกิดขึ้นเลย” ข้อมูลเดิมยังสมบูรณ์'); return; }
      }
      out.innerHTML = md(`แก้ยอดรายการที่ ${TARGET.toLocaleString()} (เมื่อสามเดือนก่อน): ไฟล์ข้อความต้อง **อ่านทั้งไฟล์ ค้นหา แก้ แล้วเขียนทับทั้ง ${TOTAL.toLocaleString()} บรรทัด** · SQLite: \`UPDATE ... WHERE id = ${TARGET}\` แตะแถวเดียว`);
    }
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, btn('แก้ยอดรายการที่ 2,317', edit, 'primary'), toggle('ไฟดับกลางทาง', power, (v) => (power = v))), fBar.el, h('div', { style: { height: '6px' } }), sBar.el, out);
  });

  // ───────── 13.3 imports → packages ─────────
  R('ch13.packages', (body) => {
    const PK = { path: ['path', 'จัดการเส้นทางไฟล์'], path_provider: ['path_provider', 'ถาม OS ว่าโฟลเดอร์ไหนของแอป'], sqflite: ['sqflite', 'คุยกับ SQLite'], provider: ['provider', 'บทที่ 10–11'], http: ['http', 'บทที่ 12'], intl: ['intl', 'จัดรูปแบบวันที่ (แลป)'] };
    const API = [['join(dir, name)', 'path'], ['getApplicationDocumentsDirectory()', 'path_provider'], ['getDatabasesPath()', 'sqflite'], ['openDatabase(path, version:, onCreate:)', 'sqflite'], ['Database / Transaction / Batch', 'sqflite'], ['ConflictAlgorithm.replace', 'sqflite'], ['DateFormat.yMMMd()', 'intl'], ['ChangeNotifierProvider', 'provider'], ['http.get(...)', 'http']];
    const pkEls = {};
    const pkRow = h('div', { class: 'pk-row' }, Object.entries(PK).map(([k, [n, d]]) => (pkEls[k] = h('div', { class: 'pk' }, h('div', { class: 'mono' }, n), h('div', { class: 'dim', style: { fontSize: '.72rem' } }, d)))));
    const apiRow = h('div', { class: 'btn-row' }, API.map(([a, p]) => { const b = h('button', { type: 'button', class: 'btn sm mono' }, a); const on = () => { Object.values(pkEls).forEach((e) => e.classList.remove('on')); pkEls[p].classList.add('on'); }; b.addEventListener('mouseenter', on); b.addEventListener('focus', on); b.addEventListener('click', on); return b; }));
    body.append(h('div', { class: 'vnote' }, 'ชี้/แตะชื่อ API เพื่อดูว่ามาจากแพ็กเกจไหน (และต้องเพิ่มอะไรใน pubspec)'), apiRow, pkRow);
  });

  // ───────── 13.4 singleton + race + path ─────────
  R('ch13.singleton', (body) => {
    // vault
    let mode = 'single';
    const screens = ['หน้าเพิ่มรายการ', 'หน้าสรุปยอด', 'หน้าตั้งค่า'];
    const vault = h('div', { class: 'vault' });
    const con = FR.Console.create({ title: 'สิ่งที่เกิดขึ้น', compact: true });
    function drawVault() {
      clear(vault);
      vault.append(h('div', { class: 'vault-scr' }, screens.map((s) => h('div', { class: 'vs' }, s, h('span', { class: 'vk' }, mode === 'single' ? '→ DatabaseHelper.instance' : '🔑 openDatabase เอง')))),
        h('div', { class: 'vault-pipe' + (mode === 'single' ? ' one' : ' many') }, mode === 'single' ? 'ท่อเดียว · คิวเรียงกัน' : '3 การเชื่อมต่อ'), h('div', { class: 'vault-db' }, '🗄 MyNotes.db', h('div', { class: 'dim', style: { fontSize: '.72rem' } }, 'SQLite: เขียนได้ทีละราย')));
    }
    async function writeAll() {
      con.sep('ทั้ง 3 หน้าจอบันทึกพร้อมกัน');
      if (mode === 'single') { for (const s of screens) { con.log(`${s}: insert → เข้าคิว → สำเร็จ`, 'ok'); await sleep(250); } con.log('onCreate/onUpgrade มีเจ้าของคนเดียว (DatabaseHelper)', 'dim'); }
      else { con.log('หน้าเพิ่มรายการ: เขียนสำเร็จ (ได้ล็อกก่อน)', 'ok'); await sleep(250); con.log('หน้าสรุปยอด: รอ… รอนานเกินไป → DatabaseException: database is locked', 'err'); await sleep(250); con.log('หน้าตั้งค่า: database is locked', 'err'); con.log('โค้ดสร้างตารางกระจายอยู่หลายที่ ไม่มีใครรับผิดชอบจริง', 'warn'); }
    }
    const s1 = seg([{ value: 'single', label: 'Singleton: DatabaseHelper.instance' }, { value: 'many', label: 'ทุกหน้าทำกุญแจเอง' }], mode, (v) => { mode = v; drawVault(); con.clear(); });
    // race
    let impl = 'nullable';
    const raceBox = h('div', { class: 'race' });
    const CODE = {
      nullable: `static Database? _database;
Future<Database> get database async {
  if (_database != null) return _database!;
  _database = await _initDatabase();
  return _database!;
}`,
      future: `Future<Database>? _dbFuture;
Future<Database> get database => _dbFuture ??= _initDatabase();`,
    };
    const raceCode = h('div');
    async function race() {
      clear(raceBox);
      const lane = (name) => { const l = h('div', { class: 'race-l' }, h('span', { class: 'race-n' }, name)); raceBox.appendChild(l); return l; };
      const a = lane('ผู้เรียก A (initState หน้า 1)'), b = lane('ผู้เรียก B (provider ตัวที่ 2)'), dbl = lane('openDatabase');
      const step = (l, t, cls) => l.appendChild(h('span', { class: 'race-s ' + (cls || '') }, t));
      step(a, 'get database'); step(b, 'get database'); await sleep(350);
      if (impl === 'nullable') {
        step(a, '_database == null → init'); step(b, '_database == null → init', 'bad'); await sleep(350);
        step(dbl, 'เปิดครั้งที่ 1'); step(dbl, 'เปิดครั้งที่ 2 ✗', 'bad'); await sleep(350);
        step(a, 'ได้ DB #1'); step(b, 'ได้ DB #2 (ทับตัวแปร)', 'bad');
      } else {
        step(a, '_dbFuture ??= _initDatabase()'); step(b, 'ได้ Future ตัวเดิม', 'ok'); await sleep(350);
        step(dbl, 'เปิดครั้งเดียว ✓', 'ok'); await sleep(350);
        step(a, 'ได้ DB #1'); step(b, 'ได้ DB #1', 'ok');
      }
    }
    function drawRace() { clear(raceCode); raceCode.appendChild(FR.CodeView.create({ src: CODE[impl], lang: 'dart', title: impl === 'nullable' ? 'ตำรา 13.4.1' : 'แบบเก็บ Future (เสริม — โจทย์ q3 ใช้)' }).el); }
    const s2 = seg([{ value: 'nullable', label: 'Database? (ตำรา)' }, { value: 'future', label: 'Future<Database>? ??=' }], impl, (v) => { impl = v; drawRace(); clear(raceBox); });
    // path
    let api = 'docs', moved = false;
    const pathOut = h('div', { class: 'vkv' });
    function drawPath() {
      clear(pathOut);
      const p = api === 'docs' ? '/data/user/0/com.example.app/app_flutter/MyNotes.db' : '/data/user/0/com.example.app/databases/MyNotes.db';
      pathOut.append(h('span', { class: 'k' }, 'Android'), h('span', { class: 'v' }, p), h('span', { class: 'k' }, 'iOS'), h('span', { class: 'v' }, '…/Application/<uuid>/Documents/MyNotes.db'), h('span', { class: 'k' }, 'ข้อมูลผู้ใช้'), h('span', { class: 'v' + (moved ? ' chg' : '') }, moved ? '0 รายการ — openDatabase สร้างไฟล์ว่างใหม่ที่ path ใหม่ ข้อมูลเดิม “หาย”' : '1,284 รายการ'));
    }
    const s3 = seg([{ value: 'docs', label: 'getApplicationDocumentsDirectory()' }, { value: 'dbpath', label: 'getDatabasesPath()' }], api, (v) => { if (v !== api) moved = true; api = v; drawPath(); });
    body.append(h('h4', { style: { marginTop: 0 } }, 'ห้องนิรภัยประตูบานเดียว'), h('div', { class: 'vctrl' }, s1, btn('3 หน้าจอบันทึกพร้อมกัน', writeAll, 'primary sm')), h('div', { class: 'vrow' }, h('div', { class: 'grow' }, vault), h('div', { class: 'grow' }, con.el)),
      h('h4', null, 'เสริม: สองผู้เรียกเข้ามาพร้อมกัน'), h('div', { class: 'vctrl' }, s2, btn('▶ เรียกพร้อมกัน', race, 'primary sm')), h('div', { class: 'vrow' }, h('div', { class: 'grow' }, raceCode), h('div', { class: 'grow' }, raceBox)),
      h('h4', null, 'ไฟล์อยู่ที่ไหน (sandbox) และห้ามเปลี่ยนหลังปล่อยแอป'), h('div', { class: 'vctrl' }, s3, btn('รีเซ็ต', () => { moved = false; drawPath(); }, 'sm ghost')), pathOut);
    drawVault(); drawRace(); drawPath();
  });

  // ───────── 13.5 CREATE TABLE builder (real) ─────────
  R('ch13.create', async (body) => {
    const ld = loading(body);
    let db = await FR.sql.open();
    ld.remove();
    const cols = [
      { name: 'id', type: 'INTEGER', pk: true, ai: true, nn: false, uq: false, def: '' },
      { name: 'title', type: 'TEXT', pk: false, ai: false, nn: true, uq: false, def: '' },
      { name: 'amount', type: 'REAL', pk: false, ai: false, nn: true, uq: false, def: '' },
      { name: 'is_done', type: 'INTEGER', pk: false, ai: false, nn: true, uq: false, def: '0' },
    ];
    const DART = { INTEGER: 'int', TEXT: 'String', REAL: 'double', BLOB: 'Uint8List', NUMERIC: 'num' };
    const grid = h('div', { class: 'cb-grid' });
    const sqlOut = h('div'), dartOut = h('div');
    const log = FR.SqlLog.create({ title: 'ผลลัพธ์จาก SQLite จริง', height: '200px' });
    const tg = FR.TableGrid.create({ db, table: 'items', emptyText: '(ยังไม่มีตาราง/แถว)' });
    function sql() {
      return `CREATE TABLE items (\n${cols.map((c) => `  ${c.name} ${c.type}${c.pk ? ' PRIMARY KEY' : ''}${c.ai ? ' AUTOINCREMENT' : ''}${c.nn ? ' NOT NULL' : ''}${c.uq ? ' UNIQUE' : ''}${c.def !== '' ? ' DEFAULT ' + c.def : ''}`).join(',\n')}\n)`;
    }
    function render() {
      clear(grid);
      grid.appendChild(h('div', { class: 'cb-h' }, 'ชื่อ', 'ชนิด', 'PK', 'AUTO', 'NOT NULL', 'UNIQUE', 'DEFAULT'));
      cols.forEach((c) => {
        const name = h('input', { class: 'vinput', value: c.name, 'aria-label': 'ชื่อคอลัมน์' }); name.addEventListener('input', () => { c.name = name.value.replace(/\W/g, ''); upd(); });
        const type = h('select', { class: 'vinput', 'aria-label': 'ชนิด' }, Object.keys(DART).map((t) => h('option', { value: t, selected: t === c.type }, t))); type.addEventListener('change', () => { c.type = type.value; upd(); });
        const cb = (k) => { const i = h('input', { type: 'checkbox', 'aria-label': k }); i.checked = c[k]; i.addEventListener('change', () => { c[k] = i.checked; upd(); }); return i; };
        const def = h('input', { class: 'vinput', value: c.def, placeholder: '—', 'aria-label': 'DEFAULT', style: { width: '70px' } }); def.addEventListener('input', () => { c.def = def.value; upd(); });
        grid.appendChild(h('div', { class: 'cb-r' }, name, type, cb('pk'), cb('ai'), cb('nn'), cb('uq'), def));
      });
      upd();
    }
    function upd() {
      clear(sqlOut); sqlOut.appendChild(FR.CodeView.create({ src: `await db.execute('''\n${sql()}\n''');`, lang: 'dart', title: 'ใน _onCreate' }).el);
      clear(dartOut); dartOut.appendChild(FR.CodeView.create({ src: `class Item {\n${cols.map((c) => `  final ${DART[c.type]}${c.pk && c.ai ? '?' : ''} ${c.name.replace(/_(\w)/g, (_, x) => x.toUpperCase())};${c.pk && c.ai ? ' // null ก่อน insert' : c.type === 'INTEGER' && /^is_/.test(c.name) ? ' // (bool ใน Dart → 0/1)' : ''}`).join('\n')}\n}`, lang: 'dart', title: 'ฟิลด์ใน Model' }).el);
    }
    const addCol = btn('+ คอลัมน์', () => { cols.push({ name: 'col' + cols.length, type: 'TEXT', pk: false, ai: false, nn: false, uq: false, def: '' }); render(); }, 'sm');
    const create = btn('▶ สร้างตาราง (onCreate)', () => { db.close(); FR.sql.open().then((d) => { db = d; tg.setDb(db, 'items'); log.add(db.execute(sql())); tg.refresh(); }); }, 'primary sm');
    const insOk = btn("insert {'title': 'ปากกา', 'amount': 25}", () => { log.add(db.insert('items', { title: 'ปากกา', amount: 25 })); tg.refresh(); }, 'sm');
    const insNull = btn("insert {'amount': 30} (ไม่มี title)", () => { log.add(db.insert('items', { amount: 30 })); tg.refresh(); }, 'sm');
    const insDup = btn("insert ซ้ำ {'title': 'ปากกา', …}", () => { log.add(db.insert('items', { title: 'ปากกา', amount: 99 })); tg.refresh(); }, 'sm');
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, addCol, create), grid,
      h('div', { class: 'two', style: { marginTop: '10px' } }, sqlOut, dartOut),
      h('div', { class: 'btn-row', style: { margin: '10px 0 6px' } }, h('span', { class: 'dim', style: { fontSize: '.8rem' } }, 'ทดสอบ constraint:'), insOk, insNull, insDup),
      h('div', { class: 'two' }, tg.el, log.el));
    render();
    return { destroy: () => db.close() };
  });

  // ───────── 13.5 onCreate runs once ─────────
  R('ch13.oncreate', (body) => {
    const steps = [
      { title: 'ติดตั้งแอปครั้งแรก → ยังไม่มีไฟล์ → `onCreate` ทำงาน', text: 'สร้างตาราง notes (v1)', apply: (s) => { s.file = true; s.schema = 'notes(id, title, content)'; s.rows = 0; s.log.push(['onCreate ถูกเรียก: กำลังจะสร้างตาราง notes...', 'sys']); } },
      { title: 'ผู้ใช้บันทึกโน้ต 3 รายการ', apply: (s) => { s.rows = 3; s.log.push(['Inserted row id: 1, 2, 3', 'ok']); } },
      { title: 'นักพัฒนาแก้ CREATE TABLE ใน `_onCreate` เพิ่ม created_at แล้วรันทับ', text: 'ไฟล์มีอยู่แล้ว → **onCreate ไม่ถูกเรียก** → ตารางในเครื่องยังเป็นแบบเดิม', kind: 'fail', apply: (s) => { s.log.push(['(onCreate ไม่ทำงาน — ไฟล์มีอยู่แล้ว)', 'warn']); s.log.push(["DatabaseException(no such column: created_at)", 'err']); } },
      { title: 'ทางลัดของนักพัฒนา: uninstall แล้วรันใหม่', text: 'onCreate ทำงานอีกครั้ง — **แต่ข้อมูลทั้งหมดถูกลบ** ใช้ได้เฉพาะเครื่องนักพัฒนา', apply: (s) => { s.schema = 'notes(id, title, content, created_at)'; s.rows = 0; s.log.push(['uninstall → ไฟล์ .db ถูกลบ', 'err']); s.log.push(['onCreate ถูกเรียก (ตารางใหม่ ว่างเปล่า)', 'sys']); } },
      { title: 'ของจริงกับผู้ใช้: เพิ่ม version + `onUpgrade`', text: 'ไปต่อที่ [[13.8]]', apply: (s) => { s.log.push(['→ version: 2 + onUpgrade: ALTER TABLE notes ADD COLUMN created_at TEXT', 'info']); } },
    ];
    const info = h('div', { class: 'vkv' });
    const con = FR.Console.create({ title: 'Debug Console', compact: true });
    const st = FR.Stepper.create({ steps, initial: () => ({ file: false, schema: '—', rows: 0, log: [] }), draw: (s) => {
      clear(info); info.append(h('span', { class: 'k' }, 'ไฟล์ .db'), h('span', { class: 'v' }, s.file ? 'มีอยู่' : 'ยังไม่มี'), h('span', { class: 'k' }, 'โครงสร้างในเครื่อง'), h('span', { class: 'v' }, s.schema), h('span', { class: 'k' }, 'จำนวนโน้ต'), h('span', { class: 'v' }, String(s.rows)));
      con.clear(); s.log.forEach(([t, k]) => con.log(t, k));
    } });
    body.append(h('div', { class: 'vrow' }, h('div', { class: 'grow' }, FR.Panel('สถานะ', info)), h('div', { class: 'grow' }, con.el)), st.el);
    return { destroy: () => st.destroy() };
  });

  // ───────── 13.6 CRUD playground (real) ─────────
  R('ch13.crud', async (body, props) => {
    const ld = loading(body);
    const db = await FR.sql.open(NOTES_SQL);
    ld.remove();
    [['First Note', 'This is the content of my first note.'], ['ซื้อของ', 'นม ไข่ ขนมปัง'], ['ประชุม', 'วันจันทร์ 10:00']].forEach(([t, c]) => db.insert('notes', { title: t, content: c }));
    const tg = FR.TableGrid.create({ db, table: 'notes' });
    const log = FR.SqlLog.create({ height: '260px' });
    let forget = false;
    const t = h('input', { class: 'vinput', value: 'โน้ตใหม่', 'aria-label': 'title' });
    const c = h('input', { class: 'vinput', value: 'เนื้อหา', 'aria-label': 'content' });
    const idIn = h('input', { class: 'vinput', value: '2', style: { width: '60px' }, 'aria-label': 'id' });
    const run = (tr) => { log.add(tr); tg.apply(tr); };
    const ins = btn('insert', () => run(db.insert('notes', { title: t.value, content: c.value })), 'primary sm');
    const qAll = btn("query(orderBy: 'id DESC')", () => run(db.query('notes', { orderBy: 'id DESC' })), 'sm');
    const upd = btn('update', () => run(forget
      ? db.update('notes', { title: 'Updated Title', content: 'This content has been updated.' })
      : db.update('notes', { title: 'Updated Title', content: 'This content has been updated.' }, { where: 'id = ?', whereArgs: [+idIn.value] })), 'sm');
    const del = btn('delete', () => run(forget ? db.delete('notes') : db.delete('notes', { where: 'id = ?', whereArgs: [+idIn.value] })), 'danger sm');
    const reset = btn('รีเซ็ตตาราง', () => { db.execute('DELETE FROM notes'); db.execute("DELETE FROM sqlite_sequence WHERE name='notes'"); [['First Note', 'This is the content of my first note.'], ['ซื้อของ', 'นม ไข่ ขนมปัง'], ['ประชุม', 'วันจันทร์ 10:00']].forEach(([a, b]) => db.insert('notes', { title: a, content: b })); log.clear(); tg.refresh(); }, 'sm ghost');
    const fT = toggle('ลืมใส่ where', forget, (v) => { forget = v; });
    body.append(
      h('div', { class: 'form-mini', style: { marginBottom: '8px' } }, h('label', null, 'title', t), h('label', null, 'content', c), h('label', null, 'id (update/delete)', idIn)),
      h('div', { class: 'btn-row', style: { marginBottom: '10px' } }, ins, qAll, upd, del, fT, reset),
      h('div', { class: 'two' }, tg.el, log.el));
    return { destroy: () => db.close(), setMode(m) { if (m === 'nowhere') { fT.set(true); forget = true; } } };
  });

  // ───────── 13.6 SQL injection (real) ─────────
  R('ch13.inject', async (body) => {
    const ld = loading(body);
    const db = await FR.sql.open(NOTES_SQL);
    ld.remove();
    [['บันทึกส่วนตัว', 'รหัสตู้เซฟ 4821'], ['ซื้อของ', 'นม ไข่'], ["ร้านของ O'Brien", 'ซอย 5']].forEach(([t, c]) => db.insert('notes', { title: t, content: c }));
    const kw = h('input', { class: 'vinput', style: { width: '100%' }, value: "x' OR '1'='1", 'aria-label': 'คำค้น' });
    const outA = h('div'), outB = h('div');
    function run() {
      clear(outA); clear(outB);
      const a = db.rawQuery(`SELECT * FROM notes WHERE title = '${kw.value}'`, [], { dart: `await db.rawQuery("SELECT * FROM notes WHERE title = '\$keyword'");` });
      const b = db.query('notes', { where: 'title = ?', whereArgs: [kw.value] });
      const lA = FR.SqlLog.create({ title: 'อันตราย: ต่อสตริงด้วย $' }); lA.add(a);
      const lB = FR.SqlLog.create({ title: 'ปลอดภัย: ? + whereArgs' }); lB.add(b);
      outA.append(lA.el, a.ok ? FR.ResultTable(a.columns, a.rows) : h('div', { class: 'vt-res bad' }, 'คำสั่ง SQL พัง (เครื่องหมาย \' ปิดสตริงกลางทาง)'));
      outB.append(lB.el, FR.ResultTable(b.columns, b.rows, { empty: '(0 แถว)' }));
      if (a.ok && a.rows.length === 3) outA.appendChild(h('div', { class: 'vt-res bad' }, '⚠ เงื่อนไขกลายเป็นจริงทุกแถว — ได้ข้อมูลทุกโน้ต รวมถึงของส่วนตัว'));
    }
    kw.addEventListener('input', run);
    const presets = h('div', { class: 'btn-row' }, h('span', { class: 'dim', style: { fontSize: '.8rem' } }, 'ลองพิมพ์:'), ["x' OR '1'='1", "ร้านของ O'Brien", 'ซื้อของ', "'; DROP TABLE notes; --"].map((v) => btn(v, () => { kw.value = v; run(); }, 'sm ghost')));
    body.append(h('label', { class: 'dim', style: { fontSize: '.82rem' } }, 'ข้อความที่ผู้ใช้พิมพ์ในช่องค้นหา (keyword)'), kw, presets, h('div', { class: 'two', style: { marginTop: '10px' } }, outA, outB));
    run();
    return { destroy: () => db.close() };
  });

  // ───────── 13.7 Model ⇄ Map ⇄ Row (real) ─────────
  R('ch13.mapper', async (body) => {
    const ld = loading(body);
    const db = await FR.sql.open(`CREATE TABLE transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, amount REAL NOT NULL, date TEXT NOT NULL, type TEXT NOT NULL, is_done INTEGER NOT NULL DEFAULT 0);`);
    ld.remove();
    const bugs = { alwaysId: false, enumIndex: false, asDouble: false };
    let enumVals = ['income', 'expense'];
    const tg = FR.TableGrid.create({ db, table: 'transactions' });
    const log = FR.SqlLog.create({ height: '220px' });
    const modelBox = h('div'), mapBox = h('div'), backBox = h('div');
    const obj = { id: null, title: 'เงินเดือน', amount: 20000, date: '2026-10-01T09:00:00.000', type: 'income', isDone: true };
    function toMap(o) {
      const m = {};
      if (bugs.alwaysId || o.id != null) m.id = o.id;
      m.title = o.title; m.amount = o.amount; m.date = o.date;
      m.type = bugs.enumIndex ? enumVals.indexOf(o.type) : o.type;
      m.is_done = o.isDone ? 1 : 0;
      return m;
    }
    function fromMap(row) {
      const r = {};
      try {
        r.id = row.id;
        r.title = row.title;
        if (bugs.asDouble && Number.isInteger(row.amount)) throw new Error("TypeError: type 'int' is not a subtype of type 'double' in type cast  ← (map['amount'] as double)");
        r.amount = row.amount;
        r.date = row.date;
        r.type = typeof row.type === 'number' ? (enumVals[row.type] || '??') + ` (index ${row.type})` : row.type;
        r.isDone = row.is_done === 1;
        return r;
      } catch (e) { return { error: e.message }; }
    }
    function kvBox(title, entries) { return FR.Panel(title, h('div', { class: 'vkv' }, entries.flatMap(([k, v, t]) => [h('span', { class: 'k' }, k), h('span', { class: 'v' }, v, t ? h('span', { class: 'dim' }, '  ' + t) : null)]))); }
    function render() {
      clear(modelBox); clear(mapBox);
      modelBox.appendChild(kvBox('MyTransaction (Dart)', [['id', String(obj.id), 'int?'], ['title', `'${obj.title}'`, 'String'], ['amount', String(obj.amount), 'double'], ['date', `DateTime(${obj.date.slice(0, 10)})`, 'DateTime'], ['type', 'TransactionType.' + obj.type, 'enum'], ['isDone', String(obj.isDone), 'bool']]));
      const m = toMap(obj);
      mapBox.appendChild(kvBox('toMap() → Map<String, Object?>', Object.entries(m).map(([k, v]) => [`'${k}'`, dv(v), k === 'type' ? (bugs.enumIndex ? '.index ✗' : '.name ✓') : k === 'is_done' ? 'bool → 1/0' : k === 'date' ? 'toIso8601String()' : k === 'id' ? (v == null ? '⚠ null ถูกส่งไป' : '') : ''])));
    }
    function readBack() {
      clear(backBox);
      const q = db.query('transactions', { orderBy: 'id' });
      log.add(q);
      const rows = q.rows.map(fromMap);
      backBox.appendChild(FR.Panel('fromMap(row) → MyTransaction', h('div', null, rows.map((r) => r.error ? h('div', { class: 'jp-err mono' }, r.error) : h('div', { class: 'mono', style: { fontSize: '.76rem' } }, `id ${r.id} · ${r.title} · ${r.amount} · ${r.type} · isDone=${r.isDone}`)))));
    }
    const ins = btn('db.insert(tx.toMap())', () => { const tr = db.insert('transactions', toMap(Object.assign({}, obj, { id: null }))); log.add(tr); tg.apply(tr); readBack(); }, 'primary sm');
    const upd = btn('db.update(tx.toMap(), where id = 1)', () => { const o = Object.assign({}, obj, { id: bugs.alwaysId ? null : 1, title: 'เงินเดือน (แก้)' }); const tr = db.update('transactions', toMap(o), { where: 'id = ?', whereArgs: [1] }); log.add(Object.assign(tr, bugs.alwaysId ? { note: 'toMap ใส่ `\'id\': null` → UPDATE ... SET id = NULL → SQLite ปฏิเสธ' } : {})); tg.apply(tr); readBack(); }, 'sm');
    const insInt = btn('insert amount เป็นจำนวนเต็ม (แถวเก่า)', () => { const tr = db.rawQuery("INSERT INTO transactions (title, amount, date, type, is_done) VALUES ('แถวเก่า', 100, '2026-01-01T00:00:00.000', ?, 0)", [bugs.enumIndex ? 1 : 'expense']); log.add(tr); tg.refresh(); readBack(); }, 'sm');
    const addEnum = btn('เพิ่มค่า transfer ไว้กลาง enum', () => { enumVals = ['income', 'transfer', 'expense']; log.add({ ok: true, op: 'note', dart: 'enum TransactionType { income, transfer, expense }  // เพิ่มค่าใหม่ไว้ตรงกลาง', result: 'อ่านแถวเดิมอีกครั้ง…' }); readBack(); }, 'sm');
    const reset = btn('รีเซ็ต', () => { db.execute('DELETE FROM transactions'); db.execute("DELETE FROM sqlite_sequence"); enumVals = ['income', 'expense']; log.clear(); tg.refresh(); clear(backBox); render(); }, 'sm ghost');
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '6px' } }, h('span', { class: 'dim', style: { fontSize: '.8rem' } }, 'เปิดบั๊ก:'),
      toggle("toMap ใส่ 'id' เสมอ", bugs.alwaysId, (v) => { bugs.alwaysId = v; render(); }), toggle('enum เก็บ .index', bugs.enumIndex, (v) => { bugs.enumIndex = v; render(); }), toggle('อ่าน amount ด้วย as double', bugs.asDouble, (v) => { bugs.asDouble = v; readBack(); })),
      h('div', { class: 'btn-row', style: { marginBottom: '10px' } }, ins, upd, insInt, addEnum, reset),
      h('div', { class: 'mapper' }, modelBox, h('div', { class: 'jp-ar' }, '→'), mapBox, h('div', { class: 'jp-ar' }, '→'), tg.el),
      h('div', { class: 'two', style: { marginTop: '10px' } }, backBox, log.el));
    render();
    return { destroy: () => db.close(), setMode(m) { if (bugs[m] !== undefined) { bugs[m] = true; render(); } } };
  });

  // ───────── 13.8 migration (real) ─────────
  R('ch13.migrate', async (body) => {
    const ld = loading(body);
    await FR.sql.ready();
    ld.remove();
    const V1 = 'CREATE TABLE notes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, content TEXT NOT NULL)';
    const STEP2 = 'ALTER TABLE notes ADD COLUMN created_at TEXT';
    const STEP3 = { safe: "ALTER TABLE notes ADD COLUMN mood TEXT DEFAULT 'neutral'", bad: 'ALTER TABLE notes ADD COLUMN mood TEXT NOT NULL' };
    let device = 'v1', variant = 'lt', step3 = 'safe';
    const CREATE_LATEST = "CREATE TABLE notes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT, mood TEXT DEFAULT 'neutral')";
    const codeBox = h('div'), out = h('div'), schemaBox = h('div', { class: 'two' });
    const log = FR.SqlLog.create({ title: 'คำสั่งที่รันจริง', height: '200px', showDart: true });
    function code() {
      const s3 = STEP3[step3];
      if (variant === 'lt') return `Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {\n  if (oldVersion < 2) {\n    await db.execute('${STEP2}');\n  }\n  if (oldVersion < 3) {\n    await db.execute("${s3}");\n  }\n}`;
      if (variant === 'eq') return `Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {\n  if (oldVersion == 1) {\n    await db.execute('${STEP2}');\n  }\n  if (oldVersion == 2) {\n    await db.execute("${s3}");\n  }\n}`;
      return `Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {\n  if (oldVersion < 2) {\n    await db.execute('${STEP2}');\n  } else if (oldVersion < 3) {\n    await db.execute("${s3}");\n  }\n}`;
    }
    function drawCode() { clear(codeBox); codeBox.appendChild(FR.CodeView.create({ src: `static const _databaseVersion = 3;\n\n${code()}`, lang: 'dart', title: 'แอปรุ่นใหม่ (version 3)' }).el); }
    function schemaTable(db, title) {
      const info = db.tableInfo('notes');
      return FR.Panel(title, FR.ResultTable(['name', 'type', 'notnull', 'dflt_value'], info.map((c) => [c.name, c.type, c.notnull, c.dflt_value])));
    }
    async function upgrade() {
      clear(out); clear(schemaBox); log.clear();
      const db = await FR.sql.open();
      const fresh = await FR.sql.open(CREATE_LATEST);
      if (device === 'fresh') {
        log.add({ ok: true, sql: CREATE_LATEST, dart: '// ไม่มีไฟล์ → onCreate (สร้างแบบล่าสุดทันที)', result: 'ok' });
        db.db.exec(CREATE_LATEST);
      } else {
        db.db.exec(V1);
        db.db.exec("INSERT INTO notes (title, content) VALUES ('โน้ตเก่า 1', 'ข้อความ'), ('โน้ตเก่า 2', 'ข้อความ')");
        if (device === 'v2') db.db.exec(STEP2);
        const old = device === 'v1' ? 1 : 2;
        log.add({ ok: true, sql: `PRAGMA user_version  -- = ${old}`, dart: `// ไฟล์มีเลขเวอร์ชัน ${old} < 3 → onUpgrade(db, ${old}, 3)`, result: 'เริ่ม migration ใน transaction' });
        db.db.exec('BEGIN');
        const runs = [];
        if (variant === 'lt') { if (old < 2) runs.push(STEP2); if (old < 3) runs.push(STEP3[step3]); }
        else if (variant === 'eq') { if (old === 1) runs.push(STEP2); if (old === 2) runs.push(STEP3[step3]); }
        else { if (old < 2) runs.push(STEP2); else if (old < 3) runs.push(STEP3[step3]); }
        let failed = false;
        for (const s of runs) {
          const tr = db.execute(s, { dart: `await db.execute('${s}');` });
          log.add(tr);
          if (!tr.ok) { failed = true; break; }
        }
        if (failed) { db.db.exec('ROLLBACK'); log.add({ ok: false, sql: 'ROLLBACK', error: 'migration ล้มเหลว → ไฟล์กลับสภาพเดิมทั้งหมด (onUpgrade อยู่ใน transaction)', dart: '' }); }
        else db.db.exec('COMMIT');
      }
      schemaBox.append(schemaTable(db, `เครื่องนี้หลังเปิดแอป (${device === 'fresh' ? 'ติดตั้งใหม่' : 'อัปเกรดจาก ' + device})`), schemaTable(fresh, 'เครื่องที่ติดตั้งใหม่ (onCreate ล่าสุด)'));
      const q = db.query('notes', { columns: ['id', 'title', 'created_at', 'mood'] });
      log.add(q);
      const same = JSON.stringify(db.tableInfo('notes').map((c) => [c.name, c.type, c.notnull, c.dflt_value])) === JSON.stringify(fresh.tableInfo('notes').map((c) => [c.name, c.type, c.notnull, c.dflt_value]));
      out.appendChild(h('div', { class: 'vt-res ' + (q.ok && same ? 'ok' : 'bad') }, q.ok ? (same ? '✓ โครงสร้างตรงกับเครื่องที่ติดตั้งใหม่ และโน้ตเดิมยังอยู่ครบ' : '⚠ โครงสร้างไม่ตรงกับเครื่องที่ติดตั้งใหม่ — บั๊กจะเกิดเฉพาะผู้ใช้กลุ่มนี้') : '✗ ' + q.error + ' — หน้าจอที่อ่าน mood จะพังเฉพาะเครื่องที่อัปเกรดจาก ' + device));
      db.close(); fresh.close();
    }
    body.append(
      h('div', { class: 'vctrl' }, h('span', { class: 'lbl' }, 'เครื่องผู้ใช้มีไฟล์รุ่น:'), seg([{ value: 'fresh', label: 'ยังไม่มี (ติดตั้งใหม่)' }, { value: 'v1', label: 'v1 (ข้ามรุ่น 2 ไปเลย)' }, { value: 'v2', label: 'v2' }], device, (v) => { device = v; })),
      h('div', { class: 'vctrl' }, h('span', { class: 'lbl' }, 'onUpgrade เขียนแบบ:'), seg([{ value: 'lt', label: 'if (oldVersion < N) ต่อกัน (ตำรา)' }, { value: 'eq', label: 'if (oldVersion == N)' }, { value: 'elseif', label: 'else if' }], variant, (v) => { variant = v; drawCode(); })),
      h('div', { class: 'vctrl' }, h('span', { class: 'lbl' }, 'คอลัมน์ใหม่ v3:'), seg([{ value: 'safe', label: "mood TEXT DEFAULT 'neutral'" }, { value: 'bad', label: 'mood TEXT NOT NULL (ไม่มี DEFAULT)' }], step3, (v) => { step3 = v; drawCode(); }), btn('▶ เปิดแอปรุ่น 3 บนเครื่องนี้', upgrade, 'primary sm')),
      h('div', { class: 'vrow' }, h('div', { class: 'grow' }, codeBox), h('div', { class: 'grow' }, log.el)), out, schemaBox);
    drawCode();
  });

  // ───────── 13.9 transaction / deadlock / batch ─────────
  R('ch13.tx', async (body) => {
    const ld = loading(body);
    let db = await FR.sql.open("CREATE TABLE accounts (name TEXT PRIMARY KEY, balance INTEGER NOT NULL); INSERT INTO accounts VALUES ('A', 1000), ('B', 1000);");
    ld.remove();
    const tg = FR.TableGrid.create({ db, table: 'accounts', orderBy: 'name' });
    const log = FR.SqlLog.create({ height: '220px' });
    const total = h('div', { class: 'vnote' });
    let useTx = true, battery = true;
    function sum() { const r = db.rawQuery('SELECT SUM(balance) AS s FROM accounts').rows[0].s; total.innerHTML = md(`เงินรวมในระบบ = **${r}** ${r === 2000 ? '✓' : '✗ เงินหายไป ' + (2000 - r)}`); }
    async function transfer() {
      if (useTx) { db.begin(); log.add({ ok: true, sql: 'BEGIN', dart: 'await db.transaction((txn) async {' }); }
      const a = db.update('accounts', { balance: db.rawQuery("SELECT balance FROM accounts WHERE name='A'").rows[0].balance - 500 }, { where: 'name = ?', whereArgs: ['A'], on: useTx ? 'txn' : 'db' });
      log.add(a); tg.apply(a);
      await sleep(500);
      if (battery) {
        log.add({ ok: false, sql: '⚡ แบตหมด — แอปตายก่อนคำสั่งที่สอง', error: 'แอปถูกปิดกลางทาง', dart: '' });
        await sleep(500);
        if (useTx) { db.rollback(); log.add({ ok: true, sql: 'ROLLBACK', dart: '// เปิดแอปใหม่: SQLite พบ transaction ที่ยังไม่จบ → ยกเลิกทั้งหมด', result: 'A กลับมาเท่าเดิม' }); }
        else log.add({ ok: true, sql: '-- ไม่มี transaction: คำสั่งแรกถูกบันทึกไปแล้ว', dart: '', result: 'A ถูกหักไปแล้ว แต่ B ไม่ได้รับ' });
        tg.refresh(); sum(); return;
      }
      const b = db.update('accounts', { balance: db.rawQuery("SELECT balance FROM accounts WHERE name='B'").rows[0].balance + 500 }, { where: 'name = ?', whereArgs: ['B'], on: useTx ? 'txn' : 'db' });
      log.add(b); tg.apply(b);
      if (useTx) { db.commit(); log.add({ ok: true, sql: 'COMMIT', dart: '});', result: 'บันทึกพร้อมกันทั้งสองคำสั่ง' }); }
      sum();
    }
    const reset = btn('รีเซ็ตบัญชี', () => { db.execute("UPDATE accounts SET balance = 1000"); log.clear(); tg.refresh(); sum(); }, 'sm ghost');
    // deadlock
    let useDb = false;
    const dl = h('div', { class: 'dl' });
    async function runTx() {
      clear(dl);
      const row = (t, cls) => dl.appendChild(h('div', { class: 'dl-r ' + (cls || '') }, t));
      row('await db.transaction((txn) async {', '');
      await sleep(300);
      row("  await txn.delete('notes');  ✓", 'ok');
      await sleep(300);
      if (useDb) {
        row("  await db.insert('notes', …);  ⏳ รอให้ transaction จบก่อน…", 'wait');
        row('  …transaction ก็รอคำสั่งนี้อยู่  ⏳', 'wait');
        row('หน้าจอ: วงล้อหมุนตลอดไป — ไม่มี error ใดๆ แสดงออกมา', 'bad');
      } else { row("  await txn.insert('notes', …);  ✓", 'ok'); row('});  → COMMIT ✓', 'ok'); }
    }
    // batch
    const bOut = h('div', { class: 'vkv' });
    async function batchRace() {
      const d = await FR.sql.open('CREATE TABLE notes (id INTEGER PRIMARY KEY, title TEXT)');
      clear(bOut);
      const RT = 3; // ms per platform-channel round trip (simulated)
      for (let i = 0; i < 100; i++) d.db.exec(`INSERT INTO notes (title) VALUES ('n${i}')`);
      bOut.append(h('span', { class: 'k' }, 'ทีละคำสั่ง (await insert ×100)'), h('span', { class: 'v' }, `100 รอบ Dart↔แพลตฟอร์ม ≈ ${100 * RT} ms`),
        h('span', { class: 'k' }, 'batch ภายใน transaction'), h('span', { class: 'v' }, `1 รอบ ≈ ${RT} ms (+ noResult: true เร็วขึ้นอีก)`),
        h('span', { class: 'k' }, 'แถวที่ได้จริง'), h('span', { class: 'v' }, String(d.count('notes')) + ' (จาก SQLite จริง)'));
      d.close();
    }
    body.append(h('h4', { style: { marginTop: 0 } }, 'โอนเงิน A → B 500 บาท'), h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, toggle('ครอบด้วย transaction', useTx, (v) => (useTx = v)), toggle('แบตหมดระหว่างสองคำสั่ง', battery, (v) => (battery = v)), btn('▶ โอนเงิน', transfer, 'primary sm'), reset),
      h('div', { class: 'two' }, h('div', null, tg.el, total), log.el),
      h('h4', null, 'กับดัก: ใช้ db ในบล็อก transaction (deadlock)'), h('div', { class: 'btn-row', style: { marginBottom: '6px' } }, seg([{ value: 'txn', label: 'ใช้ txn ทุกคำสั่ง' }, { value: 'db', label: 'เผลอใช้ db.insert' }], 'txn', (v) => (useDb = v === 'db')), btn('▶ รัน', runTx, 'sm')), dl,
      h('h4', null, 'batch: รวมคำสั่งส่งรอบเดียว'), btn('นำเข้า 100 แถว', batchRace, 'sm'), bOut, h('div', { class: 'vnote' }, '(เวลา round-trip เป็นตัวเลขจำลองเพื่ออธิบาย — ตอนรันจริงให้จับเวลาด้วย Stopwatch ตามความท้าทายข้อ 3)'));
    sum();
    return { destroy: () => db.close() };
  });

  // ───────── 13.10 offline-first six-lane swimlane ─────────
  R('ch13.offline', (body) => {
    const lanes = [
      { id: 'u', label: 'ผู้ใช้' }, { id: 's', label: 'หน้าจอ', sub: 'TodoListScreen' }, { id: 'p', label: 'Provider', sub: 'TodoProvider' },
      { id: 'r', label: 'Repository', sub: 'TodoRepository' }, { id: 'd', label: 'SQLite', sub: 'todos' }, { id: 'n', label: 'เครือข่าย', sub: 'api_service' },
    ];
    const P1 = 'ช่วงที่ 1: แสดงข้อมูลในเครื่องทันที', P2 = 'ช่วงที่ 2: ซิงก์กับเซิร์ฟเวอร์เบื้องหลัง';
    const first = [
      { from: 'u', to: 's', label: 'เปิดแอป', phase: P1 },
      { from: 's', label: 'addPostFrameCallback → load()', phase: P1, text: 'เลื่อนไปหลังเฟรมแรก เพราะ load() notify ทันที ([[12.8]])' },
      { from: 's', to: 'p', label: 'load()', phase: P1 },
      { from: 'p', to: 'r', label: 'readCached()', phase: P1 },
      { from: 'r', to: 'd', label: "query('todos')", phase: P1 },
      { from: 'd', to: 'p', label: 'รายการเดิม', kind: 'ret', phase: P1, text: 'ผ่าน repository กลับมา' },
      { from: 'p', to: 's', label: 'isRefreshing = true → notifyListeners()', kind: 'notify', phase: P1, text: 'หน้าจอวาดรายการเดิม + แถบรีเฟรชบางๆ (ถ้าเปิดครั้งแรก ชุดในเครื่องว่าง → วงล้อหมุน)' },
      { from: 'p', to: 'r', label: 'refresh()', phase: P2 },
      { from: 'r', to: 'n', label: 'fetchTodos() GET (timeout 10 วิ)', phase: P2 },
    ];
    const ok = [
      { from: 'n', to: 'r', label: 'List<Todo> ใหม่', kind: 'ret', phase: P2 },
      { from: 'r', to: 'd', label: 'transaction: delete + batch insert', phase: P2, text: 'บันทึก “ครบทั้งชุดหรือไม่บันทึกเลย”' },
      { from: 'r', to: 'd', label: 'readCached()', phase: P2 },
      { from: 'r', to: 'p', label: 'คืนสิ่งที่อยู่ใน DB', kind: 'ret', phase: P2, text: 'หน้าจอเห็นเฉพาะสิ่งที่อยู่ในฐานข้อมูล (แหล่งความจริงเดียว)' },
      { from: 'p', label: 'lastSynced = now, errorMessage = null', kind: 'ok', phase: P2 },
      { from: 'p', to: 's', label: 'finally: isRefreshing = false → notify', kind: 'notify', phase: P2, text: 'รายการใหม่ ไม่กระพริบ' },
    ];
    const fail = (what) => [
      { from: 'n', to: 'r', label: what, kind: 'fail', phase: P2, text: '**ไม่แตะฐานข้อมูลเลย** → ชุดเดิมยังอยู่ครบ' },
      { from: 'r', to: 'p', label: 'ApiException', kind: 'fail', phase: P2 },
      { from: 'p', label: "errorMessage = 'เกิดข้อผิดพลาด'", kind: 'fail', phase: P2 },
      { from: 'p', to: 's', label: 'finally: isRefreshing = false → notify', kind: 'notify', phase: P2, text: 'แสดงรายการเดิม + แถบ “แสดงข้อมูลเมื่อ … / ลองใหม่”' },
    ];
    const wrong = [
      { from: 'p', to: 'r', label: 'refresh() (ลบก่อน!)', phase: P2 },
      { from: 'r', to: 'd', label: "delete('todos') ก่อนเรียก API", kind: 'fail', phase: P2, text: 'ลำดับผิด: ลบของเดิมทิ้งก่อนรู้ว่าจะได้ของใหม่หรือไม่' },
      { from: 'r', to: 'n', label: 'fetchTodos()', phase: P2 },
      { from: 'n', to: 'r', label: 'ไม่มีสัญญาณ', kind: 'fail', phase: P2 },
      { from: 'p', to: 's', label: 'notify', kind: 'notify', phase: P2, text: '**ผู้ใช้ในลิฟต์เห็นจอว่าง** — แคชหายไปแล้ว' },
    ];
    FR.Swimlane.create(body, {
      lanes, variantLabel: 'เครือข่าย:',
      variants: {
        online: { label: 'ออนไลน์', steps: first.concat(ok) },
        offline: { label: 'ไม่มีสัญญาณ', steps: first.concat(fail('SocketException')) },
        timeout: { label: 'ช้าเกิน 10 วิ', steps: first.concat(fail('TimeoutException')) },
        wrong: { label: 'ผิด: ลบแคชก่อนเรียก API', steps: first.slice(0, 7).concat(wrong) },
      },
      intro: 'แผนภาพ 6 lane ตามหัวข้อ 13.10.1 — เส้นทึบ = เรียกใช้ · เส้นประ = ส่งผลกลับ/แจ้งเตือน · สีแดง = เส้นทางเมื่อล้มเหลว',
    });
  });

  // ───────── 13.10 four screen states ─────────
  R('ch13.fourstates', (body) => {
    const st = { hasData: true, refreshing: true, error: false, synced: true };
    const ph = FR.Phone.create({ title: 'Todos (offline-first)', small: true, height: 330 });
    const which = h('div', { class: 'vnote' });
    const list = () => FR.ui.col(...[1, 2, 3, 4].map((i) => FR.ui.listTile({ leading: '☐', title: 'delectus aut autem ' + i })));
    function render() {
      let v, label;
      if (!st.hasData && st.refreshing) { v = FR.ui.center(FR.ui.spinner()); label = '① ไม่มีข้อมูล + กำลังรีเฟรช → **วงล้อเต็มหน้า** (เปิดแอปครั้งแรก)'; }
      else if (!st.hasData && st.error) { v = FR.ui.center(FR.ui.text('เชื่อมต่ออินเทอร์เน็ตไม่ได้'), FR.ui.btn('ลองใหม่', () => {}, 'tonal')); label = '④ ไม่มีข้อมูล + รีเฟรชไม่สำเร็จ → **ข้อความผิดพลาด + ลองใหม่เต็มหน้า**'; }
      else if (!st.hasData) { v = FR.ui.center(FR.ui.text('(ไม่มีรายการ)', 'dim')); label = 'ไม่มีข้อมูล ไม่ได้รีเฟรช ไม่มี error → ลิสต์ว่าง (ควรบอกผู้ใช้ว่าไม่มีรายการ)'; }
      else {
        v = h('div', null, st.refreshing ? FR.ui.linear() : null, st.error ? h('div', { class: 'elv-banner' }, 'แสดงข้อมูล' + (st.synced ? 'เมื่อ 08:12' : 'ที่บันทึกไว้ในเครื่องจากครั้งก่อน') + ' · เชื่อมต่อไม่ได้  [ลองใหม่]') : null, list());
        label = st.refreshing ? '② มีข้อมูล + กำลังรีเฟรช → **รายการเดิม + แถบบางๆ ใต้ AppBar** (ห้ามเปลี่ยนทั้งหน้าเป็นวงล้อ)' : st.error ? '③ มีข้อมูล + รีเฟรชไม่สำเร็จ → **รายการเดิม + MaterialBanner บอกเวลา (lastSynced) + ลองใหม่**' : 'มีข้อมูล ซิงก์สำเร็จ → รายการปกติ';
      }
      ph.setBody(v); which.innerHTML = md(label);
    }
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, toggle('todos ไม่ว่าง', st.hasData, (v) => { st.hasData = v; render(); }), toggle('isRefreshing', st.refreshing, (v) => { st.refreshing = v; render(); }), toggle('errorMessage != null', st.error, (v) => { st.error = v; render(); }), toggle('lastSynced มีค่า', st.synced, (v) => { st.synced = v; render(); })),
      h('div', { class: 'vrow' }, ph.el, h('div', { class: 'grow' }, which, h('div', { class: 'vnote', style: { marginTop: '8px' }, html: md('สถานะเป็น **ชุดค่า 4 ตัวประกอบกัน** (รายการ, isRefreshing, errorMessage, lastSynced) ไม่ใช่ enum ค่าเดียว — เพราะเมื่อมีข้อมูลในเครื่อง “กำลังโหลด” และ “ผิดพลาด” ต่างก็แยกเป็น 2 กรณีที่ต้องแสดงต่างกันมาก') }))));
    render();
  });

  // ───────── Lab: expense tracker (real SQLite) ─────────
  R('ch13.app', async (body) => {
    const ld = loading(body);
    const db = await FR.sql.open("CREATE TABLE transactions(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, amount REAL, date TEXT, type TEXT)");
    ld.remove();
    const ph = FR.Phone.create({ title: 'รายรับ-รายจ่าย', small: true, height: 420 });
    const tg = FR.TableGrid.create({ db, table: 'transactions', maxHeight: '200px' });
    const log = FR.SqlLog.create({ height: '200px' });
    const con = FR.Console.create({ title: 'Debug Console', compact: true });
    let memory = [], alive = true, n = 0;
    const SAMPLES = [['เงินเดือน', 20000, 'income'], ['ค่าอาหาร', 120, 'expense'], ['ค่ารถ', 45, 'expense'], ['ขายของ', 800, 'income'], ['ค่ากาแฟ', 65, 'expense']];
    function fetchAndSet() {
      const q = db.query('transactions', { orderBy: 'date DESC, id DESC' });
      log.add(q);
      memory = q.rows;
      con.log(`Fetched ${memory.length} transactions.`);
      con.log('notifyListeners() → Consumer วาดใหม่', 'flash');
      draw();
    }
    function draw() {
      if (!alive) { ph.setDark(true); return; }
      ph.setDark(false);
      const bal = memory.reduce((s, r) => s + (r.type === 'income' ? r.amount : -r.amount), 0);
      ph.setBody(h('div', null, h('div', { class: 'u-pad', style: { paddingBottom: '4px' } }, FR.ui.text(`ยอดคงเหลือ ${bal.toFixed(2)} บาท`, 'dim')),
        memory.length ? FR.ui.col(...memory.map((r) => FR.ui.listTile({ leading: r.type === 'income' ? 'รับ' : 'จ่าย', title: r.title, subtitle: r.date.slice(0, 10), trailing: h('span', null, h('span', { style: { color: r.type === 'income' ? 'var(--ok)' : 'var(--err)' } }, r.amount.toFixed(2)), ' ', h('button', { type: 'button', class: 'ph-icon', title: 'ลบ', onclick: () => del(r.id) }, '🗑')) }))) : FR.ui.center(FR.ui.text('ไม่มีรายการ', 'dim'))));
    }
    function add() {
      const [t, a, ty] = SAMPLES[n++ % SAMPLES.length];
      con.log(`context.read<TransactionProvider>().addTransaction('${t}', ${a}, …)`, 'dim');
      const tr = db.insert('transactions', { title: t, amount: a, date: new Date(Date.UTC(2026, 9, 1 + n)).toISOString(), type: ty }, { on: '_database!' });
      log.add(tr); tg.apply(tr);
      con.log(`Inserted transaction with id: ${tr.lastId}`);
      fetchAndSet();
    }
    function del(id) {
      con.log(`deleteTransaction(${id})`, 'dim');
      const tr = db.delete('transactions', { where: 'id = ?', whereArgs: [id], on: '_database!' });
      log.add(tr); tg.apply(tr);
      fetchAndSet();
    }
    ph.setFab('+', add);
    const kill = btn('ปิดแอป', () => { alive = false; memory = []; con.sep('ปิดแอป: _transactions ใน provider หาย (อยู่ใน RAM)'); draw(); }, 'danger sm');
    const open = btn('เปิดแอปใหม่', () => { alive = true; con.sep('เปิดแอป: TransactionProvider() → fetchAndSetTransactions()'); fetchAndSet(); }, 'primary sm');
    const sum = btn("ความท้าทาย 2: SUM ใน SQL", () => { const tr = db.rawQuery("SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS balance FROM transactions"); log.add(tr); }, 'sm');
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, kill, open, sum),
      h('div', { class: 'vrow' }, ph.el, h('div', { class: 'grow vcol' }, tg.el, log.el, con.el)));
    fetchAndSet();
    return { destroy: () => db.close() };
  });

  // ───────── 13.12 conflict resolution ─────────
  R('ch13.conflict', (body) => {
    let skew = 0, strategy = 'first';
    const out = h('div');
    const skewV = h('span', { class: 'mono' }, '0 นาที');
    function run() {
      clear(out);
      // device A edits at 10:05 (true time), online at 10:30. device B edits at 10:10 (true), online at 10:20. B clock skewed by `skew` minutes.
      const aEdit = 10 * 60 + 5, bEditTrue = 10 * 60 + 10, bEditClock = bEditTrue + skew;
      const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(((m % 60) + 60) % 60).padStart(2, '0')}`;
      let winner;
      if (strategy === 'first') winner = 'B';
      else winner = bEditClock > aEdit ? 'B' : 'A';
      const truthLatest = 'B';
      out.append(h('div', { class: 'cf2' },
        h('div', { class: 'cf2-d' + (winner === 'A' ? ' win' : '') }, h('b', null, '📱 เครื่อง A'), h('div', null, `แก้ “ซื้อนม 2 ขวด” เวลา ${fmt(aEdit)}`), h('div', { class: 'dim' }, 'ออนไลน์ 10:30')),
        h('div', { class: 'cf2-d' + (winner === 'B' ? ' win' : '') }, h('b', null, '📱 เครื่อง B'), h('div', null, `แก้ “ซื้อนม 1 ขวด” เวลาจริง ${fmt(bEditTrue)} (นาฬิกาเครื่องบอก ${fmt(bEditClock)})`), h('div', { class: 'dim' }, 'ออนไลน์ 10:20'))),
        h('div', { class: 'vt-res ' + (winner === truthLatest ? 'ok' : 'bad') }, `ฉบับจริง: เครื่อง ${winner} — ` + (strategy === 'first' ? 'เครื่องที่ต่อเน็ตก่อนชนะ (ไม่สนว่าใครแก้ทีหลัง)' : (winner === truthLatest ? 'แก้ไขล่าสุดชนะ ✓' : 'นาฬิกาเครื่อง B เพี้ยน → ระบบคิดว่า A แก้ทีหลัง → การแก้ไขล่าสุดจริงหายไป'))));
    }
    body.append(h('div', { class: 'vctrl' }, seg([{ value: 'first', label: 'เครื่องที่ต่อเน็ตได้ก่อนชนะ' }, { value: 'latest', label: 'เครื่องที่แก้ไขล่าสุดชนะ' }], strategy, (v) => { strategy = v; run(); })),
      h('div', { class: 'btn-row', style: { marginBottom: '8px' } }, h('span', { class: 'dim', style: { fontSize: '.82rem' } }, 'นาฬิกาเครื่อง B เพี้ยน'), FR.ui.slider(0, (v) => { skew = v; skewV.textContent = v + ' นาที'; run(); }, { min: -15, max: 15 }), skewV), out,
      h('div', { class: 'vnote', html: md('ไม่มีคำตอบเดียวที่ถูก — นี่คือ **conflict resolution** (บทที่ 15 ใช้โครงสร้าง TaskProvider → DatabaseHelper)') }));
    run();
  });
})();
