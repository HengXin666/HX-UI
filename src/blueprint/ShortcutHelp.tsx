"use client";

import type { JSX } from "react";
import { SHORTCUTS, type ShortcutDef } from "./shortcuts";

/**
 * 快捷键一览面板。
 *
 * ## 为什么要有它
 *
 * 快捷键做了二十来个, 但用户**不知道**就等于没做  这是这类功能最常见的
 * 失败方式: 代码全对, 没人用得上。所以面板不是"锦上添花", 是交付的一部分。
 *
 * ## 为什么照 SHORTCUTS 渲染而不是手写一遍
 *
 * 手写的帮助文档与真实键位必然漂移: 改了键位忘了改文档, 于是文档说 Ctrl+W、
 * 实际是 Ctrl+D (UE5 就改过这个)。照同一份表渲染, 文档与实现不可能不一致。
 *
 * ## 为什么标 official
 *
 * 有 Epic 官方依据的与"社区沿用/本库自定义"的**必须区分开**。混在一起会让
 * 用户以为全部是 UE5 原生的, 换个环境发现对不上就会怀疑整个实现。
 */

const GROUPS: readonly ShortcutDef["group"][] = ["编辑", "选择", "视图", "节点"];

export function ShortcutHelp({ onClose }: { readonly onClose?: () => void }): JSX.Element {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[12px] font-medium text-foreground">快捷键</span>
        <span className="text-[11px] text-muted-foreground">
          有 ● 标记的是 UE5 官方键位, 其余为社区沿用或本库补充
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            收起
          </button>
        )}
      </div>

      <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">
        {GROUPS.map((g) => (
          <div key={g}>
            <div className="mb-1 text-[11px] font-medium text-muted-foreground">{g}</div>
            <ul className="space-y-0.5">
              {SHORTCUTS.filter((s) => s.group === g).map((s) => (
                <li key={s.id} className="flex items-baseline gap-1.5 text-[11px]">
                  <code className="shrink-0 rounded bg-muted/60 px-1 py-px font-mono text-[10px] text-foreground">
                    {s.keys}
                  </code>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{s.label}</span>
                  {s.official && (
                    <span className="shrink-0 text-[9px] text-muted-foreground" title="UE5 官方键位">
                      ●
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
