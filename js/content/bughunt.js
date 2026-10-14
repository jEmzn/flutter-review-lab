/* ฝึกจับผิดโค้ด — โค้ดจริงจาก ex_13 / review_final_app (ตัดจาก FR.data.sources) + กับดักจากตำราและโจทย์ซ้อม */
(function () {
  const src = () => (FR.data && FR.data.sources) || {};
  /** slice real source between two anchor texts (inclusive) and remove common indentation */
  function S(key, from, to, extra = 0) {
    const text = src()[key];
    if (!text) return `// ไม่พบซอร์ส ${key} — รัน node tools/gen-sources.mjs`;
    const L = text.split('\n');
    const a = L.findIndex((l) => l.includes(from));
    const b = to ? L.findIndex((l, i) => i >= a && l.includes(to)) : a;
    if (a < 0 || b < 0) return `// ไม่พบบรรทัด “${a < 0 ? from : to}” ใน ${key}`;
    const part = L.slice(a, b + 1 + extra);
    const ind = Math.min(...part.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    return part.map((l) => l.slice(ind)).join('\n');
  }
  const EX = 'ex13/lib/', RFA = 'rfa/ch13/', OFF = 'offline/ch12/';

  FR.content.bughunt = {
    id: 'bughunt', kind: 'exam', navTitle: 'ฝึกจับผิดโค้ด', title: 'ฝึกจับผิดโค้ด', num: '⚑', crumb: 'จับผิดโค้ด',
    problem: 'อ่านโค้ด → **คลิกบรรทัดที่เป็นต้นเหตุ** → อ่านเฉลยและวิธีแก้ · ชุดแรกเป็นโค้ด **จริง** ที่ตัดจาก `ex_13` และ `review_final_app` (โค้ดที่รันได้ แต่มีจุดที่ควรปรับ) · ชุดหลังเป็นกับดักจากตำราและจาก “จุดที่ผู้สอบมักพลาด” ของโจทย์ซ้อม · ผลการตอบถูกเก็บไว้ใช้ใน [[review|ทบทวนข้อที่ผิด]]',
    overview: [
      { t: 'callout', kind: 'note', title: 'ทำไมฝึกกับโค้ดที่ “รันได้”', body: 'บั๊กที่ทำให้เสียคะแนนส่วนใหญ่ **ไม่ทำให้แอปพังตอนทดสอบเร็วๆ** — มันโผล่เมื่อ เครือข่ายล้ม / ผู้ใช้กดย้อนกลับระหว่างรอ / มีแถวเก่าในฐานข้อมูล / ใส่ข้อความแปลกๆ · การจับผิดจึงต้องถามว่า “ถ้า … ล้มตรงนี้ จะเกิดอะไร” ทีละบรรทัด' },
    ],
    sections: [
      {
        id: 'ex13', short: 'ex_13', tag: 'โค้ดจริง', title: 'ex_13 — ตัวอย่างที่ทำเสร็จแล้วก็ยังมีจุดให้ปรับ', quizTitle: 'จับผิด ex_13',
        gist: 'สี่จุดที่ทำงานได้ในกรณีปกติ แต่ให้ผลไม่ดีเมื่อมีอะไรล้ม — อ่านคู่กับ [[code/ex13|walkthrough ex_13]]',
        blocks: [],
        quiz: [
          { type: 'spot', q: 'มีรายการเก่าแถวหนึ่งที่ `type` เป็น `\'transfer\'` (ไม่มีใน enum) — ผู้ใช้กดบันทึกรายการใหม่แล้วเห็น SnackBar “บันทึกรายการไม่สำเร็จ” ทั้งที่แถวใหม่ถูกเขียนลง DB แล้ว · บรรทัดไหนทำให้การ “อ่านใหม่” ที่ล้ม กลายเป็นความล้มเหลวของ “การบันทึก”?', code: S(EX + 'providers/transaction_provider.dart', 'Future<void> fetchAndSetTransactions() async {', 'await fetchAndSetTransactions();'),
            bad: 'rethrow;', explain: '`fetchAndSetTransactions` **rethrow** แล้ว `addTransaction` เรียกมันหลัง insert สำเร็จ → error เดินทางกลับไปถึง `_save` ซึ่งแสดง “บันทึกไม่สำเร็จ” → ผู้ใช้กดซ้ำ = **ข้อมูลซ้ำ** · แก้: ใน add/update/delete ให้ `try { await fetchAndSetTransactions(); } catch (_) {}` (สถานะผิดพลาดถูกเก็บใน `_errorMessage` อยู่แล้ว) หรือแยกข้อความ “บันทึกแล้ว แต่โหลดรายการใหม่ไม่สำเร็จ”' },
          { type: 'spot', q: 'รีเฟรชล้มเหลวทั้งที่ `transactions` ยังมีรายการเดิมอยู่ครบ — แต่ผู้ใช้เห็นแค่ข้อความ error เต็มหน้า · บรรทัดไหน?', code: S(EX + 'screens/transaction_list_screen.dart', 'if (provider.isLoading && provider.transactions.isEmpty) {', "return const Center(child: Text('ไม่มีรายการ'));"),
            bad: 'if (provider.errorMessage != null) {', explain: 'เช็ก error **ก่อน** เช็กว่ามีข้อมูล → error บังรายการเดิม (ขัดกับหลัก 4 สถานะของ [[13.10]]) · แก้: `if (provider.errorMessage != null && provider.transactions.isEmpty)` สำหรับเต็มหน้า และแสดง MaterialBanner/SnackBar เมื่อมีข้อมูลอยู่แล้ว' },
          { type: 'spot', q: 'ผู้ใช้เห็นข้อความแบบ `โหลดรายการไม่สำเร็จ: DatabaseException(no such column: note (code 1 SQLITE_ERROR)) sql …` — บรรทัดไหนควรปรับ?', code: S(EX + 'providers/transaction_provider.dart', '} catch (error) {', '} finally {'),
            bad: "_errorMessage = 'โหลดรายการไม่สำเร็จ: $error';", explain: 'ต่อข้อความ exception ดิบให้ผู้ใช้อ่าน — ผู้ใช้ทำอะไรต่อไม่ได้และเห็นรายละเอียดภายใน · แก้: ข้อความภาษาคน (`\'โหลดรายการไม่สำเร็จ ลองอีกครั้ง\'`) แล้ว `debugPrint(\'$error\')` สำหรับนักพัฒนา (แนวเดียวกับ ApiException ของ [[12.6]])' },
          { type: 'spot', q: 'เครื่องในห้องสอบติดตั้ง Flutter 3.29 — คอมไพล์ฟอร์มนี้ไม่ผ่าน บรรทัดไหน?', code: S(EX + 'screens/add_edit_transaction_screen.dart', 'DropdownButtonFormField<TransactionType>(', 'onChanged: (value) {'),
            bad: 'initialValue: _type,', explain: '`initialValue` ของ `DropdownButtonFormField` เพิ่งมีใน **Flutter 3.33** (`value:` ถูก deprecate หลัง v3.33.0-1.0.pre — ตรวจจาก `material/dropdown.dart`) · รุ่นเก่าได้ “No named parameter with the name \'initialValue\'” → ใช้ `value: _type` · **เช็ก `flutter --version` ของเครื่องสอบก่อนเริ่มเสมอ**' },
        ],
      },
      {
        id: 'rfa', short: 'review_final_app', tag: 'โค้ดจริง', title: 'review_final_app — จุดที่ตั้งใจเขียนแบบตำราไว้', quizTitle: 'จับผิด review_final_app',
        gist: 'โค้ดในแอปทบทวนเขียนตามตำราและมีคอมเมนต์ `[ข้อเสีย]` กำกับหลายจุด — ฝึกหาให้เจอก่อนอ่านคอมเมนต์',
        blocks: [],
        quiz: [
          { type: 'spot', q: '`BookProvider` (exam_book): ถ้า `db.query` โยน exception หน้าจอจะแสดงวงล้อหมุน **ตลอดไป** · บรรทัดไหนที่จะไม่ถูกเรียก?', code: S(RFA + 'exam_book/providers/book_provider.dart', 'Future<void> load() async {', 'notifyListeners();'),
            bad: '_isLoading = false;', explain: '`load()` ไม่มี `try/finally` → exception ข้ามบรรทัดที่ปิดสถานะโหลดและ notify · และถูกเรียกจาก constructor แบบไม่รอ จึงเป็น Unhandled Exception · แก้: `try { … } catch (e) { _error = … } finally { _isLoading = false; notifyListeners(); }` ([[dart/d6]])' },
          { type: 'spot', q: 'เกณฑ์โจทย์ข้อ 3 ให้คะแนน “toggleFavorite อัปเดต **เฉพาะคอลัมน์**” — `toggleRead` ของ BookProvider ไม่ผ่านเกณฑ์แบบเดียวกันเพราะบรรทัดไหน?', code: S(RFA + 'exam_book/providers/book_provider.dart', 'Future<void> updateBook(Book book) async {', 'Future<void> toggleRead(Book book)'),
            bad: 'Future<void> toggleRead(Book book) => updateBook(book.copyWith(isRead: !book.isRead));', explain: 'ส่ง **ทั้งแถว** จาก object ในหน่วยความจำ — ถ้าหน้าจออื่นเพิ่งแก้ราคา ค่าใหม่ถูกทับด้วยค่าเก่า · แก้: `db.update(\'books\', {\'is_read\': book.isRead ? 0 : 1}, where: \'id = ?\', whereArgs: [book.id])` ([[sql/partial]])' },
          { type: 'spot', q: '`DatabaseHelper` (notes): สองหน้าจอเรียก `DatabaseHelper.instance.database` พร้อมกันตอนเปิดแอป — บรรทัดไหนเปิดช่องให้เปิดไฟล์สองครั้ง?', code: S(RFA + 'notes/helpers/database_helper.dart', 'static Database? _database;', '_database = await _initDatabase();', 2),
            bad: 'if (_database != null) return _database!;', explain: 'ระหว่าง `await _initDatabase()` ตัวแปรยังเป็น null → ผู้เรียกคนที่สองผ่านการเช็กแล้วเปิดซ้ำ · แก้: เก็บ **Future**: `static Future<Database>? _dbFuture; Future<Database> get database => _dbFuture ??= _initDatabase();` ([[13.4]], [[dart/d1]])' },
          { type: 'spot', q: 'แลป expense: ถ้าเปิดฐานข้อมูลไม่สำเร็จ ผู้ใช้กด “บันทึก” แล้ว **ไม่มีอะไรเกิดขึ้นเลย** ไม่มีข้อความ · บรรทัดไหนเป็นต้นเหตุ?', code: S(RFA + 'expense/providers/transaction_provider.dart', 'Future<void> _initDatabase() async {', "debugPrint('Error initializing database: $e');"),
            bad: "debugPrint('Error initializing database: $e');", explain: 'กลืน error ไว้แค่ print → `_database` เป็น null → ทุกเมธอด `if (_database == null) return;` เงียบ · แก้: `rethrow` แล้วให้ UI แสดง SnackBar หรือเก็บ `_errorMessage` (ex_13 ทำแบบนี้)' },
          { type: 'spot', q: 'API ส่ง JSON ที่ขาดฟิลด์ `title` มา — ผู้ใช้เห็นว่า “เชื่อมต่ออินเทอร์เน็ตไม่ได้” · บรรทัดไหนทำให้ข้อความไม่ตรงสาเหตุ?', code: S(OFF + 'services/api_service.dart', '} on TimeoutException {', "throw const ApiException('เชื่อมต่ออินเทอร์เน็ตไม่ได้ โปรดตรวจสอบการเชื่อมต่อ');"),
            bad: '} catch (_) {', explain: '`fromJson` ที่ `as String` กับค่า null โยน **TypeError** ซึ่งไม่ใช่ TimeoutException/FormatException จึงตก `catch (_)` ที่ตั้งใจไว้สำหรับต่อไม่ติด · แก้: เพิ่ม `on TypeError { throw const ApiException(\'ข้อมูลจากเซิร์ฟเวอร์ไม่ครบ\', canRetry: false); }` ก่อน `catch (_)` ([[12.6]])' },
        ],
      },
      {
        id: 'textbook', short: 'ตำรา', tag: 'กับดักตำรา', title: 'กับดักจากเนื้อหาบทที่ 10–13', quizTitle: 'จับผิดกับดักในตำรา',
        gist: 'รูปแบบที่ตำราเตือนไว้ — select กับ object ที่แก้ในที่, FutureBuilder ตอนโหลดซ้ำ, db ใน transaction, watch ใน onPressed, setState หลัง await',
        blocks: [],
        quiz: [
          { type: 'spot', q: 'กดเพิ่มสินค้าแล้วตัวเลขบน CartBadge ไม่ขยับ (provider เรียก notifyListeners แล้ว) — บรรทัดไหนเป็นต้นเหตุ?', code: `class CartProvider extends ChangeNotifier {
  final List<String> _items = [];
  List<String> get items => _items;

  void add(String item) {
    _items.add(item);
    notifyListeners();
  }
}

// ใน build ของ CartBadge
final items = context.select<CartProvider, List<String>>((c) => c.items);
return Text('\${items.length}');`, bad: ['List<String> get items => _items;', 'final items = context.select<CartProvider, List<String>>((c) => c.items);'],
            explain: 'select คืน **list ตัวเดิม** ที่ถูกแก้ในที่ → ค่าเก่ากับค่าใหม่คือ object เดียวกัน → เทียบแล้วเท่ากัน → ไม่ build ([[11.3]]) · แก้: `context.select((CartProvider c) => c.items.length)` (เลือก int) หรือ getter คืนสำเนา' },
          { type: 'spot', q: 'กดรีเฟรช (`setState(() => _future = fetchPosts())`) แล้วรายการเดิมหายเป็นวงล้อเต็มหน้า — บรรทัดไหน?', code: `FutureBuilder<List<Post>>(
  future: _future,
  builder: (context, snapshot) {
    if (snapshot.connectionState == ConnectionState.waiting) {
      return const Center(child: CircularProgressIndicator());
    }
    if (snapshot.hasError) return Text('\${snapshot.error}');
    return PostList(posts: snapshot.data!);
  },
)`, bad: 'if (snapshot.connectionState == ConnectionState.waiting) {', explain: 'ตอนเปลี่ยน future ตัวใหม่ snapshot ยังมีข้อมูลรอบก่อน (`waiting` + `hasData` พร้อมกัน) — ตรวจ waiting ก่อนจึงทิ้งข้อมูลที่มี · แก้: ตรวจ `hasError` → `hasData` → ค่อยวงล้อ ([[12.3]])' },
          { type: 'spot', q: 'ลบออเดอร์แล้วหน้าจอค้างที่วงล้อ **โดยไม่มี error** — บรรทัดไหน?', code: `Future<void> deleteOrder(int id) async {
  final db = await database;
  await db.transaction((txn) async {
    await txn.delete('order_items', where: 'order_id = ?', whereArgs: [id]);
    await deleteOrderRow(id); // เมธอดของ provider ที่ข้างในใช้ db.delete
  });
}`, bad: 'await deleteOrderRow(id);', explain: 'เมธอดที่ใช้ `db` รอให้ transaction จบ ขณะที่ transaction รอเมธอดนั้น = deadlock ([[13.9]]) · แก้: `await txn.delete(\'orders\', where: \'id = ?\', whereArgs: [id]);`' },
          { type: 'spot', q: 'กดปุ่มแล้วแอปโยน exception — บรรทัดไหน?', code: `ElevatedButton(
  onPressed: () {
    context.watch<CartProvider>().add(product);
  },
  child: const Text('ใส่ตะกร้า'),
)`, bad: 'context.watch<CartProvider>().add(product);', explain: '`watch` ใช้ได้เฉพาะระหว่าง build — ใน onPressed ได้ “Tried to listen to a value exposed with provider, from outside of the widget tree.” → ใช้ `context.read` ([[core/c3]])' },
          { type: 'spot', q: 'ผู้ใช้กดย้อนกลับระหว่างโหลด แล้ว console ขึ้น “setState() called after dispose()” — บรรทัดไหนควรมีการตรวจก่อน?', code: `Future<void> _load() async {
  setState(() => _loading = true);
  final data = await repo.fetchAll();
  setState(() {
    _items = data;
    _loading = false;
  });
}`, bad: 'setState(() {', explain: 'หลัง `await` State อาจถูก dispose แล้ว · แก้: เพิ่ม `if (!mounted) return;` ก่อน setState ([[core/c5]])' },
        ],
      },
      {
        id: 'exam', short: 'โจทย์ซ้อม', tag: 'จากโจทย์', title: 'จุดที่ผู้สอบมักพลาด (จากไฟล์โจทย์ 6 ข้อ)', quizTitle: 'จับผิดตามโจทย์ซ้อม',
        gist: 'โค้ดสั้นที่จำลองความผิดพลาดซึ่งไฟล์โจทย์เตือนไว้ — ทำก่อนลงมือโจทย์จริง',
        blocks: [
          { t: 'callout', kind: 'real', title: 'bool ใน toMap: พฤติกรรมจริงต่างจากที่ไฟล์โจทย์ข้อ 2 เขียน', body: 'โจทย์ข้อ 2 ระบุว่า `\'is_done\': isDone` “ทำให้ sqflite โยนข้อผิดพลาด” — ตรวจซอร์สในเครื่องแล้ว **ยังไม่โยน**: `sqflite_common 2.5.13` (`lib/src/value_utils.dart`) พิมพ์ `*** WARNING *** Invalid argument true with type bool … This will throw an exception in the future` ครั้งเดียว แล้ว `sqflite_android 2.4.2` (`SqlCommand.java`) แปลงเป็น 1/0 ให้ · **แต่ยังผิดอยู่ดี**: ผู้พัฒนาประกาศว่าจะโยนในอนาคต, ไม่ใช่ทุกแพลตฟอร์มแปลงให้ และ `fromMap` ที่อ่าน `as bool` จะพังด้วย `type \'int\' is not a subtype of type \'bool\'` · ตอบในข้อสอบว่า “ต้องแปลงเป็น 1/0 เอง”' },
        ],
        quiz: [
          { type: 'spot', q: '(ข้อ 4) ผู้ใช้ที่ยังมีไฟล์ **v1** อัปเดตเป็นแอป v3 ทันที แล้วไม่มีคอลัมน์ใหม่ของ v3 — บรรทัดไหน?', code: `Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
  if (oldVersion < 2) {
    await db.execute('ALTER TABLE entries ADD COLUMN mood TEXT');
  }
  if (oldVersion == 2) {
    await db.execute('CREATE TABLE entries_new(...)');
    // ... INSERT INTO entries_new SELECT ... / DROP / RENAME
  }
}`, bad: 'if (oldVersion == 2) {', explain: 'ไฟล์ v1 ได้ `oldVersion == 1` → เข้าแค่ขั้นแรก · ใช้ `if (oldVersion < 3)` เรียงต่อกัน ([[13.8]])' },
          { type: 'spot', q: '(ข้อ 4) หลังอัปเกรดเป็น v3 เปิดหน้ารายการแล้ว crash — บรรทัดไหน?', code: `factory DiaryEntry.fromMap(Map<String, Object?> map) => DiaryEntry(
  id: map['id'] as int,
  title: map['title'] as String,
  body: map['body'] as String,
  mood: map['mood'] == null ? null : Mood.values.byName(map['mood'] as String),
  isFavorite: map['is_favorite'] == 1,
  createdAt: DateTime.parse(map['created_at'] as String),
);`, bad: "createdAt: DateTime.parse(map['created_at'] as String),", explain: 'แถวเก่าก่อน v3 มี `created_at` เป็น NULL → `type \'Null\' is not a subtype of type \'String\'` · แก้: `map[\'created_at\'] == null ? null : DateTime.parse(map[\'created_at\'] as String)`' },
          { type: 'spot', q: '(ข้อ 6) เปิดแอปตอนไม่มีสัญญาณแล้วกดรีเฟรช — แคชสภาพอากาศของเมืองนั้นหายหมด · บรรทัดไหนเริ่มปัญหา?', code: `Future<void> refreshCity(City city) async {
  await _db.delete('weather_current', where: 'city_id = ?', whereArgs: [city.id]);
  await _db.delete('forecast_days', where: 'city_id = ?', whereArgs: [city.id]);
  final f = await _api.fetchForecast(city.latitude, city.longitude);
  await _db.transaction((txn) async {
    // แทรก current + forecast ใหม่
  });
}`, bad: ["await _db.delete('weather_current', where: 'city_id = ?', whereArgs: [city.id]);", "await _db.delete('forecast_days', where: 'city_id = ?', whereArgs: [city.id]);"], explain: 'ลบแคชก่อนเรียก API — API ล้มแล้วไม่มีอะไรมาแทน · แก้: เรียก `fetchForecast` **ก่อน** แล้วย้ายการลบเข้าไปใน transaction เดียวกับการแทรก ([[13.10]])' },
          { type: 'spot', q: '(ข้อ 5) กด “ชำระเงิน” บนออเดอร์ที่ถูกยกเลิกไปแล้ว (จากอีกหน้าจอ) แล้วสถานะกลายเป็น paid — บรรทัดไหน?', code: `Future<bool> markPaid(int id) async {
  final db = await _initDatabase();
  final n = await db.update('orders', {'status': OrderStatus.paid.name},
      where: 'id = ?', whereArgs: [id]);
  await refresh();
  return n == 1;
}`, bad: "where: 'id = ?', whereArgs: [id]);", explain: 'ไม่ได้เช็กสถานะเดิมใน where · แก้: `where: \'id = ? AND status = ?\', whereArgs: [id, OrderStatus.pending.name]` แล้วใช้ `n == 1` บอก UI ([[sql/partial]])' },
          { type: 'spot', q: '(ข้อ 2) คอนโซลขึ้น `*** WARNING *** Invalid argument true with type bool` ตอน insert — บรรทัดไหน?', code: `Map<String, Object?> toMap() => {
  if (id != null) 'id': id,
  'title': title,
  'detail': detail,
  'due_date': dueDate.toIso8601String(),
  'priority': priority.name,
  'is_done': isDone,
};`, bad: "'is_done': isDone,", explain: 'SQLite ไม่มี bool → `\'is_done\': isDone ? 1 : 0` และอ่านกลับด้วย `map[\'is_done\'] == 1` ([[13.7]]) — ดูกล่องพฤติกรรมจริงด้านบน' },
        ],
      },
    ],
  };
})();
