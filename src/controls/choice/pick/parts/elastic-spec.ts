/** ElasticSegment 的规格常数, 尺寸档与纯数学: 时长缩放, 松手速度, 越界阻尼, 拇指拉伸上限. */

const SLOP_PX = 10;
/** 三根规格弹簧 (秒 + bounce): 常规滑动, 甩动后的惯性滑动, 尾边回弹. */
export const ELASTIC_SPRING_UI = { duration: 0.3, bounce: 0 } as const;
export const ELASTIC_SPRING_MOMENTUM = { duration: 0.4, bounce: 0.2 } as const;
export const ELASTIC_SPRING_RELAX = { duration: 0.16, bounce: 0 } as const;
/** 拉伸上限: 头尾两边拉开的额外长度不超过轨道宽的 19%. */
export const ELASTIC_DILATE = 0.19;
/** 尾边比头边晚起步 0.15 秒 (再按 speed 与 stretch 缩放). */
export const ELASTIC_HANDOFF = 0.15;
/** 松手速度超过 110 px/s 视为甩动. */
export const ELASTIC_FLICK = 110;
export const ELASTIC_MAX_VELOCITY = 2000;
/** 速度采样忽略 4px 以内的抖动. */
export const ELASTIC_DEADZONE = 4;
/** 位移超过 10px 才算拖动. */
export const ELASTIC_SLOP = SLOP_PX;
/** 越过轨道两端时只跟 55%. */
export const ELASTIC_RUBBER = 0.55;
/** 规格里的 CSS 过渡. */
export const ELASTIC_MS = { label: 160 } as const;
/** 尺寸档: [高, 字号, 横向内边距]. 规格未列数值, 与 GelRadio 同档. */
export const ELASTIC_SIZES = { sm: [28, 12, SLOP_PX], md: [34, 13, 14], lg: [42, 14, 18] } as const;
/** stretch / glide 是百分比. */
export const ELASTIC_PERCENT = 100;
const HALF = 2;

export type ElasticSize = keyof typeof ELASTIC_SIZES;

export interface ElasticItem {
	readonly value: string;
	readonly label: string;
	readonly disabled?: boolean;
}

/** 一个槽位的左右边 (相对轨道). */
export interface ElasticSlot {
	readonly left: number;
	readonly right: number;
}

/** speed 倍率下的时长. speed 2 时快一倍. */
export function elasticTime(seconds: number, speed: number): number {
	return seconds / Math.max(speed, Number.EPSILON);
}

/** 松手速度: 钳在 +-2000, 绝对值超过 110 即甩动. */
export function elasticRelease(velocity: number): { velocity: number; flick: boolean } {
	const v = Math.max(-ELASTIC_MAX_VELOCITY, Math.min(ELASTIC_MAX_VELOCITY, velocity));
	return { velocity: v, flick: Math.abs(v) > ELASTIC_FLICK };
}

/** 越界部分按 0.55 跟随. */
export function elasticRubber(position: number, min: number, max: number): number {
	if (position < min) return min - (min - position) * ELASTIC_RUBBER;
	if (position > max) return max + (position - max) * ELASTIC_RUBBER;
	return position;
}

/** 拇指绘制框: 头尾两边拉开超过上限时, 以中心为准收回到上限宽. */
export function elasticThumbBox(edgeA: number, edgeB: number, natural: number, trackWidth: number, stretch: number): { left: number; width: number } {
	const cap = natural + ELASTIC_DILATE * trackWidth * (stretch / ELASTIC_PERCENT);
	let left = Math.min(edgeA, edgeB);
	let width = Math.abs(edgeB - edgeA);
	if (trackWidth > 0 && width > cap) {
		left += (width - cap) / HALF;
		width = cap;
	}
	return { left, width };
}
