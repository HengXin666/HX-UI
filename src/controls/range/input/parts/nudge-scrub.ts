// NudgeField 的拖动换算: 尺寸档与手感常数, 修饰键倍率, 拖动像素到数值, 越界橡皮筋.
/** 回弹弹簧: 规格 { duration: 0.3, bounce: 0 }, 时长由 returnDuration 覆盖. */
export const NUDGE_RETURN_BOUNCE = 0;
/** 拖动时标签朝拖动方向倾的像素. */
export const NUDGE_LEAN_PX = 4;
/** 三档尺寸: 高度与字号 (px). 规格只给档名, 数值取库里输入框的 sm / default / lg 高度. */
export const NUDGE_SIZES = {
	sm: { height: 28, font: 12 },
	md: { height: 32, font: 13 },
	lg: { height: 36, font: 14 },
} as const;
/** 增量提示的淡入与缩放时长 (规格 125ms, ease-out). */
export const NUDGE_DELTA_MS = 125;

export type NudgeSize = keyof typeof NUDGE_SIZES;

/** 越界像素经橡皮筋后的视觉位移, 渐近 reach. */
export function rubberOffset(overflowPx: number, reach: number): number {
	if (reach <= 0) return 0;
	return Math.sign(overflowPx) * reach * (1 - Math.exp(-Math.abs(overflowPx) / reach));
}

/** 修饰键倍率: Shift 粗调, Alt 细调. */
export function nudgeMultiplier(shift: boolean, alt: boolean, coarse: number, fine: number): number {
	if (shift) return coarse;
	if (alt) return fine;
	return 1;
}

/** 拖动 dx 像素后的原始值 (未钳), 以及超出 min / max 的部分折回的像素. */
export function scrubTo(start: number, dx: number, perStepPx: number, step: number, mult: number, min: number, max: number): { raw: number; overflowPx: number } {
	const raw = start + (dx / perStepPx) * step * mult;
	const overflow = raw > max ? raw - max : raw < min ? raw - min : 0;
	return { raw, overflowPx: (overflow / (step * mult)) * perStepPx };
}
