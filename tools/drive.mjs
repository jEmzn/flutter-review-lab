#!/usr/bin/env node
// QA driver: runs headless Chrome via the DevTools Protocol, executes a script of steps against the site, takes screenshots.
// Usage: node tools/drive.mjs <route> <out-prefix> '<json steps>'
//   steps: [{"click":"button text"}, {"clickSel":"css"}, {"type":["css","text"]}, {"wait":ms}, {"eval":"js"}, {"shot":"name"}, {"scroll":"css"}]
// Requires Node >= 22 (global WebSocket).
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [route = '', prefix = '/tmp/shot', stepsJson = '[]', width = '1280', height = '1600'] = process.argv.slice(2);
const steps = JSON.parse(stepsJson);
const port = 9300 + Math.floor(Math.random() * 500);
const userDir = mkdtempSync(join(tmpdir(), 'frdrive-'));
const chrome = spawn(process.env.CHROME || 'google-chrome', ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`, `--window-size=${width},${height}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWs() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json`); const j = await r.json(); const p = j.find((t) => t.type === 'page'); if (p) return p.webSocketDebuggerUrl; } catch (e) {}
    await sleep(150);
  }
  throw new Error('chrome not ready');
}
let id = 0; const pending = new Map();
const ws = new WebSocket(await getWs());
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result && r.result.exceptionDetails) return 'EXC: ' + JSON.stringify(r.result.exceptionDetails.exception && r.result.exceptionDetails.exception.description); return r.result && r.result.result && r.result.result.value; };

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +width, height: +height, deviceScaleFactor: 1, mobile: +width < 600 });
await send('Page.navigate', { url: `file://${root}/index.html#/${route}` });
await sleep(1200);
const log = [];
for (const s of steps) {
  if (s.wait) await sleep(s.wait);
  if (s.click) log.push('click ' + s.click + ': ' + await evaluate(`(()=>{const t=${JSON.stringify(s.click)};const els=[...document.querySelectorAll('button,a,.qopt,[role=button]')].filter(e=>e.offsetParent!==null&&e.textContent.trim().includes(t));const n=${s.nth || 0};if(!els[n])return 'NOT FOUND';els[n].scrollIntoView({block:'center'});els[n].click();return 'ok'})()`));
  if (s.clickSel) log.push('clickSel ' + s.clickSel + ': ' + await evaluate(`(()=>{const e=document.querySelectorAll(${JSON.stringify(s.clickSel)})[${s.nth || 0}];if(!e)return 'NOT FOUND';e.scrollIntoView({block:'center'});e.click();return 'ok'})()`));
  if (s.type) log.push('type: ' + await evaluate(`(()=>{const e=document.querySelectorAll(${JSON.stringify(s.type[0])})[${s.nth || 0}];if(!e)return 'NOT FOUND';e.focus();e.value=${JSON.stringify(s.type[1])};e.dispatchEvent(new Event('input',{bubbles:true}));return 'ok'})()`));
  if (s.focus) log.push('focus: ' + await evaluate(`(()=>{const e=document.querySelectorAll(${JSON.stringify(s.focus)})[${s.nth || 0}];if(!e)return 'NOT FOUND';e.focus();e.dispatchEvent(new Event('focus'));return 'ok'})()`));
  if (s.scroll) await evaluate(`(()=>{const e=document.querySelectorAll(${JSON.stringify(s.scroll)})[${s.nth || 0}];if(e)e.scrollIntoView({block:'start'});window.scrollBy(0,-60)})()`);
  if (s.eval) log.push('eval: ' + JSON.stringify(await evaluate(s.eval)));
  if (s.shot) {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    const f = `${prefix}-${s.shot}.png`; writeFileSync(f, Buffer.from(r.result.data, 'base64')); log.push('shot ' + f);
  }
}
const errs = await evaluate(`(document.getElementById('__errors')||{}).textContent||''`);
console.log(log.join('\n'));
console.log('ERRORS:', errs || '(none)');
ws.close(); chrome.kill('SIGKILL');
process.exit(0);
