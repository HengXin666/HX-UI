/** StepTrail 的规格常数与纯数学: 各段时长, 曲线, 指示点状态, 连线填充比例, 三根弹簧. */
import type { SpringSpec } from "../../../../craft/spring";
import { cssCurve } from "../../../../motion/curves";
import { springFromDuration } from "../../../../motion/spring/fit";
import { CHOICE_FIT } from "../../tone";

/** 规格的两条曲线: 指示点放大的带过冲曲线, 与出场落定曲线. */
export const TRAIL_EASE_SPRING = cssCurve("backOutSoft");
export const TRAIL_EASE_SETTLE = cssCurve("outQuint");
/** 规格里的 CSS 时长 (ms). */
export const TRAIL_MS = {
	/** 连线底色. */
	track: 200,
	/** 按钮底色, 描边, 文字. */
	button: 150,
	/** 指示点文字色. */
	label: 200,
	/** 指示点底色. */
	dot: 250,
	/** 指示点缩放. */
	dotScale: 450,
	/** 勾的描画. */
	check: 200,
} as const;
/**
 * 规格用时间轴跑的三段改成可中断弹簧, 时长取规格值 (秒):
 * 连线填充 560ms 带回弹, 内容高度 480ms, 内容滑入 360ms.
 * 规格的 (0.34, 1.4) 曲线约 10% 过冲, 对应 bounce 0.15.
 */
export const TRAIL_SPRING_S = { fill: 0.56, height: 0.48, slide: 0.36 } as const;
export const TRAIL_BOUNCE = { fill: 0.15, height: 0, slide: 0 } as const;
/** 换步时新内容从这么远的水平位移滑入 (px). */
export const TRAIL_SLIDE_PX = 48;
/** 当前指示点的放大量. */
export const TRAIL_ACTIVE_SCALE = 1.12;
export const TRAIL_DEFAULTS = { initialStep: 1, dot: 32 } as const;

export type TrailState = "complete" | "active" | "idle";

/** 第 i 个 (从 1 数) 指示点在当前步 step 下的状态. step 超过总数即全部完成. */
export function trailState(i: number, step: number): TrailState {
	if (i < step) return "complete";
	return i === step ? "active" : "idle";
}

/** 第 i 段连线 (连接第 i 与 i + 1 点, 从 1 数) 在连续进度 progress 下的填充比例. progress = step - 1. */
export function trailFill(i: number, progress: number): number {
	return Math.min(1, Math.max(0, progress - (i - 1)));
}

/** 钳到 [1, count + 1]; count + 1 表示全部完成. */
export function trailClamp(step: number, count: number): number {
	return Math.min(count + 1, Math.max(1, Math.round(step)));
}

function fit(key: keyof typeof TRAIL_SPRING_S): SpringSpec {
	return springFromDuration(TRAIL_SPRING_S[key], TRAIL_BOUNCE[key], { envelope: CHOICE_FIT.envelope, minDurationS: CHOICE_FIT.minDurationS });
}

export const TRAIL_SPRINGS = { fill: fit("fill"), height: fit("height"), slide: fit("slide") } as const;
