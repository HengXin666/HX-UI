/**
 * range 族测试共用: 把 prefers-reduced-motion 打开或关掉, 以及用 stepSpring 模拟一段弹簧取峰值.
 */
import { vi } from "vitest";
import type { SpringSpec } from "@src/craft/spring";
import { RANGE_DT_CAP_MS } from "@src/controls/range/tokens";
import { stepSpringExact } from "@src/motion";

/** range 族的解析步进: 帧长上限 RANGE_DT_CAP_MS. */
const stepSpringFine = (current: number, velocity: number, target: number, spring: SpringSpec, dtMs: number) => stepSpringExact(current, velocity, target, spring, dtMs, RANGE_DT_CAP_MS);

const REDUCED = "(prefers-reduced-motion: reduce)";

export function mockReducedMotion(on: boolean): void {
	vi.spyOn(window, "matchMedia").mockImplementation(
		(query: string) =>
			({
				matches: on && query === REDUCED,
				media: query,
				onchange: null,
				addListener: () => {},
				removeListener: () => {},
				addEventListener: () => {},
				removeEventListener: () => {},
				dispatchEvent: () => false,
			}) as unknown as MediaQueryList,
	);
}

/** 从 0 弹到 1, 返回峰值和落到 1% 内所用的毫秒. */
export function simulate(spring: SpringSpec, frameMs = 16, limitMs = 3000): { peak: number; settleMs: number } {
	let x = 0;
	let v = 0;
	let peak = 0;
	let settleMs = limitMs;
	for (let t = 0; t < limitMs; t += frameMs) {
		const s = stepSpringFine(x, v, 1, spring, frameMs);
		x = s.current;
		v = s.velocity;
		peak = Math.max(peak, x);
		if (settleMs === limitMs && Math.abs(1 - x) < 0.01 && Math.abs(v) < 0.05) settleMs = t + frameMs;
	}
	return { peak, settleMs };
}
