"use client";

import { useEffect, useRef, useState, type JSX, type KeyboardEvent } from "react";
import { cn } from "../primitives/utils";

/**
 * 行内重命名。只读时是一段文字, 双击就地变成输入框。
 *
 * ## 最小可用示例
 *
 * ```tsx
 * import { InlineRename } from "@hx/ui";
 *
 * <InlineRename
 * value={name}
 * onSubmit={(next) => rename(id, next)}   // 空串也会送到这里, 语义由调用方决定
 * onCancel={() => setRenaming(null)}
 * maxLength={80}
 * />
 * ```
 *
 * ## 为什么只读态是一个按钮而不是一段文本
 *
 * 纯文本节点不可聚焦, 于是"改名"这个动作只能靠鼠标双击完成  键盘与读屏用户
 * 永远够不到它。用一个无边框的按钮承载文本, 点击、聚焦、Enter 三条通路一次就
 * 都有了, 视觉上与纯文本无异。
 *
 * ## 提交与取消的优先级
 *
 * 键盘上 Esc 之后通常还会来一次 blur (用户按完就走)。若两条路径都提交, 取消
 * 会**被随后的失焦翻盘**, 用户看到的是"按了 Esc 但还是改了"。因此这里用一个
 * 一次性标记记住"本次编辑已被取消", blur 看到它就直接放弃。
 */

export interface InlineRenameProps {
  /** 当前值。它变化时不会打断正在进行的编辑, 只影响下一次进入编辑的初值。 */
  readonly value: string;
  /** 提交。空串同样会送达, 由调用方决定"清空"还是"拒绝"。 */
  readonly onSubmit: (next: string) => void;
  /** 取消时触发 (Esc)。不传则只是还原显示。 */
  readonly onCancel?: () => void;
  /** 长度上限, 超出部分在提交前截断。 */
  readonly maxLength?: number;
  /** 值为空时的占位文本, 同时用作输入框的无障碍名称。 */
  readonly placeholder?: string;
  readonly className?: string;
}

export function InlineRename({
  value,
  onSubmit,
  onCancel,
  maxLength = 120,
  placeholder,
  className,
}: InlineRenameProps): JSX.Element {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  /** 本次编辑是否已被取消。一次性: blur 消费掉之后立刻复位。 */
  const cancelled = useRef(false);

  useEffect(() => {
    if (!editing) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    // 进入编辑即全选: 改名绝大多数是整体替换, 再要求用户按一次全选是多余动作。
    input.select();
  }, [editing]);

  const begin = () => {
    cancelled.current = false;
    setDraft(value);
    setEditing(true);
  };

  const commit = () => {
    if (!editing) return;
    setEditing(false);
    // 截断放在这里而不是只靠 input 的 maxLength: 后者拦不住程序化赋值与部分输入法路径。
    onSubmit(draft.slice(0, maxLength));
  };

  const cancel = () => {
    cancelled.current = true;
    setEditing(false);
    setDraft(value);
    onCancel?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
      return;
    }
    /* 编辑态里的按键属于输入, 不能让外层的快捷键 (删除 / 移动 / 切换) 抢走。 */
    event.stopPropagation();
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-label={placeholder ?? value}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (cancelled.current) {
            cancelled.current = false;
            return;
          }
          commit();
        }}
        className={cn(
          "min-w-0 flex-1 rounded-sm bg-transparent px-1 py-0.5 text-[13px] text-foreground outline-none ring-1 ring-ring",
          className,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onDoubleClick={begin}
      onKeyDown={(event) => {
        /* Enter / F2 是桌面端"改名"的通用键位; 单次点击保持选中语义, 不改名。 */
        if (event.key === "Enter" || event.key === "F2") {
          event.preventDefault();
          begin();
        }
      }}
      title={value || placeholder}
      className={cn(
        "min-w-0 max-w-full truncate rounded-sm px-1 py-0.5 text-left text-[13px] text-foreground hover:bg-accent/50",
        !value && "text-muted-foreground",
        className,
      )}
    >
      {value || placeholder}
    </button>
  );
}
