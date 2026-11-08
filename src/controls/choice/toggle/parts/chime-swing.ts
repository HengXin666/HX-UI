/** ChimeToggle 摆动的纯计算: 衰减摆动关键帧, 段落时间轴扭曲, 读当前旋转角. */
import { DEG, SPEC_EASE_SEGMENT } from "../../tone";
import { CHIME_WARP } from "./chime-spec";

const ROTATE = "rotate(";
const CLOSE = ")";
const HALF = 2;
const BACK = -1;
const DEG_PER_PI = 180;

/** 第 k 段在整段时间里的落点, 0 到 1. */
export function chimePassOffset(k: number, passes: number): number {
	if (passes <= 0) return 1;
	return Math.pow(Math.min(1, Math.max(0, k / passes)), CHIME_WARP);
}

/**
 * 摆动关键帧: 从当前角度起, 左右交替, 第 k 次振幅按 (1 - (k-1)/n)^decay 衰减, 最后回到 0.
 * from 让中途重按时从当前角度接上, 不跳回 0.
 */
export function chimeFrames(from: number, amplitude: number, passes: number, decay: number): Keyframe[] {
	const total = passes + 1;
	const frames: Keyframe[] = [{ transform: ROTATE + from + DEG + CLOSE, offset: 0, easing: SPEC_EASE_SEGMENT }];
	for (let k = 1; k <= passes; k += 1) {
		const sign = k % HALF === 1 ? 1 : BACK;
		const angle = sign * amplitude * Math.pow(1 - (k - 1) / passes, decay);
		frames.push({ transform: ROTATE + angle.toFixed(HALF) + DEG + CLOSE, offset: chimePassOffset(k, total), easing: SPEC_EASE_SEGMENT });
	}
	frames.push({ transform: ROTATE + 0 + DEG + CLOSE, offset: 1 });
	return frames;
}

/** 读元素当前旋转角 (度), 用于中途接上. */
export function currentAngle(el: Element): number {
	const raw = getComputedStyle(el).transform;
	const match = /matrix\(([^)]+)\)/.exec(raw ?? "");
	if (!match) return 0;
	const [a, b] = match[1].split(",").map(Number);
	return (Math.atan2(b, a) * DEG_PER_PI) / Math.PI;
}
