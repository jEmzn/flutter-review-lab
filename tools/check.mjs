#!/usr/bin/env node
// Static content checks — run: node tools/check.mjs
//  · every [[ref]] resolves · every viz id is registered · code-note / walkthrough / spot anchors exist in their code
//  · quiz shape (mcq: exactly one correct, multi: ≥1, order: ≥2 items, spot: code + bad line present) · duplicate ids
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);

// 1) load data + content scripts in a sandbox (they only need window.FR)
const sandbox = { console };
sandbox.window = sandbox;
sandbox.FR = { content: {}, data: {} };
vm.createContext(sandbox);
for (const s of scripts.filter((s) => s.startsWith('js/content/') || s.startsWith('js/data/'))) {
  vm.runInContext(readFileSync(join(root, s), 'utf8'), sandbox, { filename: s });
}
const FR = sandbox.FR;

// 2) registered viz ids (scan viz sources)
const vizIds = new Set();
for (const s of scripts.filter((s) => s.startsWith('js/viz/') || s.startsWith('js/core/'))) {
  const t = readFileSync(join(root, s), 'utf8');
  for (const m of t.matchAll(/(?:\bR|FR\.viz\.register)\('([\w.-]+)'/g)) vizIds.add(m[1]);
}

// 3) index like js/core/markup.js
const modules = Object.values(FR.content);
const byId = Object.fromEntries(modules.map((m) => [m.id, m]));
const sections = {};
for (const m of modules) (m.sections || []).forEach((s) => { if (!sections[s.id]) sections[s.id] = s; sections[m.id + '/' + s.id] = s; s._key = m.id + '/' + s.id; });
const resolveRef = (r) => byId[r] || sections[r] || /^(exam|review|dev|map|code\/[\w-]+)$/.test(r);

const problems = [];
const P = (where, msg) => problems.push(`${where}: ${msg}`);
const stripCode = (s) => s.replace(/`[^`]*`/g, '');

function scanStrings(v, where, key) {
  if (v == null) return;
  if (typeof v === 'string') {
    if (key === 'src' || key === 'code' || key === 'sql') return;
    for (const m of stripCode(v).matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)) if (!resolveRef(m[1].trim())) P(where, `unresolved ref [[${m[1]}]]`);
    return;
  }
  if (typeof v === 'function') return;
  if (Array.isArray(v)) return v.forEach((x) => scanStrings(x, where, key));
  if (typeof v === 'object') for (const k of Object.keys(v)) { if (k.startsWith('_')) continue; scanStrings(v[k], where, k); }
}

const hasLine = (code, text) => typeof text === 'number' || String(code).split('\n').some((l) => l.includes(text));
function checkQuiz(q, where) {
  const type = q.type || 'mcq';
  if (type === 'mcq' || type === 'multi') {
    const n = (q.options || []).filter((o) => o.ok).length;
    if (type === 'mcq' && n !== 1) P(where, `mcq has ${n} correct options: ${q.q.slice(0, 50)}`);
    if (type === 'multi' && n < 1) P(where, `multi has no correct option`);
    (q.options || []).forEach((o) => { if (!o.ok && !o.why) P(where, `wrong option without why: ${o.t.slice(0, 40)}`); });
  } else if (type === 'order') { if (!q.items || q.items.length < 2) P(where, 'order quiz needs ≥2 items'); }
  else if (type === 'spot') {
    if (!q.code || q.code.startsWith('// ไม่พบ')) P(where, 'spot quiz without code');
    (Array.isArray(q.bad) ? q.bad : [q.bad]).forEach((b) => { if (!hasLine(q.code, b)) P(where, `spot bad line not in code: ${b}`); });
    if (!q.explain) P(where, 'spot quiz without explain');
  } else P(where, 'unknown quiz type ' + type);
}

function walkBlocks(blocks, where) {
  (blocks || []).forEach((b) => {
    if (!b || typeof b !== 'object') return;
    if (b.t === 'viz' && !vizIds.has(b.id)) P(where, `viz not registered: ${b.id}`);
    if (b.t === 'code') (b.notes || []).forEach((n) => { if (!hasLine(b.src, n.at != null ? n.at : n.line)) P(where, `code note anchor not found: ${n.at}`); });
    if (b.t === 'code') (b.hl || []).forEach((x) => { if (!hasLine(b.src, x)) P(where, `code hl not found: ${x}`); });
    if (b.t === 'quiz') b.items.forEach((q) => checkQuiz(q, where + ' (inline quiz)'));
    if (b.t === 'why') (b.alts || []).forEach((a) => { if (a.viz && !(where in vizNames && vizNames[where].has(a.viz.name))) P(where, `why → viz name not on page: ${a.viz.name}`); });
    if (Array.isArray(b.body)) walkBlocks(b.body, where);
    if (b.t === 'two') b.cols.forEach((c) => walkBlocks(c, where));
    if (b.t === 'list') b.items.forEach((it) => Array.isArray(it) && walkBlocks(it, where));
  });
}
// named viz per page (for why-card "ดูผลในภาพ" buttons)
const vizNames = {};
function collectNames(blocks, where) {
  (blocks || []).forEach((b) => {
    if (!b || typeof b !== 'object') return;
    if (b.t === 'viz' && b.name) (vizNames[where] = vizNames[where] || new Set()).add(b.name);
    if (Array.isArray(b.body)) collectNames(b.body, where);
    if (b.t === 'two') b.cols.forEach((c) => collectNames(c, where));
  });
}

let nQuiz = 0, nSec = 0;
const quizIds = new Set();
for (const m of modules) {
  scanStrings(m, m.id);
  const seen = new Set();
  collectNames(m.overview, m.id); collectNames(m.after, m.id); collectNames(m.handsOff && m.handsOff.body, m.id);
  walkBlocks(m.overview, m.id); walkBlocks(m.after, m.id); walkBlocks(m.handsOff && m.handsOff.body, m.id);
  (m.quiz || []).forEach((q) => { checkQuiz(q, m.id + ' (chapter quiz)'); nQuiz++; });
  (m.sections || []).forEach((s, i) => {
    nSec++;
    const where = m.id + '/' + s.id;
    if (seen.has(s.id)) P(m.id, 'duplicate section id ' + s.id);
    seen.add(s.id);
    collectNames(s.blocks, where);
    walkBlocks(s.blocks, where);
    (s.quiz || []).forEach((q, k) => { checkQuiz(q, where); nQuiz++; const id = q.id || `${where}#${k + 1}`; if (quizIds.has(id)) P(where, 'duplicate quiz id ' + id); quizIds.add(id); });
  });
  // walkthrough specs
  const spec = m._spec;
  if (spec) {
    const srcs = FR.data.sources || {};
    spec.files.forEach((f) => {
      if (!srcs[f.key]) return P(m.id, 'missing source ' + f.key);
      (f.notes || []).forEach((n) => { if (!hasLine(srcs[f.key], n.at)) P(m.id, `walk note anchor not found in ${f.key}: ${n.at}`); });
    });
    Object.entries(spec.actions || {}).forEach(([a, v]) => v.steps.forEach((st, i) => {
      const code = srcs[st.file] || '';
      if (!hasLine(code, st.at)) P(m.id, `action ${a}#${i + 1} anchor not found: ${st.at}`);
      if (st.to) { const L = code.split('\n'); const ai = L.findIndex((l) => l.includes(st.at)); if (L.findIndex((l, j) => j >= ai && l.includes(st.to)) < 0) P(m.id, `action ${a}#${i + 1} 'to' not found: ${st.to}`); }
    }));
  }
}
// pages with .page() render custom content; scan their source for refs too (strings inside the file)
for (const f of readdirSync(join(root, 'js/content'))) {
  const t = readFileSync(join(root, 'js/content', f), 'utf8');
  for (const m of stripCode(t).matchAll(/\[\[([^\]|'"]+)(?:\|[^\]]+)?\]\]/g)) if (!resolveRef(m[1].trim())) P('js/content/' + f, `unresolved ref [[${m[1]}]] (raw scan)`);
}

console.log(`modules ${modules.length} · sections ${nSec} · quiz items ${nQuiz} (+inline) · viz registered ${vizIds.size}`);
if (problems.length) { console.log(`\n${problems.length} problem(s):`); problems.forEach((p) => console.log('  ✗ ' + p)); process.exit(1); }
console.log('✓ all checks passed');
