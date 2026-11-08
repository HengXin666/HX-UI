/**
 * range 族共用数学: 时长 / bounce 到 stiffness / damping / mass 的换算保留过冲与时长, 指数跟随, 松手速度.
 */
import { describe, expect, it } from "vitest";
import { pushSample, snap, velocityOf, type MotionSample } from "@src/controls/range/math";
import { CRITICAL_SETTLE, RANGE_BOUNCE_RANGE, RANGE_FIT } from "@src/controls/range/tokens";
import { approach as expFollow, overshootOf, settleRoot, springFromDuration as fitDuration, springFromStiffness as fitStiffness } from "@src/motion";
import { simulate } from "./helpers";

/** range 族在 src/motion 上的写法: 时长换算带 RANGE_FIT, 刚度写法钳 bounce. */
const springFromDuration = (durationS: number, bounce: number, mass = 1) => fitDuration(durationS, bounce, { ...RANGE_FIT, mass });
const springFromStiffness = (stiffness: number, bounce: number, mass = 1) => fitStiffness(stiffness, bounce, { mass, bounceRange: RANGE_BOUNCE_RANGE });

describe("springFromDuration", () => {
	it("临界阻尼的落定根就是规格的 9.23", () => {
		expect(settleRoot(1)).toBeCloseTo(CRITICAL_SETTLE, 2);
	});

	it("duration 0.3 / bounce 0: 不过冲, 约 0.3s 落到 1% 内", () => {
		const spring = springFromDuration(0.3, 0);
		expect(spring.mass).toBe(1);
		expect(spring.stiffness / (CRITICAL_SETTLE / 0.3) ** 2).toBeCloseTo(1, 2);
		expect(spring.damping / ((2 * CRITICAL_SETTLE) / 0.3)).toBeCloseTo(1, 2);
		const run = simulate(spring);
		expect(run.peak).toBeLessThanOrEqual(1.001);
		expect(run.settleMs).toBeLessThanOrEqual(320);
		expect(run.settleMs).toBeGreaterThan(120);
	});

	it("bounce 0.2: 阻尼比 0.8, 理论过冲约 1.5%, 模拟一致", () => {
		const spring = springFromDuration(0.35, 0.2);
		expect(overshootOf(spring)).toBeCloseTo(Math.exp((-Math.PI * 0.8) / 0.6), 4);
		const run = simulate(spring);
		expect(run.peak - 1).toBeCloseTo(overshootOf(spring), 3);
	});

	it("刻度盘写法: damping = 临界 * (1 - bounce)", () => {
		const spring = springFromStiffness(625, 0.1);
		expect(spring.damping).toBeCloseTo(2 * 25 * 0.9, 6);
	});
});

describe("helpers", () => {
	it("expFollow 与帧率无关: 一步 32ms 等于两步 16ms", () => {
		const one = expFollow(0, 1, 0.032, 0.06);
		const two = expFollow(expFollow(0, 1, 0.016, 0.06), 1, 0.016, 0.06);
		expect(one).toBeCloseTo(two, 10);
	});

	it("snap 吸附到步长并钳进区间", () => {
		expect(snap(12.34, 0, 100, 0.1)).toBe(12.3);
		expect(snap(-5, 0, 100, 1)).toBe(0);
		expect(snap(101, 0, 100, 5)).toBe(100);
	});

	it("velocityOf: 手停住超过 staleMs 后速度为 0", () => {
		let h: MotionSample[] = [];
		h = pushSample(h, { t: 0, v: 0 }, 100);
		h = pushSample(h, { t: 50, v: 10 }, 100);
		expect(velocityOf(h, 50, 80)).toBeCloseTo(200, 6);
		expect(velocityOf(h, 200, 80)).toBe(0);
	});
});
