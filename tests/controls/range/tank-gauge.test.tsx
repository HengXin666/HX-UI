/**
 * TankGauge: 规格常数, 子步模拟停得住且倾角不超过上限, 只读 meter 与可交互 slider 的语义, 减弱动效下液面不倾斜.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TankGauge } from "@src/controls/range/meter/TankGauge";
import {
	TANK_BAND,
	TANK_BIG,
	TANK_DT_MAX,
	TANK_REST_POS,
	TANK_REST_VEL,
	TANK_STEP,
	TANK_TILT_GAIN,
	TANK_TILT_MAX,
	stepTank,
	surfacePath,
	type TankState,
} from "@src/controls/range/meter/tank-sim";
import { mockReducedMotion } from "./helpers";

describe("tank-sim", () => {
	it("落地规格常数", () => {
		expect([TANK_DT_MAX, TANK_TILT_GAIN, TANK_TILT_MAX, TANK_REST_POS, TANK_REST_VEL]).toEqual([0.05, 0.07, 30, 0.05, 2]);
		expect([TANK_STEP, TANK_BIG, TANK_BAND]).toEqual([2, 10, 10]);
	});

	it("从 0 到 60: 液面先倾斜, 倾角不超过 TILT_MAX, 最终停在 60", () => {
		const s: TankState = { level: 0, levelV: 0, tilt: 0, tiltV: 0 };
		let peak = 0;
		let rest = false;
		for (let i = 0; i < 600 && !rest; i += 1) {
			rest = stepTank(s, 60, 1 / 60, { viscosity: 0.15, tilt: 0.45, height: 180 });
			peak = Math.max(peak, Math.abs(s.tilt));
		}
		expect(peak).toBeGreaterThan(5);
		expect(peak).toBeLessThanOrEqual(TANK_TILT_MAX);
		expect(rest).toBe(true);
		expect(s.level).toBe(60);
	});

	it("一帧 1 秒也只推进 DT_MAX", () => {
		const a: TankState = { level: 0, levelV: 0, tilt: 0, tiltV: 0 };
		const b: TankState = { level: 0, levelV: 0, tilt: 0, tiltV: 0 };
		stepTank(a, 100, 1, { viscosity: 0.15, tilt: 0.45, height: 180 });
		stepTank(b, 100, TANK_DT_MAX, { viscosity: 0.15, tilt: 0.45, height: 180 });
		expect(a.level).toBeCloseTo(b.level, 10);
	});
});

describe("TankGauge", () => {
	it("默认只读: role=meter", () => {
		render(<TankGauge defaultValue={40} />);
		expect(screen.getByRole("meter", { name: "Level" })).toHaveAttribute("aria-valuenow", "40");
	});

	it("interactive: 方向键一步 2, PageUp 一步 10", () => {
		const onChange = vi.fn();
		render(<TankGauge interactive defaultValue={40} onChange={onChange} />);
		const slider = screen.getByRole("slider");
		fireEvent.keyDown(slider, { key: "ArrowUp" });
		expect(onChange).toHaveBeenLastCalledWith(42);
		fireEvent.keyDown(slider, { key: "PageUp" });
		expect(onChange).toHaveBeenLastCalledWith(52);
	});

	it("减弱动效: 改值后液面是水平直线, 直接到新液位", async () => {
		mockReducedMotion(true);
		const { container } = render(<TankGauge interactive defaultValue={50} width={80} height={100} />);
		await act(async () => {});
		await act(async () => {
			fireEvent.keyDown(screen.getByRole("slider"), { key: "End" });
		});
		const d = container.querySelector("path")?.getAttribute("d");
		expect(d).toBe(surfacePath(80, 100, { level: 100, levelV: 0, tilt: 0, tiltV: 0 }, 0.42));
	});
});
