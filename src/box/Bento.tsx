"use client";

import type { ComponentPropsWithoutRef, CSSProperties, JSX, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../primitives/utils";
import { ROLE, TAG } from "../constants/ui";
import { isString } from "../constants";
import { BENTO_ROW, BOX_CLASS, BOX_DEFAULT, BOX_FOCUS_RING, BOX_GAP, BOX_SLOT, type BentoRow, type BoxGap } from "../constants/box";

/**
 * Bento 网格: 不等大小的磁贴拼成的展示墙.
 *
 * 断点策略: 手机单列 (所有跨度失效, 按源顺序堆叠); sm 两列, 跨度最多 2;
 * lg 起按 cols (默认 4) 排, 跨度原样生效. grid-flow-row-dense 让小磁贴回填大磁贴留下的空洞.
 * 行高写进 --bento-row, 用 minmax(行高, auto): 内容多时行会长高, 不会裁字.
 */
const BENTO_GRID =
  "grid grid-flow-row-dense grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(var(--bento-cols),minmax(0,1fr))] auto-rows-[minmax(var(--bento-row),auto)]";

export interface BentoProps extends ComponentPropsWithoutRef<"div"> {
  /** lg 断点起的列数, 默认 4. */
  readonly cols?: number;
  /** 行高档, 默认 md. */
  readonly rowHeight?: BentoRow;
  /** 间距档 (与 Stack / Grid 同一套), 默认 md. */
  readonly gap?: BoxGap;
}

export function Bento({ cols = BOX_DEFAULT.bentoCols, rowHeight = BOX_DEFAULT.bentoRow, gap = BOX_DEFAULT.gap, className, style, ...props }: BentoProps): JSX.Element {
  const vars = { "--bento-cols": Math.max(1, Math.floor(cols)), "--bento-row": BENTO_ROW[rowHeight] } as CSSProperties;
  return (
    <div
      role={ROLE.list}
      data-slot={BOX_SLOT.bento}
      className={cn(BENTO_GRID, BOX_GAP[gap], className)}
      style={{ ...vars, ...style }}
      {...props}
    />
  );
}

/**
 * 磁贴. colSpan / rowSpan 只描述 lg 起的跨度, 小屏自动收窄 (见 Bento 的断点策略).
 * 可点磁贴用覆盖整块的透明链接 / 按钮做热区: Tab 可达, 焦点环画在热区上, 读屏念 actionLabel.
 */
const bentoItemVariants = cva("group/bento relative flex min-w-0 flex-col overflow-hidden rounded-xl", {
  variants: {
    colSpan: {
      1: "col-span-1",
      2: "sm:col-span-2 lg:col-span-2",
      3: "sm:col-span-2 lg:col-span-3",
      4: "sm:col-span-2 lg:col-span-4",
      full: "col-span-full",
    },
    rowSpan: {
      1: "row-span-1",
      2: "sm:row-span-2",
      3: "sm:row-span-3",
    },
    surface: {
      card: "border border-border bg-card",
      muted: "border border-border/60 bg-muted/40",
      outline: "border border-border",
      plain: "",
    },
    interactive: {
      true: "transition-colors duration-(--duration-fast) hover:border-primary/40 focus-within:border-ring",
      false: "",
    },
  },
  defaultVariants: { colSpan: 1, rowSpan: 1, surface: "card", interactive: false },
});

export interface BentoItemProps
  extends Omit<ComponentPropsWithoutRef<"div">, "title" | "onClick">,
    Omit<VariantProps<typeof bentoItemVariants>, "interactive"> {
  readonly icon?: ReactNode;
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  /** 底栏 (标签, 时间, 次要操作). */
  readonly footer?: ReactNode;
  /** 整块可点: 给 href 渲染为链接, 给 onSelect 渲染为按钮. 二者都是覆盖整块的透明热区. */
  readonly href?: string;
  readonly onSelect?: () => void;
  /** 整块热区的可访问名称; 不传时用 title 的文字 (title 是字符串时). */
  readonly actionLabel?: string;
}

export function BentoItem({
  colSpan,
  rowSpan,
  surface,
  icon,
  title,
  description,
  footer,
  href,
  onSelect,
  actionLabel,
  children,
  className,
  ...props
}: BentoItemProps): JSX.Element {
  const interactive = href !== undefined || onSelect !== undefined;
  const label = actionLabel ?? (isString(title) ? title : undefined);
  const overlay = cn("absolute inset-0 z-10 rounded-xl", BOX_FOCUS_RING);
  return (
    <div
      role="listitem"
      data-slot={BOX_SLOT.bentoItem}
      className={cn(bentoItemVariants({ colSpan, rowSpan, surface, interactive }), className)}
      {...props}
    >
      {children !== undefined && <div className="relative min-h-0 flex-1">{children}</div>}
      {(icon || title || description) && (
        <div className="flex flex-col gap-1.5 p-4">
          {icon && <div className="mb-1 flex size-8 items-center justify-center rounded-lg border border-border bg-muted text-foreground [&_svg]:size-4">{icon}</div>}
          {title && <div className="text-sm font-medium text-foreground">{title}</div>}
          {description && <div className={BOX_CLASS.mutedText}>{description}</div>}
        </div>
      )}
      {footer && <div className="mt-auto flex items-center gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">{footer}</div>}
      {href !== undefined && <a href={href} aria-label={label} className={overlay} />}
      {href === undefined && onSelect !== undefined && (
        <button type={TAG.button} aria-label={label} onClick={onSelect} className={overlay} />
      )}
    </div>
  );
}

export { bentoItemVariants };
