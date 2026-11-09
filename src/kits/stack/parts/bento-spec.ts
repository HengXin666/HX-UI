/**
 * GlowBento 的规格常数与纯函数: 响应列数与跨格收窄, 各种趋近的时间常数, 格内光照强度, 倾斜与吸附.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
import { clamp } from "../tokens";

export const BENTO_DEFAULTS = { columns: 4, rowHeight: 200, gap: 12, radius: 20, spotlightRadius: 300 } as const;
/** 单格最窄 150px, 跨两列的格最窄 200px, 入场每格错峰 80ms, 倾斜 6 度, 吸附 6px (MagicBento.jsx:71-75). */
export const BENTO_MIN_CELL = 150;
export const BENTO_MIN_PAIR = 200;
export const BENTO_STAGGER_MS = 80;
export const BENTO_TILT_DEG = 6;
export const BENTO_MAGNET_PX = 6;
/** 入场: 透明度 420ms outQuint, 位移 760ms 轻回弹 (MagicBento.css:65-66). 入场在格子 15% 可见时开始. */
export const BENTO_INTRO_FADE_MS = 420;
export const BENTO_INTRO_MOVE_MS = 760;
export const BENTO_INTRO_THRESHOLD = 0.15;
/** 入场位移起点 px 与缩放 (规格的关键帧未摘录, HX 自定). */
export const BENTO_INTRO_RISE_PX = 16;
export const BENTO_INTRO_SCALE = 0.96;
/** 点击波纹 1.1s (MagicBento.jsx:536 wave.duration). */
export const BENTO_WAVE_MS = 1100;
/** 格底色过渡 200ms ease (MagicBento.css:446). */
export const BENTO_TINT_MS = 200;
/** 光斑追指针 tau 0.05s; 光亮度升 0.12s 落 0.4s; 悬停热度升 0.14s 落 0.32s (MagicBento.jsx:696, 699, 740). */
export const BENTO_FOLLOW_S = 0.05;
export const BENTO_LIGHT_S = { rise: 0.12, fall: 0.4 } as const;
export const BENTO_HOT_S = { rise: 0.14, fall: 0.32 } as const;
/** 帧间隔上限 0.05s (MagicBento.jsx:674). */
export const BENTO_MAX_DT_S = 0.05;

export interface BentoSpan {
  readonly col?: number;
  readonly row?: number;
}

/** 容器宽下能放的列数: 不超过 columns, 每列至少 MIN_CELL. */
export function bentoColumns(width: number, columns: number, gap: number): number {
  if (width <= 0) return Math.max(1, columns);
  return clamp(Math.floor((width + gap) / (BENTO_MIN_CELL + gap)), 1, Math.max(1, columns));
}

/** 一格实际跨几列: 不超过列数, 跨两列及以上时合宽不到 MIN_PAIR 则收成一列. */
export function bentoSpan(span: number, cols: number, cellWidth: number, gap: number): number {
  const s = clamp(Math.round(span), 1, cols);
  return s > 1 && s * cellWidth + (s - 1) * gap < BENTO_MIN_PAIR ? 1 : s;
}

/** 规格的趋近写法: v += (target - v) (1 - exp(-dt / tau)), 升降用不同 tau. */
export function bentoEase(value: number, target: number, dtS: number, tau: { readonly rise: number; readonly fall: number } | number): number {
  const t = typeof tau === "number" ? tau : target > value ? tau.rise : tau.fall;
  const next = value + (target - value) * (1 - Math.exp(-Math.min(BENTO_MAX_DT_S, dtS) / Math.max(0.001, t)));
  return Math.abs(target - next) < 0.001 ? target : next;
}

/** 指针到格子矩形的最近距离换成边框光强 0..1: 在格内为 1, 离开 spotlightRadius 为 0. */
export function bentoProximity(px: number, py: number, rect: { readonly x: number; readonly y: number; readonly w: number; readonly h: number }, spotlightRadius: number): number {
  const dx = Math.max(rect.x - px, 0, px - (rect.x + rect.w));
  const dy = Math.max(rect.y - py, 0, py - (rect.y + rect.h));
  return clamp(1 - Math.hypot(dx, dy) / Math.max(1, spotlightRadius), 0, 1);
}

/** 格内指针 (相对格心的 -1..1) 乘热度给出倾斜角与吸附位移. */
export function bentoPose(nx: number, ny: number, hot: number, tilt: boolean, magnet: boolean): { readonly rx: number; readonly ry: number; readonly tx: number; readonly ty: number } {
  const x = clamp(nx, -1, 1) * hot;
  const y = clamp(ny, -1, 1) * hot;
  return {
    rx: tilt ? 0 - y * BENTO_TILT_DEG : 0,
    ry: tilt ? x * BENTO_TILT_DEG : 0,
    tx: magnet ? x * BENTO_MAGNET_PX : 0,
    ty: magnet ? y * BENTO_MAGNET_PX : 0,
  };
}

/** 点击处放一圈波纹: 直径为格子对角线两倍, 1.1s 从 0 放到满并淡出, 结束后移除. */
export function bentoRipple(cell: HTMLElement, clientX: number, clientY: number, fill: string, easing: string): void {
  if (!cell.animate) return;
  const r = cell.getBoundingClientRect();
  const size = Math.hypot(r.width, r.height) * 2;
  const dot = document.createElement("span");
  dot.setAttribute("aria-hidden", "true");
  dot.dataset.slot = "glow-bento-wave";
  dot.className = "pointer-events-none absolute rounded-full";
  Object.assign(dot.style, { left: `${clientX - r.left - size / 2}px`, top: `${clientY - r.top - size / 2}px`, width: `${size}px`, height: `${size}px`, background: fill });
  cell.appendChild(dot);
  const run = dot.animate([{ transform: "scale(0)", opacity: 1 }, { transform: "scale(1)", opacity: 0 }], { duration: BENTO_WAVE_MS, easing });
  run.onfinish = () => dot.remove();
}
