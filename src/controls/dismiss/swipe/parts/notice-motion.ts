// FlickNotice 的逐帧计算: 卡片纵向弹簧 (甩出或回弹), 甩出后的淡出进度, 引信剩余比例.
import { springFromFeel, stepAxis, type Axis } from "../../feel";
import { NOTICE } from "../../tokens";

/** 纵向弹簧一步. 拖动中不动; 甩出走无回弹的快弹簧, 否则按 settleBounce 回弹. 返回是否仍在动. */
export function stepNoticeY(y: Axis, throwing: boolean, dragging: boolean, settleBounce: number, dt: number): boolean {
	if (dragging || !(throwing || y.current !== y.target || y.velocity !== 0)) return false;
	const spec = throwing ? springFromFeel(NOTICE.throwDurationS, 0) : springFromFeel(NOTICE.settleDurationS, settleBounce);
	return !stepAxis(y, spec, dt).resting;
}

/** 甩出淡出时的不透明度, 从 1 线性降到 0. */
export function noticeFadeOpacity(start: number, now: number): number {
	return Math.max(0, 1 - (now - start) / NOTICE.fadeMs);
}

/** 引信剩余比例, 0 到 1. */
export function fuseLeft(elapsed: number, duration: number): number {
	return Math.max(0, 1 - elapsed / duration);
}
