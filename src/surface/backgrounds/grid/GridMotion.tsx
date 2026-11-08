"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 GridMotion 条目, 实现为 HX 自有.

import { useRef, useState, type JSX, type ReactNode } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { cssColorOf } from "../../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import type { CanvasFit } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useDomBackdrop } from "../../backdrop/kernel/use-surfaces";
import { GRID_MOTION, isImageItem, makeMotionState, motionLayout, stepMotion, tileFilter, type MotionDirection } from "./grid-motion-field";
import { introProgress } from "./tokens";

const ROW = "[data-grid-motion-row]";
const TILE = "[data-grid-motion-tile]";

export interface GridMotionProps extends BackdropCommonProps {
  /** 瓦片内容: 图片地址按封面图铺, 其余字符串或节点居中显示. 空时铺纯色瓦片. */
  readonly items?: readonly ReactNode[];
  /** 行数, 默认 4. */
  readonly rows?: number;
  /** 瓦片宽高比, 默认 1.33. */
  readonly aspectRatio?: number;
  /** 瓦片间距 (CSS 像素), 默认 16. */
  readonly gap?: number;
  /** 瓦片圆角 (CSS 像素), 默认 14. */
  readonly radius?: number;
  /** 整面旋转 (度), 默认 -12. */
  readonly angle?: number;
  /** 绕横轴前倾 (度), 默认 0. */
  readonly tilt?: number;
  /** 行滚动速度 (CSS 像素每秒), 默认 24. 规格的 speed 与公共时钟倍率同名, 改名 scrollSpeed. */
  readonly scrollSpeed?: number;
  /** 滚动方向: left / right / alternate. */
  readonly direction?: MotionDirection;
  /** 指针左右带动各行的视差强度, 默认 0.5. */
  readonly parallax?: number;
  /** 光斑提亮强度, 默认 0.6. */
  readonly spotlight?: number;
  /** 指针在场时光斑外压暗的程度, 默认 0.35. */
  readonly dim?: number;
  /** 灰度, 光斑处恢复彩色. */
  readonly grayscale?: boolean;
  /** 四边淡出 0..1, 默认 0.5. */
  readonly fade?: number;
  /** 瓦片底色, token 名或 CSS 颜色, 默认 muted. */
  readonly tileColor?: string;
  /** 文字色, 默认 foreground. */
  readonly textColor?: string;
  /** 首帧起 0.9 秒由放大淡入落位. */
  readonly intro?: boolean;
}

/** 四边淡出的遮罩: fade 越大, 不透明的中心越小. 遮罩只看 alpha, 用 foreground token 当实色. */
export function motionMask(fade: number): string | undefined {
  if (fade <= 0) return undefined;
  const solid = Math.round(Math.max(0, 1 - Math.min(fade, 1)) * 70);
  return `radial-gradient(ellipse at center, var(--foreground) ${solid}%, transparent 100%)`;
}

/**
 * 运动瓦片墙: 若干行瓦片沿倾斜的整面匀速滚动 (交替或同向), 指针左右带动各行按不同惯性视差平移,
 * 指针处光斑提亮瓦片, 其余压暗, 可选灰度与四边淡出. 纯 DOM, 只用内核的调度与指针.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-grid.md
 */
export function GridMotion(props: GridMotionProps): JSX.Element {
  const {
    items = [], rows = 4, aspectRatio = 1.33, gap = 16, radius = 14, angle = -12, tilt = 0, scrollSpeed = 24, direction = "alternate",
    parallax = 0.5, spotlight = 0.6, dim = 0.35, grayscale = false, fade = 0.5, tileColor = "muted", textColor = "foreground", intro = true, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const [size, setSize] = useState<readonly [number, number]>([0, 0]);
  const stage = useRef<HTMLDivElement | null>(null);
  const state = useRef(makeMotionState());
  const rowCount = Math.max(1, Math.round(rows));
  const layout = motionLayout(size[0], size[1], { rows: rowCount, aspectRatio, gap, angle, count: items.length });

  const resize = (fit: CanvasFit): void => {
    const next = [fit.width / fit.scale, fit.height / fit.scale] as const;
    setSize((prev) => (Math.abs(prev[0] - next[0]) < 0.5 && Math.abs(prev[1] - next[1]) < 0.5 ? prev : next));
  };

  const render = (_host: HTMLElement, frame: BackdropFrame): void => {
    const el = stage.current;
    if (!el) return;
    const p = frame.pointer;
    const shifts = stepMotion(state.current, frame.time, frame.dt, p, {
      rows: rowCount, layout, width: size[0], height: size[1], angle, parallax, scrollSpeed, direction,
    });
    const shown = introProgress(frame.elapsed, GRID_MOTION.introSeconds, intro);
    const ease = 1 - (1 - shown) ** 3;
    const zoom = GRID_MOTION.introScale - (GRID_MOTION.introScale - 1) * ease;
    el.style.opacity = ease.toFixed(3);
    el.style.transform = `perspective(1200px) rotateX(${tilt}deg) rotate(${angle}deg) scale(${zoom.toFixed(4)})`;
    el.querySelectorAll<HTMLElement>(ROW).forEach((row, r) => {
      row.style.transform = `translate3d(${(shifts[r] ?? 0).toFixed(2)}px, 0, 0)`;
      row.querySelectorAll<HTMLElement>(TILE).forEach((tile, i) => {
        tile.style.filter = tileFilter(state.current.lights[r * layout.perRow + i]?.value ?? 0, p.presence, { dim, spotlight, grayscale });
      });
    });
  };

  const handle = useDomBackdrop({ render, resize }, options);
  const mask = motionMask(fade);
  const tile = (r: number, i: number): JSX.Element => {
    const item = items.length > 0 ? items[(i + r * 3) % items.length] : null;
    const image = isImageItem(item);
    return (
      <div
        key={i}
        data-grid-motion-tile=""
        className="flex shrink-0 items-center justify-center overflow-hidden bg-cover bg-center text-sm font-medium"
        style={{
          width: layout.tileW, height: layout.rowH, borderRadius: radius, color: cssColorOf(textColor),
          backgroundColor: cssColorOf(tileColor), backgroundImage: image ? `url(${JSON.stringify(item)})` : undefined,
        }}
      >
        {image ? null : item}
      </div>
    );
  };
  return (
    <BackdropShell handle={handle} canvas={false} fallback={fallbackGradient(["background", tileColor])} opacity={opacity} {...rest}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" style={{ opacity, maskImage: mask, WebkitMaskImage: mask }}>
        <div
          ref={stage}
          data-grid-motion-stage=""
          className="absolute flex flex-col"
          style={{ left: (size[0] - layout.stageW) / 2, top: (size[1] - layout.stageH) / 2, width: layout.stageW, height: layout.stageH, gap }}
        >
          {Array.from({ length: rowCount }, (_, r) => (
            <div key={r} data-grid-motion-row="" className="flex shrink-0 will-change-transform" style={{ gap, height: layout.rowH }}>
              {Array.from({ length: layout.perRow }, (_t, i) => tile(r, i))}
            </div>
          ))}
        </div>
      </div>
      {children}
    </BackdropShell>
  );
}
