/* Walkthrough — ex_13 (แลปบทที่ 13 ที่ทำการบ้านเสร็จแล้ว) · annotation ผูกกับ "ข้อความในบรรทัด" ของซอร์สจริง */
(function () {
  const P = 'ex13/lib/providers/transaction_provider.dart';
  const M = 'ex13/lib/models/my_transaction.dart';
  const LS = 'ex13/lib/screens/transaction_list_screen.dart';
  const AE = 'ex13/lib/screens/add_edit_transaction_screen.dart';
  const MAIN = 'ex13/lib/main.dart';
  const T2 = 'ex13/test/add_edit_transaction_screen_test.dart';

  const SPEC = {
    id: 'walk-ex13', title: 'Walkthrough: ex_13 — แอปบัญชีรายรับ-รายจ่าย', source: 'ex_13/',
    lede: 'อ่านโค้ดจริงทั้งโปรเจกต์ (สร้างจากไฟล์ในเครื่องด้วย `tools/gen-sources.mjs`) — คลิกบรรทัดที่มีจุด ● เพื่ออ่านคำอธิบาย หรือเลือก **ไล่ตาม action** เพื่อกระโดดข้ามไฟล์ตามลำดับที่โค้ดทำงานจริง',
    intro: [
      { t: 'callout', kind: 'note', title: 'ex_13 ต่างจากแลปในตำราตรงไหน', body: [
        { t: 'list', items: [
          'มีหน้า `AddEditTransactionScreen` (การบ้านของแลป) และคอลัมน์ `note` ที่เพิ่มด้วย **version 2 + onUpgrade** (ความท้าทายข้อ 1)',
          'เปิด DB ด้วย `Future<Database>? _databaseFuture` + `??=` แทน `Database? _database` (ปิดช่อง race — [[13.4]])',
          'มีสถานะ `_isLoading` / `_errorMessage` (บทที่ 12) และ `rethrow` ให้หน้าจอแจ้งผู้ใช้ได้',
          'มีเทสต์ที่ใช้ `FakeTransactionProvider` — ทดสอบฟอร์มโดยไม่แตะฐานข้อมูลจริง (คำตอบส่วนหนึ่งของคำถาม 13.12)',
        ] },
      ] },
    ],
    files: [
      { key: 'ex13/pubspec.yaml', role: 'dependencies', refs: ['13.3'], summary: 'sqflite + path + provider + intl (จัดรูปแบบวันที่) — ไม่ใช้ path_provider เพราะใช้ `getDatabasesPath()`',
        notes: [{ at: 'sqflite:', note: 'API ฐานข้อมูล ([[13.3]]) · รันได้บน Android/iOS/macOS เท่านั้น' }, { at: 'intl:', note: '`DateFormat(\'dd/MM/yyyy\')` ในหน้ารายการและฟอร์ม' }] },
      { key: MAIN, role: 'จุดเริ่มแอป: วาง Provider เหนือ MaterialApp', refs: ['10.3', 'core/c2'], summary: 'Provider อยู่เหนือ MaterialApp → ทุก route ที่ Navigator สร้างหา provider เจอ',
        notes: [
          { at: 'ChangeNotifierProvider(', note: 'ถือ TransactionProvider ตัวเดียวทั้งแอป และ **dispose ให้อัตโนมัติ** เมื่อถูกถอดออกจากต้นไม้ ([[10.3]])' },
          { at: 'create: (_) => TransactionProvider(),', note: '`lazy` เป็นค่าเริ่มต้น → provider ถูกสร้าง **ตอนมีคนอ่านครั้งแรก** (Consumer ของหน้ารายการ) ไม่ใช่ตอน runApp' },
          { at: 'home: const TransactionListScreen(),', note: 'หน้าแรกของ Navigator — `const` เพราะไม่มีพารามิเตอร์' },
        ] },
      { key: M, role: 'Model: Dart ⇄ แถว SQLite', refs: ['13.7', 'dart/d4'], summary: 'ตัวอย่างครบชุดของตารางแปลงชนิด: `int?` id, double ผ่าน num, DateTime → ISO, enum → `.name`, คอลัมน์ใหม่แบบ nullable',
        notes: [
          { at: 'enum TransactionType { income, expense }', note: 'เก็บลง DB ด้วย `.name` (ไม่ใช่ `.index`) ([[13.7]])' },
          { at: 'final int? id;', note: 'null = ยังไม่เคยบันทึก · SQLite เป็นผู้กำหนด' },
          { at: 'final String? note;', note: 'คอลัมน์ที่เพิ่มใน version 2 → แถวเก่าเป็น NULL จึงต้องเป็น `String?`' },
          { at: "if (id != null) 'id': id,", note: 'collection-if — toMap ตัวเดียวใช้ได้ทั้ง insert และ update ([[dart/d4]])' },
          { at: "'date': date.toIso8601String(),", note: 'เรียงแบบตัวอักษรได้ถูกลำดับเวลา ([[sql/order]])' },
          { at: "amount: (map['amount'] as num).toDouble(),", note: 'รับได้ทั้ง int และ double — เทสต์ `database rows restore integer amounts` ตรวจข้อนี้' },
          { at: "type: TransactionType.values.byName(map['type'] as String),", note: 'สตริงต้องตรงกับชื่อใน enum ทุกตัวอักษร' },
          { at: "note: map['note'] as String?,", note: '`as String?` เพราะแถวเก่าก่อน v2 เป็น NULL' },
        ] },
      { key: P, role: 'Provider: ถือ state + คุยกับ SQLite', refs: ['lab13', '13.4', '13.8', '12.8'], tag: 'แกน',
        summary: 'ทุกเมธอดเขียน: **เปิด DB → คำสั่งเดียว → `fetchAndSetTransactions()`** ซึ่งอ่านใหม่จาก DB แล้ว notify — ข้อมูลในหน่วยความจำจึงตรงกับไฟล์เสมอ',
        notes: [
          { at: 'static const _databaseVersion = 2;', note: 'v1 = แลปตำรา · v2 = เพิ่มคอลัมน์ note (ความท้าทายข้อ 1) ([[13.8]])' },
          { at: 'Future<Database>? _databaseFuture;', note: 'เก็บ **Future** ของการเปิด ไม่ใช่ Database — สองที่เรียกพร้อมกันได้ Future ตัวเดียว ([[13.4]])' },
          { at: 'unawaited(fetchAndSetTransactions().catchError((Object _) {}));', note: 'constructor เป็น async ไม่ได้ จึงสั่งโหลดแบบ “ตั้งใจไม่รอ” · `catchError` กลืน error ที่ rethrow มา เพราะสถานะผิดพลาดถูกเก็บใน `_errorMessage` แล้ว ([[dart/d6]])' },
          { at: 'List<MyTransaction> get transactions => List.unmodifiable(_transactions);', note: 'หน้าจอแก้ลิสต์ตรงๆ ไม่ได้ (พังทันทีถ้าลอง) ([[lab11]])' },
          { at: "'note TEXT)',", note: 'onCreate สร้างโครงสร้าง **ล่าสุด** (มี note) — ผู้ใช้ใหม่ไม่ต้องไล่ onUpgrade' },
          { at: 'if (oldVersion < 2) {', note: '`<` ไม่ใช่ `==` · ADD COLUMN แบบ nullable จึงไม่ต้องมี DEFAULT ([[13.8]])' },
          { at: 'final future = _databaseFuture ??= _openDatabase();', note: '`??=` เรียก `_openDatabase()` เฉพาะครั้งแรก ([[dart/d1]])' },
          { at: 'if (identical(_databaseFuture, future)) _databaseFuture = null;', note: 'ถ้าเปิดไม่สำเร็จ ล้าง Future ที่ล้มทิ้ง → ครั้งหน้า (ปุ่มลองอีกครั้ง) จะลองเปิดใหม่ แทนที่จะได้ error เดิมตลอด' },
          { at: "final rows = await db.query(_tableName, orderBy: 'date DESC, id DESC');", note: 'มี `id DESC` ตัดสินเมื่อวันที่เท่ากัน ([[sql/order]])' },
          { at: "_errorMessage = 'โหลดรายการไม่สำเร็จ: $error';", note: '**จุดที่ปรับได้**: ต่อข้อความ exception ดิบให้ผู้ใช้อ่าน (เช่น `DatabaseException(...)`) — ดู [[bughunt]]' },
          { at: '} finally {', note: '`finally` ปิดสถานะโหลดเสมอ แม้ error — วงล้อไม่ค้าง' },
          { at: "final values = newTransaction.toMap()..remove('id');", note: 'กันการเขียนทับคีย์หลัก แม้ object ที่ส่งมาจะมี id · `..remove` คืน Map ตัวเดิม ([[dart/d5]])' },
          { at: "await db.delete(_tableName, where: 'id = ?', whereArgs: [id]);", note: 'มี where + whereArgs ([[13.6]])' },
        ] },
      { key: LS, role: 'หน้ารายการ: Consumer + ListView + ลบ', refs: ['11.2', '9.4', 'core/c5'],
        summary: '`StatelessWidget` + `Consumer` ห่อเฉพาะ body (AppBar/FAB ไม่ build ใหม่เมื่อข้อมูลเปลี่ยน) · เลือกแสดงตามสถานะ: โหลด / ผิดพลาด / ว่าง / รายการ',
        notes: [
          { at: 'body: Consumer<TransactionProvider>(', note: 'ตีกรอบการ rebuild ไว้ที่ body ([[11.2]])' },
          { at: 'if (provider.isLoading && provider.transactions.isEmpty) {', note: 'วงล้อเต็มหน้า **เฉพาะตอนยังไม่มีข้อมูล** — ตอนรีเฟรชหลังเพิ่ม/ลบ รายการเดิมยังแสดงอยู่' },
          { at: 'if (provider.errorMessage != null) {', note: '**จุดที่ปรับได้**: เช็ก error ก่อนเช็กว่ามีรายการ → ถ้ารีเฟรชล้มทั้งที่มีรายการเดิมอยู่ ทั้งหน้าถูกแทนด้วยข้อความ error (เทียบ 4 สถานะใน [[13.10]])' },
          { at: "return const Center(child: Text('ไม่มีรายการ'));", note: 'สถานะว่าง (เช็กลิสต์ UI ของข้อสอบ)' },
          { at: 'onTap: () => Navigator.of(context).push(', note: 'แตะเพื่อแก้: ส่ง transaction ไปทาง constructor ([[9.4]])' },
          { at: "onPressed: () => _delete(context, transaction),", note: 'lambda เพราะต้องส่งอาร์กิวเมนต์ ([[dart/d5]])' },
          { at: 'if (!context.mounted) return;', note: 'StatelessWidget ไม่มี `mounted` → ใช้ `context.mounted` หลัง await ([[core/c5]])' },
        ] },
      { key: AE, role: 'ฟอร์มเพิ่ม/แก้ไข (การบ้านของแลป)', refs: ['8.6', '8.7', '8.3', '9.4', '12.2'], tag: 'การบ้าน',
        summary: 'ฟอร์มเดียวใช้ทั้งเพิ่มและแก้ (`transaction == null` = เพิ่ม) · controller + validator + กันกดซ้ำ + เช็ก mounted หลัง await',
        notes: [
          { at: 'final MyTransaction? transaction;', note: 'null = โหมดเพิ่ม · มีค่า = โหมดแก้ ([[9.4]])' },
          { at: 'final _formKey = GlobalKey<FormState>();', note: '`final` ใน State → key ตัวเดิมตลอดอายุหน้าจอ ([[8.6]])' },
          { at: 'late final TextEditingController _titleController;', note: '`late final` เพราะต้องอ่าน `widget.transaction` ซึ่งใช้ได้ใน initState ([[dart/d1]])' },
          { at: 'bool _saving = false;', note: 'กันกดบันทึกซ้ำระหว่างรอ DB' },
          { at: "_titleController = TextEditingController(text: transaction?.title ?? '');", note: 'prefill ค่าเดิมเมื่อแก้ไข · `?.` + `??` ([[dart/d1]])' },
          { at: '_titleController.dispose();', note: 'controller ทุกตัวต้อง dispose ([[8.3]])' },
          { at: 'if (selected != null && mounted) setState(() => _date = selected);', note: 'หลัง `await showDatePicker` ต้องเช็ก mounted' },
          { at: 'if (!_formKey.currentState!.validate() || _saving) return;', note: 'validate() เรียก validator ทุกช่อง ([[8.7]])' },
          { at: 'final amount = double.parse(_amountController.text.trim());', note: 'ใช้ `parse` ได้อย่างปลอดภัยเพราะ validator ตรวจด้วย `tryParse` แล้ว' },
          { at: 'final provider = context.read<TransactionProvider>();', note: 'อ่าน provider **ก่อน** await — ไม่ต้องใช้ context หลังรอ ([[core/c3]])' },
          { at: 'if (mounted) Navigator.of(context).pop();', note: 'ระหว่างรอผู้ใช้อาจกดย้อนกลับไปแล้ว ([[core/c5]])' },
          { at: "if (mounted) setState(() => _saving = false);", note: '`finally` ปลดล็อกปุ่มเสมอ' },
          { at: 'initialValue: _type,', note: '`initialValue` ของ DropdownButtonFormField มีตั้งแต่ **Flutter 3.33** (รุ่นก่อนใช้ `value:`) — ถ้าเครื่องสอบเป็นรุ่นเก่าจะ compile ไม่ผ่าน ([[8.9]])' },
          { at: "onPressed: _saving ? null : _save,", note: '`null` = ปิดปุ่ม · `_save` = tear-off ([[dart/d5]])' },
        ] },
      { key: 'ex13/test/my_transaction_test.dart', role: 'Unit test ของ Model', refs: ['13.7'], summary: 'ทดสอบ toMap/fromMap โดยไม่ต้องมีฐานข้อมูลหรือหน้าจอ',
        notes: [{ at: "test('new transactions omit the database id', () {", note: 'ยืนยันว่า toMap ไม่มีคีย์ id เมื่อ id เป็น null' }, { at: "'amount': 20000,", note: 'จำลองแถวที่ SQLite คืนจำนวนเต็ม → fromMap ต้องได้ 20000.0' }] },
      { key: T2, role: 'Widget test ของฟอร์ม (ไม่แตะ DB)', refs: ['13.10'], summary: '`FakeTransactionProvider implements TransactionProvider` ถูกฉีดเข้าทาง `ChangeNotifierProvider.value` — ทดสอบตรรกะของหน้าจอโดยไม่เปิดไฟล์ฐานข้อมูลเลย',
        notes: [
          { at: 'implements TransactionProvider {', note: '`implements` = ทำตามสัญญาของคลาสจริงโดยไม่สืบทอดโค้ด (ไม่มี sqflite)' },
          { at: 'dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);', note: 'เมธอดที่ไม่ได้เขียน (fetch, delete) ไม่ต้อง implement — เรียกเมื่อไรจะ error ซึ่งเทสต์นี้ไม่เรียก' },
          { at: 'ChangeNotifierProvider<TransactionProvider>.value(', note: '`.value` = ใช้อ็อบเจกต์ที่สร้างไว้แล้ว (และไม่ dispose ให้) — เหมาะกับเทสต์' },
          { at: "expect(provider.added?.title, 'Lunch');", note: 'ยืนยันว่าฟอร์ม trim ข้อความก่อนส่ง' },
        ] },
    ],
    actions: {
      open: { label: 'เปิดแอป', steps: [
        { file: MAIN, at: 'runApp(', to: 'child: const ExpenseTrackerApp(),', short: 'runApp', text: '`runApp` วาง `ChangeNotifierProvider` ไว้บนสุด แล้วค่อย MaterialApp ([[10.3]])' },
        { file: LS, at: 'body: Consumer<TransactionProvider>(', short: 'Consumer อ่านครั้งแรก', text: 'Consumer ของหน้ารายการอ่าน provider เป็นครั้งแรก → `create` (lazy) ทำงาน → constructor ของ provider ถูกเรียก' },
        { file: P, at: 'TransactionProvider() {', to: '}', short: 'constructor', text: 'สั่ง `fetchAndSetTransactions()` แบบไม่รอ (constructor เป็น async ไม่ได้)' },
        { file: P, at: '_isLoading = true;', to: 'notifyListeners();', short: 'isLoading = true', text: 'บอกหน้าจอว่ากำลังโหลด — notify ทันที' },
        { file: LS, at: 'if (provider.isLoading && provider.transactions.isEmpty) {', to: 'return const Center(child: CircularProgressIndicator());', short: 'วงล้อ', text: 'ยังไม่มีข้อมูล → วงล้อเต็มหน้า' },
        { file: P, at: 'final future = _databaseFuture ??= _openDatabase();', short: '??= เปิด DB', text: 'ครั้งแรก `_databaseFuture` เป็น null → เรียก `_openDatabase()` ([[13.4]])' },
        { file: P, at: 'return openDatabase(', to: "await db.execute('ALTER TABLE $_tableName ADD COLUMN note TEXT');", short: 'onCreate / onUpgrade', text: 'ไม่มีไฟล์ → onCreate (โครงสร้างล่าสุด) · มีไฟล์ v1 → onUpgrade เพิ่ม note ([[13.5]], [[13.8]])' },
        { file: P, at: "final rows = await db.query(_tableName, orderBy: 'date DESC, id DESC');", to: '_transactions = rows.map(MyTransaction.fromMap).toList();', short: 'query + fromMap', text: 'อ่านทุกแถว แล้วแปลงเป็น Model ทันที ([[13.6]], [[13.7]])' },
        { file: M, at: 'factory MyTransaction.fromMap(Map<String, dynamic> map) => MyTransaction(', to: "note: map['note'] as String?,", short: 'fromMap', text: 'แปลงทีละคอลัมน์: num → double, ISO → DateTime, name → enum' },
        { file: P, at: '} finally {', to: 'notifyListeners();', short: 'finally notify', text: '`_isLoading = false` แล้ว notify อีกครั้ง → Consumer build ใหม่' },
        { file: LS, at: 'return ListView.builder(', to: 'final transaction = transactions[index];', short: 'ListView', text: 'แสดงรายการ — `itemBuilder` สร้างเฉพาะแถวที่เห็นบนจอ' },
      ] },
      add: { label: 'เพิ่ม', steps: [
        { file: LS, at: 'floatingActionButton: FloatingActionButton(', to: 'builder: (_) => const AddEditTransactionScreen(),', short: 'FAB → push', text: 'push หน้าฟอร์มโดยไม่ส่ง transaction = โหมดเพิ่ม ([[9.3]])' },
        { file: AE, at: 'void initState() {', to: '_type = transaction?.type ?? TransactionType.expense;', short: 'initState', text: 'สร้าง controller (ค่าว่าง) และค่าเริ่มต้น expense / วันนี้' },
        { file: AE, at: 'FilledButton(', to: "child: Text(_saving ? 'กำลังบันทึก...' : 'บันทึก'),", short: 'กดบันทึก', text: 'ปุ่มชี้ไปที่ `_save` (ปิดปุ่มระหว่าง `_saving`)' },
        { file: AE, at: 'if (!_formKey.currentState!.validate() || _saving) return;', to: 'setState(() => _saving = true);', short: 'validate', text: 'ตรวจทุกช่องก่อน — ไม่ผ่านก็หยุดตรงนี้ ([[8.6]])' },
        { file: AE, at: 'validator: (value) {', to: 'return null;', short: 'validator จำนวนเงิน', text: '`double.tryParse` + `isFinite` + `> 0` · คืนข้อความ = ไม่ผ่าน, null = ผ่าน ([[8.7]])' },
        { file: AE, at: 'final provider = context.read<TransactionProvider>();', to: 'await provider.addTransaction(title, amount, _date, _type, note: note);', short: 'read + addTransaction', text: 'อ่าน provider ด้วย `read` (ไม่ลงทะเบียน) แล้วสั่งเพิ่ม ([[core/c3]])' },
        { file: P, at: 'Future<void> addTransaction(', to: 'await fetchAndSetTransactions();', short: 'insert', text: 'สร้าง MyTransaction (ไม่มี id) → `insert(toMap())` → อ่านใหม่' },
        { file: M, at: 'Map<String, dynamic> toMap() => {', to: "'note': note,", short: 'toMap', text: 'ไม่มีคีย์ id → SQLite สร้างให้' },
        { file: P, at: '} finally {', to: 'notifyListeners();', short: 'notify', text: 'หน้ารายการที่อยู่ข้างหลังได้ข้อมูลใหม่' },
        { file: AE, at: 'if (mounted) Navigator.of(context).pop();', short: 'pop', text: 'กลับหน้ารายการ (เช็ก mounted หลัง await)' },
        { file: AE, at: '} catch (error) {', to: '.showSnackBar(SnackBar(content: Text(', short: 'ถ้า error', text: 'แสดง SnackBar แทนการ crash · **สังเกต**: ถ้า insert สำเร็จแต่การอ่านใหม่ล้ม ผู้ใช้จะเห็น “บันทึกไม่สำเร็จ” ทั้งที่บันทึกแล้ว ([[bughunt]])' },
      ] },
      edit: { label: 'แก้ไข', steps: [
        { file: LS, at: 'onTap: () => Navigator.of(context).push(', to: 'AddEditTransactionScreen(transaction: transaction),', short: 'แตะรายการ', text: 'ส่ง transaction ที่แตะไปทาง constructor ([[9.4]])' },
        { file: AE, at: 'final transaction = widget.transaction;', to: "_noteController = TextEditingController(text: transaction?.note ?? '');", short: 'prefill', text: 'controller เริ่มด้วยค่าเดิม (เช็กลิสต์ UI: prefill ครบ)' },
        { file: AE, at: 'await provider.updateTransaction(', to: '),', short: 'updateTransaction', text: 'ส่ง `existing.id!` + object ใหม่ (ไม่มี id)' },
        { file: P, at: "final values = newTransaction.toMap()..remove('id');", to: "await db.update(_tableName, values, where: 'id = ?', whereArgs: [id]);", short: 'update where id', text: 'update เฉพาะแถว id นั้น ([[13.6]])' },
        { file: AE, at: 'if (mounted) Navigator.of(context).pop();', short: 'pop', text: 'กลับหน้ารายการที่ได้ข้อมูลใหม่แล้ว' },
      ] },
      del: { label: 'ลบ', steps: [
        { file: LS, at: "onPressed: () => _delete(context, transaction),", short: 'ถังขยะ', text: 'lambda ส่ง transaction ของแถวนั้น' },
        { file: LS, at: 'Future<void> _delete(BuildContext context, MyTransaction transaction) async {', to: 'transaction.id!,', short: '_delete', text: '`context.read` แล้ว await deleteTransaction' },
        { file: P, at: 'Future<void> deleteTransaction(int id) async {', to: 'await fetchAndSetTransactions();', short: 'delete where id', text: 'delete + where/whereArgs แล้วอ่านใหม่' },
        { file: LS, at: '} catch (error) {', to: '.showSnackBar(SnackBar(content: Text', short: 'error → SnackBar', text: '`context.mounted` ก่อนใช้ context หลัง await ([[core/c5]])' },
      ] },
      test: { label: 'เทสต์โดยไม่แตะ DB', steps: [
        { file: T2, at: 'class FakeTransactionProvider extends ChangeNotifier', to: 'implements TransactionProvider {', short: 'Fake provider', text: 'คลาสปลอมที่ “หน้าตาเหมือน” TransactionProvider แต่จดค่าที่ถูกส่งมาแทนการเขียน DB' },
        { file: T2, at: 'ChangeNotifierProvider<TransactionProvider>.value(', to: 'child: const MaterialApp(home: AddEditTransactionScreen()),', short: 'ฉีด fake', text: 'หน้าจอเรียก `context.read<TransactionProvider>()` แล้วได้ตัวปลอม — นี่คือการ “แบ่งชั้นเพื่อทดสอบโดยไม่แตะไฟล์จริง” ของคำถาม 13.12' },
        { file: T2, at: "await tester.tap(find.text('บันทึก'));", to: "expect(find.text('กรุณากรอกจำนวนเงินที่มากกว่า 0'), findsOneWidget);", short: 'validator ทำงาน', text: 'กดบันทึกตอนฟอร์มว่าง → ข้อความ validator ขึ้น' },
        { file: T2, at: "expect(provider.added?.title, 'Lunch');", to: 'expect(provider.updated, isNull);', short: 'ตรวจค่าที่ส่ง', text: 'ตรวจว่าฟอร์ม trim และแปลงจำนวนเงินถูก' },
      ] },
    },
    after: [
      { t: 'callout', kind: 'exam', title: 'ใช้ ex_13 ซ้อมอย่างไร', body: 'ลบ `add_edit_transaction_screen.dart` ทิ้งในสำเนาของโปรเจกต์ แล้วเขียนใหม่โดยไม่ดู — จับเวลา 30 นาที เทียบกับไฟล์นี้ แล้วไล่ [[exam|เช็กลิสต์]] · จากนั้นลองเปลี่ยน entity ตามโจทย์ข้อ 1–2' },
    ],
  };

  FR.content['walk-ex13'] = {
    id: 'walk-ex13', kind: 'exam', navTitle: 'Walkthrough: ex_13', title: SPEC.title, num: '⌘',
    page(main) { FR.walk.render(main, SPEC); },
    _spec: SPEC,
  };
})();
