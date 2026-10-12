import { type ReactNode, useEffect, useState } from "react";
import { cn } from "../primitives/utils";

/**
 * 可收起的侧栏容器 —— 宽态给文字, 窄态只给图标。
 *
 * ## 为什么"窄态"要延时切换, 而不是立刻
 * 收起有过渡动画。若在动画开始的同一帧就换成窄态渲染, 标题节点会**瞬间消失**,
 * 而容器宽度还在慢慢收 —— 视觉上文字像是被"抠掉"的。等动画走完再切, 文字是
 * 跟着容器一起被推出去的。
 *
 * 这个延时不是调参: 它是"渲染模式"与"视觉过渡"这两件事的时间对齐。
 * 150ms 与过渡时长同量级, 太短会看到跳变, 太长会让窄态图标迟迟不放大。
 *
 * ## 为什么窄态不渲染标题, 而不是 hidden
 * `hidden` 仍会占布局 (取决于实现) 且留在可访问性树里 —— 屏幕阅读器会在一个
 * 只有图标的栏里念出全部文字。不渲染才是真的"窄态"。
 *
 * (see the [collapsible rail note](../../../.agents/notes/implemented/feature/2026-10-12-collapsible-rail.md)).
 */

/** 收起动画走完后才切窄态渲染的延时 (ms)。 */
const SETTLE_MS = 150;

export interface CollapsibleRailProps {
  /** 是否收起。受控 —— 折叠状态属于使用方 (可能还要落 localStorage)。 */
  readonly collapsed: boolean;
  /** 切换按钮的回调。传了才渲染折叠按钮。 */
  readonly onToggle?: () => void;
  /** 展开态宽度 (px)。 */
  readonly width?: number;
  /** 收起态宽度 (px)。 */
  readonly railWidth?: number;
  /** 折叠按钮的无障碍标签。 */
  readonly toggleLabel?: string;
  readonly className?: string;
  /** 收到 `wide` 的渲染函数。`wide` 为假时调用方应只渲染图标。 */
  readonly children: (wide: boolean) => ReactNode;
}

export function CollapsibleRail({
  collapsed,
  onToggle,
  width = 208,
  railWidth = 48,
  toggleLabel = "收起/展开侧栏",
  className,
  children,
}: CollapsibleRailProps): ReactNode {
  /** 动画是否已经走完。收起瞬间仍按宽态渲染。 */
  const [settled, setSettled] = useState(collapsed);

  useEffect(() => {
    if (!collapsed) {
      setSettled(false);
      return;
    }
    const t = window.setTimeout(() => setSettled(true), SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [collapsed]);

  // 展开中 (!collapsed) 一律宽态; 收起后要等 settled 才转窄态。
  const wide = !collapsed || !settled;

  return (
    <aside
      data-collapsed={collapsed}
      data-wide={wide}
      style={{ width: collapsed ? railWidth : width }}
      className={cn(
        "flex shrink-0 flex-col overflow-hidden border-r border-border/60 bg-card/20",
        "transition-[width] duration-150 ease-out",
        className,
      )}
    >
      {onToggle !== undefined && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={toggleLabel}
          aria-expanded={!collapsed}
          className="mx-1 mt-1 flex h-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/60 hover:text-foreground"
        >
          <span aria-hidden="true" className="text-[length:var(--fs-xs)]">
            {collapsed ? "»" : "«"}
          </span>
        </button>
      )}
      {children(wide)}
    </aside>
  );
}
