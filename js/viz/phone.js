/* Phone frame + tiny Material-like UI kit for simulations. */
(function () {
  'use strict';
  const { h, clear, sleep } = FR.util;

  function create(opts = {}) {
    const status = h('div', { class: 'ph-status' }, h('span', null, '9:41'), h('span', null, '▲ ◼ ▮'));
    const barTitle = h('div', { class: 'ph-title' }, opts.title || '');
    const barLead = h('div', { class: 'ph-lead' });
    const barActs = h('div', { class: 'ph-acts' });
    const appBar = h('div', { class: 'ph-appbar' }, barLead, barTitle, barActs);
    const body = h('div', { class: 'ph-body' });
    const fabSlot = h('div', { class: 'ph-fab-slot' });
    const overlay = h('div', { class: 'ph-overlay' });
    const snackSlot = h('div', { class: 'ph-snack-slot' });
    const kb = h('div', { class: 'ph-kb', 'aria-hidden': 'true' }, h('div', { class: 'kb-rows' },
      ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].map((r) => h('div', { class: 'kb-row' }, r.split('').map((c) => h('span', null, c)))),
      h('div', { class: 'kb-row' }, h('span', { class: 'w' }, '123'), h('span', { class: 'sp' }, ' '), h('span', { class: 'w kb-action' }, 'done'))));
    const screen = h('div', { class: 'ph-screen' }, status, appBar, body, fabSlot, snackSlot, kb, overlay);
    const el = h('div', { class: 'phone' + (opts.small ? ' small' : '') + (opts.platform === 'ios' ? ' ios' : '') }, screen);
    if (opts.height) screen.style.height = opts.height + 'px';
    if (opts.width) el.style.width = opts.width + 'px';
    if (opts.noAppBar) appBar.hidden = true;

    const api = {
      el, body, screen, appBar,
      setTitle(t) { barTitle.textContent = t; },
      setBack(onBack) {
        clear(barLead);
        if (onBack) barLead.appendChild(h('button', { type: 'button', class: 'ph-icon', 'aria-label': 'ย้อนกลับ', onclick: onBack }, '←'));
      },
      setActions(nodes) { clear(barActs); (nodes || []).forEach((n) => barActs.appendChild(n)); },
      setBody(node) { clear(body); if (node) body.appendChild(node); body.scrollTop = 0; },
      setFab(label, onClick) { clear(fabSlot); if (label) fabSlot.appendChild(h('button', { type: 'button', class: 'ph-fab', onclick: onClick, 'aria-label': typeof label === 'string' ? label : 'FAB' }, label)); },
      snack(text, ms = 2200) {
        clear(snackSlot);
        const s = h('div', { class: 'ph-snack' }, text);
        snackSlot.appendChild(s);
        setTimeout(() => s.remove(), ms);
      },
      keyboard(show) { screen.classList.toggle('kb-on', !!show); },
      get keyboardOn() { return screen.classList.contains('kb-on'); },
      dialog({ title, body: b, actions }) {
        return new Promise((resolve) => {
          clear(overlay);
          const close = (v) => { clear(overlay); overlay.classList.remove('on'); resolve(v); };
          const dlg = h('div', { class: 'ph-dialog', role: 'dialog' },
            title ? h('div', { class: 'ph-dtitle' }, title) : null,
            b ? h('div', { class: 'ph-dbody' }, b) : null,
            h('div', { class: 'ph-dacts' }, (actions || [{ label: 'OK', value: true }]).map((a) => h('button', { type: 'button', class: 'ph-tbtn', onclick: () => close(a.value) }, a.label))));
          overlay.appendChild(dlg);
          overlay.classList.add('on');
          overlay.onclick = (e) => { if (e.target === overlay) close(null); };
        });
      },
      closeDialog() { clear(overlay); overlay.classList.remove('on'); },
      setDark(on) { screen.classList.toggle('blank', !!on); },
    };
    return api;
  }

  // ---------- UI kit ----------
  const ui = {
    text(s, cls) { return h('div', { class: 'u-text ' + (cls || '') }, s); },
    title(s) { return h('div', { class: 'u-text u-title' }, s); },
    btn(label, onClick, variant = 'filled') { return h('button', { type: 'button', class: 'u-btn u-' + variant, onclick: onClick }, label); },
    col(...c) { return h('div', { class: 'u-col' }, c); },
    row(...c) { return h('div', { class: 'u-row' }, c); },
    pad(...c) { return h('div', { class: 'u-pad' }, c); },
    spinner() { return h('div', { class: 'u-spin', role: 'progressbar', 'aria-label': 'กำลังโหลด' }); },
    linear() { return h('div', { class: 'u-linear' }, h('i')); },
    divider() { return h('div', { class: 'u-div' }); },
    center(...c) { return h('div', { class: 'u-center' }, c); },
    chip(s, cls) { return h('span', { class: 'u-chip ' + (cls || '') }, s); },
    skeleton(lines = 4) { return h('div', { class: 'u-skel' }, Array.from({ length: lines }, () => h('div', { class: 'u-skel-row' }, h('i', { class: 'a' }), h('div', null, h('i', { class: 'b' }), h('i', { class: 'c' }))))); },
    listTile({ leading, title, subtitle, trailing, onClick, cls }) {
      return h(onClick ? 'button' : 'div', { type: onClick ? 'button' : null, class: 'u-tile ' + (cls || ''), onclick: onClick },
        leading != null ? h('span', { class: 'u-lead' }, leading) : null,
        h('span', { class: 'u-tt' }, h('span', { class: 'u-t1' }, title), subtitle ? h('span', { class: 'u-t2' }, subtitle) : null),
        trailing != null ? h('span', { class: 'u-trail' }, trailing) : null);
    },
    /** M3-ish outlined text field. opts: {label, hint, helper, value, error, prefix, suffix, obscure, type, oninput, onblur, onfocus, maxLength, readonly} */
    field(o = {}) {
      const input = h('input', { class: 'u-input', type: o.obscure ? 'password' : (o.type || 'text'), placeholder: o.hint || ' ', value: o.value || '', 'aria-label': o.label || o.hint || 'field', inputmode: o.inputmode, readonly: o.readonly });
      if (o.maxLength) input.maxLength = o.maxLength;
      const lbl = o.label ? h('label', { class: 'u-flabel' }, o.label) : null;
      const prefix = o.prefix ? h('span', { class: 'u-prefix' }, o.prefix) : null;
      const suffix = o.suffix ? h('span', { class: 'u-suffix' }, o.suffix) : null;
      const box = h('div', { class: 'u-fbox' + (o.filled ? ' filled' : '') }, prefix, h('div', { class: 'u-fin' }, lbl, input), suffix);
      const helper = h('div', { class: 'u-help' }, o.helper || '');
      const wrap = h('div', { class: 'u-field' + (o.label ? ' has-label' : '') }, o.icon ? h('span', { class: 'u-ficon' }, o.icon) : null, h('div', { class: 'u-fcol' }, box, helper));
      const sync = () => wrap.classList.toggle('has-value', !!input.value);
      input.addEventListener('input', (e) => { sync(); o.oninput && o.oninput(input.value, e); });
      input.addEventListener('focus', () => { wrap.classList.add('focus'); o.onfocus && o.onfocus(); });
      input.addEventListener('blur', () => { wrap.classList.remove('focus'); o.onblur && o.onblur(input.value); });
      sync();
      const api = {
        el: wrap, input,
        get value() { return input.value; },
        setValue(v, silent) { input.value = v; sync(); if (!silent) o.onprog && o.onprog(v); },
        setError(msg) { wrap.classList.toggle('err', !!msg); helper.textContent = msg || o.helper || ''; },
        setHelper(t) { o.helper = t; if (!wrap.classList.contains('err')) helper.textContent = t || ''; },
        setLabel(t) { if (lbl) lbl.textContent = t; },
        focus() { input.focus(); },
      };
      if (o.error) api.setError(o.error);
      return api;
    },
    checkbox(label, value, onChange) {
      const i = h('input', { type: 'checkbox' });
      i.checked = !!value;
      i.addEventListener('change', () => onChange && onChange(i.checked));
      return h('label', { class: 'u-check' }, i, h('span', null, label));
    },
    switch(label, value, onChange) {
      const b = h('button', { type: 'button', class: 'u-switch' + (value ? ' on' : ''), role: 'switch', 'aria-checked': String(!!value) }, h('i'));
      b.addEventListener('click', () => { value = !value; b.classList.toggle('on', value); b.setAttribute('aria-checked', String(value)); onChange && onChange(value); });
      return h('label', { class: 'u-swrow' }, h('span', null, label), b);
    },
    slider(value, onChange, { min = 0, max = 100, step = 1 } = {}) {
      const r = h('input', { type: 'range', min, max, step, value, class: 'u-slider' });
      r.addEventListener('input', () => onChange && onChange(+r.value));
      return r;
    },
  };

  FR.Phone = { create };
  FR.ui = ui;
})();
