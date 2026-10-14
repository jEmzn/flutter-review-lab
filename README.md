# ทบทวน Flutter บทที่ 7–13 (Flutter Lessons Review)

เว็บทบทวนแบบโต้ตอบได้ สร้างจากตำรา 7 บทใน `../docs` และใช้ไฟล์ในเครื่องเท่านั้น

## เปิดใช้

ดับเบิลคลิก `index.html` ก็เปิดใช้ได้เลย (เปิดจาก `file://`)
- ไม่ต้องติดตั้งอะไร ไม่มี build step และใช้งานออฟไลน์ได้ทั้งหมด
- ภาพที่เป็น SQLite ใช้ SQLite จริงผ่าน `assets/vendor/sql-asm.js` (sql.js 1.10.3, MIT)

## โครงเนื้อหา (ภาพรวม → บท → หัวข้อ)

| ส่วน | เส้นทาง | เนื้อหา |
| --- | --- | --- |
| แผนที่ภาพรวม | `#/` | เส้นเรื่อง 7 บทพร้อมคำถามที่ส่งต่อระหว่างบท, กายวิภาคของแอป ex_13 (ไล่ action ทีละขั้น), ความคืบหน้า |
| บทที่ 7–13 | `#/ch07` … `#/ch13` | ภาพรวมบท, หัวข้อ (มีภาพโต้ตอบ, การ์ด “ทำไม / ทำไมไม่”, โค้ดพร้อมคำอธิบายรายบรรทัด, แบบทดสอบ), cheat sheet, คำถามท้ายบท |
| แกนกลาง (เสริม) | `#/core` | Widget/Element/State, BuildContext, InheritedWidget, rebuild ≠ repaint, event loop/mounted |
| Dart syntax (เสริม) | `#/dart` | การ์ดที่เลือกค่าแล้วเห็นผลทันที (ข้อความ error ทุกข้อรันกับ `dart run` / `dart analyze` จริง) |
| SQL ที่โจทย์ใช้ (เสริม) | `#/sql` | WHERE/LIKE/ORDER/COUNT/SUM/GROUP BY/JOIN/LIMIT/ช่วงเวลา/constraint/upsert + playground ที่มีข้อมูลตั้งต้นของโจทย์ q1–q6 |
| ชั้นเตรียมสอบ | `#/exam` | สูตร 7 ขั้น, ลำดับเวลาในห้องสอบ, เช็กลิสต์ที่บันทึกได้, การ์ดโจทย์ 6 ข้อ, ตารางว่าโจทย์ข้อไหนวัดหัวข้ออะไร |
| Walkthrough | `#/code/ex13`, `#/code/offline` | โค้ดจริงของ ex_13 และ todo_offline พร้อมคำอธิบาย และโหมดไล่ตาม action ข้ามไฟล์ |
| ฝึกจับผิดโค้ด | `#/bughunt` | คลิกบรรทัดที่ผิดในโค้ดจริงและกับดักจากตำรา/โจทย์ |
| ทบทวนข้อที่ผิด | `#/review` | รวมแบบทดสอบทั้งเว็บ (257 ข้อ) แล้วดึงเฉพาะข้อที่เคยตอบผิด หรือสุ่มข้อที่ยังไม่เคยตอบ |

ป้ายสีที่ใช้ทั้งเว็บ:
- ม่วง ◆ = เสริม ไม่อยู่ในตำรา
- ฟ้า ⓘ = พฤติกรรมจริงที่ตรวจจากซอร์ส ซึ่งอาจต่างจากตำรา
- ส้ม ✎ = จุดออกสอบ

ความคืบหน้า (หัวข้อที่อ่านแล้ว ผลแบบทดสอบ เช็กลิสต์) เก็บใน `localStorage` ของเบราว์เซอร์ที่ใช้เปิด

## หลักการด้านความถูกต้อง

- **ยึดตำรา** — โค้ดที่ยกมาตรงตามต้นฉบับ
- ส่วนที่ตำราไม่ตรงกับพฤติกรรมจริงจะมีกล่อง “พฤติกรรมจริง” โดยตรวจจากซอร์สในเครื่อง:
  - Flutter 3.47.6 (`~/flutter`)
  - `provider-6.1.5+1`
  - `sqflite_common-2.5.13+1`
  - `sqflite_android-2.4.2+3`
- ข้อความ error ทุกข้อในหน้า Dart/แกนกลางคัดลอกจากผลการรันจริง ส่วน SQL ทุกข้อรันบน SQLite จริง (sql.js 3.45)

## เครื่องมือ (ต้องมี Node ≥ 22)

```sh
node tools/gen-sources.mjs   # คัดลอกซอร์สจริงจาก ../ex_13 และ ../review_final_app ลง js/data/sources.js
                             #   (รันใหม่ทุกครั้งที่โค้ดสองโปรเจกต์นั้นเปลี่ยน)
node tools/check.mjs         # ตรวจลิงก์ [[...]], id ของภาพ, anchor ของคำอธิบายโค้ด/walkthrough/จับผิด, รูปแบบแบบทดสอบ
bash tools/shot.sh --dom ch13/13.7          # เปิดหน้าด้วย headless Chrome แล้วรายงาน error/ลิงก์เสีย
bash tools/shot.sh ch13/13.7 out.png 1280   # ถ่ายภาพหน้าจอ
node tools/drive.mjs <route> <prefix> '<json steps>'   # คลิก/พิมพ์/ประเมิน JS ผ่าน DevTools Protocol
```

หน้า `#/dev` รวมการทดสอบตัวเองของเครื่องยนต์ภาพ เช่น SQLite บน `file://`, datatype mismatch, injection และ rollback

## โครงไฟล์

```
index.html
assets/css/      tokens · base · layout · components · viz · chapters · supp
assets/vendor/   sql-asm.js (+ LICENSE)
js/core/         util · store · highlight · markup · codeview · quiz · blocks · vizreg · app
js/viz/          common · tree · stepper · swimlane · phone · sql-engine · sqlkit · core · dart · walk · dev
js/viz/chapters/ ch07 … ch13
js/content/      glossary · map · core · ch07 … ch13 · sql · dart · exam · walk-ex13 · walk-offline · bughunt · review
js/data/         sources.js (สร้างโดย gen-sources.mjs)
tools/           gen-sources.mjs · check.mjs · shot.sh · drive.mjs
```

ทุกไฟล์เป็น classic script ที่ประกาศลง `window.FR` เพราะ Chrome บล็อก ES modules และ `fetch` บน `file://`

ถ้าจะเพิ่มบทหรือหัวข้อ:
1. เพิ่มอ็อบเจกต์ใน `js/content/*.js`
2. ถ้ามีภาพโต้ตอบใหม่ ให้ลงทะเบียนด้วย `FR.viz.register('id', factory)`
3. เพิ่ม `<script>` ใน `index.html`
4. รัน `node tools/check.mjs`
# flutter-review-lab git init  git add README.md
