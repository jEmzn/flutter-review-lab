/* บทที่ 8 — การจัดการ Input ของผู้ใช้และฟอร์ม */
FR.content.ch08 = {
  id: 'ch08', kind: 'chapter', num: '8', navTitle: 'Input & Form', crumb: 'บทที่ 8',
  title: 'การจัดการ Input ของผู้ใช้และฟอร์ม',
  problem: 'แอปต้อง **รับข้อมูล** จากผู้ใช้ (อีเมล รหัสผ่าน จำนวน ฯลฯ) แล้ว **ตรวจว่าถูกต้อง** ก่อน **เก็บไปใช้ต่อ** อย่างปลอดภัย — ไม่ใช่แค่วางช่องสี่เหลี่ยมให้คนพิมพ์',
  tools: ['TextFormField', 'TextEditingController', 'InputDecoration', 'Form + GlobalKey<FormState>', 'validator / onSaved'],
  receives: { title: 'ต่อจากบทที่ 7', body: 'บทที่ 7 ปิดท้ายว่า “เราต้องการวิธีให้ผู้ใช้ **ป้อน** ข้อมูลได้อย่างมีประสิทธิภาพมากกว่าแค่การแตะปุ่ม” — บทนี้ใช้ทุกอย่างจากบทที่ 7: controller สร้างใน `initState` / ปิดใน `dispose`, และค่าที่พิมพ์เป็น ephemeral state' },
  overview: [
    { t: 'h', text: 'ภาพใหญ่: ข้อมูลเดินทางจากนิ้วผู้ใช้ไปถึงตัวแปรอย่างไร' },
    'ทั้งบทคือ “ท่อ” เส้นเดียว: **ช่องกรอก → ด่านตรวจ (validator) → รวบรวม (onSaved) → ตัวแปรใน State → ส่งต่อ** หัวข้อ 8.2–8.4 คือ “ช่องกรอก” · 8.5–8.7 คือ “ด่านตรวจ” · 8.8 คือ “รวบรวม” · 8.10–8.12 คือการทำให้ท่อนี้ใช้ได้จริงบนมือถือและปลอดภัย',
    { t: 'viz', id: 'ch08.pipeline', title: 'ท่อของฟอร์ม: validate() → save()', try: 'กด “ล็อกอิน” ตอนช่องว่าง → เติม “\'test\' / \'123\'” แล้วกด → เติม “ถูกต้อง” แล้วกด ดูว่าแต่ละช่องไปหยุดที่ด่านไหน' },
    { t: 'compare', cols: ['ส่วนของท่อ', 'เครื่องมือ', 'หัวข้อ'], rows: [
      ['ช่องกรอก', '`TextField` / `TextFormField`, `TextEditingController`, `InputDecoration`', '[[8.2]] [[8.3]] [[8.4]]'],
      ['กลุ่มช่อง + ตัวสั่งการ', '`Form`, `AutovalidateMode`, `GlobalKey<FormState>`', '[[8.5]] [[8.6]]'],
      ['ด่านตรวจ', '`validator` → `validate()`', '[[8.7]]'],
      ['รวบรวม', '`onSaved` → `save()`', '[[8.8]]'],
      ['input แบบอื่น', 'Checkbox, RadioGroup, Dropdown, DatePicker', '[[8.9]]'],
      ['ใช้ได้จริงบนมือถือ', 'scroll, textInputAction, inputFormatters', '[[8.10]]'],
      ['เลือกเครื่องมือ', 'controller vs onSaved vs initialValue, trim', '[[8.11]]'],
      ['ความปลอดภัย', 'server ตรวจซ้ำ, forceErrorText, รหัสผ่าน', '[[8.12]]'],
    ] },
    { t: 'callout', kind: 'supp', title: 'Dart syntax ที่บทนี้ใช้เยอะ', body: 'บทนี้เต็มไปด้วย `value?.trim() ?? \'\'`, `_formKey.currentState!`, `late final` — ถ้ายังไม่คล่อง ดูหน้า [[dart|Dart syntax ที่ตำราใช้]] ประกอบ' },
  ],
  sections: [
    // ─────────────────────────── 8.1
    {
      id: '8.1', title: 'บทนำ: การรับข้อมูลจากผู้ใช้', source: '§8.1',
      gist: 'การรับข้อมูลที่ดี “ไม่ใช่เวทมนตร์” แต่เป็นโครงสร้างที่ออกแบบไว้: **ช่องที่ผู้ใช้พิมพ์ → การตรวจว่าข้อมูลถูกต้อง → การเก็บค่าไว้เพื่อส่งต่อ**',
      blocks: [
        'ตำราเปิดบทด้วยภาพที่ทุกคนเคยเจอ: กรอกเลขบัตรเครดิต 16 หลักแล้วกดชำระเงิน — ผู้ใช้ได้แต่ลุ้น แต่สำหรับนักพัฒนา เบื้องหลังเสี้ยววินาทีนั้นคือโครงสร้างที่ถูกออกแบบไว้อย่างรัดกุม บทนี้จึงเป็นจุดเปลี่ยนจาก “แอปที่แสดงผลได้” เป็น “แอปที่รับฟังผู้ใช้ได้จริง”',
        { t: 'list', items: [
          '`TextField` และ `TextFormField` สำหรับรับข้อความ',
          '`TextEditingController` ควบคุมและดึงข้อความ',
          '`InputDecoration` ใส่ label, hint, ไอคอน, ข้อความ error',
          '`Form` + `GlobalKey<FormState>` จัดกลุ่มและสั่งการทั้งฟอร์ม',
          '`validator` ตรวจความถูกต้อง · `onSaved` + `FormState.save()` เก็บค่า',
          'วิดเจ็ต input อื่น (Checkbox, Radio, Slider, Dropdown)',
          'ฟอร์มบนมือถือจริง: คีย์บอร์ด โฟกัส พื้นที่จอ',
          'เลือก controller หรือ onSaved · validator ที่อ้างถึงช่องอื่น',
          'ขอบเขตของการตรวจฝั่งแอป และการดูแลรหัสผ่าน',
        ] },
        { t: 'viz', id: 'ch08.pipeline', title: 'ลองกรอกแล้วดูข้อมูลไหลผ่านท่อ', try: 'กรอกอีเมลผิดรูป (ไม่มี @) แต่รหัสผ่านถูก แล้วกดล็อกอิน — ช่องไหนหยุดที่ด่านตรวจ?' },
      ],
      quiz: [
        { type: 'order', q: 'เรียงลำดับเส้นทางของข้อมูลในฟอร์มตามที่บทนี้สอน', items: ['ผู้ใช้พิมพ์ลงช่อง TextFormField', '`validate()` เรียก validator ของทุกช่อง', '`save()` เรียก onSaved ของทุกช่อง', 'ค่าอยู่ในตัวแปรของ State พร้อมส่งต่อ'] },
      ],
    },
    // ─────────────────────────── 8.2
    {
      id: '8.2', title: 'การรับ Text Input: TextField เปรียบเทียบกับ TextFormField', source: '§8.2',
      gist: '**TextField** = ช่องกรอกข้อความทั่วไป (กระดาษโน้ต) · **TextFormField** = ห่อ TextField + เพิ่ม **FormFieldState** ที่จำค่าและ error ทำให้ Form สั่ง “ตรวจ/บันทึก/รีเซ็ต” ทุกช่องได้ในคำสั่งเดียว',
      blocks: [
        { t: 'viz', id: 'ch08.tfvs', title: 'กระดาษโน้ต vs แบบฟอร์มเย็บเล่ม', try: 'พิมพ์ในบางช่องของทั้งสองฝั่ง แล้วกด `validate()` — ฝั่งไหนถูกตรวจบ้าง?' },
        { t: 'callout', kind: 'analogy', title: 'กระดาษโน้ตกับแบบฟอร์มราชการ (จากตำรา)', body: 'TextField เหมือน **กระดาษโน้ตเปล่า** ยื่นให้เขียนอะไรก็ได้ เขียนเสร็จก็ใช้ตรงนั้นเลย เหมาะกับช่องค้นหาหรือคอมเมนต์สั้นๆ ส่วน TextFormField เหมือน **แบบฟอร์มราชการที่เย็บรวมเป็นเล่ม** ต้องทำงานร่วมกับระบบที่ใหญ่กว่า — เมื่อต้องรับข้อมูลเป็นชุด (อีเมล + รหัสผ่าน + เบอร์โทร) กระดาษแยกแผ่นจะจัดการยาก เพราะต้องไล่ตรวจและเก็บค่าทีละแผ่นเอง' },
        { t: 'compare', cols: ['คุณสมบัติ', 'ใช้กับ', 'ทำอะไร'], rows: [
          ['`controller`', 'ทั้งคู่', '`TextEditingController` จัดการข้อความที่กำลังแก้'],
          ['`decoration`', 'ทั้งคู่', '`InputDecoration` (label, hint, error, border, icon)'],
          ['`keyboardType`', 'ทั้งคู่', 'ชนิดคีย์บอร์ด เช่น `TextInputType.emailAddress`'],
          ['`obscureText`', 'ทั้งคู่', 'ซ่อนตัวอักษร (รหัสผ่าน) — ซ่อนแค่ **บนจอ**'],
          ['`onChanged`', 'ทั้งคู่', 'เรียกทุกครั้งที่ข้อความเปลี่ยน'],
          ['`onSubmitted`', 'TextField', 'ผู้ใช้กด Done (ใน TextFormField ชื่อ `onFieldSubmitted`)'],
          ['`enabled`, `maxLength`', 'ทั้งคู่', 'โต้ตอบได้หรือไม่ / ความยาวสูงสุด'],
          ['`validator`', '**TextFormField เท่านั้น**', 'คืน `String` (error) หรือ `null` (ผ่าน)'],
          ['`onSaved`', '**TextFormField เท่านั้น**', 'ถูกเรียกเมื่อ `FormState.save()`'],
          ['`initialValue`', '**TextFormField เท่านั้น**', 'ข้อความเริ่มต้น (ห้ามใช้คู่กับ controller)'],
        ] },
        { t: 'callout', kind: 'real', title: '`onSubmitted` ของ TextFormField', body: 'ตำราจัด `onSubmitted` เป็นคุณสมบัติ “ร่วมกัน” แต่ใน TextFormField พารามิเตอร์นี้ชื่อ **`onFieldSubmitted`** (แลปท้ายบทใช้ชื่อนี้ถูกต้องแล้ว)' },
        { t: 'why', choice: 'ใช้ **TextFormField** ในฟอร์ม',
          because: ['มี `validator` และ `onSaved` ที่ Form เรียกให้อัตโนมัติ', 'Form สั่ง `validate()` / `save()` / `reset()` ทุกช่องในคำสั่งเดียว — เพิ่มช่องใหม่ก็แค่ใส่เข้าไป', 'การแสดงข้อความ error สีแดงใต้ช่องเกิดขึ้นเอง ไม่ต้องเขียนเอง'],
          alts: [
            { alt: 'ทำไมไม่ใช้ TextField แล้วตรวจเองตอนกดปุ่ม?', result: 'ต้องเขียนโค้ดตรวจ เก็บ error และวาดข้อความสีแดงเองทีละช่อง เพิ่มช่องเมื่อไรต้องแก้ส่วนกลางทุกครั้ง', ok: 'ช่องเดี่ยวที่ไม่ต้องตรวจ เช่น ช่องค้นหา ช่องแชต' },
          ] },
        'ตำราเน้นรายละเอียดเล็กๆ ที่ผู้ใช้รู้สึกได้ทันที: `keyboardType` ทำให้แตะช่องเบอร์โทรแล้วได้แป้นตัวเลข แตะช่องอีเมลแล้วมีปุ่ม @ รออยู่ — **ลดภาระทางความคิด** และบอกเป็นนัยว่าระบบรอข้อมูลรูปแบบไหน ส่วน `obscureText` กันคนแอบมองจอจากด้านหลัง (shoulder surfing) แต่ **ซ่อนเฉพาะบนจอ** ([[8.12]])',
      ],
      quiz: [
        { q: 'คุณสมบัติใด **มีเฉพาะใน TextFormField**?', options: [
          { t: '`validator`', ok: true },
          { t: '`controller`', why: 'ใช้ได้ทั้งคู่' },
          { t: '`obscureText`', why: 'ใช้ได้ทั้งคู่' },
        ] },
        { q: 'ช่องค้นหาสินค้าที่ไม่ต้องตรวจความถูกต้อง และไม่ได้อยู่ในฟอร์ม ควรใช้อะไร?', options: [
          { t: '`TextField` — ไม่ต้องผูกกับ Form', ok: true },
          { t: '`TextFormField` เสมอ ไม่ว่ากรณีไหน', why: 'ใช้ได้ แต่เกินจำเป็น ตำราบอกว่า TextField เหมาะกับช่องค้นหา' },
          { t: '`Form` อย่างเดียว ไม่ต้องมีช่อง', why: 'Form ไม่ใช่ช่องรับข้อความ' },
        ] },
        { q: 'อะไรทำให้ `Form` สั่งตรวจทุกช่องได้ในคำสั่งเดียว?', options: [
          { t: 'TextFormField แต่ละตัวมี FormFieldState ที่จำค่าและ error และลงทะเบียนกับ Form ไว้', ok: true },
          { t: 'Form อ่านข้อความจากหน้าจอโดยตรง', why: 'Form ทำงานผ่าน FormFieldState ไม่ได้อ่านจากจอ' },
          { t: 'GlobalKey เก็บกฎการตรวจทั้งหมดไว้', why: 'กฎอยู่ที่ validator ของแต่ละช่อง ([[8.6]])' },
        ] },
      ],
    },
    // ─────────────────────────── 8.3
    {
      id: '8.3', title: 'การควบคุม Input: TextEditingController', source: '§8.3', exam: true,
      gist: 'controller **อ่าน** (`.text`) **เขียน** (`.text = …`) **ล้าง** (`clear()`) **ฟัง** (`addListener`) และคุมเคอร์เซอร์ได้ — แลกกับหน้าที่ต้อง **dispose** ทุกครั้ง ไม่งั้นรั่ว',
      blocks: [
        { t: 'code', title: 'รูปแบบการใช้งานใน StatefulWidget (ตำรา §8.3)', src: `class _MyFormState extends State<MyForm> {
  // 1. ประกาศ controller (ใช้ late final หากกำหนดค่าเริ่มต้นใน initState)
  late final TextEditingController _nameController;
  // หรือ กำหนดค่าเริ่มต้นโดยตรงหากไม่ต้องการค่าเริ่มต้น:
  // final TextEditingController _nameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // 2. กำหนดค่าเริ่มต้นให้ controller ใน initState
    _nameController = TextEditingController();
    // คุณสามารถตั้งค่าข้อความเริ่มต้นที่นี่:
    // _nameController.text = 'ชื่อเริ่มต้น';

    // ทางเลือก: เพิ่ม listener
    _nameController.addListener(_printLatestValue);
  }

  // เมธอด listener (ทางเลือก)
  void _printLatestValue() {
    print('ค่าปัจจุบันของช่องชื่อ: \${_nameController.text}');
  }

  @override
  void dispose() {
    // 3. Dispose controller ใน dispose! สำคัญมาก!
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextFormField(
          controller: _nameController, // 4. กำหนด controller ให้กับฟิลด์
          decoration: const InputDecoration(labelText: 'ชื่อ'),
        ),
        ElevatedButton(
          onPressed: () {
            // 5. เข้าถึงค่าผ่าน controller
            showDialog(
              context: context,
              builder: (context) {
                return AlertDialog(
                  content: Text('สวัสดี, \${_nameController.text}'),
                );
              },
            );
          },
          child: const Text('ทักทาย'),
        ),
      ],
    );
  }
}`, notes: [
          { at: 'late final TextEditingController _nameController;', note: '`late final` = จะกำหนดค่าครั้งเดียวใน initState แล้วไม่เปลี่ยน — ทบทวน [[7.5]]' },
          { at: '_nameController.addListener(_printLatestValue);', note: 'listener ถูกเรียก **ทุกครั้งที่ค่าใน controller เปลี่ยน** รวมถึงเคอร์เซอร์/selection และการตั้งค่าจากโค้ด' },
          { at: '_nameController.dispose();', note: 'ปิดก๊อกก่อนออกจากครัว — ก่อน `super.dispose()`' },
          { at: "content: Text('สวัสดี", note: 'อ่านค่า ณ ตอนกดปุ่ม ผ่าน `.text`' },
        ] },
        { t: 'viz', id: 'ch08.controller', title: 'listener vs onChanged + มาตรวัดการรั่ว', try: 'พิมพ์ในช่อง (ทั้งสองฝั่ง log) → กด “controller.text = …” (ฝั่ง onChanged เงียบ) → กด “ย้ายเคอร์เซอร์” (listener ทำงาน) · ด้านล่าง: ปิดสวิตช์ dispose แล้วเปิด-ปิดหน้าฟอร์มหลายรอบ' },
        { t: 'compare', cols: ['', '`controller.addListener`', '`onChanged`'], rows: [
          ['ผู้ใช้พิมพ์/ลบ', '✓', '✓'],
          ['โค้ดตั้ง `controller.text = …` / `clear()`', '✓', '✗'],
          ['ผู้ใช้แค่ย้ายเคอร์เซอร์ / เลือกข้อความ', '✓', '✗'],
          ['เหมาะกับ', 'ติดตามค่าทุกการเปลี่ยนแปลง', '“ตอบสนองต่อการพิมพ์ของผู้ใช้อย่างเดียว” (ตรงงานกว่า)'],
        ] },
        { t: 'why', choice: 'ใช้ **controller** เมื่อต้องการ “ควบคุม” ช่อง ไม่ใช่แค่อ่านค่าตอนจบ',
          because: ['ตำรา: การพิมพ์บนมือถือ “ไม่ใช่เหตุการณ์ที่เกิดครั้งเดียวจบ มันคือ **กระแสของการเปลี่ยนแปลง**”', 'controller ไม่ได้เป็นแค่กล่องเก็บค่า แต่เป็น **ผู้ควบคุม** — รับรู้ทุกตัวอักษร และสั่งกลับไปที่ช่องได้ เช่น `clear()` หลังกดส่ง'],
          alts: [
            { alt: 'ทำไม Flutter ไม่ให้ “หยิบค่าออกจากช่องตรงๆ” เหมือนหยิบของจากกล่อง?', result: 'วิดเจ็ตเป็น immutable configuration ([[7.1]]) ข้อความที่เปลี่ยนตลอดต้องมี “เจ้าของ” ที่อยู่ยาว — นั่นคือ controller (หรือ FormFieldState ภายใน TextFormField)' },
            { alt: 'ทำไมไม่ใช้ onChanged แล้วเก็บลงตัวแปรเองตลอด?', result: 'ทำได้สำหรับการอ่าน แต่ **สั่งกลับไปที่ช่องไม่ได้** (เช่นเคลียร์ช่อง เติมค่าเดิม) และต้อง setState เองทุกครั้งที่อยากให้จอตามค่า', ok: 'ต้องการแค่ตอบสนองต่อการพิมพ์ เช่น ค้นหาแบบ live' },
          ] },
        { t: 'callout', kind: 'analogy', title: 'ก๊อกน้ำที่ลืมปิด (จากตำรา)', body: 'เปิดก๊อกล้างจานแล้วเดินออกจากครัวโดยลืมปิด น้ำไหลทิ้งไปเรื่อยๆ — controller ที่ไม่ถูก dispose ก็เช่นกัน หน้าจอปิดไปแล้วแต่ทรัพยากรยังไม่ถูกคืน (**memory leak**) การเรียก `dispose()` ใน `dispose()` ของ State คือการปิดก๊อกทุกครั้งก่อนออกจากครัว' },
        { t: 'callout', kind: 'note', title: 'ขนาดของปัญหาตามจริง (ตำราอธิบายไว้ละเอียด)', body: 'controller ที่ลืม dispose **ไม่ได้ทำให้แอปพังทันที** — ถ้าไม่มีอะไรอ้างถึงแล้ว garbage collector ของ Dart เก็บคืนได้ในที่สุด ปัญหาจริงเกิดเมื่อ **สิ่งที่อยู่นานกว่าหน้าจอ** ยังอ้างถึง controller/listener หน่วยความจำส่วนนั้นจะไม่ถูกคืนเลย และถ้าเกิดซ้ำทุกครั้งที่เปิด-ปิดหน้า แอปจะกินหน่วยความจำเพิ่มขึ้นจนระบบปฏิบัติการสั่งปิด (ผู้ใช้เห็นเป็น “แอปเด้ง”) — การ dispose ทุกครั้งจึงเป็นกฎที่ไม่ควรละเว้น เพราะ “เราไม่มีทางรู้ล่วงหน้าว่าวันหนึ่ง controller ตัวนั้นจะถูกอ้างถึงจากที่ใดบ้าง”' },
        { t: 'callout', kind: 'warn', title: 'ก่อนทดสอบบน emulator', body: 'ตรวจว่าคีย์บอร์ดบนจอเด้งขึ้นเมื่อแตะช่อง ถ้าไม่ขึ้น: Settings ของ emulator → System → Keyboard → Physical keyboard → เปิด **Show on-screen keyboard** — ปัญหาพื้นที่จอใน [[8.10]] จะไม่ปรากฏเลยถ้าไม่มีคีย์บอร์ดบนจอ' },
      ],
      quiz: [
        { q: 'โค้ดเรียก `_controller.text = "ค่าใหม่"` ข้อใดถูก?', options: [
          { t: 'listener ของ controller ทำงาน แต่ onChanged ไม่ทำงาน', ok: true },
          { t: 'ทั้ง listener และ onChanged ทำงาน', why: 'onChanged ทำงานเฉพาะเมื่อ **ผู้ใช้** แก้ข้อความเอง' },
          { t: 'ไม่มีอะไรทำงานเลย', why: 'listener ทำงานทุกครั้งที่ค่าใน controller เปลี่ยน' },
        ] },
        { type: 'multi', q: 'ข้อใดทำได้ด้วย TextEditingController (เลือกทุกข้อที่ถูก)', options: [
          { t: 'อ่านข้อความปัจจุบัน `.text`', ok: true },
          { t: 'ล้างช่อง `clear()`', ok: true },
          { t: 'ควบคุมตำแหน่งเคอร์เซอร์และการเลือกข้อความ', ok: true },
          { t: 'ตรวจความถูกต้องและแสดงข้อความ error สีแดงเอง', why: 'นั่นคือหน้าที่ของ validator + FormFieldState' },
        ] },
        { q: 'ตามตำรา ทำไมการลืม dispose controller ถึงอันตรายแม้แอปไม่พังทันที?', options: [
          { t: 'ถ้ามีสิ่งที่อยู่นานกว่าหน้าจออ้างถึงมัน หน่วยความจำจะไม่ถูกคืน และสะสมทุกครั้งที่เปิด-ปิดหน้าจนแอปถูกปิด', ok: true },
          { t: 'ทำให้ข้อความในช่องหายทันที', why: 'ไม่เกี่ยวกับข้อความในช่อง' },
          { t: 'Dart ไม่มี garbage collector', why: 'มี — แต่เก็บได้เฉพาะสิ่งที่ไม่มีใครอ้างถึงแล้ว' },
        ] },
      ],
    },
    // ─────────────────────────── 8.4
    {
      id: '8.4', title: 'การจัดสไตล์ช่อง Input: InputDecoration', source: '§8.4',
      gist: '`InputDecoration` ไม่ได้มีดีแค่สวย: **label** ลอยขึ้นไปให้ผู้ใช้ไม่ลืมว่าช่องคืออะไร, **hint** บอกรูปแบบ, **ไอคอน** สื่อสารเร็วกว่าตัวหนังสือ',
      blocks: [
        { t: 'viz', id: 'ch08.decoration', title: 'Playground ของ InputDecoration', try: 'เปิด-ปิดแต่ละ property แล้วดูว่ามันไปโผล่ตรงไหน · แตะช่องแล้วพิมพ์ ดู label ลอยขึ้นและ hint หายไป' },
        { t: 'kv', items: [
          ['labelText / label', 'ป้ายที่อยู่ในช่องตอนว่าง แล้ว **ลอยขึ้นขอบบน** เมื่อโฟกัส/มีค่า'],
          ['hintText', 'placeholder ในช่อง **ตอนว่าง** เช่น `you@example.com`'],
          ['helperText', 'ข้อความเล็กใต้ช่อง (ถูกแทนด้วย error เมื่อไม่ผ่าน)'],
          ['errorText', 'ข้อความ error ใต้ช่อง — ปกติ validator ตั้งให้อัตโนมัติ'],
          ['icon', 'ไอคอน **นอก** กรอบ (ซ้าย)'],
          ['prefixIcon / suffixIcon', 'ไอคอน **ใน** กรอบ ก่อน/หลังข้อความ (เช่น ไอคอนค้นหา, ปุ่มดูรหัสผ่าน)'],
          ['border', '`OutlineInputBorder()` / `UnderlineInputBorder()`'],
          ['enabledBorder / focusedBorder / errorBorder', 'สไตล์เส้นขอบตามสถานะ'],
          ['filled + fillColor', 'เติมสีพื้นหลัง'],
        ] },
        { t: 'code', title: 'ตัวอย่างในตำรา', src: `TextFormField(
  decoration: InputDecoration(
    labelText: 'ที่อยู่อีเมล',
    hintText: 'you@example.com',
    icon: const Icon(Icons.email),
    prefixIcon: const Icon(Icons.alternate_email), // ไอคอนภายใน
    helperText: 'ป้อนอีเมลหลักของคุณ',
    // errorText: 'รูปแบบอีเมลไม่ถูกต้อง', // ปกติตั้งค่าโดย validator
    border: const OutlineInputBorder( // เพิ่มเส้นขอบ
      borderRadius: BorderRadius.all(Radius.circular(8.0)),
    ),
    filled: true,
    fillColor: Colors.grey[100],
  ),
  keyboardType: TextInputType.emailAddress,
)`, notes: [
          { at: 'decoration: InputDecoration(', note: 'สังเกตว่า **ไม่มี `const`** หน้า InputDecoration เพราะ `Colors.grey[100]` ไม่ใช่ค่าคงที่ตอน compile — แต่ใส่ const ที่ Icon/border ทีละตัวได้' },
        ] },
        { t: 'why', choice: 'ใช้ **labelText** เป็นป้ายหลักของช่อง แล้วใช้ hintText บอก “รูปแบบ”',
          because: ['ตำรา: labelText เป็น “ป้ายกำกับที่ฉลาด” — อยู่ในช่องตอนแรก แล้วลอยขึ้นไปขอบบนเมื่อพิมพ์ ผู้ใช้จึงไม่ลืมว่าช่องนี้คืออะไรแม้พิมพ์ไปยาวแล้ว', 'hint อย่าง `you@example.com` บอกรูปแบบโดยไม่ต้องเขียนคำอธิบายยาว'],
          alts: [
            { alt: 'ทำไมไม่ใช้ hintText อย่างเดียวเป็นชื่อช่อง (ประหยัดที่)?', result: 'hint **หายทันทีที่เริ่มพิมพ์** ผู้ใช้ที่พิมพ์ไปครึ่งทางหรือกลับมาแก้จะไม่รู้ว่าช่องนี้คืออะไร (ลองปิด labelText ในภาพแล้วพิมพ์)', ok: 'ช่องที่ความหมายชัดจากบริบท เช่น ช่องค้นหาที่มีไอคอนแว่นขยาย' },
          ] },
      ],
      quiz: [
        { q: 'ต้องการไอคอนรูปตา (กดเพื่อดูรหัสผ่าน) **ภายใน** กรอบช่องด้านขวา ใช้ property ใด?', options: [
          { t: '`suffixIcon`', ok: true },
          { t: '`icon`', why: 'icon อยู่นอกกรอบด้านซ้าย' },
          { t: '`prefixIcon`', why: 'prefix อยู่ในกรอบแต่ด้านซ้าย (ก่อนข้อความ)' },
        ] },
        { q: 'ข้อความใดจะ **หายไป** เมื่อผู้ใช้เริ่มพิมพ์?', options: [
          { t: '`hintText`', ok: true },
          { t: '`labelText`', why: 'label ลอยขึ้นไปอยู่ขอบบน ไม่หาย' },
          { t: '`helperText`', why: 'helper อยู่ใต้ช่องตลอด (จนกว่าจะมี error มาแทน)' },
        ] },
      ],
    },
    // ─────────────────────────── 8.5
    {
      id: '8.5', title: 'การจัดโครงสร้าง Input: วิดเจ็ต Form', source: '§8.5',
      gist: '`Form` แทบ **ล่องหน** บนจอ — มันคือผู้จัดการที่คุมภาพรวมของทุกช่องข้างใน · `autovalidateMode` กำหนดว่าจะตรวจ “เมื่อไร” (5 แบบ ให้ประสบการณ์ต่างกันมาก)',
      blocks: [
        { t: 'code', title: 'Constructor (ตำรา §8.5)', lang: 'dart', src: `Form({
  Key? key,
  required Widget child,
  bool? canPop,
  void Function(bool didPop, Object? result)? onPopInvokedWithResult,
  void Function()? onChanged,
  AutovalidateMode? autovalidateMode,
})` },
        { t: 'kv', items: [
          ['child (จำเป็น)', 'มักเป็น `Column` หรือ `ListView` ที่บรรจุ TextFormField และปุ่ม submit'],
          ['autovalidateMode', 'ตรวจเมื่อไร — ค่าเริ่มต้น `AutovalidateMode.disabled`'],
          ['onChanged', 'ถูกเรียกเมื่อ FormField ใดๆ ภายใน Form เปลี่ยน'],
          ['canPop / onPopInvokedWithResult', 'ดักการย้อนกลับเมื่อกรอกค้างไว้ (รายละเอียดในบทที่ 9 [[9.8]])'],
        ] },
        { t: 'viz', id: 'ch08.autovalidate', title: 'ผู้ใช้เห็นข้อความสีแดงเมื่อไร?', try: 'เลือกโหมดทีละแบบแล้วกด “▶ เล่นสคริปต์” — เปรียบเทียบไทม์ไลน์ โดยเฉพาะ `always` vs `onUserInteraction` vs `onUserInteractionIfError`' },
        { t: 'compare', cols: ['AutovalidateMode', 'ตรวจเมื่อ', 'ผลต่อผู้ใช้'], rows: [
          ['`disabled` (ค่าเริ่มต้น)', 'เมื่อเรียก `validate()` เท่านั้น', 'error ค้างจนกว่าจะกดส่งอีกครั้ง'],
          ['`always`', 'ทุกครั้งที่ฟอร์ม build **รวมตอนเปิดหน้า**', 'เห็นสีแดงเต็มจอทั้งที่ยังไม่ได้พิมพ์ — ไม่ค่อยเหมาะ'],
          ['`onUserInteraction`', 'ทันทีที่ผู้ใช้เริ่มแก้ช่องนั้น', 'เตือนตั้งแต่ตัวอักษรแรก (พิมพ์อีเมลได้ตัวเดียวก็ฟ้องแล้ว)'],
          ['`onUnfocus`', 'เมื่อผู้ใช้ออกจากช่อง', 'ไม่รบกวนระหว่างพิมพ์'],
          ['`onUserInteractionIfError`', 'ไม่ตรวจล่วงหน้า แต่ช่องที่ **มี error อยู่แล้ว** จะถูกตรวจซ้ำทุกครั้งที่แก้', 'สีแดงหายทันทีที่แก้ถูก — ใช้คู่กับ `validate()` ตอนกดส่งได้ดีมาก'],
        ] },
        { t: 'why', choice: '`AutovalidateMode.onUserInteractionIfError` + เรียก `validate()` ตอนกดส่ง (แบบที่แลปท้ายบทใช้)',
          because: ['ไม่จู้จี้ระหว่างที่ผู้ใช้ยังกรอกไม่เสร็จ', 'หลังกดส่งแล้วมีจุดผิด สีแดงหายทันทีที่แก้ถูก ผู้ใช้รู้ว่าแก้สำเร็จโดยไม่ต้องกดส่งซ้ำ'],
          alts: [
            { alt: 'ทำไมไม่ใช้ `always`?', result: 'เปิดหน้ามาก็เห็นข้อความสีแดงทุกช่องทั้งที่ยังไม่ได้พิมพ์อะไร' },
            { alt: 'ทำไมไม่ใช้ `onUserInteraction`?', result: 'เตือนตั้งแต่ตัวอักษรแรก ผู้ใช้รู้สึกเหมือนถูกตำหนิระหว่างพิมพ์', ok: 'ช่องที่ผู้ใช้ควรรู้ทันที เช่น ชื่อผู้ใช้ที่ห้ามมีอักขระบางตัว' },
            { alt: 'ทำไมไม่ปล่อยเป็น `disabled` (ค่าเริ่มต้น)?', result: 'หลังกดส่งไม่ผ่าน error ค้างอยู่แม้ผู้ใช้แก้ถูกแล้ว จนกว่าจะกดส่งอีกครั้ง', ok: 'ฟอร์มสั้นๆ ที่ยอมรับพฤติกรรมนี้ได้' },
          ] },
        { t: 'callout', kind: 'real', title: 'หมายเหตุเรื่องเวอร์ชัน (จากตำรา)', body: [
          { t: 'list', items: [
            '`onUnfocus` และ `onUserInteractionIfError` เพิ่มเข้ามาใน Flutter รุ่นหลัง — ถ้า IDE ไม่รู้จักให้อัปเดต Flutter SDK',
            'พารามิเตอร์ `onWillPop` ของ Form ถูก **deprecated ตั้งแต่ Flutter 3.12** ให้ใช้ `canPop` + `onPopInvokedWithResult` แทน (ตัวอย่างเก่าในอินเทอร์เน็ตยังใช้ onWillPop อยู่มาก)',
          ] },
        ] },
      ],
      quiz: [
        { q: 'ผู้ใช้เปิดหน้าสมัครสมาชิกแล้วเห็นข้อความสีแดงทุกช่องทันที ฟอร์มน่าจะตั้ง autovalidateMode เป็นอะไร?', options: [
          { t: '`AutovalidateMode.always`', ok: true },
          { t: '`AutovalidateMode.disabled`', why: 'disabled ไม่ตรวจเองเลย' },
          { t: '`AutovalidateMode.onUnfocus`', why: 'ตรวจเมื่อออกจากช่อง ยังไม่ได้โฟกัสก็ยังไม่ตรวจ' },
        ] },
        { q: 'โหมดใดทำให้ “สีแดงหายทันทีที่แก้ถูก หลังจากกดส่งไม่ผ่าน” โดยไม่เตือนก่อนกดส่ง?', options: [
          { t: '`onUserInteractionIfError`', ok: true },
          { t: '`onUserInteraction`', why: 'เตือนตั้งแต่เริ่มพิมพ์ ก่อนกดส่ง' },
          { t: '`disabled`', why: 'error ค้างจนกว่าจะ validate() ใหม่' },
        ] },
        { q: 'ตัวอย่างโค้ดเก่าใช้ `Form(onWillPop: ...)` ตามตำราควรเปลี่ยนเป็นอะไร?', options: [
          { t: '`canPop` + `onPopInvokedWithResult`', ok: true },
          { t: '`WillPopScope`', why: 'ก็ถูกแทนที่เช่นกัน ([[9.8]])' },
          { t: '`onChanged`', why: 'onChanged ไม่เกี่ยวกับการย้อนกลับ' },
        ] },
      ],
    },
    // ─────────────────────────── 8.6
    {
      id: '8.6', title: 'การโต้ตอบกับ Form: GlobalKey<FormState>', source: '§8.6', exam: true,
      gist: 'สร้าง `final _formKey = GlobalKey<FormState>()` ในคลาส State → ใส่ให้ `Form(key: _formKey)` → เรียก `_formKey.currentState` จาก event handler · **กุญแจแค่พาไปถึง FormState — กฎอยู่ที่ validator ของแต่ละช่อง**',
      blocks: [
        { t: 'steps', items: [
          '**สร้าง Key** ในคลาส State: `final _formKey = GlobalKey<FormState>();`',
          '**กำหนด Key** ให้ Form: `Form(key: _formKey, child: …)`',
          '**เข้าถึง FormState** จาก event handler เช่น `onPressed`: `_formKey.currentState`',
        ] },
        { t: 'code', title: 'สร้างและกำหนด key', src: `// ภายใน _MyFormState
final _formKey = GlobalKey<FormState>(); // สร้าง key

// ภายในเมธอด build
Form(
  key: _formKey, // กำหนด key ที่นี่
  child: Column(
    children: [
      // ... TextFormField(s) ...
      // ... ปุ่ม Submit ...
    ],
  ),
)`, hl: ['final _formKey = GlobalKey<FormState>();', 'key: _formKey,'] },
        { t: 'viz', id: 'ch08.globalkey', title: 'บัตร VIP → ศูนย์ควบคุม → พนักงานเฝ้าประตู', try: 'แก้ค่าอีเมล/รหัสผ่านด้านบน แล้วกดปุ่ม — ดูลูกศรม่วง (กุญแจ) พุ่งตรงไปที่ Form แล้ว Form กระจายคำสั่ง validate() ไปยังแต่ละช่อง' },
        { t: 'callout', kind: 'analogy', title: 'บัตรผ่าน VIP สัญญาณเตือนภัย และพนักงานประจำประตู (จากตำรา)', body: '`GlobalKey<FormState>` เหมือน **บัตรผ่าน VIP** ที่พาเราเข้าถึงศูนย์ควบคุมของฟอร์มจากส่วนไหนของโค้ดก็ได้ ไม่สนว่าหน้าจอซ้อนลึกแค่ไหน จุดที่คนมักเข้าใจสลับกันคือคิดว่ากฎ (รหัสผ่านต้องยาว 6 ตัว, อีเมลต้องมี @) ถูกเก็บไว้ที่ GlobalKey — **ความจริงตรงข้าม** GlobalKey เป็นแค่ “คนกดปุ่มสัญญาณเตือนภัย” ส่วนกฎถูกแจกให้ **พนักงานเฝ้าประตูแต่ละช่อง** คือ validator ของช่องนั้น — โค้ดจึงเป็นระเบียบ เพิ่มหรือลบช่องได้โดยไม่ต้องแก้ส่วนกลาง' },
        { t: 'why', choice: 'ใช้ **GlobalKey<FormState>** เพื่อเรียก `validate()` / `save()` จากปุ่ม',
          because: ['เข้าถึง FormState ได้ “จากทุกที่ที่เข้าถึง `_formKey`”', 'กฎกระจายอยู่ที่แต่ละช่อง ศูนย์กลางแค่สั่งให้ทุกช่องตรวจตัวเอง'],
          alts: [
            { alt: 'ทำไมไม่ใช้ `Form.of(context)` ในปุ่ม? (เสริม)', result: '`Form.of(context)` ค้นหา Form ที่อยู่ **เหนือ context ขึ้นไป** — แต่ปุ่มที่เขียนอยู่ใน `build()` เดียวกับ Form ใช้ `context` ของ State ซึ่งอยู่ **เหนือ** Form จึงหาไม่เจอ (ต้องห่อด้วย Builder) ดูเรื่องการค้นหาด้วย context ที่ [[core/c2]]', ok: 'วิดเจ็ตลูกที่อยู่ภายใต้ Form จริงๆ เช่น ปุ่มที่แยกเป็นคลาสของตัวเอง' },
            { alt: 'ทำไมไม่สร้าง key ใน `build()` เลย? (เสริม)', result: 'build ถูกเรียกบ่อย → ได้ GlobalKey **ตัวใหม่** ทุกครั้ง → Flutter มองว่าเป็น Form คนละตัว สร้าง FormState ใหม่ ค่าที่พิมพ์และ error หาย — ต้องเป็นฟิลด์ `final` ของคลาส State' },
          ] },
      ],
      quiz: [
        { q: 'กฎ “รหัสผ่านต้องยาวอย่างน้อย 6 ตัว” ถูกเขียนไว้ที่ใด?', options: [
          { t: 'ใน `validator` ของช่องรหัสผ่าน', ok: true },
          { t: 'ใน `GlobalKey<FormState>`', why: 'นี่คือความเข้าใจผิดที่ตำราเตือนไว้ — key เป็นแค่ผู้กดสัญญาณ' },
          { t: 'ในวิดเจ็ต Form', why: 'Form สั่งให้ช่องตรวจตัวเอง ไม่ได้ถือกฎ' },
        ] },
        { type: 'spot', q: 'ผู้ใช้พิมพ์แล้วข้อความในฟอร์มหายทุกครั้งที่หน้าจอ rebuild — บรรทัดไหนเป็นต้นเหตุ?', code: `class _LoginState extends State<Login> {
  @override
  Widget build(BuildContext context) {
    final formKey = GlobalKey<FormState>();
    return Form(
      key: formKey,
      child: Column(children: [ /* TextFormField ... */ ]),
    );
  }
}`, bad: 'final formKey = GlobalKey<FormState>();', explain: 'สร้าง GlobalKey ใหม่ทุก build → Form ถูกมองเป็นตัวใหม่ → FormState ใหม่ ต้องย้ายไปเป็นฟิลด์ `final _formKey` ของคลาส State' },
      ],
    },
    // ─────────────────────────── 8.7
    {
      id: '8.7', title: 'การตรวจสอบความถูกต้อง: property validator', source: '§8.7', exam: true,
      gist: 'validator รับค่าปัจจุบัน แล้ว **คืน `null` = ผ่าน** · **คืน `String` = ไม่ผ่าน** (ข้อความนั้นถูกแสดงใต้ช่องให้อัตโนมัติ) · การตรวจเกิดเมื่อเรียก `_formKey.currentState!.validate()`',
      blocks: [
        { t: 'viz', id: 'ch08.validator', name: 'val', title: 'ไล่ทีละบรรทัดของ validator', try: 'เลือก validator แล้วกดค่าทดสอบด่วน หรือพิมพ์เอง — ดูว่าเงื่อนไขไหนเป็นจริงแล้วคืนอะไร · ลอง “(ช่องว่าง 3 ตัว)” กับ validator ชื่อทั้งสองแบบ' },
        { t: 'code', title: 'validator และการกระตุ้น (ตำรา §8.7)', src: `TextFormField(
  decoration: const InputDecoration(labelText: 'รหัสผ่าน'),
  obscureText: true,
  validator: (String? value) { // ฟังก์ชัน Validator
    if (value == null || value.isEmpty) {
      return 'รหัสผ่านต้องไม่ว่างเปล่า'; // คืนข้อความข้อผิดพลาดหากไม่ถูกต้อง
    }
    if (value.length < 6) {
      return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }
    return null; // คืนค่า null หากถูกต้อง
  },
)

// ภายใน callback onPressed ของปุ่ม
ElevatedButton(
  onPressed: () {
    // validate() คืนค่า true หากฟอร์มถูกต้อง หรือ false หากไม่ถูกต้อง
    if (_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('กำลังประมวลผลข้อมูล')),
      );
      // อาจจะเรียก _formKey.currentState!.save() ที่นี่
    } else {
      // หากฟอร์มไม่ถูกต้อง ข้อความข้อผิดพลาดจะแสดงขึ้น
      print('ฟอร์มไม่ถูกต้อง');
    }
  },
  child: const Text('Submit'),
)`, notes: [
          { at: 'validator: (String? value)', note: '`String?` = อาจเป็น null — จึงต้องเช็ก `value == null` ก่อนเรียก `.isEmpty`' },
          { at: 'return null; // คืนค่า null', note: '“null ในที่นี้ไม่ได้แปลว่าระบบพัง แต่แปลว่า **ไม่มีข้อผิดพลาด**” (ตำรา)' },
          { at: 'if (_formKey.currentState!.validate())', note: '`!` = ยืนยันว่าไม่ null — ถ้า Form ยังไม่ถูก build หรือถูกถอดไปแล้วจะพัง แบบปลอดภัยกว่า: `_formKey.currentState != null && _formKey.currentState!.validate()`' },
        ] },
        { t: 'why', choice: 'validator คืน **ข้อความ** (หรือ null) แทนที่จะคืน true/false',
          because: ['ฟังก์ชันเดียวทำสองหน้าที่: **ตัดสิน** ว่าผ่านไหม และ **อธิบาย** ว่าต้องแก้อย่างไร', 'TextFormField เอาข้อความไปแสดงใต้ช่อง + เปลี่ยนขอบเป็นสีแดงให้เอง — เราไม่ต้องวาด error เอง'],
          alts: [
            { alt: 'ทำไมไม่เขียนข้อความสั้นๆ ว่า “ไม่ถูกต้อง” ก็พอ?', result: 'ผู้ใช้ไม่รู้ว่าต้องแก้อะไร ตำราแนะนำให้ข้อความ **บอกวิธีแก้** เช่น “รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร” ดีกว่า “รหัสผ่านไม่ถูกต้อง”' },
          ] },
        { t: 'callout', kind: 'note', title: 'Validation ไม่เกิดเอง', body: 'ถ้า `autovalidateMode` ยังเป็นค่าเริ่มต้น การตรวจจะเกิดก็ต่อเมื่อเรียก `validate()` บน FormState เท่านั้น ([[8.5]])' },
      ],
      quiz: [
        { q: 'validator คืนค่า `null` หมายความว่าอะไร?', options: [
          { t: 'ค่าในช่องผ่านการตรวจ ไม่มีข้อผิดพลาด', ok: true },
          { t: 'validator ทำงานผิดพลาด', why: 'null ไม่ได้แปลว่าพัง' },
          { t: 'ให้ข้ามช่องนี้ไปไม่ต้องบันทึก', why: 'ไม่เกี่ยวกับการบันทึก' },
        ] },
        { type: 'spot', q: 'validator นี้ทำให้ช่องอีเมล “ไม่เคยผ่าน” เลย — บรรทัดไหนผิด?', code: `validator: (value) {
  if (value == null || value.isEmpty) {
    return 'กรุณาป้อนอีเมลของคุณ';
  }
  if (!value.contains('@')) {
    return 'กรุณาป้อนที่อยู่อีเมลที่ถูกต้อง';
  }
  return 'ผ่าน';
},`, bad: "return 'ผ่าน';", explain: 'การคืน String ใดๆ แปลว่า “ไม่ผ่าน” (และแสดงคำว่า “ผ่าน” เป็น error สีแดง!) — กรณีถูกต้องต้อง `return null;`' },
        { q: 'ข้อความ error ใดเหมาะที่สุดตามแนวทางของตำรา?', options: [
          { t: '“รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร”', ok: true, why: 'บอกวิธีแก้ชัดเจน' },
          { t: '“รหัสผ่านไม่ถูกต้อง”', why: 'ไม่บอกว่าต้องแก้อะไร' },
          { t: '“Error 422”', why: 'ผู้ใช้ไม่เข้าใจ' },
        ] },
      ],
    },
    // ─────────────────────────── 8.8
    {
      id: '8.8', title: 'การบันทึกข้อมูล Form: onSaved และ FormState.save()', source: '§8.8',
      gist: '`save()` = **เป่านกหวีดรวมพล** เรียก `onSaved` ของทุกช่องให้เก็บค่าลงตัวแปร · เรียก **หลัง** `validate()` ผ่านแล้ว · `save()` **ไม่ได้บันทึกลงเครื่อง** — ค่าหายเมื่อปิดหน้าจอ (บันทึกถาวรคือบทที่ 13)',
      blocks: [
        { t: 'viz', id: 'ch08.save', title: 'นกหวีดรวมพล', try: 'กดปุ่มฟ้า (สังเกตว่าชื่อบนจอไม่เปลี่ยน) → เปิดสวิตช์ “แสดงชื่อบนจอด้วย setState” แล้วกดอีกครั้ง → กด “ปิดหน้าจอ”' },
        { t: 'code', title: 'onSaved + save() (ตำรา §8.8)', src: `// ภายใน _MyFormState: ตัวแปรสำหรับเก็บค่าที่บันทึก
String _savedName = '';

// ภายในเมธอด build
TextFormField(
  decoration: const InputDecoration(labelText: 'ชื่อ'),
  validator: (value) {
    if (value == null || value.trim().isEmpty) {
      return 'กรุณาป้อนชื่อ';
    }
    return null;
  },
  onSaved: (value) {
    // ถูกเรียกเมื่อ _formKey.currentState!.save() ทำงานเท่านั้น
    _savedName = value?.trim() ?? '';
  },
),

// ภายใน onPressed ของปุ่ม submit, หลังจาก validation ผ่าน
if (_formKey.currentState!.validate()) {
  // ฟอร์มถูกต้อง, ตอนนี้บันทึกฟิลด์ต่างๆ
  _formKey.currentState!.save(); // นี่จะเรียก callbacks onSaved ทั้งหมด

  // ตอนนี้คุณสามารถใช้ค่าที่บันทึกไว้ได้ (เช่น _savedName)
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('บันทึกข้อมูลแล้ว! ชื่อ: $_savedName')),
  );
}`, notes: [
          { at: '_savedName = value?.trim() ?? \'\';', note: '`value?.trim()` = ถ้า value เป็น null ได้ null (ไม่พัง) · `?? \'\'` = ถ้าซ้ายเป็น null ใช้ค่าว่างแทน ([[dart]])' },
          { at: '_formKey.currentState!.save(); // นี่จะเรียก', note: 'เรียก **หลัง** validate() คืน true เท่านั้น — จึงมั่นใจว่าค่าที่เก็บผ่านการตรวจแล้ว' },
          { at: "SnackBar(content: Text('บันทึกข้อมูลแล้ว! ชื่อ: $_savedName'))", note: 'ใช้ `_savedName` ทันทีในฟังก์ชันเดียวกัน จึง **ไม่ต้อง setState** (ไม่ได้แสดงใน build)' },
        ] },
        { t: 'why', choice: 'เรียก `validate()` ก่อน แล้วค่อย `save()`',
          because: ['onSaved ได้ค่าที่ “ผ่านการตรวจแล้ว” เสมอ', 'ไม่มีข้อมูลผิดหลุดเข้าตัวแปรที่จะถูกส่งต่อ'],
          alts: [
            { alt: 'ทำไมไม่เรียก save() ก่อน?', result: 'ค่าที่ยังไม่ถูกตรวจจะถูกเก็บลงตัวแปรไปแล้ว ถ้าโค้ดถัดไปเผลอใช้ตัวแปรนั้น ข้อมูลผิดจะหลุดออกไป' },
            { alt: 'ทำไมโค้ดตัวอย่างไม่เรียก setState ใน onSaved?', result: 'ไม่จำเป็น เพราะ `_savedName` ถูกใช้ทันทีเพื่อสร้าง SnackBar ไม่ได้แสดงใน build — ถ้าจะแสดงบนจอต้องกำหนดค่าใน setState ([[7.6]])', viz: null },
          ] },
        { t: 'callout', kind: 'warn', title: '`save()` ไม่ได้บันทึกอะไรลงเครื่อง', body: 'ชื่อเมธอดชวนเข้าใจผิด — `save()` แค่ไล่เรียก onSaved ทุกช่อง ค่ายังอยู่ในตัวแปรของ State และ **หายไปเมื่อผู้ใช้ปิดหน้าจอหรือปิดแอป** การเก็บถาวรเรียนในบทที่ 13 ([[13.1]])' },
      ],
      quiz: [
        { q: 'ข้อใดถูกต้องเกี่ยวกับ `FormState.save()`?', options: [
          { t: 'เรียก onSaved ของทุก FormField ใน Form — ค่ายังอยู่แค่ในหน่วยความจำ', ok: true },
          { t: 'บันทึกค่าทุกช่องลงฐานข้อมูลในเครื่อง', why: 'ไม่ได้บันทึกลงเครื่อง (บทที่ 13)' },
          { t: 'ตรวจความถูกต้องของทุกช่อง', why: 'นั่นคือ validate()' },
        ] },
        { type: 'order', q: 'เรียงขั้นตอนใน onPressed ของปุ่ม submit ให้ถูก', items: ['`if (_formKey.currentState!.validate())`', '`_formKey.currentState!.save();`', 'onSaved ของแต่ละช่องเก็บค่าลงตัวแปร', 'ใช้ตัวแปรที่เก็บไว้ (เช่นแสดง SnackBar)'] },
      ],
    },
    // ─────────────────────────── 8.9
    {
      id: '8.9', title: 'วิดเจ็ต Input อื่นๆ (ภาพรวมสั้นๆ)', source: '§8.9',
      gist: 'Checkbox, Radio, Switch, Slider, Dropdown, DatePicker ทำงานบนแนวคิดเดียวกัน (onChanged → setState) แต่ **Checkbox / Radio / Switch / Slider / DropdownButton ธรรมดา “ไม่ใช่ FormField”** → `validate()` / `save()` มองไม่เห็น',
      blocks: [
        { t: 'viz', id: 'ch08.formfields', title: 'Form มองเห็นใครบ้าง?', try: 'กดฉายแสง แล้วดูว่าวิดเจ็ตไหนสว่าง' },
        { t: 'kv', items: [
          ['Checkbox / CheckboxListTile', 'ค่า bool — จัดการสถานะใน StatefulWidget'],
          ['Radio / RadioListTile', 'เลือกหนึ่งจากกลุ่ม — ตั้งแต่ Flutter 3.32 ห่อด้วย **RadioGroup** ที่ถือ `groupValue` และ `onChanged` แทน Radio แต่ละตัว'],
          ['Switch / SwitchListTile', 'เปิด/ปิด คล้าย Checkbox'],
          ['Slider', 'เลือกค่าจากช่วงต่อเนื่อง'],
          ['DropdownButtonFormField', 'dropdown ที่ผสานกับ Form — กำหนดค่าเริ่มต้นด้วย **`initialValue`** (`value` เดิมถูกเลิกใช้ตั้งแต่ Flutter 3.33)'],
          ['showDatePicker / showTimePicker', 'ฟังก์ชันเปิด dialog เลือกวัน/เวลาแบบเนทีฟ'],
        ] },
        { t: 'code', title: 'รูปแบบปัจจุบัน (ตำรา §8.9)', src: `// ภายใน State ของ StatefulWidget
bool _agree = false;
String _size = 'M';
String _faculty = 'วิศวกรรมศาสตร์';

// ภายในเมธอด build
Column(
  children: [
    CheckboxListTile(
      title: const Text('ยอมรับเงื่อนไขการใช้งาน'),
      value: _agree,
      onChanged: (value) => setState(() => _agree = value ?? false),
    ),
    // RadioGroup ถือค่าที่เลือกและรับ onChanged แทน Radio แต่ละตัว
    RadioGroup<String>(
      groupValue: _size,
      onChanged: (value) => setState(() => _size = value!),
      child: const Column(
        children: [
          RadioListTile<String>(value: 'S', title: Text('เล็ก')),
          RadioListTile<String>(value: 'M', title: Text('กลาง')),
          RadioListTile<String>(value: 'L', title: Text('ใหญ่')),
        ],
      ),
    ),
    DropdownButtonFormField<String>(
      initialValue: _faculty,
      decoration: const InputDecoration(labelText: 'คณะ'),
      items: const [
        DropdownMenuItem(value: 'วิศวกรรมศาสตร์', child: Text('วิศวกรรมศาสตร์')),
        DropdownMenuItem(value: 'วิทยาศาสตร์', child: Text('วิทยาศาสตร์')),
      ],
      onChanged: (value) => setState(() => _faculty = value!),
    ),
  ],
)`, notes: [
          { at: 'onChanged: (value) => setState(() => _agree = value ?? false),', note: 'Checkbox ไม่ใช่ FormField → ต้องเก็บสถานะเองด้วย setState' },
          { at: 'RadioGroup<String>(', note: 'โค้ดเก่าในอินเทอร์เน็ตใส่ `groupValue`/`onChanged` ที่ Radio แต่ละตัว — IDE จะขีดฆ่าเพราะเลิกใช้แล้ว' },
          { at: 'initialValue: _faculty,', note: 'Flutter รุ่นก่อน 3.33 ใช้ `value:` — ถ้าเครื่องสอบใช้ Flutter เก่า `initialValue` จะ compile ไม่ผ่าน (ตรวจรุ่นด้วย `flutter --version`)' },
        ] },
        { t: 'why', choice: 'ใช้ **DropdownButtonFormField** (หรือห่อด้วย `FormField`) เมื่อ input ต้องถูกตรวจ/บันทึกพร้อมช่องอื่น',
          because: ['มี validator / onSaved เหมือน TextFormField', '`validate()` ครั้งเดียวตรวจครบทุกช่องจริง'],
          alts: [
            { alt: 'ทำไมไม่ใช้ DropdownButton ธรรมดา แล้วตรวจเองตอนกดส่ง?', result: 'Form มองไม่เห็น → validate()/save()/reset() ไม่ครอบคลุม ต้องเขียนเช็กแยกและวาด error เอง', ok: 'dropdown ที่ไม่ได้อยู่ในฟอร์ม เช่น ตัวเลือกเรียงลำดับรายการ' },
          ] },
      ],
      quiz: [
        { q: 'ข้อใดเป็น FormField ที่ Form เรียก validate() ได้?', options: [
          { t: '`DropdownButtonFormField`', ok: true },
          { t: '`DropdownButton`', why: 'รุ่นธรรมดาไม่ใช่ FormField' },
          { t: '`Switch`', why: 'ไม่ใช่ FormField' },
        ] },
        { q: 'ตั้งแต่ Flutter 3.32 ค่าที่เลือกของกลุ่ม Radio ควรเก็บไว้ที่ไหนตามตำรา?', options: [
          { t: '`RadioGroup(groupValue: …, onChanged: …)` ที่ห่อกลุ่ม', ok: true },
          { t: '`groupValue` บน Radio ทุกตัว', why: 'รูปแบบเก่า ถูกเลิกใช้' },
          { t: 'ใน GlobalKey', why: 'ไม่เกี่ยว' },
        ] },
      ],
    },
    // ─────────────────────────── 8.10
    {
      id: '8.10', title: 'ฟอร์มบนหน้าจอมือถือ: คีย์บอร์ด โฟกัส และพื้นที่หน้าจอ', source: '§8.10', exam: true,
      gist: 'คีย์บอร์ดกินพื้นที่เกือบครึ่งจอ → Scaffold หด body (`resizeToAvoidBottomInset: true`) → **Column ที่เลื่อนไม่ได้ล้น** (แถบเหลืองดำ) → แก้ด้วย **SingleChildScrollView** · `keyboardType` แค่เลือกคีย์บอร์ด **ไม่กรองข้อมูล** ต้องใช้ `inputFormatters`',
      blocks: [
        { t: 'viz', id: 'ch08.keyboard', name: 'kb', title: 'คีย์บอร์ดขึ้นแล้วฟอร์มเป็นอย่างไร', try: 'โหมด Column: แตะช่องรหัสผ่าน → แถบเหลืองดำ ปุ่มล็อกอินหาย · สลับเป็น SingleChildScrollView แล้วลองใหม่ (เลื่อนได้) · ลองปุ่ม next/done บนคีย์บอร์ด และปุ่ม “วาง” ด้านขวา' },
        'ตำราทดสอบจริง: หน้าจอ 320×480 กับคีย์บอร์ดสูง 260 จุด ฟอร์มล้นไป **147 จุด** ปุ่มล็อกอินถูกตัดหายจนกดไม่ได้ และ Flutter แสดง `A RenderFlex overflowed by ... pixels on the bottom`',
        { t: 'code', title: 'ทำให้เนื้อหาเลื่อนได้', src: `body: SingleChildScrollView( // เลื่อนได้เมื่อคีย์บอร์ดบังพื้นที่
  padding: const EdgeInsets.all(20.0),
  child: Form(
    key: _formKey,
    child: Column(
      children: [ /* ... ช่องกรอกและปุ่มเหมือนเดิม ... */ ],
    ),
  ),
),` },
        { t: 'kv', items: [
          ['keyboardType', 'เลือก **หน้าตา** คีย์บอร์ด ไม่ได้กรอง — ผู้ใช้ยัง paste หรือใช้คีย์บอร์ดภายนอกได้'],
          ['inputFormatters', '**บังคับจริง** ทำงานก่อนข้อความถึงช่อง'],
          ['textInputAction', '`next` = ปุ่ม “ถัดไป” ย้ายโฟกัสอัตโนมัติ · `done` = ปุ่ม “เสร็จ” หุบคีย์บอร์ด (ใช้คู่ `onFieldSubmitted` ส่งฟอร์มได้เลย)'],
          ['FocusScope.of(context).unfocus()', 'หุบคีย์บอร์ดก่อนแสดงผล ไม่ให้บัง SnackBar · หรือใช้ `onTapOutside`'],
          ['autofillHints', 'บอกระบบว่าช่องนี้คืออะไร (`AutofillHints.email`, `.password`) ตัวจัดการรหัสผ่านเสนอกรอกให้'],
        ] },
        { t: 'code', title: 'ช่องเบอร์โทรที่กรองจริง (ตำรา §8.10)', src: `import 'package:flutter/services.dart'; // สำหรับ FilteringTextInputFormatter

TextFormField(
  decoration: const InputDecoration(labelText: 'เบอร์โทรศัพท์'),
  keyboardType: TextInputType.phone, // แสดงแป้นตัวเลข
  inputFormatters: [
    FilteringTextInputFormatter.digitsOnly, // รับเฉพาะตัวเลข แม้จะวางข้อความเข้ามา
    LengthLimitingTextInputFormatter(10),   // ไม่เกิน 10 หลัก
  ],
  textInputAction: TextInputAction.next,    // ปุ่ม "ถัดไป" บนคีย์บอร์ด
  onTapOutside: (_) => FocusScope.of(context).unfocus(), // แตะนอกช่องแล้วคีย์บอร์ดหุบ
),`, notes: [
          { at: "import 'package:flutter/services.dart';", note: 'formatter อยู่ใน `services.dart` ไม่ใช่ `material.dart` — ลืม import แล้วจะหา `FilteringTextInputFormatter` ไม่เจอ' },
          { at: 'FilteringTextInputFormatter.digitsOnly,', note: 'วาง `08a-12 3456789` → เหลือ `0812345678` ทันที' },
        ] },
        { t: 'why', choice: 'ห่อฟอร์มด้วย **SingleChildScrollView** (หรือใช้ ListView)',
          because: ['เมื่อ body หดเพราะคีย์บอร์ด เนื้อหายังเลื่อนไปถึงปุ่มได้เสมอ', 'ไม่มีแถบ overflow และไม่มีปุ่มที่กดไม่ได้'],
          alts: [
            { alt: 'ทำไมไม่ใช้ Column ใน Padding ตามเดิม?', result: 'บนจอเล็ก/แนวนอน ฟอร์มล้น ปุ่มถูกตัดหายจนกดไม่ได้', viz: { name: 'kb', mode: 'column' } },
            { alt: 'ตั้ง `resizeToAvoidBottomInset: false` ให้ body ไม่หดได้ไหม? (เสริม)', result: 'แถบ overflow หายก็จริง แต่ **คีย์บอร์ดทับช่องกรอก** ผู้ใช้มองไม่เห็นว่ากำลังพิมพ์อะไร', ok: 'หน้าจอที่ตั้งใจให้คีย์บอร์ดซ้อนทับ เช่น พื้นหลังเต็มจอที่ไม่มีช่องกรอกด้านล่าง' },
          ] },
        { t: 'why', choice: 'ใช้ **inputFormatters** เมื่อต้องการ “บังคับ” รูปแบบข้อมูล',
          because: ['ทำงานก่อนข้อความถึงช่อง ข้อความผิดเข้ามาไม่ได้เลย', 'ต่างจาก validator ที่ปล่อยให้ข้อความผิดเข้าไปก่อนแล้วค่อยเตือน'],
          alts: [
            { alt: 'ทำไม `keyboardType: TextInputType.number` อย่างเดียวไม่พอ?', result: 'แค่เลือกแป้นตัวเลข ผู้ใช้ยัง paste ตัวอักษรหรือพิมพ์จากคีย์บอร์ดภายนอกได้' },
          ] },
      ],
      quiz: [
        { q: 'ฟอร์มล็อกอินที่เป็น `Padding > Form > Column` บนจอเล็ก เมื่อคีย์บอร์ดขึ้นจะเกิดอะไรตามตำรา?', options: [
          { t: 'แถบลายเหลืองดำ “RenderFlex overflowed” และปุ่มล็อกอินถูกตัดจนกดไม่ได้', ok: true },
          { t: 'ฟอร์มเลื่อนขึ้นอัตโนมัติ', why: 'Column ไม่เลื่อน ต้องห่อด้วย SingleChildScrollView' },
          { t: 'คีย์บอร์ดไม่ขึ้น', why: 'คีย์บอร์ดขึ้นปกติ ปัญหาคือพื้นที่' },
        ] },
        { q: 'ช่องเบอร์โทรใช้ `keyboardType: TextInputType.phone` อย่างเดียว ผู้ใช้วาง “08a-12 3456789” ผลคือ?', options: [
          { t: 'ข้อความทั้งหมดเข้าไปในช่องตามที่วาง', ok: true, why: 'keyboardType ไม่ได้กรอง' },
          { t: 'เหลือเฉพาะตัวเลข 0812345678', why: 'ต้องใช้ inputFormatters จึงจะกรอง' },
          { t: 'วางไม่ได้เลย', why: 'วางได้' },
        ] },
        { q: 'ต้องการให้กด “ถัดไป” บนคีย์บอร์ดแล้วโฟกัสไปช่องถัดไปอัตโนมัติ ใช้อะไร?', options: [
          { t: '`textInputAction: TextInputAction.next`', ok: true },
          { t: '`keyboardType: TextInputType.next`', why: 'ไม่มีค่านี้ และ keyboardType เลือกชนิดคีย์บอร์ด' },
          { t: '`autofillHints`', why: 'ใช้บอกชนิดข้อมูลให้ระบบเติมอัตโนมัติ' },
        ] },
      ],
    },
    // ─────────────────────────── 8.11
    {
      id: '8.11', title: 'TextEditingController หรือ onSaved: เลือกใช้อย่างไร', source: '§8.11', exam: true,
      gist: '**onSaved** = ต้องการค่าครั้งเดียวตอนกดส่ง (ไม่ต้อง dispose) · **controller** = ต้องอ่าน/แก้ค่าในเวลาอื่น (เติมค่าเดิม, `clear()`, ตอบสนองระหว่างพิมพ์, validator ที่อ่านอีกช่อง) · **initialValue** = แค่ค่าเริ่มต้น — **ห้ามใช้คู่กับ controller**',
      blocks: [
        'ตำราตั้งข้อสังเกตกับแลปของตัวเอง: แลปสร้าง controller ให้ทั้งสองช่อง แต่สุดท้ายอ่านค่าผ่าน onSaved และไม่เคยอ่าน `controller.text` เลย — คำตอบคือ **ไม่จำเป็นต้องมีทั้งสองอย่าง** มันคือสองช่องทางอ่านค่าคนละแบบ เลือกตามงาน',
        { t: 'viz', id: 'decision', title: 'ผังเลือกเครื่องมือ', props: { start: 'q1', nodes: {
          q1: { q: 'ต้องใช้ค่าของช่องนี้ **เมื่อไร**?', options: [{ label: 'ตอนกดส่งครั้งเดียว (หลังตรวจผ่าน)', next: 'q2' }, { label: 'ต้องอ่าน/แก้ระหว่างใช้งาน', next: 'q3' }, { label: 'แค่อยากใส่ค่าเริ่มต้น', next: 'rInit' }] },
          q2: { q: 'มี validator ของ **ช่องอื่น** ต้องอ่านค่าช่องนี้ไหม (เช่น ยืนยันรหัสผ่าน)?', options: [{ label: 'มี', next: 'rCtrl' }, { label: 'ไม่มี', next: 'rSaved' }] },
          q3: { q: 'ต้องทำอะไรระหว่างใช้งาน?', options: [{ label: 'เติมข้อมูลเดิมในหน้าแก้ไข', next: 'rCtrl' }, { label: 'ล้างช่องหลังส่ง', next: 'rCtrl' }, { label: 'ตอบสนองทุกครั้งที่พิมพ์', next: 'rCtrlOr' }] },
          rSaved: { result: 'ใช้ onSaved', why: 'ไม่มีออบเจกต์ที่ต้อง dispose และตรรกะการเก็บค่าอยู่ติดกับช่องที่เป็นเจ้าของ' },
          rCtrl: { result: 'ใช้ TextEditingController (และอย่าลืม dispose)', why: 'อ่าน/เขียนค่าได้ทุกเวลา รวมถึงระหว่างการตรวจของช่องอื่น' },
          rCtrlOr: { result: 'ใช้ controller + listener หรือแค่ onChanged', why: 'ถ้าสนใจเฉพาะการพิมพ์ของผู้ใช้ onChanged ตรงงานกว่า ([[8.3]])' },
          rInit: { result: 'ใช้ initialValue ของ TextFormField', why: 'ง่ายที่สุด — แต่ถ้าช่องนั้นมี controller อยู่แล้ว ให้ตั้งค่าผ่าน `controller.text` แทน (ใส่ทั้งคู่ = error ทันที)' },
        } } },
        { t: 'viz', id: 'ch08.confirm', name: 'cf', title: 'ทำไมช่องยืนยันรหัสผ่านต้องใช้ controller', try: 'กด “กดส่ง” ในแบบ controller (ผ่าน) แล้วสลับเป็นแบบ onSaved แล้วกดอีกครั้ง — ทั้งที่พิมพ์ตรงกันทุกตัว' },
        { t: 'code', title: 'ยืนยันรหัสผ่าน (ตำรา §8.11)', src: `// ภายใน State: controller ของช่องรหัสผ่าน (อย่าลืม dispose)
final _passwordController = TextEditingController();

// ภายใน Column ของ Form
TextFormField(
  controller: _passwordController,
  obscureText: true,
  decoration: const InputDecoration(labelText: 'รหัสผ่าน'),
),
TextFormField(
  obscureText: true,
  decoration: const InputDecoration(labelText: 'ยืนยันรหัสผ่าน'),
  validator: (value) {
    if (value != _passwordController.text) { // อ่านค่าของอีกช่องผ่าน controller
      return 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
    }
    return null;
  },
),`, hl: ['if (value != _passwordController.text)'] },
        { t: 'why', choice: 'ช่องยืนยันรหัสผ่าน **ต้อง** อ่านค่าช่องแรกผ่าน controller',
          because: ['validator ทุกช่องทำงาน **ระหว่าง** `validate()` ขณะที่ onSaved ทำงาน **หลัง** ตรวจผ่านแล้ว', 'controller มีค่าปัจจุบันของช่องแรกอยู่แล้วตลอดเวลา'],
          alts: [
            { alt: 'ทำไมไม่เทียบกับ `_savedPassword` ที่ได้จาก onSaved?', result: 'ตอนที่ validator ช่องยืนยันทำงาน onSaved ยังไม่เคยถูกเรียก `_savedPassword` จึงยังว่าง → ไม่ตรงกันทุกครั้ง ฟอร์มไม่มีวันผ่าน', viz: { name: 'cf', mode: 'onsaved' } },
          ] },
        { t: 'callout', kind: 'exam', title: 'ตัดช่องว่างก่อนตรวจเสมอ (ยกเว้นรหัสผ่าน)', body: '`value.isEmpty` ปล่อยข้อความ `"   "` ผ่าน เพราะไม่นับว่าว่าง → ช่องชื่อ/คำอธิบายให้ตรวจด้วย `value.trim().isEmpty` และเก็บค่าหลัง `trim()` (ตำราเตือนว่าในบทที่ 14–15 ถ้าลืมจุดนี้ รายการงานจะมีงานที่ไม่มีชื่อปะปนอยู่) — **ช่องรหัสผ่านห้าม trim** เพราะช่องว่างอาจเป็นส่วนหนึ่งของรหัสผ่านจริง ลองเทียบใน [[8.7|ภาพ validator]]' },
      ],
      quiz: [
        { q: 'ใส่ทั้ง `initialValue: "abc"` และ `controller: _c` ใน TextFormField เดียวกัน ผลคือ?', options: [
          { t: 'Flutter แจ้งข้อผิดพลาดทันที — ห้ามใช้คู่กัน', ok: true },
          { t: 'ใช้ initialValue เป็นค่าเริ่มต้นของ controller', why: 'ไม่ได้รวมกันให้ ต้องตั้ง `_c.text` เอง' },
          { t: 'controller ถูกละเลย', why: 'เกิด error ไม่ใช่ถูกละเลย' },
        ] },
        { q: 'หน้า “แก้ไขโปรไฟล์” ต้องเติมชื่อเดิมลงช่อง แล้วล้างช่องหลังบันทึก ควรใช้อะไร?', options: [
          { t: 'TextEditingController', ok: true, why: 'ต้องเขียนค่า (เติม) และสั่ง clear() — onSaved ทำไม่ได้' },
          { t: 'onSaved อย่างเดียว', why: 'onSaved อ่านค่าได้ตอนส่งเท่านั้น' },
          { t: 'initialValue อย่างเดียว', why: 'เติมได้ แต่ล้างช่องจากโค้ดไม่ได้' },
        ] },
        { q: 'ช่องชื่อใช้ validator `value.isEmpty` ผู้ใช้พิมพ์เว้นวรรค 3 ครั้ง ผลคือ?', options: [
          { t: 'ผ่านการตรวจ ได้ชื่อเป็นช่องว่าง — ควรใช้ `value.trim().isEmpty`', ok: true },
          { t: 'ไม่ผ่าน เพราะช่องว่างถือว่าว่าง', why: '"   " มีความยาว 3 ไม่ใช่ isEmpty' },
          { t: 'แอปพัง', why: 'ไม่พัง แต่ได้ข้อมูลผิด' },
        ] },
      ],
    },
    // ─────────────────────────── 8.12
    {
      id: '8.12', title: 'การตรวจสอบในแอปกับความปลอดภัยของข้อมูล', source: '§8.12',
      gist: 'validator ในแอปมีไว้เพื่อ **ประสบการณ์ผู้ใช้** (บอกเร็ว) — **ความปลอดภัยต้องตรวจซ้ำที่เซิร์ฟเวอร์ทุกครั้ง** · รหัสผ่าน: obscureText ไม่ใช่การเข้ารหัส, ห้าม print/แสดง, ล้างช่องหลังใช้, ส่งผ่าน HTTPS',
      blocks: [
        { t: 'viz', id: 'ch08.security', title: 'ใครผ่านด่านไหน', try: 'กดยิงตรงตอนเซิร์ฟเวอร์ตรวจซ้ำ แล้วปิดสวิตช์แล้วยิงอีกครั้ง · ด้านล่าง: กด “สมัคร” ด้วยอีเมลเดิมแล้วพิมพ์แก้' },
        'ผู้ไม่หวังดีไม่จำเป็นต้องผ่านหน้าจอของเรา — เขาส่งคำขอตรงไปที่เซิร์ฟเวอร์ด้วยเครื่องมืออื่น หรือแก้ตัวแอปแล้วติดตั้งใหม่ก็ได้ (ตำราอ้าง OWASP Input Validation Cheat Sheet)',
        { t: 'code', title: 'แสดงข้อผิดพลาดจากเซิร์ฟเวอร์ด้วย forceErrorText', src: `// ภายใน State
String? _emailServerError; // ข้อผิดพลาดที่ได้จากเซิร์ฟเวอร์

// ภายในเมธอด build
TextFormField(
  decoration: const InputDecoration(labelText: 'อีเมล'),
  forceErrorText: _emailServerError,
  onChanged: (_) {
    // ผู้ใช้เริ่มแก้แล้ว ล้างข้อผิดพลาดเดิมออก
    if (_emailServerError != null) {
      setState(() => _emailServerError = null);
    }
  },
),

// เมื่อเซิร์ฟเวอร์ตอบว่าอีเมลซ้ำ
setState(() => _emailServerError = 'อีเมลนี้มีผู้ใช้แล้ว');`, notes: [
          { at: 'forceErrorText: _emailServerError,', note: 'เมื่อไม่เป็น null จะแสดง **แทน** ผลของ validator — ใช้กับเงื่อนไขที่มีแต่เซิร์ฟเวอร์ตอบได้' },
        ] },
        { t: 'h', text: 'ข้อควรจำ 4 ข้อเรื่องรหัสผ่าน' },
        { t: 'list', ordered: true, items: [
          '**obscureText ไม่ใช่การเข้ารหัส** — แค่แสดงจุดบนจอ ค่าใน controller/ตัวแปรเป็นข้อความธรรมดา',
          '**ห้ามพิมพ์รหัสผ่านลง console หรือแสดงบนจอ** — log จาก `print` บน Android อ่านได้ผ่าน `adb logcat` และ SnackBar อาจติดไปในภาพหน้าจอ ถ้าอยากยืนยันว่าได้ค่ามา ให้พิมพ์แค่ความยาว',
          '**ล้างช่องรหัสผ่านเมื่อใช้งานเสร็จ** — `_passwordController.clear()` หลังส่ง ไม่ให้ค้างถ้าผู้ใช้วางเครื่องทิ้งไว้',
          '**การตรวจอีเมลในบทนี้หลวมโดยตั้งใจ** — regex ที่เข้มเกินไปมักปฏิเสธอีเมลที่ถูกต้องจริง วิธีเดียวที่ยืนยันได้คือส่งอีเมลยืนยันให้ผู้ใช้กด',
        ] },
        { t: 'why', choice: 'ไม่ต้องเข้ารหัสรหัสผ่านในแอปเอง — ทำให้มัน **มีชีวิตสั้นที่สุด** แล้วส่งผ่าน HTTPS ให้เซิร์ฟเวอร์เก็บแบบ hash',
          because: ['String ใน Dart เปลี่ยนไม่ได้ (immutable) จึง “เขียนทับเพื่อลบ” ออกจากหน่วยความจำไม่ได้', 'HTTPS เข้ารหัสระหว่างทางให้แล้ว และเซิร์ฟเวอร์เป็นผู้เก็บในรูปที่ถูก hash'],
          alts: [
            { alt: 'ทำไมไม่เข้ารหัสรหัสผ่านในแอปก่อนส่ง?', result: 'ไม่ได้เพิ่มความปลอดภัยเมื่อใช้ HTTPS อยู่แล้ว และกุญแจที่ใช้เข้ารหัสก็ต้องอยู่ในแอปซึ่งถูกแกะได้' },
            { alt: 'ทำไมไม่ใช้ regex ตรวจอีเมลให้เข้มๆ?', result: 'มักปฏิเสธอีเมลที่ถูกต้องจริง ผู้ใช้ตัวจริงสมัครไม่ได้', ok: 'ไม่มี — ยืนยันด้วยอีเมลยืนยันเท่านั้น' },
          ] },
        { t: 'callout', kind: 'exam', title: 'เชื่อมไปบทที่ 13', body: 'ข้อความที่ผู้ใช้พิมพ์ต้องถือว่า **ไม่น่าไว้วางใจเสมอ** เมื่อนำไปประกอบเป็นคำสั่งอื่น — คำสั่ง SQL ต้องส่งค่าผ่าน `whereArgs` ห้ามต่อสตริงเข้ากับคำสั่งโดยตรง ([[13.6]])' },
      ],
      quiz: [
        { q: 'ทำไม validator ในแอปจึงยังไม่พอสำหรับความปลอดภัย?', options: [
          { t: 'ผู้ไม่หวังดีส่งคำขอตรงไปเซิร์ฟเวอร์ได้โดยไม่ผ่านหน้าจอของเรา', ok: true },
          { t: 'validator ทำงานช้าเกินไป', why: 'ไม่ใช่เรื่องความเร็ว' },
          { t: 'validator ตรวจได้แค่ข้อความภาษาอังกฤษ', why: 'ตรวจอะไรก็ได้ที่เขียน' },
        ] },
        { type: 'spot', q: 'โค้ดนี้มีจุดที่รั่วรหัสผ่าน — บรรทัดไหน?', code: `void _submit() {
  if (_formKey.currentState!.validate()) {
    _formKey.currentState!.save();
    debugPrint('อีเมล: $_savedEmail');
    debugPrint('รหัสผ่าน: $_savedPassword');
    _passwordController.clear();
  }
}`, bad: "debugPrint('รหัสผ่าน: $_savedPassword');", explain: 'log อ่านได้ผ่าน `adb logcat` — ให้พิมพ์แค่ `_savedPassword.length`' },
        { q: '`forceErrorText` เหมาะกับข้อผิดพลาดแบบใด?', options: [
          { t: 'เงื่อนไขที่มีแต่เซิร์ฟเวอร์ตอบได้ เช่น อีเมลนี้มีผู้ใช้แล้ว', ok: true },
          { t: 'ตรวจว่าช่องว่างหรือไม่', why: 'validator ทำได้เองในแอป' },
          { t: 'เข้ารหัสรหัสผ่าน', why: 'ไม่เกี่ยว' },
        ] },
      ],
    },
    // ─────────────────────────── Lab
    {
      id: 'lab8', title: 'ปฏิบัติการบทที่ 8: ฟอร์มล็อกอิน', short: 'แลป', source: 'ปฏิบัติการ', exam: true,
      gist: 'สร้าง `LoginFormScreen` ครบ 5 แบบฝึกหัด: Form + GlobalKey → TextFormField + controller → validator → onSaved/save() → ปรับให้พร้อมใช้บนมือถือ',
      blocks: [
        { t: 'viz', id: 'ch08.pipeline', props: { full: true }, title: 'ฟอร์มล็อกอินเวอร์ชันสุดท้าย (แบบฝึกหัด 5)', try: 'กดล็อกอินตอนว่าง → แก้ทีละช่อง สังเกตว่าสีแดงหายทันทีที่แก้ถูก (onUserInteractionIfError) · กด Enter ที่ช่องอีเมล (next) และช่องรหัสผ่าน (done → ส่ง) · ใช้ค่าตัวอย่าง “ถูกต้อง” ซึ่งมีช่องว่างหัวท้าย' },
        { t: 'steps', items: [
          '**Setup**: สร้าง `lib/login_form_screen.dart` (StatefulWidget) และตั้งเป็น `home` ใน MaterialApp',
          '**แบบฝึกหัด 1**: สร้าง `_formKey` แล้ววาง `Padding > Form(key) > Column(stretch)`',
          '**แบบฝึกหัด 2**: `late final` controller สองตัว สร้างใน initState, dispose ใน dispose, เพิ่มช่องอีเมล (emailAddress) และรหัสผ่าน (obscureText)',
          '**แบบฝึกหัด 3**: validator อีเมล (ว่าง / ไม่มี @ หรือ .) และรหัสผ่าน (ว่าง / < 6) + ปุ่มที่เช็ก `currentState != null && validate()`',
          '**แบบฝึกหัด 4**: `_savedEmail`, `_savedPassword` + onSaved + `save()` แล้วแสดงอีเมลใน SnackBar และพิมพ์แค่ **ความยาว** รหัสผ่าน',
          '**แบบฝึกหัด 5**: SingleChildScrollView, next/done, autofillHints, `_submit()` ที่เริ่มด้วย `unfocus()`, ปุ่มรูปตา (ต้องเอา `const` ออกจาก InputDecoration), `onUserInteractionIfError`, `trim()` อีเมล, `clear()` รหัสผ่าน, `debugPrint`',
        ] },
        { t: 'code', title: 'lib/login_form_screen.dart — ทั้งไฟล์หลังแบบฝึกหัด 5', src: `import 'package:flutter/material.dart';

class LoginFormScreen extends StatefulWidget {
  const LoginFormScreen({super.key});

  @override
  State<LoginFormScreen> createState() => _LoginFormScreenState();
}

class _LoginFormScreenState extends State<LoginFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;
  String _savedEmail = '';
  String _savedPassword = '';
  bool _obscurePassword = true; // สถานะซ่อน/แสดงรหัสผ่าน

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submit() {
    FocusScope.of(context).unfocus(); // ซ่อนคีย์บอร์ดก่อนแสดงผล
    if (_formKey.currentState != null && _formKey.currentState!.validate()) {
      _formKey.currentState!.save();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('ล็อกอินสำเร็จ! อีเมล: $_savedEmail')),
      );
      debugPrint('อีเมลที่บันทึก: $_savedEmail');
      debugPrint('ความยาวรหัสผ่าน: \${_savedPassword.length} ตัวอักษร'); // ห้ามพิมพ์รหัสผ่านจริง
      _passwordController.clear(); // ล้างรหัสผ่านออกจากช่องหลังใช้งาน
    } else {
      debugPrint('ฟอร์มไม่ถูกต้อง');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ฟอร์มล็อกอิน')),
      body: SingleChildScrollView( // เลื่อนได้เมื่อคีย์บอร์ดบังพื้นที่
        padding: const EdgeInsets.all(20.0),
        child: Form(
          key: _formKey,
          // ยังไม่ตรวจจนกว่าจะกดส่งครั้งแรก หลังจากนั้นตรวจใหม่ทุกครั้งที่แก้ช่องที่มีข้อผิดพลาด
          autovalidateMode: AutovalidateMode.onUserInteractionIfError,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              const Text(
                'กรุณาป้อนข้อมูลเข้าระบบ:',
                style: TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(
                  labelText: 'อีเมล',
                  hintText: 'you@example.com',
                  prefixIcon: Icon(Icons.email),
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next, // ปุ่มบนคีย์บอร์ดเป็น "ถัดไป"
                autofillHints: const [AutofillHints.email],
                validator: (value) {
                  final email = value?.trim() ?? '';
                  if (email.isEmpty) {
                    return 'กรุณาป้อนอีเมลของคุณ';
                  }
                  if (!email.contains('@') || !email.contains('.')) {
                    return 'กรุณาป้อนที่อยู่อีเมลที่ถูกต้อง';
                  }
                  return null;
                },
                onSaved: (value) {
                  _savedEmail = value?.trim() ?? '';
                },
              ),
              const SizedBox(height: 15),
              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(
                  labelText: 'รหัสผ่าน',
                  hintText: 'ป้อนรหัสผ่านของคุณ',
                  prefixIcon: const Icon(Icons.lock),
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: Icon(_obscurePassword ? Icons.visibility : Icons.visibility_off),
                    tooltip: _obscurePassword ? 'แสดงรหัสผ่าน' : 'ซ่อนรหัสผ่าน',
                    onPressed: () {
                      setState(() {
                        _obscurePassword = !_obscurePassword;
                      });
                    },
                  ),
                ),
                obscureText: _obscurePassword,
                textInputAction: TextInputAction.done, // ปุ่มบนคีย์บอร์ดเป็น "เสร็จ"
                autofillHints: const [AutofillHints.password],
                onFieldSubmitted: (_) => _submit(), // กด "เสร็จ" แล้วส่งฟอร์มทันที
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'กรุณาป้อนรหัสผ่านของคุณ';
                  }
                  if (value.length < 6) {
                    return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
                  }
                  return null;
                },
                onSaved: (value) {
                  _savedPassword = value ?? '';
                },
              ),
              const SizedBox(height: 30),
              ElevatedButton(
                onPressed: _submit,
                child: const Text('ล็อกอิน'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}`, maxHeight: '520px', notes: [
          { at: 'final _formKey = GlobalKey<FormState>();', note: 'ฟิลด์ของ State — ไม่สร้างใน build ([[8.6]])' },
          { at: 'void _submit() {', note: 'แยกเป็นเมธอดเพื่อใช้ทั้งใน `onPressed` และ `onFieldSubmitted` (ไม่เขียนซ้ำ) — ต้องอยู่ในคลาส State เพื่อเข้าถึง `context`' },
          { at: 'FocusScope.of(context).unfocus();', note: 'หุบคีย์บอร์ดก่อน ไม่ให้บัง SnackBar' },
          { at: '_passwordController.clear();', note: 'นี่คือเหตุผลเดียวที่ช่องรหัสผ่านยัง “ต้องมี” controller ในแลปนี้ — ค่าที่ใช้จริงอ่านจาก onSaved' },
          { at: 'autovalidateMode: AutovalidateMode.onUserInteractionIfError,', note: 'ไม่จู้จี้ก่อนกดส่ง และสีแดงหายทันทีที่แก้ถูก ([[8.5]])' },
          { at: 'final email = value?.trim() ?? \'\';', note: 'trim ก่อนตรวจ → `"  you@example.com "` ผ่าน และ `"   "` ถูกปฏิเสธ' },
          { at: 'decoration: InputDecoration(\n', note: '' },
          { at: 'suffixIcon: IconButton(', note: 'ค่าเปลี่ยนตาม `_obscurePassword` → InputDecoration ของช่องนี้ **ต้องไม่มี const** (แต่ Icon/Border ข้างในยังใส่ const ได้)' },
          { at: 'onFieldSubmitted: (_) => _submit(),', note: 'ชื่อที่ถูกของ TextFormField คือ `onFieldSubmitted`' },
          { at: '_savedPassword = value ?? \'\';', note: 'รหัสผ่าน **ไม่ trim**' },
        ].filter((n) => n.note) },
        { t: 'h', text: 'ผลลัพธ์ที่คาดหวัง' },
        { t: 'rules', items: [
          'คีย์บอร์ดขึ้นแล้วฟอร์มเลื่อนได้ ไม่มีแถบเหลืองดำ เลื่อนไปกดปุ่มล็อกอินได้เสมอ',
          '“ถัดไป” ที่ช่องอีเมล → โฟกัสไปช่องรหัสผ่าน · “เสร็จ” ที่ช่องรหัสผ่าน → ส่งฟอร์มทันที คีย์บอร์ดหุบ',
          'แตะไอคอนรูปตาเพื่อสลับซ่อน/แสดงรหัสผ่าน',
          'ก่อนกดส่งครั้งแรกไม่มีสีแดง หลังกดส่งแล้วผิด สีแดงหายทันทีที่แก้ถูก',
          '`" you@example.com "` ผ่านและ SnackBar แสดงแบบไม่มีช่องว่าง · ช่องที่มีแต่ช่องว่างถูกปฏิเสธ',
          'หลังส่งสำเร็จ ช่องรหัสผ่านว่าง และ console แสดงแค่ความยาวรหัสผ่าน',
        ] },
        { t: 'callout', kind: 'note', title: 'SnackBar สีเทาเข้ม', body: 'SnackBar ของ Material 3 มีพื้นสีเทาเข้มเป็นค่าเริ่มต้น ถ้าต้องการสีอื่นให้กำหนด `backgroundColor` เอง (ตำราหมายเหตุไว้ในแบบฝึกหัด 3)' },
      ],
      quiz: [
        { q: 'ในแบบฝึกหัด 5 ทำไมต้องเอา `const` ออกจาก `InputDecoration` ของช่องรหัสผ่าน?', options: [
          { t: 'เพราะ suffixIcon และ tooltip ขึ้นกับ `_obscurePassword` ที่เปลี่ยนได้', ok: true },
          { t: 'เพราะช่องรหัสผ่านใช้ controller', why: 'controller อยู่ที่ TextFormField ไม่ได้อยู่ใน decoration' },
          { t: 'เพราะ const ใช้กับ OutlineInputBorder ไม่ได้', why: 'border ยัง const ได้ (`const OutlineInputBorder()`)' },
        ] },
        { q: 'เหตุใดแลปจึงย้ายโค้ดใน onPressed ไปเป็นเมธอด `_submit()`?', options: [
          { t: 'เพื่อเรียกใช้ซ้ำทั้งจากปุ่มและจาก `onFieldSubmitted` ของช่องรหัสผ่าน', ok: true },
          { t: 'เพราะ onPressed รับโค้ดหลายบรรทัดไม่ได้', why: 'รับได้' },
          { t: 'เพื่อให้ทำงานแบบ async', why: '_submit ไม่ได้เป็น async' },
        ] },
      ],
    },
  ],
  rules: [
    'ใช้ **TextFormField** ในฟอร์ม (มี validator/onSaved) · TextField สำหรับช่องเดี่ยวที่ไม่ต้องตรวจ',
    'controller: สร้างใน `initState` → `dispose()` ใน `dispose` ก่อน `super.dispose()`',
    '`final _formKey = GlobalKey<FormState>()` เป็นฟิลด์ของ State (ไม่สร้างใน build) แล้วใส่ `Form(key: _formKey)`',
    'validator: คืน **null = ผ่าน**, คืน **String = ข้อความ error** (บอกวิธีแก้)',
    'ลำดับ: `validate()` ผ่าน → `save()` → ใช้ค่า · `save()` ไม่ได้บันทึกลงเครื่อง',
    'ถ้าแสดงค่าที่ save แล้วบนจอ ต้องกำหนดใน `setState`',
    'ช่องข้อความทั่วไปตรวจด้วย `trim().isEmpty` · รหัสผ่านห้าม trim',
    'ยืนยันรหัสผ่านต้องอ่านช่องแรกผ่าน **controller** (validator ทำงานก่อน onSaved)',
    'ห้ามใส่ `initialValue` คู่กับ `controller`',
    'ฟอร์มยาว/มีคีย์บอร์ด → ห่อด้วย `SingleChildScrollView`',
    '`keyboardType` ไม่กรอง → ใช้ `inputFormatters` (import `services.dart`)',
    'ใช้ `AutovalidateMode.onUserInteractionIfError` + `validate()` ตอนกดส่ง',
    'ห้าม print/แสดงรหัสผ่าน · ล้างช่องรหัสผ่านหลังส่ง · เซิร์ฟเวอร์ต้องตรวจซ้ำ',
    'Checkbox/Radio/Switch/Slider/DropdownButton ธรรมดาไม่ใช่ FormField',
  ],
  handsOff: { heading: 'คำถามชวนคิดท้ายบท (8.14)', body: [
    { t: 'callout', kind: 'exam', title: 'คำถามจากตำรา', body: '“ฟอร์มในบทนี้เก็บค่าที่บันทึกไว้ในตัวแปรของ State ของหน้าจอฟอร์มเอง เมื่อหน้าจอนั้นถูกปิด ค่าทั้งหมดก็หายไปพร้อมกับ State แต่ในแอปจริง ฟอร์มมักเป็นหน้าที่ถูกเปิดขึ้นมาจากหน้าอื่น … ข้อมูลที่ผู้ใช้กรอก **ควรเดินทางกลับไปถึงหน้าที่เปิดฟอร์มขึ้นมาได้อย่างไร** หน้าฟอร์ม **ควรรู้หรือไม่ว่าข้อมูลนั้นจะถูกนำไปเก็บไว้ที่ไหน** และ **ถ้าผู้ใช้กรอกไปครึ่งหนึ่งแล้วกดย้อนกลับ แอปควรทำอย่างไร**”' },
    { t: 'compare', cols: ['คำถาม', 'ตำราจะตอบที่'], rows: [
      ['ข้อมูลกลับไปหน้าที่เปิดฟอร์มอย่างไร', '**บทที่ 9**: ส่งค่ากลับผ่าน `Navigator.pop` ([[9.5]])'],
      ['หน้าฟอร์มควรรู้ไหมว่าข้อมูลถูกเก็บที่ไหน', '**บทที่ 10**: แยกข้อมูลออกไปไว้ใน Provider ([[10.1]])'],
      ['กรอกครึ่งหนึ่งแล้วกดย้อนกลับ', '`canPop` + `onPopInvokedWithResult` จาก 8.5 คือจุดเริ่มต้น → **PopScope** ใน [[9.8]]'],
    ] },
  ] },
  quiz: [
    { q: 'ข้อใดเรียงขั้นตอนการ submit ฟอร์มในแลปถูกต้อง?', options: [
      { t: 'unfocus → validate() → save() → ใช้ค่า → clear() รหัสผ่าน', ok: true },
      { t: 'save() → validate() → unfocus', why: 'save ต้องหลัง validate ผ่าน' },
      { t: 'validate() → unfocus → แสดงรหัสผ่านใน SnackBar', why: 'ห้ามแสดงรหัสผ่าน' },
    ] },
    { type: 'multi', q: 'สิ่งใดที่ `Form` + `GlobalKey<FormState>` ทำได้ (เลือกทุกข้อที่ถูก)', options: [
      { t: 'สั่งตรวจทุก FormField ด้วย `validate()`', ok: true },
      { t: 'สั่งเก็บค่าทุก FormField ด้วย `save()`', ok: true },
      { t: 'ล้างทุกช่องด้วย `reset()`', ok: true },
      { t: 'ตรวจ Checkbox ธรรมดาที่อยู่ใน Form', why: 'Checkbox ธรรมดาไม่ใช่ FormField' },
    ] },
    { q: 'หน้าจอ “ต้องอ่านค่าช่อง A เพื่อตรวจช่อง B” ควรเลือกอะไรให้ช่อง A?', options: [
      { t: 'TextEditingController', ok: true },
      { t: 'onSaved', why: 'onSaved ทำงานหลังตรวจเสร็จ' },
      { t: 'initialValue', why: 'แค่ค่าเริ่มต้น' },
    ] },
    { q: 'ข้อใดเป็นหน้าที่ของ validator ในแอปตามมุมมองของตำรา?', options: [
      { t: 'ช่วยผู้ใช้ที่พิมพ์ผิดโดยไม่ตั้งใจ ให้รู้เร็วโดยไม่ต้องรอเซิร์ฟเวอร์', ok: true },
      { t: 'ป้องกันผู้ไม่หวังดีได้ครบถ้วน', why: 'เซิร์ฟเวอร์ต้องตรวจซ้ำเสมอ' },
      { t: 'เข้ารหัสข้อมูลก่อนส่ง', why: 'ไม่ใช่หน้าที่ของ validator' },
    ] },
  ],
};
