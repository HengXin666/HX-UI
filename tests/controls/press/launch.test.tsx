/**
 * launch 子族: PullSend (SlingButton), Liftoff (FlyingButton). 常数, 手势换算, 回调与减弱动效分支.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	PULL_CANCEL,
	PULL_DEFAULTS,
	PULL_DOT_MS,
	PULL_DOT_SPREAD,
	PULL_FINGER_MAX,
	PULL_GAP,
	PULL_HAND_MAX,
	PULL_ICON_MS,
	PULL_POWER_CAP,
	PULL_SAMPLE_MS,
	PULL_SLOP,
	PullSend,
	constrainPull,
	launchPower,
	releaseVelocity,
} from "@src/controls/press/launch/PullSend";
import { LIFT_DEFAULTS, LIFT_FLIP_S, LIFT_MAX_JETS, LIFT_POD_H, LIFT_TILT_MAX, Liftoff, jetSlots, liftTilt } from "@src/controls/press/launch/Liftoff";
import { mockReducedMotion, useFakeClock } from "./helpers";

afterEach(() => {
	vi.useRealTimers();
});

describe("PullSend", () => {
	it("规格常数逐项落地", () => {
		expect([PULL_GAP, PULL_FINGER_MAX, PULL_HAND_MAX, PULL_CANCEL, PULL_POWER_CAP, PULL_DOT_MS, PULL_ICON_MS, PULL_SAMPLE_MS]).toEqual([4, 3000, 6000, 0.5, 1.5, 300, 360, 50]);
		expect(PULL_SLOP).toEqual({ fine: 4, coarse: 8 });
		expect(PULL_DOT_SPREAD).toEqual({ min: 0.7, delayMs: 70 });
		expect(PULL_DEFAULTS).toEqual({ size: 56, armAt: 48, maxPull: 160, launchSpeed: 2600, recoil: 0.2, flight: 120, particles: 14, spread: 60 });
	});

	it("松手速度: 50ms 取样窗, 手指钳 3000, 鼠标钳 6000", () => {
		const a = { x: 0, y: 0, t: 0 };
		const b = { x: 100, y: 0, t: 10 };
		expect(releaseVelocity(a, b, 20, "fine").x).toBeCloseTo(6000, 6);
		expect(releaseVelocity(a, b, 20, "coarse").x).toBeCloseTo(3000, 6);
		expect(releaseVelocity(a, { x: 10, y: 0, t: 10 }, 20, "fine").x).toBeCloseTo(1000, 6);
		expect(releaseVelocity(a, b, 10 + PULL_SAMPLE_MS, "fine")).toEqual({ x: 0, y: 0 });
	});

	it("拉动按轴裁剪并钳到 maxPull; 力度封顶 1.5", () => {
		expect(constrainPull(30, 40, "x", 160)).toEqual({ x: 30, y: 0 });
		const far = constrainPull(300, 400, "any", 160);
		expect(Math.hypot(far.x, far.y)).toBeCloseTo(160, 6);
		expect(launchPower(160, 160, 99999, 2600)).toBe(PULL_POWER_CAP);
		expect(launchPower(80, 160, 1300, 2600)).toBeCloseTo(1, 6);
	});

	it("轻点与键盘都发送, 力度 1", () => {
		const onSend = vi.fn();
		render(<PullSend onSend={onSend} />);
		const button = screen.getByRole("button", { name: "Send" });
		expect(button).toHaveAttribute("type", "button");
		fireEvent.pointerDown(button, { button: 0, clientX: 0, clientY: 0 });
		fireEvent.pointerUp(button);
		expect(onSend).toHaveBeenLastCalledWith(1);
		fireEvent.click(button, { detail: 0 });
		expect(onSend).toHaveBeenCalledTimes(2);
	});

	it("拉过 armAt 上膛, 松手发射; 不足 armAt 只回弹", () => {
		useFakeClock();
		const onSend = vi.fn();
		render(<PullSend onSend={onSend} tapSends={false} />);
		const button = screen.getByRole("button");
		fireEvent.pointerDown(button, { button: 0, clientX: 0, clientY: 0 });
		fireEvent.pointerMove(button, { clientX: 0, clientY: 30 });
		expect(button).not.toHaveAttribute("data-armed");
		fireEvent.pointerUp(button);
		expect(onSend).not.toHaveBeenCalled();
		act(() => vi.advanceTimersByTime(1000));
		fireEvent.pointerDown(button, { button: 0, clientX: 0, clientY: 0 });
		fireEvent.pointerMove(button, { clientX: 0, clientY: 80 });
		expect(button).toHaveAttribute("data-armed");
		fireEvent.pointerUp(button);
		expect(onSend).toHaveBeenCalledTimes(1);
		expect(onSend.mock.calls[0][0]).toBeGreaterThan(0);
	});

	it("减弱动效: 松手后垫子直接归位", () => {
		const restore = mockReducedMotion(true);
		render(<PullSend tapSends={false} />);
		const button = screen.getByRole("button");
		fireEvent.pointerDown(button, { button: 0, clientX: 0, clientY: 0 });
		fireEvent.pointerMove(button, { clientX: 0, clientY: 80 });
		fireEvent.pointerUp(button);
		expect(button.style.transform).toBe("translate(0px, 0px)");
		restore();
	});
});

describe("Liftoff", () => {
	it("规格常数逐项落地", () => {
		expect([LIFT_POD_H, LIFT_MAX_JETS, LIFT_TILT_MAX, LIFT_FLIP_S]).toEqual([5, 4, 0.55, 0.42]);
		expect(LIFT_DEFAULTS).toEqual({ altitude: 170, hoverTime: 2.4, jets: 2, wobble: 1 });
		expect(jetSlots(9)).toHaveLength(LIFT_MAX_JETS);
		expect(jetSlots(2)[0]).toBeCloseTo(100 / 3, 6);
		expect(liftTilt(1000, 0, 100)).toBe(LIFT_TILT_MAX);
		expect(liftTilt(50, 0, 100)).toBe(0);
	});

	it("悬停升空, hoverTime 后自动降落; 点击回调", () => {
		useFakeClock();
		const onClick = vi.fn();
		render(<Liftoff onClick={onClick} hoverTime={1} />);
		const button = screen.getByRole("button", { name: "Take off" });
		fireEvent.pointerEnter(button);
		expect(button).toHaveAttribute("data-airborne");
		act(() => vi.advanceTimersByTime(1100));
		expect(button).not.toHaveAttribute("data-airborne");
		fireEvent.click(button);
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it("减弱动效: 不升空", () => {
		const restore = mockReducedMotion(true);
		render(<Liftoff />);
		const button = screen.getByRole("button");
		fireEvent.pointerEnter(button);
		expect(button).not.toHaveAttribute("data-airborne");
		restore();
	});
});
