/** 平面上的一个点. 只给动效用, 不和蓝图的图坐标混用. */
export interface MotionPoint {
	readonly x: number;
	readonly y: number;
}

/** 从上一帧滑到这一帧要补的位移. 调用时元素已经在新位置上. */
export function layoutDelta(previous: MotionPoint, next: MotionPoint): MotionPoint {
	return { x: previous.x - next.x, y: previous.y - next.y };
}

/** 指针相对按下那一点的位移, 不是相对屏幕原点. */
export function gestureDelta(origin: MotionPoint, point: MotionPoint): MotionPoint {
	return { x: point.x - origin.x, y: point.y - origin.y };
}

/**
 * 滚动走了多少. 0 是起点, 1 是可滚距离走完.
 * 没有可滚距离时视为已经到底, 避免除零把进度做成 NaN.
 */
export function scrollProgress(offset: number, range: number): number {
	if (range <= 0) return 1;
	const ratio = offset / range;
	if (ratio < 0) return 0;
	if (ratio > 1) return 1;
	return ratio;
}

const PRESENCE_MS = 180;

/** 减弱动效时出场不播, 调用方应当立刻卸下. */
export function presenceDuration(reduced: boolean): number {
	return reduced ? 0 : PRESENCE_MS;
}

/** 还在的 id. 新来的没有上一帧, 不参与相对位移. */
export function retainedIds(previous: readonly string[], next: readonly string[]): string[] {
	const keep = new Set(previous);
	return next.filter((id) => keep.has(id));
}
