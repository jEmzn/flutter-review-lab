#!/usr/bin/env bash
# Usage: tools/shot.sh <route> <out.png> [width] [height]
#        tools/shot.sh --dom <route>           (prints #__errors content + page title)
# Renders the site in headless Chrome from file:// (same as double-clicking index.html).
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME=${CHROME:-google-chrome}
if [[ "${1:-}" == "--dom" ]]; then
  route="$2"
  timeout 60 "$CHROME" --headless=new --disable-gpu --no-sandbox --virtual-time-budget=8000 \
    --dump-dom "file://$PWD/index.html#/$route" 2>/dev/null |
    python3 -c '
import sys,re,html
s=sys.stdin.read()
e=re.search(r"<div id=\"__errors\"[^>]*>(.*?)</div>",s,re.S)
t=re.search(r"<title>(.*?)</title>",s,re.S)
err=html.unescape(e.group(1)).strip() if e else ""
bad=re.findall(r"class=\"badref\"[^>]*title=\"([^\"]+)\"",s)
miss=re.findall(r"ยังไม่มีภาพ: ([\w.\-]+)",s)
print(("ERR " if err or bad or miss else "ok  ")+(t.group(1) if t else "?")+(" | "+err if err else "")+(" | badref:"+",".join(bad) if bad else "")+(" | missing viz:"+",".join(miss) if miss else ""))
'
  exit 0
fi
route="$1"; out="$2"; w="${3:-1280}"; hgt="${4:-2000}"
timeout 60 "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --virtual-time-budget=8000 \
  --window-size="$w,$hgt" --screenshot="$out" "file://$PWD/index.html#/$route" 2>/dev/null >/dev/null
echo "$out"
