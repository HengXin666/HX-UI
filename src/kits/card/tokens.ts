/**
 * 卡片族 (src/kits/card) 共用的名字. 叠放族已有的动值循环, 弹簧换算, 过渡串与语义色在这里转出,
 * 本族补规格反复出现的指数跟随写法 (帧间隔上限 0.05s) 与指针到卡面的归一化坐标.
 * 收口时与导航族, 画廊族, 叠放族, 玻璃族一起并进 src/motion.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
export { KIT_FOCUS, MS_PER_S, TAU, clamp, kitTone, omegaSpring, smoothstep, transitionOf, useKitMotion, type KitMotion, type KitTone } from "../stack/tokens";

/** 规格各件的帧间隔上限 0.05s. */
export const CARD_MAX_DT_S = 0.05;
/** 跟随收敛到这个差值以内就落定. */
export const CARD_SNAP = 0.001;

/** 规格的趋近写法 v += (target - v) (1 - exp(-dt / tau)); tau 可按升降分开. dt 钳到上限. */
export function follow(value: number, target: number, dtS: number, tau: number | { readonly rise: number; readonly fall: number }): number {
  const t = typeof tau === "number" ? tau : target > value ? tau.rise : tau.fall;
  if (t <= 0) return target;
  const next = value + (target - value) * (1 - Math.exp(-Math.min(CARD_MAX_DT_S, Math.max(0, dtS)) / t));
  return Math.abs(target - next) < CARD_SNAP ? target : next;
}

export interface CardPoint {
  /** 卡内 px. */
  readonly x: number;
  readonly y: number;
  /** 相对卡心 -1..1 (卡外超出 1). */
  readonly nx: number;
  readonly ny: number;
  /** 指针离卡矩形的最近距离 px, 卡内为 0. */
  readonly out: number;
}

/** 视口坐标换成卡面坐标. */
export function cardPoint(box: { readonly left: number; readonly top: number; readonly width: number; readonly height: number }, clientX: number, clientY: number): CardPoint {
  const x = clientX - box.left;
  const y = clientY - box.top;
  const dx = Math.max(0 - x, 0, x - box.width);
  const dy = Math.max(0 - y, 0, y - box.height);
  return {
    x,
    y,
    nx: box.width > 0 ? (x / box.width) * 2 - 1 : 0,
    ny: box.height > 0 ? (y / box.height) * 2 - 1 : 0,
    out: Math.hypot(dx, dy),
  };
}
