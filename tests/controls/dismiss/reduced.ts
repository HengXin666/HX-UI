/**
 * dismiss 族测试的减弱动效开关: 用一个最小 matchMedia 替身决定 useReducedMotion 的返回值.
 */
export function setReducedMotion(reduced: boolean): void {
	Object.defineProperty(window, "matchMedia", {
		configurable: true,
		writable: true,
		value: (query: string) => ({
			matches: reduced && query.includes("reduce"),
			media: query,
			onchange: null,
			addEventListener: () => undefined,
			removeEventListener: () => undefined,
			addListener: () => undefined,
			removeListener: () => undefined,
			dispatchEvent: () => false,
		}),
	});
}

/** 让 spring 从 from 积分到落定, 返回峰值与用时, 用来核对换算后的过冲和时长. */
export function simulate(
	step: (current: number, velocity: number, dtMs: number) => { current: number; velocity: number; resting: boolean },
	from: number,
	frameMs = 16,
	maxFrames = 600,
): { peak: number; ms: number } {
	let current = from;
	let velocity = 0;
	let peak = from;
	for (let i = 1; i <= maxFrames; i += 1) {
		const next = step(current, velocity, frameMs);
		current = next.current;
		velocity = next.velocity;
		peak = Math.max(peak, current);
		if (next.resting) return { peak, ms: i * frameMs };
	}
	return { peak, ms: maxFrames * frameMs };
}
