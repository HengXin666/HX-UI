#!/usr/bin/env bash
# 从 open-vetta 同步组件源码。
#
# 为什么是拷源码而不是 npm install:
#   上游 packages/ui 与 theme-ui 都**不发布** (package.json 的 main 直接指 ./src/index.ts),
#   npm 上没有对应制品。观感 (那一串串类名) 只存在于源码里, 所以只能拷。
#
# 拷的时候**只改包名引用**, 视觉类名一个字不动 —— 那是这套观感的全部来源。
#
# 用法: ./scripts/sync-upstream.sh [上游路径]
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HERE"

SRC="${1:-}"
if [ -z "$SRC" ]; then
  SRC="../../ref/open-vetta"
fi
SRC="$(cd "$SRC" && pwd)"
echo "上游: $SRC"

UI="$SRC/packages/ui/src"
TUI="$SRC/packages/theme-ui/src"

# 保留手写件: 这几支不在上游, 清目录前先挪出来
mkdir -p /tmp/hx-ui-keep
for f in src/layout/Card.tsx src/layout/Badge.tsx; do
  [ -f "$f" ] && cp "$f" /tmp/hx-ui-keep/
done

rm -rf src
mkdir -p src/{primitives,layout,feedback}

cp /tmp/hx-ui-keep/*.tsx src/layout/ 2>/dev/null || true
cp "$SRC/LICENSE" LICENSE 2>/dev/null || true
[ -f "$SRC/NOTICE" ] && cp "$SRC/NOTICE" NOTICE || true
git -C "$SRC" rev-parse HEAD > UPSTREAM_COMMIT 2>/dev/null || echo unknown > UPSTREAM_COMMIT

# ── 基础件 (原 packages/ui) ──
for f in button input switch select dialog popover dropdown-menu drawer slider spin calendar date-picker utils; do
  ext="tsx"; [ -f "$UI/$f.ts" ] && ext="ts"
  [ -f "$UI/$f.tsx" ] || [ -f "$UI/$f.ts" ] || continue
  sed -e 's|from "@vetta-org/ui"|from "../primitives/utils"|' \
      -e 's|from "\./utils"|from "./utils"|' \
      "$UI/$f.$ext" > "src/primitives/$f.$ext"
done

# ── 版式件 (原 theme-ui, 决定"长什么样"的那几个) ──
# SettingRow / SettingSection: 设置页"一张卡里一行一个设置项"的版式, 少它就是另一种产品
cp "$TUI/settings/SettingChrome.tsx" src/layout/SettingChrome.tsx
sed -e 's|from "@vetta-org/ui"|from "../primitives/utils"|' \
    "$TUI/settings/SettingsFormFields.tsx" > src/layout/SettingsFormFields.tsx
sed -e 's|from "@vetta-org/ui"|from "../primitives/utils"|' \
    "$TUI/settings/MotionSelect.tsx" > src/layout/MotionSelect.tsx
sed -e 's|from "@vetta-org/ui"|from "../primitives/utils"|' \
    "$TUI/shared/SegmentedControl.tsx" > src/layout/SegmentedControl.tsx
sed -e 's|from "@vetta-org/ui"|from "../primitives/utils"|' \
    "$TUI/shared/CollapsePanel.tsx" > src/layout/CollapsePanel.tsx
cp "$TUI/layout/AppFrame.tsx" src/layout/AppFrame.tsx 2>/dev/null || true
# 设置页二级导航 (左侧那一栏): 决定"主侧栏 | 设置栏 | 内容区"三级布局的第二级
cp "$TUI/settings/SettingsSidebarView.tsx" src/layout/SettingsSidebarView.tsx

# 统一把内部 @vetta-org/ui 引用改成相对路径
find src -name '*.tsx' -o -name '*.ts' | while read -r f; do
  depth=$(echo "${f#src/}" | tr -cd '/' | wc -c)
  case "$f" in
    src/primitives/*) repl="../primitives/utils";;
    src/layout/*)     repl="../primitives/utils";;
    src/feedback/*)   repl="../primitives/utils";;
    *)                repl="./primitives/utils";;
  esac
  perl -i -pe "s{from \"@vetta-org/ui\"}{from \"$repl\"}g" "$f"
done

echo "拷入文件:"
find src -type f | sort | sed 's/^/  /'
