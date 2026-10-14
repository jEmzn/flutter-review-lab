/* App shell: hash router, sidebar, breadcrumbs, pages, search palette, error collector. */
(function () {
  'use strict';
  const { h, clear } = FR.util;
  const md = (s) => FR.markup.inline(s);

  // ---------- error collector (visible, for QA) ----------
  const errs = [];
  FR.reportError = function (msg) {
    errs.push(String(msg));
    const box = document.getElementById('__errors');
    if (box) { box.hidden = false; box.textContent = errs.slice(-6).join('\n'); }
  };
  window.addEventListener('error', (e) => FR.reportError((e.message || 'error') + (e.filename ? ' @' + e.filename.split('/').pop() + ':' + e.lineno : '')));
  window.addEventListener('unhandledrejection', (e) => FR.reportError('promise: ' + (e.reason && e.reason.message || e.reason)));

  let I; // index
  const $ = (id) => document.getElementById(id);

  // ---------- progress helpers ----------
  function sectionQuizIds(s) { return (s.quiz || []).map((q, i) => q.id || `${s._key}#${i + 1}`); }
  function sectionState(s) {
    const seen = FR.store.visited(s._key);
    const qids = sectionQuizIds(s);
    const okAll = qids.length > 0 && qids.every((id) => { const r = FR.store.quiz(id); return r && r.ok; });
    return okAll ? 'done' : seen ? 'seen' : '';
  }
  function moduleProgress(m) {
    const secs = m.sections || [];
    if (!secs.length) return { pct: FR.store.visited(m.id) ? 100 : 0, seen: 0, total: 0, done: 0 };
    let seen = 0, done = 0;
    secs.forEach((s) => { const st = sectionState(s); if (st) seen++; if (st === 'done') done++; });
    return { pct: Math.round((seen / secs.length) * 100), seen, done, total: secs.length };
  }
  FR.progress = { sectionState, moduleProgress, sectionQuizIds };

  // ---------- sidebar ----------
  const GROUPS = [
    { label: 'เริ่มที่นี่', ids: ['map', 'core'] },
    { label: 'บทเรียน (ตามตำรา)', ids: ['ch07', 'ch08', 'ch09', 'ch10', 'ch11', 'ch12', 'ch13'] },
    { label: 'ส่วนเสริม', ids: ['dart', 'sql'] },
    { label: 'เตรียมสอบ', ids: ['exam', 'walk-ex13', 'walk-offline', 'bughunt', 'review'] },
  ];
  function renderSidebar(route) {
    const nav = $('sidebar');
    clear(nav);
    for (const g of GROUPS) {
      const grp = h('div', { class: 'nav-group' }, h('div', { class: 'nav-label' }, g.label));
      for (const id of g.ids) {
        const m = I.byId[id];
        if (!m) continue;
        const active = route.mod === id;
        const p = moduleProgress(m);
        const dotCls = p.total && p.done === p.total ? 'done' : p.seen ? 'seen' : '';
        const a = h('a', { class: 'nav-item' + (active && !route.sec ? ' active' : ''), href: '#/' + id },
          h('span', { class: 'num' }, m.num || ''),
          h('span', { class: 't' }, m.navTitle || m.title),
          m.kind === 'supp' ? h('span', { class: 'nav-tag' }, 'เสริม') : null,
          m.sections && m.sections.length ? h('span', { class: 'dot ' + dotCls, title: `${p.seen}/${p.total} หัวข้อ` }) : null);
        grp.appendChild(a);
        if (active && m.sections && m.sections.length) {
          const sub = h('div', { class: 'nav-sub' });
          m.sections.forEach((s) => {
            sub.appendChild(h('a', { class: 'nav-item' + (route.sec === s.id ? ' active' : ''), href: `#/${m.id}/${s.id}` },
              h('span', { class: 'num' }, m.kind === 'chapter' ? s.id : ''),
              h('span', { class: 't' }, s.navTitle || s.title),
              h('span', { class: 'dot ' + sectionState(s) })));
          });
          grp.appendChild(sub);
        }
      }
      nav.appendChild(grp);
    }
    const act = nav.querySelector('.nav-sub .active') || nav.querySelector('.nav-item.active');
    if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest' });
  }

  // ---------- breadcrumbs ----------
  function renderCrumbs(route) {
    const c = $('crumbs');
    clear(c);
    const parts = [h('a', { href: '#/' }, 'ภาพรวม')];
    const m = I.byId[route.mod];
    if (m && m.id !== 'map') {
      parts.push(h('span', { class: 'sep' }, '›'));
      parts.push(route.sec ? h('a', { href: '#/' + m.id }, m.crumb || m.navTitle || m.title) : h('span', { class: 'cur' }, m.crumb || m.navTitle || m.title));
    }
    if (route.sec && m) {
      const s = (m.sections || []).find((x) => x.id === route.sec);
      parts.push(h('span', { class: 'sep' }, '›'));
      parts.push(h('span', { class: 'cur' }, s ? (m.kind === 'chapter' ? s.id + ' ' : '') + s.title : route.sec));
    }
    parts.forEach((p) => c.appendChild(p));
  }

  // ---------- pages ----------
  function chips(m) {
    const out = [];
    if (m.kind === 'chapter') out.push(h('span', { class: 'chip src' }, 'บทที่ ' + m.num));
    if (m.kind === 'supp') out.push(h('span', { class: 'chip supp' }, 'เสริม — ไม่อยู่ในตำรา'));
    if (m.kind === 'exam') out.push(h('span', { class: 'chip exam' }, 'เตรียมสอบ'));
    return out;
  }

  function moduleNeighbors(m) {
    const order = GROUPS.flatMap((g) => g.ids).filter((id) => I.byId[id]);
    const i = order.indexOf(m.id);
    return { prev: i > 0 ? I.byId[order[i - 1]] : null, next: i >= 0 && i < order.length - 1 ? I.byId[order[i + 1]] : null };
  }

  function pnLinks(prev, next) {
    const pn = h('nav', { class: 'pn', 'aria-label': 'ก่อนหน้า/ถัดไป' });
    pn.appendChild(prev ? h('a', { href: prev.href }, h('span', { class: 'd' }, '← ก่อนหน้า'), prev.label) : h('span'));
    pn.appendChild(next ? h('a', { class: 'next', href: next.href }, h('span', { class: 'd' }, 'ถัดไป →'), next.label) : h('span'));
    return pn;
  }

  function renderModule(m, main) {
    if (typeof m.page === 'function') { m.page(main, { md, h }); FR.store.visit(m.id); return; }
    const ctx = { vizByName: new Map(), keyBase: m.id };
    const page = h('article', { class: 'read' });
    page.appendChild(h('div', { class: 'eyebrow' }, chips(m)));
    page.appendChild(h('h1', null, m.kind === 'chapter' ? `บทที่ ${m.num}: ${m.title}` : m.title));
    if (m.problem) page.appendChild(FR.markup.el('p', m.problem, { class: 'lede' }));
    if (m.receives) {
      page.appendChild(FR.blocks.one({ t: 'callout', kind: 'exam', title: m.receives.title || 'คำถามที่รับต่อมาจากบทก่อน', body: m.receives.body }, ctx));
    }
    if (m.overview) page.appendChild(FR.blocks.render(m.overview, ctx));

    if (m.sections && m.sections.length) {
      page.appendChild(h('h2', null, m.sectionsTitle || 'หัวข้อในบทนี้'));
      const grid = h('div', { class: 'grid c2' });
      m.sections.forEach((s) => {
        const st = sectionState(s);
        grid.appendChild(h('a', { class: 'card sec-card', href: `#/${m.id}/${s.id}` },
          h('div', { class: 'num' }, m.kind === 'chapter' ? '§' + s.id : (s.tag || '')),
          h('div', { class: 'ttl' }, s.title),
          s.gist ? h('div', { class: 'g', html: md(s.gist) }) : null,
          h('div', { class: 'st' },
            s.supp && m.kind !== 'supp' ? h('span', { class: 'chip supp' }, 'เสริม') : null,
            s.quiz && s.quiz.length ? h('span', { class: 'chip' }, `แบบทดสอบ ${s.quiz.length} ข้อ`) : null,
            st === 'done' ? h('span', { class: 'chip ok' }, 'ผ่านแล้ว') : st === 'seen' ? h('span', { class: 'chip' }, 'อ่านแล้ว') : null)));
      });
      page.appendChild(grid);
    }
    if (m.rules && m.rules.length) {
      page.appendChild(h('h2', null, 'กฎ/ข้อควรจำ (cheat sheet)'));
      page.appendChild(FR.blocks.one({ t: 'rules', items: m.rules }, ctx));
    }
    if (m.after) page.appendChild(FR.blocks.render(m.after, ctx));
    if (m.handsOff) {
      page.appendChild(h('h2', null, m.handsOff.heading || 'คำถามชวนคิดท้ายบท'));
      page.appendChild(FR.blocks.render(m.handsOff.body, ctx));
    }
    if (m.quiz && m.quiz.length) page.appendChild(FR.quiz.render(m.quiz, m.id + '/all', { title: 'ทดสอบรวมบท' }));
    const nb = moduleNeighbors(m);
    page.appendChild(pnLinks(nb.prev && { href: '#/' + nb.prev.id, label: nb.prev.navTitle || nb.prev.title }, m.sections && m.sections.length ? { href: `#/${m.id}/${m.sections[0].id}`, label: 'เริ่มหัวข้อแรก: ' + m.sections[0].title } : nb.next && { href: '#/' + nb.next.id, label: nb.next.navTitle || nb.next.title }));
    main.appendChild(page);
    FR.store.visit(m.id);
  }

  function renderSection(m, s, main) {
    const ctx = { vizByName: new Map(), keyBase: s._key };
    const page = h('article', { class: 'read' });
    // minimap
    const mm = h('nav', { class: 'minimap', 'aria-label': 'หัวข้อในบทนี้' });
    m.sections.forEach((x) => mm.appendChild(h('a', { href: `#/${m.id}/${x.id}`, class: (x.id === s.id ? 'cur' : sectionState(x) ? 'seen' : ''), title: x.title }, m.kind === 'chapter' ? x.id : (x.short || x.id))));
    page.appendChild(mm);
    const eb = h('div', { class: 'eyebrow' }, chips(m));
    if (s.source) eb.appendChild(h('span', { class: 'chip src' }, 'ตำรา ' + s.source));
    if (s.supp && m.kind !== 'supp') eb.appendChild(h('span', { class: 'chip supp' }, 'เสริม — ไม่อยู่ในตำรา'));
    if (s.exam) eb.appendChild(h('span', { class: 'chip exam' }, 'ออกสอบบ่อย'));
    page.appendChild(eb);
    page.appendChild(h('h1', null, (m.kind === 'chapter' ? s.id + ' ' : '') + s.title));
    if (s.gist) page.appendChild(h('div', { class: 'gist' }, h('span', { class: 'lbl' }, 'ใจความ'), h('div', { html: md(s.gist) })));
    page.appendChild(FR.blocks.render(s.blocks, ctx));
    if (s.quiz && s.quiz.length) page.appendChild(FR.quiz.render(s.quiz, s._key, s.quizTitle ? { title: s.quizTitle } : undefined));
    const i = s._index;
    const prev = i > 0 ? m.sections[i - 1] : null;
    const next = i < m.sections.length - 1 ? m.sections[i + 1] : null;
    const nb = moduleNeighbors(m);
    page.appendChild(pnLinks(
      prev ? { href: `#/${m.id}/${prev.id}`, label: (m.kind === 'chapter' ? prev.id + ' ' : '') + prev.title } : { href: '#/' + m.id, label: 'ภาพรวม' + (m.kind === 'chapter' ? 'บทที่ ' + m.num : '') },
      next ? { href: `#/${m.id}/${next.id}`, label: (m.kind === 'chapter' ? next.id + ' ' : '') + next.title } : nb.next ? { href: '#/' + nb.next.id, label: nb.next.navTitle || nb.next.title } : null));
    main.appendChild(page);
    FR.store.visit(s._key);
  }

  function notFound(main, path) {
    main.appendChild(h('article', { class: 'read' }, h('h1', null, 'ไม่พบหน้านี้'), h('p', null, 'เส้นทาง: ' + path), h('p', null, h('a', { href: '#/' }, 'กลับไปหน้าภาพรวม'))));
  }

  // ---------- router ----------
  function parse() {
    const raw = decodeURIComponent((location.hash || '#/').slice(1)).replace(/^\/+/, '');
    if (!raw) return { mod: 'map', sec: null, raw };
    const parts = raw.split('/');
    if (parts[0] === 'code') return { mod: 'walk-' + (parts[1] || 'ex13'), sec: null, raw };
    return { mod: parts[0], sec: parts[1] || null, raw };
  }

  function route() {
    I = FR.markup.index();
    const r = parse();
    FR.viz.destroyAll();
    const main = $('main');
    clear(main);
    document.body.classList.remove('drawer-open');
    const m = I.byId[r.mod];
    if (r.mod === 'dev' && FR.devPage) FR.devPage(main);
    else if (!m) notFound(main, r.raw);
    else if (r.sec) {
      const s = (m.sections || []).find((x) => x.id === r.sec);
      if (s) renderSection(m, s, main); else notFound(main, r.raw);
    } else renderModule(m, main);
    renderSidebar(r);
    renderCrumbs(r);
    const t = m ? (r.sec ? r.sec + ' · ' : '') + (m.navTitle || m.title) : 'Flutter Review';
    document.title = t + ' — ทบทวน Flutter 7–13';
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }

  // ---------- search palette ----------
  function buildSearch() {
    const items = [];
    for (const m of I.modules) {
      items.push({ t: m.navTitle || m.title, g: m.problem || '', where: m.kind === 'chapter' ? 'บทที่ ' + m.num : 'หน้า', href: '#/' + m.id });
      (m.sections || []).forEach((s) => items.push({ t: (m.kind === 'chapter' ? s.id + ' ' : '') + s.title, g: s.gist || '', where: m.navTitle || m.title, href: `#/${m.id}/${s.id}`, kw: s.keywords || '' }));
    }
    (FR.data.glossary || []).forEach((g) => {
      const r = g.ref && FR.markup.resolve(g.ref);
      items.push({ t: g.term, g: g.def, where: 'คำศัพท์', href: r ? r.href : '#/' });
    });
    return items;
  }
  function strip(s) { return String(s).replace(/\*\*|`|\[\[[^\]|]*\|?|\]\]/g, ''); }
  function openPalette() {
    I = FR.markup.index();
    const items = buildSearch();
    const input = h('input', { type: 'search', placeholder: 'ค้นหาหัวข้อ / คำศัพท์ เช่น select, whereArgs, PopScope…', 'aria-label': 'ค้นหา' });
    const results = h('div', { class: 'results', role: 'listbox' });
    const wrap = h('div', { class: 'palette-wrap' }, h('div', { class: 'palette', role: 'dialog', 'aria-label': 'ค้นหา' }, input, results));
    let sel = 0, shown = [];
    function close() { wrap.remove(); document.removeEventListener('keydown', onKey, true); }
    function draw() {
      const q = input.value.trim().toLowerCase();
      shown = (q ? items.filter((it) => (it.t + ' ' + strip(it.g) + ' ' + (it.kw || '')).toLowerCase().includes(q)) : items.filter((it) => it.where !== 'คำศัพท์')).slice(0, 40);
      sel = Math.min(sel, Math.max(shown.length - 1, 0));
      clear(results);
      if (!shown.length) results.appendChild(h('div', { class: 'empty' }, 'ไม่พบ'));
      shown.forEach((it, i) => {
        const a = h('a', { class: 'res' + (i === sel ? ' sel' : ''), href: it.href, role: 'option' }, h('span', { class: 'where' }, it.where), h('div', null, it.t), it.g ? h('span', { class: 'g' }, strip(it.g).slice(0, 120)) : null);
        a.addEventListener('click', close);
        results.appendChild(a);
      });
    }
    function onKey(e) {
      if (e.key === 'Escape') { close(); e.preventDefault(); }
      else if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, shown.length - 1); draw(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
      else if (e.key === 'Enter' && shown[sel]) { location.hash = shown[sel].href.slice(1); close(); e.preventDefault(); }
    }
    input.addEventListener('input', () => { sel = 0; draw(); });
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(wrap);
    draw();
    input.focus();
  }

  // ---------- boot ----------
  function boot() {
    I = FR.markup.rebuildIndex();
    $('searchBtn').addEventListener('click', openPalette);
    $('menuBtn').addEventListener('click', () => document.body.classList.toggle('drawer-open'));
    $('scrim').addEventListener('click', () => document.body.classList.remove('drawer-open'));
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
      else if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) { e.preventDefault(); openPalette(); }
    });
    window.addEventListener('hashchange', route);
    route();
    if (FR.markup.unresolved.size) console.warn('unresolved refs', [...FR.markup.unresolved]);
  }
  FR.app = { route, openPalette };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
