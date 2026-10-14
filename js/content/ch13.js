/* บทที่ 13 — การคงอยู่ของข้อมูลด้วย SQLite */
FR.content.ch13 = {
  id: 'ch13', kind: 'chapter', num: '13', navTitle: 'SQLite', crumb: 'บทที่ 13',
  title: 'การคงอยู่ของข้อมูลด้วย SQLite (Data Persistence with SQLite)',
  problem: 'ทุกอย่างที่ผ่านมาอยู่ใน **RAM** — ปิดแอปหรือแบตหมดก็หาย · ต้องย้ายข้อมูลลง **ไฟล์ฐานข้อมูลในเครื่อง** ให้รอดข้ามการปิดแอป, แก้ทีละแถวได้อย่างปลอดภัย, เปลี่ยนโครงสร้างได้โดยข้อมูลผู้ใช้ไม่หาย, และเปิดดูได้แม้ไม่มีสัญญาณ',
  tools: ['sqflite + path / path_provider', 'DatabaseHelper (Singleton) / provider ถือ DB', 'CREATE TABLE ใน onCreate', 'insert / query / update / delete + where/whereArgs', 'toMap / fromMap', 'version + onUpgrade', 'transaction / batch', 'Repository + offline-first'],
  receives: { title: 'ต่อจากบทที่ 12 (คำถาม 12.10)', body: 'ผู้ใช้ในลิฟต์เห็นแต่ “เชื่อมต่อไม่ได้” ทั้งที่ข้อมูลเพิ่งมาถึงเมื่อเช้า — **(1) เก็บไว้ที่ไหน ใครเก็บ (2) ข้อมูลสองชุด ชุดไหนคือความจริง (3) สามสถานะพอไหม** → ตอบครบใน [[13.10]] หลังจากสร้างที่เก็บในเครื่องให้ใช้ได้จริงก่อน' },
  overview: [
    { t: 'h', text: 'ภาพใหญ่: บริษัทที่มีห้องใต้ดิน' },
    'ตำราเปรียบแอปในแลปเป็นบริษัท: **หน้าจอ** = พนักงานต้อนรับ (รับเรื่อง แสดงผล ไม่แตะ SQL) · **Provider** = ผู้จัดการ (รู้ตรรกะ สั่งงานห้องใต้ดิน แล้วประกาศผ่านลำโพง `notifyListeners()`) · **SQLite** = ห้องใต้ดินที่เก็บเอกสารถาวร · **Consumer** = พนักงานที่ใส่หูฟังรอฟัง — ลองใช้แอปด้านล่าง ทุกการกดจะเห็น **คำสั่ง Dart → SQL จริง → แถวในตารางจริง**',
    { t: 'viz', id: 'ch13.app', title: 'แอปบัญชีรายรับ-รายจ่าย (SQLite จริงในเบราว์เซอร์)', try: 'กด + หลายครั้ง ลบบางรายการ แล้วกด “ปิดแอป” → “เปิดแอปใหม่” — ข้อมูลยังอยู่เพราะอยู่ในตาราง ไม่ใช่ใน RAM' },
    { t: 'compare', cols: ['คำถาม', 'คำตอบ', 'หัวข้อ'], rows: [
      ['ทำไมต้องเก็บถาวร / เก็บแบบไหน', 'RAM หายได้ · prefs / ไฟล์ / SQLite', '[[13.1]] [[13.2]]'],
      ['ต้องใช้แพ็กเกจอะไร', 'sqflite, path (+ path_provider)', '[[13.3]]'],
      ['เปิดฐานข้อมูลที่ไหน ครั้งเดียวอย่างไร', 'DatabaseHelper Singleton, openDatabase', '[[13.4]]'],
      ['สร้างตาราง', 'CREATE TABLE ใน onCreate (ทำงานครั้งเดียว)', '[[13.5]]'],
      ['เพิ่ม/อ่าน/แก้/ลบ', 'insert/query/update/delete + where/whereArgs', '[[13.6]]'],
      ['Dart object ⇄ แถว', 'toMap/fromMap, bool/DateTime/enum/double', '[[13.7]]'],
      ['เปลี่ยนโครงสร้างหลังปล่อยแอป', 'version + onUpgrade `if (oldVersion < N)`', '[[13.8]]'],
      ['หลายคำสั่งต้องสำเร็จพร้อมกัน', 'transaction (txn เท่านั้น) + batch', '[[13.9]]'],
      ['ใช้คู่กับเครือข่าย', 'Repository + offline-first + 4 สถานะ', '[[13.10]] [[13.10.1]]'],
    ] },
    { t: 'callout', kind: 'exam', title: 'บทนี้คือแกนของข้อสอบ', body: 'โจทย์ซ้อมทั้ง 6 ข้อใน `exam_questions/` ยึดบทนี้เป็นหลัก — ดูเช็กลิสต์และแผนที่โจทย์ที่ [[exam|ชั้นเตรียมสอบ]] และ SQL ที่โจทย์ใช้แต่ตำราไม่ได้สอน (LIKE, COUNT/SUM, GROUP BY, JOIN, LIMIT/OFFSET) ที่ [[sql|SQL ที่โจทย์ใช้]]' },
  ],
  sections: [
    {
      id: '13.1', title: 'บทนำ: การบันทึกข้อมูลไว้ใช้ภายหลัง', source: '§13.1',
      gist: '“**ภาพลวงตาของความคงอยู่**” — เห็นบนจอปุ๊บเลยรู้สึกปลอดภัย แต่ข้อมูลอยู่ใน RAM ที่ต้องมีไฟเลี้ยงและ OS เรียกคืนได้ทุกเมื่อ · ต้องการ persistence เพื่อ: บันทึกข้อมูลผู้ใช้, ทำงานออฟไลน์, แคชเพิ่มประสิทธิภาพ',
      blocks: [
        { t: 'viz', id: 'ch13.ram', title: 'RAM vs ไฟล์บนดิสก์', try: 'เพิ่มโน้ต 2–3 รายการ → ปัดปิดแอป → เปิดใหม่ (หาย) · เปิดสวิตช์ “บันทึกลง SQLite” แล้วทำซ้ำ' },
        { t: 'list', items: [
          '**บันทึกข้อมูลผู้ใช้**: to-do, บันทึกส่วนตัว, การตั้งค่า, ความคืบหน้าในเกม',
          '**ทำงานแบบออฟไลน์**: เก็บข้อมูลจากเครือข่ายไว้ดูตอนไม่มีสัญญาณ',
          '**ปรับปรุงประสิทธิภาพ**: แคชข้อมูลที่ใช้บ่อย ลดการเรียกเครือข่าย',
        ] },
        'ทางเลือกมีหลายแบบ (shared_preferences, เขียนไฟล์, Firebase Firestore บนคลาวด์) — สำหรับข้อมูลที่มีโครงสร้างและความสัมพันธ์ที่เก็บในเครื่อง **SQLite** ทรงพลังและใช้กันแพร่หลาย (Android และ iOS มี SQLite ในตัว) โดยใช้แพ็กเกจ **sqflite** และ **path_provider**',
      ],
      quiz: [
        { q: 'ทำไมข้อมูลที่อยู่ใน Provider จึงหายเมื่อปิดแอป?', options: [
          { t: 'อยู่ใน RAM ของแอปเท่านั้น ซึ่งถูกคืนให้ระบบเมื่อแอปปิด', ok: true },
          { t: 'Provider ลบข้อมูลทิ้งเองทุกครั้ง', why: 'Provider ไม่ได้ลบ แค่ไม่ได้เก็บถาวร' },
          { t: 'เพราะไม่ได้เรียก notifyListeners', why: 'ไม่เกี่ยวกับการเก็บถาวร' },
        ] },
      ],
    },
    {
      id: '13.2', title: 'SQLite คืออะไร?', source: '§13.2',
      gist: 'SQLite = ฐานข้อมูล SQL แบบ **self-contained, serverless (ไฟล์เดียว), zero-configuration, transactional (ACID)** · เลือกที่เก็บตามรูปร่างข้อมูล: **prefs** = ค่าเดี่ยวไม่กี่ค่า · **ไฟล์** = ก้อนใหญ่อ่านทั้งก้อน · **SQLite** = หลายแถวโครงสร้างเดียวกัน ค้นหา/กรอง/เรียง/แก้ทีละแถว · SQLite **ไม่มี bool และวันที่**',
      blocks: [
        { t: 'kv', items: [
          ['Self-contained', 'แทบไม่ต้องพึ่ง dependency ภายนอก'],
          ['Serverless', 'ไม่มีเซิร์ฟเวอร์แยก — ทุกอย่าง (ตาราง ดัชนี ข้อมูล) อยู่ใน **ไฟล์เดียว**'],
          ['Zero-configuration', 'ไม่ต้องตั้งค่าหรือดูแลเหมือนฐานข้อมูลเซิร์ฟเวอร์'],
          ['Transactional (ACID)', 'Atomicity, Consistency, Isolation, Durability'],
          ['SQL', 'ใช้ภาษา SQL มาตรฐาน'],
        ] },
        { t: 'viz', id: 'sorter', title: 'เลือกที่เก็บให้เหมาะกับข้อมูล', props: {
          buckets: [{ id: 'p', label: 'shared_preferences' }, { id: 'f', label: 'ไฟล์' }, { id: 's', label: 'SQLite' }],
          items: [
            { t: 'โหมดมืด/สว่างที่ผู้ใช้เลือก', bucket: 'p', why: 'ค่าเดี่ยว อ่านด้วยชื่อคีย์' },
            { t: 'เคยเปิดหน้าแนะนำแอปแล้วหรือยัง', bucket: 'p', why: 'ค่า bool เดี่ยว' },
            { t: 'รูปโปรไฟล์ที่ดาวน์โหลดมา', bucket: 'f', why: 'ก้อนใหญ่ อ่านทั้งก้อน' },
            { t: 'รายการรายรับ-รายจ่ายหลายพันรายการที่ต้องค้นหาและแก้ทีละรายการ', bucket: 's', why: 'หลายแถว โครงสร้างเดียวกัน ค้นหา/แก้ทีละแถว' },
            { t: 'รายการสินค้าที่ดึงจากเซิร์ฟเวอร์ไว้ดูตอนออฟไลน์', bucket: 's', why: 'ตำรายกตัวอย่างนี้โดยตรง' },
          ] } },
        { t: 'viz', id: 'ch13.filevs', title: 'ทำไมไม่เขียนทุกอย่างลงไฟล์ข้อความ', try: 'กดแก้ยอด แล้วลองเปิด “ไฟดับกลางทาง”' },
        { t: 'callout', kind: 'warn', title: 'ชนิดข้อมูลน้อยกว่า Dart มาก', body: 'SQLite **ไม่มี boolean และไม่มีชนิดวันที่** และ sqflite รับได้แค่ **ตัวเลข ข้อความ และไบนารี** — ชนิดอื่นต้องแปลงก่อนบันทึกเสมอ ([[13.7]])' },
      ],
      quiz: [
        { q: 'ข้อมูลแบบใดเหมาะกับ SQLite ที่สุดตามตำรา?', options: [
          { t: 'รายการบันทึกหลายพันแถวที่ต้องค้นหา กรอง และแก้ทีละแถว', ok: true },
          { t: 'ภาษาที่ผู้ใช้เลือก', why: 'ค่าเดี่ยว → shared_preferences' },
          { t: 'ไฟล์ PDF ที่ดาวน์โหลด', why: 'ก้อนใหญ่อ่านทั้งก้อน → ไฟล์' },
        ] },
        { q: 'คำว่า “serverless” ของ SQLite หมายถึง?', options: [
          { t: 'ไม่มีโปรเซสเซิร์ฟเวอร์แยก ฐานข้อมูลทั้งหมดอยู่ในไฟล์เดียวบนเครื่อง', ok: true },
          { t: 'ข้อมูลอยู่บนคลาวด์', why: 'ตรงข้าม — อยู่ในเครื่อง' },
          { t: 'ไม่ต้องใช้ SQL', why: 'ใช้ SQL' },
        ] },
      ],
    },
    {
      id: '13.3', title: 'แพ็กเกจที่จำเป็น: sqflite และ path_provider', source: '§13.3',
      gist: '`sqflite` = API เปิดฐานข้อมูล รัน SQL และ CRUD · `path_provider` = หาโฟลเดอร์มาตรฐานของแอป · `path` = `join()` ต่อชื่อไฟล์เข้ากับโฟลเดอร์ (แลปใช้ `getDatabasesPath()` ของ sqflite จึงไม่ต้องใช้ path_provider)',
      blocks: [
        { t: 'code', lang: 'yaml', title: 'pubspec.yaml (ตำรา §13.3)', src: `dependencies:
  flutter:
    sdk: flutter
  path: ^1.9.1              # สำหรับ join() ต่อชื่อไฟล์เข้ากับโฟลเดอร์
  provider: ^6.1.5+1        # จากบทที่ 10
  http: ^1.6.0              # จากบทที่ 12
  sqflite: ^2.4.4           # เพิ่ม sqflite (ตรวจสอบเวอร์ชันล่าสุด)
  path_provider: ^2.1.6     # เพิ่ม path_provider (ตรวจสอบเวอร์ชันล่าสุด)` },
        { t: 'viz', id: 'ch13.packages', title: 'API นี้มาจากแพ็กเกจไหน', try: 'ชี้ชื่อ API ทีละตัว' },
        { t: 'callout', kind: 'supp', title: 'sqflite รันบนแพลตฟอร์มไหน', body: 'sqflite ทำงานบน **Android, iOS, macOS** · รันด้วย `flutter run -d chrome` หรือ `-d linux/windows` จะได้ `MissingPluginException` (ต้องใช้ `sqflite_common_ffi` / `sqflite_common_ffi_web` แทน) — สอบให้รันบน emulator Android หรือเครื่องจริง' },
      ],
      quiz: [
        { q: 'ฟังก์ชัน `join(dir, \'MyNotes.db\')` มาจากแพ็กเกจใด?', options: [
          { t: '`path`', ok: true },
          { t: '`sqflite`', why: 'sqflite ให้ openDatabase, getDatabasesPath' },
          { t: '`path_provider`', why: 'path_provider ให้ getApplicationDocumentsDirectory' },
        ] },
      ],
    },
    {
      id: '13.4', title: 'รูปแบบ Database Helper และ Singleton', source: '§13.4–13.4.2', exam: true,
      gist: '**DatabaseHelper** รวมตรรกะฐานข้อมูลไว้ที่เดียว + **Singleton** ให้มีอินสแตนซ์เดียว (`DatabaseHelper.instance`) · เหตุผล 3 ข้อ: **เปิดไฟล์มีต้นทุน** (เปิดครั้งเดียว), **ผู้ดูแล onCreate/onUpgrade คนเดียว**, **SQLite เขียนได้ทีละราย** (กัน `database is locked`) · path ต้องถาม OS (sandbox) และ **ห้ามเปลี่ยนหลังปล่อยแอป**',
      blocks: [
        { t: 'callout', kind: 'analogy', title: 'ห้องนิรภัยประตูบานเดียว (จากตำรา)', body: 'ไฟล์ .db คือห้องนิรภัย ถ้าทุกหน้าจอทำกุญแจของตัวเองไขเข้าเมื่อไรก็ได้ จะไม่มีใครรับผิดชอบจริง — Singleton คือกฎว่าทั้งบริษัทมี **กุญแจดอกเดียว** ถือโดยผู้จัดการคนเดียวคือ `DatabaseHelper.instance` ทุกคำสั่งจึงวิ่งผ่านท่อเดียวกันอย่างเป็นระเบียบ' },
        { t: 'viz', id: 'ch13.singleton', title: 'Singleton · การเปิดพร้อมกัน · ตำแหน่งไฟล์', try: 'สลับสองโหมดแล้วกด “3 หน้าจอบันทึกพร้อมกัน” · ด้านล่างกด “เรียกพร้อมกัน” ทั้งสองแบบ · สลับวิธีหา path แล้วดูว่าข้อมูลผู้ใช้เป็นอย่างไร' },
        { t: 'code', title: 'lib/helpers/database_helper.dart (ตำรา §13.4.1)', src: `import 'dart:io';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';

class DatabaseHelper {
  static const _databaseName = "MyNotes.db";
  static const _databaseVersion = 1;

  // ทำให้คลาสนี้เป็น Singleton
  DatabaseHelper._privateConstructor();
  static final DatabaseHelper instance = DatabaseHelper._privateConstructor();

  // มี reference ไปยังฐานข้อมูลเพียงหนึ่งเดียว
  static Database? _database;
  Future<Database> get database async {
    if (_database != null) return _database!;
    // หาก _database เป็น null จะทำการ initialize ให้
    _database = await _initDatabase();
    return _database!;
  }

  // เมธอดสำหรับเปิดฐานข้อมูล (หรือสร้างขึ้นใหม่ถ้ายังไม่มี)
  Future<Database> _initDatabase() async {
    Directory documentsDirectory = await getApplicationDocumentsDirectory();
    String path = join(documentsDirectory.path, _databaseName);
    print('Database path: $path'); // แสดง path ของฐานข้อมูลใน console
    return await openDatabase(
      path,
      version: _databaseVersion,
      onCreate: _onCreate, // จะถูกเรียกเมื่อฐานข้อมูลถูกสร้างขึ้นครั้งแรก
    );
  }

  // เมธอดสำหรับสร้างตาราง (จะเพิ่มโค้ดในภายหลัง)
  Future<void> _onCreate(Database db, int version) async {
    print('onCreate ถูกเรียก: กำลังจะสร้างตาราง...');
  }
}`, notes: [
          { at: 'DatabaseHelper._privateConstructor();', note: 'constructor แบบ **private** (มี `_`) — ไฟล์อื่นสร้าง `DatabaseHelper()` เองไม่ได้' },
          { at: 'static final DatabaseHelper instance', note: 'อินสแตนซ์เดียวของทั้งแอป เข้าถึงผ่าน `DatabaseHelper.instance`' },
          { at: 'static Database? _database;', note: 'nullable ตอนแรก — เปิดแบบ lazy ตอนมีคนขอครั้งแรก' },
          { at: 'if (_database != null) return _database!;', note: '**ช่องโหว่ (เสริม)**: ถ้าสองที่เรียก getter พร้อมกันก่อนเปิดเสร็จ ทั้งคู่เห็น null แล้วเปิดสองครั้ง — แก้ด้วยการเก็บ **Future** (`_dbFuture ??= _initDatabase()`) ดูภาพด้านบน' },
          { at: 'Directory documentsDirectory = await getApplicationDocumentsDirectory();', note: 'ถาม OS ว่าโฟลเดอร์ไหนคือ “บ้านพักที่ปลอดภัย” ของแอป (sandbox) — ไม่ถูกลบเหมือน cache' },
          { at: 'onCreate: _onCreate,', note: 'ถูกเรียก **เฉพาะครั้งแรก** ที่ไฟล์ถูกสร้าง' },
          { at: 'Future<Database> _initDatabase() async {', note: 'ตำราย้ำ: **ระบุชนิดคืนค่าทุกเมธอด** ถ้าละไว้ Dart ถือเป็น dynamic → คืนผิดชนิดก็ไม่เตือน ไปพังตอนรัน' },
        ] },
        { t: 'why', choice: 'ใช้ **DatabaseHelper แบบ Singleton** เป็นจุดเข้าถึงฐานข้อมูลจุดเดียว',
          because: ['การเปิดไฟล์มีต้นทุน → เปิดครั้งเดียวใช้ตลอดอายุแอป', 'ต้องมีผู้รับผิดชอบสร้างตาราง/เปลี่ยนโครงสร้าง (onCreate/onUpgrade) **จุดเดียว**', 'SQLite ยอมให้ **เขียนได้ทีละราย** — หลายการเชื่อมต่อเขียนพร้อมกัน ตัวที่มาทีหลังต้องรอ ถ้ารอนานได้ `database is locked` · การเชื่อมต่อเดียวทำให้คำสั่งเข้าคิวกันเอง'],
          alts: [
            { alt: 'ทำไมแต่ละหน้าจอไม่เปิดฐานข้อมูลเองตอนต้องใช้?', result: 'ไม่มีใครรับผิดชอบจริง โค้ดสร้างตารางกระจายหลายที่ และเสี่ยง `database is locked`', ok: '(sqflite จะคืนการเชื่อมต่อเดิมให้เมื่อเปิดไฟล์เดิมซ้ำ แต่การพึ่งพฤติกรรมนี้โดยไม่มีผู้ดูแลกลาง ทำให้โค้ดสร้างตารางกระจาย — ตำรา)' },
          ] },
        { t: 'why', choice: 'ให้ `getApplicationDocumentsDirectory()` หรือ `getDatabasesPath()` หาโฟลเดอร์ — และ **ห้ามเปลี่ยนวิธีหลังปล่อยแอป**',
          because: ['Android/iOS ใช้ **sandboxing** — แอปเขียนนอกพื้นที่ตัวเองไม่ได้ และโครงสร้างโฟลเดอร์สองระบบไม่เหมือนกัน', 'เลือกแบบไหนก็ได้ (ตำราใช้แบบแรก แลปใช้แบบหลัง)'],
          alts: [
            { alt: 'ทำไมไม่กำหนด path เองแบบบนคอมพิวเตอร์ (เช่น C:\\Documents)?', result: 'มือถือไม่มีโฟลเดอร์แบบนั้น และแอปเขียนนอก sandbox ไม่ได้' },
            { alt: 'ถ้าเปลี่ยนจาก getApplicationDocumentsDirectory เป็น getDatabasesPath ในเวอร์ชันถัดไปล่ะ?', result: '`openDatabase` สร้าง **ไฟล์ว่างใหม่** ที่ตำแหน่งใหม่ — ผู้ใช้เห็นข้อมูลเดิมหายทั้งหมด' },
          ] },
        { t: 'h', text: '13.4.2 ทดสอบการเชื่อมต่อ' },
        { t: 'code', title: 'ปุ่มทดสอบ + สิ่งที่คาดว่าจะเห็นใน console', src: `void _testInitDatabase() async {
  // การเข้าถึง getter 'database' จะเป็นการกระตุ้น _initDatabase()
  final db = await DatabaseHelper.instance.database;
  print('Database initialized: \${db.path}');
  print('Database is open: \${db.isOpen}');
}

// Console:
// I/flutter ( 1234): Database path: /data/user/0/com.example.sqlite_lab/app_flutter/MyNotes.db
// I/flutter ( 1234): onCreate ถูกเรียก: กำลังจะสร้างตาราง...
// I/flutter ( 1234): Database initialized: /data/user/0/com.example.sqlite_lab/app_flutter/MyNotes.db
// I/flutter ( 1234): Database is open: true` },
      ],
      quiz: [
        { type: 'multi', q: 'เหตุผลทางเทคนิคของการใช้ Singleton ตามตำรา (เลือกทุกข้อที่ถูก)', options: [
          { t: 'การเปิดไฟล์ฐานข้อมูลมีต้นทุน ควรเปิดครั้งเดียว', ok: true },
          { t: 'มีผู้รับผิดชอบ onCreate/onUpgrade จุดเดียว', ok: true },
          { t: 'SQLite เขียนได้ทีละราย การเชื่อมต่อเดียวทำให้คำสั่งเข้าคิว', ok: true },
          { t: 'ทำให้ข้อมูลถูกเข้ารหัส', why: 'ไม่เกี่ยว' },
        ] },
        { q: 'แอปเวอร์ชัน 1 ใช้ `getApplicationDocumentsDirectory()` เวอร์ชัน 2 เปลี่ยนเป็น `getDatabasesPath()` ผู้ใช้เดิมจะเจออะไร?', options: [
          { t: 'ข้อมูลเดิม “หาย” เพราะ openDatabase สร้างไฟล์ว่างใหม่ที่ตำแหน่งใหม่', ok: true },
          { t: 'ข้อมูลถูกย้ายให้อัตโนมัติ', why: 'ไม่มีการย้ายให้' },
          { t: 'แอป error ทันที', why: 'ไม่ error — เปิดไฟล์ใหม่ได้ปกติ ซึ่งแย่กว่า' },
        ] },
        { q: 'ทำไม getter `database` แบบ `if (_database != null) return …; _database = await _initDatabase();` จึงอาจเปิดฐานข้อมูลสองครั้ง? (เสริม)', options: [
          { t: 'ถ้าสองที่เรียกพร้อมกันก่อนเปิดเสร็จ ทั้งคู่ยังเห็น `_database == null`', ok: true },
          { t: 'เพราะ openDatabase เปิดสองครั้งเสมอ', why: 'ไม่ใช่' },
          { t: 'เป็นไปไม่ได้', why: 'เกิดได้ เพราะมี await คั่นก่อนกำหนดค่า' },
        ] },
      ],
    },
    {
      id: '13.5', title: 'การสร้างตาราง', source: '§13.5–13.5.1', exam: true,
      gist: 'ใน `_onCreate` ใช้ `db.execute(\'\'\'CREATE TABLE …\'\'\')` · ชนิด: **INTEGER**→int, **TEXT**→String, **REAL**→double, **BLOB**→Uint8List · constraint: PRIMARY KEY, AUTOINCREMENT, NOT NULL, UNIQUE, DEFAULT, FOREIGN KEY · **onCreate ทำงานครั้งเดียวต่อไฟล์** — แก้แล้วไม่มีผลกับเครื่องที่มีไฟล์อยู่แล้ว',
      blocks: [
        { t: 'code', lang: 'sql', title: 'ไวยากรณ์พื้นฐาน', src: `CREATE TABLE table_name (
  column1_name DATATYPE column1_constraints,
  column2_name DATATYPE column2_constraints,
  ...
  table_constraints
);` },
        { t: 'compare', cols: ['ชนิด SQLite', 'Dart', 'หมายเหตุ'], rows: [
          ['INTEGER', '`int`', 'มักใช้กับ id · bool เก็บเป็น 0/1'],
          ['TEXT', '`String`', 'DateTime เก็บเป็น ISO-8601 · enum เก็บ `.name`'],
          ['REAL', '`double`', 'อ่านกลับด้วย `(x as num).toDouble()`'],
          ['BLOB', '`Uint8List`', 'ข้อมูลไบนารี'],
          ['NUMERIC', '—', 'เก็บได้หลากหลาย ไม่แนะนำให้ใช้บ่อย'],
        ] },
        { t: 'kv', items: [
          ['PRIMARY KEY', 'คีย์หลัก (ไม่ซ้ำ) มักใช้กับ id'],
          ['AUTOINCREMENT', 'ใช้กับ `INTEGER PRIMARY KEY` เท่านั้น — SQLite สร้าง id ให้ ไม่ต้องระบุตอน insert'],
          ['NOT NULL', 'ห้ามเป็น NULL'],
          ['UNIQUE', 'ค่าในคอลัมน์ห้ามซ้ำ'],
          ['DEFAULT value', 'ค่าเริ่มต้นเมื่อไม่ระบุตอน insert'],
          ['FOREIGN KEY', '(table constraint) อ้างอิงแถวในอีกตาราง'],
        ] },
        { t: 'viz', id: 'ch13.create', title: 'สร้างตารางด้วย SQLite จริง', try: 'ปรับคอลัมน์ → “สร้างตาราง” → ทดสอบ insert ทั้ง 3 ปุ่ม (ปุ่มที่ 2 ชน NOT NULL) · เปิด UNIQUE ที่ title แล้วสร้างใหม่ ปุ่มที่ 3 จะชน UNIQUE' },
        { t: 'code', title: '_onCreate สร้างตาราง notes (ตำรา §13.5.1)', src: `// ภายในคลาส DatabaseHelper
Future _onCreate(Database db, int version) async {
  print('onCreate ถูกเรียก: กำลังจะสร้างตาราง notes...');
  await db.execute('''
    CREATE TABLE notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL
    )
    ''');
  print('ตาราง notes ถูกสร้างแล้ว');
}`, notes: [
          { at: 'Future _onCreate(Database db, int version) async {', note: 'ตำราเขียน `Future` ไม่มีชนิดข้างใน ซึ่งขัดกับกฎ “ระบุชนิดคืนค่าทุกเมธอด” ของตำราเอง — ควรเป็น `Future<void>` (หัวข้อ 13.8 เขียนถูกแล้ว)' },
          { at: "await db.execute('''", note: "`'''` = สตริงหลายบรรทัดของ Dart" },
        ] },
        { t: 'viz', id: 'ch13.oncreate', title: 'onCreate ทำงานครั้งเดียวต่อไฟล์', try: 'กดขั้นต่อไปจนจบ' },
        { t: 'callout', kind: 'exam', title: 'ถอนการติดตั้ง = ทางลัดเฉพาะเครื่องนักพัฒนา', body: 'ระหว่างพัฒนา ถ้าแก้ CREATE TABLE แล้วอยากให้ onCreate ทำงานใหม่ ให้ uninstall แล้วรัน — **แต่นี่คือการลบข้อมูลทั้งหมดของผู้ใช้** เมื่อแอปถูกใช้จริงแล้วต้องใช้ `onUpgrade` ([[13.8]])' },
      ],
      quiz: [
        { q: 'แก้ `CREATE TABLE` ใน `_onCreate` เพิ่มคอลัมน์ แล้วกด Run ทับแอปเดิม (ไม่ uninstall) ผลคือ?', options: [
          { t: 'ตารางในเครื่องยังเป็นแบบเดิม เพราะ onCreate ทำงานเฉพาะตอนไฟล์ถูกสร้าง', ok: true },
          { t: 'ตารางถูกอัปเดตอัตโนมัติ', why: 'ต้องใช้ onUpgrade' },
          { t: 'ข้อมูลหายทั้งหมด', why: 'ไม่หาย แต่โครงสร้างไม่เปลี่ยน' },
        ] },
        { q: '`AUTOINCREMENT` ใช้ได้กับคอลัมน์แบบใด?', options: [
          { t: '`INTEGER PRIMARY KEY`', ok: true },
          { t: 'TEXT ใดๆ', why: 'ใช้กับ INTEGER PRIMARY KEY เท่านั้น' },
          { t: 'ทุกคอลัมน์ที่ NOT NULL', why: 'ไม่เกี่ยวกัน' },
        ] },
      ],
    },
    {
      id: '13.6', title: 'การดำเนินการ CRUD', source: '§13.6.1–13.6.4', exam: true,
      gist: '`db.insert(table, map)` → **id ใหม่** · `db.query(table, where:, whereArgs:, orderBy:, limit:, offset:)` → `List<Map>` · `db.update(table, values, where:, whereArgs:)` → **จำนวนแถวที่แก้** · `db.delete(table, where:, whereArgs:)` → **จำนวนแถวที่ลบ** · **กฎเหล็ก: update/delete ต้องมี where เสมอ** · ค่าจากผู้ใช้/เครือข่ายต้องเข้าทาง **`?` + whereArgs** เท่านั้น',
      blocks: [
        { t: 'viz', id: 'ch13.crud', name: 'crud', title: 'CRUD กับตาราง notes จริง', try: 'insert → update id 2 → delete id 3 · จากนั้นเปิด “ลืมใส่ where” แล้วกด update (ทุกแถวถูกเขียนทับ) และ delete' },
        { t: 'code', title: 'เมธอด CRUD ใน DatabaseHelper', src: `// Create/Insert
Future<int> insert(Map<String, dynamic> row) async {
  Database db = await instance.database;
  // db.insert จะคืนค่า id ของแถวที่ถูกเพิ่มล่าสุด
  return await db.insert('notes', row);
}

// Read/Query
Future<List<Map<String, dynamic>>> queryAllRows() async {
  Database db = await instance.database;
  // orderBy ช่วยให้เราเรียงลำดับผลลัพธ์ (เรียงตาม id จากมากไปน้อย)
  return await db.query('notes', orderBy: 'id DESC');
}

// Update
Future<int> update(Map<String, dynamic> row) async {
  Database db = await instance.database;
  int id = row['id'];
  // db.update จะคืนค่าจำนวนแถวที่ได้รับผลกระทบ
  return await db.update('notes', row, where: 'id = ?', whereArgs: [id]);
}

// Delete
Future<int> delete(int id) async {
  Database db = await instance.database;
  // db.delete จะคืนค่าจำนวนแถวที่ถูกลบ
  return await db.delete('notes', where: 'id = ?', whereArgs: [id]);
}`, notes: [
          { at: "return await db.insert('notes', row);", note: 'คืน `Future<int>` = **id** ของแถวใหม่ (ไม่ใช่จำนวนแถว)' },
          { at: "return await db.query('notes', orderBy: 'id DESC');", note: 'คืน `List<Map<String, dynamic>>` — แต่ละ Map คือหนึ่งแถว (**อ่านอย่างเดียว** แก้ค่าในนั้นตรงๆ ไม่ได้)' },
          { at: "return await db.update('notes', row, where: 'id = ?', whereArgs: [id]);", note: 'คืน **จำนวนแถวที่ถูกแก้** · ไม่มี where = แก้ **ทุกแถว**' },
          { at: "return await db.delete('notes', where: 'id = ?', whereArgs: [id]);", note: 'คืน **จำนวนแถวที่ถูกลบ** · ไม่มี where = ลบ **ทุกแถว**' },
        ] },
        { t: 'kv', items: [
          ['table', 'ชื่อตาราง'],
          ['columns', '`List<String>` คอลัมน์ที่ต้องการ (null = ทุกคอลัมน์ `*`)'],
          ['where', 'เงื่อนไข WHERE เป็นสตริง ใช้ `?` เป็น placeholder'],
          ['whereArgs', '`List` ของค่าที่จะแทน `?` ตามลำดับ (ป้องกัน SQL Injection)'],
          ['groupBy / having / orderBy', 'จัดกลุ่ม / กรองหลังจัดกลุ่ม / เรียงลำดับ'],
          ['limit / offset', 'จำกัดจำนวน / ข้ามแถว (pagination) — ดู [[sql/paging]]'],
          ['conflictAlgorithm', '(update/insert) วิธีจัดการเมื่อชน constraint — ดู [[sql/upsert]]'],
        ] },
        { t: 'callout', kind: 'exam', title: 'กฎเหล็กของ update() และ delete() (จากตำรา)', body: '“ฐานข้อมูลเป็นเครื่องจักรที่ซื่อตรงมาก มันทำตามคำสั่งตรงตัวอักษรโดยไม่ถามซ้ำ” — ลืม where ใน `delete` = **ลบทุกแถว** (ประวัติการเงินทั้งหมดหายในเสี้ยววินาที) · ลืม where ใน `update` = **เขียนทับทุกแถวด้วยค่าเดียวกัน** · ตรวจทุกครั้งว่ามี `where` และ `whereArgs` ครบ', },
        { t: 'h', text: 'ทำไมต้อง ? กับ whereArgs' },
        { t: 'viz', id: 'ch13.inject', title: 'SQL Injection บน SQLite จริง', try: "ลองค่า `x' OR '1'='1` (ฝั่งซ้ายได้ทุกแถว ฝั่งขวาได้ 0) และ `ร้านของ O'Brien` (ฝั่งซ้าย SQL พัง ฝั่งขวาหาเจอ)" },
        { t: 'code', title: 'อันตราย vs ปลอดภัย (ตำรา §13.6.2)', src: `// อันตราย: ข้อความของผู้ใช้กลายเป็นส่วนหนึ่งของคำสั่ง SQL
// ถ้าผู้ใช้พิมพ์ x' OR '1'='1 เงื่อนไขจะเป็นจริงทุกแถว
final rows = await db.rawQuery(
  "SELECT * FROM notes WHERE title = '$keyword'",
);

// ปลอดภัย: ? เป็นช่องว่างให้ sqflite ใส่ค่าให้เอง ค่านั้นเป็นข้อมูลเสมอ ไม่ใช่คำสั่ง
final safeRows = await db.query(
  'notes',
  where: 'title = ?',
  whereArgs: [keyword],
);` },
        { t: 'why', choice: 'ส่งค่าผ่าน **`?` + `whereArgs`** เสมอ (ทั้ง `query()` และ `rawQuery(sql, [args])`)',
          because: ['SQLite **เตรียมคำสั่งที่มี `?` ให้พร้อมทำงานก่อน** โดยยังไม่รู้ค่าจริง แล้วค่อย **ผูก (bind) ค่าเข้าไปในฐานะข้อมูล** — ค่านั้นจึงไม่มีทางถูกอ่านเป็นส่วนของคำสั่ง ไม่ว่าจะมี `\'` หรือ `DROP TABLE` อยู่ข้างใน'],
          alts: [
            { alt: 'ทำไมไม่ใช้ `$keyword` ต่อสตริงแล้วระวังเอา?', result: 'ผู้ใช้พิมพ์ `\'` ธรรมดา (เช่นชื่อ O\'Brien) คำสั่งก็พัง · พิมพ์อย่างจงใจกลายเป็นคำสั่ง SQL — ช่องโหว่ **SQL Injection**' },
            { alt: '“? ทำให้ระบบ sanitize ข้อมูลให้” — ถูกไหม?', result: 'ไม่ตรงกลไกจริง — **ไม่มีการแก้หรือกรองข้อมูลเลย** เครื่องหมาย `\'` ที่ผู้ใช้พิมพ์ถูกเก็บลงฐานข้อมูลตามจริงทุกตัว สิ่งที่ปกป้องคือการ “ผูกค่าแยกจากคำสั่ง”' },
          ] },
        { t: 'h', text: 'ทดสอบใน UI (ตำรา §13.6)' },
        { t: 'code', title: 'refresh หลัง await ต้องเช็ก mounted', src: `void _refreshNotes() async {
  final data = await dbHelper.queryAllRows();
  // ระหว่างรอ ผู้ใช้อาจออกจากหน้าจอไปแล้ว (บทที่ 12 หัวข้อ 12.2)
  if (!mounted) return;
  setState(() { // ใช้ setState เพื่ออัปเดต UI
    _allNotes = data;
  });
}

// ใน ListTile
trailing: Row(
  mainAxisSize: MainAxisSize.min, // ทำให้ Row ใช้พื้นที่น้อยที่สุด
  children: [
    IconButton(icon: const Icon(Icons.edit, color: Colors.blue), onPressed: () => _update(note['id'])),
    IconButton(icon: const Icon(Icons.delete, color: Colors.red), onPressed: () => _delete(note['id'])),
  ],
),`, notes: [
          { at: 'mainAxisSize: MainAxisSize.min,', note: 'Row ใน trailing ต้องกว้างเท่าที่จำเป็น ไม่งั้นแย่งพื้นที่ title' },
          { at: "onPressed: () => _update(note['id'])", note: "`note['id']` — อ่านจาก Map ดิบ พิมพ์คีย์ผิดไม่มีใครเตือน → แก้ด้วย Model ใน [[13.7]]" },
        ] },
        { t: 'callout', kind: 'note', title: 'ทดสอบการคงอยู่ของข้อมูลให้ถูก', body: 'หลังเพิ่ม/แก้/ลบ ให้ **ปิดแอปแล้วเปิดใหม่** (ไม่ใช่แค่ Hot Reload) แล้วดูว่าข้อมูลยังตรงกับก่อนปิด — เป็นข้อทดสอบบังคับในเช็กลิสต์ข้อสอบ ([[exam]])' },
      ],
      quiz: [
        { q: '`db.insert(\'notes\', row)` คืนค่าอะไร?', options: [
          { t: 'id ของแถวที่ถูกเพิ่ม', ok: true },
          { t: 'จำนวนแถวที่เพิ่ม', why: 'นั่นไม่ใช่สิ่งที่ insert คืน (update/delete คืนจำนวนแถว)' },
          { t: 'Map ของแถวใหม่', why: 'คืน int' },
        ] },
        { type: 'spot', q: 'เมธอดนี้มีบั๊กร้ายแรง — บรรทัดไหน?', code: `Future<int> deleteNote(int id) async {
  final db = await instance.database;
  return await db.delete('notes');
}`, bad: "return await db.delete('notes');", explain: 'ไม่มี `where: \'id = ?\', whereArgs: [id]` → **ลบทุกแถวในตาราง**' },
        { type: 'spot', q: 'ฟังก์ชันค้นหานี้มีช่องโหว่ — บรรทัดไหน?', code: `Future<List<Map<String, Object?>>> search(String kw) async {
  final db = await instance.database;
  return db.rawQuery(
    "SELECT * FROM notes WHERE title LIKE '%$kw%'",
  );
}`, bad: `"SELECT * FROM notes WHERE title LIKE '%$kw%'",`, explain: 'ต่อข้อความผู้ใช้เข้าไปในคำสั่ง → SQL Injection · ที่ถูก: `rawQuery("... WHERE title LIKE ?", [\'%$kw%\'])` (สร้าง “ค่า” ที่มี % แล้วส่งผ่าน args — ดู [[sql/like]])' },
        { q: '`db.update(...)` คืนค่า 0 หมายความว่าอะไร?', options: [
          { t: 'ไม่มีแถวใดตรงกับเงื่อนไข where (ไม่ได้แก้อะไร)', ok: true },
          { t: 'แก้สำเร็จ', why: '0 แถวคือไม่ได้แก้อะไร' },
          { t: 'แก้ทุกแถว', why: 'จะได้จำนวนแถวทั้งหมด' },
        ] },
      ],
    },
    {
      id: '13.7', title: 'การแปลงข้อมูลระหว่าง Map กับ Model Class', source: '§13.7', exam: true,
      gist: 'Model + `toMap()` (ถอดอ็อบเจกต์เป็นกล่องมีป้าย) + `factory fromMap()` (คู่มือประกอบกลับ) · **`id` เป็น `int?` และใส่ใน toMap เฉพาะเมื่อไม่ null** (ไม่งั้น update ได้ `datatype mismatch`) · **bool**→1/0 · **DateTime**→ISO TEXT · **enum**→`.name` / `values.byName()` (ห้าม `.index`) · **double**←`(x as num).toDouble()`',
      blocks: [
        { t: 'callout', kind: 'analogy', title: 'ส่งตู้เฟอร์นิเจอร์ข้ามทะเล (จากตำรา)', body: 'ปัญหาเบื้องหลังชื่อ **Object-Relational Impedance Mismatch** — โลก Dart มีคลาส/ฟิลด์/ชนิด ส่วนโลก SQL มีตาราง/แถว/คอลัมน์ชนิดไม่กี่แบบ จึงต้องมีล่าม · ตู้ทั้งใบใส่เรือไม่ได้ ต้องถอดเป็นชิ้นใส่กล่องมีป้าย (= `toMap()`) แล้วปลายทางมีคู่มือประกอบกลับ (= `fromMap()`)' },
        { t: 'viz', id: 'ch13.mapper', name: 'mapper', title: 'Model ⇄ Map ⇄ แถว (SQLite จริง)', try: 'insert แล้ว update ตามปกติ → เปิด “toMap ใส่ id เสมอ” แล้ว update (datatype mismatch จริงจาก SQLite) → รีเซ็ต เปิด “enum เก็บ .index” insert แล้วกด “เพิ่มค่า transfer ไว้กลาง enum”' },
        { t: 'code', title: 'lib/models/note.dart (ตำรา §13.7)', src: `class Note {
  final int? id; // null เมื่อยังไม่เคยบันทึก ฐานข้อมูลเป็นผู้กำหนดให้ตอน insert
  final String title;
  final String content;

  const Note({this.id, required this.title, required this.content});

  Map<String, Object?> toMap() {
    return {
      if (id != null) 'id': id, // ใส่ id เฉพาะเมื่อมีค่า
      'title': title,
      'content': content,
    };
  }

  factory Note.fromMap(Map<String, Object?> map) {
    return Note(
      id: map['id'] as int,
      title: map['title'] as String,
      content: map['content'] as String,
    );
  }
}`, notes: [
          { at: 'final int? id;', note: '`int?` เพราะ **ก่อน insert ยังไม่มี id** — ฐานข้อมูลเป็นคนกำหนด' },
          { at: "if (id != null) 'id': id,", note: '**collection-if** — ใส่คีย์นี้เฉพาะเมื่อเงื่อนไขจริง ([[dart]]) · toMap ตัวเดียวจึงใช้ได้ทั้ง insert และ update' },
          { at: "id: map['id'] as int,", note: 'แถวที่อ่านจากฐานข้อมูลมี id เสมอ จึง cast เป็น `int` ได้' },
        ] },
        { t: 'why', choice: "ใส่ `'id'` ใน toMap **เฉพาะเมื่อไม่ใช่ null**",
          because: ['insert: ไม่ส่ง id → SQLite สร้างให้', 'update: ส่ง id เดิมหรือไม่ส่งก็ได้ (ใช้ where ระบุแถว)'],
          alts: [
            { alt: "ทำไมไม่เขียน `'id': id` ตรงๆ ทุกครั้ง?", result: "insert ส่ง null ไป SQLite ยอมรับและสร้างเลขให้ (เลยดูเหมือนไม่มีปัญหา) แต่ **update** จะกลายเป็น `UPDATE … SET id = NULL` → SQLite ปฏิเสธด้วย **`datatype mismatch`**", viz: { name: 'mapper', mode: 'alwaysId' } },
          ] },
        { t: 'code', title: 'DatabaseHelper ที่รับ/คืน Note แทน Map', src: `Future<int> insertNote(Note note) async {
  final db = await database;
  return db.insert('notes', note.toMap());
}

Future<List<Note>> queryAllNotes() async {
  final db = await database;
  final rows = await db.query('notes', orderBy: 'id DESC');
  return rows.map(Note.fromMap).toList();
}

Future<int> updateNote(Note note) async {
  final db = await database;
  return db.update('notes', note.toMap(), where: 'id = ?', whereArgs: [note.id]);
}`, notes: [
          { at: 'return rows.map(Note.fromMap).toList();', note: '`Note.fromMap` ส่งเป็น tear-off ได้ เพราะรับ Map หนึ่งตัวคืน Note · แปลงทันทีที่อ่าน = ตัดปัญหา Map อ่านอย่างเดียวไปด้วย' },
        ] },
        { t: 'compare', cols: ['ชนิด Dart', 'เก็บเป็น', 'toMap', 'fromMap'], rows: [
          ['`bool`', 'INTEGER 1/0', "`'is_done': isDone ? 1 : 0`", "`map['is_done'] == 1`"],
          ['`DateTime`', 'TEXT (ISO-8601) หรือ INTEGER (epoch)', "`date.toIso8601String()`", "`DateTime.parse(map['date'] as String)`"],
          ['`enum`', 'TEXT', "`type.name`", "`TransactionType.values.byName(map['type'] as String)`"],
          ['`double`', 'REAL', "`amount`", "`(map['amount'] as num).toDouble()`"],
          ['`int?` id', 'INTEGER PK', "`if (id != null) 'id': id`", "`map['id'] as int`"],
        ] },
        { t: 'callout', kind: 'real', title: 'ถ้าเผลอส่ง bool เข้า toMap ตรงๆ', body: 'ตรวจซอร์สในเครื่อง: `sqflite_common 2.5.13` ยัง **ไม่โยน** แต่พิมพ์ `*** WARNING *** Invalid argument true with type bool … This will throw an exception in the future` แล้ว `sqflite_android` แปลงเป็น 1/0 ให้ — แอปดูเหมือนทำงานได้ แต่ `fromMap` ที่อ่าน `as bool` จะพัง และรุ่นหน้าจะโยน exception · ยึดตามตำรา: **แปลงเป็น 1/0 เอง** ([[bughunt/exam]])' },
        { t: 'why', choice: 'enum เก็บด้วย **`.name`** และอ่านด้วย **`values.byName()`**',
          because: ['อ่านง่ายเมื่อเปิดดูไฟล์ (`income`, `expense`)', 'ไม่ผูกกับลำดับการประกาศใน enum'],
          alts: [
            { alt: 'ทำไมไม่เก็บ `.index` (ตัวเลข) ประหยัดกว่า?', result: 'วันหนึ่งเพิ่มค่าใหม่ **ไว้กลาง enum** → ข้อมูลเดิม **ทุกแถวชี้ไปผิดค่า** (index 1 เคยเป็น expense กลายเป็น transfer)', viz: { name: 'mapper', mode: 'enumIndex' } },
          ] },
        { t: 'why', choice: 'DateTime: เลือก **ISO TEXT หรือ epoch INTEGER แบบใดแบบหนึ่ง แล้วใช้เหมือนกันทั้งแอป**',
          because: ['ISO-8601 อ่านง่ายและ **เรียงตามตัวอักษรได้ถูกลำดับเวลา**', 'epoch (millisecondsSinceEpoch) เปรียบเทียบได้เร็วกว่า'],
          alts: [{ alt: 'ปนกันสองแบบได้ไหม?', result: 'เรียงลำดับ/ค้นช่วงเวลาผิดทันที' }] },
        { t: 'callout', kind: 'warn', title: 'double ต้องอ่านผ่าน num', body: '`(map[\'amount\'] as num).toDouble()` รองรับแถวเก่าที่ถูกบันทึกเป็นจำนวนเต็ม — `map[\'amount\'] as double` จะพังด้วย `type \'int\' is not a subtype of type \'double\'` เมื่อค่าที่อ่านได้เป็น int' },
      ],
      quiz: [
        { q: "ถ้า toMap() ใส่ `'id': id` เสมอ (id เป็น null สำหรับอ็อบเจกต์ใหม่) อะไรจะพัง?", options: [
          { t: 'update ที่ใช้ toMap ของอ็อบเจกต์ที่ id เป็น null → datatype mismatch', ok: true },
          { t: 'insert พังทุกครั้ง', why: 'insert ยอมรับ null ใน INTEGER PRIMARY KEY แล้วสร้างเลขให้' },
          { t: 'ไม่มีอะไรพัง', why: 'update พัง' },
        ] },
        { q: 'เก็บ enum `TransactionType` ลงฐานข้อมูลอย่างไรตามตำรา?', options: [
          { t: '`type.name` แล้วอ่านกลับด้วย `TransactionType.values.byName(...)`', ok: true },
          { t: '`type.index`', why: 'เพิ่มค่ากลาง enum แล้วข้อมูลเดิมชี้ผิด' },
          { t: '`type.toString()`', why: 'ได้ `TransactionType.income` อ่านกลับยากกว่า' },
        ] },
        { type: 'spot', q: 'fromMap นี้มีบรรทัดที่เสี่ยงพังตอนรัน — บรรทัดไหน?', code: `factory MyTransaction.fromMap(Map<String, dynamic> map) {
  return MyTransaction(
    id: map['id'] as int,
    title: map['title'] as String,
    amount: map['amount'] as double,
    date: DateTime.parse(map['date'] as String),
    type: TransactionType.values.byName(map['type'] as String),
  );
}`, bad: "amount: map['amount'] as double,", explain: 'ถ้าค่าที่อ่านได้เป็น int (แถวเก่า) จะพัง — ใช้ `(map[\'amount\'] as num).toDouble()`' },
        { q: 'bool `isDone` ควรเก็บและอ่านอย่างไร?', options: [
          { t: "เก็บ `isDone ? 1 : 0` อ่าน `map['is_done'] == 1`", ok: true },
          { t: 'เก็บเป็น bool ตรงๆ', why: 'SQLite ไม่มี bool' },
          { t: "เก็บเป็น 'true'/'false' TEXT", why: 'ทำได้แต่ไม่ใช่แนวทางของตำรา และเปรียบเทียบยากกว่า' },
        ] },
      ],
    },
    {
      id: '13.8', title: 'การเปลี่ยนโครงสร้างตารางด้วย onUpgrade', source: '§13.8', exam: true,
      gist: 'เพิ่ม **`version`** → `openDatabase` เทียบเลขในไฟล์: ไม่มีไฟล์ → `onCreate` · เลขในไฟล์น้อยกว่า → `onUpgrade(db, oldVersion, newVersion)` · ทั้งหมดอยู่ใน transaction · **4 กฎ**: onCreate = โครงสร้างล่าสุด · **`if (oldVersion < N)` เรียงต่อกัน** (ห้าม `==`/switch) · คอลัมน์ใหม่ต้อง nullable หรือมี DEFAULT · ลบ/เปลี่ยนชื่อคอลัมน์ = สร้างตารางใหม่ + คัดลอก',
      blocks: [
        { t: 'callout', kind: 'analogy', title: 'สร้างตึกบนที่ดินเปล่า vs ต่อเติมตึกที่มีคนอยู่ (จากตำรา)', body: '`_onCreate` = สร้างตึกครั้งแรกบนที่ดินเปล่า (ทำได้ครั้งเดียวในชีวิตของไฟล์) · `onUpgrade` = ต่อเติมตึกที่มีคนอาศัยอยู่ ทุบแล้วสร้างใหม่ไม่ได้เพราะข้าวของผู้อยู่อาศัยอยู่ข้างใน ต้องต่อเติมทีละส่วนโดยของเดิมยังอยู่ครบ' },
        { t: 'viz', id: 'ch13.migrate', title: 'Migration v1/v2 → v3 บน SQLite จริง', try: 'เลือก “v1 (ข้ามรุ่น 2)” + `==` → เปิดแอป (ขาดคอลัมน์ mood!) · เปลี่ยนเป็น `<` แล้วลองใหม่ · ลอง “ติดตั้งใหม่” เทียบโครงสร้าง · ลอง `NOT NULL (ไม่มี DEFAULT)`' },
        { t: 'code', title: 'version 2 + onUpgrade (ตำรา §13.8)', src: `static const _databaseVersion = 2; // เดิมคือ 1 เพิ่มขึ้นทุกครั้งที่โครงสร้างเปลี่ยน

Future<Database> _initDatabase() async {
  final documentsDirectory = await getApplicationDocumentsDirectory();
  final path = join(documentsDirectory.path, _databaseName);
  return openDatabase(
    path,
    version: _databaseVersion,
    onCreate: _onCreate,   // ผู้ใช้ใหม่ ยังไม่มีไฟล์
    onUpgrade: _onUpgrade, // ผู้ใช้เดิม ไฟล์มีเลขเวอร์ชันต่ำกว่า
  );
}

// สร้างตารางในรูปแบบล่าสุดเสมอ ผู้ใช้ใหม่จึงไม่ต้องไล่ทีละขั้น
Future<void> _onCreate(Database db, int version) async {
  await db.execute('''
    CREATE TABLE notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT
    )
  ''');
}

// ไล่ปรับจากเวอร์ชันที่อยู่ในเครื่องขึ้นมาทีละขั้น
Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
  if (oldVersion < 2) {
    await db.execute('ALTER TABLE notes ADD COLUMN created_at TEXT');
  }
  // เวอร์ชันถัดไปให้เพิ่ม if (oldVersion < 3) ต่อท้ายตรงนี้
  // ห้ามแก้ขั้นที่ปล่อยให้ผู้ใช้ไปแล้ว เพราะมีเครื่องที่ผ่านขั้นนั้นไปแล้วจริง
}`, notes: [
          { at: 'static const _databaseVersion = 2;', note: 'เปลี่ยนโครงสร้าง = **เพิ่ม version** + เขียน onUpgrade **และ** แก้ onCreate ให้เป็นโครงสร้างล่าสุด (สามอย่างพร้อมกัน)' },
          { at: 'created_at TEXT', note: 'onCreate ต้องได้ตาราง **เหมือนกับ** เครื่องที่ไล่ onUpgrade มาถึงเวอร์ชันเดียวกัน — ไม่งั้นบั๊กเกิดเฉพาะผู้ใช้บางกลุ่ม หาสาเหตุยากมาก' },
          { at: 'if (oldVersion < 2) {', note: '`<` ไม่ใช่ `==` — เครื่องที่ข้ามจาก 1 ไป 3 ต้องผ่านทั้งขั้น 2 และ 3' },
          { at: "await db.execute('ALTER TABLE notes ADD COLUMN created_at TEXT');", note: 'คอลัมน์ที่เพิ่มด้วย ALTER จะเป็น **NULL ในแถวเดิมทั้งหมด** → ห้ามประกาศ NOT NULL โดยไม่มี DEFAULT · และ fromMap ต้องรับ null ได้' },
        ] },
        { t: 'why', choice: '**`if (oldVersion < N)` เรียงต่อกัน**',
          because: ['ผู้ใช้บางคนไม่ได้อัปเดตทุกรุ่น — เครื่องที่ข้ามจาก v1 ไป v3 ต้องผ่านทั้งขั้น 2 และ 3 ตามลำดับ', '`<` ครอบคลุมทุกกรณี และยังให้ผลเหมือน `== 1` เมื่อมีเพียงสองเวอร์ชัน'],
          alts: [
            { alt: 'ทำไมตัวอย่างในเอกสาร sqflite เขียน `if (oldVersion == 1)` ได้?', result: 'ใช้ได้เพราะตัวอย่างนั้นมีแค่ 2 เวอร์ชัน — ถ้ามี v3 แล้วเขียน `if (oldVersion == 2)` เครื่องที่ข้ามจาก v1 จะทำแค่ขั้นแรก **ไม่ได้คอลัมน์ของ v3 เลย**' },
            { alt: 'ทำไมไม่ใช้ `else if` / `switch`?', result: 'ทำแค่ขั้นเดียวแล้วหยุด เครื่องที่ข้ามรุ่นตกขั้นที่เหลือ' },
          ] },
        { t: 'why', choice: 'ลบ/เปลี่ยนชื่อคอลัมน์ด้วยการ **สร้างตารางใหม่ → `INSERT INTO … SELECT` → DROP เดิม → RENAME ใหม่** (ใน onUpgrade)',
          because: ['ความสามารถของ ALTER TABLE ขึ้นกับรุ่น SQLite ที่มากับระบบปฏิบัติการ — เครื่องเก่ามีคำสั่งน้อยกว่า', 'วิธีนี้ใช้ได้กับทุกรุ่น และ onUpgrade อยู่ใน transaction อยู่แล้ว'],
          alts: [{ alt: 'ทำไมไม่ใช้ `ALTER TABLE … RENAME COLUMN` / `DROP COLUMN`?', result: 'อาจใช้ไม่ได้บนอุปกรณ์รุ่นเก่า → migration ล้มเฉพาะบางเครื่อง' }] },
        { t: 'code', lang: 'sql', title: 'รูปแบบสร้างตารางใหม่ (ตัวอย่างเปลี่ยน content → body)', src: `-- ภายใน if (oldVersion < 3) { ... } แต่ละบรรทัดใช้ db.execute(...)
CREATE TABLE notes_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT
);
INSERT INTO notes_new (id, title, body, created_at)
  SELECT id, title, content, created_at FROM notes;
DROP TABLE notes;
ALTER TABLE notes_new RENAME TO notes;` },
        { t: 'callout', kind: 'exam', title: 'วิธีทดสอบ onUpgrade ให้ถูก', body: 'ติดตั้งรุ่น v1 → เพิ่มโน้ตสองสามรายการ → แก้โค้ดเป็น v2 → **รันทับโดยไม่ถอนการติดตั้ง** → โน้ตเดิมต้องอยู่ครบและ `created_at` เป็น null ส่วนโน้ตใหม่ต้องมีค่า · **การทดสอบแค่ติดตั้งใหม่จะไม่มีวันเจอบั๊กของ onUpgrade** เพราะเส้นทางนั้นไม่เคยถูกเรียก' },
      ],
      quiz: [
        { q: 'ผู้ใช้มีไฟล์ v1 แล้วอัปเดตแอปที่เป็น v3 ทันที onUpgrade แบบใดถูกต้อง?', options: [
          { t: '`if (oldVersion < 2) {...} if (oldVersion < 3) {...}`', ok: true },
          { t: '`if (oldVersion == 1) {...} if (oldVersion == 2) {...}`', why: 'เครื่องจาก v1 ทำแค่ขั้นแรก' },
          { t: '`if (oldVersion < 2) {...} else if (oldVersion < 3) {...}`', why: 'else if ทำแค่ขั้นเดียว' },
        ] },
        { q: "`ALTER TABLE notes ADD COLUMN mood TEXT NOT NULL` ใน onUpgrade จะเกิดอะไร?", options: [
          { t: 'SQLite ปฏิเสธ (Cannot add a NOT NULL column with default value NULL) เพราะแถวเดิมจะเป็น NULL', ok: true },
          { t: 'ทำได้ แถวเดิมได้ค่าว่าง', why: 'ต้องมี DEFAULT' },
          { t: 'ทำได้ แถวเดิมถูกลบ', why: 'ไม่ลบ' },
        ] },
        { type: 'multi', q: 'เมื่อต้องเพิ่มคอลัมน์ใหม่หลังแอปถูกใช้จริง ต้องทำอะไรบ้าง (เลือกทุกข้อที่ถูก)', options: [
          { t: 'เพิ่มค่า `version`', ok: true },
          { t: 'เพิ่มขั้นใน `onUpgrade` ด้วย `if (oldVersion < N)`', ok: true },
          { t: 'แก้ `onCreate` ให้สร้างโครงสร้างล่าสุด', ok: true },
          { t: 'บอกผู้ใช้ให้ถอนการติดตั้งแอป', why: 'ข้อมูลผู้ใช้หายทั้งหมด' },
        ] },
      ],
    },
    {
      id: '13.9', title: 'ทำหลายคำสั่งให้สำเร็จพร้อมกันด้วย transaction และ batch', source: '§13.9', exam: true,
      gist: 'SQLite รับประกัน atomicity ให้อัตโนมัติ **เฉพาะภายในคำสั่งเดียว** → หลายคำสั่งที่ต้องสำเร็จพร้อมกันต้องครอบด้วย `db.transaction((txn) async {...})` (ล้มกลางทาง = rollback ทั้งหมด) · **ในบล็อกใช้ `txn` ทุกคำสั่ง ห้ามใช้ `db`** (ค้างไม่มี error) · `batch` = รวมคำสั่งส่งรอบเดียว เร็วกว่ามาก',
      blocks: [
        { t: 'viz', id: 'ch13.tx', title: 'transaction / deadlock / batch', try: 'โอนเงินแบบไม่มี transaction + แบตหมด (เงินหาย) → รีเซ็ต → เปิด transaction แล้วโอนอีกครั้ง (rollback) · ลอง deadlock ทั้งสองแบบ · กดนำเข้า 100 แถว' },
        { t: 'code', title: 'replaceAllNotes (ตำรา §13.9)', src: `// แทนที่โน้ตทั้งหมดด้วยชุดใหม่ ถ้าล้มกลางทาง ข้อมูลชุดเดิมยังอยู่ครบ
Future<void> replaceAllNotes(List<Note> notes) async {
  final db = await database;
  await db.transaction((txn) async {
    await txn.delete('notes'); // ใช้ txn ทุกคำสั่งในบล็อกนี้ ห้ามใช้ db

    final batch = txn.batch();
    for (final note in notes) {
      batch.insert('notes', note.toMap());
    }
    // noResult: true เมื่อไม่ต้องการ id ของแต่ละแถว จะเร็วขึ้นอีก
    await batch.commit(noResult: true);
  });
}`, notes: [
          { at: 'await db.transaction((txn) async {', note: 'ฟังก์ชันจบตามปกติ → บันทึกทุกคำสั่งพร้อมกัน (COMMIT) · โยน error กลางทาง → ยกเลิกทุกคำสั่งในบล็อก (ROLLBACK)' },
          { at: "await txn.delete('notes');", note: 'ไม่มี where → ลบทุกแถว **โดยตั้งใจ** (แทนที่ทั้งชุด) และปลอดภัยเพราะอยู่ใน transaction' },
          { at: 'final batch = txn.batch();', note: 'batch ต้องสร้างจาก **txn** ภายใน transaction (ไม่ใช่ `db.batch()`)' },
          { at: 'await batch.commit(noResult: true);', note: '`noResult: true` = ไม่ต้องคืน id ของแต่ละแถว → เร็วขึ้น (ถ้าต้องการ id ของแม่เพื่อใส่ลูก ให้ `txn.insert` แม่ก่อน — โจทย์ q5)' },
        ] },
        { t: 'why', choice: 'ครอบคำสั่งที่ต้องสำเร็จพร้อมกันด้วย **transaction**',
          because: ['ตัวอย่างโอนเงิน: หัก A แล้วแบตหมดก่อนเพิ่ม B → เงินหายจากระบบ · ใน transaction เดียว เปิดแอปใหม่ SQLite พบ transaction ที่ยังไม่จบ → rollback · A กลับมาเท่าเดิม'],
          alts: [
            { alt: 'เรียก `update()` สองครั้งติดกันก็พอ เพราะ SQLite เป็น ACID?', result: 'แต่ละคำสั่งถูกบันทึกทันทีที่ทำเสร็จ — การรับประกันข้ามหลายคำสั่งเกิด **ก็ต่อเมื่อครอบด้วย transaction() เอง**' },
          ] },
        { t: 'why', choice: 'ในบล็อก transaction ใช้ **`txn`** ทุกคำสั่ง',
          because: ['คำสั่งผ่าน `db` (หรือเมธอดอื่นของ DatabaseHelper ที่ใช้ db ข้างใน) จะ **รอให้ transaction จบก่อน** แต่ transaction ก็รอคำสั่งนั้นอยู่ → รอกันตลอดไป'],
          alts: [
            { alt: 'ถ้าเผลอเรียก `db.insert(...)` ในบล็อกจะเห็น error ไหม?', result: '**ไม่มี error ใดๆ** — อาการคือหน้าจอค้างที่วงล้อหมุน (deadlock) หาสาเหตุยากมาก' },
          ] },
        { t: 'callout', kind: 'note', title: 'transaction กับ batch ทำหน้าที่ต่างกัน', body: '**transaction** = รับประกันว่า “ทั้งหมดหรือไม่มีเลย” (atomicity) · **batch** = ส่งหลายคำสั่งข้ามจาก Dart ไปฝั่งแพลตฟอร์มในรอบเดียว (ความเร็ว) — ตำราใช้ทั้งคู่ร่วมกัน (batch ภายใน transaction)' },
      ],
      quiz: [
        { type: 'spot', q: 'โค้ดนี้ทำให้แอปค้างที่วงล้อหมุนโดยไม่มี error — บรรทัดไหน?', code: `await db.transaction((txn) async {
  await txn.delete('orders', where: 'id = ?', whereArgs: [id]);
  await db.delete('order_items', where: 'order_id = ?', whereArgs: [id]);
});`, bad: "await db.delete('order_items', where: 'order_id = ?', whereArgs: [id]);", explain: 'ใช้ `db` ภายในบล็อก transaction → รอ transaction จบ ขณะที่ transaction รอคำสั่งนี้ = deadlock ต้องใช้ `txn.delete(...)`' },
        { q: 'ข้อใดถูกต้องเกี่ยวกับ SQLite กับ atomicity?', options: [
          { t: 'รับประกันอัตโนมัติเฉพาะภายในคำสั่งเดียว หลายคำสั่งต้องครอบด้วย transaction', ok: true },
          { t: 'ทุกคำสั่งในแอปเป็น transaction เดียวกันอัตโนมัติ', why: 'แต่ละคำสั่งบันทึกทันที' },
          { t: 'batch รับประกัน atomicity แทน transaction เสมอ', why: 'batch เน้นความเร็ว — ตำราใช้คู่กับ transaction' },
        ] },
      ],
    },
    {
      id: '13.10', title: 'SQLite กับข้อมูลจากเครือข่าย: Offline-first', source: '§13.10', exam: true,
      gist: '(1) เก็บใน **SQLite** โดย **Repository** — ชั้นที่รู้จักทั้ง `fetchTodos()` และฐานข้อมูล ส่วน provider รู้จักแค่ repository · (2) สำหรับหน้าจอ **แหล่งความจริงเดียวคือฐานข้อมูลในเครื่อง** — เครือข่ายมีหน้าที่เดียวคือ **เขียนทับลงฐานข้อมูล** (offline-first / local-first) · (3) สถานะ = **ชุดค่า 4 ตัว**: รายการ, `isRefreshing`, `errorMessage`, `lastSynced` → หน้าจอ 4 แบบ',
      blocks: [
        { t: 'why', choice: 'แยกชั้น **Repository** ระหว่าง provider กับแหล่งข้อมูลทั้งสอง',
          because: ['provider ไม่ต้องรู้ว่าข้อมูลมาจากเครือข่ายหรือไฟล์', 'แต่ละชั้นทดสอบแยกได้'],
          alts: [
            { alt: 'ทำไมไม่ใส่ตรรกะเก็บแคชไว้ใน `fetchTodos()`?', result: 'ชั้นเครือข่ายจะต้องรู้เรื่องฐานข้อมูลด้วย' },
            { alt: 'ทำไมไม่ใส่ไว้ใน provider เลย?', result: 'โค้ดปนกันจนทดสอบแยกส่วนไม่ได้' },
          ] },
        { t: 'why', choice: 'หน้าจอ **อ่านจากฐานข้อมูลเท่านั้น** (offline-first)',
          because: ['มีข้อมูลให้แสดงทันทีตั้งแต่เสี้ยววินาทีแรก ไม่ว่ามีสัญญาณหรือไม่', 'ไม่มีจังหวะที่สองหน้าจอแสดงข้อมูลคนละชุด'],
          alts: [
            { alt: 'ข้อมูลอยู่ในเครื่อง มือถือตกน้ำก็หายหมด — แล้วเป็นจุดเด่นได้อย่างไร?', result: 'ฐานข้อมูลในเครื่อง **ไม่ได้มาแทนเซิร์ฟเวอร์** แต่เป็น **กันชน** ระหว่างผู้ใช้กับเครือข่าย — แอปที่พึ่งคลาวด์ 100% กลายเป็น “ก้อนอิฐ” ทันทีที่เข้าลิฟต์ · การสำรองขึ้นเซิร์ฟเวอร์ยังจำเป็น แต่เป็นงานเบื้องหลัง (local-first)' },
          ] },
        { t: 'viz', id: 'ch13.offline', title: 'แผนภาพ 6 lane (หัวข้อ 13.10.1) — เล่นทีละขั้น', try: 'เล่นแบบออนไลน์ → ไม่มีสัญญาณ (เส้นแดงไม่แตะ SQLite) → “ผิด: ลบแคชก่อนเรียก API”' },
        { t: 'code', title: 'lib/repositories/todo_repository.dart', src: `class TodoRepository {
  TodoRepository(this._db);
  final Database _db;

  // อ่านชุดที่เก็บไว้ในเครื่อง ได้ทันทีแม้ไม่มีสัญญาณ
  Future<List<Todo>> readCached() async {
    final rows = await _db.query('todos', orderBy: 'id');
    return rows.map(Todo.fromMap).toList();
  }

  // ดึงชุดใหม่ เขียนทับในเครื่อง แล้วคืนสิ่งที่อยู่ในเครื่อง
  Future<List<Todo>> refresh() async {
    final fresh = await fetchTodos(); // ชั้นเครือข่ายจากหัวข้อ 12.6
    await _db.transaction((txn) async {
      await txn.delete('todos');
      final batch = txn.batch();
      for (final todo in fresh) {
        batch.insert('todos', todo.toMap());
      }
      await batch.commit(noResult: true);
    });
    return readCached(); // หน้าจอเห็นเฉพาะสิ่งที่อยู่ในฐานข้อมูล
  }
}`, notes: [
          { at: 'TodoRepository(this._db);', note: 'รับ `Database` ผ่าน constructor (dependency injection) — ทดสอบด้วยฐานข้อมูลปลอมได้ ต่างจาก Singleton ที่ผูกตายตัว' },
          { at: 'final fresh = await fetchTodos();', note: '**เรียก API ให้สำเร็จก่อน** แล้วค่อยแตะฐานข้อมูล — ถ้าล้มเหลวตั้งแต่บรรทัดนี้ ฐานข้อมูลไม่ถูกแตะเลย แคชเดิมอยู่ครบ' },
          { at: 'await _db.transaction((txn) async {', note: 'ถ้าแอปถูกปิดกลางทาง ชุดเดิมไม่หายไปครึ่งหนึ่ง · **ห้าม await เครือข่ายภายใน transaction**' },
          { at: 'return readCached();', note: 'คืน “สิ่งที่อยู่ใน DB” ไม่ใช่ `fresh` — ตอกย้ำแหล่งความจริงเดียว' },
        ] },
        { t: 'code', title: 'Todo.toMap / fromMap (เพิ่มในคลาสของบทที่ 12)', src: `// ตารางที่คู่กัน: CREATE TABLE todos (id INTEGER PRIMARY KEY,
//   userId INTEGER NOT NULL, title TEXT NOT NULL, completed INTEGER NOT NULL)
Map<String, Object?> toMap() {
  return {
    'id': id, // id มาจากเซิร์ฟเวอร์ จึงมีค่าเสมอ
    'userId': userId,
    'title': title,
    'completed': completed ? 1 : 0, // SQLite ไม่มี bool
  };
}

factory Todo.fromMap(Map<String, Object?> map) {
  return Todo(
    userId: map['userId'] as int,
    id: map['id'] as int,
    title: map['title'] as String,
    completed: map['completed'] == 1,
  );
}`, notes: [{ at: "'id': id, // id มาจากเซิร์ฟเวอร์", note: 'ต่างจาก Note: id มาจากเซิร์ฟเวอร์ (ไม่ใช่ AUTOINCREMENT) จึงใส่เสมอ' }] },
        { t: 'code', title: 'lib/providers/todo_provider.dart', src: `class TodoProvider extends ChangeNotifier {
  TodoProvider(this._repository);
  final TodoRepository _repository;

  List<Todo> _todos = [];
  bool _isRefreshing = false;
  String? _errorMessage;
  DateTime? _lastSynced;

  List<Todo> get todos => List.unmodifiable(_todos);
  bool get isRefreshing => _isRefreshing;
  String? get errorMessage => _errorMessage;
  DateTime? get lastSynced => _lastSynced;

  Future<void> load() async {
    // 1. แสดงชุดในเครื่องก่อน
    _todos = await _repository.readCached();
    _isRefreshing = true;
    notifyListeners();

    // 2. ขอชุดใหม่ ถ้าไม่สำเร็จ ชุดเดิมยังอยู่บนจอ
    try {
      _todos = await _repository.refresh();
      _lastSynced = DateTime.now();
      _errorMessage = null;
    } catch (e) {
      _errorMessage = 'เกิดข้อผิดพลาด';
    } finally {
      _isRefreshing = false;
      notifyListeners();
    }
  }
}`, notes: [
          { at: '_todos = await _repository.readCached();', note: '(สังเกต) บรรทัดนี้อยู่ **นอก try** — ถ้าอ่านฐานข้อมูลพลาด exception จะหลุดออกไปและไม่มีการ notify สถานะผิดพลาด' },
          { at: "_errorMessage = 'เกิดข้อผิดพลาด';", note: '(สังเกต) ทิ้งข้อความภาษาคนจาก ApiException ไป — ดีกว่า: `on ApiException catch (e) { _errorMessage = e.message; }` (review_final_app ทำแบบนี้)' },
        ] },
        { t: 'viz', id: 'ch13.fourstates', title: 'หน้าจอ 4 สถานะ', try: 'สลับสวิตช์ให้ครบ 4 กรณีหลัก ① ② ③ ④' },
        { t: 'compare', cols: ['', 'กำลังรีเฟรช', 'รีเฟรชไม่สำเร็จ'], rows: [
          ['**ไม่มีข้อมูล**', '① วงล้อหมุนเต็มหน้า (เปิดแอปครั้งแรก)', '④ ข้อความผิดพลาด + ปุ่มลองใหม่เต็มหน้า'],
          ['**มีข้อมูล**', '② รายการเดิม + แถบบางๆ ใต้ AppBar (ห้ามเปลี่ยนทั้งหน้าเป็นวงล้อ)', '③ รายการเดิม + แถบบอก “แสดงข้อมูลเมื่อ … (lastSynced)” + ลองใหม่'],
        ] },
        { t: 'callout', kind: 'note', title: 'ขอบเขตของหัวข้อนี้', body: 'ข้อมูลที่ **อ่านอย่างเดียว** จากเซิร์ฟเวอร์ — ถ้าผู้ใช้แก้ไขในเครื่องระหว่างออฟไลน์ด้วย จะเกิดคำถามเรื่องการส่งกลับและการชนกับการแก้ไขของคนอื่น (อยู่นอกขอบเขต → คำถามท้ายบท)' },
      ],
      quiz: [
        { q: 'ใน offline-first ตามตำรา หน้าจออ่านข้อมูลจากที่ใด?', options: [
          { t: 'ฐานข้อมูลในเครื่องเท่านั้น — เครือข่ายมีหน้าที่เขียนทับลงฐานข้อมูล', ok: true },
          { t: 'จาก API ก่อน ถ้าไม่ได้ค่อยอ่าน DB', why: 'หน้าจอเห็นสองแหล่ง อาจไม่ตรงกัน' },
          { t: 'จาก API เท่านั้น', why: 'นั่นคือแอปตอนจบบทที่ 12' },
        ] },
        { q: 'ทำไม `refresh()` จึงเรียก `fetchTodos()` **ก่อน** `txn.delete(\'todos\')`?', options: [
          { t: 'ถ้าเครือข่ายล้มเหลว จะไม่แตะฐานข้อมูลเลย แคชเดิมยังอยู่ครบ', ok: true },
          { t: 'เพราะ delete ทำงานช้า', why: 'ไม่ใช่เหตุผล' },
          { t: 'ไม่มีผล ลำดับไหนก็ได้', why: 'ลบก่อนแล้วเน็ตล่ม = ผู้ใช้ในลิฟต์เห็นจอว่าง' },
        ] },
        { q: 'สถานะ “มีข้อมูลเก่าแสดงอยู่ และกำลังรีเฟรช” ควรแสดงผลอย่างไร?', options: [
          { t: 'รายการเดิม + แถบความคืบหน้าบางๆ ใต้ AppBar', ok: true },
          { t: 'วงล้อหมุนเต็มหน้า', why: 'ตำราห้ามเปลี่ยนทั้งหน้าเป็นวงล้อ' },
          { t: 'ซ่อนรายการจนกว่าจะโหลดเสร็จ', why: 'ทำให้กระพริบและเสียประโยชน์ของแคช' },
        ] },
      ],
    },
    {
      id: '13.10.1', title: 'ประกอบทั้งหมดเป็นแอปที่รันได้ (todo_offline)', source: '§13.10.1',
      gist: '8 ขั้น: pubspec → Model (fromJson + toMap/fromMap) → api_service (12.6) → `openAppDatabase()` (`getDatabasesPath`, id **ไม่มี AUTOINCREMENT**) → repository + provider → หน้าจอ 4 สถานะ → `main` ที่ **`WidgetsFlutterBinding.ensureInitialized()`** ก่อนเปิด DB → ทดสอบ 4 สถานะ',
      blocks: [
        { t: 'code', lang: 'text', title: 'โครงสร้างไฟล์', src: `lib/
├── main.dart                         ← ขั้นตอนที่ 7
├── data/app_database.dart            ← ขั้นตอนที่ 4
├── models/todo.dart                  ← ขั้นตอนที่ 2
├── services/api_service.dart         ← ขั้นตอนที่ 3 (คัดลอกจาก 12.6)
├── repositories/todo_repository.dart ← โค้ดด้านบน (13.10)
├── providers/todo_provider.dart      ← โค้ดด้านบน (13.10)
└── screens/todo_list_screen.dart     ← ขั้นตอนที่ 6` },
        { t: 'viz', id: 'sorter', title: 'ไฟล์ไหนทำหน้าที่อะไร', props: {
          buckets: [{ id: 'ui', label: 'หน้าจอ' }, { id: 'state', label: 'Provider' }, { id: 'repo', label: 'Repository' }, { id: 'data', label: 'data / services' }],
          items: [
            { t: 'เลือกแสดงผลตาม 4 สถานะ + MaterialBanner', bucket: 'ui', why: 'todo_list_screen.dart' },
            { t: 'ถือ todos, isRefreshing, errorMessage, lastSynced แล้ว notify', bucket: 'state', why: 'todo_provider.dart' },
            { t: 'readCached() และ refresh() (API → transaction → readCached)', bucket: 'repo', why: 'todo_repository.dart' },
            { t: 'openAppDatabase() สร้างตาราง todos', bucket: 'data', why: 'data/app_database.dart' },
            { t: 'fetchTodos() + ApiException', bucket: 'data', why: 'services/api_service.dart' },
          ] } },
        { t: 'code', title: 'ขั้นตอนที่ 4: lib/data/app_database.dart', src: `import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

// เปิดไฟล์ฐานข้อมูลของแอป และสร้างตาราง todos ในครั้งแรกที่ไฟล์ถูกสร้าง
Future<Database> openAppDatabase() async {
  final path = join(await getDatabasesPath(), 'todos.db');
  return openDatabase(
    path,
    version: 1,
    onCreate: (db, version) {
      // id มาจากเซิร์ฟเวอร์ จึงไม่ใช้ AUTOINCREMENT
      return db.execute('''
        CREATE TABLE todos (
          id INTEGER PRIMARY KEY,
          userId INTEGER NOT NULL,
          title TEXT NOT NULL,
          completed INTEGER NOT NULL
        )
      ''');
    },
  );
}`, notes: [{ at: 'Future<Database> openAppDatabase() async {', note: 'ฟังก์ชันเดียวแทนคลาส DatabaseHelper ให้สั้นลง — หลักการเดียวกัน: **เปิดครั้งเดียว** แล้วส่ง Database ตัวเดียวกันให้ทุกส่วน' }] },
        { t: 'code', title: 'ขั้นตอนที่ 6: _buildBody ของ TodoListScreen', src: `@override
Widget build(BuildContext context) {
  final provider = context.watch<TodoProvider>();
  final hasData = provider.todos.isNotEmpty;
  return Scaffold(
    appBar: AppBar(
      title: const Text('Todos (offline-first)'),
      // สถานะที่สี่: มีข้อมูลและกำลังรีเฟรช แสดงแถบบาง ๆ ใต้ AppBar
      bottom: hasData && provider.isRefreshing
          ? const PreferredSize(preferredSize: Size.fromHeight(4), child: LinearProgressIndicator())
          : null,
    ),
    body: _buildBody(provider, hasData),
  );
}

Widget _buildBody(TodoProvider provider, bool hasData) {
  // ไม่มีข้อมูลและกำลังรีเฟรช: เปิดแอปครั้งแรก
  if (!hasData && provider.isRefreshing) {
    return const Center(child: CircularProgressIndicator());
  }
  // ไม่มีข้อมูลและรีเฟรชไม่สำเร็จ: ข้อความผิดพลาดพร้อมปุ่มลองใหม่เต็มหน้า
  if (!hasData && provider.errorMessage != null) {
    return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      Text(provider.errorMessage!, textAlign: TextAlign.center),
      const SizedBox(height: 12),
      ElevatedButton(onPressed: provider.load, child: const Text('ลองใหม่')),
    ]));
  }
  // มีข้อมูล: แสดงรายการเดิมเสมอ ถ้ารีเฟรชไม่สำเร็จให้มีแถบบอกที่มาของข้อมูล
  return Column(children: [
    if (provider.errorMessage != null)
      MaterialBanner(
        content: Text('แสดงข้อมูล\${_syncedText(provider.lastSynced)}\\n\${provider.errorMessage}'),
        actions: [TextButton(onPressed: provider.load, child: const Text('ลองใหม่'))],
      ),
    Expanded(child: ListView.builder(
      itemCount: provider.todos.length,
      itemBuilder: (context, index) {
        final todo = provider.todos[index];
        return CheckboxListTile(value: todo.completed, onChanged: null, title: Text(todo.title));
      },
    )),
  ]);
}`, notes: [
          { at: 'onPressed: provider.load,', note: 'tear-off ของเมธอด provider (ไม่ต้อง `() => provider.load()`)' },
          { at: 'onChanged: null,', note: '`onChanged: null` = แสดงอย่างเดียว ไม่ให้แก้ (ข้อมูลอ่านอย่างเดียว)' },
        ] },
        { t: 'code', title: 'ขั้นตอนที่ 7: lib/main.dart', src: `Future<void> main() async {
  // ต้องเรียกก่อนใช้ plugin ใด ๆ ก่อน runApp เพราะ sqflite ต้องคุยกับฝั่งแพลตฟอร์ม
  WidgetsFlutterBinding.ensureInitialized();
  final db = await openAppDatabase(); // เปิดครั้งเดียวตลอดอายุของแอป

  runApp(
    ChangeNotifierProvider(
      create: (_) => TodoProvider(TodoRepository(db)),
      child: const MyApp(),
    ),
  );
}`, notes: [
          { at: 'WidgetsFlutterBinding.ensureInitialized();', note: 'ลืมบรรทัดนี้ แอปหยุดทำงานตั้งแต่เปิด เพราะเรียก plugin (sqflite) ก่อน runApp' },
          { at: 'create: (_) => TodoProvider(TodoRepository(db)),', note: 'ส่ง Database → Repository → Provider ตามลำดับชั้น' },
        ] },
        { t: 'h', text: 'ขั้นตอนที่ 8: ทดสอบให้เห็นครบ 4 สถานะ' },
        { t: 'list', ordered: true, items: [
          'เปิดเน็ตแล้วรัน → วงล้อหมุนชั่วครู่ แล้วได้รายการ 200 รายการ (①)',
          'เปิดโหมดเครื่องบิน ปิดแอปแล้วรันใหม่ → รายการเดิมขึ้นทันที ไม่มีวงล้อเต็มหน้า + แถบ “ข้อมูลที่บันทึกไว้ในเครื่องจากครั้งก่อน” (③)',
          'ปิดโหมดเครื่องบินแล้วกดลองใหม่ → แถบบางๆ ใต้ AppBar ขณะรายการเดิมยังอยู่ แถบข้อความหายเมื่อสำเร็จ (②)',
          'ถอนการติดตั้ง เปิดโหมดเครื่องบิน แล้วรัน → ข้อความผิดพลาด + ลองใหม่เต็มหน้า (④)',
        ] },
        { t: 'callout', kind: 'warn', title: 'release build', body: 'อย่าลืม INTERNET permission ใน manifest ของ main ([[12.5]]) — ไม่งั้นแอปจะติดอยู่สถานะ ④ ตลอดแม้เครื่องต่อเน็ตอยู่' },
      ],
      quiz: [
        { q: 'ทำไมตาราง todos จึง **ไม่** ใช้ AUTOINCREMENT?', options: [
          { t: 'id มาจากเซิร์ฟเวอร์ จึงมีค่าเสมอ', ok: true },
          { t: 'เพราะ AUTOINCREMENT ใช้กับ getDatabasesPath ไม่ได้', why: 'ไม่เกี่ยวกัน' },
          { t: 'เพื่อให้ id ซ้ำได้', why: 'PRIMARY KEY ยังห้ามซ้ำ' },
        ] },
        { q: 'ถ้าลืม `WidgetsFlutterBinding.ensureInitialized()` ก่อน `await openAppDatabase()` ใน main จะเกิดอะไร?', options: [
          { t: 'แอปหยุดทำงานตั้งแต่เปิด เพราะเรียก plugin ก่อน runApp', ok: true },
          { t: 'ไม่มีผล', why: 'มีผล' },
          { t: 'ข้อมูลถูกลบ', why: 'ไม่เกี่ยว' },
        ] },
      ],
    },
    {
      id: 'lab13', title: 'ปฏิบัติการบทที่ 13: แอปบัญชีรายรับ-รายจ่าย (Provider + SQLite)', short: 'แลป', source: 'ปฏิบัติการ', exam: true,
      gist: '**TransactionProvider ถือฐานข้อมูลเอง** (ไม่ใช้ Helper): `_initDatabase()` (getDatabasesPath + join), `addTransaction`, `fetchAndSetTransactions` (query → fromMap → notify), `updateTransaction`, `deleteTransaction` (where/whereArgs → fetch ใหม่) · Model ชื่อ **MyTransaction** (เพราะ `Transaction` ชนกับ sqflite) · การบ้าน: หน้า AddEditTransactionScreen',
      blocks: [
        { t: 'callout', kind: 'analogy', title: 'บริษัทที่แบ่งแผนก (จากตำรา)', body: 'หน้าจอ = พนักงานต้อนรับ · TransactionProvider = ผู้จัดการที่รู้ตรรกะทั้งหมด สั่งห้องใต้ดิน (SQLite) ให้เก็บ/เบิกเอกสาร แล้วประกาศผ่านลำโพง `notifyListeners()` · พนักงานที่ใส่หูฟังรอผ่าน Consumer ได้ยินแล้ววาดหน้าจอใหม่ — **Separation of Concerns**: หน้าจอไม่ต้องรู้ว่ามี SQL ในโลก' },
        { t: 'why', choice: 'แยกงานฐานข้อมูลออกจากหน้าจอ (ให้ Provider ถือ)',
          because: ['**ไม่ใช่เพราะหน้าจอจะค้าง** (คำสั่ง sqflite เป็น async ไม่ขวางการวาดอยู่แล้ว)', 'เหตุผลจริง: หลายหน้าจอใช้ข้อมูลชุดเดียวกัน → ต้องมีผู้ถือข้อมูลคนเดียวที่แจ้งทุกหน้าพร้อมกัน', 'วันหนึ่งเปลี่ยนวิธีเก็บข้อมูล แก้แค่ “หลังบ้าน” ไม่ต้องแตะโค้ดหน้าจอ'],
          alts: [{ alt: 'แลปให้ provider ถือ DB เอง ขัดกับ DatabaseHelper ในเนื้อหาหลักไหม?', result: 'ไม่ขัดสำหรับแอปจอเดียว — ตำราบอกว่าเพื่อให้สั้นและเห็นภาพครบในไฟล์เดียว แต่ถ้ามี provider หลายตัวใช้ DB เดียวกัน ควรกลับไปแยกเป็น DatabaseHelper (คำถาม 13.12)' }] },
        { t: 'viz', id: 'swimlane', title: 'แผนภาพกระบวนการของแลป (4 เลน)', props: {
          lanes: [{ id: 'u', label: 'User' }, { id: 's', label: 'Screens' }, { id: 'p', label: 'TransactionProvider' }, { id: 'd', label: 'SQLite' }],
          steps: [
            { from: 'u', to: 's', label: 'กดเพิ่ม/แก้ไข/ลบ' },
            { from: 's', to: 'p', label: 'context.read<TransactionProvider>()…' },
            { from: 'p', to: 'd', label: 'INSERT / UPDATE / DELETE' },
            { from: 'd', to: 'p', label: 'ผลลัพธ์ (id หรือจำนวนแถว)', kind: 'ret' },
            { from: 'p', label: 'fetchAndSet → อัปเดต List ภายใน' },
            { from: 'p', to: 's', label: 'notifyListeners()', kind: 'notify' },
            { from: 's', label: 'Consumer / watch build ใหม่', kind: 'ok' },
            { from: 's', to: 'u', label: 'เห็นการเปลี่ยนแปลง', kind: 'ret' },
          ] }, try: 'กด ▷ เล่น' },
        { t: 'code', title: 'lib/models/my_transaction.dart', src: `enum TransactionType { income, expense }

class MyTransaction {
  final int? id;
  final String title;
  final double amount;
  final DateTime date;
  final TransactionType type;

  MyTransaction({
    this.id,
    required this.title,
    required this.amount,
    required this.date,
    required this.type,
  });

  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id, // ห้ามส่ง id ที่เป็น null เข้าไปใน UPDATE
      'title': title,
      'amount': amount,
      'date': date.toIso8601String(),
      'type': type.name, // เก็บเป็น 'income' หรือ 'expense'
    };
  }

  factory MyTransaction.fromMap(Map<String, dynamic> map) {
    return MyTransaction(
      id: map['id'] as int,
      title: map['title'] as String,
      amount: (map['amount'] as num).toDouble(),
      date: DateTime.parse(map['date'] as String),
      type: TransactionType.values.byName(map['type'] as String),
    );
  }
}` },
        { t: 'code', title: 'lib/providers/transaction_provider.dart (รวมกระบวนการ 2–6)', src: `class TransactionProvider with ChangeNotifier {
  static const String _dbName = 'expenses.db';
  static const String _tableName = 'transactions';
  Database? _database;
  List<MyTransaction> _transactions = [];

  List<MyTransaction> get transactions => [..._transactions];

  TransactionProvider() {
    fetchAndSetTransactions(); // โหลดข้อมูลเมื่อ Provider ถูกสร้าง
  }

  // กระบวนการที่ 2: การสร้างฐานข้อมูล
  Future<void> _initDatabase() async {
    if (_database != null) return;
    try {
      final dbPath = await getDatabasesPath();
      final path = join(dbPath, _dbName);
      _database = await openDatabase(
        path,
        version: 1,
        onCreate: (db, version) {
          print('Creating table $_tableName...');
          return db.execute(
            'CREATE TABLE $_tableName(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, amount REAL, date TEXT, type TEXT)',
          );
        },
      );
      print('Database initialized at $path');
    } catch (e) {
      print('Error initializing database: $e');
    }
  }

  // กระบวนการที่ 3: การ Insert
  Future<void> addTransaction(String title, double amount, DateTime date, TransactionType type) async {
    await _initDatabase(); // ตรวจสอบว่า DB พร้อมใช้งาน
    if (_database == null) return;
    final newTransaction = MyTransaction(title: title, amount: amount, date: date, type: type);
    final id = await _database!.insert(_tableName, newTransaction.toMap());
    print('Inserted transaction with id: $id');
    await fetchAndSetTransactions();
  }

  // กระบวนการที่ 4: การ Read
  Future<void> fetchAndSetTransactions() async {
    await _initDatabase();
    if (_database == null) return;
    final dataList = await _database!.query(_tableName, orderBy: 'date DESC');
    _transactions = dataList.map((item) => MyTransaction.fromMap(item)).toList();
    print('Fetched \${_transactions.length} transactions.');
    notifyListeners(); // แจ้ง UI ให้วาดใหม่
  }

  // กระบวนการที่ 5: การ Update
  Future<void> updateTransaction(int id, MyTransaction newTransaction) async {
    await _initDatabase();
    if (_database == null) return;
    await _database!.update(
      _tableName,
      newTransaction.toMap(), // toMap() ไม่ส่ง id ที่เป็น null จึงไม่ไปเปลี่ยนคีย์หลัก
      where: 'id = ?',
      whereArgs: [id],
    );
    await fetchAndSetTransactions();
  }

  // กระบวนการที่ 6: การ Delete
  Future<void> deleteTransaction(int id) async {
    await _initDatabase();
    if (_database == null) return;
    await _database!.delete(_tableName, where: 'id = ?', whereArgs: [id]);
    await fetchAndSetTransactions();
  }
}`, maxHeight: '520px', notes: [
          { at: 'class TransactionProvider with ChangeNotifier {', note: '`with ChangeNotifier` (mixin) ได้ผลเหมือน `extends ChangeNotifier` ในกรณีนี้' },
          { at: 'List<MyTransaction> get transactions => [..._transactions];', note: 'คืนสำเนา ([[lab11]])' },
          { at: 'fetchAndSetTransactions(); // โหลดข้อมูลเมื่อ Provider ถูกสร้าง', note: 'เรียก async ใน constructor แบบไม่ await (fire-and-forget) — ข้อผิดพลาดที่เกิดจะไม่มีใครจับ (ex_13 ใช้ `unawaited(...catchError(...))`)' },
          { at: "print('Error initializing database: $e');", note: '**ข้อสังเกต**: กลืน error ด้วย print แล้วเมธอดอื่น `return` เงียบๆ เมื่อ `_database == null` — ผู้ใช้กดบันทึกแล้วไม่เกิดอะไรขึ้นโดยไม่มีข้อความ' },
          { at: "'CREATE TABLE $_tableName(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, amount REAL, date TEXT, type TEXT)',", note: 'ไม่มี NOT NULL — ex_13 เพิ่ม NOT NULL และคอลัมน์ note (version 2)' },
          { at: "final dataList = await _database!.query(_tableName, orderBy: 'date DESC');", note: 'ex_13 ใช้ `\'date DESC, id DESC\'` ให้ลำดับคงที่เมื่อวันเดียวกัน ([[sql/order]])' },
          { at: 'await fetchAndSetTransactions();', note: 'หลังเขียนทุกครั้ง **โหลดใหม่จาก DB** แล้ว notify — ข้อมูลในหน่วยความจำจึงตรงกับฐานข้อมูลเสมอ' },
        ] },
        { t: 'callout', kind: 'exam', title: 'ระวังชื่อคลาสชนกัน', body: 'ใช้ `List<Transaction>` จะ **compile ไม่ผ่าน** เพราะ `Transaction` เป็นคลาสที่มีอยู่แล้วใน sqflite (transaction ของฐานข้อมูล [[13.9]]) — แลปจึงตั้งชื่อ Model ว่า **MyTransaction** · ทำนองเดียวกัน อย่าตั้งชื่อคลาสว่า `Database`' },
        { t: 'code', lang: 'text', title: 'Console ที่ควรเห็นตอนกด “Add Test Income” (กระบวนการ 3)', src: `I/flutter ( 1111): Inserting test data...
I/flutter ( 1111): Creating table transactions...
I/flutter ( 1111): Database initialized at /data/user/0/com.example.expense_tracker_provider/databases/expenses.db
I/flutter ( 1111): Inserted transaction with id: 1` },
        { t: 'callout', kind: 'note', title: 'ทำไม “Creating table” มาก่อน “Database initialized”', body: 'ฐานข้อมูลยังไม่ถูกเปิดจนกว่าจะกดปุ่ม (ในกระบวนการ 3 ยังไม่มีใครเรียก `_initDatabase()` ตอนสร้าง provider) และ `onCreate` ทำงาน **ภายใน** `openDatabase` ก่อนที่มันจะคืนค่า' },
        { t: 'h', text: 'การบ้าน + ความท้าทาย' },
        { t: 'list', ordered: true, items: [
          '**การบ้าน**: สร้าง `AddEditTransactionScreen` (Form + validator จากบทที่ 8, ส่งข้อมูลไป-กลับด้วยบทที่ 9) ที่เรียก `addTransaction` หรือ `updateTransaction` — ดูตัวอย่างที่ทำเสร็จแล้วใน [[code/ex13|walkthrough ex_13]]',
          '**ข้อ 1**: เพิ่มคอลัมน์ `note` → version 2 + onUpgrade → ทดสอบโดยรันทับแอปเดิม (ไม่ถอนการติดตั้ง) รายการเดิมต้องอยู่ครบ ([[13.8]])',
          '**ข้อ 2**: แสดงยอดคงเหลือใต้ AppBar ด้วย `SUM` ผ่าน `rawQuery` แทนการวนบวกใน Dart ([[sql/agg]])',
          '**ข้อ 3**: นำเข้า 100 รายการ เทียบเรียก addTransaction ทีละรายการ กับ batch ใน transaction แล้วจับเวลา ([[13.9]])',
        ] },
      ],
      quiz: [
        { q: 'ทำไมแลปตั้งชื่อ Model ว่า `MyTransaction`?', options: [
          { t: '`Transaction` ชนกับคลาสใน sqflite ทำให้ compile ไม่ผ่าน', ok: true },
          { t: 'เพื่อให้สั้น', why: 'ยาวกว่าด้วยซ้ำ' },
          { t: 'Dart ห้ามชื่อคลาสที่ขึ้นต้นด้วย T', why: 'ไม่มีกฎแบบนั้น' },
        ] },
        { type: 'order', q: 'เรียงลำดับใน `addTransaction` ของแลป', items: ['`await _initDatabase();` (เปิด DB ถ้ายังไม่เปิด)', '`_database!.insert(_tableName, newTransaction.toMap())`', '`await fetchAndSetTransactions();` (query ใหม่)', '`notifyListeners()` ภายใน fetchAndSet → UI วาดใหม่'] },
      ],
    },
  ],
  rules: [
    'ข้อมูลที่ต้องรอดข้ามการปิดแอป → SQLite (หลายแถว ค้นหา/แก้ทีละแถว)',
    'pubspec: `sqflite`, `path` (+ `path_provider` ถ้าใช้ getApplicationDocumentsDirectory)',
    'เปิดฐานข้อมูล **ครั้งเดียว** (Singleton / เก็บ `Future<Database>`) · path จาก OS · ห้ามเปลี่ยน path หลังปล่อยแอป',
    '`onCreate` ทำงานครั้งเดียวต่อไฟล์ และต้องสร้างโครงสร้าง **ล่าสุด** เสมอ',
    'insert คืน **id** · update/delete คืน **จำนวนแถว** · query คืน `List<Map>` (อ่านอย่างเดียว)',
    '**update/delete ต้องมี `where: \'id = ?\'` + `whereArgs: [id]` เสมอ**',
    'ค่าจากผู้ใช้/เครือข่ายเข้าทาง `whereArgs` เท่านั้น (รวมถึง rawQuery) — ห้ามต่อสตริงด้วย `$`',
    'Model: `int? id` · `if (id != null) \'id\': id` · bool→1/0 · DateTime→ISO · enum→`.name`/`byName` · double←`as num`',
    'ชื่อคีย์ใน toMap/fromMap ต้องตรงชื่อคอลัมน์ (ระวัง snake_case vs camelCase)',
    'เปลี่ยนโครงสร้าง = เพิ่ม `version` + `onUpgrade` (`if (oldVersion < N)`) + แก้ onCreate',
    'คอลัมน์ใหม่: nullable หรือมี DEFAULT · ลบ/เปลี่ยนชื่อคอลัมน์ = สร้างตารางใหม่ + คัดลอก',
    'หลายคำสั่งต้องสำเร็จพร้อมกัน → `db.transaction((txn) async {...})` ใช้ **txn ทุกคำสั่ง**',
    'ข้อมูลจำนวนมาก → `txn.batch()` + `commit(noResult: true)`',
    'Offline-first: หน้าจออ่านจาก DB เท่านั้น · repository เรียก API **ก่อน** แล้วเขียนใน transaction · ห้าม await เครือข่ายใน transaction',
    'สถานะหน้าจอ = รายการ + isRefreshing + errorMessage + lastSynced → 4 แบบ',
    '`WidgetsFlutterBinding.ensureInitialized()` ก่อนเปิด DB ใน `main`',
    'อย่าตั้งชื่อคลาส `Transaction` / `Database`',
    'ทดสอบโดย **ปิดแอปแล้วเปิดใหม่** (ไม่ใช่ Hot Reload) และรันทับเมื่อเปลี่ยน schema',
  ],
  handsOff: { heading: 'คำถามชวนคิดท้ายบท (13.12)', body: [
    { t: 'callout', kind: 'exam', title: 'คำถามจากตำรา', body: '“เนื้อหาหลักแยกงานฐานข้อมูลไว้ใน **DatabaseHelper แบบ Singleton** ขณะที่ปฏิบัติการท้ายบทให้ **TransactionProvider เปิดและถือฐานข้อมูลเอง** … เมื่อโปรเจกต์ในบทที่ 14 และ 15 เติบโตขึ้นจนมี provider สองตัวที่ต้องใช้ฐานข้อมูลไฟล์เดียวกัน … **แบบใดจะทำให้ไฟล์ฐานข้อมูลถูกเปิดเพียงครั้งเดียวและมีผู้ดูแล onUpgrade เพียงคนเดียว** และถ้าต้องการทดสอบตรรกะของ provider **โดยไม่แตะไฟล์ฐานข้อมูลจริงเลย** ควรแบ่งชั้นของโค้ดอย่างไร · และคำถามที่ยากที่สุด … มือถือสองเครื่อง เปิดแอปตอนไม่มีสัญญาณทั้งคู่แล้วแก้ไขรายการเดียวกันคนละแบบ … **ข้อมูลจากเครื่องใดควรเป็นฉบับจริง** … นาฬิกาของสองเครื่องเชื่อถือได้แค่ไหน ปัญหานี้เรียกว่า **conflict resolution**”' },
    { t: 'compare', cols: ['คำถาม', 'แนวคำตอบ (ตามโครงสร้างที่ตำราชี้)'], rows: [
      ['provider สองตัวใช้ DB ไฟล์เดียว', '**DatabaseHelper** (หรือฟังก์ชัน `openAppDatabase` ที่เปิดครั้งเดียว) เป็นเจ้าของการเปิดไฟล์และ onCreate/onUpgrade · provider ทั้งสองเรียกผ่านมัน (บทที่ 15: TaskProvider → DatabaseHelper)'],
      ['ทดสอบ provider โดยไม่แตะไฟล์จริง', 'แยกชั้นแบบ **Repository** แล้ว **ส่งเข้าทาง constructor** (เหมือน `TodoProvider(TodoRepository(db))`) → ตอนทดสอบส่งของปลอมเข้าไปแทน (ex_13 มี `FakeTransactionProvider` ในเทสต์)'],
      ['conflict resolution', 'ไม่มีคำตอบเดียว — “ต่อเน็ตก่อนชนะ” อาจทิ้งการแก้ล่าสุด · “แก้ล่าสุดชนะ” พึ่งนาฬิกาเครื่องที่อาจเพี้ยน (ดูภาพด้านล่าง)'],
    ] },
    { t: 'viz', id: 'ch13.conflict', title: 'สองเครื่องแก้รายการเดียวกันขณะออฟไลน์', try: 'สลับกลยุทธ์ แล้วเลื่อนนาฬิกาเครื่อง B ให้เพี้ยนไป −10 นาที' },
  ] },
  quiz: [
    { type: 'multi', q: 'เช็กลิสต์ Model ก่อนส่งข้อสอบ — ข้อใดถูก (เลือกทุกข้อ)', options: [
      { t: '`id` เป็น `int?` และใส่ใน toMap เฉพาะเมื่อไม่ null', ok: true },
      { t: 'enum เก็บ `.name` อ่านด้วย `values.byName()`', ok: true },
      { t: '`amount` อ่านด้วย `(map[\'amount\'] as num).toDouble()`', ok: true },
      { t: 'bool เก็บตรงๆ เป็น true/false', why: 'SQLite ไม่มี bool → 1/0' },
    ] },
    { q: 'ทดสอบว่าแอปเก็บข้อมูลถาวรจริง ควรทำอย่างไร?', options: [
      { t: 'เพิ่ม/แก้/ลบ แล้วปิดแอปจริงแล้วเปิดใหม่ ข้อมูลต้องตรงกับก่อนปิด', ok: true },
      { t: 'กด Hot Reload แล้วดูว่าข้อมูลยังอยู่', why: 'Hot Reload ไม่ได้ล้าง RAM — ไม่ได้พิสูจน์อะไร' },
      { t: 'ดูว่าไม่มี error ใน console', why: 'ไม่พอ' },
    ] },
    { q: 'คำสั่ง `db.update(\'products\', {\'price\': 10})` (ไม่มี where) มีผลอย่างไร?', options: [
      { t: 'ราคาสินค้าทุกแถวกลายเป็น 10', ok: true },
      { t: 'แก้เฉพาะแถวแรก', why: 'ไม่มี where = ทุกแถว' },
      { t: 'error เพราะไม่มี where', why: 'SQLite ทำตามคำสั่งตรงตัว ไม่ error' },
    ] },
    { q: 'ใน repository แบบ offline-first ทำไมห้าม `await fetchTodos()` **ภายใน** `db.transaction`?', options: [
      { t: 'ล็อกฐานข้อมูลไว้ระหว่างรอเครือข่ายที่ไม่แน่นอน — ควรได้ข้อมูลครบก่อนแล้วค่อยเปิด transaction เขียนรวดเดียว', ok: true },
      { t: 'เพราะ http ใช้ใน transaction ไม่ได้ทางเทคนิค', why: 'ประเด็นคือการออกแบบ ไม่ใช่ข้อห้ามทางไวยากรณ์' },
      { t: 'ไม่มีผลอะไร', why: 'ทำให้ transaction ค้างนานและเสี่ยง' },
    ] },
  ],
};
