import { clamp } from "../motion";

export const PERCENT = 100;
/** PageUp / PageDown 一次走的步数, 与 primitives/slider 一致. */
export const PAGE_STEPS = 10;

export const KEY = {
	left: "ArrowLeft",
	right: "ArrowRight",
	up: "ArrowUp",
	down: "ArrowDown",
	home: "Home",
	end: "End",
	pageUp: "PageUp",
	pageDown: "PageDown",
	enter: "Enter",
	escape: "Escape",
	backspace: "Backspace",
} as const;

/**
 * 取值件共用的 APG slider 键位: 方向键一步, PageUp / PageDown 十步, Home / End 到端点.
 * 不认识的键返回 undefined, 调用方据此决定是否 preventDefault.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-range.md
 */
export function keyStep(key: string, current: number, min: number, max: number, step: number, multiplier = 1): number | undefined {
	const unit = step * multiplier;
	switch (key) {
		case KEY.left:
		case KEY.down:
			return clamp(current - unit, min, max);
		case KEY.right:
		case KEY.up:
			return clamp(current + unit, min, max);
		case KEY.pageDown:
			return clamp(current - unit * PAGE_STEPS, min, max);
		case KEY.pageUp:
			return clamp(current + unit * PAGE_STEPS, min, max);
		case KEY.home:
			return min;
		case KEY.end:
			return max;
		default:
			return undefined;
	}
}
