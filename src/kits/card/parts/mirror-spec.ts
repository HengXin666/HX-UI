/**
 * MirrorCard 的规格常数与纯函数: 入场扫光时长, 反射源淡入, 金属面渐变, 反射层滤镜, 扫光位置.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
import { clamp } from "../tokens";

export const MIRROR_DEFAULTS = { metalness: 1, roughness: 0.3, blurStrength: 6, grayscale: 1, warp: 0.6, shine: 1, bevel: 3, glare: 0.5, tiltStrength: 12 } as const;
/** 入场 1400ms; 反射源切换淡入 tau 0.35s (ReflectiveCard.jsx:38-39). */
export const MIRROR_INTRO_MS = 1400;
export const MIRROR_FADE_S = 0.35;

/** 金属面: 前景与底色按 metalness 拉开明暗的斜向渐变, 只用 token 与 color-mix. */
export function mirrorMetal(tone: string, metalness: number): string {
  const m = Math.round(clamp(metalness, 0, 1) * 18);
  const hi = `color-mix(in oklab, ${tone} ${8 + m}%, var(--card))`;
  const lo = `color-mix(in oklab, ${tone} ${2}%, var(--card))`;
  return `linear-gradient(135deg, ${hi} 0%, ${lo} 38%, ${hi} 55%, ${lo} 100%)`;
}

/** 反射层滤镜: 模糊 = blurStrength × (0.4 + roughness), 灰度 grayscale. */
export function mirrorFilter(blurStrength: number, roughness: number, grayscale: number): string {
  const blur = Math.max(0, blurStrength) * (0.4 + clamp(roughness, 0, 1));
  return `blur(${blur.toFixed(1)}px) grayscale(${clamp(grayscale, 0, 1)}) contrast(1.1)`;
}

/** 扫光横向位置 %: 入场 t (0..1) 从 -30% 扫到 130%; 之后随倾斜 ry 摆动 (warp 放大摆幅). */
export function mirrorSheen(introT: number, ry: number, tilt: number, warp: number): number {
  if (introT < 1) return -30 + clamp(introT, 0, 1) * 160;
  return 50 + (ry / Math.max(1, tilt)) * 40 * (0.5 + clamp(warp, 0, 2));
}
