/**
 * choice 族的弹簧换算与驱动: "时长 + bounce" 换成 stiffness/damping/mass 后过冲与落定时长保持原意, 换目标保留速度.
 */
import { describe, expect, it } from "vitest";
import { stepSpring, type SpringSpec } from "@src/craft/spring";
import { overshootOf, SpringDriver, springFromBounce, springFromDuration, stepExact } from "@src/controls/choice/physics";
import { manualFrames } from "./support";

/** 60fps 一帧. */
const STEP_MS = 16;
type Stepper = typeof stepExact;

function simulate(spec: SpringSpec, stepper: Stepper = stepExact): { peak: number; settleS: number } {
	let x = 0;
	let v = 0;
	let peak = 0;
	let settled = 0;
	for (let t = STEP_MS; t <= 3000; t += STEP_MS) {
		const step = stepper(x, v, 1, spec, STEP_MS);
		x = step.current;
		v = step.velocity;
		peak = Math.max(peak, x);
		if (Math.abs(1 - x) > 0.01) settled = t;
	}
	return { peak, settleS: settled / 1000 };
}

describe("springFromDuration", () => {
	it("bounce 0 是临界阻尼, 不过冲, 在规格时长附近落到 1% 内", () => {
		const spec = springFromDuration(0.3, 0);
		expect(spec.damping).toBeCloseTo(2 * Math.sqrt(spec.stiffness * spec.mass), 6);
		const run = simulate(spec);
		expect(run.peak).toBeLessThanOrEqual(1.0005);
		expect(run.settleS).toBeGreaterThan(0.3 * 0.5);
		expect(run.settleS).toBeLessThan(0.3 * 1.1);
	});

	it("bounce 0.2 的过冲等于阻尼比 0.8 的理论值, 质量不改变过冲", () => {
		const spec = springFromDuration(0.4, 0.2);
		const heavy = springFromDuration(0.4, 0.2, 0.6);
		expect(overshootOf(spec)).toBeCloseTo(Math.exp((-Math.PI * 0.8) / 0.6), 6);
		expect(overshootOf(heavy)).toBeCloseTo(overshootOf(spec), 6);
		const run = simulate(spec);
		expect(run.peak - 1).toBeGreaterThan(overshootOf(spec) * 0.9);
		expect(run.peak - 1).toBeLessThan(overshootOf(spec) * 1.1);
		expect(run.settleS).toBeLessThan(0.4 * 1.1);
	});

	it("ENGINE-GAP 佐证: craft stepSpring 在 16ms 帧长下吃掉这根弹簧的过冲", () => {
		const spec = springFromDuration(0.4, 0.2);
		expect(simulate(spec, stepSpring).peak - 1).toBeLessThan(overshootOf(spec) * 0.2);
	});

	it("时长越短刚度越大", () => {
		expect(springFromDuration(0.16, 0).stiffness).toBeGreaterThan(springFromDuration(0.3, 0).stiffness);
	});
});

describe("springFromBounce", () => {
	it("阻尼 = 2 sqrt(k m) (1 - bounce)", () => {
		const spec = springFromBounce(580, 0.9, 0.2);
		expect(spec.damping).toBeCloseTo(2 * Math.sqrt(580 * 0.9) * 0.8, 6);
	});
});

describe("SpringDriver", () => {
	it("中途换目标时保留位置与速度, 不跳回起点", () => {
		const frames = manualFrames();
		const seen: number[] = [];
		const driver = new SpringDriver(0, (v) => seen.push(v));
		const spec = springFromDuration(0.3, 0);
		driver.to(100, spec);
		frames.flush(6);
		const mid = driver.value;
		const velocity = driver.velocity;
		expect(mid).toBeGreaterThan(0);
		expect(velocity).toBeGreaterThan(0);
		driver.to(0, spec);
		expect(driver.velocity).toBe(velocity);
		expect(driver.value).toBe(mid);
		frames.flush(1);
		expect(driver.value).toBeGreaterThan(mid * 0.5);
		frames.flush(200);
		expect(driver.value).toBe(0);
		expect(driver.moving).toBe(false);
	});

	it("jump 直接落值并停表", () => {
		const frames = manualFrames();
		const driver = new SpringDriver(0, () => {});
		driver.to(50, springFromDuration(0.3, 0));
		frames.flush(2);
		driver.jump(10);
		expect(driver.value).toBe(10);
		expect(driver.velocity).toBe(0);
		expect(driver.moving).toBe(false);
	});
});
