// DrawerRow 行面的运动状态机: 静止, 开合弹簧, 整行划走的定时补间. 每帧推进一次.
import { snapAxis, springFromFeel, stepAxis, tween, type Axis } from "../../feel";
import { ROW } from "../../tokens";

const SPRING = "spring";

export type DrawerMotion =
	| { kind: "idle" }
	| { kind: "spring"; open: boolean; bounce: number; duration: number }
	| { kind: "tween"; from: number; to: number; start: number; done: () => void };

export const DRAWER_IDLE: DrawerMotion = { kind: "idle" };

/** 开或合的弹簧: 打开带 snapBounce 回弹, 合上用规格的收拢手感. */
export function drawerSpring(open: boolean, snapBounce: number): DrawerMotion {
	return open
		? { kind: SPRING, open: true, bounce: snapBounce, duration: ROW.openDurationS }
		: { kind: SPRING, open: false, bounce: ROW.closeBounce, duration: ROW.closeDurationS };
}

/**
 * 推进一帧, 把位置写回 x 并交给 paint. 返回下一帧要用的状态与是否继续;
 * 补间走完时调用它的 done.
 */
export function stepDrawerMotion(m: DrawerMotion, x: Axis, dt: number, now: number, paint: (value: number) => void): { next: DrawerMotion; running: boolean } {
	if (m.kind === "tween") {
		const value = tween(m.from, m.to, now - m.start, ROW.commitTweenMs);
		snapAxis(x, value);
		paint(value);
		if (now - m.start < ROW.commitTweenMs) return { next: m, running: true };
		m.done();
		return { next: DRAWER_IDLE, running: false };
	}
	if (m.kind !== SPRING) return { next: m, running: false };
	const step = stepAxis(x, springFromFeel(m.duration, m.bounce), dt);
	paint(step.current);
	return step.resting ? { next: DRAWER_IDLE, running: false } : { next: m, running: true };
}
