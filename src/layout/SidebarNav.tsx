import { forwardRef, type ComponentPropsWithoutRef, type JSX, type ReactNode } from "react";
import { cn } from "../primitives/utils";

/**
 * 侧栏导航件。
 *
 * 源码取自 open-vetta `theme-ui/src/sidebar/` 的 `SidebarNavItemButton` 与
 * `SidebarNavIcon` —— **视觉类串一个字没改**。
 * 唯一改动: 上游的 item 类型来自 `@vetta-org/theme-sdk/sidebar`, 这里换成等价的本地定义,
 * 因为那套主题运行时不在本库里 (观感不需要它)。
 */

/** 导航角标。数字或短文本, 主色小胶囊。 */
export interface SidebarNavBadge {
  readonly text: string;
  /** `count` 是数字角标, `text` 是窄长条文本角标 (例如 ``BETA``)。 */
  readonly variant?: "count" | "text";
}

export interface SidebarNavItem {
  readonly id: string;
  readonly label?: string;
  readonly title?: string;
  readonly icon: string;
  readonly iconUrl?: string;
  readonly active?: boolean;
  readonly badge?: SidebarNavBadge;
}

/**
 * 导航图标。
 *
 * 类串图标用 `mask-image` 渲染 (配 Iconify 的类串, 形如 solar 前缀加图标名) ——
 * 好处是它跟随 `currentColor`, 选中态改个 text 色就能整体变色, 不用换图。
 */
export function SidebarNavIcon({ icon, iconUrl, className }: {
  icon: string;
  iconUrl?: string;
  className?: string;
}): JSX.Element {
  if (iconUrl) {
    return <img src={iconUrl} alt="" className={cn("size-4 shrink-0 object-contain", className)} draggable={false} />;
  }
  return <span aria-hidden className={cn(icon, "size-4 shrink-0 bg-current", className)} />;
}

/** 导航角标视图。 */
export function SidebarNavBadgeView({ badge, className }: {
  badge: SidebarNavBadge;
  className?: string;
}): JSX.Element {
  if (badge.variant === "text") {
    return (
      <span className={cn(
        "shrink-0 rounded-full border border-primary/40 px-1.5 py-px text-[9px] font-semibold uppercase leading-tight tracking-wide text-primary",
        className,
      )}>
        {badge.text}
      </span>
    );
  }
  return (
    <span className={cn(
      "grid min-w-4 shrink-0 place-items-center rounded-full bg-primary/15 px-1 text-[10px] font-medium leading-4 text-primary",
      className,
    )}>
      {badge.text}
    </span>
  );
}

export interface SidebarNavItemButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  readonly item: SidebarNavItem;
  readonly classNames?: { badge?: string; icon?: string; label?: string };
  readonly children?: ReactNode;
}

/**
 * 侧栏导航项。选中态只改字重与文字色, 背景靠外层的高亮块给出 ——
 * 这是上游的做法, 好处是移动高亮块时按钮本身不用重绘。
 */
export const SidebarNavItemButton = forwardRef<HTMLButtonElement, SidebarNavItemButtonProps>(
  function SidebarNavItemButton({ className, classNames, item, onClick, ...props }, ref): JSX.Element {
    const label = item.label ?? "";
    const title = item.title ?? label;

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        title={title}
        className={cn(
          "no-drag relative z-20 flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
          item.active ? "font-semibold text-foreground" : "text-foreground hover:bg-accent/50",
          className,
        )}
        {...props}
      >
        <SidebarNavIcon icon={item.icon} iconUrl={item.iconUrl} className={cn("relative z-10", classNames?.icon)} />
        {/* min-w-0 flex-1 truncate: label 占满中间并在过长时省略, 右侧角标才不会被顶出按钮 */}
        <span className={cn("relative z-10 min-w-0 flex-1 truncate text-left", classNames?.label)}>{label}</span>
        {item.badge ? <SidebarNavBadgeView badge={item.badge} className={classNames?.badge} /> : null}
      </button>
    );
  },
);
