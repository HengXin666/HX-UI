import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { stepSpring } from "../../../src/craft/spring";
import { CrushSheet } from "../../../src/controls/dismiss/discard/CrushSheet";
import {
	creaseWeight,
	crushLighting,
	cutStrips,
	feedArmed,
	fallStep,
	ripAngle,
	ripTorn,
	stackDelay,
	tugAfter,
} from "../../../src/controls/dismiss/discard/discard-math";
import { RipStub } from "../../../src/controls/dismiss/discard/RipStub";
import { ShredBin } from "../../../src/controls/dismiss/discard/ShredBin";
import { overshootOf, springFromOmega } from "../../../src/motion";

/** dismiss 族的趋近率写法: omega = rate / max(floorS, durationS), 临界阻尼. */
const springFromSettle = (durationS: number, rate: number, floorS: number) => springFromOmega(rate / Math.max(floorS, durationS));
import { CRUSH, RIP, SHRED } from "../../../src/controls/dismiss/tokens";
import { setReducedMotion, simulate } from "./reduced";

afterEach(() => setReducedMotion(false));

describe("ShredBin math", () => {
	it("arms after ENTER and only disarms back above ENTER - HYSTERESIS", () => {
		expect(feedArmed(SHRED.enter, false)).toBe(false);
		expect(feedArmed(SHRED.enter + 1, false)).toBe(true);
		expect(feedArmed(SHRED.enter - SHRED.hysteresis + 1, true)).toBe(true);
		expect(feedArmed(SHRED.enter - SHRED.hysteresis, true)).toBe(false);
	});

	it("cuts strips at stripWidth, staggers the stack by STAGGER, kicks TUG per bite", () => {
		expect(cutStrips(100, SHRED.stripWidth)).toHaveLength(10);
		expect(cutStrips(10000, 1)).toHaveLength(SHRED.maxStrips);
		expect(stackDelay(0, 3)).toBeCloseTo(2 * SHRED.stagger, 9);
		expect(stackDelay(0, -1)).toBe(0);
		expect(tugAfter(17, 19, SHRED.bite, 0, 0)).toBe(SHRED.tug);
		expect(tugAfter(1, 2, SHRED.bite, 0, 0)).toBe(0);
	});
});

describe("ShredBin", () => {
	it("shreds with Delete and reorders with Alt+Arrow; reduced motion reports at once", () => {
		setReducedMotion(true);
		const onShred = vi.fn();
		const onReorder = vi.fn();
		const items = [{ id: "a" }, { id: "b" }];
		render(<ShredBin items={items} renderItem={(item) => <span>{item.id}</span>} onShred={onShred} onReorder={onReorder} />);
		const rows = screen.getAllByRole("listitem");
		fireEvent.keyDown(rows[0], { key: "ArrowDown", altKey: true });
		expect(onReorder).toHaveBeenCalledWith([{ id: "b" }, { id: "a" }]);
		fireEvent.keyDown(screen.getAllByRole("listitem")[0], { key: "Delete" });
		expect(onShred).toHaveBeenCalledWith({ id: "b" });
		expect(screen.getAllByRole("listitem")).toHaveLength(1);
	});
});

describe("CrushSheet", () => {
	it("maps omega = 8 / duration to a critically damped engine spring", () => {
		const spec = springFromSettle(CRUSH.crumpleDuration, CRUSH.settleRate, CRUSH.settleFloorS);
		const omega = 8 / 0.55;
		expect(spec.stiffness).toBeCloseTo(omega * omega, 6);
		expect(spec.damping).toBeCloseTo(2 * omega, 6);
		expect(overshootOf(spec)).toBe(0);
		const floor = springFromSettle(0.01, CRUSH.settleRate, CRUSH.settleFloorS);
		expect(floor.stiffness).toBeCloseTo((8 / 0.06) ** 2, 6);
		const run = simulate((c, v, dt) => stepSpring(c, v, 1, spec, dt), 0);
		expect(run.peak).toBeLessThanOrEqual(1);
	});

	it("keeps the crease and lighting smoothstep edges", () => {
		expect(creaseWeight(0.98, 0.6)).toBe(1);
		expect(creaseWeight(0.88 - 0.4 * 0.18, 0.6)).toBe(0);
		expect(crushLighting(0.4, 0)).toBe(1);
		expect(crushLighting(0, 0)).toBe(0);
	});

	it("crumples on keyboard hold and restores on release", () => {
		setReducedMotion(true);
		const onCrumpleChange = vi.fn();
		render(<CrushSheet src="data:," alt="Draft" onCrumpleChange={onCrumpleChange} />);
		const sheet = screen.getByRole("button", { name: "Draft" });
		fireEvent.keyDown(sheet, { key: " " });
		expect(sheet).toHaveAttribute("aria-pressed", "true");
		fireEvent.keyUp(sheet, { key: " " });
		expect(sheet).toHaveAttribute("aria-pressed", "false");
		expect(onCrumpleChange.mock.calls).toEqual([[true], [false]]);
	});
});

describe("RipStub", () => {
	it("tears only past stretch after resistance and clamps the angle to tearAngle", () => {
		expect(ripTorn(RIP.stretch / RIP.resistance - 0.01, RIP.resistance, RIP.stretch)).toBe(false);
		expect(ripTorn(RIP.stretch / RIP.resistance + 1, RIP.resistance, RIP.stretch)).toBe(true);
		expect(Math.abs(ripAngle(1, 500, RIP.tearAngle, false))).toBe(RIP.tearAngle);
		const body = { x: 0, y: 0, vx: 0, vy: 0, theta: 0, thetaV: 0 };
		fallStep(body, 0.02);
		expect(body.vy).toBeCloseTo(RIP.gravity * 0.02, 6);
		fallStep(body, 1);
		expect(body.vy).toBeCloseTo(RIP.gravity * (0.02 + RIP.maxDtS), 6);
	});

	it("tears from the keyboard and reports once", () => {
		setReducedMotion(true);
		const onTear = vi.fn();
		render(<RipStub stub="Admit one" onTear={onTear} />);
		fireEvent.click(screen.getByRole("button", { name: "Tear off stub" }));
		expect(onTear).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole("button", { name: "Tear off stub" })).toBeNull();
	});
});
