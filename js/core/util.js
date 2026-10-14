/* Core utilities — global namespace FR (classic script, works on file://) */
(function () {
  'use strict';
  const FR = (window.FR = window.FR || {});
  FR.content = FR.content || {};
  FR.data = FR.data || {};

  /** Hyperscript: h('div', {class:'x', onclick: fn}, child, [children], 'text') */
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
      children.unshift(attrs);
      attrs = null;
    }
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') {
          for (const sk in v) {
            if (sk.startsWith('--')) el.style.setProperty(sk, String(v[sk]));
            else el.style[sk] = v[sk];
          }
        }
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      }
    }
    append(el, children);
    return el;
  }
  function append(el, children) {
    for (const c of children) {
      if (c == null || c === false) continue;
      if (Array.isArray(c)) append(el, c);
      else if (c instanceof Node) el.appendChild(c);
      else el.appendChild(document.createTextNode(String(c)));
    }
    return el;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function shuffle(arr, seed) {
    const a = arr.slice();
    let s = seed == null ? Math.floor(Math.random() * 1e9) : seed;
    const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  /** briefly add a class (for flash effects); restarts if already present */
  function flash(el, cls = 'flash', ms = 900) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth; // restart animation
    el.classList.add(cls);
    clearTimeout(el['_t_' + cls]);
    el['_t_' + cls] = setTimeout(() => el.classList.remove(cls), ms);
  }
  function debounce(fn, ms) {
    let t;
    return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
  }
  let _uid = 0;
  const uid = (p = 'u') => p + (++_uid);

  /** segmented control: seg(['a','b'], current, onChange, labels?) */
  function seg(options, current, onChange) {
    const wrap = h('div', { class: 'seg', role: 'group' });
    const btns = options.map((o) => {
      const val = typeof o === 'object' ? o.value : o;
      const label = typeof o === 'object' ? o.label : o;
      const b = h('button', { type: 'button', class: val === current ? 'on' : '', 'aria-pressed': String(val === current) }, label);
      b.addEventListener('click', () => {
        btns.forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
        b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
        onChange(val);
      });
      b._val = val;
      return b;
    });
    append(wrap, btns);
    wrap.set = (val) => btns.forEach((b) => { const on = b._val === val; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    return wrap;
  }
  function btn(label, onClick, cls = '') {
    return h('button', { type: 'button', class: 'btn ' + cls, onclick: onClick }, label);
  }
  /** Toggle switch-like button */
  function toggle(label, value, onChange) {
    const b = h('button', { type: 'button', class: 'btn sm' + (value ? ' on' : ''), 'aria-pressed': String(!!value) });
    const render = () => { b.textContent = (value ? '☑ ' : '☐ ') + label; b.classList.toggle('on', !!value); b.setAttribute('aria-pressed', String(!!value)); };
    b.addEventListener('click', () => { value = !value; render(); onChange(value); });
    b.set = (v) => { value = v; render(); };
    render();
    return b;
  }

  FR.util = { h, append, esc, sleep, clear, shuffle, flash, debounce, uid, seg, btn, toggle };
  FR.h = h;
})();
