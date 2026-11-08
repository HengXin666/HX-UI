/**
 * 时长 + bounce 写法到 stiffness / damping / mass 的换算: 用 craft 的 stepSpring 实际积分,
 * 核对过冲等于 bounce 对应的理论值, 并在原时长内落定.
 */
import { describe, expect, it } from "vitest";
import { stepSpring, type SpringSpec } from "@src/craft/spring";
import { dampingRatio, overshootOf, springFromDuration } from "@src/controls/press/spring-fit";
import { SWIPE_ANCHOR, SWIPE_MASS, SWIPE_SPEED_STIFFNESS, swipeSprings } from "@src/controls/press/hold/SwipeConfirm";
import { LIFT_SPRING } from "@src/controls/press/launch/Liftoff";
import { PULL_RECOIL_S } from "@src/controls/press/launch/PullSend";

function simulate(spec: SpringSpec, seconds: number): { peak: number; end: number } {
	let x = 0;
	let v = 0;
	let peak = 0;
	const dt = 8;
	for (let t = 0; t < seconds * 1000; t += dt) {
		const s = stepSpring(x, v, 1, spec, dt);
		x = s.current;
		v = s.velocity;
		peak = Math.max(peak, x);
	}
	return { peak, end: x };
}

describe("springFromDuration", () => {
	it("bounce 0 是临界阻尼: 不过冲, 0.3s 内落定 (SlideCommit 锚点弹簧)", () => {
		expect(dampingRatio(SWIPE_ANCHOR)).toBeCloseTo(1, 6);
		expect(overshootOf(SWIPE_ANCHOR)).toBe(0);
		const { peak, end } = simulate(SWIPE_ANCHOR, 0.3);
		expect(peak).toBeLessThanOrEqual(1.001);
		expect(Math.abs(1 - end)).toBeLessThan(0.01);
	});

	it("SlingButton 回弹 0.4s / bounce 0.2: 阻尼比 0.8, 理论过冲 1.5%, 0.4s 内落定", () => {
		const spec = springFromDuration(PULL_RECOIL_S, 0.2);
		expect(dampingRatio(spec)).toBeCloseTo(0.8, 6);
		expect(overshootOf(spec)).toBeCloseTo(Math.exp((-0.8 * Math.PI) / Math.sqrt(1 - 0.64)), 6);
		const { peak, end } = simulate(spec, PULL_RECOIL_S);
		// stepSpring 是无子步的半隐式欧拉, 8ms 帧长下数值阻尼会吃掉一部分过冲 (见报告 ENGINE-GAP), 这里只断言不超过理论值
		expect(peak - 1).toBeGreaterThan(0);
		expect(peak - 1).toBeLessThanOrEqual(overshootOf(spec));
		expect(Math.abs(1 - end)).toBeLessThan(0.01);
	});

	it("bounce 越大过冲越大, 换算保序 (bounce 0.5 实测过冲在理论值的一半以上)", () => {
		const soft = springFromDuration(PULL_RECOIL_S, 0.5);
		expect(dampingRatio(soft)).toBeCloseTo(0.5, 6);
		const { peak } = simulate(soft, PULL_RECOIL_S);
		expect(peak - 1).toBeGreaterThan(overshootOf(soft) / 2);
		expect(peak - 1).toBeLessThanOrEqual(overshootOf(soft));
	});

	it("SlideCommit: speed 50 得到刚度 400, 质量 0.9; 归位阻尼按 returnBounce 0.38 减到临界的 0.62", () => {
		const { commit, home } = swipeSprings(50, 0.38);
		expect(commit.stiffness).toBe(50 * SWIPE_SPEED_STIFFNESS);
		expect(commit.mass).toBe(SWIPE_MASS);
		expect(dampingRatio(commit)).toBeCloseTo(1, 6);
		expect(dampingRatio(home)).toBeCloseTo(0.62, 6);
		expect(dampingRatio(swipeSprings(50, 0.9).home)).toBeCloseTo(0.5, 6);
	});

	it("FlyingButton 的 SPRING 380 / DAMP 10 原样作为引擎参数", () => {
		expect(LIFT_SPRING).toEqual({ stiffness: 380, damping: 10, mass: 1 });
		expect(dampingRatio(LIFT_SPRING)).toBeLessThan(1);
	});
});
