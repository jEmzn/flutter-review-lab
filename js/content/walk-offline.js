/* Walkthrough — offline-first (review_final_app: ch12 api_service/todo + ch13 todo_offline) */
(function () {
  const API = 'offline/ch12/services/api_service.dart';
  const TODO = 'offline/ch12/models/todo.dart';
  const DB = 'offline/ch13/todo_offline/data/app_database.dart';
  const REPO = 'offline/ch13/todo_offline/repositories/todo_repository.dart';
  const PROV = 'offline/ch13/todo_offline/providers/todo_provider.dart';
  const SCR = 'offline/ch13/todo_offline/screens/todo_list_screen.dart';
  const APP = 'offline/ch13/todo_offline/screens/todo_offline_app.dart';

  const SPEC = {
    id: 'walk-offline', title: 'Walkthrough: offline-first (todo_offline)', source: 'review_final_app/lib/chapters/ch12 + ch13/todo_offline',
    lede: 'โค้ดของ [[13.10.1]] ที่รันได้จริงใน `review_final_app` — สายพาน **หน้าจอ → Provider → Repository → (SQLite | API)** · Repository รับ `Database` ผ่าน constructor (dependency injection) ต่างจาก Singleton ของ [[13.4]] · ใช้เป็นแบบของโจทย์ข้อ 6',
    intro: [
      { t: 'compare', cols: ['', 'DatabaseHelper.instance (13.4)', 'ส่ง Database ทาง constructor (13.10)'], rows: [
        ['ใครเปิดไฟล์', 'Singleton เปิดเองตอนถูกเรียกครั้งแรก', '`openAppDatabase()` ใน main (หรือ initState ของแลป) ครั้งเดียว'],
        ['คนใช้ได้มาอย่างไร', 'เรียก `DatabaseHelper.instance` จากที่ไหนก็ได้', 'รับผ่าน constructor: `TodoProvider(TodoRepository(db))`'],
        ['ทดสอบ', 'ยาก — ผูกกับไฟล์จริง', 'ง่าย — ส่ง repository/DB ปลอมเข้าไปได้'],
        ['ข้อควรระวัง', 'race ถ้าเก็บ `Database?` แทน Future', 'ผู้เรียกต้องไม่เปิดซ้ำหลายครั้ง'],
      ] },
    ],
    files: [
      { key: TODO, role: 'Model: JSON ⇄ Todo ⇄ แถว', refs: ['12.5', '13.10'], summary: 'มีทั้ง `fromJson` (บท 12) และ `toMap/fromMap` (บท 13) — id มาจากเซิร์ฟเวอร์จึงใส่ใน toMap เสมอ',
        notes: [
          { at: "userId: json['userId'] as int,", note: 'cast ตรวจชนิดตอนรัน — JSON ขาดฟิลด์ = TypeError ที่จุดเดียวนี้ ([[12.5]])' },
          { at: "'id': id, // id มาจากเซิร์ฟเวอร์", note: 'ต่างจาก Note/MyTransaction: ไม่ต้อง `if (id != null)` เพราะ id มีค่าเสมอ' },
          { at: "'completed': completed ? 1 : 0,", note: 'SQLite ไม่มี bool ([[13.7]])' },
          { at: "completed: map['completed'] == 1,", note: 'อ่านกลับ: 1 → true' },
        ] },
      { key: API, role: 'ชั้นเครือข่าย: แปลงทุกความล้มเหลวเป็น ApiException', refs: ['12.6', '12.7'], tag: 'บท 12',
        summary: 'หน้าจอไม่ต้องรู้จัก http / SocketException — ออกได้ 2 ทาง: ได้รายการ หรือโยน `ApiException(message, canRetry)` · มีตัวสลับ “จำลองเครือข่าย” เฉพาะแลป',
        notes: [
          { at: 'class ApiException implements Exception {', note: 'ข้อความภาษาคน + บอกว่าลองใหม่มีประโยชน์ไหม ([[12.6]])' },
          { at: "final response = await _get(uri).timeout(const Duration(seconds: 10));", note: 'http ไม่มี timeout ให้เอง ต้องใส่ทุกคำขอ' },
          { at: 'return await compute(_parseTodos, response.body);', note: '`return await` ใน try — ไม่งั้น FormatException จากการแปลงจะหลุดออกนอก try ([[12.7]])' },
          { at: 'if (response.statusCode >= 500) {', note: '5xx → canRetry = true · 4xx → false' },
          { at: '} on ApiException {', note: 'ต้อง rethrow ก่อน `catch (_)` ไม่งั้นข้อความที่ตั้งใจถูกกลืนเป็น “เชื่อมต่อไม่ได้”' },
          { at: '} catch (_) {', note: 'กว้างมาก: TypeError จาก JSON ขาดฟิลด์ก็ตกที่นี่ — ข้อความอาจไม่ตรงสาเหตุ ([[bughunt]])' },
        ] },
      { key: DB, role: 'เปิดฐานข้อมูล (ฟังก์ชันเดียวแทน DatabaseHelper)', refs: ['13.10.1', '13.5'], summary: '`getDatabasesPath()` + `join` · ตาราง todos ไม่มี AUTOINCREMENT',
        notes: [
          { at: 'Future<Database> openAppDatabase() async {', note: 'เรียกครั้งเดียว แล้วส่ง Database ตัวนี้ต่อทาง constructor' },
          { at: 'id INTEGER PRIMARY KEY,', note: 'ไม่มี AUTOINCREMENT เพราะ id มาจากเซิร์ฟเวอร์' },
        ] },
      { key: REPO, role: 'Repository: รู้จักทั้ง API และ SQLite', refs: ['13.10', '13.9'], tag: 'แกน',
        summary: '`readCached()` อ่านจาก DB · `refresh()` = **API ก่อน → transaction เขียนทับ → อ่านกลับจาก DB**',
        notes: [
          { at: 'TodoRepository(this._db);', note: 'dependency injection — ทดสอบด้วย DB in-memory ได้' },
          { at: "final rows = await _db.query('todos', orderBy: 'id');", note: 'ได้ทันทีแม้ไม่มีสัญญาณ' },
          { at: 'final fresh = await fetchTodos(); // ชั้นเครือข่ายจาก 12.6', note: '**ก่อน** แตะ DB: ล้มเหลวตรงนี้ = บรรทัดถัดไปไม่ทำงาน แคชเดิมอยู่ครบ' },
          { at: 'await _db.transaction((txn) async {', note: 'ลบ + แทรกสำเร็จพร้อมกัน หรือไม่มีอะไรเปลี่ยนเลย ([[13.9]]) · ไม่มี await เครือข่ายในบล็อกนี้' },
          { at: "await txn.delete('todos');", note: '`txn` ทุกคำสั่ง ห้าม `_db`' },
          { at: 'await batch.commit(noResult: true);', note: '200 แถวในรอบเดียว' },
          { at: 'return readCached();', note: 'คืนสิ่งที่อยู่ใน DB ไม่ใช่ `fresh` → แหล่งความจริงเดียว' },
        ] },
      { key: PROV, role: 'Provider: 4 ค่าที่ประกอบเป็นสถานะ', refs: ['13.10', '12.8'],
        summary: '`todos` + `isRefreshing` + `errorMessage` + `lastSynced` → หน้าจอ 4 แบบ',
        notes: [
          { at: 'TodoProvider(this._repository);', note: 'provider ไม่รู้ว่าข้อมูลมาจากเน็ตหรือไฟล์' },
          { at: '_todos = await _repository.readCached();', note: '**สังเกต**: อยู่นอก try (เหมือนตำรา) — ถ้าอ่าน DB ล้ม exception หลุดออกไปและไม่มีสถานะผิดพลาดบนจอ ([[bughunt]])' },
          { at: 'notifyListeners(); // ผู้ฟังวาดรายการเดิม', note: 'แจ้งครั้งแรก: รายการเดิม + กำลังรีเฟรช' },
          { at: "_errorMessage = e is Exception ? e.toString() : 'เกิดข้อผิดพลาด';", note: 'ปรับจากตำรา: ใช้ข้อความของ ApiException (toString คืน message) · แต่ Exception ชนิดอื่น (เช่น DatabaseException) จะโชว์ข้อความดิบ' },
          { at: '} finally {', note: 'ปิด isRefreshing และ notify เสมอ' },
        ] },
      { key: SCR, role: 'หน้าจอ 4 สถานะ', refs: ['13.10.1', '12.8'],
        summary: 'โหลดใน `addPostFrameCallback` (ไม่ notify ระหว่าง build) แล้วเลือกแสดงตาม hasData × isRefreshing × errorMessage',
        notes: [
          { at: 'WidgetsBinding.instance.addPostFrameCallback((_) {', note: 'load() เรียก notifyListeners ทันที — ถ้าเรียกตรงๆ ใน initState จะชน “markNeedsBuild() called during build” ([[12.8]])' },
          { at: 'final provider = context.watch<TodoProvider>();', note: 'watch ระดับ build — หน้านี้แทบทุกส่วนขึ้นกับ provider' },
          { at: 'bottom: hasData && provider.isRefreshing', note: 'สถานะ “มีข้อมูล + รีเฟรช” = แถบบางใต้ AppBar' },
          { at: 'if (!hasData && provider.isRefreshing) {', note: 'ไม่มีข้อมูล + รีเฟรช = วงล้อเต็มหน้า' },
          { at: 'if (!hasData && provider.errorMessage != null) {', note: 'ไม่มีข้อมูล + ล้มเหลว = error เต็มหน้า + ลองใหม่' },
          { at: 'if (provider.errorMessage != null)', note: 'มีข้อมูล + ล้มเหลว = รายการเดิม + MaterialBanner (เทียบกับ ex_13 ที่ error บังรายการ)' },
          { at: "if (synced == null) return 'ที่บันทึกไว้ในเครื่องจากครั้งก่อน';", note: '`lastSynced` อยู่ในหน่วยความจำ → เปิดแอปใหม่แล้วเป็น null · ข้อ 6 ให้เก็บ `fetched_at` ใน DB แทน' },
        ] },
      { key: APP, role: 'ประกอบชั้น: DB → Repository → Provider', refs: ['13.10.1', '12.3'],
        summary: 'แลปรันในแอปทบทวนจึงเปิด DB ใน initState + FutureBuilder (ในตำราทำใน `main()` แบบ async)',
        notes: [
          { at: 'late final Future<Database> _dbFuture;', note: 'สร้าง Future ครั้งเดียวใน initState — ห้ามเริ่มงาน async ใน build ([[12.3]])' },
          { at: 'create: (_) => TodoProvider(TodoRepository(snapshot.data!)),', note: 'ฉีด DB → Repository → Provider ตามลำดับชั้น' },
        ] },
    ],
    actions: {
      first: { label: 'เปิดครั้งแรก (ออนไลน์)', steps: [
        { file: APP, at: 'void initState() {', to: '_dbFuture = openAppDatabase();', short: 'เปิด DB', text: 'เริ่มเปิดไฟล์ครั้งเดียว' },
        { file: DB, at: 'return openDatabase(', to: 'completed INTEGER NOT NULL', short: 'onCreate todos', text: 'ไฟล์ใหม่ → สร้างตาราง todos' },
        { file: APP, at: 'create: (_) => TodoProvider(TodoRepository(snapshot.data!)),', short: 'ประกอบชั้น', text: 'เมื่อ DB พร้อม สร้าง Repository และ Provider' },
        { file: SCR, at: 'WidgetsBinding.instance.addPostFrameCallback((_) {', to: 'context.read<TodoProvider>().load();', short: 'load หลังเฟรมแรก', text: 'เลื่อน load ไปหลังเฟรมแรก ([[12.8]])' },
        { file: PROV, at: '_todos = await _repository.readCached();', to: 'notifyListeners(); // ผู้ฟังวาดรายการเดิม', short: 'readCached', text: 'แคชว่าง → หน้าจอเห็น “ไม่มีข้อมูล + กำลังรีเฟรช” = วงล้อเต็มหน้า (สถานะ ①)' },
        { file: REPO, at: 'final fresh = await fetchTodos();', short: 'fetchTodos', text: 'ไปเครือข่ายก่อน' },
        { file: API, at: "final response = await _get(uri).timeout(const Duration(seconds: 10));", to: 'return await compute(_parseTodos, response.body);', short: 'http + compute', text: '200 → แปลง JSON ใน isolate อื่น ([[12.7]])' },
        { file: REPO, at: 'await _db.transaction((txn) async {', to: 'await batch.commit(noResult: true);', short: 'transaction', text: 'ลบชุดเดิม + แทรก 200 แถวในรอบเดียว ([[13.9]])' },
        { file: REPO, at: 'return readCached();', short: 'อ่านกลับ', text: 'คืนสิ่งที่อยู่ใน DB' },
        { file: PROV, at: '_todos = await _repository.refresh();', to: '_errorMessage = null;', short: 'สำเร็จ', text: 'บันทึกเวลาซิงก์ ล้าง error' },
        { file: SCR, at: 'Expanded(', to: 'onChanged: null, // แสดงอย่างเดียว ไม่ให้แก้ไข', short: 'รายการ', text: 'แสดง 200 รายการ' },
      ] },
      offline: { label: 'เปิดตอนไม่มีสัญญาณ', steps: [
        { file: PROV, at: '_todos = await _repository.readCached();', to: 'notifyListeners(); // ผู้ฟังวาดรายการเดิม', short: 'แคชขึ้นทันที', text: 'มีข้อมูลเมื่อครั้งก่อน → รายการขึ้นทันที + แถบบางใต้ AppBar (สถานะ ②)' },
        { file: API, at: '} catch (_) {', to: "throw const ApiException('เชื่อมต่ออินเทอร์เน็ตไม่ได้ โปรดตรวจสอบการเชื่อมต่อ');", short: 'ApiException', text: 'ต่อไม่ติด → แปลงเป็นข้อความภาษาคน' },
        { file: REPO, at: 'final fresh = await fetchTodos();', short: 'ไม่แตะ DB', text: 'exception หลุดจากบรรทัดนี้ → transaction ไม่ถูกเรียก → แคชเดิมครบ' },
        { file: PROV, at: '} catch (e) {', to: "_errorMessage = e is Exception ? e.toString() : 'เกิดข้อผิดพลาด';", short: 'errorMessage', text: '`_todos` ยังเป็นชุดเดิม' },
        { file: SCR, at: 'if (provider.errorMessage != null)', to: "TextButton(onPressed: provider.load, child: const Text('ลองใหม่')),", short: 'Banner', text: 'รายการเดิม + MaterialBanner “แสดงข้อมูล…” + ลองใหม่ (สถานะ ③)' },
      ] },
    },
    after: [
      { t: 'callout', kind: 'exam', title: 'ต่อยอดเป็นโจทย์ข้อ 6', body: 'เปลี่ยน `fetchTodos` เป็น `fetchForecast(lat, lon)` · repository เขียน 2 ตาราง (`weather_current`, `forecast_days`) ใน transaction เดียว · `readCities()` ใช้ `LEFT JOIN` ([[sql/join]]) · เก็บ `fetched_at` ใน DB เพื่อให้ “ข้อมูลเมื่อกี่โมง” รอดข้ามการปิดแอป' },
    ],
  };

  FR.content['walk-offline'] = {
    id: 'walk-offline', kind: 'exam', navTitle: 'Walkthrough: offline-first', title: SPEC.title, num: '⌘',
    page(main) { FR.walk.render(main, SPEC); },
    _spec: SPEC,
  };
})();
