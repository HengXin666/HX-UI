"use client";

import { useEffect, useRef, type JSX } from "react";
import { cn } from "../primitives/utils";

/**
 * 画布的右键菜单。
 *
 * ## UE5 的三类右键
 *
 *   右键**空白**  -> 图上下文菜单: 加节点 / 加注释 / 整理 / 全选 / 粘贴
 *   右键**节点**  -> 节点菜单: 复制 / 删除 / 重命名 / 折叠 / 断开此节点的线
 *   右键**连线**  -> 连线菜单: 删除这条线 / 断开
 *
 * 三种内容不同, 但**是一个组件** —— 分成三个会出现"改了一个忘了另一个"。
 *
 * ## 为什么要自己写而不用 UI 库的 Menu
 *
 * 菜单要能在画布坐标处弹出、点外部即关、且**不抢画布的指针捕获**。
 * 库里的 Menu 通常自己管焦点与浮层, 与画布的 pointer 处理会打架
 * (浮层上的元素会被画布的 setPointerCapture 吞掉 click)。
 * 这里做成最小实现: 绝对定位 + 点击外部关闭。
 */

export interface MenuItem {
  readonly id: string;
  readonly label: string;
  /** 分隔线用 "-" 作为 id。 */
  readonly danger?: boolean;
  readonly disabled?: boolean;
  readonly keys?: string;
}

export interface ContextMenuState {
  readonly x: number;
  readonly y: number;
  readonly items: readonly MenuItem[];
}

export function BlueprintContextMenu({
  menu, onPick, onClose,
}: {
  readonly menu: ContextMenuState;
  readonly onPick: (id: string) => void;
  readonly onClose: () => void;
}): JSX.Element | null {
  const ref = useRef<HTMLDivElement | null>(null);

  /** 点外部 / 按 Esc 关闭。 */
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // capture 阶段: 抢在画布的 pointerdown 之前判定, 否则菜单点不动
    window.addEventListener("mousedown", onDown, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("mousedown", onDown, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      data-context-menu="1"
      className="absolute z-[var(--z-panel)] min-w-[132px] overflow-hidden rounded-md border border-border bg-popover py-1 shadow-md"
      style={{ left: menu.x, top: menu.y }}
      // 右键菜单上的右键不该再开一层
      onContextMenu={(e) => e.preventDefault()}
    >
      {menu.items.map((it) =>
        it.id === "-" ? (
          <div key={`sep-${it.label}`} className="my-1 h-px bg-border" />
        ) : (
          <button
            key={it.id}
            type="button"
            disabled={it.disabled}
            onClick={() => { onPick(it.id); onClose(); }}
            className={cn(
              "flex w-full items-center gap-3 px-2.5 py-1 text-left text-[11px] transition-colors",
              it.danger ? "text-destructive" : "text-foreground",
              it.disabled ? "cursor-not-allowed opacity-40" : "hover:bg-accent"
            )}
          >
            <span className="min-w-0 flex-1 truncate">{it.label}</span>
            {it.keys && <span className="shrink-0 text-[10px] text-muted-foreground">{it.keys}</span>}
          </button>
        )
      )}
    </div>
  );
}

/** 节点右键的菜单项。 */
export function nodeMenuItems(o: {
  readonly hasSelection: boolean;
  readonly multi: boolean;
  readonly hasSubgraph: boolean;
}): readonly MenuItem[] {
  return [
    { id: "rename", label: "重命名", keys: "F2" },
    // UE5 里 Ctrl+D 是 Duplicate(原地复制一份), Ctrl+C 是 Copy(进剪贴板)。
    // 两者中文都叫"复制"会让人分不清, 所以分别叫"副本"与"复制"。
    { id: "duplicate", label: "创建副本", keys: "Ctrl+D" },
    { id: "copy", label: "复制", keys: "Ctrl+C" },
    { id: "-", label: "s1" },
    ...(o.hasSubgraph ? [{ id: "enterSubgraph", label: "进入子图" }] : []),
    { id: "disconnectNode", label: "断开此节点的连线" },
    { id: "-", label: "s2" },
    { id: "delete", label: o.multi ? "删除选中" : "删除", keys: "Delete", danger: true },
  ];
}

/** 空白右键的菜单项。 */
export function paneMenuItems(o: { readonly canPaste: boolean }): readonly MenuItem[] {
  return [
    { id: "addComment", label: "在此处加注释框" },
    { id: "paste", label: "粘贴", keys: "Ctrl+V", disabled: !o.canPaste },
    { id: "-", label: "s1" },
    { id: "selectAll", label: "全选", keys: "Ctrl+A" },
    { id: "tidy", label: "整理布局" },
    { id: "fit", label: "缩放到适应", keys: "Home" },
  ];
}

/** 连线右键的菜单项。 */
export function edgeMenuItems(): readonly MenuItem[] {
  return [
    { id: "deleteEdge", label: "删除这条连线", danger: true },
  ];
}
