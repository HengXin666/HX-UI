/**
 * FoilCard 的规格常数与纯函数: 卡比例, 透视, 彩虹色带, 箔面图案遮罩, 闲置漂移.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
import { TAU } from "../tokens";

export const FOIL_DEFAULTS = { intensity: 0.85, scale: 1, edgeSparkle: 0.8, frame: 4, glare: 0.5, width: 320, radius: 14, tiltMax: 14, hoverScale: 1.04 } as const;
/** 透视 1100px, 卡比例 63:88 (HoloCard.jsx:8-9). */
export const FOIL_PERSPECTIVE = 1100;
export const FOIL_RATIO = 63 / 88;
/** 显隐过渡 0.3s ease (HoloCard.css:76). */
export const FOIL_FADE_MS = 300;
/** 闲置漂移: 幅度 tiltMax 的 0.3, 周期 7s (规格只写 idle, 数值 HX 自定). */
export const FOIL_IDLE_AMP = 0.3;
export const FOIL_IDLE_PERIOD_S = 7;

/**
 * 彩虹色带: 规格着色器的光谱 (HoloCard.jsx:60-64) 改用主题的光谱阶梯令牌 --spectrum-1..6 (src/tokens.css),
 * 亮暗两套各自给值, 皮肤可覆盖; 这里只引用变量.
 */
export const FOIL_SPECTRUM = ["var(--spectrum-1)", "var(--spectrum-2)", "var(--spectrum-3)", "var(--spectrum-4)", "var(--spectrum-5)", "var(--spectrum-6)"] as const;

export function foilRainbow(angleDeg: number): string {
  const list = [...FOIL_SPECTRUM, FOIL_SPECTRUM[0]];
  return `linear-gradient(${angleDeg}deg, ${list.map((c, i) => `${c} ${((i / (list.length - 1)) * 100).toFixed(1)}%`).join(", ")})`;
}

export type FoilPreset = "bursts" | "dots" | "etch" | "rings" | "rays" | "plain";

/** 箔面图案, 作遮罩用: 黑为显, 透明为隐. scale 放大图案格距. */
export function foilPattern(preset: FoilPreset, scale: number): string {
  const k = Math.max(0.25, scale);
  switch (preset) {
    case "bursts":
      return `repeating-conic-gradient(from 0deg at 50% 50%, black 0deg ${(4 * k).toFixed(1)}deg, transparent ${(4 * k).toFixed(1)}deg ${(9 * k).toFixed(1)}deg)`;
    case "dots":
      return `radial-gradient(circle, black ${(1.6 * k).toFixed(1)}px, transparent ${(2.4 * k).toFixed(1)}px) 0 0 / ${(9 * k).toFixed(1)}px ${(9 * k).toFixed(1)}px`;
    case "etch":
      return `repeating-linear-gradient(60deg, black 0 ${(1 * k).toFixed(1)}px, transparent ${(1 * k).toFixed(1)}px ${(3 * k).toFixed(1)}px)`;
    case "rings":
      return `repeating-radial-gradient(circle at 50% 50%, black 0 ${(2 * k).toFixed(1)}px, transparent ${(2 * k).toFixed(1)}px ${(7 * k).toFixed(1)}px)`;
    case "rays":
      return `repeating-conic-gradient(from 0deg at 50% 120%, black 0deg ${(1.5 * k).toFixed(1)}deg, transparent ${(1.5 * k).toFixed(1)}deg ${(6 * k).toFixed(1)}deg)`;
    default:
      return "linear-gradient(black, black)";
  }
}

/** 闲置漂移的倾斜目标 (李萨如, x 与 y 频率比 1 : 1.5). */
export function foilIdle(tS: number, tiltMax: number): { readonly rx: number; readonly ry: number } {
  const a = tiltMax * FOIL_IDLE_AMP;
  const w = TAU / FOIL_IDLE_PERIOD_S;
  return { rx: a * Math.sin(w * tS * 1.5), ry: a * Math.sin(w * tS) };
}

/** 倾斜角 (度) 换成色带横移 0..100%: 倾到 tiltMax 时到一端. */
export function foilShift(ry: number, rx: number, tiltMax: number): { readonly x: number; readonly y: number } {
  const m = Math.max(1, tiltMax);
  return { x: 50 + (ry / m) * 50, y: 50 - (rx / m) * 50 };
}
