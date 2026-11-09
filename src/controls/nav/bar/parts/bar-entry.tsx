"use client";

import type { CSSProperties, JSX, KeyboardEvent, PointerEvent, ReactNode, Ref } from "react";

/**
 * 横向导航条 (PillTabs, GooTabs) 共用: 条目类型, 链接或按钮的条目壳, 方向键焦点移动.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
export interface BarItem {
  readonly value: string;
  readonly label: ReactNode;
  /** 给了就渲染成链接, 否则是按钮. */
  readonly href?: string;
  readonly disabled?: boolean;
}

export interface BarEntryProps {
  readonly item: BarItem;
  readonly active: boolean;
  readonly entryRef: Ref<HTMLElement>;
  readonly className: string;
  readonly style: CSSProperties;
  readonly onSelect: () => void;
  readonly onPointerEnter?: () => void;
  readonly onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerUp?: () => void;
  readonly children: ReactNode;
}

/** 一个导航条目: 有 href 且未禁用是链接, 否则是按钮; 活动项都标 aria-current=page. */
export function BarEntry({ item, active, entryRef, className, style, onSelect, onPointerEnter, onPointerDown, onPointerUp, children }: BarEntryProps): JSX.Element {
  const shared = {
    "aria-current": active ? ("page" as const) : undefined,
    "data-active": active || undefined,
    className,
    style,
    onPointerEnter,
    onPointerDown,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onPointerLeave: onPointerUp,
  };
  if (item.href && !item.disabled) {
    return (
      <a ref={entryRef as Ref<HTMLAnchorElement>} href={item.href} onClick={onSelect} {...shared}>
        {children}
      </a>
    );
  }
  return (
    <button ref={entryRef as Ref<HTMLButtonElement>} type="button" disabled={item.disabled} onClick={onSelect} {...shared}>
      {children}
    </button>
  );
}

/** 左右方向键与 Home / End 在条目间移焦点, 跳过禁用项. 处理了返回 true. */
export function moveBarFocus(event: KeyboardEvent<HTMLElement>, nodes: ReadonlyArray<HTMLElement | null>, items: readonly BarItem[]): boolean {
  const count = items.length;
  const from = nodes.findIndex((node) => node === document.activeElement);
  const steps: Record<string, [start: number, step: number]> = { ArrowRight: [from, 1], ArrowLeft: [from, -1], Home: [-1, 1], End: [count, -1] };
  const plan = steps[event.key];
  if (!plan || count === 0) return false;
  event.preventDefault();
  const [start, step] = plan;
  for (let k = 1; k <= count; k += 1) {
    const i = (((start + step * k) % count) + count) % count;
    if (!items[i]?.disabled) {
      nodes[i]?.focus();
      return true;
    }
  }
  return true;
}
