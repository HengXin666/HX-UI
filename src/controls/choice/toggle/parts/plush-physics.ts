/** PlushSwitch 的手感常数与纯计算: 位置弹簧, 速度到拉伸的换算, 拇指绘制几何. */

/** 位置跟随弹簧在 stretch 轴上的手感 (规格 FLOW_SPRING). */
export const PLUSH_FLOW_SPRING = { stiffness: 320, damping: 40, mass: 0.6 } as const;
/** 按下与悬停的鼓起弹簧 (规格 SWELL_SPRING). */
export const PLUSH_SWELL_SPRING = { stiffness: 520, damping: 34, mass: 0.6 } as const;
/** 拇指最多拉长自身宽度的 40%. */
export const PLUSH_MAX_STRETCH = 0.4;
/** 速度到这个 px/s 时拉伸取满. */
export const PLUSH_STRETCH_SPEED = 600;
/** 判定为拖动而不是轻点的位移, 细指针 4px, 触屏 8px. */
export const PLUSH_TAP_SLOP = { fine: 4, coarse: 8 } as const;
/** 拇指与轨道的留白. 规格未给, 取 4px 让 76x38 的默认尺寸里拇指为 30px. */
export const PLUSH_THUMB_INSET = 4;
/** 位置弹簧: 刚度 170 - (50 - speed) * 1.1, 阻尼 21.5, 质量 0.9. speed 钳在 0 到 100. */
const SPEED_PIVOT = 50;
const SPEED_MAX = 100;
const SPEED_GAIN = 1.1;
const BASE_STIFFNESS = 170;
const POSITION_DAMPING = 21.5;
const POSITION_MASS = 0.9;
const PERCENT = 100;
const HALF = 2;

/** speed (0 到 100) 换成位置弹簧. 50 时刚度 170. */
export function plushPositionSpring(speed: number): { stiffness: number; damping: number; mass: number } {
	const clamped = Math.min(SPEED_MAX, Math.max(0, speed));
	return { stiffness: BASE_STIFFNESS - (SPEED_PIVOT - clamped) * SPEED_GAIN, damping: POSITION_DAMPING, mass: POSITION_MASS };
}

/** 速度换成拉伸比例: stretch 是满速时拉长的百分比, 总量不超过 MAX_STRETCH. */
export function plushStretchFor(velocity: number, stretch: number): number {
	const ratio = Math.min(1, Math.abs(velocity) / PLUSH_STRETCH_SPEED);
	return Math.min(PLUSH_MAX_STRETCH, (stretch / PERCENT) * ratio);
}

/** 轨道尺寸换成拇指直径与可走行程. */
export function plushTrack(width: number, height: number): { thumb: number; travel: number } {
	const thumb = height - PLUSH_THUMB_INSET * HALF;
	return { thumb, travel: Math.max(0, width - thumb - PLUSH_THUMB_INSET * HALF) };
}

/** 拇指绘制框: 拉伸 s 时变宽, 向右移动时尾端向后拖, 始终留在轨道内. */
export function plushThumbBox(x: number, s: number, velocity: number, thumb: number, width: number): { left: number; width: number } {
	const thumbWidth = thumb * (1 + s);
	const trailing = velocity > 0 ? thumb * s : 0;
	const left = Math.min(width - PLUSH_THUMB_INSET - thumbWidth, Math.max(PLUSH_THUMB_INSET, PLUSH_THUMB_INSET + x - trailing));
	return { left, width: thumbWidth };
}
