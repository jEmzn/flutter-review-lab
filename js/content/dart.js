/* ส่วนเสริม — Dart syntax ที่ตำราใช้แต่ไม่ได้อธิบาย · ทุกข้อความ error ตรวจด้วย dart run / dart analyze (Flutter 3.47.6) */
(function () {
  FR.content.dart = {
    id: 'dart', kind: 'supp', num: 'D', navTitle: 'Dart syntax ที่ตำราใช้', crumb: 'Dart',
    title: 'Dart syntax ที่ตำราใช้แต่ไม่ได้อธิบาย',
    problem: 'โค้ดในตำราเต็มไปด้วย `value?.trim() ?? \'\'`, `_formKey.currentState!`, `late final`, `..`, `if (id != null) \'id\': id`, `on ApiException catch (e)` — หน้านี้อธิบายทีละตัวด้วย **การ์ดที่เลือกค่าแล้วเห็นผลทันที** และทุกข้อความ error ในการ์ดเป็นข้อความจริงจาก `dart run` / `dart analyze`',
    overview: [
      { t: 'compare', cols: ['กลุ่ม', 'ตัวอย่างในตำรา', 'ไปที่'], rows: [
        ['Null safety', '`value?.trim() ?? \'\'` · `currentState!` · `late` · `required`', '[[dart/d1]]'],
        ['ตัวแปร: final / const / var', '`final _formKey = GlobalKey<FormState>()` · `const Text(...)`', '[[dart/d2]]'],
        ['คลาสและ constructor', '`DatabaseHelper._privateConstructor()` · `factory Note.fromMap` · `{required this.title}` · `with ChangeNotifier`', '[[dart/d3]]'],
        ['Collection', '`if (id != null) \'id\': id` · `[..._items]` · `rows.map(Note.fromMap).toList()`', '[[dart/d4]]'],
        ['ฟังก์ชันและ callback', '`onPressed: _save` vs `_save()` · `..` cascade · `\'${user.name}\'`', '[[dart/d5]]'],
        ['async และ error', '`await` · `try / on X catch (e) / rethrow / finally` · `unawaited`', '[[dart/d6]]'],
        ['ชนิดข้อมูล', '`as num` · `.toDouble()` · `enum.name` / `values.byName`', '[[dart/d7]]'],
      ] },
    ],
    sections: [
      {
        id: 'd1', short: 'Null safety', tag: 'D1', supp: true,
        title: 'Null safety: ?  ?.  ??  ??=  !  late  required',
        gist: '`String?` = อาจเป็น null · `a?.b` = ถ้า a เป็น null ได้ null (ไม่เรียก b) · `x ?? y` = ถ้า x เป็น null ใช้ y · `x ??= y` = กำหนดเฉพาะเมื่อยังเป็น null · `x!` = “ยืนยันว่าไม่ null” (ผิดเมื่อไรพังทันที) · `late` = กำหนดค่าทีหลังแต่ก่อนใช้ · `required` = ต้องส่งชื่อนี้',
        blocks: [
          { t: 'viz', id: 'dart.play', title: '?. และ ?? (จาก validator / onSaved บทที่ 8)', props: {
            src: "String? value = {{v}};\nfinal name = value?.trim() ?? '';\nprint('[$name]');",
            inputs: [{ name: 'v', label: 'ค่าที่ได้จากช่องกรอก', options: [{ label: 'null', dart: 'null', value: null }, { label: "'  Ann  '", dart: "'  Ann  '", value: '  Ann  ' }, { label: "''", dart: "''", value: '' }] }],
            run: (v) => ({ out: [`[${v.v === null ? '' : v.v.trim()}]`], note: v.v === null ? '`value?.trim()` เห็นว่า value เป็น null จึง **ไม่เรียก trim** แล้วได้ null → `?? \'\'` ให้สตริงว่างแทน' : 'value ไม่ null → เรียก trim ตามปกติ · `??` ไม่ถูกใช้' }),
          } },
          { t: 'viz', id: 'dart.play', title: '! (null assertion) กับ GlobalKey ของ Form', props: {
            src: "final _formKey = GlobalKey<FormState>();\n// ใน build: Form({{attach}}, child: ...)\n\nvoid _submit() {\n  if (_formKey.currentState!.validate()) { ... }\n}",
            inputs: [{ name: 'attach', label: 'ส่ง key ให้ Form หรือยัง', options: [{ label: 'key: _formKey', dart: 'key: _formKey', value: true }, { label: 'ลืมใส่ key', dart: '/* ไม่มี key */', value: false }] }],
            run: (v) => v.attach ? { ok: '`currentState` เป็น FormState → validate() ทำงาน', note: '`!` ใช้ได้เพราะ “เรารู้” ว่าตอนกดปุ่ม Form ถูกสร้างแล้ว' } : { err: 'Null check operator used on a null value', kind: 'runtime', note: 'key ไม่ได้ผูกกับวิดเจ็ตใด → `currentState` เป็น null → `!` พังทันที ([[8.6]])' },
          } },
          { t: 'viz', id: 'dart.play', title: '??= : เปิดฐานข้อมูลครั้งเดียว (แนวเฉลยข้อ 3)', props: {
            src: "Future<Database>? _dbFuture;\nFuture<Database> get database {\n  {{op}}\n  return _dbFuture!;\n}\n\n// สองหน้าจอเรียกพร้อมกันตอนเปิดแอป\nfinal a = DatabaseHelper.instance.database;\nfinal b = DatabaseHelper.instance.database;",
            inputs: [{ name: 'op', label: 'บรรทัดกำหนดค่า', options: [{ label: '??=', dart: '_dbFuture ??= _open();', value: 'q' }, { label: '=', dart: '_dbFuture = _open();', value: 'eq' }] }],
            run: (v) => v.op === 'q' ? { out: ['_open() ถูกเรียก 1 ครั้ง', 'identical(a, b) == true'], note: 'ครั้งที่สอง `_dbFuture` ไม่ null แล้ว จึงไม่เรียก `_open()` ซ้ำ — ทั้งสองที่ได้ Future ตัวเดียวกัน ([[13.4]])' } : { out: ['_open() ถูกเรียก 2 ครั้ง', 'identical(a, b) == false'], note: 'เปิดไฟล์ซ้อนกัน onCreate อาจทำงานชนกัน — จุดที่ผู้สอบมักพลาดในข้อ 3' },
          } },
          { t: 'viz', id: 'dart.play', title: 'late final กับ controller', props: {
            src: "late final TextEditingController _c;\n\n@override\nvoid initState() {\n  super.initState();\n  {{init}}\n}\n\n// ใน build\nTextField(controller: _c)",
            inputs: [{ name: 'init', label: 'ใน initState', options: [{ label: 'กำหนดครั้งเดียว', dart: "_c = TextEditingController(text: widget.initial);", value: 1 }, { label: 'ลืมกำหนด', dart: '// (ไม่ได้กำหนด _c)', value: 0 }, { label: 'กำหนดสองครั้ง', dart: "_c = TextEditingController();\n  _c = TextEditingController(text: 'x');", value: 2 }] }],
            run: (v) => v.init === 1 ? { ok: 'ใช้ได้ — `late` ให้กำหนดใน initState (ซึ่งมี `widget` ใช้แล้ว) แทนตอนประกาศ' } : v.init === 0 ? { err: "LateInitializationError: Field '_c' has not been initialized.", kind: 'runtime' } : { err: "LateInitializationError: Field '_c' has already been initialized.", kind: 'runtime', note: '`final` = กำหนดได้ครั้งเดียว' },
          } },
          { t: 'why', choice: 'ใช้ `!` เฉพาะจุดที่ **พิสูจน์ได้** ว่าไม่ null และใช้ `?.` / `??` ในจุดที่ null เป็นเรื่องปกติ',
            because: ['`!` คือการบอกคอมไพเลอร์ว่า “เชื่อฉัน” — ถ้าผิด แอปพังตอนรัน', '`?.`/`??` จัดการ null เป็นส่วนหนึ่งของตรรกะ'],
            alts: [{ alt: 'ทำไมไม่ใส่ `!` ทุกที่ที่คอมไพเลอร์บ่น?', result: 'ย้ายปัญหาจากตอนคอมไพล์ (เห็นทันที) ไปเป็น crash ตอนรันในเครื่องผู้ใช้' }] },
        ],
        quiz: [
          { q: "`String? s; print(s?.length ?? -1);` พิมพ์อะไร?", options: [{ t: '-1', ok: true }, { t: 'null', why: '`??` แทนค่า null ด้วย -1' }, { t: 'Exception', why: '`?.` ไม่เรียก length เมื่อ s เป็น null' }] },
          { q: '`_formKey.currentState!.validate()` พังด้วย “Null check operator used on a null value” สาเหตุที่เป็นไปได้มากที่สุด?', options: [{ t: 'ไม่ได้ส่ง `key: _formKey` ให้ Form', ok: true }, { t: 'validator คืนข้อความ error', why: 'นั่นทำให้ validate() คืน false ไม่ใช่ crash' }, { t: 'ลืม setState', why: 'ไม่เกี่ยว' }] },
        ],
      },
      {
        id: 'd2', short: 'final/const', tag: 'D2', supp: true,
        title: 'var / final / const และ _private',
        gist: '`var` = เปลี่ยนตัวแปรได้ · `final` = **ตัวแปร** ชี้ที่เดิมตลอด (แต่ของข้างในเปลี่ยนได้) · `const` = **ค่าทั้งก้อน** รู้ตอนคอมไพล์และแก้ไม่ได้ · ชื่อขึ้นต้นด้วย `_` = private ต่อไฟล์ (library)',
        blocks: [
          { t: 'viz', id: 'dart.play', title: 'ประกาศแบบไหน ทำอะไรได้', props: {
            src: "{{decl}} list = [1, 2];\n{{act}}\nprint(list);",
            inputs: [
              { name: 'decl', label: 'ประกาศ', options: [{ label: 'var', dart: 'var', value: 'var' }, { label: 'final', dart: 'final', value: 'final' }, { label: 'const', dart: 'const', value: 'const' }] },
              { name: 'act', label: 'แล้ว', options: [{ label: 'list.add(3)', dart: 'list.add(3);', value: 'add' }, { label: 'list = []', dart: 'list = [];', value: 're' }] },
            ],
            run: (v) => {
              if (v.act === 'add') return v.decl === 'const' ? { err: 'Unsupported operation: Cannot add to an unmodifiable list', kind: 'runtime', note: 'const list แก้เนื้อในไม่ได้ (เหมือน `List.unmodifiable`)' } : { out: ['[1, 2, 3]'], note: v.decl === 'final' ? '`final` ห้ามเปลี่ยนว่าตัวแปรชี้ไปที่ไหน แต่ **แก้ของข้างใน list ได้**' : '' };
              if (v.decl === 'var') return { out: ['[]'] };
              return { err: v.decl === 'final' ? "The final variable 'list' can only be set once." : "Constant variables can't be assigned a value after initialization.", kind: 'compile' };
            },
          } },
          { t: 'compare', cols: ['', 'final', 'const'], rows: [
            ['กำหนดค่าเมื่อไร', 'ตอนรัน (ครั้งเดียว)', 'ตอนคอมไพล์'],
            ['ตัวอย่าง', '`final _formKey = GlobalKey<FormState>();` · `final DateTime now = DateTime.now();`', "`const Text('บันทึก')` · `static const _dbName = 'expenses.db';`"],
            ['แก้ของข้างใน', 'ได้ (ถ้าเป็น List/Map ธรรมดา)', 'ไม่ได้'],
            ['ประโยชน์ใน Flutter', 'ฟิลด์ของ Widget ต้อง final (Widget immutable)', 'วิดเจ็ต const ไม่ถูก build ซ้ำ ([[core/c4]])'],
          ] },
          { t: 'callout', kind: 'note', title: '_ (underscore) = private ต่อไฟล์', body: '`_counter`, `_formKey`, `_MyHomePageState`, `DatabaseHelper._privateConstructor()` — ไฟล์อื่นอ้างถึงไม่ได้ · Provider จึงเก็บ `_items` เป็น private แล้วเปิดเฉพาะ getter ([[lab11]])' },
        ],
        quiz: [
          { q: '`final items = <String>[]; items.add(\'a\');` ผลคือ?', options: [{ t: 'ทำได้ — final ห้ามแค่ชี้ตัวแปรไปที่อื่น', ok: true }, { t: 'compile error', why: 'add ไม่ได้เปลี่ยนตัวแปร' }, { t: 'runtime error', why: 'list ธรรมดาแก้ได้' }] },
        ],
      },
      {
        id: 'd3', short: 'คลาส', tag: 'D3', supp: true,
        title: 'คลาสและ constructor ที่ตำราใช้',
        gist: '`{required this.title}` = พารามิเตอร์แบบมีชื่อ บังคับส่ง และกำหนดฟิลด์ให้เลย · `super.key` = ส่ง key ต่อให้คลาสแม่ · `ClassName._private()` = constructor ส่วนตัว (ใช้ทำ Singleton) · `factory` = constructor ที่ “คืน” อ็อบเจกต์เอง (fromMap / fromJson) · `with ChangeNotifier` = ผสมความสามารถ (mixin)',
        blocks: [
          { t: 'code', title: 'ทุกแบบในไฟล์เดียว', src: `class Note {
  final int? id;
  final String title;
  const Note({this.id, required this.title});        // named + required + this.x

  factory Note.fromMap(Map<String, Object?> map) {   // factory: สร้างจาก Map แล้วคืน Note
    return Note(id: map['id'] as int, title: map['title'] as String);
  }
}

class DatabaseHelper {
  DatabaseHelper._privateConstructor();               // ไฟล์อื่น new ไม่ได้
  static final DatabaseHelper instance = DatabaseHelper._privateConstructor();
}

class CartProvider with ChangeNotifier {              // mixin: ได้ addListener/notifyListeners
  final List<String> _items = [];
}

class CounterDisplay extends StatelessWidget {
  const CounterDisplay({super.key, required this.count}); // super.key ส่ง key ให้ Widget
  final int count;
  @override
  Widget build(BuildContext context) => Text('$count');
}`, notes: [
            { at: 'const Note({this.id, required this.title});', note: '`{}` = named parameters (เรียกด้วยชื่อ `Note(title: \'x\')`) · ไม่ใส่ required ต้องเป็นชนิดที่ null ได้ (`this.id` เป็น `int?`)' },
            { at: 'factory Note.fromMap(Map<String, Object?> map) {', note: 'factory ไม่ต้องสร้างอ็อบเจกต์ใหม่เสมอไป (อาจคืนตัวที่แคชไว้) และมีตรรกะก่อนสร้างได้' },
            { at: 'DatabaseHelper._privateConstructor();', note: 'ไม่มี constructor แบบไม่มีชื่อ → `DatabaseHelper()` ใช้ไม่ได้ ต้องผ่าน `instance`' },
            { at: 'class CartProvider with ChangeNotifier {', note: 'ตำราใช้ทั้ง `extends ChangeNotifier` และ `with ChangeNotifier` — ผลเหมือนกันเมื่อไม่ได้สืบทอดคลาสอื่น' },
          ] },
          { t: 'viz', id: 'dart.play', title: 'เรียก constructor ผิดแบบ', props: {
            src: '{{call}}',
            inputs: [{ name: 'call', label: 'โค้ด', options: [
              { label: 'DatabaseHelper.instance', dart: 'final db1 = DatabaseHelper.instance;\nfinal db2 = DatabaseHelper.instance;\nprint(identical(db1, db2));', value: 'ok' },
              { label: 'DatabaseHelper()', dart: 'final db = DatabaseHelper();', value: 'new' },
              { label: 'Note() ไม่ส่ง title', dart: 'final n = Note(id: 1);', value: 'req' },
            ] }],
            run: (v) => v.call === 'ok' ? { out: ['true'], note: 'ตัวเดียวกันทั้งแอป (Singleton)' } : v.call === 'new' ? { err: "The class 'DatabaseHelper' doesn't have an unnamed constructor.", kind: 'compile' } : { err: "The named parameter 'title' is required, but there's no corresponding argument.", kind: 'compile', note: '`required` จับข้อผิดพลาดได้ตั้งแต่คอมไพล์ — ส่งข้อมูลผ่าน constructor ของหน้าจอ ([[9.4]]) จึงปลอดภัย' },
          } },
        ],
        quiz: [
          { q: 'ทำไม `factory Note.fromMap(...)` ใช้ factory?', options: [{ t: 'ต้องอ่าน/แปลงค่าจาก Map ก่อนแล้วคืน Note ที่สร้างเสร็จ', ok: true }, { t: 'เพื่อให้เป็น Singleton', why: 'Singleton ใช้ private constructor + static instance' }, { t: 'เพราะ Dart บังคับ', why: 'ไม่บังคับ' }] },
        ],
      },
      {
        id: 'd4', short: 'Collection', tag: 'D4', supp: true,
        title: 'Collection: if ใน literal, spread, map().toList()',
        gist: "`{ if (id != null) 'id': id, ... }` = ใส่คีย์เฉพาะเมื่อเงื่อนไขจริง · `[ ...a, x ]` = กางสมาชิกของ a ลงไป (`[..._items]` = สำเนาใหม่) · `rows.map(f)` ได้ **Iterable** (ขี้เกียจ) ต้อง `.toList()` ถึงเป็น List · `<String>[]` = ระบุชนิดสมาชิก (generics)",
        blocks: [
          { t: 'viz', id: 'dart.play', title: 'collection-if ใน toMap (13.7)', props: {
            src: "final note = Note(id: {{id}}, title: 'ซื้อนม');\nfinal map = {\n  if (note.id != null) 'id': note.id,\n  'title': note.title,\n};\nprint(map);",
            inputs: [{ name: 'id', label: 'id', options: [{ label: 'null (ยังไม่เคยบันทึก)', dart: 'null', value: null }, { label: '7 (มาจากฐานข้อมูล)', dart: '7', value: 7 }] }],
            run: (v) => ({ out: [v.id == null ? '{title: ซื้อนม}' : `{id: ${v.id}, title: ซื้อนม}`], note: v.id == null ? 'ไม่มีคีย์ id เลย → insert ให้ SQLite สร้าง id เอง' : 'มี id → update ใช้ได้โดยไม่ตั้ง id เป็น NULL' }),
          } },
          { t: 'viz', id: 'dart.play', title: 'getter: คืนตัวจริง vs สำเนา (lab บทที่ 11)', props: {
            src: "final List<String> _items = ['ชา'];\n{{getter}}\n\n// หน้าจอทำแบบนี้ (ไม่ผ่าน addItem)\nprovider.items.add('กาแฟ');\nprint(provider._items);",
            inputs: [{ name: 'getter', label: 'getter', options: [
              { label: '=> _items', dart: 'List<String> get items => _items;', value: 'raw' },
              { label: '=> [..._items]', dart: 'List<String> get items => [..._items];', value: 'copy' },
              { label: 'List.unmodifiable', dart: 'List<String> get items => List.unmodifiable(_items);', value: 'unmod' },
            ] }],
            run: (v) => v.getter === 'raw' ? { out: ['[ชา, กาแฟ]'], note: '⚠ ข้อมูลภายในถูกแก้จากข้างนอก **โดยไม่มี notifyListeners** → จอไม่อัปเดต' } : v.getter === 'copy' ? { out: ['[ชา]'], note: 'หน้าจอแก้แค่สำเนา ของจริงปลอดภัย (แต่การแก้นั้นเงียบหายไป)' } : { err: 'Unsupported operation: Cannot add to an unmodifiable list', kind: 'runtime', note: 'พังทันทีให้เห็นตอนพัฒนา — ชัดที่สุดว่า “ห้ามแก้ตรงนี้”' },
          } },
          { t: 'viz', id: 'dart.play', title: 'map() ต้องตามด้วย toList()', props: {
            src: "final rows = await db.query('notes');\n{{line}}",
            inputs: [{ name: 'line', label: 'แปลงแถว', options: [
              { label: '.toList()', dart: 'List<Note> notes = rows.map(Note.fromMap).toList();', value: 'ok' },
              { label: 'ลืม .toList()', dart: 'List<Note> notes = rows.map(Note.fromMap);', value: 'it' },
            ] }],
            run: (v) => v.line === 'ok' ? { ok: 'ได้ `List<Note>`' } : { err: "A value of type 'Iterable<Note>' can't be assigned to a variable of type 'List<Note>'.", kind: 'compile', note: '`map` คืน Iterable ที่ “ยังไม่คำนวณ” จนกว่าจะวนอ่าน — `toList()` สร้าง List จริง' },
          } },
        ],
        quiz: [
          { q: "`[...a, 4]` เมื่อ `a = [1, 2]` ได้อะไร?", options: [{ t: '[1, 2, 4] (list ใหม่)', ok: true }, { t: '[[1, 2], 4]', why: '`...` กางสมาชิกออก' }, { t: 'แก้ a ให้เป็น [1, 2, 4]', why: 'สร้าง list ใหม่ a ไม่เปลี่ยน' }] },
        ],
      },
      {
        id: 'd5', short: 'ฟังก์ชัน', tag: 'D5', supp: true,
        title: 'ฟังก์ชัน: => , tear-off vs เรียก, cascade .. , string interpolation',
        gist: '`=> expr` = ฟังก์ชันที่คืน expr · `onPressed: _save` = **ส่งตัวฟังก์ชัน** (tear-off) · `onPressed: _save()` = **เรียกทันที** แล้วส่งผลลัพธ์ (ผิด) · `onPressed: () => _save()` = ฟังก์ชันใหม่ที่เรียก _save เมื่อถูกกด · `a..m1()..m2()` = เรียกหลายเมธอดบน a แล้วคืน **a** · `\'$x\'`, `\'${obj.field}\'`',
        blocks: [
          { t: 'viz', id: 'dart.play', title: 'ส่งฟังก์ชันให้ปุ่ม', props: {
            src: 'void _save() { print(\'บันทึก\'); }\n\nElevatedButton(\n  onPressed: {{cb}},\n  child: const Text(\'บันทึก\'),\n)',
            inputs: [{ name: 'cb', label: 'onPressed', options: [
              { label: '_save', dart: '_save', value: 'tear' },
              { label: '() => _save()', dart: '() => _save()', value: 'lambda' },
              { label: '_save()', dart: '_save()', value: 'call' },
              { label: '() => _save', dart: '() => _save', value: 'noop' },
              { label: 'null', dart: 'null', value: 'null' },
            ] }],
            run: (v) => ({
              tear: { out: ['(กดปุ่ม) บันทึก'], note: 'ส่ง “ตัวฟังก์ชัน” ให้ปุ่มเก็บไว้เรียกตอนถูกกด' },
              lambda: { out: ['(กดปุ่ม) บันทึก'], note: 'สร้างฟังก์ชันใหม่ที่ข้างในเรียก `_save()` — ใช้เมื่อต้องส่งอาร์กิวเมนต์ เช่น `() => _delete(note.id)`' },
              call: { err: "This expression has a type of 'void' so its value can't be used.", kind: 'compile', note: '`_save()` ถูก **เรียกตอน build** แล้วเอาค่าคืน (void) ไปให้ onPressed' },
              noop: { out: ['(กดปุ่ม) …ไม่มีอะไรเกิดขึ้น'], note: 'คอมไพล์ผ่าน แต่ฟังก์ชันนี้แค่ “คืน” `_save` ออกมา ไม่ได้เรียก — บั๊กเงียบ' },
              null: { out: ['ปุ่มเป็นสีเทา กดไม่ได้'], note: '`onPressed: null` = ปิดปุ่ม (ใช้กันกดซ้ำ: `onPressed: _saving ? null : _save`)' },
            })[v.cb],
          } },
          { t: 'viz', id: 'dart.play', title: 'cascade .. (บทที่ 9 และ 11)', props: {
            src: "ScaffoldMessenger.of(context)\n  {{op}}removeCurrentSnackBar()\n  {{op}}showSnackBar(const SnackBar(content: Text('บันทึกแล้ว')));",
            inputs: [{ name: 'op', label: 'ตัวเชื่อม', options: [{ label: '..', dart: '..', value: 'c' }, { label: '.', dart: '.', value: 'd' }] }],
            run: (v) => v.op === 'c' ? { ok: 'ทั้งสองเมธอดถูกเรียกบน ScaffoldMessengerState ตัวเดียวกัน', note: '`..` คืน **อ็อบเจกต์ตั้งต้น** ไม่ใช่ค่าที่เมธอดคืน — ใช้กับ `(previous ?? CartProvider())..setUser(id)` ใน ProxyProvider ([[11.8]]) ด้วย' } : { err: "This expression has a type of 'void' so its value can't be used.", kind: 'compile', note: '`removeCurrentSnackBar()` คืน void → เรียก `.showSnackBar` ต่อบน void ไม่ได้' },
          } },
          { t: 'viz', id: 'dart.play', title: 'string interpolation', props: {
            src: "final user = User('Ann');\nprint({{s}});",
            inputs: [{ name: 's', label: 'เขียน', options: [{ label: "'$user.name'", dart: "'Hi $user.name'", value: 1 }, { label: "'${user.name}'", dart: "'Hi ${user.name}'", value: 2 }] }],
            run: (v) => v.s === 1 ? { out: ["Hi Instance of 'User'.name"], note: '`$` กินแค่ชื่อตัวแปร `user` แล้วต่อด้วยข้อความ “.name”' } : { out: ['Hi Ann'], note: 'นิพจน์ที่มี `.` ต้องอยู่ใน `${...}`' },
          } },
        ],
        quiz: [
          { q: 'ปุ่มลบในลิสต์ต้องลบรายการ `note.id` ข้อใดถูก?', options: [{ t: '`onPressed: () => _delete(note.id)`', ok: true }, { t: '`onPressed: _delete(note.id)`', why: 'เรียกทันทีตอน build' }, { t: '`onPressed: _delete`', why: 'onPressed ไม่ส่ง id ให้' }] },
        ],
      },
      {
        id: 'd6', short: 'async/error', tag: 'D6', supp: true,
        title: 'async / await และ try / on / catch / rethrow / finally',
        gist: '`Future<T>` = ค่าที่จะมาทีหลัง · `await` = รอผลโดย **ไม่บล็อก UI** (ใช้ได้ในฟังก์ชัน `async`) · ลืม `await` = โค้ดถัดไปทำต่อทันที และ error หลุดไม่ถูกจับ · `on X catch (e)` = จับเฉพาะชนิด X · `catch (e)` = จับทุกอย่าง · `rethrow` = โยนต่อ · `finally` = ทำเสมอ',
        blocks: [
          { t: 'viz', id: 'dart.play', title: 'ลืม await ก่อน pop', props: {
            src: "Future<void> _save() async {\n  print('1 เริ่มบันทึก');\n  {{call}}\n  print('3 กลับหน้าก่อน');\n  if (!mounted) return;\n  Navigator.pop(context);\n}\n// addTransaction พิมพ์ '2 insert เสร็จ' เมื่อ DB ทำงานเสร็จ",
            inputs: [{ name: 'call', label: 'บรรทัดบันทึก', options: [{ label: 'await', dart: 'await provider.addTransaction(t);', value: 'a' }, { label: 'ไม่มี await', dart: 'provider.addTransaction(t);', value: 'n' }] }],
            run: (v) => v.call === 'a' ? { out: ['1 เริ่มบันทึก', '2 insert เสร็จ', '3 กลับหน้าก่อน'], note: 'pop หลังบันทึกเสร็จจริง และถ้า insert โยน error จะถูกจับได้ด้วย try/catch รอบ await' } : { out: ['1 เริ่มบันทึก', '3 กลับหน้าก่อน', '2 insert เสร็จ'], note: '⚠ กลับหน้าก่อนบันทึกเสร็จ (รายการใหม่อาจยังไม่ขึ้น) และถ้า insert ล้มเหลว error จะหลุดเป็น “Unhandled Exception” ที่ไม่มีใครแสดงให้ผู้ใช้เห็น · linter `unawaited_futures` เตือนเรื่องนี้' },
          } },
          { t: 'viz', id: 'dart.play', title: 'try / on / catch / finally (รูปแบบของบทที่ 12)', props: {
            src: "_isLoading = true;\ntry {\n  _todos = await fetchTodos();   // {{thr}}\n  _error = null;\n} on ApiException catch (e) {\n  _error = e.message;\n} catch (e) {\n  _error = 'เกิดข้อผิดพลาดที่ไม่คาดคิด';\n} finally {\n  _isLoading = false;\n  notifyListeners();\n}",
            inputs: [{ name: 'thr', label: 'fetchTodos', options: [
              { label: 'สำเร็จ', dart: 'สำเร็จ', value: 'ok' },
              { label: "throw ApiException('ไม่มีอินเทอร์เน็ต')", dart: "throw ApiException('ไม่มีอินเทอร์เน็ต')", value: 'api' },
              { label: 'throw FormatException', dart: 'throw FormatException()', value: 'fmt' },
            ] }],
            run: (v) => ({ out: v.thr === 'ok' ? ['_todos = [200 รายการ]', '_error = null', 'finally: _isLoading = false → notify'] : v.thr === 'api' ? ["on ApiException → _error = 'ไม่มีอินเทอร์เน็ต'", 'finally: _isLoading = false → notify'] : ["catch (e) → _error = 'เกิดข้อผิดพลาดที่ไม่คาดคิด'", 'finally: _isLoading = false → notify'], note: '`finally` ทำทุกกรณี — วงล้อหมุนจึงไม่ค้างแม้เกิด error · `on` ตัวแรกที่ตรงชนิดได้ทำงาน ตัวต่อไปถูกข้าม' }),
          } },
          { t: 'code', title: 'rethrow: จับเฉพาะที่รู้วิธีจัดการ (แนวเฉลยข้อ 3)', src: `try {
  await db.insert('groups', {'name': name});
} on DatabaseException catch (e) {
  if (e.isUniqueConstraintError()) throw const DuplicateGroupException();
  rethrow; // ไม่ใช่เรื่องชื่อซ้ำ → โยนต่อพร้อม stack trace เดิม
}`, notes: [{ at: 'rethrow;', note: '`rethrow` เก็บ stack trace เดิมไว้ (ต่างจาก `throw e`) — ดีบักได้ว่าพังที่ไหนจริง' }] },
          { t: 'callout', kind: 'note', title: 'unawaited (ex_13)', body: '`unawaited(fetchAndSetTransactions())` = “ตั้งใจไม่รอ” (จาก `dart:async`) ใช้ใน constructor ของ Provider ซึ่งเป็น async ไม่ได้ — บอกผู้อ่านโค้ดและ linter ว่าไม่ได้ลืม await · ควรต่อ `.catchError(...)` เพื่อไม่ให้ error หลุด' },
        ],
        quiz: [
          { q: 'ใน `try { … } on ApiException catch (e) { … } catch (e) { … } finally { … }` ถ้าเกิด `ApiException` บล็อกใดทำงาน?', options: [{ t: 'on ApiException แล้ว finally', ok: true }, { t: 'on ApiException, catch (e) แล้ว finally', why: 'จับได้แล้วตัวถัดไปถูกข้าม' }, { t: 'catch (e) เท่านั้น', why: 'on ที่ตรงชนิดมาก่อน' }] },
        ],
      },
      {
        id: 'd7', short: 'ชนิดข้อมูล', tag: 'D7', supp: true,
        title: 'ชนิดข้อมูล: as, num, enum.name / byName',
        gist: '`x as T` = ยืนยันชนิด (ผิด = พังตอนรัน) · ตัวเลขจาก DB/JSON อาจเป็น int หรือ double → อ่านเป็น **`num`** แล้ว `.toDouble()` · `int` กับ `double` เป็นลูกของ `num` แต่ไม่ใช่กันและกัน · `TransactionType.expense.name` = `\'expense\'` · `TransactionType.values.byName(\'expense\')` กลับเป็น enum (ตัวพิมพ์ต้องตรง)',
        blocks: [
          { t: 'viz', id: 'dart.play', title: 'อ่าน amount จาก Map', props: {
            src: "final map = {'amount': {{stored}}};\nfinal amount = {{read}};\nprint(amount);",
            inputs: [
              { name: 'stored', label: 'ค่าใน Map', options: [{ label: '50 (int)', dart: '50', value: 50 }, { label: '50.5 (double)', dart: '50.5', value: 50.5 }, { label: 'null', dart: 'null', value: null }] },
              { name: 'read', label: 'อ่านด้วย', options: [{ label: 'as double', dart: "map['amount'] as double", value: 'd' }, { label: '(as num).toDouble()', dart: "(map['amount'] as num).toDouble()", value: 'n' }, { label: "(as num?)?.toDouble() ?? 0", dart: "(map['amount'] as num?)?.toDouble() ?? 0", value: 'nn' }] },
            ],
            run: (v) => {
              const x = v.stored;
              const dbl = (n) => (Number.isInteger(n) ? n.toFixed(1) : String(n));
              if (v.read === 'd') return x === 50.5 ? { out: ['50.5'] } : { err: `type '${x === null ? 'Null' : 'int'}' is not a subtype of type 'double' in type cast`, kind: 'runtime', note: x === 50 ? 'SQLite/JSON ส่งจำนวนเต็มมาเป็น int ได้ แม้คอลัมน์เป็น REAL' : '' };
              if (v.read === 'n') return x === null ? { err: "type 'Null' is not a subtype of type 'num' in type cast", kind: 'runtime', note: 'ค่าอาจเป็น null (SUM ของชุดว่าง, คีย์ JSON ที่ไม่มี) → ใช้ COALESCE ใน SQL หรือ `as num?`' } : { out: [dbl(x)] };
              return { out: [x === null ? '0' : dbl(x)] };
            },
          } },
          { t: 'viz', id: 'dart.play', title: 'enum ⇄ String', props: {
            src: "enum TransactionType { income, expense }\n\nprint({{e}});",
            inputs: [{ name: 'e', label: 'โค้ด', options: [
              { label: '.name', dart: 'TransactionType.expense.name', value: 'name' },
              { label: ".byName('expense')", dart: "TransactionType.values.byName('expense')", value: 'by' },
              { label: ".byName('Expense')", dart: "TransactionType.values.byName('Expense')", value: 'bad' },
              { label: '.index', dart: 'TransactionType.expense.index', value: 'idx' },
            ] }],
            run: (v) => ({ name: { out: ['expense'] }, by: { out: ['TransactionType.expense'] }, bad: { err: 'Invalid argument (name): No enum value with that name: "Expense"', kind: 'runtime', note: 'ตัวพิมพ์ต้องตรงกับชื่อที่ประกาศ' }, idx: { out: ['1'], note: 'ได้ลำดับ — อย่าเก็บลงฐานข้อมูล เพิ่มค่ากลาง enum แล้วข้อมูลเดิมชี้ผิด ([[13.7]])' } })[v.e],
          } },
        ],
        quiz: [
          { q: "`final x = map['price'] as double;` เมื่อค่าใน Map เป็น `25` (int) ผลคือ?", options: [{ t: "Exception: type 'int' is not a subtype of type 'double' in type cast", ok: true }, { t: 'ได้ 25.0', why: 'as ไม่แปลงชนิด แค่ตรวจ' }, { t: 'ได้ 25', why: 'ไม่ผ่านการตรวจชนิด' }] },
        ],
      },
    ],
    rules: [
      '`a?.b` หยุดเมื่อ a เป็น null · `x ?? y` ค่าแทน null · `x ??= y` กำหนดครั้งแรกเท่านั้น',
      '`!` เฉพาะที่พิสูจน์ได้ว่าไม่ null — ผิดเมื่อไรได้ “Null check operator used on a null value”',
      '`late final` กำหนดใน initState ได้ครั้งเดียว · ลืมกำหนด = LateInitializationError',
      '`final` ห้ามเปลี่ยนตัวแปร (ของข้างในแก้ได้) · `const` ค่าคงที่ทั้งก้อน',
      "collection-if: `if (id != null) 'id': id` · spread: `[..._items]` · `map(...).toList()`",
      '`onPressed: _save` หรือ `() => _save(x)` — ไม่ใช่ `_save()`',
      '`..` คืนอ็อบเจกต์ตั้งต้น · `${obj.field}` ต้องมีปีกกา',
      'ทุก Future ที่ผลมีความหมายต้อง `await` · `finally` ทำเสมอ · `rethrow` ส่งต่อ error ที่ไม่ได้จัดการ',
      "ตัวเลขจาก DB/JSON: `(x as num).toDouble()` · enum: `.name` / `values.byName()`",
    ],
  };
})();
