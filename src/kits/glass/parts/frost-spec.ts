/**
 * FrostPanel 的规格常数与纯函数: 位移图, 三色道位移量, 渲染方式判定, 退回滤镜.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-glass.md
 */
import { clamp } from "../../tokens";

export type FrostChannel = "R" | "G" | "B" | "A";
export type FrostRenderer = "auto" | "svg" | "fallback";
export type FrostBlend = "difference" | "normal" | "screen" | "multiply" | "overlay" | "exclusion" | "lighten" | "darken";

export const FROST_DEFAULTS = {
  width: 200,
  height: 80,
  borderRadius: 20,
  borderWidth: 0.07,
  brightness: 50,
  opacity: 0.93,
  blur: 11,
  displace: 0,
  backgroundOpacity: 0,
  saturation: 1,
  distortionScale: -180,
  redOffset: 0,
  greenOffset: 10,
  blueOffset: 20,
} as const;
/** 出现时的透明度过渡 0.26s ease-out (GlassSurface.css:7). */
export const FROST_APPEAR_MS = 260;
/** 退回滤镜: 不支持 SVG backdrop 时用模糊 blur px, 饱和 × 1.8, 提亮 1.1 (系数 HX 自定). */
export const FROST_FALLBACK_SATURATE = 1.8;
export const FROST_FALLBACK_BRIGHTNESS = 1.1;

/** 三个色道各自的位移量: distortionScale 加各自偏移 (规格 redOffset / greenOffset / blueOffset). */
export function frostScales(distortionScale: number, red: number, green: number, blue: number): readonly [number, number, number] {
  return [distortionScale + red, distortionScale + green, distortionScale + blue];
}

/**
 * 位移图 SVG: 黑底上横向红渐变与纵向蓝渐变按 blend 叠合, 中间一块圆角矩形按 brightness 与 opacity 提亮并模糊,
 * 让位移集中在边缘一圈 (宽 borderWidth × 短边 × 0.5). 颜色只用 CSS 关键字.
 */
export function frostMap(width: number, height: number, radius: number, borderWidth: number, brightness: number, opacity: number, blur: number, blend: FrostBlend): string {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const edge = Math.min(w, h) * clamp(borderWidth, 0, 0.5) * 0.5;
  const alpha = clamp(brightness / 100, 0, 1) * clamp(opacity, 0, 1);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`,
    `<defs><linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="transparent"/><stop offset="100%" stop-color="red"/></linearGradient>`,
    `<linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="transparent"/><stop offset="100%" stop-color="blue"/></linearGradient></defs>`,
    `<rect width="${w}" height="${h}" fill="black"/>`,
    `<rect width="${w}" height="${h}" rx="${radius}" fill="url(#r)"/>`,
    `<rect width="${w}" height="${h}" rx="${radius}" fill="url(#b)" style="mix-blend-mode:${blend}"/>`,
    `<rect x="${edge.toFixed(2)}" y="${edge.toFixed(2)}" width="${Math.max(0, w - edge * 2).toFixed(2)}" height="${Math.max(0, h - edge * 2).toFixed(2)}" rx="${radius}" fill="white" fill-opacity="${alpha.toFixed(3)}" style="filter:blur(${blur}px)"/>`,
    `</svg>`,
  ].join("");
}

export function frostMapUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** 浏览器能否把 SVG 滤镜用作 backdrop-filter: 要 CSS.supports 认, 且是 Chromium (Safari 与 Firefox 认语法但不渲染). */
export function svgBackdropSupported(): boolean {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function" || typeof navigator === "undefined") return false;
  if (!CSS.supports("backdrop-filter", "url(#hx)")) return false;
  const ua = navigator.userAgent;
  return /Chrome|Chromium|Edg\//.test(ua) && !/Firefox/.test(ua);
}

export function frostFallbackFilter(blur: number, saturation: number): string {
  return `blur(${blur}px) saturate(${(saturation * FROST_FALLBACK_SATURATE).toFixed(2)}) brightness(${FROST_FALLBACK_BRIGHTNESS})`;
}
