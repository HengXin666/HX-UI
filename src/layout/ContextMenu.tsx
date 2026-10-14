"use client";

import * as React from "react";
import { ContextMenu as ContextMenuPrimitive } from "radix-ui";
import { cn } from "../primitives/utils";

/**
 * 右键菜单 —— 行级动作的入口。
 *
 * ## 为什么右键与"行尾按钮"并存, 而不是二选一
 * 行尾按钮解决"我知道有这个动作, 我要点它"; 右键解决"我在这一行上, 我想对它做点什么"。
 * 两者服务的心智不同: 前者是**发现**(看见才知道有), 后者是**意图**(先有意图再找入口)。
 * 树的行很窄, 把每个动作都摆成按钮会把标签挤没; 但只留右键又会让新用户找不到。
 * 所以常用动作留按钮, 全部动作进右键。
 *
 * ## 为什么菜单项要支持 `disabled` + `destructive` 两个语义位
 * 它们不是样式开关, 是**能力声明**: `disabled` 表示"这个动作此刻不适用"
 * (比如目标还没准备好), `destructive` 表示"做了不好撤销"。调用方声明意图,
 * 视觉由组件统一决定, 否则每个页面都会自己调一遍红色.
 */

const CONTENT_CLASS =
  "z-50 min-w-[11rem] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md outline-hidden duration-instant data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95";

export interface MenuAction {
  /** 稳定标识。同时用作 React key 与测试选择器。 */
  readonly id: string;
  readonly label: string;
  /** 菜单项左侧图标。 */
  readonly icon?: React.ReactNode;
  /** 此刻是否可用。默认可用。 */
  readonly disabled?: boolean;
  /** 危险动作 (删除/归档这类不好撤销的)。 */
  readonly destructive?: boolean;
  /** 右侧快捷键提示 (纯展示, 组件不绑键)。 */
  readonly shortcut?: string;
  readonly onSelect: () => void;
}

export interface ContextMenuProps {
  /** 触发区域。整个子树都可以右键。 */
  readonly children: React.ReactNode;
  readonly actions: readonly MenuAction[];
  /** 菜单标题 (显示在顶部, 通常是"你正在操作谁")。 */
  readonly heading?: string;
}

/**
 * 右键菜单: 动作与标题由调用方声明, 外观由组件统一.
 *
 * .agents/notes/implemented/feature/2026-10-12-tree-context-menu.md
 */
export function ContextMenu({ children, actions, heading }: ContextMenuProps): React.ReactElement {
  return (
    <ContextMenuPrimitive.Root>
      <ContextMenuPrimitive.Trigger asChild>{children}</ContextMenuPrimitive.Trigger>
      <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content data-slot="context-menu" className={CONTENT_CLASS}>
          {heading !== undefined && (
            <ContextMenuPrimitive.Label className="px-2 py-1.5 text-[length:var(--fs-2xs)] text-muted-foreground">
              {heading}
            </ContextMenuPrimitive.Label>
          )}
          {actions.map((a) => (
            <ContextMenuPrimitive.Item
              key={a.id}
              disabled={a.disabled === true}
              onSelect={a.onSelect}
              data-testid={`menu-${a.id}`}
              className={cn(
                "flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-1.5 text-xs outline-hidden",
                "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
                "data-disabled:pointer-events-none data-disabled:opacity-50",
                a.destructive === true && "text-destructive data-highlighted:bg-destructive/10",
              )}
            >
              {a.icon !== undefined && (
                <span aria-hidden="true" className="flex size-3.5 shrink-0 items-center justify-center">
                  {a.icon}
                </span>
              )}
              <span className="flex-1 truncate">{a.label}</span>
              {a.shortcut !== undefined && (
                <span className="shrink-0 font-mono text-[length:var(--fs-2xs)] text-muted-foreground">
                  {a.shortcut}
                </span>
              )}
            </ContextMenuPrimitive.Item>
          ))}
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  );
}
