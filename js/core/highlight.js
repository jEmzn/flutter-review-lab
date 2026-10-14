/* Tiny syntax highlighter for Dart / SQL / YAML. Returns per-line HTML so CodeView can annotate lines. */
(function () {
  'use strict';
  const { esc } = FR.util;

  const DART_KW = new Set(('abstract as assert async await base break case catch class const continue covariant default deferred do dynamic else enum export extends extension external factory false final finally for Function get hide if implements import in interface is late library mixin new null of on operator part required rethrow return sealed set show static super switch sync this throw true try typedef var void when while with yield').split(' '));
  const DART_BUILTIN_TYPES = new Set(('int double num bool String List Map Set Future Stream Object Iterable Duration DateTime').split(' '));

  const SQL_KW = new Set(('select from where and or not null is in like glob between order by asc desc group having limit offset insert into values update set delete create table if exists primary key autoincrement unique check default foreign references on drop alter add column rename to as join left right inner outer cross union all distinct case when then else end begin commit rollback transaction integer text real blob numeric pragma index count sum avg min max coalesce ifnull replace ignore abort fail conflict collate nocase cascade restrict without rowid strftime date datetime current_timestamp length lower upper substr trim total').split(' '));

  function tokDart(src) {
    const out = [];
    const re = /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|(r?'''[\s\S]*?(?:'''|$))|(r?"""[\s\S]*?(?:"""|$))|(r?'(?:\\.|[^'\\\n])*'?)|(r?"(?:\\.|[^"\\\n])*"?)|(@[A-Za-z_]\w*)|(\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([\s\S])/g;
    let m;
    while ((m = re.exec(src))) {
      const t = m[0];
      if (m[1] || m[2]) out.push(['com', t]);
      else if (m[3] || m[4] || m[5] || m[6]) out.push(['str', t]);
      else if (m[7]) out.push(['ann', t]);
      else if (m[8]) out.push(['num', t]);
      else if (m[9]) {
        if (DART_KW.has(t)) out.push(['kw', t]);
        else if (/^[A-Z]/.test(t) || DART_BUILTIN_TYPES.has(t)) out.push(['type', t]);
        else {
          // function call / declaration: identifier followed by ( or <T>(
          const rest = src.slice(re.lastIndex, re.lastIndex + 40);
          if (/^\s*(\(|<[\w<>, ?]*>\s*\()/.test(rest)) out.push(['fn', t]);
          else out.push(['', t]);
        }
      } else if (m[10]) out.push(['', t]);
      else out.push([/[{}()\[\];,.:=<>?!&|+\-*/%]/.test(t) ? 'punc' : '', t]);
    }
    return out;
  }

  function tokSql(src) {
    const out = [];
    const re = /(--[^\n]*)|('(?:''|[^'])*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w]*)|(\?)|(\s+)|([\s\S])/g;
    let m;
    while ((m = re.exec(src))) {
      const t = m[0];
      if (m[1]) out.push(['com', t]);
      else if (m[2]) out.push(['str', t]);
      else if (m[3]) out.push(['num', t]);
      else if (m[4]) out.push([SQL_KW.has(t.toLowerCase()) ? 'kw' : '', t]);
      else if (m[5]) out.push(['ann', t]);
      else if (m[6]) out.push(['', t]);
      else out.push(['punc', t]);
    }
    return out;
  }

  function tokYaml(src) {
    const out = [];
    for (const line of src.split(/(\n)/)) {
      if (line === '\n') { out.push(['', line]); continue; }
      const c = line.indexOf('#');
      const body = c >= 0 ? line.slice(0, c) : line;
      const com = c >= 0 ? line.slice(c) : '';
      const km = body.match(/^(\s*-?\s*)([\w./-]+)(:)(.*)$/);
      if (km) { out.push(['', km[1]], ['type', km[2]], ['punc', km[3]], ['str', km[4]]); }
      else out.push(['', body]);
      if (com) out.push(['com', com]);
    }
    return out;
  }

  /** returns array of per-line HTML strings */
  function lines(src, lang) {
    src = String(src).replace(/\t/g, '  ');
    let toks;
    if (lang === 'dart') toks = tokDart(src);
    else if (lang === 'sql') toks = tokSql(src);
    else if (lang === 'yaml') toks = tokYaml(src);
    else toks = [['', src]];
    const res = [''];
    for (const [type, text] of toks) {
      const parts = text.split('\n');
      parts.forEach((p, i) => {
        if (i > 0) res.push('');
        if (p) res[res.length - 1] += type ? `<span class="tok-${type}">${esc(p)}</span>` : esc(p);
      });
    }
    return res;
  }
  function inline(src, lang) { return lines(src, lang).join('\n'); }

  FR.highlight = { lines, inline };
})();
