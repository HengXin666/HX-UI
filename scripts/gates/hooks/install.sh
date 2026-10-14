#!/usr/bin/env bash
# 安装本地 git 钩子  把 scripts/gates/hooks/* 链到 .git/hooks/。
#
# 为什么不直接把钩子提交进 .git/hooks: 那个目录不在版本控制里, 抄一份进去
# 就没有 diff、没有 review、也不会随仓库更新。所以真身在 scripts/gates/hooks/,
# 这里只做符号链接; 门禁本身的定义在 scripts/gates/registry.mjs (唯一真源)。
#
# 用法: bash scripts/gates/hooks/install.sh [--dry-run]
set -uo pipefail

dry=0
[ "${1:-}" = "--dry-run" ] && dry=1

root="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "install.sh: 不在 git 仓库里" >&2
  exit 1
}
hooks_dir="$root/.git/hooks"
mkdir -p "$hooks_dir"

for h in "$root"/scripts/gates/hooks/*; do
  name="$(basename "$h")"
  case "$name" in
    install.sh | *.md) continue ;;
  esac
  [ -f "$h" ] || continue

  target="$hooks_dir/$name"
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    # 已有实体文件 (别人手写的钩子): 不覆盖, 打印出来让人自己合
    echo "跳过 $name: .git/hooks/$name 已存在且不是符号链接  请手工合并, 不要盲目覆盖"
    continue
  fi
  if [ "$dry" = "1" ]; then
    echo "会做: ln -sf $h $target"
    continue
  fi
  chmod +x "$h"
  ln -sfn "$h" "$target"
  echo "已链接 $name -> scripts/gates/hooks/$name"
done

if [ "$dry" = "0" ]; then
  echo ""
  echo "验证: git commit 时会自动跑 node scripts/gates/run.mjs --staged"
  echo "跳过:  git commit --no-verify  (CI 仍会跑同一套)"
fi
