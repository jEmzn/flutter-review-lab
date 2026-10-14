/* บทที่ 11 — การจัดการ state ขั้นสูงด้วย Provider และ Consumer */
FR.content.ch11 = {
  id: 'ch11', kind: 'chapter', num: '11', navTitle: 'Consumer / Selector', crumb: 'บทที่ 11',
  title: 'การจัดการ state ขั้นสูงด้วย Provider และ Consumer',
  problem: 'สองปัญหาเมื่อแอปโต: **ประสิทธิภาพ** — `watch` ที่บนสุดทำให้ทั้งวิดเจ็ต build ใหม่ทั้งที่เปลี่ยนแค่ตัวเลขเดียว · **การจัดระเบียบ** — provider หลายตัวซ้อนกันลึกใน main.dart และ provider ตัวเดียวที่บวมจนต้องหั่น',
  tools: ['Consumer (+ child)', 'context.select / Selector', 'บันไดของการรับฟัง', 'การวัด rebuild', 'MultiProvider', 'ChangeNotifierProxyProvider'],
  receives: { title: 'ต่อจากบทที่ 10', body: 'บทที่ 10 ใช้ `watch` ทั้งเมธอด build และ provider ตัวเดียว — บทนี้ตอบว่า (1) ทำอย่างไรให้ rebuild **แคบลง** และ (2) ถ้ามี state หลายระบบ (คูปอง สินค้า ขนส่ง แชต) จะ **หั่น provider** อย่างไร และแต่ละตัวรู้การเปลี่ยนแปลงของกันได้อย่างไร' },
  overview: [
    { t: 'h', text: 'ภาพใหญ่: ฟังให้แคบที่สุดเท่าที่ “คุ้ม”' },
    'หัวใจของบทคือ **บันไดของการรับฟัง** 4 ขั้นจากกว้างไปแคบ: `read` (ไม่ฟัง) → `watch` (ฟังทั้ง build) → `Consumer` (ฟังเฉพาะกิ่ง) → `select`/`Selector` (ฟังเฉพาะค่า) — แต่ละขั้นที่แคบลงแลกด้วยโค้ดที่ซับซ้อนขึ้น จึงเริ่มจากขั้นที่อ่านง่ายแล้ว **วัดก่อน** ค่อยไต่ลง',
    { t: 'viz', id: 'ch11.feed', title: 'feed โพสต์: กดถูกใจแล้วอะไรกะพริบ', try: 'กดถูกใจหลายๆ โพสต์ในโหมด watch แล้วสลับเป็น Consumer เทียบมาตรวัด' },
    { t: 'compare', cols: ['ปัญหา', 'เครื่องมือ', 'หัวข้อ'], rows: [
      ['watch ทำให้ build ทั้งวิดเจ็ต', '`Consumer` + `child`', '[[11.2]]'],
      ['Consumer ยังตื่นทุก notify แม้ฟิลด์ที่สนใจไม่เปลี่ยน', '`context.select` / `Selector`', '[[11.3]]'],
      ['เลือกเครื่องมือไหนดี', 'บันได 4 ขั้น', '[[11.4]]'],
      ['รู้ได้อย่างไรว่าแคบลงจริง', 'print, debugPrintRebuildDirtyWidgets, DevTools (profile mode)', '[[11.5]]'],
      ['ภาพรวมการไหลของข้อมูล', 'swimlane 4 เลน + ร้านอาหาร', '[[11.6]]'],
      ['provider ซ้อนกันลึก', '`MultiProvider` (+ ลำดับ, lazy)', '[[11.7]]'],
      ['provider ตัวเดียวบวม / ต้องพึ่งกัน', 'หั่นตามความรับผิดชอบ + `ChangeNotifierProxyProvider`', '[[11.8]]'],
    ] },
  ],
  sections: [
    {
      id: '11.1', title: 'บทนำ: ต่อยอดองค์ความรู้เกี่ยวกับ Provider', source: '§11.1',
      gist: '**ประสิทธิภาพ**: feed ที่ใช้ `watch` ในแต่ละโพสต์ → กดถูกใจ 1 ครั้ง ทั้งโพสต์ build ใหม่ · **การจัดระเบียบ**: User/Product/Cart provider ซ้อนกันใน main.dart อ่านยาก แก้ยาก',
      blocks: [
        { t: 'viz', id: 'ch11.feed', name: 'feed', title: 'ปัญหาด้านประสิทธิภาพในตำรา', try: 'สังเกตว่าในโหมด watch ทั้งการ์ด (รูป ข้อความ ชื่อ) กะพริบทั้งที่เปลี่ยนแค่ตัวเลข' },
        { t: 'list', items: [
          '**Consumer**: กำหนดขอบเขตการสร้างใหม่ให้กระทบเฉพาะส่วนที่เล็กที่สุด (เช่น Text จำนวนถูกใจ)',
          '**MultiProvider**: จัดระเบียบ provider หลายตัวเป็นรายการที่อ่านง่าย',
          '**context.select / Selector**: เจาะลงถึงค่าข้อมูลรายตัว',
          '**การแบ่งความรับผิดชอบ**: หั่น provider ใหญ่ + `ChangeNotifierProxyProvider`',
        ] },
        { t: 'callout', kind: 'real', title: 'อ้างอิงข้ามบทที่ไม่ตรงกัน', body: 'บทนี้เปิดด้วย “บทที่ 10 ปิดท้ายไว้ด้วยคำถามที่ยังไม่ได้ตอบ” แต่บทที่ 10 **ไม่มีคำถามชวนคิดท้ายบท** · และกล่าวถึง “ฐานข้อมูลในบทถัดไป” ขณะที่ 11.9 ระบุถูกต้องว่าเครือข่ายคือบทที่ 12 และฐานข้อมูลคือบทที่ 13 — เนื้อหาไม่ผิด แค่การอ้างอิงคลาดเคลื่อน' },
      ],
      quiz: [
        { q: 'ใน feed ที่แต่ละโพสต์ใช้ `context.watch` ที่วิดเจ็ตหลัก กดถูกใจหนึ่งครั้งเกิดอะไร?', options: [
          { t: 'ทั้งวิดเจ็ตของโพสต์นั้น (รูป ข้อความ ชื่อ) build ใหม่ ทั้งที่เปลี่ยนแค่ตัวเลข', ok: true },
          { t: 'เฉพาะตัวเลขถูกใจ build ใหม่', why: 'นั่นคือผลของ Consumer' },
          { t: 'ไม่มีอะไร build ใหม่', why: 'watch ฟังอยู่ จึง build ใหม่' },
        ] },
      ],
    },
    {
      id: '11.2', title: 'การเพิ่มประสิทธิภาพด้วย Consumer Widget', source: '§11.2', exam: true,
      gist: '`watch` = build **ทั้งเมธอด** ของวิดเจ็ตที่เรียก · `Consumer` ย้าย “หูที่ฟัง” ลงไปไว้ที่กิ่งเล็กที่เปลี่ยนจริง · `builder(context, provider, child)` — `child` ถูกสร้างครั้งเดียวแล้วส่งกลับมาใช้ซ้ำ · **อย่าห่อทุกอย่าง** เพราะ Consumer ก็มีต้นทุน',
      blocks: [
        { t: 'callout', kind: 'analogy', title: 'เปลี่ยนกระเบื้องแผ่นเดียว ไม่ใช่ทุบห้องน้ำทั้งห้อง (จากตำรา)', body: 'กระเบื้องบิ่นแผ่นเดียว แต่ผู้รับเหมาบอกว่าต้องทุบห้องน้ำทิ้งแล้วสร้างใหม่ — ผลลัพธ์ถูกต้อง แต่ต้นทุนสอบตก นี่คือ `watch` ที่บนสุดของวิดเจ็ตใหญ่ · Consumer คือการผ่าตัดที่แม่นยำ: เปลี่ยนเฉพาะแผ่นนั้น — แนวคิดคือ **ย้ายจุดรับฟัง** จากยอดสุดของต้นไม้ลงไปที่กิ่งเล็กที่เปลี่ยนบ่อยจริง' },
        { t: 'viz', id: 'ch11.scope', name: 'scope', title: 'โปรเจกต์ provider_consumer_demo จำลอง', try: 'กด FAB 3 ครั้งในแต่ละโหมด แล้วดูตัวนับ build ×n และ print ใน console เทียบกัน' },
        { t: 'code', title: 'UserProvider (โค้ดตั้งต้นในตำรา)', src: `// lib/providers/user_provider.dart
import 'package:flutter/foundation.dart';

class UserProvider extends ChangeNotifier {
  String _nickname = 'ต้นกล้า';
  final String _realName = 'ณัฐพงษ์ ใจดี';
  final String _profileImageUrl = 'https://picsum.photos/200';
  int _editCount = 0;

  String get nickname => _nickname;
  String get realName => _realName;
  String get profileImageUrl => _profileImageUrl;

  // เปลี่ยนเฉพาะ 'ชื่อเล่น' เพื่อใช้ทดสอบว่าวิดเจ็ตใดถูกสร้างใหม่บ้าง
  void changeNickname() {
    _editCount++;
    _nickname = 'ต้นกล้า คนที่ $_editCount';
    notifyListeners(); // ประกาศให้ผู้ที่รับฟังอยู่ทราบว่าข้อมูลเปลี่ยนแล้ว
  }
}` },
        { t: 'code', title: 'watch vs Consumer (ตำรา §11.2)', src: `// --- กรณีใช้ context.watch (สร้างใหม่ทั้งโครงสร้าง) ---
class UserProfileWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // การเรียก watch ที่นี่ ทำให้ UserProfileWidget ทั้งหมดถูกสร้างใหม่
    final userProvider = context.watch<UserProvider>();
    print('UserProfileWidget build() ถูกเรียก!');
    return Column(
      children: [
        CircleAvatar(radius: 50, backgroundImage: NetworkImage(userProvider.profileImageUrl)),
        Text(userProvider.realName, style: TextStyle(fontSize: 24)),
        Text('ชื่อเล่น: \${userProvider.nickname}'), // ส่วนเดียวที่ควรเปลี่ยนจริงๆ
      ],
    );
  }
}

// --- กรณีใช้ Consumer (สร้างใหม่เฉพาะส่วน) ---
class UserProfileWidgetEfficient extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // เมธอด build ของวิดเจ็ตแม่จะทำงานเพียงครั้งแรก
    print('UserProfileWidgetEfficient build() ถูกเรียก!');
    return Column(
      children: [
        CircleAvatar(radius: 50, backgroundImage:
            NetworkImage(context.read<UserProvider>().profileImageUrl)),
        Text(context.read<UserProvider>().realName, style: TextStyle(fontSize: 24)),
        // ใช้ Consumer ห่อหุ้มเฉพาะวิดเจ็ต Text ที่แสดงชื่อเล่น
        Consumer<UserProvider>(
          builder: (context, userProvider, child) {
            print('Consumer สำหรับ "ชื่อเล่น" ถูกเรียก!');
            return Text('ชื่อเล่น: \${userProvider.nickname}');
          },
        ),
      ],
    );
  }
}`, notes: [
          { at: 'final userProvider = context.watch<UserProvider>();', note: 'ฟังที่ “ยอดสุด” → ทุก notify ทั้ง build นี้ทำงานใหม่' },
          { at: 'NetworkImage(context.read<UserProvider>().profileImageUrl)),', note: 'อ่านด้วย `read` ครั้งเดียว — ถูกต้อง **เฉพาะเมื่อมั่นใจว่าค่านี้ไม่เปลี่ยน** ตลอดอายุหน้าจอ' },
          { at: 'builder: (context, userProvider, child) {', note: 'builder ได้ 3 อย่าง: context, อินสแตนซ์ provider, และ child (วิดเจ็ตที่สร้างครั้งเดียว)' },
        ] },
        { t: 'code', title: 'พารามิเตอร์ child: กันส่วนที่ “แพง” ไม่ให้ถูกสร้างใหม่', src: `class ExpensiveBadge extends StatelessWidget {
  const ExpensiveBadge({super.key});
  @override
  Widget build(BuildContext context) {
    print('ExpensiveBadge build() ถูกเรียก!');
    return const Icon(Icons.verified, size: 40);
  }
}

Consumer<UserProvider>(
  // สร้างครั้งเดียวตอน Consumer ถูกสร้าง แล้วส่งกลับเข้า builder ซ้ำทุกครั้ง
  child: const ExpensiveBadge(),
  builder: (context, userProvider, child) {
    print('builder ทำงาน แต่ ExpensiveBadge ไม่ถูกสร้างใหม่');
    return Row(
      children: [
        Text('ชื่อเล่น: \${userProvider.nickname}'),
        child!, // นำวิดเจ็ตเดิมกลับมาใช้ซ้ำ ไม่ต้องสร้างใหม่
      ],
    );
  },
)`, notes: [
          { at: 'child!, // นำวิดเจ็ตเดิม', note: '`child` มีชนิด `Widget?` จึงต้อง `!` — เหมาะกับรูปใหญ่ แผนภูมิ รายการย่อยที่ซับซ้อน' },
        ] },
        { t: 'why', choice: 'ห่อ **เฉพาะส่วนที่เปลี่ยน** ด้วย Consumer และใช้ `read` กับค่าที่นิ่งจริงๆ',
          because: ['ใน ListView ที่มีโปรไฟล์จำนวนมาก การไม่สร้าง CircleAvatar/Text ที่ไม่เปลี่ยนซ้ำ ทำให้เลื่อนลื่นขึ้น ประหยัด CPU/หน่วยความจำ', 'child ทำให้ส่วนแพงภายในขอบเขตของ Consumer ไม่ถูกสร้างใหม่'],
          alts: [
            { alt: 'ทำไมไม่ใช้ `watch` ต่อไป (ง่ายกว่า)?', result: 'ทุก notify ทั้งวิดเจ็ต build ใหม่ — “ทุบห้องน้ำทั้งห้อง”', ok: 'วิดเจ็ตเล็กที่เกือบทุกส่วนขึ้นกับ state ([[11.4]])', viz: { name: 'scope', mode: 'watch' } },
            { alt: 'ทำไมไม่ใช้ `read` กับทุกค่าที่ “คิดว่า” ไม่เปลี่ยน?', result: 'ถ้าวันหนึ่งผู้ใช้เปลี่ยนรูปโปรไฟล์ได้ รูปบนจอจะ **ค้าง** ที่รูปเดิม — ตำรา: “ถ้าไม่แน่ใจว่าค่าใดจะเปลี่ยนบ้าง ให้เลือกฝั่งที่ปลอดภัยไว้ก่อน คือรับฟังการเปลี่ยนแปลง”' },
            { alt: 'ถ้า Consumer ดีขนาดนี้ ทำไมไม่ห่อทุกวิดเจ็ตเลย? (หลุมพราง)', result: 'Consumer ก็เป็นวิดเจ็ต มีต้นทุนของตัวเอง: tree ลึกขึ้นหนึ่งชั้นต่อจุด (boilerplate ที่ต้องอ่าน/ดูแล) และ builder จำนวนมากสร้าง overhead ที่อาจแพงกว่าที่ประหยัดได้ — “กุญแจสำคัญจึงอยู่ที่ความพอดี”' },
          ] },
      ],
      quiz: [
        { q: 'กด FAB 3 ครั้งในเวอร์ชัน `UserProfileWidgetEfficient` ข้อความใดปรากฏใน console กี่ครั้ง (ไม่นับตอนเปิดหน้า)?', options: [
          { t: '“Consumer สำหรับ ชื่อเล่น ถูกเรียก!” 3 ครั้ง และ “UserProfileWidgetEfficient build()” 0 ครั้ง', ok: true },
          { t: 'ทั้งสองข้อความ 3 ครั้ง', why: 'build ของแม่ไม่ได้ฟัง จึงไม่ทำงานใหม่' },
          { t: 'ไม่มีข้อความเลย', why: 'builder ของ Consumer ทำงานทุก notify' },
        ] },
        { q: 'พารามิเตอร์ `child` ของ Consumer มีไว้ทำอะไร?', options: [
          { t: 'ส่งวิดเจ็ตที่สร้างครั้งเดียวแล้วนำกลับมาใช้ซ้ำทุกครั้งที่ builder ทำงาน', ok: true },
          { t: 'ระบุว่าจะฟัง provider ตัวไหน', why: 'ระบุด้วย generic `<T>`' },
          { t: 'ส่งข้อมูลจาก provider ลงไปยังลูก', why: 'ข้อมูลมาทางพารามิเตอร์ที่สองของ builder' },
        ] },
        { q: 'ทำไมตำราจึงเรียกการ “ห่อ Consumer ทุกวิดเจ็ต” ว่าหลุมพราง?', options: [
          { t: 'Consumer ก็เป็นวิดเจ็ตที่มีต้นทุน — tree ลึกขึ้นและ builder จำนวนมากอาจแพงกว่าที่ประหยัดได้', ok: true },
          { t: 'Consumer ใช้ได้แค่จุดเดียวต่อแอป', why: 'ใช้ได้หลายจุด' },
          { t: 'Consumer ทำให้ข้อมูลไม่อัปเดต', why: 'อัปเดตปกติ' },
        ] },
      ],
    },
    {
      id: '11.3', title: 'การตีกรอบให้แคบลงอีกขั้นด้วย context.select และ Selector', source: '§11.3', exam: true,
      gist: 'Consumer ยังตื่นทุก `notifyListeners()` · `select` เปลี่ยนคำถามเป็น “**ค่าที่ฉันสนใจ** เปลี่ยนหรือยัง” · `Selector` = Consumer + select · ข้อแม้: ค่าที่เลือกต้องเทียบเท่ากันได้อย่างมีความหมาย, selector ต้องเบาไม่มี side effect, และ **select ใช้ใน build เท่านั้น**',
      blocks: [
        { t: 'viz', id: 'ch11.select', title: 'ใครตื่นเมื่อฟิลด์ไหนเปลี่ยน + ห้องทดลองการเทียบค่า', try: 'กด realName / profileImageUrl (เฉพาะ Consumer ตื่น) แล้วกด nickname (ตื่นทั้งหมด) · ในห้องทดลอง เทียบคอลัมน์ “ตำรา” กับ “provider 6.x จริง”' },
        { t: 'code', title: 'select และ Selector (ตำรา §11.3)', src: `// rebuild เฉพาะตอน 'ชื่อเล่น' เปลี่ยน ฟิลด์อื่นของ UserProvider เปลี่ยนก็ไม่สนใจ
class NicknameLabel extends StatelessWidget {
  const NicknameLabel({super.key});
  @override
  Widget build(BuildContext context) {
    final nickname = context.select<UserProvider, String>(
      (provider) => provider.nickname,
    );
    return Text('ชื่อเล่น: $nickname');
  }
}

// Selector = Consumer ที่กรองข้อมูลก่อน ใช้เมื่อไม่ต้องการ rebuild ทั้งเมธอด build
Selector<UserProvider, String>(
  selector: (context, provider) => provider.nickname,
  builder: (context, nickname, child) => Text('ชื่อเล่น: $nickname'),
)`, notes: [
          { at: 'context.select<UserProvider, String>(', note: '`<T, R>`: T = ชนิดของ provider, R = ชนิดของค่าที่เลือก' },
          { at: 'builder: (context, nickname, child)', note: 'builder ได้ **ค่าที่เลือกแล้ว** (ไม่ใช่ทั้ง provider)' },
        ] },
        { t: 'code', title: 'กับดักที่ตำรายกตัวอย่าง', src: `// ผิด: map().toList() คืน List ใหม่ทุกครั้ง การเทียบด้วย == จึงไม่มีวันเท่ากัน
final names = context.select<ItemProvider, List<String>>(
  (provider) => provider.items.map((item) => item.name).toList(),
);

// ถูก: เลือกค่าที่เปรียบเทียบด้วย == ได้ตรงไปตรงมา
final itemCount = context.select<ItemProvider, int>(
  (provider) => provider.items.length,
);` },
        { t: 'callout', kind: 'real', title: 'provider 6.x เทียบด้วย DeepCollectionEquality ไม่ใช่ == ล้วนๆ', body: [
          'ตรวจจากซอร์สของ `provider-6.1.5+1` (`lib/src/inherited_provider.dart`, `lib/src/selector.dart`): ทั้ง `select` และ `Selector` ใช้ `const DeepCollectionEquality().equals(...)` เทียบค่าใหม่กับค่าเก่า ผลที่ต่างจากตำรา:',
          { t: 'list', items: [
            '`List<String>` ที่ได้จาก `map(...).toList()` — ถ้าสมาชิก **เท่ากันทีละตัว** จะ **ไม่** build ใหม่ (ตัวอย่าง “ผิด” ในตำราจึงไม่ได้ build ทุกครั้งจริง)',
            'กับดักยังมีจริงเมื่อคืนลิสต์ของ **object ที่สร้างใหม่และไม่ได้ override `==`** หรือคืน object ใหม่ที่ไม่ใช่ collection → ไม่เท่ากันเสมอ → build ทุกครั้ง',
            'กับดักเพิ่ม: ถ้าแก้ object เดิม **ในที่ (mutate)** แล้ว select คืนตัวเดิม → เทียบแล้ว “เท่ากัน” → **ไม่ build ทั้งที่ข้อมูลเปลี่ยน**',
          ] },
          '**สำหรับข้อสอบ** ตอบตามหลักของตำรา (“ค่าที่เลือกต้องเทียบด้วย == ได้อย่างมีความหมาย เลือก int/String/bool ปลอดภัยที่สุด”) — หลักนี้ยังถูกเสมอ',
        ] },
        { t: 'why', choice: 'ใช้ `select`/`Selector` เมื่อ provider มี **หลายฟิลด์** และแจ้งเตือนบ่อยจากฟิลด์ที่วิดเจ็ตนี้ไม่สนใจ',
          because: ['Consumer ตื่นทุก notify ไม่ว่าฟิลด์ไหนเปลี่ยน', 'select เทียบค่าที่เลือกกับครั้งก่อน เท่ากันก็ไม่ build'],
          alts: [
            { alt: 'ทำไมไม่ใช้ select ใน onPressed เพื่ออ่านค่า?', result: 'select คือการ **สมัครรับการเปลี่ยนแปลง** ไม่ใช่การอ่านครั้งเดียว — ต้องเรียกใน build เท่านั้น อ่านใน callback ใช้ `context.read<T>()`' },
            { alt: 'ทำไมไม่ใส่การคำนวณหนัก (เช่นกรอง/เรียงลิสต์ใหญ่) ใน selector?', result: 'selector ถูกเรียก **ทุกครั้ง** ที่ provider ประกาศการเปลี่ยนแปลง ต้องเบาและไม่มีผลข้างเคียง ห้ามเรียก API' },
          ] },
      ],
      quiz: [
        { q: 'UserProvider มี nickname, realName, profileImageUrl ผู้ใช้เปลี่ยนรูปโปรไฟล์ วิดเจ็ตใด **ไม่** build ใหม่?', options: [
          { t: '`Selector<UserProvider, String>(selector: (_, p) => p.nickname, …)`', ok: true },
          { t: '`Consumer<UserProvider>` ที่แสดงชื่อเล่น', why: 'Consumer ตื่นทุก notify' },
          { t: 'วิดเจ็ตที่ `context.watch<UserProvider>()`', why: 'watch ตื่นทุก notify' },
        ] },
        { q: 'ข้อใดเป็นค่าที่ “ปลอดภัยที่สุด” สำหรับคืนจาก selector ตามหลักของตำรา?', options: [
          { t: '`provider.items.length` (int)', ok: true },
          { t: '`provider.items.map((i) => ItemView(i)).toList()`', why: 'object ใหม่ทุกครั้ง ไม่เท่ากันเสมอ' },
          { t: '`provider` ทั้งตัว', why: 'เลือกทั้งตัวก็ไม่ได้แคบลง' },
        ] },
        { type: 'spot', q: 'โค้ดนี้ผิดหลักที่ตำราเน้น — บรรทัดไหน?', code: `ElevatedButton(
  onPressed: () {
    final count = context.select<CartProvider, int>((c) => c.count);
    showCount(count);
  },
  child: const Text('ดูจำนวน'),
)`, bad: 'final count = context.select<CartProvider, int>((c) => c.count);', explain: '`select` ใช้ใน build เท่านั้น (เป็นการสมัครฟัง) — ใน callback ให้ใช้ `context.read<CartProvider>().count`' },
      ],
    },
    {
      id: '11.4', title: 'บันไดของการรับฟัง: เลือกเครื่องมือให้พอดีกับงาน', source: '§11.4', exam: true,
      gist: '4 ขั้นจากกว้างไปแคบ: **read** (ไม่ฟัง) → **watch** (ทั้ง build) → **Consumer** (เฉพาะพื้นที่) → **select/Selector** (เฉพาะค่า) · เริ่มจากที่อ่านง่ายที่สุด (watch/Consumer) → **วัดผล** → ค่อยไต่ลงเฉพาะจุดที่เป็นคอขวดจริง',
      blocks: [
        { t: 'viz', id: 'ch11.ladder', title: 'บันได + เลือกขั้นให้พอดี', try: 'จัดแต่ละสถานการณ์ลงขั้นที่เหมาะ แล้วอ่านเหตุผล' },
        { t: 'compare', cols: ['ขั้น', 'ขอบเขตการฟัง', 'ใช้เมื่อ'], rows: [
          ['`context.read<T>()`', 'ไม่รับฟังเลย', 'แค่สั่งงาน provider (onPressed) หน้าตาไม่ขึ้นกับผล'],
          ['`context.watch<T>()`', 'ทั้งเมธอด build', 'เกือบทุกส่วนขึ้นกับ state หรือวิดเจ็ตเล็กจนตีกรอบไม่คุ้ม'],
          ['`Consumer<T>`', 'เฉพาะพื้นที่ที่ห่อ', 'แม่มีหลายชิ้น เปลี่ยนแค่บางชิ้น'],
          ['`select` / `Selector`', 'เฉพาะค่าที่ระบุ', 'provider หลายฟิลด์ แจ้งบ่อยจากฟิลด์ที่ไม่สนใจ'],
        ] },
        { t: 'why', choice: 'เริ่มจาก watch/Consumer ให้ **ถูกต้องก่อน** แล้ววัด แล้วค่อยไต่ลงเฉพาะจุดที่มีปัญหาจริง',
          because: ['ทุกขั้นที่แคบลงมีต้นทุนเป็นความซับซ้อนของโค้ด', 'ตำรา: ใส่ Selector ทุกจุดตั้งแต่ยังไม่มีปัญหา = “**การจ่ายด้วยความอ่านยากเพื่อแลกกับสิ่งที่วัดไม่ได้**” ซึ่งแย่พอๆ กับปล่อยให้แอปกระตุก'],
          alts: [
            { alt: 'ทำไมไม่ใช้ขั้นที่แคบที่สุดไว้ก่อนทุกจุด จะได้เร็วที่สุด?', result: 'โค้ดอ่านยากโดยไม่ได้ประโยชน์ที่วัดได้ และเสี่ยงบั๊ก (เช่น select คืนค่าที่เทียบไม่ได้ [[11.3]])' },
          ] },
      ],
      quiz: [
        { type: 'order', q: 'เรียงขั้นของบันไดจาก “กว้างที่สุด” ไป “แคบที่สุด” (ไม่นับ read ที่ไม่ฟัง)', items: ['`context.watch<T>()`', '`Consumer<T>`', '`context.select<T, R>()` / `Selector<T, R>`'] },
        { q: 'ลำดับการตัดสินใจที่ตำราแนะนำคือข้อใด?', options: [
          { t: 'เริ่มจากที่อ่านง่ายให้ถูกก่อน → วัดผล → ไต่ลงเฉพาะจุดที่ช้า', ok: true },
          { t: 'ใช้ Selector ทุกจุดตั้งแต่แรก', why: 'จ่ายด้วยความอ่านยากเพื่อสิ่งที่วัดไม่ได้' },
          { t: 'ใช้ read ทุกจุดเพื่อไม่ให้ rebuild', why: 'จอจะค้าง' },
        ] },
      ],
    },
    {
      id: '11.5', title: 'พิสูจน์ด้วยการวัด: ดูให้เห็นว่าวิดเจ็ตใดถูกสร้างใหม่บ้าง', source: '§11.5',
      gist: '3 ระดับ: **print** ใน build/builder → **`debugPrintRebuildDirtyWidgets = true`** → **IDE / DevTools** (Show widget rebuild information, Track Widget Builds) · วัดใน **profile mode** · งบเฟรม ≈ **16 ms** ที่ 60 fps',
      blocks: [
        { t: 'viz', id: 'ch11.measure', title: 'DevTools จำลอง', try: 'เทียบโค้ดสองแบบ แล้วสลับโหมด debug/profile และเปิด print ทุกเฟรม — สังเกตแท่งที่เกินเส้น 16 ms' },
        { t: 'list', ordered: true, items: [
          '**print** ในเมธอด build และใน builder — ถ้าตีกรอบได้ผล ข้อความจากวิดเจ็ตแม่ต้องปรากฏ **ครั้งเดียว** ขณะที่ของ builder ปรากฏทุกครั้งที่กด',
          '**`debugPrintRebuildDirtyWidgets`** — Flutter พิมพ์ชื่อทุกวิดเจ็ตที่ถูกสร้างใหม่ในแต่ละเฟรม (ดีตอนยังไม่รู้จะวาง print ตรงไหน)',
          '**Android Studio/IntelliJ**: View › Tool Windows › Flutter Performance › Show widget rebuild information (จำนวนในเฟรมล่าสุด + สะสม, ไอคอนหมุนที่บรรทัดโค้ด — debug build เท่านั้น) · **DevTools** › Performance › Enhance tracing › **Track Widget Builds**',
        ] },
        { t: 'code', title: 'เปิดเฉพาะตอนตรวจสอบ', src: `// lib/main.dart — เปิดเฉพาะตอนตรวจสอบ แล้วปิดกลับเมื่อเสร็จ
// ตัวแปรนี้มาพร้อม package:flutter/material.dart อยู่แล้ว ไม่ต้อง import เพิ่ม
void main() {
  debugPrintRebuildDirtyWidgets = true; // พิมพ์ชื่อวิดเจ็ตที่ถูกสร้างใหม่ทุกเฟรม
  runApp(const MyApp());
}` },
        { t: 'why', choice: 'วัดประสิทธิภาพใน **profile mode**',
          because: ['โหมด debug ไม่ได้ปรับแต่งโค้ดและมีการตรวจสอบเพิ่มจำนวนมาก — ช้ากว่าความจริงหลายเท่า'],
          alts: [
            { alt: 'ทำไมไม่ดูความเร็วตอนรัน debug ปกติก็พอ?', result: 'ตัวเลขจะแย่เกินจริง อาจไปปรับจุดที่ไม่ใช่คอขวด · และ print ที่วางทุกเฟรมก็เป็นตัวถ่วงเอง' },
          ] },
      ],
      quiz: [
        { q: 'ถ้าแอปทำงานที่ 60 fps แต่ละเฟรมมีงบเวลาประมาณเท่าไร?', options: [
          { t: '16 มิลลิวินาที', ok: true },
          { t: '60 มิลลิวินาที', why: '1000/60 ≈ 16' },
          { t: '1 วินาที', why: 'ช้าเกินไปมาก' },
        ] },
        { q: 'ควรวัดประสิทธิภาพการ rebuild ในโหมดใด?', options: [
          { t: 'profile mode', ok: true },
          { t: 'debug mode เพราะเห็นข้อความครบที่สุด', why: 'debug ช้ากว่าความจริงหลายเท่า' },
          { t: 'hot reload', why: 'ไม่ใช่โหมดการ build' },
        ] },
      ],
    },
    {
      id: '11.6', title: 'ภาพรวมการทำงาน: แผนภาพกระบวนการ (Swimlane Diagram)', source: '§11.6', exam: true,
      gist: '4 เลน: **ผู้ใช้ · EditItemScreen · ItemProvider · ItemListScreen** — หน้าแก้ไข **ส่งคำสั่ง** (`read`) แล้วไม่สนใจผล (fire and forget) · provider **จัดการตรรกะ + ประกาศ** (`notifyListeners`) · หน้ารายการ **ฟังผ่าน Consumer** แล้วอัปเดต',
      blocks: [
        { t: 'viz', id: 'ch11.swim', title: 'แผนภาพ 4 เลน (ปฏิบัติการบทที่ 11)', try: 'เล่นสถานการณ์ปกติก่อน แล้วสลับเป็นสองสถานการณ์ที่พัง — เลนไหนเป็นต้นเหตุ?' },
        { t: 'callout', kind: 'analogy', title: 'ลูกค้า พ่อครัว และพนักงานเสิร์ฟ (จากตำรา)', body: [
          { t: 'list', items: [
            '**หน้าจอแก้ไข = ลูกค้า** — เขียนออเดอร์ยื่นให้แล้วกลับไปนั่งรอ ไม่ยืนคุมหน้าเตา (fire and forget)',
            '**Provider = พ่อครัว** — ปรุงอยู่หลังร้าน ผัดกะเพราเสร็จก็สั่นกระดิ่ง (`notifyListeners()`)',
            '**Consumer = พนักงานเสิร์ฟ** — ได้ยินกระดิ่งเมื่อไรก็ไปรับจานมาเสิร์ฟทันที ไม่ต้องเดินไปถามพ่อครัวเป็นระยะ',
          ] },
        ] },
        { t: 'why', choice: 'แยกหน้าที่ 3 ฝ่ายให้ชัด (สั่งงาน / จัดการ+ประกาศ / ฟัง+แสดง)',
          because: ['ทดสอบและไล่บั๊กง่าย — **อาการเสียแต่ละแบบชี้ไปที่ผู้ต้องสงสัยเพียงรายเดียว**', '“กดบันทึกแล้วหน้าหลักไม่อัปเดต” → ตรวจพ่อครัวว่าลืมสั่นกระดิ่ง (notifyListeners) หรือเปล่า ไม่ต้องรื้อฝั่งลูกค้า', '“พิมพ์ในฟอร์มไม่ได้ตั้งแต่แรก” → ดูหน้าจอแก้ไขจุดเดียว ไม่ต้องสงสัย provider'],
          alts: [
            { alt: 'ทำไมหน้าแก้ไขไม่อัปเดตลิสต์ของหน้ารายการเองแล้วส่งกลับผ่าน pop?', result: 'กลับไปสู่ปัญหาบทที่ 9 — หน้าแก้ไขต้องรู้ว่าใครถือข้อมูล และทุกหน้าที่แสดงข้อมูลชุดนี้ต้องได้รับผลเองทีละทอด' },
          ] },
      ],
      quiz: [
        { q: 'ผู้ใช้กดบันทึกแล้วกลับมาหน้ารายการ แต่ข้อมูลไม่อัปเดต ตามอุปมาร้านอาหาร ควรตรวจอะไรเป็นอันดับแรก?', options: [
          { t: 'provider เรียก `notifyListeners()` หลังแก้ข้อมูลแล้วหรือยัง (พ่อครัวสั่นกระดิ่งไหม)', ok: true },
          { t: 'TextFormField ในหน้าแก้ไขพิมพ์ได้หรือไม่', why: 'นั่นคืออาการอีกแบบ' },
          { t: 'Navigator.pop ถูกเรียกหรือยัง', why: 'กลับมาหน้ารายการได้แล้ว แปลว่า pop ทำงาน' },
        ] },
        { q: 'ทำไม `_saveForm` ใช้ `context.read<ItemProvider>()`?', options: [
          { t: 'หน้าแก้ไขแค่สั่งงานแล้วปิด ไม่ต้อง build ใหม่ตามผล (fire and forget)', ok: true },
          { t: 'เพราะ watch ใช้กับ StatefulWidget ไม่ได้', why: 'ใช้ได้ แต่ไม่ใช่ใน callback' },
          { t: 'เพื่อให้หน้ารายการอัปเดต', why: 'หน้ารายการอัปเดตเพราะ notifyListeners + Consumer' },
        ] },
      ],
    },
    {
      id: '11.7', title: 'การจัดการสถานะหลายประเภทด้วย MultiProvider', source: '§11.7', exam: true,
      gist: 'provider ซ้อนกัน = **Pyramid of Doom** (รันได้ แต่อ่าน/แก้/merge ยาก) · `MultiProvider(providers: [...], child: ...)` อ่านง่ายขึ้น **แต่ไม่ได้เร็วขึ้น** — ข้างในยังซ้อนเหมือนเดิม → **ลำดับมีความหมาย** (ตัวที่พึ่งพาต้องอยู่หลัง) · provider เป็น **lazy** โดยค่าเริ่มต้น',
      blocks: [
        { t: 'viz', id: 'ch11.multi', title: 'ซ้อนกัน vs MultiProvider + ลำดับ + lazy', try: 'กด “+ เพิ่ม provider” แล้วดูว่าแบบซ้อนต้องเยื้องใหม่ทั้งก้อน · ด้านล่าง เลื่อน CartProvider ขึ้นไปก่อน AuthProvider แล้วรันแอป' },
        { t: 'code', title: 'แนวทางที่แนะนำ (ตำรา §11.7)', src: `void main() {
  runApp(
    MultiProvider(
      providers: [
        // ประกาศ Provider ทั้งหมดที่ต้องการในรูปแบบรายการ
        ChangeNotifierProvider(create: (context) => AuthProvider()),
        ChangeNotifierProvider(create: (context) => CartProvider()),
        ChangeNotifierProvider(create: (context) => ProductProvider()),
      ],
      child: const MyApp(),
    ),
  );
}` },
        { t: 'why', choice: 'ใช้ **MultiProvider** แทนการซ้อน',
          because: ['**Readability** — เห็นทันทีว่ามี provider อะไรบ้าง', '**Maintainability** — เพิ่ม/ลบ/สลับลำดับแค่แก้รายการ', '**Reduced nesting** — ไม่มีวงเล็บซ้อนลึก ลด merge conflict เพราะการเพิ่มหนึ่งตัวไม่กระทบการเยื้องของบรรทัดอื่น', 'ตำรา: โค้ด “ถูกเขียนขึ้นเพียงครั้งเดียว แต่ถูกอ่านและถูกแก้ไขซ้ำแล้วซ้ำเล่าเป็นร้อยครั้ง”'],
          alts: [
            { alt: 'MultiProvider ทำให้แอปเร็วขึ้นไหม?', result: '**ไม่** — ไม่เปลี่ยนการทำงานหรือประสิทธิภาพของ provider แม้แต่น้อย เบื้องหลังยังนำ provider มาซ้อนกันเป็นชั้นเหมือนเดิม คุณค่าคือการดูแลรักษาล้วนๆ' },
          ] },
        { t: 'callout', kind: 'exam', title: 'สิ่งที่ MultiProvider ไม่ได้เปลี่ยน → ผลสำคัญ 2 ข้อ', body: [
          { t: 'list', items: [
            '**ลำดับในรายการมีความหมาย**: ตัวที่ประกาศก่อนอยู่ชั้นบนกว่า → provider ที่ต้องอ่านข้อมูลของอีกตัว **ต้องประกาศหลัง** ตัวที่มันพึ่งพา ไม่งั้นหาไม่เจอ (error ตอนรัน)',
            '**lazy โดยค่าเริ่มต้น**: `create` ยังไม่ทำงานจนกว่าวิดเจ็ตตัวแรกจะร้องขอ (ประหยัดตอนเปิดแอป) — ถ้าต้องเริ่มทันที (เช่นเชื่อมบริการเบื้องหลัง) ให้ใส่ `lazy: false`',
          ] },
        ] },
      ],
      quiz: [
        { q: 'ข้อใดถูกต้องเกี่ยวกับ MultiProvider?', options: [
          { t: 'อ่านง่ายขึ้น แต่เบื้องหลังยังซ้อนกันเหมือนเดิม จึงต้องระวังลำดับ', ok: true },
          { t: 'ทำให้ rebuild น้อยลง', why: 'ไม่เปลี่ยนประสิทธิภาพเลย' },
          { t: 'provider ในรายการเข้าถึงกันได้ทุกทิศทาง', why: 'ตัวหลังเห็นตัวก่อนเท่านั้น' },
        ] },
        { q: 'CartProvider ต้องอ่าน AuthProvider ควรเรียงใน `providers: [...]` อย่างไร?', options: [
          { t: 'AuthProvider ก่อน แล้วค่อย CartProvider', ok: true },
          { t: 'CartProvider ก่อน', why: 'ตัวที่พึ่งพาต้องอยู่หลัง' },
          { t: 'ลำดับไม่มีผล', why: 'มีผล' },
        ] },
        { q: '`lazy: false` ใช้เมื่อใด?', options: [
          { t: 'provider ต้องเริ่มทำงานทันทีตอนเปิดแอป เช่นเชื่อมบริการเบื้องหลัง', ok: true },
          { t: 'อยากให้แอปเปิดเร็วขึ้น', why: 'lazy (ค่าเริ่มต้น) ต่างหากที่ประหยัดตอนเปิด' },
          { t: 'ทุก provider ควรเป็น lazy: false', why: 'ใช้เฉพาะที่จำเป็น' },
        ] },
      ],
    },
    {
      id: '11.8', title: 'เมื่อ Provider ตัวเดียวใหญ่เกินไป: การแบ่งความรับผิดชอบ', source: '§11.8',
      gist: 'หั่น **ตามความรับผิดชอบ ไม่ใช่ตามหน้าจอ** — provider หนึ่งตัวเป็นเจ้าของข้อมูลชุดเดียวที่เปลี่ยนไปด้วยกัน และมีเหตุผลเดียวที่ต้องแก้ · provider ที่พึ่งอีกตัวใช้ `ChangeNotifierProxyProvider` ซึ่ง `update` **ต้องคืนอ็อบเจกต์เดิม**',
      blocks: [
        { t: 'viz', id: 'ch11.split', title: 'หั่นให้ถูก + ProxyProvider ที่ทำตะกร้าหาย', try: 'จัดของลง provider ให้ถูก · ด้านล่าง เพิ่มสินค้าแล้วกด “AuthProvider เปลี่ยน” ทั้งสองโหมด' },
        { t: 'compare', cols: ['สัญญาณว่าควรหั่น', 'สัญญาณว่าหั่นมากเกินไป'], rows: [
          ['ไฟล์ยาวจนต้องเลื่อนหาเมธอดนาน', 'provider หลายตัวต้องถูกแก้พร้อมกันเสมอเมื่อมีฟีเจอร์ใหม่'],
          ['มีกลุ่มข้อมูลที่ไม่เคยเปลี่ยนพร้อมกันอยู่ในคลาสเดียว', 'ต้องส่งข้อมูลไปมาระหว่างกันตลอดจนตามลำดับไม่ทัน'],
          ['notifyListeners() ครั้งเดียวปลุกวิดเจ็ตที่ไม่เกี่ยวข้องจำนวนมาก', ''],
          ['แก้ด้วยเหตุผลที่ไม่เกี่ยวกัน (กติกาส่วนลด vs รูปแบบแชต)', ''],
        ] },
        { t: 'code', title: 'ChangeNotifierProxyProvider (ตำรา §11.8)', src: `MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (context) => AuthProvider()),

    // CartProvider ต้องรู้ว่าใครล็อกอินอยู่ จึงต้องประกาศ 'หลัง' AuthProvider
    ChangeNotifierProxyProvider<AuthProvider, CartProvider>(
      create: (context) => CartProvider(),
      // update ถูกเรียกทุกครั้งที่ AuthProvider ประกาศการเปลี่ยนแปลง
      // ต้องนำ previousCart กลับมาใช้ซ้ำ ไม่เช่นนั้นข้อมูลในตะกร้าจะหายทุกครั้ง
      update: (context, auth, previousCart) =>
          (previousCart ?? CartProvider())..setUser(auth.userId),
    ),
  ],
  child: const MyApp(),
)`, notes: [
          { at: 'ChangeNotifierProxyProvider<AuthProvider, CartProvider>(', note: '`<ต้นทางที่พึ่งพา, ตัวที่สร้าง>`' },
          { at: '(previousCart ?? CartProvider())..setUser(auth.userId),', note: '`??` = ถ้า previousCart เป็น null (ครั้งแรก) สร้างใหม่ · `..` (cascade) = เรียก setUser แล้วคืน **อ็อบเจกต์ตัวเดิม** ([[dart]])' },
        ] },
        { t: 'why', choice: '`update` ต้องคืน **อ็อบเจกต์เดิมที่ปรับค่าแล้ว**',
          because: ['การสร้างใหม่ = ทิ้ง state ที่สะสมไว้ทั้งหมด'],
          alts: [
            { alt: 'ทำไมไม่สร้าง `CartProvider()..setUser(...)` ใหม่ทุกครั้งให้ง่าย?', result: 'ตำรา: ผู้เรียนจำนวนมากพบอาการ “**สินค้าในตะกร้าหายเองโดยไม่ทราบสาเหตุ**” ซึ่งมีต้นตอจากจุดนี้' },
          ] },
        { t: 'callout', kind: 'warn', title: 'ProxyProvider ซ้อนหลายชั้น = สัญญาณเตือน', body: 'ถ้าต้องใช้ ChangeNotifierProxyProvider ซ้อนกันหลายชั้นจนตามลำดับการพึ่งพาไม่ทัน ให้ถอยกลับมาทบทวน — มักแปลว่าเส้นแบ่งระหว่าง provider ถูกลากผิดที่ตั้งแต่แรก' },
      ],
      quiz: [
        { q: 'เกณฑ์ใดถูกต้องสำหรับการหั่น provider ตามตำรา?', options: [
          { t: 'หั่นตามความรับผิดชอบ — หนึ่งตัวถือข้อมูลที่เปลี่ยนไปด้วยกันและมีเหตุผลเดียวที่ต้องแก้', ok: true },
          { t: 'หนึ่งหน้าจอต่อหนึ่ง provider', why: 'ตำราระบุว่า “ไม่ใช่หั่นตามหน้าจอ”' },
          { t: 'ยิ่งเล็กยิ่งดี หั่นให้มากที่สุด', why: 'มีสัญญาณของการหั่นมากเกินไปด้วย' },
        ] },
        { q: 'ใน `update` ของ ChangeNotifierProxyProvider ถ้าคืน `CartProvider()..setUser(auth.userId)` ทุกครั้ง จะเกิดอะไร?', options: [
          { t: 'ตะกร้าใหม่ทุกครั้งที่ Auth เปลี่ยน → สินค้าที่เพิ่มไว้หาย', ok: true },
          { t: 'ทำงานถูกต้องเหมือนกัน', why: 'state ที่สะสมหายไป' },
          { t: 'compile ไม่ผ่าน', why: 'compile ผ่าน — บั๊กเกิดตอนใช้งาน' },
        ] },
      ],
    },
    {
      id: 'lab11', title: 'ปฏิบัติการที่ 1: provider_editor_lab', short: 'แลป 1', source: 'ปฏิบัติการที่ 1', exam: true,
      gist: 'แอป 2 หน้า: **ItemListScreen** (Consumer ห่อ ListView) → แตะแล้ว `pushNamed(..., arguments: item)` → **EditItemScreen** อ่าน args ใน `didChangeDependencies` (มียาม `_isInit`) → `_saveForm` เรียก `read<ItemProvider>().updateItem(...)` แล้ว pop',
      blocks: [
        { t: 'steps', items: [
          'สร้างโปรเจกต์ `provider_editor_lab` + เพิ่ม provider + โฟลเดอร์ `models`, `providers`, `screens`',
          '`Item` (id, name, description) — name/description เปลี่ยนได้ (ไม่ final)',
          '`ItemProvider extends ChangeNotifier`: `_items` 3 รายการ + getter + `updateItem(id, newName, newDescription)` ที่หา index แล้วแก้ในที่ + `notifyListeners()`',
          '`ItemListScreen`: Consumer ห่อ `ListView.builder` · ListTile.onTap → `pushNamed(EditItemScreen.routeName, arguments: item)`',
          '`EditItemScreen`: controller ×2, อ่าน `ModalRoute` ใน didChangeDependencies, `_saveForm()` → read + pop',
          '`main.dart`: `ChangeNotifierProvider(create: (context) => ItemProvider())` + `initialRoute` + `routes` → รันแบบ Full Restart',
        ] },
        { t: 'code', title: 'ItemProvider (แลป 1)', src: `class ItemProvider extends ChangeNotifier {
  // ข้อมูลตัวอย่างเริ่มต้น
  final List<Item> _items = [
    Item(id: '1', name: 'MacBook Pro', description: 'Apple M3 Pro Chip'),
    Item(id: '2', name: 'Dell XPS 15', description: 'Intel Core i9, 32GB RAM'),
    Item(id: '3', name: 'Logitech MX Master 3S', description: 'Wireless Mouse'),
  ];

  // Getter เพื่อให้ส่วน UI สามารถเข้าถึงข้อมูลได้
  List<Item> get items => _items;

  // เมธอดสำหรับอัปเดตข้อมูลตาม id
  void updateItem(String id, String newName, String newDescription) {
    final itemIndex = _items.indexWhere((item) => item.id == id);
    if (itemIndex >= 0) {
      _items[itemIndex].name = newName;
      _items[itemIndex].description = newDescription;
      notifyListeners(); // แจ้งเตือนวิดเจ็ตที่กำลัง "ฟัง" อยู่ว่ามีการเปลี่ยนแปลง
    }
  }
}`, notes: [
          { at: 'List<Item> get items => _items;', note: 'คืน **ลิสต์ตัวจริง** — ใครก็ `.add()` เองได้โดยไม่ผ่าน notifyListeners (ดูภาพ getter ด้านล่าง) · แลป 2 คืนสำเนา · บทที่ 12 ใช้ `List.unmodifiable`' },
          { at: 'final itemIndex = _items.indexWhere((item) => item.id == id);', note: '`indexWhere` คืน -1 ถ้าไม่เจอ จึงเช็ก `>= 0`' },
        ] },
        { t: 'callout', kind: 'note', title: 'ขอบเขตของ Consumer ในแลปนี้ (ตำราอธิบายไว้)', body: 'ห่อ `ListView.builder` ทั้งก้อน → แก้รายการเดียว ทุกแถวสร้างใหม่ — สำหรับ 3 รายการ ต้นทุนต่ำมากและอ่านง่ายที่สุด · ถ้ามีหลายร้อยแถวพร้อมรูป ให้ย้าย Consumer/Selector **ลงไปใน itemBuilder** — “นี่คือรูปธรรมของบันไดการรับฟัง” ([[11.4]])' },
        { t: 'viz', id: 'ch11.didchange', title: 'ทำไมต้องมียาม _isInit ใน didChangeDependencies', try: 'เปิดสวิตช์ยาม แล้วกดหมุนจอ/เปลี่ยนธีม (ข้ามอย่างปลอดภัย) → ปิดสวิตช์ยามแล้วลองอีกครั้ง' },
        { t: 'code', title: 'EditItemScreen แบบมียาม (ตำรา)', src: `class _EditItemScreenState extends State<EditItemScreen> {
  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;
  late Item _item;
  bool _isInit = false; // ยามกันการกำหนดค่าซ้ำ

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInit) return; // ครั้งที่สองเป็นต้นไป ไม่ต้องสร้าง controller ใหม่
    _isInit = true;

    _item = ModalRoute.of(context)!.settings.arguments as Item;
    _nameController = TextEditingController(text: _item.name);
    _descriptionController = TextEditingController(text: _item.description);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _saveForm() {
    // ใช้ context.read เพื่อเรียกเมธอดใน provider โดยไม่ทำให้หน้านี้ rebuild
    context.read<ItemProvider>().updateItem(
      _item.id,
      _nameController.text,
      _descriptionController.text,
    );
    Navigator.pop(context); // กลับไปยังหน้าหลัก
  }
  // build: TextFormField ×2 + ElevatedButton(onPressed: _saveForm)
}`, notes: [
          { at: 'void didChangeDependencies() {', note: 'ใน initState context “**เสียบปลั๊กแต่ยังไม่เปิดสวิตช์**” — รู้ว่ามีตัวตนแต่ยังไม่รู้ว่าอยู่ตรงไหน → `ModalRoute.of` ใช้ไม่ได้ · didChangeDependencies คือจังหวะที่ “**ไฟเดินครบวงจรแล้ว**” ([[9.6]])' },
          { at: 'if (_isInit) return;', note: 'didChangeDependencies ถูกเรียกซ้ำเมื่อธีม/ขนาดจอ (หมุนเครื่อง)/ภาษาเปลี่ยน — ไม่มียาม: กำหนด `late final` ซ้ำ → `LateInitializationError` + controller ตัวเดิมค้างไม่ถูก dispose' },
        ] },
        { t: 'viz', id: 'ch11.getter', title: 'getter ของรายการ: ตัวจริง vs สำเนา vs unmodifiable', try: 'ลองแก้ลิสต์จากหน้าจอโดยตรงในแต่ละแบบ' },
        { t: 'callout', kind: 'note', title: 'พิสูจน์ด้วยตาตัวเอง (ตำราแนะนำ)', body: 'ใส่ print ที่บรรทัดแรกของ `build` ใน ItemListScreen และบรรทัดแรกของ builder ใน Consumer แล้วแก้ไขสินค้า 3 ครั้ง → build ปรากฏครั้งเดียวตอนเปิดหน้า ส่วน builder ปรากฏทุกครั้งที่บันทึก ([[11.5]])' },
      ],
      quiz: [
        { q: 'ถ้าย้ายโค้ดอ่าน `ModalRoute.of(context)` จาก didChangeDependencies ไปไว้ใน initState จะเกิดอะไร?', options: [
          { t: 'error เพราะยังลงทะเบียน dependency กับ route ไม่ได้ใน initState', ok: true },
          { t: 'ทำงานได้ปกติและเร็วกว่า', why: 'ตำราอธิบายว่าทำไม่ได้' },
          { t: 'ได้ arguments เป็น null เสมอ', why: 'ไม่ได้ null แต่เป็น error' },
        ] },
        { q: 'หน้าแก้ไขที่ไม่มียาม `_isInit` แล้วผู้ใช้หมุนจอ จะเกิดอะไร?', options: [
          { t: 'didChangeDependencies ทำงานซ้ำ → กำหนด late final ซ้ำ → LateInitializationError', ok: true },
          { t: 'ไม่มีอะไรเกิดขึ้น เพราะ didChangeDependencies เรียกครั้งเดียว', why: 'ถูกเรียกซ้ำเมื่อ dependency เปลี่ยน เช่น MediaQuery' },
          { t: 'ข้อมูลถูกบันทึกอัตโนมัติ', why: 'ไม่เกี่ยว' },
        ] },
      ],
    },
    {
      id: 'lab11b', title: 'ปฏิบัติการที่ 2: provider_shop (MultiProvider + Form)', short: 'แลป 2', source: 'ปฏิบัติการที่ 2',
      gist: '2 provider (`ItemProvider` ที่ getter คืน **สำเนา** `[..._items]`, `UserProfileProvider`) รวมด้วย **MultiProvider** · หน้ารายการใช้ `watch` กับชื่อผู้ใช้ใน AppBar + `Consumer` กับรายการ · หน้าแก้ไขเป็น **Form** ที่มี validator และ onSaved สร้าง Item ใหม่',
      blocks: [
        { t: 'code', title: 'ItemProvider (แลป 2) — ต่างจากแลป 1 อย่างไร', src: `class ItemProvider extends ChangeNotifier {
  final List<Item> _items = [ /* ปากกา, สมุด, คลิปหนีบกระดาษ (มีราคา) */ ];

  List<Item> get items => [..._items]; // คืนค่าสำเนาของลิสต์

  Item findById(String id) {
    return _items.firstWhere((item) => item.id == id);
  }

  void updateItem(String id, Item newItemData) {
    final itemIndex = _items.indexWhere((item) => item.id == id);
    if (itemIndex >= 0) {
      _items[itemIndex] = newItemData; // แทนที่ทั้งอ็อบเจกต์ (ไม่แก้ในที่)
      notifyListeners(); // แจ้งเตือนการเปลี่ยนแปลง
    }
  }
}`, notes: [
          { at: 'List<Item> get items => [..._items];', note: 'spread `...` สร้างลิสต์ใหม่ — คนนอกแก้ได้แค่สำเนา' },
          { at: '_items[itemIndex] = newItemData;', note: 'แทนที่ทั้งอ็อบเจกต์ → `select` ที่เทียบสมาชิกจะเห็นว่าเปลี่ยน ([[11.3]])' },
        ] },
        { t: 'code', title: 'หน้ารายการ: watch กับ Consumer ในหน้าเดียว', src: `@override
Widget build(BuildContext context) {
  // ดึงชื่อผู้ใช้มาแสดงใน AppBar
  final username = context.watch<UserProfileProvider>().username;

  return Scaffold(
    appBar: AppBar(title: Text('รายการสินค้า (ผู้ใช้: $username)')),
    body: Consumer<ItemProvider>(
      builder: (ctx, itemProvider, child) => ListView.builder(
        itemCount: itemProvider.items.length,
        itemBuilder: (_, i) {
          final item = itemProvider.items[i];
          return ListTile(
            title: Text(item.name),
            subtitle: Text(item.description),
            trailing: Text('฿\${item.price.toStringAsFixed(2)}'),
            onTap: () {
              Navigator.of(context).pushNamed(EditItemScreen.routeName, arguments: item.id);
            },
          );
        },
      ),
    ),
  );
}`, notes: [
          { at: 'final username = context.watch<UserProfileProvider>().username;', note: 'watch ที่บนสุดของ build → ชื่อผู้ใช้เปลี่ยน ทั้งหน้า build ใหม่ (ความท้าทายข้อ 1 ให้เปลี่ยนเป็น `select`)' },
          { at: 'arguments: item.id)', note: 'ส่งแค่ id แล้วหน้าแก้ไขไป `findById` เอง — ต่างจากแลป 1 ที่ส่งทั้งอ็อบเจกต์' },
        ] },
        { t: 'code', title: 'หน้าแก้ไข: Form + onSaved สร้าง Item ใหม่', src: `@override
void didChangeDependencies() {
  if (!_isInit) {
    _itemId = ModalRoute.of(context)!.settings.arguments as String;
    _editedItem = Provider.of<ItemProvider>(context, listen: false).findById(_itemId);
    _nameController.text = _editedItem.name;
    _descController.text = _editedItem.description;
    _priceController.text = _editedItem.price.toString();
  }
  _isInit = true;
  super.didChangeDependencies();
}

void _saveForm() {
  final isValid = _formKey.currentState!.validate();
  if (!isValid) {
    return;
  }
  _formKey.currentState!.save();
  context.read<ItemProvider>().updateItem(_itemId, _editedItem);
  Navigator.of(context).pop();
}

// ช่องราคา
validator: (value) {
  if (value!.isEmpty) return 'กรุณาป้อนราคา';
  if (double.tryParse(value) == null) return 'กรุณาป้อนตัวเลขที่ถูกต้อง';
  if (double.parse(value) <= 0) return 'ราคาต้องมากกว่า 0';
  return null;
},
onSaved: (value) {
  _editedItem = Item(
      id: _editedItem.id,
      name: _editedItem.name,
      description: _editedItem.description,
      price: double.parse(value!));
},`, notes: [
          { at: 'Provider.of<ItemProvider>(context, listen: false)', note: '**เทียบเท่า `context.read<ItemProvider>()`** — เป็นรูปแบบเก่าที่ตำราไม่ได้แนะนำไว้ในบทที่ 10' },
          { at: '_formKey.currentState!.save();', note: 'onSaved ของแต่ละช่องสร้าง Item ใหม่ทีละฟิลด์ (immutable update) — ทบทวน [[8.8]]' },
          { at: 'if (double.tryParse(value) == null)', note: '`tryParse` คืน null ถ้าแปลงไม่ได้ (ไม่ throw) — เหมาะกับ validator' },
        ] },
        { t: 'callout', kind: 'real', title: 'ความต่างที่ควรสังเกต', body: [
          { t: 'list', items: [
            'แลป 2 วาง `MultiProvider` ไว้ใน `MyApp.build` (ห่อ MaterialApp) ส่วน 11.7 วางใน `runApp` — ทั้งสองแบบใช้ได้ เพราะ provider ยังอยู่เหนือ MaterialApp/Navigator',
            '`Provider.of(context, listen: false)` = `context.read` · `Provider.of(context)` (listen: true) = `context.watch`',
            'controller ในแลป 2 ไม่ใช่ `late final` (สร้างตอนประกาศ) จึงไม่เกิด LateInitializationError แต่ถ้าไม่มียาม การหมุนจอจะ **เขียนทับค่าที่ผู้ใช้แก้ไว้** ด้วยค่าเดิม',
          ] },
        ] },
        { t: 'h', text: 'ความท้าทายเพิ่มเติม' },
        { t: 'list', ordered: true, items: [
          'เปลี่ยนชื่อผู้ใช้บน AppBar เป็น `context.select` แล้วเปิด `debugPrintRebuildDirtyWidgets` เทียบจำนวน rebuild ก่อน/หลัง',
          'ย้าย Consumer ลงไปใน itemBuilder ให้แต่ละแถวฟังข้อมูลของตัวเอง แล้วสังเกตว่าแก้รายการเดียวมีกี่แถวที่ถูกสร้างใหม่',
          'สลับลำดับ provider ใน MultiProvider แล้วอธิบายว่าทำไมลำดับสำคัญเมื่อมีการพึ่งพา ([[11.7]])',
        ] },
      ],
      quiz: [
        { q: '`Provider.of<ItemProvider>(context, listen: false)` เทียบเท่ากับข้อใด?', options: [
          { t: '`context.read<ItemProvider>()`', ok: true },
          { t: '`context.watch<ItemProvider>()`', why: 'watch = listen: true' },
          { t: '`Consumer<ItemProvider>`', why: 'Consumer เป็นวิดเจ็ตที่ฟัง' },
        ] },
        { q: 'getter `List<Item> get items => [..._items];` ป้องกันอะไร?', options: [
          { t: 'คนนอกแก้ลิสต์ตัวจริงโดยไม่ผ่านเมธอดที่เรียก notifyListeners (แก้ได้แค่สำเนา)', ok: true },
          { t: 'ทำให้ select ไม่ทำงาน', why: 'select ยังทำงาน (เทียบสมาชิก)' },
          { t: 'ทำให้เร็วขึ้น', why: 'สร้างสำเนาทุกครั้งมีต้นทุนเล็กน้อย' },
        ] },
      ],
    },
  ],
  rules: [
    '`watch` = ทั้ง build ตื่น · `Consumer` = เฉพาะกิ่งที่ห่อ · `select`/`Selector` = เฉพาะเมื่อค่าที่เลือกเปลี่ยน · `read` = ไม่ฟัง',
    'Consumer builder: `(context, provider, child)` — ส่วนแพงที่ไม่เปลี่ยนส่งทาง `child`',
    'ใช้ `read` กับค่าที่ **นิ่งจริง** เท่านั้น ไม่แน่ใจ → ฟังไว้ก่อน',
    'อย่าห่อ Consumer ทุกวิดเจ็ต — มีต้นทุนของตัวเอง',
    'selector คืนค่าที่เทียบได้ (int/String/bool ปลอดภัยสุด), เบา, ไม่มี side effect, เรียกใน build เท่านั้น',
    'เริ่มจาก watch/Consumer ให้ถูก → วัด (profile mode, 16 ms/เฟรม) → ไต่ลงเฉพาะจุด',
    'แยกหน้าที่: หน้าแก้ไข `read` + pop · provider แก้ข้อมูล + `notifyListeners()` · หน้ารายการ Consumer',
    'MultiProvider อ่านง่ายแต่ไม่เร็วขึ้น · ตัวที่พึ่งพาต้องอยู่หลัง · lazy โดยค่าเริ่มต้น (`lazy: false` ถ้าต้องเริ่มทันที)',
    'หั่น provider ตามความรับผิดชอบ ไม่ใช่ตามหน้าจอ',
    'ChangeNotifierProxyProvider: `update` ต้องคืน `previousX` เดิม (`(prev ?? X())..setUser(...)`)',
    'อ่าน route arguments ใน `didChangeDependencies` + ยาม `_isInit`',
    'getter ของลิสต์: อย่าคืนตัวจริง — คืนสำเนาหรือ `List.unmodifiable`',
  ],
  handsOff: { heading: 'คำถามชวนคิดท้ายบท (11.10)', body: [
    { t: 'callout', kind: 'exam', title: 'คำถามจากตำรา', body: '“…ข้อมูลทั้งหมดอยู่บนหน่วยความจำชั่วคราว … แต่ในแอปพลิเคชันจริง รายการสินค้าต้องถูกดึงมาจากเซิร์ฟเวอร์ … อาจใช้เวลาครึ่งวินาที สามวินาที หรืออาจล้มเหลวกลางทาง … **ระหว่างที่ข้อมูลยังเดินทางมาไม่ถึง provider ควรบอกหน้าจอว่าอย่างไร** ถ้าตอบว่า “ลิสต์ว่าง” ผู้ใช้จะเห็นหน้าจอเปล่าและเข้าใจผิดว่าไม่มีสินค้าเลย และ **ถ้าการเชื่อมต่อล้มเหลว ใครควรเป็นผู้จำข้อผิดพลาดนั้นไว้เพื่อแสดงปุ่มลองใหม่** … ItemProvider ของเราจะต้องเก็บอะไรเพิ่มอีกบ้างนอกจากตัวข้อมูล และการเพิ่มสิ่งเหล่านั้นจะเปลี่ยนหน้าตาของ Consumer ในหน้าจอหลักไปอย่างไร”' },
    'คำตอบเต็มอยู่ใน [[12.8]]: provider เก็บ `isLoading` และ `errorMessage` เพิ่ม (ไม่ใช้ “ลิสต์ว่าง” แทนการโหลด) และ Consumer มีหลายสาขาตามสถานะ → [[ch12|บทที่ 12: Async & Networking]]',
  ] },
  quiz: [
    { q: 'วิดเจ็ตการ์ดสินค้ามีรูปใหญ่ ชื่อ ราคา และตัวเลข “จำนวนในตะกร้า” ที่เปลี่ยนบ่อย วิธีใดเหมาะที่สุดตามบันได?', options: [
      { t: 'ห่อเฉพาะตัวเลขด้วย Consumer<CartProvider> (หรือ select จำนวน)', ok: true },
      { t: '`context.watch<CartProvider>()` ที่บนสุดของการ์ด', why: 'รูปใหญ่จะถูกสร้างใหม่ทุกครั้ง' },
      { t: '`context.read<CartProvider>()` ใน build', why: 'ตัวเลขจะค้าง' },
    ] },
    { type: 'multi', q: 'ข้อใดเป็นจริงเกี่ยวกับ MultiProvider (เลือกทุกข้อที่ถูก)', options: [
      { t: 'ทำให้โค้ดอ่าน/ดูแลง่ายขึ้น', ok: true },
      { t: 'ลำดับในรายการมีผล', ok: true },
      { t: 'provider ยังเป็น lazy โดยค่าเริ่มต้น', ok: true },
      { t: 'ทำให้แอปเร็วขึ้น', why: 'ไม่เปลี่ยนประสิทธิภาพ' },
    ] },
    { q: 'หน้ารายการไม่อัปเดตหลังแก้ไขจากหน้าแก้ไข ทั้งที่ provider เรียก notifyListeners() แล้ว สาเหตุที่น่าจะเป็นที่สุดคือ?', options: [
      { t: 'หน้ารายการอ่านข้อมูลด้วย `context.read` แทนที่จะฟัง (watch/Consumer)', ok: true },
      { t: 'หน้าแก้ไขใช้ `context.read`', why: 'หน้าแก้ไขควรใช้ read อยู่แล้ว' },
      { t: 'ลืม MultiProvider', why: 'provider ตัวเดียวก็ทำงาน' },
    ] },
  ],
};
