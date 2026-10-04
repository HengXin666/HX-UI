"use client";

import { useEffect, useRef, useState, type JSX } from "react";

/**
 * 节点标题的就地重命名 (F2)。
 *
 * ## 为什么单独做而不是复用 Input
 *
 * 它要有**一整套编辑器的行为**, 而 Input 一个都不提供:
 *   - 挂载即聚焦并全选 (F2 的语义就是"改这个名字", 不该再点一下)
 *   - 失焦提交 / Enter 提交 / Esc 取消
 *   - 空值不提交 (把名字改没了, 节点会显示成 type, 那不是用户想要的)
 *
 * ## 为什么 Esc 在这里自己处理
 *
 * 重命名时按 Esc 要**取消这次改名**, 不是"清空画布选择"。而全局的 Esc
 * 不知道当前有没有重命名在进行 —— 局部的按键意图必须局部拦, 靠全局去猜
 * 迟早猜错 (这也是为什么全局 escape 必须知道"重命名中"这个状态)。
 */

export function NodeRenameInput({
  value, onCommit, onCancel,
}: {
  readonly value: string;
  readonly onCommit: (next: string) => void;
  readonly onCancel: () => void;
}): JSX.Element {
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // 挂载即聚焦全选 —— F2 的语义就是"我要改这个"
    const el = ref.current;
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const commit = () => {
    const next = draft.trim();
    // 空值不提交: 改没了名字, 节点会退化成显示 type, 那不是用户想要的
    if (next && next !== value) onCommit(next);
    else onCancel();
  };

  return (
    <input
      ref={ref}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        // 阻止冒泡: 否则 Delete / Ctrl+D 这类会被全局快捷键接走,
        // 表现是"打字打一半图变了"
        e.stopPropagation();
        if (e.key === "Enter") { e.preventDefault(); commit(); }
        if (e.key === "Escape") { e.preventDefault(); onCancel(); }
      }}
      className="min-w-0 flex-1 select-text rounded border border-primary/60 bg-background px-1 text-[12px] font-semibold text-foreground outline-none"
      aria-label="节点名称"
    />
  );
}
