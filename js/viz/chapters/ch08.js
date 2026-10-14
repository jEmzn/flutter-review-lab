/* Chapter 8 visualizations — Input & Forms */
(function () {
  'use strict';
  const { h, clear, sleep, flash, seg, btn, toggle } = FR.util;
  const md = (s) => FR.markup.inline(s);
  const R = FR.viz.register;

  // validators from the book
  const V = {
    email(v) { if (v == null || v === '') return 'กรุณาป้อนอีเมลของคุณ'; if (!v.includes('@') || !v.includes('.')) return 'กรุณาป้อนที่อยู่อีเมลที่ถูกต้อง'; return null; },
    emailTrim(v) { const e = (v || '').trim(); if (!e) return 'กรุณาป้อนอีเมลของคุณ'; if (!e.includes('@') || !e.includes('.')) return 'กรุณาป้อนที่อยู่อีเมลที่ถูกต้อง'; return null; },
    password(v) { if (v == null || v === '') return 'กรุณาป้อนรหัสผ่านของคุณ'; if (v.length < 6) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'; return null; },
  };

  // ───────── 8.1 / overview / lab: the form pipeline ─────────
  R('ch08.pipeline', (body, props) => {
    const full = !!props.full;
    const ph = FR.Phone.create({ title: 'ฟอร์มล็อกอิน', small: !full });
    const email = FR.ui.field({ label: 'อีเมล', hint: 'you@example.com', prefix: '✉', type: 'email' });
    let obscure = true;
    const eye = h('button', { type: 'button', class: 'ph-icon', title: 'แสดง/ซ่อนรหัสผ่าน' }, '👁');
    const pass = FR.ui.field({ label: 'รหัสผ่าน', hint: 'ป้อนรหัสผ่านของคุณ', prefix: '🔒', obscure: true, suffix: full ? eye : null });
    eye.addEventListener('click', () => { obscure = !obscure; pass.input.type = obscure ? 'password' : 'text'; con.log(`setState(() { _obscurePassword = ${obscure}; })`, 'dim'); });
    const submit = FR.ui.btn('ล็อกอิน', () => run());
    ph.setBody(FR.ui.pad(FR.ui.text('กรุณาป้อนข้อมูลเข้าระบบ:'), email.el, pass.el, submit));
    let submittedOnce = false;
    const errs = { email: null, pass: null };
    if (full) {
      // AutovalidateMode.onUserInteractionIfError
      email.input.addEventListener('input', () => { if (errs.email) { errs.email = V.emailTrim(email.value); email.setError(errs.email); } });
      pass.input.addEventListener('input', () => { if (errs.pass) { errs.pass = V.password(pass.value); pass.setError(errs.pass); } });
      pass.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { con.log('onFieldSubmitted → _submit()', 'dim'); run(); } });
      email.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { pass.focus(); con.log('TextInputAction.next → โฟกัสย้ายไปช่องรหัสผ่าน', 'dim'); } });
    }
    // pipeline
    const stages = [
      ['field', 'ช่องกรอก', 'TextFormField'],
      ['validate', 'ด่านตรวจ', 'validator → null / ข้อความ'],
      ['save', 'รวบรวม', 'onSaved (หลัง save())'],
      ['vars', 'ตัวแปรใน State', '_savedEmail, _savedPassword'],
      ['next', 'ส่งต่อ', 'บทถัดไป: pop / Provider / DB'],
    ];
    const lanes = { email: {}, pass: {} };
    const grid = h('div', { class: 'pl-grid' });
    grid.appendChild(h('div', { class: 'pl-h' }));
    stages.forEach(([id, t, d]) => grid.appendChild(h('div', { class: 'pl-h' }, h('div', { class: 'pl-t' }, t), h('div', { class: 'pl-d mono' }, d))));
    [['email', 'อีเมล'], ['pass', 'รหัสผ่าน']].forEach(([k, label]) => {
      grid.appendChild(h('div', { class: 'pl-lbl' }, label));
      stages.forEach(([id]) => { const c = h('div', { class: 'pl-c' }); lanes[k][id] = c; grid.appendChild(c); });
    });
    const resultP = h('div', { class: 'pl-res' });
    const con = FR.Console.create({ title: 'Debug Console', compact: true });
    function resetLanes() { Object.values(lanes).forEach((l) => Object.values(l).forEach((c) => { c.className = 'pl-c'; c.textContent = ''; })); clear(resultP); }
    let busy = false;
    async function run() {
      if (busy) return; busy = true;
      resetLanes();
      if (full) { con.log('FocusScope.of(context).unfocus()  → คีย์บอร์ดหุบ', 'dim'); }
      con.sep('_submit()');
      const vals = { email: email.value, pass: pass.value };
      for (const k of ['email', 'pass']) {
        lanes[k].field.textContent = k === 'pass' ? '•'.repeat(vals.pass.length) || '(ว่าง)' : (vals.email || '(ว่าง)');
        lanes[k].field.classList.add('on');
      }
      await sleep(380);
      con.log('_formKey.currentState!.validate()');
      let ok = true;
      for (const k of ['email', 'pass']) {
        const r = k === 'email' ? (full ? V.emailTrim(vals.email) : V.email(vals.email)) : V.password(vals.pass);
        errs[k] = r;
        const c = lanes[k].validate;
        c.textContent = r == null ? 'null ✓' : '"' + r + '"';
        c.classList.add(r == null ? 'ok' : 'bad');
        (k === 'email' ? email : pass).setError(r);
        con.log(`  validator(${k}) → ${r == null ? 'null' : "'" + r + "'"}`, r == null ? 'ok' : 'err');
        if (r != null) ok = false;
        await sleep(300);
      }
      submittedOnce = true;
      if (!ok) {
        con.log("validate() คืน false → ไม่เรียก save() (ข้อความสีแดงขึ้นใต้ช่องอัตโนมัติ)", 'err');
        resultP.appendChild(h('span', { class: 'pill off' }, 'validate() == false'));
        if (!full) con.log('ฟอร์มไม่ถูกต้อง');
        busy = false; return;
      }
      resultP.appendChild(h('span', { class: 'pill on' }, 'validate() == true'));
      await sleep(250);
      con.log('_formKey.currentState!.save()  → เรียก onSaved ทุกช่อง');
      for (const k of ['email', 'pass']) {
        lanes[k].save.textContent = 'onSaved'; lanes[k].save.classList.add('on');
        await sleep(250);
        const v = k === 'email' ? (full ? vals.email.trim() : vals.email) : vals.pass;
        lanes[k].vars.textContent = k === 'email' ? `_savedEmail = '${v}'` : `_savedPassword (${v.length} ตัว)`;
        lanes[k].vars.classList.add('ok');
      }
      await sleep(250);
      ph.snack('ล็อกอินสำเร็จ! อีเมล: ' + (full ? vals.email.trim() : vals.email));
      con.log(`${full ? 'debugPrint' : 'print'}('อีเมลที่บันทึก: ${full ? vals.email.trim() : vals.email}')`);
      con.log(`${full ? 'debugPrint' : 'print'}('ความยาวรหัสผ่าน: ${vals.pass.length} ตัวอักษร')  ← ไม่พิมพ์รหัสผ่านจริง`, 'ok');
      lanes.email.next.textContent = '→ บทที่ 9'; lanes.pass.next.textContent = '→ บทที่ 10–13';
      if (full) { pass.setValue('', true); pass.setError(null); con.log('_passwordController.clear()', 'dim'); }
      busy = false;
    }
    const presets = h('div', { class: 'btn-row', style: { marginBottom: '8px' } },
      h('span', { class: 'dim', style: { fontSize: '.8rem' } }, 'เติมค่าตัวอย่าง:'),
      btn('ว่างทั้งหมด', () => { email.setValue(''); pass.setValue(''); email.setError(null); pass.setError(null); errs.email = errs.pass = null; resetLanes(); }, 'sm ghost'),
      btn("'test' / '123'", () => { email.setValue('test'); pass.setValue('123'); }, 'sm ghost'),
      btn('ถูกต้อง', () => { email.setValue(full ? '  you@example.com ' : 'you@example.com'); pass.setValue('secret99'); }, 'sm ghost'));
    body.appendChild(presets);
    body.appendChild(h('div', { class: 'vrow' }, ph.el, h('div', { class: 'grow vcol' }, h('div', { class: 'pl-wrap' }, grid), resultP, con.el)));
  });

  // ───────── 8.2 TextField vs TextFormField ─────────
  R('ch08.tfvs', (body) => {
    const mk = (formField) => {
      const items = ['ชื่อ', 'อีเมล', 'เบอร์โทร'].map((l) => {
        const f = FR.ui.field({ label: l });
        const bubble = h('div', { class: 'ffs' });
        return { l, f, bubble };
      });
      return items;
    };
    const left = mk(false), right = mk(true);
    const lBox = h('div', { class: 'tf-col notes' }, h('div', { class: 'tf-h' }, 'TextField ×3', h('span', { class: 'dim' }, ' — กระดาษโน้ตแยกแผ่น')), left.map((i) => h('div', null, i.f.el)));
    const rBox = h('div', { class: 'tf-col book' }, h('div', { class: 'tf-h' }, 'Form › TextFormField ×3', h('span', { class: 'dim' }, ' — เล่มเย็บ มีด่านตรวจ')), right.map((i) => h('div', null, i.f.el, i.bubble)));
    const note = h('div', { class: 'vnote' });
    function refreshBubbles() { right.forEach((i) => { i.bubble.innerHTML = `FormFieldState: <span class="mono">value='${FR.util.esc(i.f.value)}'</span> · <span class="mono">errorText=${i.err ? "'" + i.err + "'" : 'null'}</span>`; }); }
    right.forEach((i) => i.f.input.addEventListener('input', refreshBubbles));
    refreshBubbles();
    async function sweep() {
      clear(note);
      lBox.classList.add('miss'); setTimeout(() => lBox.classList.remove('miss'), 1200);
      for (const i of right) {
        i.f.el.classList.add('beam');
        await sleep(260);
        i.err = i.f.value.trim() ? null : 'กรุณากรอก' + i.l;
        i.f.setError(i.err);
        i.f.el.classList.remove('beam');
      }
      refreshBubbles();
      note.innerHTML = md('**ฝั่งขวา:** `validate()` คำสั่งเดียวไล่ตรวจทุกช่อง เพราะแต่ละ TextFormField มี **FormFieldState** ที่ลงทะเบียนกับ Form ไว้ · **ฝั่งซ้าย:** Form มองไม่เห็น TextField เลย ต้องเขียนโค้ดตรวจ/เก็บค่าเองทีละช่อง');
    }
    body.appendChild(h('div', { class: 'btn-row', style: { marginBottom: '10px' } }, btn('_formKey.currentState!.validate()', sweep, 'primary'), btn('reset()', () => { right.forEach((i) => { i.f.setValue(''); i.err = null; i.f.setError(null); }); refreshBubbles(); clear(note); }, 'ghost')));
    body.appendChild(h('div', { class: 'two' }, lBox, rBox));
    body.appendChild(note);
  });

  // ───────── 8.3 TextEditingController: listener vs onChanged + leak ─────────
  R('ch08.controller', (body) => {
    const input = h('input', { class: 'vinput', style: { width: '100%', fontSize: '.95rem', padding: '8px 10px' }, value: 'สมชาย', 'aria-label': 'ช่องชื่อ' });
    const textV = h('span', { class: 'v' });
    const selV = h('span', { class: 'v' });
    const lLog = FR.Console.create({ title: 'controller.addListener(...)', compact: true });
    const cLog = FR.Console.create({ title: 'onChanged: (value) {...}', compact: true });
    let lastSel = '';
    function snap() { textV.textContent = `'${input.value}'`; const s = `base ${input.selectionStart}, extent ${input.selectionEnd}`; const changed = s !== lastSel; lastSel = s; selV.textContent = s; return changed; }
    snap();
    input.addEventListener('input', () => { snap(); lLog.log(`listener: text='${input.value}'`); cLog.log(`onChanged('${input.value}')`, 'ok'); flash(textV); });
    const selCheck = () => { if (snap()) { lLog.log(`listener: เคอร์เซอร์/selection เปลี่ยน (${lastSel})`, 'dim'); flash(selV); } };
    ['keyup', 'mouseup', 'select'].forEach((ev) => input.addEventListener(ev, selCheck));
    const setFromCode = btn("controller.text = 'ค่าจากโค้ด'", () => { input.value = 'ค่าจากโค้ด'; snap(); lLog.log("listener: text='ค่าจากโค้ด'  (โค้ดเป็นคนเปลี่ยน)"); cLog.log('— onChanged ไม่ถูกเรียก (ไม่ใช่ผู้ใช้แก้) —', 'dim'); flash(textV); });
    const clr = btn('controller.clear()', () => { input.value = ''; snap(); lLog.log("listener: text=''"); cLog.log('— onChanged ไม่ถูกเรียก —', 'dim'); flash(textV); });
    const home = btn('ย้ายเคอร์เซอร์ไปต้นข้อความ', () => { input.focus(); input.setSelectionRange(0, 0); selCheck(); });
    const selAll = btn('เลือกข้อความทั้งหมด', () => { input.focus(); input.select(); selCheck(); });
    // leak meter
    let leaked = 0, open = false, doDispose = true;
    const meter = FR.Meter.create('หน่วยความจำที่ค้าง', { max: 8, kind: 'err' });
    meter.set(0, 8, '0');
    const leakNote = h('div', { class: 'vnote' }, 'listener ที่ผูกกับออบเจกต์อายุยาว (เช่น service ทั้งแอป) + ไม่ dispose = รั่วทุกครั้งที่เปิด-ปิดหน้า');
    const status = h('span', { class: 'pill' }, 'หน้าฟอร์ม: ปิดอยู่');
    const openB = btn('เปิดหน้าฟอร์ม', () => { if (open) return; open = true; status.textContent = 'หน้าฟอร์ม: เปิด (initState สร้าง controller)'; status.className = 'pill on'; });
    const closeB = btn('ปิดหน้าฟอร์ม', () => {
      if (!open) return; open = false;
      if (!doDispose) { leaked++; meter.set(leaked, 8, String(leaked)); }
      status.textContent = doDispose ? 'ปิดแล้ว: dispose() คืนทรัพยากร' : `ปิดแล้ว: ลืม dispose → ค้าง ${leaked}`; status.className = 'pill ' + (doDispose ? '' : 'off');
      if (leaked >= 8) { status.textContent = 'หน่วยความจำไม่พอ → ระบบปฏิบัติการปิดแอป (แอปเด้ง)'; leaked = 0; setTimeout(() => meter.set(0, 8, '0'), 1500); }
    });
    const dispT = toggle('เรียก _nameController.dispose() ใน dispose()', doDispose, (v) => (doDispose = v));
    body.appendChild(h('div', { class: 'vrow' },
      h('div', { class: 'grow vcol' },
        FR.Panel('ช่อง TextFormField(controller: _nameController)', input, h('div', { class: 'vkv', style: { marginTop: '8px' } }, h('span', { class: 'k' }, 'controller.text'), textV, h('span', { class: 'k' }, 'controller.selection'), selV)),
        h('div', { class: 'btn-row' }, setFromCode, clr, home, selAll)),
      h('div', { class: 'grow vcol' }, lLog.el, cLog.el)));
    body.appendChild(h('div', { class: 'vpanel', style: { marginTop: '12px' } }, h('div', { class: 'vp-hd' }, 'ก๊อกน้ำที่ลืมปิด: เปิด-ปิดหน้าฟอร์มซ้ำๆ'), h('div', { class: 'vp-bd vcol' }, h('div', { class: 'btn-row' }, dispT, openB, closeB, status), meter.el, leakNote)));
  });

  // ───────── 8.4 InputDecoration playground ─────────
  R('ch08.decoration', (body) => {
    const o = { labelText: true, hintText: true, helperText: true, errorText: false, icon: true, prefixIcon: true, suffixIcon: false, border: 'outline', filled: true };
    const preview = h('div', { class: 'deco-prev' });
    const code = h('div');
    const ctrls = h('div', { class: 'btn-row' });
    const val = { v: '' };
    function render() {
      clear(preview);
      const box = h('div', { class: 'deco-field b-' + o.border + (o.filled ? ' filled' : '') + (o.errorText ? ' err' : '') });
      const inp = h('input', { class: 'deco-in', placeholder: o.hintText ? 'you@example.com' : '', value: val.v, 'aria-label': 'ตัวอย่างช่อง' });
      inp.addEventListener('input', () => { val.v = inp.value; box.classList.toggle('has', !!inp.value); });
      inp.addEventListener('focus', () => box.classList.add('focus'));
      inp.addEventListener('blur', () => box.classList.remove('focus'));
      box.classList.toggle('has', !!val.v);
      box.classList.toggle('nolabel', !o.labelText);
      const inner = h('div', { class: 'deco-inner' },
        o.prefixIcon ? h('span', { class: 'deco-pi', title: 'prefixIcon (ในกรอบ)' }, '@') : null,
        h('div', { class: 'deco-mid' }, o.labelText ? h('label', { class: 'deco-lbl' }, 'ที่อยู่อีเมล') : null, inp),
        o.suffixIcon ? h('span', { class: 'deco-si', title: 'suffixIcon (ในกรอบ)' }, '✕') : null);
      box.appendChild(inner);
      const under = h('div', { class: 'deco-under' }, o.errorText ? h('span', { class: 'e' }, 'รูปแบบอีเมลไม่ถูกต้อง') : o.helperText ? h('span', null, 'ป้อนอีเมลหลักของคุณ') : null);
      preview.appendChild(h('div', { class: 'deco-row' }, o.icon ? h('span', { class: 'deco-icon', title: 'icon (นอกกรอบ)' }, '✉') : null, h('div', { style: { flex: '1' } }, box, under)));
      const lines = ['InputDecoration('];
      if (o.labelText) lines.push("  labelText: 'ที่อยู่อีเมล',");
      if (o.hintText) lines.push("  hintText: 'you@example.com',");
      if (o.icon) lines.push('  icon: const Icon(Icons.email),            // นอกกรอบ');
      if (o.prefixIcon) lines.push('  prefixIcon: const Icon(Icons.alternate_email), // ในกรอบ');
      if (o.suffixIcon) lines.push('  suffixIcon: const Icon(Icons.clear),');
      if (o.helperText) lines.push("  helperText: 'ป้อนอีเมลหลักของคุณ',");
      if (o.errorText) lines.push("  errorText: 'รูปแบบอีเมลไม่ถูกต้อง', // ปกติ validator ตั้งให้");
      if (o.border === 'outline') lines.push('  border: const OutlineInputBorder(\n    borderRadius: BorderRadius.all(Radius.circular(8.0)),\n  ),');
      if (o.border === 'underline') lines.push('  border: const UnderlineInputBorder(),');
      if (o.border === 'none') lines.push('  border: InputBorder.none,');
      if (o.filled) lines.push('  filled: true,\n  fillColor: Colors.grey[100],');
      lines.push(')');
      clear(code);
      code.appendChild(FR.CodeView.create({ src: lines.join('\n'), lang: 'dart', title: 'decoration ที่ได้' }).el);
    }
    ['labelText', 'hintText', 'helperText', 'errorText', 'icon', 'prefixIcon', 'suffixIcon', 'filled'].forEach((k) => ctrls.appendChild(toggle(k, o[k], (v) => { o[k] = v; render(); })));
    const bSeg = seg([{ value: 'outline', label: 'OutlineInputBorder' }, { value: 'underline', label: 'UnderlineInputBorder' }, { value: 'none', label: 'InputBorder.none' }], o.border, (v) => { o.border = v; render(); });
    body.append(ctrls, h('div', { style: { margin: '8px 0' } }, bSeg));
    body.appendChild(h('div', { class: 'vrow' }, h('div', { class: 'grow' }, FR.Panel('ตัวอย่างบนจอ (แตะเพื่อพิมพ์ ดู label ลอยขึ้น)', preview)), h('div', { class: 'grow' }, code)));
    render();
  });

  // ───────── 8.5 AutovalidateMode ─────────
  R('ch08.autovalidate', (body) => {
    const MODES = [
      ['disabled', 'ตรวจเฉพาะเมื่อเรียก validate() (ค่าเริ่มต้น)'],
      ['always', 'ตรวจทุกครั้งที่ build รวมตอนเปิดหน้า'],
      ['onUserInteraction', 'ตรวจทันทีที่ผู้ใช้เริ่มแก้ช่องนั้น'],
      ['onUnfocus', 'ตรวจเมื่อออกจากช่อง'],
      ['onUserInteractionIfError', 'ตรวจซ้ำเฉพาะช่องที่มี error อยู่แล้ว'],
    ];
    let mode = 'onUserInteractionIfError';
    const ph = FR.Phone.create({ title: 'สมัครสมาชิก', small: true, height: 330 });
    let f, interacted = false, err = null;
    const log = FR.Console.create({ title: 'validator ถูกเรียกเมื่อ…', compact: true });
    const tl = h('div', { class: 'av-tl' });
    function mark(label, shown) { tl.appendChild(h('div', { class: 'av-ev' + (shown ? ' red' : '') }, h('span', null, label), h('span', { class: 'av-dot' }, shown ? '🔴 error' : '—'))); }
    function validate(why) { err = V.email(f.value); f.setError(err); log.log(`[${why}] validator('${f.value}') → ${err ? "'" + err + "'" : 'null'}`, err ? 'err' : 'ok'); return err; }
    function build() {
      interacted = false; err = null; clear(tl); log.clear();
      f = FR.ui.field({ label: 'อีเมล', hint: 'you@example.com' });
      f.input.addEventListener('input', () => {
        interacted = true;
        if (mode === 'always' || mode === 'onUserInteraction') validate('พิมพ์');
        else if (mode === 'onUserInteractionIfError' && err) validate('พิมพ์ (มี error อยู่)');
        else if (mode === 'disabled' && err) log.log('พิมพ์แล้ว แต่ error เดิมยังค้าง (disabled ไม่ตรวจใหม่จนกว่าจะ validate())', 'dim');
      });
      f.input.addEventListener('blur', () => { if (mode === 'onUnfocus' && interacted) validate('ออกจากช่อง'); });
      const other = FR.ui.field({ label: 'ชื่อเล่น (ช่องอื่น)' });
      ph.setBody(FR.ui.pad(f.el, other.el, FR.ui.btn('ส่ง', () => { validate('กดส่ง → validate()'); })));
      if (mode === 'always') validate('build ครั้งแรก');
    }
    const s = seg(MODES.map(([v]) => ({ value: v, label: v })), mode, (m) => { mode = m; desc.textContent = MODES.find((x) => x[0] === m)[1]; build(); });
    const desc = h('div', { class: 'vnote' }, MODES.find((x) => x[0] === mode)[1]);
    async function script() {
      build();
      const steps = [['t', 'พิมพ์ “t”'], ['te', 'พิมพ์ “te”'], ['test@', 'พิมพ์ “test@”'], ['BLUR', 'ออกจากช่อง'], ['SUBMIT', 'กดส่ง'], ['test@mail', 'แก้เป็น “test@mail”'], ['test@mail.com', 'แก้เป็น “test@mail.com”']];
      if (mode === 'always') mark('เปิดหน้า', !!err); else mark('เปิดหน้า', false);
      for (const [v, label] of steps) {
        await sleep(650);
        if (v === 'BLUR') { f.input.dispatchEvent(new Event('blur')); }
        else if (v === 'SUBMIT') { validate('กดส่ง → validate()'); }
        else { f.setValue(v, true); f.input.dispatchEvent(new Event('input')); }
        mark(label, !!err);
      }
    }
    body.appendChild(h('div', { class: 'vctrl' }, h('span', { class: 'lbl' }, 'autovalidateMode:'), s));
    body.appendChild(desc);
    body.appendChild(h('div', { class: 'btn-row', style: { margin: '8px 0' } }, btn('▶ เล่นสคริปต์การพิมพ์', script, 'primary'), btn('เริ่มใหม่', build, 'ghost sm')));
    body.appendChild(h('div', { class: 'vrow' }, ph.el, h('div', { class: 'grow vcol' }, FR.Panel('ไทม์ไลน์: ผู้ใช้เห็นสีแดงตอนไหน', tl), log.el)));
    build();
  });

  // ───────── 8.6 GlobalKey<FormState> ─────────
  R('ch08.globalkey', (body) => {
    const box = h('div');
    const spec = { id: 'st', label: '_LoginFormScreenState', kind: 'stateful', meta: 'final _formKey = GlobalKey<FormState>()', children: [
      { id: 'sc', label: 'Scaffold', kind: 'system', children: [
        { id: 'scroll', label: 'SingleChildScrollView', kind: 'leaf', children: [
          { id: 'form', label: 'Form(key: _formKey)', kind: 'form', meta: 'FormState', children: [
            { id: 'col', label: 'Column', kind: 'leaf', children: [
              { id: 'pad', label: 'Padding', kind: 'leaf', children: [{ id: 'f1', label: 'TextFormField(อีเมล)', kind: 'field', meta: 'validator: กฎเรื่อง @' }] },
              { id: 'f2', label: 'TextFormField(รหัสผ่าน)', kind: 'field', meta: 'validator: ห้ามว่าง, ≥ 6' },
              { id: 'row', label: 'Row', kind: 'leaf', children: [{ id: 'btn', label: 'ElevatedButton(onPressed: _submit)', kind: 'leaf' }] },
            ] },
          ] },
        ] },
      ] },
    ] };
    const tv = FR.Tree.create(box, spec, { hideCounts: true });
    const vals = { f1: 'test', f2: 'secret99' };
    const inE = h('input', { class: 'vinput', value: vals.f1, 'aria-label': 'ค่าอีเมล' });
    const inP = h('input', { class: 'vinput', value: vals.f2, 'aria-label': 'ค่ารหัสผ่าน' });
    const out = h('div', { class: 'vnote' });
    async function go() {
      tv.clearArrows(); tv.unmarkAll('found'); clear(out);
      tv.mark('btn', 'sel');
      await sleep(300);
      tv.arrow('btn', 'form', 'key', '_formKey.currentState');
      tv.pulse('form', 'pl');
      await sleep(700);
      tv.clearArrows();
      const r1 = V.email(inE.value), r2 = V.password(inP.value);
      tv.arrow('form', 'f1', r1 ? 'err' : 'data', 'validate()');
      tv.arrow('form', 'f2', r2 ? 'err' : 'data', 'validate()');
      tv.setMeta('f1', r1 ? `✗ '${r1}'` : '✓ null');
      tv.setMeta('f2', r2 ? `✗ '${r2}'` : '✓ null');
      tv.pulse(['f1', 'f2'], r1 || r2 ? 'errf' : 'pl');
      out.innerHTML = md(`validate() คืน **${!(r1 || r2)}** — กุญแจแค่ “พาไปถึง” FormState ส่วน **กฎ** อยู่ที่ validator ของแต่ละช่อง (พนักงานเฝ้าประตู)`);
      tv.mark('btn', 'sel', false);
    }
    body.appendChild(h('div', { class: 'btn-row', style: { marginBottom: '10px' } }, h('label', { class: 'dim', style: { fontSize: '.82rem' } }, 'อีเมล '), inE, h('label', { class: 'dim', style: { fontSize: '.82rem' } }, 'รหัสผ่าน '), inP, btn('กดปุ่ม → validate()', go, 'primary')));
    body.append(box, h('div', { class: 'tv-legend' }, h('span', { style: { color: 'var(--supp)' } }, 'GlobalKey พาไปถึง FormState ตรงๆ'), h('span', { class: 'l-ok' }, 'validator ผ่าน'), h('span', { style: { color: 'var(--err)' } }, 'validator ไม่ผ่าน')), out);
  });

  // ───────── 8.7 validator stepper ─────────
  R('ch08.validator', (body) => {
    const DEFS = {
      password: { label: 'รหัสผ่าน (ตำรา §8.7)', code: `validator: (String? value) {
  if (value == null || value.isEmpty) {
    return 'รหัสผ่านต้องไม่ว่างเปล่า';
  }
  if (value.length < 6) {
    return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
  }
  return null; // คืนค่า null หากถูกต้อง
},`, run: (v) => {
        const t = [];
        const c1 = v === '';
        t.push(['if (value == null || value.isEmpty)', `value.isEmpty → ${c1}`]);
        if (c1) { t.push(["return 'รหัสผ่านต้องไม่ว่างเปล่า';", 'คืนข้อความ']); return [t, 'รหัสผ่านต้องไม่ว่างเปล่า']; }
        const c2 = v.length < 6;
        t.push(['if (value.length < 6)', `length = ${v.length} → ${c2}`]);
        if (c2) { t.push(["return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';", 'คืนข้อความ']); return [t, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร']; }
        t.push(['return null;', 'ผ่าน']); return [t, null];
      } },
      email: { label: 'อีเมล (แลป)', code: `validator: (value) {
  if (value == null || value.isEmpty) {
    return 'กรุณาป้อนอีเมลของคุณ';
  }
  if (!value.contains('@') || !value.contains('.')) {
    return 'กรุณาป้อนที่อยู่อีเมลที่ถูกต้อง';
  }
  return null;
},`, run: (v) => {
        const t = [];
        const c1 = v === '';
        t.push(['if (value == null || value.isEmpty)', `isEmpty → ${c1}`]);
        if (c1) { t.push(["return 'กรุณาป้อนอีเมลของคุณ';", 'คืนข้อความ']); return [t, 'กรุณาป้อนอีเมลของคุณ']; }
        const at = v.includes('@'), dot = v.includes('.');
        t.push(["if (!value.contains('@') || !value.contains('.'))", `มี @ = ${at}, มี . = ${dot} → ${!at || !dot}`]);
        if (!at || !dot) { t.push(["return 'กรุณาป้อนที่อยู่อีเมลที่ถูกต้อง';", 'คืนข้อความ']); return [t, 'กรุณาป้อนที่อยู่อีเมลที่ถูกต้อง']; }
        t.push(['return null;', 'ผ่าน']); return [t, null];
      } },
      nameNoTrim: { label: 'ชื่อ แบบ isEmpty (มีช่องโหว่)', code: `validator: (value) {
  if (value == null || value.isEmpty) {
    return 'กรุณาป้อนชื่อ';
  }
  return null;
},`, run: (v) => {
        const t = [['if (value == null || value.isEmpty)', `value = '${v}' → isEmpty = ${v === ''}`]];
        if (v === '') { t.push(["return 'กรุณาป้อนชื่อ';", 'คืนข้อความ']); return [t, 'กรุณาป้อนชื่อ']; }
        t.push(['return null;', v.trim() === '' ? 'ผ่าน — ทั้งที่มีแต่ช่องว่าง!' : 'ผ่าน']); return [t, null];
      } },
      nameTrim: { label: 'ชื่อ แบบ trim() (ตำรา §8.8/8.11)', code: `validator: (value) {
  if (value == null || value.trim().isEmpty) {
    return 'กรุณาป้อนชื่อ';
  }
  return null;
},`, run: (v) => {
        const t = [['if (value == null || value.trim().isEmpty)', `trim() → '${v.trim()}' → isEmpty = ${v.trim() === ''}`]];
        if (v.trim() === '') { t.push(["return 'กรุณาป้อนชื่อ';", 'คืนข้อความ']); return [t, 'กรุณาป้อนชื่อ']; }
        t.push(['return null;', 'ผ่าน']); return [t, null];
      } },
    };
    let cur = 'password';
    const input = h('input', { class: 'vinput', style: { width: '100%' }, placeholder: 'พิมพ์ค่าที่จะส่งให้ validator', 'aria-label': 'ค่าทดสอบ' });
    const codeBox = h('div');
    const trace = h('div', { class: 'vt-trace' });
    const fieldBox = h('div');
    let cv;
    function render() {
      const d = DEFS[cur];
      clear(codeBox);
      cv = FR.CodeView.create({ src: d.code, lang: 'dart', title: d.label });
      codeBox.appendChild(cv.el);
      evalNow();
    }
    function evalNow() {
      const d = DEFS[cur];
      const [t, res] = d.run(input.value);
      clear(trace);
      t.forEach(([line, txt], i) => trace.appendChild(h('div', { class: 'vt-row' }, h('span', { class: 'n' }, String(i + 1)), h('code', null, line.trim()), h('span', { class: 'r' }, txt))));
      cv.active(t.map(([line]) => line));
      clear(fieldBox);
      const f = FR.ui.field({ label: cur.startsWith('name') ? 'ชื่อ' : cur === 'email' ? 'อีเมล' : 'รหัสผ่าน', value: input.value.replace(/ /g, '·'), readonly: true });
      f.setError(res);
      fieldBox.append(h('div', { class: 'vt-res ' + (res == null ? 'ok' : 'bad') }, res == null ? '→ คืน null = ผ่าน (ไม่มี error)' : `→ คืน '${res}' = ไม่ผ่าน`), h('div', { class: 'insp-phone', style: { marginTop: '8px' } }, f.el));
    }
    input.addEventListener('input', evalNow);
    const s = seg(Object.keys(DEFS).map((k) => ({ value: k, label: DEFS[k].label })), cur, (k) => { cur = k; render(); });
    const quick = h('div', { class: 'btn-row' }, h('span', { class: 'dim', style: { fontSize: '.8rem' } }, 'ลองค่า:'), ['', '123', 'secret99', 'test', 'a@b.co', '   '].map((v) => btn(v === '' ? '(ว่าง)' : v === '   ' ? '(ช่องว่าง 3 ตัว)' : `'${v}'`, () => { input.value = v; evalNow(); }, 'sm ghost')));
    body.append(h('div', { class: 'vctrl' }, s), h('div', { class: 'vrow' }, h('div', { class: 'grow vcol' }, input, quick, codeBox), h('div', { class: 'grow vcol' }, FR.Panel('ลำดับการทำงานของ validator', trace), fieldBox)));
    render();
    return { setMode(m) { if (DEFS[m]) { s.set(m); cur = m; render(); } } };
  });

  // ───────── 8.8 save(): whistle ─────────
  R('ch08.save', (body) => {
    const ph = FR.Phone.create({ title: 'โปรไฟล์', small: true, height: 360 });
    const name = FR.ui.field({ label: 'ชื่อ', value: '  นภา  ' });
    const city = FR.ui.field({ label: 'จังหวัด', value: 'เชียงใหม่' });
    const shown = FR.ui.text('ชื่อบนจอ: (ยังไม่มี)', 'dim');
    ph.setBody(FR.ui.pad(name.el, city.el, shown));
    let vars = { _savedName: "''", _savedCity: "''" }, alive = true, displayed = '(ยังไม่มี)';
    const varBox = h('div', { class: 'vkv' });
    function drawVars() { clear(varBox); Object.entries(vars).forEach(([k, v]) => varBox.append(h('span', { class: 'k' }, k), h('span', { class: 'v', 'data-k': k }, v))); }
    drawVars();
    const con = FR.Console.create({ title: 'Debug Console', compact: true });
    let useSetState = false;
    async function whistle() {
      if (!alive) return;
      con.log('_formKey.currentState!.save()  🔔 เป่านกหวีด');
      name.el.classList.add('beam'); await sleep(300); name.el.classList.remove('beam');
      vars._savedName = `'${name.value.trim()}'`; drawVars(); flash(varBox.querySelector('[data-k=_savedName]'));
      con.log(`onSaved(ชื่อ) → _savedName = value?.trim() ?? ''  → '${name.value.trim()}'`);
      city.el.classList.add('beam'); await sleep(300); city.el.classList.remove('beam');
      vars._savedCity = `'${city.value}'`; drawVars(); flash(varBox.querySelector('[data-k=_savedCity]'));
      con.log(`onSaved(จังหวัด) → _savedCity = '${city.value}'`);
      if (useSetState) { displayed = name.value.trim(); shown.textContent = 'ชื่อบนจอ: ' + displayed; flash(shown); con.log('setState(...) → build ใหม่ จอแสดงชื่อแล้ว', 'ok'); }
      else { con.log('ไม่มี setState → ตัวแปรเปลี่ยน แต่จอยังแสดงค่าเก่า', 'warn'); }
      ph.snack('บันทึกข้อมูลแล้ว! ชื่อ: ' + name.value.trim());
    }
    const close = btn('ปิดหน้าจอ (State ถูก dispose)', () => {
      alive = false; vars = { _savedName: '—', _savedCity: '—' }; drawVars();
      ph.setBody(FR.ui.center(FR.ui.text('(หน้าจอถูกปิด ค่าหายไปกับ State)', 'dim'), FR.ui.btn('เปิดใหม่', () => { alive = true; vars = { _savedName: "''", _savedCity: "''" }; drawVars(); shown.textContent = 'ชื่อบนจอ: (ยังไม่มี)'; ph.setBody(FR.ui.pad(name.el, city.el, shown)); }, 'tonal')));
      con.log('dispose → ตัวแปรใน State หายหมด — save() ไม่ได้บันทึกลงเครื่อง (บทที่ 13)', 'err');
    }, 'danger');
    const t = toggle('แสดงชื่อบนจอด้วย setState', useSetState, (v) => (useSetState = v));
    body.appendChild(h('div', { class: 'btn-row', style: { marginBottom: '10px' } }, btn('validate() ✓ แล้ว save()', whistle, 'primary'), t, close));
    body.appendChild(h('div', { class: 'vrow' }, ph.el, h('div', { class: 'grow vcol' }, FR.Panel('ตัวแปรใน _MyFormState', varBox), con.el)));
  });

  // ───────── 8.9 which widgets are FormFields ─────────
  R('ch08.formfields', (body) => {
    const items = [
      ['TextFormField', true, 'FormField<String>'],
      ['DropdownButtonFormField', true, 'FormField<T>'],
      ['FormField(builder: …) ห่อ Checkbox', true, 'ห่อเองให้เป็น FormField'],
      ['TextField', false, 'ไม่ใช่ FormField'],
      ['Checkbox / CheckboxListTile', false, 'ไม่ใช่ FormField'],
      ['RadioGroup + RadioListTile', false, 'ไม่ใช่ FormField'],
      ['Switch / SwitchListTile', false, 'ไม่ใช่ FormField'],
      ['Slider', false, 'ไม่ใช่ FormField'],
      ['DropdownButton', false, 'ไม่ใช่ FormField'],
      ['showDatePicker(...)', false, 'เป็นฟังก์ชันเปิด dialog'],
    ];
    const grid = h('div', { class: 'ff-grid' });
    const cards = items.map(([n, ff, d]) => { const c = h('div', { class: 'ff-card' }, h('div', { class: 'mono' }, n), h('div', { class: 'dim', style: { fontSize: '.76rem' } }, d)); c._ff = ff; grid.appendChild(c); return c; });
    async function beam() {
      cards.forEach((c) => c.classList.remove('seen', 'unseen'));
      for (const c of cards) { await sleep(120); c.classList.add(c._ff ? 'seen' : 'unseen'); }
    }
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '10px' } }, btn('ฉายแสง validate() / save()', beam, 'primary')), grid,
      h('div', { class: 'vnote', style: { marginTop: '8px' }, html: md('สีเขียว = Form มองเห็น (ถูกตรวจ/บันทึก/รีเซ็ตพร้อมช่องอื่น) · สีเทา = Form มองไม่เห็น ต้องจัดการด้วย `setState` เอง') }));
  });

  // ───────── 8.10 keyboard, overflow, focus, formatters ─────────
  R('ch08.keyboard', (body) => {
    let layout = 'column';
    const phWrap = h('div');
    const con = FR.Console.create({ title: 'Debug Console', compact: true });
    let ph;
    function build() {
      clear(phWrap);
      ph = FR.Phone.create({ title: 'ฟอร์มล็อกอิน', small: true, height: 400 });
      const e = FR.ui.field({ label: 'อีเมล', prefix: '✉' });
      const p = FR.ui.field({ label: 'รหัสผ่าน', prefix: '🔒', obscure: true });
      const b = FR.ui.btn('ล็อกอิน', () => { ph.keyboard(false); holder.classList.remove('kb'); holder.style.height = ''; ph.snack('ส่งฟอร์มแล้ว'); con.log('_submit()'); });
      const content = h('div', { class: 'u-pad' }, FR.ui.text('กรุณาป้อนข้อมูลเข้าระบบ:'), e.el, p.el, h('div', { style: { height: '30px' } }), b);
      const stripes = h('div', { class: 'overflow-stripes' }, 'A RenderFlex overflowed by 147 pixels on the bottom.');
      const holder = h('div', { class: 'kb-holder ' + layout }, content, stripes);
      ph.setBody(holder);
      const key = ph.screen.querySelector('.kb-action');
      const hideKb = () => { ph.keyboard(false); holder.classList.remove('kb'); holder.style.height = ''; };
      [e, p].forEach((f, i) => f.input.addEventListener('focus', () => {
        ph.keyboard(true); holder.classList.add('kb');
        holder.style.height = Math.max(60, ph.body.clientHeight - ph.screen.clientHeight * 0.46) + 'px';
        if (layout === 'scroll') setTimeout(() => f.el.scrollIntoView({ block: 'nearest' }), 50);
        key.textContent = i === 0 ? 'next ›' : 'done ✓';
        con.log(`โฟกัส: ${i === 0 ? 'อีเมล (textInputAction: next)' : 'รหัสผ่าน (textInputAction: done)'}`, 'dim');
        if (layout === 'column') con.log('A RenderFlex overflowed by 147 pixels on the bottom.', 'err');
      }));
      key.style.cursor = 'pointer';
      key.onclick = () => {
        if (key.textContent.startsWith('next')) { p.focus(); con.log('กด “ถัดไป” → โฟกัสย้ายไปช่องรหัสผ่านอัตโนมัติ', 'ok'); }
        else { hideKb(); con.log('กด “เสร็จ” → onFieldSubmitted → _submit() + คีย์บอร์ดหุบ', 'ok'); ph.snack('ส่งฟอร์มแล้ว'); }
      };
      ph.body.addEventListener('click', (ev) => { if (ev.target === ph.body || ev.target === holder) { hideKb(); con.log('onTapOutside → FocusScope.of(context).unfocus()', 'dim'); } });
      phWrap.appendChild(ph.el);
    }
    const s = seg([{ value: 'column', label: 'Padding > Column (ไม่เลื่อน)' }, { value: 'scroll', label: 'SingleChildScrollView' }], layout, (v) => { layout = v; build(); });
    // paste filter demo
    const PASTE = '08a-12 3456789';
    const r1 = h('span', { class: 'mono' }), r2 = h('span', { class: 'mono' }), r3 = h('span', { class: 'mono' });
    const paste = btn(`วาง “${PASTE}”`, () => {
      r1.textContent = `'${PASTE}'`;
      r2.textContent = `'${PASTE.replace(/\D/g, '').slice(0, 10)}'`;
      r3.innerHTML = `'${PASTE}' <span style="color:var(--err)">→ แล้วค่อยขึ้น error</span>`;
      [r1, r2, r3].forEach((x) => flash(x));
    }, 'primary');
    const table = h('div', { class: 'vkv' },
      h('span', { class: 'k' }, 'keyboardType: phone อย่างเดียว'), r1,
      h('span', { class: 'k' }, '+ inputFormatters (digitsOnly, ≤10)'), r2,
      h('span', { class: 'k' }, 'validator อย่างเดียว'), r3);
    body.appendChild(h('div', { class: 'vctrl' }, h('span', { class: 'lbl' }, 'body:'), s));
    body.appendChild(h('div', { class: 'vrow' }, phWrap, h('div', { class: 'grow vcol' },
      h('div', { class: 'vnote', html: md('แตะช่องอีเมลให้คีย์บอร์ดขึ้น (กินพื้นที่ ~ครึ่งจอ) แล้วลองกดปุ่ม **next/done** มุมขวาล่างของคีย์บอร์ด · แตะพื้นที่ว่างเพื่อหุบคีย์บอร์ด') }),
      con.el,
      FR.Panel('การวางข้อความ (paste) ลงช่องเบอร์โทร', paste, h('div', { style: { marginTop: '8px' } }, table)))));
    build();
    return { setMode(m) { s.set(m); layout = m; build(); } };
  });

  // ───────── 8.11 confirm password: why controller ─────────
  R('ch08.confirm', (body) => {
    let approach = 'controller';
    const pw = h('input', { class: 'vinput', value: 'secret99', 'aria-label': 'รหัสผ่าน' });
    const cf = h('input', { class: 'vinput', value: 'secret99', 'aria-label': 'ยืนยันรหัสผ่าน' });
    const tl = h('div', { class: 'cf-tl' });
    const res = h('div');
    async function run() {
      clear(tl); clear(res);
      let saved = '';
      const add = (who, txt, cls) => { const r = h('div', { class: 'cf-ev ' + (cls || '') }, h('span', { class: 'w' }, who), h('span', { html: md(txt) })); tl.appendChild(r); return r; };
      add('1', '`validate()` เริ่ม — validator ทุกช่องทำงาน **ก่อน**');
      await sleep(400);
      const r1 = V.password(pw.value);
      add('2', `validator(รหัสผ่าน) → ${r1 ? "'" + r1 + "'" : 'null'}`, r1 ? 'bad' : 'ok');
      await sleep(400);
      const compareTo = approach === 'controller' ? pw.value : saved;
      const r2 = cf.value !== compareTo ? 'รหัสผ่านทั้งสองช่องไม่ตรงกัน' : null;
      add('3', approach === 'controller'
        ? `validator(ยืนยัน): เทียบกับ \`_passwordController.text\` = '${pw.value}' → ${r2 ? "'" + r2 + "'" : 'null'}`
        : `validator(ยืนยัน): เทียบกับ \`_savedPassword\` = '${saved}' (ยังว่าง! onSaved ยังไม่เคยทำงาน) → '${r2}'`, r2 ? 'bad' : 'ok');
      await sleep(400);
      if (r1 || r2) { add('4', '`validate()` คืน false → **ไม่ถึง** `save()` → onSaved ไม่ทำงาน', 'bad'); res.appendChild(h('div', { class: 'vt-res bad' }, approach === 'onsaved' ? 'แบบ onSaved ไม่มีทางผ่าน: ค่าที่เทียบถูกเก็บ “หลัง” การตรวจเสมอ' : 'ไม่ผ่าน — ลองพิมพ์สองช่องให้ตรงกัน')); return; }
      add('4', '`save()` → onSaved ทำงาน', 'ok');
      saved = pw.value;
      add('5', `_savedPassword = '${saved}'`, 'ok');
      res.appendChild(h('div', { class: 'vt-res ok' }, 'ผ่าน ✓ — controller อ่านค่าช่องแรกได้ “ระหว่าง” การตรวจ'));
    }
    const s = seg([{ value: 'controller', label: 'อ่านจาก _passwordController.text' }, { value: 'onsaved', label: 'อ่านจาก _savedPassword (onSaved)' }], approach, (v) => { approach = v; run(); });
    body.append(h('div', { class: 'vctrl' }, s), h('div', { class: 'btn-row', style: { marginBottom: '10px' } }, h('span', { class: 'dim' }, 'รหัสผ่าน'), pw, h('span', { class: 'dim' }, 'ยืนยัน'), cf, btn('กดส่ง', run, 'primary')), FR.Panel('ลำดับเหตุการณ์ใน validate() → save()', tl), res);
    run();
    return { setMode(m) { s.set(m); approach = m; run(); } };
  });

  // ───────── 8.12 app validation vs server ─────────
  R('ch08.security', (body) => {
    let serverCheck = true;
    const con = FR.Console.create({ title: 'เซิร์ฟเวอร์ log', compact: true });
    const flow = h('div', { class: 'sec-flow' });
    function draw(active) {
      clear(flow);
      const n = (id, t, d) => h('div', { class: 'sec-n' + (active && active.includes(id) ? ' on' : '') + (active && active.includes(id + '!') ? ' bad' : '') }, h('div', { class: 'sec-t' }, t), h('div', { class: 'sec-d' }, d));
      flow.append(
        h('div', { class: 'sec-lane' }, n('user', '👤 ผู้ใช้ทั่วไป', 'พิมพ์ผิดโดยไม่ตั้งใจ'), h('span', { class: 'sec-ar' }, '→'), n('app', '📱 แอป (validator)', 'เตือนทันที = UX'), h('span', { class: 'sec-ar' }, '→'), n('server', '🖥 เซิร์ฟเวอร์', serverCheck ? 'ตรวจซ้ำ = ความปลอดภัย' : 'เชื่อทุกอย่างที่ส่งมา')),
        h('div', { class: 'sec-lane' }, n('bad', '🕵 ผู้ไม่หวังดี', 'ใช้ curl / แก้แอปเอง'), h('span', { class: 'sec-ar skip' }, '⤳ ข้ามแอปไปเลย ⤳'), n('server2', '🖥 เซิร์ฟเวอร์', serverCheck ? 'ตรวจซ้ำ' : 'ไม่ตรวจ')));
    }
    draw();
    const normal = btn('ผู้ใช้ส่ง email = "test"', () => { draw(['user', 'app']); con.log('แอป: validator ปฏิเสธก่อนส่ง (ไม่ต้องรอเซิร์ฟเวอร์)', 'ok'); });
    const attack = btn('ผู้ไม่หวังดียิงตรง: {"email":"x","password":"1"}', () => {
      if (serverCheck) { draw(['bad', 'server2']); con.log('POST /register {"email":"x","password":"1"}'); con.log('400 Bad Request: อีเมลไม่ถูกต้อง — เซิร์ฟเวอร์ตรวจซ้ำ จับได้', 'ok'); }
      else { draw(['bad', 'server2!']); con.log('POST /register {"email":"x","password":"1"}'); con.log('201 Created — ข้อมูลขยะ/อันตรายเข้าฐานข้อมูลแล้ว (validator ในแอปไม่เคยได้ทำงาน)', 'err'); }
    }, 'danger');
    const t = toggle('เซิร์ฟเวอร์ตรวจซ้ำ', serverCheck, (v) => { serverCheck = v; draw(); });
    // forceErrorText
    const ph = FR.Phone.create({ title: 'สมัครสมาชิก', small: true, height: 280 });
    let serverError = null;
    const email = FR.ui.field({ label: 'อีเมล', value: 'somchai@mail.com' });
    email.input.addEventListener('input', () => { if (serverError) { serverError = null; email.setError(null); fl.log('onChanged → setState(() => _emailServerError = null)', 'dim'); } });
    const fl = FR.Console.create({ title: 'Debug Console', compact: true });
    ph.setBody(FR.ui.pad(email.el, FR.ui.btn('สมัคร', async () => {
      fl.log('ส่งไปเซิร์ฟเวอร์…'); await sleep(600);
      if (email.value.trim() === 'somchai@mail.com') { serverError = 'อีเมลนี้มีผู้ใช้แล้ว'; email.setError(serverError); fl.log("setState(() => _emailServerError = 'อีเมลนี้มีผู้ใช้แล้ว')  → forceErrorText แสดงใต้ช่อง", 'err'); }
      else { ph.snack('สมัครสำเร็จ'); fl.log('เซิร์ฟเวอร์ตอบ OK', 'ok'); }
    })));
    body.append(h('div', { class: 'btn-row', style: { marginBottom: '10px' } }, t, normal, attack), flow, con.el,
      h('h4', null, 'forceErrorText: แสดงข้อผิดพลาดที่มีแต่เซิร์ฟเวอร์ตอบได้'),
      h('div', { class: 'vrow' }, ph.el, h('div', { class: 'grow vcol' }, h('div', { class: 'vnote', html: md('กด **สมัคร** ด้วยอีเมลเดิม → เซิร์ฟเวอร์บอกว่าซ้ำ → แสดงผ่าน `forceErrorText` · จากนั้นพิมพ์แก้ → ข้อความหายเพราะ `onChanged` ล้างค่า') }), fl.el)));
  });
})();
