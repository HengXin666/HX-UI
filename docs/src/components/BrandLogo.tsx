import type { JSX } from "react";
import { cn } from "@hx/ui";
import { BRAND_LOGO_SIZE, SHELL_CLASSES, SVG_FOCUSABLE_OFF } from "../constants/shell";

/** 两块方块的边长 (viewBox 32 内). */
const TILE_SIZE = "17";

/**
 * HX-UI 的品牌标记: 两块错位叠放的圆角方块.
 *
 * 为什么是"叠放"而不是字母: 这套库的价值在"一层层组合起来的界面",
 * 叠放的两个方块在 16px 下仍然可辨, 而 HX 两个字母缩到 16px 就糊成一团.
 * 前块用主色, 后块用弱化的前景色, 于是它天然适配亮暗两套皮肤  颜色全部走
 * 语义 token (fill-link / fill-muted-foreground), 不写死色值.
 *
 * 装饰性用法传 aria-hidden (侧栏标题旁边), 独立出现时给 title 作为可读名.
 * 纯静态图标另见 docs/public/logo.svg 与 docs/public/favicon.svg.
 */
export function BrandLogo({
  size = BRAND_LOGO_SIZE.base,
  title,
  className,
}: {
  size?: number;
  title?: string;
  className?: string;
}): JSX.Element {
  const labelled = title !== undefined;
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      role={labelled ? "img" : undefined}
      aria-label={title}
      aria-hidden={labelled ? undefined : true}
      focusable={SVG_FOCUSABLE_OFF}
      className={cn(SHELL_CLASSES.shrink, className)}
    >
      {/* 后块: 弱化的前景色, 表示"下面那一层" */}
      <rect x="2.5" y="2.5" width={TILE_SIZE} height={TILE_SIZE} rx="5.5" className="fill-muted-foreground/45" />
      {/* 前块: 主色, 压在上一层之上 */}
      <rect x="12.5" y="12.5" width={TILE_SIZE} height={TILE_SIZE} rx="5.5" className="fill-link" />
    </svg>
  );
}
