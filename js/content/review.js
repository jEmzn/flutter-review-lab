/* ทบทวนข้อที่ผิด — รวมทุกข้อสอบในเว็บ (ท้ายหัวข้อ, ท้ายบท, แบบฝังในหัวข้อ) แล้วดึงเฉพาะที่เคยตอบผิด / ยังไม่เคยตอบ */
(function () {
  /** collect every quiz item with the same id scheme the quiz engine uses */
  function allItems() {
    const I = FR.markup.index();
    const out = [];
    const walkBlocks = (blocks, keyBase, where) => (blocks || []).forEach((b) => {
      if (!b || typeof b !== 'object') return;
      if (b.t === 'quiz') b.items.forEach((q, i) => out.push({ q, id: q.id || `${keyBase}${b.idSuffix || '-inline'}#${i + 1}`, where }));
      if (Array.isArray(b.body)) walkBlocks(b.body, keyBase, where);
      if (b.cols && b.t === 'two') b.cols.forEach((c) => walkBlocks(c, keyBase, where));
    });
    I.modules.forEach((m) => {
      (m.sections || []).forEach((s) => {
        const where = { href: `#/${m.id}/${s.id}`, label: (m.kind === 'chapter' ? s.id + ' ' : (m.crumb || m.navTitle) + ' · ') + s.title };
        walkBlocks(s.blocks, s._key, where);
        (s.quiz || []).forEach((q, i) => out.push({ q, id: q.id || `${s._key}#${i + 1}`, where }));
      });
      if (m.quiz) m.quiz.forEach((q, i) => out.push({ q, id: q.id || `${m.id}/all#${i + 1}`, where: { href: '#/' + m.id, label: 'ทดสอบรวม · ' + (m.navTitle || m.title) } }));
    });
    return out;
  }

  FR.content.review = {
    id: 'review', kind: 'exam', navTitle: 'ทบทวนข้อที่ผิด', title: 'ทบทวนข้อที่ผิด', num: '↺',
    _allItems: allItems,
    page(main, { md, h }) {
      const items = allItems();
      const wrong = items.filter((x) => { const r = FR.store.quiz(x.id); return r && !r.ok; });
      const right = items.filter((x) => { const r = FR.store.quiz(x.id); return r && r.ok; });
      const fresh = items.filter((x) => !FR.store.quiz(x.id));
      const page = h('article', { class: 'read' });
      page.append(
        h('div', { class: 'eyebrow' }, h('span', { class: 'chip exam' }, 'เตรียมสอบ')),
        h('h1', null, 'ทบทวนข้อที่ผิด'),
        FR.markup.el('p', `แบบทดสอบทั้งเว็บมี **${items.length}** ข้อ — ตอบถูกแล้ว **${right.length}** · เคยตอบผิด **${wrong.length}** · ยังไม่เคยตอบ **${fresh.length}** · ตอบใหม่ที่นี่แล้วผลจะอัปเดตทุกหน้า`, { class: 'lede' }),
        h('div', { class: 'mp-total' }, h('div', { class: 'rv-bar' },
          h('i', { class: 'ok', style: { width: (right.length / items.length) * 100 + '%' } }),
          h('i', { class: 'err', style: { width: (wrong.length / items.length) * 100 + '%' } }))));

      let mode = wrong.length ? 'wrong' : 'fresh';
      const list = h('div', { class: 'rv-list' });
      const pick = (arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
      function draw() {
        FR.util.clear(list);
        const src = mode === 'wrong' ? wrong : mode === 'fresh' ? pick(fresh, 10) : pick(items, 10);
        if (!src.length) {
          list.appendChild(FR.blocks.one({ t: 'callout', kind: 'ok', title: mode === 'wrong' ? 'ไม่มีข้อที่ตอบผิดค้างอยู่' : 'ไม่มีข้อที่ยังไม่เคยตอบ', body: mode === 'wrong' ? 'ลองโหมด “สุ่ม 10 ข้อที่ยังไม่เคยตอบ” หรือไปทำแบบทดสอบท้ายบท' : 'ทำครบทุกข้อแล้ว — ลอง “สุ่ม 10 ข้อจากทั้งหมด”' }, {}));
          return;
        }
        let lastHref = null;
        src.forEach((x, i) => {
          if (x.where.href !== lastHref) { list.appendChild(h('a', { class: 'rv-where xref', href: x.where.href }, x.where.label)); lastHref = x.where.href; }
          list.appendChild(FR.quiz.renderItem(x.q, x.id, i + 1));
        });
      }
      const sg = FR.util.seg([
        { value: 'wrong', label: `ข้อที่เคยตอบผิด (${wrong.length})` },
        { value: 'fresh', label: `สุ่ม 10 ข้อที่ยังไม่เคยตอบ (${fresh.length})` },
        { value: 'all', label: 'สุ่ม 10 ข้อจากทั้งหมด' },
      ], mode, (m) => { mode = m; draw(); });
      page.append(h('div', { class: 'btn-row', style: { margin: '14px 0' } }, sg, FR.util.btn('สุ่มใหม่', draw, 'sm ghost')), list);
      main.appendChild(page);
      draw();
    },
  };
})();
