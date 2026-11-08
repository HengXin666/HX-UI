/**
 * src/motion/spring/step: 解析解积分器与并入前 choice / range 两份细步积分逐值一致, 帧长上限按参数走,
 * 以及它为什么存在 (craft stepSpring 在 16ms 帧长下吃掉刚弹簧的过冲).
 */
import { describe, expect, it } from "vitest";
import { stepSpring, type SpringSpec, type SpringStep } from "@src/craft/spring";
import { CHOICE_FIT } from "@src/controls/choice/tone";
import { RANGE_DT_CAP_MS } from "@src/controls/range/tokens";
import { exactStepper, overshootOf, springFromDuration, stepSpringExact, type SpringIntegrator } from "@src/motion";
import legacy from "./fixtures/legacy-springs.json";

/** 60fps 一帧. */
const STEP_MS = 16;
const LIMIT_MS = 3000;
const NEAR = 0.01;
const REL = 1e-9;
const MS_PER_S = 1000;
/** 并入前录制序列用的帧长: 两帧 60fps, 一帧掉帧, 一帧 120fps, 一帧切后台. */
const FRAMES = [STEP_MS, STEP_MS, 40, 8, 100];

function run(step: SpringIntegrator, spec: SpringSpec): number[] {
	let x = 0;
	let v = 0;
	const out: number[] = [];
	for (const dt of FRAMES) {
		const s: SpringStep = step(x, v, 1, spec, dt);
		x = s.current;
		v = s.velocity;
		out.push(x, v);
	}
	return out;
}

function simulate(spec: SpringSpec, step: SpringIntegrator): { peak: number; settleS: number } {
	let x = 0;
	let v = 0;
	let peak = 0;
	let settled = 0;
	for (let t = STEP_MS; t <= LIMIT_MS; t += STEP_MS) {
		const s = step(x, v, 1, spec, STEP_MS);
		x = s.current;
		v = s.velocity;
		peak = Math.max(peak, x);
		if (Math.abs(1 - x) > NEAR) settled = t;
	}
	return { peak, settleS: settled / MS_PER_S };
}

const LIVELY = springFromDuration(0.4, 0.2, CHOICE_FIT);

describe("stepSpringExact", () => {
	it("默认 34ms 上限: 与并入前 choice 的 stepExact 逐值一致", () => {
		const got = run(stepSpringExact, LIVELY);
		legacy.exact.choice.forEach((want, i) => expect(Math.abs(got[i] - want)).toBeLessThanOrEqual(Math.abs(want) * REL + REL));
	});

	it("50ms 上限: 与并入前 range 的 stepSpringFine 逐值一致", () => {
		const got = run(exactStepper(RANGE_DT_CAP_MS), LIVELY);
		legacy.exact.range.forEach((want, i) => expect(Math.abs(got[i] - want)).toBeLessThanOrEqual(Math.abs(want) * REL + REL));
	});

	it("帧长与结果无关: 一步 32ms 等于两步 16ms", () => {
		const one = stepSpringExact(0, 0, 1, LIVELY, STEP_MS * 2);
		const half = stepSpringExact(0, 0, 1, LIVELY, STEP_MS);
		const two = stepSpringExact(half.current, half.velocity, 1, LIVELY, STEP_MS);
		expect(one.current).toBeCloseTo(two.current, 10);
		expect(one.velocity).toBeCloseTo(two.velocity, 8);
	});

	it("过冲等于理论值, 在时长附近落到 1% 内; 临界与过阻尼不过冲", () => {
		const lively = simulate(LIVELY, stepSpringExact);
		expect(lively.peak - 1).toBeGreaterThan(overshootOf(LIVELY) * 0.9);
		expect(lively.peak - 1).toBeLessThan(overshootOf(LIVELY) * 1.1);
		expect(lively.settleS).toBeLessThan(0.44);
		const over = simulate({ stiffness: 100, damping: 40, mass: 1 }, stepSpringExact);
		expect(over.peak).toBeLessThanOrEqual(1);
		const critical = simulate({ stiffness: 100, damping: 20, mass: 1 }, stepSpringExact);
		expect(critical.peak).toBeLessThanOrEqual(1);
	});

	it("ENGINE-GAP 佐证: craft stepSpring 在 16ms 帧长下吃掉这根弹簧的过冲", () => {
		expect(simulate(LIVELY, stepSpring).peak - 1).toBeLessThan(overshootOf(LIVELY) * 0.2);
	});

	it("落定后吸到目标, 速度清零", () => {
		const s = stepSpringExact(1 + 1e-5, 0, 1, LIVELY, LIMIT_MS);
		expect(s).toEqual({ current: 1, velocity: 0, resting: true });
	});
});
