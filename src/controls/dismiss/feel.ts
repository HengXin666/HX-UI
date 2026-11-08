import { ease } from "../../craft/ease";

/**
 * dismiss 族的手势手感: 定时补间, 惯性投射, 越界阻力, 平滑阶跃与松手速度. 弹簧换算, 轴与帧循环在 src/motion.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-dismiss.md
 */
const MS_PER_S = 1000;
const SMOOTH_A = 3;
const SMOOTH_B = 2;
/** 速度样本至少留两个, 再按时间窗裁. */
const MIN_SAMPLES = 2;
const SAMPLE_WINDOW_MS = 100;

/**
 * ENGINE-GAP: craft/ease 只收具名曲线, 族规格的 0.23, 1, 0.32, 1 没有注册. JS 补间用最接近的 "out" 曲线,
 * CSS 过渡仍写原曲线 (见 tokens.ts 的 DISMISS_EASE_OUT).
 */
export function tween(from: number, to: number, elapsedMs: number, durationMs: number): number {
	if (durationMs <= 0) return to;
	return from + (to - from) * ease("out", elapsedMs / durationMs);
}

/** 按每毫秒衰减率投射惯性终点: v * decel / (1 - decel), v 为 px/s. */
export function projectFlick(position: number, velocity: number, decel: number): number {
	return position + ((velocity / MS_PER_S) * decel) / (1 - decel);
}

/** 越界部分按阻力收缩. resistance 0 不可越界, 1 不收缩. */
export function resist(value: number, limit: number, resistance: number): number {
	const magnitude = Math.abs(value);
	if (magnitude <= limit) return value;
	return Math.sign(value) * (limit + (magnitude - limit) * resistance);
}

/** 渐近阻力: 越拉越重, 永远不超过 cap. */
export function rubber(distance: number, cap: number): number {
	if (cap <= 0) return 0;
	return (cap * distance) / (cap + Math.abs(distance));
}

export function clamp(value: number, lo: number, hi: number): number {
	return Math.min(hi, Math.max(lo, value));
}

/** 0 到 1 的平滑阶跃, 和着色器里的 smoothstep 同义. */
export function smoothstep(value: number, edge0: number, edge1: number): number {
	const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
	return t * t * (SMOOTH_A - SMOOTH_B * t);
}

/** ENGINE-GAP: gesture.ts 只给位移不给速度. 这里保留最近 100ms 的样本求 px/s. */
export class VelocityTracker {
	private samples: Array<{ t: number; x: number; y: number }> = [];

	reset(): void {
		this.samples = [];
	}

	push(t: number, x: number, y: number): void {
		this.samples.push({ t, x, y });
		while (this.samples.length > MIN_SAMPLES && t - this.samples[0].t > SAMPLE_WINDOW_MS) this.samples.shift();
	}

	velocity(): { x: number; y: number } {
		const first = this.samples[0];
		const last = this.samples[this.samples.length - 1];
		if (!first || !last || last.t <= first.t) return { x: 0, y: 0 };
		const dt = (last.t - first.t) / MS_PER_S;
		return { x: (last.x - first.x) / dt, y: (last.y - first.y) / dt };
	}
}
