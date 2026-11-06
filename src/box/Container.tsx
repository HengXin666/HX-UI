"use client";

import { useId, type ComponentPropsWithoutRef, type JSX, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../primitives/utils";
import {
  BOX_BLEED,
  BOX_BLEED_CLASS,
  BOX_CLASS,
  BOX_DEFAULT,
  BOX_DISPLAY,
  BOX_GUTTER,
  BOX_HEADING,
  BOX_ITEMS,
  BOX_JUSTIFY,
  BOX_NONE,
  BOX_PAD_Y,
  BOX_SLOT,
  BOX_WIDE_WIDTH,
  SECTION_ALIGN,
  SECTION_HEADER_CLASS,
  SECTION_ON_COLOR,
  SECTION_RHYTHM,
  SECTION_TEXT_CLASS,
  SECTION_TITLE_SIZE,
  SECTION_TONE,
  type BoxSlotClassNames,
  type SectionRhythm,
  type SectionTitleSize,
} from "../constants/box";

/**
 * 内容最大宽度档: Container / Section / Center 只认这一套.
 * prose 约 65 字符, 适合正文; sm..xl 对应表单, 文档, 仪表盘, 落地页; full 不限宽.
 * content / wide / max 是宽屏档 (1280 / 1440 / 1536), 读 --container-content / --container-wide / --container-max.
 */
export const BOX_WIDTH = {
  prose: "max-w-prose",
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  ...BOX_WIDE_WIDTH,
  full: "max-w-none",
} as const;

/** 最大宽度档名. */
export type BoxWidth = keyof typeof BOX_WIDTH;

/** 出血方式名. */
export type BoxBleed = keyof typeof BOX_BLEED;

const containerVariants = cva("mx-auto w-full min-w-0", {
  variants: {
    size: BOX_WIDTH,
    gutter: { true: BOX_GUTTER, false: "" },
  },
  defaultVariants: { size: BOX_DEFAULT.width, gutter: true },
});

export interface ContainerProps extends ComponentPropsWithoutRef<"div">, VariantProps<typeof containerVariants> {
  /**
   * 出血 (破格): full 时外层铺满父级 (可上底色 / 背景图), 内层按 size 回中;
   * breakout 时外层再冲出父级的限宽直到视口两侧. 默认 none, 渲染与旧版完全一致.
   */
  readonly bleed?: BoxBleed;
  /** 插槽类名: root 为最外层, content 为出血时回中的内容层 (data-slot="container-content"). */
  readonly classNames?: BoxSlotClassNames<"root" | "content">;
}

/**
 * 水平居中, 限最大宽度, 两侧留随断点放宽的内边距. 页面内容的最外层.
 * `<Container bleed="full" size="wide" className="bg-muted">` 即 "全出血底色 + 1440 内容回中".
 */
export function Container({ className, size, gutter, bleed = BOX_BLEED.none, classNames, children, ...props }: ContainerProps): JSX.Element {
  if (bleed === BOX_BLEED.none) {
    return (
      <div data-slot={BOX_SLOT.container} className={cn(containerVariants({ size, gutter }), classNames?.root, className)} {...props}>
        {children}
      </div>
    );
  }
  return (
    <div data-slot={BOX_SLOT.container} data-bleed={bleed} className={cn(BOX_BLEED_CLASS[bleed], classNames?.root, className)} {...props}>
      <div data-slot={BOX_SLOT.containerContent} className={cn(containerVariants({ size, gutter }), classNames?.content)}>
        {children}
      </div>
    </div>
  );
}

const sectionVariants = cva(BOX_CLASS.fullWidth, {
  variants: {
    pad: BOX_PAD_Y,
    tone: SECTION_TONE,
    divided: { true: "border-t border-border", false: "" },
  },
  defaultVariants: { pad: BOX_DEFAULT.pad, tone: "plain", divided: false },
});

/** Section 的插槽名. */
export type SectionSlot = "root" | "container" | "header" | "eyebrow" | "title" | "description" | "actions" | "media";

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
  /** 标题区对齐, 默认 left (与旧版一致). */
  readonly align?: keyof typeof SECTION_ALIGN;
  /** 标题尺度档, 默认 md (= 旧版 text-xl). */
  readonly titleSize?: SectionTitleSize;
  /** 纵向节奏档 (--section-pad-*). 给了即覆盖 pad; 不给时 pad 照旧生效. */
  readonly rhythm?: SectionRhythm;
  /** tone="image" 时铺在内容下方的背景层 (通常是一张 img), 自动加语义色遮罩保证可读. */
  readonly media?: ReactNode;
  /** 插槽类名 (契约第 4 节). */
  readonly classNames?: BoxSlotClassNames<SectionSlot>;
}

/**
 * 页面分区: 统一纵向留白档 (BOX_PAD_Y / SECTION_RHYTHM) + 内置 Container + 可选标题头.
 *
 * 有标题时渲染 aria-labelledby 指向标题, 读屏的 "区域" 导航能列出它;
 * 没有标题也没传 aria-label 时只是普通 section, 不会进入地标列表.
 * 所有新增 props 的默认值都渲染出与旧版逐字相同的类名.
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
  align = SECTION_ALIGN.left,
  titleSize,
  rhythm,
  media,
  classNames,
  children,
  ...props
}: SectionProps): JSX.Element {
  const headingId = useId();
  const Heading = level === BOX_HEADING.section ? "h2" : "h3";
  const hasHeader = title !== undefined || actions !== undefined;
  const onColor = tone ? SECTION_ON_COLOR.includes(tone) : false;
  const layout = SECTION_HEADER_CLASS[align];
  const text = SECTION_TEXT_CLASS;
  return (
    <section
      data-slot={BOX_SLOT.section}
      data-tone={tone ?? undefined}
      data-align={align === SECTION_ALIGN.left ? undefined : align}
      aria-labelledby={title === undefined ? undefined : headingId}
      className={cn(sectionVariants({ pad, tone, divided }), rhythm && SECTION_RHYTHM[rhythm], classNames?.root, className)}
      {...props}
    >
      {media !== undefined && (
        <div data-slot={BOX_SLOT.sectionMedia} aria-hidden className={cn(text.media, text.scrim, classNames?.media)}>
          {media}
        </div>
      )}
      <Container size={size} className={classNames?.container}>
        {hasHeader && (
          <header data-slot={BOX_SLOT.sectionHeader} className={cn(layout.header, classNames?.header)}>
            <div className={layout.text}>
              {eyebrow && (
                <p data-slot={BOX_SLOT.sectionEyebrow} className={cn(text.eyebrow, onColor ? text.onColorMuted : text.eyebrowTone, classNames?.eyebrow)}>
                  {eyebrow}
                </p>
              )}
              {title && (
                <Heading
                  id={headingId}
                  data-slot={BOX_SLOT.sectionTitle}
                  className={cn(SECTION_TITLE_SIZE[titleSize ?? "md"], text.title, onColor ? text.onColor : text.titleTone, classNames?.title)}
                >
                  {title}
                </Heading>
              )}
              {description && (
                <p
                  data-slot={BOX_SLOT.sectionDescription}
                  className={cn(BOX_WIDTH.prose, BOX_CLASS.mutedText, onColor && text.onColorMuted, layout.description, classNames?.description)}
                >
                  {description}
                </p>
              )}
            </div>
            {actions && <div data-slot={BOX_SLOT.sectionActions} className={cn(text.actions, classNames?.actions)}>{actions}</div>}
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
