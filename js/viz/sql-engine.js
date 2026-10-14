/* Real SQLite in the browser via sql.js (asm build, works on file://), wrapped in an sqflite-like API
   that returns a trace for every call: {op, dart, sql, args, ok, error, rows, changes, lastId, affected}. */
(function () {
  'use strict';
  const { h, clear } = FR.util;

  let readyP = null;
  function ready() {
    if (readyP) return readyP;
    readyP = new Promise((resolve, reject) => {
      const init = () => window.initSqlJs().then(resolve, reject);
      if (window.initSqlJs) return init();
      const s = document.createElement('script');
      s.src = 'assets/vendor/sql-asm.js';
      s.onload = init;
      s.onerror = () => reject(new Error('โหลด sql.js ไม่สำเร็จ (assets/vendor/sql-asm.js)'));
      document.head.appendChild(s);
    });
    return readyP;
  }

  // ---------- Dart literal formatting ----------
  function dv(v) {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(v);
    if (typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) return '[' + v.map(dv).join(', ') + ']';
    if (typeof v === 'object') return '{' + Object.keys(v).map((k) => `'${k}': ${dv(v[k])}`).join(', ') + '}';
    return String(v);
  }
  function sv(v) { // SQL literal for display only
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return String(v);
    return "'" + String(v).replace(/'/g, "''") + "'";
  }

  const CONFLICT = { replace: 'OR REPLACE', ignore: 'OR IGNORE', abort: 'OR ABORT', fail: 'OR FAIL', rollback: 'OR ROLLBACK' };

  class Db {
    constructor(SQL, name) { this.SQL = SQL; this.db = new SQL.Database(); this.name = name || 'app.db'; this.listeners = new Set(); }
    onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    _emit(t) { this.listeners.forEach((fn) => { try { fn(t); } catch (e) { console.error(e); } }); }

    /** run any SQL (with optional args) and return {columns, rows(objects), changes} */
    _run(sql, args) {
      const stmt = this.db.prepare(sql);
      try {
        if (args && args.length) stmt.bind(args.map((a) => (a === undefined ? null : a)));
        const rows = [];
        let columns = [];
        while (stmt.step()) { columns = stmt.getColumnNames(); rows.push(stmt.getAsObject()); }
        if (!columns.length) try { columns = stmt.getColumnNames(); } catch (e) {}
        return { columns, rows, changes: this.db.getRowsModified() };
      } finally { stmt.free(); }
    }
    _lastId() { const r = this.db.exec('SELECT last_insert_rowid()'); return r[0] ? r[0].values[0][0] : null; }
    _affected(table, where, whereArgs) {
      try {
        const r = this._run(`SELECT rowid AS __rid FROM ${table}` + (where ? ` WHERE ${where}` : ''), whereArgs || []);
        return r.rows.map((x) => x.__rid);
      } catch (e) { return []; }
    }
    _trace(base, fn) {
      const t = Object.assign({ ok: true }, base);
      try { Object.assign(t, fn()); }
      catch (e) {
        t.ok = false;
        t.error = e.message;
        t.dartError = `DatabaseException(${e.message}) sql '${t.sql}'` + (t.args && t.args.length ? ` args ${dv(t.args)}` : '');
      }
      this._emit(t);
      return t;
    }

    /** execute raw SQL script (multiple statements, no args) — for seeding / execute() */
    execute(sql, opts = {}) {
      return this._trace({ op: 'execute', sql: sql.trim(), args: [], dart: opts.dart || `await db.execute('''\n${sql.trim()}\n''');` }, () => {
        this.db.exec(sql);
        return { changes: this.db.getRowsModified() };
      });
    }
    insert(table, values, opts = {}) {
      const cols = Object.keys(values);
      const args = cols.map((c) => values[c]);
      const conflict = opts.conflict ? CONFLICT[opts.conflict] + ' ' : '';
      const sql = cols.length ? `INSERT ${conflict}INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})` : `INSERT ${conflict}INTO ${table} DEFAULT VALUES`;
      const dart = opts.dart || `await ${opts.on || 'db'}.insert('${table}', ${dv(values)}${opts.conflict ? `, conflictAlgorithm: ConflictAlgorithm.${opts.conflict}` : ''});`;
      return this._trace({ op: 'insert', table, sql, args, dart }, () => {
        this._run(sql, args);
        const changes = this.db.getRowsModified();
        const lastId = changes ? this._lastId() : 0;
        return { changes, lastId, affected: lastId ? [lastId] : [], result: `id = ${lastId}` };
      });
    }
    query(table, o = {}) {
      let sql = `SELECT ${o.distinct ? 'DISTINCT ' : ''}${o.columns ? o.columns.join(', ') : '*'} FROM ${table}`;
      if (o.where) sql += ` WHERE ${o.where}`;
      if (o.groupBy) sql += ` GROUP BY ${o.groupBy}`;
      if (o.having) sql += ` HAVING ${o.having}`;
      if (o.orderBy) sql += ` ORDER BY ${o.orderBy}`;
      if (o.limit != null) sql += ` LIMIT ${o.limit}`;
      if (o.offset != null) sql += ` OFFSET ${o.offset}`;
      const args = o.whereArgs || [];
      const named = [];
      if (o.columns) named.push(`columns: ${dv(o.columns)}`);
      if (o.where) named.push(`where: ${dv(o.where)}`);
      if (o.whereArgs) named.push(`whereArgs: ${dv(o.whereArgs)}`);
      if (o.groupBy) named.push(`groupBy: ${dv(o.groupBy)}`);
      if (o.orderBy) named.push(`orderBy: ${dv(o.orderBy)}`);
      if (o.limit != null) named.push(`limit: ${o.limit}`);
      if (o.offset != null) named.push(`offset: ${o.offset}`);
      const dart = o.dart || `await db.query('${table}'${named.length ? ', ' + named.join(', ') : ''});`;
      return this._trace({ op: 'query', table, sql, args, dart }, () => {
        const r = this._run(sql, args);
        return { rows: r.rows, columns: r.columns, result: `${r.rows.length} แถว` };
      });
    }
    update(table, values, o = {}) {
      const cols = Object.keys(values);
      const conflict = o.conflict ? CONFLICT[o.conflict] + ' ' : '';
      let sql = `UPDATE ${conflict}${table} SET ${cols.map((c) => `${c} = ?`).join(', ')}`;
      if (o.where) sql += ` WHERE ${o.where}`;
      const args = cols.map((c) => values[c]).concat(o.whereArgs || []);
      const named = [];
      if (o.where) named.push(`where: ${dv(o.where)}`);
      if (o.whereArgs) named.push(`whereArgs: ${dv(o.whereArgs)}`);
      const dart = o.dart || `await ${o.on || 'db'}.update('${table}', ${dv(values)}${named.length ? ', ' + named.join(', ') : ''});`;
      const affected = this._affected(table, o.where, o.whereArgs);
      return this._trace({ op: 'update', table, sql, args, dart }, () => {
        this._run(sql, args);
        const changes = this.db.getRowsModified();
        return { changes, affected: changes ? affected : [], result: `แถวที่ถูกแก้ = ${changes}` };
      });
    }
    delete(table, o = {}) {
      let sql = `DELETE FROM ${table}`;
      if (o.where) sql += ` WHERE ${o.where}`;
      const args = o.whereArgs || [];
      const named = [];
      if (o.where) named.push(`where: ${dv(o.where)}`);
      if (o.whereArgs) named.push(`whereArgs: ${dv(o.whereArgs)}`);
      const dart = o.dart || `await ${o.on || 'db'}.delete('${table}'${named.length ? ', ' + named.join(', ') : ''});`;
      const affected = this._affected(table, o.where, o.whereArgs);
      return this._trace({ op: 'delete', table, sql, args, dart }, () => {
        this._run(sql, args);
        const changes = this.db.getRowsModified();
        return { changes, affected, result: `แถวที่ถูกลบ = ${changes}` };
      });
    }
    rawQuery(sql, args = [], o = {}) {
      const dart = o.dart || `await db.rawQuery(${dv(sql)}${args.length ? ', ' + dv(args) : ''});`;
      return this._trace({ op: 'rawQuery', sql, args, dart }, () => {
        const r = this._run(sql, args);
        return { rows: r.rows, columns: r.columns, changes: r.changes, result: `${r.rows.length} แถว` };
      });
    }
    /** for playground: run arbitrary statements; returns list of result sets */
    run(sql) {
      return this._trace({ op: 'sql', sql, args: [], dart: '' }, () => {
        const res = this.db.exec(sql);
        return { sets: res.map((r) => ({ columns: r.columns, rows: r.values })), changes: this.db.getRowsModified() };
      });
    }
    begin() { this.db.exec('BEGIN'); this._emit({ op: 'begin', ok: true, sql: 'BEGIN', dart: 'await db.transaction((txn) async {' }); }
    commit() { this.db.exec('COMMIT'); this._emit({ op: 'commit', ok: true, sql: 'COMMIT', dart: '}); // ทุกคำสั่งสำเร็จ → COMMIT' }); }
    rollback() { try { this.db.exec('ROLLBACK'); } catch (e) {} this._emit({ op: 'rollback', ok: true, sql: 'ROLLBACK', dart: '// มี exception ในบล็อก → ROLLBACK ทั้งหมด' }); }
    get inTx() { // sql.js has no getAutocommit → probe: BEGIN fails only when a transaction is already open
      try { this.db.exec('BEGIN'); this.db.exec('ROLLBACK'); return false; } catch (e) { return /within a transaction/.test(e.message); }
    }
    tableInfo(table) { try { return this._run(`PRAGMA table_info(${table})`).rows; } catch (e) { return []; } }
    tables() { try { return this._run("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").rows.map((r) => r.name); } catch (e) { return []; } }
    rows(table, orderBy = 'rowid') { try { return this._run(`SELECT rowid AS __rid, * FROM ${table} ORDER BY ${orderBy}`).rows; } catch (e) { return null; } }
    count(table) { try { return this._run(`SELECT COUNT(*) AS n FROM ${table}`).rows[0].n; } catch (e) { return 0; } }
    userVersion(v) { if (v == null) return this._run('PRAGMA user_version').rows[0].user_version; this.db.exec(`PRAGMA user_version = ${v | 0}`); }
    close() { try { this.db.close(); } catch (e) {} }
  }

  async function open(seed, name) {
    const SQL = await ready();
    const d = new Db(SQL, name);
    if (seed) d.db.exec(seed);
    return d;
  }

  // ---------- TableGrid ----------
  function TableGrid(opts) {
    const el = h('div', { class: 'tg' });
    const hd = h('div', { class: 'tg-hd' }, h('span', { class: 'tg-name' }, opts.title || opts.table), h('span', { class: 'tg-count' }));
    const wrap = h('div', { class: 'tg-wrap' });
    if (opts.maxHeight) wrap.style.maxHeight = opts.maxHeight;
    el.append(hd, wrap);
    let db = opts.db;
    let table = opts.table;
    function render() {
      clear(wrap);
      const rows = db ? db.rows(table, opts.orderBy) : null;
      if (rows == null) { wrap.appendChild(h('div', { class: 'tg-empty' }, `ไม่มีตาราง ${table}`)); hd.lastChild.textContent = ''; return; }
      const info = db.tableInfo(table);
      const cols = opts.cols || info.map((c) => c.name);
      const t = h('table', { class: 'tg-t' });
      t.appendChild(h('thead', null, h('tr', null, cols.map((c) => {
        const ci = info.find((x) => x.name === c);
        return h('th', { title: ci ? `${ci.type || ''}${ci.pk ? ' PRIMARY KEY' : ''}${ci.notnull ? ' NOT NULL' : ''}${ci.dflt_value != null ? ' DEFAULT ' + ci.dflt_value : ''}` : '' }, c, ci && ci.type ? h('span', { class: 'tg-type' }, ci.type.toLowerCase()) : null);
      }))));
      const tb = h('tbody');
      rows.forEach((r) => tb.appendChild(h('tr', { 'data-rid': r.__rid }, cols.map((c) => {
        const v = r[c];
        return h('td', { class: v === null || v === undefined ? 'null' : typeof v === 'number' ? 'num' : '' }, v === null || v === undefined ? 'NULL' : String(v));
      }))));
      if (!rows.length) tb.appendChild(h('tr', null, h('td', { colspan: cols.length, class: 'tg-empty' }, opts.emptyText || '(ไม่มีแถว)')));
      t.appendChild(tb);
      wrap.appendChild(t);
      hd.lastChild.textContent = `${rows.length} แถว`;
    }
    function flashIds(ids, cls) {
      (ids || []).forEach((id) => { const tr = wrap.querySelector(`tr[data-rid="${id}"]`); if (tr) FR.util.flash(tr, cls, 1400); });
    }
    const api = {
      el,
      refresh: render,
      setDb(d, t) { db = d; if (t) table = t; render(); },
      setTable(t) { table = t; hd.firstChild.textContent = t; render(); },
      apply(trace) {
        if (!trace) return render();
        if (!trace.ok) { FR.util.flash(el, 'tg-err', 1200); return; }
        if (trace.table && trace.table !== table) { render(); return; }
        if (trace.op === 'delete') {
          (trace.affected || []).forEach((id) => { const tr = wrap.querySelector(`tr[data-rid="${id}"]`); if (tr) tr.classList.add('del'); });
          setTimeout(render, 750);
        } else {
          render();
          if (trace.op === 'insert') flashIds(trace.affected, 'ins');
          if (trace.op === 'update') flashIds(trace.affected, 'upd');
        }
      },
      flashIds,
    };
    if (db) render();
    return api;
  }

  // ---------- SqlLog: shows Dart call → SQL + args → result ----------
  function SqlLog(opts = {}) {
    const body = h('div', { class: 'sqlog-body', role: 'log', 'aria-live': 'polite' });
    const el = h('div', { class: 'sqlog' }, h('div', { class: 'con-hd' }, h('span', null, opts.title || 'สิ่งที่เกิดขึ้นจริง (Dart → SQL)'), h('button', { type: 'button', class: 'btn sm ghost', onclick: () => clear(body) }, 'ล้าง')), body);
    if (opts.height) body.style.maxHeight = opts.height;
    function add(t) {
      const item = h('div', { class: 'sq-item ' + (t.ok ? '' : 'bad') });
      if (t.dart && opts.showDart !== false) item.appendChild(h('div', { class: 'sq-dart', html: FR.highlight.inline(t.dart, 'dart') }));
      if (t.sql) item.appendChild(h('div', { class: 'sq-sql' }, h('span', { class: 'sq-k' }, 'SQL'), h('span', { html: FR.highlight.inline(t.sql, 'sql') })));
      if (t.args && t.args.length) item.appendChild(h('div', { class: 'sq-args' }, h('span', { class: 'sq-k' }, 'args'), h('span', { class: 'mono' }, dv(t.args))));
      if (t.ok && t.result) item.appendChild(h('div', { class: 'sq-res ok' }, '→ ' + t.result));
      if (!t.ok) item.appendChild(h('div', { class: 'sq-res err' }, '✗ ' + (t.dartError || t.error)));
      if (t.note) item.appendChild(h('div', { class: 'sq-note', html: FR.markup.inline(t.note) }));
      body.appendChild(item);
      FR.util.flash(item, 'new', 800);
      body.scrollTop = body.scrollHeight;
      return item;
    }
    return { el, add, clear: () => clear(body) };
  }

  /** ResultTable for query results */
  function ResultTable(columns, rows, opts = {}) {
    if (!columns || !columns.length) return h('div', { class: 'tg-empty' }, opts.empty || '(ไม่มีผลลัพธ์)');
    const t = h('table', { class: 'tg-t' });
    t.appendChild(h('thead', null, h('tr', null, columns.map((c) => h('th', null, c)))));
    const tb = h('tbody');
    rows.forEach((r) => {
      const vals = Array.isArray(r) ? r : columns.map((c) => r[c]);
      tb.appendChild(h('tr', null, vals.map((v) => h('td', { class: v === null || v === undefined ? 'null' : typeof v === 'number' ? 'num' : '' }, v === null || v === undefined ? 'NULL' : String(v)))));
    });
    if (!rows.length) tb.appendChild(h('tr', null, h('td', { colspan: columns.length, class: 'tg-empty' }, '(0 แถว)')));
    t.appendChild(tb);
    return h('div', { class: 'tg-wrap' }, t);
  }

  FR.sql = { ready, open, dv, sv };
  FR.TableGrid = { create: TableGrid };
  FR.SqlLog = { create: SqlLog };
  FR.ResultTable = ResultTable;
})();
