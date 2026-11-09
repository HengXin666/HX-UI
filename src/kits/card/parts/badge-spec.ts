/**
 * BadgeCard 的规格常数与纯函数: 倾斜弹簧, 光感跟随, 全息层与视差位移.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
import { clamp } from "../tokens";

export const BADGE_DEFAULTS = { radius: 16, holo: 0.8, glare: 0.5, tiltStrength: 12, parallax: 8 } as const;
/** 光感 (指针在卡上的程度) 跟随 tau: 亮 0.12s, 暗 0.4s (规格 tau 未摘录, HX 自定). */
export const BADGE_LIGHT_S = { rise: 0.12, fall: 0.4 } as const;
/** 入场: 光从左扫到右再回中, 每段 0.6s (规格只写 intro, 时长 HX 自定). */
export const BADGE_INTRO_LEG_S = 0.6;
/** 按下时压暗, 滤镜过渡 0.2s ease (ProfileCard.css:318). */
export const BADGE_PRESS_MS = 200;

/** 全息层: 语义色序列铺成随指针平移的斜向彩带. 位置用 var(--px). */
export function badgeHolo(colors: readonly string[]): string {
  const list = colors.length ? colors : ["currentColor"];
  const band = [...list, list[0]].map((c, i, all) => `${c} ${((i / (all.length - 1)) * 100).toFixed(0)}%`).join(", ");
  return `linear-gradient(115deg, ${band})`;
}

/** 视差: 头像逆着指针移 parallax px. */
export function badgeParallax(nx: number, ny: number, parallax: number): { readonly x: number; readonly y: number } {
  return { x: 0 - clamp(nx, -1, 1) * parallax, y: 0 - clamp(ny, -1, 1) * parallax };
}

/** 入场扫光: 0..legS 从 0 到 1, 再 legS..2legS 回到 0.5. 返回光心横向 0..1. */
export function badgeIntro(tS: number, legS: number = BADGE_INTRO_LEG_S): number {
  if (tS <= 0) return 0;
  if (tS < legS) return tS / legS;
  return tS < 2 * legS ? 1 - ((tS - legS) / legS) * 0.5 : 0.5;
}
