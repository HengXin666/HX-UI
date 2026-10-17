import { forwardRef, type ComponentPropsWithoutRef, type JSX, type ReactNode } from "react";
import { useRipple } from "../primitives/ripple";
import { cn } from "../primitives/utils";
import { IconSlot, type IconSource } from "./Icon";

/**
 * 侧栏导航件。
 *
 * 源码取自 open-vetta `theme-ui/src/sidebar/` 的 `SidebarNavItemButton` 与
 * `SidebarNavIcon`  **视觉类串一个字没改**。
 * 唯一改动: 上游的 item 类型来自 `@vetta-org/theme-sdk/sidebar`, 这里换成等价的本地定义,
 * 因为那套主题运行时不在本库里 (观感不需要它)。
 *
 * ## 最小可用示例
 *
 * ```tsx
 * import { FolderIcon } from "lucide-react";
 * import { SidebarNavItemButton } from "@hx/ui";
 *
 * <SidebarNavItemButton item={{ id: "files", label: "文件", icon: FolderIcon }} />
 * <SidebarNavItemButton item={{ id: "about", label: "关于" }} />   // 无图标, 不占位
 * ```
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
  /**
   * 图标来源: 图标组件 / Iconify 类串 / 任意节点。
   *
   * 可选。导航项本来就允许"只有文字" (分组标题、纯文本入口), 强制传图标会
   * 逼调用方编一个占位值, 而占位值渲染出来就是一块空白  缺图标必须表达成
   * "没有图标", 不是"一个空的图标"。
   */
  readonly icon?: IconSource;
  /** 图片图标。与 `icon` 二选一, 同时给出时 `iconUrl` 优先。 */
  readonly iconUrl?: string;
  readonly active?: boolean;
  readonly badge?: SidebarNavBadge;
}

/**
 * 导航图标。
 *
 * 渲染规则全部委托 {@link IconSlot}  判据只保留一处。此前本文件与图标槽各有一份
 * "类串怎么画"的逻辑, 两份规则在"空值要不要占位"这类边界上必然分叉。
 *
 * `iconUrl` 仍然在这里处理, 因为它不属于 `IconSource` 的三种形态:
 * 它是一个**图片地址**, 需要 `<img>` 的加载语义 (draggable / object-contain)。
 */
export function SidebarNavIcon({ icon, iconUrl, className }: {
  icon?: IconSource;
  iconUrl?: string;
  className?: string;
}): JSX.Element | null {
  if (iconUrl) {
    return <img src={iconUrl} alt="" className={cn("size-4 shrink-0 object-contain", className)} draggable={false} />;
  }
  return <IconSlot source={icon} className={className} />;
}

/** 导航角标视图。 */
export function SidebarNavBadgeView({ badge, className }: {
  badge: SidebarNavBadge;
  className?: string;
}): JSX.Element {
  if (badge.variant === "text") {
    return (
      <span className={cn(
        "shrink-0 rounded-full border border-primary/40 px-1.5 py-px text-[9px] font-semibold uppercase leading-tight tracking-wide text-link",
        className,
      )}>
        {badge.text}
      </span>
    );
  }
  return (
    <span className={cn(
      "grid min-w-4 shrink-0 place-items-center rounded-full bg-primary/15 px-1 text-[10px] font-medium leading-4 text-link",
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
  /** 点按水波纹. 默认 true. */
  readonly ripple?: boolean;
}

/**
 * 侧栏导航项。选中态只改字重与文字色, 背景靠外层的高亮块给出 
 * 这是上游的做法, 好处是移动高亮块时按钮本身不用重绘。
 */
export const SidebarNavItemButton = forwardRef<HTMLButtonElement, SidebarNavItemButtonProps>(
  function SidebarNavItemButton({ className, classNames, item, onClick, ripple = true, onPointerDown, onKeyDown, ...props }, ref): JSX.Element {
    const rippleProps = useRipple<HTMLButtonElement>({ enabled: ripple, onPointerDown, onKeyDown });
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
        {...rippleProps}
      >
        <SidebarNavIcon icon={item.icon} iconUrl={item.iconUrl} className={cn("relative z-10", classNames?.icon)} />
        {/* min-w-0 flex-1 truncate: label 占满中间并在过长时省略, 右侧角标才不会被顶出按钮 */}
        <span className={cn("relative z-10 min-w-0 flex-1 truncate text-left", classNames?.label)}>{label}</span>
        {item.badge ? <SidebarNavBadgeView badge={item.badge} className={classNames?.badge} /> : null}
      </button>
    );
  },
);
