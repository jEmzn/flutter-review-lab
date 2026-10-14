/* #/dev — engine gallery + self-tests (for QA). Writes results to #devResults (data-status). */
(function () {
  'use strict';
  const { h } = FR.util;

  FR.devPage = async function (main) {
    const page = h('article', { class: 'page' });
    page.appendChild(h('h1', null, 'Dev: engine gallery & self-tests'));
    const results = h('pre', { id: 'devResults', 'data-status': 'running' }, 'running…');
    page.appendChild(results);
    main.appendChild(page);
    const out = [];
    const ok = (name, cond, extra) => out.push((cond ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : ''));

    // Tree
    const tbox = h('div', { class: 'viz' }, h('div', { class: 'vbd' }));
    page.appendChild(tbox);
    const tv = FR.Tree.create(tbox.firstChild, {
      id: 'app', label: 'MaterialApp', kind: 'system', children: [
        { id: 'home', label: 'MyHomePage', kind: 'stateful', meta: 'State #s1', children: [
          { id: 'title', label: "Text('title')", kind: 'leaf', const: true },
          { id: 'count', label: 'Text(_counter)', kind: 'leaf' },
          { id: 'cons', label: 'Consumer<Cart>', kind: 'consumer', children: [{ id: 'badge', label: 'Badge', kind: 'leaf' }] },
        ] },
      ] });
    tv.rebuild(tv.subtree('home'));
    ok('tree subtree skips const', JSON.stringify(tv.subtree('home')) === JSON.stringify(['home', 'count', 'cons', 'badge']), JSON.stringify(tv.subtree('home')));
    tv.arrow('count', 'app', 'lookup', 'Theme.of(context)');
    const found = await tv.lookup('badge', (n) => n.kind === 'system', { delay: 10 });
    ok('tree lookup finds MaterialApp', found === 'app');

    // Stepper + swimlane
    const sbox = h('div', { class: 'viz' }, h('div', { class: 'vbd' }));
    page.appendChild(sbox);
    const sl = FR.Swimlane.create(sbox.firstChild, {
      lanes: [{ id: 'u', label: 'ผู้ใช้' }, { id: 's', label: 'Screen' }, { id: 'p', label: 'Provider' }, { id: 'd', label: 'SQLite' }],
      variants: {
        on: { label: 'ออนไลน์', steps: [{ from: 'u', to: 's', label: 'กดบันทึก' }, { from: 's', to: 'p', label: 'read().add()' }, { from: 'p', to: 'd', label: 'insert' }, { from: 'd', to: 'p', label: 'id', kind: 'ret' }, { from: 'p', to: 's', label: 'notifyListeners', kind: 'notify' }, { from: 'p', label: 'สำเร็จ', kind: 'ok' }] },
        off: { label: 'พัง', steps: [{ from: 'u', to: 's', label: 'กดบันทึก' }, { from: 'p', to: 'd', label: 'insert', kind: 'fail' }] },
      },
    });
    sl.stepper.go(3);
    ok('swimlane renders rows', sbox.querySelectorAll('.sl-row').length === 6);

    // Phone
    const pbox = h('div', { class: 'viz' }, h('div', { class: 'vbd vrow' }));
    page.appendChild(pbox);
    const ph = FR.Phone.create({ title: 'Login' });
    const f = FR.ui.field({ label: 'อีเมล', hint: 'you@mail.com', helper: 'ต้องมี @' });
    ph.setBody(FR.ui.pad(f.el, FR.ui.field({ label: 'รหัสผ่าน', obscure: true }).el, FR.ui.btn('เข้าสู่ระบบ', () => ph.snack('ok'))));
    ph.setFab('+', () => {});
    f.setError('อีเมลต้องมี @');
    const con = FR.Console.create({ title: 'Console' });
    con.log("print('hello')"); con.log('rebuild', 'flash'); con.log('error', 'err');
    pbox.firstChild.append(ph.el, h('div', { class: 'grow' }, con.el));
    ok('phone renders', !!pbox.querySelector('.ph-screen'));

    // SQL
    try {
      const db = await FR.sql.open(`CREATE TABLE notes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, content TEXT NOT NULL);`);
      const a = db.insert('notes', { title: 'a', content: 'x' });
      ok('sql insert returns id 1', a.ok && a.lastId === 1, JSON.stringify(a.result));
      db.insert('notes', { title: "O'Brien", content: 'y' });
      const mm = db.update('notes', { id: null, title: 'b', content: 'z' }, { where: 'id = ?', whereArgs: [1] });
      ok('update with id:null → datatype mismatch', !mm.ok && /mismatch/i.test(mm.error), mm.error);
      const nn = db.insert('notes', { title: null, content: 'z' });
      ok('NOT NULL constraint error', !nn.ok && /NOT NULL/.test(nn.error), nn.error);
      const kw = "x' OR '1'='1";
      const inj = db.rawQuery(`SELECT * FROM notes WHERE title = '${kw}'`);
      const safe = db.query('notes', { where: 'title = ?', whereArgs: [kw] });
      ok('injection returns all rows; binding returns none', inj.rows.length === 2 && safe.rows.length === 0, `${inj.rows.length} vs ${safe.rows.length}`);
      db.begin(); db.update('notes', { title: 'tx' }, { where: 'id = ?', whereArgs: [1] }); db.rollback();
      ok('rollback restores', db.query('notes', { where: 'id = 1' }).rows[0].title === 'a');
      const all = db.update('notes', { title: 'ALL' });
      ok('update without where hits all rows', all.changes === 2 && all.affected.length === 2);
      db.execute('ALTER TABLE notes ADD COLUMN created_at TEXT');
      ok('alter add column → table_info', db.tableInfo('notes').some((c) => c.name === 'created_at'));
      const tg = FR.TableGrid.create({ db, table: 'notes' });
      const log = FR.SqlLog.create();
      log.add(a); log.add(mm); log.add(inj);
      page.appendChild(h('div', { class: 'viz' }, h('div', { class: 'vbd vcol' }, tg.el, log.el)));
      ok('sqlite version', true, db.rawQuery('select sqlite_version() as v').rows[0].v);
    } catch (e) {
      ok('sql.js load', false, e.message);
    }

    // content checks
    const I = FR.markup.index();
    ok('modules loaded', I.modules.length > 0, I.modules.map((m) => m.id).join(','));
    ok('no missing viz', !(FR._missingViz || []).length, (FR._missingViz || []).join(','));

    results.textContent = out.join('\n');
    results.dataset.status = out.some((l) => l.startsWith('FAIL')) ? 'fail' : 'pass';
  };
})();
