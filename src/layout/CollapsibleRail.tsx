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
 * ## 悬停自动展开: 窄态不是"死的"
 * 只留图标的窄栏若不能临时变宽, 用户每看一次内容都要点两次 (展开 -> 收起),
 * 而"看一眼就走"是这种栏最常见的使用方式. 指针进入时自动展开, 离开后收回,
 * 把这次点击省掉。
 *
 * 两个细节: ① `hoverExpand` 默认**关闭**, 自动展开会改变布局宽度, 对某些
 * 页面是干扰 (比如窄栏旁边就是画布)。要它的调用方显式打开。② 收起状态下悬停
 * 展开**不写回**折叠状态, 那只是临时预览, 用户并没有改变自己的选择.
 */

/** 收起动画走完后才切窄态渲染的延时 (ms)。 */
const SETTLE_MS = 150;


export interface CollapsibleRailProps {
  /** 是否收起. 受控, 折叠状态属于使用方 (可能还要落 localStorage). */
  readonly collapsed: boolean;
  /** 切换按钮的回调。传了才渲染折叠按钮。 */
  readonly onToggle?: () => void;
  /** 展开态宽度 (px)。 */
  readonly width?: number;
  /** 收起态宽度 (px)。 */
  readonly railWidth?: number;
  /** 折叠按钮的无障碍标签。 */
  readonly toggleLabel?: string;
  /**
   * 收起状态下, 指针进入时临时展开. 默认关闭.
   *
   * 开启后`wide` 会在悬停时变真, 调用方无需感知, 它只按 `wide` 渲染.
   */
  readonly hoverExpand?: boolean;
  readonly className?: string;
  /** 收到 `wide` 的渲染函数. `wide` 为假时调用方应只渲染图标. */
  readonly children: (wide: boolean) => ReactNode;
}

/**
 * 可收起的侧栏容器: 宽态给文字, 窄态只给图标, 悬停可临时展开.
 *
 * .agents/notes/implemented/feature/2026-10-12-collapsible-rail.md
 */
export function CollapsibleRail({
  collapsed,
  onToggle,
  width = 208,
  railWidth = 48,
  toggleLabel = "收起/展开侧栏",
  hoverExpand = false,
  className,
  children,
}: CollapsibleRailProps): ReactNode {
  /** 动画是否已经走完. 收起瞬间仍按宽态渲染. */
  const [settled, setSettled] = useState(collapsed);
  /** 指针是否停在栏内 (仅在 hoverExpand 开启时有意义). */
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!collapsed) {
      setSettled(false);
      return;
    }
    const t = window.setTimeout(() => setSettled(true), SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [collapsed]);

  // 悬停时**立即**当宽态, 不等 settle: 用户已经在看了, 再等 150ms 是纯延迟.
  const expanded = !collapsed || (hoverExpand && hovered);
  const wide = expanded || !settled;

  return (
    <aside
      data-collapsed={collapsed}
      data-wide={wide}
      data-hovered={hoverExpand && hovered}
      onPointerEnter={hoverExpand ? () => setHovered(true) : undefined}
      onPointerLeave={hoverExpand ? () => setHovered(false) : undefined}
      style={{ width: expanded ? width : railWidth }}
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
