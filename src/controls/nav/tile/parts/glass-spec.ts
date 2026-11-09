/**
 * GlassTiles 的规格常数与纯函数: 背板姿态, 悬停姿态, 入场进度, 网格方向键.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
import type { SpringSpec } from "../../../../craft/spring";
import { clamp, easeOutCubic } from "../../tokens";

/** 规格默认 (GlassIcons.jsx:405-427). size, gap 以 px 计, tilt 以度计. */
export const GLASS_DEFAULTS = { size: 82, gap: 66, columns: 3, roundness: 0.6, frost: 0.2, shine: 0.85, tintOpacity: 0.2, tilt: 30, spread: 0.5 } as const;
/** 规格 STAGGER (GlassIcons.jsx:44): 入场每格错峰, 秒. */
export const GLASS_STAGGER_S = 0.07;
/** 规格标签显隐 (GlassIcons.css:141-142): opacity 与 transform 0.3s, 曲线 outQuint. */
export const GLASS_LABEL_MS = 300;
/** 标签隐藏时上移 px, HX 自定. */
export const GLASS_LABEL_DROP = 4;
/** 规格入场: 图形上浮 0.1 倍尺寸再落位 (GlassIcons.jsx:367). */
export const GLASS_RISE = 0.1;
/** frost 1 对应的背景模糊 px, HX 自定. */
export const GLASS_FROST_PX = 24;
/** 悬停: press 缩到 0.94, lift 抬 0.08 倍尺寸, 背板角度放大 1.5 倍. HX 自定. */
export const GLASS_PRESS_SCALE = 0.94;
export const GLASS_LIFT = 0.08;
export const GLASS_SWING = 1.5;
/** offset 背板的位移占尺寸比例, circle 背板的直径比例. HX 自定. */
export const GLASS_OFFSET = 0.18;
export const GLASS_CIRCLE = 0.62;
/** 悬停弹簧与入场弹簧. 入场为临界阻尼, 不过冲. HX 自定. */
export const GLASS_HOVER_SPRING: SpringSpec = { stiffness: 320, damping: 22, mass: 1 };
export const GLASS_ENTER_SPRING: SpringSpec = { stiffness: 170, damping: 26, mass: 1 };

export type GlassPlate = "tilt" | "offset" | "circle" | "none";
export type GlassHover = "press" | "lift" | "none";

const HALF = 0.5;
const QUARTER = 0.25;

/** 背板的 transform: hover 0..1 表示悬停强度, spread 0..1 放大位移与角度. */
export function plateTransform(plate: GlassPlate, size: number, tilt: number, spread: number, hover: number): string {
  const s = clamp(spread, 0, 1);
  const k = 1 + (GLASS_SWING - 1) * clamp(hover, 0, 1);
  if (plate === "tilt") return `rotate(${tilt * (HALF + s) * k}deg)`;
  if (plate === "offset") {
    const d = size * GLASS_OFFSET * (HALF + s) * k;
    return `translate(${d}px, ${-d}px)`;
  }
  if (plate === "circle") {
    const d = size * QUARTER * (HALF + s) * k;
    return `translate(${d}px, ${-d}px)`;
  }
  return "none";
}

/** 玻璃面的 transform: 入场 enter 0..1 与悬停 hover 0..1 叠加. */
export function glassTransform(mode: GlassHover, size: number, enter: number, hover: number): string {
  const rise = (1 - easeOutCubic(enter)) * GLASS_RISE * size;
  const h = clamp(hover, 0, 1);
  const scale = mode === "press" ? 1 - (1 - GLASS_PRESS_SCALE) * h : 1;
  const lift = mode === "lift" ? GLASS_LIFT * size * h : 0;
  return `translateY(${rise - lift}px) scale(${scale})`;
}

/** 网格方向键: 左右走一格, 上下走一行, 越界不动. 返回新下标或 null. */
export function gridMove(key: string, index: number, count: number, columns: number): number | null {
  const cols = Math.max(1, Math.floor(columns));
  const moves: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, ArrowDown: index + cols, ArrowUp: index - cols, Home: 0, End: count - 1 };
  const next = moves[key];
  if (next === undefined || next < 0 || next >= count) return null;
  return next;
}
