/* Progress store — localStorage with in-memory fallback. Never throws. */
(function () {
  'use strict';
  const KEY = 'flutter-review:v1';
  let mem = { visited: {}, quiz: {}, check: {}, ui: {} };
  let persistent = false;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) mem = Object.assign(mem, JSON.parse(raw));
    persistent = true;
  } catch (e) { persistent = false; }

  const listeners = new Set();
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* ignore */ }
    listeners.forEach((fn) => { try { fn(mem); } catch (e) {} });
  }

  const store = {
    get persistent() { return persistent; },
    data: () => mem,
    visit(key) { if (!mem.visited[key]) { mem.visited[key] = Date.now(); save(); } },
    visited: (key) => !!mem.visited[key],
    quizResult(id, ok) {
      const r = mem.quiz[id] || { n: 0 };
      r.n += 1; r.ok = !!ok; r.t = Date.now();
      if (ok && r.firstOk == null) r.firstOk = r.n === 1;
      mem.quiz[id] = r; save();
    },
    quiz: (id) => mem.quiz[id] || null,
    setCheck(id, v) { if (v) mem.check[id] = true; else delete mem.check[id]; save(); },
    checked: (id) => !!mem.check[id],
    ui(k, v) { if (v === undefined) return mem.ui[k]; mem.ui[k] = v; save(); },
    reset(part) { if (part) mem[part] = {}; else mem = { visited: {}, quiz: {}, check: {}, ui: {} }; save(); },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
  window.FR.store = store;
})();
