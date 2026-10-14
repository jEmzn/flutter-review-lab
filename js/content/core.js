/* ส่วนเสริม — แกนกลาง: กลไกเบื้องหลังที่ตำราใช้แต่ไม่ได้อธิบาย (ตรวจกับซอร์ส Flutter 3.47.6 ในเครื่อง) */
FR.content.core = {
  id: 'core', kind: 'supp', num: 'C', navTitle: 'แกนกลาง (กลไกเบื้องหลัง)', crumb: 'แกนกลาง',
  title: 'แกนกลาง: Flutter ทำงานอย่างไรใต้โค้ดที่เราเขียน',
  problem: 'ตำราใช้คำว่า **element, dirty, context, rebuild, InheritedWidget, event loop** โดยไม่ได้อธิบายกลไก — หน้านี้รวม 5 เรื่องที่ทำให้ “กฎ” ในแต่ละบทกลายเป็นเรื่องที่มีเหตุผล แทนการท่องจำ · ทุกกฎในหน้านี้ตรวจกับซอร์สของ Flutter ในเครื่อง (`packages/flutter/lib/src/widgets/framework.dart`)',
  overview: [
    { t: 'compare', cols: ['กลไก', 'ทำให้เข้าใจกฎข้อไหนในตำรา', 'บทที่ใช้'], rows: [
      ['[[core/c1|C1 Widget / Element / State]]', 'ทำไม `_counter` ใน State รอดเมื่อ parent rebuild แต่หายเมื่อเปลี่ยนโครง · ทำไมต้องมี key', '[[7.4]] [[7.5]] [[8.6]]'],
      ['[[core/c2|C2 BuildContext]]', 'ทำไม `Navigator.of(context)` ใน MyApp พัง · ทำไม Form.of ต้องใช้ Builder · ProviderNotFoundException', '[[9.2]] [[8.6]] [[10.3]]'],
      ['[[core/c3|C3 InheritedWidget]]', 'ทำไม `watch` อยู่ใน build และ `read` อยู่ใน onPressed · ทำไม initState ใช้ watch ไม่ได้', '[[10.3]] [[11.2]] [[lab11]]'],
      ['[[core/c4|C4 rebuild ≠ repaint]]', 'ทำไมใส่ `const` · ทำไม Consumer มี `child` · rebuild ไม่ได้แพงอย่างที่กลัว', '[[7.6]] [[11.2]] [[11.5]]'],
      ['[[core/c5|C5 เฟรม · event loop · async gap]]', 'ทำไมงานหนักทำให้จอค้าง · `await` ไม่ได้หยุดแอป · ทำไมต้องเช็ก `mounted`', '[[12.2]] [[12.7]] [[13.6]]'],
    ] },
    { t: 'callout', kind: 'analogy', title: 'ภาพเดียวที่ใช้ได้ทั้งหน้า', body: '**Widget** = แบบแปลนกระดาษ (ถูกพิมพ์ใหม่ทุกครั้งที่ build ราคาถูก ทิ้งได้) · **Element** = ห้องจริงในตึก (อยู่ที่เดิม จำได้ว่าตัวเองอยู่ชั้นไหน) · **State** = ข้าวของในห้อง (อยู่กับห้อง ไม่ใช่กับแบบแปลน) · **RenderObject** = ผนังและสีที่มองเห็น (ทาสีใหม่เฉพาะห้องที่แบบแปลนเปลี่ยนจริง)' },
  ],
  sections: [
    {
      id: 'c1', short: 'C1', tag: 'C1', supp: true,
      title: 'Widget / Element / State — ทำไม State รอด rebuild',
      gist: 'Widget เป็น **พิมพ์เขียวที่เปลี่ยนไม่ได้** ถูกสร้างใหม่ทุก build · **Element** คือตำแหน่งในต้นไม้ที่อยู่ยาว และเป็นผู้ถือ State · เมื่อ parent build ใหม่ Element เทียบพิมพ์เขียวเก่า-ใหม่ด้วย `Widget.canUpdate` = **ชนิดเดียวกัน และ key เท่ากัน** → จริง: เก็บ Element + State เดิม (เรียก didUpdateWidget) · เท็จ: ทิ้ง (dispose) แล้วสร้างใหม่',
      blocks: [
        { t: 'code', title: 'กฎตัวเดียวที่ตัดสินว่า State จะรอดไหม — framework.dart บรรทัด 382', src: `static bool canUpdate(Widget oldWidget, Widget newWidget) {
  return oldWidget.runtimeType == newWidget.runtimeType && oldWidget.key == newWidget.key;
}`, notes: [{ at: 'return oldWidget.runtimeType', note: 'ไม่ได้เทียบค่าในฟิลด์เลย — `Counter(label: \'A\')` กับ `Counter(label: \'B\')` ถือว่า “อัปเดตได้” (ใช้ Element/State เดิม แค่เปลี่ยนพิมพ์เขียว)' }] },
        { t: 'viz', id: 'core.recon', name: 'recon', title: 'เครื่องจำลองการจับคู่ Widget ↔ Element ↔ State', try: 'กด +1 ที่ A สองสามครั้ง → parent rebuild (count ยังอยู่) → สลับลำดับ (ป้ายสลับแต่ตัวเลขไม่ตาม!) → เปิด ValueKey แล้วสลับอีกครั้ง → ห่อ A ด้วย Padding' },
        { t: 'why', choice: 'เก็บข้อมูลที่ต้องจำไว้ใน **State** ไม่ใช่ในฟิลด์ของ Widget',
          because: ['Widget ถูกสร้างใหม่ทุก build — ฟิลด์ในนั้นเริ่มจากค่าใน constructor ทุกครั้ง', 'State ผูกกับ Element ซึ่งอยู่ที่เดิมตราบใดที่ canUpdate เป็นจริง'],
          alts: [
            { alt: 'ทำไม Flutter ไม่แก้ค่าใน Widget เดิมไปเลย จะได้ไม่ต้องสร้างใหม่?', result: 'Widget ที่เปลี่ยนไม่ได้ (immutable) ทำให้เทียบ “เก่า vs ใหม่” ได้ปลอดภัยและแชร์อ็อบเจกต์เดียวกันได้หลายที่ (เช่น const) — การสร้างอ็อบเจกต์เล็กๆ ใน Dart ถูกมาก ส่วนที่แพงจริง (layout/paint) ทำเฉพาะที่เปลี่ยน ([[core/c4]])' },
            { alt: 'ทำไม State หายเมื่อห่อด้วย Padding ทั้งที่ Counter ตัวเดิม?', result: 'ตำแหน่งนั้นเปลี่ยนชนิดจาก Counter เป็น Padding → canUpdate เป็นเท็จ → Element เดิมทั้งกิ่งถูกทิ้ง รวม State ข้างใน', viz: { name: 'recon', mode: 'wrap' } },
          ] },
        { t: 'h', text: 'Key: ใช้เมื่อ “ลำดับ” ไม่พอบอกว่าใครเป็นใคร' },
        { t: 'why', choice: 'ใส่ `key` ให้รายการที่ **มี State และถูกสลับ/ลบกลางลิสต์**',
          because: ['ไม่มี key → จับคู่ตามตำแหน่ง → State ค้างอยู่ที่ตำแหน่งเดิม ข้อมูลบนจอไม่ตรงกัน', 'มี key → จับคู่ตาม key → State ย้ายตามวิดเจ็ต'],
          alts: [
            { alt: 'ทำไมไม่ใส่ key ทุกวิดเจ็ตไปเลย?', result: 'ไม่จำเป็นสำหรับวิดเจ็ตที่ไม่ย้ายที่ และ **การเปลี่ยน key คือการบอกให้สร้างใหม่** — เพิ่ม/เปลี่ยน key ทีหลังทำให้ State เดิมหาย (ลองเปิด ValueKey ในภาพ)', viz: { name: 'recon', mode: 'swap' } },
            { alt: 'ใช้ `UniqueKey()` ได้ไหม?', result: 'UniqueKey สร้างค่าใหม่ทุกครั้งที่ build → ไม่เคยเท่ากับของเดิม → **State ถูกทิ้งทุก build** · ใช้ `ValueKey(item.id)` ที่คงที่' },
          ] },
        { t: 'kv', items: [
          ['`ValueKey(id)`', 'เท่ากันเมื่อค่าเท่ากัน — ใช้กับรายการที่มี id (เช่น `ValueKey(todo.id)`)'],
          ['`ObjectKey(obj)`', 'เท่ากันเมื่อเป็นอ็อบเจกต์ตัวเดียวกัน'],
          ['`UniqueKey()`', 'ไม่เท่ากับอะไรเลย — บังคับสร้างใหม่ (ใช้เมื่อ **ตั้งใจ** รีเซ็ต)'],
          ['`GlobalKey<T>()`', 'ไม่ซ้ำทั้งแอป และใช้เข้าถึง State จากข้างนอกได้ — `GlobalKey<FormState>` ในบทที่ 8 ([[8.6]])'],
        ] },
        { t: 'callout', kind: 'note', title: 'โยงกลับบทเรียน', body: '[[7.4]] “Widget ถูกสร้างใหม่ แต่ State อยู่ต่อ” คือ canUpdate = true · [[7.5]] `didUpdateWidget` ถูกเรียกตอน Element ได้พิมพ์เขียวใหม่ · `dispose` ถูกเรียกตอน canUpdate = false หรือวิดเจ็ตถูกเอาออก' },
      ],
      quiz: [
        { q: 'parent build ใหม่และส่ง `Counter(title: \'ใหม่\')` มาแทน `Counter(title: \'เก่า\')` ที่ตำแหน่งเดิม (ไม่มี key) — State ของ Counter เป็นอย่างไร?', options: [
          { t: 'ใช้ State เดิม (ค่าที่นับไว้อยู่ครบ) แล้วเรียก didUpdateWidget', ok: true },
          { t: 'สร้าง State ใหม่เพราะค่า title เปลี่ยน', why: 'canUpdate ไม่ได้เทียบค่าในฟิลด์ เทียบแค่ชนิดและ key' },
          { t: 'error', why: 'เป็นการทำงานปกติ' },
        ] },
        { q: 'ลิสต์ของ `TodoTile` (StatefulWidget ที่จำว่ากางอยู่หรือไม่) ลบรายการแรกออกแล้วรายการที่สองกลับ “กาง” แทน แก้อย่างไร?', options: [
          { t: 'ใส่ `key: ValueKey(todo.id)` ให้แต่ละ TodoTile', ok: true },
          { t: 'ใส่ `key: UniqueKey()`', why: 'ทุก build ได้ key ใหม่ → State ถูกรีเซ็ตทุกครั้ง' },
          { t: 'เรียก setState ให้บ่อยขึ้น', why: 'ไม่แก้การจับคู่ตามตำแหน่ง' },
        ] },
        { type: 'multi', q: 'เหตุการณ์ใดทำให้ State เดิมถูก dispose (เลือกทุกข้อ)', options: [
          { t: 'ห่อวิดเจ็ตด้วย Padding ที่ตำแหน่งเดิม', ok: true },
          { t: 'เปลี่ยน key ของวิดเจ็ต', ok: true },
          { t: 'parent build ใหม่ด้วยค่าคอนสตรักเตอร์ต่างจากเดิม', why: 'ชนิดและ key เหมือนเดิม → ใช้ State เดิม' },
          { t: 'เรียก setState ใน State นั้นเอง', why: 'แค่ build ใหม่' },
        ] },
      ],
    },
    {
      id: 'c2', short: 'C2', tag: 'C2', supp: true,
      title: 'BuildContext = ตำแหน่ง และการค้นหาขึ้นด้านบน',
      gist: '`BuildContext` ใน `build(context)` **คือ Element ของวิดเจ็ตนั้นเอง** = ตำแหน่งในต้นไม้ · `Navigator.of`, `Theme.of`, `ScaffoldMessenger.of`, `Form.of`, `context.read/watch` ล้วน **ไล่ขึ้นไปหาบรรพบุรุษที่ใกล้ที่สุด** — ไม่มองลง ไม่มองข้าง · สิ่งที่สร้างใน build เดียวกันจึงอยู่ **ใต้** context นั้น หาไม่เจอ · `Builder` ให้ context ใหม่ที่อยู่ลึกลงไป',
      blocks: [
        { t: 'viz', id: 'core.context', name: 'ctx', title: 'ค้นหาจาก context ต่างตำแหน่ง', try: 'ลอง ① + Navigator.of (พัง) · ② + Navigator.of (เจอ) · ② + Form.of (พัง) · ③ + Form.of (เจอ) · ① + context.read (ProviderNotFound) · ① + Theme.of (ไม่พังแต่ได้ธีมสำรอง)' },
        { t: 'compare', cols: ['อาการ', 'สาเหตุ (ตำแหน่งของ context)', 'แก้'], rows: [
          ['`Navigator operation requested with a context that does not include a Navigator`', 'เรียกจาก context ของ MyApp ซึ่งอยู่ **เหนือ** MaterialApp', 'เรียกจาก build ของหน้าจอที่อยู่ใต้ MaterialApp ([[9.2]])'],
          ['`Form.of() was called with a context that does not contain a Form widget`', 'Form ถูกสร้างใน build เดียวกับ context', '`GlobalKey<FormState>` หรือ `Builder` ([[8.6]])'],
          ['`ProviderNotFoundException`', 'Provider อยู่ใต้ context หรืออยู่คนละ route ที่ไม่ได้ห่อ', 'ยก Provider ขึ้นไปเหนือ MaterialApp ใน main ([[10.3]])'],
          ['ธีม/สีไม่ตรง แต่ไม่ error', '`Theme.of` หาไม่เจอแล้วคืน ThemeData สำรอง', 'ใช้ context ใต้ MaterialApp'],
        ] },
        { t: 'callout', kind: 'real', title: 'ตรวจจากซอร์ส Flutter 3.47.6', body: '`Theme.of` คืน `_kFallbackTheme` เมื่อไม่พบ Theme (`material/theme.dart` บรรทัด 122–) — จึงเป็นกรณีเดียวในตารางที่ “ผิดแบบเงียบ” · ส่วน Navigator.of / Form.of โยน FlutterError พร้อมข้อความตามตาราง' },
        { t: 'code', title: 'Builder: ได้ context ที่อยู่ใต้ Form', src: `@override
Widget build(BuildContext context) {          // context ② = HomeScreen
  return Scaffold(
    body: Form(
      child: Builder(
        builder: (innerContext) {             // context ③ = ใต้ Form
          return ElevatedButton(
            onPressed: () {
              Form.of(innerContext).validate(); // เจอ
              // Form.of(context) → error: context ② อยู่เหนือ Form
            },
            child: const Text('บันทึก'),
          );
        },
      ),
    ),
  );
}`, notes: [{ at: 'builder: (innerContext) {', note: 'Builder เป็นวิดเจ็ตธรรมดาที่เรียก builder ด้วย context **ของตัวเอง** ซึ่งเป็นลูกของ Form' }] },
        { t: 'why', choice: 'การค้นหา **ไล่ขึ้น** จากตำแหน่งของ context เท่านั้น',
          because: ['ข้อมูลที่แชร์ (ธีม, Navigator, Provider) ถูกวาง “ครอบ” ส่วนที่ใช้มัน — ไล่ขึ้นจึงเจอตัวที่ใกล้ที่สุดเสมอ', 'วิดเจ็ตเดียวกันวางคนละที่ได้ผลคนละแบบ (เช่น Theme ซ้อนกันได้)'],
          alts: [{ alt: 'ทำไมไม่ค้นทั้งต้นไม้ให้เจอเสมอ?', result: 'ถ้ามีหลายตัว (Navigator ซ้อน, Theme ซ้อน) จะไม่รู้ว่าควรใช้ตัวไหน และการค้นทั้งต้นไม้ช้า — ไล่ขึ้นตามสายบรรพบุรุษชัดเจนและเร็ว' }] },
      ],
      quiz: [
        { q: 'ใน `MyApp.build` ที่ return `MaterialApp(...)` ถ้าเรียก `Navigator.of(context).push(...)` จะเกิดอะไร?', options: [
          { t: 'error — context ของ MyApp อยู่เหนือ Navigator ที่ MaterialApp สร้าง', ok: true },
          { t: 'push สำเร็จ', why: 'Navigator อยู่ใต้ context นี้ หาไม่เจอ' },
          { t: 'ได้ Navigator ว่าง', why: 'Navigator.of โยน error' },
        ] },
        { q: '`BuildContext` ที่ได้ใน `build(BuildContext context)` คืออะไร?', options: [
          { t: 'Element ของวิดเจ็ตนั้น = ตำแหน่งของวิดเจ็ตในต้นไม้', ok: true },
          { t: 'อ็อบเจกต์ส่วนกลางตัวเดียวของทั้งแอป', why: 'แต่ละวิดเจ็ตมี context ของตัวเอง' },
          { t: 'Widget ตัวนั้นเอง', why: 'Widget เป็นพิมพ์เขียว ส่วน context คือ Element' },
        ] },
      ],
    },
    {
      id: 'c3', short: 'C3', tag: 'C3', supp: true,
      title: 'InheritedWidget: watch = ลงทะเบียน, read = แค่อ่าน',
      gist: 'InheritedWidget ส่งข้อมูลลงไปยังลูกหลาน · ลูกที่เรียก `dependOnInheritedWidgetOfExactType` จะ **ถูกจดชื่อเป็น dependent** แล้วถูก build ใหม่เมื่อข้อมูลเปลี่ยน · Provider ใช้กลไกนี้: `context.watch` = อ่าน + ลงทะเบียน (ใช้ได้เฉพาะระหว่าง build) · `context.read` = อ่านเฉยๆ ไม่ลงทะเบียน (ใช้ใน onPressed) · `Theme.of`, `MediaQuery.of` ก็เป็นแบบ watch',
      blocks: [
        { t: 'viz', id: 'core.inherited', name: 'ih', title: 'ใครถูกแจ้งเมื่อ notifyListeners()', try: 'กด “ใส่ตะกร้า” → เปลี่ยน CartBadge เป็น read แล้วกดอีก (ตัวเลขค้าง) → กด “rebuild ด้วยเหตุอื่น” (ค่าถูกต้องขึ้นมาเพราะบังเอิญ) → ลอง onPressed: watch' },
        { t: 'code', title: 'InheritedWidget แบบเขียนเอง (เพื่อเห็นกลไกที่ Provider ห่อไว้)', src: `class CartScope extends InheritedWidget {
  const CartScope({super.key, required this.count, required super.child});
  final int count;

  static CartScope of(BuildContext context) {
    // ไล่ขึ้นหา CartScope ที่ใกล้ที่สุด + ลงทะเบียน context นี้เป็น dependent
    final scope = context.dependOnInheritedWidgetOfExactType<CartScope>();
    assert(scope != null, 'ไม่พบ CartScope เหนือ context นี้');
    return scope!;
  }

  // CartScope ตัวใหม่มาแทนตัวเก่า → แจ้ง dependents เมื่อค่าเปลี่ยนจริงเท่านั้น
  @override
  bool updateShouldNotify(CartScope oldWidget) => count != oldWidget.count;
}`, notes: [
          { at: 'context.dependOnInheritedWidgetOfExactType<CartScope>();', note: 'หาได้เร็ว (Element เก็บแผนที่ของ InheritedWidget ที่อยู่เหนือตัวเองไว้แล้ว) และ **จดชื่อ** context นี้ไว้ — นี่คือสิ่งที่ `context.watch` ทำ' },
          { at: 'bool updateShouldNotify(CartScope oldWidget) => count != oldWidget.count;', note: 'InheritedWidget เปลี่ยนค่าไม่ได้ (immutable) — วิดเจ็ตที่อยู่เหนือต้อง build CartScope ตัวใหม่ · Provider ทำส่วนนี้ให้: ChangeNotifier เรียก notifyListeners → Provider สั่งให้ dependents build ใหม่' },
        ] },
        { t: 'why', choice: '`watch` ใน build · `read` ใน event handler',
          because: ['การลงทะเบียนเป็น dependent มีความหมายเฉพาะตอน build — “เมื่อค่าเปลี่ยน ให้ build ฉันใหม่”', 'ใน onPressed ไม่มีการ build จึงลงทะเบียนไม่ได้ และไม่ต้องการด้วย (แค่อยากเรียกเมธอด)'],
          alts: [
            { alt: 'ใช้ `read` ใน build ได้ไหม?', result: 'ได้ค่าตอน build ครั้งนั้น แต่ **ไม่ถูกแจ้งเมื่อค่าเปลี่ยน** → ตัวเลขบนจอค้าง (จะดูถูกเฉพาะตอน parent บังเอิญ build ใหม่ — บั๊กที่หาสาเหตุยาก)', viz: { name: 'ih', mode: 'badgeRead' } },
            { alt: 'ใช้ `watch` ใน onPressed ได้ไหม?', result: 'provider โยน `Tried to listen to a value exposed with provider, from outside of the widget tree.`' },
            { alt: 'ทำไม `context.watch` ใน initState ไม่ได้?', result: 'framework โยน `dependOnInheritedWidgetOfExactType<…>() … was called before …initState() completed.` — ค่าที่อ่านใน initState จะไม่ถูกอัปเดตเมื่อเปลี่ยนภายหลัง · ใช้ `read` (อ่านครั้งเดียว) หรือ `didChangeDependencies` ([[lab11]])' },
          ] },
        { t: 'callout', kind: 'real', title: 'ข้อความ error ตรวจจากซอร์ส', body: 'ข้อความ initState มาจาก `framework.dart` บรรทัด 6069 (Flutter 3.47.6) · ข้อความ “outside of the widget tree” มาจาก `provider-6.1.5+1/lib/src/provider.dart` บรรทัด 312' },
      ],
      quiz: [
        { q: 'CartBadge ใน AppBar ใช้ `context.read<Cart>().count` ใน build ผลคือ?', options: [
          { t: 'แสดงค่าตอน build ครั้งนั้น แล้วไม่อัปเดตเมื่อเพิ่มสินค้า', ok: true },
          { t: 'อัปเดตทุกครั้งเหมือน watch', why: 'read ไม่ลงทะเบียน' },
          { t: 'error ทันที', why: 'read ใน build ไม่ error (แต่ผิดเจตนา)' },
        ] },
        { q: 'สิ่งที่ `context.watch<T>()` ทำต่างจาก `context.read<T>()` คือ?', options: [
          { t: 'ลงทะเบียน context เป็น dependent เพื่อถูก build ใหม่เมื่อค่าเปลี่ยน', ok: true },
          { t: 'ค้นหาได้ไกลกว่า', why: 'ค้นแบบเดียวกัน' },
          { t: 'สร้าง Provider ใหม่', why: 'ไม่สร้าง' },
        ] },
      ],
    },
    {
      id: 'c4', short: 'C4', tag: 'C4', supp: true,
      title: 'rebuild ≠ repaint และทำไม const ช่วย',
      gist: '**build** = สร้างพิมพ์เขียวใหม่ (ถูก) → Element เทียบกับของเดิม → **RenderObject** ถูกแก้เฉพาะเมื่อค่าเปลี่ยน → **layout/paint** เฉพาะส่วนที่ถูกแก้ · วิดเจ็ต `const` เป็น **อ็อบเจกต์ตัวเดิมทุกครั้ง** → `Element.updateChild` เห็นว่าเป็นตัวเดียวกันแล้ว **ข้ามทั้งกิ่ง** ไม่ build เลย',
      blocks: [
        { t: 'viz', id: 'core.paint', title: 'setState ที่ CounterPage', try: 'กด setState หลายครั้ง ดูตัวนับ build และ “วาดใหม่” · เปิด const ให้ ExpensiveChart แล้วล้างตัวนับ กดซ้ำ เทียบเวลา build สะสม' },
        { t: 'code', title: 'framework.dart บรรทัด 4027 — เหตุผลที่ const ข้ามได้', src: `if (hasSameSuperclass && child.widget == newWidget) {
  // We don't insert a timeline event here, because otherwise it's
  // confusing that widgets that "don't update" (because they didn't
  // change) get "charged" on the timeline.
  if (child.slot != newSlot) {
    updateSlotForChild(child, newSlot);
  }
  newChild = child;
}`, notes: [{ at: 'if (hasSameSuperclass && child.widget == newWidget) {', note: '`const Footer()` ทุกครั้งคืนอ็อบเจกต์ตัวเดียวกัน (canonicalized) → `==` เป็นจริง → ไม่เรียก build ของ Footer และลูกทั้งหมด' }] },
        { t: 'why', choice: 'ใส่ `const` ให้วิดเจ็ตที่ไม่ขึ้นกับ state + แยกส่วนที่เปลี่ยนให้เล็ก',
          because: ['กิ่ง const ไม่ถูก build ซ้ำเลย', 'setState ในวิดเจ็ตเล็กที่อยู่ลึก → subtree ที่ build ใหม่เล็กตาม ([[7.6]])', 'แนวคิดเดียวกับ `child` ของ Consumer ([[11.2]]): ส่งส่วนที่ไม่เปลี่ยนเข้ามาเป็นอ็อบเจกต์ที่สร้างไว้แล้ว'],
          alts: [
            { alt: 'rebuild ทุกครั้งแปลว่าจอถูกวาดใหม่ทั้งหมดใช่ไหม?', result: 'ไม่ใช่ — build สร้างแค่อ็อบเจกต์พิมพ์เขียว ส่วนที่วาดใหม่จริงคือ RenderObject ที่ค่าเปลี่ยน (ในภาพ: Text ตัวเดียว)' },
            { alt: 'ถ้า rebuild ถูกขนาดนั้น ทำไมต้องสนใจ?', result: 'build ที่มีงานแพงข้างใน (คำนวณ, จัดรูปแบบลิสต์ยาว) หรือ subtree ใหญ่มาก จะกินงบเฟรม 16 ms ได้จริง — วัดด้วย DevTools ก่อนค่อยแก้ ([[11.5]])' },
          ] },
        { t: 'callout', kind: 'note', title: 'const ใช้ได้เมื่อไร', body: 'ทุกค่าที่ส่งเข้า constructor ต้องรู้ตอนคอมไพล์ (`const Text(\'ตัวนับ\')` ได้ · `Text(\'$_count\')` ไม่ได้) และคลาสต้องมี `const` constructor · linter `prefer_const_constructors` จะเตือนให้เอง' },
      ],
      quiz: [
        { q: 'ทำไม `const Footer()` จึงไม่ถูก build ใหม่เมื่อ parent เรียก setState?', options: [
          { t: 'ได้อ็อบเจกต์ตัวเดิมทุกครั้ง framework เห็นว่าเหมือนเดิมจึงข้ามทั้งกิ่ง', ok: true },
          { t: 'Footer เป็น StatelessWidget', why: 'Stateless ที่ไม่ใช่ const ก็ build ใหม่ตาม parent' },
          { t: 'const ทำให้ไม่ต้องวาดบนจอ', why: 'ยังวาด แค่ไม่ build ซ้ำ' },
        ] },
        { q: 'ข้อใดถูกเกี่ยวกับ rebuild?', options: [
          { t: 'build สร้างพิมพ์เขียวใหม่ แต่วาดใหม่เฉพาะส่วนที่ค่าเปลี่ยน', ok: true },
          { t: 'ทุก rebuild วาดทั้งหน้าจอใหม่', why: 'RenderObject ที่ค่าเดิมไม่ต้องวาดใหม่' },
          { t: 'rebuild ไม่มีต้นทุนเลย', why: 'มีต้นทุน แต่ส่วนใหญ่ถูก' },
        ] },
      ],
    },
    {
      id: 'c5', short: 'C5', tag: 'C5', supp: true,
      title: 'เฟรม, event loop, isolate และ async gap (mounted)',
      gist: 'โค้ด Dart ของ UI รันบน **isolate เดียว** ทีละงาน · ทุกเฟรมมีงบ ~16 ms (60 Hz) งานที่ไม่ยอมคืนเกินงบ = จอกระตุก · `await` **คืนการควบคุม** ให้ event loop (ไม่ได้บล็อกแอป) แล้วกลับมาทำต่อทีหลังผ่าน **microtask** ซึ่งทำก่อน event ถัดไปเสมอ · งานคำนวณหนักย้ายไป isolate อื่น (`compute`) · ระหว่าง await หน้าจออาจถูกปิด → **เช็ก `mounted` ก่อนใช้ context/setState**',
      blocks: [
        { t: 'viz', id: 'ch12.waiter', title: 'งบเฟรม: พนักงานเสิร์ฟคนเดียว (จากบทที่ 12)' },
        { t: 'viz', id: 'ch12.eventloop', title: 'await ทำอะไรกับ call stack (จากบทที่ 12)' },
        { t: 'h', text: 'microtask มาก่อน event' },
        { t: 'code', title: 'ทายลำดับการพิมพ์', src: `void main() {
  print('1');
  Future(() => print('2'));               // event queue
  scheduleMicrotask(() => print('3'));    // microtask queue
  Future.value().then((_) => print('4')); // Future ที่เสร็จแล้ว → then เข้า microtask
  print('5');
}
// ผลลัพธ์: 1, 5, 3, 4, 2`, notes: [
          { at: "print('5');", note: 'โค้ดซิงโครนัสรันจนจบก่อนเสมอ (1, 5)' },
          { at: "scheduleMicrotask(() => print('3'));", note: 'หลังโค้ดปัจจุบันจบ event loop ล้าง **microtask queue** ให้หมดก่อน (3 แล้ว 4 ตามลำดับที่เข้าคิว)' },
          { at: "Future(() => print('2'));", note: '`Future(...)` เข้าคิว event — ทำหลัง microtask ทั้งหมด' },
        ] },
        { t: 'viz', id: 'ch12.mounted', title: 'async gap: หน้าจอถูกปิดระหว่าง await (จากบทที่ 12)' },
        { t: 'why', choice: 'หลัง `await` ทุกครั้ง: `if (!mounted) return;` (ใน State) หรือ `if (!context.mounted) return;` (ใช้ context ที่รับมา)',
          because: ['ระหว่างรอ ผู้ใช้อาจกดย้อนกลับ → State ถูก dispose', 'setState หลัง dispose = error · context ของหน้าที่ปิดแล้วใช้หา Navigator/ScaffoldMessenger ไม่ได้'],
          alts: [{ alt: 'ทำไมไม่ทำงานทุกอย่างให้เสร็จก่อนแสดงหน้าจอ?', result: 'งาน I/O ใช้เวลาที่ควบคุมไม่ได้ — UI ต้องตอบสนองระหว่างรอ (นี่คือเหตุผลที่ต้อง async ตั้งแต่แรก)' }] },
        { t: 'callout', kind: 'note', title: 'โยงกลับบทเรียน', body: '[[12.2]] งานหนักในเฟรม · [[12.7]] compute/isolate · `if (!mounted) return;` ใน `_refreshNotes` ของ [[13.6]] และหลัง `await Navigator.push` ใน [[9.5]]' },
      ],
      quiz: [
        { type: 'order', q: 'เรียงลำดับสิ่งที่พิมพ์ออกมา: `print(\'A\'); Future(() => print(\'B\')); scheduleMicrotask(() => print(\'C\')); print(\'D\');`', items: ['A', 'D', 'C', 'B'] },
        { q: 'โค้ด `final data = await repo.load(); setState(() => _items = data);` เสี่ยงอะไร?', options: [
          { t: 'ถ้าผู้ใช้ออกจากหน้าระหว่างรอ setState จะถูกเรียกหลัง dispose → error', ok: true },
          { t: 'await ทำให้แอปค้างระหว่างโหลด', why: 'await ไม่บล็อก UI' },
          { t: 'ไม่มีความเสี่ยง', why: 'ต้องเช็ก mounted' },
        ] },
        { q: '`await http.get(...)` ทำให้ UI ค้างหรือไม่?', options: [
          { t: 'ไม่ค้าง — ฟังก์ชันหยุดรอ แต่ event loop ยังวาดเฟรมและรับการแตะได้', ok: true },
          { t: 'ค้างจนกว่าเซิร์ฟเวอร์ตอบ', why: 'I/O ทำนอก isolate' },
          { t: 'ค้างเฉพาะบน Android', why: 'ไม่เกี่ยวกับแพลตฟอร์ม' },
        ] },
      ],
    },
  ],
  rules: [
    '`Widget.canUpdate` = ชนิดเดียวกัน **และ** key เท่ากัน → ใช้ Element/State เดิม · ไม่งั้นทิ้งแล้วสร้างใหม่',
    'ข้อมูลที่ต้องจำข้าม build อยู่ใน State (หรือ Provider) ไม่ใช่ฟิลด์ของ Widget',
    'รายการที่มี State และถูกสลับ/ลบกลางลิสต์ → `ValueKey(id)` · ห้าม `UniqueKey()` ถ้าไม่ได้ตั้งใจรีเซ็ต',
    'ห่อ/เปลี่ยนชนิดวิดเจ็ต หรือเปลี่ยน key = State ข้างในหาย',
    '`context` = ตำแหน่ง · `X.of(context)` ไล่ **ขึ้น** เท่านั้น · สิ่งที่สร้างใน build เดียวกันอยู่ใต้ context',
    'ต้องการ context ใต้ Form/Scaffold ใน build เดียวกัน → `Builder` (หรือใช้ GlobalKey)',
    '`watch` = ลงทะเบียน (ใน build เท่านั้น) · `read` = อ่านครั้งเดียว (ใน handler / initState)',
    '`const` = อ็อบเจกต์เดิม → framework ข้ามทั้งกิ่ง · rebuild ≠ repaint',
    'งบเฟรม ~16 ms · `await` ไม่บล็อก UI · microtask ก่อน event',
    'หลัง `await` เช็ก `mounted` / `context.mounted` ก่อน setState หรือใช้ context',
  ],
};
