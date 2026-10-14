/* บทที่ 12 — การเขียนโปรแกรมแบบอะซิงโครนัสและเครือข่าย */
FR.content.ch12 = {
  id: 'ch12', kind: 'chapter', num: '12', navTitle: 'Async & Network', crumb: 'บทที่ 12',
  title: 'การเขียนโปรแกรมแบบอะซิงโครนัสและเครือข่าย',
  problem: 'แอปที่ผ่านมาเป็น “ห้องปิดตาย” ใช้ข้อมูลที่ฝังในโค้ด — ต้องเจาะหน้าต่างไปคุยกับอินเทอร์เน็ต ซึ่ง **ใช้เวลาไม่แน่นอน** และ **ล้มเหลวได้เสมอ** โดยที่หน้าจอต้องไม่ค้างและผู้ใช้ต้องรู้ว่าเกิดอะไรขึ้น',
  tools: ['UI isolate + งบเฟรม 16 ms', 'initState / mounted / context ข้าม await', 'FutureBuilder + AsyncSnapshot', 'http + jsonDecode + fromJson', 'timeout + ApiException + retry', 'compute', 'ChangeNotifier ที่มี isLoading / errorMessage'],
  receives: { title: 'ต่อจากบทที่ 11 (คำถาม 11.10)', body: '“ระหว่างที่ข้อมูลยังเดินทางมาไม่ถึง provider ควรบอกหน้าจอว่าอย่างไร … และถ้าการเชื่อมต่อล้มเหลว ใครควรเป็นผู้จำข้อผิดพลาดนั้นไว้” — บทนี้ตอบด้วย **FutureBuilder** (ระดับหน้าจอเดียว) แล้วยกคำตอบเดียวกันขึ้นไปไว้ใน **ChangeNotifier** ([[12.8]])' },
  overview: [
    { t: 'h', text: 'ภาพใหญ่: พนักงานเสิร์ฟคนเดียวที่ต้องวาดจอทุก 16 ms' },
    'โค้ด Dart ของแอปเกือบทั้งหมด **และ** การวาดหน้าจอ ทำงานบน **UI isolate ตัวเดียว** — ถ้าเราให้มันยืนรออะไร (เครือข่าย, งานหนัก) จอค้างทันที ทุกเรื่องในบทนี้จึงคือ: **ส่งงานรอไปทำที่อื่น** แล้วออกแบบหน้าจอให้รองรับ **3 สถานะ** (กำลังโหลด · สำเร็จ · ผิดพลาด) อย่างดี',
    { t: 'viz', id: 'ch12.waiter', title: 'UI isolate = พนักงานเสิร์ฟคนเดียว', try: 'กด “รอแบบ synchronous” (แถบแดง วงล้อค้าง) แล้วกด “await http.get” (เฟรมเขียวต่อเนื่อง งานไปทำที่เลนล่าง) · ลองเปลี่ยนเป็น 120 Hz' },
    { t: 'compare', cols: ['เรื่อง', 'คำตอบ', 'หัวข้อ'], rows: [
      ['ทำไมต้อง async', 'UI isolate ตัวเดียว งบ 16/11/8 ms ต่อเฟรม', '[[12.2]]'],
      ['async ในวิดเจ็ตพลาดตรงไหน', 'เริ่มใน initState, mounted, context ข้าม await', '[[12.2]]'],
      ['แสดงผล Future บนจอ', 'FutureBuilder + AsyncSnapshot (4 ConnectionState)', '[[12.3]] [[12.4]]'],
      ['ดึงข้อมูลจริง', 'http + model + fromJson + INTERNET permission', '[[12.5]]'],
      ['เมื่อล้มเหลว', 'timeout, 4xx/5xx, FormatException → ApiException, retry = Future ใหม่', '[[12.6]]'],
      ['JSON ใหญ่ทำจอกระตุก', 'compute (วัดก่อน)', '[[12.7]]'],
      ['ข้อมูลใช้หลายหน้า', 'ChangeNotifier เก็บ todos + isLoading + errorMessage', '[[12.8]]'],
    ] },
    { t: 'callout', kind: 'supp', title: 'ตำราอ้าง “บทที่ 2.2” ที่ไม่อยู่ในชุดเอกสารนี้', body: 'บทนี้ไม่สอน Event Loop, Future, async/await, try-catch ซ้ำ (อ้างบทที่ 2.2) — ถ้ายังไม่แน่น ดูภาพ event loop ที่ [[core/c5]] และไวยากรณ์ `try/on/catch/rethrow/finally` ที่ [[dart]]' },
  ],
  sections: [
    {
      id: '12.1', title: 'บทนำ: โลกที่ไม่เคยรอ', source: '§12.1',
      gist: 'แอปจนจบบทที่ 11 เหมือน **ห้องทำงานที่ไม่มีหน้าต่างและประตู** — งานของบทนี้คือเจาะหน้าต่างให้คุยกับอินเทอร์เน็ต ซึ่งเป็นงานที่ **ใช้เวลาไม่แน่นอน** ถ้ารอเฉยๆ จอค้าง',
      blocks: [
        { t: 'callout', kind: 'analogy', title: 'ห้องปิดตาย (จากตำรา)', body: 'ห้องทำงานจัดไว้ดีทุกอย่าง แต่ไม่มีหน้าต่างไม่มีประตู ข้อมูลในห้องคือสิ่งที่ใส่ไว้ล่วงหน้าเท่านั้น — เปิดแอปกี่ครั้งก็เห็นสิ่งเดิม' },
        { t: 'list', items: [
          'อะซิงโครนัสในบริบท Flutter: UI isolate + งบเวลาต่อเฟรม',
          'ข้อควรระวังเมื่อใช้ async กับวิดเจ็ต: จุดเริ่มงาน, `mounted`, `BuildContext` ข้าม await',
          '`FutureBuilder` สร้าง UI ตามผลของ Future',
          'ดึงข้อมูลจริงด้วยแพ็กเกจ `http` + แปลง JSON เป็นอ็อบเจกต์ Dart',
          'เชื่อมข้อมูลเครือข่ายเข้ากับ Provider (รูปแบบเดียวกับที่ใช้กับฐานข้อมูลในบทที่ 13)',
          'รับมือความล้มเหลว: ต่อไม่ติด / ช้าเกินรอ / ตอบผิดรูปแบบ + timeout + ปุ่มลองใหม่',
          'แปลง JSON ก้อนใหญ่ด้วย `compute`',
        ] },
      ],
      quiz: [
        { q: 'ลักษณะร่วมของงานอย่างดึงข้อมูลจากเซิร์ฟเวอร์ที่ทำให้ต้องเป็น async คืออะไร?', options: [
          { t: 'ใช้เวลาและคาดเดาไม่ได้ว่านานเท่าใด — ถ้ารอเฉยๆ จอค้าง', ok: true },
          { t: 'ข้อมูลมีขนาดเล็กเสมอ', why: 'ขนาดไม่ใช่ประเด็นหลัก' },
          { t: 'ต้องใช้ Provider เสมอ', why: 'FutureBuilder ก็ได้' },
        ] },
      ],
    },
    {
      id: '12.2', title: 'จากภาษา Dart สู่ Flutter: async ในวิดเจ็ต', source: '§12.2', exam: true,
      gist: 'UI isolate ตัวเดียวทั้งรันโค้ดและวาดจอ · งบ **16 ms** (60 Hz) / 11 ms (90 Hz) / 8 ms (120 Hz) · API ใช้ร้อย ms ถึงหลายวินาที → **ต้อง async เสมอ** · 3 ข้อผิดพลาดในวิดเจ็ต: **อย่าเริ่มงานใน build** · **เช็ก mounted หลัง await** · **ระวัง BuildContext ข้าม await**',
      blocks: [
        { t: 'kv', items: [
          ['Future (2.2.2)', '“ค่าเดียวที่จะได้ในอนาคต” — ยังไม่เสร็จ / เสร็จพร้อมค่า / เสร็จพร้อมข้อผิดพลาด'],
          ['async / await (2.2.3)', 'ให้โค้ด async อ่านเรียงบรรทัด — **await หยุดเฉพาะในฟังก์ชันนั้น** ไม่ได้หยุดทั้งโปรแกรม'],
          ['try-catch (2.2.4)', 'ดักข้อผิดพลาดของงาน async (ใช้หนักมากในบทนี้)'],
          ['Stream (2.2.5–6)', 'หลายค่าทยอยมา — บทนี้เน้น Future เพราะ request-response ให้ผลชุดเดียว'],
        ] },
        { t: 'viz', id: 'ch12.eventloop', title: 'await หยุดเฉพาะฟังก์ชันนั้น (เสริม: event loop)', try: 'ไล่ทีละขั้น สังเกตว่าตอน await call stack ว่าง แล้วเฟรมยังถูกวาดได้' },
        { t: 'callout', kind: 'analogy', title: 'ร้านอาหารที่มีพนักงานเสิร์ฟคนเดียว (จากตำรา)', body: 'ขยายภาพจากบทที่ 11: ร้านนี้มีพนักงานเสิร์ฟคนเดียว คือ **UI isolate** — ถ้ารับออเดอร์แล้วไปยืนรอหน้าเตาจนอาหารเสร็จ (synchronous) ลูกค้าทุกโต๊ะไม่มีใครดูแล ร้านหยุดชะงักทั้งร้าน · วิธีที่ถูกคือส่งออเดอร์เข้าครัวแล้วไปรับโต๊ะอื่นต่อ เมื่ออาหารเสร็จพ่อครัวกดกริ่ง (asynchronous) — และพนักงานคนนี้ **ต้องวาดหน้าจอทุกเฟรมด้วย** · (กะพริบตาหนึ่งครั้ง ≈ 100–400 ms ยังช้ากว่างบเฟรมหลายเท่า)' },
        { t: 'h', text: 'ข้อผิดพลาด 1: เริ่มงาน async ใน build' },
        { t: 'viz', id: 'ch12.buildfetch', name: 'bf', title: 'build ถูกเรียกหลายสิบครั้งต่อวินาที', try: 'ในโหมด “ใน build” กดแอนิเมชัน/คีย์บอร์ด/เลื่อนลิสต์ ดูจำนวนคำขอ แล้วสลับโหมด' },
        { t: 'code', title: 'โครงสร้างที่ถูกต้อง (ตำรา §12.2)', src: `class _NewsScreenState extends State<NewsScreen> {
  // ถูกต้อง: เก็บ Future ไว้ในตัวแปรของ State
  late Future<String> _headline;

  @override
  void initState() {
    super.initState();
    _headline = fetchHeadline(); // เริ่มงานครั้งเดียวตอนสร้างหน้าจอ
  }

  // การสั่งโหลดใหม่: สร้าง Future ตัวใหม่ แล้วให้ FutureBuilder เริ่มรอใหม่
  // กรณีนี้ไม่มี await คั่น จึงไม่ต้องตรวจสอบ mounted
  void _reload() {
    setState(() {
      _headline = fetchHeadline();
    });
  }

  @override
  Widget build(BuildContext context) {
    // ห้ามเรียก fetchHeadline() ตรงนี้ เพราะ build ถูกเรียกซ้ำได้หลายครั้ง
    // และจะได้ Future ตัวใหม่ทุกครั้ง ทำให้วงล้อหมุนไม่รู้จบ
    return FutureBuilder<String>(
      future: _headline,
      builder: (context, snapshot) {
        return Text(snapshot.data ?? 'กำลังโหลด...');
      },
    );
  }
}`, notes: [
          { at: 'late Future<String> _headline;', note: 'เก็บ **Future** (ไม่ใช่ผลลัพธ์) — FutureBuilder จะคอยฟัง Future ตัวนี้' },
          { at: "return Text(snapshot.data ?? 'กำลังโหลด...');", note: 'โครงย่อ — การตรวจ snapshot เต็มรูปแบบอยู่ใน [[12.3]]' },
        ] },
        { t: 'why', choice: 'เริ่มงาน async **ใน initState** แล้วเก็บ Future ไว้ในตัวแปรของ State',
          because: ['initState ทำงานครั้งเดียว → ยิงคำขอครั้งเดียว', 'build ถูกเรียกใหม่ทุกครั้งที่แอนิเมชันขยับ คีย์บอร์ดเด้ง หรือแม่เปลี่ยนสถานะ — หลายสิบครั้งต่อวินาที'],
          alts: [
            { alt: 'ทำไมไม่เรียก `fetchHeadline()` ใน build ให้จบในที่เดียว?', result: 'ยิงคำขอรัวๆ ทุกครั้งที่ผู้ใช้เลื่อนจอ → แอปช้า เปลืองเน็ต และกรณีร้ายแรง “เซิร์ฟเวอร์ล่มเพราะถูกโจมตีจากแอปของเราเอง” · และ FutureBuilder ได้ Future ใหม่ทุก build → วงล้อหมุนไม่รู้จบ', viz: { name: 'bf', mode: 'build' } },
          ] },
        { t: 'h', text: 'ข้อผิดพลาด 2–3: mounted และ context ข้าม await' },
        { t: 'viz', id: 'ch12.mounted', title: 'เพื่อนวางสายไปแล้ว', try: 'โหมด “ไม่ป้องกัน”: เปิดหน้าแก้ไข → บันทึก → กด ← ภายใน 3 วิ · แล้วลองอีกสองโหมด' },
        { t: 'callout', kind: 'analogy', title: 'คุยโทรศัพท์ที่ถือสายรอ (จากตำรา)', body: 'บอกเพื่อนว่า “ถือสายรอสักครู่” แล้ววิ่งไปทำธุระ กลับมาก็พูดใส่โทรศัพท์รวดเดียวโดยไม่ตรวจว่าเพื่อนวางสายไปตั้งแต่ห้านาทีก่อน — โค้ดหลัง await กลับมาทำงานเสมอเมื่อข้อมูลมาถึง แต่ผู้ใช้อาจกดย้อนกลับไปแล้ว การ `setState` ตอนนั้นคือการอัปเดตหน้าจอที่ไม่มีอยู่จริง' },
        { t: 'code', title: 'สองทางเลือกที่ปลอดภัย (ตำรา §12.2)', src: `// ทางเลือกที่ 1: ดึงอ็อบเจกต์ที่ต้องใช้เก็บไว้ในตัวแปรก่อนเริ่มรอ
Future<void> _saveAndClose() async {
  final messenger = ScaffoldMessenger.of(context); // ดึงก่อน await
  final navigator = Navigator.of(context);

  await saveToServer();

  // ไม่ต้องแตะ context อีกแล้ว จึงปลอดภัยแม้หน้าจอจะถูกปิดไปก่อน
  messenger.showSnackBar(const SnackBar(content: Text('บันทึกแล้ว')));
  navigator.pop();
}

// ทางเลือกที่ 2: ตรวจสอบ mounted ก่อน แล้วจึงใช้ context หลัง await
Future<void> _saveAndNotify() async {
  await saveToServer();

  if (!mounted) return; // หน้าจอถูกปิดไปแล้ว ไม่ต้องทำอะไรต่อ
  ScaffoldMessenger.of(context).showSnackBar(
    const SnackBar(content: Text('บันทึกแล้ว')),
  );
}`, notes: [
          { at: 'final messenger = ScaffoldMessenger.of(context); // ดึงก่อน await', note: 'เหมาะเมื่อรู้ล่วงหน้าว่าจะใช้อะไรบ้าง (ex_13 ใช้แบบนี้)' },
          { at: 'if (!mounted) return; // หน้าจอถูกปิด', note: 'เหมาะเมื่อโค้ดหลัง await มีเงื่อนไขซับซ้อน · `mounted` มีเฉพาะใน **คลาส State** — ไม่มีใน StatelessWidget (ใช้ `context.mounted`) และ **ไม่มีใน ChangeNotifier**' },
        ] },
      ],
      quiz: [
        { q: 'ที่ 120 Hz แต่ละเฟรมมีงบเวลาประมาณเท่าไร?', options: [
          { t: '8 ms', ok: true },
          { t: '16 ms', why: 'นั่นคือ 60 Hz' },
          { t: '120 ms', why: '1000/120 ≈ 8' },
        ] },
        { q: '`await` ทำให้อะไรหยุดรอ?', options: [
          { t: 'เฉพาะฟังก์ชันที่มี await — โปรแกรมและการวาดจอยังทำงานต่อ', ok: true },
          { t: 'ทั้งโปรแกรมรวมถึงการวาดจอ', why: 'นั่นคือการรอแบบ synchronous' },
          { t: 'เฉพาะ widget tree', why: 'await ไม่เกี่ยวกับ tree' },
        ] },
        { type: 'spot', q: 'บรรทัดไหนทำให้แอปยิงคำขอซ้ำรัวๆ?', code: `class _NewsState extends State<News> {
  @override
  Widget build(BuildContext context) {
    return FutureBuilder<String>(
      future: fetchHeadline(),
      builder: (context, snapshot) => Text(snapshot.data ?? '...'),
    );
  }
}`, bad: 'future: fetchHeadline(),', explain: 'สร้าง Future ใหม่ทุกครั้งที่ build — ต้องเรียกใน initState แล้วเก็บไว้ในตัวแปร' },
        { q: 'ChangeNotifier ที่ทำงาน async ใช้ `mounted` ได้หรือไม่?', options: [
          { t: 'ไม่ได้ — mounted มีเฉพาะในคลาส State', ok: true },
          { t: 'ได้ เหมือน State', why: 'ตำราระบุว่า ChangeNotifier ไม่มี mounted' },
          { t: 'ได้ผ่าน context.mounted', why: 'ChangeNotifier ไม่มี context' },
        ] },
      ],
    },
    {
      id: '12.3', title: 'การแสดงผลข้อมูลจาก Future ใน UI ด้วย FutureBuilder', source: '§12.3', exam: true,
      gist: 'FutureBuilder ทำงานที่เราต้องเขียนเอง (initState, เก็บ Future, mounted, flag โหลด/ผิดพลาด) ให้หมด เหลือแค่เขียน **builder** ตาม **snapshot** · ConnectionState มี 4 ค่า · **done ไม่ได้แปลว่าสำเร็จ** · โหลดซ้ำแล้ว `waiting` + `hasData` เกิดพร้อมกัน → ตรวจ **error ก่อน → ไม่มีข้อมูลค่อยหมุน → แสดงข้อมูล**',
      blocks: [
        'ตำราเทียบกับบทที่ 11: **Consumer** วาดใหม่เมื่อ ChangeNotifier แจ้ง · **FutureBuilder** วาดใหม่เมื่อสถานะของ Future เปลี่ยน — ต่างกันที่ Future ให้ผล **ครั้งเดียวแล้วจบ** ส่วน ChangeNotifier แจ้งได้ไม่จำกัด',
        { t: 'kv', items: [
          ['future', 'Future ที่ต้องการ “ฟัง”'],
          ['builder', '`(BuildContext context, AsyncSnapshot snapshot)` → วิดเจ็ต ถูกเรียกหลายครั้งเมื่อสถานะเปลี่ยน'],
          ['snapshot.connectionState', 'none / waiting / active / done'],
          ['snapshot.hasData / data', 'มีข้อมูลหรือไม่ / ตัวข้อมูล'],
          ['snapshot.hasError / error', 'มีข้อผิดพลาดหรือไม่ / ตัวข้อผิดพลาด'],
          ['initialData', 'ค่าเริ่มต้นให้ snapshot — แสดงข้อมูลที่มีอยู่แล้ว (เช่นในเครื่อง) ตั้งแต่เฟรมแรก'],
        ] },
        { t: 'compare', cols: ['ConnectionState', 'ความหมาย'], rows: [
          ['`none`', 'ยังไม่มี Future ให้ฟัง (`future` เป็น null)'],
          ['`waiting`', 'มี Future แล้ว กำลังรอผล'],
          ['`active`', 'ใช้กับ Stream (StreamBuilder) — แทบไม่พบกับ Future'],
          ['`done`', 'Future จบแล้ว — **ยังไม่บอกว่าสำเร็จหรือล้มเหลว** ต้องดู hasError/hasData ต่อ'],
        ] },
        { t: 'viz', id: 'ch12.snapshot', title: 'AsyncSnapshot inspector + สองลำดับการตรวจ', try: '① เริ่ม → ② สำเร็จ → ③ โหลดใหม่ — จอซ้าย (waiting ก่อน) กระพริบเป็นวงล้อ จอขวาคงรายการไว้ · ลองล้มเหลวแล้วโหลดใหม่ · ลองเปิด initialData ก่อนกดเริ่ม' },
        { t: 'code', title: 'รูปแบบทั่วไป (ตรวจ waiting ก่อน — ใช้ได้ดีเมื่อโหลดครั้งเดียว)', src: `FutureBuilder<String>( // ระบุชนิดข้อมูลของ Future
  future: myFutureString, // Future ที่เรากำลังรอ
  builder: (context, snapshot) {
    // 1. ตรวจสอบสถานะการเชื่อมต่อ
    if (snapshot.connectionState == ConnectionState.waiting) {
      return const CircularProgressIndicator();
    }
    // 2. เมื่อ Future ทำงานเสร็จแล้ว ให้ตรวจสอบข้อผิดพลาด
    else if (snapshot.hasError) {
      return Text('เกิดข้อผิดพลาด: \${snapshot.error}');
    }
    // 3. หากไม่มีข้อผิดพลาดและมีข้อมูล
    else if (snapshot.hasData) {
      return Text('ข้อมูลที่ได้รับ: \${snapshot.data}');
    }
    // 4. สถานะอื่นๆ (เช่น ยังไม่เริ่ม)
    else {
      return const Text('ยังไม่มีข้อมูล');
    }
  },
)`, notes: [
          { at: 'if (snapshot.connectionState == ConnectionState.waiting) {', note: '**ปัญหาเมื่อโหลดซ้ำ**: ตอนเปลี่ยน future เป็นตัวใหม่ snapshot ยังเก็บข้อมูลรอบก่อนไว้ → `waiting` + `hasData == true` พร้อมกัน → ถ้าตรวจ waiting ก่อน รายการหายทั้งหน้าแล้วกลับมา = **กระพริบ**' },
          { at: "return Text('เกิดข้อผิดพลาด: \${snapshot.error}');", note: 'แสดง error ดิบ — [[12.6]] จะเปลี่ยนเป็นข้อความภาษาคนผ่าน ApiException' },
        ] },
        { t: 'why', choice: 'ใช้ **FutureBuilder** แทนการจัดการสถานะโหลด/ผิดพลาดด้วย setState เอง',
          because: ['งานที่ต้องทำมือทั้งหมด (initState, เก็บ Future, mounted, bool กำลังโหลด, ตัวแปร error) อยู่ “ใต้ฝากระโปรง” ของ FutureBuilder แล้ว'],
          alts: [
            { alt: 'ทำไมไม่เขียน `_isLoading`, `_error` + setState เอง?', result: 'ตำรา: “จะทำให้โค้ดซับซ้อนและเกิดข้อผิดพลาดได้ง่าย” (ลืม mounted, ลืมรีเซ็ต error ฯลฯ)', ok: 'เมื่อข้อมูลต้องใช้หลายหน้า → ย้ายไป ChangeNotifier ([[12.8]])' },
          ] },
        { t: 'why', choice: 'ลำดับการตรวจ: **hasError → !hasData (หมุน) → ข้อมูล**',
          because: ['คืนวงล้อเฉพาะตอน “ยังไม่มีข้อมูลเลย” — ตอนรีเฟรชรายการเดิมยังอยู่ ไม่กระพริบ'],
          alts: [
            { alt: 'ทำไมไม่ตรวจ `waiting` ก่อนเหมือนตัวอย่างทั่วไป?', result: 'ใช้ได้ถ้าโหลดครั้งเดียว แต่พอมีการโหลดซ้ำ จอจะกระพริบเป็นวงล้อทุกครั้ง', ok: 'หน้าที่ไม่มีการรีเฟรช' },
          ] },
        { t: 'callout', kind: 'real', title: '`ConnectionState.none` ตอนสลับ Future', body: 'ตำราเขียนว่า builder อาจถูกเรียกด้วย `none` “ในจังหวะที่เราสลับไปใช้ Future ตัวใหม่” — ในซอร์สของ FutureBuilder สถานะ none ถูกตั้งแล้วเปลี่ยนเป็น waiting **ก่อน** builder จะถูกเรียก จึงไม่เห็น none ในจังหวะนั้น · ที่เห็น none จริงคือเมื่อ `future` เป็น `null` · อย่างไรก็ตาม คำแนะนำของตำราให้ “มีทางออกเสมอ” ยังถูกต้อง' },
      ],
      quiz: [
        { q: '`snapshot.connectionState == ConnectionState.done` บอกอะไรได้?', options: [
          { t: 'Future จบแล้ว แต่ยังต้องดู hasError/hasData ว่าสำเร็จหรือไม่', ok: true },
          { t: 'Future สำเร็จพร้อมข้อมูลแน่นอน', why: 'จบด้วยข้อผิดพลาดก็เป็น done' },
          { t: 'Future ยังไม่เริ่ม', why: 'นั่นคือ none' },
        ] },
        { q: 'กดรีเฟรช (เปลี่ยนเป็น Future ใหม่) ขณะมีรายการแสดงอยู่ snapshot จะเป็นอย่างไรในจังหวะนั้น?', options: [
          { t: '`waiting` และ `hasData` ยังเป็น true (ข้อมูลรอบก่อน)', ok: true },
          { t: '`none` และไม่มีข้อมูล', why: 'snapshot เก็บข้อมูลเดิมไว้' },
          { t: '`done` ทันที', why: 'Future ใหม่ยังไม่จบ' },
        ] },
        { type: 'order', q: 'เรียงลำดับการตรวจ snapshot ที่ไม่ทำให้รายการกระพริบตอนรีเฟรช (ตำรา 12.6)', items: ['`if (snapshot.hasError)` → ข้อความ + ปุ่มลองใหม่', '`if (!snapshot.hasData)` → วงล้อหมุน', 'แสดงรายการจาก `snapshot.data!`'] },
      ],
    },
    {
      id: '12.4', title: 'ปฏิบัติการย่อย: สร้าง UI ที่ตอบสนองต่อ Future', source: '§12.4',
      gist: 'ใช้ `Future.delayed` จำลองงาน 3 วินาที (สำเร็จหรือ throw ก็ได้) เพื่อ **ทดสอบ UI ครบ 3 สถานะก่อน** ต่อเครือข่ายจริง — แยกปัญหาทีละส่วน',
      blocks: [
        { t: 'viz', id: 'ch12.delay', title: 'FutureDemoScreen จำลอง', try: 'ปรับเวลา เปิด/ปิด throw แล้วกด Hot Restart' },
        { t: 'code', title: 'FutureDemoScreen (ตำรา §12.4)', src: `class _FutureDemoScreenState extends State<FutureDemoScreen> {
  // ประกาศ Future เพื่อเก็บผลลัพธ์
  late Future<String> _calculation;

  Future<String> simulateSlowOperation() {
    return Future.delayed(
      const Duration(seconds: 3),
      () {
        // ลองยกเลิกคอมเมนต์สามบรรทัดนี้เพื่อทดสอบกรณีเกิดข้อผิดพลาด
        // if (true) {
        //   throw Exception('เกิดข้อผิดพลาดโดยตั้งใจ');
        // }
        return 'ข้อมูลจากการทำงานที่ใช้เวลานาน';
      },
    );
  }

  @override
  void initState() {
    super.initState();
    // เรียกฟังก์ชันและเก็บ Future ไว้ในตัวแปรใน initState
    _calculation = simulateSlowOperation();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('FutureBuilder Demo')),
      body: Center(
        child: FutureBuilder<String>(
          future: _calculation, // ส่ง Future ของเราเข้าไป
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 10),
                  Text('กำลังโหลดข้อมูล...'),
                ],
              );
            } else if (snapshot.hasError) {
              return Text('เกิดข้อผิดพลาด: \${snapshot.error}',
                  style: const TextStyle(color: Colors.red));
            } else if (snapshot.hasData) {
              return Text(
                'สำเร็จ! ได้รับข้อมูล: \${snapshot.data}',
                style: const TextStyle(fontSize: 18, color: Colors.green),
              );
            } else {
              return const Text('ไม่มีข้อมูล');
            }
          },
        ),
      ),
    );
  }
}`, notes: [
          { at: '// ประกาศ Future เพื่อเก็บผลลัพธ์', note: 'ตำราเน้นตำแหน่งวาง build: “แทรกไว้ **ภายใน** คลาส ก่อนวงเล็บปีกกาปิดคลาส ไม่ใช่วางต่อท้าย” และอย่าลืมตั้ง `home: const FutureDemoScreen()`' },
        ] },
        { t: 'why', choice: 'จำลองด้วย `Future.delayed` ก่อนต่อเครือข่ายจริง',
          because: ['ควบคุมได้ทั้ง **สำเร็จ/ล้มเหลว** และ **เวลารอ** → ออกแบบและทดสอบ UI ทั้ง 3 สถานะครบ', 'พอสลับไปข้อมูลจริง เหลือตัวแปรที่อาจผิดเพียงด้านเดียว'],
          alts: [
            { alt: 'ทำไมไม่ต่ออินเทอร์เน็ตจริงไปเลย ประหยัดเวลา?', result: 'ถ้าเขียน UI ใหม่พร้อมต่อเครือข่ายจริงแล้วจอว่าง จะ **แยกไม่ออก** ว่าผิดที่เครือข่าย ที่ข้อมูลที่ได้ หรือที่โค้ด UI' },
          ] },
      ],
      quiz: [
        { q: 'ข้อดีหลักของการจำลองด้วย Future.delayed ตามตำราคืออะไร?', options: [
          { t: 'แยกปัญหา: ทดสอบ UI ทุกสถานะด้วยผลที่ควบคุมได้ ก่อนเพิ่มตัวแปรจากเครือข่าย', ok: true },
          { t: 'ทำให้แอปเร็วขึ้น', why: 'ไม่เกี่ยว' },
          { t: 'ไม่ต้องใช้ FutureBuilder', why: 'ยังใช้ FutureBuilder' },
        ] },
      ],
    },
    {
      id: '12.5', title: 'การสื่อสารกับโลกภายนอก: การดึงข้อมูลจากอินเทอร์เน็ต', source: '§12.5', exam: true,
      gist: 'เพิ่ม `http` → **INTERNET permission ใน manifest ของ main** (ไม่งั้น release build ต่อไม่ได้) → Model + `factory fromJson` (ล่ามแปลภาษา) → `fetchTodos()` ใน `services/` (`http.get` → เช็ก 200 → `jsonDecode` → `map(Todo.fromJson)`) → `FutureBuilder` ใน `TodoListScreen`',
      blocks: [
        { t: 'code', lang: 'yaml', title: 'pubspec.yaml', src: `dependencies:
  flutter:
    sdk: flutter
  http: ^1.6.0 # ตรวจสอบเวอร์ชันล่าสุดบน pub.dev` },
        { t: 'callout', kind: 'exam', title: 'สิ่งที่ต้องทำก่อนสร้างฉบับ release (ตำราเน้น)', body: [
          'โครงร่างโปรเจกต์ประกาศสิทธิ์ `INTERNET` ไว้ **เฉพาะ manifest ของ debug และ profile** → ระหว่างพัฒนาไม่เจอปัญหา แต่ `flutter build apk` ฉบับ release **ต่อเน็ตไม่ได้เลย** ทั้งที่โค้ด Dart ไม่ผิด (หาสาเหตุยากมาก)',
          { t: 'code', lang: 'text', title: 'android/app/src/main/AndroidManifest.xml', src: `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET"/>
    <application android:label="api_demo" ...>` },
          'macOS: ตั้ง `com.apple.security.network.client` เป็น true ใน `macos/Runner/DebugProfile.entitlements` และ `Release.entitlements`',
        ] },
        { t: 'viz', id: 'ch12.json', title: 'JSON → jsonDecode → Map → fromJson → UI', try: 'ลองปุ่ม “ขาดฟิลด์”, “id เป็นข้อความ”, “ได้หน้า HTML” · แล้วสลับเป็น “ใช้ Map ดิบใน UI”' },
        { t: 'code', title: 'lib/models/todo.dart', src: `class Todo {
  final int userId;
  final int id;
  final String title;
  final bool completed;

  const Todo({
    required this.userId,
    required this.id,
    required this.title,
    required this.completed,
  });

  // Factory constructor สำหรับสร้าง Todo instance จาก Map (JSON object)
  factory Todo.fromJson(Map<String, dynamic> json) {
    return Todo(
      userId: json['userId'] as int,
      id: json['id'] as int,
      title: json['title'] as String,
      completed: json['completed'] as bool,
    );
  }
}`, notes: [
          { at: 'factory Todo.fromJson(Map<String, dynamic> json) {', note: '`factory` = constructor ที่มีตรรกะก่อนสร้างอ็อบเจกต์ · `Map<String, dynamic>` เพราะ JSON object มีคีย์เป็นข้อความ แต่ค่าเป็นชนิดอะไรก็ได้' },
          { at: "userId: json['userId'] as int,", note: '`as int` = ยืนยันชนิด — ถ้าค่าไม่ใช่ int (หรือไม่มีคีย์ → null) จะเกิด **TypeError** ตอนรัน' },
        ] },
        { t: 'code', title: 'lib/services/api_service.dart (รุ่นแรก)', src: `import 'dart:convert'; // สำหรับ jsonDecode
import 'package:http/http.dart' as http;
import '../models/todo.dart';

// ฟังก์ชันนี้จะคืนค่า Future ของ List<Todo>
Future<List<Todo>> fetchTodos() async {
  final response = await http.get(
    Uri.parse('https://jsonplaceholder.typicode.com/todos'),
    // ใส่ header เฉพาะที่ API ต้องการจริง ๆ ที่นี่คือบอกว่าเราขอคำตอบเป็น JSON
    headers: {'Accept': 'application/json'},
  );

  // ตรวจสอบว่า request สำเร็จหรือไม่ (status code 200)
  if (response.statusCode == 200) {
    // แปลง body (JSON string) ให้กลายเป็น List<dynamic>
    final List<dynamic> data = jsonDecode(response.body);
    // แปลงแต่ละ object เป็น Todo แล้วแปลงกลับเป็น List<Todo>
    return data.map((json) => Todo.fromJson(json)).toList();
  } else {
    // หัวข้อ 12.6 จะปรับปรุงจุดนี้
    throw Exception('Failed to load todos');
  }
}`, notes: [
          { at: "import 'package:http/http.dart' as http;", note: '`as http` = ตั้งชื่อเล่นให้ไลบรารี เรียกเป็น `http.get(...)` (กันชื่อชนกัน)' },
          { at: 'final List<dynamic> data = jsonDecode(response.body);', note: '`jsonDecode` คืน `dynamic` — JSON array กลายเป็น `List<dynamic>` ของ `Map<String, dynamic>`' },
        ] },
        { t: 'why', choice: 'แปลง JSON ผ่าน **Model class + `fromJson`** ไม่ใช้ Map ดิบใน UI',
          because: ['เซิร์ฟเวอร์อาจเขียนด้วย Python/Node/Go — **JSON คือภาษากลาง** ที่ไม่ผูกกับภาษาใด', 'สำหรับ Dart ก้อน JSON คือ “ภาษาต่างดาว” — fromJson เป็น **ล่าม** ที่ตรวจและแปลงเป็นอ็อบเจกต์ที่ไว้ใจได้', 'พิมพ์ชื่อฟิลด์ผิด → รู้ตั้งแต่ตอนเขียนโค้ด ไม่ใช่ตอนผู้ใช้เปิดหน้าจอ'],
          alts: [
            { alt: 'ทำไมไม่ใช้ `json[\'title\']` ตรงๆ ในวิดเจ็ต?', result: 'คีย์เป็นแค่ข้อความ — พิมพ์ผิดตัวเดียวแอปพังตอนรัน โดยที่ analyzer **ไม่เคยเตือน**' },
            { alt: 'ทำไมเซิร์ฟเวอร์ไม่ส่งอ็อบเจกต์ Dart มาเลย?', result: 'เซิร์ฟเวอร์ไม่ได้เขียนด้วย Dart — ต้องมีภาษากลางที่ทุกฝ่ายเข้าใจ' },
          ] },
        { t: 'code', title: 'TodoListScreen (รุ่นแรก)', src: `class _TodoListScreenState extends State<TodoListScreen> {
  late Future<List<Todo>> _futureTodos;

  @override
  void initState() {
    super.initState();
    _futureTodos = fetchTodos();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Todo List from API')),
      body: FutureBuilder<List<Todo>>(
        future: _futureTodos,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: \${snapshot.error}'));
          } else if (snapshot.hasData) {
            final todos = snapshot.data!;
            return ListView.builder(
              itemCount: todos.length,
              itemBuilder: (context, index) {
                final todo = todos[index];
                return ListTile(
                  leading: CircleAvatar(child: Text(todo.id.toString())),
                  title: Text(todo.title),
                  trailing: Icon(
                    todo.completed ? Icons.check_box : Icons.check_box_outline_blank,
                    color: todo.completed ? Colors.green : Colors.grey,
                  ),
                );
              },
            );
          } else {
            return const Center(child: Text('No todos found.'));
          }
        },
      ),
    );
  }
}` },
        { t: 'callout', kind: 'supp', title: 'HTTP status code ที่ต้องรู้', body: [{ t: 'kv', items: [['2xx', 'สำเร็จ (200 OK)'], ['4xx', 'คำขอของ **เรา** ผิด (404 ไม่พบ, 401 ไม่ได้รับอนุญาต) — ส่งซ้ำก็ได้ผลเดิม'], ['5xx', 'ฝั่ง **เซิร์ฟเวอร์** ขัดข้อง (500, 503) — ลองใหม่มีโอกาสสำเร็จ']] }] },
      ],
      quiz: [
        { q: 'แอปทำงานดีตอนรัน debug แต่ฉบับ release ต่อเน็ตไม่ได้เลย สาเหตุที่น่าจะเป็นที่สุดตามตำราคือ?', options: [
          { t: 'ไม่ได้ประกาศ INTERNET permission ใน `android/app/src/main/AndroidManifest.xml`', ok: true },
          { t: 'แพ็กเกจ http ใช้ไม่ได้ใน release', why: 'ใช้ได้' },
          { t: 'ต้องเปลี่ยน URL เป็น http แทน https', why: 'ไม่เกี่ยว' },
        ] },
        { q: '`jsonDecode` ทำหน้าที่อะไร?', options: [
          { t: 'แปลงข้อความ JSON เป็นโครงสร้าง Map/List ของ Dart (ยังไม่มีชนิดเฉพาะ)', ok: true },
          { t: 'แปลง JSON เป็นอ็อบเจกต์ Todo โดยตรง', why: 'ต้องผ่าน fromJson อีกขั้น' },
          { t: 'ส่งคำขอ HTTP', why: 'นั่นคือ http.get' },
        ] },
        { q: 'JSON ที่ได้ไม่มีฟิลด์ `completed` แล้ว `json[\'completed\'] as bool` จะเกิดอะไร?', options: [
          { t: "TypeError: type 'Null' is not a subtype of type 'bool' in type cast", ok: true },
          { t: 'completed ได้ค่า false อัตโนมัติ', why: 'Dart ไม่เดาค่าให้' },
          { t: 'FormatException', why: 'FormatException มาจาก jsonDecode เมื่อข้อความไม่ใช่ JSON' },
        ] },
      ],
    },
    {
      id: '12.6', title: 'เมื่อคำขอล้มเหลว: timeout ข้อผิดพลาด และการลองใหม่', source: '§12.6', exam: true,
      gist: 'ล้มเหลว 3 แบบ: **ต่อไม่ติด** (SocketException) · **ช้าเกินรอ** (http **ไม่มี timeout เริ่มต้น** → `.timeout()` → TimeoutException) · **ตอบไม่ใช่อย่างที่คาด** (4xx ไม่ควรลองใหม่ / 5xx ลองใหม่ได้ / FormatException / TypeError) → แปลงทั้งหมดเป็น **ApiException(message, canRetry)** ที่ชั้นบริการ · **ลองใหม่ = Future ตัวใหม่**',
      blocks: [
        { t: 'compare', cols: ['แบบ', 'ตัวอย่าง', 'สัญญาณใน Dart', 'ลองใหม่ช่วยไหม'], rows: [
          ['ต่อไม่ติดตั้งแต่ต้น', 'ไม่มีสัญญาณ, ชื่อโฮสต์ผิด, ไฟร์วอลล์', '`SocketException` (มือถือ) / `ClientException` (เว็บ)', 'ช่วย เมื่อสัญญาณกลับมา'],
          ['ต่อติดแต่ช้าเกินรอ', 'เซิร์ฟเวอร์ช้า', '`TimeoutException` จาก `.timeout()` (ไม่มีค่าเริ่มต้น!)', 'ช่วย'],
          ['ตอบไม่ใช่อย่างที่คาด', '404 / 503 / ได้หน้าล็อกอิน Wi-Fi / ขาดฟิลด์', 'status code / `FormatException` / `TypeError`', '4xx: ไม่ · 5xx: ช่วย · Format: ไม่'],
        ] },
        { t: 'viz', id: 'ch12.fail', title: 'จำลองความล้มเหลวแต่ละแบบ', try: 'เลือกทีละสถานการณ์ ดูบรรทัดที่โค้ดวิ่งผ่านและสิ่งที่ผู้ใช้เห็น (มีปุ่มลองใหม่หรือไม่) · กดลองใหม่แล้วดูเลข Future · ลอง “JSON ขาดฟิลด์”' },
        { t: 'code', title: 'api_service.dart ฉบับรับมือความล้มเหลว', src: `import 'dart:async'; // สำหรับ TimeoutException

// ข้อผิดพลาดที่แอปเข้าใจเอง พร้อมข้อความที่นำไปแสดงต่อผู้ใช้ได้ทันที
class ApiException implements Exception {
  final String message; // ข้อความภาษาคน ไม่ใช่ข้อความของระบบ
  final bool canRetry;  // ปุ่มลองใหม่ควรมีประโยชน์หรือไม่
  const ApiException(this.message, {this.canRetry = true});

  @override
  String toString() => message;
}

` + `Future<List<Todo>> fetchTodos() async { /* ดูโค้ดเต็มในภาพด้านบน */ }`, notes: [
          { at: 'class ApiException implements Exception {', note: '`implements Exception` = บอกว่าเป็นข้อผิดพลาดที่ตั้งใจโยน (ใช้กับ `on ApiException` ได้)' },
          { at: 'const ApiException(this.message, {this.canRetry = true});', note: 'ค่าเริ่มต้นลองใหม่ได้ — กรณี 4xx/Format ส่ง `canRetry: false`' },
        ] },
        { t: 'why', choice: 'แปลงข้อผิดพลาดทุกชนิดเป็น **ApiException** ที่ชั้นบริการ จุดเดียว',
          because: ['หน้าจอไม่ต้องรู้จัก SocketException/TimeoutException เลย — แค่แสดง `message` และปุ่มลองใหม่ตาม `canRetry`', '`on ApiException { rethrow; }` กันไม่ให้ `catch (_)` บรรทัดล่างกลืนข้อความที่เราตั้งใจไว้'],
          alts: [
            { alt: 'ทำไมไม่แสดง error ดิบ เช่น “Error: SocketException: Failed host lookup”?', result: 'ผู้ใช้อ่านไม่รู้เรื่องและไม่รู้ว่าต้องทำอะไรต่อ' },
            { alt: 'ทำไมไม่ใส่ปุ่มลองใหม่ทุกกรณี?', result: '4xx คือคำขอของเราเองผิด ลองใหม่ด้วยคำขอเดิมก็ได้ผลเดิม — ปุ่มที่กดแล้วไม่มีวันสำเร็จทำให้ผู้ใช้หงุดหงิด' },
          ] },
        { t: 'why', choice: 'กำหนด **`.timeout(const Duration(seconds: 10))`** ทุกคำขอ',
          because: ['แพ็กเกจ http **ไม่มี timeout โดยปริยาย** — ถ้าไม่กำหนด วงล้อหมุนค้างเป็นนาทีจนผู้ใช้ปิดแอป'],
          alts: [] },
        { t: 'code', title: 'หน้าจอ: ตรวจ error ก่อน + ลองใหม่ด้วย Future ใหม่ + RefreshIndicator', src: `// สั่งโหลดใหม่ คือสร้าง Future ตัวใหม่ แล้วบอก FutureBuilder ว่าตัวเดิมเลิกใช้แล้ว
Future<void> _reload() async {
  final future = fetchTodos();
  setState(() => _futureTodos = future);
  try {
    await future; // RefreshIndicator ต้องรู้ว่างานจบแล้วจึงหยุดหมุน
  } catch (_) {
    // ไม่ต้องทำอะไรที่นี่ เพราะ FutureBuilder จะแสดงข้อผิดพลาดให้เอง
  }
}

// ใน build
body: RefreshIndicator(
  onRefresh: _reload,
  child: FutureBuilder<List<Todo>>(
    future: _futureTodos,
    builder: (context, snapshot) {
      // 1. ตรวจข้อผิดพลาดก่อน แล้วอ่านข้อความจาก ApiException
      if (snapshot.hasError) {
        final error = snapshot.error;
        final message = error is ApiException ? error.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
        final canRetry = error is! ApiException || error.canRetry;
        return ListView(
          // ต้องเป็นวิดเจ็ตที่เลื่อนได้ ไม่งั้นลากลงเพื่อรีเฟรชไม่ได้
          padding: const EdgeInsets.only(top: 120),
          children: [
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            if (canRetry)
              Center(child: ElevatedButton(onPressed: _reload, child: const Text('ลองใหม่'))),
          ],
        );
      }
      // 2. ยังไม่มีข้อมูลเลยจึงแสดงวงล้อหมุน ถ้ามีข้อมูลรอบก่อนค้างอยู่
      //    จะข้ามเงื่อนไขนี้ไป รายการเดิมจึงไม่กระพริบขณะรีเฟรช
      if (!snapshot.hasData) {
        return const Center(child: CircularProgressIndicator());
      }
      final todos = snapshot.data!;
      return ListView.builder(/* ... */);
    },
  ),
),`, notes: [
          { at: 'final future = fetchTodos();', note: '**Future ให้ผลได้ครั้งเดียวตลอดอายุ** — ลองใหม่ = สร้างตัวใหม่แล้วส่งให้ FutureBuilder ผ่าน setState' },
          { at: 'await future; // RefreshIndicator', note: '`onRefresh` ต้องคืน Future ที่จบเมื่องานเสร็จ วงหมุนของ RefreshIndicator จึงหยุดถูกจังหวะ' },
          { at: 'final canRetry = error is! ApiException || error.canRetry;', note: '`is!` = ไม่ใช่ชนิดนี้ · error ที่ไม่ใช่ ApiException ให้ลองใหม่ได้ไว้ก่อน · type promotion ทำให้เรียก `error.canRetry` ได้หลัง `||`' },
          { at: 'return ListView(', note: 'แม้หน้าข้อผิดพลาดก็ต้องเลื่อนได้ — RefreshIndicator ต้องการ child ที่ scroll ได้' },
          { at: 'if (canRetry)', note: 'collection-if ใน children ([[dart]])' },
        ] },
        { t: 'callout', kind: 'note', title: 'ออกแบบสถานะรอคอยให้ดีเท่ากับสถานะข้อมูลครบ', body: 'แอปที่มีผู้ใช้หลักล้านแทบไม่ปล่อยให้เห็นจอขาวนิ่ง — แสดง **ภาพโครงร่าง (skeleton)** ของเนื้อหาที่กำลังมา ทำได้ด้วย Container สีเทาขนาดเท่าของจริง ข้อดีที่ได้ฟรี: **หน้าจอไม่กระโดด** เพราะพื้นที่ถูกจองไว้แล้ว (ลองสวิตช์ skeleton ในภาพ)' },
      ],
      quiz: [
        { q: 'ข้อใด **จริง** เกี่ยวกับแพ็กเกจ http?', options: [
          { t: 'ไม่มี timeout ให้โดยปริยาย ต้องต่อ `.timeout(...)` เอง', ok: true },
          { t: 'timeout เริ่มต้น 30 วินาที', why: 'ไม่มีค่าเริ่มต้น' },
          { t: 'โยน TimeoutException เองเสมอเมื่อช้า', why: 'ต้องใส่ .timeout() ก่อน' },
        ] },
        { q: 'เซิร์ฟเวอร์ตอบ 404 ควรแสดงปุ่มลองใหม่หรือไม่?', options: [
          { t: 'ไม่ควร — คำขอเราเองผิด ลองซ้ำก็ได้ผลเดิม (canRetry: false)', ok: true },
          { t: 'ควร เพราะทุกความล้มเหลวควรลองใหม่ได้', why: 'ตำราแยก 4xx กับ 5xx ชัดเจน' },
          { t: 'ควรลองใหม่อัตโนมัติไม่จำกัด', why: 'ได้ผลเดิมทุกครั้ง' },
        ] },
        { q: 'ทำไมต้องมี `on ApiException { rethrow; }` ก่อน `catch (_)`?', options: [
          { t: 'ไม่ให้ catch-all กลืน ApiException ที่เราโยนเองแล้วเปลี่ยนเป็นข้อความ “ต่อเน็ตไม่ได้”', ok: true },
          { t: 'เพื่อให้แอปพัง', why: 'rethrow ส่งต่อให้ผู้เรียก (FutureBuilder) จัดการ' },
          { t: 'ไม่จำเป็น', why: 'ถ้าไม่มี 404/503 จะกลายเป็น “ต่อเน็ตไม่ได้”' },
        ] },
        { q: 'กดปุ่มลองใหม่ที่เรียก `setState(() {})` เฉยๆ โดยไม่สร้าง Future ใหม่ ผลคือ?', options: [
          { t: 'ไม่โหลดใหม่ — Future ตัวเดิมจบไปแล้วและให้ผลได้ครั้งเดียว', ok: true },
          { t: 'Future ตัวเดิมทำงานซ้ำ', why: 'Future ไม่ทำงานซ้ำ' },
          { t: 'แอปพัง', why: 'ไม่พัง แค่ไม่มีอะไรเกิดขึ้น' },
        ] },
      ],
    },
    {
      id: '12.7', title: 'เมื่อการแปลง JSON กินเวลาเกินหนึ่งเฟรม', source: '§12.7',
      gist: '`jsonDecode` + `fromJson` เป็นงาน **synchronous บน UI isolate** — **async/await ไม่ได้ย้ายงานไปที่อื่น** · ข้อมูลหลายพันรายการ → กระตุกตอน “โหลดเสร็จ” · ย้ายด้วย `compute(_parseTodos, response.body)` แต่ **วัดก่อน** เพราะสร้าง isolate ก็มีต้นทุน',
      blocks: [
        { t: 'viz', id: 'ch12.isolate', title: 'UI isolate vs isolate ของ compute', try: 'เลื่อนขนาดข้อมูลไป 20,000 (เฟรมแดง) แล้วเปิด compute · ลองลดเหลือ 100 แล้วเปิด compute (ไม่คุ้ม)' },
        { t: 'code', title: 'compute (ตำรา §12.7)', src: `import 'package:flutter/foundation.dart'; // สำหรับ compute

// ต้องเป็นฟังก์ชันระดับบนสุด เพราะ isolate ใหม่เข้าถึงตัวแปรของคลาสเดิมไม่ได้
List<Todo> _parseTodos(String responseBody) {
  final data = jsonDecode(responseBody) as List<dynamic>;
  return data
      .map((item) => Todo.fromJson(item as Map<String, dynamic>))
      .toList();
}

Future<List<Todo>> fetchTodos() async {
  final response = await http
      .get(Uri.parse('https://jsonplaceholder.typicode.com/todos'))
      .timeout(const Duration(seconds: 10));

  if (response.statusCode != 200) {
    throw const ApiException('โหลดข้อมูลไม่สำเร็จ');
  }
  // ส่งข้อความ JSON ไปแปลงใน isolate อื่น UI isolate จึงว่างไปวาดเฟรมต่อไปได้
  return compute(_parseTodos, response.body);
}`, notes: [
          { at: 'List<Todo> _parseTodos(String responseBody) {', note: 'รับ **String** (ส่งข้าม isolate ได้) คืน List ของอ็อบเจกต์ธรรมดา · โค้ดใน isolate อื่น **แตะ widget, BuildContext, state ของแอปไม่ได้**' },
          { at: 'return compute(_parseTodos, response.body);', note: 'ตัวอย่างนี้ตัดการแปลงข้อผิดพลาดแบบ 12.6 ออกเพื่อให้สั้น — โค้ดจริงควรรวมทั้งสองอย่าง' },
        ] },
        { t: 'why', choice: '**วัดก่อน (profile mode) แล้วค่อยย้าย** ไป compute',
          because: ['การสร้าง isolate ใหม่มีต้นทุนหลายมิลลิวินาที — ข้อมูลเล็ก compute อาจแพงกว่าแปลงตรงๆ'],
          alts: [
            { alt: 'ทำไมไม่ใส่ `async` ให้ฟังก์ชันแปลง JSON ก็พอ?', result: 'ความเข้าใจผิดที่พบบ่อย: await แค่ “รอผลของงานที่ทำอยู่ที่อื่น” — jsonDecode ยังรันบน isolate เดิม ระหว่างนั้นวาดจอไม่ได้' },
            { alt: 'ทำไมไม่ใช้ compute กับทุกคำขอไว้ก่อน?', result: 'สำหรับข้อมูลเล็ก (สองสามร้อยรายการ) ไม่เห็นผล และอาจช้ากว่าเดิม' },
          ] },
        { t: 'callout', kind: 'real', title: 'กฎ “ต้องเป็นฟังก์ชันระดับบนสุดหรือ static”', body: 'เป็นแนวปฏิบัติที่ **ปลอดภัยและถูกต้องเสมอ** (ตอบข้อสอบตามนี้) · ใน Flutter/Dart รุ่นใหม่ `compute` ทำงานผ่าน `Isolate.run` ซึ่งรับ closure ได้ ตราบที่ค่าที่ closure จับไว้ส่งข้าม isolate ได้ — ข้อห้ามที่แท้จริงคือห้ามพาอ็อบเจกต์ที่ส่งไม่ได้หรือแตะ widget/context/state ของแอปเข้าไป' },
      ],
      quiz: [
        { q: 'ข้อใดถูกต้องเกี่ยวกับ `jsonDecode` ในฟังก์ชัน async?', options: [
          { t: 'ยังทำงาน synchronous บน UI isolate — async ไม่ได้ย้ายงานไปที่อื่น', ok: true },
          { t: 'ถูกย้ายไป background thread อัตโนมัติเพราะอยู่ในฟังก์ชัน async', why: 'นี่คือความเข้าใจผิดที่ตำราเตือน' },
          { t: 'ทำงานในเครือข่าย', why: 'เป็นการคำนวณในเครื่อง' },
        ] },
        { q: 'อาการกระตุกจากการแปลง JSON ก้อนใหญ่เกิด “ตอนไหน”?', options: [
          { t: 'ตอนโหลดเสร็จแล้วกำลังแปลงข้อมูล', ok: true },
          { t: 'ตอนกำลังรอเซิร์ฟเวอร์ตอบ', why: 'ตอนรอ UI isolate ว่าง' },
          { t: 'ตอนเปิดแอป', why: 'ไม่ใช่' },
        ] },
      ],
    },
    {
      id: '12.8', title: 'การนำข้อมูลจากเครือข่ายเข้าสู่ Provider', source: '§12.8', exam: true,
      gist: 'เกณฑ์: ดู **วงจรชีวิตของข้อมูล** ไม่ใช่ความยากของเครื่องมือ — ข้อมูลอยู่นานกว่าหน้าจอ/ใช้หลายหน้า/โหลดซ้ำได้ → **ChangeNotifier** ที่เก็บ `todos` + `isLoading` + `errorMessage` · เริ่มโหลดด้วย **addPostFrameCallback** · คำตอบของคำถาม 11.10: บอกสถานะด้วย `isLoading` **ไม่ใช่ลิสต์ว่าง** และ **provider เป็นผู้จำข้อผิดพลาด**',
      blocks: [
        { t: 'viz', id: 'ch12.provider', name: 'pv', title: 'ตะกร้า 3 หน้าจอ: FutureBuilder แยกกัน vs provider ตัวเดียว', try: 'เปิดหน้าแรก → กด “ข้อมูลบนเซิร์ฟเวอร์เปลี่ยน” → เปิดหน้าชำระเงิน (ข้อมูลคนละรุ่น!) แล้วสลับเป็น provider ทำซ้ำ' },
        { t: 'code', title: 'lib/providers/todo_provider.dart', src: `class TodoProvider extends ChangeNotifier {
  List<Todo> _todos = [];
  bool _isLoading = false;
  String? _errorMessage;

  // คืนเป็นสำเนาที่แก้ไขไม่ได้ เพื่อบังคับให้การเปลี่ยนแปลงข้อมูลทุกครั้ง
  // ต้องผ่านเมธอดของคลาสนี้ ซึ่งจะเรียก notifyListeners() ให้เสมอ
  List<Todo> get todos => List.unmodifiable(_todos);
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadTodos() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners(); // แจ้ง UI ให้แสดงสถานะกำลังโหลด

    try {
      _todos = await fetchTodos(); // ใช้ฟังก์ชันเดิมจากหัวข้อ 12.6
    } on ApiException catch (e) {
      // ชั้นบริการแปลงข้อผิดพลาดทุกชนิดมาเป็นข้อความภาษาคนให้แล้ว
      _errorMessage = e.message;
      // ไม่ล้าง _todos ทิ้ง เพื่อให้ผู้ใช้ยังเห็นข้อมูลรอบก่อน
    } catch (e) {
      _errorMessage = 'ไม่สามารถโหลดข้อมูลได้';
    } finally {
      _isLoading = false;
      notifyListeners(); // แจ้ง UI อีกครั้งเมื่อได้ผลลัพธ์แล้ว
    }
  }
}`, notes: [
          { at: 'List<Todo> get todos => List.unmodifiable(_todos);', note: 'เหตุผลเต็มของ “private + getter” จากบทที่ 10: ถ้าคืน `_todos` ตรงๆ หน้าจอแก้รายการได้โดยที่ UI ไม่ถูกแจ้ง · unmodifiable → แก้แล้วพังทันที (fail fast) ([[lab11]])' },
          { at: 'notifyListeners(); // แจ้ง UI ให้แสดงสถานะกำลังโหลด', note: 'notify ครั้งที่ 1 — ทันทีที่เริ่ม (ตัวการของ error ถ้าเรียกใน initState)' },
          { at: '} on ApiException catch (e) {', note: '`on X catch (e)` = ดักเฉพาะชนิด X และได้ตัวแปร e ([[dart]])' },
          { at: '} finally {', note: '`finally` ทำงานเสมอ ไม่ว่าสำเร็จหรือล้มเหลว → isLoading กลับเป็น false แน่นอน' },
        ] },
        { t: 'code', title: 'เริ่มโหลดตอนเปิดหน้าจอ', src: `@override
void initState() {
  super.initState();
  // เลื่อนไปเรียกหลังเฟรมแรกวาดเสร็จ เพราะ loadTodos() เรียก notifyListeners() ทันที
  WidgetsBinding.instance.addPostFrameCallback((_) {
    if (!mounted) return; // ผู้ใช้อาจกดย้อนกลับออกไปก่อนเฟรมแรกจบ
    context.read<TodoProvider>().loadTodos();
  });
}` },
        { t: 'viz', id: 'ch12.states', title: 'Consumer เลือกสาขาตามสถานะ + ทำไมต้อง addPostFrameCallback', try: 'สลับสวิตช์ทุกแบบ (โดยเฉพาะ “todos ไม่ว่าง + error”) แล้วดูสาขาที่ถูกเลือก · ด้านขวา กดสองปุ่มเทียบกัน' },
        { t: 'code', title: 'Consumer ฝั่งหน้าจอ', src: `body: Consumer<TodoProvider>(
  builder: (context, provider, child) {
    // กำลังโหลดครั้งแรก คือยังไม่มีข้อมูลอะไรให้แสดงเลย
    if (provider.isLoading && provider.todos.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    // ผิดพลาดและไม่มีข้อมูลเดิมค้างอยู่ จึงแสดงข้อความพร้อมปุ่มลองใหม่
    if (provider.errorMessage != null && provider.todos.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(provider.errorMessage!, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => context.read<TodoProvider>().loadTodos(),
              child: const Text('ลองใหม่'),
            ),
          ],
        ),
      );
    }
    return ListView.builder(
      itemCount: provider.todos.length,
      itemBuilder: (context, index) => ListTile(title: Text(provider.todos[index].title)),
    );
  },
),
floatingActionButton: FloatingActionButton(
  // สั่งโหลดซ้ำได้โดยไม่ต้องสร้างหน้าจอใหม่ ซึ่งทำได้ยากกว่าเมื่อใช้ FutureBuilder
  onPressed: () => context.read<TodoProvider>().loadTodos(),
  child: const Icon(Icons.refresh),
),` },
        { t: 'why', choice: 'เริ่มโหลดผ่าน **`addPostFrameCallback`** (ไม่เรียกตรงใน initState)',
          because: ['`loadTodos()` เรียก `notifyListeners()` **ทันที** ขณะเฟรมแรกยัง build อยู่ → เฟรมเวิร์กไม่อนุญาต (`setState() or markNeedsBuild() called during build.`)', 'ใช้ได้กับ provider ทุกตัวโดยไม่ต้องแก้ตรรกะภายใน'],
          alts: [
            { alt: 'ทำไมไม่ออกแบบ loadTodos ให้ข้าม notify รอบแรก?', result: 'ทำได้ (ตำรายอมรับ) แต่ต้องแก้ตรรกะใน provider และอ่านยากกว่า' },
          ] },
        { t: 'why', choice: 'บอก “กำลังโหลด” ด้วย **`isLoading`** และให้ **provider จำข้อผิดพลาด**',
          because: ['**ลิสต์ว่างมีความหมายอยู่แล้ว** = ดึงสำเร็จแต่ไม่มีรายการ — ใช้แทน “กำลังโหลด” ผู้ใช้จะเข้าใจผิดว่าไม่มีสินค้า', 'ข้อผิดพลาดเป็นสถานะของ **ข้อมูลชุดนั้น** ไม่ใช่ของหน้าจอใด — สลับหน้าแล้วกลับมา สถานะยังอยู่ ไม่ยิงคำขอซ้ำ'],
          alts: [] },
        { t: 'compare', cols: ['เลือก FutureBuilder เมื่อ', 'เลือก Provider เมื่อ'], rows: [
          ['ข้อมูลใช้เฉพาะหน้าจอเดียว', 'ข้อมูลใช้ร่วมกันหลายหน้าจอ'],
          ['ดึงครั้งเดียวตอนเปิดหน้า', 'ต้องสั่งโหลดซ้ำ/แก้ไขได้'],
          ['ไม่ต้องแก้ไขหรือโหลดซ้ำจากที่อื่น', 'ต้องคงอยู่ขณะสลับหน้าจอ (รูปแบบของแลปบทที่ 13)'],
        ] },
        { t: 'callout', kind: 'exam', title: 'จุดที่ต้องจำ', body: '“**งานอะซิงโครนัสทุกชนิดมีสามสถานะเสมอ: กำลังโหลด สำเร็จ และผิดพลาด**” — โครงสร้างนี้ใช้ซ้ำในบทที่ 13 เพราะทุกคำสั่งของ sqflite คืน Future เช่นกัน' },
        { t: 'callout', kind: 'supp', title: 'ช่องโหว่ใน Consumer ตัวอย่าง (ข้อสังเกต)', body: 'สำเร็จแต่ลิสต์ว่าง → แสดง ListView เปล่าโดยไม่มีข้อความ · มีข้อมูลเก่าแต่รีเฟรชล้มเหลว → `errorMessage` ถูกเก็บแต่ **ไม่ถูกแสดง** · กำลังรีเฟรชทับข้อมูลเดิม → ไม่มีตัวบอก — ตรงกับคำถามท้ายบทเรื่อง “สถานะที่สี่” และเป็นเหตุผลที่โจทย์ q6 กำหนด 4 สถานะหน้าจอ ([[13.10]])' },
      ],
      quiz: [
        { q: 'เรียก `context.read<TodoProvider>().loadTodos()` ตรงใน initState จะเกิดอะไร?', options: [
          { t: 'error “setState() or markNeedsBuild() called during build.” เพราะ notifyListeners ทันที', ok: true },
          { t: 'ทำงานปกติ', why: 'ตำราระบุว่าแอปหยุดทำงานทันที' },
          { t: 'loadTodos ไม่ถูกเรียก', why: 'ถูกเรียก แต่ notify ในจังหวะที่ห้าม' },
        ] },
        { q: 'ทำไม TodoProvider ไม่ใช้ “ลิสต์ว่าง” เพื่อบอกว่ากำลังโหลด?', options: [
          { t: 'ลิสต์ว่างหมายถึงสำเร็จแต่ไม่มีรายการ — ผู้ใช้จะเข้าใจผิด', ok: true },
          { t: 'ลิสต์ว่างใช้หน่วยความจำมาก', why: 'ไม่เกี่ยว' },
          { t: 'Consumer แสดงลิสต์ว่างไม่ได้', why: 'แสดงได้' },
        ] },
        { q: 'ข้อมูลตะกร้าแสดงที่หน้าแรก หน้าค้นหา และหน้าชำระเงิน ควรเลือกอะไร?', options: [
          { t: 'ChangeNotifier + Provider', ok: true, why: 'ข้อมูลอยู่นานกว่าหน้าจอและใช้หลายหน้า' },
          { t: 'FutureBuilder ในแต่ละหน้า', why: 'ยิงซ้ำ เปลืองเน็ต และข้อมูลอาจไม่ตรงกัน' },
          { t: 'ส่งผ่าน constructor', why: 'กลับไปปัญหาบทที่ 9' },
        ] },
      ],
    },
    {
      id: 'lab12', title: 'ปฏิบัติการบทที่ 12: api_post_viewer', short: 'แลป', source: 'ปฏิบัติการ',
      gist: '`Post.fromJson` + `fetchPosts()` (timeout 10 วิ) + `PostListScreen` ที่ใช้ FutureBuilder แสดง Card · ความท้าทาย: ข้อความไทย + ลองใหม่จริง, RefreshIndicator ไม่กระพริบ, ย้ายไป PostProvider',
      blocks: [
        { t: 'code', title: 'lib/post_model.dart + lib/api_service.dart', src: `class Post {
  final int id;
  final String title;
  final String body;

  const Post({required this.id, required this.title, required this.body});

  factory Post.fromJson(Map<String, dynamic> json) {
    return Post(
      id: json['id'] as int,
      title: json['title'] as String,
      body: json['body'] as String,
    );
  }
}

// lib/api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:api_post_viewer/post_model.dart';

Future<List<Post>> fetchPosts() async {
  final response = await http.get(
    Uri.parse('https://jsonplaceholder.typicode.com/posts'),
    headers: {'Accept': 'application/json'},
  ).timeout(const Duration(seconds: 10));

  if (response.statusCode == 200) {
    final List<dynamic> data = jsonDecode(response.body);
    return data.map((json) => Post.fromJson(json)).toList();
  } else {
    throw Exception('Failed to load posts');
  }
}`, notes: [
          { at: "import 'package:api_post_viewer/post_model.dart';", note: 'ชื่อหลัง `package:` ต้องตรงกับ **ชื่อโปรเจกต์ใน pubspec.yaml** และเส้นทางต้องตรงกับไฟล์จริงใน lib — ตั้งชื่ออื่นต้องเปลี่ยนตาม หรือใช้ `import \'post_model.dart\';` (relative) ก็ได้' },
          { at: ').timeout(const Duration(seconds: 10));', note: 'มี timeout แล้ว แต่ยังโยน Exception ดิบ — ความท้าทายข้อ 1 ให้เปลี่ยนเป็นข้อความไทย + ลองใหม่ ([[12.6]])' },
        ] },
        { t: 'callout', kind: 'note', title: 'PostListScreen ใช้ลำดับ “waiting ก่อน”', body: 'โค้ดในแลปตรวจ `ConnectionState.waiting` ก่อน — ใช้ได้เพราะโหลดครั้งเดียว · ความท้าทายข้อ 2 (RefreshIndicator) บังคับให้เปลี่ยนเป็นลำดับ error → !hasData → data เพื่อไม่ให้กระพริบ ([[12.3]])' },
        { t: 'h', text: 'ความท้าทายเพิ่มเติม' },
        { t: 'list', ordered: true, items: [
          'เปิดโหมดเครื่องบินแล้วรัน → เปลี่ยนให้แสดงข้อความภาษาไทย + ปุ่มลองใหม่ที่ **สร้าง Future ตัวใหม่จริง** ([[12.6]])',
          'เพิ่ม RefreshIndicator แล้วตรวจว่ารายการเดิมไม่กระพริบหายขณะรีเฟรช ([[12.3]])',
          'ย้ายตรรกะไป `PostProvider` แล้วใช้ `Consumer<PostProvider>` — เทียบเมื่อเพิ่มหน้าจอที่สองที่ใช้ข้อมูลชุดเดียวกัน ([[12.8]])',
        ] },
      ],
      quiz: [
        { q: 'ตั้งชื่อโปรเจกต์ว่า `my_posts` แต่ยังเขียน `import \'package:api_post_viewer/post_model.dart\';` ผลคือ?', options: [
          { t: 'compile ไม่ผ่าน หา package ไม่เจอ — ต้องแก้เป็น `package:my_posts/...` หรือใช้ import แบบ relative', ok: true },
          { t: 'ทำงานได้ปกติ', why: 'ชื่อ package ต้องตรง pubspec' },
          { t: 'error ตอนรันเท่านั้น', why: 'ผิดตั้งแต่ compile' },
        ] },
      ],
    },
  ],
  rules: [
    'งานเครือข่าย **ต้อง async เสมอ** — UI isolate ตัวเดียว งบ 16 ms/เฟรม (60 Hz)',
    '`await` หยุดเฉพาะฟังก์ชันนั้น · `async` ไม่ได้ย้ายงาน CPU ไปที่อื่น',
    'เริ่มงาน async ใน `initState` แล้วเก็บ **Future** ไว้ในตัวแปร — **ห้ามเรียกใน build**',
    'หลัง await: `if (!mounted) return;` หรือดึง Navigator/ScaffoldMessenger ไว้ก่อน await',
    'FutureBuilder: ตรวจ `hasError` → `!hasData` (หมุน) → แสดงข้อมูล (ไม่กระพริบตอนรีเฟรช)',
    '`ConnectionState.done` ≠ สำเร็จ',
    'ลองใหม่ = **สร้าง Future ตัวใหม่** แล้ว setState',
    'Model + `factory fromJson` · `jsonDecode` → `Map<String, dynamic>` → `as int/String/bool`',
    'ทุกคำขอมี `.timeout(...)` · เช็ก statusCode · ดัก `TimeoutException`, `FormatException`',
    '4xx ไม่แสดงปุ่มลองใหม่ · 5xx/ต่อไม่ติด/timeout ลองใหม่ได้',
    'แปลง error ทั้งหมดเป็น `ApiException(message, canRetry)` ที่ชั้น service · `on ApiException { rethrow; }` ก่อน `catch (_)`',
    'Android release: `<uses-permission android:name="android.permission.INTERNET"/>` ใน **main** manifest',
    'JSON ใหญ่ → วัดก่อน แล้ว `compute(topLevelFn, response.body)`',
    'ข้อมูลหลายหน้า → ChangeNotifier ที่มี `isLoading` + `errorMessage` + `List.unmodifiable` getter',
    'เริ่ม `loadTodos()` ด้วย `addPostFrameCallback` + เช็ก mounted',
    '3 สถานะเสมอ: กำลังโหลด · สำเร็จ · ผิดพลาด (บทที่ 13 เพิ่มสถานะที่ 4)',
  ],
  handsOff: { heading: 'คำถามชวนคิดท้ายบท (12.10)', body: [
    { t: 'callout', kind: 'exam', title: 'คำถามจากตำรา', body: '“ลองนึกถึงผู้ใช้คนหนึ่งที่เปิดแอปของเราดูรายการทั้งหมดตอนเช้าที่บ้าน … แล้วตอนสายเดินเข้าลิฟต์และเปิดแอปขึ้นมาอีกครั้ง สิ่งที่เขาเห็นคือวงล้อหมุนสักครู่ ตามด้วยข้อความว่าเชื่อมต่ออินเทอร์เน็ตไม่ได้ … **ข้อมูลชุดนั้นควรถูกเก็บไว้ที่ไหนและใครควรเป็นผู้เก็บ** ตรรกะการอ่านข้อมูลจากที่เก็บนั้นควรอยู่ในชั้นเดียวกับ `fetchTodos()` หรือควรเป็นอีกชั้นหนึ่งที่ provider เรียกใช้ … เมื่อมีข้อมูลสองชุด **ชุดใดคือความจริง** … สามสถานะ … ยังเพียงพอหรือไม่ หรือต้องมี **สถานะที่สี่ว่ามีข้อมูลเก่าอยู่และกำลังรีเฟรช**”' },
    { t: 'viz', id: 'ch12.elevator', title: 'ผู้ใช้ในลิฟต์', try: 'กด 08:12 ที่บ้าน → กด 11:30 ในลิฟต์ ในทั้งสองโหมด' },
    'คำตอบอยู่ใน [[13.10]]: เก็บใน **SQLite** โดย **Repository** (อีกชั้นที่ provider เรียกใช้) · ฐานข้อมูลในเครื่องเป็น **แหล่งความจริงเดียวของหน้าจอ** · สถานะเป็นชุดค่า 4 ตัว (รายการ, isRefreshing, errorMessage, lastSynced) → [[ch13|บทที่ 13: SQLite]]',
  ] },
  quiz: [
    { type: 'multi', q: 'ข้อใดเป็นข้อผิดพลาดที่ตำราเตือนเมื่อใช้ async กับวิดเจ็ต (เลือกทุกข้อที่ถูก)', options: [
      { t: 'เริ่มงาน async ในเมธอด build', ok: true },
      { t: 'setState หลัง await โดยไม่เช็ก mounted', ok: true },
      { t: 'ใช้ BuildContext ข้าม await โดยไม่ระวัง', ok: true },
      { t: 'ใช้ FutureBuilder', why: 'FutureBuilder คือเครื่องมือที่แนะนำ' },
    ] },
    { q: 'คำขอค้างนาน 40 วินาทีโดยวงล้อหมุนไม่หยุด สาเหตุหลักคือ?', options: [
      { t: 'ไม่ได้ใส่ `.timeout(...)` เพราะ http ไม่มี timeout เริ่มต้น', ok: true },
      { t: 'ลืม await', why: 'ถ้าลืม await จะไม่รอเลย' },
      { t: 'ใช้ FutureBuilder', why: 'ไม่ใช่สาเหตุ' },
    ] },
    { q: 'ได้หน้า HTML ของ Wi-Fi โรงแรมแทน JSON (status 200) ในโค้ด 12.6 จะลงเอยที่ไหน?', options: [
      { t: '`on FormatException` → “รูปแบบข้อมูลที่ได้รับไม่ถูกต้อง” (canRetry: false)', ok: true },
      { t: '`on TimeoutException`', why: 'ตอบเร็ว ไม่ใช่ timeout' },
      { t: 'แสดงรายการปกติ', why: 'jsonDecode อ่าน HTML ไม่ได้' },
    ] },
    { q: 'ควรแยกโค้ด `fetchTodos()` ไว้ที่ใดตามตำรา?', options: [
      { t: '`lib/services/api_service.dart` (ชั้นบริการ)', ok: true },
      { t: 'ใน build ของหน้าจอ', why: 'ทั้งผิดหลักการแยกส่วนและยิงซ้ำ' },
      { t: 'ใน main.dart', why: 'ไม่แยกความรับผิดชอบ' },
    ] },
  ],
};
