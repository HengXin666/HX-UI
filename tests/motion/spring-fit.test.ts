/**
 * src/motion/spring/fit 的换算: 各族原参数下与并入前的实现逐值一致 (fixtures/legacy-springs.json 是并入前的输出),
 * 并保留原意: 过冲由 bounce 决定, 在给定时长内落定.
 */
import { describe, expect, it } from "vitest";
import { stepSpring, type SpringSpec } from "@src/craft/spring";
import { CHOICE_FIT } from "@src/controls/choice/tone";
import { COMPOSE_FIT, MS_PER_S } from "@src/controls/compose/tokens";
import { RANGE_BOUNCE_RANGE, RANGE_FIT } from "@src/controls/range/tokens";
import {
	dampingRatio,
	overshootOf,
	settleRoot,
	springFromDuration,
	springFromOmega,
	springFromStiffness,
	springFromVisualDuration,
} from "@src/motion";
import legacy from "./fixtures/legacy-springs.json";

type Fit = (durationS: number, bounce: number) => SpringSpec;
type Triple = readonly number[];

/** 与并入前实现的相对误差上限. 公式重排只带来末位舍入差. */
const REL = 1e-9;
const PRESS_SIM_DT_MS = 8;

const FAMILIES: Record<keyof typeof legacy.duration, Fit> = {
	press: (d, b) => springFromDuration(d, b),
	range: (d, b) => springFromDuration(d, b, RANGE_FIT),
	compose: (d, b) => springFromDuration((d * MS_PER_S) / MS_PER_S, b, COMPOSE_FIT),
	choice: (d, b) => springFromDuration(d, b, CHOICE_FIT),
	dismiss: (d, b) => springFromVisualDuration(d, b),
};

function expectSame(actual: SpringSpec, expected: Triple, label: string): void {
	const [k, c, m] = expected;
	expect(Math.abs(actual.stiffness / k - 1), label).toBeLessThan(REL);
	expect(Math.abs(actual.damping / c - 1), label).toBeLessThan(REL);
	expect(actual.mass, label).toBe(m);
}

/** 从 0 弹到 1, 返回峰值与末值. */
function simulate(spec: SpringSpec, seconds: number, dtMs = PRESS_SIM_DT_MS): { peak: number; end: number } {
	let x = 0;
	let v = 0;
	let peak = 0;
	for (let t = 0; t < seconds * MS_PER_S; t += dtMs) {
		const s = stepSpring(x, v, 1, spec, dtMs);
		x = s.current;
		v = s.velocity;
		peak = Math.max(peak, x);
	}
	return { peak, end: x };
}

describe("各族原参数逐值锁定", () => {
	for (const [family, fit] of Object.entries(FAMILIES) as Array<[keyof typeof legacy.duration, Fit]>) {
		it(`${family}: 时长 x bounce 网格与并入前一致`, () => {
			const table = legacy.duration[family] as Record<string, Triple>;
			expect(Object.keys(table).length).toBeGreaterThan(0);
			for (const [key, expected] of Object.entries(table)) {
				const [d, b] = key.split(" ").map(Number);
				expectSame(fit(d, b), expected, `${family} ${key}`);
			}
		});
	}

	it("质量, 时长下限与另外三种写法与并入前一致", () => {
		const s = legacy.special as Record<string, Triple>;
		const mass = 0.6;
		const duration = 0.4;
		const bounce = 0.2;
		expectSame(springFromDuration(duration, bounce, { mass }), s["press m0.6"], "press mass");
		expectSame(springFromDuration(duration, bounce, { ...RANGE_FIT, mass }), s["range m0.6"], "range mass");
		expectSame(springFromDuration((duration * MS_PER_S) / MS_PER_S, bounce, { ...COMPOSE_FIT, mass }), s["compose m0.6"], "compose mass");
		expectSame(springFromDuration(duration, bounce, { ...CHOICE_FIT, mass }), s["choice m0.6"], "choice mass");
		expectSame(springFromDuration(0.5 / MS_PER_S, bounce, COMPOSE_FIT), s["compose 0.5ms"], "compose 下限 1ms");
		expectSame(springFromVisualDuration(0.01, bounce), s["dismiss 0.01"], "dismiss 下限 50ms");
		const rate = 8;
		const floorS = 0.1;
		expectSame(springFromOmega(rate / Math.max(floorS, 0.3)), s.settle, "趋近率");
		expectSame(springFromOmega(rate / Math.max(floorS, 0.05)), s["settle floor"], "趋近率下限");
		expectSame(springFromStiffness(400, 0.38, { mass: 0.9 }), s.damped, "press 阻尼系数");
		expectSame(springFromStiffness(625, 0.1, { bounceRange: RANGE_BOUNCE_RANGE }), s["stiff range"], "range 刚度");
		expectSame(springFromStiffness(625, 0.95, { mass: 0.5, bounceRange: RANGE_BOUNCE_RANGE }), s["stiff range hi"], "range 刚度钳制");
		expectSame(springFromStiffness(580, bounce, { mass: 0.9 }), s["stiff choice"], "choice 刚度");
	});
});

