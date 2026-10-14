/* บทที่ 9 — การนำทางระหว่างหน้าจอ */
FR.content.ch09 = {
  id: 'ch09', kind: 'chapter', num: '9', navTitle: 'Navigation', crumb: 'บทที่ 9',
  title: 'การนำทางระหว่างหน้าจอ (Navigation Between Screens)',
  problem: 'แอปจริงมีหลายหน้าจอ — ต้อง **ไป** หน้าใหม่, **กลับ** หน้าเดิม, **ส่งข้อมูลไป** และ **รับข้อมูลกลับ**, จัดการ stack ตอน login/logout และ **กันข้อมูลหาย** เมื่อผู้ใช้ย้อนกลับกลางฟอร์ม',
  tools: ['Navigator + route stack', 'MaterialPageRoute', 'push / pop', 'await push + pop(result)', 'named routes / onGenerateRoute', 'pushReplacement / pushAndRemoveUntil / popUntil', 'PopScope'],
  receives: { title: 'ต่อจากบทที่ 8 (คำถาม 8.14)', body: 'บทที่ 8 ถามว่า “ข้อมูลที่ผู้ใช้กรอกควรเดินทางกลับไปถึงหน้าที่เปิดฟอร์มขึ้นมาได้อย่างไร” และ “ถ้ากรอกไปครึ่งหนึ่งแล้วกดย้อนกลับ แอปควรทำอย่างไร” — บทนี้ตอบข้อแรกด้วย **`Navigator.pop(context, ค่า)`** ([[9.5]]) และข้อสุดท้ายด้วย **PopScope** ([[9.8]])' },
  overview: [
    { t: 'h', text: 'ภาพใหญ่: Navigator คือกองจาน' },
    'ทุกเรื่องในบทนี้คือการทำอะไรสักอย่างกับ **stack ของ route** — หน้าที่ผู้ใช้เห็นคือจานใบบนสุด · push = วางจานใหม่ · pop = ยกจานบนสุดออก · ข้อมูลเดินทาง “ไป” ตอนวางจาน (constructor) และ “กลับ” ตอนยกออก (ผลลัพธ์ของ pop)',
    { t: 'viz', id: 'ch09.stack', title: 'Navigator stack playground', try: 'กด push สองสามครั้ง → pop จนเหลือใบเดียว → กด pop อีกครั้ง (จอดำ!) → เริ่มใหม่แล้วลอง maybePop ตอนเหลือใบเดียว' },
    { t: 'compare', cols: ['เรื่อง', 'เครื่องมือ', 'หัวข้อ'], rows: [
      ['Navigator อยู่ที่ไหน หาเจอได้อย่างไร', '`Navigator.of(context)` ไล่ขึ้นตาม tree', '[[9.2]]'],
      ['ไป/กลับ', '`MaterialPageRoute`, `push`, `pop`', '[[9.3]]'],
      ['ส่งข้อมูลไป', 'constructor (`required`)', '[[9.4]]'],
      ['รับข้อมูลกลับ', '`await Navigator.push<T>` + `pop(context, ค่า)` + `mounted`', '[[9.5]]'],
      ['รวมเส้นทางไว้ที่เดียว', '`routes`, `pushNamed`, `arguments`, `onGenerateRoute`', '[[9.6]]'],
      ['จัดการหลายจานพร้อมกัน', '`pushReplacement`, `pushAndRemoveUntil`, `popUntil`', '[[9.7]]'],
      ['กันข้อมูลหายตอนย้อนกลับ', '`PopScope(canPop, onPopInvokedWithResult)`', '[[9.8]]'],
      ['เลือกวิธีส่งข้อมูล', 'constructor / arguments / pop / → Provider', '[[9.9]]'],
    ] },
    { t: 'callout', kind: 'supp', title: 'ปูพื้น: BuildContext คือ “พิกัด” ในต้นไม้', body: 'บทนี้ใช้ context หนักมาก (หา Navigator, หา ScaffoldMessenger, mounted) ถ้ายังไม่ชัดว่าการ “ไล่ขึ้นตาม tree” คืออะไร ดู [[core/c2]] ก่อน' },
  ],
  sections: [
    {
      id: '9.1', title: 'บทนำ: ก้าวข้ามหน้าจอเดียว', source: '§9.1',
      gist: '**Route** = หน้าจอหนึ่งหน้า · **Navigator** = ผู้ดูแล stack ของ route — push เพื่อไปหน้าใหม่, pop เพื่อย้อนกลับ',
      blocks: [
        { t: 'callout', kind: 'analogy', title: 'อาคารที่ไม่มีประตู (จากตำรา)', body: 'อาคารตกแต่งสวยงาม มีห้องครบ แต่ **ไม่มีประตู ไม่มีทางเดิน ไม่มีบันได** คนที่เข้าไปจะติดอยู่ในห้องแรกตลอดไป — แอปที่หน้าแรกสวยแค่ไหน ถ้าแตะไปหน้าอื่นไม่ได้ก็ใช้งานไม่ได้ตั้งแต่ยังไม่เริ่ม การนำทางจึงเป็นโครงสร้างที่ทุกหน้าจอต้องพึ่งพา' },
        { t: 'list', items: [
          'ทำความเข้าใจ `Navigator` และ route stack',
          '`MaterialPageRoute` กำหนดการเปลี่ยนผ่านระหว่างหน้าจอ',
          '`Navigator.push()` ไปข้างหน้า · `Navigator.pop()` ย้อนกลับ',
          'ส่งข้อมูล **ไปยัง** หน้าจอใหม่ · ส่งข้อมูล **กลับจาก** หน้าจอเมื่อ pop',
          'จัดระเบียบด้วย Named Routes',
          'จัดการ stack มากกว่าทีละหน้า (login / logout)',
          'ควบคุมการย้อนกลับด้วย PopScope',
          'เลือกวิธีส่งข้อมูลให้เหมาะ และสัญญาณว่าถึงเวลาใช้การจัดการ state แบบอื่น',
        ] },
      ],
      quiz: [
        { q: 'ในศัพท์ของ Flutter “Route” หมายถึงอะไร?', options: [
          { t: 'หน้าจอหรือเพจหนึ่งหน้าในแอป', ok: true },
          { t: 'URL ของเว็บไซต์', why: 'แนวคิดคล้าย แต่ใน Flutter route คือหน้าจอใน stack' },
          { t: 'ตัวจัดการ stack', why: 'นั่นคือ Navigator' },
        ] },
      ],
    },
    {
      id: '9.2', title: 'Navigator และ Route Stack', source: '§9.2', exam: true,
      gist: 'stack เหมือนกองจาน — หน้าที่เห็นคือจานบนสุด · MaterialApp สร้าง Navigator ให้ใต้ตัวมัน · `Navigator.of(context)` **ไล่ขึ้นจากตำแหน่งของ context** จนเจอ Navigator ที่ใกล้ที่สุด → context ต้องอยู่ **ใต้** MaterialApp',
      blocks: [
        'ตำราเปรียบ Navigator เป็น **ศูนย์ควบคุมจราจร** ที่ตัดสินว่าหน้าไหนอยู่บนสุดและหน้าไหนรออยู่ข้างใต้ และ “**stack คือความทรงจำของแอป**” — ต้องจำว่าผู้ใช้มาจากไหน จะไปไหน กดย้อนกลับแล้วต้องกลับไปที่ใด และบางครั้งต้องพกข้อมูลไปด้วย',
        { t: 'list', items: [
          'หน้าจอที่ผู้ใช้เห็นอยู่คือ route **บนสุด** ของ stack',
          'นำทางไปหน้าใหม่ = **push** route ขึ้นบนสุด',
          'กดย้อนกลับ (ปุ่มฮาร์ดแวร์ Android หรือลูกศรใน AppBar) = **pop** route บนสุดออก เผยหน้าข้างใต้',
          '`Navigator.of(context).push(...)` กับ `Navigator.push(context, ...)` ทำงานเหมือนกัน',
          '**Scaffold ไม่ได้สร้าง Navigator** และไม่เกี่ยวกับการค้นหา — เงื่อนไขเดียวคือ context ต้องอยู่ใต้ MaterialApp',
        ] },
        { t: 'viz', id: 'ch09.lookup', name: 'lk', title: 'context ไล่ขึ้นหา Navigator', try: 'กดปุ่มในโหมด “แยก HomeScreen” (เจอ) แล้วสลับเป็นโหมดกับดักแล้วกดอีกครั้ง — การไล่ขึ้นเริ่มจาก MyApp ซึ่งอยู่เหนือ Navigator' },
        { t: 'code', title: 'กับดัก: context ที่มองไม่เห็น Navigator (ตัวอย่างที่ผิดในตำรา)', src: `// ตัวอย่างที่ผิด
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: Center(
          child: ElevatedButton(
            // context ตัวนี้เป็นของ MyApp ซึ่งอยู่เหนือ MaterialApp ขึ้นไป
            // จึงมองไม่เห็น Navigator ที่ MaterialApp สร้างไว้ข้างล่าง
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const SecondScreen(),
              ),
            ),
            child: const Text('ไปหน้าถัดไป'),
          ),
        ),
      ),
    );
  }
}`, hl: ['onPressed: () => Navigator.push('], notes: [
          { at: 'Widget build(BuildContext context) {', note: '`context` ตัวนี้คือ “พิกัด” ของ **MyApp** — อยู่เหนือ MaterialApp' },
          { at: 'context,', note: 'คอมไพล์ผ่าน แต่กดแล้วได้ `Navigator operation requested with a context that does not include a Navigator.`' },
        ] },
        { t: 'why', choice: 'แยกหน้าแรกเป็นวิดเจ็ตของตัวเอง (`home: const HomeScreen()`)',
          because: ['`build()` ของ HomeScreen ได้ context ของตัวเองซึ่งอยู่ **ใต้** MaterialApp → ไล่ขึ้นเจอ Navigator', 'ตำราแยกทุกหน้าจอเป็นคลาสของตัวเองเสมอด้วยเหตุผลนี้'],
          alts: [
            { alt: 'ทำไมไม่เขียน Scaffold ของหน้าแรกตรงใน `MaterialApp(home: Scaffold(...))` ใน build ของ MyApp?', result: 'ปุ่มข้างในใช้ context ของ MyApp ที่อยู่เหนือ Navigator → push แล้ว error ตอนรัน', viz: { name: 'lk', mode: 'trap' } },
            { alt: 'ห่อด้วย `Builder` เพื่อได้ context ใหม่ใต้ MaterialApp ได้ไหม? (เสริม)', result: 'ได้ — `Builder(builder: (context) => ...)` ให้ context ที่อยู่ตำแหน่งของ Builder เอง', ok: 'แก้เฉพาะหน้า แต่การแยกเป็นคลาสหน้าจออ่านง่ายและเป็นระเบียบกว่า' },
          ] },
      ],
      quiz: [
        { q: 'ข้อความ “Navigator operation requested with a context that does not include a Navigator.” เกิดจากอะไร?', options: [
          { t: 'context ที่ส่งให้ Navigator อยู่เหนือ MaterialApp จึงไล่ขึ้นแล้วไม่เจอ Navigator', ok: true },
          { t: 'ลืมใส่ Scaffold', why: 'Scaffold ไม่ได้สร้าง Navigator และไม่เกี่ยวกับการค้นหา' },
          { t: 'stack ว่างเปล่า', why: 'ข้อความนี้เกี่ยวกับการหา Navigator ไม่ใช่จำนวนหน้า' },
        ] },
        { q: 'ใครสร้าง Navigator ให้แอปโดยอัตโนมัติ?', options: [
          { t: '`MaterialApp` (หรือ `CupertinoApp`)', ok: true },
          { t: '`Scaffold`', why: 'ตำราระบุชัดว่า Scaffold ไม่ได้สร้าง Navigator' },
          { t: '`runApp()`', why: 'runApp แค่ใส่วิดเจ็ตรากลงจอ' },
        ] },
      ],
    },
    {
      id: '9.3', title: 'การนำทางพื้นฐาน: MaterialPageRoute, push และ pop', source: '§9.3.1–9.3.3', exam: true,
      gist: '`MaterialPageRoute` = **กล่องพัสดุ** ที่ห่อ “พิมพ์เขียว” (builder) ของหน้าจอ พร้อมคำสั่งแอนิเมชันตามแพลตฟอร์ม · `push` วางกล่องบนสุด · `pop` ยกออก · pop หน้าสุดท้าย = **จอดำ ไม่มี error** → ใช้ `canPop` / `maybePop`',
      blocks: [
        { t: 'viz', id: 'ch09.stack', title: 'push / pop / maybePop และแอนิเมชันตามแพลตฟอร์ม', try: 'สลับ Android / iOS แล้ว push ดูแอนิเมชันที่ต่างกัน · pop จนหมดแล้วสังเกตจอดำ · กด canPop? ตอนเหลือใบเดียว' },
        { t: 'h', text: '9.3.1 MaterialPageRoute' },
        'MaterialPageRoute เลือกแอนิเมชันตามแพลตฟอร์มให้เอง: **iOS** หน้าใหม่เลื่อนเข้าจากขอบขวา และปัดจากขอบซ้ายเพื่อย้อนกลับได้ · **Android** ใช้แบบของ Android รุ่นใหม่ (ตำรา: Flutter 3.44 ใช้แบบจางเข้าพร้อมเลื่อนเล็กน้อย และรองรับ predictive back ของ Android 14+)',
        { t: 'code', title: 'builder รับ BuildContext แล้วคืนวิดเจ็ตหน้าจอ', src: `MaterialPageRoute(
  builder: (BuildContext context) {
    // ส่งคืนอินสแตนซ์ของวิดเจ็ตสำหรับหน้าจอใหม่
    return const SecondScreen();
  },
)` },
        { t: 'why', choice: 'push รับ **Route** (MaterialPageRoute) ที่มี **builder** — ไม่รับวิดเจ็ตหน้าจอตรงๆ',
          because: ['กล่อง (route) มีคำสั่งกำกับว่าหน้าจอควรปรากฏ/หายไปอย่างไรให้เข้ากับระบบปฏิบัติการ — Navigator จัดการกับ “กล่อง” ไม่ใช่สิ่งของข้างใน', 'ของในกล่องเป็น **พิมพ์เขียว** (builder) เพราะหน้าจอต้องถูกสร้าง **ภายใต้ตำแหน่งของ route นั้นใน tree** และ route อาจต้องเรียก builder ซ้ำเมื่อสร้างใหม่'],
          alts: [
            { alt: 'ทำไมไม่ส่งหน้าจอที่สร้างเสร็จแล้วเข้าไปเลย จะได้ประหยัดหน่วยความจำ?', result: 'ตำราย้ำว่า **เหตุผลไม่ใช่เรื่องประหยัดหน่วยความจำ** — วิดเจ็ตเป็นออบเจกต์เล็ก สร้างล่วงหน้าไม่หน่วง เหตุผลจริงคือ route ต้องเป็นผู้ควบคุมว่าจะสร้าง **เมื่อไรและที่ไหน** (เพื่อให้ได้ context ที่ถูกตำแหน่ง)' },
          ] },
        { t: 'callout', kind: 'analogy', title: 'BuildContext = พิกัด GPS (จากตำรา)', body: 'context ที่ builder ได้รับคือ **พิกัด** ที่บอกว่าหน้าจอใหม่อยู่ตรงไหนของ tree เมื่อรู้พิกัด หน้าจอจึงไล่ขึ้นไปหาธีม สี ฟอนต์ และ Navigator ที่ดูแลมันได้ถูก — ถ้าไม่มีพิกัด หน้าจอจะเป็น “คนหลงทาง” ที่ไม่รู้แม้แต่สีธีม (เหตุผลเดียวกับกับดักใน [[9.2]])' },
        { t: 'h', text: '9.3.2 Navigator.push() · 9.3.3 Navigator.pop()' },
        { t: 'code', title: 'push และ pop', src: `// หน้าแรก: ภายใน onPressed
onPressed: () {
  Navigator.push( // Push route ใหม่ขึ้นไปบน stack
    context, // BuildContext ของวิดเจ็ตปัจจุบัน
    MaterialPageRoute(
      builder: (context) => const SecondScreen(), // สร้างหน้าจอปลายทาง
    ),
  );
},

// SecondScreen: ภายใน onPressed
onPressed: () {
  Navigator.pop(context); // Pop route ปัจจุบัน (SecondScreen) ออกจาก stack
},` },
        'push: Flutter สร้าง SecondScreen → ทำแอนิเมชันให้ปรากฏ → เพิ่ม route ไว้บนสุด · pop: แอนิเมชันหายไป → ลบ route ออก → หน้าก่อนหน้ากลับมาเห็น · **AppBar ใส่ลูกศรย้อนกลับให้เอง** เมื่อพบว่ามีหน้าก่อนหน้า',
        { t: 'callout', kind: 'warn', title: 'เมื่อไม่มีหน้าให้ย้อนกลับ', body: 'เรียก `Navigator.pop` บนหน้าแรกซึ่งเป็น route เดียวใน stack → Flutter นำ route นั้นออก **โดยไม่แจ้ง error** ผลคือ **จอดำว่างเปล่า** · ถ้าปุ่มอาจถูกกดจากหน้าแรกได้ ให้ตรวจด้วย `Navigator.canPop(context)` หรือใช้ `Navigator.maybePop(context)` ซึ่งไม่ทำอะไรถ้าไม่มีหน้าก่อนหน้า' },
      ],
      quiz: [
        { q: 'เรียก `Navigator.pop(context)` บนหน้าแรกที่เป็น route เดียวใน stack ผลคือ?', options: [
          { t: 'route ถูกนำออก เหลือจอดำ โดยไม่มี error', ok: true },
          { t: 'Flutter แสดง error ว่าไม่มีหน้าให้ย้อนกลับ', why: 'ไม่มี error — นั่นแหละที่อันตราย' },
          { t: 'ไม่มีอะไรเกิดขึ้น', why: 'นั่นคือพฤติกรรมของ maybePop' },
        ] },
        { q: 'ตามตำรา เหตุผลหลักที่ MaterialPageRoute รับ `builder` (พิมพ์เขียว) แทนหน้าจอที่สร้างเสร็จแล้วคืออะไร?', options: [
          { t: 'หน้าจอต้องถูกสร้างภายใต้ตำแหน่งของ route ใน tree และ route อาจเรียก builder ซ้ำ', ok: true },
          { t: 'เพื่อประหยัดหน่วยความจำ', why: 'ตำราระบุชัดว่าไม่ใช่เหตุผลหลัก' },
          { t: 'เพราะ Dart ไม่อนุญาตให้ส่งวิดเจ็ตเป็น argument', why: 'ส่งได้ปกติ' },
        ] },
      ],
    },
    {
      id: '9.4', title: 'การส่งข้อมูลไปยังหน้าจอใหม่', source: '§9.4',
      gist: 'วิธีมาตรฐาน: เพิ่ม `final` field + `required` named parameter ใน constructor ของหน้าปลายทาง แล้วส่งค่าตอนสร้างใน builder · ข้อดีใหญ่: **คอมไพเลอร์ตรวจครบทุกจุด** (ชื่อและชนิด)',
      blocks: [
        { t: 'code', title: 'ปลายทาง + ต้นทาง (ตำรา §9.4)', src: `// detail_screen.dart
class DetailScreen extends StatelessWidget {
  final String itemId; // Property สำหรับเก็บข้อมูล
  final String message;

  // Constructor ที่รับข้อมูล
  const DetailScreen({
    super.key,
    required this.itemId,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('รายละเอียดไอเท็ม: $itemId')),
      body: Center(child: Text('ข้อความที่ได้รับ: $message')),
    );
  }
}

// ภายใน onPressed ของปุ่มในหน้าจอแรก
onPressed: () {
  String dataToSend = 'Item-123';
  String msg = 'สวัสดีจากหน้าโฮม!';
  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (context) => DetailScreen( // ส่งข้อมูลผ่าน constructor
        itemId: dataToSend,
        message: msg,
      ),
    ),
  );
},`, notes: [
          { at: 'required this.itemId,', note: '`required` = ลืมส่งไม่ได้ คอมไพเลอร์เตือนทันที' },
          { at: "appBar: AppBar(title: Text('รายละเอียดไอเท็ม: $itemId')),", note: 'ใน StatelessWidget ใช้ชื่อฟิลด์ตรงๆ · ถ้า DetailScreen เป็น StatefulWidget ใน State ต้องอ่าน `widget.itemId` ([[7.4]])' },
        ] },
        { t: 'viz', id: 'ch09.ctor', title: 'คอมไพเลอร์ตรวจให้ตั้งแต่ก่อนรัน', try: 'ปิด “ส่ง itemId” หรือเปลี่ยนเป็น `itemId: 123` — compile ไม่ผ่านทันที' },
        { t: 'callout', kind: 'exam', title: 'จำข้อดีนี้ไว้', body: 'ตำราเน้นว่า “ขอให้จำข้อดีนี้ไว้ เพราะการส่งข้อมูลผ่าน named routes ในหัวข้อ 9.6 จะ **เสียข้อดีข้อนี้ไป**” — arguments ของ named route มีชนิด `Object?` คอมไพเลอร์ตรวจไม่ได้' },
      ],
      quiz: [
        { q: 'ข้อดีหลักของการส่งข้อมูลผ่าน constructor ตามตำราคืออะไร?', options: [
          { t: 'คอมไพเลอร์ตรวจชื่อและชนิดให้ครบทุกจุดตั้งแต่ก่อนรัน', ok: true },
          { t: 'ข้อมูลอัปเดตอัตโนมัติเมื่อหน้าต้นทางเปลี่ยน', why: 'ส่งค่าครั้งเดียว ณ เวลาที่ push ([[9.9]])' },
          { t: 'ใช้หน่วยความจำน้อยกว่า', why: 'ไม่ใช่ประเด็น' },
        ] },
        { q: 'DetailScreen เป็น StatefulWidget รับ `itemId` ทาง constructor ใน State จะอ่านค่าอย่างไร?', options: [
          { t: '`widget.itemId`', ok: true },
          { t: '`itemId` ตรงๆ', why: 'State ไม่มีฟิลด์ชื่อนี้ ต้องอ่านผ่าน widget' },
          { t: '`context.itemId`', why: 'context ไม่ได้ถือข้อมูลนี้' },
        ] },
      ],
    },
    {
      id: '9.5', title: 'การส่งข้อมูลกลับจากหน้าจอ', source: '§9.5', exam: true,
      gist: 'หน้าปลายทาง `Navigator.pop(context, ค่า)` · หน้าต้นทาง `final result = await Navigator.push<T>(...)` · result **เป็น null ได้เสมอ** (ผู้ใช้ย้อนกลับเอง) · หลัง await ต้อง `if (!mounted) return;` ก่อนใช้ context',
      blocks: [
        { t: 'code', title: 'ฝั่งที่รอผลลัพธ์ (ในคลาส State ของ HomeScreen)', src: `Future<void> _navigateToSelectionScreen() async {
  // <String> บอกว่าหน้าที่เปิดจะส่ง String กลับมา result จึงมีชนิดเป็น String?
  final result = await Navigator.push<String>(
    context,
    MaterialPageRoute(builder: (context) => const SelectionScreen()),
  );

  // ระหว่างรอ หน้านี้อาจถูกปิดไปแล้ว ต้องตรวจก่อนใช้ context อีกครั้ง
  if (!mounted) return;

  // result เป็น null เมื่อผู้ใช้กดย้อนกลับโดยไม่ได้เลือก
  final text = result == null ? 'ไม่มีการเลือก' : 'เลือก: $result';
  ScaffoldMessenger.of(context)
    ..removeCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(text)));
}

// ปุ่มในเมธอด build ของ HomeScreen
ElevatedButton(
  onPressed: _navigateToSelectionScreen, // เรียกเมธอด async
  child: const Text('ไปที่หน้าจอเลือก'),
)

// ฝั่งที่ส่งกลับ (SelectionScreen)
ElevatedButton(
  onPressed: () {
    String selectedValue = 'ตัวเลือก ก';
    Navigator.pop(context, selectedValue); // ส่งผลลัพธ์กลับไป
  },
  child: const Text('เลือกตัวเลือก ก แล้วย้อนกลับ'),
)`, notes: [
          { at: 'Future<void> _navigateToSelectionScreen() async {', note: 'เมธอดนอก build ที่ใช้ `context` และ `mounted` → ต้องอยู่ใน **คลาส State** (StatelessWidget ไม่มี context ให้ใช้นอก build)' },
          { at: 'await Navigator.push<String>(', note: '`push` คืน **Future** — `await` คือ “หยุดรอตรงนี้” จนกว่าหน้าที่เปิดจะถูก pop (async/await เต็มรูปแบบในบทที่ 12)' },
          { at: 'if (!mounted) return;', note: 'ด่านตรวจ — ถ้าลืม analyzer เตือนด้วยกฎ `use_build_context_synchronously` · ใน StatelessWidget ใช้ `context.mounted`' },
          { at: "final text = result == null", note: '**ป้อมยาม** สำหรับกรณีหน่วยสอดแนมกลับมามือเปล่า (null)' },
          { at: '..removeCurrentSnackBar()', note: '`..` (cascade) = เรียกหลายเมธอดบนออบเจกต์เดียวกันต่อกัน ([[dart]])' },
        ] },
        { t: 'viz', id: 'ch09.result', title: 'หน่วยสอดแนมออกไปแล้วกลับมา', try: 'กด “ไปที่หน้าจอเลือก” → เลือกตัวเลือก · ลองอีกครั้งแล้วกด ◁ Back (ได้ null) · สลับเป็น “ไม่ระบุชนิด” แล้วย้อนกลับด้วยระบบ · ลองปิด mounted แล้วกด “ล้าง stack” ระหว่างรอ' },
        { t: 'callout', kind: 'analogy', title: 'หน่วยสอดแนม (จากตำรา)', body: 'บรรทัด `await Navigator.push` คือจุดที่ฟังก์ชัน **หยุดรอชั่วคราว** ระหว่างนั้นหน้าจอใหม่ (หน่วยสอดแนม) ทำหน้าที่ของมัน เมื่อผู้ใช้เลือกเสร็จแล้ว pop พร้อมแนบข้อมูล รายงานเดินทางกลับมาที่บรรทัด await แล้วบรรทัดถัดไปจึงทำงานต่อ · ค่าที่แนบไปกับ pop **ถูกส่งมอบในจังหวะที่คำสั่ง pop ทำงาน** (ไม่ได้รอให้หน้าจอถูกทำลายก่อน) ไปยัง Future ที่ push คืนไว้' },
        { t: 'why', choice: 'ระบุชนิด `Navigator.push<String>(...)`',
          because: ['ผลของ await มีชนิด `String?` — null safety **บังคับ** ให้เขียนป้อมยามรับ null ตั้งแต่ตอน compile', 'ไม่ต้องตรวจ `result is String` เองทุกครั้ง'],
          alts: [
            { alt: 'ทำไมไม่ push แบบไม่ระบุชนิด (แบบที่แลปแบบฝึกหัด 3 ใช้)?', result: 'result เป็น `Object?`/dynamic คอมไพเลอร์ไม่เตือนถ้าเอา null ไปเรียกเมธอดต่อ → แอปพังตอนรัน (โหมด debug เป็นจอแดง “Red Screen of Death”)', ok: 'ถ้าตรวจ `result is String` เองอย่างที่แลปทำ ก็ปลอดภัย แต่ยาวกว่าและลืมง่าย' },
          ] },
        { t: 'why', choice: '`if (!mounted) return;` ทุกครั้งหลัง await ก่อนใช้ context',
          because: ['ระหว่างรอ หน้าหลักอาจถูกนำออกจาก stack ไปแล้ว (เช่นโค้ดส่วนอื่นเรียก pushAndRemoveUntil — [[9.7]])', 'ใช้ context ของหน้าที่ถูกนำออกไปแล้ว = error ตอนรัน'],
          alts: [
            { alt: 'ทำไมไม่ใช้ context ต่อเลย ปกติก็ไม่เห็นพัง?', result: 'พังเฉพาะบางจังหวะ (ผู้ใช้กดเร็ว, ถูกล้าง stack) ซึ่งหาบั๊กยากที่สุด — analyzer จึงเตือนด้วยกฎ use_build_context_synchronously' },
          ] },
        { t: 'callout', kind: 'note', title: 'ทำไมผลลัพธ์เป็น null ได้', body: 'ผู้ใช้ไม่จำเป็นต้องกดปุ่มเลือกของเรา — เขาอาจกดลูกศรใน AppBar, ปุ่ม Back ของ Android หรือปัดจากขอบบน iOS ทุกช่องทางนี้ **pop โดยไม่มีผลลัพธ์** จึงต้องรองรับ null ทุกครั้ง' },
      ],
      quiz: [
        { q: 'ผู้ใช้เปิดหน้าเลือกสีแล้วปัดย้อนกลับ (iOS) โดยไม่เลือก `await Navigator.push<String>(...)` คืนอะไร?', options: [
          { t: '`null`', ok: true },
          { t: "สตริงว่าง `''`", why: 'ไม่มีการส่งค่า ผลจึงเป็น null' },
          { t: 'Future ไม่จบ ฟังก์ชันค้างตลอดไป', why: 'pop ทุกแบบทำให้ Future จบ' },
        ] },
        { type: 'order', q: 'เรียงลำดับเหตุการณ์เมื่อผู้ใช้เลือก “ตัวเลือก ก”', items: ['HomeScreen ทำงานถึง `await Navigator.push<String>(...)` แล้วหยุดรอ', 'SelectionScreen แสดงบนสุด ผู้ใช้กดตัวเลือก ก', "`Navigator.pop(context, 'ตัวเลือก ก')` ส่งค่าให้ Future ของ push", 'บรรทัดหลัง await ทำงานต่อ `result` = ตัวเลือก ก', '`if (!mounted) return;` ผ่าน → แสดง SnackBar'] },
        { type: 'spot', q: 'โค้ดนี้อาจพังตอนรันในบางจังหวะ — บรรทัดไหนที่ควรมีด่านตรวจก่อน?', code: `Future<void> _pick() async {
  final color = await Navigator.push<String>(
    context,
    MaterialPageRoute(builder: (_) => const ColorPicker()),
  );
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(color ?? 'ไม่ได้เลือก')),
  );
}`, bad: 'ScaffoldMessenger.of(context).showSnackBar(', explain: 'ใช้ context หลัง await โดยไม่ตรวจ `mounted` — ควรมี `if (!mounted) return;` ก่อนบรรทัดนี้' },
      ],
    },
    {
      id: '9.6', title: 'Named Routes เพื่อการนำทางที่สะอาดขึ้น', source: '§9.6',
      gist: 'ตั้งชื่อเส้นทางเป็น `static const routeName` → ลงทะเบียนที่ `MaterialApp(routes: …)` → `pushNamed` · แต่ **arguments เป็น `Object?` คอมไพเลอร์ตรวจไม่ได้** → ห่อด้วยคลาส (`DetailArgs`) และแปลงกลับเป็น constructor ใน `onGenerateRoute` · อ่าน arguments ใน build/didChangeDependencies **ห้ามใน initState**',
      blocks: [
        'ปัญหาที่ named routes แก้: แอปร้านค้ามีจุดที่ไป DetailScreen ได้ **50 ที่** ถ้าทุกจุด push เองแล้ววันหนึ่งเพิ่มพารามิเตอร์ใน constructor ต้องไล่แก้ครบ 50 จุด (code maintainability) — named routes เหมือน **ป้ายบอกทางในห้าง** ลงทะเบียนชื่อทุกเส้นทางไว้ที่เดียว',
        { t: 'code', title: 'ขั้นตอนพื้นฐาน', src: `// 1. กำหนดชื่อ route เป็น static constant
class HomeScreen extends StatelessWidget {
  static const routeName = '/'; // มักใช้ '/' สำหรับ initial route
}
class DetailScreen extends StatelessWidget {
  static const routeName = '/detail';
}

// 2. กำหนดค่า MaterialApp
MaterialApp(
  initialRoute: HomeScreen.routeName,
  routes: {
    HomeScreen.routeName: (context) => const HomeScreen(),
    DetailScreen.routeName: (context) => const DetailScreen(itemId: 'Default ID',
        message: 'From named route'), // ต้องการวิธีส่ง args!
  },
)

// 3. นำทางโดยใช้ชื่อ
Navigator.pushNamed(context, DetailScreen.routeName);`, notes: [
          { at: "DetailScreen.routeName: (context) => const DetailScreen(itemId: 'Default ID',", note: 'routes map เป็นแค่ “ตารางจับคู่ชื่อกับวิธีสร้างหน้า” — **ไม่มีช่องรับค่าที่ต่างกันในแต่ละครั้ง** ได้ Default ID ทุกครั้ง' },
        ] },
        { t: 'code', title: 'ส่งและดึง arguments', src: `// ต้นทาง
Navigator.pushNamed(
  context,
  DetailScreen.routeName,
  arguments: {'itemId': 'Item-456', 'message': 'ข้อมูลผ่าน arguments'},
);

// ปลายทาง: ในเมธอด build ของ DetailScreen
final args = ModalRoute.of(context)?.settings.arguments as Map<String, String>?;
final itemId = args?['itemId'] ?? 'No ID'; // จัดการกรณี null
final message = args?['message'] ?? 'No Message';`, notes: [
          { at: 'as Map<String, String>?;', note: '**เปราะบาง**: ถ้าต้นทางเพิ่ม `\'count\': 3` Map ทั้งก้อนกลายเป็น `Map<String, Object>` แล้ว cast พังตอนรัน · คีย์พิมพ์ผิด (`args?[\'itemid\']`) ได้ null แล้วตกไปใช้ค่าเริ่มต้นเงียบๆ' },
        ] },
        { t: 'viz', id: 'ch09.named', title: 'pushNamed หาเส้นทางตามลำดับ', try: 'ลองทุกคู่: config “routes อย่างเดียว” + args “Map + count: 3” (พังตอนรัน) · config ตำรา + /detail + DetailArgs (ผ่าน) · config ตำรา + /detail + ไม่ส่ง args (ไปหน้าไม่พบหน้า) · /settings' },
        { t: 'code', title: 'ห่อ arguments ด้วยคลาส + onGenerateRoute (ตำรา §9.6)', src: `// lib/screens/detail_args.dart
class DetailArgs {
  final String itemId;
  final String message;
  const DetailArgs({required this.itemId, required this.message});
}

// ใน main.dart -> MyApp.build()
MaterialApp(
  initialRoute: HomeScreen.routeName,
  routes: {
    HomeScreen.routeName: (context) => const HomeScreen(),
    // ไม่ใส่ DetailScreen ไว้ที่นี่ เพราะต้องรับข้อมูลผ่าน constructor
  },
  // ถูกเรียกเมื่อชื่อที่ push มาไม่อยู่ใน routes
  onGenerateRoute: (settings) {
    final args = settings.arguments;
    final isDetail = settings.name == DetailScreen.routeName;
    if (isDetail && args is DetailArgs) {
      return MaterialPageRoute(
        settings: settings, // เก็บชื่อและ arguments ไว้กับ route ด้วย
        builder: (context) => DetailScreen(
          itemId: args.itemId,
          message: args.message,
        ),
      );
    }
    // ไม่รู้จักชื่อนี้ หรือข้อมูลไม่ครบ ส่งต่อให้ onUnknownRoute
    return null;
  },
  // ด่านสุดท้าย แทนที่แอปจะพังเพราะหา route ไม่เจอ
  onUnknownRoute: (settings) => MaterialPageRoute(
    builder: (context) => Scaffold(
      appBar: AppBar(title: const Text('ไม่พบหน้า')),
      body: Center(child: Text('ไม่มีหน้าชื่อ \${settings.name}')),
    ),
  ),
)`, notes: [
          { at: 'if (isDetail && args is DetailArgs) {', note: '`args is DetailArgs` ทั้ง **ตรวจชนิด** และ **แปลงชนิด** ในขั้นเดียว (type promotion) — ในบล็อก if เรียก `args.itemId` ได้ทันที' },
          { at: 'settings: settings,', note: 'ให้ route จำชื่อตัวเองได้ — จำเป็นเมื่อจะย้อนกลับไปหาหน้านี้ด้วยชื่อ (`ModalRoute.withName`) ใน [[9.7]]' },
          { at: 'return null;', note: 'คืน null → Flutter ไปเรียก onUnknownRoute' },
        ] },
        { t: 'steps', items: ['หาชื่อใน `routes` ก่อน', 'ไม่พบ → เรียก `onGenerateRoute`', '`onGenerateRoute` คืน null → เรียก `onUnknownRoute`', 'ไม่มี `onUnknownRoute` ด้วย → error `Could not find a generator for route`'] },
        { t: 'why', choice: 'อ่าน arguments ใน `build()` หรือ `didChangeDependencies()` — **ห้ามใน initState**',
          because: ['`ModalRoute.of(context)` ไม่ได้แค่อ่านค่า แต่ **ลงทะเบียน** ให้วิดเจ็ตถูกสร้างใหม่เมื่อข้อมูลของ route เปลี่ยน', 'การลงทะเบียนนี้ทำใน initState ไม่ได้ เพราะวิดเจ็ตยังติดตั้งเข้า tree ไม่เสร็จ'],
          alts: [
            { alt: 'ถ้าอ่านใน initState จะเป็นอย่างไร?', result: 'error `dependOnInheritedWidgetOfExactType<_ModalScopeStatus>() ... was called before initState() completed` — ที่ถูกคือ `didChangeDependencies()` (บทที่ 11 ใช้รูปแบบนี้ใน [[lab11]])' },
          ] },
        { t: 'why', choice: 'ห่อ arguments ด้วยคลาส (`DetailArgs`) และให้ `onGenerateRoute` แปลงกลับเป็น constructor',
          because: ['คอมไพเลอร์ตรวจชื่อฟิลด์และชนิดทั้งฝั่งส่งและฝั่งรับ เหลือจุดเสี่ยงเพียงบรรทัดเดียว', 'onGenerateRoute เป็น **ด่านตรวจคนเข้าเมือง** — ข้อมูลผิด/ไม่มี ส่งไปหน้าแจ้งข้อผิดพลาดแทนการพัง', 'หน้าจอกลับมารับข้อมูลผ่าน constructor ไม่ต้องรู้จัก ModalRoute เลย'],
          alts: [
            { alt: 'ทำไมไม่ส่ง Map แล้ว cast ต่อไป?', result: 'Map ของคีย์-ค่าเป็น “กล่องพัสดุไม่มีฉลาก” — เพิ่มค่าต่างชนิดเข้าไปตัวเดียว cast ก็พังตอนรัน · พิมพ์คีย์ผิดได้ null เงียบๆ · ถ้าเปิดมาจาก deep link ที่ส่งผิดรูปแบบ หน้าจอพังต่อหน้าผู้ใช้' },
          ] },
        { t: 'callout', kind: 'real', title: 'ทิศทางปัจจุบันของ Flutter (จากตำรา)', body: 'เอกสารทางการ **ไม่แนะนำ named routes สำหรับแอปส่วนใหญ่แล้ว** เหตุผลหลัก: deep link — named routes จะ push หน้านั้นเพิ่มทุกครั้งไม่ว่าผู้ใช้อยู่หน้าไหน (ปรับไม่ได้) และบนเว็บไม่รองรับปุ่ม forward → แอปที่ต้องการสองเรื่องนี้ใช้ **go_router** (สร้างบน Router API / “Navigator 2.0”) — แต่ push/pop/การส่งข้อมูลในบทนี้ยังเป็นพื้นฐาน และ named routes **ยังเพียงพอ** สำหรับแอปเล็กอย่างโปรเจกต์บทที่ 14–15' },
      ],
      quiz: [
        { q: 'เรียก `pushNamed(context, \'/settings\')` ซึ่งไม่อยู่ใน routes, onGenerateRoute คืน null และไม่มี onUnknownRoute ผลคือ?', options: [
          { t: 'error “Could not find a generator for route”', ok: true },
          { t: 'กลับไปหน้าแรก', why: 'ไม่มีพฤติกรรมนี้' },
          { t: 'ไม่มีอะไรเกิดขึ้น', why: 'เป็น error' },
        ] },
        { q: 'ทำไม `ModalRoute.of(context)` จึงเรียกใน initState ไม่ได้?', options: [
          { t: 'มันลงทะเบียน dependency กับ route ซึ่งทำไม่ได้ก่อนวิดเจ็ตติดตั้งเข้า tree เสร็จ', ok: true },
          { t: 'เพราะ initState ไม่มี context', why: 'State มี context แล้ว แต่ยังใช้ลงทะเบียน dependency ไม่ได้' },
          { t: 'เพราะ arguments ยังไม่ถูกส่งมา', why: 'ถูกส่งมาแล้วตั้งแต่ push' },
        ] },
        { q: 'arguments เป็น `{\'itemId\': \'A\', \'count\': 3}` แต่ปลายทาง cast `as Map<String, String>?` ผลคือ?', options: [
          { t: "พังตอนรัน: '_Map<String, Object>' is not a subtype of type 'Map<String, String>?'", ok: true },
          { t: 'compile ไม่ผ่าน', why: 'arguments เป็น Object? คอมไพเลอร์ไม่มีทางรู้' },
          { t: 'count ถูกแปลงเป็น String ให้อัตโนมัติ', why: 'Dart ไม่แปลงให้' },
        ] },
      ],
    },
    {
      id: '9.7', title: 'จัดการ stack ให้มากกว่าการ push และ pop ทีละหน้า', source: '§9.7', exam: true,
      gist: '**login สำเร็จ** → `pushReplacement` (ย้อนกลับไม่เจอหน้า login) · **logout** → `pushAndRemoveUntil(..., (route) => false)` (ล้างทุกหน้า) · **กลับหน้าแรก** → `popUntil((route) => route.isFirst)` · หน้าที่ถูกทับยัง **มี State และงานเบื้องหลังทำงานต่อ**',
      blocks: [
        { t: 'viz', id: 'ch09.stack', name: 'sc', props: { scenarios: true }, title: 'สามสถานการณ์จริง', try: 'เลือกสถานการณ์ แล้วเปรียบเทียบ “push ธรรมดา” กับคำสั่งที่ถูก — ลองกด ← ย้อนกลับหลังทำเสร็จ' },
        { t: 'code', title: 'สามคำสั่ง (ตำรา §9.7)', src: `// หลังเข้าสู่ระบบสำเร็จ: เอาหน้าหลักมาวางแทนที่หน้า login
// กดย้อนกลับจากหน้าหลักจึงไม่วนกลับมาหน้า login อีก
Navigator.pushReplacement(
  context,
  MaterialPageRoute(builder: (context) => const HomeScreen()),
);

// ออกจากระบบ: เปิดหน้า login แล้วล้างทุกหน้าที่อยู่ข้างใต้ทิ้ง
Navigator.pushAndRemoveUntil(
  context,
  MaterialPageRoute(builder: (context) => const LoginScreen()),
  (route) => false, // ตอบ false ทุกหน้า = ไม่เก็บหน้าไหนไว้เลย
);

// ย้อนกลับหลายชั้นรวดเดียวจนถึงหน้าแรกของ stack
Navigator.popUntil(context, (route) => route.isFirst);`, notes: [
          { at: '(route) => false,', note: 'pushAndRemoveUntil ไล่นำหน้าข้างใต้ออกทีละหน้า **จนกว่า** เงื่อนไขตอบ true — ตอบ false ทุกหน้า = ล้างทั้ง stack' },
          { at: 'Navigator.popUntil(context, (route) => route.isFirst);', note: '`route.isFirst` = หน้าล่างสุดของ stack · ถ้าใช้ named routes ใช้ `ModalRoute.withName(\'/\')` หยุดที่หน้าที่ชื่อตรงกัน' },
        ] },
        { t: 'compare', cols: ['สถานการณ์', 'ก่อน', 'ถ้าใช้ push ธรรมดา', 'คำสั่งที่ถูก → หลัง'], rows: [
          ['เข้าสู่ระบบ', '`[Login]`', '`[Login, Home]` กด ← กลับไปหน้ากรอกรหัส', '`pushReplacement` → `[Home]`'],
          ['ออกจากระบบ', '`[Home, Profile, Settings]`', 'ผู้ใช้คนถัดไปกด ← แล้วเห็นข้อมูลคนเดิม', '`pushAndRemoveUntil(…, (r) => false)` → `[Login]`'],
          ['สั่งซื้อสำเร็จ', '`[Home, Product, Cart, Checkout]`', 'ผู้ใช้ต้องกด ← 3 ครั้ง', '`popUntil((r) => r.isFirst)` → `[Home]`'],
        ] },
        { t: 'callout', kind: 'note', title: 'คู่ของ named routes', body: '`pushReplacementNamed` และ `pushNamedAndRemoveUntil` + เงื่อนไข `ModalRoute.withName(\'/\')`' },
        { t: 'why', choice: '**อย่าปล่อยให้ stack ยาวขึ้นเรื่อยๆ** — ใช้ pushReplacement เมื่อไม่ต้องการให้ย้อนกลับ, popUntil / pushAndRemoveUntil เมื่อจบโฟลว์ และหยุดงานเบื้องหลังใน `dispose()`',
          because: ['หน้าที่ถูกทับยังอยู่ใน widget tree ครบพร้อม State (MaterialPageRoute ตั้ง `maintainState: true`) — กดย้อนกลับจึงเห็นหน้าเดิมในสภาพเดิม', 'Flutter ประหยัดให้แค่ไม่จัดวาง/ไม่วาดหน้าที่ถูกทับ และหยุดแอนิเมชัน แต่ **งานที่เริ่มแล้ว (ดึง API, timer) ยังทำงานและกินหน่วยความจำต่อ** (ดู ⏱ ในภาพ)'],
          alts: [
            { alt: 'ทำไมไม่ push ไปเรื่อยๆ ให้ผู้ใช้กดย้อนกลับเองได้ทุกหน้า?', result: 'stack 20 ชั้นยังอยู่ในหน่วยความจำครบ งานเบื้องหลังของ 19 หน้าที่มองไม่เห็นยังทำงาน และผู้ใช้อาจย้อนกลับไปเจอหน้าที่ไม่ควรเห็น (login)', viz: { name: 'sc', mode: 'checkout' } },
          ] },
      ],
      quiz: [
        { q: 'หลังล็อกอินสำเร็จ ต้องการให้กดย้อนกลับจากหน้าหลักแล้ว **ไม่** กลับไปหน้า Login ควรใช้อะไร?', options: [
          { t: '`Navigator.pushReplacement(...)`', ok: true },
          { t: '`Navigator.push(...)`', why: 'stack จะเป็น [Login, Home]' },
          { t: '`Navigator.popUntil(...)`', why: 'popUntil ใช้ย้อนกลับ ไม่ได้เปิดหน้าใหม่' },
        ] },
        { q: '`Navigator.pushAndRemoveUntil(context, route, (route) => false)` ทำอะไร?', options: [
          { t: 'push หน้าใหม่แล้วล้างทุกหน้าที่อยู่ข้างใต้ทิ้ง', ok: true },
          { t: 'push แล้วเก็บทุกหน้าไว้', why: 'เงื่อนไขตอบ false = ไม่เก็บหน้าไหนเลย' },
          { t: 'ไม่ push เลย', why: 'push หน้าใหม่เสมอ' },
        ] },
        { q: 'หน้าที่ถูกทับอยู่ใน stack ข้อใดถูก?', options: [
          { t: 'ยังมี State ครบ ไม่ถูกวาด แต่ timer/งาน API ที่เริ่มไว้ยังทำงานต่อ', ok: true },
          { t: 'ถูก dispose ทันทีที่มีหน้าอื่นทับ', why: 'dispose เมื่อถูกนำออกจาก stack เท่านั้น' },
          { t: 'ทุกอย่างหยุดทำงาน รวมถึง timer', why: 'Flutter หยุดแค่การวาดและแอนิเมชัน' },
        ] },
      ],
    },
    {
      id: '9.8', title: 'ควบคุมการย้อนกลับด้วย PopScope', source: '§9.8', exam: true,
      gist: '`PopScope(canPop: !_dirty, onPopInvokedWithResult: …)` ดักการย้อนกลับ **ทุกช่องทาง** (AppBar, ปุ่ม Back Android, ปัด iOS) · `canPop` ต้อง **บอกไว้ล่วงหน้า** เพราะท่าปัด/predictive back ต้องรู้ก่อนนิ้วเริ่มลาก · `showDialog` ก็คือการ push route',
      blocks: [
        { t: 'viz', id: 'ch09.popscope', title: 'กันข้อความที่พิมพ์ค้างไว้หาย', try: 'ลองย้อนกลับตอนยังไม่พิมพ์ (ผ่าน) → กดเริ่มใหม่ → พิมพ์อะไรก็ได้ แล้วลองย้อนกลับทั้ง 3 ช่องทาง ดู stack ตอน dialog เปิด และลองปัดจากขอบเทียบสองกรณี' },
        { t: 'code', title: 'EditNoteScreen (ตำรา §9.8)', src: `class _EditNoteScreenState extends State<EditNoteScreen> {
  bool _dirty = false; // ผู้ใช้พิมพ์อะไรไปแล้วหรือยัง

  Future<bool> _confirmDiscard() async {
    // showDialog ก็คือการ push route ใหม่ขึ้นบน stack เช่นกัน
    final discard = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('ทิ้งการแก้ไข?'),
        content: const Text('ข้อความที่พิมพ์ไว้จะหายไป'),
        actions: [
          TextButton(
            // ปิด dialog พร้อมส่งผลลัพธ์กลับ
            onPressed: () => Navigator.pop(context, false),
            child: const Text('แก้ต่อ'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('ทิ้ง'),
          ),
        ],
      ),
    );
    // แตะนอกกรอบ dialog จะได้ null ถือว่าไม่ทิ้ง
    return discard ?? false;
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_dirty, // ยังไม่ได้พิมพ์อะไร ปล่อยให้ย้อนกลับได้ตามปกติ
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return; // ย้อนกลับไปเรียบร้อยแล้ว ไม่ต้องทำอะไรต่อ
        final discard = await _confirmDiscard();
        if (discard && context.mounted) {
          Navigator.pop(context); // ผู้ใช้ยืนยันแล้ว จึงสั่งปิดหน้าเอง
        }
      },
      child: Scaffold(
        appBar: AppBar(title: const Text('แก้ไขบันทึก')),
        body: TextField(
          onChanged: (_) {
            if (!_dirty) setState(() => _dirty = true);
          },
        ),
      ),
    );
  }
}`, notes: [
          { at: 'canPop: !_dirty,', note: 'บอก **ล่วงหน้า** ว่าตอนนี้ยอมให้ย้อนกลับหรือไม่ — เมื่อ _dirty เปลี่ยน setState ทำให้ค่านี้อัปเดต' },
          { at: 'if (didPop) return;', note: '`didPop: true` = ย้อนกลับไปเรียบร้อยแล้ว (canPop เป็น true) · `false` = มีคนพยายามย้อนกลับแต่ถูกกันไว้ → ถามผู้ใช้' },
          { at: 'if (discard && context.mounted) {', note: 'หลัง await ตรวจ mounted อีกครั้ง ([[9.5]])' },
          { at: 'return discard ?? false;', note: 'dialog ก็ส่งผลลัพธ์กลับด้วย pop เหมือน [[9.5]] ทุกประการ — แตะนอกกรอบได้ null' },
        ] },
        { t: 'why', choice: 'ใช้ **PopScope** (canPop + onPopInvokedWithResult)',
          because: ['ดักได้ทุกช่องทางการย้อนกลับในที่เดียว', 'canPop ประกาศล่วงหน้า ทำให้ท่าปัดของ iOS และ predictive back ของ Android รู้ตั้งแต่ก่อนนิ้วลากว่าจะแสดงแอนิเมชันเผยหน้าก่อนหน้าหรือไม่'],
          alts: [
            { alt: 'ทำไมไม่ใช้ `WillPopScope` แบบที่บทความเก่าใช้?', result: 'ถูกเลิกใช้แล้ว เพราะมันตัดสินใจ “ตอนผู้ใช้กด” ซึ่งช้าเกินไปสำหรับ predictive back' },
            { alt: 'ทำไมไม่ใช้ `onPopInvoked` ของ PopScope รุ่นแรก?', result: 'ถูกแทนที่ด้วย `onPopInvokedWithResult` แล้ว' },
            { alt: 'ทำไมไม่ดักเฉพาะปุ่มย้อนกลับใน AppBar?', result: 'ผู้ใช้ปัดขอบจอหรือกดปุ่ม Back ของระบบได้ — ข้อความยังหายอยู่ดี' },
          ] },
      ],
      quiz: [
        { q: '`canPop` เป็น false แล้วผู้ใช้กดปุ่ม Back ของ Android จะเกิดอะไร?', options: [
          { t: 'การย้อนกลับถูกระงับ แล้ว Flutter เรียก onPopInvokedWithResult โดย didPop เป็น false', ok: true },
          { t: 'ย้อนกลับตามปกติ แล้วเรียก onPopInvokedWithResult(true)', why: 'canPop false = ไม่ย้อนกลับ' },
          { t: 'แอปปิดตัว', why: 'ไม่ใช่' },
        ] },
        { q: 'ทำไม PopScope ต้องรู้ค่า canPop **ล่วงหน้า**?', options: [
          { t: 'ท่าปัด iOS และ predictive back ต้องรู้ก่อนนิ้วลากว่าจะแสดงแอนิเมชันเผยหน้าก่อนหน้าหรือไม่', ok: true },
          { t: 'เพื่อให้โค้ดทำงานเร็วขึ้น', why: 'ไม่ใช่เรื่องความเร็ว' },
          { t: 'เพราะ Dart ไม่รองรับ async ใน callback', why: 'onPopInvokedWithResult เป็น async ได้' },
        ] },
        { q: '`showDialog` มีความสัมพันธ์กับ Navigator อย่างไร?', options: [
          { t: 'เป็นการ push route ใหม่ขึ้นบน stack เดียวกัน ปิดด้วย Navigator.pop พร้อมผลลัพธ์', ok: true },
          { t: 'แสดงทับหน้าจอโดยไม่เกี่ยวกับ stack', why: 'dialog คือ route หนึ่ง' },
          { t: 'แทนที่หน้าปัจจุบัน', why: 'เป็นการ push ไม่ใช่ replace' },
        ] },
      ],
    },
    {
      id: '9.9', title: 'เลือกวิธีส่งข้อมูลให้เหมาะกับงาน', source: '§9.9',
      gist: '**constructor** = ค่าเริ่มต้นที่ควรเลือกก่อน · **arguments** = เมื่อใช้ named routes (ห่อด้วยคลาส) · **ผลลัพธ์ pop** = หน้าที่ถามคำถามเดียว · ข้อมูลที่ **หลายหน้าใช้ร่วมกัน** → ไม่เหมาะกับวิธีใดในบทนี้ → **บทที่ 10**',
      blocks: [
        { t: 'viz', id: 'decision', title: 'ผังเลือกวิธีส่งข้อมูล', props: { start: 'q1', nodes: {
          q1: { q: 'ข้อมูลนี้มีกี่หน้าที่ต้องใช้/เห็นค่าเดียวกัน?', options: [{ label: 'หน้าปลายทางหน้าเดียว', next: 'q2' }, { label: 'หลายหน้า / เปลี่ยนตลอดเวลา', next: 'rProv' }] },
          q2: { q: 'ทิศทางของข้อมูล?', options: [{ label: 'ส่งไปตอนเปิดหน้า', next: 'q3' }, { label: 'ส่งกลับตอนปิดหน้า (ถามคำถามเดียว)', next: 'rPop' }] },
          q3: { q: 'โปรเจกต์ใช้ named routes หรือไม่?', options: [{ label: 'ไม่ (push + MaterialPageRoute)', next: 'rCtor' }, { label: 'ใช่', next: 'rArgs' }] },
          rCtor: { result: 'ส่งผ่าน constructor', why: 'คอมไพเลอร์ตรวจครบทั้งชื่อและชนิด ([[9.4]])' },
          rArgs: { result: 'arguments ห่อด้วยคลาส แล้วแปลงเป็น constructor ใน onGenerateRoute', why: 'ชดเชยการที่ arguments เป็น Object? ([[9.6]])' },
          rPop: { result: 'ผลลัพธ์ของ pop + await push<T>', why: 'เช่น หน้าเลือกสี เลือกที่อยู่ dialog ยืนยัน ([[9.5]])' },
          rProv: { result: 'ย้ายไปที่เก็บส่วนกลาง (Provider — บทที่ 10)', why: 'ถ้าหน้า A ต้องส่งผ่าน B เพียงเพื่อให้ถึง C โดย B ไม่ได้ใช้ หรือหลายหน้าต้องเห็นค่าเดียวกันที่เปลี่ยนตลอด — นั่นคือสัญญาณ ([[10.1]])' },
        } } },
        { t: 'callout', kind: 'exam', title: 'ข้อสังเกตที่ตำราย้ำ', body: 'constructor และ arguments เป็นการส่งค่า **ครั้งเดียว ณ เวลาที่ push** — หน้ารายการที่อยู่ข้างใต้ไม่มีทางรู้ว่าหน้ารายละเอียดเปลี่ยนอะไรไป จนกว่าจะได้ผลลัพธ์กลับผ่าน pop แล้วนำไปอัปเดตด้วย `setState` เอง' },
      ],
      quiz: [
        { q: 'หน้าเลือกที่อยู่จัดส่ง (ถามคำถามเดียว) ควรส่งผลกลับอย่างไร?', options: [
          { t: '`Navigator.pop(context, address)` + `await Navigator.push<Address>(...)`', ok: true },
          { t: 'ผ่าน constructor ของหน้าก่อนหน้า', why: 'constructor ส่งได้ทางเดียวตอนเปิดหน้า' },
          { t: 'Provider เสมอ', why: 'เกินจำเป็นสำหรับคำถามเดียว' },
        ] },
        { q: 'สัญญาณใดบอกว่าข้อมูลควรย้ายไปที่เก็บส่วนกลาง?', options: [
          { t: 'หน้า B ต้องรับข้อมูลเพียงเพื่อส่งต่อให้หน้า C โดยที่ B ไม่ได้ใช้เอง', ok: true },
          { t: 'ข้อมูลเป็น String', why: 'ชนิดข้อมูลไม่เกี่ยว' },
          { t: 'มีแค่สองหน้าในแอป', why: 'แอปเล็กแบบนี้ constructor/pop ก็พอ' },
        ] },
      ],
    },
    {
      id: 'lab9', title: 'ปฏิบัติการบทที่ 9: navigate_route', short: 'แลป', source: 'ปฏิบัติการ',
      gist: 'โปรเจกต์ `navigate_route` มี `lib/screens/home_screen.dart` และ `detail_screen.dart` · 5 แบบฝึกหัด: push/pop → ส่ง message → รับผลกลับ → named routes → arguments (Map) · ความท้าทาย: DetailArgs + onGenerateRoute, PopScope, login/logout',
      blocks: [
        { t: 'viz', id: 'ch09.lab', title: 'แอปในแลปตามแบบฝึกหัด', try: 'เลือกแบบฝึกหัดทีละข้อ แล้วกดไปหน้ารายละเอียดและย้อนกลับ · แบบฝึกหัด 3 ลองย้อนกลับด้วยปุ่มของระบบ' },
        { t: 'code', lang: 'text', title: 'โครงสร้างโปรเจกต์', src: `lib/
├── screens/
│   ├── home_screen.dart
│   └── detail_screen.dart
└── main.dart` },
        { t: 'steps', items: [
          '**Setup**: HomeScreen (ปุ่ม “ไปที่รายละเอียด”) และ DetailScreen (ปุ่ม “ย้อนกลับ”) — ใช้ `debugPrint` เพราะ `print` ถูกเตือนด้วยกฎ `avoid_print`',
          '**แบบฝึกหัด 1**: `Navigator.push(... const DetailScreen())` และ `Navigator.pop(context)` — ปุ่ม Back ของระบบก็ pop ได้เหมือนกัน',
          "**แบบฝึกหัด 2**: `final String message;` + `required this.message` แล้วส่ง `message: 'ข้อมูลส่งมาจากหน้าหลัก!'`",
          "**แบบฝึกหัด 3**: `Navigator.pop(context, 'สำเร็จ! ข้อมูลจากรายละเอียด')` + `onPressed: () async { final result = await Navigator.push(...); if (context.mounted) {...} }`",
          "**แบบฝึกหัด 4**: `static const routeName` ทั้งสองหน้า, `initialRoute` + `routes` (ลบ `home`), `pushNamed` — ต้อง **restart เต็มรูปแบบ** หลังแก้ MaterialApp",
          "**แบบฝึกหัด 5**: `pushNamed(..., arguments: {'id': 'ARG-789', 'title': ...})` แล้วอ่านด้วย `ModalRoute.of(context)?.settings.arguments as Map<String, String>?`",
        ] },
        { t: 'code', title: 'แบบฝึกหัด 3: HomeScreen (StatelessWidget) รอผลลัพธ์', src: `onPressed: () async { // ทำให้ onPressed เป็น async
  final result = await Navigator.push( // await ผลลัพธ์
    context,
    MaterialPageRoute(
      builder: (context) => const DetailScreen(
        message: 'ข้อมูลส่งมาจากหน้าหลัก!',
      ),
    ),
  );

  // จัดการผลลัพธ์เมื่อ DetailScreen pop กลับมา
  if (context.mounted) { // ตรวจสอบว่า widget ยังอยู่ใน tree
    String messageToShow;
    if (result != null && result is String) {
      messageToShow = 'ผลลัพธ์: $result';
    } else {
      messageToShow = 'ไม่มีผลลัพธ์ส่งกลับมา';
    }
    ScaffoldMessenger.of(context)
      ..removeCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(messageToShow)));
  }
},`, notes: [
          { at: 'final result = await Navigator.push( // await ผลลัพธ์', note: '**จุดที่ปรับปรุงได้**: แลปใช้ push แบบไม่ระบุชนิด (result เป็น dynamic) จึงต้องเช็ก `result is String` เอง — ตาม [[9.5]] ควรเขียน `Navigator.push<String>(...)` แล้วจะได้ `String?`' },
          { at: 'if (context.mounted) {', note: 'HomeScreen ในแลปเป็น **StatelessWidget** จึงใช้ `context.mounted` (ไม่มี `mounted` ของคลาส State)' },
        ] },
        { t: 'h', text: 'ความท้าทายเพิ่มเติม' },
        { t: 'list', ordered: true, items: [
          'เปลี่ยน Map เป็นคลาส `DetailArgs` + ย้ายการสร้าง DetailScreen ไป `onGenerateRoute` ให้รับผ่าน constructor แล้วลอง pushNamed **โดยไม่ส่ง arguments** + เพิ่ม `onUnknownRoute` (ดู [[9.6]])',
          'เพิ่ม TextField ในหน้ารายละเอียดแล้วครอบด้วย PopScope ทดสอบทั้ง 3 ช่องทางการย้อนกลับ ([[9.8]])',
          'เพิ่ม LoginScreen เป็นหน้าแรก: เข้าสู่ระบบด้วย `pushReplacement`, ออกจากระบบด้วย `pushAndRemoveUntil` แล้วตรวจว่าย้อนกลับจากทุกหน้าไม่วนไปหน้าที่ควรถูกล้าง ([[9.7]])',
        ] },
      ],
      quiz: [
        { q: 'หลังเปลี่ยน MaterialApp ไปใช้ `routes` ในแบบฝึกหัด 4 ทำไมต้อง restart เต็มรูปแบบ?', options: [
          { t: 'Navigator ถูกสร้างไปแล้วพร้อม stack เดิม — `initialRoute` (และการเปลี่ยนจาก `home`) มีผลตอนสร้าง Navigator ครั้งแรกเท่านั้น hot reload จึงไม่เห็นผล', ok: true },
          { t: 'เพราะ named routes ใช้ได้เฉพาะ release mode', why: 'ใช้ได้ทุกโหมด' },
          { t: 'ไม่จำเป็นต้อง restart', why: 'ตำราระบุว่าต้องรีสตาร์ทเต็มรูปแบบ' },
        ] },
        { q: 'ในแบบฝึกหัด 3 ถ้าผู้ใช้กดปุ่ม Back ของระบบแทนปุ่ม “ย้อนกลับ” SnackBar จะแสดงอะไร?', options: [
          { t: '“ไม่มีผลลัพธ์ส่งกลับมา” เพราะ result เป็น null', ok: true },
          { t: '“ผลลัพธ์: สำเร็จ! …”', why: 'ปุ่มระบบไม่ได้ส่งผลลัพธ์' },
          { t: 'แอปพัง', why: 'โค้ดเช็ก null แล้ว' },
        ] },
      ],
    },
  ],
  rules: [
    'แยกทุกหน้าจอเป็นคลาสของตัวเอง — context ต้องอยู่ใต้ MaterialApp จึงหา Navigator เจอ',
    '`Navigator.push(context, MaterialPageRoute(builder: (context) => Screen(...)))`',
    'อย่า pop หน้าสุดท้าย (จอดำ) → `Navigator.canPop` / `Navigator.maybePop`',
    'ส่งข้อมูลไป: constructor + `required` (คอมไพเลอร์ตรวจให้)',
    'รับข้อมูลกลับ: `final r = await Navigator.push<T>(...)` + `Navigator.pop(context, value)` · รองรับ `null` เสมอ',
    'หลัง await: `if (!mounted) return;` (State) หรือ `context.mounted` (Stateless)',
    'เมธอดที่ใช้ context นอก build ต้องอยู่ในคลาส State',
    'named routes: `static const routeName` · อ่าน arguments ใน build/didChangeDependencies **ไม่ใช่ initState**',
    'arguments ห่อด้วยคลาส + `onGenerateRoute` (`args is DetailArgs`) + `onUnknownRoute`',
    'login → `pushReplacement` · logout → `pushAndRemoveUntil(…, (r) => false)` · กลับหน้าแรก → `popUntil((r) => r.isFirst)`',
    'หน้าที่ถูกทับยังมี State และงานเบื้องหลัง → หยุดงานใน `dispose()`',
    'ฟอร์มที่กรอกค้าง → `PopScope(canPop: !_dirty, onPopInvokedWithResult: ...)` (ไม่ใช่ WillPopScope)',
    'ข้อมูลที่หลายหน้าใช้ร่วมกัน → ไม่ใช่งานของ Navigator → Provider (บทที่ 10)',
  ],
  handsOff: { heading: 'คำถามชวนคิดท้ายบท (9.11)', body: [
    { t: 'callout', kind: 'exam', title: 'คำถามจากตำรา', body: '“สมมติว่าเรากำลังสร้างแอปร้านค้าที่มีสามหน้า คือหน้ารายการสินค้า หน้ารายละเอียดสินค้า และหน้าตะกร้า ปุ่มเพิ่มลงตะกร้าอยู่ในหน้ารายละเอียด ส่วนตัวเลขจำนวนสินค้าในตะกร้าต้องแสดงที่มุมขวาบนของทั้งสามหน้า ด้วยเครื่องมือจากบทนี้เพียงอย่างเดียว คือ constructor, arguments และผลลัพธ์จาก pop ลองออกแบบดูว่า **รายการในตะกร้าควรเก็บไว้ที่หน้าใด** … หน้ารายการจะรู้ได้อย่างไรว่าต้องเปลี่ยนตัวเลข … ข้อมูลต้องเดินทางผ่านกี่ทอด และถ้าในอนาคตมีหน้าที่สี่และห้า **ต้องแก้โค้ดกี่จุด**” — แล้วเทียบกับบทที่ 10 ซึ่งเปิดด้วยสถานการณ์เดียวกันนี้' },
    { t: 'viz', id: 'ch09.cart', title: 'ลองตอบด้วยเครื่องมือของบทนี้เท่านั้น', try: 'กดทีละขั้น สังเกตว่าข้อมูลต้องผ่านหน้าที่ไม่ได้ใช้มัน และจุดที่ต้องแก้สะสมขึ้นเมื่อเพิ่มหน้า' },
    'ตำราปิดบทว่า “แม้ว่า setState จะดีสำหรับ state เฉพาะที่ การจัดการ state ข้ามหลายหน้าจอ … จะกลายเป็นเรื่องยาก” → [[ch10|บทที่ 10: Provider]]',
  ] },
  quiz: [
    { q: 'โค้ด `Navigator.push(context, ...)` ที่เขียนใน build ของ MyApp (ซึ่งคืน MaterialApp) จะเป็นอย่างไร?', options: [
      { t: 'คอมไพล์ผ่าน แต่กดแล้ว error เพราะ context อยู่เหนือ Navigator', ok: true },
      { t: 'คอมไพล์ไม่ผ่าน', why: 'คอมไพเลอร์ไม่รู้ตำแหน่งใน tree' },
      { t: 'ทำงานปกติ', why: 'การไล่ขึ้นจาก MyApp ไม่เจอ Navigator' },
    ] },
    { type: 'multi', q: 'ช่องทางใดที่ทำให้ `await Navigator.push<T>` ได้ผลลัพธ์เป็น null (เลือกทุกข้อที่ถูก)', options: [
      { t: 'ลูกศรย้อนกลับใน AppBar', ok: true },
      { t: 'ปุ่ม Back ของ Android', ok: true },
      { t: 'ปัดจากขอบจอบน iOS', ok: true },
      { t: "`Navigator.pop(context, 'A')`", why: 'ส่ง A กลับ' },
    ] },
    { q: 'ควรสร้าง DetailScreen ที่ต้องรับข้อมูลผ่าน constructor ในส่วนใดของ MaterialApp ตามตัวอย่างในตำรา?', options: [
      { t: '`onGenerateRoute` โดยตรวจ `args is DetailArgs`', ok: true },
      { t: '`routes` map', why: 'routes map ส่งค่าที่ต่างกันในแต่ละครั้งไม่ได้' },
      { t: '`home`', why: 'home คือหน้าแรกเท่านั้น' },
    ] },
    { q: 'ผู้ใช้ออกจากระบบจากหน้าตั้งค่าที่อยู่ลึก 3 ชั้น คำสั่งใดถูกต้อง?', options: [
      { t: '`Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginScreen()), (route) => false)`', ok: true },
      { t: '`Navigator.push(context, … LoginScreen)`', why: 'ผู้ใช้คนถัดไปกดย้อนกลับแล้วเห็นข้อมูลเดิม' },
      { t: '`Navigator.pop(context)` สามครั้ง', why: 'กลับไปหน้าหลัก ไม่ใช่หน้า Login' },
    ] },
  ],
};
