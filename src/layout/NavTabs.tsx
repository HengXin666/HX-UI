import type { ReactNode } from "react";
import { IconSlot, type IconSource } from "./Icon";
import { cn } from "../primitives/utils";

/**
 * 顶栏式的横向导航 —— 与 `SidebarNav` 是同一件事的两种摆法。
 *
 * ## 为什么需要它 (而不是复用 SidebarNav)
 * 导航项少 (几个) 且很少变时, 占一整列纵向空间是浪费: 那一列本可以留给真正需要
 * 纵向空间的内容 (树、列表、日志)。横向排进顶栏后, 左列整列还回去。
 *
 * 两者共享的只有"一个项 = 图标 + 标签 + 选中态"这个形状; 摆法 (纵/横)、
 * 尺寸策略 (窄态收缩 vs 恒定)、溢出处理都不同, 所以是两个组件而不是一个开关。
 *
 * ## 选中态用 aria-current 而不是自定义 class
 * `aria-current="page"` 是标准, 屏幕阅读器与测试工具都认它。纯视觉的 active
 * class 对辅助技术不可见 —— 选中态是**语义**, 不只是颜色。
 *
 * (see the [collapsible rail note](../../../.agents/notes/implemented/feature/2026-10-12-collapsible-rail.md)).
 */

export interface NavTabItem {
  readonly id: string;
  readonly label: string;
  /** 悬停提示。省略则用 label。 */
  readonly title?: string;
  readonly icon?: IconSource;
  /** 角标 (计数等)。 */
  readonly badge?: ReactNode;
}

export interface NavTabsProps {
  readonly items: readonly NavTabItem[];
  readonly value: string;
  readonly onChange: (id: string) => void;
  readonly className?: string;
}

export function NavTabs({ items, value, onChange, className }: NavTabsProps): ReactNode {
  return (
    <nav
      role="tablist"
      aria-label="主导航"
      className={cn("flex min-w-0 items-center gap-0.5", className)}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            title={item.title ?? item.label}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
              active
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            {item.icon !== undefined && <IconSlot source={item.icon} className="size-4 shrink-0" />}
            <span className="whitespace-nowrap">{item.label}</span>
            {item.badge !== undefined && <span className="shrink-0">{item.badge}</span>}
          </button>
        );
      })}
    </nav>
  );
}
