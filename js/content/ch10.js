/* บทที่ 10 — ความรู้เบื้องต้นเกี่ยวกับแพ็กเกจการจัดการ State (Provider) */
FR.content.ch10 = {
  id: 'ch10', kind: 'chapter', num: '10', navTitle: 'Provider เบื้องต้น', crumb: 'บทที่ 10',
  title: 'ความรู้เบื้องต้นเกี่ยวกับแพ็กเกจการจัดการ State (Provider)',
  problem: '`setState` ดีมากกับ state ของวิดเจ็ตเดียว แต่เมื่อ state ต้อง **แชร์ข้ามหน้าจอ** (ล็อกอิน, ธีม, ตะกร้า) การ “ยก state ขึ้น” แล้วส่งผ่าน constructor/callback หลายชั้นจะยุ่งยาก ผิดง่าย และปน logic กับ UI',
  tools: ['ChangeNotifier + notifyListeners()', 'ChangeNotifierProvider', 'context.watch / context.read', 'Consumer / select (แนะนำ)'],
  receives: { title: 'ต่อจากบทที่ 9 (คำถาม 9.11) และบทที่ 8 (คำถาม 8.14)', body: 'บทที่ 9 ถามเรื่อง **ตัวเลขตะกร้าที่ต้องแสดงทั้งสามหน้า** ด้วยเครื่องมือแค่ constructor/arguments/pop และบทที่ 8 ถามว่า “หน้าฟอร์มควรรู้หรือไม่ว่าข้อมูลจะถูกเก็บไว้ที่ไหน” — บทนี้ตอบด้วยการแยกข้อมูลออกไปไว้ใน **ที่เก็บกลาง (Provider)** ที่ทุกหน้าอ่านได้ตรงๆ' },
  overview: [
    { t: 'h', text: 'ภาพใหญ่: ย้าย state ออกจากต้นไม้ ไปไว้ “เหนือ” ต้นไม้' },
    'แทนที่จะส่งข้อมูลลงทีละชั้นแล้วส่ง callback ขึ้นทีละชั้น เราวาง **โมเดล (ChangeNotifier)** ไว้เหนือทุกวิดเจ็ตที่ต้องใช้ แล้วให้แต่ละวิดเจ็ต **หยิบเอง**: วิดเจ็ตที่แสดงค่าใช้ `watch` (ฟังและ build ใหม่เมื่อค่าเปลี่ยน) วิดเจ็ตที่สั่งงานใช้ `read` (แค่หยิบมาเรียกเมธอด)',
    { t: 'viz', id: 'ch10.drill', title: 'ตะกร้าสินค้า: ยก state ขึ้น vs Provider', try: 'กดเพิ่มลงตะกร้าในโหมดแรก (สังเกตลูกศรผ่าน ProductList/ProductCard และจำนวนที่ build ใหม่) แล้วสลับเป็น Provider แล้วกดอีกครั้ง' },
    { t: 'compare', cols: ['คำถาม', 'คำตอบ', 'หัวข้อ'], rows: [
      ['setState มีปัญหาอะไรเมื่อแอปใหญ่', 'แชร์ข้ามหน้ายาก, tree ลึก, logic ปน UI', '[[10.1]]'],
      ['แพ็กเกจจัดการ state ให้อะไร', '5 ประโยชน์', '[[10.2]]'],
      ['Provider ประกอบด้วยอะไร', 'ChangeNotifier, ChangeNotifierProvider, watch/read/Consumer/select', '[[10.3]]'],
      ['ใช้งานอย่างไร', '3 ขั้น: model → provide → consume', '[[10.4]]'],
      ['ติดตั้ง', '`provider: ^6.1.2` + `flutter pub get`', '[[10.5]]'],
      ['ลงมือ', 'refactor ตัวนับ', '[[lab10]]'],
    ] },
    { t: 'callout', kind: 'supp', title: 'ปูพื้น: Provider สร้างบน InheritedWidget', body: 'ตำราบอกว่า Provider คือ “wrapper รอบ InheritedWidget” แต่ไม่ได้อธิบาย InheritedWidget — ดูภาพที่ [[core/c3]] แล้วจะเข้าใจว่าทำไม `watch` ใช้ใน build ได้ แต่ใช้ใน onPressed ไม่ได้' },
  ],
  sections: [
    {
      id: '10.1', title: 'บทนำ: ความท้าทายของ setState ในแอปขนาดใหญ่', source: '§10.1',
      gist: 'setState เหมาะกับ **ephemeral state** แต่มีปัญหา 3 ข้อเมื่อแอปโต: **state ที่แชร์ข้ามหน้าจอ**, **widget tree ที่ลึก** (ส่งลง/ส่งกลับหลายชั้น), และ **logic ปนกับ UI**',
      blocks: [
        { t: 'viz', id: 'ch10.drill', name: 'drill', title: 'ปัญหา “ทางผ่าน” เมื่อยก state ขึ้น', try: 'สังเกตชั้น ProductList / ProductCard ที่ต้องรับ `cart`, `onAdd` ทั้งที่ไม่ได้ใช้เอง' },
        { t: 'list', items: [
          '**State ที่ต้องแชร์ข้ามหน้าจอ**: ล็อกอิน ธีม รถเข็น — ต้องเข้าถึงได้จากหลายส่วนที่ไม่ได้เชื่อมกันโดยตรงใน tree',
          '**Widget tree ที่ลึก**: ส่ง state ลงหลายชั้นด้วย constructor และส่ง callback กลับขึ้นหลายชั้น (“lifting state up”) ยุ่งยาก ผิดง่าย อ่านยาก',
          '**การแยก concerns**: business logic อยู่ใน setState ของ UI ทำให้ทดสอบ ดูแล และเข้าใจยาก',
        ] },
        'ตำราเลือก **Provider** เพราะเข้าถึงง่ายและนิยม สร้างบน InheritedWidget แต่ API ใช้ง่ายกว่า (ตัวอื่นที่มี: Riverpod, BLoC/Cubit, GetX, MobX — แต่ละตัวมีแนวทางต่างกัน)',
        { t: 'why', choice: 'ใช้ **แพ็กเกจจัดการ state** กับ app state ที่แชร์',
          because: ['วิดเจ็ตที่ต้องใช้หยิบเองได้โดยตรง ไม่ต้องผ่านชั้นที่ไม่เกี่ยว', 'ย้าย logic ออกจาก UI ไปไว้ในคลาสที่ทดสอบแยกได้'],
          alts: [
            { alt: 'ทำไมไม่ใช้ setState + ยก state ขึ้นต่อไป?', result: 'ชั้นที่อยู่ระหว่างกลางต้องรับ/ส่งข้อมูลที่ไม่ได้ใช้ (ทางผ่าน) และ setState ที่ชั้นบนทำให้ทั้ง subtree build ใหม่', ok: 'state แชร์แค่ parent–child ชั้นเดียว ([[7.8]])', viz: { name: 'drill', mode: 'drill' } },
          ] },
      ],
      quiz: [
        { type: 'multi', q: 'ปัญหาใดที่ตำรายกเป็นข้อจำกัดของการใช้ setState กับแอปขนาดใหญ่ (เลือกทุกข้อที่ถูก)', options: [
          { t: 'state ที่ต้องแชร์ข้ามหน้าจอ', ok: true },
          { t: 'ต้องส่ง state/callback ผ่าน tree หลายชั้น', ok: true },
          { t: 'logic ปนอยู่ในโค้ด UI ทำให้ทดสอบยาก', ok: true },
          { t: 'setState ใช้กับตัวเลขไม่ได้', why: 'ใช้ได้กับข้อมูลทุกชนิด' },
        ] },
      ],
    },
    {
      id: '10.2', title: 'ทำไมต้องใช้ State Management Package?', source: '§10.2',
      gist: '5 ประโยชน์: **แยก concerns**, **เข้าถึง state ง่าย**, **ลด boilerplate**, **rebuild เฉพาะที่จำเป็น**, **ปรับขนาดได้**',
      blocks: [
        { t: 'compare', cols: ['ประโยชน์', 'ก่อน (setState + ยก state ขึ้น)', 'หลัง (แพ็กเกจจัดการ state)'], rows: [
          ['1. แยก concerns', 'logic อยู่ใน State ของหน้าจอ', 'UI แสดงผล + ส่งต่อการกระทำ · โมเดลจัดการข้อมูลและแจ้ง UI'],
          ['2. เข้าถึง state ง่ายขึ้น', 'ส่งผ่าน constructor/callback หลายชั้น', 'วิดเจ็ตหยิบจาก provider ด้านบนโดยตรง'],
          ['3. ลด boilerplate', 'พารามิเตอร์ซ้ำๆ ในทุกชั้นทางผ่าน', 'ไม่ต้องมีพารามิเตอร์ทางผ่าน'],
          ['4. ประสิทธิภาพ', 'setState ที่ชั้นบน → build ทั้ง subtree', 'build เฉพาะวิดเจ็ตที่ฟังอยู่'],
          ['5. ปรับขนาดได้', 'เพิ่มหน้า = แก้หลายจุด', 'เพิ่มหน้า = หยิบจาก provider จุดเดียว'],
        ] },
        { t: 'callout', kind: 'note', title: 'ประโยชน์ข้อ 4 ไม่ได้มาเอง', body: 'Provider ช่วยให้ rebuild แคบลงได้ **ถ้าเลือกวิธีฟังให้พอดี** — ถ้าใช้ `watch` ที่บนสุดของหน้า ก็ยัง build ทั้งหน้า (บทที่ 11 ลงลึกเรื่องนี้ [[11.4]])' },
      ],
      quiz: [
        { q: '“UI มีหน้าที่แสดง state และส่งต่อการกระทำของผู้ใช้ ส่วนตรรกะ state จัดการข้อมูลและแจ้ง UI” คือประโยชน์ข้อใด?', options: [
          { t: 'การแยก Concerns (Separation of Concerns)', ok: true },
          { t: 'ลด Boilerplate', why: 'เรื่องลดโค้ดซ้ำ' },
          { t: 'Scalability', why: 'เรื่องรองรับแอปใหญ่' },
        ] },
      ],
    },
    {
      id: '10.3', title: 'ขอแนะนำ Provider', source: '§10.3', exam: true,
      gist: 'Provider = “wrapper รอบ InheritedWidget” · **ChangeNotifier** (คลาสของ Flutter) แจ้งผู้ฟัง · **ChangeNotifierProvider** วางอินสแตนซ์ไว้ใน tree · ฝั่งใช้: `watch` (ฟัง, ใน build) / `read` (ไม่ฟัง, ใน callback) / `Consumer` (ฟังเฉพาะกิ่ง) / `select` (ฟังเฉพาะค่า)',
      blocks: [
        { t: 'kv', items: [
          ['ChangeNotifier', 'คลาสพื้นฐานของ **Flutter** (ไม่ใช่ของ Provider) ให้กลไก `notifyListeners()` — โมเดลของเรา `extends ChangeNotifier`'],
          ['ChangeNotifierProvider', 'วิดเจ็ตจากแพ็กเกจ provider ที่ **ให้** อินสแตนซ์แก่ลูกหลานใน tree'],
          ['context.watch<T>()', 'อ่านค่า **และ** ทำให้วิดเจ็ต rebuild เมื่อ notifyListeners() — **ใช้ใน build**'],
          ['context.read<T>()', 'อ่านค่า/เรียกเมธอด **โดยไม่** rebuild — เหมาะกับ event handler (`onPressed`) · **ไม่ควรใช้ใน build** ถ้าต้องการให้ UI อัปเดต'],
          ['Consumer<T>', 'วิดเจ็ตที่มี builder ถูกเรียกใหม่เมื่อเปลี่ยน — rebuild เฉพาะส่วนเล็กแทนทั้ง build ของแม่'],
          ['context.select<T, R>()', 'เลือกเฉพาะส่วนที่สนใจ — rebuild เมื่อค่าที่เลือกเปลี่ยนเท่านั้น'],
        ] },
        { t: 'viz', id: 'ch10.api', name: 'api', title: 'ใครฟัง ใคร build ใหม่', try: 'เลือกแต่ละวิธี แล้วกด “likes เปลี่ยน” กับ “name เปลี่ยน” — เทียบว่าส่วนไหนกะพริบ (👂 = จุดที่สมัครฟัง)' },
        { t: 'why', choice: '`watch` ใน **build** · `read` ใน **callback**',
          because: ['watch ลงทะเบียนวิดเจ็ตเป็นผู้ฟังขณะ build — จึงถูก build ใหม่เมื่อค่าเปลี่ยน', 'ใน onPressed เราแค่ต้องหยิบอินสแตนซ์มาเรียกเมธอดครั้งเดียว ไม่ต้องการให้ปุ่ม rebuild'],
          alts: [
            { alt: 'ทำไมไม่ใช้ `read` ใน build เพื่อแสดงค่า?', result: 'วิดเจ็ตไม่ได้ลงทะเบียนเป็นผู้ฟัง → ค่าบนจอ **ค้าง** แม้โมเดลเปลี่ยน', viz: { name: 'api', mode: 'read' } },
            { alt: 'ทำไมไม่ใช้ `watch` ใน onPressed? (เสริม)', result: 'watch ต้องถูกเรียกระหว่าง build เท่านั้น — เรียกใน callback Provider จะโยน error ว่าใช้ watch นอก build (ให้ใช้ read)' },
          ] },
        { t: 'callout', kind: 'supp', title: 'ทำไมเรียกว่า “wrapper รอบ InheritedWidget”', body: '**InheritedWidget** คือกลไกของ Flutter สำหรับส่งข้อมูลลงไปทั้งกิ่ง และจำว่าใคร “พึ่งพา” มันเพื่อแจ้งให้ build ใหม่ (`Theme.of(context)` ทำงานแบบนี้) — Provider ห่อกลไกนี้ + เพิ่มการสร้าง/ทำลายโมเดลและการฟัง ChangeNotifier ให้ · `watch` ≈ “ลงทะเบียนพึ่งพา” · `read` ≈ “แค่หยิบมาดูครั้งเดียว” ([[core/c3]])' },
      ],
      quiz: [
        { q: 'ChangeNotifier เป็นส่วนหนึ่งของอะไร?', options: [
          { t: 'Flutter framework (foundation) — Provider แค่ใช้ประโยชน์จากมัน', ok: true },
          { t: 'แพ็กเกจ provider', why: 'ตำราระบุว่าไม่ใช่ส่วนของ Provider โดยตรง' },
          { t: 'ภาษา Dart', why: 'เป็นคลาสของ Flutter' },
        ] },
        { q: 'วิดเจ็ตแสดงชื่อผู้ใช้ด้วย `context.read<User>().name` ใน build แล้วชื่อเปลี่ยน จะเกิดอะไร?', options: [
          { t: 'จอยังแสดงชื่อเดิม เพราะ read ไม่ได้สมัครฟัง', ok: true },
          { t: 'จออัปเดตทันที', why: 'ต้องใช้ watch / Consumer / select' },
          { t: 'แอป error ทันที', why: 'ไม่ error แต่ค่าค้าง' },
        ] },
        { q: 'ต้องการให้วิดเจ็ต rebuild เฉพาะเมื่อ `cart.items.length` เปลี่ยน ไม่สนฟิลด์อื่น ควรใช้อะไร?', options: [
          { t: '`context.select<Cart, int>((c) => c.items.length)`', ok: true },
          { t: '`context.watch<Cart>()`', why: 'rebuild ทุกครั้งที่ notify ไม่ว่าฟิลด์ไหนเปลี่ยน' },
          { t: '`context.read<Cart>()`', why: 'ไม่ฟังเลย' },
        ] },
      ],
    },
    {
      id: '10.4', title: 'การทำงานของ Provider โดยสังเขป', source: '§10.4', exam: true,
      gist: '**3 ขั้น**: (1) สร้างโมเดล `extends ChangeNotifier` ที่เรียก `notifyListeners()` ทุกครั้งที่แก้ state (2) ห่อ tree ด้วย `ChangeNotifierProvider` **เหนือ** ทุกวิดเจ็ตที่ต้องใช้ (3) แสดงค่าด้วย `watch` ใน build · สั่งงานด้วย `read` ใน onPressed',
      blocks: [
        { t: 'steps', items: [
          '**สร้าง State Model**: คลาสที่ `extends ChangeNotifier` เก็บ state (`int _count`) และเมธอดแก้ state (`increment()`) — ในเมธอดที่แก้ state **ต้องเรียก `notifyListeners()`**',
          '**Provide State**: ห่อส่วนของ tree (ปกติเหนือวิดเจ็ตทั้งหมดที่ต้องใช้) ด้วย `ChangeNotifierProvider<CounterModel>` แล้วสร้างอินสแตนซ์ส่งให้',
          '**Consume State**: วิดเจ็ตที่ **แสดง** ค่าใช้ `context.watch<CounterModel>()` ใน build · วิดเจ็ตที่ **กระตุ้น** การเปลี่ยนแปลงใช้ `context.read<CounterModel>()` ใน onPressed',
        ] },
        { t: 'viz', id: 'ch10.notifier', name: 'cn', title: 'ข้างใน ChangeNotifier: รายชื่อผู้ฟัง + กระดิ่ง', try: 'กด + หลายครั้ง (ทั้งสองจุดอัปเดตพร้อมกัน) → เปิด “ลืมเรียก notifyListeners()” แล้วกด → ปิด แล้วเปิด “ใช้ read แทน watch”' },
        { t: 'code', title: 'สามขั้นในโค้ด (จากแลป)', src: `// 1. State Model
class CounterProvider extends ChangeNotifier {
  int _count = 0;
  int get count => _count;

  void increment() {
    _count++;
    notifyListeners(); // แจ้งเตือน listeners ว่า state เปลี่ยนแปลง!
  }
}

// 2. Provide
void main() {
  runApp(
    ChangeNotifierProvider(
      create: (context) => CounterProvider(),
      child: const MyApp(),
    ),
  );
}

// 3. Consume
final counterValue = context.watch<CounterProvider>().count;          // ใน build
onPressed: () => context.read<CounterProvider>().increment(),        // ใน callback`, notes: [
          { at: 'int _count = 0;', note: 'private + getter `count` — คนนอก **อ่านได้แต่แก้ตรงๆ ไม่ได้** ทุกการแก้ต้องผ่านเมธอดที่เรียก notifyListeners() (ตำราบอกแค่ว่า “แนวปฏิบัติที่ดี” — เหตุผลเต็มอยู่ใน [[12.8]])' },
          { at: 'notifyListeners(); // แจ้งเตือน', note: 'เหมือน setState ของโมเดล — ลืมบรรทัดนี้ = ค่าเปลี่ยนแต่จอไม่รู้' },
          { at: 'create: (context) => CounterProvider(),', note: 'คืนอินสแตนซ์ **ใหม่** — Provider เป็นเจ้าของ: สร้างให้ และ `dispose()` ให้เองเมื่อถูกถอดออก' },
        ] },
        { t: 'why', choice: 'วาง `ChangeNotifierProvider` ไว้ **เหนือ** ทุกวิดเจ็ตที่ต้องใช้ (แลปวางไว้รอบ `MyApp` ใน `main()`)',
          because: ['`watch`/`read` ค้นหา provider โดย **ไล่ขึ้นจาก context** ([[core/c2]]) — ต้องอยู่เหนือขึ้นไปเท่านั้นจึงเจอ', 'วางเหนือ MaterialApp → ทุกหน้า (ทุก route) เห็น'],
          alts: [
            { alt: 'วาง provider ไว้ใน build ของ HomeScreen แล้วหน้าที่ push ไปใช้ได้ไหม? (เสริม)', result: 'หน้าใหม่ที่ push อยู่ใต้ **Navigator** ไม่ได้อยู่ใต้ HomeScreen → ไล่ขึ้นไม่เจอ → error `ProviderNotFoundException: Could not find the correct Provider<CartProvider> above this … Widget`', ok: 'state ที่ใช้แค่ในหน้าเดียวและลูกของมันจริงๆ' },
          ] },
        { t: 'callout', kind: 'supp', title: '`create` กับ `.value` (ไม่อยู่ในตำราบทนี้)', body: '`ChangeNotifierProvider(create: (_) => X())` = Provider **สร้างและ dispose ให้** (ใช้ตอนสร้างโมเดลใหม่) · `ChangeNotifierProvider.value(value: x)` = ส่งอินสแตนซ์ที่ **มีอยู่แล้ว** เข้าไป Provider **ไม่ dispose ให้** (ใช้เมื่อคนอื่นเป็นเจ้าของ) — กฎจำง่าย: สร้างใหม่ใช้ `create` อย่าใช้ `.value(value: X())`' },
      ],
      quiz: [
        { type: 'order', q: 'เรียง 3 ขั้นการใช้ Provider ตามตำรา', items: ['สร้างคลาสที่ `extends ChangeNotifier` และเรียก `notifyListeners()` เมื่อแก้ state', 'ห่อ tree ด้วย `ChangeNotifierProvider(create: ...)` เหนือวิดเจ็ตที่ต้องใช้', 'แสดงค่าด้วย `context.watch` ใน build และเรียกเมธอดด้วย `context.read` ใน callback'] },
        { type: 'spot', q: 'กดปุ่มแล้วตัวเลขบนจอไม่เปลี่ยน ทั้งที่ค่าในโมเดลเพิ่มจริง — บรรทัดไหนขาด/ผิด?', code: `class CartProvider extends ChangeNotifier {
  final List<Item> _items = [];
  List<Item> get items => _items;

  void add(Item item) {
    _items.add(item);
  }
}`, bad: '_items.add(item);', explain: 'หลังแก้ state ต้องเรียก `notifyListeners();` — ไม่งั้นผู้ฟัง (watch/Consumer) ไม่รู้ว่าต้อง build ใหม่' },
        { q: 'ทำไมปุ่ม FAB ในแลปใช้ `context.read` แทน `context.watch`?', options: [
          { t: 'ปุ่มไม่ต้อง rebuild เมื่อค่าเปลี่ยน แค่ต้องเรียกเมธอดครั้งเดียว', ok: true },
          { t: 'เพราะ watch เรียกเมธอดไม่ได้', why: 'ได้ แต่จะทำให้ rebuild โดยไม่จำเป็น และ watch ใช้นอก build ไม่ได้' },
          { t: 'เพราะ read เร็วกว่าในการคำนวณ', why: 'ประเด็นคือการฟัง/ไม่ฟัง' },
        ] },
      ],
    },
    {
      id: '10.5', title: 'การติดตั้ง Provider', source: '§10.5',
      gist: 'เพิ่ม `provider: ^6.1.2` ใต้ `dependencies:` ใน `pubspec.yaml` (ระดับเดียวกับ `flutter:`) แล้ว `flutter pub get`',
      blocks: [
        { t: 'code', lang: 'yaml', title: 'pubspec.yaml', src: `dependencies:
  flutter:
    sdk: flutter
  provider: ^6.1.2 # ตรวจสอบเวอร์ชันล่าสุดบน pub.dev เสมอ

  # dependencies อื่นๆ ของคุณ...` },
        { t: 'viz', id: 'ch10.pubspec', title: 'การเยื้องใน YAML สำคัญ', try: 'สลับสามแบบ แล้วดูผลของ `flutter pub get`' },
        { t: 'callout', kind: 'note', title: '`^6.1.2` หมายความว่าอะไร (เสริม)', body: 'caret syntax = ยอมรับเวอร์ชัน **6.1.2 ขึ้นไปแต่ต่ำกว่า 7.0.0** (อัปเดต minor/patch ได้ แต่ไม่ข้าม major ที่อาจเปลี่ยน API)' },
      ],
      quiz: [
        { q: 'ถ้าเขียน `provider: ^6.1.2` เยื้องเข้าไปอยู่ระดับเดียวกับ `sdk: flutter` จะเกิดอะไร?', options: [
          { t: 'pub get error เพราะ provider กลายเป็นส่วนของ dependency flutter', ok: true },
          { t: 'ติดตั้งได้ปกติ', why: 'YAML ใช้การเยื้องบอกโครงสร้าง' },
          { t: 'ติดตั้ง provider เป็น SDK', why: 'ไม่มีความหมายแบบนั้น' },
        ] },
      ],
    },
    {
      id: 'lab10', title: 'ปฏิบัติการบทที่ 10: Refactor ตัวนับด้วย Provider', short: 'แลป', source: 'ปฏิบัติการ', exam: true,
      gist: 'ย้าย `_counter` + `_incrementCounter` ออกจาก `_MyHomePageState` ไปเป็น `CounterProvider` (ChangeNotifier) → ห่อ `MyApp` ด้วย `ChangeNotifierProvider` → แสดงด้วย `watch` → กดด้วย `read` → เพิ่ม `CounterDisplay` ตัวที่สองเพื่อพิสูจน์ว่า state เป็นของกลาง',
      blocks: [
        { t: 'viz', id: 'ch10.refactor', title: 'ก่อน → หลัง ทีละส่วนของแลป', try: 'กด “ขั้นต่อไป” แล้วดูว่าบรรทัดไหนในโค้ดเดิมย้ายไปอยู่ตรงไหนในโค้ดใหม่' },
        { t: 'code', title: 'ส่วนที่ 7: CounterDisplay (พิสูจน์การแชร์ state)', src: `class CounterDisplay extends StatelessWidget {
  const CounterDisplay({super.key});

  @override
  Widget build(BuildContext context) {
    // ใช้ watch อีกครั้งเพื่อแสดงค่าและ listen การเปลี่ยนแปลง
    final count = context.watch<CounterProvider>().count;
    print('CounterDisplay rebuild: $count'); // ดูว่า rebuild เมื่อไหร่
    return Text(
      'ค่าจาก Provider: $count',
      style: Theme.of(context).textTheme.titleMedium,
    );
  }
}`, notes: [
          { at: 'class CounterDisplay extends StatelessWidget {', note: 'StatelessWidget ก็แสดงค่าที่เปลี่ยนได้ — เพราะ state ไม่ได้อยู่ในวิดเจ็ตแล้ว แต่อยู่ใน provider' },
        ] },
        { t: 'callout', kind: 'warn', title: 'ต้อง Hot Restart', body: 'แลปแก้ `main()` (ห่อ MyApp ด้วย provider) — Hot Reload ไม่รัน `main()` ใหม่ จึงต้อง **Hot Restart** (Shift+R) หรือรีสตาร์ทเต็มรูปแบบ' },
        { t: 'list', items: [
          '✓ ChangeNotifierProvider ทำงาน', '✓ `context.read` เรียก `increment()`', '✓ `notifyListeners()` ถูกเรียก', '✓ `context.watch` รับแจ้งเตือนแล้ว Text build ใหม่', '✓ ทั้งหมดนี้ **ไม่มี setState ใน `_MyHomePageState` เลย**',
        ] },
        { t: 'callout', kind: 'supp', title: 'คำถามชวนคิดที่ตำราไม่ได้ถาม', body: 'ตอนนี้ `_MyHomePageState` ไม่มี state ของตัวเองแล้ว — มันยังจำเป็นต้องเป็น StatefulWidget อยู่ไหม? (คำตอบ: ไม่จำเป็น เปลี่ยนเป็น StatelessWidget ได้ เพราะไม่มีข้อมูลที่ “เป็นเจ้าของ” เอง [[7.3]])' },
      ],
      quiz: [
        { q: 'หลังแก้ `main()` ให้ห่อด้วย ChangeNotifierProvider แล้วกด Hot Reload แอปกลับ error หา provider ไม่เจอ เพราะอะไร?', options: [
          { t: 'Hot Reload ไม่รัน main() ใหม่ ต้อง Hot Restart', ok: true },
          { t: 'ต้องใส่ provider ใน pubspec อีกครั้ง', why: 'ติดตั้งแล้ว' },
          { t: 'Provider ใช้กับ debug mode ไม่ได้', why: 'ใช้ได้' },
        ] },
        { q: 'ในส่วนที่ 7 กดปุ่ม + ครั้งเดียว ค่าบนจอจะเป็นอย่างไร?', options: [
          { t: 'ทั้งตัวนับหลักและ CounterDisplay อัปเดตพร้อมกัน', ok: true },
          { t: 'อัปเดตเฉพาะตัวนับหลัก', why: 'CounterDisplay ก็ watch อยู่' },
          { t: 'อัปเดตเฉพาะ CounterDisplay', why: 'ทั้งสองฟังอยู่' },
        ] },
      ],
    },
  ],
  rules: [
    'โมเดล `extends ChangeNotifier` · แก้ state แล้ว **ต้อง** `notifyListeners()`',
    'state เป็น private (`_count`) + getter สาธารณะ — แก้ได้เฉพาะผ่านเมธอด',
    '`ChangeNotifierProvider(create: (context) => Model(), child: ...)` วาง **เหนือ** ทุกวิดเจ็ตที่ใช้ (มักรอบ MyApp ใน main)',
    '`create` ต้องคืนอินสแตนซ์ **ใหม่** (Provider dispose ให้เอง)',
    '`context.watch<T>()` ใน build (แสดงค่า) · `context.read<T>()` ใน callback (สั่งงาน)',
    'อย่าใช้ `read` ใน build เพื่อแสดงค่า (ค้าง) · อย่าใช้ `watch` นอก build',
    'Consumer / select = rebuild แคบลง (บทที่ 11)',
    'เพิ่ม `provider: ^x.y.z` ใต้ dependencies ระดับเดียวกับ flutter แล้ว `flutter pub get`',
    'แก้ `main()` แล้วต้อง Hot Restart',
  ],
  handsOff: { heading: 'ส่งต่อไปบทที่ 11', body: [
    { t: 'callout', kind: 'real', title: 'ข้อความ “บทต่อไป” ในตำราใช้เลขบทเก่า', body: 'ตอนท้ายบทที่ 10 เขียนว่า “บทที่ 11: Asynchronous Programming & Networking” — ในชุดเอกสารนี้ **บทที่ 11 คือ Provider ขั้นสูง (Consumer/Selector)** และ async/networking คือ **บทที่ 12** · นอกจากนี้บทนี้ **ไม่มีคำถามชวนคิดท้ายบท** แม้บทที่ 11 จะอ้างว่าบทที่ 10 “ปิดท้ายไว้ด้วยคำถามที่ยังไม่ได้ตอบ”' },
    'ประเด็นที่บทที่ 11 หยิบมาต่อจริงๆ: แอปจริงมี state หลายตัว (ผู้ใช้ สินค้า ตะกร้า) และ `watch` ที่บนสุดของหน้าทำให้ **ทั้งหน้า build ใหม่** ทุกครั้งที่อะไรเปลี่ยนนิดเดียว → [[ch11|บทที่ 11: Consumer, Selector, MultiProvider]]',
  ] },
  quiz: [
    { q: 'วิดเจ็ตใดควรใช้ `context.watch<CartProvider>()`?', options: [
      { t: 'ป้ายตัวเลขจำนวนสินค้าในตะกร้าที่ต้องอัปเดตเมื่อเพิ่มสินค้า', ok: true },
      { t: 'ปุ่ม “เพิ่มลงตะกร้า” ที่แค่เรียก `add()`', why: 'ปุ่มสั่งงาน → read' },
      { t: 'โค้ดใน `onPressed`', why: 'watch ใช้นอก build ไม่ได้' },
    ] },
    { q: 'ข้อใด **ไม่ใช่** หน้าที่ของ ChangeNotifierProvider?', options: [
      { t: 'วาดหน้าตาของปุ่มและข้อความ', ok: true, why: 'Provider ไม่วาดอะไร — แค่ให้อินสแตนซ์และจัดการอายุของมัน' },
      { t: 'ให้อินสแตนซ์ของโมเดลแก่ลูกหลานใน tree', why: 'นี่คือหน้าที่หลัก' },
      { t: 'dispose โมเดลที่สร้างด้วย create เมื่อถูกถอดออก', why: 'ใช่ เป็นหน้าที่ของมัน' },
    ] },
    { q: 'โครงสร้างใดถูกต้องตามแลป?', options: [
      { t: '`runApp(ChangeNotifierProvider(create: (context) => CounterProvider(), child: const MyApp()))`', ok: true },
      { t: '`runApp(const MyApp())` แล้วสร้าง CounterProvider ใน build ของ Text', why: 'ไม่มี provider ให้หา และสร้างใหม่ทุก build' },
      { t: '`ChangeNotifierProvider(create: ...)` ไว้ใน onPressed', why: 'provider เป็นวิดเจ็ตใน tree' },
    ] },
  ],
};
