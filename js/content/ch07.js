/* บทที่ 7 — ความรู้เบื้องต้นเกี่ยวกับ State: StatefulWidget & setState */
FR.content.ch07 = {
  id: 'ch07', kind: 'chapter', num: '7', navTitle: 'State & setState', crumb: 'บทที่ 7',
  title: 'ความรู้เบื้องต้นเกี่ยวกับ State: StatefulWidget & setState',
  problem: 'วิดเจ็ตใน Flutter **เปลี่ยนรูปไม่ได้ (immutable)** แต่แอปจริงต้องเปลี่ยนตลอดเวลา — ตัวนับเพิ่มค่า ฟอร์มแสดง error รายการอัปเดต แล้ว UI จะเปลี่ยนตามข้อมูลได้อย่างไร?',
  tools: ['StatefulWidget', 'State', 'setState()', 'initState / dispose', 'lifting state up'],
  overview: [
    { t: 'h', text: 'ภาพใหญ่ของบทนี้ในภาพเดียว' },
    'ทั้งบทอธิบาย “วงจร” เดียว: ผู้ใช้ทำอะไรบางอย่าง → เราแก้ข้อมูลใน **State** ผ่าน `setState()` → Flutter จดว่าต้องวาดใหม่ → เฟรมถัดไปเรียก `build()` → หน้าจอตรงกับข้อมูล ลองกดปุ่ม + ในภาพด้านล่าง แล้วสลับไปโหมด “ลืม setState” เพื่อดูว่าวงจรขาดตรงไหน',
    { t: 'viz', id: 'ch07.loop', title: 'วงจร setState → build → จอ', try: 'กด **+** หลายครั้ง แล้วเปลี่ยนเป็นโหมด “ลืม setState” — ค่าในหน่วยความจำเพิ่ม แต่จอไม่เปลี่ยน' },
    { t: 'h', text: 'หัวข้อทั้งหมดเชื่อมกันอย่างไร' },
    { t: 'compare', cols: ['คำถาม', 'คำตอบ', 'หัวข้อ'], rows: [
      ['ทำไมต้องมี state?', 'วิดเจ็ตแก้ไม่ได้ ต้องสร้างใหม่ ข้อมูลจึงต้องอยู่ที่อื่น', '[[7.1]]'],
      ['state คืออะไร?', 'ข้อมูลที่เปลี่ยนได้และมีผลต่อ UI', '[[7.2]]'],
      ['วิดเจ็ตแบบไหนมี state?', 'StatelessWidget vs StatefulWidget', '[[7.3]]'],
      ['state อยู่ตรงไหน?', 'ในออบเจกต์ State คู่กับ StatefulWidget', '[[7.4]]'],
      ['State เกิด-ตายเมื่อไร?', 'lifecycle: initState → build → dispose', '[[7.5]]'],
      ['บอก Flutter อย่างไรว่าข้อมูลเปลี่ยน?', 'setState() → dirty → build ในเฟรมถัดไป', '[[7.6]]'],
      ['state ไหนควรอยู่ที่ไหน?', 'ephemeral (setState) vs app state (Provider)', '[[7.7]]'],
      ['ลูกจะเปลี่ยน state ของแม่ได้อย่างไร?', 'ยก state ขึ้น + callback', '[[7.8]]'],
    ] },
    { t: 'callout', kind: 'supp', title: 'ปูพื้นก่อนอ่าน (ถ้ายังไม่แน่นเรื่องต้นไม้วิดเจ็ต)', body: 'ตำราพูดถึงคำว่า **element** และ **dirty** แต่ไม่ได้อธิบายว่ามันคืออะไร หน้า [[core/c1|แกนกลาง: Widget / Element / State]] อธิบายด้วยภาพว่าทำไม State จึง “รอด” จากการ rebuild ได้ — อ่านคู่กับ [[7.4]] จะเข้าใจที่สุด' },
  ],
  sections: [
    // ─────────────────────────── 7.1
    {
      id: '7.1', title: 'บทนำ: การทำให้แอปโต้ตอบได้', source: '§7.1',
      gist: 'แอปจริง “เปลี่ยนอยู่เสมอ” แต่วิดเจ็ตใน Flutter **แก้ไขไม่ได้หลังสร้าง** — Flutter จึงแยก “ข้อมูลที่เปลี่ยนได้” ออกไปไว้ในออบเจกต์ **State** ที่อยู่ยาวกว่าวิดเจ็ต',
      blocks: [
        'บทก่อนหน้าเราจัด Text, รูป, ไอคอน, ปุ่ม ได้แล้ว แต่ทั้งหมดเป็น **แบบคงที่ (static)** ส่วนแอปจริงมีการเปลี่ยนแปลงตลอดเวลา: ตัวนับเพิ่มค่า, รายการอัปเดต, ฟอร์มแสดงข้อผิดพลาด, โปรไฟล์โหลดข้อมูล',
        'ตำราให้คำนิยามสั้นๆ ว่า State คือ “ข้อมูลใดๆ ที่มีอยู่ตลอดเวลาและสามารถเปลี่ยนแปลงได้ ซึ่งอาจส่งผลกระทบต่อ UI” และตั้งคำถามสำคัญของบท: ถ้าวิดเจ็ตเป็น **immutable** แล้ว UI จะอัปเดตได้อย่างไร?',
        { t: 'viz', id: 'ch07.immutable', title: 'วิดเจ็ตแก้ไม่ได้ — ได้แต่สร้างใหม่', try: 'กดปุ่มซ้ายก่อน (แก้ค่าในวิดเจ็ตเดิม) แล้วกดปุ่มขวา (สร้างตัวใหม่)' },
        { t: 'why', choice: 'Flutter ออกแบบให้วิดเจ็ต **immutable** และ “สร้างใหม่ทั้งตัว” ทุกครั้งที่ต้องเปลี่ยน',
          because: ['วิดเจ็ตเป็นแค่ **คำอธิบายหน้าตา (configuration)** ขนาดเล็ก สร้างใหม่ราคาถูกมาก', 'เมื่อไม่มีใครแก้วิดเจ็ตได้ ก็ไม่มีบั๊กแบบ “ใครแอบเปลี่ยนค่าตอนไหน” — หน้าจอคำนวณจากข้อมูลล้วนๆ', 'Flutter เทียบวิดเจ็ตชุดใหม่กับชุดเก่าแล้วอัปเดตเฉพาะส่วนที่ต่างจริงบนจอ'],
          alts: [
            { alt: 'ทำไมไม่ให้แก้ค่าในวิดเจ็ตเดิมตรงๆ เช่น `text.data = "1"`?', result: 'compile ไม่ผ่าน เพราะฟิลด์ของวิดเจ็ตเป็น `final` และต่อให้แก้ได้ Flutter ก็ไม่รู้ว่าต้องวาดใหม่', ok: 'ไม่มีกรณีที่ถูก — นี่คือเหตุผลที่ต้องมี State แยกออกมา' },
          ] },
        { t: 'callout', kind: 'supp', title: 'เปรียบให้เห็นภาพ', body: 'วิดเจ็ตเหมือน **ใบสั่งอาหาร** ที่เขียนเสร็จแล้วแก้ไม่ได้ ถ้าลูกค้าเปลี่ยนใจก็เขียนใบใหม่ ส่วน **State** เหมือน **สมุดของพนักงาน** ที่จดว่าโต๊ะนี้สั่งอะไรไปแล้ว — สมุดอยู่ตลอดทั้งมื้อ ใบสั่งเขียนใหม่ได้เรื่อยๆ' },
      ],
      quiz: [
        { q: 'ข้อใดอธิบายว่า “วิดเจ็ตเป็น immutable” ได้ถูกต้องที่สุด', options: [
          { t: 'เมื่อสร้างแล้ว ค่า configuration ของวิดเจ็ตเปลี่ยนไม่ได้ ถ้าต้องการหน้าตาใหม่ต้องสร้างวิดเจ็ตตัวใหม่', ok: true, why: 'ใช่ — การเปลี่ยนหน้าตาคือการสร้างวิดเจ็ตชุดใหม่จากข้อมูลล่าสุด' },
          { t: 'วิดเจ็ตแสดงผลได้ครั้งเดียว แล้วจะหายไปจากหน้าจอ', why: 'วิดเจ็ตอยู่บนจอได้นาน แค่ “แก้ค่า” ไม่ได้' },
          { t: 'วิดเจ็ตไม่สามารถรับ input จากผู้ใช้ได้', why: 'TextField ก็เป็นวิดเจ็ต รับ input ได้ — แต่ข้อความที่เปลี่ยนเก็บใน State ไม่ใช่ในตัววิดเจ็ต' },
        ], explain: 'immutable หมายถึงแก้ฟิลด์ไม่ได้ ไม่ได้หมายความว่าหน้าจอเปลี่ยนไม่ได้ — หน้าจอเปลี่ยนด้วยการสร้างวิดเจ็ตใหม่' },
        { q: 'ถ้าวิดเจ็ตถูกสร้างใหม่ทุกครั้งที่ UI เปลี่ยน ข้อมูลอย่าง “ค่าตัวนับปัจจุบัน” ต้องถูกเก็บไว้ที่ไหน?', options: [
          { t: 'ในออบเจกต์ State ที่อยู่ยาวกว่าวิดเจ็ต', ok: true, why: 'State ไม่ถูกสร้างใหม่ตอน rebuild จึงจำค่าได้' },
          { t: 'ในฟิลด์ของวิดเจ็ต', why: 'วิดเจ็ตถูกสร้างใหม่ ค่าในฟิลด์จะกลับไปเป็นค่าเริ่มต้นทุกครั้ง' },
          { t: 'ในเมธอด build()', why: 'ตัวแปรใน build เป็น local — หายทันทีที่ build จบ' },
        ] },
      ],
    },
    // ─────────────────────────── 7.2
    {
      id: '7.2', title: 'State คืออะไร?', source: '§7.2',
      gist: 'State คือ **ข้อมูลที่เปลี่ยนได้ระหว่างช่วงชีวิตของวิดเจ็ต และอาจส่งผลต่อ UI** — เมื่อมันเปลี่ยน UI ควรอัปเดตตาม',
      blocks: [
        'ตำรายกตัวอย่างองค์ประกอบ UI ที่คุ้นเคย แต่ละอันมี “ข้อมูลที่เปลี่ยนได้” อยู่ข้างใน ลองเล่นกับ control ด้านซ้ายแล้วดูตาราง state ด้านขวาเปลี่ยนตาม',
        { t: 'viz', id: 'ch07.inspector', title: 'ตัวตรวจ state สด', try: 'ติ๊ก checkbox พิมพ์ข้อความ เลื่อน slider กด +1 และพิมพ์ “ไก่” ในช่องค้นหา' },
        { t: 'compare', cols: ['องค์ประกอบ UI', 'state ของมัน', 'ชนิดข้อมูล'], rows: [
          ['Checkbox', 'ถูกเลือกอยู่หรือไม่', '`bool`'],
          ['ช่องป้อนข้อความ', 'ข้อความปัจจุบัน', '`String`'],
          ['Slider', 'ค่าตัวเลขปัจจุบัน', '`double`'],
          ['ปุ่มนับ', 'จำนวนนับปัจจุบัน', '`int`'],
          ['ลิสต์ผลการค้นหา', 'รายการผลลัพธ์ตามคำค้น', '`List<ResultObject>`'],
        ] },
        { t: 'callout', kind: 'supp', title: 'อะไร “ไม่ควร” เป็น state', body: [
          'กฎง่ายๆ: เก็บเป็น state เฉพาะ **ข้อมูลต้นทางที่เปลี่ยนได้** อะไรที่ **คำนวณได้จากข้อมูลอื่น** ให้คำนวณใน `build()` แทน',
          { t: 'list', items: ['มี `_counter` แล้ว ไม่ต้องมี `_counterText = "$_counter"` อีกตัว — ถ้าลืมอัปเดตตัวใดตัวหนึ่ง จอจะแสดงค่าที่ขัดกัน', 'มี `_items` แล้ว ไม่ต้องเก็บ `_itemCount` แยก ให้ใช้ `_items.length`', 'ค่าที่ไม่เคยเปลี่ยน (สี, ข้อความหัวเรื่อง) ไม่ใช่ state — เป็นค่าคงที่หรือ configuration ที่ส่งเข้ามา'] },
        ] },
      ],
      quiz: [
        { q: 'ข้อใด **ไม่ใช่** state ของหน้าจอตัวนับ?', options: [
          { t: 'ข้อความหัวเรื่อง “ตัวนับของฉัน” ที่ไม่เคยเปลี่ยน', ok: true, why: 'ไม่เปลี่ยนตลอดอายุวิดเจ็ต → เป็น configuration/ค่าคงที่' },
          { t: 'ค่า `_counter` ปัจจุบัน', why: 'เปลี่ยนได้และมีผลต่อ UI → state' },
          { t: 'ว่าผู้ใช้เปิดโหมดมืดในหน้าจอนี้หรือไม่ (สลับได้)', why: 'เปลี่ยนได้และมีผลต่อ UI → state' },
        ] },
        { q: 'มี `List<String> _items` เป็น state อยู่แล้ว ควรเก็บ `int _itemCount` เป็น state อีกตัวหรือไม่?', options: [
          { t: 'ไม่ควร — คำนวณจาก `_items.length` ใน build ได้ เก็บซ้ำเสี่ยงค่าไม่ตรงกัน', ok: true },
          { t: 'ควร — จะได้ไม่ต้องคำนวณทุกครั้ง', why: 'การนับ length ถูกมาก ความเสี่ยงที่ค่าสองตัวขัดกันแพงกว่า' },
          { t: 'ควร — Flutter บังคับให้ทุกค่าที่แสดงบนจอต้องเป็น state', why: 'ไม่มีกฎแบบนั้น ค่าที่คำนวณใน build ก็แสดงได้' },
        ] },
      ],
    },
    // ─────────────────────────── 7.3
    {
      id: '7.3', title: 'StatelessWidget เปรียบเทียบกับ StatefulWidget', source: '§7.3',
      gist: '**StatelessWidget** = หน้าตาถูกกำหนดจาก constructor arguments ทั้งหมด ไม่มี state ภายใน · **StatefulWidget** = มีออบเจกต์ State แยกที่ถือข้อมูลเปลี่ยนได้และมีเมธอด `build()`',
      blocks: [
        { t: 'compare', cols: ['', 'StatelessWidget', 'StatefulWidget'], rows: [
          ['นิยาม', 'การกำหนดค่าไม่เปลี่ยนรูป ถูกกำหนดจาก constructor arguments + BuildContext', 'รักษา state ที่เปลี่ยนได้ระหว่างช่วงชีวิต ทำให้ UI ถูกสร้างใหม่ได้'],
          ['เมธอด `build()` อยู่ที่', 'ตัววิดเจ็ตเอง', '**ออบเจกต์ State** (ตัววิดเจ็ตมีแค่ `createState()`)'],
          ['เปลี่ยนหน้าตาเมื่อ', 'parent สร้างมันใหม่ด้วยค่าใหม่', 'เรียก `setState()` ในออบเจกต์ State (หรือ parent ส่งค่าใหม่)'],
          ['ตัวอย่าง', '`Text`, `Icon`, `Padding`, `Center`, `Row`, `Column`', '`Checkbox`, `TextField`, `Slider`, ตัวนับของเรา'],
          ['ใช้เมื่อ', 'แสดงข้อมูลคงที่ / จัดเลย์เอาต์', 'UI ต้องเปลี่ยนตามการโต้ตอบหรือข้อมูลภายใน'],
        ] },
        { t: 'viz', id: 'sorter', title: 'คัดแยก: วิดเจ็ตนี้ควรเป็นแบบไหน?', props: {
          buckets: [{ id: 'sl', label: 'Stateless', desc: 'แสดงตามค่าที่รับมา' }, { id: 'sf', label: 'Stateful', desc: 'ถือข้อมูลที่เปลี่ยนเองได้' }],
          items: [
            { t: 'การ์ดโปรไฟล์ที่แสดง `name` และ `avatarUrl` ที่ส่งเข้ามา', bucket: 'sl', why: 'แสดงตามค่าที่ได้รับเท่านั้น ถ้าชื่อเปลี่ยน parent จะสร้างการ์ดใหม่ให้' },
            { t: 'กล่องที่เปลี่ยนสีแบบสุ่มเมื่อแตะ (ColorChanger)', bucket: 'sf', why: 'สีปัจจุบันเป็นข้อมูลที่เปลี่ยนเองเมื่อแตะ' },
            { t: 'ปุ่มหัวใจที่สลับ “ถูกใจ/ไม่ถูกใจ” ได้ในตัว', bucket: 'sf', why: 'สถานะถูกใจเปลี่ยนจากการแตะ และวิดเจ็ตเป็นเจ้าของข้อมูลนี้' },
            { t: '`Padding` ที่ห่อปุ่มไว้', bucket: 'sl', why: 'จัดเลย์เอาต์อย่างเดียว ไม่มีข้อมูลที่เปลี่ยน' },
            { t: 'หัวข้อหน้าจอ `Text("ตั้งค่า")`', bucket: 'sl', why: 'ข้อความคงที่' },
            { t: 'แท็บที่จำว่าเลือกแท็บไหนอยู่', bucket: 'sf', why: 'แท็บที่เลือกคือ ephemeral state ของวิดเจ็ตนี้' },
          ] } },
        { t: 'why', choice: 'เริ่มจาก **StatelessWidget** ก่อนเสมอ แล้วเปลี่ยนเป็น Stateful เฉพาะเมื่อวิดเจ็ตต้อง “เป็นเจ้าของ” ข้อมูลที่เปลี่ยนได้',
          because: ['โค้ดสั้นกว่า ไม่มี lifecycle ให้ดูแล ไม่มีอะไรต้อง dispose', 'ทำเป็น `const` ได้บ่อยกว่า → Flutter ข้ามการสร้างใหม่ได้', 'อ่านแล้วรู้ทันทีว่า “หน้าตาขึ้นกับค่าที่รับมาเท่านั้น”'],
          alts: [
            { alt: 'ทำไมไม่ทำทุกวิดเจ็ตเป็น Stateful ไว้ก่อน เผื่อต้องใช้?', result: 'โค้ดยาวขึ้นสองคลาส มีออบเจกต์ State ค้างในหน่วยความจำทุกตัว และคนอ่านต้องไล่ดูว่า state ตัวไหนเปลี่ยนจริงบ้าง', ok: 'วิดเจ็ตนั้นมีข้อมูลที่เปลี่ยนเองจริงๆ' },
            { alt: 'ทำไมไม่ใช้ StatelessWidget แล้วประกาศตัวแปรธรรมดา (ไม่ final) ไว้เก็บค่าที่เปลี่ยน?', result: 'Dart เตือนว่าคลาส `@immutable` มีฟิลด์ที่ไม่ final และที่หนักกว่าคือ **ค่าจะหายทุกครั้งที่ parent rebuild** เพราะวิดเจ็ตถูกสร้างใหม่ทั้งตัว ต่อให้แก้ค่าได้ ก็ไม่มี `setState` ให้เรียกเพื่อวาดใหม่', ok: 'ไม่มี — ใช้ StatefulWidget' },
          ] },
        { t: 'callout', kind: 'real', title: 'อ่านประโยคในตำราให้ถูก (§7.3.1)', body: 'ประโยคในตำราเรื่อง “`build()` ของ StatelessWidget ถูกเรียกเมื่อไร” อ่านแล้วสับสน สรุปให้ชัด: `build()` ของ StatelessWidget ถูกเรียกเมื่อ (1) ถูกใส่ลงต้นไม้ครั้งแรก (2) parent rebuild แล้วส่ง **อินสแตนซ์ใหม่** ของมันลงมา (3) **InheritedWidget** ที่มันพึ่งพา (เช่น `Theme.of(context)`) เปลี่ยน' },
      ],
      quiz: [
        { q: 'ข้อใดถูกต้องเกี่ยวกับ StatefulWidget?', options: [
          { t: 'ตัว StatefulWidget ไม่มีเมธอด `build()` — `build()` อยู่ในออบเจกต์ State', ok: true },
          { t: 'StatefulWidget เปลี่ยนค่าฟิลด์ของตัวเองได้ เพราะเป็น mutable', why: 'StatefulWidget เองก็ยัง immutable — ข้อมูลที่เปลี่ยนอยู่ใน State' },
          { t: 'StatefulWidget ทำงานเร็วกว่า StatelessWidget เสมอ', why: 'ไม่เกี่ยวกับความเร็ว เกี่ยวกับว่ามีข้อมูลที่เปลี่ยนเองหรือไม่' },
        ] },
        { q: 'วิดเจ็ตแสดงชื่อสินค้าที่รับเข้ามาทาง constructor เท่านั้น ควรเป็นแบบไหน และทำไม?', options: [
          { t: 'Stateless — หน้าตาขึ้นกับค่าที่รับมาทั้งหมด ไม่มีข้อมูลที่เปลี่ยนเอง', ok: true },
          { t: 'Stateful — เพราะชื่อสินค้าอาจเปลี่ยนในอนาคต', why: 'ถ้าชื่อเปลี่ยน คนที่ถือข้อมูล (parent) จะสร้างวิดเจ็ตใหม่ด้วยชื่อใหม่ให้เอง' },
          { t: 'Stateful — เพราะทุกวิดเจ็ตที่แสดงข้อความต้องเป็น Stateful', why: 'Text เองก็เป็น StatelessWidget' },
        ] },
      ],
    },
    // ─────────────────────────── 7.4
    {
      id: '7.4', title: 'คู่หู StatefulWidget และ State', source: '§7.4', exam: true,
      gist: 'StatefulWidget ยังคง immutable และทำหน้าที่หลักคือ `createState()` ส่วนข้อมูลที่เปลี่ยนได้และ `build()` อยู่ในคลาส `_XxxState extends State<Xxx>` — State อ่าน configuration ผ่าน `widget.xxx`',
      blocks: [
        'ตำราให้โครงสร้างพื้นฐานไว้ดังนี้ (กดจุดสีส้มที่เลขบรรทัดเพื่อดูคำอธิบายแต่ละบรรทัด):',
        { t: 'code', title: 'MyCounterWidget + _MyCounterWidgetState (จากตำรา §7.4)', src: `import 'package:flutter/material.dart';

// 1. คลาส StatefulWidget (immutable)
class MyCounterWidget extends StatefulWidget {
  final String title; // ตัวอย่าง configuration ที่ส่งเข้ามา

  // Constructor เป็น const เพราะ configuration ของวิดเจ็ตเองไม่เปลี่ยนรูป
  const MyCounterWidget({super.key, required this.title});

  // เมธอดสำคัญ: สร้างออบเจกต์ State ที่เปลี่ยนแปลงได้
  @override
  State<MyCounterWidget> createState() => _MyCounterWidgetState();
}

// 2. คลาส State (mutable, เกี่ยวข้องกับ MyCounterWidget)
// เครื่องหมายขีดล่าง (_) ทำให้คลาสเป็น private สำหรับไลบรารีนี้ (ไฟล์นี้)
class _MyCounterWidgetState extends State<MyCounterWidget> {
  // --- ตัวแปร State ---
  int _counter = 0; // ตัวแปร state ที่เปลี่ยนแปลงได้

  // --- เมธอดช่วยเหลือ (ที่อาจเปลี่ยน state) ---
  void _incrementCounter() {
    setState(() {
      // เราแก้ไข state *ภายใน* callback ของ setState
      _counter++;
      print('ตัวนับเพิ่มเป็น: $_counter'); // สำหรับดีบัก
    });
  }

  // --- เมธอด Lifecycle (ทางเลือก แต่ใช้บ่อย) ---
  @override
  void initState() {
    super.initState();
    // ถูกเรียกครั้งเดียวเมื่อออบเจกต์ state ถูกสร้างขึ้นครั้งแรก
    print('Counter State เริ่มต้นแล้ว!');
  }

  @override
  void dispose() {
    // ถูกเรียกเมื่อออบเจกต์ state ถูกลบออกจาก tree อย่างถาวร
    print('Counter State ถูก Dispose แล้ว!');
    super.dispose(); // เรียก super.dispose() ตอนท้ายเสมอ
  }

  // --- เมธอด Build (จำเป็น) ---
  @override
  Widget build(BuildContext context) {
    // เมธอดนี้ทำงานครั้งแรก และ *ทุกครั้ง* ที่ setState ถูกเรียก
    print('กำลังสร้าง UI ของ Counter Widget... ค่าปัจจุบัน: $_counter');

    // เข้าถึง properties ของ widget โดยใช้ 'widget.'
    String currentTitle = widget.title;

    return Scaffold(
      appBar: AppBar(title: Text(currentTitle)),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text('คุณกดปุ่มนี้ไปแล้ว:'),
            Text(
              '$_counter', // แสดงตัวแปร state ปัจจุบัน
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter, // เรียกเมธอดของเราเมื่อกด
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ),
    );
  }
}`, notes: [
          { at: 'final String title;', note: 'ฟิลด์ของวิดเจ็ตต้องเป็น `final` — นี่คือ **configuration** ที่ parent ส่งมา ไม่ใช่ state' },
          { at: 'const MyCounterWidget({super.key', note: '`const` constructor ได้เพราะวิดเจ็ตไม่เปลี่ยนรูป · `super.key` ส่ง key ต่อให้คลาสแม่ (ใช้ระบุตัวตนในต้นไม้ — ดู [[core/c1]])' },
          { at: 'createState() =>', note: '**framework** เป็นผู้เรียก `createState()` ครั้งเดียวตอนวิดเจ็ตถูกใส่ลงต้นไม้ เราแค่ implement ให้คืน State ตัวใหม่' },
          { at: 'class _MyCounterWidgetState', note: 'ธรรมเนียมการตั้งชื่อ: `_` + ชื่อวิดเจ็ต + `State` · ขีดล่างทำให้ **private ในไฟล์นี้** — ไฟล์อื่นสร้างหรือเรียกเมธอดของ State นี้ตรงๆ ไม่ได้' },
          { at: 'int _counter = 0;', note: 'ตัวแปร state อยู่ **ในคลาส State นอกเมธอด build** — ถ้าประกาศใน build จะถูกรีเซ็ตเป็น 0 ทุกครั้งที่ build' },
          { at: '_counter++;', note: 'แก้ค่า **ภายใน** callback ของ `setState` → Flutter รู้ว่าต้อง build ใหม่' },
          { at: 'String currentTitle = widget.title;', note: '`widget` คือ getter ที่ชี้ไปยัง **อินสแตนซ์ล่าสุด** ของ MyCounterWidget เสมอ ถ้า parent ส่ง title ใหม่ `widget.title` ก็เป็นค่าใหม่' },
          { at: "const Text('คุณกดปุ่มนี้ไปแล้ว:')", note: 'ข้อความคงที่ใส่ `const` ได้ — แต่ `Text(\'$_counter\')` ใส่ const ไม่ได้เพราะค่ามาจากตัวแปร' },
          { at: 'onPressed: _incrementCounter,', note: 'ส่ง **ตัวฟังก์ชัน** (tear-off) ไม่มีวงเล็บ — ถ้าเขียน `_incrementCounter()` จะเป็นการ **เรียกทันทีระหว่าง build** แล้วเอาค่าที่คืน (void) ไปใส่ onPressed ซึ่งผิด' },
        ] },
        { t: 'viz', id: 'ch07.pair', name: 'pair', title: 'Widget ถูกสร้างใหม่ แต่ State อยู่ต่อ', try: 'กด **+** สองสามครั้ง แล้วกด **Parent rebuild** — สังเกตว่าเลข `#w` เปลี่ยน แต่ `_counter` ไม่หาย จากนั้นกด **เอาวิดเจ็ตออกแล้วใส่กลับ**' },
        { t: 'list', items: [
          'StatefulWidget (`MyCounterWidget`) เรียบง่าย หน้าที่หลักคือสร้างออบเจกต์ State ผ่าน `createState()`',
          'ออบเจกต์ State (`_MyCounterWidgetState`) เก็บข้อมูลที่เปลี่ยนได้จริง (`_counter`) และมี `build()`',
          'เมื่อเกิดเหตุการณ์ เมธอดแก้ตัวแปร **ภายใน** `setState()` → วิดเจ็ตถูกทำเครื่องหมาย “dirty” → `build()` ถูกเรียกอีกครั้ง → UI อัปเดต',
        ] },
        { t: 'why', choice: 'แยกเป็น **สองคลาส**: วิดเจ็ต (config ที่ immutable) + State (ข้อมูลที่ mutable)',
          because: ['วิดเจ็ตถูกสร้างใหม่ทุกครั้งที่ parent rebuild — ถ้าข้อมูลอยู่ในวิดเจ็ตจะหายทุกครั้ง', 'State ถูกสร้าง **ครั้งเดียว** แล้วถูกนำกลับมาใช้ซ้ำตราบใดที่ตำแหน่งในต้นไม้และชนิดวิดเจ็ตยังเหมือนเดิม', 'ได้ทั้งความเรียบง่ายของ immutable widget และความสามารถจำข้อมูล'],
          alts: [
            { alt: 'ทำไมไม่เก็บ `_counter` ไว้ใน StatefulWidget เลย?', result: 'ทุกครั้งที่ parent rebuild จะได้ `MyCounterWidget` ตัวใหม่ → `_counter` กลับเป็น 0 (ลองกด “Parent rebuild” ในภาพแล้วนึกว่าถ้าค่าอยู่ในการ์ดซ้ายจะเป็นอย่างไร)', viz: { name: 'pair' } },
            { alt: 'ทำไมไม่คัดลอก `widget.title` ไปเก็บในตัวแปรของ State ตอน initState?', result: 'ค่าที่คัดลอกจะ **ค้างเป็นค่าเก่า** เมื่อ parent ส่ง title ใหม่มา เพราะ initState ไม่ถูกเรียกซ้ำ (ต้องไปเขียน didUpdateWidget เพิ่ม) — อ่าน `widget.title` ตรงๆ ใน build จะได้ค่าล่าสุดเสมอ', ok: 'ใช้เป็น “ค่าเริ่มต้น” ที่ตั้งใจให้ผู้ใช้แก้ต่อเอง เช่น `_counter = widget.initialValue` (ตามคอมเมนต์ในตำรา)' },
          ] },
        { t: 'callout', kind: 'supp', title: 'ทำไม State รอดจากการ rebuild — คำตอบคือ Element', body: 'ตำราพูดถึง “element” เพียงผ่านๆ ความจริงคือ Flutter มีต้นไม้อีกชั้นที่ชื่อ **Element** ทำหน้าที่เป็น “ตำแหน่ง” ในต้นไม้ Element ถือทั้งวิดเจ็ตปัจจุบันและออบเจกต์ State ไว้ เมื่อ parent ส่งวิดเจ็ตตัวใหม่ **ชนิดเดิม** มาที่ตำแหน่งเดิม Element จะแค่ “เปลี่ยนวิดเจ็ตที่ถือ” แล้วเก็บ State ตัวเดิมไว้ — ดูภาพเต็มที่ [[core/c1]]' },
      ],
      quiz: [
        { q: 'ถ้า parent rebuild และส่ง `MyCounterWidget(title: "ใหม่")` ลงมาที่ตำแหน่งเดิม ค่า `_counter` จะเป็นอย่างไร?', options: [
          { t: 'ค่าเดิม เพราะ State ตัวเดิมถูกนำกลับมาใช้ และ `didUpdateWidget` ถูกเรียก', ok: true },
          { t: 'กลับเป็น 0 เพราะวิดเจ็ตถูกสร้างใหม่', why: 'วิดเจ็ตใหม่ก็จริง แต่ State ไม่ได้ถูกสร้างใหม่' },
          { t: 'แอปจะ error เพราะ title เปลี่ยน', why: 'การส่ง configuration ใหม่เป็นเรื่องปกติ' },
        ] },
        { type: 'spot', q: 'โค้ดนี้กดปุ่มแล้วตัวเลขไม่เคยเกิน 1 — บรรทัดไหนเป็นต้นเหตุ?', code: `class _CounterState extends State<Counter> {
  @override
  Widget build(BuildContext context) {
    int counter = 0;
    return TextButton(
      onPressed: () => setState(() { counter++; }),
      child: Text('$counter'),
    );
  }
}`, bad: 'int counter = 0;', explain: 'ตัวแปรที่ประกาศใน `build()` เป็น local — ทุกครั้งที่ setState ทำให้ build ทำงานใหม่ มันถูกสร้างใหม่เป็น 0 ต้องย้ายไปเป็นฟิลด์ของคลาส State' },
        { q: '`onPressed: _incrementCounter()` (มีวงเล็บ) จะเกิดอะไรขึ้น?', options: [
          { t: 'ฟังก์ชันถูกเรียกทันทีระหว่าง build และ onPressed ได้ค่า void — โค้ด compile ไม่ผ่านหรือทำงานผิด', ok: true, why: '`_incrementCounter()` คือการเรียก ส่วน `_incrementCounter` คือการส่งตัวฟังก์ชัน' },
          { t: 'ทำงานเหมือนกันทุกประการ', why: 'ต่างกันมาก: แบบหนึ่ง “เรียกตอนนี้” อีกแบบ “ฝากไว้เรียกตอนกด”' },
          { t: 'ทำให้ปุ่มทำงานสองครั้งต่อการกด', why: 'ไม่ใช่ — ปัญหาคือมันถูกเรียกตอน build ไม่ใช่ตอนกด' },
        ] },
      ],
    },
    // ─────────────────────────── 7.5
    {
      id: '7.5', title: 'วงจรชีวิตของออบเจกต์ State (Lifecycle)', source: '§7.5', exam: true,
      gist: 'State ผ่านช่วง สร้าง → ใช้งาน → ทำลาย ตำราสรุปว่าในงานพื้นฐานใช้หลักๆ แค่ **initState, build, setState, dispose** — `super.initState()` เรียกก่อน `super.dispose()` เรียกท้ายสุดเสมอ',
      blocks: [
        { t: 'viz', id: 'ch07.lifecycle', title: 'เครื่องจำลอง lifecycle', try: 'กด ① ใส่ลงต้นไม้ → ② setState สองสามครั้ง → ③ ④ ⑤ → ⑥ ถอดออก แล้วลองกด ② อีกครั้งหลังถอดออก' },
        { t: 'h', text: 'เมธอดตามลำดับในตำรา' },
        { t: 'compare', cols: ['#', 'เมธอด', 'ถูกเรียกเมื่อ', 'ใช้ทำอะไร'], rows: [
          ['1', '`createState()`', 'ตอนวิดเจ็ตถูกใส่ลงต้นไม้', 'คืนออบเจกต์ State ตัวใหม่ (implement ในคลาส StatefulWidget)'],
          ['2', '`initState()`', '**ครั้งเดียว** ตอน State ถูกแทรกลงต้นไม้', 'สร้าง controller, สมัคร stream/notifier — เรียก `super.initState()` **ก่อน**'],
          ['3', '`didChangeDependencies()`', 'ทันทีหลัง initState และทุกครั้งที่ InheritedWidget ที่พึ่งพาเปลี่ยน', 'ตั้งค่าที่ต้องใช้ context / InheritedWidget'],
          ['4', '`build(context)`', 'หลัง 2–3, ทุกครั้งที่ setState, หรือเมื่อ framework ตัดสินใจ', 'คืนวิดเจ็ต — ต้องเร็วและ **ไม่มี side effect**'],
          ['5', '`didUpdateWidget(oldWidget)`', 'parent rebuild ส่งอินสแตนซ์ใหม่ (runtimeType เดิม)', 'เทียบ `widget` กับ `oldWidget` เพื่อรีเซ็ต/อัปเดต subscription'],
          ['6', '`setState(fn)`', 'เราเรียกเอง', 'fn ทำงานทันที แล้ว framework นัด build'],
          ['7', '`deactivate()`', 'ถูกถอดออก แต่อาจถูกใส่กลับที่อื่น (เช่นย้ายด้วย GlobalKey)', 'เกิดน้อยกว่า dispose'],
          ['8', '`dispose()`', 'ถูกถอดออก **ถาวร**', 'ยกเลิก stream/timer, dispose controller — เรียก `super.dispose()` **ท้ายสุด**'],
        ] },
        { t: 'callout', kind: 'real', title: 'จุดที่ตำราเขียนไม่ตรงกับความจริง', body: [
          { t: 'list', items: [
            'ตำราเขียนว่า `createState()` “ถูกเรียกโดย StatefulWidget” — จริงๆ **framework** เป็นผู้เรียก (ตอนสร้าง Element ให้วิดเจ็ตนั้น) วิดเจ็ตแค่ implement เมธอดไว้',
            '`setState()` ถูกนับเป็นข้อ 6 ของวงจร แต่มัน **ไม่ใช่ช่วงของชีวิต** — เป็น “ตัวกระตุ้น” ที่เราเรียกเองเพื่อนัดให้ `build()` ทำงาน (ในภาพจึงแสดงเป็นกรอบเส้นประ)',
            'มีเมธอด `activate()` ที่ถูกเรียกเมื่อ State ที่ deactivate แล้วถูกใส่กลับ (ไม่อยู่ในตำรา แสดงเป็นสีม่วงในภาพ)',
          ] },
        ] },
        { t: 'why', choice: '`super.initState()` เป็น **บรรทัดแรก** และ `super.dispose()` เป็น **บรรทัดสุดท้าย**',
          because: ['เริ่มต้น: ให้คลาสแม่ตั้งค่าส่วนของมันให้เสร็จก่อน โค้ดของเราจึงใช้ทุกอย่างได้อย่างปลอดภัย', 'จบ: เก็บกวาดของเรา (controller, timer) ขณะที่ออบเจกต์ยังสมบูรณ์ แล้วค่อยให้คลาสแม่ปิดฉากเป็นขั้นสุดท้าย', 'เหมือนเข้าบ้าน: เปิดไฟก่อนแล้วค่อยทำงาน · ออกจากบ้าน: เก็บของให้เรียบร้อยก่อนแล้วค่อยปิดไฟ'],
          alts: [
            { alt: 'สลับลำดับได้ไหม เช่นเรียก `super.dispose()` ก่อน แล้วค่อย dispose controller?', result: 'หลัง `super.dispose()` State ถูกถือว่า “ตายแล้ว” (defunct) — โค้ดที่ทำงานต่อจากนั้นอาจไปแตะสิ่งที่ถูกปิดไปแล้ว และในโหมด debug Flutter มี assertion ตรวจลำดับนี้', ok: 'ไม่มี — ทำตามลำดับในตำราเสมอ' },
          ] },
        { t: 'why', choice: 'สร้าง controller/subscription ใน **initState** และปิดใน **dispose**',
          because: ['initState ถูกเรียกครั้งเดียว → ได้ controller ตัวเดียวตลอดอายุของ State', 'dispose คู่กับ initState: อะไรที่ “เปิด” ตอนเกิด ต้อง “ปิด” ตอนตาย'],
          alts: [
            { alt: 'ทำไมไม่สร้าง `TextEditingController()` ใน build()?', result: 'build ถูกเรียกบ่อย → ได้ controller ตัวใหม่ทุกครั้ง ข้อความ/ตำแหน่งเคอร์เซอร์รีเซ็ต และตัวเก่าไม่เคยถูก dispose → memory leak' },
            { alt: 'ทำไมไม่ใช้ `Theme.of(context)` หรือ `ModalRoute.of(context)` ใน initState?', result: 'ใน initState วิดเจ็ตยังลงทะเบียน dependency กับ InheritedWidget ไม่ได้ จะได้ error ประมาณ `dependOnInheritedWidgetOfExactType ... was called before initState() completed` — ตำราจึงบอกว่า “บางครั้ง didChangeDependencies เหมาะสมกว่า” (บทที่ 9 และ 11 ใช้จริง: [[9.6]], [[lab11]])' },
          ] },
        { t: 'callout', kind: 'supp', title: '`mounted` — เครื่องหมายว่า State ยังมีชีวิตอยู่', body: '`mounted` เป็น `true` ตั้งแต่ใส่ลงต้นไม้จนถึง dispose ถ้าเรียก `setState` หลัง dispose (เช่น งาน `await` ที่เสร็จหลังผู้ใช้ปิดหน้าไปแล้ว) จะได้ error `setState() called after dispose()` วิธีกันคือ `if (!mounted) return;` ก่อน setState — ตำราใช้จริงในบทที่ 9 และ 12 ([[9.5]], [[12.2]])' },
      ],
      quiz: [
        { type: 'order', q: 'เรียงลำดับเมธอดเมื่อ StatefulWidget ถูกใส่ลงต้นไม้ครั้งแรกจนแสดงผล', items: ['`createState()`', '`initState()`', '`didChangeDependencies()`', '`build()`'] },
        { type: 'spot', q: 'โค้ด dispose นี้ผิดหลักที่ตำราย้ำ — บรรทัดไหน?', code: `@override
void dispose() {
  super.dispose();
  _controller.dispose();
  _timer.cancel();
}`, bad: 'super.dispose();', explain: '`super.dispose()` ต้องอยู่ **บรรทัดสุดท้าย** — เก็บกวาดของเราก่อน แล้วค่อยให้คลาสแม่ปิดฉาก' },
        { q: 'ควรสร้าง `AnimationController` ที่ใช้ตลอดอายุหน้าจอในเมธอดใด?', options: [
          { t: '`initState()` แล้ว dispose ใน `dispose()`', ok: true },
          { t: '`build()` เพราะถูกเรียกก่อนแสดงผลเสมอ', why: 'build ถูกเรียกหลายครั้ง → สร้าง controller ซ้ำและรั่ว' },
          { t: '`didUpdateWidget()`', why: 'ถูกเรียกเมื่อ parent ส่ง config ใหม่ ไม่ใช่ตอนเริ่มต้น' },
        ] },
        { q: 'ผู้ใช้กดบันทึก (งาน await 3 วินาที) แล้วกดย้อนกลับทันที เมื่องานเสร็จโค้ดเรียก `setState(...)` — ผลคือ?', options: [
          { t: 'error `setState() called after dispose()` — ควรเช็ก `if (!mounted) return;` ก่อน', ok: true },
          { t: 'หน้าจอเก่าจะถูกเปิดขึ้นมาใหม่เพื่อแสดงผล', why: 'State ที่ dispose แล้วไม่กลับมา' },
          { t: 'ไม่มีอะไรเกิดขึ้น Flutter ข้ามให้เอง', why: 'ในโหมด debug จะเกิด error ชัดเจน' },
        ] },
      ],
    },
    // ─────────────────────────── 7.6
    {
      id: '7.6', title: 'setState(): ตัวกระตุ้นการอัปเดต UI', source: '§7.6', exam: true,
      gist: 'เปลี่ยนตัวแปร **นอก** `setState()` → ค่าเปลี่ยนแต่จอไม่อัปเดต · `setState()` ทำเครื่องหมาย element ว่า **dirty** แล้ว Flutter **รวม (batch)** การ build ไว้ในเฟรมถัดไป',
      blocks: [
        { t: 'code', title: 'ผิด vs ถูก (ตำรา §7.6)', src: `// วิธีที่ผิด - UI จะไม่อัปเดต
void _incrementCounterWrong() {
  _counter++; // ตัวแปร State เปลี่ยน...
  print('ตัวนับเปลี่ยน (ผิด): $_counter');
  // ... แต่ Flutter ไม่รู้ว่าต้อง rebuild!
}

// วิธีที่ถูก - UI จะอัปเดต
void _incrementCounterCorrect() {
  setState(() { // บอก Flutter ว่ามีบางอย่างเปลี่ยน
    _counter++; // แก้ไข state ภายใน callback
    print('ตัวนับเปลี่ยน (ถูก): $_counter');
  });
  // Flutter กำหนดเวลาเรียก build() หลังจาก callback นี้เสร็จสิ้น
}`, hl: ['_counter++; // ตัวแปร State เปลี่ยน'] },
        { t: 'viz', id: 'ch07.setstate', name: 'ss', title: 'หน่วยความจำ vs หน้าจอ', try: 'กดปุ่มแดง 2 ครั้ง (จอไม่เปลี่ยน) แล้วกดปุ่มฟ้า 1 ครั้ง — จอกระโดดจาก 0 เป็น 3 · จากนั้นลอง “setState ×3” แล้วดูว่า build ถูกเรียกกี่ครั้ง' },
        'ตำราตอบว่า **ทำไมต้องเรียก setState**: “มันทำเครื่องหมาย element ของวิดเจ็ตว่า dirty เพิ่มเข้าไปในลิสต์ของ elements ที่ต้อง rebuild ในระหว่างรอบการเรนเดอร์เฟรมถัดไป สิ่งนี้ทำให้มั่นใจได้ว่าการอัปเดต UI จะถูกรวม (batch) อย่างมีประสิทธิภาพ แทนที่จะเกิดขึ้นแบบสุ่ม”',
        { t: 'why', choice: 'แก้ state **ภายใน** callback ของ `setState()`',
          because: ['Flutter **ไม่ได้เฝ้าดูตัวแปร** ของเรา — ต้องมีสัญญาณชัดเจนว่า “ข้อมูลเปลี่ยนแล้ว”', 'การจดว่า dirty แล้วรอเฟรมถัดไป ทำให้ setState หลายครั้งในคราวเดียวได้ build แค่ครั้งเดียว', 'อ่านโค้ดแล้วเห็นชัดว่าบรรทัดไหนเปลี่ยน state'],
          alts: [
            { alt: 'ทำไมไม่แก้ตัวแปรตรงๆ แล้วปล่อยไว้?', result: 'ค่าในหน่วยความจำเปลี่ยน แต่จอยังแสดงค่าเก่า จนกว่าจะมีอะไรอื่นทำให้ build (แล้วจอจะ “กระโดด” ค่าแบบงงๆ)', viz: { name: 'ss' } },
            { alt: 'ทำไมไม่เรียก `build(context)` เองหลังแก้ตัวแปร?', result: 'เราไม่ได้เป็นคนเรียก build — framework เรียก การเรียกเองแค่ได้วิดเจ็ตชุดใหม่ที่ไม่ถูกนำไปใช้ หน้าจอไม่เปลี่ยน' },
            { alt: 'แก้ตัวแปรก่อน แล้วค่อยเรียก `setState(() {})` ว่างๆ ได้ไหม?', result: 'ได้ผลเหมือนกัน (ตำราบอกว่าแก้ก่อนเรียกได้ ถ้าไม่ขึ้นกับ state อื่นใน callback)', ok: 'สะดวกกว่าในบางกรณี แต่การแก้ใน callback อ่านง่ายกว่าว่าอะไรคือการเปลี่ยน state' },
          ] },
        { t: 'callout', kind: 'supp', title: 'setState กระทบแค่ไหน (rebuild scope)', body: [
          '`setState()` ทำให้ `build()` **ของ State นั้นทั้งเมธอด** ทำงานใหม่ และวิดเจ็ตลูกทั้งหมดที่ไม่ใช่ `const` ถูกสร้างใหม่ด้วย ข้อสรุปเชิงปฏิบัติ:',
          { t: 'list', items: ['เก็บ state ไว้ **ใกล้จุดที่ใช้ที่สุด** — แยกส่วนที่เปลี่ยนออกเป็นวิดเจ็ตเล็กๆ ของมันเอง', 'ใส่ `const` ให้วิดเจ็ตที่ไม่เปลี่ยน Flutter จะข้ามการสร้างใหม่ (ดู [[core/c4]])', 'rebuild ไม่ได้แปลว่าวาดจอใหม่ทั้งหมด Flutter เทียบแล้ววาดเฉพาะส่วนที่ต่าง'] },
        ] },
        { t: 'callout', kind: 'warn', title: 'callback ของ setState ต้องเป็นแบบ synchronous', body: 'เขียน `setState(() async { ... await ... })` ไม่ได้ (Flutter โยน error “setState() callback argument returned a Future”) ให้ `await` งานให้เสร็จก่อน แล้วค่อย `setState` ด้วยผลลัพธ์ — และตรวจ `mounted` ก่อน' },
      ],
      quiz: [
        { q: '`_counter` เริ่มที่ 0 ผู้ใช้กดปุ่มที่ทำ `_counter++` (ไม่มี setState) 2 ครั้ง แล้วกดปุ่มที่ทำ `setState(() { _counter++; })` 1 ครั้ง จอจะแสดงเลขอะไร?', options: [
          { t: '3', ok: true, why: 'ค่าในหน่วยความจำเป็น 3 แล้ว เมื่อ build ครั้งถัดไปเกิดขึ้นจอจึงแสดง 3' },
          { t: '1', why: 'build อ่านค่าปัจจุบันของตัวแปร ไม่ได้นับจำนวน setState' },
          { t: '0', why: 'setState ทำให้ build เกิดขึ้น จอจึงอัปเดต' },
        ] },
        { q: 'ในคลิกเดียว โค้ดเรียก setState 3 ครั้งติดกัน build() จะถูกเรียกกี่ครั้งในเฟรมถัดไป?', options: [
          { t: '1 ครั้ง — element ถูกทำเครื่องหมาย dirty แล้วรวมเป็นการ build ครั้งเดียว', ok: true },
          { t: '3 ครั้ง — ตาม setState แต่ละครั้ง', why: 'setState ไม่ได้ build ทันที แค่ทำเครื่องหมาย dirty' },
          { t: '0 ครั้ง — เพราะเรียกถี่เกินไป', why: 'อย่างน้อยหนึ่งครั้งเสมอเมื่อ dirty' },
        ] },
        { q: 'ข้อใดถูกต้องเกี่ยวกับ `setState(fn)`?', options: [
          { t: '`fn` ทำงานทันที จากนั้น framework นัดเรียก `build()`', ok: true },
          { t: '`fn` ทำงานในเฟรมถัดไป', why: 'callback ทำงานทันที — สิ่งที่ถูกเลื่อนคือ build' },
          { t: 'setState เรียก `build()` ทันทีแบบ synchronous', why: 'build ถูกนัดไว้ทำในเฟรมถัดไป' },
        ] },
      ],
    },
    // ─────────────────────────── 7.7
    {
      id: '7.7', title: 'Ephemeral State กับ App State', source: '§7.7',
      gist: '**Ephemeral** = state ของวิดเจ็ตเดียว (ใช้ `setState`) · **App state** = state ที่หลายส่วนของแอปใช้ร่วมกัน (ใช้แพ็กเกจจัดการ state เช่น Provider ในบทที่ 10)',
      blocks: [
        { t: 'compare', cols: ['', 'Ephemeral State (Local/UI)', 'App State (Shared)'], rows: [
          ['ขอบเขต', 'อยู่ในวิดเจ็ตเดียว (หรือส่งระหว่าง parent–child โดยตรง)', 'แชร์ข้ามหลายหน้าจอ/วิดเจ็ตที่อยู่ห่างกัน'],
          ['ตัวอย่างในตำรา', 'หน้าปัจจุบันใน PageView, ความคืบหน้าแอนิเมชัน, แท็บที่เลือกใน BottomNavigationBar, ข้อความใน TextField ก่อนส่ง', 'ข้อมูลล็อกอิน, รถเข็นสินค้า, theme ทั้งแอป, การแจ้งเตือน'],
          ['จัดการด้วย', '`StatefulWidget` + `setState()`', 'แพ็กเกจจัดการ state (Provider, Riverpod, BLoC, GetX ฯลฯ)'],
          ['อายุ', 'ตามวิดเจ็ต', 'อาจต้องเก็บข้าม session'],
        ] },
        { t: 'viz', id: 'sorter', title: 'state นี้เป็นแบบไหน?', props: {
          buckets: [{ id: 'e', label: 'Ephemeral', desc: 'วิดเจ็ตเดียวใช้' }, { id: 'a', label: 'App state', desc: 'หลายส่วนใช้ร่วมกัน' }],
          items: [
            { t: 'แท็บที่เลือกอยู่ใน BottomNavigationBar', bucket: 'e', why: 'ตำรายกเป็นตัวอย่าง ephemeral โดยตรง' },
            { t: 'สินค้าในรถเข็น (badge บนทุกหน้า + หน้า checkout)', bucket: 'a', why: 'หลายหน้าจอต้องเห็นค่าเดียวกัน' },
            { t: 'ผู้ใช้ที่ล็อกอินอยู่', bucket: 'a', why: 'เกือบทุกส่วนของแอปต้องรู้' },
            { t: 'ข้อความที่กำลังพิมพ์ในช่องค้นหา (ก่อนกดค้นหา)', bucket: 'e', why: 'ตำรา: “ข้อความใน TextField ก่อนส่ง”' },
            { t: 'โหมดมืด/สว่างของทั้งแอป', bucket: 'a', why: 'theme ทั่วทั้งแอป' },
            { t: 'ความคืบหน้าแอนิเมชันของปุ่มหนึ่งปุ่ม', bucket: 'e', why: 'เป็นเรื่องของวิดเจ็ตเดียว' },
          ] } },
        { t: 'why', choice: 'ใช้ `setState` กับ ephemeral state และใช้แพ็กเกจจัดการ state กับ app state',
          because: ['ephemeral: เครื่องมือที่ง่ายที่สุดก็พอ และโค้ดอยู่ใกล้จุดใช้งาน', 'app state: ถ้าใช้ setState ต้อง “ยก state ขึ้น” ไปไว้บนสุดแล้วส่งผ่าน constructor/callback ทีละชั้น — ตำราบอกว่า “ยุ่งยากและเกิดข้อผิดพลาดได้ง่ายในแอปขนาดใหญ่”'],
          alts: [
            { alt: 'ทำไมไม่ใส่ทุกอย่างใน Provider ตั้งแต่แรก จะได้เหมือนกันหมด?', result: 'state เล็กๆ ของวิดเจ็ตเดียว (แท็บที่เลือก, แอนิเมชัน) จะไปปนอยู่ในที่เก็บกลาง ทำให้หาและทดสอบยากขึ้นโดยไม่ได้ประโยชน์', ok: 'state นั้นเริ่มถูกใช้จากหลายที่จริงๆ' },
            { alt: 'ทำไมไม่ใช้ setState กับทุกอย่าง?', result: 'state ที่แชร์ต้องยกขึ้นไปไว้ที่ ancestor ร่วมแล้วส่งต่อลงไปหลายชั้น (prop drilling) — บทที่ 10 เปิดด้วยปัญหานี้พอดี [[10.1]]', ok: 'แอปเล็กที่ state แชร์กันแค่ parent–child ชั้นเดียว' },
          ] },
      ],
      quiz: [
        { q: 'ข้อใดเป็น ephemeral state ตามนิยามในตำรา?', options: [
          { t: 'หน้าปัจจุบันใน PageView', ok: true },
          { t: 'ข้อมูลผู้ใช้ที่ล็อกอิน', why: 'ใช้ทั่วแอป → app state' },
          { t: 'จำนวนสินค้าในรถเข็นที่แสดงทุกหน้า', why: 'แชร์หลายหน้าจอ → app state' },
        ] },
        { q: 'ทำไมตำราจึงบอกว่า app state ควรใช้แพ็กเกจจัดการ state?', options: [
          { t: 'เพราะการยก state ขึ้นแล้วส่ง callback ลงต้นไม้ลึกๆ ยุ่งยากและผิดพลาดง่ายในแอปใหญ่', ok: true },
          { t: 'เพราะ setState ใช้กับข้อมูลชนิด List ไม่ได้', why: 'setState ใช้กับข้อมูลชนิดไหนก็ได้' },
          { t: 'เพราะ StatefulWidget ทำงานช้า', why: 'ไม่ใช่เรื่องความเร็ว เป็นเรื่องการจัดระเบียบการแชร์ข้อมูล' },
        ] },
      ],
    },
    // ─────────────────────────── 7.8
    {
      id: '7.8', title: 'การยก State ขึ้น (Lifting State Up)', source: '§7.8', exam: true,
      gist: 'ลูกเรียก `setState()` ของแม่ตรงๆ ไม่ได้ → เก็บ state ไว้ที่ **ancestor ร่วม** แล้วส่ง **ข้อมูลลง** ผ่าน constructor และส่ง **callback ลง** ให้ลูกเรียก **ขึ้น** มาเมื่อต้องการเปลี่ยน',
      blocks: [
        { t: 'steps', items: [
          'State ถูกเก็บไว้ใน ancestor ร่วม (ต้องเป็น StatefulWidget)',
          'Ancestor ส่ง **ฟังก์ชัน callback** ลงไปยัง child ผ่าน constructor',
          'เมื่อเกิดเหตุการณ์ใน child ที่ต้องการเปลี่ยน state ร่วม child เรียก callback นั้น',
          'callback (ซึ่งนิยามใน ancestor) เรียก `setState()` ใน State ของ ancestor',
          'Ancestor rebuild แล้วส่งข้อมูลใหม่ลงไปยัง children ทุกตัวที่เกี่ยวข้อง (รวมตัวที่เริ่มเหตุการณ์)',
        ] },
        { t: 'viz', id: 'ch07.lift', name: 'lift', title: 'ข้อมูลลง callback ขึ้น', try: 'สลับ Switch ในโหมด “ยก state ขึ้น” ดูลูกศร callback ขึ้นและข้อมูลลง แล้วเปลี่ยนเป็นโหมด “ลูกเก็บ state เอง” แล้วสลับอีกครั้ง' },
        { t: 'code', title: 'ParentWidget / ChildWidget (ตำรา §7.8)', src: `// Parent Widget (Stateful)
class ParentWidget extends StatefulWidget {
  const ParentWidget({super.key});
  @override
  State<ParentWidget> createState() => _ParentWidgetState();
}

class _ParentWidgetState extends State<ParentWidget> {
  bool _isActive = false; // State เก็บโดย parent

  void _handleActiveChange(bool newValue) {
    setState(() { // Parent อัปเดต state ผ่าน callback
      _isActive = newValue;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('สถานะ Parent คือ: \${_isActive ? "Active" : "Inactive"}'),
        ChildWidget( // ส่ง state ลงไป
          isActive: _isActive,
          onActiveChanged: _handleActiveChange, // ส่ง callback ลงไป
        ),
      ],
    );
  }
}

// Child Widget (อาจเป็น Stateless หรือ Stateful)
class ChildWidget extends StatelessWidget {
  final bool isActive;
  final ValueChanged<bool> onActiveChanged; // ฟังก์ชันสำหรับเรียก parent

  const ChildWidget({
    super.key,
    required this.isActive,
    required this.onActiveChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Switch( // วิดเจ็ตตัวอย่างที่เปลี่ยนค่า boolean
      value: isActive,
      onChanged: onActiveChanged, // เรียก callback ของ parent เมื่อมีการเปลี่ยนแปลง
    );
  }
}`, notes: [
          { at: 'bool _isActive = false;', note: '“แหล่งความจริงเดียว” ของค่านี้อยู่ที่ parent — ลูกไม่มีสำเนาของตัวเอง' },
          { at: 'onActiveChanged: _handleActiveChange,', note: 'ส่ง **ตัวฟังก์ชัน** ของ parent ลงไป (ไม่มีวงเล็บ)' },
          { at: 'final ValueChanged<bool> onActiveChanged;', note: '`ValueChanged<bool>` คือชื่อย่อของชนิด `void Function(bool)` — ฟังก์ชันที่รับ bool และไม่คืนค่า (มีคู่ `VoidCallback` = `void Function()`)' },
          { at: 'onChanged: onActiveChanged,', note: 'Switch เรียก callback พร้อมค่าใหม่ → ไปจบที่ `setState` ของ parent' },
        ] },
        { t: 'why', choice: 'เก็บ state ไว้ที่ **ancestor ร่วม** แล้วให้ลูกแจ้งผ่าน callback',
          because: ['มี **แหล่งความจริงเดียว** — ทุกวิดเจ็ตที่แสดงค่านี้อ่านจากที่เดียวกัน จึงไม่มีทางขัดกัน', 'ลูกเป็น StatelessWidget ได้ (เรียบง่าย ทดสอบง่าย)', 'ลูกไม่ต้องรู้ว่า parent จะทำอะไรกับค่า แค่ “แจ้ง” ผ่านฟังก์ชันที่ได้รับ'],
          alts: [
            { alt: 'ทำไมไม่ให้ลูกเก็บ `_isActive` ของตัวเอง?', result: 'จะมีสองสำเนา: parent แสดง “Inactive” ขณะที่ Switch เปิดอยู่ — ข้อมูลขัดกันบนจอเดียว', viz: { name: 'lift', mode: 'local' } },
            { alt: 'ทำไมลูกไม่เรียก `setState` ของ parent ตรงๆ?', result: 'ทำไม่ได้ — `setState` เป็นเมธอดของออบเจกต์ State ของ parent ซึ่งเป็นคลาส private (`_ParentWidgetState`) และลูกไม่มีตัวอ้างอิงถึงมัน' },
          ] },
        { t: 'callout', kind: 'note', title: 'ข้อจำกัดที่ตำราทิ้งท้ายไว้', body: '“รูปแบบนี้เป็นพื้นฐานแต่สามารถซับซ้อนได้กับ widget tree ที่ลึก” — ถ้า state ต้องเดินทางผ่านหลายชั้นที่ไม่ได้ใช้มันเลย นั่นคือสัญญาณว่าถึงเวลาใช้ Provider ([[10.1]])' },
      ],
      quiz: [
        { type: 'order', q: 'เรียงลำดับเหตุการณ์เมื่อผู้ใช้สลับ Switch ในลูก (แบบยก state ขึ้น)', items: ['Switch เรียก `onActiveChanged(true)`', '`_handleActiveChange` ของ parent ทำงาน', 'parent เรียก `setState(() { _isActive = true; })`', 'parent rebuild', 'ChildWidget ตัวใหม่ได้ `isActive: true` แล้ว Switch แสดงสถานะใหม่'] },
        { q: 'ชนิด `ValueChanged<bool>` หมายถึงอะไร?', options: [
          { t: 'ฟังก์ชันที่รับ `bool` หนึ่งตัวและไม่คืนค่า (`void Function(bool)`)', ok: true },
          { t: 'ตัวแปร bool ที่เปลี่ยนค่าได้', why: 'เป็นชนิดของ **ฟังก์ชัน** ไม่ใช่ค่า' },
          { t: 'Stream ของค่า bool', why: 'ไม่เกี่ยวกับ Stream' },
        ] },
        { q: 'ถ้าให้ทั้ง parent และ child เก็บ `_isActive` ของตัวเอง ปัญหาหลักคืออะไร?', options: [
          { t: 'ค่าสองสำเนาไม่ตรงกัน จอแสดงข้อมูลขัดกันเอง', ok: true },
          { t: 'compile ไม่ผ่าน', why: 'compile ผ่าน — ปัญหาเกิดตอนใช้งาน ซึ่งหายากกว่า' },
          { t: 'แอปช้าลงมาก', why: 'ประเด็นคือความถูกต้องของข้อมูล' },
        ] },
      ],
    },
    // ─────────────────────────── Lab
    {
      id: 'lab7', title: 'ปฏิบัติการบทที่ 7: ColorChanger', short: 'แลป', source: 'ปฏิบัติการ',
      gist: '5 แบบฝึกหัด: แปลง Stateless → Stateful, ตัวนับด้วย setState, กล่องเปลี่ยนสีเมื่อแตะ, สุ่มสีเริ่มต้นใน `initState`, ฝึก `dispose` controller',
      blocks: [
        { t: 'viz', id: 'ch07.lab', title: 'ColorChanger จำลอง', try: 'แตะกล่องหลายครั้ง → กด Hot Reload (สีไม่สุ่มใหม่) → กด Hot Restart (สีเริ่มต้นสุ่มใหม่) → กด “ออกจากหน้านี้” แล้วดู log ของ dispose' },
        { t: 'steps', items: [
          '**แปลง Stateless → Stateful**: เปลี่ยน `MyHomePage` เป็น `extends StatefulWidget`, เพิ่ม `createState()`, ย้าย `build()` ไปไว้ใน `_MyHomePageState`',
          '**ตัวนับ**: เพิ่ม `int _counter = 0;` ในคลาส State (นอก build), แสดงด้วย `Text(\'ค่าตัวนับ: $_counter\')` — ต้อง **ลบ `const`** ออกจาก Text และบรรพบุรุษ (แต่ `TextStyle` ยัง const ได้), เพิ่ม `_incrementCounter` ที่ใช้ setState และ FloatingActionButton',
          '**ColorChanger**: StatefulWidget ใหม่ใน `lib/color_changer.dart` มี `_currentColor`, ลิสต์สี, `Random` และ `GestureDetector(onTap: _changeColor)` ห่อ Container 150×150',
          '**initState**: เปลี่ยนเป็น `late Color _currentColor;` แล้วสุ่มสีใน `initState()` **หลัง** `super.initState()` — ต้อง Hot Restart จึงเห็นผล',
          '**dispose**: `late final TextEditingController _controller;` สร้างใน initState และ `_controller.dispose()` ก่อน `super.dispose()`',
        ] },
        { t: 'code', title: 'lib/color_changer.dart (ผลลัพธ์หลังแบบฝึกหัด 3–5)', src: `import 'dart:math'; // จำเป็นสำหรับ Random
import 'package:flutter/material.dart';

class ColorChanger extends StatefulWidget {
  const ColorChanger({super.key});
  @override
  State<ColorChanger> createState() => _ColorChangerState();
}

class _ColorChangerState extends State<ColorChanger> {
  late Color _currentColor; // ใช้ 'late' จะถูกกำหนดค่าใน initState
  final List<Color> _availableColors = [
    Colors.red, Colors.green, Colors.yellow, Colors.purple, Colors.orange, Colors.teal
  ];
  final Random _random = Random();

  late final TextEditingController _controller; // ประกาศ controller

  @override
  void initState() {
    super.initState();
    _currentColor = _availableColors[_random.nextInt(_availableColors.length)];
    _controller = TextEditingController(); // กำหนดค่าเริ่มต้น controller
    print('initState: Controller ถูกสร้างแล้ว');
  }

  @override
  void dispose() {
    print('dispose: กำลัง dispose controller');
    _controller.dispose(); // Dispose controller
    super.dispose(); // เรียก super dispose เป็นลำดับสุดท้าย
  }

  void _changeColor() {
    setState(() {
      _currentColor = _availableColors[_random.nextInt(_availableColors.length)];
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector( // ตรวจจับการแตะ
      onTap: _changeColor, // เรียกเมธอดเมื่อแตะ
      child: Container(
        width: 150,
        height: 150,
        color: _currentColor, // ใช้ตัวแปร state สำหรับสี
        alignment: Alignment.center,
        child: const Text(
          'แตะฉัน!',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}`, notes: [
          { at: 'late Color _currentColor;', note: '`late` = “สัญญาว่าจะกำหนดค่าก่อนใช้” (ใน initState) ถ้าอ่านก่อนกำหนดจะได้ `LateInitializationError`' },
          { at: 'late final TextEditingController _controller;', note: '`late final` = กำหนดได้ครั้งเดียว (ใน initState) แล้วห้ามเปลี่ยน' },
          { at: 'super.initState();', note: 'บรรทัดแรกเสมอ' },
          { at: '_controller.dispose(); // Dispose controller', note: 'ปิดของเราก่อน…' },
          { at: 'super.dispose(); // เรียก super', note: '…แล้วค่อยให้คลาสแม่ปิดเป็นลำดับสุดท้าย' },
          { at: "child: const Text(", note: 'ข้อความ “แตะฉัน!” ไม่เปลี่ยน → const ได้ แม้ Container (สีเปลี่ยน) จะ const ไม่ได้' },
        ] },
        { t: 'callout', kind: 'warn', title: 'ทำไมแบบฝึกหัด 4 ต้อง Hot Restart', body: '**Hot Reload** เก็บ State เดิมไว้และเรียกแค่ `build()` ใหม่ — `initState()` ไม่ถูกเรียกซ้ำ จึงไม่เห็นสีสุ่มใหม่ · **Hot Restart** ทิ้ง State ทั้งหมดแล้วเริ่มแอปใหม่ initState จึงทำงานอีกครั้ง' },
        { t: 'callout', kind: 'real', title: 'จุดไม่ตรงกันในตำรา', body: 'หัวข้อกิจกรรมท้ายบทเขียนว่าให้ใช้ `ElevatedButton` แต่โค้ดในแบบฝึกหัดที่ 2 ใช้ `FloatingActionButton` — ใช้แบบไหนก็ได้ หลักการเหมือนกัน (`onPressed: _incrementCounter`)' },
        { t: 'callout', kind: 'note', title: 'ทำไมแบบฝึกหัด 5 ไม่เห็น log ของ dispose', body: 'แอปนี้มีหน้าจอเดียว State ของ ColorChanger จะถูกถอดถาวรก็ต่อเมื่อปิดแอป (ซึ่งบางครั้งไม่ได้เรียก dispose เลย) ตำรายอมรับข้อนี้ไว้เอง — บทที่ 9 จะมีการ `pop` หน้าจอที่ทำให้เห็น dispose จริง ([[9.3]])' },
      ],
      quiz: [
        { q: 'เปลี่ยนโค้ดใน `initState()` แล้วกด Hot Reload แต่ไม่เห็นผล เพราะอะไร?', options: [
          { t: 'Hot Reload เก็บ State เดิม initState จึงไม่ถูกเรียกซ้ำ — ต้อง Hot Restart', ok: true },
          { t: 'initState ทำงานเฉพาะบนอุปกรณ์จริง', why: 'ทำงานทุกแพลตฟอร์ม' },
          { t: 'ต้องเรียก `setState` ใน initState ก่อน', why: 'ไม่จำเป็นและไม่ควร — ใน initState กำหนดค่าตรงๆ ได้เลย' },
        ] },
        { q: 'แสดงค่า `_counter` ด้วย `const Text(\'ค่าตัวนับ: $_counter\')` จะเกิดอะไร?', options: [
          { t: 'compile ไม่ผ่าน — ค่าจากตัวแปรใช้ใน const ไม่ได้ ต้องลบ const', ok: true },
          { t: 'แสดงผลได้แต่ไม่อัปเดต', why: 'ไปไม่ถึงตอนรัน — compiler ไม่ยอมตั้งแต่แรก' },
          { t: 'ทำงานปกติ', why: '`const` ต้องการค่าที่รู้ตอน compile' },
        ] },
      ],
    },
  ],
  rules: [
    'แก้ตัวแปร state **ภายใน** `setState(() { ... })` เสมอ — นอก setState จอไม่อัปเดต',
    'ตัวแปร state เป็นฟิลด์ของคลาส State **นอก** `build()`',
    '`super.initState()` บรรทัดแรก · `super.dispose()` บรรทัดสุดท้าย',
    'สร้าง controller/subscription ใน `initState` แล้วปิดใน `dispose` (ไม่สร้างใน build)',
    '`build()` ต้องเร็วและไม่มี side effect — มันถูกเรียกบ่อย',
    'อ่าน configuration ของวิดเจ็ตผ่าน `widget.xxx` ภายใน State',
    'ตั้งชื่อ State เป็น `_XxxState` (ขีดล่าง = private ในไฟล์)',
    'ลบ `const` ออกจากวิดเจ็ตที่แสดงค่าจากตัวแปร (แต่ส่วนย่อยที่คงที่ยัง const ได้)',
    '`onPressed: _fn` (ส่งฟังก์ชัน) ไม่ใช่ `onPressed: _fn()` (เรียกทันที)',
    'state ที่หลายวิดเจ็ตใช้ร่วมกัน → ยกขึ้นไปไว้ที่ ancestor ร่วม + callback (หรือใช้ Provider เมื่อลึกหลายชั้น)',
    'หลัง `await` เช็ก `mounted` ก่อน `setState` (เสริม)',
  ],
  handsOff: { heading: 'ส่งต่อไปบทที่ 8', body: [
    'ตำราปิดบทว่า: “เมื่อเราสามารถจัดการการเปลี่ยนแปลง state พื้นฐานได้แล้ว เราต้องการวิธีให้ผู้ใช้ **ป้อน** ข้อมูลได้อย่างมีประสิทธิภาพมากกว่าแค่การแตะปุ่ม” → [[ch08|บทที่ 8: Input และฟอร์ม]] ใช้ทุกอย่างในบทนี้ต่อทันที: controller สร้างใน initState/ปิดใน dispose, และข้อความที่พิมพ์คือ ephemeral state',
    { t: 'callout', kind: 'note', title: 'บทนี้ไม่มี “คำถามชวนคิดท้ายบท”', body: 'ต่างจากบทที่ 8–13 ที่ทุกบทจบด้วยคำถามส่งต่อ บทที่ 7 จบด้วยการแนะนำบทถัดไปเท่านั้น' },
  ] },
  quiz: [
    { q: 'สิ่งใดที่ **ไม่** ถูกสร้างใหม่เมื่อ parent rebuild แล้วส่ง StatefulWidget ชนิดเดิมมาที่ตำแหน่งเดิม?', options: [
      { t: 'ออบเจกต์ State', ok: true },
      { t: 'อินสแตนซ์ของ StatefulWidget', why: 'วิดเจ็ตถูกสร้างใหม่เสมอเมื่อ parent build' },
      { t: 'วิดเจ็ตลูกที่ไม่ใช่ const ใน build()', why: 'ถูกสร้างใหม่เมื่อ build ทำงาน' },
    ] },
    { q: 'คำสั่งใดทำให้ `build()` ของ State ทำงานในเฟรมถัดไป?', options: [
      { t: '`setState(() { ... })`', ok: true },
      { t: '`_counter++`', why: 'แค่เปลี่ยนค่าในหน่วยความจำ' },
      { t: '`initState()`', why: 'เรียกครั้งเดียวตอนเริ่ม และเราไม่เรียกเอง' },
    ] },
    { type: 'multi', q: 'เลือกทุกข้อที่ควรทำใน `dispose()`', options: [
      { t: '`_controller.dispose()`', ok: true },
      { t: '`_timer.cancel()`', ok: true },
      { t: '`_subscription.cancel()`', ok: true },
      { t: '`setState(() { _counter = 0; })`', why: 'State กำลังจะตาย การ setState ตอนนี้ไม่มีประโยชน์และผิดหลัก' },
    ] },
    { q: 'ปุ่ม “ถูกใจ” อยู่ในการ์ดโพสต์ และจำนวนถูกใจต้องแสดงทั้งในการ์ดและหัวหน้าจอ ควรเก็บ state ไว้ที่ใด (ใช้แค่ความรู้บทนี้)?', options: [
      { t: 'ที่ ancestor ร่วมของการ์ดและหัวหน้าจอ แล้วส่ง callback ให้ปุ่ม', ok: true },
      { t: 'ในปุ่มถูกใจ เพราะเป็นคนกด', why: 'หัวหน้าจอจะไม่รู้ค่า → ข้อมูลไม่ตรงกัน' },
      { t: 'เก็บทั้งในปุ่มและหัวหน้าจอ แล้วอัปเดตทั้งคู่', why: 'สองสำเนา เสี่ยงขัดกัน' },
    ] },
    { q: 'ต้องการอ่าน `Theme.of(context)` เพื่อตั้งค่าที่ขึ้นกับ theme ครั้งแรก เมธอดใดเหมาะกว่า initState ตามตำรา?', options: [
      { t: '`didChangeDependencies()`', ok: true },
      { t: '`dispose()`', why: 'ถูกเรียกตอนจบ' },
      { t: '`createState()`', why: 'อยู่ในคลาสวิดเจ็ต ยังไม่มี context' },
    ] },
  ],
};