describe("springFromDuration 保留原意", () => {
	const recoilS = 0.4;
	const soft = 0.5;
	const lively = 0.2;

	it("临界阻尼的落定根是 9.23, 三种包络在 zeta = 1 时一致", () => {
		expect(settleRoot(1)).toBeCloseTo(9.23, 2);
		expect(settleRoot(1, "slope")).toBe(settleRoot(1));
		expect(settleRoot(1, "linear")).toBeCloseTo(settleRoot(1), 9);
	});

	it("bounce 0 是临界阻尼: 不过冲, 时长内落定", () => {
		const spec = springFromDuration(0.3, 0);
		expect(dampingRatio(spec)).toBeCloseTo(1, 6);
		expect(overshootOf(spec)).toBe(0);
		const { peak, end } = simulate(spec, 0.3);
		expect(peak).toBeLessThanOrEqual(1.001);
		expect(Math.abs(1 - end)).toBeLessThan(0.01);
	});

	it("bounce 0.2: 阻尼比 0.8, 理论过冲约 1.5%; 半隐式欧拉只会压低不会放大", () => {
		const spec = springFromDuration(recoilS, lively);
		expect(dampingRatio(spec)).toBeCloseTo(1 - lively, 6);
		expect(overshootOf(spec)).toBeCloseTo(Math.exp((-Math.PI * (1 - lively)) / Math.sqrt(1 - (1 - lively) ** 2)), 6);
		const { peak } = simulate(spec, recoilS);
		expect(peak - 1).toBeGreaterThan(0);
		expect(peak - 1).toBeLessThanOrEqual(overshootOf(spec));
	});

	it("bounce 越大过冲越大, 换算保序", () => {
		const spec = springFromDuration(recoilS, soft);
		expect(dampingRatio(spec)).toBeCloseTo(soft, 6);
		const { peak } = simulate(spec, recoilS);
		expect(peak - 1).toBeGreaterThan(overshootOf(spec) * soft);
		expect(overshootOf(spec)).toBeGreaterThan(overshootOf(springFromDuration(recoilS, lively)));
	});

	it("质量不改变过冲, 时长越短刚度越大", () => {
		const heavy = springFromDuration(recoilS, lively, { envelope: "linear", mass: 0.6 });
		expect(overshootOf(heavy)).toBeCloseTo(overshootOf(springFromDuration(recoilS, lively, { envelope: "linear" })), 6);
		expect(springFromDuration(0.16, 0).stiffness).toBeGreaterThan(springFromDuration(0.3, 0).stiffness);
	});

	it("阻尼比下限: bounce 再大也停得下来", () => {
		expect(dampingRatio(springFromDuration(recoilS, 2))).toBeCloseTo(0.05, 9);
		expect(dampingRatio(springFromDuration(recoilS, 2, RANGE_FIT))).toBeCloseTo(RANGE_FIT.minDampingRatio, 9);
	});
});

describe("其它写法", () => {
	it("刚度写法: damping = 2 sqrt(k m) (1 - bounce), 可钳 bounce", () => {
		expect(springFromStiffness(625, 0.1).damping).toBeCloseTo(2 * 25 * 0.9, 6);
		expect(springFromStiffness(580, 0.2, { mass: 0.9 }).damping).toBeCloseTo(2 * Math.sqrt(580 * 0.9) * 0.8, 6);
		expect(springFromStiffness(100, -1, { bounceRange: [0, 0.5] }).damping).toBeCloseTo(20, 9);
	});

	it("可感时长写法: omega = 2pi / (1.2 d), 原意过冲保留", () => {
		const spec = springFromVisualDuration(0.6, 0.2);
		expect(Math.sqrt(spec.stiffness)).toBeCloseTo((2 * Math.PI) / (0.6 * 1.2), 9);
		expect(dampingRatio(spec)).toBeCloseTo(0.8, 9);
	});

	it("固有频率写法: 默认临界阻尼, 阻尼比与质量可选", () => {
		const spec = springFromOmega(10);
		expect(spec).toEqual({ stiffness: 100, damping: 20, mass: 1 });
		expect(dampingRatio(springFromOmega(10, 1.25, 2))).toBeCloseTo(1.25, 9);
	});
});
