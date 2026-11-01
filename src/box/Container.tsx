"use client";

import { useId, type ComponentPropsWithoutRef, type JSX, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../primitives/utils";
import { BOX_CLASS, BOX_DEFAULT, BOX_DISPLAY, BOX_GUTTER, BOX_HEADING, BOX_ITEMS, BOX_JUSTIFY, BOX_NONE, BOX_PAD_Y, BOX_SLOT } from "../constants/box";

/**
 * 内容最大宽度档: Container / Section / Center 只认这一套.
 * prose 约 65 字符, 适合正文; sm..xl 对应表单, 文档, 仪表盘, 落地页; full 不限宽.
 */
export const BOX_WIDTH = {
  prose: "max-w-prose",
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
} as const;

/** 最大宽度档名. */
export type BoxWidth = keyof typeof BOX_WIDTH;

const containerVariants = cva("mx-auto w-full min-w-0", {
  variants: {
    size: BOX_WIDTH,
    gutter: { true: BOX_GUTTER, false: "" },
  },
  defaultVariants: { size: BOX_DEFAULT.width, gutter: true },
});

export interface ContainerProps extends ComponentPropsWithoutRef<"div">, VariantProps<typeof containerVariants> {}

/** 水平居中, 限最大宽度, 两侧留随断点放宽的内边距. 页面内容的最外层. */
export function Container({ className, size, gutter, ...props }: ContainerProps): JSX.Element {
  return <div data-slot={BOX_SLOT.container} className={cn(containerVariants({ size, gutter }), className)} {...props} />;
}

const sectionVariants = cva(BOX_CLASS.fullWidth, {
  variants: {
    pad: BOX_PAD_Y,
    tone: { plain: "", muted: "bg-muted/40", card: "bg-card" },
    divided: { true: "border-t border-border", false: "" },
  },
  defaultVariants: { pad: BOX_DEFAULT.pad, tone: "plain", divided: false },
});

export interface SectionProps extends Omit<ComponentPropsWithoutRef<"section">, "title">, VariantProps<typeof sectionVariants> {
  /** 内层 Container 的宽度档. */
  readonly size?: BoxWidth;
  /** 小标题上方的眉标 (分类名, 序号). */
  readonly eyebrow?: ReactNode;
  /** 分区标题. 给了标题, section 就以它作可访问名称 (aria-labelledby). */
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  /** 标题行右侧的操作 (按钮, 链接). */
  readonly actions?: ReactNode;
  /** 标题层级, 默认 h2. */
  readonly level?: (typeof BOX_HEADING)[keyof typeof BOX_HEADING];
}

/**
 * 页面分区: 统一纵向留白档 (BOX_PAD_Y) + 内置 Container + 可选标题头.
 *
 * 有标题时渲染 aria-labelledby 指向标题, 读屏的 "区域" 导航能列出它;
 * 没有标题也没传 aria-label 时只是普通 section, 不会进入地标列表.
 */
export function Section({
  className,
  pad,
  tone,
  divided,
  size,
  eyebrow,
  title,
  description,
  actions,
  level = BOX_HEADING.section,
  children,
  ...props
}: SectionProps): JSX.Element {
  const headingId = useId();
  const Heading = level === BOX_HEADING.section ? "h2" : "h3";
  const hasHeader = title !== undefined || actions !== undefined;
  return (
    <section
      data-slot={BOX_SLOT.section}
      aria-labelledby={title === undefined ? undefined : headingId}
      className={cn(sectionVariants({ pad, tone, divided }), className)}
      {...props}
    >
      <Container size={size}>
        {hasHeader && (
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              {eyebrow && <p className="text-xs font-medium uppercase tracking-wide text-primary">{eyebrow}</p>}
              {title && (
                <Heading id={headingId} className="text-xl font-semibold tracking-tight text-foreground">
                  {title}
                </Heading>
              )}
              {description && <p className={cn(BOX_WIDTH.prose, BOX_CLASS.mutedText)}>{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </header>
        )}
        {children}
      </Container>
    </section>
  );
}

const centerVariants = cva("", {
  variants: {
    axis: {
      both: `${BOX_ITEMS.center} ${BOX_JUSTIFY.center}`,
      horizontal: BOX_JUSTIFY.center,
      vertical: BOX_ITEMS.center,
    },
    inline: { true: BOX_DISPLAY.inline, false: BOX_DISPLAY.block },
    fill: { none: "", parent: "size-full", screen: "min-h-dvh w-full" },
    text: { true: "text-center", false: "" },
  },
  defaultVariants: { axis: "both", inline: false, fill: BOX_NONE, text: false },
});

export interface CenterProps extends ComponentPropsWithoutRef<"div">, VariantProps<typeof centerVariants> {
  /** 内容的最大宽度档 (与 Container 同一套). 不传则不限宽. */
  readonly maxWidth?: BoxWidth;
}

/**
 * 居中容器: 子项在横向, 纵向或两个方向居中. 空状态, 加载占位, 登录卡这类场景用.
 * maxWidth 给的是同一套 BOX_WIDTH 档, 内容被套进一层限宽的盒子.
 */
export function Center({ className, axis, inline, fill, text, maxWidth, children, ...props }: CenterProps): JSX.Element {
  return (
    <div data-slot={BOX_SLOT.center} className={cn(centerVariants({ axis, inline, fill, text }), className)} {...props}>
      {maxWidth ? <div className={cn(BOX_CLASS.fullWidth, BOX_WIDTH[maxWidth])}>{children}</div> : children}
    </div>
  );
}

export { containerVariants, sectionVariants, centerVariants };
