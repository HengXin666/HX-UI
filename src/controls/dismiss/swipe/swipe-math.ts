import { clamp, projectFlick, resist, rubber } from "../feel";
import { NOTICE, ROW } from "../tokens";

export type RowDirection = "left" | "right";
export type RowRelease = "open" | "close" | "commit";

/** 抽屉在哪一侧: 左划露出右侧动作, 位移为负. */
export function rowSign(direction: RowDirection): number {
	return direction === "left" ? -1 : 1;
}

/**
 * 拖动中的行位移 (沿露出方向取正). 抽屉宽度之内跟手, 超出部分按 resistance 收缩;
 * fullSwipe 关掉时超出部分还要再压一次, 只给一点弹性.
 */
export function rowDrag(raw: number, drawer: number, resistance: number, fullSwipe: boolean): number {
	if (raw < 0) return -rubber(-raw, drawer * (1 - resistance));
	const pulled = resist(raw, drawer, resistance);
	return fullSwipe ? pulled : resist(pulled, drawer, resistance * resistance);
}

/**
 * 松手判定. 速度先钳到 VMAX, 再按 DECEL 投射惯性终点:
 * fullSwipe 且终点越过行宽的 commitAt 直接整行划走; 速度过 FLICK 按方向开合; 否则看过没过抽屉一半.
 */
export function rowRelease(
	offset: number,
	velocity: number,
	drawer: number,
	rowWidth: number,
	options: { commitAt: number; fullSwipe: boolean },
): RowRelease {
	const v = clamp(velocity, -ROW.maxVelocityPxS, ROW.maxVelocityPxS);
	const landing = projectFlick(offset, v, ROW.decel);
	if (options.fullSwipe && rowWidth > 0 && landing >= rowWidth * options.commitAt) return "commit";
	if (Math.abs(v) > ROW.flickPxS) return v > 0 ? "open" : "close";
	return offset > drawer / 2 ? "open" : "close";
}

/** 通知拖动: 往下跟手, 往上按 RESIST_PX 渐近收住. 死区内不算拖动. */
export function noticeDrag(dy: number): number {
	if (dy >= 0) return dy;
	return -rubber(-dy, NOTICE.resistPx);
}

export function noticeStarted(dx: number, dy: number): boolean {
	return Math.hypot(dx, dy) > NOTICE.deadZonePx;
}

/** 下划过 swipeDistance 或速度过 FLICK (px/ms) 即划走. */
export function noticeDismissed(dy: number, velocityPxS: number, swipeDistance: number): boolean {
	return dy > swipeDistance || velocityPxS / 1000 > NOTICE.flickPxMs;
}

/** 离场与入场的 CSS 时长, 都相对 slideMs. */
export function noticeTimings(slideMs: number): { enter: number; enterFade: number; exit: number; exitFade: number } {
	return {
		enter: slideMs,
		enterFade: slideMs * NOTICE.enterOpacityRatio,
		exit: slideMs * NOTICE.exitRatio,
		exitFade: slideMs * NOTICE.exitOpacityRatio,
	};
}
